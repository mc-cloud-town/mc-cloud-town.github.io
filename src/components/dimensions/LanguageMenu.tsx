'use client';

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { useTranslation } from 'react-i18next';
import { GlobalOutlined } from '@ant-design/icons';

/** Each language under its own name, the same whatever language the page is in. */
const LANGS = [
  { value: 'zh_TW', short: '繁', name: '繁體中文' },
  { value: 'zh_CN', short: '简', name: '简体中文' },
  { value: 'en', short: 'EN', name: 'English' },
];

/** `zh` is the build-time default and is the same content as zh_TW. */
const normalise = (lng: string) => (lng === 'zh' ? 'zh_TW' : lng);

/**
 * The language control of the bar: a pill that opens a short list under itself. Not the system's select:
 * its list would be the operating system's, in neither the type nor the colours of the site, and would
 * appear without a transition. The list is always in the page so that it can ease out; closed, it is
 * invisible, inert and lets every pointer through (shell.css). It is an overlay: it changes nothing in the layout.
 *
 * Keyboard: Enter, Space or an arrow on the pill opens it; the arrows, Home and End move; Enter or Space
 * chooses; Escape closes and gives the focus back to the pill; Tab closes and moves on.
 */
export const LanguageMenu = () => {
  const { t, i18n } = useTranslation();
  const id = useId();
  const box = useRef<HTMLSpanElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  /** The list was open when the pill was pressed: that press closes it, whatever happens before the click. */
  const pressedOpen = useRef(false);
  const current = Math.max(
    0,
    LANGS.findIndex((l) => l.value === normalise(i18n.language)),
  );
  /** The row the keyboard is on. */
  const [active, setActive] = useState(current);

  const show = () => {
    setActive(current);
    setOpen(true);
  };
  const hide = (refocus: boolean) => {
    setOpen(false);
    if (refocus) trigger.current?.focus({ preventScroll: true });
  };
  const choose = (index: number) => {
    hide(true);
    if (index !== current) i18n.changeLanguage(LANGS[index].value);
  };

  // open: the list has the focus, so the keys go to it; a press anywhere else closes it
  useEffect(() => {
    if (!open) return;
    list.current?.focus({ preventScroll: true });
    const onPress = (e: PointerEvent) => {
      if (e.target instanceof Node && !box.current?.contains(e.target))
        setOpen(false);
    };
    document.addEventListener('pointerdown', onPress);
    return () => document.removeEventListener('pointerdown', onPress);
  }, [open]);

  const onListKey = (e: ReactKeyboardEvent) => {
    const last = LANGS.length - 1;
    const to =
      e.key === 'ArrowDown'
        ? Math.min(active + 1, last)
        : e.key === 'ArrowUp'
          ? Math.max(active - 1, 0)
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? last
              : null;
    if (to !== null) {
      e.preventDefault();
      setActive(to);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(active);
    } else if (e.key === ' ') {
      // chosen when the key comes up (below): were the focus back on the pill before that, the release would press it
      e.preventDefault();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      hide(true);
    } else if (e.key === 'Tab') {
      // the focus moves on by itself, from the list, which stands right after the pill
      setOpen(false);
    }
  };

  return (
    <span
      className='lang'
      ref={box}
      // the focus has left the control altogether (Tab, or a click on something else that takes it)
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <button
        className='pill'
        type='button'
        ref={trigger}
        data-action='language'
        aria-haspopup='listbox'
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-label={t('dimensions.nav.languageNow', {
          language: LANGS[current].name,
        })}
        // Safari does not give a button the focus when it is clicked: the press takes the focus from the open
        // list to nothing, the list closes on that blur, and the click that follows would open it again.
        // So what the pill does is decided by what it was when it was pressed. (A click from the keyboard
        // has no press before it, and no count of clicks.)
        onPointerDown={() => {
          pressedOpen.current = open;
        }}
        onClick={(e) => {
          const wasOpen = e.detail > 0 && pressedOpen.current;
          pressedOpen.current = false;
          if (open || wasOpen) hide(false);
          else show();
        }}
        onKeyDown={(e) => {
          if (open || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
          e.preventDefault();
          show();
        }}
      >
        <span className='mark' aria-hidden='true'>
          <GlobalOutlined />
        </span>
        {LANGS[current].short}
      </button>
      <ul
        className='lang-list'
        id={`${id}-list`}
        ref={list}
        role='listbox'
        tabIndex={-1}
        aria-label={t('dimensions.nav.language')}
        aria-activedescendant={`${id}-${active}`}
        data-open={open}
        inert={!open}
        onKeyDown={onListKey}
        onKeyUp={(e) => e.key === ' ' && open && choose(active)}
      >
        {LANGS.map((l, i) => (
          <li
            key={l.value}
            id={`${id}-${i}`}
            role='option'
            aria-selected={i === current}
            data-value={l.value}
            data-active={open && i === active}
            lang={l.value.replace('_', '-')}
            onPointerMove={() => i !== active && setActive(i)}
            onClick={() => choose(i)}
          >
            {l.name}
          </li>
        ))}
      </ul>
    </span>
  );
};
