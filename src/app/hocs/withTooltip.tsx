import React, { useRef, useState } from "react";
import { bgSecondary } from "../common";
import { Point } from "@/types";

interface Props extends React.HTMLAttributes<HTMLElement> {
  message: string;
}

export default function withTooltip<P extends Props>(WrappedComponent: React.ComponentType<P>) {
  return function ComponentWithTooltip({ message, ...props }: P) {
    const [isHovering, setIsHovering] = useState(false);
    const [position, setPosition] = useState<Point>({ x: 0, y: 0 });
    const tooltipRef = useRef<HTMLDivElement>(null);
    const offset = 8;

    const onMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
      setIsHovering(true);
      const rect = e.currentTarget.getBoundingClientRect();
      const { width } = tooltipRef.current!.getBoundingClientRect();
      // Center the tooltip
      setPosition({ x: rect.x + rect.width / 2 - width / 2, y: rect.bottom + offset });
    }

    const onMouseLeave = () => {
      setIsHovering(false);
    }

    return <div onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <WrappedComponent {...(props as P)} />
      <div ref={tooltipRef} className={`fixed text-white ${isHovering ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 ease-out text-xs p-2 rounded-xl ${bgSecondary} z-50`} style={{ left: position.x, top: position.y }}>{message}</div>
    </div>
  };
}