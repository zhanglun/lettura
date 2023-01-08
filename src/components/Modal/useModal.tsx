import { useState } from "react";

export const useModal = () => {
  const [showStatus, setShowStatus] = useState(false);
  const showModal = () => setShowStatus(true);
  const hideModal = () => setShowStatus(false);
  const toggleModal = () => setShowStatus(!showStatus);

  return {
    showStatus,
    showModal,
    hideModal,
    toggleModal,
  };
};
