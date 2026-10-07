const pad = (n: number) => String(n).padStart(2, '0');

/** Pinned while the reader scrolls through the facilities. choreography.ts reports which one is current. */
export const NetherLedger = ({
  index,
  items,
}: {
  index: number;
  items: { date: string; name: string }[];
}) => (
  <section id='ledger' data-dim='nether'>
    <div className='ledger-stage'>
      <ol className='ledger-list'>
        {/* keyed by position: the same rows carry every language */}
        {items.map((it, i) => (
          <li key={i} className={i === index ? 'on' : undefined} data-t='note'>
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
