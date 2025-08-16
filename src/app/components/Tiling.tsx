"use client";

import { useEffect, useRef, useState } from "react";
import useDebounce from "../hooks/useDebounce";
import * as pdfjsLib from "pdfjs-dist";
import { btn, bgPrimary, bgSecondary } from "../common";
import { Point } from "motion";
import Structures from "./Structures";

pdfjsLib.GlobalWorkerOptions.workerSrc = "./pdf.worker.mjs";

const maxZoom = 5;
const minZoom = 0.25;
const debounceDelay = 100;

export default function Tiling() {
  const [fileBuffer, setFileBuffer] = useState<Uint8Array|null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy|null>(null);
  const [pageScale, setPageScale] = useState<number>(1);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(false);
  const [error, setError] = useState<string|null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [panPoint, setPanPoint] = useState<Point>({ x: 0, y: 0 });
  const debouncedPageScale = useDebounce(pageScale, debounceDelay);
  const debouncedPanPoint = useDebounce(panPoint, debounceDelay);
  const debouncedCurrentPage = useDebounce(currentPage, debounceDelay);
  const [tileCache, setTileCache] = useState<Map<string, HTMLCanvasElement>>(new Map());
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const buffer = new Uint8Array(await f.arrayBuffer());
    setFileBuffer(buffer);
  };

  /**
   * Convert the file buffer to a PDF document
   */
  useEffect(() => {
    async function convertBufferToPdf(buffer: Uint8Array) {
      const loadingTask = pdfjsLib.getDocument({ data: buffer });
      const doc = await loadingTask.promise.catch(() => {
        setError('Cannot load PDF. It may be damaged or corrupted');
        setIsLoadingPdf(false);
        return;
      });
      if (!doc) return;

      setPdfDoc(doc);
      setIsLoadingPdf(false);
      setError(null);
    }
    if (fileBuffer) convertBufferToPdf(fileBuffer);
  }, [fileBuffer]);

  const isTileVisible = (tile: {x: number, y: number}, panPoint: Point, tileSize: number) => {
    return tile.x >= panPoint.x - tileSize && tile.x <= panPoint.x + tileSize &&
          tile.y >= panPoint.y - tileSize && tile.y <= panPoint.y + tileSize;
  }

  const getTileCanvasKey = (pageNumber: number, pageScale: number, { x, y}: Point) => {
    return `${pageNumber}-${pageScale}-${x}-${y}`;
  }

  useEffect(() => {
    const tileSize = Math.ceil(Math.sqrt(window.innerWidth * window.innerHeight));
    const promises: Promise<void>[] = [];
    let cancelPromises = false;

    const renderPdfToCanvasTiles = async () => {
      const page = await pdfDoc!.getPage(debouncedCurrentPage);
      const canvas = canvasRef.current!;
      const viewport = page.getViewport({ scale: debouncedPageScale });
      const context = canvas.getContext("2d")!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = viewport.width + "px";
      canvas.style.height = viewport.height + "px";
      // Make sure to clear the canvas before rendering
      context.clearRect(0, 0, canvas.width, canvas.height);
  
      // Define the number of tiles to render on x and y axis
      const cols = Math.ceil(viewport.width / tileSize);
      const rows = Math.ceil(viewport.height / tileSize);

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * tileSize;
          const y = row * tileSize;
  
          // Skip if tile is not visible
          if (!isTileVisible({x, y}, debouncedPanPoint, tileSize)) continue;

          const renderTile = async () => {
            const key = getTileCanvasKey(debouncedCurrentPage, debouncedPageScale, { x, y });
            const cachedTile = tileCache.get(key);
            if (cachedTile) {
              console.log('tile is cached', key);
              context.drawImage(cachedTile, x, y);
              return;
            }
            console.log('tile is not cached', key);
            
            const tileCanvas = document.createElement("canvas");
            tileCanvas.width = tileSize;
            tileCanvas.height = tileSize;
            const tileContext = tileCanvas.getContext("2d")!;
            const renderContext = {
              canvasContext: tileContext,
              viewport,
              transform: [1, 0, 0, 1, -x, -y],
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any;

            setTileCache(prev => {
              const m = new Map(prev);
              m.set(key, tileCanvas);
              return m;
            });
    
            await page.render(renderContext).promise;
            if (!cancelPromises) context.drawImage(tileCanvas, x, y);
          }

          promises.push(renderTile());
        }
      }

      await Promise.all(promises).then(() => {
        console.log('done');
      });
    }

    if (pdfDoc) renderPdfToCanvasTiles();

    return () => {
      cancelPromises = true;
    }
  }, [pdfDoc, debouncedCurrentPage, debouncedPageScale, debouncedPanPoint]);

  const handlePageScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (value >= minZoom * 100 && value <= maxZoom * 100) {
      setPageScale(value / 100);
    } else {
      e.preventDefault();
    }
  }

  // Use debounce
  const handleOnScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setPanPoint({ x: e.currentTarget.scrollLeft, y: e.currentTarget.scrollTop });
  }

  const step = 25

  return (
    <>
      {!pdfDoc ? 
        <>
          <div className="flex flex-col items-center justify-center pt-[20vh] relative z-10">
            <div className={`flex flex-col items-center justify-center mb-5`}>
              <h1 className="text-4xl mb-5">PDF Viewer</h1>
              <p className="mb-2">Zoom in and out of high-resolution PDFs with tiling solution.</p>
              <p className="text-xs">By <a href="https://jesvir.vercel.app/" className="text-white underline">Jesvir Zuniega</a></p>
            </div>
            <div className={`flex w-full ${pdfDoc ? 'justify-between' : 'justify-center'}`}>
              <input type="file" id="pdf-file" className="hidden" accept="application/pdf" onInput={handleFileChange}/>
              <label htmlFor="pdf-file" className={`${btn} ${bgPrimary} !px-3 !py-2 text-base mb-5`}>
                Upload a high-resolution PDF
              </label>
            </div>
          </div>
          <Structures />
        </>
      :
        <div className="flex w-screen h-screen bg-[#282828]">
          <header className={`fixed top-5 flex left-1/2 p-4 -translate-x-1/2 justify-center z-50 ${bgSecondary} shadow-xl p-1 rounded-2xl`}>
            <div className="mr-2">
              <label htmlFor="page-scale" className="text-white">Zoom:</label>&nbsp;
              <input className="focus:outline-none border-b-2 text-center border-white" type="number" min={minZoom * 100} max={maxZoom * 100} step={step} value={pageScale * 100} onInput={handlePageScaleChange} />
            </div>
            <button type="button" className={`px-2 cursor-pointer active:outline-none focus:outline-none bg-transparent text-xl`} onClick={() => setPageScale(prev => Math.max(minZoom, prev - (step / 100)))}>
              -
            </button>
            <button type="button" className={`px-2 cursor-pointer active:outline-none focus:outline-none bg-transparent text-xl`} onClick={() => setPageScale(prev => Math.min(maxZoom, prev + (step / 100)))}>
              +
            </button>
            <span className="px-5">|</span>
            <div>
              <button type="button" className={`px-2 hover:underline cursor-pointer active:outline-none focus:outline-none bg-transparent text-xs`} onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}>
                Previous
              </button>
              <button type="button" className={`px-2 hover:underline cursor-pointer active:outline-none focus:outline-none bg-transparent text-xs`} onClick={() => setCurrentPage(prev => Math.min(pdfDoc!.numPages, prev + 1))}>
                Next
              </button>
            </div>
          </header>
          <div className="flex mx-auto overflow-auto min-h-full" onScroll={handleOnScroll}>
            <canvas ref={canvasRef} className="block" />
          </div>
        </div>
      }
    </>
  );
}
