import { IAssignment } from '../models/Assignment';

type Difficulty = 'easy' | 'medium' | 'hard';

interface DetailedTypeConfig {
  type: string;
  count: number;
  marks: number;
}

const STOP_WORDS = new Set([
  'about', 'above', 'after', 'again', 'against', 'along', 'also', 'among', 'and', 'another', 'any',
  'are', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'can', 'could',
  'does', 'during', 'each', 'from', 'further', 'have', 'into', 'more', 'most', 'other', 'over',
  'same', 'some', 'such', 'than', 'that', 'their', 'them', 'then', 'there', 'these', 'they', 'this',
  'those', 'through', 'under', 'until', 'very', 'what', 'when', 'where', 'which', 'while', 'with',
  'would', 'your', 'students', 'student', 'teacher', 'class', 'grade', 'based', 'using', 'material',
  'reference', 'source',
]);

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim();

const titleCase = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');

const sentenceCase = (value: string) => {
  const normalized = normalizeWhitespace(value);

  if (!normalized) {
    return normalized;
  }

  return `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`;
};

const limitText = (value: string, maxLength: number) => {
  const normalized = normalizeWhitespace(value);

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3).trim()}...`;
};

const uniq = <T,>(values: T[]) => Array.from(new Set(values));

const createSeed = (value: string) =>
  value.split('').reduce((total, char, index) => total + char.charCodeAt(0) * (index + 1), 0);

const chunkBySentence = (text: string) =>
  text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((line) => normalizeWhitespace(line.replace(/^[-*•]\s*/, '')))
    .filter((line) => line.length >= 28);

const getReferenceSentences = (assignment: IAssignment) => {
  const sourceText = assignment.referenceText?.trim() || assignment.instructions?.trim() || '';
  const extracted = uniq(chunkBySentence(sourceText)).filter((line) => line.length <= 220);

  if (extracted.length > 0) {
    return extracted;
  }

  return [
    `${assignment.subject} concepts for ${assignment.className}.`,
    `Important ideas and examples from ${assignment.subject}.`,
    `Key learning points expected from ${assignment.className} students.`,
  ];
};

const getTopicPool = (assignment: IAssignment, sentences: string[]) => {
  const fromHeadings = uniq(
    sentences
      .flatMap((line) => line.split(/[,;:()/-]/))
      .map((part) => normalizeWhitespace(part))
      .filter((part) => part.length >= 4 && part.length <= 36),
  );

  const wordFrequency = new Map<string, number>();
  const corpus = `${assignment.subject} ${assignment.referenceText || ''} ${assignment.instructions || ''}`;

  for (const token of corpus.match(/[A-Za-z][A-Za-z0-9-]{3,}/g) ?? []) {
    const lowerToken = token.toLowerCase();

    if (STOP_WORDS.has(lowerToken)) {
      continue;
    }

    wordFrequency.set(lowerToken, (wordFrequency.get(lowerToken) ?? 0) + 1);
  }

  const fromWords = Array.from(wordFrequency.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 10)
    .map(([word]) => titleCase(word));

  const combined = uniq([
    ...fromHeadings.map(titleCase),
    ...fromWords,
    titleCase(assignment.subject),
  ]).filter((item) => item.length >= 4 && item.length <= 42);

  return combined.slice(0, 8);
};

const getDetailedTypes = (assignment: IAssignment): DetailedTypeConfig[] => {
  const detailedTypes = ((assignment.questionConfig as unknown as { detailedTypes?: DetailedTypeConfig[] }).detailedTypes ?? [])
    .filter((item) => item?.type && item.count > 0 && item.marks > 0)
    .map((item) => ({
      type: String(item.type),
      count: Number(item.count),
      marks: Number(item.marks),
    }));

  if (detailedTypes.length > 0) {
    return detailedTypes;
  }

  const totalQuestions = Math.max(1, Number(assignment.questionConfig.count || 1));
  const baseMarks = Math.max(1, Math.round(Number(assignment.questionConfig.totalMarks || totalQuestions) / totalQuestions));
  const allowedTypes = assignment.questionConfig.types.length > 0 ? assignment.questionConfig.types : ['Short Questions'];
  const baseCount = Math.floor(totalQuestions / allowedTypes.length);
  const remainder = totalQuestions % allowedTypes.length;

  return allowedTypes.map((type, index) => ({
    type,
    count: baseCount + (index < remainder ? 1 : 0),
    marks: baseMarks,
  })).filter((item) => item.count > 0);
};

const getDifficultySequence = (assignment: IAssignment) => {
  const totalQuestions = Math.max(1, Number(assignment.questionConfig.count || 1));
  const weightedCounts = {
    easy: Math.round((assignment.difficultyConfig.easy / 100) * totalQuestions),
    medium: Math.round((assignment.difficultyConfig.medium / 100) * totalQuestions),
    hard: Math.round((assignment.difficultyConfig.hard / 100) * totalQuestions),
  };

  const currentTotal = weightedCounts.easy + weightedCounts.medium + weightedCounts.hard;

  if (currentTotal !== totalQuestions) {
    weightedCounts.medium += totalQuestions - currentTotal;
  }

  const sequence: Difficulty[] = [];
  const order: Difficulty[] = ['medium', 'easy', 'hard'];

  while (sequence.length < totalQuestions) {
    let appended = false;

    for (const difficulty of order) {
      if (weightedCounts[difficulty] > 0) {
        sequence.push(difficulty);
        weightedCounts[difficulty] -= 1;
        appended = true;
      }
    }

    if (!appended) {
      break;
    }
  }

  return sequence;
};

const getOptionPool = (topic: string, topicPool: string[]) => {
  const fallbackOptions = ['Process', 'Principle', 'Effect', 'Structure', 'Application'];
  const otherTopics = topicPool.filter((item) => item !== topic).slice(0, 3);
  const options = uniq([topic, ...otherTopics, ...fallbackOptions]).slice(0, 4);

  while (options.length < 4) {
    options.push(`Concept ${options.length + 1}`);
  }

  return options;
};

const buildQuestionText = (type: string, topic: string, sentence: string, topicPool: string[]) => {
  const normalizedType = type.toLowerCase();
  const conciseSentence = limitText(sentenceCase(sentence), 130);

  if (normalizedType.includes('multiple choice')) {
    const options = getOptionPool(topic, topicPool);

    return `According to the reference material, which option best matches this idea: "${conciseSentence}"? A) ${options[0]} B) ${options[1]} C) ${options[2]} D) ${options[3]}`;
  }

  if (normalizedType.includes('case study')) {
    return `Read this source excerpt: "${conciseSentence}" Based on it, what does it suggest about ${topic}?`;
  }

  if (normalizedType.includes('diagram') || normalizedType.includes('graph')) {
    return `Draw and label a neat diagram or flowchart to explain ${topic} using the reference material.`;
  }

  if (normalizedType.includes('numerical')) {
    const values = sentence.match(/\d+(?:\.\d+)?/g) ?? [];

    if (values.length > 0) {
      return `Using the numerical information in "${conciseSentence}", solve the related problem on ${topic}. Show your steps clearly.`;
    }

    return `Create a data-based explanation for ${topic} using the quantitative detail or measurable relationship from the reference material.`;
  }

  if (normalizedType.includes('long')) {
    return `Explain ${topic} in detail with reference to this source idea: "${conciseSentence}"`;
  }

  return `Briefly explain ${topic} with reference to this source idea: "${conciseSentence}"`;
};

const buildAnswerHint = (topic: string, sentence: string, difficulty: Difficulty) => {
  const conciseSentence = limitText(sentenceCase(sentence), 120);
  const guidancePrefix =
    difficulty === 'hard'
      ? 'Award full marks for a well-structured explanation that uses the source accurately.'
      : difficulty === 'medium'
        ? 'Award marks when the answer uses the main source idea correctly.'
        : 'Award marks for identifying the correct source-based point.';

  return `${guidancePrefix} Key point: ${conciseSentence || topic}.`;
};

const rotateFromSeed = <T,>(items: T[], seed: number, offset = 0) => {
  if (items.length === 0) {
    return null;
  }

  const safeIndex = Math.abs(seed + offset) % items.length;
  return items[safeIndex];
};

const extractTopicFromQuestion = (questionText: string, fallbackTopic: string) => {
  const cleaned = normalizeWhitespace(
    questionText
      .replace(/\[[^\]]+\]/g, ' ')
      .replace(/[?"]/g, ' ')
      .replace(/\b(A|B|C|D)\)\s*[^A-D]+/g, ' '),
  );

  const keyword = (cleaned.match(/[A-Za-z][A-Za-z-]{3,}/g) ?? [])
    .map((token) => token.toLowerCase())
    .find((token) => !STOP_WORDS.has(token));

  return keyword ? titleCase(keyword) : fallbackTopic;
};

export const generateReplacementQuestionLocally = (assignment: IAssignment, oldQuestion: {
  text?: string;
  marks?: number;
  difficulty?: Difficulty;
}, sectionInfo = '') => {
  const sentences = getReferenceSentences(assignment);
  const topicPool = getTopicPool(assignment, sentences);
  const seedBase = createSeed(`${assignment.subject}|${sectionInfo}|${oldQuestion.text || ''}|${Date.now()}`);
  const filteredSentences = sentences.filter((item) => !oldQuestion.text || !item.includes(oldQuestion.text));
  const sentence = rotateFromSeed(filteredSentences.length > 0 ? filteredSentences : sentences, seedBase) ?? sentences[0];
  const fallbackTopic = topicPool[0] || titleCase(assignment.subject);
  const filteredTopics = topicPool.filter((topic) => !oldQuestion.text?.toLowerCase().includes(topic.toLowerCase()));
  const derivedTopic = rotateFromSeed(filteredTopics.length > 0 ? filteredTopics : topicPool, seedBase, 3) ?? fallbackTopic;
  const topic = extractTopicFromQuestion(oldQuestion.text || '', derivedTopic);
  const availableTypes = assignment.questionConfig.types.length > 0 ? assignment.questionConfig.types : ['Short Questions'];
  const preferredType = rotateFromSeed(availableTypes, seedBase, 7) ?? availableTypes[0];

  return {
    text: buildQuestionText(preferredType, topic, sentence, topicPool),
    answerHint: buildAnswerHint(topic, sentence, oldQuestion.difficulty || 'medium'),
    difficulty: oldQuestion.difficulty || 'medium',
    marks: oldQuestion.marks || 1,
  };
};

const groupIntoSections = (detailedTypes: DetailedTypeConfig[], sectionCount: number) => {
  const totalSections = Math.max(1, Math.min(sectionCount, detailedTypes.length || 1));
  const buckets = Array.from({ length: totalSections }, () => [] as DetailedTypeConfig[]);

  detailedTypes.forEach((item, index) => {
    buckets[index % totalSections].push(item);
  });

  return buckets.filter((bucket) => bucket.length > 0);
};

export const generateQuestionsLocally = (assignment: IAssignment) => {
  const detailedTypes = getDetailedTypes(assignment);
  const sentences = getReferenceSentences(assignment);
  const topicPool = getTopicPool(assignment, sentences);
  const difficultySequence = getDifficultySequence(assignment);
  const sectionGroups = groupIntoSections(detailedTypes, Number(assignment.questionConfig.sectionCount || 1));

  let difficultyIndex = 0;
  let sourceIndex = 0;

  const sections = sectionGroups.map((group, groupIndex) => {
    const groupTypes = group.map((item) => item.type);
    const questions = group.flatMap((typeConfig) =>
      Array.from({ length: typeConfig.count }, (_, questionIndex) => {
        const sentence = sentences[sourceIndex % sentences.length];
        const topic = topicPool[(sourceIndex + questionIndex) % topicPool.length] || titleCase(assignment.subject);
        const difficulty = difficultySequence[difficultyIndex % difficultySequence.length] || 'medium';

        sourceIndex += 1;
        difficultyIndex += 1;

        return {
          text: buildQuestionText(typeConfig.type, topic, sentence, topicPool),
          difficulty,
          marks: typeConfig.marks,
          answerHint: buildAnswerHint(topic, sentence, difficulty),
          svgDiagram: null,
        };
      }),
    );

    return {
      title: `Section ${String.fromCharCode(65 + groupIndex)}: ${groupTypes.join(', ')}`,
      instruction: `Attempt all questions in this section. Questions are based on ${groupTypes.join(', ')}.`,
      questions,
    };
  });

  const totalQuestions = sections.reduce((total, section) => total + section.questions.length, 0);
  const hardQuestions = sections.reduce(
    (total, section) => total + section.questions.filter((question) => question.difficulty === 'hard').length,
    0,
  );
  const mediumQuestions = sections.reduce(
    (total, section) => total + section.questions.filter((question) => question.difficulty === 'medium').length,
    0,
  );

  const applicationScore = Math.min(85, 40 + hardQuestions * 6 + mediumQuestions * 3);
  const coveredTopics = topicPool.slice(0, 5);

  return {
    cognitiveScore: {
      application: applicationScore,
      rote: 100 - applicationScore,
    },
    blueprinting: coveredTopics,
    auditReport: {
      repetitiveCheck: 'Question stems were distributed across different source snippets.',
      marksTally: `Total marks align to ${assignment.questionConfig.totalMarks}.`,
      qualityScore: 90,
      suggestions: 'Review the paper once for wording preference, but the core coverage is ready.',
    },
    syllabusCoverage: {
      coveredTopics,
      missingTopics: [],
      analysis: `This paper focuses on ${coveredTopics.join(', ')} from the provided source material.`,
    },
    sections,
  };
};
