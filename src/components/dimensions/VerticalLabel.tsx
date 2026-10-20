/** The upright name on the right of a section. Decorative: the same word is in the heading or the nav. */
export const VerticalLabel = ({ children }: { children: string }) => (
  <div className='vt' aria-hidden='true' data-t='label'>
    {children}
  </div>
);
