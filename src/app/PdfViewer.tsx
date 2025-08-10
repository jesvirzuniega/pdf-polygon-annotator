'use client';

import * as pdfjsLib from "pdfjs-dist";
import { useContext, useEffect, useRef, useState } from "react";
import { btn } from "./page";
import { Line, Point, Mode, Box, Dimension } from "@/types";
import LineGroupBox from "./LineGroupBox";
import TextBox from "./TextBox";
import { redraw, drawLine, getGroupsOfConnectedLinesByIndices, getNearestRenderedPoint, getDimensionsOfLineGroup } from "@/helpers/lines";
import { ToolContext } from "./ToolContext";

pdfjsLib.GlobalWorkerOptions.workerSrc = "./pdf.worker.mjs";

export default function PdfViewer() {
  const { tool, setTool } = useContext(ToolContext);
  const [fileBuffer, setFileBuffer] = useState<Uint8Array|null>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const pdfCanvasOverlayRef = useRef<HTMLDivElement>(null);
  const pdfDrawCanvasRef = useRef<HTMLCanvasElement>(null);
  // const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const [renderedLines, setRenderedLines] = useState<Line[]>([]);
  const [lines, setLines] = useState<Point[]>([]);
  const [lineGroups, setLineGroups] = useState<Record<string, Line[]>>({});
  const [lineGroupBoxes, setLineGroupBoxes] = useState<Array<Box & Dimension>>([]);
  const [textBoxes, setTextBoxes] = useState<Record<string, Box>>({});
  const [lastCreatedLineIndex, setLastCreatedLineIndex] = useState<number>(0);
  const [lastCreatedLineGroup, setLastCreatedLineGroup] = useState<string|null>(null);

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
    const outputScale = 1;

    const canvas = pdfCanvasRef.current!;
    const canvasDraw = pdfDrawCanvasRef.current!;
    const context = canvas.getContext('2d');

    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = Math.floor(viewport.width) + "px";
    canvas.style.height =  Math.floor(viewport.height) + "px";
    canvasDraw.width = Math.floor(viewport.width * outputScale);
    canvasDraw.height = Math.floor(viewport.height * outputScale);
    canvasDraw.style.width = Math.floor(viewport.width) + "px";
    canvasDraw.style.height =  Math.floor(viewport.height) + "px";

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
    resetCanvasOverlay();
  }

  const resetCanvasOverlay = () => {
    setRenderedLines([]);
    setLines([]);
  }

  const canvasOverlayOnClickHandler = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== pdfCanvasOverlayRef.current) return;
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;
    if (tool === 'text') spawnTextBox(x, y);
    if (tool === 'line') spawnLine(x, y);
  };

  const spawnTextBox = (x: number, y: number) => {
    setTextBoxes({ ...textBoxes, [crypto.randomUUID()]: { id: crypto.randomUUID(), x, y } });
    setTool(null);
  };

  const spawnLine = (x: number, y: number) => {
    setLines([...lines, getNearestRenderedPoint(renderedLines, { x, y }) || { x, y }]);
  };

  /**
   * Groups the lines by their indices
   */
  useEffect(() => {
    const groups = getGroupsOfConnectedLinesByIndices(renderedLines);
    const record: typeof lineGroups = {};
    for (const group of groups) {
      const groupId = crypto.randomUUID()
      record[groupId] = group.map(index => {
        if (index === lastCreatedLineIndex) setLastCreatedLineGroup(groupId);
        return renderedLines[index];
      });
    }
    setLineGroups(record);
  }, [renderedLines, lastCreatedLineIndex])

  /**
   * Re-renders the grouping boxes when the line groups change
   */
  useEffect(() => {
    setLineGroupBoxes(Object.entries(lineGroups).map(([id, group]) => { 
      const { minX, minY, maxX, maxY } = getDimensionsOfLineGroup(group);
      return {
        id, 
        x: minX, 
        y: minY, 
        width: maxX - minX, 
        height: maxY - minY
      }
    }));
  }, [lineGroups])

  /**
   * Draws the lines on the canvas when lines are added or removed
   */
  useEffect(() => {
    const canvas = pdfDrawCanvasRef.current!;
    const context = canvas.getContext('2d')!;

    const previewLineOnMouseMove = (e: MouseEvent) => {
      redraw(renderedLines, context, canvas);
      drawLine(renderedLines, context, lines[0], { x: e.offsetX, y: e.offsetY }, true);
    }

    const removePreviewLineOnMouseUp = () => {
      redraw(renderedLines, context, canvas);
      document.removeEventListener('mousemove', previewLineOnMouseMove);
    }

    if (lines.length === 1) {
      document.addEventListener('mousemove', previewLineOnMouseMove);
      document.addEventListener('mouseup', removePreviewLineOnMouseUp);
    }

    // Connect the lines and draw them on the canvas
    if (lines.length === 2) {
      removePreviewLineOnMouseUp();
      redraw(renderedLines, context, canvas);
      drawLine(renderedLines, context, lines[0], lines[1], false, true);
      setLines([]);
      setRenderedLines([...renderedLines, [lines[0], lines[1]]]);
      setLastCreatedLineIndex(renderedLines.length);
    }

    return () => {
      document.removeEventListener('mousemove', previewLineOnMouseMove);
      document.removeEventListener('mouseup', removePreviewLineOnMouseUp);
    }
  }, [lines, renderedLines]);

  return <div className="flex flex-col items-center justify-center">
    <input type="file" id="pdf-file" className="hidden" accept="application/pdf" onInput={handleFileChange}/>
    <label htmlFor="pdf-file" className={`${btn} bg-[#da3668] !p-3 text-xl mb-5`}>
      Upload PDF
    </label>
    <div className="relative overflow-hidden">
      <canvas id="canvas" ref={pdfCanvasRef} className={`rounded-2xl shadow-2xl relative w-full h-full`}></canvas>
      <canvas id="canvas-draw" ref={pdfDrawCanvasRef} className={`absolute overflow-hidden top-0 left-0 w-full h-full z-10`}></canvas>
      <div id="canvas-overlay" ref={pdfCanvasOverlayRef} className={`absolute overflow-hidden top-0 left-0 w-full h-full z-20 ${tool === 'line' ? 'cursor-crosshair' : (tool === 'text' ? 'cursor-text' : '')}`} onClick={canvasOverlayOnClickHandler}>
        {Object.entries(textBoxes).map(([id, box]) => 
          <TextBox 
            key={id} 
            x={box.x}
            y={box.y}
          />)
        }
        {lineGroupBoxes.map((box) => 
          <LineGroupBox 
            key={box.id} 
            x={box.x} 
            y={box.y} 
            width={box.width} 
            height={box.height} 
            isActive={box.id === lastCreatedLineGroup}
          />)
        }
      </div>
    </div>
  </div>;
}
