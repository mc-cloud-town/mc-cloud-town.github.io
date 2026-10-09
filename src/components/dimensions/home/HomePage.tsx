'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
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
import { PortalCanvas } from './PortalCanvas';
import { NetherLedger } from './NetherLedger';
import { RankStatement } from './RankStatement';
import { Starfield } from './Starfield';
import { Credits } from './Credits';
import { Respawn } from './Respawn';
import { DimensionRail } from './DimensionRail';

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
  const [ledger, setLedger] = useState(0);
  const { t, i18n } = useTranslation();
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
  const endWorks = t('dimensions.end.works', { returnObjects: true }) as {
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
          // the rail comes with the bar, a step behind it (its place on the page is `translate`, so y is free)
          .from(
            el.querySelector('.rail'),
            { y: 22, opacity: 0, duration: 1, ease: 'power3.out' },
            1.26,
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

  // Another language reflows the text and moves every section below it: measure the triggers again.
  // (Runs after the new text is committed; the nodes themselves are kept, see the index keys below.)
  // Before the next paint: whoever was taken to a section and has not moved since is put back on it by the
  // choreography when the triggers are measured again, and must never see the frame in between.
  const language = i18n.language;
  useLayoutEffect(() => {
    if (ready && language) ScrollTrigger.refresh();
  }, [ready, language]);

  // The credits grow when the names arrive, which moves everything measured below them.
  useLayoutEffect(() => {
    if (ready && members) ScrollTrigger.refresh();
  }, [ready, members]);

  const onDone = useCallback(() => setReady(true), []);

  return (
    <div className='dim dim--home' ref={root} data-ready={ready}>
      <World>{reduced !== null && <Starfield reduced={reduced} />}</World>
      <PortalCanvas />
      <div className='flash' aria-hidden='true' />
      <Loader reduced={reduced} onDone={onDone} />
      <SiteBar variant='home' />
      <DimensionRail />
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
            {/* two pairs: where four do not fit in a row they stand two and two, never three and one (home.css) */}
            <div className='pair'>
              <div>
                {/* a new node for a new number: a figure that arrives late fades in (home.css) */}
                <b data-stat='days' key={days ?? 'none'}>
                  {days === null ? '' : days.toLocaleString('en-US')}
                </b>
                <span data-t='note'>
                  {t('dimensions.overworld.stats.days')}
                </span>
              </div>
              <div>
                <b data-stat='milestones'>{MILESTONES}</b>
                <span data-t='note'>
                  {t('dimensions.overworld.stats.milestones')}
                </span>
              </div>
            </div>
            <div className='pair'>
              <div>
                <b
                  data-stat='members'
                  key={members?.member?.length ?? DEFAULT_MEMBERS}
                >
                  {members?.member?.length ?? DEFAULT_MEMBERS}
                </b>
                <span data-t='note'>
                  {t('dimensions.overworld.stats.members')}
                </span>
              </div>
              <div>
                <b data-stat='repos' key={repos ? 'live' : 'default'}>
                  {repos
                    ? repos.filter((r) => !r.name.startsWith('.')).length
                    : DEFAULT_REPOS}
                </b>
                <span data-t='note'>
                  {t('dimensions.overworld.stats.repos')}
                </span>
              </div>
            </div>
          </div>
          <a className='more rise' href='/survivalProgress/' data-t='control'>
            {t('dimensions.overworld.more', { count: MILESTONES })}{' '}
            <span aria-hidden='true'>→</span>
          </a>
        </DimensionOpening>
        {works.map((w, i) => (
          <WorkSection
            // keyed by position: the same section carries every language, so its scroll triggers survive a switch
            key={i}
            group='overworld'
            index={i}
            meta={w.meta}
            name={w.name}
          />
        ))}
        <DimensionOpening
          id='nether'
          tag={t('dimensions.nether.tag')}
          say={t('dimensions.nether.say', { returnObjects: true }) as string[]}
          body={t('dimensions.nether.body')}
          label={t('dimensions.dim.nether')}
        />
        <NetherLedger
          reduced={reduced}
          index={ledger}
          items={
            t('dimensions.nether.ledger', { returnObjects: true }) as {
              date: string;
              name: string;
            }[]
          }
        />
        <RankStatement
          label={t('dimensions.nether.rankLabel')}
          lines={
            t('dimensions.nether.rank', { returnObjects: true }) as string[]
          }
          body={t('dimensions.nether.rankBody')}
        />
        <DimensionOpening
          id='end'
          tag={t('dimensions.end.tag')}
          say={t('dimensions.end.say', { returnObjects: true }) as string[]}
          body={t('dimensions.end.body')}
          label={t('dimensions.dim.end')}
        />
        {endWorks.map((w, i) => (
          <WorkSection
            // keyed by position, like the overworld builds
            key={i}
            group='end'
            index={i}
            meta={w.meta}
            name={w.name}
          />
        ))}
        <Credits members={members} />
        <Respawn />
      </main>
    </div>
  );
};
