import PageHeader from '#/common/PageHeader.tsx';
import HeaderImage from '#/common/HeaderImage.tsx';
import join from '@/assets/join/join.png';
import { useTranslation } from 'react-i18next';
import HeaderTimer from '#/homePage/header/HeaderTimer.tsx';
import ImageContentSection from '#/common/ImageContentSection.tsx';
import { imageContent } from '@/types/imageContent.ts';

const JoinServer = () => {
  const { t } = useTranslation();
  // 紅石
  const RedstonePlayerImage: imageContent = {
    imageUrl: t('join.redstone.image'),
    title: t('join.redstone.title'),
    features: [
      t('join.redstone.description.0'),
      t('join.redstone.description.1'),
      t('join.redstone.description.2'),
    ],
    buttons: [
      {
        text: t('join.redstone.description.3'),
        href: 'https://discordapp.com/users/676261754782613514',
        type: 'link',
      },
      {
        text: t('join.redstone.description.4'),
        href: 'https://discordapp.com/users/378510281250439168',
        type: 'link',
      },
    ],
  };
  // 建築
  const BuildPlayerImage: imageContent = {
    imageUrl: t('join.build.image'),
    title: t('join.build.title'),
    subTitle: t('join.build.subTitle'),
    features: [
      t('join.build.description.0'),
      t('join.build.description.1'),
      t('join.build.description.2'),
    ],
    buttons: [
      {
        text: '申請表單',
        link: 'https://forms.gle/sGUxUtUaskchiTfG7',
      },
    ],
  };
  // 後勤
  const PlayerImage: imageContent = {
    imageUrl: t('join.player.image'),
    title: t('join.player.title'),
    features: [t('join.player.description')],
    buttons: [
      {
        text: '申請表單',
        link: 'https://forms.gle/sGUxUtUaskchiTfG7',
      },
    ],
  };
  return (
    <>
      <a target=""></a>
      <PageHeader
        backgroundComponent={<HeaderImage imageUrl={join} />}
        headerTextArray={[t('join.description')]}
        subHeaderContentArray={[<HeaderTimer />]}
      />
      {/*紅石*/}
      <ImageContentSection
        imageContent={RedstonePlayerImage}
        darkMode={true}
      ></ImageContentSection>
      {/*建築*/}
      <ImageContentSection
        imageContent={BuildPlayerImage}
      ></ImageContentSection>
      {/*後勤*/}
      <ImageContentSection
        imageContent={PlayerImage}
        darkMode={true}
      ></ImageContentSection>
    </>
  );
};
export default JoinServer;