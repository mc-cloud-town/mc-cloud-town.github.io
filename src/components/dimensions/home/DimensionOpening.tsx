import type { ReactNode } from 'react';
import { VerticalLabel } from '#/dimensions/VerticalLabel';

/** The Latin name beside the tag: the same in every language. */
const LATIN = {
  overworld: 'OVERWORLD',
  nether: 'THE NETHER',
  end: 'THE END',
} as const;

/** A dimension opens: tag, statement (one line per span), body, then whatever the dimension adds. */
export const DimensionOpening = ({
  id,
  tag,
  say,
  body,
  label,
  children,
}: {
  id: 'overworld' | 'nether' | 'end';
  tag: string;
  say: string[];
  body: string;
  label: string;
  children?: ReactNode;
}) => (
  <section className='open' id={id} data-dim={id}>
    <div>
      <div className='tag mono' data-t='note'>
        <span className='acc'>{tag}</span>
        <span>{LATIN[id]}</span>
      </div>
      <p className='say' data-say data-t='title'>
        {say.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </p>
      <p className='body rise' data-t='body'>
        {body}
      </p>
      {children}
    </div>
    <VerticalLabel>{label}</VerticalLabel>
  </section>
);
