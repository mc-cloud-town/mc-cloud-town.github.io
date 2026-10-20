import type { ReactNode } from 'react';

export const Toolbar = ({
  count,
  children,
}: {
  count: string;
  children: ReactNode;
}) => (
  <div className='tools'>
    {children}
    <span className='count mono' data-t='note' aria-live='polite'>
      {/* a new node for every new count, so the change fades in (inner.css) */}
      <span key={count}>{count}</span>
    </span>
  </div>
);
