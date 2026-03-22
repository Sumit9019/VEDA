import mongoose, { Document, Schema } from 'mongoose';

export interface IAssignment extends Document {
  subject: string;
  className: string; // "class" is a reserved word
  dueDate: Date;
  instructions: string;
  referenceText: string;
  referenceFileName?: string;
  questionConfig: {
    types: string[];
    count: number;
    totalMarks: number;
    detailedTypes?: Array<{
      type: string;
      count: number;
      marks: number;
    }>;
    bloomLevel?: string;
    duration?: number;
    sectionCount?: number;
    bilingual?: boolean;
  };
  difficultyConfig: {
    easy: number;
    medium: number;
    hard: number;
  };
  status: 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED';
  jobId?: string;
  createdAt: Date;
}

const AssignmentSchema: Schema = new Schema({
  subject: { type: String, required: true },
  className: { type: String, required: true },
  dueDate: { type: Date, required: true },
  instructions: { type: String, default: '' },
  referenceText: { type: String, default: '' },
  referenceFileName: { type: String },
  questionConfig: {
    types: [{ type: String }],
    count: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    detailedTypes: [
      {
        type: {
          type: String,
        },
        count: {
          type: Number,
        },
        marks: {
          type: Number,
        },
      },
    ],
    bloomLevel: { type: String },
    duration: { type: Number },
    sectionCount: { type: Number, default: 1 },
    bilingual: { type: Boolean, default: false }
  },
  difficultyConfig: {
    easy: { type: Number, required: true },
    medium: { type: Number, required: true },
    hard: { type: Number, required: true }
  },
  status: { type: String, enum: ['PENDING', 'GENERATING', 'COMPLETED', 'FAILED'], default: 'PENDING' },
  jobId: { type: String },
  createdAt: { type: Date, default: Date.now, expires: 86400 },
});

export const Assignment = mongoose.model<IAssignment>('Assignment', AssignmentSchema);
