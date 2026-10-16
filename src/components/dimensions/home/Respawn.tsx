'use client';

import { useTranslation } from 'react-i18next';
import { joinLink, serverLink } from '@/constants';
import { SiteFooter } from '#/dimensions/SiteFooter';

/** In the order of respawn.depts: redstone, building, logistics. */
const JOIN_LINKS = [
  joinLink.applicationForm,
  joinLink.applicationForm,
  joinLink.applicationForm,
];

/** The last section: back in the overworld on day one, with the call to join, and under it the site's footer. */
export const Respawn = () => {
  const { t } = useTranslation();
  const depts = t('dimensions.respawn.depts', { returnObjects: true }) as {
    name: string;
    body: string;
    action: string;
  }[];
  return (
    <section className='respawn' id='respawn' data-dim='respawn'>
      {/* the scene: the call, the mascot beside it where the screen has room, the departments under both */}
      <div className='call'>
        <div>
          <p className='mono acc' data-t='note'>
            {t('dimensions.respawn.label')}
          </p>
          <h2 className='serif rise' data-t='title' data-heading tabIndex={-1}>
            {t('dimensions.respawn.title')}
          </h2>
          <div className='acts'>
            <a
              className='btn'
              href={serverLink.discord}
              target='_blank'
              rel='noopener noreferrer'
              data-t='control'
            >
              {t('dimensions.respawn.cta')} <span aria-hidden='true'>→</span>
            </a>
            {/* the section is the short of it: the join page has every department's criteria in full */}
            {/* a plain link on purpose: the shell takes the step from here, as a transition (PageTransitions) */}
            <a className='more' href='/join/' data-t='control'>
              {t('dimensions.respawn.more')} <span aria-hidden='true'>→</span>
            </a>
          </div>
        </div>
        {/* lazy: where it is not shown (narrow or short screens) it is not fetched either */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className='pal'
          src='/assets/logo/512x512.png'
          alt=''
          loading='lazy'
        />
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
      </div>
      {/* the picture sinks into the ground, and on the ground stands the site's footer (home.css) */}
      <div className='ground'>
        <SiteFooter />
      </div>
    </section>
  );
};
