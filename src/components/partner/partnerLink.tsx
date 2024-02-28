import {
  BilibiliOutlined,
  DiscordOutlined,
  FacebookOutlined,
  LinkOutlined,
  XOutlined,
  YoutubeOutlined,
} from '@ant-design/icons';
import { Space } from 'antd';
import { ILink } from '@/types/IPartnership.ts';

const PartnerLink = ({ partnerLink }: { partnerLink: ILink | undefined }) => {
  return (
    <>
      <Space size="large">
        {partnerLink?.youtube && (
          <a
            href={partnerLink?.youtube}
            target="_blank"
            rel="noopener noreferrer"
          >
            <YoutubeOutlined style={{ fontSize: '50px' }} />
          </a>
        )}
        {partnerLink?.discord && (
          <a
            href={partnerLink?.discord}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DiscordOutlined style={{ fontSize: '50px' }} />
          </a>
        )}
        {partnerLink?.bilibili && (
          <a
            href={partnerLink?.bilibili}
            target="_blank"
            rel="noopener noreferrer"
          >
            <BilibiliOutlined style={{ fontSize: '50px' }} />
          </a>
        )}
        {partnerLink?.facebook && (
          <a
            href={partnerLink?.facebook}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FacebookOutlined style={{ fontSize: '50px' }} />
          </a>
        )}
        {partnerLink?.X && (
          <a href={partnerLink?.X} target="_blank" rel="noopener noreferrer">
            <XOutlined style={{ fontSize: '50px' }} />
          </a>
        )}
        {partnerLink?.other && (
          <a
            href={partnerLink?.other}
            target="_blank"
            rel="noopener noreferrer"
          >
            <LinkOutlined style={{ fontSize: '50px' }} />
          </a>
        )}
      </Space>
    </>
  );
};

export default PartnerLink;
