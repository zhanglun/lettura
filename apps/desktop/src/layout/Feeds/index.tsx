import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import type { FeedResItem } from "@/db";
import { RouteConfig } from "@/config";
import * as dataAgent from "@/helpers/dataAgent";
import { AddFolder } from "@/components/AddFolder";
import { AddFeedChannel } from "@/components/AddFeed";
import { FeedsManage } from "./FeedsManage";
import { FeedsArticles } from "./FeedsArticles";
import { FeedContextMenu } from "./FeedContextMenu";

function findFeedByUuid(
  subscribes: FeedResItem[],
  uuid: string,
): FeedResItem | null {
  for (const item of subscribes) {
    if (item.uuid === uuid && item.item_type !== "folder") {
      return item;
    }
    if (item.children?.length) {
      const found = findFeedByUuid(item.children, uuid);
      if (found) return found;
    }
  }
  return null;
}

export function FeedsPage() {
  const { uuid } = useParams<{ uuid?: string }>();
  const navigate = useNavigate();
  const [addFolderDialogStatus, setAddFolderDialogStatus] = useState(false);
  const addFeedTriggerRef = useRef<HTMLSpanElement>(null);

  const store = useBearStore(
    useShallow((state) => ({
      subscribes: state.subscribes,
      feedsView: state.feedsView,
      setFeedsView: state.setFeedsView,
      contextMenuPosition: state.contextMenuPosition,
      setContextMenuPosition: state.setContextMenuPosition,
      feedContextMenuTarget: state.feedContextMenuTarget,
      setFeedContextMenuTarget: state.setFeedContextMenuTarget,
      getSubscribes: state.getSubscribes,
      syncAllArticles: state.syncAllArticles,
      syncArticles: state.syncArticles,
      globalSyncStatus: state.globalSyncStatus,
      addFeedModalOpen: state.addFeedModalOpen,
      setAddFeedModalOpen: state.setAddFeedModalOpen,
    })),
  );

  useEffect(() => {
    if (store.addFeedModalOpen && addFeedTriggerRef.current) {
      addFeedTriggerRef.current.click();
      store.setAddFeedModalOpen(false);
    }
  }, [store.addFeedModalOpen]);

  const feed = uuid ? findFeedByUuid(store.subscribes, uuid) : null;

  const handleFeedClick = useCallback(
    (f: FeedResItem) => {
      navigate(`${RouteConfig.LOCAL_FEEDS}/${f.uuid}`);
    },
    [navigate],
  );

  const handleBack = useCallback(() => {
    navigate(RouteConfig.LOCAL_FEEDS);
  }, [navigate]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, f: FeedResItem) => {
      e.preventDefault();
      store.setFeedContextMenuTarget(f);
      store.setContextMenuPosition({ x: e.clientX, y: e.clientY });
    },
    [store],
  );

  const handleSyncAll = useCallback(() => {
    store.syncAllArticles();
  }, [store]);

  const handleMarkAllRead = useCallback(() => {
    dataAgent.markAllRead({ isAll: true }).then(() => {
      store.getSubscribes();
    });
  }, [store]);

  const handleFeedSync = useCallback(
    (f: FeedResItem) => {
      store.syncArticles(f).then(() => {
        store.getSubscribes();
      });
    },
    [store],
  );

  const handleFeedDelete = useCallback(
    (f: FeedResItem) => {
      dataAgent.deleteChannel(f.uuid).then(() => {
        store.getSubscribes();
      });
    },
    [store],
  );

  const handleFeedMarkAllRead = useCallback(
    (f: FeedResItem) => {
      dataAgent.markAllRead({ uuid: f.uuid }).then(() => {
        store.getSubscribes();
      });
    },
    [store],
  );

  const handleCloseContextMenu = useCallback(() => {
    store.setContextMenuPosition(null);
    store.setFeedContextMenuTarget(null);
  }, [store]);

  const handleViewArticles = useCallback(
    (f: FeedResItem) => {
      navigate(`${RouteConfig.LOCAL_FEEDS}/${f.uuid}`);
    },
    [navigate],
  );

  return (
    <div className="relative flex flex-1 overflow-hidden">
      {feed ? (
        <FeedsArticles feed={feed} onBack={handleBack} />
      ) : (
        <FeedsManage
          onFeedClick={handleFeedClick}
          onAddFeed={() => store.setAddFeedModalOpen(true)}
          onAddFolder={() => setAddFolderDialogStatus(true)}
          onFeedContextMenu={handleContextMenu}
          onFeedSync={handleFeedSync}
          onFeedDelete={handleFeedDelete}
          onSyncAll={handleSyncAll}
          onMarkAllRead={handleMarkAllRead}
        />
      )}

      <FeedContextMenu
        feed={store.feedContextMenuTarget}
        position={store.contextMenuPosition}
        onClose={handleCloseContextMenu}
        onViewArticles={handleViewArticles}
        onSync={handleFeedSync}
        onMarkAllRead={handleFeedMarkAllRead}
        onEdit={() => {}}
        onMoveToFolder={() => {}}
        onDisable={() => {}}
        onDelete={handleFeedDelete}
      />
      <AddFolder
        action="add"
        dialogStatus={addFolderDialogStatus}
        setDialogStatus={setAddFolderDialogStatus}
        afterConfirm={() => store.getSubscribes()}
      />
      <AddFeedChannel>
        <span ref={addFeedTriggerRef} className="hidden" />
      </AddFeedChannel>
    </div>
  );
}
