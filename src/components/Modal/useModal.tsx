import { useState } from "react";

export const useModal = (): [
  status: boolean,
  showModal: () => void,
  hideModal: () => void,
  toggleStatus: () => void,
  setStatus: (status: boolean) => void
 ] => {
  const [showStatus, setShowStatus] = useState(false);
  const showModal = () => setShowStatus(true);
  const hideModal = () => setShowStatus(false);
  const toggleModal = () => setShowStatus(!showStatus);
  const setModalStatus = (v: boolean) => setShowStatus(v);

  return [
    showStatus,
    showModal,
    hideModal,
    toggleModal,
    setModalStatus];
};
