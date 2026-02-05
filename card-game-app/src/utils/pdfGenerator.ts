import jsPDF from 'jspdf';
import type { Game } from '../types';

interface PdfOptions {
  includeBackCards: boolean;
  includeCutMarks: boolean;
  cardsPerRow: number;
  pageMargin: number;
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
}

function wrapText(doc: jsPDF, text: string, maxWidth: number, fontSize: number): string[] {
  doc.setFontSize(fontSize);
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = doc.getTextWidth(testLine);
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export async function generatePdf(game: Game, options: PdfOptions): Promise<void> {
  const { includeBackCards, includeCutMarks, cardsPerRow, pageMargin } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageW = 210;
  const pageH = 297;
  const cardW = game.settings.cardWidth;
  const cardH = game.settings.cardHeight;
  const availW = pageW - 2 * pageMargin;
  const availH = pageH - 2 * pageMargin;
  const actualCardsPerRow = Math.min(cardsPerRow, Math.floor(availW / cardW));
  const cardsPerCol = Math.floor(availH / cardH);
  const cardsPerPage = actualCardsPerRow * cardsPerCol;

  // Center the grid on the page
  const gridW = actualCardsPerRow * cardW;
  const gridH = cardsPerCol * cardH;
  const offsetX = (pageW - gridW) / 2;
  const offsetY = (pageH - gridH) / 2;

  const totalPages = Math.ceil(game.cards.length / cardsPerPage);

  const primaryRgb = hexToRgb(game.settings.primaryColor);
  const secondaryRgb = hexToRgb(game.settings.secondaryColor);

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    if (pageIdx > 0) doc.addPage();

    const startCardIdx = pageIdx * cardsPerPage;
    const endCardIdx = Math.min(startCardIdx + cardsPerPage, game.cards.length);
    const pageCards = game.cards.slice(startCardIdx, endCardIdx);

    // Draw cut marks
    if (includeCutMarks) {
      drawCutMarks(doc, offsetX, offsetY, gridW, gridH, cardW, cardH, actualCardsPerRow, cardsPerCol);
    }

    // Draw front cards
    pageCards.forEach((card, i) => {
      const row = Math.floor(i / actualCardsPerRow);
      const col = i % actualCardsPerRow;
      const x = offsetX + col * cardW;
      const y = offsetY + row * cardH;

      drawFrontCard(doc, game, card, x, y, cardW, cardH, primaryRgb);
    });

    // Add page number
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`${game.name} - Page ${pageIdx * (includeBackCards ? 2 : 1) + 1} (Rectos)`, pageW / 2, pageH - 3, { align: 'center' });

    // Draw back cards (on next page, mirrored horizontally)
    if (includeBackCards) {
      doc.addPage();

      if (includeCutMarks) {
        drawCutMarks(doc, offsetX, offsetY, gridW, gridH, cardW, cardH, actualCardsPerRow, cardsPerCol);
      }

      pageCards.forEach((card, i) => {
        const row = Math.floor(i / actualCardsPerRow);
        const col = i % actualCardsPerRow;
        // Mirror horizontally for back side (so it aligns when printed double-sided)
        const mirroredCol = actualCardsPerRow - 1 - col;
        const x = offsetX + mirroredCol * cardW;
        const y = offsetY + row * cardH;

        drawBackCard(doc, game, card, x, y, cardW, cardH, secondaryRgb);
      });

      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(`${game.name} - Page ${pageIdx * 2 + 2} (Versos)`, pageW / 2, pageH - 3, { align: 'center' });
    }
  }

  doc.save(`${game.name.replace(/[^a-zA-Z0-9àâäéèêëïîôùûüÿçÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ ]/g, '_')}.pdf`);
}

