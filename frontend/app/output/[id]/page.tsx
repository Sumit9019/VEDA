"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import io from "socket.io-client";
import { Download, FileText, RefreshCw, TriangleAlert } from "lucide-react";
import QuestionPaper, { SectionData } from "@/components/Output/QuestionPaper";
import { apiClient, getApiUrl } from "@/lib/api";
import { config } from "@/lib/config";
import { useStore } from "../../store/useStore";

interface GenerationProgress {
  percentage: number;
  progress?: number;
  step: string;
  status: "PENDING" | "GENERATING" | "COMPLETED" | "FAILED";
  error: string | null;
}

interface OutputAssignment {
  status?: "PENDING" | "GENERATING" | "COMPLETED" | "FAILED";
  subject?: string;
  className?: string;
  questionConfig?: {
    totalMarks?: number;
    duration?: number;
  };
}

interface OutputQuestion {
  text: string;
  marks?: number;
  difficulty?: string;
  answerHint?: string;
}

interface OutputSection {
  title: string;
  instruction: string;
  questions: OutputQuestion[];
}

interface OutputResult {
  pdfUrl?: string;
  answerKeyPdfUrl?: string;
  docxUrl?: string;
  sections: OutputSection[];
}

const initialProgress: GenerationProgress = {
  percentage: 0,
  step: "Connecting...",
  status: "PENDING",
  error: null,
};

const formatGradeLabel = (value?: string | null) => {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return "5";
  }

  return normalized.replace(/^class\s+/i, "").trim();
};

const formatPaperClassLabel = (value?: string | null) => {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return "5";
  }

  return normalized.replace(/^class:\s*/i, "").replace(/^class\s+/i, "").trim();
};

