import PageHeader from '#/common/PageHeader.tsx';
import { useTranslation } from 'react-i18next';

import background from '@/assets/notFound/background.jpg';

const NotFoundPage = () => {
  const { t } = useTranslation();

  const headerTextArray = [
    t('notFound.title'),
    t('notFound.description')
  ];

  return (
    <>
      <PageHeader
        backgroundComponent={<img src={background} alt="background" />}
        headerTextArray={headerTextArray}
      />
    </>
  );
};

export default NotFoundPage;
