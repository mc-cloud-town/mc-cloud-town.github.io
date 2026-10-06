'use client';

import { Fragment, useEffect } from 'react';
import Link from 'next/link';
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
                <Link href={c.href}>{c.label}</Link>
              ) : (
                <span className='acc'>{c.label}</span>
              )}
            </Fragment>
          ))}
        </p>
        <h1 className='serif' data-t='title'>
          {title.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </h1>
        <p data-t='body'>{lead}</p>
      </div>
      <VerticalLabel>{label}</VerticalLabel>
    </div>
  );
};
