import { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

const HeroCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 40px;
  margin-bottom: 64px;
  padding: 48px;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-color);
  background: var(--bg-elevated);
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: var(--gradient-accent);
  }

  @media (min-width: 900px) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  @media (max-width: 768px) {
    padding: 32px 24px;
    gap: 32px;
  }
`;

const HeroText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 600px;
`;

const Eyebrow = styled.span`
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-primary);
`;

const Title = styled.h2`
  margin: 0;
  font-family: var(--font-heading);
  font-size: clamp(2.5rem, 4vw, 3.5rem);
  font-weight: 700;
  line-height: 1.1;
  color: var(--text-primary);
`;

const Description = styled.p`
  margin: 0;
  color: var(--text-secondary);
  font-size: 1.05rem;
  line-height: 1.7;
`;

const MetaGrid = styled.div`
  display: flex;
  gap: 32px;
  flex-wrap: wrap;

  @media (max-width: 640px) {
    width: 100%;
    justify-content: space-between;
    gap: 24px;
  }
`;

const MetaCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const MetaLabel = styled.div`
  color: var(--text-tertiary);
  font-size: 0.85rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const MetaValue = styled.div`
  font-family: var(--font-heading);
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
`;

// Direct DOM mutation ticker, constant speed (linear)
const useNumberTicker = (end: number, duration: number = 1000) => {
  const nodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrame: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Linear progression (勻速)
      const currentValue = Math.floor(progress * end);
      
      if (nodeRef.current) {
        nodeRef.current.textContent = currentValue.toString();
      }

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(step);
      }
    };

    animationFrame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return nodeRef;
};

interface HeroSectionProps {
  stats: {
    totalCount: number;
    activeCount: number;
    totalStars: number;
  };
}

const HeroSection = ({ stats }: HeroSectionProps) => {
  const { t } = useTranslation();
  
  const totalRef = useNumberTicker(stats.totalCount);
  const activeRef = useNumberTicker(stats.activeCount);
  const starsRef = useNumberTicker(stats.totalStars);

  return (
    <HeroCard>
      <HeroText>
        <Eyebrow>{t('opensource.eyebrow')}</Eyebrow>
        <Title>{t('opensource.title')}</Title>
        <Description>{t('opensource.intro')}</Description>
      </HeroText>
      <MetaGrid>
        <MetaCard>
          <MetaLabel>{t('opensource.stats.total')}</MetaLabel>
          <MetaValue ref={totalRef}>0</MetaValue>
        </MetaCard>
        <MetaCard>
          <MetaLabel>{t('opensource.stats.active')}</MetaLabel>
          <MetaValue ref={activeRef}>0</MetaValue>
        </MetaCard>
        <MetaCard>
          <MetaLabel>{t('opensource.stats.stars')}</MetaLabel>
          <MetaValue ref={starsRef}>0</MetaValue>
        </MetaCard>
      </MetaGrid>
    </HeroCard>
  );
};

export default HeroSection;
