import { ArticleResItem } from "@/db";

export function retainArticleAfterRead(
  pages: { list: ArticleResItem[] }[] | undefined,
  nextArticle: ArticleResItem,
): { list: ArticleResItem[] }[] | undefined {
  if (!pages) return pages;
  return pages.map((page) => ({
    ...page,
    list: (page?.list || []).map((item: ArticleResItem) =>
      item.uuid === nextArticle.uuid ? nextArticle : item,
    ),
  }));
}
