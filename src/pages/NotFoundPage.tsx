import PageHeader from '#/common/PageHeader.tsx';
import { useTranslation } from 'react-i18next';

import HeaderImage from '#/common/HeaderImage.tsx';

import background from '@/assets/notFoundPage/background.jpg';

const NotFoundPage = () => {
  const { t } = useTranslation();

  const headerTextArray = [
    t('notFound.title'),
    t('notFound.description')
  ];

  return (
    <>
      <PageHeader
        backgroundComponent={<HeaderImage imageUrl={background} />}
        headerTextArray={headerTextArray}
      />
    </>
  );
};

export default NotFoundPage;
