"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

export type Mode = "text" | "line";

export const btn = 'font-semibold py-1 px-2 cursor-pointer rounded-xl transition-color duration-300'
export const btnActive = 'bg-[#da3668]'

const PdfViewer = dynamic(() => import('./PdfViewer'), { ssr: false });

export default function Home() {
  const [tool, setTool] = useState<Mode|null>("text");

  return (
    <div className="min-w-screen min-h-screen bg-gradient-to-t from-black to-[#731c37]">
      <header className="fixed top-5 flex w-full justify-center">
        <div className="flex text-lg bg-[#1c1618] shadow-xl p-1 rounded-2xl gap-2">
          <button type="button" className={`${btn} ${tool === 'text' ? btnActive : ''}`} onClick={() => setTool('text')}>
            Text
          </button>
          <button type="button" className={`${btn} ${tool === 'line' ? btnActive : ''}`} onClick={() => setTool('line')}>
            Line
          </button>
          <button type="button" className={`${btn}`} onClick={() => setTool(null)}>
            x
          </button>
        </div>
      </header>
      <main className="flex flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-center mt-[10vh] mb-10">
          <h1 className="text-6xl mb-5">PDF Polygon Annotator</h1>
          <p className="mb-5">Annotate PDFs with polygons and text</p>
        </div>
        <PdfViewer tool={tool} setTool={setTool} />
      </main>
    </div>
  );
}
