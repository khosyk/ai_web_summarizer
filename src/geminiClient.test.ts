import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	GEMINI_MODEL,
	GEMINI_MODEL_FALLBACK,
	GEMINI_MODEL_PINNED,
	summarizeArticle,
	summarizeWithGemini,
} from "./geminiClient";

const SUMMARY_JSON = JSON.stringify({
	readRecommendation: "read",
	readReason: "Useful.",
	title: "Title",
	briefLines: ["One.", "Two.", "Three."],
});

function okResponse(text = SUMMARY_JSON, modelVersion?: string) {
	return new Response(
		JSON.stringify({
			candidates: [{ content: { parts: [{ text }] } }],
			modelVersion,
		}),
		{ status: 200 },
	);
}

function errorResponse(status: number, message: string, apiStatus?: string) {
	return new Response(
		JSON.stringify({ error: { code: status, message, status: apiStatus } }),
		{ status },
	);
}

function maxTokensResponse() {
	return new Response(
		JSON.stringify({ candidates: [{ finishReason: "MAX_TOKENS" }] }),
		{ status: 200 },
	);
}

const fetchMock = vi.fn<typeof fetch>();

function calledModels(): string[] {
	return fetchMock.mock.calls.map(([url]) => {
		const match = String(url).match(/models\/([^:]+):generateContent/);
		return match?.[1] ?? "";
	});
}

function generationConfig(callIndex: number): Record<string, unknown> {
	const init = fetchMock.mock.calls[callIndex][1];
	return JSON.parse(String(init?.body)).generationConfig;
}

const request = {
	apiKey: "test-key",
	systemInstruction: "system",
	userPrompt: "prompt",
};

