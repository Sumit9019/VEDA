import mongoose, { Document, Schema } from 'mongoose';

export interface IGenerationLog extends Document {
  assignmentId: mongoose.Types.ObjectId;
  step: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  meta?: any;
  timestamp: Date;
}

const GenerationLogSchema: Schema = new Schema({
  assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
  step: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'], required: true },
  meta: { type: Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now, expires: 86400 },
});

export const GenerationLog = mongoose.model<IGenerationLog>('GenerationLog', GenerationLogSchema);
