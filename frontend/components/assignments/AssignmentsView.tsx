"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { EllipsisVertical, Filter, Plus, Search } from "lucide-react";
import { useStore } from "@/app/store/useStore";
import { apiClient } from "@/lib/api";

type AssignmentStatus = "PENDING" | "GENERATING" | "COMPLETED" | "FAILED";

interface AssignmentItem {
  _id: string;
  title?: string;
  subject: string;
  className: string;
  status: AssignmentStatus;
  createdAt: string;
  dueDate?: string;
}

const fallbackCardTitle = (assignment: AssignmentItem) => `Quiz on ${assignment.subject}`;

const EmptyState = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <section className="min-h-[calc(100vh-132px)] overflow-hidden rounded-[34px]">
    <div className="relative flex min-h-[calc(100vh-132px)] items-center justify-center px-4 py-10 sm:px-8 lg:py-14">
      <div className="max-w-[620px] text-center">
        <div className="mx-auto w-full max-w-[300px]">
          <div className="relative aspect-square w-full">
            <Image
              src="/Illustrations.png"
              alt=""
              aria-hidden="true"
              width={300}
              height={300}
              sizes="300px"
              unoptimized
              className="h-auto w-full"
              priority
            />
          </div>
        </div>

        <h1 className="mt-3 text-[34px] font-semibold tracking-[-0.04em] text-[#2b2d34] sm:text-[38px]">
          {title}
        </h1>

        <p className="mx-auto mt-3 max-w-[600px] text-[16px] leading-[1.55] text-[#8c8f96] sm:text-[17px]">
          {description}
        </p>

        <Link
          href="/create"
          className="mx-auto mt-8 inline-flex h-14 items-center gap-2 rounded-full bg-[#191b1f] px-8 text-[15px] font-semibold text-white shadow-[0_14px_28px_rgba(17,20,24,0.18)] transition hover:opacity-95"
        >
          <Plus className="h-4 w-4" />
          Create Your First Assignment
        </Link>
      </div>
    </div>
  </section>
);

