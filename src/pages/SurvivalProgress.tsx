import { useTranslation } from 'react-i18next';

import PageHeader from '#/common/PageHeader.tsx';
import Timeline from '#/survivalProgress/TimeLine.tsx';

const timelineItems = [
  {
    imageUrl: 'homePage/CTEC_Redstone.webp',
    title: '2020 - Launch',
    subTitle: 'Official Launch of Our Platform',
    paragraph: 'In 2020, our platform was officially launched, marking the beginning of our journey to connect and innovate.'
  },
  {
    imageUrl: 'homePage/CTEC_Building.webp',
    title: '2021 - First Major Update',
    subTitle: 'Introduction of New Features',
    paragraph: 'A year into our journey, we introduced several new features to enhance user experience and broaden our service offerings.'
  },
  {
    imageUrl: 'homePage/CTEC_Sort.webp',
    title: '2022 - Community Growth',
    subTitle: 'Reaching 100K Users',
    paragraph: 'By 2022, our community had grown to over 100,000 active users, a milestone that validated our efforts and the value we bring to our users.'
  },
  {
    imageUrl: 'join/CTEC_Logistics.webp',
    title: '2023 - Global Expansion',
    subTitle: 'Expanding Our Reach',
    paragraph: 'In 2023, we began our global expansion, reaching users in over 50 countries worldwide and establishing ourselves as a global platform.'
  }
];


const SurvivalProgress = () => {
  const { t } = useTranslation();

  return (
    <>
      <PageHeader
        backgroundComponent={<></>}
        headerTextArray={[
          t('survivalProgress.title')
        ]}
        subHeaderContentArray={[
          t('survivalProgress.description'),
        ]}
      />
      <Timeline items={timelineItems}/>
    </>
  );
};

export default SurvivalProgress;