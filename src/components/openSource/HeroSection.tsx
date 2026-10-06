import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import {
  DatabaseOutlined,
  FireOutlined,
  StarOutlined,
} from '@ant-design/icons';

const HeroCard = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 64px;
  padding: 48px;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-color);
  background: linear-gradient(145deg, var(--bg-elevated), var(--bg-primary));
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 6px;
    background: var(--gradient-accent);
    opacity: 0.8;
  }

  @media (min-width: 900px) {
    align-items: center;
  }

  @media (max-width: 768px) {
    padding: 32px 24px;
  }
`;

const MetaGrid = styled.div`
  display: flex;
  justify-content: center;
  gap: 48px;
  flex-wrap: wrap;

  @media (max-width: 640px) {
    width: 100%;
    flex-direction: column;
    justify-content: center;
    gap: 24px;
  }
`;

const MetaCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 40px;
  border-radius: var(--radius-lg);
  background: var(--bg-secondary);
  border: 1px solid transparent;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-md);
    border-color: var(--border-color);
    background: var(--bg-elevated);

    .anticon {
      color: var(--color-accent);
      transform: scale(1.1);
    }
  }

  @media (max-width: 640px) {
    width: 100%;
    padding: 24px;
  }
`;

const MetaLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-tertiary);
  font-size: 0.95rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;

  .anticon {
    font-size: 1.1rem;
    transition: all 0.3s ease;
  }
`;

const MetaValue = styled.div`
  font-family: var(--font-heading);
  font-size: 3.2rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
`;

interface HeroSectionProps {
  loading: boolean;
  stats: {
    totalCount: number;
    activeCount: number;
    totalStars: number;
  };
}

const getNumberLocale = (language: string) => {
  const normalizedLocale = language.replace('_', '-');

  return Intl.NumberFormat.supportedLocalesOf([normalizedLocale])[0] ?? 'en-US';
};

const HeroSection = ({ loading, stats }: HeroSectionProps) => {
  const { t, i18n } = useTranslation();
  const numberLocale = getNumberLocale(i18n.resolvedLanguage ?? i18n.language);

  const formatValue = (value: number) => {
    if (loading) {
      return '--';
    }

    return value.toLocaleString(numberLocale);
  };

  return (
    <HeroCard>
      <MetaGrid>
        <MetaCard>
          <MetaLabel>
            <DatabaseOutlined /> {t('opensource.stats.total')}
          </MetaLabel>
          <MetaValue>{formatValue(stats.totalCount)}</MetaValue>
        </MetaCard>
        <MetaCard>
          <MetaLabel>
            <FireOutlined /> {t('opensource.stats.active')}
          </MetaLabel>
          <MetaValue>{formatValue(stats.activeCount)}</MetaValue>
        </MetaCard>
        <MetaCard>
          <MetaLabel>
            <StarOutlined /> {t('opensource.stats.stars')}
          </MetaLabel>
          <MetaValue>{formatValue(stats.totalStars)}</MetaValue>
        </MetaCard>
      </MetaGrid>
    </HeroCard>
  );
};

export default HeroSection;
