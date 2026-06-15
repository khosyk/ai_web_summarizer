/** 브라우저·JSDOM 공통: 중요 블록/구역만 라벨로 남긴 평문 */

/** 브라우저의 Node.TEXT_NODE / ELEMENT_NODE (Node.js 런타임에는 전역 Node 없음) */
const DOM_TEXT_NODE = 3;
const DOM_ELEMENT_NODE = 1;

export type DomFactory = {
  parseFragment: (html: string) => Element | null;
};

function collapseBlankLines(s: string): string {
  return s.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function normalizeTextNode(t: string | null): string {
  return (t ?? "").replace(/\s+/g, " ");
}

/** 인라인(문장 속) 노드만 이어 붙임 */
export function collectPhrasingContent(el: Element): string {
  let buf = "";
  for (const node of el.childNodes) {
    if (node.nodeType === DOM_TEXT_NODE) {
      buf += normalizeTextNode(node.textContent);
      continue;
    }
    if (node.nodeType !== DOM_ELEMENT_NODE) continue;
    const child = node as Element;
    const tag = child.tagName.toLowerCase();

    switch (tag) {
      case "script":
      case "style":
      case "noscript":
        break;
      case "br":
        buf += " ";
        break;
      case "strong":
      case "b":
        buf += `【${collectPhrasingContent(child)}】`;
        break;
      case "em":
      case "i":
        buf += `「${collectPhrasingContent(child)}」`;
        break;
      case "code":
      case "kbd":
        buf += `\`${collectPhrasingContent(child)}\``;
        break;
      case "a":
      case "span":
      case "small":
      case "time":
      case "abbr":
      case "cite":
      case "mark":
        buf += collectPhrasingContent(child);
        break;
      case "img": {
        const alt = child.getAttribute("alt")?.trim();
        if (alt) buf += `[img: ${alt}]`;
        break;
      }
      case "svg":
      case "math":
      case "template":
      case "iframe":
        break;
      default:
        buf += collectPhrasingContent(child);
        break;
    }
  }
  return buf.trim();
}

/** 블록 트리 → 구조 라벨이 포함된 평문 */
export function readabilityMarkupRootToPlain(root: Element): string {
  const parts: string[] = [];

  const walkBlocks = (el: Element): void => {
    for (const node of el.childNodes) {
      if (node.nodeType === DOM_TEXT_NODE) {
        const t = normalizeTextNode(node.textContent);
        if (t) parts.push(t);
        continue;
      }
      if (node.nodeType !== DOM_ELEMENT_NODE) continue;
      const e = node as Element;
      const tag = e.tagName.toLowerCase();

      switch (tag) {
        case "script":
        case "style":
        case "noscript":
        case "iframe":
        case "svg":
        case "template":
          break;

        case "br":
          parts.push("\n");
          break;

        case "article":
        case "section":
        case "nav":
        case "aside":
        case "div":
          walkBlocks(e);
          break;

        case "blockquote":
          parts.push("\n");
          walkBlocks(e);
          parts.push("\n");
          break;

        case "hr":
          parts.push("\n——\n");
          break;

        case "h1":
        case "h2":
        case "h3":
        case "h4":
        case "h5":
        case "h6":
          parts.push(`\n[${tag.toUpperCase()}] ${collectPhrasingContent(e)}\n`);
          break;

        case "p": {
          const line = collectPhrasingContent(e);
          if (line) parts.push(`\n${line}\n`);
          break;
        }

        case "pre": {
          const raw = (e.textContent ?? "").trim();
          if (raw) parts.push(`\n[PRE]\n${raw}\n`);
          break;
        }

        case "ul":
          parts.push("\n");
          for (const li of e.children) {
            if (li.tagName.toLowerCase() === "li") {
              const item = collectPhrasingContent(li);
              if (item) parts.push(`- ${item}\n`);
              else walkBlocks(li);
            }
          }
          parts.push("\n");
          break;

        case "ol":
          parts.push("\n");
          let n = 1;
          for (const li of e.children) {
            if (li.tagName.toLowerCase() === "li") {
              const item = collectPhrasingContent(li);
              if (item) parts.push(`${n}. ${item}\n`);
              else walkBlocks(li);
              n++;
            }
          }
          parts.push("\n");
          break;

        case "li":
          parts.push(`${collectPhrasingContent(e)}\n`);
          break;

        default:
          walkBlocks(e);
          break;
      }
    }
  };

  walkBlocks(root);
  return collapseBlankLines(parts.join(""));
}

function normalizePlainFromText(text: string): string {
  return collapseBlankLines(
    text
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n /g, "\n")
      .replace(/ \n/g, "\n")
      .trim()
  );
}

const STRUCTURED_SIGNAL_PATTERN =
  /\[(H[1-6]|PRE)\]|(^|\n)\s*-\s+\S|(【|「)|(^|\n)>\s|(^|\n)\s*\d+\.\s+\S/m;

/** Readability 결과: 중요 마크업이 살아 있으면 구조 평문, 아니면 textContent 평문 */
export function prepareReadabilityArticleInput(
  article: { content?: string | null; textContent?: string | null },
  factory: DomFactory
): string {
  const plainFallback = normalizePlainFromText(article.textContent ?? "");

  const html = typeof article.content === "string" ? article.content.trim() : "";
  if (!html) return plainFallback;

  const root = factory.parseFragment(html);
  const structuredRoot = root ? readabilityMarkupRootToPlain(root).trim() : "";

  const minLen = 48;
  const plainStem = plainFallback.replace(/\s/g, "");
  const structStem = structuredRoot.replace(/\s/g, "");

  if (structuredRoot.length < minLen) return plainFallback;

  /** 본문이 거의 비어 있는 HTML처럼 보이면 textContent 선택 */
  if (structStem.length < plainStem.length * 0.2 && plainStem.length >= minLen)
    return plainFallback;

  if (STRUCTURED_SIGNAL_PATTERN.test(structuredRoot)) return structuredRoot;
  if (structStem.length >= plainStem.length * 0.4) return structuredRoot;

  return plainFallback || structuredRoot;
}
