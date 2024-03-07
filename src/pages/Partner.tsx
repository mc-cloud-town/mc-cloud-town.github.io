import { Row } from 'antd';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import PageHeader from '#/common/PageHeader.tsx';
import HeaderImage from '#/common/HeaderImage.tsx';
import PartnerCard from '#/partner/PartnerCard.tsx';

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

  const PartnerData: IPartnership[] = t('Collaborative.Partnership', {
    returnObjects: true,
  });

  const PartnerTeamData: IPartnership[] = t('Collaborative.PartnerServer', {
    returnObjects: true,
  });

  const LongTimePartnerData: IPartnership[] = t(
    'Collaborative.longTermPartner',
    {
      returnObjects: true,
    },
  );

  return (
    <>
      <PageHeader
        backgroundComponent={<HeaderImage imageUrl={partner} />}
        headerTextArray={[t('menu.partner')]}
      />
      <Container>
        <PartnershipTitle>{t('partnerTeam.title')}</PartnershipTitle>
        <Row justify="center">
          {PartnerTeamData.map((partnerData: IPartnership) => (
            <PartnerCard
              key={partnerData.Partner}
              {...partnerData}
            />
          ))}
        </Row>
        <PartnershipTitle>{t('partner.longtime')}</PartnershipTitle>
        <Row justify="center">
          {LongTimePartnerData.map((partnerData: IPartnership) => (
            <PartnerCard
              key={partnerData.Partner}
              {...partnerData}
            />
          ))}
        </Row>
        <PartnershipTitle>{t('partner.title')}</PartnershipTitle>
        <Row justify="center">
          {PartnerData.map((partnerData: IPartnership) => (
            <PartnerCard
              key={partnerData.Partner}
              {...partnerData}
            />
          ))}
        </Row>
      </Container>
    </>
  );
};

export default Partner;
