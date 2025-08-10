import { createContext, Dispatch, SetStateAction } from "react";
import { Mode } from "@/types";

export const ToolContext = createContext<{
  tool: Mode | null;
  isLoadingPdf: boolean;
  setTool: Dispatch<SetStateAction<Mode | null>>;
  setIsLoadingPdf: Dispatch<SetStateAction<boolean>>;
  setHasPdf: Dispatch<SetStateAction<boolean>>;
  generatingDownloadUrl: boolean;
  setGeneratingDownloadUrl: Dispatch<SetStateAction<boolean>>;
}>({
  tool: null,
  isLoadingPdf: false,
  setTool: () => {},
  setIsLoadingPdf: () => {},
  setHasPdf: () => {},
  generatingDownloadUrl: false,
  setGeneratingDownloadUrl: () => {},
});

export const ToolProvider = ToolContext.Provider;