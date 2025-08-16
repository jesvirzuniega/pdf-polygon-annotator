"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Mode } from "@/types";
import { ToolProvider } from "./components/ToolContext";
import withTooltip from "./hocs/withTooltip";
import { bgSecondary, btn, bgPrimary } from "./common";
import Structures from "./components/Structures";

const ButtonWithTooltip = withTooltip((props) => <button type="button" {...props}></button>);

const PdfViewer = dynamic(() => import('./components/PdfViewer'), { ssr: false });

export default function Home() {
  const [tool, setTool] = useState<Mode|null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(false);
  const [hasPdf, setHasPdf] = useState<boolean>(false);
  const [generatingDownloadUrl, setGeneratingDownloadUrl] = useState<boolean>(false);

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
    <ToolProvider value={{ tool, setTool, setIsLoadingPdf, setHasPdf, isLoadingPdf, generatingDownloadUrl, setGeneratingDownloadUrl }}>
      {hasPdf && <header className="fixed top-5 flex w-full justify-center z-50">
        <div className={`flex text-sm ${bgSecondary} shadow-xl p-1 rounded-2xl gap-2 ${isLoadingPdf || generatingDownloadUrl ? 'pointer-events-none' : ''}`}>
          <ButtonWithTooltip message="Cursor" className={`${btn} ${tool === null ? bgPrimary : ''}`} onClick={() => setTool(null)}>
            Cursor
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
      <Structures />
    </ToolProvider>
  );
}
