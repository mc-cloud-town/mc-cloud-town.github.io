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
      {count}
    </span>
  </div>
);
