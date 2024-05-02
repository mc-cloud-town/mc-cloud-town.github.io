import {
  BilibiliOutlined,
  DiscordOutlined,
  FacebookOutlined,
  InstagramOutlined,
  LinkOutlined,
  QqOutlined,
  TikTokOutlined,
  TwitchOutlined,
  WeiboOutlined,
  XOutlined,
  YoutubeOutlined,
} from '@ant-design/icons';
import { Flex } from 'antd';
import { ILink } from '@/types/IPartnership.ts';
import stopVideo from '@/utils/stopVideo.ts';

type IconKey = keyof typeof icons;

const icons = {
  youtube: YoutubeOutlined,
  bilibili: BilibiliOutlined,
  twitch: TwitchOutlined,
  tiktok: TikTokOutlined,
  discord: DiscordOutlined,
  facebook: FacebookOutlined,
  instagram: InstagramOutlined,
  weibo: WeiboOutlined,
  x: XOutlined,
  qq: QqOutlined,
  other: LinkOutlined,
};

const PartnerLink = ({ partnerLink }: { partnerLink: ILink | undefined }) => {
  return (
    <Flex wrap='wrap' gap='middle' justify='end'>
      {Object.entries(icons).map(([key, IconComponent]) => {
        const link = partnerLink ? partnerLink[key as IconKey] : undefined;
        if (!link) return null;
        return (
          <a
            key={key}
            href={link}
            target='_blank'
            rel='noopener noreferrer'
            onClick={() => stopVideo()}
          >
            <IconComponent style={{ fontSize: '36px' }} />
          </a>
        );
      })}
    </Flex>
  );
};

export default PartnerLink;
