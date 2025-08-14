"use client";

import dynamic from "next/dynamic";
const Tiling = dynamic(() => import('../components/Tiling'), { ssr: false });


export default function Page() {
  return (
    <Tiling />
  );
}
