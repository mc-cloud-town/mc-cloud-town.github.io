import { Row } from 'antd';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import PageHeader from '#/common/PageHeader.tsx';
import HeaderImage from '#/common/HeaderImage.tsx';
import PartnerCard from '#/partner/PartnerCard.tsx';
import Contact from '#/partner/Contact.tsx';

import { IPartnership } from '@/types/IPartnership.ts';
import partner from '@/assets/partner/partner.webp';
import { STATIC_DATA_API } from '@/constants';
import useApi from '@/hooks/useApi.ts';
import { StatusShowingGroup } from '#/common/StatusShowingGroup.tsx';

const PartnershipTitle = styled.h1`
  text-align: center;
  color: var(--text-primary);
  font-weight: 700;
  font-size: 2rem;
  margin: 20px;
  padding: 12px 24px;
  background: var(--color-primary-light);
  border-radius: var(--radius-lg);
  box-shadow: none;
`;

const Container = styled.div`
  padding: 50px 60px;
  background: var(--bg-secondary);

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

type PartnerData = {
  [key in PartnerType]: IPartnership[];
};

const Partner = () => {
  const { t, i18n } = useTranslation();
  const { data: partnerTeams } = useApi<IPartnership[]>(
    `${STATIC_DATA_API}/${i18n.language}/partnerTeams.json`,
  );
  const { data: partnerLongTerm } = useApi<IPartnership[]>(
    `${STATIC_DATA_API}/${i18n.language}/partnerLongTerm.json`,
  );
  const { data: partnerCreators } = useApi<IPartnership[]>(
    `${STATIC_DATA_API}/${i18n.language}/partnerCreators.json`,
  );

  if (!partnerTeams || !partnerLongTerm || !partnerCreators) {
    return (
      <>
        <PageHeader
          backgroundComponent={<HeaderImage imageUrl={partner} />}
          maskColor={'var(--bg-secondary)'}
          headerTextArray={[t('partner.title')]}
        />{' '}
        <Container>
          <StatusShowingGroup loading={true} error={null} />
        </Container>
      </>
    );
  }

  const partnerData: PartnerData = {
    team: partnerTeams,
    longtime: partnerLongTerm,
    creator: partnerCreators,
  };

  return (
    <>
      <PageHeader
        backgroundComponent={<HeaderImage imageUrl={partner} />}
        maskColor={'var(--bg-secondary)'}
        headerTextArray={[t('partner.title')]}
      />
      <Container>
        {Object.keys(partnerData).map((type) => (
          <PartnerBlock key={type}>
            <PartnershipTitle>{t(`partner.${type}.title`)}</PartnershipTitle>
            <Row justify='center'>
              {partnerData[type as PartnerType].map(
                (partnerData: IPartnership) => (
                  <PartnerCard key={partnerData.Partner} {...partnerData} />
                ),
              )}
            </Row>
          </PartnerBlock>
        ))}
      </Container>
      <Contact contactInfo={t('partner.contact', { returnObjects: true })} />
    </>
  );
};

export default Partner;
