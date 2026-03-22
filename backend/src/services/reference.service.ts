import { execFile } from 'child_process';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

const SUPPORTED_REFERENCE_CONTENT_TYPES = new Set(['application/pdf', 'text/plain']);
const MAX_REFERENCE_TEXT_LENGTH = 18000;

const normalizeReferenceText = (value: string) =>
  value
    .replace(/\u0000/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

const runPdfToText = (inputPath: string) =>
  new Promise<string>((resolve, reject) => {
    execFile(
      'pdftotext',
      ['-layout', '-nopgbrk', inputPath, '-'],
      { maxBuffer: 1024 * 1024 * 20 },
      (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(stdout);
      },
    );
  });

export const getReferenceContentType = (value: string | string[] | undefined) =>
  String(Array.isArray(value) ? value[0] : value ?? '')
    .split(';')[0]
    .trim()
    .toLowerCase();

export const isSupportedReferenceContentType = (value: string) =>
  SUPPORTED_REFERENCE_CONTENT_TYPES.has(value);

export const limitReferenceText = (value: string, maxLength = MAX_REFERENCE_TEXT_LENGTH) => {
  if (value.length <= maxLength) {
    return {
      text: value,
      wasTruncated: false,
    };
  }

  return {
    text: `${value.slice(0, maxLength).trim()}\n\n[Reference truncated for processing due to length.]`,
    wasTruncated: true,
  };
};

export const extractReferenceText = async (fileBuffer: Buffer, contentType: string) => {
  if (contentType === 'text/plain') {
    return normalizeReferenceText(fileBuffer.toString('utf8'));
  }

  if (contentType !== 'application/pdf') {
    throw new Error(`Unsupported reference content type: ${contentType}`);
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'veda-reference-'));
  const tempFilePath = path.join(tempDir, 'reference.pdf');

  try {
    await fs.writeFile(tempFilePath, fileBuffer);
    const extractedText = await runPdfToText(tempFilePath);

    return normalizeReferenceText(extractedText);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
};
