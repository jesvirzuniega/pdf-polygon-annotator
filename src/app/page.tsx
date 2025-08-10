"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Mode } from "@/types";
import { ToolProvider } from "./ToolContext";

export const btn = 'font-semibold py-1 px-2 cursor-pointer rounded-lg transition-color duration-300'
export const bgPrimary = 'bg-[#da3668]'
export const bgSecondary = 'bg-[#1c1618]'

const PdfViewer = dynamic(() => import('./PdfViewer'), { ssr: false });

export default function Home() {
  const [tool, setTool] = useState<Mode|null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(false);
  const [hasPdf, setHasPdf] = useState<boolean>(false);

  // ON 'esc' key press, set tool to null
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLoadingPdf) return;
      if (e.key === 'Escape') setTool(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoadingPdf]);

  return (
    <ToolProvider value={{ tool, setTool, setIsLoadingPdf, setHasPdf, isLoadingPdf }}>
      <div className="min-w-screen min-h-screen bg-gradient-to-t from-black to-[#731c37]">
        {hasPdf && <header className="fixed top-5 flex w-full justify-center z-50">
          <div className={`flex text-sm ${bgSecondary} shadow-xl p-1 rounded-2xl gap-2 ${isLoadingPdf ? 'pointer-events-none' : ''}`}>
            <button type="button" className={`${btn} ${tool === null ? bgPrimary : ''}`} onClick={() => setTool(null)}>
              Mouse
            </button>
            <button type="button" className={`${btn} ${tool === 'text' ? bgPrimary : ''}`} onClick={() => setTool('text')}>
              Text
            </button>
            <button type="button" className={`${btn} ${tool === 'line' ? bgPrimary : ''}`} onClick={() => setTool('line')}>
              Line
            </button>
          </div>
        </header>}
        <main className="flex flex-col items-center justify-center pb-10">
          <div className="flex flex-col items-center justify-center mt-[80px] mb-5">
            <h1 className="text-4xl mb-5">PDF Polygon Annotator</h1>
            <p className="mb-2">Annotate PDFs with polygons and text</p>
            <p className="text-xs">By <a href="https://jesvir.vercel.app/" className="text-white underline">Jesvir Zuniega</a></p>
          </div>
          <PdfViewer/>
        </main>
      </div>
    </ToolProvider>
  );
}
