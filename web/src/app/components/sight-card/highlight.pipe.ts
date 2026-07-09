import { Pipe, PipeTransform } from '@angular/core';



const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Wraps occurrences of `term` in <mark> so the active search term stands out on sight cards.
// Both the source text and the term are HTML-escaped before matching, so highlighting stays
// correct (and injection-safe) even if either contains HTML-special characters.
@Pipe({ name: 'highlight', standalone: true })
export class HighlightPipe implements PipeTransform {
  transform(value: string | null | undefined, term: string | null | undefined): string {
    const text = escapeHtml(value ?? '');
    const trimmedTerm = term?.trim();
    if (!trimmedTerm) return text;

    const pattern = new RegExp(escapeRegExp(escapeHtml(trimmedTerm)), 'gi');
    return text.replace(pattern, (match) => `<mark class="highlight">${match}</mark>`);
  }
}
