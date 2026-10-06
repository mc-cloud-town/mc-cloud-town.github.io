'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useTranslation } from 'react-i18next';

const TONES = [
  '#3f6f3a',
  '#4f8a45',
  '#2f5d7a',
  '#6aa34f',
  '#7a6a45',
  '#35607f',
];

const loaded = (img: HTMLImageElement | null) =>
  !img || img.complete
    ? Promise.resolve()
    : new Promise<void>((done) => {
        img.addEventListener('load', () => done(), { once: true });
        img.addEventListener('error', () => done(), { once: true });
      });

/**
 * Chunks load outward from the centre, like the game's world-load map.
 * Calls onDone once the fonts, the first scene and the map are in, lifts off the page, then removes itself.
 */
export const Loader = ({
  reduced,
  onDone,
}: {
  reduced: boolean;
  onDone: () => void;
}) => {
  const { t } = useTranslation();
  const box = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const [pct, setPct] = useState(0);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const cells = [...(grid.current?.children ?? [])] as HTMLElement[];
    const order = cells
      .map((cell, i) => ({
        cell,
        on: false,
        d:
          Math.max(Math.abs((i % 7) - 3), Math.abs(Math.floor(i / 7) - 3)) +
          Math.random() * 0.6,
      }))
      .sort((a, b) => a.d - b.d);
    const p = { v: 0 };
    const fill = gsap.to(p, {
      v: 1,
      duration: reduced ? 0.1 : 1.5,
      ease: 'power1.inOut',
      onUpdate: () => {
        setPct(Math.round(p.v * 100));
        order.forEach((o, i) => {
          if (i < p.v * 49 && !o.on) {
            o.on = true;
            o.cell.style.background =
              TONES[Math.floor(Math.random() * TONES.length)];
          }
        });
      },
    });
    let cancelled = false;
    let lift: gsap.core.Timeline | undefined;
    Promise.all([
      document.fonts.ready,
      loaded(
        el.parentElement?.querySelector<HTMLImageElement>(
          '.scene.is-first img',
        ) ?? null,
      ),
      fill.then(),
    ]).then(() => {
      if (cancelled) return;
      onDone();
      if (reduced) return setGone(true);
      lift = gsap
        .timeline({ onComplete: () => setGone(true) })
        .to(el.querySelector('.loader-in'), {
          opacity: 0,
          scale: 1.6,
          duration: 0.6,
          ease: 'power3.in',
        })
        .to(el, { autoAlpha: 0, duration: 0.9, ease: 'power2.out' }, '-=.1');
    });
    return () => {
      cancelled = true;
      fill.kill();
      lift?.kill();
    };
  }, [reduced, onDone]);

  if (gone) return null;
  return (
    <div className='loader' aria-hidden='true' ref={box}>
      <div className='loader-in'>
        <div className='chunks' ref={grid}>
          {Array.from({ length: 49 }, (_, i) => (
            <i key={i} />
          ))}
        </div>
        <p>
          <span>{t('dimensions.hero.loading')}</span>
          <span>{pct}%</span>
        </p>
      </div>
    </div>
  );
};