export default function AssignmentsView() {
  const { setAssignmentCount } = useStore();
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const handleDeleteAssignment = async (assignmentId: string) => {
    const isConfirmed = window.confirm("Are you sure you want to delete this assignment?");

    if (!isConfirmed) {
      return;
    }

    try {
      await apiClient.delete(`/assignments/${assignmentId}`);
      setAssignments((currentAssignments) =>
        currentAssignments.filter((assignment) => assignment._id !== assignmentId),
      );
      setActiveMenuId(null);
    } catch (error) {
      console.error("Unable to delete assignment", error);
      alert("Failed to delete assignment. Please try again.");
    }
  };

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await apiClient.get<{ success: boolean; list: AssignmentItem[] }>("/assignments");

        if (response.data.success) {
          setAssignments(response.data.list);
          setAssignmentCount(response.data.list.length);
        }
      } catch (error) {
        console.error("Unable to load assignments", error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchAssignments();
  }, [setAssignmentCount]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    setAssignmentCount(assignments.length);
  }, [assignments.length, isLoading, setAssignmentCount]);

  const filteredAssignments = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return assignments;
    }

    return assignments.filter((assignment) => {
      const title = assignment.title ?? fallbackCardTitle(assignment);

      return [title, assignment.subject, assignment.className].some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      );
    });
  }, [assignments, searchQuery]);

  const trimmedSearchQuery = searchQuery.trim();
  const isSingleAssignmentResult = filteredAssignments.length === 1;
  const shouldFloatCreateAction = filteredAssignments.length >= 4;
  const createActionClassName =
    "inline-flex h-[53px] items-center gap-2 rounded-full bg-[#0f1115] px-9 text-[15px] font-semibold text-white shadow-[0_1px_3px_rgba(15,17,21,0.12),0_8px_14px_rgba(15,17,21,0.10)] transition hover:opacity-95";

  if (isLoading) {
    return (
      <section className="flex min-h-[calc(100vh-132px)] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />
      </section>
    );
  }

  if (assignments.length === 0) {
    return (
      <EmptyState
        title="No assignments yet"
        description="Create your first assignment to start collecting and grading student submissions. You can set up rubrics, define marking criteria, and let AI assist with grading."
      />
    );
  }

  return (
    <section className="font-ui pb-6">
      <div className="w-full max-w-[1280px] lg:-ml-3">
        <div className="mb-4 flex items-start gap-4 px-1">
          <span className="mt-2.5 h-4 w-4 shrink-0 rounded-full bg-[#49c26d] shadow-[0_0_0_5px_rgba(73,194,109,0.2)]" />
          <div>
            <h1 className="text-[24px] font-extrabold leading-[1.2] tracking-[-0.04em] text-[#303030]">
              Assignments
            </h1>
            <p className="mt-1 text-[14px] font-normal leading-[1.4] tracking-[-0.04em] text-[#9a9a9a]">
              Manage and create assignments for your classes.
            </p>
          </div>
        </div>

        <div className="rounded-[30px] border border-[#ececef] bg-white/92 px-5 py-3 shadow-[0_16px_34px_rgba(31,36,41,0.04)] backdrop-blur sm:px-6 sm:py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <button className="inline-flex h-[48px] items-center gap-2.5 rounded-full px-1 text-[17px] font-semibold tracking-[-0.04em] text-[#a0a4ab]">
              <Filter className="h-[22px] w-[22px] stroke-[1.9]" />
              Filter By
            </button>

            <div className="relative w-full lg:w-[450px] xl:w-[560px]">
              <Search className="pointer-events-none absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-[#aeb2ba]" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search Assignment"
                className="h-[50px] w-full rounded-full border border-[#d8dadd] bg-white pl-[70px] pr-6 text-[17px] font-semibold tracking-[-0.04em] text-[#2a2d34] outline-none placeholder:font-semibold placeholder:text-[#b0b4bc] focus:border-[#cfd2d8]"
              />
            </div>
          </div>
        </div>

        {filteredAssignments.length === 0 ? (
          <div className="mt-3 rounded-[28px] border border-dashed border-[#d9dde4] bg-white/84 px-8 py-12 text-center shadow-[0_16px_30px_rgba(31,36,41,0.03)]">
            <p className="text-[26px] font-semibold tracking-[-0.04em] text-[#2d3138]">No assignments found</p>
            <p className="mt-2 text-[15px] leading-[1.6] text-[#8d9198]">
              No assignment matches &quot;{trimmedSearchQuery}&quot;. Try a different name or clear the search.
            </p>
          </div>
        ) : (
          <div className={`mt-3 grid grid-cols-1 gap-3 ${isSingleAssignmentResult ? "" : "lg:grid-cols-2"}`}>
            {filteredAssignments.map((assignment) => {
              const isMenuOpen = activeMenuId === assignment._id;
              const title = assignment.title ?? fallbackCardTitle(assignment);
              const assignedOn = format(new Date(assignment.createdAt), "dd-MM-yyyy");
              const dueDate = assignment.dueDate ? format(new Date(assignment.dueDate), "dd-MM-yyyy") : assignedOn;

              return (
                <article
                  key={assignment._id}
                  className="relative min-h-[154px] rounded-[24px] border border-[#e8e9ed] bg-white/92 px-6 py-5 shadow-[0_18px_30px_rgba(31,36,41,0.04)]"
                >
                  <div className="flex min-h-[104px] flex-col justify-between gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        href={`/output/${assignment._id}`}
                        className="line-clamp-2 max-w-[80%] text-[24px] font-extrabold leading-[1.2] tracking-[-0.04em] text-[#303030] underline decoration-2 underline-offset-2"
                      >
                        {title}
                      </Link>

                      <div className="relative shrink-0">
                        <button
                          onClick={() => setActiveMenuId((current) => (current === assignment._id ? null : assignment._id))}
                          className="rounded-full p-1 text-[#b5b5b5] transition hover:bg-[#eceef3]"
                        >
                          <EllipsisVertical className="h-5 w-5" />
                        </button>

                        {isMenuOpen && (
                          <div className="absolute right-0 top-9 z-20 w-[176px] rounded-[24px] border border-[#eceef2] bg-white/98 p-3 shadow-[0_18px_34px_rgba(0,0,0,0.09)] backdrop-blur">
                            <Link
                              href={`/output/${assignment._id}`}
                              className="block rounded-[16px] px-3 py-3 text-center text-[15px] font-semibold tracking-[-0.04em] text-[#343840] hover:bg-[#f5f6f8]"
                            >
                              View Assignment
                            </Link>
                            <button
                              onClick={() => void handleDeleteAssignment(assignment._id)}
                              className="mt-3 w-full rounded-[16px] bg-[#f0f0f0] px-4 py-3 text-left text-[15px] font-semibold tracking-[-0.04em] text-[#db3f39] transition hover:bg-[#ededf0]"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 text-[16px] leading-[1.4] tracking-[-0.04em] text-[#9a9a9a]">
                      <p>
                        <span className="font-bold text-[#303030]">Assigned on :</span>{" "}
                        <span className="font-normal">{assignedOn}</span>
                      </p>
                      <p>
                        <span className="font-bold text-[#303030]">Due :</span>{" "}
                        <span className="font-normal">{dueDate}</span>
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!shouldFloatCreateAction && filteredAssignments.length > 0 ? (
          <div className="mt-6 hidden justify-center md:flex">
            <Link
              href="/create"
              className={createActionClassName}
            >
              <Plus className="h-5 w-5" />
              Create Assignment
            </Link>
          </div>
        ) : null}
      </div>

      {shouldFloatCreateAction ? (
        <div className="pointer-events-none fixed bottom-0 left-1/2 z-20 hidden h-[96px] w-[min(1125px,calc(100vw-48px))] -translate-x-1/2 md:block lg:left-[calc(50%+160px)]">
          <div className="absolute inset-x-0 bottom-0 h-[73px] overflow-hidden rounded-[28px]">
            <div className="absolute inset-0 bg-white/8 backdrop-blur-[40px] [mask-image:linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.16)_38%,rgba(0,0,0,0.56)_72%,rgba(0,0,0,1)_100%)] [-webkit-mask-image:linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.16)_38%,rgba(0,0,0,0.56)_72%,rgba(0,0,0,1)_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(239,239,239,0)_0%,rgba(239,239,239,0.18)_48%,rgba(239,239,239,0.58)_100%)]" />
          </div>

          <div className="absolute inset-x-0 top-[14px] flex justify-center">
            <Link
              href="/create"
              className={`pointer-events-auto ${createActionClassName}`}
            >
              <Plus className="h-5 w-5" />
              Create Assignment
            </Link>
          </div>
        </div>
      ) : null}
    </section>
  );
}
