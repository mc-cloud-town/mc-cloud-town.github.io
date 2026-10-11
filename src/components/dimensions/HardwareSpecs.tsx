'use client';

import { useTranslation } from 'react-i18next';
import { afterEntrance } from '@/lib/dimensions/entrance';

interface Spec {
  icon: string;
  name: string;
  value: string;
}

/**
 * The server's hardware as a specification list: each group is a label (sans) and its values (mono), one value
 * to a line, as the old page's cards gave them; then the features. The words are the existing `hardware.*` keys
 * (the old page's), so nothing is said twice.
 */
export const HardwareSpecs = () => {
  const { t } = useTranslation();
  const specs = t('hardware.specs', { returnObjects: true }) as Spec[];
  const features = t('hardware.features', { returnObjects: true }) as string[];

  return (
    <div className='specs' ref={afterEntrance}>
      <section className='group'>
        <header>
          <h2 className='serif' data-t='title'>
            {t('hardware.specsTitle')}
          </h2>
          <span className='mono' data-t='note'>
            {String(specs.length).padStart(2, '0')}
          </span>
        </header>
        <dl>
          {specs.map((spec, i) => (
            <div className='spec' key={i} style={{ '--i': i } as never}>
              <dt data-t='body'>
                <span className='mono' data-t='note' aria-hidden='true'>
                  {String(i + 1).padStart(2, '0')}
                </span>
                {spec.name}
              </dt>
              {spec.value.split('\n').map((line, j) => (
                <dd className='mono' key={j} data-t='body'>
                  {line}
                </dd>
              ))}
            </div>
          ))}
        </dl>
      </section>
      <section className='group'>
        <header>
          <h2 className='serif' data-t='title'>
            {t('hardware.featuresTitle')}
          </h2>
          <span className='mono' data-t='note'>
            {String(features.length).padStart(2, '0')}
          </span>
        </header>
        <ol>
          {features.map((feature, i) => (
            <li
              className='feature'
              key={i}
              style={{ '--i': i } as never}
              data-t='body'
            >
              <span className='mono' data-t='note' aria-hidden='true'>
                {String(i + 1).padStart(2, '0')}
              </span>
              {feature}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
};
