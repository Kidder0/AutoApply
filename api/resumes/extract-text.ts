// Vercel Serverless Function: POST /api/resumes/extract-text
// Extracts text from uploaded documents (PDF, DOCX, DOC, TXT)

import { VercelRequest, VercelResponse } from '@vercel/node';
import path from 'path';

let pdf: any;
let mammoth: any;

// Lazy load pdf-parse and mammoth only if available
async function loadLibraries() {
  try {
    if (!pdf) {
      const pdfModule = await import('pdf-parse');
      pdf = pdfModule.default || pdfModule;
    }
    if (!mammoth) {
      const mammothModule = await import('mammoth');
      mammoth = mammothModule.default || mammothModule;
    }
  } catch (err) {
    console.warn('⚠️ PDF/DOCX libraries not available on this platform');
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed. Use POST.',
      status: 'error'
    });
  }

  const { base64, fileName } = req.body;

  if (!base64 || !fileName) {
    return res.status(400).json({
      error: 'Missing file content (base64) or fileName.',
      status: 'error'
    });
  }

  try {
    console.log(`📄 Extracting text from: ${fileName}`);

    const buffer = Buffer.from(base64, 'base64');
    const extension = path.extname(fileName).toLowerCase();

    let extractedText = '';

    // Try to load libraries
    await loadLibraries();

    if (extension === '.pdf') {
      console.log('📖 Processing PDF...');
      try {
        if (pdf) {
          const pdfData = await pdf(buffer);
          extractedText = pdfData.text || '';
        } else {
          throw new Error('PDF processing library not available. Please paste text directly.');
        }
      } catch (pdfErr: any) {
        console.warn('PDF parsing failed, will require manual paste:', pdfErr.message);
        return res.status(400).json({
          error: 'PDF extraction unavailable on this platform. Please paste your resume text directly.',
          hint: 'You can open the PDF, copy the text, and paste it in the text area.',
          status: 'fallback'
        });
      }
    } else if (extension === '.docx') {
      console.log('📝 Processing DOCX...');
      try {
        if (mammoth) {
          const result = await mammoth.extractRawText({ buffer });
          extractedText = result.value || '';
        } else {
          throw new Error('DOCX processing library not available. Please paste text directly.');
        }
      } catch (docxErr: any) {
        console.warn('DOCX parsing failed:', docxErr.message);
        return res.status(400).json({
          error: 'DOCX extraction unavailable on this platform. Please paste your resume text directly.',
          hint: 'You can open the DOCX, copy the text, and paste it in the text area.',
          status: 'fallback'
        });
      }
    } else if (extension === '.doc') {
      console.log('📋 Processing legacy DOC...');
      const rawText = buffer.toString('utf-8');
      extractedText = rawText.replace(/[^\x20-\x7E\s]/g, '');
      extractedText = extractedText.replace(/\s+/g, ' ').trim();

      if (extractedText.length < 50) {
        return res.status(400).json({
          error: 'Could not extract meaningful text from DOC file. Please convert to DOCX or PDF first.',
          hint: 'Open the file in Microsoft Word and save as .docx, then try again.',
          status: 'error'
        });
      }
    } else if (extension === '.txt' || extension === '.md') {
      console.log('📄 Processing text file...');
      extractedText = buffer.toString('utf-8');
    } else {
      return res.status(400).json({
        error: `Unsupported file extension: ${extension}. Supported: .pdf, .docx, .doc, .txt, .md`,
        status: 'error'
      });
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({
        error: 'No text could be extracted from the file. Is it empty or corrupted?',
        status: 'error'
      });
    }

    console.log(`✅ Successfully extracted ${extractedText.length} characters`);

    return res.status(200).json({
      text: extractedText,
      fileName,
      extractedLength: extractedText.length,
      fileType: extension,
      status: 'success'
    });
  } catch (error: any) {
    console.error('❌ Text extraction failed:', error.message);
    return res.status(500).json({
      error: 'Document text extraction failed. Please try pasting your resume text directly.',
      details: error.message,
      hint: 'Copy your resume text and paste it in the text area instead.',
      status: 'error'
    });
  }
}
