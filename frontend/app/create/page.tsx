"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import {
  CalendarPlus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Mic,
  Plus,
  Upload,
  X,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { config } from "@/lib/config";
import { useStore } from "../store/useStore";

const questionTypeOptions = [
  "Multiple Choice Questions",
  "Short Questions",
  "Diagram/Graph-Based Questions",
  "Numerical Problems",
  "Long Answer Questions",
  "Case Study Questions",
];

const createAssignmentSchema = z.object({
  subject: z.string().trim().min(2, "Subject is required"),
  className: z.string().trim().min(1, "Class is required"),
  dueDate: z.string().min(1, "Due date is required"),
  instructions: z.string().optional(),
  referenceText: z.string().optional(),
  referenceFileName: z.string().optional(),
  questionConfig: z
    .array(
      z.object({
        type: z.string().min(1),
        count: z.number().min(1),
        marks: z.number().min(1),
      }),
    )
    .min(1, "At least one question type is required"),
});

type CreateAssignmentForm = z.infer<typeof createAssignmentSchema>;

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: {
    transcript: string;
  };
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

const toIsoDate = (input?: string) => {
  if (!input) {
    return new Date().toISOString();
  }

  const parsedDate = new Date(input);
  if (Number.isNaN(parsedDate.getTime())) {
    return new Date().toISOString();
  }

  return parsedDate.toISOString();
};

const formatDueDateForDisplay = (input?: string) => {
  if (!input) {
    return "";
  }

  const parsedDate = new Date(input);
  if (Number.isNaN(parsedDate.getTime())) {
    return input;
  }

  return format(parsedDate, "dd-MM-yyyy");
};

const resolveReferenceMimeType = (file: File) => {
  const normalizedType = file.type.trim().toLowerCase();

  if (normalizedType === "application/pdf" || normalizedType === "text/plain") {
    return normalizedType;
  }

  const normalizedName = file.name.trim().toLowerCase();

  if (normalizedName.endsWith(".pdf")) {
    return "application/pdf";
  }

  if (normalizedName.endsWith(".txt")) {
    return "text/plain";
  }

  return null;
};

const getReferenceWordCount = (value?: string) => {
  const normalized = value?.trim();

  if (!normalized) {
    return 0;
  }

  return normalized.split(/\s+/).length;
};

