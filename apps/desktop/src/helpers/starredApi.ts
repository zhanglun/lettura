import { request } from "./request";

export interface CollectionItem {
  id: number;
  uuid: string;
  name: string;
  description: string;
  icon: string;
  sort_order: number;
  create_date: string;
  update_date: string;
}

export interface TagItem {
  id: number;
  uuid: string;
  name: string;
  create_date: string;
}

export const getCollections = () =>
  request.get("/collections").then((res) => res.data as CollectionItem[]);

export const createCollection = (
  name: string,
  description?: string,
  icon?: string,
) => request.post("/collections", { name, description, icon });

export const updateCollection = (
  uuid: string,
  data: { name?: string; description?: string; icon?: string },
) => request.put(`/collections/${uuid}`, data);

export const deleteCollection = (uuid: string) =>
  request.delete(`/collections/${uuid}`);

export const addArticleToCollection = (
  articleId: number,
  collectionId: number,
) =>
  request.post("/article-collections", {
    article_id: articleId,
    collection_id: collectionId,
  });

export const removeArticleFromCollection = (
  articleId: number,
  collectionId: number,
) =>
  request.delete("/article-collections", {
    data: { article_id: articleId, collection_id: collectionId },
  });

export const getTags = () =>
  request.get("/tags").then((res) => res.data as TagItem[]);

export const createTag = (name: string) =>
  request.post("/tags", { name });

export const deleteTag = (uuid: string) =>
  request.delete(`/tags/${uuid}`);

export const addTagToArticle = (articleId: number, tagName: string) =>
  request.post("/article-tags", { article_id: articleId, tag_name: tagName });

export const removeTagFromArticle = (articleId: number, tagId: number) =>
  request.delete("/article-tags", {
    data: { article_id: articleId, tag_id: tagId },
  });

export const getArticleTags = (articleId: number) =>
  request
    .get(`/articles/${articleId}/tags`)
    .then((res) => res.data as TagItem[]);

export const getArticleCollections = (articleId: number) =>
  request
    .get(`/articles/${articleId}/collections`)
    .then((res) => res.data as CollectionItem[]);