export default function OutputPage() {
  const params = useParams<{ id: string }>();
  const assignmentId = params.id;
  const { assignment, generatedResult, setAssignment, setGeneratedResult } = useStore();
  const assignmentData = (assignment ?? null) as OutputAssignment | null;
  const resultData = (generatedResult ?? null) as OutputResult | null;

  const [isLoading, setIsLoading] = useState(true);
  const [isPdfPreparing, setIsPdfPreparing] = useState(false);
  const [isAnswerKeyPreparing, setIsAnswerKeyPreparing] = useState(false);
  const [isDocxPreparing, setIsDocxPreparing] = useState(false);
  const [editableSections, setEditableSections] = useState<SectionData[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingEdits, setIsSavingEdits] = useState(false);
  const [isRegeneratingQuestion, setIsRegeneratingQuestion] = useState<string | null>(null);
  const [isRegeneratingSection, setIsRegeneratingSection] = useState<number | null>(null);
  const [progress, setProgress] = useState<GenerationProgress>(initialProgress);

  const fetchAssignmentData = useCallback(async () => {
    try {
      const response = await apiClient.get(`/assignments/${assignmentId}`);

      if (response.data.success) {
        const assignmentData = response.data.data.assignment;
        const resultData = response.data.data.result;

        setAssignment(assignmentData);
        setGeneratedResult(resultData);
        setEditableSections(resultData?.sections ?? []);

        if (assignmentData.status === "COMPLETED") {
          setProgress({ percentage: 100, step: "Ready", status: "COMPLETED", error: null });
        } else if (assignmentData.status === "FAILED") {
          setProgress((current) => ({ ...current, status: "FAILED" }));
        } else {
          setProgress((current) => ({
            ...current,
            status: "GENERATING",
            step: current.step === "Connecting..." ? "Building your assignment..." : current.step,
          }));
        }
      }
    } catch (error) {
      console.error("Failed to load assignment output", error);
      setProgress((current) => ({ ...current, status: "FAILED", error: "Unable to load assignment output" }));
    } finally {
      setIsLoading(false);
    }
  }, [assignmentId, setAssignment, setGeneratedResult]);

  useEffect(() => {
    if (!assignmentId) {
      return;
    }

    const socket = io(config.socketUrl);
    void fetchAssignmentData();

    socket.on("connect", () => {
      socket.emit("join-assignment", assignmentId);
    });

    socket.on("generation-progress", (data: Partial<GenerationProgress>) => {
      const nextPercentage =
        typeof data.percentage === "number"
          ? data.percentage
          : typeof data.progress === "number"
            ? data.progress
            : 0;

      const nextStatus =
        data.status ?? (nextPercentage >= 100 ? "COMPLETED" : "GENERATING");

      setProgress((current) => ({
        ...current,
        percentage: nextPercentage,
        step: data.step ?? current.step,
        status: nextStatus,
        error: null,
      }));

      if (nextStatus === "COMPLETED") {
        void fetchAssignmentData();
      }
    });

    socket.on("generation-failed", (data: { error: string }) => {
      setProgress((current) => ({ ...current, status: "FAILED", error: data.error }));
    });

    return () => {
      socket.disconnect();
    };
  }, [assignmentId, fetchAssignmentData]);

  const handleRegenerate = async () => {
    try {
      setProgress({ percentage: 0, step: "Restarting generation...", status: "GENERATING", error: null });
      await apiClient.patch(`/assignments/${assignmentId}/regenerate`);
      await fetchAssignmentData();
    } catch (error) {
      console.error(error);
      setProgress((current) => ({
        ...current,
        status: "FAILED",
        error: "Unable to trigger regeneration",
      }));
    }
  };

  const gradeLabel = formatGradeLabel(assignmentData?.className);
  const paperClassLabel = formatPaperClassLabel(assignmentData?.className);
  const previewAssignment = assignmentData ? { ...assignmentData, className: paperClassLabel } : { className: paperClassLabel };

  const handleDownloadPdf = async () => {
    if (!assignmentId || isPdfPreparing) {
      return;
    }

    try {
      setIsPdfPreparing(true);
      const response = await apiClient.get<{ success: boolean; data: { pdfUrl: string } }>(`/assignments/${assignmentId}/pdf`);

      if (response.data.success) {
        const freshPdfUrl = getApiUrl(response.data.data.pdfUrl);
        window.open(`${freshPdfUrl}?v=${Date.now()}`, "_blank", "noopener,noreferrer");
        await fetchAssignmentData();
      }
    } catch (error) {
      console.error("Unable to prepare PDF", error);
      alert("Failed to prepare PDF. Please try again.");
    } finally {
      setIsPdfPreparing(false);
    }
  };

  const handleDownloadAnswerKey = async () => {
    if (!assignmentId || isAnswerKeyPreparing) {
      return;
    }

    try {
      setIsAnswerKeyPreparing(true);
      const response = await apiClient.get<{ success: boolean; data: { pdfUrl: string } }>(
        `/assignments/${assignmentId}/pdf?variant=answer-key`,
      );

      if (response.data.success) {
        const freshPdfUrl = getApiUrl(response.data.data.pdfUrl);
        window.open(`${freshPdfUrl}?v=${Date.now()}`, "_blank", "noopener,noreferrer");
        await fetchAssignmentData();
      }
    } catch (error) {
      console.error("Unable to prepare answer key PDF", error);
      alert("Failed to prepare answer key PDF. Please try again.");
    } finally {
      setIsAnswerKeyPreparing(false);
    }
  };

  const handleDownloadDocx = async () => {
    if (!assignmentId || isDocxPreparing) {
      return;
    }

    try {
      setIsDocxPreparing(true);
      const response = await apiClient.get<{ success: boolean; data: { docxUrl: string } }>(`/assignments/${assignmentId}/docx`);

      if (response.data.success) {
        const freshDocxUrl = getApiUrl(response.data.data.docxUrl);
        window.open(`${freshDocxUrl}?v=${Date.now()}`, "_blank", "noopener,noreferrer");
        await fetchAssignmentData();
      }
    } catch (error) {
      console.error("Unable to prepare DOCX", error);
      alert("Failed to prepare DOCX. Please try again.");
    } finally {
      setIsDocxPreparing(false);
    }
  };

  const handleSaveEdits = async () => {
    if (!assignmentId) {
      return;
    }

    try {
      setIsSavingEdits(true);
      const response = await apiClient.patch<{ success: boolean; data: OutputResult }>(`/assignments/${assignmentId}/result`, {
        sections: editableSections,
      });

      if (response.data.success) {
        setGeneratedResult(response.data.data);
        setEditableSections(response.data.data.sections ?? []);
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Unable to save edits", error);
      alert("Failed to save edits. Please review the paper and try again.");
    } finally {
      setIsSavingEdits(false);
    }
  };

  const handleRegenerateQuestion = async (sectionIndex: number, questionIndex: number) => {
    if (!assignmentId) {
      return;
    }

    const questionKey = `${sectionIndex}-${questionIndex}`;

    try {
      setIsRegeneratingQuestion(questionKey);
      const response = await apiClient.patch<{ success: boolean; newText: string }>(`/assignments/${assignmentId}/swap-question`, {
        sectionIndex,
        questionIndex,
      });

      if (response.data.success) {
        const updatedSections = editableSections.map((section, currentSectionIndex) =>
          currentSectionIndex === sectionIndex
            ? {
                ...section,
                questions: section.questions.map((question, currentQuestionIndex) =>
                  currentQuestionIndex === questionIndex ? { ...question, text: response.data.newText } : question,
                ),
              }
            : section,
        );

        setEditableSections(updatedSections);
        setGeneratedResult({ ...(resultData ?? { sections: [] }), sections: updatedSections });
      }
    } catch (error) {
      console.error("Unable to regenerate question", error);
      alert("Failed to regenerate this question. Please try again.");
    } finally {
      setIsRegeneratingQuestion(null);
    }
  };

  const handleRegenerateSection = async (sectionIndex: number) => {
    if (!assignmentId) {
      return;
    }

    try {
      setIsRegeneratingSection(sectionIndex);
      const response = await apiClient.patch<{ success: boolean; data: OutputResult }>(
        `/assignments/${assignmentId}/regenerate-section`,
        {
          sectionIndex,
        },
      );

      if (response.data.success) {
        setGeneratedResult(response.data.data);
        setEditableSections(response.data.data.sections ?? []);
      }
    } catch (error) {
      console.error("Unable to regenerate section", error);
      alert("Failed to regenerate this section. Please try again.");
    } finally {
      setIsRegeneratingSection(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center gap-3">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[#181a1f]" />
        <p className="text-sm text-[#8e929b]">Preparing assignment output...</p>
      </div>
    );
  }

  const paperResult = isEditing ? { ...(resultData ?? { sections: [] }), sections: editableSections } : resultData;

  return (
    <section className="mx-auto w-full max-w-[1380px] space-y-5 pb-10">
      {(progress.status === "PENDING" || progress.status === "GENERATING") && (
        <div className="rounded-[30px] border border-[#e4e7ec] bg-white p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#eef0f5] text-[#3a3d44]">
            <RefreshCw className="h-5 w-5 animate-spin" />
          </div>
          <h2 className="text-2xl font-semibold text-[#1f2126]">Generating Assignment</h2>
          <p className="mt-2 text-sm text-[#90949c]">{progress.step}</p>

          <div className="mx-auto mt-4 h-2 w-full max-w-md overflow-hidden rounded-full bg-[#ecedf1]">
            <div className="h-full rounded-full bg-[#1f2229] transition-all" style={{ width: `${Math.max(8, progress.percentage)}%` }} />
          </div>
        </div>
      )}

      {progress.status === "FAILED" && (
        <div className="rounded-[30px] border border-[#ffd7d7] bg-[#fff4f4] p-8 text-center">
          <TriangleAlert className="mx-auto h-7 w-7 text-[#e15f5f]" />
          <h2 className="mt-3 text-2xl font-semibold text-[#2b2f35]">Generation Interrupted</h2>
          <p className="mt-2 text-sm text-[#9b7b7b]">{progress.error ?? "Something went wrong while generating this assignment."}</p>
          <button
            onClick={handleRegenerate}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#17191f] px-5 py-2.5 text-sm font-semibold text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      )}

      {progress.status === "COMPLETED" && resultData && (
        <>
          <div className="rounded-[32px] bg-[#242529] px-7 py-7 text-white shadow-[0_24px_40px_rgba(0,0,0,0.2)] md:px-8 md:py-8">
            <p className="max-w-[980px] text-[24px] font-semibold leading-[1.28] md:text-[29px]">
              Certainly, {config.currentUser.name}! Here are customized Question Paper for your CBSE Grade {gradeLabel}{" "}
              {assignmentData?.subject ?? config.defaultAssignment.subject} classes on the NCERT chapters:
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void handleDownloadPdf()}
                aria-label="Download PDF"
                disabled={isPdfPreparing}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white disabled:opacity-60 md:hidden"
              >
                <Download className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => void handleDownloadAnswerKey()}
                aria-label="Download answer key PDF"
                disabled={isAnswerKeyPreparing}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white disabled:opacity-60 md:hidden"
              >
                <RefreshCw className={`h-5 w-5 ${isAnswerKeyPreparing ? "animate-spin" : ""}`} />
              </button>
              <button
                type="button"
                onClick={() => void handleDownloadDocx()}
                aria-label="Download DOCX"
                disabled={isDocxPreparing}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white disabled:opacity-60 md:hidden"
              >
                <FileText className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => void handleDownloadPdf()}
                disabled={isPdfPreparing}
                className="hidden items-center gap-2 rounded-full bg-white px-5 py-2 text-[14px] font-semibold text-[#1f2228] disabled:opacity-60 md:inline-flex"
              >
                <Download className="h-[15px] w-[15px]" />
                {isPdfPreparing ? "Preparing PDF..." : "Download as PDF"}
              </button>
              <button
                type="button"
                onClick={() => void handleDownloadAnswerKey()}
                disabled={isAnswerKeyPreparing}
                className="hidden items-center gap-2 rounded-full bg-white/12 px-5 py-2 text-[14px] font-semibold text-white disabled:opacity-60 md:inline-flex"
              >
                <Download className="h-[15px] w-[15px]" />
                {isAnswerKeyPreparing ? "Preparing Answer Key..." : "Answer Key PDF"}
              </button>
              <button
                type="button"
                onClick={() => void handleDownloadDocx()}
                disabled={isDocxPreparing}
                className="hidden items-center gap-2 rounded-full border border-white/20 px-5 py-2 text-[14px] font-semibold text-white disabled:opacity-60 md:inline-flex"
              >
                <FileText className="h-[15px] w-[15px]" />
                {isDocxPreparing ? "Preparing DOCX..." : "Export DOCX"}
              </button>
            </div>
          </div>

          <QuestionPaper
            assignment={previewAssignment}
            result={paperResult}
            isEditing={isEditing}
            isSaving={isSavingEdits}
            isRegeneratingQuestion={isRegeneratingQuestion}
            isRegeneratingSection={isRegeneratingSection}
            onStartEditing={() => {
              setEditableSections(resultData?.sections ?? []);
              setIsEditing(true);
            }}
            onCancelEditing={() => {
              setEditableSections(resultData?.sections ?? []);
              setIsEditing(false);
            }}
            onSaveEditing={() => void handleSaveEdits()}
            onResultChange={(updater) => setEditableSections((current) => updater(current))}
            onRegenerateQuestion={(sectionIndex, questionIndex) => void handleRegenerateQuestion(sectionIndex, questionIndex)}
            onRegenerateSection={(sectionIndex) => void handleRegenerateSection(sectionIndex)}
          />
        </>
      )}
    </section>
  );
}
