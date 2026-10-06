'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SiteBar } from '#/dimensions/SiteBar';
import { useDimension } from '#/dimensions/DimensionProvider';
import { buildChoreography } from '@/lib/dimensions/choreography';
import { World } from './World';
import { Loader } from './Loader';
import { Hero } from './Hero';

const noSubscription = () => () => {};
const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const HomePage = () => {
  const root = useRef<HTMLDivElement>(null);
  const { setDim } = useDimension();
  const [ready, setReady] = useState(false);
  // null until the browser has been asked (the static export renders without it)
  const reduced = useSyncExternalStore<boolean | null>(
    noSubscription,
    prefersReducedMotion,
    () => null,
  );
  const [, setLedger] = useState(0);

  // Build once the loader is done, so measurements see the final fonts and layout.
  useEffect(() => {
    if (!ready || reduced === null || !root.current) return;
    const el = root.current;
    const dispose = buildChoreography(el, {
      reduced,
      onDim: setDim,
      onLedger: setLedger,
    });
    // The arrival, timed against the loader lifting off (0.5s in): the camera settles, the title rises, the rest follows.
    // The camera move is on .cam so it never fights the scroll-driven moves on .zoom.
    const arrival = reduced
      ? null
      : gsap
          .timeline()
          .fromTo(
            el.querySelector('.scene.is-first .cam'),
            { scale: 1.3 },
            { scale: 1, duration: 2.6, ease: 'expo.out' },
            0.5,
          )
          .from(
            el.querySelectorAll('.hero .vt b'),
            { yPercent: 105, duration: 1.3, stagger: 0.12, ease: 'expo.out' },
            0.7,
          )
          .from(
            // .hero-meta itself belongs to the scroll-driven exit, so its two lines rise instead, as one
            el.querySelectorAll('.dim-bar, .hero-meta > *, .hero .up'),
            {
              y: 22,
              opacity: 0,
              duration: 1,
              stagger: (i: number) => 0.06 * (i < 2 ? i : i - 1),
              ease: 'power3.out',
            },
            1.2,
          );
    ScrollTrigger.refresh();
    return () => {
      arrival?.revert();
      dispose();
    };
  }, [ready, reduced, setDim]);

  const onDone = useCallback(() => setReady(true), []);

  return (
    <div className='dim dim--home' ref={root} data-ready={ready}>
      <World />
      <div className='flash' aria-hidden='true' />
      {reduced !== null && <Loader reduced={reduced} onDone={onDone} />}
      <SiteBar variant='home' />
      <main>
        <Hero />
      </main>
    </div>
  );
};
