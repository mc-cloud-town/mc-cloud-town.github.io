import styled from 'styled-components';
import { MailOutlined, YoutubeOutlined, DiscordOutlined } from '@ant-design/icons';
import { Button, Flex } from 'antd';
import { LazyLoadImage } from 'react-lazy-load-image-component';

import getImageUrl from '@/utils/getImageUrl.ts';
import { IImageContent } from '@/types/IImageContent.ts';

const ContactSection = styled.div`
  text-align: center;
  padding: 50px 60px;
  background-color: #6f9b9c;
  color: white;
  
  @media (max-width: 400px) {
    padding: 50px 10px;
  }
`;

const ContactInfo = styled.h3`
  margin-bottom: 20px;
`;

const StyledButton = styled(Button)`
  margin: 0 10px;
`;

const ImageContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
`;

const BrandImageWrapper = styled.div`
  width: 100%;
  max-width: 250px;

  & > span > img {
    width: 100%;
  }
`;

const Contact = (
  {
    contactInfo
  }: {
    contactInfo: IImageContent;
  }) => {

  return (
    <ContactSection>
      <ImageContainer>
        <BrandImageWrapper>
          <LazyLoadImage
            src={getImageUrl(contactInfo.imageUrl)}
            alt="Brand Icon"
            effect="blur"
          />
        </BrandImageWrapper>
      </ImageContainer>
      <ContactInfo>{contactInfo.subTitle}</ContactInfo>
      <Flex justify="center" wrap="wrap" gap={10}>
        {
          contactInfo.buttons?.map((button, index) => {
            return (
              <StyledButton
                key={index}
                type="default"
                size="large"
                href={button.link}
                target={button.link?.startsWith('mailto') ? '' : '_blank'}
                ghost={true}
              >
                {
                  button.link?.startsWith('mailto') && <MailOutlined />
                }
                {
                  button.link?.startsWith('https://www.youtube.com') && <YoutubeOutlined />
                }
                {
                  button.link?.startsWith('https://discordapp.com/') && <DiscordOutlined />
                }
                {button.text}
              </StyledButton>
            );
          })
        }
      </Flex>
    </ContactSection>
  );
};

export default Contact;
