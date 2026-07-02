import { describe, expect, it } from "vitest";
import { GEMINI_MODEL, GEMINI_MODEL_FALLBACK } from "./geminiClient";

describe("geminiClient model config", () => {
	it("uses flash-lite as primary and flash as fallback", () => {
		expect(GEMINI_MODEL).toBe("gemini-2.5-flash-lite");
		expect(GEMINI_MODEL_FALLBACK).toBe("gemini-2.5-flash");
		expect(GEMINI_MODEL_FALLBACK).not.toBe(GEMINI_MODEL);
	});
});