function drawCutMarks(
  doc: jsPDF,
  offsetX: number,
  offsetY: number,
  gridW: number,
  gridH: number,
  cardW: number,
  cardH: number,
  cols: number,
  rows: number
) {
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.1);
  const markLen = 3;

  for (let col = 0; col <= cols; col++) {
    const x = offsetX + col * cardW;
    // Top marks
    doc.line(x, offsetY - markLen, x, offsetY);
    // Bottom marks
    doc.line(x, offsetY + gridH, x, offsetY + gridH + markLen);
  }

  for (let row = 0; row <= rows; row++) {
    const y = offsetY + row * cardH;
    // Left marks
    doc.line(offsetX - markLen, y, offsetX, y);
    // Right marks
    doc.line(offsetX + gridW, y, offsetX + gridW + markLen, y);
  }
}

function drawFrontCard(
  doc: jsPDF,
  game: Game,
  card: (typeof game.cards)[0],
  x: number,
  y: number,
  w: number,
  h: number,
  primaryRgb: [number, number, number]
) {
  const padding = 3;
  const innerW = w - 2 * padding;

  // Card border
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.roundedRect(x + 0.5, y + 0.5, w - 1, h - 1, 2, 2);

  // Top color bar
  doc.setFillColor(...primaryRgb);
  doc.rect(x + 0.5, y + 0.5, w - 1, 4, 'F');

  // Game type label
  doc.setFontSize(6);
  doc.setTextColor(255, 255, 255);
  const typeLabel = game.type === 'category' ? 'CATEGORISER' : 'VRAI OU FAUX ?';
  doc.text(typeLabel, x + w / 2, y + 3.5, { align: 'center' });

  // Card number
  doc.setFontSize(5);
  doc.setTextColor(180, 180, 180);
  doc.text(`#${card.order + 1}`, x + w - padding, y + 3.5, { align: 'right' });

  // Use case text
  let currentY = y + 9;
  doc.setTextColor(30, 30, 30);
  const fontSize = innerW < 50 ? 7 : 8;
  const lines = wrapText(doc, card.front.useCase, innerW, fontSize);
  doc.setFontSize(fontSize);

  for (const line of lines) {
    if (currentY > y + h - 10) break;
    doc.text(line, x + padding, currentY);
    currentY += fontSize * 0.4;
  }

  // Custom fields at the bottom
  const frontFields = game.customFields.filter((f) => f.showOnFront);
  if (frontFields.length > 0) {
    let fieldY = y + h - padding - frontFields.length * 3.5;
    doc.setFontSize(5.5);
    doc.setDrawColor(230, 230, 230);
    doc.line(x + padding, fieldY - 1.5, x + w - padding, fieldY - 1.5);

    for (const field of frontFields) {
      const value = card.front.customFieldValues[field.id];
      if (value === undefined && value === null) continue;
      doc.setTextColor(120, 120, 120);
      doc.text(field.name + ':', x + padding, fieldY);
      doc.setTextColor(50, 50, 50);
      let displayValue = String(value || '—');
      if (field.type === 'rating') {
        displayValue = '★'.repeat(Number(value) || 0) + '☆'.repeat((field.maxRating || 5) - (Number(value) || 0));
      }
      doc.text(displayValue, x + padding + doc.getTextWidth(field.name + ': '), fieldY);
      fieldY += 3.5;
    }
  }

  // Category options hint at the very bottom for category games
  if (game.type === 'category' && game.categories.length > 0) {
    const catY = y + h - 2;
    doc.setFontSize(4);
    doc.setTextColor(160, 160, 160);
    const catNames = game.categories.map((c) => c.name).join(' | ');
    doc.text(catNames, x + w / 2, catY, { align: 'center', maxWidth: innerW });
  }
}

