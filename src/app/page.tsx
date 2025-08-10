"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Mode } from "@/types";
import { ToolProvider } from "./ToolContext";
import Image from "next/image";
import { motion } from "framer-motion";
import withTooltip from "./withTooltip";

export const btn = 'font-semibold py-1 px-2 cursor-pointer rounded-2xl transition-color duration-300'
export const bgPrimary = 'bg-[#da3668]'
export const bgSecondary = 'bg-[#1c1618]'

const ButtonWithTooltip = withTooltip((props) => <button type="button" {...props}></button>);

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

  const initialYs = -0
  const finalYs = -50
  const durations = 1.5
  const easings = "easeOut"

  return (
    <ToolProvider value={{ tool, setTool, setIsLoadingPdf, setHasPdf, isLoadingPdf }}>
      <div className="min-w-screen min-h-screen bg-gradient-to-t from-black to-[#731c37]">
        {hasPdf && <header className="fixed top-5 flex w-full justify-center z-50">
          <div className={`flex text-sm ${bgSecondary} shadow-xl p-1 rounded-2xl gap-2 ${isLoadingPdf ? 'pointer-events-none' : ''}`}>
            <ButtonWithTooltip message="Mouse" className={`${btn} ${tool === null ? bgPrimary : ''}`} onClick={() => setTool(null)}>
              Mouse
            </ButtonWithTooltip>
            <ButtonWithTooltip message="Annotate with text" className={`${btn} ${tool === 'text' ? bgPrimary : ''}`} onClick={() => setTool('text')}>
              Text
            </ButtonWithTooltip>
            <ButtonWithTooltip message="Draw a line. Create polygons and merge them by connecting the lines." className={`${btn} ${tool === 'line' ? bgPrimary : ''}`} onClick={() => setTool('line')}>
              Line
            </ButtonWithTooltip>
          </div>
        </header>}
        <main className="relative w-full flex flex-col items-center justify-center pb-10 z-10">
          <div className={`flex flex-col items-center justify-center ${hasPdf ? 'mt-[80px]' : 'mt-[20vh]'} mb-5`}>
            <h1 className="text-4xl mb-5">PDF Polygon Annotator</h1>
            <p className="mb-2">Annotate PDFs with polygons and texts.</p>
            <p className="text-xs">By <a href="https://jesvir.vercel.app/" className="text-white underline">Jesvir Zuniega</a></p>
          </div>
          <PdfViewer/>
        </main>
        <div className="absolute flex gap-[5vw] px-[10vw] w-full bottom-0 h-full overflow-hidden">
          <motion.img src="/structure.png" alt="structure" width={280} height={440} className="h-[940px] object-contain" initial={{ y: initialYs, opacity: 0 }} animate={{ y: finalYs, opacity: 0.10 }} transition={{ duration: durations, ease: easings }} />
          <motion.img src="/structure.png" alt="structure" width={180} height={340} className="h-[940px] object-contain scale-x-[-1] flex-grow-0" initial={{ y: initialYs, opacity: 0 }} animate={{ y: finalYs, opacity: 0.15 }} transition={{ duration: durations, ease: easings }} />
          <motion.img src="/structure.png" alt="structure" width={820} height={1200} className=" object-cover" initial={{ y: initialYs, opacity: 0 }} animate={{ y: finalYs, opacity: 0.25 }} transition={{ duration: durations, ease: easings }} />
          <motion.img src="/structure.png" alt="structure" width={327} height={940} className="h-[940px] scale-x-[-1] flex-grow-0" initial={{ y: initialYs, opacity: 0 }} animate={{ y: finalYs, opacity: 0.15 }} transition={{ duration: durations, ease: easings }} />
        </div>
      </div>
    </ToolProvider>
  );
}
