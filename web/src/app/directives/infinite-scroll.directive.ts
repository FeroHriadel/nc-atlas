import { AfterViewInit, Directive, ElementRef, EventEmitter, Input, OnDestroy, Output, inject } from '@angular/core';

@Directive({
  selector: '[appInfiniteScroll]',
})
export class InfiniteScrollDirective implements AfterViewInit, OnDestroy {
  private elementRef = inject(ElementRef<HTMLElement>);
  private observer?: IntersectionObserver;

  @Input() rootMargin = '200px';
  @Output() visible = new EventEmitter<void>();

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          this.visible.emit();
        }
      },
      { rootMargin: this.rootMargin },
    );
    this.observer.observe(this.elementRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
