import type { ReactNode } from 'react';
import { VerticalLabel } from '#/dimensions/VerticalLabel';
import { DIMENSION_MARKS } from '@/constants/scenes';

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
        <span>{DIMENSION_MARKS[id]}</span>
      </div>
      {/* the statement is the dimension's heading, second in the outline after the title: a jump to the section
          puts the focus here. Its look is the class's (home.css), not the tag's. */}
      <h2 className='say' data-say data-t='title' data-heading tabIndex={-1}>
        {/* keyed by position: the same nodes carry every language, so their scroll animations survive a switch */}
        {say.map((line, i) => (
          <span key={i}>{line}</span>
        ))}
      </h2>
      <p className='body rise' data-t='body'>
        {body}
      </p>
      {children}
    </div>
    <VerticalLabel>{label}</VerticalLabel>
  </section>
);
