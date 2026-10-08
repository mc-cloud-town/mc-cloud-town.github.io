'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
  CloseOutlined,
  DiscordFilled,
  MenuOutlined,
  MoonOutlined,
  SunOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/hooks/useTheme';
import { serverLink } from '@/constants';
import { holdPageScroll } from '@/lib/dimensions/pageScroll';
import { LanguageMenu } from './LanguageMenu';

type Current = 'progress' | 'members';

/** Same width as the bar's menu breakpoint in shell.css. */
const BAR_BREAKPOINT = '(min-width: 1101px)';

/** Keys that scroll a page, as a fraction of the sheet's height (±Infinity: to the very end). */
const SCROLL_KEYS: Record<string, number> = {
  ' ': 0.9,
  PageDown: 0.9,
  PageUp: -0.9,
  ArrowDown: 0.12,
  ArrowUp: -0.12,
  End: Infinity,
  Home: -Infinity,
};

/** Something that uses the scroll keys itself: a field, or the language list (its arrows move in the list). */
const isField = (el: EventTarget | null) =>
  el instanceof HTMLSelectElement ||
  el instanceof HTMLInputElement ||
  el instanceof HTMLTextAreaElement ||
  (el instanceof Element && Boolean(el.closest('.lang')));

/**
 * While the sheet is open the page behind it must not move, and nothing about its layout may change:
 * the scrollbar stays, so `overflow` on the document is never touched. Instead the wheel, touch and
 * scroll keys go to the sheet (if it has anything to scroll) or nowhere. Returns the release.
 */
const holdPage = (sheet: HTMLElement) => {
  const y = window.scrollY;
  const room = (dy: number) =>
    dy < 0
      ? sheet.scrollTop > 0
      : sheet.scrollTop + sheet.clientHeight < sheet.scrollHeight - 1;
  const inSheet = (e: Event) =>
    e.target instanceof Node && sheet.contains(e.target);

  const onWheel = (e: WheelEvent) => {
    if (!(inSheet(e) && room(e.deltaY))) e.preventDefault();
  };
  let touchY = 0;
  const onTouchStart = (e: TouchEvent) => {
    touchY = e.touches[0]?.clientY ?? 0;
  };
  const onTouchMove = (e: TouchEvent) => {
    const dy = touchY - (e.touches[0]?.clientY ?? touchY);
    if (!(inSheet(e) && room(dy)) && e.cancelable) e.preventDefault();
  };
  const onKey = (e: KeyboardEvent) => {
    const step = SCROLL_KEYS[e.key];
    if (step === undefined || isField(e.target)) return;
    // on a button the space bar presses it; it never scrolls
    if (e.key === ' ' && e.target instanceof HTMLButtonElement) return;
    e.preventDefault();
    sheet.scrollBy({
      top: Number.isFinite(step)
        ? (e.shiftKey && e.key === ' ' ? -step : step) * sheet.clientHeight
        : Math.sign(step) * sheet.scrollHeight,
    });
  };
  // whatever still gets through (dragging the scrollbar, auto-scroll): put the page back
  const onScroll = () => {
    if (window.scrollY !== y)
      window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior });
  };

  holdPageScroll(true);
  document.addEventListener('wheel', onWheel, { passive: false });
  document.addEventListener('touchstart', onTouchStart, { passive: true });
  document.addEventListener('touchmove', onTouchMove, { passive: false });
  document.addEventListener('keydown', onKey);
  window.addEventListener('scroll', onScroll);
  return () => {
    document.removeEventListener('wheel', onWheel);
    document.removeEventListener('touchstart', onTouchStart);
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('scroll', onScroll);
    holdPageScroll(false);
  };
};

export const SiteBar = ({
  variant,
  current,
}: {
  variant: 'home' | 'inner';
  current?: Current;
}) => {
  const { t } = useTranslation();
  const { toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const sheet = useRef<HTMLDivElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  const release = useRef<(() => void) | null>(null);

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

  /** Let the page go at once: a link in the sheet jumps to its section in the same click. */
  const letGo = () => {
    release.current?.();
    release.current = null;
  };

  useEffect(() => {
    if (!open || !sheet.current) return;
    // Escape closes the sheet, unless it is the language list that is being closed with it
    const onKey = (e: KeyboardEvent) =>
      e.key === 'Escape' &&
      !(e.target instanceof Element && e.target.closest('.lang-list')) &&
      setOpen(false);
    document.addEventListener('keydown', onKey);
    release.current = holdPage(sheet.current);
    return () => {
      document.removeEventListener('keydown', onKey);
      release.current?.();
      release.current = null;
    };
  }, [open]);

  // Focus follows the sheet: to its first link when it opens, back to the button when it closes.
  useEffect(() => {
    if (open) sheet.current?.querySelector('a')?.focus({ preventScroll: true });
    else if (wasOpen.current)
      menuButton.current?.focus({ preventScroll: true });
    wasOpen.current = open;
  }, [open]);

  // Leaving the narrow layout while the sheet is open must close it and let the page scroll again.
  useEffect(() => {
    const mq = window.matchMedia(BAR_BREAKPOINT);
    const onChange = (e: MediaQueryListEvent) => e.matches && setOpen(false);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const items = links.map((l, i) => (
    <a
      key={l.href}
      href={l.href}
      data-d={l.d}
      aria-current={l.key && l.key === current ? 'page' : undefined}
      data-t='control'
      // the place in the row: the sheet's links arrive one after another
      style={{ '--i': i } as CSSProperties}
      onClick={() => {
        letGo();
        setOpen(false);
      }}
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
          {/* both marks are always there; shell.css shows the one of the current theme */}
          <span className='swap' aria-hidden='true'>
            <SunOutlined />
            <MoonOutlined />
          </span>
        </button>
        <LanguageMenu />
        <a
          className='pill discord'
          href={serverLink.discord}
          target='_blank'
          rel='noopener noreferrer'
        >
          <span className='mark' aria-hidden='true'>
            <DiscordFilled />
          </span>
          Discord
        </a>
        <button
          className='pill menu'
          type='button'
          data-action='menu'
          ref={menuButton}
          aria-label={
            open ? t('dimensions.nav.close') : t('dimensions.nav.menu')
          }
          aria-expanded={open}
          aria-controls='dim-sheet'
          onClick={() => setOpen((v) => !v)}
        >
          <span className='swap' aria-hidden='true'>
            <MenuOutlined />
            <CloseOutlined />
          </span>
        </button>
      </header>
      {/* Always in the page, so it can ease out: closed, it is inert, invisible and lets every pointer through. */}
      <div
        className='dim-sheet'
        id='dim-sheet'
        ref={sheet}
        data-open={open}
        inert={!open}
        data-lenis-prevent
      >
        <nav aria-label={t('dimensions.nav.menu')}>{items}</nav>
      </div>
    </>
  );
};
