import partner from '@/assets/partner/partner.webp';
import PageHeader from '#/common/PageHeader.tsx';
import HeaderImage from '#/common/HeaderImage.tsx';
import { useTranslation } from 'react-i18next';
import PartnerCard from '#/partner/partnerCard.tsx';
import { Row } from 'antd';
import styled from 'styled-components';
import { IPartnership } from '@/types/IPartnership.ts';

const PartnerTeam: IPartnership[] = [
  {
    Partner: '鬼鯨伺服器',
    Image: 'partner/鬼鯨伺服器.jpg',
    ModalTitle: 'GhostWhaleServer【鬼鯨伺服器】',
    LongPartnership: false,
    Introduce: [
      '我們是華語圈的建築伺服器—鬼鯨，',
      '一個因為對建築愛不釋手所以聚在一起的一群人。',
      '我們的目標是創作許多值得觀賞、使人沉浸的作品，',
      '將建築的美與建築師們的用心一併分享給所有人。',
      '我們更希望給所有建築師提供一個好的環境交流分享，',
      '若你想看更多我們的新作，或是想交流建築技巧、建築風格，',
      '歡迎來我們的社群、Discord 上看看！',
    ],
    ShowVideo: 'https://www.youtube.com/embed/KCmrEJYBGec?si=S7eoTvLw8KWHNBqt',
    Link: {
      discord: 'https://discord.gg/QY24s8DVx3',
      youtube: 'https://www.youtube.com/@ghostwhaleserver',
      other: 'https://www.ghostwhalestudio.com/',
      facebook: 'https://www.facebook.com/GhostWhaleStudio',
      X: 'https://twitter.com/GWS_Building',
      Instagram: 'https://www.instagram.com/ghost.whale.server/',
    },
  },
  {
    Partner: '阿爾薩斯工業 建築團隊',
    Image: 'partner/阿爾薩斯工業.avif',
    ModalTitle: '阿爾薩斯工業 建築團隊',
    LongPartnership: false,
    Introduce:
      '我们是一支成立于2020年的理想主义Minecraft团队，秉承自由、平等、团结的价值观，以卓越的团队氛围而自豪。在我们的世界里，创造和想象力没有边界，而我们的建筑技术则是国内前列，凭借着完整的建筑流程链，我们已经汇聚了150余名才华横溢的团队成员，每个人都为实现我们的梦想而努力奋斗。',
    ShowVideo: 'https://www.youtube.com/embed/CleVu1WICss?si=4ifRtrLFkBoPvbe7',
    Link: {
      other: 'https://www.alsace.team/',
      youtube: 'https://www.youtube.com/@alsaceteam',
      bilibili: 'https://space.bilibili.com/47983516',
      QQ: 'http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=Or0lLwYEHFzY_D7hZUoHKp4ANjrGdfuX&authKey=Yzlq2b8X8N%2BsyelDeDHs7Rym8Fl85Pzxn7rE8tVXdjhZIUsBql9ZVuGdwfZ1cKmE&noverify=0&group_code=916435182',
      discord: 'https://discord.gg/q2wTpqjPvp',
      X: 'https://twitter.com/Alsaceteam',
    },
  },
];

const LongtimePartnership: IPartnership[] = [
  {
    Partner: '阿睿',
    Image: 'partner/阿睿.jpg',
    ModalTitle: '阿睿',
    LongPartnership: true,
    Introduce: [
      '以肝為特色的懶惰YouTuber',
      '哈囉大家好我是阿睿!',
      '頻道主要會以Minecraft以及其他遊戲實況為主，有興趣的話可以看看喔!',
      '想看生存的話，可以看看LATCraft系列，系列以生存建築為主!',
      '想看Minecraft跑酷的話，我也有音樂跑酷的系列~',
      '再次感謝觀看我的頻道喔~',
    ],
    ShowVideo: 'https://www.youtube.com/embed/EP0Sh7wGL4o?si=5pGgB02j0Z__8K8Q',
    Link: {
      youtube: 'https://www.youtube.com/@LO5BenH',
      facebook: 'https://www.facebook.com/benhslittleminecraftworld',
    },
  },
  {
    Partner: '碗碗',
    Image: 'partner/碗碗.jpg',
    ModalTitle: '碗碗',
    LongPartnership: true,
    Introduce: [
      '大家好我是碗碗！',
      '目前擔任好可愛bot',
      '生存為主，內容大部分是建築',
      '那麼祝大家觀賞愉快～',
    ],
    ShowVideo: 'https://www.youtube.com/embed/fiiIWSAdFiw?si=-2RUZZoosd1apj0k',
    Link: {
      Instagram: 'https://www.instagram.com/bowlsaa/',
      discord: 'https://discord.gg/wkZ6rmuXQe',
      twitch: 'https://www.twitch.tv/bowlsaa',
      youtube: 'https://www.youtube.com/@bowlsaa',
    },
  },
];

