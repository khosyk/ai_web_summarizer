import { describe, expect, it } from "vitest";
import {
	SITE,
	defaultPayTab,
	kakaoImg,
	kakaoURL,
	payTabs,
	paypalURL,
	type DonationSite,
} from "./donation";

const site = (overrides: Partial<DonationSite> = {}): DonationSite => ({
	...SITE,
	...overrides,
});
const tabIds = (s: DonationSite) => payTabs("Korean", s).map(([id]) => id);

describe("donation config validators", () => {
	it("accepts the configured values", () => {
		expect(kakaoImg()).toBe(SITE.kakaoQR);
		expect(kakaoURL()).toBe(SITE.kakaoLink);
		expect(paypalURL()).toBe(SITE.paypal);
	});

	it.each([
		"https://example.com/qr.png",
		"data:image/svg+xml;base64,AAAA",
		'data:image/png;base64,AAAA"onerror="x',
		"",
	])("rejects kakao image %s", (kakaoQR) => {
		expect(kakaoImg(site({ kakaoQR }))).toBe("");
	});

	it.each([
		"http://qr.kakaopay.com/abc",
		"https://qr.kakaopay.com.evil.example/abc",
		"https://qr.kakaopay.com/a b",
		"",
	])("rejects kakao link %s", (kakaoLink) => {
		expect(kakaoURL(site({ kakaoLink }))).toBe("");
	});

	it.each([
		"http://paypal.me/a",
		"https://paypal.me.evil.example/a",
		"https://paypal.me/",
		'https://paypal.me/a"b',
		"",
	])("rejects paypal link %s", (paypal) => {
		expect(paypalURL(site({ paypal }))).toBe("");
	});
});

describe("payTabs", () => {
	it("shows both tabs when both are set", () => {
		expect(tabIds(site())).toEqual(["kakao", "paypal"]);
	});

	it("drops a tab when its value is empty", () => {
		expect(tabIds(site({ kakaoQR: "" }))).toEqual(["paypal"]);
		expect(tabIds(site({ paypal: "" }))).toEqual(["kakao"]);
		expect(tabIds(site({ kakaoQR: "", paypal: "" }))).toEqual([]);
	});

	it("keeps the kakao tab without a link because the QR still works", () => {
		expect(tabIds(site({ kakaoLink: "" }))).toEqual(["kakao", "paypal"]);
	});
});

describe("defaultPayTab", () => {
	const both = payTabs("Korean", site());

	it("prefers kakao for Korean and paypal otherwise", () => {
		expect(defaultPayTab("Korean", both)).toBe("kakao");
		expect(defaultPayTab("English", both)).toBe("paypal");
		expect(defaultPayTab("Chinese", both)).toBe("paypal");
	});

	it("uses the only tab when the preferred one is missing", () => {
		expect(defaultPayTab("Korean", payTabs("Korean", site({ kakaoQR: "" })))).toBe(
			"paypal",
		);
		expect(defaultPayTab("English", payTabs("English", site({ paypal: "" })))).toBe(
			"kakao",
		);
		expect(defaultPayTab("English", [])).toBeUndefined();
	});
});