function drawBackCard(
  doc: jsPDF,
  game: Game,
  card: (typeof game.cards)[0],
  x: number,
  y: number,
  w: number,
  h: number,
  secondaryRgb: [number, number, number]
) {
  const padding = 3;
  const innerW = w - 2 * padding;

  // Card border
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.roundedRect(x + 0.5, y + 0.5, w - 1, h - 1, 2, 2);

  // Top color bar
  doc.setFillColor(...secondaryRgb);
  doc.rect(x + 0.5, y + 0.5, w - 1, 4, 'F');

  // "REPONSE" label
  doc.setFontSize(6);
  doc.setTextColor(255, 255, 255);
  doc.text('REPONSE', x + w / 2, y + 3.5, { align: 'center' });

  // Answer
  let currentY = y + 10;

  if (game.type === 'category') {
    const category = game.categories.find((c) => c.id === card.back.answer);
    if (category) {
      const catRgb = hexToRgb(category.color);
      doc.setFillColor(...catRgb);
      const badgeW = Math.min(innerW, doc.getTextWidth(category.name) * 1.5 + 6);
      doc.roundedRect(x + (w - badgeW) / 2, currentY - 3, badgeW, 5, 1, 1, 'F');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text(category.name, x + w / 2, currentY, { align: 'center' });
    }
  } else {
    const isTrue = card.back.answer === 'true';
    doc.setFillColor(isTrue ? 34 : 239, isTrue ? 197 : 68, isTrue ? 94 : 68);
    const label = isTrue ? 'VRAI' : 'FAUX';
    const badgeW = 15;
    doc.roundedRect(x + (w - badgeW) / 2, currentY - 3, badgeW, 5, 1, 1, 'F');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(label, x + w / 2, currentY, { align: 'center' });
  }

  currentY += 5;

  // Explanation
  if (card.back.explanation) {
    doc.setFontSize(5.5);
    doc.setTextColor(80, 80, 80);
    doc.text('Explication :', x + padding, currentY);
    currentY += 2.5;

    doc.setTextColor(50, 50, 50);
    const fontSize = innerW < 50 ? 5.5 : 6;
    const lines = wrapText(doc, card.back.explanation, innerW, fontSize);
    doc.setFontSize(fontSize);

    for (const line of lines) {
      if (currentY > y + h - 12) break;
      doc.text(line, x + padding, currentY);
      currentY += fontSize * 0.38;
    }
  }

  // Feedback
  if (card.back.feedback) {
    currentY += 2;
    doc.setFontSize(5.5);
    doc.setTextColor(80, 80, 80);
    doc.text('Feedback :', x + padding, currentY);
    currentY += 2.5;

    doc.setTextColor(50, 50, 50);
    const fontSize = innerW < 50 ? 5.5 : 6;
    const lines = wrapText(doc, card.back.feedback, innerW, fontSize);
    doc.setFontSize(fontSize);

    for (const line of lines) {
      if (currentY > y + h - 4) break;
      doc.text(line, x + padding, currentY);
      currentY += fontSize * 0.38;
    }
  }

  // Back fields
  const backFields = game.customFields.filter((f) => f.showOnBack);
  if (backFields.length > 0 && currentY < y + h - 6) {
    currentY += 1;
    doc.setDrawColor(230, 230, 230);
    doc.line(x + padding, currentY, x + w - padding, currentY);
    currentY += 2.5;

    doc.setFontSize(5);
    for (const field of backFields) {
      if (currentY > y + h - 4) break;
      const value = card.front.customFieldValues[field.id];
      doc.setTextColor(120, 120, 120);
      doc.text(field.name + ':', x + padding, currentY);
      doc.setTextColor(50, 50, 50);
      let displayValue = String(value || '—');
      if (field.type === 'rating') {
        displayValue = '★'.repeat(Number(value) || 0);
      }
      doc.text(displayValue, x + padding + doc.getTextWidth(field.name + ': '), currentY);
      currentY += 3;
    }
  }

  // Game name at the bottom
  doc.setFontSize(4);
  doc.setTextColor(180, 180, 180);
  doc.text(game.name, x + w / 2, y + h - 2, { align: 'center' });
}
