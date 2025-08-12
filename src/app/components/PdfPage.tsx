import { RefObject, useContext, useEffect, useRef, useState } from "react";
import { Line, Point, Box, Dimension } from "@/types";
import LineGroupBox from "./LineGroupBox";
import TextBox from "./TextBox";
import { redraw, drawLine, getGroupsOfConnectedLinesByIndices, getNearestRenderedPoint, getDimensionsOfLineGroup, scaleLines, deScalePoint } from "@/helpers/lines";
import { ToolContext } from "./ToolContext";
import * as pdfjsLib from "pdfjs-dist";

interface Props {
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  pageNumber: number;
  currentPage: number;
  canvasWrapperRefs: RefObject<Array<HTMLDivElement|null>>;
  pageScale: number;
} 

export default function PdfPage({ pdfDoc, pageNumber, currentPage, canvasWrapperRefs, pageScale }: Props) {
  const { tool, setTool } = useContext(ToolContext);  
  const [pdfPage, setPdfPage] = useState<pdfjsLib.PDFPageProxy|null>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const pdfCanvasOverlayRef = useRef<HTMLDivElement>(null);
  const pdfDrawCanvasRef = useRef<HTMLCanvasElement>(null);
  const [renderedLines, setRenderedLines] = useState<Line[]>([]);
  const [points, setPoints] = useState<Point[]>([]);
  const [lineGroups, setLineGroups] = useState<Record<string, Line[]>>({});
  const [lineGroupBoxes, setLineGroupBoxes] = useState<Array<Box & Dimension>>([]);
  const [textBoxes, setTextBoxes] = useState<Record<string, Box>>({});
  const [lastCreatedLineIndex, setLastCreatedLineIndex] = useState<number>(0);
  const [lastCreatedLineGroup, setLastCreatedLineGroup] = useState<string|null>(null);

  function resetPageData() {
    setRenderedLines([]);
    setPoints([]);
    setLineGroups({});
    setLineGroupBoxes([]);
    setTextBoxes({});
    setLastCreatedLineIndex(0);
    setLastCreatedLineGroup(null);
  }

  /**
   * Get the page
   */
  useEffect(() => {
    let loadingPageIsCancelled = false;
    async function getPage(pdfDoc: pdfjsLib.PDFDocumentProxy, p: number) {
      if (!pdfDoc) return;
      const page = await pdfDoc.getPage(p).then(page => {
        if (loadingPageIsCancelled) return null;
        return page;
      });
      if (page) setPdfPage(page);
    }

    if (pdfDoc) {
      getPage(pdfDoc, pageNumber)
      resetPageData()
    }

    return () => { loadingPageIsCancelled = true; };
  }, [pdfDoc, pageNumber]);

  function renderPdfPage(page: pdfjsLib.PDFPageProxy, scale: number) {
    const viewport = page.getViewport({ scale });

    const canvas = pdfCanvasRef.current!;
    const canvasDraw = pdfDrawCanvasRef.current!;
    const context = canvas.getContext('2d')!;

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    canvas.style.width = Math.floor(viewport.width) + "px";
    canvas.style.height =  Math.floor(viewport.height) + "px";
    canvasDraw.width = Math.floor(viewport.width);
    canvasDraw.height = Math.floor(viewport.height);
    canvasDraw.style.width = Math.floor(viewport.width) + "px";
    canvasDraw.style.height =  Math.floor(viewport.height) + "px";

    const renderContext = {
      canvasContext: context,
      viewport: viewport
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    
    page.render(renderContext);
  }

  /**
   * Render the page of the PDF document
   */
  useEffect(() => {
    if (pdfPage) {
      renderPdfPage(pdfPage, pageScale);
    }
  }, [pdfPage, pageScale]);

  useEffect(() => {
    const canvas = pdfDrawCanvasRef.current!;
    const context = canvas.getContext('2d')!;
    redraw(renderedLines, context, canvas, pageScale);
  }, [pageScale]);

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
    const scaledRenderedLines = scaleLines(renderedLines, pageScale);
    setPoints([...points, getNearestRenderedPoint(scaledRenderedLines, { x, y }) || { x, y }]);
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
      redraw(renderedLines, context, canvas, pageScale);
      const scaledRenderedLines = scaleLines(renderedLines, pageScale);
      drawLine(scaledRenderedLines, context, points[0], { x: e.offsetX, y: e.offsetY }, true);
    }

    const removePreviewLineOnMouseUp = () => {
      redraw(renderedLines, context, canvas, pageScale);
      document.removeEventListener('mousemove', previewLineOnMouseMove);
    }

    if (points.length === 1) {
      document.addEventListener('mousemove', previewLineOnMouseMove);
      document.addEventListener('mouseup', removePreviewLineOnMouseUp);
    }

    // Connect the lines and draw them on the canvas
    if (points.length === 2) {
      removePreviewLineOnMouseUp();
      redraw(renderedLines, context, canvas, pageScale);
      drawLine(renderedLines, context, points[0], points[1], false, true);
      setPoints([]);
      setRenderedLines([...renderedLines, [deScalePoint(points[0], pageScale), deScalePoint(points[1], pageScale)]]);
      setLastCreatedLineIndex(renderedLines.length);
    }

    return () => {
      document.removeEventListener('mousemove', previewLineOnMouseMove);
      document.removeEventListener('mouseup', removePreviewLineOnMouseUp);
    }
  }, [points, renderedLines]);

  return (
    <div ref={(el) => { canvasWrapperRefs.current[pageNumber] = el; }} className={`my-auto mx-auto relative ${currentPage === pageNumber ? 'block' : 'hidden'}`}>
      <canvas id="canvas" ref={pdfCanvasRef} className={`relative w-full h-full`}></canvas>
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
            x={box.x * pageScale} 
            y={box.y * pageScale} 
            width={box.width * pageScale} 
            height={box.height * pageScale} 
            isActive={box.id === lastCreatedLineGroup}
          />)
        }
      </div>
    </div>
  )
}