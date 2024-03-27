import React from 'react';
import { Row, Col, Space } from 'antd';
import { DiscordOutlined, YoutubeOutlined, XOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { LazyLoadImage } from 'react-lazy-load-image-component';

import { serverLink } from '@/constants';
import CTEC_banner from '@/assets/brand/brand.webp';
import logo from '@/assets/logo/base.webp';
import { useTranslation } from 'react-i18next';

const TopFooterContainer = styled.div`
  background-color: #b1dde6;
  padding: 20px 60px;
  text-align: center;

  @media (max-width: 375px) {
    padding: 20px 20px;
  }

  @media (max-width: 800px) {
    padding: 20px 40px;
  }
`;

const BottomFooterContainer = styled(TopFooterContainer)`
  background-color: #96dbe6;
`;

const Copyright = styled.div`
  color: #999;
  user-select: none;
`;

const Donate = styled.a`
  color: #999;
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

const TopRow = styled(Row)`
  padding: 10px 0;
  justify-content: space-between;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const BottomRow = styled(Row)`
  background: #96dbe6;
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
        <TopRow align="middle">
          <Col>
            <Link to="/" onClick={() => setTimeout(scrollToTop, 500)}>
              <Row align="middle">
                <Col>
                  <LogoImageWrapper>
                    <LazyLoadImage
                      src={logo}
                      alt="CTEC"
                      effect="blur"
                      wrapperClassName="lazy-load-image-wrapper"
                    />
                  </LogoImageWrapper>
                </Col>
                <Col>
                  <BrandImageWrapper>
                    <LazyLoadImage
                      src={CTEC_banner}
                      alt="CTEC"
                      effect="blur"
                      wrapperClassName="lazy-load-image-wrapper"
                    />
                  </BrandImageWrapper>
                </Col>
              </Row>
            </Link>
          </Col>
          <Col>
            <Space size="large">
              <a
                href={serverLink.discord}
                target="_blank"
                rel="noopener noreferrer"
              >
                <DiscordOutlined style={{ fontSize: '50px' }} />
              </a>
              <a
                href={serverLink.youtube}
                target="_blank"
                rel="noopener noreferrer"
              >
                <YoutubeOutlined style={{ fontSize: '50px' }} />
              </a>
              <a href={serverLink.x} target="_blank" rel="noopener noreferrer">
                <XOutlined style={{ fontSize: '50px' }} />
              </a>
            </Space>
          </Col>
        </TopRow>
      </TopFooterContainer>
      <BottomFooterContainer>
        <BottomRow align="middle">
          <CopyRightCol>
            <Copyright>
              © {new Date().getFullYear()} Cloud Town Exquisite Craft. All
              Rights Reserved.
            </Copyright>
          </CopyRightCol>
          <Col>
            <Donate href={t('footer.donate.link')} target="_blank" rel="noopener noreferrer">
              {t('footer.donate.description')}
            </Donate>
          </Col>
        </BottomRow>
      </BottomFooterContainer>
    </footer>
  );
};

export default Footer;
