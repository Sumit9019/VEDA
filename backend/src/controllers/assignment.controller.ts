import { Request, Response } from 'express';
import { z } from 'zod';
import { Assignment, IAssignment } from '../models/Assignment';
import { Result } from '../models/Result';
import { generationQueue } from '../queues';
import generatePDF from '../services/pdf.service';
import { generateQuestions } from '../services/ai.service';
import { saveGeneratedResult } from '../services/result.service';
import {
  extractReferenceText,
  getReferenceContentType,
  isSupportedReferenceContentType,
  limitReferenceText,
} from '../services/reference.service';

const SHOULD_GENERATE_INLINE = process.env.USE_REMOTE_AI !== 'true';
const pdfVariantSchema = z.enum(['question-paper', 'answer-key']);

const editableQuestionSchema = z.object({
  text: z.string().trim().min(1, 'Question text is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  marks: z.number().positive('Marks must be positive'),
  answerHint: z.string().optional(),
  svgDiagram: z.string().nullable().optional(),
});

const editableSectionSchema = z.object({
  title: z.string().trim().min(1, 'Section title is required'),
  instruction: z.string().trim().min(1, 'Section instruction is required'),
  questions: z.array(editableQuestionSchema).min(1, 'Each section must include at least one question'),
});

const editableResultSchema = z.object({
  sections: z.array(editableSectionSchema).min(1, 'At least one section is required'),
});

const regenerateSectionSchema = z.object({
  sectionIndex: z.number().int().min(0),
});

const questionTypeSchema = z.object({
  type: z.string().trim().min(1, 'Question type is required'),
  count: z.number().int().positive('Question count must be positive'),
  marks: z.number().positive('Marks must be positive'),
});

const createAssignmentSchema = z.object({
  subject: z.string().trim().min(2, 'Subject is required'),
  className: z.string().trim().min(1, 'Class is required'),
  dueDate: z.coerce.date(),
  instructions: z.string().optional().default(''),
  referenceText: z.string().optional().default(''),
  referenceFileName: z.string().trim().optional(),
  questionConfig: z
    .object({
      types: z.array(z.string().trim().min(1)).min(1, 'At least one question type is required'),
      count: z.number().int().positive('Total question count must be positive'),
      totalMarks: z.number().positive('Total marks must be positive'),
      detailedTypes: z.array(questionTypeSchema).optional(),
      duration: z.number().positive().optional(),
      sectionCount: z.number().int().positive().optional(),
      bloomLevel: z.string().optional(),
      bilingual: z.boolean().optional(),
    })
    .superRefine((questionConfig, context) => {
      if (!questionConfig.detailedTypes || questionConfig.detailedTypes.length === 0) {
        return;
      }

      const computedQuestionCount = questionConfig.detailedTypes.reduce((total, current) => total + current.count, 0);
      const computedTotalMarks = questionConfig.detailedTypes.reduce(
        (total, current) => total + current.count * current.marks,
        0,
      );

      if (computedQuestionCount !== questionConfig.count) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Question count does not match detailed question breakdown',
          path: ['count'],
        });
      }

      if (computedTotalMarks !== questionConfig.totalMarks) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Total marks do not match detailed question breakdown',
          path: ['totalMarks'],
        });
      }
    }),
  difficultyConfig: z.object({
    easy: z.number().min(0),
    medium: z.number().min(0),
    hard: z.number().min(0),
  }),
});

