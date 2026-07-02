// 활성 탭의 DOM에서 본문 위주 텍스트만 추출해 익스텐션으로 넘김 (토큰 절약)
import { Readability } from "@mozilla/readability";

import type { DomFactory } from "./readabilityMarkupToPlain";
import { prepareReadabilityArticleInput } from "./readabilityMarkupToPlain";
import {
	pickBestSemanticRoot,
	stripInRootNoise,
} from "./semanticRootPick";

function stripNoiseNodes(doc: Document) {
	doc
		.querySelectorAll(
			"script, style, noscript, link[rel='stylesheet'], template, iframe",
		)
		.forEach((el) => el.remove());
}

/** SEO root scoring → Readability 입력 document narrowing */
function narrowDocumentLike(source: Document): Document {
	stripNoiseNodes(source);

	const candidate = pickBestSemanticRoot(source);
	if (!candidate) return source;

	const rootClone = candidate.cloneNode(true) as Element;
	stripInRootNoise(rootClone);

	const wrapped = `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body>${rootClone.outerHTML}</body></html>`;
	const parsed = new DOMParser().parseFromString(wrapped, "text/html");
	stripNoiseNodes(parsed);
	return parsed;
}

/** Readability 실패·짧은 본문일 때: 보이는 본문 전체에 가깝게 (뉴스 아닌 페이지 대비) */
function extractLooseBodyText(doc: Document): string {
	const b = doc.body;
	if (!b) return "";
	const el = b.cloneNode(true) as HTMLElement;
	el
		.querySelectorAll("script,style,noscript,template,iframe,svg")
		.forEach((n) => n.remove());
	return el.innerText.replace(/\s+/g, " ").trim();
}

const browserFragmentFactory: DomFactory = {
	parseFragment(html) {
		const doc = document.implementation.createHTMLDocument("");
		const div = doc.createElement("div");
		div.id = "__rw";
		doc.body.appendChild(div);
		div.innerHTML = html;
		return div;
	},
};

const CONTENT_SCRIPT_FLAG = "__webSummaryContentScript";

if (!(globalThis as Record<string, unknown>)[CONTENT_SCRIPT_FLAG]) {
	(globalThis as Record<string, unknown>)[CONTENT_SCRIPT_FLAG] = true;

	chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
		if (request.action === "EXTRACT_PAGE_DATA") {
			try {
				const clone = document.cloneNode(true) as Document;
				stripNoiseNodes(clone);
				const docForReader = narrowDocumentLike(clone);

				const reader = new Readability(docForReader);
				const article = reader.parse();

				let titleOut = document.title || "";
				let articleText = "";

				if (article) {
					titleOut = article.title || titleOut;
					articleText = prepareReadabilityArticleInput(
						article,
						browserFragmentFactory,
					).trim();
				}

				if (articleText.length < 48) {
					const loose = extractLooseBodyText(document);
					if (loose.length >= 48) {
						articleText = loose;
					}
				}

				if (articleText.length < 48) {
					sendResponse({
						errorCode: "E05",
						error: "readable_body_not_found",
					});
					return;
				}

				sendResponse({
					title: titleOut,
					articleText: articleText,
					url: window.location.href,
				});
			} catch (error: unknown) {
				sendResponse({
					errorCode: "E05",
					error: error instanceof Error ? error.message : String(error),
				});
			}
		}
		return true;
	});
}
