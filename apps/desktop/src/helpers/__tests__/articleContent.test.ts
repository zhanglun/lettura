import { describe, expect, it } from "vitest";
import {
  pickArticleContent,
  pickThumbUrl,
  processArticleHtml,
} from "../articleContent";

describe("pickThumbUrl", () => {
  it("extracts the first image from description html", () => {
    expect(
      pickThumbUrl({
        description: '<p>hi <img src="https://a.dev/x.png" alt="" /> next</p>',
      }),
    ).toBe("https://a.dev/x.png");
  });

  it("falls back to image attachments in media_object", () => {
    expect(
      pickThumbUrl({
        description: "no images here",
        media_object:
          '[{"content":[{"url":"https://a.dev/cover.jpg","content_type":"image/jpeg"},{"url":"https://a.dev/a.mp3","content_type":"audio/mpeg"}]}]',
      }),
    ).toBe("https://a.dev/cover.jpg");
  });

  it("ignores audio-only enclosures and invalid json", () => {
    expect(
      pickThumbUrl({
        description: "",
        media_object:
          '[{"content":[{"url":"https://a.dev/a.mp3","content_type":"audio/mpeg"}]}]',
      }),
    ).toBe("");
    expect(pickThumbUrl({ description: "", media_object: "{bad" })).toBe("");
    expect(pickThumbUrl({})).toBe("");
  });

  it("falls back to media thumbnails (podcast episode cover, same source as detail view)", () => {
    expect(
      pickThumbUrl({
        description: "",
        media_object:
          '[{"content":[{"url":"https://a.dev/a.m4a","content_type":"audio/x-m4a"}],"thumbnails":[{"image":{"uri":"https://a.dev/ep-cover.jpeg"}}]}]',
      }),
    ).toBe("https://a.dev/ep-cover.jpeg");
  });

  it("prefers image attachments over thumbnails", () => {
    expect(
      pickThumbUrl({
        description: "",
        media_object:
          '[{"content":[{"url":"https://a.dev/cover.jpg","content_type":"image/jpeg"}],"thumbnails":[{"image":{"uri":"https://a.dev/thumb.jpeg"}}]}]',
      }),
    ).toBe("https://a.dev/cover.jpg");
  });
});

describe("pickArticleContent", () => {
  it("prefers the richer of content and description", () => {
    expect(pickArticleContent("<p>longer content</p>", "short")).toBe(
      "<p>longer content</p>",
    );
    expect(pickArticleContent("short", "<p>longer description</p>")).toBe(
      "<p>longer description</p>",
    );
  });

  it("falls back when both are empty", () => {
    expect(pickArticleContent(null, undefined, " fallback ")).toBe("fallback");
    expect(pickArticleContent("", "", "x")).toBe("x");
  });
});

describe("processArticleHtml", () => {
  it("adds target=_blank to links that lack it", () => {
    const out = processArticleHtml('<a href="https://a.example">a</a>');
    expect(out).toContain('target="_blank"');
  });

  it("keeps existing target attributes untouched", () => {
    const out = processArticleHtml('<a target="_self" href="https://a.example">a</a>');
    expect(out).toContain('target="_self"');
    expect(out.match(/target=/g)?.length).toBe(1);
  });

  it("resolves relative image src against baseUrl", () => {
    const out = processArticleHtml('<img src="/img/cover.png">', {
      baseUrl: "https://blog.example.com/post/1",
    });
    expect(out).toContain('src="https://blog.example.com/img/cover.png"');
  });

  it("lifts the code language into a top-right label span (detail.html 契约)", () => {
    const out = processArticleHtml(
      '<pre><code class="language-rust">fn main() {}</code></pre>',
    );
    expect(out).toContain('<span class="code-lang">RUST</span>');
    expect(out).toContain('class="language-rust"');
  });

  it("supports lang- prefix and leaves unlabelled code blocks untouched", () => {
    expect(processArticleHtml('<pre><code class="lang-sql">SELECT 1;</code></pre>')).toContain(
      '<span class="code-lang">SQL</span>',
    );
    const plain = processArticleHtml("<pre><code>no language</code></pre>");
    expect(plain).toBe("<pre><code>no language</code></pre>");
  });
});
