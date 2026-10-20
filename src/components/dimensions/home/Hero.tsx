'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { daysSince, SERVER_START_MS } from '@/lib/dimensions/format';
import { followSectionLink } from '@/lib/dimensions/navigation';

const pad = (n: number) => String(n).padStart(2, '0');

export const Hero = () => {
  const { t } = useTranslation();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  const ms = now === null ? 0 : now - SERVER_START_MS;
  const clock = `${pad(Math.floor(ms / 3_600_000) % 24)}:${pad(Math.floor(ms / 60_000) % 60)}:${pad(Math.floor(ms / 1000) % 60)}`;

  return (
    <section className='hero' id='top' data-dim='overworld'>
      <div className='hero-meta mono'>
        <span data-t='note'>{t('dimensions.hero.since')}</span>
        <strong data-t='note'>
          {now === null
            ? ''
            : t('dimensions.hero.uptime', {
                // written as every number of the site is: with the thousands separator
                days: daysSince(SERVER_START_MS, now).toLocaleString('en-US'),
                clock,
              })}
        </strong>
      </div>
      {/* The brand name is the same in every language. */}
      <h1
        className='vt'
        aria-label='雲鎮工藝'
        data-t='title'
        data-heading
        tabIndex={-1}
      >
        {[...'雲鎮工藝'].map((ch) => (
          <i key={ch}>
            <b>{ch}</b>
          </i>
        ))}
      </h1>
      <div className='hero-copy'>
        <p className='en up' data-t='note'>
          CLOUD TOWN EXQUISITE CRAFT
        </p>
        <p className='lead up' data-t='body'>
          {t('dimensions.hero.lead')}
        </p>
        <a
          className='btn up'
          href='#respawn'
          data-t='control'
          onClick={(e) => followSectionLink(e)}
        >
          {t('dimensions.hero.cta')} <span aria-hidden='true'>→</span>
        </a>
        <div className='cue up' data-t='note'>
          <i />
          {t('dimensions.hero.cue')}
        </div>
      </div>
    </section>
  );
};
