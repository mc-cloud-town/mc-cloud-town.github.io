import { Button } from 'antd';
import styled from 'styled-components';
import CTEC_Sort_7 from '@/assets/homePage/CTEC_Sort_7.png';

const SectionContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #ecf0f1;
  padding: 50px 20px;
  @media (min-width: 768px) {
    flex-direction: row;
  }
`;

const ContentContainer = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  text-align: left;
`;

const TextButtonContainer = styled.div`
  max-width: 600px;
`;

const ImageContainer = styled.div`
  flex: 1;
  padding: 20px;
`;

const Image = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 10px;
  box-shadow: 0 0 10px 0 #000000;
`;

const Title = styled.h2`
  margin-bottom: 20px;
  font-weight: bolder;
`;

const SubTitle = styled.h3`
  margin-bottom: 20px;
  font-weight: bold;
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin-bottom: 20px;
`;

const FeatureItem = styled.li`
  margin-bottom: 10px;
  &:before {
    content: '•';
    margin-right: 10px;
    color: #6f9b9c;
  }
`;

const About = () => {
  return (
    <SectionContainer>
      <ImageContainer>
        <Image src={CTEC_Sort_7} alt="About Us" />
      </ImageContainer>
      <ContentContainer>
        <TextButtonContainer>
          <Title>Cloud Town Exquisite Craft</Title>
          <SubTitle>雲鎮工藝</SubTitle>
          <FeatureList>
            <FeatureItem>為目前亞洲頂尖生電技術伺服器之一</FeatureItem>
            <FeatureItem>活躍於Minecraft原版環境下的生電技術研究</FeatureItem>
            <FeatureItem>生存實踐、紅石科技、建築創作</FeatureItem>
            <FeatureItem>良好的創作環境與伺服器設備</FeatureItem>
            <FeatureItem>與各國優秀玩家共同研究交流</FeatureItem>
          </FeatureList>
          <Button type="primary">最新進度</Button>
        </TextButtonContainer>
      </ContentContainer>
    </SectionContainer>
  );
};

export default About;
