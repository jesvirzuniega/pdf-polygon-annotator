import React, { JSX, useEffect, useState } from "react";
import { Point, Box } from "@/types";

interface Props extends Required<Box> {
  setPoint: (point: Point) => void;
}

export default function withDrag<P extends Props>(WrappedComponent: React.ComponentType<P>) {
  return function ComponentWithDrag({ setPoint, x, y, ...props }: P) {
    const [isDragging, setIsDragging] = useState(false);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      setIsDragging(true);
      console.log('mouse down')
    }

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      console.log('mouse move', {x, y}, e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      setPoint({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY});
    }

    const handleMouseUp = () => {
      setIsDragging(false);
      console.log('mouse down')
    }

    return <WrappedComponent {...(props as P)} x={x} y={y} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onMouseMove={handleMouseMove} />
  };
}