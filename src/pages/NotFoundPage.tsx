import PageHeader from '#/common/PageHeader.tsx';
import { useTranslation } from 'react-i18next';

import HeaderImage from '#/common/HeaderImage.tsx';

import background from '@/assets/notFoundPage/background.jpg';
import { Button } from 'antd';

const NotFoundPage = () => {
  const { t } = useTranslation();

  return (
    <>
      <PageHeader
        backgroundComponent={<HeaderImage imageUrl={background} />}
        headerTextArray={[
          t('notFound.title')
        ]}
        subHeaderContentArray={[
          t('notFound.description'),
          <Button
            color="primary"
            size="large"
            ghost={true}
            href="/home"
          >
            {t('notFound.backButton')}
          </Button>,
        ]}
      />
    </>
  );
};

export default NotFoundPage;
