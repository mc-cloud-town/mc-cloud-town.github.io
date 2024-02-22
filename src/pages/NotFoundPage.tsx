import PageHeader from '#/common/PageHeader.tsx';
import { useTranslation } from 'react-i18next';
import { Button } from 'antd';
import { Link } from 'react-router-dom';

import HeaderImage from '#/common/HeaderImage.tsx';

import background from '@/assets/notFoundPage/background.jpg';

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
          <Link to="/home">
            <Button
              color="primary"
              size="large"
              ghost={true}
            >
              {t('notFound.backButton')}
            </Button>
          </Link>
        ]}
      />
    </>
  );
};

export default NotFoundPage;
