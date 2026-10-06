import type { Page } from '@playwright/test';

/** Ids of the scene layers that are actually on screen. */
export const visibleScenes = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.scene')]
      .filter((s) => {
        const c = getComputedStyle(s);
        return c.visibility !== 'hidden' && +c.opacity > 0.5;
      })
      .map((s) => s.dataset.scene),
  );

/** Scroll so that `selector` sits `offset` viewport-heights below the top, then let the scrub settle. */
export const scrollToSection = async (
  page: Page,
  selector: string,
  offset = 0.3,
) => {
  await page.evaluate(
    ([sel, off]) => {
      const el = document.querySelector(sel as string)!;
      window.scrollTo(
        0,
        el.getBoundingClientRect().top +
          window.scrollY +
          (off as number) * window.innerHeight,
      );
    },
    [selector, offset],
  );
  await page.waitForTimeout(1800);
};

/** The loader has finished and the choreography is built. */
export const ready = (page: Page) =>
  page.locator('.dim[data-ready="true"]').waitFor({ timeout: 20_000 });
