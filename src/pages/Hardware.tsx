import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import {
  DesktopOutlined,
  DatabaseOutlined,
  HddOutlined,
  ThunderboltOutlined,
  GlobalOutlined,
  ToolOutlined,
} from '@ant-design/icons';

import PageHeader from '#/common/PageHeader.tsx';
import HeaderImage from '#/common/HeaderImage.tsx';

import getImageUrl from '@/utils/getImageUrl.ts';

const SpecsContainer = styled.div`
  background: var(--bg-secondary);
  padding: 80px 30px;
  min-height: 400px;

  @media (max-width: 768px) {
    padding: 60px 20px;
  }
`;

const SpecsContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const SectionTitle = styled.h2`
  text-align: center;
  color: var(--text-primary);
  margin-bottom: 60px;
  font-weight: 700;
  font-size: clamp(1.8rem, 4vw, 2.5rem);
`;

const SpecsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 30px;
  margin-bottom: 60px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
`;

const SpecCard = styled.div`
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  padding: 30px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
  }
`;

const SpecIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 15px;
  text-align: center;
  color: var(--color-primary);

  .anticon {
    font-size: 3rem;
  }
`;

const SpecName = styled.h3`
  color: var(--text-primary);
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 10px;
  text-align: center;
`;

const SpecValue = styled.p`
  color: var(--text-secondary);
  font-size: 1rem;
  line-height: 1.6;
  text-align: center;
`;

const FeaturesContainer = styled.div`
  background: var(--color-primary-light);
  border-radius: var(--radius-lg);
  padding: 40px;
  margin-top: 40px;

  @media (max-width: 768px) {
    padding: 30px 20px;
  }
`;

const FeaturesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const FeatureItem = styled.li`
  color: var(--text-primary);
  font-size: 1.1rem;
  line-height: 1.8;
  margin-bottom: 15px;
  padding-left: 30px;
  position: relative;

  &:before {
    content: '✓';
    position: absolute;
    left: 0;
    color: var(--color-primary);
    font-weight: bold;
    font-size: 1.3rem;
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const iconMap: Record<string, React.ReactNode> = {
  processor: <DesktopOutlined />,
  memory: <DatabaseOutlined />,
  storage: <HddOutlined />,
  power: <ThunderboltOutlined />,
  network: <GlobalOutlined />,
  maintenance: <ToolOutlined />,
};

const Hardware = () => {
  const { t } = useTranslation();

  const specs = t('hardware.specs', { returnObjects: true }) as Array<{
    icon: string;
    name: string;
    value: string;
  }>;

  const features = t('hardware.features', { returnObjects: true }) as string[];

  return (
    <>
      <PageHeader
        backgroundComponent={
          <HeaderImage imageUrl={getImageUrl(t('hardware.imageUrl'))} />
        }
        headerTextArray={[t('hardware.title')]}
        subHeaderContentArray={[t('hardware.description')]}
      />
      <SpecsContainer>
        <SpecsContent>
          <SectionTitle>{t('hardware.specsTitle')}</SectionTitle>
          <SpecsGrid>
            {Array.isArray(specs) &&
              specs.map((spec, index) => (
                <SpecCard key={index}>
                  <SpecIcon>{iconMap[spec.icon]}</SpecIcon>
                  <SpecName>{spec.name}</SpecName>
                  <SpecValue>{spec.value}</SpecValue>
                </SpecCard>
              ))}
          </SpecsGrid>
          <FeaturesContainer>
            <SectionTitle>{t('hardware.featuresTitle')}</SectionTitle>
            <FeaturesList>
              {Array.isArray(features) &&
                features.map((feature, index) => (
                  <FeatureItem key={index}>{feature}</FeatureItem>
                ))}
            </FeaturesList>
          </FeaturesContainer>
        </SpecsContent>
      </SpecsContainer>
    </>
  );
};

export default Hardware;
