import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// Very basic text wrap
function wrapText(text, maxChars) {
  const words = text.split(" ");
  let lines = [];
  let currentLine = "";

  words.forEach((word) => {
    if ((currentLine + word).length <= maxChars) {
      currentLine += word + " ";
    } else {
      lines.push(currentLine.trim());
      currentLine = word + " ";
    }
  });
  if (currentLine.trim()) lines.push(currentLine.trim());
  return lines;
}

// Strips HTML tags
function stripHtml(html) {
  return html.replace(/<[^>]+>/g, "");
}

/**
 * generatePDFWithRedaction
 * @param {Object} options
 * @param {Object} options.patient
 * @param {string} options.notesHtml
 * @param {string} [options.signatureData] Base64 PNG data
 * @param {string[]} [options.redactFields] e.g. ['dob','address']
 * @param {string|null} [options.password]
 */
export async function generatePDFWithRedaction({
  patient,
  notesHtml,
  signatureData,
  redactFields = [],
  password = null
}) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let yCursor = height - 50;
  page.drawText(`Patient Report for: ${patient.name}`, {
    x: 50,
    y: yCursor,
    size: 14,
    font,
    color: rgb(0.2, 0.2, 0.8)
  });
  yCursor -= 25;

  // Conditionally redact some fields
  if (!redactFields.includes("dob")) {
    page.drawText(`DOB: ${patient.dob}`, {
      x: 50,
      y: yCursor,
      size: 12,
      font,
      color: rgb(0, 0, 0)
    });
    yCursor -= 20;
  }
  if (!redactFields.includes("address")) {
    page.drawText(`Address: ${patient.address}`, {
      x: 50,
      y: yCursor,
      size: 12,
      font,
      color: rgb(0, 0, 0)
    });
    yCursor -= 20;
  }
  // ... add any other fields you'd want to conditionally hide

  // Insert notes
  const text = stripHtml(notesHtml);
  const lines = wrapText(text, 80);
  lines.forEach((line) => {
    page.drawText(line, {
      x: 50,
      y: yCursor,
      size: 10,
      font,
      color: rgb(0, 0, 0)
    });
    yCursor -= 15;
  });

  // Insert signature image if provided
  if (signatureData) {
    const signatureImage = await pdfDoc.embedPng(signatureData);
    const sigWidth = 100;
    const sigHeight = 50;
    page.drawImage(signatureImage, {
      x: 50,
      y: yCursor - sigHeight - 10,
      width: sigWidth,
      height: sigHeight
    });
    yCursor -= sigHeight + 20;
  }

  // (Optional) pdf-lib doesn't natively encrypt. You can do post-processing with qpdf or similar.
  // This is just a placeholder note:
  if (password) {
    console.warn("pdf-lib does not provide encryption out of the box. Use external tools.");
  }

  return await pdfDoc.save();
}
