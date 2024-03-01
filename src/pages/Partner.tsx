import { Row } from 'antd';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import PageHeader from '#/common/PageHeader.tsx';
import HeaderImage from '#/common/HeaderImage.tsx';
import PartnerCard from '#/partner/PartnerCard.tsx';
import PartnerTeam from '#/partner/data/PartnerTeam.tsx';
import Partnership from '#/partner/data/Partnership.tsx';
import LongtimePartnership from '#/partner/data/LongtimePartnership.tsx';

import { IPartnership } from '@/types/IPartnership.ts';
import partner from '@/assets/partner/partner.webp';

const PartnershipTitle = styled.h1`
  text-align: center;
  background: #b1dde6;
  font-weight: bolder;
  box-shadow: 0 0 0 20px #b1dde6;
  margin: 20px;
`;

const Container = styled.div`
  padding: 50px 60px;
  background-color: #b1dde6;

  @media (max-width: 400px) {
    padding: 50px 10px;
  }
`;

const Partner = () => {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader
        backgroundComponent={<HeaderImage imageUrl={partner} />}
        headerTextArray={[t('menu.partner')]}
      />
      <Container>
        <PartnershipTitle>{t('partnerTeam.title')}</PartnershipTitle>
        <Row justify="center">
          {PartnerTeam.map((partnerData: IPartnership) => (
            <PartnerCard
              key={partnerData.Partner}
              Partner={partnerData.Partner}
              Image={partnerData.Image}
              ModalTitle={partnerData.ModalTitle}
              LongPartnership={partnerData.LongPartnership}
              Introduce={partnerData.Introduce}
              ShowVideo={partnerData.ShowVideo}
              Link={partnerData.Link}
            />
          ))}
        </Row>
        <PartnershipTitle>{t('partner.longtime')}</PartnershipTitle>
        <Row justify="center">
          {LongtimePartnership.map((partnerData: IPartnership) => (
            <PartnerCard
              key={partnerData.Partner}
              Partner={partnerData.Partner}
              Image={partnerData.Image}
              ModalTitle={partnerData.ModalTitle}
              LongPartnership={partnerData.LongPartnership}
              Introduce={partnerData.Introduce}
              ShowVideo={partnerData.ShowVideo}
              Link={partnerData.Link}
            />
          ))}
        </Row>
        <PartnershipTitle>{t('partner.title')}</PartnershipTitle>
        <Row justify="center">
          {Partnership.map((partnerData: IPartnership) => (
            <PartnerCard
              key={partnerData.Partner}
              Partner={partnerData.Partner}
              Image={partnerData.Image}
              ModalTitle={partnerData.ModalTitle}
              LongPartnership={partnerData.LongPartnership}
              Introduce={partnerData.Introduce}
              ShowVideo={partnerData.ShowVideo}
              Link={partnerData.Link}
            />
          ))}
        </Row>
      </Container>
    </>
  );
};

export default Partner;
