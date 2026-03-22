"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, BrainCircuit, Zap, ChevronLeft, ChevronRight, X } from "lucide-react";
import { apiClient } from "@/lib/api";
import { cn } from "../../lib/utils";

interface PracticeQuestion {
  text: string;
  marks: number;
  answerHint?: string;
}

interface EvaluationResult {
  score: number;
  feedback: string;
  status: "Correct" | "Partial" | "Incorrect";
}

interface PracticeModeProps {
  id: string;
  questions: PracticeQuestion[];
  onClose: () => void;
}

export default function PracticeMode({ id, questions, onClose }: PracticeModeProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [studentAnswer, setStudentAnswer] = useState("");
  const [evaluations, setEvaluations] = useState<Record<number, EvaluationResult>>({});
  const [isEvaluating, setIsEvaluating] = useState(false);

  const q = questions[currentStep];

  const handleEvaluate = async () => {
    if (!studentAnswer.trim()) return;
    setIsEvaluating(true);
    try {
      const res = await apiClient.post(`/assignments/${id}/evaluate`, {
        question: q.text,
        studentAnswer,
        rubric: q.answerHint
      });
      if (res.data.success) {
        setEvaluations(prev => ({ ...prev, [currentStep]: res.data.evaluation }));
      }
    } catch {
      alert("AI Evaluator is currently busy. Please try again.");
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-10"
    >
      <div className="bg-white w-full max-w-5xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col h-[85vh] border border-white/20">
        {/* Header */}
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                <BrainCircuit className="w-6 h-6" />
             </div>
             <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Practice Mode</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Question {currentStep + 1} of {questions.length}</p>
             </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-200 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="h-1 w-full bg-slate-100">
           <motion.div 
             className="h-full bg-indigo-600"
             initial={{ width: 0 }}
             animate={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
           />
        </div>

        {/* Content */}
        <div className="flex-1 p-8 md:p-16 overflow-y-auto">
          <motion.div 
            key={currentStep} 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }}
            className="max-w-3xl mx-auto space-y-12"
          >
            <div>
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-4 block">Question Context</span>
               <h2 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
                 {q?.text}
               </h2>
            </div>
            
            <div className="space-y-6">
               <div className="relative group">
                  <div className="absolute -top-3 left-6 px-3 py-1 bg-white border border-slate-100 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest shadow-sm group-focus-within:text-indigo-600 transition-colors">Your Response</div>
                  <textarea 
                    className="w-full bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-3xl p-8 pt-10 text-slate-700 font-bold text-lg placeholder:text-slate-300 min-h-[200px] focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all outline-none resize-none" 
                    placeholder="Express your answer in detail..."
                    value={studentAnswer}
                    onChange={(e) => setStudentAnswer(e.target.value)}
                  />
               </div>
               
               <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confidence Score:</span>
                     <div className="flex gap-1">
                        {[1,2,3,4,5].map(s => <div key={s} className="w-3 h-1 bg-indigo-200 rounded-full"></div>)}
                     </div>
                  </div>
                  <button 
                    onClick={handleEvaluate}
                    disabled={isEvaluating || !studentAnswer.trim()}
                    className="px-8 py-3 bg-slate-900 text-white rounded-xl text-xs font-black flex items-center gap-3 hover:bg-slate-800 disabled:opacity-30 transition-all shadow-xl active:scale-95"
                  >
                    {isEvaluating ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Zap className="w-4 h-4"/>}
                    AI EVALUATE
                  </button>
               </div>
            </div>

            <AnimatePresence>
               {evaluations[currentStep] && (
                 <motion.div 
                    initial={{ opacity: 0, y: 20, scale: 0.95 }} 
                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                    className="relative p-8 rounded-[2.5rem] bg-indigo-50 border-2 border-indigo-100 shadow-xl shadow-indigo-100/50"
                 >
                    <div className="absolute -top-4 -right-4 w-16 h-16 bg-white rounded-3xl shadow-xl border border-indigo-50 flex flex-col items-center justify-center">
                       <span className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Score</span>
                       <span className="text-xl font-black text-indigo-600">{evaluations[currentStep].score}/{q.marks}</span>
                    </div>
                    
                    <h4 className="flex items-center gap-2 text-xs font-black uppercase text-indigo-600 tracking-widest mb-4">
                       <Zap className="w-3.5 h-3.5" /> AI Feedback Summary
                    </h4>
                    <p className="text-indigo-900 font-bold leading-relaxed italic text-lg pr-12">
                       &quot;{evaluations[currentStep].feedback}&quot;
                    </p>
                    
                    <div className="mt-6 flex items-center gap-2">
                       <div className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest",
                          evaluations[currentStep].status === 'Correct' ? 'bg-emerald-100 text-emerald-700' :
                          evaluations[currentStep].status === 'Partial' ? 'bg-amber-100 text-amber-700' :
                          'bg-rose-100 text-rose-700'
                       )}>
                          {evaluations[currentStep].status} Match
                       </div>
                    </div>
                 </motion.div>
               )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-slate-50 bg-slate-50/50 flex justify-between items-center">
          <button 
            disabled={currentStep === 0}
            onClick={() => {
              setCurrentStep(prev => prev - 1);
              setStudentAnswer("");
            }}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all disabled:opacity-0"
          >
             <ChevronLeft className="w-5 h-5" />
             Previous
          </button>
          <button 
            onClick={() => {
              if (currentStep < questions.length - 1) {
                setCurrentStep(prev => prev + 1);
                setStudentAnswer("");
              } else {
                onClose();
              }
            }}
            className="flex items-center gap-3 px-12 py-4 bg-slate-900 text-white rounded-full font-black text-lg shadow-2xl hover:bg-slate-800 transition-all active:scale-95"
          >
             {currentStep < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
             <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
