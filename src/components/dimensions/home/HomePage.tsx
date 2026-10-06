'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SiteBar } from '#/dimensions/SiteBar';
import { useDimension } from '#/dimensions/DimensionProvider';
import { GITHUB_API, STATIC_DATA_API } from '@/constants';
import useApi from '@/hooks/useApi';
import { buildChoreography } from '@/lib/dimensions/choreography';
import { daysSince, SERVER_START_MS } from '@/lib/dimensions/format';
import type { IMembers } from '@/types/IMember';
import { World } from './World';
import { Loader } from './Loader';
import { Hero } from './Hero';
import { DimensionOpening } from './DimensionOpening';
import { WorkSection } from './WorkSection';

/** Shown until the live numbers arrive, and kept if they never do. */
const MILESTONES = 53;
const DEFAULT_MEMBERS = 116;
const DEFAULT_REPOS = 29;

const noSubscription = () => () => {};
const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const daysToday = () => daysSince(SERVER_START_MS, Date.now());

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
  const { t } = useTranslation();
  const { data: members } = useApi<IMembers>(`${STATIC_DATA_API}/member.json`);
  const { data: repos } = useApi<{ name: string }[]>(
    `${GITHUB_API}?per_page=100`,
  );
  // the static export is rendered at build time: the day count is only known in the browser
  const days = useSyncExternalStore<number | null>(
    noSubscription,
    daysToday,
    () => null,
  );
  const works = t('dimensions.overworld.works', { returnObjects: true }) as {
    meta: string;
    name: string;
  }[];

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
      <Loader reduced={reduced} onDone={onDone} />
      <SiteBar variant='home' />
      <main>
        <Hero />
        <DimensionOpening
          id='overworld'
          tag={t('dimensions.overworld.tag')}
          say={
            t('dimensions.overworld.say', { returnObjects: true }) as string[]
          }
          body={t('dimensions.overworld.body')}
          label={t('dimensions.dim.overworld')}
        >
          <div className='stats rise'>
            <div>
              <b data-stat='days'>
                {days === null ? '' : days.toLocaleString('en-US')}
              </b>
              <span data-t='note'>{t('dimensions.overworld.stats.days')}</span>
            </div>
            <div>
              <b data-stat='milestones'>{MILESTONES}</b>
              <span data-t='note'>
                {t('dimensions.overworld.stats.milestones')}
              </span>
            </div>
            <div>
              <b data-stat='members'>
                {members?.member?.length ?? DEFAULT_MEMBERS}
              </b>
              <span data-t='note'>
                {t('dimensions.overworld.stats.members')}
              </span>
            </div>
            <div>
              <b data-stat='repos'>
                {repos
                  ? repos.filter((r) => !r.name.startsWith('.')).length
                  : DEFAULT_REPOS}
              </b>
              <span data-t='note'>{t('dimensions.overworld.stats.repos')}</span>
            </div>
          </div>
          <a className='more rise' href='/survivalProgress/' data-t='control'>
            {t('dimensions.overworld.more', { count: MILESTONES })}{' '}
            <span aria-hidden='true'>→</span>
          </a>
        </DimensionOpening>
        {works.map((w, i) => (
          <WorkSection
            key={w.name}
            group='overworld'
            index={i}
            meta={w.meta}
            name={w.name}
          />
        ))}
      </main>
    </div>
  );
};
