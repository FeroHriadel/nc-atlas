import type { jsPDF } from 'jspdf';
import { TripItinerary, TripItinerarySight } from './trip-itinerary.model';
import { SightFactContent, SightFactItem, SightFactPerson } from '../sights/sight-fact.model';

// This PDF is built by drawing text/shapes/images directly with jsPDF rather than
// rasterizing the live DOM (html2canvas) — DOM snapshotting turned out to unreliably drop
// content depending on webfont load timing, cross-origin image restrictions, and off-screen
// positioning quirks. Direct drawing sidesteps all of that at the cost of an exact pixel
// match to the site's CSS; colors/pills are reproduced using the same palette instead.

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 15;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const BOTTOM_LIMIT = PAGE_HEIGHT - MARGIN;

type Rgb = [number, number, number];

const TEXT_STRONG: Rgb = [42, 42, 42];
const TEXT_LIGHT: Rgb = [128, 128, 128];
const BORDER: Rgb = [209, 209, 209];
const PILL_BG: Rgb = [224, 224, 224];
const PILL_TEXT: Rgb = [34, 34, 34];
const CATEGORY_BG: Rgb = [26, 26, 26];
const CATEGORY_TEXT: Rgb = [245, 245, 245];

export async function downloadItineraryPdf(itinerary: TripItinerary): Promise<void> {
  const { jsPDF: JsPdf } = await import('jspdf');
  const doc = new JsPdf('p', 'mm', 'a4');
  let y = MARGIN;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(...TEXT_STRONG);
  doc.text(itinerary.title, PAGE_WIDTH / 2, y, { align: 'center' });
  y += 10;

  if (itinerary.note) {
    y = writeParagraph(doc, itinerary.note, MARGIN, y, CONTENT_WIDTH, {
      fontSize: 11, color: TEXT_LIGHT, align: 'center',
    });
  }
  y += 4;

  for (const sight of itinerary.sights) {
    y = drawDivider(doc, y);
    y = drawSight(doc, sight, y);
  }

  y = drawDivider(doc, y);
  drawRoute(doc, itinerary, y);

  doc.save(`${sanitizeFileName(itinerary.title)}.pdf`);
}

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
  doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
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
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(fontSize);
  const width = doc.getTextWidth(text) + 5;

  doc.setFillColor(...bg);
  doc.roundedRect(x, y - fontSize * 0.32 - 1.5, width, fontSize * 0.32 + 3, 2, 2, 'F');
  doc.setTextColor(...textColor);
  doc.text(text, x + 2.5, y);

  return width;
}

function drawSight(doc: jsPDF, sight: TripItinerarySight, y: number): number {
  y = ensureSpace(doc, y, 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...TEXT_STRONG);
  const titleLines: string[] = doc.splitTextToSize(sight.title, CONTENT_WIDTH);
  for (const line of titleLines) {
    y = ensureSpace(doc, y, 8);
    doc.text(line, MARGIN, y);
    y += 8;
  }

  y = ensureSpace(doc, y, 8);
  drawPill(doc, sight.categoryName, MARGIN, y, CATEGORY_BG, CATEGORY_TEXT, 9);
  y += 8;

  const metaParts = [sight.country, sight.county, `${sight.latitude.toFixed(4)}, ${sight.longitude.toFixed(4)}`]
    .filter((p): p is string => !!p);
  if (metaParts.length) {
    y = writeParagraph(doc, metaParts.join('   ·   '), MARGIN, y, CONTENT_WIDTH, { fontSize: 9.5, color: TEXT_LIGHT });
  }

  if (sight.tags.length) {
    y = ensureSpace(doc, y, 8);
    let x = MARGIN;
    for (const tag of sight.tags) {
      const w = doc.getTextWidth(tag.name) + 5;
      if (x + w > PAGE_WIDTH - MARGIN) {
        y += 7;
        y = ensureSpace(doc, y, 7);
        x = MARGIN;
      }
      drawPill(doc, tag.name, x, y, PILL_BG, PILL_TEXT, 8.5);
      x += w + 2;
    }
    y += 8;
  }

  // Image goes under the title/meta/tags block, per request — not beside it.
  if (sight.thumbnailDataUri) {
    y = drawThumbnail(doc, sight.thumbnailDataUri, y);
  }

  y = writeParagraph(doc, sight.description, MARGIN, y, CONTENT_WIDTH, { fontSize: 10.5, color: TEXT_STRONG });
  y += 4;

  if (sight.facts) {
    y = drawFacts(doc, sight.facts, y);
  }

  return y + 2;
}

