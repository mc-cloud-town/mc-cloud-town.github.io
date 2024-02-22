import PageHeader from '#/common/PageHeader.tsx';
import { useTranslation } from 'react-i18next';

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
        subHeaderTextArray={[
          t('notFound.description')
        ]}
      />
    </>
  );
};

export default NotFoundPage;
