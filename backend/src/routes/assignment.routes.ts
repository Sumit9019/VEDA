import express, { Router } from 'express';
import {
  createAssignment,
  extractAssignmentReference,
  getAssignment,
  regenerateAssignment,
  swapQuestion,
  evaluateStudentAnswer,
  listAssignments,
  deleteAssignment,
  generateAssignmentPdf,
  generateAssignmentDocx,
  updateAssignmentResult,
  regenerateSection,
} from '../controllers/assignment.controller';

const router = Router();

router.get('/', listAssignments);
router.post(
  '/extract-reference',
  express.raw({
    type: ['application/pdf', 'text/plain'],
    limit: '12mb',
  }),
  extractAssignmentReference,
);
router.post('/create', createAssignment);
router.delete('/:id', deleteAssignment);
router.post('/:id/evaluate', evaluateStudentAnswer);
router.get('/:id/pdf', generateAssignmentPdf);
router.get('/:id/docx', generateAssignmentDocx);
router.get('/:id', getAssignment);
router.patch('/:id/regenerate', regenerateAssignment);
router.patch('/:id/swap-question', swapQuestion);
router.patch('/:id/result', updateAssignmentResult);
router.patch('/:id/regenerate-section', regenerateSection);

export default router;
