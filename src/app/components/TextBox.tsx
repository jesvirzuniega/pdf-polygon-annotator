import { Box } from "@/types";
import { useRef, useState, useEffect, useContext } from "react";
import { ToolContext } from "./ToolContext";

export default function TextBox({ x, y, ...props }: Omit<Box, 'id'>) {
  const { tool } = useContext(ToolContext);
  const ref = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState('');
  const [isEditing, setIsEditing] = useState(true);

  useEffect(() => {
    if (ref.current) ref.current.focus();
    setHeightToScrollHeight();
  }, []);

  // Adjust height when text changes
  useEffect(() => {
    setHeightToScrollHeight();
  }, [text]);

  const setHeightToScrollHeight = () => {
    if (ref.current) ref.current.style.height = ref.current.scrollHeight + 'px';
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  } 

  const handleBlur = () => {
    setIsEditing(false);
  }

  const className = `absolute w-[180px] p-2 whitespace-pre-wrap break-words min-w-[180px] max-w-[180px] h-auto text-sm border-1 border-dashed border-transparent focus:border-black text-black bg-transparent focus:outline-none z-10 resize-none overflow-hidden ${tool === 'line' ? 'pointer-events-none' : (tool === null ? 'cursor-default' : '')}`;
  
  return isEditing ? <textarea 
    onBlur={handleBlur}
    {...props}
    ref={ref}
    className={className}
    style={{
      left: `${x}px`,
      top: `${y}px`,
    }}
    value={text} 
    onInput={handleInput}
  /> : <pre className={className}
    style={{
      left: `${x}px`,
      top: `${y}px`,
    }}
  >{text}</pre>
}