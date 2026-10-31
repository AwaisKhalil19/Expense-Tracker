import { useContext } from "react";
import { AppDataContext } from "./appDataStore";

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) throw new Error("useAppData must be used inside AppDataProvider");
  return context;
};
