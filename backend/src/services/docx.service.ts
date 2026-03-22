import { IAssignment } from '../models/Assignment';
import { IResult } from '../models/Result';
import HTMLToDOCX from 'html-to-docx';
import fs from 'fs';
import path from 'path';

export const generateDocx = async (assignment: IAssignment, result: IResult, isAnswerKey = false): Promise<string> => {
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${assignment.subject} ${isAnswerKey ? 'Answer Key' : 'Assessment'}</title>
      <style>
        body { font-family: 'Arial', sans-serif; font-size: 14px; }
        h1 { text-align: center; color: #0f172a; font-size: 24px; text-transform: uppercase; }
        h2 { text-align: center; color: #2563eb; font-size: 16px; margin-bottom: 20px; }
        p { margin: 5px 0; }
        .details { margin-bottom: 20px; border-bottom: 2px solid #ccc; padding-bottom: 10px; }
        .section-title { font-size: 18px; font-weight: bold; margin-top: 20px; background-color: #f1f5f9; padding: 5px; }
        .instruction { font-style: italic; color: #475569; margin-bottom: 15px; }
        .question { margin-top: 15px; margin-bottom: 10px; }
        .answer-hint { color: #059669; font-style: italic; margin-left: 20px; margin-top: 5px; }
      </style>
    </head>
    <body>
      <h2>VedaAI Institute</h2>
      <h1>${assignment.subject} ${isAnswerKey ? '- ANSWER KEY' : ''}</h1>
      <div class="details">
        <p><strong>Class:</strong> ${assignment.className}</p>
        <p><strong>Max Marks:</strong> ${assignment.questionConfig.totalMarks}</p>
        <p><strong>Duration:</strong> ${assignment.questionConfig.duration || 'N/A'} mins</p>
      </div>

      ${result.sections.map((section: any) => `
        <div>
          <div class="section-title">${section.title}</div>
          <p class="instruction">${section.instruction}</p>
          <div>
            ${section.questions.map((q: any, qIdx: number) => `
              <div class="question">
                <p><strong>${qIdx + 1}.</strong> ${q.text} <em>[${q.marks} Marks]</em></p>
                ${isAnswerKey && q.answerHint ? `<div class="answer-hint"><strong>Answer/Rubric:</strong> ${q.answerHint}</div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
      
      <p style="text-align: center; font-size: 10px; margin-top: 40px;">--- End of Document ---</p>
    </body>
    </html>
  `;

  const fileBuffer = await HTMLToDOCX(htmlContent, null, {
    table: { row: { cantSplit: true } },
    footer: true,
    pageNumber: true,
  });

  const publicDir = path.join(__dirname, '../../public/docx');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const fileName = `${assignment._id}_${result._id}${isAnswerKey ? '_key' : ''}.docx`;
  const filePath = path.join(publicDir, fileName);

  fs.writeFileSync(filePath, fileBuffer as any);

  return `/docx/${fileName}`;
};
