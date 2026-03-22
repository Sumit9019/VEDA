"use client";

import { ArrowDown, ArrowUp, LoaderCircle, Pencil, RotateCcw, Save, Trash2, X } from "lucide-react";
import { useState } from "react";
import { config } from "@/lib/config";

interface AssignmentData {
  subject?: string;
  className?: string;
  questionConfig?: {
    totalMarks?: number;
    duration?: number;
  };
}

export interface QuestionData {
  text: string;
  marks?: number;
  difficulty?: string;
  answerHint?: string;
}

export interface SectionData {
  title: string;
  instruction: string;
  questions: QuestionData[];
}

interface ResultData {
  sections: SectionData[];
}

interface QuestionPaperProps {
  assignment: AssignmentData | null;
  result: ResultData | null;
  isEditing: boolean;
  isSaving: boolean;
  isRegeneratingQuestion: string | null;
  isRegeneratingSection: number | null;
  onStartEditing: () => void;
  onCancelEditing: () => void;
  onSaveEditing: () => void;
  onResultChange: (updater: (sections: SectionData[]) => SectionData[]) => void;
  onRegenerateQuestion: (sectionIndex: number, questionIndex: number) => void;
  onRegenerateSection: (sectionIndex: number) => void;
}

const difficultyLabelMap: Record<string, string> = {
  easy: "Easy",
  medium: "Moderate",
  hard: "Challenging",
};

const difficultyBadgeMap: Record<string, string> = {
  easy: "bg-[#e8f7ed] text-[#1f7a3d]",
  medium: "bg-[#fff4df] text-[#946200]",
  hard: "bg-[#fde7e7] text-[#b24040]",
};

const normalizeSectionTitle = (title: string) => {
  if (title.includes(":")) {
    return title.split(":")[1].trim();
  }

  return title;
};

