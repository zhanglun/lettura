import { ArticleResItem } from "@/db";

// 泛型页类型：SWR Infinite 的页除 list 外还带 total 等字段，替换 list 时要原样保留
export function retainArticleAfterRead<Page extends { list?: ArticleResItem[] }>(
  pages: Page[] | undefined,
  nextArticle: ArticleResItem,
): Page[] | undefined {
  if (!pages) return pages;
  return pages.map((page) => ({
    ...page,
    list: (page?.list || []).map((item: ArticleResItem) =>
      item.uuid === nextArticle.uuid ? nextArticle : item,
    ),
  }));
}
