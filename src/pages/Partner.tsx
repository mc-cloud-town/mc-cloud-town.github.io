import partner from '@/assets/partner/partner.webp';
import PageHeader from '#/common/PageHeader.tsx';
import HeaderImage from '#/common/HeaderImage.tsx';
import { useTranslation } from 'react-i18next';
import PartnerCard from '#/partner/partnerCard.tsx';
import { Row } from 'antd';
import styled from 'styled-components';
import { IPartnership } from '@/types/IPartnership.ts';
import PartnerTeam from '#/partner/data/PartnerTeam.tsx';
import Partnership from '#/partner/data/Partnership.tsx';
import LongtimePartnership from '#/partner/data/LongtimePartnership.tsx';

const PartnershipTitle = styled.h1`
  text-align: center;
  background: #b1dde6;
  box-shadow: 0 0 0 20px #b1dde6;
  margin: 20px;
`;

const StyleRow = styled(Row)`
  background: #b1dde6;
`;
const Partner = () => {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader
        backgroundComponent={<HeaderImage imageUrl={partner} />}
        headerTextArray={[t('menu.partner')]}
      />
      <PartnershipTitle>{t('partnerTeam.title')}</PartnershipTitle>
      <StyleRow justify="center">
        {PartnerTeam.map((partnerData: IPartnership) => (
          <PartnerCard
            Partner={partnerData.Partner}
            Image={partnerData.Image}
            ModalTitle={partnerData.ModalTitle}
            LongPartnership={partnerData.LongPartnership}
            Introduce={partnerData.Introduce}
            ShowVideo={partnerData.ShowVideo}
            Link={partnerData.Link}
          />
        ))}
      </StyleRow>
      <PartnershipTitle>{t('partner.longtime')}</PartnershipTitle>
      <StyleRow justify="center">
        {LongtimePartnership.map((partnerData: IPartnership) => (
          <PartnerCard
            Partner={partnerData.Partner}
            Image={partnerData.Image}
            ModalTitle={partnerData.ModalTitle}
            LongPartnership={partnerData.LongPartnership}
            Introduce={partnerData.Introduce}
            ShowVideo={partnerData.ShowVideo}
            Link={partnerData.Link}
          />
        ))}
      </StyleRow>
      <PartnershipTitle>{t('partner.title')}</PartnershipTitle>
      <StyleRow justify="center">
        {Partnership.map((partnerData: IPartnership) => (
          <PartnerCard
            Partner={partnerData.Partner}
            Image={partnerData.Image}
            ModalTitle={partnerData.ModalTitle}
            LongPartnership={partnerData.LongPartnership}
            Introduce={partnerData.Introduce}
            ShowVideo={partnerData.ShowVideo}
            Link={partnerData.Link}
          />
        ))}
      </StyleRow>
    </>
  );
};

export default Partner;
