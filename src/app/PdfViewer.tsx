'use client';

import { useRef, useState } from "react";
import { btn, Mode } from "./page";
import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc = "./pdf.worker.mjs";

interface Props {
  tool: Mode | null;
}

export default function PdfViewer({ tool }: Props) {
  const [fileBuffer, setFileBuffer] = useState<Uint8Array|null>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const buffer = new Uint8Array(await f.arrayBuffer());
    setFileBuffer(buffer);
    convertBufferToPdf(buffer);
  };

  async function convertBufferToPdf(buffer: Uint8Array) {
    const loadingTask = pdfjsLib.getDocument({ data: buffer });
    const doc = await loadingTask.promise;
    const page = await doc.getPage(1);
    if (page) renderPdfPage(page, 1.5);
  }

  async function renderPdfPage(page: pdfjsLib.PDFPageProxy, scale: number) {
    const viewport = page.getViewport({ scale: scale, });
    // Support HiDPI-screens.
    const outputScale = window.devicePixelRatio || 1;

    const canvas = pdfCanvasRef.current!;
    const context = canvas.getContext('2d');

    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = Math.floor(viewport.width) + "px";
    canvas.style.height =  Math.floor(viewport.height) + "px";

    const transform = outputScale !== 1
      ? [outputScale, 0, 0, outputScale, 0, 0]
      : null;

    const renderContext = {
      canvasContext: context,
      transform: transform,
      viewport: viewport
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    page.render(renderContext);
  }


  return <div className="flex flex-col items-center justify-center">
    <input type="file" id="pdf-file" className="hidden" accept="application/pdf" onChange={handleFileChange}/>
    <label htmlFor="pdf-file" className={`${btn} bg-[#da3668] !p-3 text-2xl mb-5`}>
      Upload PDF
    </label>
    <canvas id="canvas" ref={pdfCanvasRef} className={`bg-white rounded-2xl shadow-2xl`}></canvas>
  </div>;
}