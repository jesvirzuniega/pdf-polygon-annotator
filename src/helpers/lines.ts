import { Line, Point } from "@/types";

export const areConnected = ([{ x: aX1, y: aY1 }, { x: aX2, y: aY2 }]: Line, [{ x: bX1, y: bY1 }, { x: bX2, y: bY2 }]: Line) => {
  return aX1 === bX1 && aY1 === bY1 || 
    aX1 === bX2 && aY1 === bY2 || 
    aX2 === bX1 && aY2 === bY1 || 
    aX2 === bX2 && aY2 === bY2;
}

export const getGroupsOfConnectedLinesByIndices = (lines: Line[]) => {
  const connections: number[][] = Array.from({ length: lines.length }, () => []);
  // Build connections for each lines first
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      if (areConnected(lines[i], lines[j])) {
        connections[i].push(j);
        connections[j].push(i);
      }
    }
  }

  // DFS to group connected components
  const visited = new Set<number>();
  const groups: number[][] = [];

  function dfs(index: number, group: number[]) {
    visited.add(index);
    group.push(index);
    for (const neighbor of connections[index]) {
      // Continue deeper if not yet visited
      if (!visited.has(neighbor)) dfs(neighbor, group);
    }
  }

  for (let i = 0; i < lines.length; i++) {
    if (!visited.has(i)) {
      const group: number[] = [];
      dfs(i, group);
      groups.push(group);
    }
  }

  return groups;
}

// This is used to improve user experience by snapping to the nearest rendered point
export const getNearestRenderedPoint = (renderedLines: Line[], { x ,y }: Point, magnetSize: number = 20, scale: number = 1) => {
  return renderedLines.reduce((acc: Point | null, [p1, p2]) => {
    if (acc) return acc;
    const diff1 = Math.abs(scalePoint(p1, scale).x - x) + Math.abs(scalePoint(p1, scale).y - y);
    const diff2 = Math.abs(scalePoint(p2, scale).x - x) + Math.abs(scalePoint(p2, scale).y - y);

    if (diff1 <= magnetSize) return p1;
    if (diff2 <= magnetSize) return p2;
    return acc;
  }, null);
}

export const drawLine = (renderedLines: Line[], context: CanvasRenderingContext2D, { x: x1, y: y1 }: Point, { x: x2, y: y2 }: Point, snapToTheNearestPoint: boolean = false, addBox: boolean = false) => {
  const boxSize = 4;
  context.beginPath();
  context.moveTo(x1, y1);
  context.fillRect(x1 - boxSize / 2, y1 - boxSize / 2, boxSize, boxSize);
  const nearestPoint = snapToTheNearestPoint ? getNearestRenderedPoint(renderedLines, { x: x2, y: y2 }) : null;
  if (nearestPoint) {
    context.lineTo(nearestPoint.x, nearestPoint.y);
  } else {
    context.lineTo(x2, y2);
  }
  if (addBox) {
    context.fillRect(x2 - boxSize / 2, y2 - boxSize / 2, boxSize, boxSize);
  }
  context.stroke();

  return nearestPoint
}

export const redraw = (renderedLines: Line[], context: CanvasRenderingContext2D, canvas: HTMLCanvasElement, pageScale: number = 1) => {
  context.clearRect(0, 0, canvas.width, canvas.height);
  renderedLines.forEach(([p1, p2]) => drawLine(renderedLines, context, scalePoint(p1, pageScale), scalePoint(p2, pageScale), false, true));
}

export const scaleLines = (lines: Line[], scale: number): Line[] => {
  return lines.map(([p1, p2]) => [
    scalePoint(p1, scale),
    scalePoint(p2, scale)
  ] as Line);
}

export const scalePoint = (point: Point, scale: number): Point => {
  return { x: point.x * scale, y: point.y * scale };
}

export const deScalePoint = (point: Point, scale: number): Point => {
  return { x: point.x / scale, y: point.y / scale };
}

export const getDimensionsOfLineGroup = (lineGroup: Line[]) => {
  const minX = Math.min(...lineGroup.map(([p1, p2]) => Math.min(p1.x, p2.x)));
  const minY = Math.min(...lineGroup.map(([p1, p2]) => Math.min(p1.y, p2.y)));
  const maxX = Math.max(...lineGroup.map(([p1, p2]) => Math.max(p1.x, p2.x)));
  const maxY = Math.max(...lineGroup.map(([p1, p2]) => Math.max(p1.y, p2.y)));
  return { minX, minY, maxX, maxY };
}