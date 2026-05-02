import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  IconButton,
  Popover,
  Text,
  Checkbox,
  Flex,
  TextField,
  Button,
} from "@radix-ui/themes";
import { FolderPlus, Tags, Plus, X } from "lucide-react";
import { ArticleResItem } from "@/db";
import {
  getCollections,
  getArticleCollections,
  addArticleToCollection,
  removeArticleFromCollection,
  createCollection,
  type CollectionItem,
  getArticleTags,
  addTagToArticle,
  removeTagFromArticle,
  type TagItem,
} from "@/helpers/starredApi";
import { showErrorToast } from "@/helpers/errorHandler";

interface StarredOrganizeBarProps {
  article: ArticleResItem;
  onRefresh?: () => void;
}

export const StarredOrganizeBar = ({
  article,
  onRefresh,
}: StarredOrganizeBarProps) => {
  const { t } = useTranslation();
  const articleId = article.id;
  const disabled = articleId == null;

  const [allCollections, setAllCollections] = useState<CollectionItem[]>([]);
  const [articleCollections, setArticleCollections] = useState<CollectionItem[]>(
    [],
  );
  const [collectionLoading, setCollectionLoading] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);

  const [articleTags, setArticleTags] = useState<TagItem[]>([]);
  const [tagLoading, setTagLoading] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);

  const loadCollectionData = useCallback(() => {
    if (disabled) return;
    setCollectionLoading(true);
    Promise.all([getCollections(), getArticleCollections(articleId!)])
      .then(([all, articleCols]) => {
        setAllCollections(all);
        setArticleCollections(articleCols);
      })
      .catch((err) => showErrorToast(err, "Failed to load collection data"))
      .finally(() => setCollectionLoading(false));
  }, [articleId, disabled]);

  const loadTagData = useCallback(() => {
    if (disabled) return;
    setTagLoading(true);
    getArticleTags(articleId!)
      .then(setArticleTags)
      .catch((err) => showErrorToast(err, "Failed to load article tags"))
      .finally(() => setTagLoading(false));
  }, [articleId, disabled]);

  const isArticleInCollection = (collectionId: number) =>
    articleCollections.some((c) => c.id === collectionId);

  const handleToggleCollection = async (
    checked: boolean,
    collectionId: number,
  ) => {
    if (disabled) return;
    try {
      if (checked) {
        await addArticleToCollection(articleId!, collectionId);
      } else {
        await removeArticleFromCollection(articleId!, collectionId);
      }
      await loadCollectionData();
      onRefresh?.();
    } catch (err) {
      showErrorToast(err, "Failed to toggle collection");
    }
  };

  const handleCreateCollection = async () => {
    const name = newCollectionName.trim();
    if (!name) return;
    setIsCreatingCollection(true);
    try {
      await createCollection(name);
      setNewCollectionName("");
      await loadCollectionData();
      onRefresh?.();
    } catch (err) {
      showErrorToast(err, "Failed to create collection");
    } finally {
      setIsCreatingCollection(false);
    }
  };

  const handleRemoveTag = async (tagId: number) => {
    if (disabled) return;
    try {
      await removeTagFromArticle(articleId!, tagId);
      await loadTagData();
      onRefresh?.();
    } catch (err) {
      showErrorToast(err, "Failed to remove tag");
    }
  };

  const handleAddTag = async () => {
    const name = newTagName.trim();
    if (!name || disabled) return;
    setIsAddingTag(true);
    try {
      await addTagToArticle(articleId!, name);
      setNewTagName("");
      await loadTagData();
      onRefresh?.();
    } catch (err) {
      showErrorToast(err, "Failed to add tag");
    } finally {
      setIsAddingTag(false);
    }
  };

  return (
    <div className="flex h-9 items-center justify-between border-b border-[var(--gray-5)] px-3">
      <Text size="1" weight="medium" color="gray">
        {t("starred.organize.title")}
      </Text>
      <Flex gap="1" align="center">
        <Popover.Root
          onOpenChange={(open) => {
            if (open) loadCollectionData();
          }}
        >
          <Popover.Trigger>
            <IconButton
              size="1"
              variant="ghost"
              color="gray"
              disabled={disabled}
            >
              <FolderPlus size={14} />
            </IconButton>
          </Popover.Trigger>
          <Popover.Content className="w-[220px] p-0" align="end" sideOffset={4}>
            <div className="max-h-[240px] overflow-auto p-3">
              <Text size="1" weight="medium" as="p" className="mb-2">
                {t("starred.organize.collections")}
              </Text>
              {collectionLoading ? (
                <Text size="1" color="gray">
                  ...
                </Text>
              ) : allCollections.length === 0 ? (
                <Text size="1" color="gray">
                  {t("starred.organize.no_collections")}
                </Text>
              ) : (
                <Flex direction="column" gap="1">
                  {allCollections.map((collection) => (
                    <label
                      key={collection.id}
                      className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-[var(--gray-a3)]"
                    >
                      <Checkbox
                        size="1"
                        checked={isArticleInCollection(collection.id)}
                        onCheckedChange={(checked) =>
                          handleToggleCollection(
                            checked === true,
                            collection.id,
                          )
                        }
                      />
                      <Text size="1">{collection.name}</Text>
                    </label>
                  ))}
                </Flex>
              )}
            </div>
            <div className="border-t border-[var(--gray-5)] p-3">
              <Flex gap="2">
                <TextField.Root
                  size="1"
                  placeholder={t("starred.organize.create_collection")}
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateCollection();
                  }}
                  disabled={isCreatingCollection}
                  className="flex-1"
                />
                <IconButton
                  size="1"
                  variant="ghost"
                  disabled={
                    !newCollectionName.trim() || isCreatingCollection
                  }
                  onClick={handleCreateCollection}
                >
                  <Plus size={12} />
                </IconButton>
              </Flex>
            </div>
          </Popover.Content>
        </Popover.Root>

        <Popover.Root
          onOpenChange={(open) => {
            if (open) loadTagData();
          }}
        >
          <Popover.Trigger>
            <IconButton
              size="1"
              variant="ghost"
              color="gray"
              disabled={disabled}
            >
              <Tags size={14} />
            </IconButton>
          </Popover.Trigger>
          <Popover.Content className="w-[220px] p-0" align="end" sideOffset={4}>
            <div className="p-3">
              <Text size="1" weight="medium" as="p" className="mb-2">
                {t("starred.organize.tags")}
              </Text>
              {tagLoading ? (
                <Text size="1" color="gray">
                  ...
                </Text>
              ) : articleTags.length === 0 ? (
                <Text size="1" color="gray">
                  {t("starred.organize.no_tags")}
                </Text>
              ) : (
                <Flex gap="1" wrap="wrap" className="mb-2">
                  {articleTags.map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center gap-1 rounded-full border border-[var(--gray-5)] bg-[var(--gray-a2)] px-2 py-0.5 text-xs text-[var(--gray-11)]"
                    >
                      #{tag.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag.id)}
                        className="text-[var(--gray-9)] hover:text-[var(--gray-11)]"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </Flex>
              )}
            </div>
            <div className="border-t border-[var(--gray-5)] p-3">
              <Flex gap="2">
                <TextField.Root
                  size="1"
                  placeholder={t("starred.organize.add_tag")}
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddTag();
                  }}
                  disabled={isAddingTag}
                  className="flex-1"
                />
                <IconButton
                  size="1"
                  variant="ghost"
                  disabled={!newTagName.trim() || isAddingTag}
                  onClick={handleAddTag}
                >
                  <Plus size={12} />
                </IconButton>
              </Flex>
            </div>
          </Popover.Content>
        </Popover.Root>
      </Flex>
    </div>
  );
};
