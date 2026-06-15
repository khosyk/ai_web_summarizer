// 활성 탭의 DOM에서 본문 위주 텍스트만 추출해 익스텐션으로 넘김 (토큰 절약)
import { Readability } from "@mozilla/readability";

import type { DomFactory } from "./readabilityMarkupToPlain";
import { prepareReadabilityArticleInput } from "./readabilityMarkupToPlain";

const SEMANTIC_ROOT_SELECTORS = [
  "main",
  'article[role="main"]',
  "article",
  '[role="main"]',
  "#main-content",
  "#article-body",
  "#content",
  ".article-body",
  ".post-content",
  ".entry-content",
].join(", ");

function stripNoiseNodes(doc: Document) {
  doc
    .querySelectorAll(
      "script, style, noscript, link[rel='stylesheet'], template, iframe"
    )
    .forEach((el) => el.remove());
}

/** 본문일 가능성이 큰 영역만 잘라 독립 문서로 만들면 Readability 입력 토큰/노이즈가 줄어듦 */
function narrowDocumentLike(source: Document): Document {
  stripNoiseNodes(source);

  const bodyEl = source.body;
  const bodyLen = bodyEl?.textContent?.replace(/\s+/g, " ").trim().length ?? 0;

  const candidate = source.querySelector(SEMANTIC_ROOT_SELECTORS);
  const textLen = candidate?.textContent?.replace(/\s+/g, " ").trim().length ?? 0;

  /** 작은 main만 잡히면 페이지 대신 일부 조각만 읽게 됨 → 전체 문서로 Readability 입력 */
  if (candidate && textLen >= 200 && textLen >= Math.min(500, bodyLen * 0.22)) {
    const wrapped = `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body>${candidate.outerHTML}</body></html>`;
    const parsed = new DOMParser().parseFromString(wrapped, "text/html");
    stripNoiseNodes(parsed);
    return parsed;
  }

  return source;
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

const CONTENT_SCRIPT_FLAG = '__webSummaryContentScript';

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
        articleText = prepareReadabilityArticleInput(article, browserFragmentFactory).trim();
      }

      if (articleText.length < 48) {
        const loose = extractLooseBodyText(document);
        if (loose.length >= 48) {
          articleText = loose;
        }
      }

      if (articleText.length < 48) {
        sendResponse({
          errorCode: 'E05',
          error: 'readable_body_not_found',
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
        errorCode: 'E05',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return true;
});
}
