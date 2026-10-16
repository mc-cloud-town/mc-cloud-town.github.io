'use client';

import { Fragment, useEffect, type CSSProperties } from 'react';
import { useDimension, type Dimension } from './DimensionProvider';
import { VerticalLabel } from './VerticalLabel';

interface Crumb {
  href?: string;
  label: string;
}

export const InnerHeader = ({
  image,
  dim,
  crumbs,
  title,
  lead,
  label,
}: {
  image: string;
  dim: Dimension;
  crumbs: Crumb[];
  title: string[];
  lead: string;
  label: string;
}) => {
  const { setDim } = useDimension();
  useEffect(() => setDim(dim), [dim, setDim]);

  return (
    <div className='head'>
      <div className='bg'>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt='' />
      </div>
      <div>
        <p className='crumb mono' data-t='note'>
          {crumbs.map((c, i) => (
            <Fragment key={c.label}>
              {i > 0 && <span aria-hidden='true'>/</span>}
              {c.href ? (
                // a plain link: the shell takes the step from here (PageTransitions)
                <a href={c.href}>{c.label}</a>
              ) : (
                <span className='acc'>{c.label}</span>
              )}
            </Fragment>
          ))}
        </p>
        <h1 className='serif' data-t='title'>
          {title.map((line, i) => (
            // By its place, not by its words: another language at boot changes the text of the line that is
            // rising, it does not put a new line in its place (which would start the entrance again).
            <span key={i} style={{ '--i': i } as CSSProperties}>
              {line}
            </span>
          ))}
        </h1>
        <p data-t='body'>{lead}</p>
      </div>
      <VerticalLabel>{label}</VerticalLabel>
    </div>
  );
};
