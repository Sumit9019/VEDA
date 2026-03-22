import { Worker, Job } from 'bullmq';
import { redisConnection, bullMqConnection } from '../config';
import { generationQueueName, pdfQueueName } from '../queues';
import { Assignment } from '../models/Assignment';
import { Result } from '../models/Result';
import { generateQuestions } from '../services/ai.service';
import { emitGenerationProgress, emitGenerationComplete, emitGenerationFailed } from '../sockets';
import { GenerationLog } from '../models/GenerationLog';
import crypto from 'crypto';
import generatePDF from '../services/pdf.service';
import { saveGeneratedResult } from '../services/result.service';

export const startWorkers = () => {
  const generationWorker = new Worker(generationQueueName, async (job: Job) => {
    const assignmentId = job.data.assignmentId;
    
    try {
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) throw new Error('Assignment not found');

      assignment.status = 'GENERATING';
      await assignment.save();

      emitGenerationProgress(assignmentId, 10, 'input received');
      await GenerationLog.create({ assignmentId, step: 'input received', status: 'COMPLETED' });

      // Cache Check
      const cacheKeyStr = JSON.stringify({
        subject: assignment.subject,
        config: assignment.questionConfig,
        instructions: assignment.instructions.trim(),
        referenceText: assignment.referenceText,
        difficulty: assignment.difficultyConfig
      });
      const cacheKey = crypto.createHash('sha256').update(cacheKeyStr).digest('hex');
      
      const cached = await redisConnection.get(cacheKey);
      let parsedResponse;

      if (cached) {
        emitGenerationProgress(assignmentId, 50, 'Cache hit, skipping AI generation');
        parsedResponse = JSON.parse(cached);
      } else {
        emitGenerationProgress(assignmentId, 20, 'Preparing assignment plan');
        await GenerationLog.create({ assignmentId, step: 'prompt created', status: 'COMPLETED' });

        emitGenerationProgress(assignmentId, 45, 'Generating questions from your source');
        await GenerationLog.create({ assignmentId, step: 'AI generating', status: 'IN_PROGRESS' });

        parsedResponse = await generateQuestions(assignment);
        
        await redisConnection.set(cacheKey, JSON.stringify(parsedResponse), 'EX', 3600 * 24); // Cache for 24 hours
      }

      emitGenerationProgress(assignmentId, 75, 'parsing');
      await GenerationLog.create({ assignmentId, step: 'parsing', status: 'COMPLETED' });

      const result = await saveGeneratedResult(assignment, parsedResponse);

      assignment.status = 'COMPLETED';
      await assignment.save();

      emitGenerationProgress(assignmentId, 100, 'completed', 'COMPLETED');
      await GenerationLog.create({ assignmentId, step: 'completed', status: 'COMPLETED' });

      emitGenerationComplete(assignmentId, result);

      // Trigger PDF generation queue
      const { pdfQueue } = await import('../queues');
      await pdfQueue.add('generate-pdf', { resultId: result._id });

    } catch (error: any) {
      console.error('Generation Error:', error);
      await Assignment.updateOne({ _id: assignmentId }, { status: 'FAILED' });
      emitGenerationFailed(assignmentId, error.message);
      await GenerationLog.create({ assignmentId, step: 'failed', status: 'FAILED', meta: { error: error.message } });
    }
  }, { connection: bullMqConnection });

  const pdfWorker = new Worker(pdfQueueName, async (job: Job) => {
    const { resultId } = job.data;
    const result = await Result.findById(resultId).populate('assignmentId');
    if (!result) throw new Error('Result not found');
    
    const assignment = result.assignmentId as any;

    try {
      // 1. Generate Regular PDF
      const pdfUrl = await generatePDF(result, assignment, false);
      
      // 2. Generate Answer Key PDF
      const answerKeyPdfUrl = await generatePDF(result, assignment, true);

      // 3. Generate DOCX
      const { generateDocx } = await import('../services/docx.service');
      const docxUrl = await generateDocx(assignment, result, false);

      result.pdfUrl = pdfUrl;
      result.answerKeyPdfUrl = answerKeyPdfUrl;
      result.docxUrl = docxUrl;
      await result.save();
      
      emitGenerationProgress(assignment._id.toString(), 100, 'pdf generated', 'COMPLETED');
      emitGenerationComplete(assignment._id.toString(), result); // Optionally send the result again with pdfUrl
    } catch (error: any) {
      console.error('PDF/DOCX Generation Error:', error);
    }
  }, { connection: bullMqConnection });

  console.log('Workers started');
};
