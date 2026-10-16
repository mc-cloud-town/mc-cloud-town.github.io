'use client';

import { useSyncExternalStore, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { joinLink, serverLink } from '@/constants';

/**
 * The departments, in the order of respawn.depts (the home page's respawn, of which this page is the full text):
 * where each takes applications, and the key of what the old join page said about it (`join.*`: its picture,
 * its criteria, its people).
 */
const DEPTS = [
  { link: joinLink.applicationForm, detail: 'redstone' },
  { link: joinLink.applicationForm, detail: 'build' },
  { link: joinLink.applicationForm, detail: 'logistics' },
] as const;

/** The ways to apply: a button of the old page that leads to one of these is the department's own link here. */
const APPLY: string[] = Object.values(joinLink);

interface Detail {
  imageUrl: string;
  subTitle?: string;
  features: string[];
  buttons?: { text: string; href: string }[];
}

/** The day the server opened: 2022.07.23, 00:00 in Taipei. */
const OPENED = Date.UTC(2022, 6, 22, 16);

/** The clock, a second at a time. Not known to the served page: it is the reader's own. */
const everySecond = (tick: () => void) => {
  const id = window.setInterval(tick, 1000);
  return () => window.clearInterval(id);
};
const secondsOpen = () => Math.floor((Date.now() - OPENED) / 1000);
const notYet = () => null;

const two = (n: number) => String(n).padStart(2, '0');

/** How long the server has been running, counting. */
const Since = () => {
  const { t } = useTranslation();
  const s = useSyncExternalStore(everySecond, secondsOpen, notYet);
  const parts =
    s === null
      ? null
      : ([
          [Math.floor(s / 86400).toLocaleString('en-US'), 'days'],
          [two(Math.floor(s / 3600) % 24), 'hours'],
          [two(Math.floor(s / 60) % 60), 'minutes'],
          [two(s % 60), 'seconds'],
        ] as const);
  return (
    <p className='join-since mono' data-t='note'>
      <span>{t('home.serverRunning')}</span>
      {/* arrives with the reader's clock, and fades in where it stands (join.css) */}
      {parts && (
        <span className='join-clock'>
          {parts.map(([n, unit]) => (
            <span key={unit}>
              <b>{n}</b> {t(`time.${unit}`)}
            </span>
          ))}
        </span>
      )}
    </p>
  );
};

/** The full text of the way in: the server's Discord, then each department with what it asks and where to apply. */
export const JoinGuide = () => {
  const { t } = useTranslation();
  const depts = t('dimensions.respawn.depts', { returnObjects: true }) as {
    name: string;
    body: string;
    action: string;
  }[];
  return (
    <>
      <Since />

      <section className='join-way'>
        <p className='mono acc' data-t='note'>
          {t('dimensions.respawn.label')}
        </p>
        <h2 className='serif' data-t='title'>
          {t('dimensions.respawn.title')}
        </h2>
        <p data-t='body'>{t('dimensions.join.way')}</p>
        <a
          className='join-cta'
          href={serverLink.discord}
          target='_blank'
          rel='noopener noreferrer'
          data-t='control'
        >
          {t('dimensions.respawn.cta')} <span aria-hidden='true'>→</span>
        </a>
      </section>

      {DEPTS.map(({ link, detail }, i) => {
        const d = t(`join.${detail}`, { returnObjects: true }) as Detail;
        // the last line of a department with people to write to names them: it is the heading of their links
        const people = (d.buttons ?? []).filter((b) => !APPLY.includes(b.href));
        const lines = people.length ? d.features.slice(0, -1) : d.features;
        return (
          <section
            className='group join-dept'
            key={detail}
            style={{ '--i': i } as CSSProperties}
          >
            <header>
              <h2 className='serif' data-t='title'>
                {depts[i]?.name}
              </h2>
              <p data-t='body'>{depts[i]?.body}</p>
              <span className='mono' data-t='note'>
                {two(i + 1)} / {two(DEPTS.length)}
              </span>
            </header>
            <div className='join-body'>
              <figure>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img loading='lazy' src={`/assets/${d.imageUrl}`} alt='' />
              </figure>
              <div>
                {d.subTitle && (
                  <p className='join-sub' data-t='body'>
                    {d.subTitle}
                  </p>
                )}
                <ul className='join-lines'>
                  {lines.map((line, k) => (
                    <li key={k} data-t='body'>
                      {line}
                    </li>
                  ))}
                </ul>
                {people.length > 0 && (
                  <p className='join-people'>
                    <span className='mono' data-t='note'>
                      {d.features.at(-1)}
                    </span>
                    {people.map((b) => (
                      <a
                        className='pill'
                        key={b.href}
                        href={b.href}
                        target='_blank'
                        rel='noopener noreferrer'
                        data-t='control'
                      >
                        {b.text}
                      </a>
                    ))}
                  </p>
                )}
                <a
                  className='join-link'
                  href={link}
                  target='_blank'
                  rel='noopener noreferrer'
                  data-t='control'
                >
                  {depts[i]?.action} <span aria-hidden='true'>→</span>
                </a>
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
};
