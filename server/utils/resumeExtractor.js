/**
 * Resume Text Extractor
 *
 * Extracts plain text from uploaded PDF / DOC / DOCX files.
 * Uses: pdf-parse for PDF, mammoth for DOC/DOCX.
 *
 * extractText(filePath, mimeType) → Promise<string>
 */

const fs = require('fs');
const path = require('path');

/**
 * Extract plain text from a resume file.
 *
 * @param {string} filePath   - Absolute path to the uploaded file
 * @param {string} mimeType   - MIME type (e.g. 'application/pdf')
 * @returns {Promise<string>} - Extracted plain text (may be empty string)
 */
const extractText = async (filePath, mimeType) => {
  const ext = path.extname(filePath).toLowerCase();

  // ── PDF ───────────────────────────────────────────────────────────────────
  if (mimeType === 'application/pdf' || ext === '.pdf') {
    const pdfModule = require('pdf-parse');
    const buffer = fs.readFileSync(filePath);

    if (typeof pdfModule === 'function') {
      const data = await pdfModule(buffer);
      return (data.text || '').trim();
    }
    if (pdfModule.PDFParse) {
      const parser = new pdfModule.PDFParse({ data: buffer });
      const result = await parser.getText();
      if (typeof parser.destroy === 'function') {
        await parser.destroy();
      }
      return (result.text || '').trim();
    }
    if (typeof pdfModule.default === 'function') {
      const data = await pdfModule.default(buffer);
      return (data.text || '').trim();
    }

    throw new Error('Could not parse PDF: incompatible pdf-parse library.');
  }

  // ── DOC / DOCX ────────────────────────────────────────────────────────────
  if (
    mimeType === 'application/msword' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === '.doc' ||
    ext === '.docx'
  ) {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ path: filePath });
    return (result.value || '').trim();
  }

  throw new Error(`Unsupported file type: ${mimeType || ext}`);
};

module.exports = { extractText };
