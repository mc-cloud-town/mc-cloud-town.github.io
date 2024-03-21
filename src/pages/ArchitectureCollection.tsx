import { useTranslation } from 'react-i18next';
import PageHeader from '#/common/PageHeader.tsx';

const ArchitectureCollection = () => {
  const { t } = useTranslation();

  return (
    <>
      <PageHeader
        backgroundComponent={<></>}
        maskColor={'#6f9b9c'}
        headerTextArray={[t('buildingCollection.title')]}
      />
    </>
  );
};

export default ArchitectureCollection;
