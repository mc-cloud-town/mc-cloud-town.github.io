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
    Partner: '這是測試頁面',
    Image: 'logo/base.webp',
    ModalTitle: '這是測試頁面',
    LongPartnership: true,
    Introduce: '',
    ShowVideo: 'https://www.youtube.com/embed/-djkWpp5SaU?si=uhey0MTDQxNY06Cb',
    Link: {
      youtube: 'partner',
      discord: 'partner',
      twitch: 'partner',
      tiktok: 'partner',
      bilibili: 'partner',
      facebook: 'partner',
      telegram: 'partner',
      weibo: 'partner',
      X: 'partner',
      QQ: 'partner',
      other: 'partner',
    },
  },
  {
    Partner: '阿睿',
    Image: 'partner/阿睿.jpg',
    ModalTitle: '阿睿',
    LongPartnership: true,
    Introduce: '',
    ShowVideo: 'https://www.youtube.com/embed/EP0Sh7wGL4o?si=5pGgB02j0Z__8K8Q',
    Link: {},
  },
  {
    Partner: '碗碗',
    Image: 'partner/碗碗.jpg',
    ModalTitle: '碗碗',
    LongPartnership: true,
    Introduce: '',
    ShowVideo: 'https://www.youtube.com/embed/fiiIWSAdFiw?si=-2RUZZoosd1apj0k',
    Link: {},
  },
  {
    Partner: '老宸',
    Image: 'partner/老宸.jpg',
    ModalTitle: '老宸',
    LongPartnership: false,
    Introduce: '',
    ShowVideo: 'https://www.youtube.com/embed/OhdMahPMqF4?si=U8aGKfLTk6G3Rh_f',
    Link: {},
  },
  {
    Partner: '酒鬼',
    Image: 'partner/酒鬼.jpg',
    ModalTitle: '酒鬼',
    LongPartnership: false,
    Introduce: [],
    ShowVideo: 'https://www.youtube.com/embed/2sfUTtM70Yc?si=qD4DlXcA2cGohOXa',
    Link: {},
  },
  {
    Partner: '82年的海尼根',
    Image: 'partner/82年的海尼根.jpg',
    ModalTitle: '82年的海尼根',
    LongPartnership: false,
    Introduce: '',
    ShowVideo: 'https://www.youtube.com/embed/xf8qQX5oJyM?si=aj5P-4pJ9PZ-5fca',
    Link: {},
  },
  {
    Partner: 'Reshar Ch.蝦蝦桑【FourZ live所屬】',
    Image: 'partner/Reshar Ch.蝦蝦桑【FourZ live所屬】.jpg',
    ModalTitle: 'Reshar Ch.蝦蝦桑【FourZ live所屬】',
    LongPartnership: false,
    Introduce: '',
    ShowVideo: 'https://www.youtube.com/embed/4cvWd3zY8R8?si=GLoLY2YhuqSqtbMU',
    Link: {},
  },
  {
    Partner: '杯子蛋糕實驗室',
    Image: 'partner/杯子蛋糕實驗室.jpg',
    ModalTitle: '杯子蛋糕實驗室',
    LongPartnership: false,
    Introduce: '',
    ShowVideo: 'https://www.youtube.com/embed/9W3QmzUZB8w?si=7txPXTR0PQuhavrR',
    Link: {},
  },
];

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
        headerTextArray={[t('menu.partner.title')]}
      />
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
