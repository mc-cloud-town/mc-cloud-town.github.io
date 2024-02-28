import partner from '@/assets/partner/partner.webp';
import PageHeader from '#/common/PageHeader.tsx';
import HeaderImage from '#/common/HeaderImage.tsx';
import { useTranslation } from 'react-i18next';
import PartnerCard from '#/partner/partnerCard.tsx';
import { Row } from 'antd';
import styled from 'styled-components';
import { IPartnership } from '@/types/IPartnership.ts';

const Partnership: IPartnership[] = [
  {
    Partner: '阿睿',
    Image: 'partner/阿睿.jpg',
    ImageTitle: 'test',
    ModalTitle: '阿睿',
    Introduce: '',
    ModalFooter: '',
    ShowVideo: 'https://www.youtube.com/embed/EP0Sh7wGL4o?si=5pGgB02j0Z__8K8Q',
    Link: {
      discord: 'test',
    },
  },
  {
    Partner: '碗碗',
    Image: 'partner/碗碗.jpg',
    ImageTitle: '碗碗',
    ModalTitle: '碗碗',
    Introduce: '',
    ModalFooter: '',
    ShowVideo: 'https://www.youtube.com/embed/fiiIWSAdFiw?si=-2RUZZoosd1apj0k',
    Link: {
      discord: 'test',
    },
  },
  {
    Partner: '老宸',
    Image: 'partner/老宸.jpg',
    ImageTitle: '老宸',
    ModalTitle: '老宸',
    Introduce: '',
    ModalFooter: '',
    ShowVideo: 'https://www.youtube.com/embed/OhdMahPMqF4?si=U8aGKfLTk6G3Rh_f',
    Link: {
      discord: 'test',
    },
  },
  {
    Partner: '酒鬼',
    Image: 'partner/酒鬼.jpg',
    ImageTitle: '酒鬼',
    ModalTitle: '酒鬼',
    Introduce: [],
    ModalFooter: '',
    ShowVideo: 'https://www.youtube.com/embed/2sfUTtM70Yc?si=qD4DlXcA2cGohOXa',
    Link: {
      discord: 'test',
    },
  },
  {
    Partner: '82年的海尼根',
    Image: 'partner/82年的海尼根.jpg',
    ImageTitle: '82年的海尼根',
    ModalTitle: '82年的海尼根',
    Introduce: '',
    ModalFooter: '',
    ShowVideo: 'https://www.youtube.com/embed/xf8qQX5oJyM?si=aj5P-4pJ9PZ-5fca',
    Link: {
      discord: 'test',
    },
  },
  {
    Partner: 'Reshar Ch.蝦蝦桑【FourZ live所屬】',
    Image: 'partner/Reshar Ch.蝦蝦桑【FourZ live所屬】.jpg',
    ImageTitle: 'Reshar Ch.蝦蝦桑【FourZ live所屬】',
    ModalTitle: 'Reshar Ch.蝦蝦桑【FourZ live所屬】',
    Introduce: '',
    ModalFooter: '',
    ShowVideo: 'https://www.youtube.com/embed/4cvWd3zY8R8?si=GLoLY2YhuqSqtbMU',
    Link: {
      discord: 'test',
    },
  },
  {
    Partner: '杯子蛋糕實驗室',
    Image: 'partner/杯子蛋糕實驗室.jpg',
    ImageTitle: '杯子蛋糕實驗室',
    ModalTitle: '杯子蛋糕實驗室',
    Introduce: '',
    ModalFooter: '',
    ShowVideo: 'https://www.youtube.com/embed/9W3QmzUZB8w?si=7txPXTR0PQuhavrR',
    Link: {
      discord: 'test',
    },
  },
];

const StyleRow = styled(Row)`
  background: #b1dde6;
`;
const Partner = () => {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader
        backgroundComponent={<HeaderImage imageUrl={partner} />}
        headerTextArray={[t('partner.title')]}
      />
      <StyleRow justify="center">
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