export default function QuestionPaper({
  assignment,
  result,
  isEditing,
  isSaving,
  isRegeneratingQuestion,
  isRegeneratingSection,
  onStartEditing,
  onCancelEditing,
  onSaveEditing,
  onResultChange,
  onRegenerateQuestion,
  onRegenerateSection,
}: QuestionPaperProps) {
  const [expandedHints, setExpandedHints] = useState<Record<string, boolean>>({});

  if (!result?.sections?.length) {
    return null;
  }

  const totalMarks = assignment?.questionConfig?.totalMarks ?? 20;
  const durationInMinutes = assignment?.questionConfig?.duration ?? 45;
  const subject = assignment?.subject ?? "English";
  const className = assignment?.className ?? "5th";

  const updateSectionField = (sectionIndex: number, field: "title" | "instruction", value: string) => {
    onResultChange((sections) =>
      sections.map((section, currentSectionIndex) =>
        currentSectionIndex === sectionIndex ? { ...section, [field]: value } : section,
      ),
    );
  };

  const updateQuestionField = (
    sectionIndex: number,
    questionIndex: number,
    field: "text" | "marks" | "difficulty" | "answerHint",
    value: string,
  ) => {
    onResultChange((sections) =>
      sections.map((section, currentSectionIndex) => {
        if (currentSectionIndex !== sectionIndex) {
          return section;
        }

        return {
          ...section,
          questions: section.questions.map((question, currentQuestionIndex) => {
            if (currentQuestionIndex !== questionIndex) {
              return question;
            }

            if (field === "marks") {
              return { ...question, marks: Number(value) || 1 };
            }

            return { ...question, [field]: value };
          }),
        };
      }),
    );
  };

  const moveQuestion = (sectionIndex: number, questionIndex: number, direction: "up" | "down") => {
    onResultChange((sections) =>
      sections.map((section, currentSectionIndex) => {
        if (currentSectionIndex !== sectionIndex) {
          return section;
        }

        const nextQuestions = [...section.questions];
        const targetIndex = direction === "up" ? questionIndex - 1 : questionIndex + 1;

        if (targetIndex < 0 || targetIndex >= nextQuestions.length) {
          return section;
        }

        const [movedQuestion] = nextQuestions.splice(questionIndex, 1);
        nextQuestions.splice(targetIndex, 0, movedQuestion);

        return { ...section, questions: nextQuestions };
      }),
    );
  };

  const deleteQuestion = (sectionIndex: number, questionIndex: number) => {
    onResultChange((sections) =>
      sections
        .map((section, currentSectionIndex) => {
          if (currentSectionIndex !== sectionIndex) {
            return section;
          }

          return {
            ...section,
            questions: section.questions.filter((_, currentQuestionIndex) => currentQuestionIndex !== questionIndex),
          };
        })
        .filter((section) => section.questions.length > 0),
    );
  };

  return (
    <div className="rounded-[34px] border border-[#ececef] bg-white px-6 py-7 text-[#24272f] shadow-[0_20px_38px_rgba(30,32,37,0.08)] md:px-9 md:py-9 lg:px-10">
      <div className="space-y-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-0.5 text-center md:text-left">
            <h2 className="text-[34px] font-semibold tracking-[-0.045em] text-[#24272f] md:text-[38px]">
              {config.paper.schoolHeading}
            </h2>
            <p className="text-[18px] font-semibold text-[#2f3138] md:text-[20px]">Subject: {subject}</p>
            <p className="text-[18px] font-semibold text-[#2f3138] md:text-[20px]">Class: {className}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={onCancelEditing}
                  className="inline-flex items-center gap-2 rounded-full border border-[#d4d7de] px-4 py-2 text-sm font-semibold text-[#31343a]"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onSaveEditing}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-full bg-[#191b20] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {isSaving ? "Saving..." : "Save Draft"}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onStartEditing}
                className="inline-flex items-center gap-2 rounded-full border border-[#d4d7de] px-4 py-2 text-sm font-semibold text-[#31343a]"
              >
                <Pencil className="h-4 w-4" />
                Edit Before Export
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-[15px] font-semibold text-[#2e3138] md:text-[17px]">
          <p>Time Allowed: {durationInMinutes} minutes</p>
          <p>Maximum Marks: {totalMarks}</p>
        </div>

        <div className="space-y-2 text-[15px] font-medium text-[#2d3037] md:text-[16px]">
          <p>All questions are compulsory unless stated otherwise.</p>
          <p>
            Name:<span className="ml-2 inline-block w-[220px] border-b-[1.5px] border-[#787c85]" />
          </p>
          <p>
            Roll Number:<span className="ml-2 inline-block w-[190px] border-b-[1.5px] border-[#787c85]" />
          </p>
          <p>
            Class: {className} Section:<span className="ml-2 inline-block w-[120px] border-b-[1.5px] border-[#787c85]" />
          </p>
        </div>

        {result.sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="space-y-4 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-center text-[32px] font-semibold tracking-[-0.04em] text-[#2a2d34] md:text-[42px]">
                Section {String.fromCharCode(65 + sectionIndex)}
              </h3>
              <button
                type="button"
                onClick={() => onRegenerateSection(sectionIndex)}
                disabled={isRegeneratingSection === sectionIndex}
                className="inline-flex items-center gap-2 rounded-full border border-[#d4d7de] px-4 py-2 text-sm font-semibold text-[#31343a] disabled:opacity-60"
              >
                {isRegeneratingSection === sectionIndex ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                {isRegeneratingSection === sectionIndex ? "Refreshing..." : "Regenerate Section"}
              </button>
            </div>

            <div className="space-y-2">
              {isEditing ? (
                <>
                  <input
                    value={section.title}
                    onChange={(event) => updateSectionField(sectionIndex, "title", event.target.value)}
                    className="w-full rounded-2xl border border-[#d9dde5] px-4 py-3 text-[18px] font-semibold text-[#2c2f36] outline-none"
                  />
                  <textarea
                    value={section.instruction}
                    onChange={(event) => updateSectionField(sectionIndex, "instruction", event.target.value)}
                    className="min-h-[86px] w-full rounded-2xl border border-[#d9dde5] px-4 py-3 text-[15px] italic text-[#5f636d] outline-none"
                  />
                </>
              ) : (
                <>
                  <p className="text-[18px] font-semibold text-[#2c2f36] md:text-[19px]">{normalizeSectionTitle(section.title)}</p>
                  <p className="text-[15px] italic text-[#5f636d] md:text-[16px]">
                    {section.instruction || "Attempt all questions. Each question carries 2 marks"}
                  </p>
                </>
              )}
            </div>

            <ol className="space-y-3 pl-0 text-[15px] leading-[1.65] text-[#2b2e35] md:text-[16px]">
              {section.questions.map((question, questionIndex) => {
                const questionKey = `${sectionIndex}-${questionIndex}`;

                return (
                  <li key={questionKey} className="list-none rounded-[26px] border border-[#eceef3] bg-[#fbfbfc] p-4 md:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#eef1f5] px-2.5 py-1 text-xs font-semibold text-[#4a4e57]">
                          Q{questionIndex + 1}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            difficultyBadgeMap[question.difficulty ?? "medium"] ?? difficultyBadgeMap.medium
                          }`}
                        >
                          {difficultyLabelMap[question.difficulty ?? "medium"] ?? "Moderate"}
                        </span>
                        <span className="rounded-full bg-[#eef1f5] px-2.5 py-1 text-xs font-semibold text-[#4a4e57]">
                          {question.marks ?? 2} Marks
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {isEditing && (
                          <>
                            <button
                              type="button"
                              onClick={() => moveQuestion(sectionIndex, questionIndex, "up")}
                              disabled={questionIndex === 0}
                              className="rounded-full border border-[#d4d7de] p-2 text-[#3c4047] disabled:opacity-40"
                              aria-label="Move question up"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveQuestion(sectionIndex, questionIndex, "down")}
                              disabled={questionIndex === section.questions.length - 1}
                              className="rounded-full border border-[#d4d7de] p-2 text-[#3c4047] disabled:opacity-40"
                              aria-label="Move question down"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteQuestion(sectionIndex, questionIndex)}
                              disabled={section.questions.length === 1}
                              className="rounded-full border border-[#ffd7d7] p-2 text-[#c34d4d] disabled:opacity-40"
                              aria-label="Delete question"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => onRegenerateQuestion(sectionIndex, questionIndex)}
                          disabled={isRegeneratingQuestion === questionKey}
                          className="inline-flex items-center gap-2 rounded-full border border-[#d4d7de] px-3 py-2 text-sm font-semibold text-[#31343a] disabled:opacity-60"
                        >
                          {isRegeneratingQuestion === questionKey ? (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                          ) : (
                            <RotateCcw className="h-4 w-4" />
                          )}
                          {isRegeneratingQuestion === questionKey ? "Refreshing..." : "Regenerate"}
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {isEditing ? (
                        <>
                          <textarea
                            value={question.text}
                            onChange={(event) => updateQuestionField(sectionIndex, questionIndex, "text", event.target.value)}
                            className="min-h-[100px] w-full rounded-2xl border border-[#d9dde5] px-4 py-3 text-[15px] text-[#2b2e35] outline-none"
                          />
                          <div className="grid gap-3 md:grid-cols-3">
                            <select
                              value={question.difficulty ?? "medium"}
                              onChange={(event) => updateQuestionField(sectionIndex, questionIndex, "difficulty", event.target.value)}
                              className="rounded-2xl border border-[#d9dde5] px-4 py-3 text-sm text-[#2b2e35] outline-none"
                            >
                              <option value="easy">Easy</option>
                              <option value="medium">Moderate</option>
                              <option value="hard">Challenging</option>
                            </select>
                            <input
                              type="number"
                              min={1}
                              value={question.marks ?? 1}
                              onChange={(event) => updateQuestionField(sectionIndex, questionIndex, "marks", event.target.value)}
                              className="rounded-2xl border border-[#d9dde5] px-4 py-3 text-sm text-[#2b2e35] outline-none"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedHints((current) => ({ ...current, [questionKey]: !current[questionKey] }))
                              }
                              className="rounded-2xl border border-[#d9dde5] px-4 py-3 text-sm font-semibold text-[#31343a]"
                            >
                              {expandedHints[questionKey] ? "Hide Answer Hint" : "Edit Answer Hint"}
                            </button>
                          </div>
                          {expandedHints[questionKey] && (
                            <textarea
                              value={question.answerHint ?? ""}
                              onChange={(event) =>
                                updateQuestionField(sectionIndex, questionIndex, "answerHint", event.target.value)
                              }
                              className="min-h-[90px] w-full rounded-2xl border border-[#d9dde5] px-4 py-3 text-[14px] text-[#51606f] outline-none"
                            />
                          )}
                        </>
                      ) : (
                        <>
                          <p>{question.text}</p>
                          <p className="text-sm text-[#667281]">{question.answerHint || "Answer guidance generated by VedaAI."}</p>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}
