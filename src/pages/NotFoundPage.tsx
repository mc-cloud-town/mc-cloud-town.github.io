import { useTranslation } from 'react-i18next';
import { Button } from 'antd';
import { Link } from 'react-router-dom';

import PageHeader from '#/common/PageHeader.tsx';
import HeaderImage from '#/common/HeaderImage.tsx';

import getImageUrl from '@/utils/getImageUrl.ts';

const NotFoundPage = () => {
  const { t } = useTranslation();

  return (
    <>
      <PageHeader
        backgroundComponent={
          <HeaderImage imageUrl={getImageUrl(t('notFound.imageUrl'))} />
        }
        headerTextArray={[t('notFound.title')]}
        subHeaderContentArray={[
          t('notFound.description'),
          // eslint-disable-next-line react/jsx-key
          <Link to='/home/'>
            <Button color='primary' size='large' ghost={true}>
              {t('notFound.backButton')}
            </Button>
          </Link>,
        ]}
      />
    </>
  );
};

export default NotFoundPage;
