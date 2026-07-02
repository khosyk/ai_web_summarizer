import {
	buildLeanPrompt,
	buildSystemInstructionForLang,
	langTag,
} from "./summaryPrompt";
import { pickSummaryDisplayTitle } from "./summaryParse";
import type { ServiceLang } from "./privacyNotice";
import {
	applyTokenDiet,
	articleLocaleFromServiceLang,
} from "./articleTokenDiet";
import {
	GEMINI_SUMMARY_RESPONSE_SCHEMA,
	parseStructuredSummary,
} from "./summaryStructured";
import {
	WebSummaryError,
	webSummaryErrorFromGeminiResponse,
} from "./userFacingError";

export const MAX_INPUT_CHARS = 8000;
export const MAX_OUTPUT_TOKENS = 384;
const SUMMARY_PARSE_MAX_ATTEMPTS = 3;

type GeminiPart = { text?: string };

function extractGeminiText(data: Record<string, unknown>): string {
	const candidates = data.candidates as
		| Array<{
				content?: { parts?: GeminiPart[] };
				finishReason?: string;
		  }>
		| undefined;
	const first = candidates?.[0];
	if (!first?.content?.parts?.length) return "";

	return first.content.parts
		.map((p) => (typeof p.text === "string" ? p.text : ""))
		.join("")
		.trim();
}

function sleepMs(ms: number, signal?: AbortSignal) {
	return new Promise<void>((resolve, reject) => {
		if (signal?.aborted) {
			reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
			return;
		}
		const timer = window.setTimeout(() => resolve(), ms);
		signal?.addEventListener(
			"abort",
			() => {
				window.clearTimeout(timer);
				reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
			},
			{ once: true },
		);
	});
}

function throwIfAborted(signal?: AbortSignal) {
	if (signal?.aborted) {
		throw signal.reason ?? new DOMException("Aborted", "AbortError");
	}
}

function parseRetryAfterMs(message: string): number | null {
	const m = message.match(/retry in ([\d.]+)\s*s/i);
	if (!m) return null;
	const sec = Number.parseFloat(m[1]);
	if (!Number.isFinite(sec) || sec < 0) return null;
	return Math.min(Math.ceil(sec * 1000) + 750, 120_000);
}

const GEMINI_REST = "https://generativelanguage.googleapis.com/v1beta/models";

export const GEMINI_MODEL = "gemini-2.5-flash-lite";
export const GEMINI_MODEL_FALLBACK = "gemini-2.5-flash";

const PRIMARY_MAX_ATTEMPTS = 3;
const FALLBACK_MAX_ATTEMPTS = 2;

type GeminiErrBody = {
	message?: string;
	code?: number;
	status?: string;
};

/** lite 실패 시 flash fallback — E11·E10 제외 */
function isFallbackEligible(error: WebSummaryError): boolean {
	if (error.code === "E11" || error.code === "E10") return false;
	if (error.code === "E12") return true;
	if (error.code === "E13") {
		const detail = error.message.toLowerCase();
		return /high demand|unavailable|overloaded|try again later|503|temporarily/i.test(
			detail,
		);
	}
	return false;
}

