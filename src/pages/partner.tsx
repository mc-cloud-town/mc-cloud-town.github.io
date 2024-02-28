import partner from '@/assets/partner/partner.webp';
import PageHeader from '#/common/PageHeader.tsx';
import HeaderImage from '#/common/HeaderImage.tsx';
import { useTranslation } from 'react-i18next';
import PartnerCard from '#/partner/partnerCard.tsx';
import { Row } from 'antd';
import styled from 'styled-components';
import { IPartnership } from '@/types/IPartnership.ts';

const StyleRow = styled(Row)`
  background: #b1dde6;
`;

const Partnership: IPartnership[] = [
  {
    Partner: '阿睿',
    Image: 'partner/阿睿.jpg',
    ImageTitle: 'test',
    ModalTitle: '阿睿',
    Introduce: '',
    ModalFooter: '',
    ShowVideo: '',
    Link: {
      discord: 'test',
    },
  },
  {
    Partner: '阿睿',
    Image: 'partner/阿睿.jpg',
    ImageTitle: '阿睿',
    ModalTitle: '阿睿',
    Introduce: '',
    ModalFooter: '',
    ShowVideo: '',
    Link: {
      discord: 'test',
    },
  },
  {
    Partner: '阿睿',
    Image: 'partner/阿睿.jpg',
    ImageTitle: '阿睿',
    ModalTitle: '阿睿',
    Introduce: '',
    ModalFooter: '',
    ShowVideo: '',
    Link: {
      discord: 'test',
    },
  },
  {
    Partner: '阿睿',
    Image: 'partner/阿睿.jpg',
    ImageTitle: '阿睿',
    ModalTitle: '阿睿',
    Introduce: '',
    ModalFooter: '',
    ShowVideo: '',
    Link: {
      discord: 'test',
    },
  },
];
const Partner = () => {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader
        backgroundComponent={<HeaderImage imageUrl={partner} />}
        headerTextArray={[t('partner.title')]}
      />
      <StyleRow justify="center" gutter={[16, 0]}>
        {Partnership.map((repo: IPartnership) => (
          <PartnerCard
            Partner={repo.Partner}
            Image={repo.Image}
            ImageTitle={repo.ImageTitle}
            ModalTitle={repo.ModalTitle}
            Introduce={repo.Introduce}
            ModalFooter={repo.ModalFooter}
            ShowVideo={repo.ShowVideo}
            Link={repo.Link}
          />
        ))}
      </StyleRow>
    </>
  );
};

export default Partner;
