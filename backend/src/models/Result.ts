import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion {
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  answerHint?: string;
  svgDiagram?: string;
}

export interface ISection {
  title: string;
  instruction: string;
  questions: IQuestion[];
}

export interface IResult extends Document {
  assignmentId: mongoose.Types.ObjectId;
  sections: ISection[];
  difficultySummary: {
    easy: number;
    medium: number;
    hard: number;
  };
  cognitiveScore: {
    application: number;
    rote: number;
  };
  auditReport?: {
    repetitiveCheck: string;
    marksTally: string;
    qualityScore: number;
    suggestions: string;
  };
  blueprinting?: string[];
  pdfUrl?: string;
  docxUrl?: string;
  answerKeyPdfUrl?: string;
  syllabusCoverage?: {
    coveredTopics: string[];
    missingTopics: string[];
    analysis: string;
  };
  createdAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  text: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  marks: { type: Number, required: true },
  answerHint: { type: String },
  svgDiagram: { type: String }
});

const SectionSchema = new Schema<ISection>({
  title: { type: String, required: true },
  instruction: { type: String, required: true },
  questions: [QuestionSchema]
});

const ResultSchema = new Schema<IResult>({
  assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true, unique: true },
  sections: [SectionSchema],
  difficultySummary: {
    easy: { type: Number, default: 0 },
    medium: { type: Number, default: 0 },
    hard: { type: Number, default: 0 }
  },
  cognitiveScore: {
    application: { type: Number, default: 0 },
    rote: { type: Number, default: 0 }
  },
  auditReport: {
    repetitiveCheck: { type: String },
    marksTally: { type: String },
    qualityScore: { type: Number },
    suggestions: { type: String }
  },
  blueprinting: { type: [String] },
  pdfUrl: { type: String },
  docxUrl: { type: String },
  answerKeyPdfUrl: { type: String },
  syllabusCoverage: {
    coveredTopics: { type: [String] },
    missingTopics: { type: [String] },
    analysis: { type: String }
  },
  createdAt: { type: Date, default: Date.now, expires: 86400 },
});

export const Result = mongoose.model<IResult>('Result', ResultSchema);
