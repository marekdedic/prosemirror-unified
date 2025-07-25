import { vi } from "vitest";

/* eslint-disable vitest/require-hook -- OK in setup file */

function supportRangeDOMRect(): void {
  document.createRange = (): Range => {
    const range = new Range();

    range.getBoundingClientRect = (): DOMRect => ({
      bottom: 0,
      height: 0,
      left: 0,
      right: 0,
      toJSON: (): Record<string, never> => ({}),
      top: 0,
      width: 0,
      x: 0,
      y: 0,
    });

    range.getClientRects = (): DOMRectList => ({
      item: () => null,
      length: 0,
      [Symbol.iterator]: vi.fn<() => ArrayIterator<DOMRect>>(),
    });

    return range;
  };
}

supportRangeDOMRect();

/* eslint-enable */
