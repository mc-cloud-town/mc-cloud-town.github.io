import { NETHER_IMAGES } from '@/constants/scenes';

const pad = (n: number) => String(n).padStart(2, '0');

interface Facility {
  date: string;
  name: string;
}

/** A picture of the plain list: it fades in once it has arrived (home.css), also when it was there already. */
const shown = (img: HTMLImageElement | null) => {
  if (!img) return;
  const show = () => img.setAttribute('data-in', '');
  if (img.complete) show();
  else {
    img.addEventListener('load', show, { once: true });
    img.addEventListener('error', show, { once: true });
  }
};

/**
 * With reduced motion nothing is pinned and nothing steps: the facilities are a plain list in the flow of the
 * page, each with its date, its name and its own picture, at every screen size.
 */
const PlainLedger = ({ items }: { items: Facility[] }) => (
  <section id='ledger' data-dim='nether'>
    <ol className='ledger-plain'>
      {/* keyed by position: the same rows carry every language */}
      {items.map((it, i) => (
        <li key={i}>
          <div>
            <p className='mono' data-t='note'>
              <span>{pad(i + 1)}</span>
              <span className='acc'>{it.date}</span>
            </p>
            <h3 className='serif' data-t='title'>
              {it.name}
            </h3>
          </div>
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={NETHER_IMAGES[i]} alt='' loading='lazy' ref={shown} />
          </figure>
        </li>
      ))}
    </ol>
  </section>
);

/**
 * Pinned while the reader scrolls through the facilities. choreography.ts reports which one is current.
 * `reduced` is null until the browser has been asked (the static markup is the pinned stage).
 */
export const NetherLedger = ({
  index,
  items,
  reduced,
}: {
  index: number;
  items: Facility[];
  reduced: boolean | null;
}) =>
  reduced ? (
    <PlainLedger items={items} />
  ) : (
    <section id='ledger' data-dim='nether'>
      <div className='ledger-stage'>
        <ol className='ledger-list'>
          {/* keyed by position: the same rows carry every language */}
          {items.map((it, i) => (
            <li
              key={i}
              className={i === index ? 'on' : undefined}
              data-t='note'
            >
              <span className='mono'>{pad(i + 1)}</span>
              <span>{it.name}</span>
            </li>
          ))}
        </ol>
        <div className='ledger-now' aria-live='polite'>
          <p className='mono' data-t='note'>
            <span className='acc'>{items[index]?.date}</span>
          </p>
          <h3 className='serif' data-t='title'>
            {/* a new facility is a new node, so the name rises in again; a new language is not */}
            <span key={index}>{items[index]?.name}</span>
          </h3>
        </div>
      </div>
    </section>
  );
