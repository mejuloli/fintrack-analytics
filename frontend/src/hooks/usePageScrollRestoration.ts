import { useEffect } from "react";
import {
  useNavigationType,
} from "react-router-dom";


const STORAGE_PREFIX =
  "fintrack:scroll-position:";


interface ScrollPosition {
  x: number;
  y: number;
}


function getStorageKey(path: string) {
  return `${STORAGE_PREFIX}${path}`;
}


function parseScrollPosition(
  storedValue: string,
): ScrollPosition | null {
  try {
    const parsedValue = JSON.parse(
      storedValue,
    ) as Partial<ScrollPosition>;

    if (
      Number.isFinite(parsedValue.x)
      && Number.isFinite(parsedValue.y)
    ) {
      return {
        x: Number(parsedValue.x),
        y: Number(parsedValue.y),
      };
    }
  } catch {
    const legacyPosition = Number(
      storedValue,
    );

    if (Number.isFinite(legacyPosition)) {
      return {
        x: 0,
        y: legacyPosition,
      };
    }
  }

  return null;
}


export function savePageScrollPosition(
  path: string,
) {
  const position: ScrollPosition = {
    x: window.scrollX,
    y: window.scrollY,
  };

  sessionStorage.setItem(
    getStorageKey(path),
    JSON.stringify(position),
  );
}


export function usePageScrollRestoration(
  path: string,
  ready: boolean,
) {
  const navigationType =
    useNavigationType();

  useEffect(() => {
    if (!ready) {
      return;
    }

    const storageKey = getStorageKey(path);

    if (navigationType !== "POP") {
      sessionStorage.removeItem(storageKey);
      return;
    }

    const storedValue =
      sessionStorage.getItem(storageKey);

    if (storedValue === null) {
      return;
    }

    const position =
      parseScrollPosition(storedValue);

    if (!position) {
      sessionStorage.removeItem(storageKey);
      return;
    }

    let firstFrame = 0;
    let secondFrame = 0;

    firstFrame = window.requestAnimationFrame(
      () => {
        secondFrame =
          window.requestAnimationFrame(() => {
            window.scrollTo({
              top: position.y,
              left: position.x,
              behavior: "auto",
            });

            sessionStorage.removeItem(
              storageKey,
            );
          });
      },
    );

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, [
    navigationType,
    path,
    ready,
  ]);
}
