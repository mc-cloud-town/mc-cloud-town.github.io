import { Row, Col, Space } from 'antd';
import { DiscordOutlined, YoutubeOutlined, XOutlined } from '@ant-design/icons';
import styled from 'styled-components';

import { serverLink } from '@/constants';
import CTEC_banner from '@/assets/brand/CTEC_banner.png';
import logo from '@/assets/logo/base.png';

const TopFooterContainer = styled.div`
  background-color: #b1dde6;
  padding: 20px 50px;
  text-align: center;
`;

const BottomFooterContainer = styled(TopFooterContainer)`
  background-color: #96dbe6;
`;

const Copyright = styled.div`
  color: #999;
`;

const BrandImage = styled.img`
  width: 300px;
  
  @media (max-width: 480px) {
    width: 250px;
  }
`;

const LogoImage = styled.img`
  width: 100px;
  padding-bottom: 10px;
  
  @media (max-width: 768px) {
    display: none;
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
`;

const Footer = () => {
  return (
    <footer>
      <TopFooterContainer>
        <TopRow align="middle">
          <Col>
            <LogoImage src={logo} alt="CTEC" />
            <BrandImage src={CTEC_banner} alt="CTEC" />
          </Col>
          <Col>
            <Space size="large">
              <a href={serverLink.discord} target="_blank" rel="noopener noreferrer">
                <DiscordOutlined style={{ fontSize: '50px' }} />
              </a>
              <a href={serverLink.youtube} target="_blank" rel="noopener noreferrer">
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
        <BottomRow justify="center">
          <Col>
            <Copyright>
              © {new Date().getFullYear()} Cloud Town Exquisite Craft. All Rights Reserved.
            </Copyright>
          </Col>
        </BottomRow>
      </BottomFooterContainer>
    </footer>
  );
};

export default Footer;
