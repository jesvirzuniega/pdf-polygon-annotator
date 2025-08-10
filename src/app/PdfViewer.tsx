'use client';

import { useEffect, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { btn } from "./page";
import PdfPage from "./PdfPage";

pdfjsLib.GlobalWorkerOptions.workerSrc = "./pdf.worker.mjs";

export default function PdfViewer() {
  const [fileBuffer, setFileBuffer] = useState<Uint8Array|null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy|null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);

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
      const doc = await loadingTask.promise;
      setTotalPages(doc.numPages);
      setPdfDoc(doc);
    }
    if (fileBuffer) convertBufferToPdf(fileBuffer);
  }, [fileBuffer]);

  /**
   * Render the current page of the PDF document
   */
  useEffect(() => {
    //
  }, [currentPage, pdfDoc]);

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

  return <div className="flex flex-col items-center justify-center">
    <input type="file" id="pdf-file" className="hidden" accept="application/pdf" onInput={handleFileChange}/>
    <label htmlFor="pdf-file" className={`${btn} bg-[#da3668] !px-3 !py-2 text-base mb-5`}>
      Upload PDF
    </label>
    <div className="relative overflow-hidden rounded-t-lg">
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
          />
        ))}
      </div>
    </div>
  </div>;
}
