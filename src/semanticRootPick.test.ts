import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import {
	collectSemanticRootCandidates,
	normalizedTextLength,
	pickBestSemanticRoot,
	stripInRootNoise,
} from "./semanticRootPick";

function docFrom(html: string): Document {
	return new JSDOM(html).window.document;
}

describe("pickBestSemanticRoot", () => {
	it("prefers article with body text over tiny main banner", () => {
		const doc = docFrom(`
      <body>
        <header>Site</header>
        <main>Ad only</main>
        <article>
          <h1>Export rules change</h1>
          <p>${"Revenue grew twelve percent year on year across all major regions according to the quarterly policy report released this morning. ".repeat(2)}</p>
          <p>${"Analysts expect further export policy updates before the end of the fiscal quarter as regulators review semiconductor supply chains. ".repeat(2)}</p>
        </article>
      </body>
    `);

		const picked = pickBestSemanticRoot(doc);
		expect(picked?.tagName.toLowerCase()).toBe("article");
	});

	it("returns null when all semantic roots are too small vs body", () => {
		const doc = docFrom(`
      <body>
        <p>${"Long visible body text. ".repeat(80)}</p>
        <main>Short</main>
      </body>
    `);

		expect(pickBestSemanticRoot(doc)).toBeNull();
	});

	it("collects unique candidates across selectors", () => {
		const doc = docFrom(`
      <body>
        <main id="main-content"><p>${"Article paragraph. ".repeat(20)}</p></main>
      </body>
    `);

		const candidates = collectSemanticRootCandidates(doc);
		expect(candidates).toHaveLength(1);
		expect(normalizedTextLength(candidates[0])).toBeGreaterThan(200);
	});
});

describe("stripInRootNoise", () => {
	it("removes nav and related blocks inside main", () => {
		const doc = docFrom(`
      <main>
        <p>Lead paragraph with enough content for extraction testing here today.</p>
        <nav><a href="/">Home</a></nav>
        <aside class="related-articles"><a href="/x">More</a></aside>
        <p>Second paragraph continues the core story with additional detail.</p>
      </main>
    `);

		const main = doc.querySelector("main")!;
		stripInRootNoise(main);

		expect(main.querySelector("nav")).toBeNull();
		expect(main.querySelector(".related-articles")).toBeNull();
		expect(main.textContent).toContain("Lead paragraph");
		expect(main.textContent).toContain("Second paragraph");
	});
});
