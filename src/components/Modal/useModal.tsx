import { useState } from "react";

export const useModal = (): [
  status: boolean,
  setStatus: (status: boolean) => void,
  showModal: () => void,
  hideModal: () => void,
  toggleStatus: () => void,
 ] => {
  const [showStatus, setShowStatus] = useState(false);
  const showModal = () => setShowStatus(true);
  const hideModal = () => setShowStatus(false);
  const toggleModal = () => setShowStatus(!showStatus);
  const setModalStatus = (v: boolean) => setShowStatus(v);

  return [
    showStatus,
    setModalStatus,
    showModal,
    hideModal,
    toggleModal,
  ];
};
