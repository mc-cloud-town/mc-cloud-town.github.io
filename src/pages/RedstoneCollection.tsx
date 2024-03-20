import { useTranslation } from 'react-i18next';
import PageHeader from '#/common/PageHeader.tsx';

const RedstoneCollection = () => {
  const { t } = useTranslation();

  return (
    <>
      <PageHeader
        backgroundComponent={<></>}
        headerTextArray={[t('redstonePortfolio.title')]}
      />
    </>
  );
};

export default RedstoneCollection;
