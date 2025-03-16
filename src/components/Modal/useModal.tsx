import { useState, useCallback } from "react";

export const useModal = (): [
  status: boolean,
  setStatus: (status: boolean) => void,
  showModal: () => void,
  hideModal: () => void,
  toggleStatus: () => void,
] => {
  console.log("Hooks: useModal called")
  const [showStatus, setShowStatus] = useState(false);
  const showModal = () => setShowStatus(true);
  const hideModal = () => setShowStatus(false);
  const toggleModal = () => setShowStatus(!showStatus);
  const setModalStatus = (v: boolean) => useCallback(() => setShowStatus(v), []);

  return [showStatus, setModalStatus, showModal, hideModal, toggleModal];
};
