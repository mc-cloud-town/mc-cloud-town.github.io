'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';
import { serverLink } from '@/constants';

type Current = 'progress' | 'members';

const LANGS = [
  { value: 'zh_TW', label: '繁' },
  { value: 'zh_CN', label: '简' },
  { value: 'en', label: 'EN' },
];

/** `zh` is the build-time default and is the same content as zh_TW. */
const normalise = (lng: string) => (lng === 'zh' ? 'zh_TW' : lng);

export const SiteBar = ({
  variant,
  current,
}: {
  variant: 'home' | 'inner';
  current?: Current;
}) => {
  const { t, i18n } = useTranslation();
  const { isDark, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);

  // On the home page the dimension links are in-page anchors; elsewhere they lead back to it.
  const anchor = (id: string) => (variant === 'home' ? `#${id}` : `/#${id}`);
  const links = [
    {
      href: anchor('overworld'),
      label: t('dimensions.nav.overworld'),
      d: 'overworld',
    },
    { href: anchor('nether'), label: t('dimensions.nav.nether'), d: 'nether' },
    { href: anchor('end'), label: t('dimensions.nav.end'), d: 'end' },
    {
      href: '/survivalProgress/',
      label: t('dimensions.nav.progress'),
      key: 'progress' as Current,
    },
    {
      href: '/member/',
      label: t('dimensions.nav.members'),
      key: 'members' as Current,
    },
    { href: anchor('respawn'), label: t('dimensions.nav.join'), d: 'respawn' },
  ];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  const items = links.map((l) => (
    <a
      key={l.href}
      href={l.href}
      data-d={l.d}
      aria-current={l.key && l.key === current ? 'page' : undefined}
      data-t='control'
      onClick={() => setOpen(false)}
    >
      {l.label}
    </a>
  ));

  return (
    <>
      <header className='dim-bar'>
        <Link className='logo' href='/' aria-label={t('dimensions.nav.home')}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src='/assets/brand/brand1.webp' alt='雲鎮工藝 CTEC' />
        </Link>
        <nav aria-label={t('dimensions.nav.menu')}>{items}</nav>
        <button
          className='pill'
          type='button'
          data-action='theme'
          aria-label={t('dimensions.nav.theme')}
          onClick={toggleTheme}
        >
          {isDark ? '夜' : '日'}
        </button>
        <select
          className='pill'
          data-action='language'
          aria-label={t('dimensions.nav.language')}
          value={normalise(i18n.language)}
          onChange={(e) => i18n.changeLanguage(e.target.value)}
        >
          {LANGS.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
        <a
          className='pill discord'
          href={serverLink.discord}
          target='_blank'
          rel='noopener noreferrer'
        >
          Discord
        </a>
        <button
          className='pill menu'
          type='button'
          data-action='menu'
          aria-expanded={open}
          aria-controls='dim-sheet'
          onClick={() => setOpen((v) => !v)}
        >
          {open ? t('dimensions.nav.close') : t('dimensions.nav.menu')}
        </button>
      </header>
      <div className='dim-sheet' id='dim-sheet' hidden={!open}>
        <nav aria-label={t('dimensions.nav.menu')}>{items}</nav>
      </div>
    </>
  );
};
