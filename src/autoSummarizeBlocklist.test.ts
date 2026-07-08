import { describe, expect, it } from "vitest";
import {
	hostFromTabUrl,
	isHostBlocked,
	isTabUrlAutoBlocked,
	normalizeBlockedHost,
	parseBlockedHostInput,
} from "./autoSummarizeBlocklist";

describe("normalizeBlockedHost", () => {
	it("lowercases and strips www", () => {
		expect(normalizeBlockedHost("WWW.Example.COM")).toBe("example.com");
	});

	it("returns empty for blank", () => {
		expect(normalizeBlockedHost("   ")).toBe("");
	});
});

describe("hostFromTabUrl", () => {
	it("extracts hostname from https url", () => {
		expect(hostFromTabUrl("https://www.NYT.com/path?q=1")).toBe("nyt.com");
	});

	it("rejects non-http schemes", () => {
		expect(hostFromTabUrl("chrome://extensions")).toBeNull();
	});
});

describe("parseBlockedHostInput", () => {
	it("accepts bare domain", () => {
		expect(parseBlockedHostInput("mail.google.com")).toBe("mail.google.com");
	});

	it("accepts url with path", () => {
		expect(parseBlockedHostInput("https://news.ycombinator.com/item")).toBe(
			"news.ycombinator.com",
		);
	});

	it("rejects invalid input", () => {
		expect(parseBlockedHostInput("not a domain")).toBeNull();
	});
});

describe("isTabUrlAutoBlocked", () => {
	it("matches normalized host in blocklist", () => {
		expect(
			isTabUrlAutoBlocked("https://www.example.com/a", ["example.com"]),
		).toBe(true);
	});

	it("does not match other hosts", () => {
		expect(isTabUrlAutoBlocked("https://other.com", ["example.com"])).toBe(
			false,
		);
	});

	it("isHostBlocked handles null host", () => {
		expect(isHostBlocked(null, ["example.com"])).toBe(false);
	});
});
