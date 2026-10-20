'use client';

import { useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import useApi from '@/hooks/useApi';
import { STATIC_DATA_API, serverLink } from '@/constants';
import type { ILink, IPartnership } from '@/types/IPartnership';
import { afterEntrance } from '@/lib/dimensions/entrance';

/** The three lists of the page, in its order: the group's key, and the file it is read from. */
const GROUPS = [
  ['team', 'partnerTeams'],
  ['longtime', 'partnerLongTerm'],
  ['creator', 'partnerCreators'],
] as const;

/** Where a partner can be found, in the order the links are shown; a name of its own needs no translation. */
const PLACES: [keyof ILink, string | null][] = [
  ['youtube', 'YouTube'],
  ['bilibili', 'Bilibili'],
  ['twitch', 'Twitch'],
  ['tiktok', 'TikTok'],
  ['discord', 'Discord'],
  ['facebook', 'Facebook'],
  ['instagram', 'Instagram'],
  ['weibo', 'Weibo'],
  ['x', 'X'],
  ['qq', 'QQ'],
  // the partner's own site: `dimensions.partner.site`
  ['other', null],
];

/** How to reach the server about working together. */
const CONTACT = [
  ['Email', 'mailto:cloudtown0723@gmail.com'],
  ['Discord', 'https://discordapp.com/users/525640608228966400'],
  ['YouTube', serverLink.youtube],
] as const;

/** The player's address once it has been asked for (it plays at once: the reader has just pressed play), and its host. */
const player = (src: string) => {
  try {
    const url = new URL(src);
    url.searchParams.set('autoplay', '1');
    return { src: url.href, host: url.hostname.replace(/^www\./, '') };
  } catch {
    return null;
  }
};

/**
 * A partner's video. Nothing of the player is asked for on arrival: the frame's place is kept by a button, and
 * the player comes into that same place when the button is pressed (no jump of the page), and takes the focus.
 */
const PartnerVideo = ({ src, name }: { src: string; name: string }) => {
  const { t } = useTranslation();
  const [on, setOn] = useState(false);
  const video = player(src);
  if (!video) return null;
  return (
    <div className='video'>
      {on ? (
        <iframe
          ref={(el) => el?.focus({ preventScroll: true })}
          src={video.src}
          title={t('dimensions.partner.videoTitle', { name })}
          allow='autoplay; encrypted-media; picture-in-picture; fullscreen'
          allowFullScreen
        />
      ) : (
        <button type='button' onClick={() => setOn(true)}>
          <span className='play' aria-hidden='true' />
          <span data-t='body'>{t('dimensions.partner.play')}</span>
          <span className='mono' data-t='note'>
            {video.host}
          </span>
        </button>
      )}
    </div>
  );
};

const paragraphs = (intro: IPartnership['Introduce']) =>
  (Array.isArray(intro) ? intro : [intro]).filter(Boolean);

export const PartnerList = () => {
  const { t, i18n } = useTranslation();
  const lists = [
    useApi<IPartnership[]>(
      `${STATIC_DATA_API}/${i18n.language}/${GROUPS[0][1]}.json`,
    ),
    useApi<IPartnership[]>(
      `${STATIC_DATA_API}/${i18n.language}/${GROUPS[1][1]}.json`,
    ),
    useApi<IPartnership[]>(
      `${STATIC_DATA_API}/${i18n.language}/${GROUPS[2][1]}.json`,
    ),
  ];
  const error = lists.some((l) => l.error);
  const loading = !error && lists.some((l) => l.loading);
  const ready = lists.every((l) => Array.isArray(l.data));

  return (
    <>
      {loading && (
        <p className='empty' data-state='loading' data-t='body'>
          {t('dimensions.partner.loading')}
        </p>
      )}
      {error && (
        <p
          className='empty'
          data-state='error'
          data-t='body'
          ref={afterEntrance}
        >
          {t('dimensions.partner.error')}{' '}
          <button
            type='button'
            className='pill'
            // every list is asked for again: the page is shown whole or not at all
            onClick={() => lists.forEach((l) => l.reload())}
          >
            {t('dimensions.partner.retry')}
          </button>
        </p>
      )}

      {ready &&
        GROUPS.map(([key], g) => {
          const partners = lists[g].data ?? [];
          if (partners.length === 0) return null;
          return (
            <section className='group' key={key} ref={afterEntrance}>
              <header>
                <h2 className='serif' data-t='title'>
                  {t(`dimensions.partner.groups.${key}`)}
                </h2>
                <span className='mono' data-t='note'>
                  {t('dimensions.partner.groupCount', { n: partners.length })}
                </span>
              </header>
              <ul className='partners'>
                {partners.map((p, i) => (
                  <li
                    className='partner'
                    key={`${p.Partner}-${i}`}
                    // the first few arrive one after another, the rest with the last of them
                    style={{ '--i': Math.min(i, 6) } as CSSProperties}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      loading='lazy'
                      src={`${STATIC_DATA_API}/images/${p.Image}`}
                      alt=''
                      width={96}
                      height={96}
                    />
                    <div className='who'>
                      <h3 className='serif' data-t='title'>
                        {p.ModalTitle || p.Partner}
                      </h3>
                      {p.LongPartnership && (
                        <span className='tag mono' data-t='note'>
                          {t('dimensions.partner.groups.longtime')}
                        </span>
                      )}
                    </div>
                    <div className='body'>
                      {paragraphs(p.Introduce).map((line, n) => (
                        <p key={n} data-t='body'>
                          {line}
                        </p>
                      ))}
                      {p.ShowVideo && (
                        <PartnerVideo
                          src={p.ShowVideo}
                          name={p.ModalTitle || p.Partner}
                        />
                      )}
                      {p.Link && (
                        <p className='links mono'>
                          {PLACES.map(([place, name]) =>
                            p.Link?.[place] ? (
                              <a
                                key={place}
                                href={p.Link[place]}
                                target='_blank'
                                rel='noopener noreferrer'
                                data-t='note'
                              >
                                {name ?? t('dimensions.partner.site')}{' '}
                                <span aria-hidden='true'>↗</span>
                              </a>
                            ) : null,
                          )}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

      <section className='contact'>
        <h2 className='serif' data-t='title'>
          {t('dimensions.partner.contact.title')}
        </h2>
        <p data-t='body'>{t('dimensions.partner.contact.body')}</p>
        <p className='ways'>
          {CONTACT.map(([name, href]) => (
            <a
              key={name}
              className='pill'
              href={href}
              {...(href.startsWith('mailto:')
                ? {}
                : { target: '_blank', rel: 'noopener noreferrer' })}
            >
              {name}
            </a>
          ))}
        </p>
      </section>
    </>
  );
};
