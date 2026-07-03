import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FolderPlus } from "lucide-react";
import { Button } from "@radix-ui/themes";

interface CollectionSuggestionProps {
  suggestion: { collectionName: string; articleCount: number } | null;
  withNotesCount: number;
  onCreateCollection: (name: string) => Promise<void>;
}

export function CollectionSuggestion({
  suggestion,
  withNotesCount,
  onCreateCollection,
}: CollectionSuggestionProps) {
  const { t } = useTranslation();
  const [showInput, setShowInput] = useState(false);
  const [newName, setNewName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setIsCreating(true);
    try {
      await onCreateCollection(name);
      setNewName("");
      setShowInput(false);
    } catch {
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="starred-panel-section">
      <div className="starred-panel-title">
        {t("starred.suggest.title")}
      </div>
      <div className="starred-suggestion-card">
        {suggestion ? (
          <>
            <div className="starred-suggestion-title">
              <FolderPlus size={14} />
              {t("starred.suggest.suggested_name", {
                name: suggestion.collectionName,
              })}
            </div>
            <p className="starred-suggestion-copy">
              {t("starred.suggest.suggested_reason", {
                count: suggestion.articleCount,
                name: suggestion.collectionName,
              })}
            </p>
            {showInput ? (
              <div className="starred-suggestion-input-row">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                  }}
                  placeholder={t("starred.collection_input_placeholder")}
                  className="starred-suggestion-input"
                  disabled={isCreating}
                />
                <Button
                  size="1"
                  onClick={handleCreate}
                  disabled={!newName.trim() || isCreating}
                >
                  {isCreating
                    ? t("Saving")
                    : t("starred.suggest.create_button")}
                </Button>
              </div>
            ) : (
              <Button
                className="starred-suggestion-button"
                size="1"
                onClick={() => {
                  setNewName(suggestion.collectionName);
                  setShowInput(true);
                }}
              >
                {t("starred.suggest.create_button")}
              </Button>
            )}
          </>
        ) : (
          <>
            <div className="starred-suggestion-title">
              <FolderPlus size={14} />
              {t("starred.suggest.create")}
            </div>
            <p className="starred-suggestion-copy">
              {t("starred.suggest.has_notes", {
                count: withNotesCount,
              })}
            </p>
            {showInput ? (
              <div className="starred-suggestion-input-row">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                  }}
                  placeholder={t("starred.collection_input_placeholder")}
                  className="starred-suggestion-input"
                  disabled={isCreating}
                />
                <Button
                  size="1"
                  onClick={handleCreate}
                  disabled={!newName.trim() || isCreating}
                >
                  {isCreating
                    ? t("Saving")
                    : t("starred.suggest.create_button")}
                </Button>
              </div>
            ) : (
              <Button
                className="starred-suggestion-button"
                size="1"
                onClick={() => setShowInput(true)}
              >
                {t("starred.suggest.create_button")}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
