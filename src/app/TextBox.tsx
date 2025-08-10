import { Box } from "@/types";
import { useRef, useState, useEffect, useContext } from "react";
import { ToolContext } from "./ToolContext";

export default function TextBox({ x, y, ...props }: Omit<Box, 'id'>) {
  const { tool } = useContext(ToolContext);
  const ref = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState('');

  useEffect(() => {
    if (ref.current) ref.current.focus();
    setHeightToScrollHeight();
  }, [ref, text]);

  const setHeightToScrollHeight = () => {
    if (ref.current) ref.current.style.height = ref.current.scrollHeight + 'px';
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  } 
  
  return <textarea 
    {...props}
    ref={ref}
    className={`absolute max-w-[240px] h-auto text-sm p-5 border-1 border-dashed border-transparent focus:border-black text-black bg-transparent focus:outline-none z-10 resize-none overflow-hidden ${tool === 'line' ? 'pointer-events-none' : (tool === null ? 'cursor-default' : '')}`}
    style={{
      left: `${x}px`,
      top: `${y}px`,
    }}
    value={text} 
    onInput={handleInput}
  />
}