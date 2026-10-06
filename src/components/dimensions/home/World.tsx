import { NETHER_IMAGES, SCENES } from '@/constants/scenes';

const VEIL: Record<string, string> = {
  hero: 'veil veil--hero',
  side: 'veil veil--side',
  'side-flip': 'veil veil--side veil--flip',
  wide: 'veil veil--wide',
  foot: 'veil veil--foot',
};

/** The fixed stage. Scenes are stacked layers; choreography.ts decides which one is showing. */
export const World = ({ children }: { children?: React.ReactNode }) => (
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
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.src} alt='' loading={i === 0 ? 'eager' : 'lazy'} />
            )}
            {s.id === 'nether' &&
              NETHER_IMAGES.map((src, k) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={src}
                  src={src}
                  alt=''
                  loading='lazy'
                  data-ledger={k}
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
