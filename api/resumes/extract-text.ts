// Vercel Serverless Function: POST /api/resumes/extract-text
// Extracts text from uploaded documents (PDF, DOCX, DOC, TXT)

import { VercelRequest, VercelResponse } from '@vercel/node';
import path from 'path';

const pdf = require('pdf-parse');
const mammoth = require('mammoth');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { base64, fileName } = req.body;

  if (!base64 || !fileName) {
    return res.status(400).json({
      error: 'Missing file content (base64) or fileName.',
    });
  }

  try {
    console.log(`📄 Extracting text from: ${fileName}`);

    const buffer = Buffer.from(base64, 'base64');
    const extension = path.extname(fileName).toLowerCase();

    let extractedText = '';

    if (extension === '.pdf') {
      console.log('📖 Processing PDF...');
      const pdfData = await pdf(buffer);
      extractedText = pdfData.text || '';
    } else if (extension === '.docx') {
      console.log('📝 Processing DOCX...');
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value || '';
    } else if (extension === '.doc') {
      console.log('📋 Processing legacy DOC...');
      const rawText = buffer.toString('utf-8');
      extractedText = rawText.replace(/[^\x20-\x7E\s]/g, '');
      extractedText = extractedText.replace(/\s+/g, ' ').trim();

      if (extractedText.length < 50) {
        throw new Error(
          'Extracted text too short. Please convert the legacy .doc to .docx or .pdf for high fidelity parsing.'
        );
      }
    } else if (extension === '.txt' || extension === '.md') {
      console.log('📄 Processing text file...');
      extractedText = buffer.toString('utf-8');
    } else {
      return res.status(400).json({
        error: 'Unsupported file extension. Only .pdf, .docx, .doc, .txt, and .md files are supported.',
      });
    }

    console.log(`✅ Successfully extracted ${extractedText.length} characters`);

    return res.status(200).json({
      text: extractedText,
      fileName,
      extractedLength: extractedText.length,
      fileType: extension,
    });
  } catch (error: any) {
    console.error('❌ Text extraction failed:', error.message);
    return res.status(500).json({
      error: 'Document text extraction failed. Please ensure the file is not password-protected and is valid.',
      details: error.message,
    });
  }
}
