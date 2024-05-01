import { Row } from 'antd';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import PageHeader from '#/common/PageHeader.tsx';
import HeaderImage from '#/common/HeaderImage.tsx';
import PartnerCard from '#/partner/PartnerCard.tsx';
import Contact from '#/partner/Contact.tsx';

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

const PartnerBlock = styled.div`
  margin-bottom: 70px;

  &:last-child {
    margin-bottom: 20px;
  }
`;

type PartnerType = 'team' | 'longtime' | 'creator';

const Partner = () => {
  const { t } = useTranslation();

  return (
    <>
      <PageHeader
        backgroundComponent={<HeaderImage imageUrl={partner} />}
        maskColor={'#b1dde6'}
        headerTextArray={[t('partner.title')]}
      />
      <Container>
        {(['team', 'longtime', 'creator'] as PartnerType[]).map((type) => (
          <PartnerBlock key={type}>
            <PartnershipTitle>{t(`partner.${type}.title`)}</PartnershipTitle>
            <Row justify='center'>
              {(
                t(`partner.${type}.partners`, {
                  returnObjects: true,
                }) as IPartnership[]
              ).map((partnerData: IPartnership) => (
                <PartnerCard key={partnerData.Partner} {...partnerData} />
              ))}
            </Row>
          </PartnerBlock>
        ))}
      </Container>
      <Contact contactInfo={t('partner.contact', { returnObjects: true })} />
    </>
  );
};

export default Partner;
