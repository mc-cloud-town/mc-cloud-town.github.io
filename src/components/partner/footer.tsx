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

const FooterCard = ({ link }: { link: ILink | undefined }) => {
  return (
    <>
      <Space size="large">
        {link?.youtube && (
          <a href={link?.youtube} target="_blank" rel="noopener noreferrer">
            <YoutubeOutlined style={{ fontSize: '50px' }} />
          </a>
        )}
        {link?.discord && (
          <a href={link?.discord} target="_blank" rel="noopener noreferrer">
            <DiscordOutlined style={{ fontSize: '50px' }} />
          </a>
        )}
        {link?.bilibili && (
          <a href={link?.bilibili} target="_blank" rel="noopener noreferrer">
            <BilibiliOutlined style={{ fontSize: '50px' }} />
          </a>
        )}
        {link?.facebook && (
          <a href={link?.facebook} target="_blank" rel="noopener noreferrer">
            <FacebookOutlined style={{ fontSize: '50px' }} />
          </a>
        )}
        {link?.X && (
          <a href={link?.X} target="_blank" rel="noopener noreferrer">
            <XOutlined style={{ fontSize: '50px' }} />
          </a>
        )}
        {link?.other && (
          <a href={link?.other} target="_blank" rel="noopener noreferrer">
            <LinkOutlined style={{ fontSize: '50px' }} />
          </a>
        )}
      </Space>
    </>
  );
};

export default FooterCard;
