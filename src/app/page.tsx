"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Mode } from "@/types";
import { ToolProvider } from "./ToolContext";

export const btn = 'font-semibold py-1 px-2 cursor-pointer rounded-xl transition-color duration-300'
export const btnActive = 'bg-[#da3668]'

const PdfViewer = dynamic(() => import('./PdfViewer'), { ssr: false });

export default function Home() {
  const [tool, setTool] = useState<Mode|null>(null);

  return (
    <ToolProvider value={{ tool, setTool }}>
      <div className="min-w-screen min-h-screen bg-gradient-to-t from-black to-[#731c37]">
        <header className="fixed top-5 flex w-full justify-center z-50">
          <div className="flex text-sm bg-[#1c1618] shadow-xl p-1 rounded-2xl gap-2">
            <button type="button" className={`${btn} ${tool === null ? btnActive : ''}`} onClick={() => setTool(null)}>
              Mouse
            </button>
            <button type="button" className={`${btn} ${tool === 'text' ? btnActive : ''}`} onClick={() => setTool('text')}>
              Text
            </button>
            <button type="button" className={`${btn} ${tool === 'line' ? btnActive : ''}`} onClick={() => setTool('line')}>
              Line
            </button>
          </div>
        </header>
        <main className="flex flex-col items-center justify-center pb-10">
          <div className="flex flex-col items-center justify-center mt-[80px] mb-5">
            <h1 className="text-4xl mb-5">PDF Polygon Annotator</h1>
            <p className="mb-2">Annotate PDFs with polygons and text</p>
          </div>
          <PdfViewer/>
        </main>
      </div>
    </ToolProvider>
  );
}
