'use client';

import { useTranslation } from 'react-i18next';
import { serverLink } from '@/constants';

export const SiteFooter = () => {
  const { t } = useTranslation();
  return (
    <footer className='dim-foot'>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src='/assets/brand/brand1.webp' alt='雲鎮工藝 CTEC' />
      <a href={serverLink.discord} data-t='control'>
        Discord
      </a>
      <a href={serverLink.youtube} data-t='control'>
        YouTube
      </a>
      <a href={serverLink.x} data-t='control'>
        X
      </a>
      <a href='https://github.com/mc-cloud-town' data-t='control'>
        GitHub
      </a>
      <a href={serverLink.paypal} data-t='control'>
        {t('dimensions.footer.support')}
      </a>
      <span data-t='note'>
        {t('dimensions.footer.rights', { year: new Date().getFullYear() })}
      </span>
    </footer>
  );
};
