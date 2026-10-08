'use client';

import { useTranslation } from 'react-i18next';
import { joinLink, serverLink } from '@/constants';
import { SiteFooter } from '#/dimensions/SiteFooter';

/** In the order of respawn.depts: redstone, building, logistics. */
const JOIN_LINKS = [
  joinLink.redstoneChannel,
  joinLink.applicationForm,
  joinLink.applicationForm,
];

/** The last section: back in the overworld on day one, with the call to join and the site's footer. */
export const Respawn = () => {
  const { t } = useTranslation();
  const depts = t('dimensions.respawn.depts', { returnObjects: true }) as {
    name: string;
    body: string;
    action: string;
  }[];
  return (
    <section className='respawn' id='respawn' data-dim='respawn'>
      <p className='mono acc' data-t='note'>
        {t('dimensions.respawn.label')}
      </p>
      <h2 className='serif rise' data-t='title' data-heading tabIndex={-1}>
        {t('dimensions.respawn.title')}
      </h2>
      <a
        className='btn'
        href={serverLink.discord}
        target='_blank'
        rel='noopener noreferrer'
        data-t='control'
      >
        {t('dimensions.respawn.cta')} <span aria-hidden='true'>→</span>
      </a>
      {/* the departments, and the mascot beside them where the screen is wide enough for both (home.css) */}
      <div className='join'>
        <ul className='depts rise'>
          {depts.map((d, i) => (
            // keyed by position: the same rows carry every language, so their scroll animations survive a switch
            <li key={i}>
              <b data-t='title'>{d.name}</b>
              <span data-t='body'>{d.body}</span>
              <a
                className='more'
                href={JOIN_LINKS[i]}
                target='_blank'
                rel='noopener noreferrer'
                data-t='control'
              >
                {d.action} <span aria-hidden='true'>→</span>
              </a>
            </li>
          ))}
        </ul>
        {/* lazy: where it is not shown (narrow or short screens) it is not fetched either */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className='pal'
          src='/assets/logo/512x512.png'
          alt=''
          loading='lazy'
        />
      </div>
      <SiteFooter />
    </section>
  );
};
