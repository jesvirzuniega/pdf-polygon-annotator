"use client";

import { motion } from "framer-motion";

const initialYs = -0
const finalYs = -50
const durations = 1.5
const easings = "easeOut"

export default function Structures() {
  return (
    <div className="absolute flex gap-[5vw] px-[10vw] w-full bottom-0 h-full overflow-hidden pointer-events-none">
      <motion.img src="/structure.png" alt="structure" width={280} height={440} className="h-[940px] object-contain" initial={{ y: initialYs, opacity: 0 }} animate={{ y: finalYs, opacity: 0.10 }} transition={{ duration: durations, ease: easings }} />
      <motion.img src="/structure.png" alt="structure" width={180} height={340} className="h-[940px] object-contain scale-x-[-1] flex-grow-0" initial={{ y: initialYs, opacity: 0 }} animate={{ y: finalYs, opacity: 0.15 }} transition={{ duration: durations, ease: easings }} />
      <motion.img src="/structure.png" alt="structure" width={820} height={1200} className=" object-cover" initial={{ y: initialYs, opacity: 0 }} animate={{ y: finalYs, opacity: 0.25 }} transition={{ duration: durations, ease: easings }} />
      <motion.img src="/structure.png" alt="structure" width={327} height={940} className="h-[940px] scale-x-[-1] flex-grow-0" initial={{ y: initialYs, opacity: 0 }} animate={{ y: finalYs, opacity: 0.15 }} transition={{ duration: durations, ease: easings }} />
    </div>   
  )
}