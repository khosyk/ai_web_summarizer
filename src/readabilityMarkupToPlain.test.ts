import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import {
  collectPhrasingContent,
  prepareReadabilityArticleInput,
  readabilityMarkupRootToPlain,
} from './readabilityMarkupToPlain';

const domFactory = {
  parseFragment(html: string) {
    const { document } = new JSDOM(`<body>${html}</body>`).window;
    return document.body;
  },
};

describe('collectPhrasingContent', () => {
  it('wraps strong and em inline markup', () => {
    const el = domFactory.parseFragment(
      '<p>Price is <strong>42</strong> and <em>urgent</em>.</p>',
    )!;
    const p = el.querySelector('p')!;
    expect(collectPhrasingContent(p)).toBe('Price is 【42】 and 「urgent」.');
  });
});

describe('readabilityMarkupRootToPlain', () => {
  it('preserves heading and list structure', () => {
    const root = domFactory.parseFragment(
      '<article><h2>Title</h2><p>Intro.</p><ul><li>One</li><li>Two</li></ul></article>',
    )!;
    const plain = readabilityMarkupRootToPlain(root);

    expect(plain).toContain('[H2] Title');
    expect(plain).toContain('Intro.');
    expect(plain).toContain('- One');
    expect(plain).toContain('- Two');
  });
});

describe('prepareReadabilityArticleInput', () => {
  it('prefers structured markup when article HTML has headings', () => {
    const html =
      '<article><h1>Quarterly report</h1><p>Revenue grew <strong>12%</strong> year over year across all regions.</p></article>';
    const plain = prepareReadabilityArticleInput(
      {
        content: html,
        textContent:
          'Quarterly report Revenue grew 12% year over year across all regions.',
      },
      domFactory,
    );

    expect(plain).toContain('[H1] Quarterly report');
    expect(plain).toContain('【12%】');
  });

  it('falls back to textContent when HTML is too sparse', () => {
    const plain = prepareReadabilityArticleInput(
      {
        content: '<div></div>',
        textContent: 'Plain fallback text with enough length to pass threshold.',
      },
      domFactory,
    );

    expect(plain).toBe(
      'Plain fallback text with enough length to pass threshold.',
    );
  });
});
