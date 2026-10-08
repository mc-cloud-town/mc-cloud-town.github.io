'use client';

import { useTranslation } from 'react-i18next';
import { useDimension } from '#/dimensions/DimensionProvider';
import { followSectionLink } from '@/lib/dimensions/navigation';

const STOPS = ['overworld', 'nether', 'end'] as const;

/** Wide, tall screens only: three stops and a line that fills with scroll progress. */
export const DimensionRail = () => {
  const { t } = useTranslation();
  const { dim } = useDimension();
  return (
    <nav className='rail' aria-label={t('dimensions.nav.rail')}>
      <b />
      {STOPS.map((d) => (
        <a
          key={d}
          href={`#${d}`}
          data-d={d}
          className={dim === d ? 'on' : undefined}
          aria-label={t(`dimensions.nav.${d}`)}
          aria-current={dim === d ? 'location' : undefined}
          onClick={(e) => followSectionLink(e)}
        />
      ))}
    </nav>
  );
};
