import { describe, expect, it } from "vitest";
import { parseStructuredSummary } from "./summaryStructured";
import { WebSummaryError } from "./userFacingError";

const validPayload = {
	readRecommendation: "read",
	readReason:
		"The article covers policy changes not obvious from the headline.",
	title: "New export rules explained",
	briefLines: ["Line one.", "Line two.", "Line three."],
	fullSummary: "Full summary body with enough detail.",
};

describe("parseStructuredSummary", () => {
	it("parses valid JSON into structured summary", () => {
		const result = parseStructuredSummary(
			JSON.stringify(validPayload),
			"Scraped title",
			"English",
		);

		expect(result.readRecommendation).toBe("read");
		expect(result.readReason).toBe(validPayload.readReason);
		expect(result.title).toBe(validPayload.title);
		expect(result.briefLines).toEqual(validPayload.briefLines);
		expect(result.fullSummary).toBe(validPayload.fullSummary);
	});

	it("strips markdown code fences before parsing", () => {
		const wrapped = `\`\`\`json\n${JSON.stringify(validPayload)}\n\`\`\``;
		const result = parseStructuredSummary(wrapped, "Title", "English");
		expect(result.readRecommendation).toBe("read");
	});

	it("normalizes skip recommendation", () => {
		const result = parseStructuredSummary(
			JSON.stringify({ ...validPayload, readRecommendation: "skip" }),
			"Title",
			"English",
		);
		expect(result.readRecommendation).toBe("skip");
	});

	it("defaults unknown readRecommendation to read", () => {
		const result = parseStructuredSummary(
			JSON.stringify({ ...validPayload, readRecommendation: "maybe" }),
			"Title",
			"English",
		);
		expect(result.readRecommendation).toBe("read");
	});

	it("falls back to scraped display title when model title is empty", () => {
		const result = parseStructuredSummary(
			JSON.stringify({ ...validPayload, title: "   " }),
			"Article headline",
			"English",
		);
		expect(result.title).toBe("Article headline");
	});

	it("throws E10 for invalid JSON", () => {
		expect(() =>
			parseStructuredSummary("not json", "Title", "English"),
		).toThrow(WebSummaryError);
		try {
			parseStructuredSummary("not json", "Title", "English");
		} catch (error) {
			expect(error).toMatchObject({ code: "E10" });
		}
	});

	it("throws E10 when briefLines is not length 3", () => {
		expect(() =>
			parseStructuredSummary(
				JSON.stringify({ ...validPayload, briefLines: ["one", "two"] }),
				"Title",
				"English",
			),
		).toThrow(WebSummaryError);
	});

	it("throws E10 when readReason is missing", () => {
		expect(() =>
			parseStructuredSummary(
				JSON.stringify({ ...validPayload, readReason: "" }),
				"Title",
				"English",
			),
		).toThrow(WebSummaryError);
	});
});
