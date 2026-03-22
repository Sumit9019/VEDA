import OpenAI from 'openai';
import { NVIDIA_API_KEY } from '../config';
import { IAssignment } from '../models/Assignment';
import { generateQuestionsLocally, generateReplacementQuestionLocally } from './fast-generation.service';
import { limitReferenceText } from './reference.service';

const GENERATION_MODEL = process.env.NVIDIA_GENERATION_MODEL || 'meta/llama3-70b-instruct';
const MAX_REFERENCE_CHARS_FOR_PROMPT = 8000;
const SHOULD_USE_REMOTE_AI = process.env.USE_REMOTE_AI === 'true';

const openai = new OpenAI({
  apiKey: NVIDIA_API_KEY || "nvapi-placeholder",
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

const getQuestionBudget = (assignment: IAssignment) => {
  const questionCount = Number(assignment.questionConfig.count || 0);
  const estimatedResponseTokens = 320 + questionCount * 55;

  return Math.max(900, Math.min(1600, estimatedResponseTokens));
};

// Prompt Builder Layer
export const buildPrompt = (assignment: IAssignment): string => {
  const normalizedInstructions = assignment.instructions?.trim();
  const referenceMaterial = assignment.referenceText?.trim()
    ? limitReferenceText(assignment.referenceText.trim(), MAX_REFERENCE_CHARS_FOR_PROMPT).text
    : '';

  return `
You are VedaAI Core. Generate an assessment paper as strict JSON only.

INPUT
- Subject: ${assignment.subject}
- Class: ${assignment.className}
- Total Questions: ${assignment.questionConfig.count}
- Total Marks: ${assignment.questionConfig.totalMarks}
- Sections: ${assignment.questionConfig.sectionCount || 1}
- Allowed Types: ${assignment.questionConfig.types.join(', ')}
${assignment.questionConfig.bloomLevel ? `- Bloom Level: ${assignment.questionConfig.bloomLevel}` : ''}
${assignment.questionConfig.bilingual ? '- Output must be bilingual: English followed by Hindi translation in parentheses.' : ''}
- Difficulty Split: easy ${assignment.difficultyConfig.easy}%, medium ${assignment.difficultyConfig.medium}%, hard ${assignment.difficultyConfig.hard}%

${referenceMaterial ? `PRIMARY SOURCE MATERIAL\n${referenceMaterial}` : 'PRIMARY SOURCE MATERIAL\nNone provided.'}
${normalizedInstructions ? `\nTEACHER INSTRUCTIONS\n${normalizedInstructions}` : ''}

RULES
1. Return JSON only. No markdown, no prose.
2. Keep every question tightly aligned to the primary source material when provided.
3. Teacher instructions may refine the paper, but must not contradict the source material.
4. Total question count must be exactly ${assignment.questionConfig.count}.
5. Total marks must be exactly ${assignment.questionConfig.totalMarks}.
6. Each question must include: text, difficulty, marks, answerHint, svgDiagram.
7. Keep answerHint short: 1-2 sentences.
8. Set svgDiagram to null unless a diagram is genuinely needed.
9. Provide compact, non-repetitive sections.

RETURN THIS JSON SHAPE
{
  "cognitiveScore": { "application": number, "rote": number },
  "blueprinting": ["Topic A", "Topic B"],
  "auditReport": {
    "repetitiveCheck": "string",
    "marksTally": "string",
    "qualityScore": number,
    "suggestions": "string"
  },
  "syllabusCoverage": {
    "coveredTopics": ["Topic 1"],
    "missingTopics": ["Topic 2"],
    "analysis": "string"
  },
  "sections": [
    {
      "title": "string",
      "instruction": "string",
      "questions": [
        {
          "text": "string",
          "difficulty": "easy|medium|hard",
          "marks": number,
          "answerHint": "string",
          "svgDiagram": null
        }
      ]
    }
  ]
}
`;
};

// Parsing Layer
export const parseAIResponse = (text: string): any => {
  try {
    // Try total string first (fast path)
    return JSON.parse(text.trim());
  } catch (err) {
    // Robust extraction: Find the first { and the last }
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');
    
    if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx) {
      console.error("AI Output Parse Error (No JSON block):", text);
      throw new Error("Failed to find a valid JSON block in AI model output.");
    }
    
    const extracted = text.substring(startIdx, endIdx + 1);
    try {
      return JSON.parse(extracted);
    } catch (innerErr) {
      console.error("AI Output Extracted JSON Parse Error:", extracted);
      throw new Error("Failed to parse extracted JSON block from AI output.");
    }
  }
};

export const generateQuestions = async (assignment: IAssignment): Promise<any> => {
  if (!SHOULD_USE_REMOTE_AI) {
    return generateQuestionsLocally(assignment);
  }

  const prompt = buildPrompt(assignment);
  
  const response = await openai.chat.completions.create({
    model: GENERATION_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.1,
    max_tokens: getQuestionBudget(assignment),
  });

  const content = response.choices[0]?.message?.content || "{}";
  return parseAIResponse(content);
};

export const generateSingleQuestion = async (assignment: IAssignment, oldQuestion: any, sectionInfo: string): Promise<string> => {
  if (!SHOULD_USE_REMOTE_AI) {
    return generateReplacementQuestionLocally(assignment, oldQuestion, sectionInfo).text;
  }

  const referenceMaterial = assignment.referenceText?.trim()
    ? limitReferenceText(assignment.referenceText.trim(), 4000).text
    : '';
  const additionalInstructions = assignment.instructions?.trim();
  const prompt = `
You are VedaAI Core, an expert curriculum designer. The user wants to swap out a specific question from an exam paper you previously generated.
Exam Context: ${assignment.subject} (${assignment.className})
Section Context: ${sectionInfo}
Original Question to Replace: "${oldQuestion.text}"
Constraint: The new question must test a SIMILAR OR RELATED concept, must match the difficulty level (${oldQuestion.difficulty}), and be worth ${oldQuestion.marks} marks. DO NOT REPEAT THE ORIGINAL QUESTION.
${referenceMaterial ? `Primary reference material:\n${referenceMaterial}\nUse this source as the main anchor for the replacement question.` : ''}
${additionalInstructions ? `Teacher guidance:\n${additionalInstructions}` : ''}

Return ONLY the plain text of the new question. No quotes, no markdown, no JSON, no explanation. Just the direct new question string.
`;

  const response = await openai.chat.completions.create({
    model: GENERATION_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.4,
    max_tokens: 500,
  });

  return (response.choices[0]?.message?.content || "New Alternative Question?").trim().replace(/^"|"$|^`|`$/g, "");
};

// --- NEW CRITICAL FEATURE: AI GRADING ASSISTANT ---
export const evaluateAnswer = async (question: string, studentAnswer: string, rubric: string): Promise<any> => {
  const prompt = `
You are VedaAI Evaluator, a strict but fair teacher's assistant. Evaluate the following student answer based on the provided question and marking rubric.

## QUESTION:
"${question}"

## MARKING RUBRIC (POINTS TO CHECK):
"${rubric}"

## STUDENT'S SUBMITTED ANSWER:
"${studentAnswer}"

## YOUR TASK:
1. Assign a score based on the rubric.
2. Provide a 1-2 sentence constructive feedback on why they got this score.
3. Determine if the answer is "Correct", "Partial", or "Wrong".

## RETURN THIS JSON OBJECT ONLY:
{
  "score": number, 
  "status": "Correct" | "Partial" | "Wrong",
  "feedback": "string"
}
`;

  const response = await openai.chat.completions.create({
    model: GENERATION_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.1,
    max_tokens: 400,
  });

  const content = response.choices[0]?.message?.content || "{}";
  try {
    return parseAIResponse(content);
  } catch (err) {
    return { score: 0, status: "Wrong", feedback: "Could not evaluate automatically. Please wait for manual review." };
  }
};
