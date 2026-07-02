import { describe, expect, it } from "vitest";
import { applyTokenDiet } from "./articleTokenDiet";

const KO_ARTICLE = `[H1] 반도체 수출 규제 확대

정부가 내년부터 메모리 수【12%】 추가 규제를 검토한다고 3일 밝혔다. 업계는 생산 차질을 우려하고 있다.

[H2] 업계 반응

- 국내 fab 가동률 하락 우려
- 대체 공급망 확보가 시급하다

기자 홍길동
hong@news.example.com
[ⓒ 뉴스] 무단 전재 및 재배포 금지
▶ 관련 기사 더보기`;

describe("applyTokenDiet", () => {
	it("strips Korean boilerplate and email", () => {
		const { text, stats } = applyTokenDiet(KO_ARTICLE, {
			maxChars: 8000,
			locale: "ko",
		});

		expect(text).not.toMatch(/hong@news/);
		expect(text).not.toMatch(/무단 전재/);
		expect(text).not.toMatch(/▶/);
		expect(text).toContain("【12%】");
		expect(text).toContain("[H2]");
		expect(stats.afterSelect).toBeLessThan(stats.originalChars);
	});

	it("drops short byline lines but keeps lead numbers", () => {
		const { text } = applyTokenDiet(KO_ARTICLE, {
			maxChars: 8000,
			locale: "ko",
		});

		expect(text).not.toContain("기자 홍길동");
		expect(text).toContain("【12%】");
	});

	it("selects lead and scored sections within maxChars", () => {
		const section = "\n\n[H2] Later section\n\n후반부 핵심 【99%】 수치가 포함된 문단입니다.";
		const long = `${KO_ARTICLE}${section.repeat(40)}`;

		const { text, stats } = applyTokenDiet(long, {
			maxChars: 1200,
			locale: "ko",
			keepLeadBlocks: 1,
		});

		expect(stats.afterSelect).toBeLessThanOrEqual(1200);
		expect(text).toContain("[H1]");
		expect(stats.droppedBlocks).toBeGreaterThan(0);
	});

	it("passes through short plain text", () => {
		const short = "Short article body with enough words for summary testing here.";
		const { text, stats } = applyTokenDiet(short, {
			maxChars: 8000,
			locale: "en",
		});

		expect(text).toContain("Short article body");
		expect(stats.droppedBlocks).toBe(0);
	});

	it("applies English noise patterns", () => {
		const en = `[H1] Policy update

Exports rose 8% year on year according to the report.

Subscribe to our newsletter for more updates.
All rights reserved.`;

		const { text } = applyTokenDiet(en, {
			maxChars: 8000,
			locale: "en",
		});

		expect(text).toContain("Exports rose");
		expect(text).not.toMatch(/Subscribe/i);
		expect(text).not.toMatch(/All rights reserved/i);
	});
});
