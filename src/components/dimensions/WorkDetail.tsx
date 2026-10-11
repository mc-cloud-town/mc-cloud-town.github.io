'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CaretRightFilled,
  CloseOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { holdPage } from '@/lib/dimensions/pageScroll';
import { addressOf, type Work } from '@/lib/dimensions/works';

const WORDS = 'dimensions.collection.detail';

/** How long the "copied" answer stands in the button before the button says what it does again. */
const COPIED_MS = 2200;

/** Where a work's address is handed to, to be passed on: the old page's four, as plain links. */
const SHARE: [name: string, to: (url: string, title: string) => string][] = [
  ['Facebook', (u) => `https://www.facebook.com/sharer/sharer.php?u=${u}`],
  ['X', (u, t) => `https://twitter.com/intent/tweet?url=${u}&text=${t}`],
  [
    'Weibo',
    (u, t) => `https://service.weibo.com/share/share.php?url=${u}&title=${t}`,
  ],
  ['Reddit', (u, t) => `https://www.reddit.com/submit?url=${u}&title=${t}`],
];

/** What Tab stops on inside the detail, in order. */
const stops = (el: HTMLElement) =>
  [
    ...el.querySelectorAll<HTMLElement>(
      'a[href], button:not(:disabled), iframe',
    ),
  ].filter((x) => !x.closest('[inert]') && x.getClientRects().length > 0);

/**
 * The detail of a work: a layer over the page. It is always in the page so that it can ease out; closed, it is
 * inert and invisible and lets every pointer through, and shows the work it showed last until it has gone.
 * Open, it changes nothing in the page's layout (the page is held, never clipped), the page behind is inert,
 * and the focus is kept inside it; Escape closes it, and the focus goes back to the work in the gallery.
 */
