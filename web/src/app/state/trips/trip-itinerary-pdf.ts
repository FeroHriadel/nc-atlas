import type { jsPDF } from 'jspdf';
import { TripItinerary, TripItinerarySight } from './trip-itinerary.model';
import { SightFactItem, SightFactPerson } from '../sights/sight-fact.model';

// Built by drawing text/shapes/images directly with jsPDF rather than rasterizing the live
// DOM (html2canvas) — DOM snapshotting unreliably dropped content depending on webfont load
// timing, cross-origin image restrictions, and off-screen positioning quirks. Direct drawing
// sidesteps all of that; the site's own fonts and color palette are embedded/reproduced
// instead of an exact pixel match.
//
// Page 1 mimics trip-details: title/note, a card per sight, then the recommended route.
// Each sight then gets its own full page mimicking the sight-detail page.

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 15;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const BOTTOM_LIMIT = PAGE_HEIGHT - MARGIN;

const FONT_BODY = 'NunitoSans';
const FONT_DISPLAY = 'LuckiestGuy';

type Rgb = [number, number, number];

const TEXT_STRONG: Rgb = [42, 42, 42];
const TEXT_LIGHT: Rgb = [128, 128, 128];
const BORDER: Rgb = [209, 209, 209];
const CARD_BG: Rgb = [255, 255, 255];
const PILL_BG: Rgb = [224, 224, 224];
const PILL_TEXT: Rgb = [34, 34, 34];
const CATEGORY_BG: Rgb = [26, 26, 26];
const CATEGORY_TEXT: Rgb = [245, 245, 245];
const MUTED_ACCENT: Rgb = [138, 138, 138];

export async function downloadItineraryPdf(itinerary: TripItinerary): Promise<void> {
  const { jsPDF: JsPdf } = await import('jspdf');
  const doc = new JsPdf('p', 'mm', 'a4');

  await registerFonts(doc);
  const emojiCache = buildEmojiCache(itinerary);

  let y = MARGIN;
  doc.setFont(FONT_BODY, 'bold');
  doc.setFontSize(26);
  doc.setTextColor(...TEXT_STRONG);
  doc.text(itinerary.title, PAGE_WIDTH / 2, y, { align: 'center' });
  y += 11;

  if (itinerary.note) {
    y = writeParagraph(doc, itinerary.note, MARGIN, y, CONTENT_WIDTH, {
      fontSize: 11, color: TEXT_LIGHT, align: 'center',
    });
  }
  y += 6;

  for (const sight of itinerary.sights) {
    y = drawSightListCard(doc, sight, y);
  }
  y += 2;

  y = drawDivider(doc, y);
  drawRoute(doc, itinerary, y);

  for (const sight of itinerary.sights) {
    doc.addPage();
    drawSightDetailPage(doc, sight, emojiCache);
  }

  doc.save(`${sanitizeFileName(itinerary.title)}.pdf`);
}

// ---------- fonts ----------

async function registerFonts(doc: jsPDF): Promise<void> {
  const [regular, bold, display] = await Promise.all([
    fetchFontBase64('/fonts/NunitoSans-Static-Regular.ttf'),
    fetchFontBase64('/fonts/NunitoSans-Static-Bold.ttf'),
    fetchFontBase64('/LuckiestGuy-Regular.ttf'),
  ]);

  doc.addFileToVFS('NunitoSans-Regular.ttf', regular);
  doc.addFont('NunitoSans-Regular.ttf', FONT_BODY, 'normal');
  doc.addFileToVFS('NunitoSans-Bold.ttf', bold);
  doc.addFont('NunitoSans-Bold.ttf', FONT_BODY, 'bold');
  doc.addFileToVFS('LuckiestGuy-Regular.ttf', display);
  doc.addFont('LuckiestGuy-Regular.ttf', FONT_DISPLAY, 'normal');

  doc.setFont(FONT_BODY, 'normal');
}

async function fetchFontBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return arrayBufferToBase64(buffer);
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

// ---------- emoji (rendered via Canvas 2D using the OS's own color-emoji font — no network
// fetch, no @font-face load race, since system emoji fonts are already available synchronously) ----------

