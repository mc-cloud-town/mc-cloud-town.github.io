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
    <Flex wrap="wrap" gap="middle" justify="end">
      {partnerLink &&
        Object.entries(partnerLink).map(([key, link]) => {
          const safeKey = key as IconKey;
          const IconComponent = icons[safeKey] || LinkOutlined;
          return (
            <a key={key} href={link} target="_blank" rel="noopener noreferrer">
              <IconComponent style={{ fontSize: '24px' }} />
            </a>
          );
        })}
    </Flex>
  );
};

export default PartnerLink;
