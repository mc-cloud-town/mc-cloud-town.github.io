'use client';

import {
  DiscordFilled,
  GithubFilled,
  XOutlined,
  YoutubeFilled,
} from '@ant-design/icons';
import { useId, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { serverLink } from '@/constants';

/**
 * The site's map, in two lists: what was built, and who built it. Each page under the words the site's navigation
 * and the pages themselves already use for it. (`/collaborative/` is `/partner/` under another address: one link.)
 * A click on one is a step to another page of the shell, like any other (pageTransition.ts).
 */
const GROUPS = [
  [
    'works',
    [
      ['/redstoneCollection/', 'menu.redstone'],
      ['/architectureCollection/', 'menu.building'],
      ['/survivalProgress/', 'dimensions.progress.crumb'],
      ['/openSource/', 'menu.openSource'],
    ],
  ],
  [
    'team',
    [
      ['/member/', 'dimensions.nav.members'],
      ['/partner/', 'menu.partner'],
      ['/hardware/', 'hardware.title'],
      ['/join/', 'menu.join'],
    ],
  ],
] as const;

/** Where the community is: marks, not words, each with its name for those who do not see it. */
const COMMUNITY = [
  ['Discord', serverLink.discord, DiscordFilled],
  ['YouTube', serverLink.youtube, YoutubeFilled],
  ['X', serverLink.x, XOutlined],
  ['GitHub', 'https://github.com/mc-cloud-town', GithubFilled],
] as const;

/** The year of the build (next.config.ts): what the served page says, and what the first render must say too. */
const BUILD_YEAR = Number(process.env.NEXT_PUBLIC_BUILD_YEAR);
const builtIn = () => BUILD_YEAR;
const thisYear = () => new Date().getFullYear();
const noSubscription = () => () => {};

export const SiteFooter = () => {
  const { t } = useTranslation();
  const label = useId();
  // the reader's own year, once the page is theirs: read in the browser only, so a page that was built last year
  // and is opened this year hydrates as it was served and then says this year
  const year = useSyncExternalStore(noSubscription, thisYear, builtIn);
  return (
    <footer className='dim-foot'>
      <div className='brand'>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src='/assets/brand/brand1.webp' alt='雲鎮工藝 CTEC' />
        <span data-t='note'>{t('dimensions.footer.rights', { year })}</span>
      </div>
      <div className='map'>
        <div className='site'>
          {GROUPS.map(([group, pages]) => (
            <nav key={group} aria-labelledby={`${label}-${group}`}>
              <span
                className='label mono'
                id={`${label}-${group}`}
                data-t='note'
              >
                {t(`dimensions.footer.groups.${group}`)}
              </span>
              {pages.map(([href, key]) => (
                <a key={href} href={href} data-t='control'>
                  {t(key)}
                </a>
              ))}
            </nav>
          ))}
        </div>
        <nav className='out' aria-labelledby={`${label}-out`}>
          <span className='label mono' id={`${label}-out`} data-t='note'>
            {t('dimensions.footer.groups.community')}
          </span>
          <div className='icons'>
            {COMMUNITY.map(([name, href, Icon]) => (
              <a key={name} href={href} aria-label={name} title={name}>
                <Icon aria-hidden />
              </a>
            ))}
          </div>
          <a href={serverLink.paypal} data-t='control'>
            {t('dimensions.footer.support')}
          </a>
        </nav>
      </div>
    </footer>
  );
};