async function generateWithModel(
	model: string,
	opts: {
		apiKey: string;
		systemInstruction: string;
		userPrompt: string;
		maxOutputTokens: number;
		signal?: AbortSignal;
	},
	maxAttempts: number,
): Promise<{ text: string; model: string }> {
	const { apiKey, systemInstruction, userPrompt, maxOutputTokens, signal } =
		opts;
	let lastError: WebSummaryError | undefined;
	const url = `${GEMINI_REST}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		throwIfAborted(signal);
		try {
			const res = await fetch(url, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				signal,
				body: JSON.stringify({
					systemInstruction: {
						parts: [{ text: systemInstruction }],
					},
					contents: [
						{
							role: "user",
							parts: [{ text: userPrompt }],
						},
					],
					generationConfig: {
						maxOutputTokens,
						temperature: 0.35,
						responseMimeType: "application/json",
						responseSchema: GEMINI_SUMMARY_RESPONSE_SCHEMA,
					},
				}),
			});

			const data = (await res.json()) as Record<string, unknown>;

			const errObj = data?.error as GeminiErrBody | undefined;

			if (!res.ok || errObj?.message) {
				const msg = errObj?.message ?? `HTTP ${res.status}`;
				lastError = webSummaryErrorFromGeminiResponse(
					res.status,
					errObj,
					msg,
				);

				if (lastError.code === "E12") {
					const wait = parseRetryAfterMs(msg);
					if (wait != null && attempt < maxAttempts - 1) {
						await sleepMs(wait, signal);
						continue;
					}
				}
				break;
			}

			const text = extractGeminiText(data);
			if (text) {
				return { text, model };
			}

			const reason = (
				data?.candidates as Array<{ finishReason?: string }>
			)?.[0]?.finishReason;
			lastError = new WebSummaryError(
				"E13",
				reason ? `empty_candidate:${reason}` : "empty_response",
			);
			break;
		} catch (e: unknown) {
			if (
				signal?.aborted ||
				(e instanceof DOMException && e.name === "AbortError")
			) {
				throw e instanceof Error
					? e
					: new DOMException("Aborted", "AbortError");
			}
			lastError = new WebSummaryError(
				"E13",
				e instanceof Error ? e.message : String(e),
			);
			break;
		}
	}

	throw lastError ?? new WebSummaryError("E13", "request_failed");
}

export async function summarizeWithGemini(opts: {
	apiKey: string;
	systemInstruction: string;
	userPrompt: string;
	maxOutputTokens: number;
	signal?: AbortSignal;
}): Promise<{ text: string; model: string }> {
	try {
		return await generateWithModel(
			GEMINI_MODEL,
			opts,
			PRIMARY_MAX_ATTEMPTS,
		);
	} catch (error) {
		if (error instanceof WebSummaryError && isFallbackEligible(error)) {
			return generateWithModel(
				GEMINI_MODEL_FALLBACK,
				opts,
				FALLBACK_MAX_ATTEMPTS,
			);
		}
		throw error;
	}
}

function normalizeIncomingArticle(text: string): string {
	return text
		.replace(/\r\n/g, "\n")
		.replace(/[ \t]+/g, " ")
		.replace(/\n[ \t]+/g, "\n")
		.replace(/[ \t]+\n/g, "\n")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}

export type SummaryResult = {
	readRecommendation: "read" | "skip";
	readReason: string;
	title: string;
	briefLines: string[];
	stats: {
		originalLength: number;
		model: string;
		sentToModelChars: number;
		approxInputTokensHint: number;
		maxOutputTokensCap: number;
		source: "extension";
		dietWasCompressed: boolean;
	};
};

/** 탭에서 추출한 본문을 Gemini로 요약 */
export async function summarizeArticle(input: {
	apiKey: string;
	language: ServiceLang;
	articleTitle?: string;
	articleText: string;
	signal?: AbortSignal;
}): Promise<SummaryResult> {
	const { apiKey, language, articleTitle, articleText, signal } = input;
	const L = langTag(language);

	const normalized = normalizeIncomingArticle(articleText);
	const { text: dieted, stats: dietStats } = applyTokenDiet(normalized, {
		maxChars: MAX_INPUT_CHARS,
		locale: articleLocaleFromServiceLang(language),
	});
	const scrapedTitle = pickSummaryDisplayTitle(
		articleTitle?.trim() || "",
		language,
	);

	const userPrompt = buildLeanPrompt({
		language,
		title: scrapedTitle,
		content: dieted,
	});
	const systemInstruction = buildSystemInstructionForLang(L);

	let lastParseError: WebSummaryError | undefined;
	let model = "";

	for (let attempt = 0; attempt < SUMMARY_PARSE_MAX_ATTEMPTS; attempt++) {
		throwIfAborted(signal);
		const result = await summarizeWithGemini({
			apiKey,
			systemInstruction,
			userPrompt,
			maxOutputTokens: MAX_OUTPUT_TOKENS,
			signal,
		});
		model = result.model;

		try {
			const parsed = parseStructuredSummary(
				result.text,
				scrapedTitle,
				language,
			);

			return {
				...parsed,
				stats: {
					originalLength: articleText.length,
					model,
					sentToModelChars: dieted.length,
					approxInputTokensHint: Math.ceil(dieted.length / 4),
					maxOutputTokensCap: MAX_OUTPUT_TOKENS,
					source: "extension",
					dietWasCompressed: dietStats.afterSelect < dietStats.originalChars,
				},
			};
		} catch (err) {
			if (
				err instanceof WebSummaryError &&
				err.code === "E10" &&
				attempt < SUMMARY_PARSE_MAX_ATTEMPTS - 1
			) {
				lastParseError = err;
				await sleepMs(400, signal);
				continue;
			}
			throw err;
		}
	}

	throw lastParseError ?? new WebSummaryError("E10", "parse_retries_exhausted");
}
