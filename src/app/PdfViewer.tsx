'use client';

import { useRef, useState } from "react";
import { btn, Mode } from "./page";
import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc = "./pdf.worker.mjs";

interface Props {
  tool: Mode | null;
  setTool: (tool: Mode | null) => void;
}

export default function PdfViewer({ tool, setTool }: Props) {
  const [fileBuffer, setFileBuffer] = useState<Uint8Array|null>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const pdfCanvasOverlayRef = useRef<HTMLDivElement>(null);
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

  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== pdfCanvasOverlayRef.current) return;
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;
    if (tool === 'text') spawnTextBox(x, y);
  };

  const spawnTextBox = (x: number, y: number) => {
    const textBox = document.createElement('textarea');
    textBox.className = 'absolute max-w-[240px] h-auto text-black text-2xl p-1 bg-transparent focus:outline-none border-none z-10 resize-none overflow-hidden';
    textBox.style.left = `${x}px`;
    textBox.style.top = `${y}px`;
    textBox.value = '';
    pdfCanvasOverlayRef.current?.appendChild(textBox);
    textBox.focus();
    textBox.addEventListener('input', e => {
      if (!e.target) return;
      const target = e.target as HTMLTextAreaElement;
      target.style.height = target.scrollHeight + 'px';
    });
    setTool(null);
  };


  return <div className="flex flex-col items-center justify-center">
    <input type="file" id="pdf-file" className="hidden" accept="application/pdf" onChange={handleFileChange}/>
    <label htmlFor="pdf-file" className={`${btn} bg-[#da3668] !p-3 text-2xl mb-5`}>
      Upload PDF
    </label>
    <div className="relative overflow-hidden">
      <canvas id="canvas" ref={pdfCanvasRef} className={`bg-white rounded-2xl shadow-2xl relative`}></canvas>
      <div id="canvas-overlay" ref={pdfCanvasOverlayRef} className={`absolute overflow-hidden top-0 left-0 w-full h-full`} onClick={onClick}></div>
    </div>
  </div>;
}