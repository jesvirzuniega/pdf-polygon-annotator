'use client';

import { useContext, useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { btn, bgPrimary, bgSecondary } from "./page";
import PdfPage from "./PdfPage";
import { ToolContext } from "./ToolContext";
import html2canvas from "html2canvas";
import { PDFDocument } from "pdf-lib";

pdfjsLib.GlobalWorkerOptions.workerSrc = "./pdf.worker.mjs";

export default function PdfViewer() {
  const { setTool, setIsLoadingPdf: setLoadingPdf, setHasPdf, isLoadingPdf, generatingDownloadUrl, setGeneratingDownloadUrl } = useContext(ToolContext);
  const [fileBuffer, setFileBuffer] = useState<Uint8Array|null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy|null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [error, setError] = useState<string|null>(null);
  const canvasWrapperRefs = useRef<Array<HTMLDivElement|null>>([]);

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
    function reset() {
      setPdfDoc(null);
      setCurrentPage(1);
      setTotalPages(0);
    }

    async function convertBufferToPdf(buffer: Uint8Array) {
      const loadingTask = pdfjsLib.getDocument({ data: buffer });
      setLoadingPdf(true);
      reset();
      const doc = await loadingTask.promise.catch(() => {
        setError('Cannot load PDF. It may be damaged or corrupted');
        setLoadingPdf(false);
        setHasPdf(false);
        return;
      });
      if (!doc) return;

      setTotalPages(doc.numPages);
      setHasPdf(true);
      setPdfDoc(doc);
      setLoadingPdf(false);
      setError(null);
    }
    if (fileBuffer) convertBufferToPdf(fileBuffer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileBuffer]);

  const handlePreviousPage = () => {
    setCurrentPage(prev => {
      if (prev === 1) return prev;
      return prev - 1;
    });
  }

  const handleNextPage = () => {
    setCurrentPage(prev => {
      if (totalPages === prev) return prev;
      return prev + 1;
    });
  }

  const handleDownloadPdf = async () => {
    setTool(null);
    // Add delay to ensure states are updated before generating the PDF
    setTimeout(async () => {
      const blobUrl = await generatePdfDownloadUrl();
      if (!blobUrl) return;
      const link = document.createElement('a');
      link.href = blobUrl;
      const uuid = crypto.randomUUID();
      link.download = `${uuid}.pdf`;
      link.click();
    }, 500);
  }

  async function generatePdfDownloadUrl() {
    setGeneratingDownloadUrl(true);
    try {
      const createdPdfDoc = await PDFDocument.create();
      // Draw each page of the PDF document
      for (let i = 1; i <= totalPages; i++) {
        const originalDisplay = canvasWrapperRefs.current[i]!.style.display;
        canvasWrapperRefs.current[i]!.style.display = 'block';
        const canvas = await html2canvas(canvasWrapperRefs.current[i]!);
        const canvasWrapperDataUrl = canvas.toDataURL('image/png');
        const page = createdPdfDoc.addPage([canvas.width, canvas.height]);
        const image = await createdPdfDoc.embedPng(canvasWrapperDataUrl);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: canvas.width,
          height: canvas.height
        });
        canvasWrapperRefs.current[i]!.style.display = originalDisplay;
      }
      const pdfBytes = await createdPdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      return blobUrl;
    } catch (error) {
      setError('Error generating PDF download URL');
      console.error(error);
      return null;
    } finally {
      setGeneratingDownloadUrl(false);
    }
  }

  // Temporarily hide the PDF viewer when generating the download URL
  const offscreen = 'absolute left-[-9999px]';

  return <div className="flex flex-col items-center justify-center">
    <div className={`flex w-full ${pdfDoc ? 'justify-between' : 'justify-center'}`}>
      <input type="file" id="pdf-file" className="hidden" accept="application/pdf" onInput={handleFileChange}/>
      <label htmlFor="pdf-file" className={`${btn} ${pdfDoc ? bgSecondary : bgPrimary} !px-3 !py-2 text-base mb-5`}>
        {pdfDoc ? 'Change' : 'Upload PDF'}
      </label>
      {pdfDoc && <button type="button" className={`${btn} ${bgPrimary} ${generatingDownloadUrl ? 'invisible pointer-events-none' : ''} !px-3 !py-2 text-base mb-5`} onClick={handleDownloadPdf}>
        Download
      </button>}
    </div>

    {/* Loading / error states */}
    {generatingDownloadUrl && <div className={`${bgSecondary} text-white p-2 rounded-lg`}>Generating PDF. This may take a moment depending on the size of the PDF...</div>}
    {isLoadingPdf && <div className={`${bgSecondary} text-white p-2 rounded-lg`}>Loading PDF...</div>}
    {error && <div className={`${bgSecondary} text-red-500 p-2 rounded-lg`}>{error}</div>}

    {/* Main PDF viewer */}
    <div className={`relative overflow-hidden rounded-t-lg ${isLoadingPdf || error ? 'hidden' : ''} ${generatingDownloadUrl ? offscreen : ''}`}>
      {/* Page navigation bar */}
      {totalPages > 0 && (
        <div className="flex w-full text-sm justify-between bg-[#1c1618] z-[50] px-4 p-2 rounded-t-lg">
          <button type="button" className={`text-white cursor-pointer hover:underline ${currentPage === 1 ? 'opacity-0 pointer-events-none' : ''}`} onClick={handlePreviousPage}>
            Previous
          </button>
          <div className="absolute left-1/2 -translate-x-1/2">
            <p>Page {currentPage} of {totalPages}</p>
          </div>
          <button type="button" className={`text-white cursor-pointer hover:underline ${currentPage === totalPages ? 'opacity-0 pointer-events-none' : ''}`} onClick={handleNextPage}>
            Next
          </button>
        </div>
      )}
      {/* Render each page of the PDF document */}
      <div>
        {totalPages > 0 && pdfDoc && Array.from({ length: totalPages }).map((_, index) => (
          <PdfPage 
            key={index} 
            pdfDoc={pdfDoc} 
            pageNumber={index + 1} 
            currentPage={currentPage} 
            canvasWrapperRefs={canvasWrapperRefs}
          />
        ))}
      </div>
    </div>
  </div>;
}
