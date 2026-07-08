import { Pipe, PipeTransform } from '@angular/core';



// The fun-facts prompt uses *asterisks* for inline italics instead of markdown fences.
@Pipe({ name: 'italicize', standalone: true })
export class ItalicizePipe implements PipeTransform {
  transform(value: string): string {
    return value.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  }
}