const Partnership: IPartnership[] = [
  {
    Partner: '小柯',
    Image: 'partner/小柯.jpg',
    ModalTitle: '小柯',
    LongPartnership: false,
    Introduce: [
      '大家好，我是小柯！',
      '歡迎來到我的頻道，我的頻道的風格是日本和國外混搭，參考了不少日本和英文實況主！',
    ],
    ShowVideo: 'https://www.youtube.com/embed/iBk0VpiBFis?si=yQ12ZcqaPIYOj3CN',
    Link: {
      X: 'https://twitter.com/tomh0206',
      facebook: 'https://www.facebook.com/Tomhot235',
      youtube: 'https://www.youtube.com/@TomH',
    },
  },
  {
    Partner: '脏小豆',
    Image: 'partner/脏小豆.avif',
    ModalTitle: '脏小豆',
    LongPartnership: false,
    Introduce: '哈嘍我是臟小豆，壹位來自石家莊的大鴿子！',
    ShowVideo: 'https://www.youtube.com/embed/FalaBcZ9PQo?si=r1CstPPfH28PnJe4',
    Link: {
      youtube: 'https://www.youtube.com/@zxdnb',
      bilibili: 'https://space.bilibili.com/5836069',
      weibo: 'https://weibo.com/zangxiaodou',
    },
  },
  {
    Partner: '老宸',
    Image: 'partner/老宸.jpg',
    ModalTitle: '老宸',
    LongPartnership: false,
    Introduce: [
      '大家好，我是老宸，一個愛玩遊戲的小玩家，',
      '愛玩各種類的遊戲，希望能跟大家同樂，一起去遊戲裡的世界冒險吧!!!',
    ],
    ShowVideo: 'https://www.youtube.com/embed/OhdMahPMqF4?si=U8aGKfLTk6G3Rh_f',
    Link: {
      youtube: 'https://www.youtube.com/@laochen4869',
      discord: 'https://discord.gg/mNBvvszGk4',
      twitch: 'https://www.twitch.tv/laochen4869',
      X: 'https://twitter.com/laochen4869',
      facebook: 'https://www.facebook.com/profile.php?id=100065710484014',
    },
  },
  {
    Partner: '酒鬼',
    Image: 'partner/酒鬼.jpg',
    ModalTitle: '酒鬼',
    LongPartnership: false,
    Introduce: [
      '這個頻道基本每天更新麥塊影片',
      '有可能是有趣的小短片',
      '或是我平時玩的原味生存挑戰',
      '製作影片花費大量時間',
      '我會努力越做越好的!',
      '如果喜歡幫我按個訂閱吧',
      '感謝大家~',
    ],
    ShowVideo: 'https://www.youtube.com/embed/2sfUTtM70Yc?si=qD4DlXcA2cGohOXa',
    Link: {
      youtube: 'www.youtube.com/@user-lw1zc1dh1w',
    },
  },
  {
    Partner: '82年的海尼根',
    Image: 'partner/82年的海尼根.jpg',
    ModalTitle: '82年的海尼根',
    LongPartnership: false,
    Introduce: [
      '大家早我是海尼根🍻',
      '是個因為爽所以發片的實況主',
      '主要都在玩Minecraft',
      '有時候會發點翻唱影片',
    ],
    ShowVideo: 'https://www.youtube.com/embed/xf8qQX5oJyM?si=aj5P-4pJ9PZ-5fca',
    Link: {
      other: 'https://82heineken.carrd.co/',
      youtube: 'https://www.youtube.com/channel/UCSgM6kw9-o8jaX2yP6y6E6g',
      X: 'https://twitter.com/heineken9487/media',
      Instagram: 'https://www.instagram.com/hEINEKEN9487/',
      facebook: 'https://www.facebook.com/heineken5487/',
      twitch: 'https://www.twitch.tv/heinekenouo',
      discord: 'https://discord.gg/yYRvGPs',
    },
  },
  {
    Partner: 'Reshar Ch.蝦蝦桑【FourZ live所屬】',
    Image: 'partner/Reshar Ch.蝦蝦桑【FourZ live所屬】.jpg',
    ModalTitle: 'Reshar Ch.蝦蝦桑【FourZ live所屬】',
    LongPartnership: false,
    Introduce: [
      '大家好!我是台灣社團勢Vtuber蝦蝦桑!',
      'FourZ一期生',
      '原本是個正常的youtuber，某天因不明原因變成了一隻蝦子。',
      '一年後，蝦蝦遇到了一位奇怪的漁夫，漁夫給了蝦蝦一條十字架項鍊，只要戴上這個項鍊就可以變回人類。',
      '目前佛系更新+開台',
    ],
    ShowVideo: 'https://www.youtube.com/embed/4cvWd3zY8R8?si=GLoLY2YhuqSqtbMU',
    Link: {
      youtube: 'https://www.youtube.com/@reshar',
      other: 'https://streetvoice.com/reshar/',
      twitch: 'https://twitch.tv/resharis87',
      X: 'https://twitter.com/4Z_reshar',
      discord: 'https://discord.gg/J2xcHKnbyk',
      facebook: 'https://facebook.com/resharcomic/?ref=pages_you_manage',
    },
  },
  {
    Partner: '杯子蛋糕實驗室',
    Image: 'partner/杯子蛋糕實驗室.jpg',
    ModalTitle: '杯子蛋糕實驗室',
    LongPartnership: false,
    Introduce: '為什麼現實生活中這麼多電影才會出現的情節？',
    ShowVideo: 'https://www.youtube.com/embed/9W3QmzUZB8w?si=7txPXTR0PQuhavrR',
    Link: {
      youtube: 'https://www.youtube.com/@cupcake_exe',
      discord: 'https://discord.gg/6tcBKBF5Rj',
    },
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