export const WorkDetail = ({
  work,
  open,
  crumb,
  onClose,
  onTag,
}: {
  /** the work to show; still given while the detail is closing */
  work: Work | null;
  open: boolean;
  /** the collection's name, over the work's */
  crumb: string;
  onClose: () => void;
  /** a tag of the work was chosen: the gallery is narrowed to it */
  onTag: (tag: string) => void;
}) => {
  const { t } = useTranslation();
  const title = useId();
  const root = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  /** which of the work's pictures is shown */
  const [at, setAt] = useState(0);
  /** the video that has been asked for, if any: its player is in the page only from then on */
  const [playing, setPlaying] = useState<number | null>(null);
  const [copied, setCopied] = useState<'ok' | 'fail' | null>(null);

  // another work, or the same one opened again: from its first picture, with no player
  const showing = open ? work?.id ?? null : null;
  const [shownFor, setShownFor] = useState<string | null>(null);
  if (showing !== shownFor) {
    setShownFor(showing);
    if (showing !== null) setAt(0);
    setPlaying(null);
    setCopied(null);
  }

  const total = work?.media.length ?? 0;
  const go = (to: number) => {
    const next = Math.min(Math.max(to, 0), total - 1);
    if (next === at) return;
    setAt(next);
    // a video that is left stops: its player goes
    setPlaying(null);
  };

  // The page behind: held where it is and out of reach. The focus: in, and back to where the reader was.
  useEffect(() => {
    const el = root.current;
    if (!open || !el) return;
    const hold = holdPage(el);
    const others = [...(el.parentElement?.children ?? [])].filter(
      (x): x is HTMLElement => x instanceof HTMLElement && x !== el && !x.inert,
    );
    others.forEach((x) => (x.inert = true));
    el.scrollTop = 0;
    closeButton.current?.focus({ preventScroll: true });
    return () => {
      hold.release();
      others.forEach((x) => (x.inert = false));
      // to the work in the gallery; if the list no longer has it (a tag was chosen), to the list's search
      const id = el.dataset.work ?? '';
      (
        document.querySelector<HTMLElement>(
          `.dim .work[data-work="${CSS.escape(id)}"] h2 a`,
        ) ?? document.querySelector<HTMLElement>('.dim .tools .search')
      )?.focus({ preventScroll: true });
    };
  }, [open]);

  // The keys: Escape closes, the arrows walk the pictures, Tab goes round inside.
  useEffect(() => {
    const el = root.current;
    if (!open || !el) return;
    const onKey = (e: KeyboardEvent) => {
      // with Alt, Ctrl or Meta they are the browser's (Alt and an arrow is a step through the history)
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const slides = el.querySelectorAll('.wd-slide').length;
        if (slides < 2) return;
        e.preventDefault();
        const step = e.key === 'ArrowLeft' ? -1 : 1;
        setAt((a) => Math.min(Math.max(a + step, 0), slides - 1));
        setPlaying(null);
      } else if (e.key === 'Tab') {
        const all = stops(el);
        if (all.length === 0) return;
        const first = all[0];
        const last = all[all.length - 1];
        const from = document.activeElement;
        const outside = !from || !el.contains(from);
        if (e.shiftKey ? from === first || outside : from === last || outside) {
          e.preventDefault();
          (e.shiftKey ? last : first).focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // "copied" stands for a moment, then the button says what it does again
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(null), COPIED_MS);
    return () => window.clearTimeout(timer);
  }, [copied]);

  /** this work's own address, with nothing else in it: what is shared */
  const url = work ? window.location.origin + addressOf({ work: work.id }) : '';
  const copy = () =>
    navigator.clipboard.writeText(url).then(
      () => setCopied('ok'),
      () => setCopied('fail'),
    );
  const videos = work?.media.filter((m) => m.kind === 'video') ?? [];

  return (
    <div
      className='work-detail'
      ref={root}
      role='dialog'
      aria-modal='true'
      aria-labelledby={title}
      data-open={open}
      data-work={work?.id}
      inert={!open}
      data-lenis-prevent
    >
      {work && (
        <div className='wd-in'>
          <div className='wd-top'>
            <p className='mono' data-t='note'>
              <span>{crumb}</span>
              <span aria-hidden='true'>/</span>
              <span className='acc'>{t(`${WORDS}.no`, { n: work.no })}</span>
            </p>
            <button
              type='button'
              className='pill'
              data-action='close'
              ref={closeButton}
              onClick={onClose}
            >
              <span className='mark' aria-hidden='true'>
                <CloseOutlined />
              </span>
              {t(`${WORDS}.close`)}
            </button>
          </div>

          <div className='wd-stage'>
            {/* the frame keeps the pictures' room; they lie over one another and give way by a fade */}
            <div
              className='wd-frame'
              role='group'
              aria-roledescription='carousel'
              aria-label={t(`${WORDS}.pictures`)}
            >
              {work.media.map((m, i) => (
                <div
                  className='wd-slide'
                  key={`${i}:${m.src}`}
                  data-kind={m.kind}
                  data-current={i === at}
                  inert={i !== at}
                >
                  {m.kind === 'image' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.src}
                      alt={t(`${WORDS}.picture`, {
                        title: work.title,
                        n: i + 1,
                      })}
                    />
                  ) : open && playing === i ? (
                    <iframe
                      src={`${m.src}${m.src.includes('?') ? '&' : '?'}autoplay=1`}
                      title={t(`${WORDS}.video`, { title: work.title })}
                      allow='autoplay; encrypted-media; picture-in-picture; fullscreen'
                      allowFullScreen
                    />
                  ) : (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.poster} alt='' />
                      {/* the player is another site's: it comes only when it is asked for */}
                      <button
                        type='button'
                        className='pill wd-play'
                        data-action='play'
                        onClick={() => setPlaying(i)}
                      >
                        <span className='mark' aria-hidden='true'>
                          <CaretRightFilled />
                        </span>
                        {t(`${WORDS}.play`)}
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
            {total > 1 && (
              <div className='wd-seq'>
                <button
                  type='button'
                  className='pill'
                  data-action='prev'
                  aria-label={t(`${WORDS}.prev`)}
                  // not `disabled`: the focus stays on the button when the first picture is reached
                  aria-disabled={at === 0}
                  onClick={() => go(at - 1)}
                >
                  <span className='mark' aria-hidden='true'>
                    <LeftOutlined />
                  </span>
                </button>
                <span
                  className='wd-count mono'
                  data-t='note'
                  aria-live='polite'
                >
                  {at + 1} / {total}
                </span>
                <button
                  type='button'
                  className='pill'
                  data-action='next'
                  aria-label={t(`${WORDS}.next`)}
                  aria-disabled={at === total - 1}
                  onClick={() => go(at + 1)}
                >
                  <span className='mark' aria-hidden='true'>
                    <RightOutlined />
                  </span>
                </button>
                <ol className='wd-thumbs'>
                  {work.media.map((m, i) => (
                    <li key={`${i}:${m.src}`}>
                      <button
                        type='button'
                        data-kind={m.kind}
                        aria-current={i === at}
                        aria-label={t(
                          m.kind === 'video'
                            ? `${WORDS}.toVideo`
                            : `${WORDS}.toPicture`,
                          { n: i + 1 },
                        )}
                        onClick={() => go(i)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={m.kind === 'video' ? m.poster : m.src}
                          alt=''
                        />
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          <div className='wd-text'>
            <p className='meta mono' data-t='note'>
              {work.date}
            </p>
            <h2 className='serif' id={title} data-t='title'>
              {work.title}
            </h2>
            {work.tags.length > 0 && (
              <div
                className='chips wd-tags'
                role='group'
                aria-label={t('dimensions.collection.tags')}
              >
                {work.tags.map((tag, i) => (
                  <button
                    type='button'
                    key={`${i}:${tag}`}
                    onClick={() => onTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
            {work.creators.length > 0 && (
              <section>
                <h3 className='mono' data-t='note'>
                  {t(`${WORDS}.creator`)}
                </h3>
                <ul className='wd-people'>
                  {work.creators.map((c, i) => (
                    <li key={`${i}:${c}`}>{c}</li>
                  ))}
                </ul>
              </section>
            )}
            {work.introductions.length > 0 && (
              <section>
                <h3 className='mono' data-t='note'>
                  {t(`${WORDS}.intro`)}
                </h3>
                {work.introductions.map((p, i) => (
                  <p key={i} data-t='body'>
                    {p}
                  </p>
                ))}
              </section>
            )}
            {work.credits.length > 0 && (
              <section>
                <h3 className='mono' data-t='note'>
                  {t(`${WORDS}.credit`)}
                </h3>
                <ul className='wd-people'>
                  {work.credits.map((c, i) => (
                    <li key={`${i}:${c.name}`}>
                      {c.url ? (
                        <a
                          href={c.url}
                          target='_blank'
                          rel='noopener noreferrer'
                        >
                          {c.name}
                        </a>
                      ) : (
                        c.name
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {(work.download || videos.length > 0) && (
              <div className='wd-links'>
                {work.download && (
                  <a
                    className='pill'
                    href={work.download}
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    {t(`${WORDS}.download`)} ↗
                  </a>
                )}
                {videos.map(
                  (v, i) =>
                    v.kind === 'video' && (
                      <a
                        className='pill'
                        key={`${i}:${v.watch}`}
                        href={v.watch}
                        target='_blank'
                        rel='noopener noreferrer'
                      >
                        {t(`${WORDS}.watch`)} ↗
                      </a>
                    ),
                )}
              </div>
            )}
            <section className='wd-share'>
              <h3 className='mono' data-t='note'>
                {t(`${WORDS}.share`)}
              </h3>
              <div>
                <button
                  type='button'
                  className='pill'
                  data-action='copy'
                  onClick={copy}
                >
                  {/* a new node for each thing it says, so the words fade in (collection.css) */}
                  <span key={copied ?? 'copy'} aria-live='polite'>
                    {t(
                      copied === 'ok'
                        ? `${WORDS}.copied`
                        : copied === 'fail'
                          ? `${WORDS}.copyFail`
                          : `${WORDS}.copy`,
                    )}
                  </span>
                </button>
                {SHARE.map(([name, to]) => (
                  <a
                    key={name}
                    href={to(
                      encodeURIComponent(url),
                      encodeURIComponent(work.title),
                    )}
                    target='_blank'
                    rel='noopener noreferrer'
                    data-t='control'
                  >
                    {name === 'Weibo' ? t(`${WORDS}.weibo`) : name}
                  </a>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};
