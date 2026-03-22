"use client";

import React from "react";
import { Hammer, Sparkles, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface ComingSoonProps {
  title: string;
  description: string;
}

export default function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-12">
      <div className="relative group">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
          className="w-40 h-40 bg-accent/5 rounded-[4rem] flex items-center justify-center group-hover:scale-110 transition-transform"
        >
          <Hammer className="w-16 h-16 text-accent animate-bounce" />
        </motion.div>
        <Sparkles className="absolute -top-4 -right-4 w-10 h-10 text-indigo-500 animate-pulse" />
      </div>

      <div className="space-y-4 max-w-lg mx-auto">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">{title}</h1>
        <p className="text-slate-500 font-bold leading-relaxed">{description}</p>
      </div>

      <div className="flex bg-slate-100 p-2 rounded-3xl">
         <Link href="/">
            <button className="flex items-center gap-3 px-10 py-4 bg-white text-slate-900 rounded-2xl font-black shadow-xl shadow-slate-200 hover:bg-slate-50 active:scale-95 transition-all">
               <ChevronLeft className="w-5 h-5 text-accent" />
               Return to Dashboard
            </button>
         </Link>
      </div>
    </div>
  );
}