export const extractAssignmentReference = async (req: Request, res: Response) => {
  try {
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      return res.status(400).json({ success: false, message: 'Reference file is required' });
    }

    const contentType = getReferenceContentType(req.headers['content-type']);

    if (!isSupportedReferenceContentType(contentType)) {
      return res.status(415).json({
        success: false,
        message: 'Only PDF and TXT files are supported for reference extraction',
      });
    }

    const extractedReference = await extractReferenceText(req.body, contentType);

    if (!extractedReference) {
      return res.status(422).json({
        success: false,
        message: 'Unable to extract usable text from the uploaded reference file',
      });
    }

    const { text, wasTruncated } = limitReferenceText(extractedReference);

    return res.status(200).json({
      success: true,
      data: {
        referenceText: text,
        wasTruncated,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createAssignment = async (req: Request, res: Response) => {
  try {
    const parseResult = createAssignmentSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid assignment payload',
        issues: parseResult.error.issues,
      });
    }

    const data = parseResult.data;
    const assignment = await Assignment.create({
      ...data,
      status: SHOULD_GENERATE_INLINE ? 'GENERATING' : 'PENDING',
    });

    if (SHOULD_GENERATE_INLINE) {
      await generateAssignmentInline(assignment);
      return res.status(201).json({ success: true, data: assignment });
    }

    const job = await generationQueue.add('generate-questions', { assignmentId: assignment._id.toString() });
    assignment.jobId = job.id;
    await assignment.save();
    res.status(201).json({ success: true, data: assignment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAssignment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findById(id);
    if (!assignment) return res.status(404).json({ success: false, message: 'Not found' });
    const result = await Result.findOne({ assignmentId: id });
    res.status(200).json({ success: true, data: { assignment, result } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const regenerateAssignment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findById(id);
    if (!assignment) return res.status(404).json({ success: false, message: 'Not found' });
    await Result.deleteOne({ assignmentId: id });
    assignment.status = SHOULD_GENERATE_INLINE ? 'GENERATING' : 'PENDING';
    assignment.jobId = undefined;

    if (SHOULD_GENERATE_INLINE) {
      await assignment.save();
      await generateAssignmentInline(assignment);
      return res.status(200).json({ success: true, data: assignment });
    }

    const job = await generationQueue.add('generate-questions', { assignmentId: assignment._id.toString() });
    assignment.jobId = job.id;
    await assignment.save();
    res.status(200).json({ success: true, data: assignment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const generateAssignmentInline = async (assignment: IAssignment) => {
  try {
    const generatedPayload = await generateQuestions(assignment);

    await saveGeneratedResult(assignment, generatedPayload);

    assignment.status = 'COMPLETED';
    assignment.jobId = undefined;
    await assignment.save();
  } catch (error) {
    assignment.status = 'FAILED';
    await assignment.save();
    throw error;
  }
};

export const swapQuestion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { sectionIndex, questionIndex } = req.body;
    const assignment = await Assignment.findById(id);
    const resultDoc = await Result.findOne({ assignmentId: id });
    if (!assignment || !resultDoc) {
      return res.status(404).json({ success: false, message: 'Assignment or Result not found' });
    }
    const section = resultDoc.sections[sectionIndex];
    if (!section) return res.status(404).json({ success: false, message: 'Section not found' });
    const oldQuestion = section.questions[questionIndex];
    if (!oldQuestion) return res.status(404).json({ success: false, message: 'Question not found' });
    const { generateSingleQuestion } = require('../services/ai.service');
    const newQuestionText = await generateSingleQuestion(assignment, oldQuestion, section.title);
    resultDoc.sections[sectionIndex].questions[questionIndex].text = newQuestionText;
    resultDoc.pdfUrl = undefined;
    resultDoc.answerKeyPdfUrl = undefined;
    resultDoc.docxUrl = undefined;
    resultDoc.markModified('sections');
    await resultDoc.save();
    await queuePdfRegeneration(resultDoc._id.toString(), assignment._id.toString());
    res.status(200).json({ success: true, newText: newQuestionText });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const buildDifficultySummary = (sections: Array<{ questions: Array<{ difficulty?: string }> }>) => {
  let easy = 0;
  let medium = 0;
  let hard = 0;

  sections.forEach((section) => {
    section.questions.forEach((question) => {
      if (question.difficulty === 'easy') easy += 1;
      else if (question.difficulty === 'hard') hard += 1;
      else medium += 1;
    });
  });

  return { easy, medium, hard };
};

const queuePdfRegeneration = async (resultId: string, assignmentId: string) => {
  const { pdfQueue } = await import('../queues');

  await pdfQueue.add(
    'generate-pdf',
    { resultId, assignmentId },
    {
      removeOnComplete: 20,
      removeOnFail: 20,
    },
  );
};

export const updateAssignmentResult = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const parseResult = editableResultSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid edited result payload',
        issues: parseResult.error.issues,
      });
    }

    const assignment = await Assignment.findById(id);
    const resultDoc = await Result.findOne({ assignmentId: id });

    if (!assignment || !resultDoc) {
      return res.status(404).json({ success: false, message: 'Assignment or result not found' });
    }

    resultDoc.sections = parseResult.data.sections as any;
    resultDoc.difficultySummary = buildDifficultySummary(parseResult.data.sections as any);
    resultDoc.pdfUrl = undefined;
    resultDoc.answerKeyPdfUrl = undefined;
    resultDoc.docxUrl = undefined;
    resultDoc.markModified('sections');
    await resultDoc.save();

    await queuePdfRegeneration(resultDoc._id.toString(), assignment._id.toString());

    return res.status(200).json({
      success: true,
      data: resultDoc,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const regenerateSection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const parseResult = regenerateSectionSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid regenerate section payload',
        issues: parseResult.error.issues,
      });
    }

    const assignment = await Assignment.findById(id);
    const resultDoc = await Result.findOne({ assignmentId: id });

    if (!assignment || !resultDoc) {
      return res.status(404).json({ success: false, message: 'Assignment or result not found' });
    }

    const section = resultDoc.sections[parseResult.data.sectionIndex];

    if (!section) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }

    const { generateSingleQuestion } = require('../services/ai.service');

    const regeneratedQuestions = await Promise.all(
      section.questions.map(async (question: any) => {
        const nextText = await generateSingleQuestion(assignment, question, section.title);
        return {
          ...question.toObject?.(),
          ...question,
          text: nextText,
        };
      }),
    );

    resultDoc.sections[parseResult.data.sectionIndex].questions = regeneratedQuestions as any;
    resultDoc.pdfUrl = undefined;
    resultDoc.answerKeyPdfUrl = undefined;
    resultDoc.docxUrl = undefined;
    resultDoc.markModified('sections');
    await resultDoc.save();

    await queuePdfRegeneration(resultDoc._id.toString(), assignment._id.toString());

    return res.status(200).json({
      success: true,
      data: resultDoc,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const evaluateStudentAnswer = async (req: Request, res: Response) => {
  try {
    const { question, studentAnswer, rubric } = req.body;
    if (!question || !studentAnswer || !rubric) {
      return res.status(400).json({ success: false, message: 'Missing evaluation data' });
    }
    const { evaluateAnswer } = require('../services/ai.service');
    const evaluation = await evaluateAnswer(question, studentAnswer, rubric);
    res.status(200).json({ success: true, evaluation });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const listAssignments = async (req: Request, res: Response) => {
  try {
    const list = await Assignment.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAssignment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Assignment.findByIdAndDelete(id);
    await Result.deleteOne({ assignmentId: id });
    res.status(200).json({ success: true, message: "Deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const generateAssignmentPdf = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const variant = pdfVariantSchema.parse(req.query.variant ?? 'question-paper');
    const assignment = await Assignment.findById(id);
    const result = await Result.findOne({ assignmentId: id });

    if (!assignment || !result) {
      return res.status(404).json({ success: false, message: 'Assignment or result not found' });
    }

    const pdfUrl = await generatePDF(result, assignment, variant === 'answer-key');

    if (variant === 'answer-key') {
      result.answerKeyPdfUrl = pdfUrl;
    } else {
      result.pdfUrl = pdfUrl;
    }

    await result.save();

    res.status(200).json({
      success: true,
      data: { pdfUrl, variant },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const generateAssignmentDocx = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findById(id);
    const result = await Result.findOne({ assignmentId: id });

    if (!assignment || !result) {
      return res.status(404).json({ success: false, message: 'Assignment or result not found' });
    }

    const { generateDocx } = await import('../services/docx.service');
    const docxUrl = await generateDocx(assignment, result, false);
    result.docxUrl = docxUrl;
    await result.save();

    return res.status(200).json({
      success: true,
      data: { docxUrl },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
