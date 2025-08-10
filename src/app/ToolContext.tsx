import { createContext, Dispatch, SetStateAction } from "react";
import { Mode } from "@/types";

export const ToolContext = createContext<{
  tool: Mode | null;
  setTool: Dispatch<SetStateAction<Mode | null>>;
}>({
  tool: null,
  setTool: () => {},
});

export const ToolProvider = ToolContext.Provider;