import { create } from 'zustand';

export interface AssignmentConfig {
  subject: string;
  className: string;
  dueDate: string;
  instructions: string;
  questionConfig: {
    types: string[];
    count: number;
    totalMarks: number;
    bloomLevel: string;
    duration: number;
    sectionCount: number;
  };
  difficultyConfig: {
    easy: number;
    medium: number;
    hard: number;
  };
}

export interface ProgressState {
  step: string;
  percentage: number;
  error: string | null;
  status: 'IDLE' | 'GENERATING' | 'COMPLETED' | 'FAILED';
}

interface AppState {
  currentAssignmentId: string | null;
  setCurrentAssignmentId: (id: string | null) => void;

  assignmentCount: number | null;
  setAssignmentCount: (count: number) => void;
  incrementAssignmentCount: () => void;
  
  progress: ProgressState;
  setProgress: (progress: Partial<ProgressState>) => void;
  resetProgress: () => void;
  
  generatedResult: unknown | null;
  setGeneratedResult: (result: unknown) => void;
  
  assignment: AssignmentConfig | Record<string, unknown> | null;
  setAssignment: (assignment: AssignmentConfig | Record<string, unknown>) => void;
}

export const useStore = create<AppState>((set) => ({
  currentAssignmentId: null,
  setCurrentAssignmentId: (id) => set({ currentAssignmentId: id }),

  assignmentCount: null,
  setAssignmentCount: (assignmentCount) => set({ assignmentCount }),
  incrementAssignmentCount: () =>
    set((state) => ({
      assignmentCount: state.assignmentCount === null ? null : state.assignmentCount + 1
    })),
  
  progress: {
    step: '',
    percentage: 0,
    error: null,
    status: 'IDLE'
  },
  setProgress: (newProgress) => set((state) => ({ 
    progress: { ...state.progress, ...newProgress } 
  })),
  resetProgress: () => set({
    progress: { step: '', percentage: 0, error: null, status: 'IDLE' }
  }),
  
  generatedResult: null,
  setGeneratedResult: (result) => set({ generatedResult: result }),
  
  assignment: null,
  setAssignment: (assignment) => set({ assignment })
}));
