import { useTranslation } from 'react-i18next';
import PageHeader from '#/common/PageHeader.tsx';

const RedstonePortfolio = () => {
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

export default RedstonePortfolio;
