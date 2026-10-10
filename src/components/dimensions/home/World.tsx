import type { CSSProperties, ReactNode } from 'react';
import { NETHER_IMAGES, SCENES } from '@/constants/scenes';

const VEIL: Record<string, string> = {
  hero: 'veil veil--hero',
  side: 'veil veil--side',
  'side-flip': 'veil veil--side veil--flip',
  wide: 'veil veil--wide',
  foot: 'veil veil--foot',
};

/**
 * One picture of a scene. Until it is its turn it has no address, so nothing is fetched for it: the loader waits
 * for the first picture and the fonts, and fourteen more pictures would compete with them (a fixed full-screen
 * layer is always "in view", so lazy loading does nothing here). With scripts off nothing would ever give it one,
 * so the served page carries it in a `noscript` as well.
 * A picture is marked once it can be drawn (`data-in`): one that comes after its scene is on screen fades in on
 * that mark instead of popping (home.css).
 */
const mark = (img: HTMLImageElement) => {
  // decoded first, so the fade is not the frame in which the picture is still being unpacked
  void img
    .decode()
    .catch(() => undefined)
    .then(() => {
      if (img.naturalWidth > 0) img.dataset.in = '';
    });
};
/** Already there when the page's script takes over (the first picture, or one from the cache): no `load` will come. */
const arrivedAlready = (img: HTMLImageElement | null) => {
  if (img?.complete && img.naturalWidth > 0) mark(img);
};
const Picture = ({
  src,
  now,
  ledger,
  style,
}: {
  src: string;
  now: boolean;
  ledger?: number;
  style?: CSSProperties;
}) => (
  <>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      ref={arrivedAlready}
      src={now ? src : undefined}
      alt=''
      data-ledger={ledger}
      style={style}
      onLoad={(e) => mark(e.currentTarget)}
    />
    {!now && (
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt='' />
      </noscript>
    )}
  </>
);

/**
 * The fixed stage. Scenes are stacked layers; choreography.ts decides which one is showing.
 * The first picture is in the served page. `first` names the others that are needed before the loader lifts
 * (the picture of the place the reader arrives at), and `all` is set once it has lifted.
 */
export const World = ({
  first = [],
  all = false,
  children,
}: {
  first?: readonly string[];
  all?: boolean;
  children?: ReactNode;
}) => (
  <div className='world' aria-hidden='true'>
    {SCENES.map((s, i) => (
      <div
        className={`scene${i === 0 ? ' is-first' : ''}`}
        data-scene={s.id}
        key={s.id}
      >
        <div className='zoom'>
          <div className='cam'>
            {s.src && (
              <Picture
                src={s.src}
                now={i === 0 || all || first.includes(s.src)}
              />
            )}
            {s.id === 'nether' &&
              NETHER_IMAGES.map((src, k) => (
                <Picture
                  key={src}
                  src={src}
                  now={all || first.includes(src)}
                  ledger={k}
                  style={{ opacity: k === 0 ? 1 : 0 }}
                />
              ))}
            {s.id === 'end' && children}
            {VEIL[s.veil] && <div className={VEIL[s.veil]} />}
          </div>
        </div>
      </div>
    ))}
  </div>
);
