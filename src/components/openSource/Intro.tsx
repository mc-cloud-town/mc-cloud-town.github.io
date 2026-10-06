import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

import {
  Appear,
  Placeholder,
  TextLink,
  getIntlLocale,
} from './OpenSourceStyles.ts';

const Wrapper = styled(Appear)`
  text-align: center;
`;

const Headline = styled.h2`
  max-width: 760px;
  margin: 0 auto 24px;
  font-size: clamp(2.25rem, 5vw, 3.5rem);
  font-weight: 700;
  line-height: 1.08;
  letter-spacing: -0.025em;
  text-wrap: balance;
`;

const Stats = styled.dl`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  max-width: 760px;
  margin: 72px auto 0;

  @media (max-width: 734px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    row-gap: 32px;
    margin-top: 48px;
  }
`;

const Stat = styled.div`
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  gap: 6px;

  & + & {
    border-left: 1px solid var(--border-color-strong);
  }

  @media (max-width: 734px) {
    &:nth-child(3) {
      border-left: none;
    }
  }

  dt {
    color: var(--text-tertiary);
    font-size: 0.9rem;
  }

  dd {
    display: flex;
    align-items: center;
    min-height: 48px;
    margin: 0;
    font-family: var(--font-heading);
    font-size: 2.75rem;
    font-weight: 600;
    line-height: 1;
    letter-spacing: -0.02em;
    font-variant-numeric: tabular-nums;
  }
`;

export interface IntroStats {
  total: number;
  languages: number;
  stars: number;
  forks: number;
}

interface IntroProps {
  loading: boolean;
  orgUrl: string;
  stats: IntroStats;
}

const Intro = ({ loading, orgUrl, stats }: IntroProps) => {
  const { t, i18n } = useTranslation();
  const locale = getIntlLocale(i18n.language);
  const items = Object.entries(stats) as [keyof IntroStats, number][];

  return (
    <Wrapper>
      <Headline>{t('opensource.overviewTitle')}</Headline>
      <TextLink href={orgUrl} target='_blank' rel='noreferrer'>
        {t('opensource.viewOnGithub')}
      </TextLink>

      <Stats>
        {items.map(([key, value]) => (
          <Stat key={key}>
            <dt>{t(`opensource.stats.${key}`)}</dt>
            <dd>
              {loading ? (
                <Placeholder $w='56px' $h='36px' />
              ) : (
                value.toLocaleString(locale)
              )}
            </dd>
          </Stat>
        ))}
      </Stats>
    </Wrapper>
  );
};

export default Intro;
