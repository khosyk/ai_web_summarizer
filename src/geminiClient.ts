import {
	buildLeanPrompt,
	buildSystemInstructionForLang,
	langTag,
} from "./summaryPrompt";
import { pickSummaryDisplayTitle } from "./summaryParse";
import type { ServiceLang } from "./privacyNotice";
import {
	GEMINI_SUMMARY_RESPONSE_SCHEMA,
	parseStructuredSummary,
} from "./summaryStructured";
import {
	WebSummaryError,
	webSummaryErrorFromGeminiResponse,
} from "./userFacingError";

export const MAX_INPUT_CHARS = 8000;
export const MAX_OUTPUT_TOKENS = 1024;
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

function sleepMs(ms: number) {
	return new Promise<void>((r) => setTimeout(r, ms));
}

function parseRetryAfterMs(message: string): number | null {
	const m = message.match(/retry in ([\d.]+)\s*s/i);
	if (!m) return null;
	const sec = Number.parseFloat(m[1]);
	if (!Number.isFinite(sec) || sec < 0) return null;
	return Math.min(Math.ceil(sec * 1000) + 750, 120_000);
}

const GEMINI_REST = "https://generativelanguage.googleapis.com/v1beta/models";

const GEMINI_MODEL_DEFAULTS = [
	"gemini-2.5-flash-lite",
	"gemini-2.5-flash",
	"gemini-flash-latest",
	"gemini-2.0-flash",
] as const;

export async function summarizeWithGemini(opts: {
	apiKey: string;
	systemInstruction: string;
	userPrompt: string;
	maxOutputTokens: number;
}): Promise<{ text: string; model: string }> {
	const { apiKey, systemInstruction, userPrompt, maxOutputTokens } = opts;
	const models = [...new Set(GEMINI_MODEL_DEFAULTS)];
	let lastError: WebSummaryError | undefined;

	for (const model of models) {
		const url = `${GEMINI_REST}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

		for (let attempt = 0; attempt < 3; attempt++) {
			try {
				const res = await fetch(url, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
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

				const errObj = data?.error as
					| { message?: string; code?: number; status?: string }
					| undefined;

				if (!res.ok || errObj?.message) {
					const msg = errObj?.message ?? `HTTP ${res.status}`;
					lastError = webSummaryErrorFromGeminiResponse(
						res.status,
						errObj,
						msg,
					);

					if (lastError.code === "E12") {
						const wait = parseRetryAfterMs(msg);
						if (wait != null && attempt < 2) {
							await sleepMs(wait);
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
				lastError = new WebSummaryError(
					"E13",
					e instanceof Error ? e.message : String(e),
				);
				break;
			}
		}
	}

	throw lastError ?? new WebSummaryError("E13", "all_models_exhausted");
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
	fullSummary: string;
	stats: {
		originalLength: number;
		model: string;
		sentToModelChars: number;
		approxInputTokensHint: number;
		maxOutputTokensCap: number;
		source: "extension";
	};
};

/** 탭에서 추출한 본문을 Gemini로 요약 */
export async function summarizeArticle(input: {
	apiKey: string;
	language: ServiceLang;
	articleTitle?: string;
	articleText: string;
}): Promise<SummaryResult> {
	const { apiKey, language, articleTitle, articleText } = input;
	const L = langTag(language);

	const normalized = normalizeIncomingArticle(articleText).slice(
		0,
		MAX_INPUT_CHARS,
	);
	const scrapedTitle = pickSummaryDisplayTitle(
		articleTitle?.trim() || "",
		language,
	);

	const userPrompt = buildLeanPrompt({
		language,
		title: scrapedTitle,
		content: normalized,
	});
	const systemInstruction = buildSystemInstructionForLang(L);

	let lastParseError: WebSummaryError | undefined;
	let model = "";

	for (let attempt = 0; attempt < SUMMARY_PARSE_MAX_ATTEMPTS; attempt++) {
		const result = await summarizeWithGemini({
			apiKey,
			systemInstruction,
			userPrompt,
			maxOutputTokens: MAX_OUTPUT_TOKENS,
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
					sentToModelChars: normalized.length,
					approxInputTokensHint: Math.ceil(normalized.length / 4),
					maxOutputTokensCap: MAX_OUTPUT_TOKENS,
					source: "extension",
				},
			};
		} catch (err) {
			if (
				err instanceof WebSummaryError &&
				err.code === "E10" &&
				attempt < SUMMARY_PARSE_MAX_ATTEMPTS - 1
			) {
				lastParseError = err;
				await sleepMs(400);
				continue;
			}
			throw err;
		}
	}

	throw lastParseError ?? new WebSummaryError("E10", "parse_retries_exhausted");
}
