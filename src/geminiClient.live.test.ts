import { describe, expect, it } from "vitest";
import { GEMINI_MODEL_PROFILES, generateWithProfile } from "./geminiClient";
import {
	buildLeanPrompt,
	buildSystemInstructionForLang,
	langTag,
} from "./summaryPrompt";
import { parseStructuredSummary } from "./summaryStructured";

/** 실제 API 호출 — `model-smoke.yml`에서만 키를 주입. 폴백 없이 모델별로 직접 확인 */
const apiKey = process.env.GEMINI_SMOKE_API_KEY ?? "";

const ARTICLE = [
	"The city council approved a plan on Tuesday to add 40 kilometres of protected bike lanes over the next three years.",
	"Officials said the project will cost 120 million dollars and is funded mostly by a regional transport grant.",
	"Local business groups raised concerns about the loss of street parking, while cycling groups welcomed the decision.",
	"Construction on the first section is expected to begin next spring.",
].join("\n\n");

describe.skipIf(!apiKey)("Gemini live smoke", () => {
	it.each(GEMINI_MODEL_PROFILES)(
		"$model returns a parseable summary",
		async (profile) => {
			const { text, model } = await generateWithProfile(profile, {
				apiKey,
				systemInstruction: buildSystemInstructionForLang(langTag("English")),
				userPrompt: buildLeanPrompt({
					language: "English",
					title: "City approves bike lane plan",
					content: ARTICLE,
				}),
			});

			console.log(`${profile.model} -> ${model}`);
			const summary = parseStructuredSummary(text, "Smoke test", "English");
			expect(summary.briefLines).toHaveLength(3);
		},
		60_000,
	);
});
