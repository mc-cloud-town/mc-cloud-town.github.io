import { useTranslation } from 'react-i18next';
import PageHeader from '#/common/PageHeader.tsx';

const ArchitectureCollection = () => {
  const { t } = useTranslation();

  return (
    <>
      <PageHeader
        backgroundComponent={<></>}
        headerTextArray={[t('buildingCollection.title')]}
      />
    </>
  );
};

export default ArchitectureCollection;