beforeEach(() => {
	fetchMock.mockReset();
	vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("geminiClient model config", () => {
	it("follows the latest alias and pins both fallbacks", () => {
		expect(GEMINI_MODEL).toMatch(/-latest$/);
		expect(GEMINI_MODEL_FALLBACK).not.toMatch(/-latest$/);
		expect(GEMINI_MODEL_PINNED).not.toMatch(/-latest$/);
		expect(GEMINI_MODEL_FALLBACK).not.toBe(GEMINI_MODEL);
	});
});

describe("summarizeWithGemini", () => {
	it("calls the primary alias and reports the model that answered", async () => {
		fetchMock.mockResolvedValueOnce(okResponse(SUMMARY_JSON, "gemini-9-lite"));

		const result = await summarizeWithGemini(request);

		expect(calledModels()).toEqual([GEMINI_MODEL]);
		expect(result.model).toBe("gemini-9-lite");
	});

	it("reports the requested model when modelVersion is missing", async () => {
		fetchMock.mockResolvedValueOnce(okResponse());

		const result = await summarizeWithGemini(request);

		expect(result.model).toBe(GEMINI_MODEL);
	});

	it("does not send deprecated sampling parameters", async () => {
		fetchMock.mockResolvedValueOnce(okResponse());

		await summarizeWithGemini(request);

		expect(generationConfig(0)).not.toHaveProperty("temperature");
	});

	it.each([
		[404, "models/gemini-flash-lite-latest is not found"],
		[400, "Unsupported thinking level"],
	])("moves to the pinned model on HTTP %i", async (status, message) => {
		fetchMock
			.mockResolvedValueOnce(errorResponse(status, message))
			.mockResolvedValueOnce(okResponse());

		const result = await summarizeWithGemini(request);

		expect(calledModels()).toEqual([GEMINI_MODEL, GEMINI_MODEL_PINNED]);
		expect(result.model).toBe(GEMINI_MODEL_PINNED);
	});

	it("sends no thinking config to the pinned model", async () => {
		fetchMock
			.mockResolvedValueOnce(errorResponse(400, "Unsupported thinking level"))
			.mockResolvedValueOnce(okResponse());

		await summarizeWithGemini(request);

		expect(generationConfig(0)).toHaveProperty("thinkingConfig");
		expect(generationConfig(1)).not.toHaveProperty("thinkingConfig");
	});

	it("moves to the pinned model when thinking uses up the output cap", async () => {
		fetchMock
			.mockResolvedValueOnce(maxTokensResponse())
			.mockResolvedValueOnce(okResponse());

		await summarizeWithGemini(request);

		expect(calledModels()).toEqual([GEMINI_MODEL, GEMINI_MODEL_PINNED]);
	});

	it.each([
		[429, "Quota exceeded", "RESOURCE_EXHAUSTED"],
		[503, "The model is overloaded", "UNAVAILABLE"],
	])(
		"moves to the flash fallback on HTTP %i",
		async (status, message, apiStatus) => {
			fetchMock
				.mockResolvedValueOnce(errorResponse(status, message, apiStatus))
				.mockResolvedValueOnce(okResponse());

			await summarizeWithGemini(request);

			expect(calledModels()).toEqual([GEMINI_MODEL, GEMINI_MODEL_FALLBACK]);
			expect(generationConfig(1).thinkingConfig).toEqual({
				thinkingLevel: "minimal",
			});
		},
	);

	it("moves to the flash fallback when a request times out", async () => {
		fetchMock
			.mockRejectedValueOnce(new DOMException("timed out", "TimeoutError"))
			.mockResolvedValueOnce(okResponse());

		await summarizeWithGemini(request);

		expect(calledModels()).toEqual([GEMINI_MODEL, GEMINI_MODEL_FALLBACK]);
	});

	it("does not try other models after the user stops the request", async () => {
		const controller = new AbortController();
		controller.abort();
		fetchMock.mockRejectedValueOnce(new DOMException("Aborted", "AbortError"));

		await expect(
			summarizeWithGemini({ ...request, signal: controller.signal }),
		).rejects.toThrow();
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("stops the request when the caller aborts mid-flight", async () => {
		const controller = new AbortController();
		fetchMock.mockImplementationOnce(
			(_url, init) =>
				new Promise((_resolve, reject) => {
					init?.signal?.addEventListener("abort", () =>
						reject(new DOMException("Aborted", "AbortError")),
					);
					controller.abort();
				}),
		);

		await expect(
			summarizeWithGemini({ ...request, signal: controller.signal }),
		).rejects.toThrow();
		expect(calledModels()).toEqual([GEMINI_MODEL]);
	});

	it("moves to the pinned model when the flash fallback is rejected too", async () => {
		fetchMock
			.mockResolvedValueOnce(errorResponse(429, "Quota exceeded"))
			.mockResolvedValueOnce(errorResponse(404, "not found"))
			.mockResolvedValueOnce(okResponse());

		await summarizeWithGemini(request);

		expect(calledModels()).toEqual([
			GEMINI_MODEL,
			GEMINI_MODEL_FALLBACK,
			GEMINI_MODEL_PINNED,
		]);
	});

	it.each([
		[401, "Unauthorized"],
		[400, "API key not valid. Please pass a valid API key."],
	])("does not retry other models on a rejected key (HTTP %i)", async (status, message) => {
		fetchMock.mockResolvedValueOnce(errorResponse(status, message));

		await expect(summarizeWithGemini(request)).rejects.toMatchObject({
			code: "E11",
		});
		expect(calledModels()).toEqual([GEMINI_MODEL]);
	});

	it("does not try other models when prepaid credits are depleted", async () => {
		fetchMock.mockResolvedValueOnce(
			errorResponse(
				402,
				"Your prepayment credits are depleted.",
				"RESOURCE_EXHAUSTED",
			),
		);

		await expect(summarizeWithGemini(request)).rejects.toMatchObject({
			code: "E14",
		});
		expect(calledModels()).toEqual([GEMINI_MODEL]);
	});

	it("does not treat an unrelated server error as a model rejection", async () => {
		fetchMock.mockResolvedValueOnce(errorResponse(500, "Internal error"));

		await expect(summarizeWithGemini(request)).rejects.toMatchObject({
			code: "E13",
		});
		expect(calledModels()).toEqual([GEMINI_MODEL]);
	});
});

describe("summarizeArticle", () => {
	it("uses the pinned model for the last attempt after invalid JSON", async () => {
		fetchMock
			.mockResolvedValueOnce(okResponse("not json"))
			.mockResolvedValueOnce(okResponse("not json"))
			.mockResolvedValueOnce(okResponse());

		const result = await summarizeArticle({
			apiKey: "test-key",
			language: "English",
			articleTitle: "Title",
			articleText: "Body text of the article.",
		});

		expect(calledModels()).toEqual([
			GEMINI_MODEL,
			GEMINI_MODEL,
			GEMINI_MODEL_PINNED,
		]);
		expect(result.stats.model).toBe(GEMINI_MODEL_PINNED);
	});
});
