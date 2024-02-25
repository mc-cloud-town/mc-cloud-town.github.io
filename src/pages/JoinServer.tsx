import PageHeader from '#/common/PageHeader.tsx';
import HeaderImage from '#/common/HeaderImage.tsx';
import join from '@/assets/join/Join.png';
import { useTranslation } from 'react-i18next';
import HeaderTimer from '#/homePage/header/HeaderTimer.tsx';
import { Button } from 'antd';

const JoinServer = () => {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader
        backgroundComponent={<HeaderImage imageUrl={join} />}
        headerTextArray={[t('join.description')]}
        subHeaderContentArray={[
          <HeaderTimer />,
          <a href="https://discord.gg/H6uHghNq5Z" target="_blank">
            <Button color="primary" size="large" ghost={true}>
              {t('join.joinDiscord')}
            </Button>
          </a>,
          <a href="https://t.ly/syw2N" target="_blank">
            <Button color="primary" size="large" ghost={true}>
              {t('join.forms')}
            </Button>
          </a>,
        ]}
      />
    </>
  );
};

export default JoinServer;
