import { Box, Mode } from "@/types";
import { useRef, useState, useEffect } from "react";

interface Props extends Omit<Box, 'id'> {
  tool: Mode | null
}

export default function TextBox({ x, y, tool }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState('');

  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
      if (ref.current) setHeightToScrollHeight(ref.current);
    }
  }, [ref]);

  const setHeightToScrollHeight = (element: HTMLTextAreaElement) => {
    element.style.height = element.scrollHeight + 'px';
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (ref.current) ref.current.style.height = ref.current.scrollHeight + 'px';
  } 
  
  return <div className={`absolute max-w-[240px] h-auto text-sm p-5 border-1 border-dashed border-transparent focus:border-black text-black bg-transparent focus:outline-none z-10 resize-none overflow-hidden ${tool === 'line' ? 'pointer-events-none' : (tool === null ? 'cursor-move' : '')}`}
    style={{
      left: `${x}px`,
      top: `${y}px`,
    }}
  >
    <textarea ref={ref} className="w-full h-full resize-none overflow-hidden" value={text} onInput={handleInput} />
  </div>
}