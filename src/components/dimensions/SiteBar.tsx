'use client';

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from 'react';
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
import { followSectionLink, wait } from '@/lib/dimensions/navigation';
import { holdPageScroll } from '@/lib/dimensions/pageScroll';
import { useDimension } from './DimensionProvider';
import { LanguageMenu } from './LanguageMenu';

type Current = 'progress' | 'members';

/** Same width as the bar's menu breakpoint in shell.css. */
const BAR_BREAKPOINT = '(min-width: 1101px)';

/** The sheet's way out in shell.css, to the end of its fade. */
const SHEET_OUT_MS = 240;

/** The sheet has gone from sight: its own state is what counts, the clock only says when to look. */
const sheetGone = async (sheet: HTMLElement | null) => {
  await wait(SHEET_OUT_MS);
  for (let i = 0; i < 12; i++) {
    if (!sheet || getComputedStyle(sheet).visibility === 'hidden') return;
    await wait(40);
  }
};

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
    // with Ctrl, Meta or Alt these are the browser's own shortcuts (history, tabs, zoom): not ours to take
    if (e.ctrlKey || e.metaKey || e.altKey) return;
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

/**
 * While the sheet is open, the bar and the sheet are all there is: everything else in the page is inert,
 * so neither Tab nor a screen reader gets behind the sheet. Returns the release.
 */
const isolate = (bar: HTMLElement, sheet: HTMLElement) => {
  const others = [...(bar.parentElement?.children ?? [])].filter(
    (el): el is HTMLElement =>
      el instanceof HTMLElement && el !== bar && el !== sheet && !el.inert,
  );
  others.forEach((el) => (el.inert = true));
  return () => others.forEach((el) => (el.inert = false));
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
  const { dim } = useDimension();
  const [open, setOpen] = useState(false);
  const bar = useRef<HTMLElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  const release = useRef<(() => void) | null>(null);
  /** Why the sheet is closing, when it is not the button or Escape: decides where the focus goes. */
  const closedBy = useRef<'link' | 'wide' | null>(null);

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

  /** Let the page go, before the sheet has closed: a jump moves the page while the sheet is still on its way out. */
  const letGo = () => {
    release.current?.();
    release.current = null;
  };

  useEffect(() => {
    if (!open || !sheet.current || !bar.current) return;
    // Escape closes the sheet, unless it is the language list that is being closed with it
    const onKey = (e: KeyboardEvent) =>
      e.key === 'Escape' &&
      !(e.target instanceof Element && e.target.closest('.lang-list')) &&
      setOpen(false);
    document.addEventListener('keydown', onKey);
    const unhold = holdPage(sheet.current);
    const rejoin = isolate(bar.current, sheet.current);
    release.current = () => {
      unhold();
      rejoin();
    };
    return () => {
      document.removeEventListener('keydown', onKey);
      release.current?.();
      release.current = null;
    };
  }, [open]);

  // Focus follows the sheet: to its first link when it opens, back to the button when it closes.
  useEffect(() => {
    if (open) sheet.current?.querySelector('a')?.focus({ preventScroll: true });
    else if (wasOpen.current) {
      const why = closedBy.current;
      closedBy.current = null;
      if (why === 'wide') {
        // The button is not there any more, and neither is the sheet: whoever had the focus on one of them
        // finds it on the same link in the bar. A focus that is on something still visible stays where it is.
        const at = document.activeElement;
        const lost =
          !at ||
          at === document.body ||
          at === menuButton.current ||
          sheet.current?.contains(at);
        const index = [...(sheet.current?.querySelectorAll('a') ?? [])].indexOf(
          at as HTMLAnchorElement,
        );
        if (lost)
          bar.current
            ?.querySelectorAll<HTMLElement>('nav a')
            [Math.max(index, 0)]?.focus({ preventScroll: true });
      }
      // closed by one of its links: the focus goes with the navigation, not back to the button
      else if (why !== 'link')
        menuButton.current?.focus({ preventScroll: true });
    }
    wasOpen.current = open;
  }, [open]);

  // Leaving the narrow layout while the sheet is open must close it and let the page scroll again.
  useEffect(() => {
    const mq = window.matchMedia(BAR_BREAKPOINT);
    const onChange = (e: MediaQueryListEvent) => {
      if (!e.matches) return;
      closedBy.current = 'wide';
      setOpen(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  /**
   * A link was followed. On the home page a link to a section is a jump (navigation.ts): the sheet closes
   * as part of it, at once for a travel, under the cover for a cut. Until then the page behind the sheet stays as
   * the sheet keeps it, held and inert: a cover that is still coming in can be seen through.
   * Anything else: the sheet closes and the link is followed.
   */
  const follow = (e: ReactMouseEvent<HTMLAnchorElement>) => {
    /** the section of the home page this link leads to (`data-section`), if it is one and this is the home page */
    const section = e.currentTarget.dataset.section;
    const close = () => {
      if (open) closedBy.current = 'link';
      setOpen(false);
    };
    if (
      section &&
      followSectionLink(e, {
        id: section,
        leave: () => {
          letGo();
          close();
          // a cover that came down over the open sheet lifts only when the sheet is gone
          if (open) return sheetGone(sheet.current);
        },
      })
    )
      return;
    letGo();
    close();
  };

  const items = links.map((l, i) => (
    <a
      key={l.href}
      href={l.href}
      data-d={l.d}
      // on the home page: the dimension the reader is in
      className={variant === 'home' && l.d === dim ? 'on' : undefined}
      aria-current={
        l.key && l.key === current
          ? 'page'
          : variant === 'home' && l.d === dim
            ? 'location'
            : undefined
      }
      data-t='control'
      // the place in the row: the sheet's links arrive one after another
      style={{ '--i': i } as CSSProperties}
      data-section={variant === 'home' ? l.d : undefined}
      onClick={follow}
    >
      {l.label}
    </a>
  ));

  return (
    <>
      <header className='dim-bar' ref={bar}>
        <Link
          className='logo'
          href='/'
          aria-label={t('dimensions.nav.home')}
          // on the home page the logo leads to the top of it
          data-section={variant === 'home' ? 'top' : undefined}
          onClick={follow}
        >
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