function buildEmojiCache(itinerary: TripItinerary): Map<string, string> {
  const cache = new Map<string, string>();
  const collect = (emoji: string) => {
    if (!emoji || cache.has(emoji)) return;
    const uri = renderEmojiDataUri(emoji);
    if (uri) cache.set(emoji, uri);
  };

  for (const sight of itinerary.sights) {
    const facts = sight.facts;
    if (!facts) continue;
    facts.funFacts.forEach(i => collect(i.emoji));
    facts.dontMiss.forEach(i => collect(i.emoji));
    facts.history.forEach(i => collect(i.emoji));
  }

  return cache;
}

function renderEmojiDataUri(emoji: string): string | null {
  try {
    const size = 96;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.font = `${size * 0.78}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, size / 2, size / 2 + size * 0.04);
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

// ---------- low-level drawing helpers ----------

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > BOTTOM_LIMIT) {
    doc.addPage();
    return MARGIN;
  }
  return y;
}

function drawDivider(doc: jsPDF, y: number): number {
  y = ensureSpace(doc, y, 8);
  y += 3;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  return y + 7;
}

function writeParagraph(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  opts: { fontSize: number; color: Rgb; bold?: boolean; align?: 'left' | 'center' },
): number {
  doc.setFont(FONT_BODY, opts.bold ? 'bold' : 'normal');
  doc.setFontSize(opts.fontSize);
  doc.setTextColor(...opts.color);

  const lineHeight = opts.fontSize * 0.45;
  const lines: string[] = doc.splitTextToSize(text, maxWidth);

  for (const line of lines) {
    y = ensureSpace(doc, y, lineHeight);
    if (opts.align === 'center') {
      doc.text(line, x + maxWidth / 2, y, { align: 'center' });
    } else {
      doc.text(line, x, y);
    }
    y += lineHeight;
  }

  return y;
}

function drawPill(doc: jsPDF, text: string, x: number, y: number, bg: Rgb, textColor: Rgb, fontSize: number): number {
  doc.setFont(FONT_BODY, 'normal');
  doc.setFontSize(fontSize);
  const width = doc.getTextWidth(text) + 5;

  doc.setFillColor(...bg);
  doc.roundedRect(x, y - fontSize * 0.32 - 1.5, width, fontSize * 0.32 + 3, 2, 2, 'F');
  doc.setTextColor(...textColor);
  doc.text(text, x + 2.5, y);

  return width;
}

// Small colored accent bar + heading, echoing the site's .section-header-accent.
function drawSectionHeading(doc: jsPDF, text: string, y: number, accentColor: Rgb, fontSize: number): number {
  const lineHeight = fontSize * 0.45;
  y = ensureSpace(doc, y, lineHeight + 3);

  doc.setFillColor(...accentColor);
  doc.roundedRect(MARGIN, y - lineHeight * 0.85, 1.2, lineHeight, 0.5, 0.5, 'F');

  doc.setFont(FONT_BODY, 'bold');
  doc.setFontSize(fontSize);
  doc.setTextColor(...TEXT_STRONG);
  doc.text(text, MARGIN + 4, y);

  return y + lineHeight + 2;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '-').trim() || 'trip-itinerary';
}

// ---------- page 1: trip overview ----------

function drawSightListCard(doc: jsPDF, sight: TripItinerarySight, y: number): number {
  const padding = 5;
  const titleFontSize = 13;
  const subtitleFontSize = 9.5;
  const titleLineHeight = titleFontSize * 0.45;
  const subtitleLineHeight = subtitleFontSize * 0.45;
  const innerWidth = CONTENT_WIDTH - padding * 2;

  doc.setFont(FONT_BODY, 'bold');
  doc.setFontSize(titleFontSize);
  const titleLines: string[] = doc.splitTextToSize(sight.title, innerWidth);

  const subtitleText = [sight.categoryName, [sight.county, sight.state, sight.country].filter(Boolean).join(', ')]
    .filter(Boolean).join(' · ');
  doc.setFont(FONT_BODY, 'normal');
  doc.setFontSize(subtitleFontSize);
  const subtitleLines: string[] = doc.splitTextToSize(subtitleText, innerWidth);

  const boxHeight = padding * 2 + titleLines.length * titleLineHeight + 1 + subtitleLines.length * subtitleLineHeight;
  y = ensureSpace(doc, y, boxHeight + 4);

  doc.setFillColor(...CARD_BG);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.25);
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, boxHeight, 2.5, 2.5, 'FD');

  let ty = y + padding + titleLineHeight * 0.75;
  doc.setFont(FONT_BODY, 'bold');
  doc.setFontSize(titleFontSize);
  doc.setTextColor(...TEXT_STRONG);
  for (const line of titleLines) {
    doc.text(line, MARGIN + padding, ty);
    ty += titleLineHeight;
  }

  ty += 1;
  doc.setFont(FONT_BODY, 'normal');
  doc.setFontSize(subtitleFontSize);
  doc.setTextColor(...TEXT_LIGHT);
  for (const line of subtitleLines) {
    doc.text(line, MARGIN + padding, ty);
    ty += subtitleLineHeight;
  }

  return y + boxHeight + 4;
}

function drawRoute(doc: jsPDF, itinerary: TripItinerary, y: number): number {
  y = drawSectionHeading(doc, 'Recommended Route', y, TEXT_STRONG, 16);
  y += 2;

  if (itinerary.routeError) {
    return writeParagraph(doc, itinerary.routeError, MARGIN, y, CONTENT_WIDTH, { fontSize: 10.5, color: TEXT_STRONG });
  }

  const route = itinerary.recommendedRoute;
  if (!route) return y;

  if (route.summary) {
    y = writeParagraph(doc, route.summary, MARGIN, y, CONTENT_WIDTH, { fontSize: 10.5, color: TEXT_STRONG });
    y += 4;
  }

  for (const [index, stop] of route.stops.entries()) {
    const title = itinerary.sights.find(s => s.id === stop.sightId)?.title ?? 'Unknown sight';

    y = ensureSpace(doc, y, 6);
    doc.setFont(FONT_BODY, 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...TEXT_STRONG);
    doc.text(`${index + 1}. ${title}`, MARGIN, y);
    y += 5.5;

    if (stop.note) {
      y = writeParagraph(doc, stop.note, MARGIN + 5, y, CONTENT_WIDTH - 5, { fontSize: 9.5, color: TEXT_LIGHT });
      y += 2;
    }
  }

  return y;
}

// ---------- per-sight detail page ----------

function drawSightDetailPage(doc: jsPDF, sight: TripItinerarySight, emojiCache: Map<string, string>): void {
  let y = drawSightHero(doc, sight, MARGIN);
  y = drawDescriptionBox(doc, sight.description, y);

  if (!sight.facts) return;

  y = drawSectionHeading(doc, 'Sight Facts', y, TEXT_STRONG, 15);
  y += 2;

  y = drawItemCardGrid(doc, 'Fun Facts', sight.facts.funFacts, y, emojiCache);
  y = drawHistoryTimeline(doc, sight.facts.history, y, emojiCache);
  y = drawItemCardGrid(doc, "Don't Miss", sight.facts.dontMiss, y, emojiCache);
  y = drawPeopleGrid(doc, sight.facts.people, y);
  drawBackgroundList(doc, sight.facts.historyContext, y);
}

function drawSightHero(doc: jsPDF, sight: TripItinerarySight, y: number): number {
  const startY = y;
  const imageBoxW = 65;
  const imageBoxH = 65;
  let imageHeight = 0;
  let textX = MARGIN;
  let textWidth = CONTENT_WIDTH;

  if (sight.thumbnailDataUri) {
    try {
      const props = doc.getImageProperties(sight.thumbnailDataUri);
      let w = imageBoxW;
      let h = (props.height / props.width) * w;
      if (h > imageBoxH) {
        h = imageBoxH;
        w = (props.width / props.height) * h;
      }
      const format = sight.thumbnailDataUri.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      doc.addImage(sight.thumbnailDataUri, format, MARGIN, startY, w, h);
      imageHeight = h;
      textX = MARGIN + imageBoxW + 8;
      textWidth = CONTENT_WIDTH - imageBoxW - 8;
    } catch {
      // fall back to a full-width text column if the thumbnail fails to decode
    }
  }

  let ty = startY + 5;
  drawPill(doc, sight.categoryName, textX, ty, CATEGORY_BG, CATEGORY_TEXT, 9);
  ty += 9;

  doc.setFont(FONT_DISPLAY, 'normal');
  doc.setFontSize(26);
  doc.setTextColor(...TEXT_STRONG);
  const titleLines: string[] = doc.splitTextToSize(sight.title, textWidth);
  for (const line of titleLines) {
    doc.text(line, textX, ty);
    ty += 11;
  }
  ty += 2;

  const metaParts = [sight.country, sight.county, `${sight.latitude.toFixed(4)}, ${sight.longitude.toFixed(4)}`]
    .filter((p): p is string => !!p);
  doc.setFont(FONT_BODY, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_LIGHT);
  for (const part of metaParts) {
    doc.text(part, textX, ty);
    ty += 5;
  }
  ty += 2;

  if (sight.tags.length) {
    let x = textX;
    for (const tag of sight.tags) {
      doc.setFont(FONT_BODY, 'normal');
      doc.setFontSize(8);
      const w = doc.getTextWidth(tag.name) + 5;
      if (x + w > textX + textWidth) {
        ty += 7;
        x = textX;
      }
      drawPill(doc, tag.name, x, ty, PILL_BG, PILL_TEXT, 8);
      x += w + 2;
    }
    ty += 8;
  }

  return Math.max(startY + imageHeight, ty) + 8;
}

function drawDescriptionBox(doc: jsPDF, text: string, y: number): number {
  const padding = 4;
  doc.setFont(FONT_BODY, 'normal');
  doc.setFontSize(10.5);
  const lineHeight = 10.5 * 0.45;
  const lines: string[] = doc.splitTextToSize(text, CONTENT_WIDTH - padding * 2);
  const boxHeight = padding * 2 + lines.length * lineHeight;

  y = ensureSpace(doc, y, boxHeight + 6);

  doc.setFillColor(...CARD_BG);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.25);
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, boxHeight, 2, 2, 'FD');

  let ty = y + padding + lineHeight * 0.8;
  doc.setTextColor(...TEXT_STRONG);
  for (const line of lines) {
    doc.text(line, MARGIN + padding, ty);
    ty += lineHeight;
  }

  return y + boxHeight + 6;
}

// ---------- fact sections ----------

function drawItemCardGrid(
  doc: jsPDF,
  heading: string,
  items: SightFactItem[],
  y: number,
  emojiCache: Map<string, string>,
): number {
  if (!items.length) return y;

  y = drawSectionHeading(doc, heading, y, MUTED_ACCENT, 12);
  y += 1;

  const gap = 5;
  const colWidth = (CONTENT_WIDTH - gap) / 2;

  for (let i = 0; i < items.length; i += 2) {
    const rowItems = items.slice(i, i + 2);
    const rowHeight = Math.max(...rowItems.map(item => measureFactCardHeight(doc, item, colWidth)));
    y = ensureSpace(doc, y, rowHeight + gap);

    rowItems.forEach((item, idx) => {
      const x = MARGIN + idx * (colWidth + gap);
      drawFactCard(doc, item, x, y, colWidth, rowHeight, emojiCache);
    });

    y += rowHeight + gap;
  }

  return y + 3;
}

function measureFactCardHeight(doc: jsPDF, item: SightFactItem, width: number): number {
  const padding = 4;
  const emojiSize = 7;
  const innerWidth = width - padding * 2;

  doc.setFont(FONT_BODY, 'bold');
  doc.setFontSize(10);
  const titleLines: string[] = doc.splitTextToSize(item.title, innerWidth);

  doc.setFont(FONT_BODY, 'normal');
  doc.setFontSize(9);
  const textLines: string[] = doc.splitTextToSize(item.text, innerWidth);

  return padding * 2 + emojiSize + 2 + titleLines.length * 4.3 + 1 + textLines.length * 4.05;
}

function drawFactCard(
  doc: jsPDF,
  item: SightFactItem,
  x: number,
  y: number,
  width: number,
  height: number,
  emojiCache: Map<string, string>,
): void {
  doc.setFillColor(...CARD_BG);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.25);
  doc.roundedRect(x, y, width, height, 2, 2, 'FD');

  const padding = 4;
  const emojiSize = 7;
  const innerWidth = width - padding * 2;

  const emojiUri = emojiCache.get(item.emoji);
  if (emojiUri) {
    doc.addImage(emojiUri, 'PNG', x + padding, y + padding, emojiSize, emojiSize);
  }

  let ty = y + padding + emojiSize + 4;
  doc.setFont(FONT_BODY, 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_STRONG);
  const titleLines: string[] = doc.splitTextToSize(item.title, innerWidth);
  for (const line of titleLines) {
    doc.text(line, x + padding, ty);
    ty += 4.3;
  }

  ty += 1;
  doc.setFont(FONT_BODY, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_STRONG);
  const textLines: string[] = doc.splitTextToSize(item.text, innerWidth);
  for (const line of textLines) {
    doc.text(line, x + padding, ty);
    ty += 4.05;
  }
}

function drawHistoryTimeline(
  doc: jsPDF,
  items: SightFactItem[],
  y: number,
  emojiCache: Map<string, string>,
): number {
  if (!items.length) return y;

  y = drawSectionHeading(doc, 'History', y, MUTED_ACCENT, 12);
  y += 1;

  const dotSize = 8;
  const lineX = MARGIN + dotSize / 2;
  const textX = MARGIN + dotSize + 6;
  const textWidth = CONTENT_WIDTH - dotSize - 6;

  let prevDotBottom: number | null = null;
  let prevPage = doc.getNumberOfPages();

  for (const item of items) {
    doc.setFont(FONT_BODY, 'bold');
    doc.setFontSize(10);
    const titleLines: string[] = doc.splitTextToSize(item.title, textWidth);

    doc.setFont(FONT_BODY, 'normal');
    doc.setFontSize(9.5);
    const textLines: string[] = doc.splitTextToSize(item.text, textWidth);

    const textBlockHeight = titleLines.length * 4.5 + 1 + textLines.length * 4.3;
    const itemHeight = Math.max(dotSize, textBlockHeight) + 6;

    y = ensureSpace(doc, y, itemHeight);
    const currentPage = doc.getNumberOfPages();

    if (prevDotBottom !== null && currentPage === prevPage) {
      doc.setDrawColor(...BORDER);
      doc.setLineWidth(0.4);
      doc.line(lineX, prevDotBottom, lineX, y);
    }

    doc.setFillColor(...CARD_BG);
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.25);
    doc.circle(lineX, y + dotSize / 2, dotSize / 2, 'FD');

    const emojiUri = emojiCache.get(item.emoji);
    if (emojiUri) {
      const inset = dotSize * 0.22;
      doc.addImage(emojiUri, 'PNG', MARGIN + inset, y + inset, dotSize - inset * 2, dotSize - inset * 2);
    }

    let ty = y + 3.6;
    doc.setFont(FONT_BODY, 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...TEXT_STRONG);
    for (const line of titleLines) {
      doc.text(line, textX, ty);
      ty += 4.5;
    }

    ty += 1;
    doc.setFont(FONT_BODY, 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...TEXT_STRONG);
    for (const line of textLines) {
      doc.text(line, textX, ty);
      ty += 4.3;
    }

    prevDotBottom = y + dotSize;
    prevPage = currentPage;
    y += itemHeight;
  }

  return y + 3;
}

function drawPeopleGrid(doc: jsPDF, people: SightFactPerson[], y: number): number {
  if (!people.length) return y;

  y = drawSectionHeading(doc, 'People', y, MUTED_ACCENT, 12);
  y += 1;

  const gap = 5;
  const colWidth = (CONTENT_WIDTH - gap) / 2;

  for (let i = 0; i < people.length; i += 2) {
    const row = people.slice(i, i + 2);
    const rowHeight = Math.max(...row.map(p => measurePersonCardHeight(doc, p, colWidth)));
    y = ensureSpace(doc, y, rowHeight + gap);

    row.forEach((person, idx) => {
      const x = MARGIN + idx * (colWidth + gap);
      drawPersonCard(doc, person, x, y, colWidth, rowHeight);
    });

    y += rowHeight + gap;
  }

  return y + 3;
}

function measurePersonCardHeight(doc: jsPDF, person: SightFactPerson, width: number): number {
  const padding = 4;
  const avatarSize = 9;
  const textWidth = width - padding * 2 - avatarSize - 3;

  doc.setFont(FONT_BODY, 'bold');
  doc.setFontSize(10);
  const nameLines: string[] = doc.splitTextToSize(person.name, textWidth);

  doc.setFont(FONT_BODY, 'normal');
  doc.setFontSize(9);
  const factLines: string[] = doc.splitTextToSize(person.funFact, textWidth);

  const textHeight = nameLines.length * 4.3 + 1 + factLines.length * 4.05;
  return padding * 2 + Math.max(avatarSize, textHeight);
}

function drawPersonCard(doc: jsPDF, person: SightFactPerson, x: number, y: number, width: number, height: number): void {
  doc.setFillColor(...CARD_BG);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.25);
  doc.roundedRect(x, y, width, height, 2, 2, 'FD');

  const padding = 4;
  const avatarSize = 9;
  const avatarCenterX = x + padding + avatarSize / 2;
  const avatarCenterY = y + padding + avatarSize / 2;

  doc.setFillColor(...TEXT_STRONG);
  doc.circle(avatarCenterX, avatarCenterY, avatarSize / 2, 'F');
  doc.setFont(FONT_BODY, 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(person.name.charAt(0).toUpperCase(), avatarCenterX, avatarCenterY + 1.2, { align: 'center' });

  const textX = x + padding + avatarSize + 3;
  const textWidth = width - padding * 2 - avatarSize - 3;

  let ty = y + padding + 3.5;
  doc.setFont(FONT_BODY, 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_STRONG);
  const nameLines: string[] = doc.splitTextToSize(person.name, textWidth);
  for (const line of nameLines) {
    doc.text(line, textX, ty);
    ty += 4.3;
  }

  ty += 1;
  doc.setFont(FONT_BODY, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_STRONG);
  const factLines: string[] = doc.splitTextToSize(person.funFact, textWidth);
  for (const line of factLines) {
    doc.text(line, textX, ty);
    ty += 4.05;
  }
}

// No card chrome, muted — mirrors .fact-context-list. The emoji is dropped here rather than
// embedded as an inline image: it's running text next to a heading, not a discrete icon slot,
// and NunitoSans has no emoji glyphs of its own to fall back on.
function drawBackgroundList(doc: jsPDF, items: SightFactItem[], y: number): number {
  if (!items.length) return y;

  y = drawSectionHeading(doc, 'Background', y, MUTED_ACCENT, 12);
  y += 1;

  const indent = 5;
  const innerWidth = CONTENT_WIDTH - indent;

  for (const item of items) {
    doc.setFont(FONT_BODY, 'bold');
    doc.setFontSize(9.5);
    const titleLines: string[] = doc.splitTextToSize(item.title, innerWidth);

    doc.setFont(FONT_BODY, 'normal');
    doc.setFontSize(9);
    const textLines: string[] = doc.splitTextToSize(item.text, innerWidth);

    const itemHeight = titleLines.length * 4.2 + 1 + textLines.length * 4;
    y = ensureSpace(doc, y, itemHeight + 4);

    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.6);
    doc.line(MARGIN, y, MARGIN, y + itemHeight);

    let ty = y + 3.5;
    doc.setFont(FONT_BODY, 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...TEXT_LIGHT);
    for (const line of titleLines) {
      doc.text(line, MARGIN + indent, ty);
      ty += 4.2;
    }

    ty += 1;
    doc.setFont(FONT_BODY, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...TEXT_LIGHT);
    for (const line of textLines) {
      doc.text(line, MARGIN + indent, ty);
      ty += 4;
    }

    y += itemHeight + 4;
  }

  return y + 2;
}