export default function CreateAssignmentPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dueDateInputRef = useRef<HTMLInputElement | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [referenceUploadError, setReferenceUploadError] = useState("");
  const [referenceUploadMessage, setReferenceUploadMessage] = useState("");
  const [isExtractingReference, setIsExtractingReference] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const { incrementAssignmentCount, setCurrentAssignmentId, setProgress } = useStore();

  const {
    register,
    control,
    handleSubmit,
    watch,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<CreateAssignmentForm>({
    resolver: zodResolver(createAssignmentSchema),
    defaultValues: {
      subject: config.defaultAssignment.subject,
      className: config.defaultAssignment.className,
      dueDate: "",
      instructions: "",
      referenceText: "",
      referenceFileName: "",
      questionConfig: [
        { type: "Multiple Choice Questions", count: 4, marks: 1 },
        { type: "Short Questions", count: 3, marks: 2 },
        { type: "Diagram/Graph-Based Questions", count: 5, marks: 5 },
        { type: "Numerical Problems", count: 5, marks: 5 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "questionConfig",
  });

  const questionConfig = watch("questionConfig");
  const dueDateValue = watch("dueDate");
  const referenceText = watch("referenceText");
  const referenceFileName = watch("referenceFileName");
  const totalQuestions = questionConfig.reduce((acc, curr) => acc + (Number(curr.count) || 0), 0);
  const totalMarks = questionConfig.reduce((acc, curr) => acc + (Number(curr.count) || 0) * (Number(curr.marks) || 0), 0);

  const openDueDatePicker = () => {
    if (!dueDateInputRef.current) {
      return;
    }

    const inputElement = dueDateInputRef.current as HTMLInputElement & { showPicker?: () => void };

    if (typeof inputElement.showPicker === "function") {
      inputElement.showPicker();
      return;
    }

    dueDateInputRef.current.click();
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const RecognitionConstructor =
      (window as Window & { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ??
      (window as Window & { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;

    if (!RecognitionConstructor) {
      setIsSpeechSupported(false);
      return;
    }

    const recognition = new RecognitionConstructor();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-IN";

    recognition.onresult = (event) => {
      let transcript = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const spokenText = result?.[0]?.transcript ?? "";

        if (spokenText) {
          transcript += `${spokenText} `;
        }
      }

      transcript = transcript.trim();

      if (!transcript) {
        return;
      }

      const currentInstruction = getValues("instructions") ?? "";
      const separator = currentInstruction.trim() ? " " : "";

      setValue("instructions", `${currentInstruction}${separator}${transcript}`, {
        shouldDirty: true,
        shouldValidate: true,
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    speechRecognitionRef.current = recognition;
    setIsSpeechSupported(true);

    return () => {
      recognition.stop();
      speechRecognitionRef.current = null;
    };
  }, [getValues, setValue]);

  const handleMicToggle = () => {
    if (!speechRecognitionRef.current || !isSpeechSupported) {
      return;
    }

    if (isListening) {
      speechRecognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    speechRecognitionRef.current.start();
    setIsListening(true);
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    const referenceMimeType = resolveReferenceMimeType(selectedFile);

    setUploadedFileName(selectedFile.name);
    setReferenceUploadError("");
    setReferenceUploadMessage("");
    setValue("referenceFileName", selectedFile.name, { shouldDirty: true });

    if (!referenceMimeType) {
      setValue("referenceText", "", { shouldDirty: true });
      setValue("referenceFileName", "", { shouldDirty: true });
      setReferenceUploadError("Upload a PDF or TXT file so Veda can generate questions from it.");
      event.target.value = "";
      return;
    }

    try {
      setIsExtractingReference(true);

      const response = await apiClient.post<{
        success: boolean;
        data: {
          referenceText: string;
          wasTruncated: boolean;
        };
      }>("/assignments/extract-reference", await selectedFile.arrayBuffer(), {
        headers: {
          "Content-Type": referenceMimeType,
        },
        transformRequest: [(data) => data],
      });

      setValue("referenceText", response.data.data.referenceText, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setReferenceUploadMessage(
        response.data.data.wasTruncated
          ? "Reference extracted. The file was long, so the text was trimmed before generation."
          : "Reference extracted. Questions will stay grounded in this file.",
      );
    } catch (error) {
      console.error("Unable to extract reference material", error);
      setValue("referenceText", "", { shouldDirty: true });
      setValue("referenceFileName", "", { shouldDirty: true });
      setReferenceUploadError("Could not read this file. Upload a text-based PDF or TXT file.");
    } finally {
      setIsExtractingReference(false);
      event.target.value = "";
    }
  };

  const onSubmit = async (data: CreateAssignmentForm) => {
    if (isExtractingReference) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        subject: data.subject,
        className: data.className,
        dueDate: toIsoDate(data.dueDate),
        instructions: data.instructions ?? "",
        referenceText: data.referenceText ?? "",
        referenceFileName: data.referenceFileName ?? undefined,
        questionConfig: {
          types: data.questionConfig.map((questionType) => questionType.type),
          count: totalQuestions,
          totalMarks,
          detailedTypes: data.questionConfig,
        },
        difficultyConfig: {
          easy: 30,
          medium: 40,
          hard: 30,
        },
      };

      const response = await apiClient.post<{ data: { _id: string } }>("/assignments/create", payload);
      const assignmentId = response.data.data._id;

      incrementAssignmentCount();
      setCurrentAssignmentId(assignmentId);
      setProgress({ status: "GENERATING", step: "Waking up AI Engine...", percentage: 0 });
      router.push(`/output/${assignmentId}`);
    } catch (error) {
      console.error(error);
      alert("Failed to create assignment. Please check your configuration and retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-[900px] pb-10">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <h1 className="flex items-center gap-3 text-[34px] font-semibold leading-none tracking-[-0.045em] text-[#23262d]">
            <span className="h-3.5 w-3.5 rounded-full bg-[#58c877] shadow-[0_0_0_4px_rgba(88,200,119,0.12)]" />
            Create Assignment
          </h1>
          <p className="text-[15px] font-medium text-[#b1b5be]">Set up a new assignment for your students</p>
        </div>

        <div className="h-[5px] overflow-hidden rounded-full bg-[#e2e4e8]">
          <div className="h-full w-1/2 rounded-full bg-[#35383f] shadow-[0_2px_8px_rgba(53,56,63,0.12)]" />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-7">
        <input type="hidden" {...register("subject")} />
        <input type="hidden" {...register("className")} />
        <input type="hidden" {...register("referenceText")} />
        <input type="hidden" {...register("referenceFileName")} />

        <div className="rounded-[34px] border border-[#ebedf1] bg-[rgba(248,248,250,0.86)] p-6 shadow-[0_18px_40px_rgba(28,31,37,0.05)] backdrop-blur-[14px] sm:p-8">
          <h2 className="text-[26px] font-semibold tracking-[-0.035em] text-[#262a31]">Assignment Details</h2>
          <p className="text-[15px] text-[#a3a8b1]">Basic information about your assignment</p>

          <div className="mt-8 space-y-7">
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-[206px] w-full flex-col items-center justify-center rounded-[28px] border-2 border-dashed border-[#d9dde4] bg-white/78 px-6 text-center"
              >
                <Upload className="mb-4 h-6 w-6 text-[#2c3038]" strokeWidth={2.1} />
                <p className="text-[17px] font-semibold leading-6 text-[#2c3038]">
                  {isExtractingReference ? `Reading ${uploadedFileName}...` : uploadedFileName || "Upload a PDF or TXT reference"}
                </p>
                <p className="mt-1 text-[13px] text-[#a5aab3]">PDF, TXT upto 10MB</p>
                <span className="mt-5 inline-flex h-10 items-center rounded-full bg-[#f1f2f4] px-6 text-[15px] font-semibold text-[#4c5058] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                  Browse Files
                </span>
              </button>
              <input ref={fileInputRef} type="file" accept=".pdf,.txt" onChange={handleFileUpload} className="hidden" />
              {referenceUploadError ? (
                <p className="mt-3 text-center text-[14px] font-medium text-[#ef5f5f]">{referenceUploadError}</p>
              ) : referenceText ? (
                <p className="mt-3 text-center text-[14px] text-[#4f6675]">
                  {referenceFileName || uploadedFileName} ready. {getReferenceWordCount(referenceText)} words extracted. {referenceUploadMessage}
                </p>
              ) : (
                <p className="mt-3 text-center text-[15px] text-[#a7acb5]">
                  Upload a PDF or TXT reference. Questions will be generated from this source and refined by your additional instructions.
                </p>
              )}
            </div>

            <div className="space-y-2.5">
              <label className="text-[16px] font-semibold text-[#2b2f37]">Due Date</label>
              <div className="relative">
                {(() => {
                  const dueDateRegister = register("dueDate");

                  return (
                    <input
                      type="date"
                      {...dueDateRegister}
                      ref={(element) => {
                        dueDateRegister.ref(element);
                        dueDateInputRef.current = element;
                      }}
                      className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
                      aria-hidden="true"
                      tabIndex={-1}
                    />
                  );
                })()}

                <input
                  type="text"
                  readOnly
                  value={formatDueDateForDisplay(dueDateValue)}
                  onClick={openDueDatePicker}
                  placeholder="DD-MM-YYYY"
                  className="h-[46px] w-full cursor-pointer rounded-full border border-[#d9dde4] bg-white/80 px-5 pr-14 text-[15px] font-medium text-[#2f333b] outline-none placeholder:text-[#acb1ba]"
                />
                <button
                  type="button"
                  onClick={openDueDatePicker}
                  className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#dde1e8] bg-white text-[#585d66]"
                >
                  <CalendarPlus className="h-4 w-4" />
                </button>
              </div>
              {errors.dueDate && <p className="text-xs font-medium text-[#f16767]">{errors.dueDate.message}</p>}
            </div>

            <div className="space-y-3">
              <div className="overflow-x-auto pb-1">
                <div className="min-w-[700px] space-y-3">
                  <div className="grid grid-cols-[minmax(0,1fr)_28px_112px_104px] items-center gap-3 px-1">
                    <h3 className="text-[16px] font-semibold text-[#2c3038]">Question Type</h3>
                    <span />
                    <p className="text-center text-[16px] font-semibold text-[#2c3038]">No. of Questions</p>
                    <p className="text-center text-[16px] font-semibold text-[#2c3038]">Marks</p>
                  </div>

                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="grid grid-cols-[minmax(0,1fr)_28px_112px_104px] items-center gap-3"
                      >
                        <div className="relative">
                          <select
                            {...register(`questionConfig.${index}.type`)}
                            className="h-12 w-full appearance-none rounded-full border border-[#dfe3ea] bg-white/82 px-5 pr-10 text-[15px] font-medium text-[#2b2f37] outline-none"
                          >
                            {questionTypeOptions.map((questionTypeOption) => (
                              <option key={questionTypeOption} value={questionTypeOption}>
                                {questionTypeOption}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7f848d]" />
                        </div>

                        <button
                          type="button"
                          onClick={() => remove(index)}
                          disabled={fields.length === 1}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-[#5a5e67] transition hover:bg-white/90 disabled:opacity-30"
                        >
                          <X className="h-4 w-4" />
                        </button>

                        <CounterPill
                          value={watch(`questionConfig.${index}.count`) || 1}
                          onMinus={() =>
                            setValue(
                              `questionConfig.${index}.count`,
                              Math.max(1, Number(watch(`questionConfig.${index}.count`) || 1) - 1),
                            )
                          }
                          onPlus={() =>
                            setValue(`questionConfig.${index}.count`, Number(watch(`questionConfig.${index}.count`) || 1) + 1)
                          }
                        />

                        <CounterPill
                          value={watch(`questionConfig.${index}.marks`) || 1}
                          onMinus={() =>
                            setValue(
                              `questionConfig.${index}.marks`,
                              Math.max(1, Number(watch(`questionConfig.${index}.marks`) || 1) - 1),
                            )
                          }
                          onPlus={() =>
                            setValue(`questionConfig.${index}.marks`, Number(watch(`questionConfig.${index}.marks`) || 1) + 1)
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => append({ type: questionTypeOptions[0], count: 5, marks: 4 })}
                className="inline-flex items-center gap-3 pt-1 text-[17px] font-semibold text-[#2d3139]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1a1d24] text-white shadow-[0_10px_18px_rgba(26,29,36,0.16)]">
                  <Plus className="h-4 w-4" />
                </span>
                Add Question Type
              </button>

              <div className="space-y-1 pr-1 text-right text-[17px] font-semibold text-[#444952]">
                <p>
                  Total Questions : <span className="text-[#2a2d35]">{totalQuestions}</span>
                </p>
                <p>
                  Total Marks : <span className="text-[#2a2d35]">{totalMarks}</span>
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="text-[16px] font-semibold text-[#2b2f37]">Additional Information (For better output)</label>
              <div className="relative">
                <textarea
                  {...register("instructions")}
                  rows={3}
                  placeholder="e.g Generate a question paper for 3 hour exam duration..."
                  className="h-[104px] w-full resize-none rounded-[22px] border border-[#dfe3ea] bg-white/80 px-5 py-4 pr-12 text-[15px] text-[#2a2d35] outline-none placeholder:text-[#a7abb4]"
                />
                <button
                  type="button"
                  onClick={handleMicToggle}
                  disabled={!isSpeechSupported}
                  aria-label="Start voice input"
                  className="absolute bottom-3 right-3 rounded-full p-1.5 text-[#7b7f87] transition hover:bg-[#eef0f4] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Mic className={`h-4 w-4 ${isListening ? "text-[#ef5f5f]" : "text-[#7b7f87]"}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <Link
            href="/assignments"
            className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-[15px] font-semibold text-[#464a53] shadow-[0_10px_20px_rgba(31,36,41,0.05)]"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Link>

          <button
            type="submit"
            disabled={isSubmitting || isExtractingReference}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-[#12151c] px-8 text-[15px] font-semibold text-white shadow-[0_14px_24px_rgba(18,21,28,0.18)] disabled:opacity-60"
          >
            {isSubmitting ? "Generating..." : isExtractingReference ? "Reading Reference..." : "Next"}
            {!isSubmitting && !isExtractingReference && <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </form>
    </section>
  );
}

interface CounterPillProps {
  value: number;
  onMinus: () => void;
  onPlus: () => void;
}

function CounterPill({ value, onMinus, onPlus }: CounterPillProps) {
  return (
    <div className="flex h-12 items-center justify-between rounded-full border border-[#dfe3ea] bg-white/82 px-2">
      <button
        type="button"
        onClick={onMinus}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f1f3f6] text-sm font-semibold text-[#80858e]"
      >
        -
      </button>
      <span className="text-[15px] font-semibold text-[#30343c]">{value}</span>
      <button
        type="button"
        onClick={onPlus}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f1f3f6] text-sm font-semibold text-[#80858e]"
      >
        +
      </button>
    </div>
  );
}
