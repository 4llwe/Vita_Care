import PDFDocument from 'pdfkit';
import { VITA_BRAND, tanggalIndo } from '../branding';

export type PdfDoc = PDFKit.PDFDocument;

/** Bungkus pembuatan PDF menjadi Promise<Buffer>. */
export function buildPdf(draw: (doc: PdfDoc) => void): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    try {
      draw(doc);
      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

/** Kop surat resmi Vita Care Lombok. */
export function drawLetterhead(doc: PdfDoc, subtitle?: string): void {
  const { colors } = VITA_BRAND;
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;

  // Logo bulat sederhana (inisial)
  doc.save();
  doc.circle(left + 16, 62, 16).fill(colors.green);
  doc.fillColor('#FFFFFF').fontSize(14).font('Helvetica-Bold').text('V', left + 10, 55);
  doc.restore();

  doc.fillColor(colors.greenDark).font('Helvetica-Bold').fontSize(18).text(VITA_BRAND.name, left + 44, 48);
  doc.fillColor(colors.muted).font('Helvetica').fontSize(9).text(VITA_BRAND.tagline, left + 44, 70);
  doc
    .fontSize(8)
    .fillColor(colors.slate)
    .text(`${VITA_BRAND.address}`, left + 44, 84)
    .text(`Telp/WA: ${VITA_BRAND.phone}  ·  ${VITA_BRAND.email}  ·  IG ${VITA_BRAND.instagram}`, left + 44, 95);

  doc.moveTo(left, 116).lineTo(right, 116).lineWidth(2).strokeColor(colors.green).stroke();
  doc.moveTo(left, 119).lineTo(right, 119).lineWidth(1).strokeColor(colors.blue).stroke();

  doc.y = 132;
  if (subtitle) {
    doc.fillColor(colors.blueDark).font('Helvetica-Bold').fontSize(13).text(subtitle, left, doc.y, { align: 'center' });
    doc.moveDown(0.3);
    doc.fillColor(colors.muted).font('Helvetica').fontSize(8).text(`Dicetak: ${tanggalIndo()}`, { align: 'center' });
    doc.moveDown(1);
  }
  doc.fillColor(colors.slate);
}

/** Judul seksi dengan garis bawah berwarna. */
export function sectionTitle(doc: PdfDoc, title: string): void {
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  doc.moveDown(0.6);
  doc.fillColor(VITA_BRAND.colors.greenDark).font('Helvetica-Bold').fontSize(11).text(title, left, doc.y);
  const y = doc.y + 2;
  doc.moveTo(left, y).lineTo(right, y).lineWidth(0.7).strokeColor(VITA_BRAND.colors.line).stroke();
  doc.moveDown(0.4);
  doc.fillColor(VITA_BRAND.colors.slate).font('Helvetica').fontSize(10);
}

/** Baris key-value rapi (label kiri, nilai kanan). */
export function kvRow(doc: PdfDoc, label: string, value: string): void {
  const left = doc.page.margins.left;
  const y = doc.y;
  doc.font('Helvetica-Bold').fontSize(9).fillColor(VITA_BRAND.colors.muted).text(label, left, y, { width: 150 });
  doc.font('Helvetica').fontSize(10).fillColor(VITA_BRAND.colors.slate).text(value, left + 160, y, { width: 320 });
  doc.moveDown(0.5);
}

/** Tabel sederhana dengan header berwarna. */
export function simpleTable(
  doc: PdfDoc,
  headers: string[],
  rows: string[][],
  widths: number[],
): void {
  const left = doc.page.margins.left;
  const startX = left;
  const rowH = 18;
  const drawHeader = (y: number) => {
    let x = startX;
    doc.rect(startX, y, widths.reduce((a, b) => a + b, 0), rowH).fill(VITA_BRAND.colors.green);
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8.5);
    headers.forEach((h, i) => {
      doc.text(h, x + 4, y + 5, { width: widths[i] - 8 });
      x += widths[i];
    });
    doc.fillColor(VITA_BRAND.colors.slate).font('Helvetica').fontSize(8.5);
  };
  let y = doc.y;
  drawHeader(y);
  y += rowH;
  rows.forEach((r, idx) => {
    if (y + rowH > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      y = doc.page.margins.top;
      drawHeader(y);
      y += rowH;
    }
    if (idx % 2 === 1) {
      doc.rect(startX, y, widths.reduce((a, b) => a + b, 0), rowH).fill('#F1F5F9');
      doc.fillColor(VITA_BRAND.colors.slate);
    }
    let x = startX;
    r.forEach((c, i) => {
      doc.fillColor(VITA_BRAND.colors.slate).font('Helvetica').fontSize(8.5).text(c, x + 4, y + 5, { width: widths[i] - 8, ellipsis: true, height: rowH - 6 });
      x += widths[i];
    });
    y += rowH;
  });
  doc.y = y + 6;
}

/** Blok tanda tangan di kanan bawah. */
export function signatureBlock(doc: PdfDoc, role: string, place = 'Mataram'): void {
  const right = doc.page.width - doc.page.margins.right;
  const x = right - 200;
  doc.moveDown(2);
  const y = doc.y;
  doc.font('Helvetica').fontSize(9).fillColor(VITA_BRAND.colors.slate);
  doc.text(`${place}, ${tanggalIndo()}`, x, y, { width: 200, align: 'center' });
  doc.text(role, x, y + 14, { width: 200, align: 'center' });
  doc.text('(________________________)', x, y + 64, { width: 200, align: 'center' });
}
