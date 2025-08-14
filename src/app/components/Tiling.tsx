"use client";

import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { btn, bgPrimary, bgSecondary } from "../common";
import { Point } from "motion";

pdfjsLib.GlobalWorkerOptions.workerSrc = "./pdf.worker.mjs";

export default function Tiling() {
  const [fileBuffer, setFileBuffer] = useState<Uint8Array|null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy|null>(null);
  const [pageScale, setPageScale] = useState<number>(1);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(false);
  const [error, setError] = useState<string|null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [panPoint, setPanPoint] = useState<Point>({ x: 0, y: 0 });
  
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

  useEffect(() => {
    const tileSize = window.innerHeight / 1;

    const renderPdfToCanvasTiles = async () => {
      const page = await pdfDoc!.getPage(currentPage);
      const canvas = canvasRef.current!;
      const viewport = page.getViewport({ scale: pageScale });
      const context = canvas.getContext("2d")!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      // Make sure to clear the canvas before rendering
      context.clearRect(0, 0, canvas.width, canvas.height);
  
      // Define the number of tiles to render on x and y axis
      const cols = Math.ceil(viewport.width / tileSize);
      const rows = Math.ceil(viewport.height / tileSize);

      const promises = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * tileSize;
          const y = row * tileSize;
  
          // Skip if tile is not visible
          if (!isTileVisible({x, y}, panPoint, tileSize)) continue;

          const renderTile = async () => {
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
    
            await page.render(renderContext).promise;
            context.drawImage(tileCanvas, x, y);
          }

          promises.push(renderTile());
        }
      }

      await Promise.all(promises).then(() => {
        console.log('done');
      });
    }

    if (pdfDoc) renderPdfToCanvasTiles();
  }, [pdfDoc, currentPage, pageScale, panPoint]);

  const handlePageScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (value >= 25 && value <= 500) {
      setPageScale(value / 100);
    } else {
      e.preventDefault();
    }
  }

  return (
    <>
      {!pdfDoc ? 
        <div className="flex flex-col items-center justify-center pt-[20vh]">
          <div className={`flex w-full ${pdfDoc ? 'justify-between' : 'justify-center'}`}>
            <input type="file" id="pdf-file" className="hidden" accept="application/pdf" onInput={handleFileChange}/>
            <label htmlFor="pdf-file" className={`${btn} ${bgPrimary} !px-3 !py-2 text-base mb-5`}>
              {pdfDoc ? 'Change' : 'Upload PDF'}
            </label>
          </div>
        </div>
      :
        <div className="flex w-screen h-screen bg-[#282828]">
          <header className={`fixed top-5 flex left-1/2 p-4 -translate-x-1/2 justify-center z-50 ${bgSecondary} shadow-xl p-1 rounded-2xl`}>
            <div>
              <label htmlFor="page-scale" className="text-white">Zoom:</label>&nbsp;
              <input className="focus:outline-none border-b-2 text-center border-white" type="number" min={25} max={500} step={25} value={pageScale * 100} onInput={handlePageScaleChange} />
            </div>
          </header>
          <div className="flex mx-auto overflow-hidden h-full">
            <canvas ref={canvasRef} className="block" />
          </div>
        </div>
      }
    </>
  );
}
