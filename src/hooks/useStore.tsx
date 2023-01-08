import { useContext } from "react";
import { StoreContext } from "../context";

export const useStore = () => {
  const store = useContext(StoreContext);

  return {
    ...store,
  };
};
