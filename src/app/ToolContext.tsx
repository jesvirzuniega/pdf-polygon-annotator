import { createContext, Dispatch, SetStateAction } from "react";
import { Mode } from "@/types";

export const ToolContext = createContext<{
  tool: Mode | null;
  isLoadingPdf: boolean;
  setTool: Dispatch<SetStateAction<Mode | null>>;
  setLoadingPdf: Dispatch<SetStateAction<boolean>>;
  setHasPdf: Dispatch<SetStateAction<boolean>>;
}>({
  tool: null,
  isLoadingPdf: false,
  setTool: () => {},
  setLoadingPdf: () => {},
  setHasPdf: () => {},
});

export const ToolProvider = ToolContext.Provider;