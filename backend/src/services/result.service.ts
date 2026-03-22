import { IAssignment } from '../models/Assignment';
import { Result } from '../models/Result';

const getDifficultySummary = (sections: Array<{ questions?: Array<{ difficulty?: string }> }> = []) => {
  let easy = 0;
  let medium = 0;
  let hard = 0;

  sections.forEach((section) => {
    section.questions?.forEach((question) => {
      if (question.difficulty === 'easy') easy += 1;
      else if (question.difficulty === 'medium') medium += 1;
      else if (question.difficulty === 'hard') hard += 1;
    });
  });

  return { easy, medium, hard };
};

export const saveGeneratedResult = async (assignment: IAssignment, generatedPayload: any) => {
  const sections = generatedPayload.sections || [];

  return Result.findOneAndUpdate(
    { assignmentId: assignment._id },
    {
      assignmentId: assignment._id,
      sections,
      difficultySummary: getDifficultySummary(sections),
      cognitiveScore: generatedPayload.cognitiveScore || { application: 50, rote: 50 },
      auditReport: generatedPayload.auditReport,
      blueprinting: generatedPayload.blueprinting,
      syllabusCoverage: generatedPayload.syllabusCoverage,
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );
};
