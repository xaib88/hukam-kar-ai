const fs = require('fs');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const xlsx = require('xlsx');

/**
 * Universal PDF Text Extractor supporting both pdf-parse v1 (function) and v2 (class)
 */
async function extractPdfText(dataBuffer) {
  // Check if pdf is direct function (pdf-parse v1)
  if (typeof pdf === 'function') {
    const data = await pdf(dataBuffer);
    return {
      text: (data.text || '').trim(),
      pages: data.numpages || 1
    };
  }

  // Check if pdf-parse v2 class
  if (pdf && pdf.PDFParse) {
    const parser = new pdf.PDFParse({ data: dataBuffer });
    try {
      const result = await parser.getText();
      const rawText = typeof result === 'string' ? result : (result.text || '');
      // Clean up internal page markers like "-- 1 of 2 --"
      const cleanText = rawText.replace(/--\s*\d+\s*of\s*\d+\s*--/gi, '').trim();
      return {
        text: cleanText,
        pages: result.total || (result.pages ? result.pages.length : 1)
      };
    } finally {
      try { await parser.destroy(); } catch (e) {}
    }
  }

  // Check if default export
  if (pdf && typeof pdf.default === 'function') {
    const data = await pdf.default(dataBuffer);
    return {
      text: (data.text || '').trim(),
      pages: data.numpages || 1
    };
  }

  throw new Error('No compatible PDF parser method found on pdf-parse');
}

/**
 * Extracts raw text and basic metadata from an uploaded file
 * Supports: PDF, DOCX, XLSX, XLS, CSV, TXT
 */
async function extractTextFromFile(filePath, originalFilename, mimeType) {
  const ext = (originalFilename.split('.').pop() || '').toLowerCase();
  
  try {
    if (ext === 'pdf' || mimeType === 'application/pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const { text, pages } = await extractPdfText(dataBuffer);
      return {
        text,
        pages,
        format: 'PDF',
        filename: originalFilename
      };
    }

    if (ext === 'docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ path: filePath });
      return {
        text: result.value.trim(),
        pages: 1,
        format: 'DOCX',
        filename: originalFilename
      };
    }

    if (['xlsx', 'xls', 'csv'].includes(ext) || mimeType?.includes('sheet') || mimeType?.includes('csv')) {
      const workbook = xlsx.readFile(filePath);
      let fullText = '';
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const csv = xlsx.utils.sheet_to_csv(sheet);
        if (csv.trim()) {
          fullText += `--- Sheet: ${sheetName} ---\n${csv}\n\n`;
        }
      });
      return {
        text: fullText.trim(),
        pages: workbook.SheetNames.length,
        format: ext.toUpperCase(),
        filename: originalFilename
      };
    }

    // Default to plain text
    const text = fs.readFileSync(filePath, 'utf8');
    return {
      text: text.trim(),
      pages: 1,
      format: ext.toUpperCase() || 'TXT',
      filename: originalFilename
    };
  } catch (err) {
    console.error(`Error parsing file ${originalFilename}:`, err.message);
    throw new Error(`Failed to parse ${originalFilename}: ${err.message}`);
  }
}

module.exports = {
  extractTextFromFile
};
