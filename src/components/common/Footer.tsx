import React from 'react';
import { Row, Col, Space } from 'antd';
import { DiscordOutlined, YoutubeOutlined, XOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { LazyLoadImage } from 'react-lazy-load-image-component';

import { serverLink } from '@/constants';
import CTEC_banner from '@/assets/brand/brand.webp';
import logo from '@/assets/logo/base.webp';
import { useTranslation } from 'react-i18next';

// Subtle gradient animation
const gradientShift = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

const TopFooterContainer = styled.div`
  position: relative;
  overflow: hidden;

  /* Rich layered gradient background */
  background: radial-gradient(
      ellipse at 10% 90%,
      rgba(74, 139, 141, 0.15) 0%,
      transparent 50%
    ),
    radial-gradient(
      ellipse at 90% 10%,
      rgba(150, 219, 230, 0.2) 0%,
      transparent 50%
    ),
    linear-gradient(
      135deg,
      #a5d8e6 0%,
      #b8e4ee 25%,
      #c5ebf3 50%,
      #b8e4ee 75%,
      #a5d8e6 100%
    );
  background-size: 200% 200%;
  animation: ${gradientShift} 20s ease infinite;
  padding: 50px 80px;
  text-align: center;

  /* Glassmorphism top accent line */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.6) 20%,
      rgba(255, 255, 255, 0.8) 50%,
      rgba(255, 255, 255, 0.6) 80%,
      transparent 100%
    );
  }

  /* Decorative geometric shape */
  &::after {
    content: '';
    position: absolute;
    bottom: -100px;
    right: -100px;
    width: 300px;
    height: 300px;
    background: radial-gradient(
      circle,
      rgba(255, 255, 255, 0.15) 0%,
      transparent 60%
    );
    pointer-events: none;
  }

  @media (max-width: 375px) {
    padding: 40px 20px;
  }

  @media (max-width: 800px) {
    padding: 40px 30px;
  }
`;

const BottomFooterContainer = styled.div`
  position: relative;

  /* Richer gradient with depth */
  background: linear-gradient(
    180deg,
    rgba(142, 212, 230, 0.9) 0%,
    #8ed4e6 30%,
    #7dccd8 70%,
    rgba(109, 192, 206, 0.95) 100%
  );
  padding: 24px 80px;
  text-align: center;

  /* Subtle shine line at top */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.4) 30%,
      rgba(255, 255, 255, 0.5) 50%,
      rgba(255, 255, 255, 0.4) 70%,
      transparent 100%
    );
  }

  @media (max-width: 375px) {
    padding: 20px 20px;
  }

  @media (max-width: 800px) {
    padding: 20px 30px;
  }
`;

const Copyright = styled.div`
  color: #5a7a8a;
  user-select: none;
  font-size: 0.9rem;
`;

const Donate = styled.a`
  color: #5a7a8a;
  transition: color 0.3s ease;

  &:hover {
    color: #3d5a6a;
  }
`;

const BrandImageWrapper = styled.div`
  width: 100%;
  max-width: 300px;

  & > span > img {
    width: 100%;
  }
`;

const LogoImageWrapper = styled.div`
  width: 100px;
  padding-bottom: 10px;

  @media (max-width: 768px) {
    display: none;
  }

  & > span > img {
    width: 100px;
  }
`;

// Animated social icon
const SocialIcon = styled.a`
  color: #4a8b8d;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  padding: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);

  &:hover {
    color: #3d7374;
    transform: translateY(-3px) scale(1.1);
    background: rgba(255, 255, 255, 0.6);
    box-shadow: 0 8px 25px rgba(74, 139, 141, 0.25);
  }

  .anticon {
    font-size: 32px !important;
  }
`;

const TopRow = styled(Row)`
  padding: 10px 0;
  justify-content: space-between;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 20px;
  }
`;

const BottomRow = styled(Row)`
  justify-content: center;

  @media (min-width: 497px) {
    justify-content: space-between;
  }
`;

const CopyRightCol = styled(Col)`
  @media (max-width: 496px) {
    margin-bottom: 10px;
  }
`;

/**
 * Footer component
 * @constructor Footer - React Function Component
 */
const Footer: React.FC = () => {
  const { t } = useTranslation();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer>
      <TopFooterContainer>
        <TopRow align='middle'>
          <Col>
            <Link to='/' onClick={() => setTimeout(scrollToTop, 500)}>
              <Row align='middle'>
                <Col>
                  <LogoImageWrapper>
                    <LazyLoadImage
                      src={logo}
                      alt='CTEC'
                      effect='blur'
                      wrapperClassName='lazy-load-image-wrapper'
                    />
                  </LogoImageWrapper>
                </Col>
                <Col>
                  <BrandImageWrapper>
                    <LazyLoadImage
                      src={CTEC_banner}
                      alt='CTEC'
                      effect='blur'
                      wrapperClassName='lazy-load-image-wrapper'
                    />
                  </BrandImageWrapper>
                </Col>
              </Row>
            </Link>
          </Col>
          <Col>
            <Space size='large'>
              <SocialIcon
                href={serverLink.discord}
                target='_blank'
                rel='noopener noreferrer'
              >
                <DiscordOutlined />
              </SocialIcon>
              <SocialIcon
                href={serverLink.youtube}
                target='_blank'
                rel='noopener noreferrer'
              >
                <YoutubeOutlined />
              </SocialIcon>
              <SocialIcon
                href={serverLink.x}
                target='_blank'
                rel='noopener noreferrer'
              >
                <XOutlined />
              </SocialIcon>
            </Space>
          </Col>
        </TopRow>
      </TopFooterContainer>
      <BottomFooterContainer>
        <BottomRow align='middle'>
          <CopyRightCol>
            <Copyright>
              © {new Date().getFullYear()} Cloud Town Exquisite Craft. All
              Rights Reserved.
            </Copyright>
          </CopyRightCol>
          <Col>
            <Donate
              href={t('footer.donate.link')}
              target='_blank'
              rel='noopener noreferrer'
            >
              {t('footer.donate.description')}
            </Donate>
          </Col>
        </BottomRow>
      </BottomFooterContainer>
    </footer>
  );
};

export default Footer;
