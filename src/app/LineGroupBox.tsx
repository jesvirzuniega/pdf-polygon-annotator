import { useContext, useRef, useState, useEffect } from "react";
import { Dimension, Box } from "@/types";
import { ToolContext } from "./ToolContext";

interface Props extends Dimension, Omit<Box, 'id'> {
  isActive: boolean;
}

export default function LineGroupBox({ x, y, width, height, isActive }: Props) {
  const { tool } = useContext(ToolContext);
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const spacing = 8;
  const style = {
    left: `${x - spacing}px`,
    top: `${y - spacing}px`,
    width: `${width + spacing * 2}px`,
    height: `${height + spacing * 2}px`,
  }

  const onClick = (e: MouseEvent) => {
    if (e.target === ref.current) {
      setFocused(true);
    } else {
      setFocused(false);
    }
  }

  useEffect(() => {
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('click', onClick);
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      setFocused(true);
    } else {
      setFocused(false);
    }
  }, [isActive]);

  return <div 
    ref={ref}
    className={`absolute z-10 border-1 border-dashed p-2 ${tool !== null ? 'pointer-events-none' : ''} ${focused ? 'border-black' : 'border-transparent'}`} 
    style={style}>
  </div>
}