function drawThumbnail(doc: jsPDF, dataUri: string, y: number): number {
  try {
    const props = doc.getImageProperties(dataUri);
    const maxWidth = CONTENT_WIDTH;
    const maxHeight = 80;

    let width = maxWidth;
    let height = (props.height / props.width) * width;
    if (height > maxHeight) {
      height = maxHeight;
      width = (props.width / props.height) * height;
    }

    y = ensureSpace(doc, y, height + 4);
    const format = dataUri.startsWith('data:image/png') ? 'PNG' : 'JPEG';
    doc.addImage(dataUri, format, MARGIN, y, width, height);
    return y + height + 6;
  } catch {
    // Skip the image rather than aborting the whole PDF over one bad thumbnail.
    return y;
  }
}

function drawFacts(doc: jsPDF, facts: SightFactContent, y: number): number {
  y = ensureSpace(doc, y, 9);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...TEXT_STRONG);
  doc.text('Sight Facts', MARGIN, y);
  y += 7;

  y = drawItemSection(doc, 'Fun Facts', facts.funFacts, y);
  y = drawItemSection(doc, "Don't Miss", facts.dontMiss, y);
  y = drawItemSection(doc, 'History', facts.history, y);
  y = drawPeopleSection(doc, 'People', facts.people, y);
  y = drawItemSection(doc, 'Background', facts.historyContext, y);

  return y;
}

function drawItemSection(doc: jsPDF, heading: string, items: SightFactItem[], y: number): number {
  if (!items.length) return y;

  y = ensureSpace(doc, y, 7);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...TEXT_STRONG);
  doc.text(heading, MARGIN, y);
  y += 6;

  for (const item of items) {
    y = ensureSpace(doc, y, 5.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...TEXT_STRONG);
    doc.text(item.title, MARGIN, y);
    y += 5;
    y = writeParagraph(doc, item.text, MARGIN, y, CONTENT_WIDTH, { fontSize: 9.5, color: TEXT_STRONG });
    y += 3;
  }

  return y + 2;
}

function drawPeopleSection(doc: jsPDF, heading: string, people: SightFactPerson[], y: number): number {
  if (!people.length) return y;

  y = ensureSpace(doc, y, 7);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...TEXT_STRONG);
  doc.text(heading, MARGIN, y);
  y += 6;

  for (const person of people) {
    y = ensureSpace(doc, y, 5.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...TEXT_STRONG);
    doc.text(person.name, MARGIN, y);
    y += 5;
    y = writeParagraph(doc, person.funFact, MARGIN, y, CONTENT_WIDTH, { fontSize: 9.5, color: TEXT_STRONG });
    y += 3;
  }

  return y + 2;
}

function drawRoute(doc: jsPDF, itinerary: TripItinerary, y: number): void {
  y = ensureSpace(doc, y, 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...TEXT_STRONG);
  doc.text('Recommended Route', MARGIN, y);
  y += 8;

  if (itinerary.routeError) {
    writeParagraph(doc, itinerary.routeError, MARGIN, y, CONTENT_WIDTH, { fontSize: 10.5, color: TEXT_STRONG });
    return;
  }

  const route = itinerary.recommendedRoute;
  if (!route) return;

  if (route.summary) {
    y = writeParagraph(doc, route.summary, MARGIN, y, CONTENT_WIDTH, { fontSize: 10.5, color: TEXT_STRONG });
    y += 4;
  }

  for (const [index, stop] of route.stops.entries()) {
    const title = itinerary.sights.find(s => s.id === stop.sightId)?.title ?? 'Unknown sight';

    y = ensureSpace(doc, y, 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...TEXT_STRONG);
    doc.text(`${index + 1}. ${title}`, MARGIN, y);
    y += 5.5;

    if (stop.note) {
      y = writeParagraph(doc, stop.note, MARGIN + 5, y, CONTENT_WIDTH - 5, { fontSize: 9.5, color: TEXT_LIGHT });
      y += 2;
    }
  }
}

function sanitizeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '-').trim() || 'trip-itinerary';
}
