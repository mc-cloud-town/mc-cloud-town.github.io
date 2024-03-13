import { useTranslation } from 'react-i18next';

import PageHeader from '#/common/PageHeader.tsx';
import Timeline from '#/survivalProgress/TimeLine.tsx';

import { IImageContent } from '@/types/IImageContent.ts';

const timelineItems: IImageContent[] = [
  {
    imageUrl: 'SurvivalProgress/2022-08-03_22.22.10.webp',
    title: '2022/7/23 - 雲鎮工藝開服',
    subTitle: '',
    paragraph: '',
  },
  {
    imageUrl: 'SurvivalProgress/2022-07-29_12.38.40.webp',
    title: '2022/7/29 - 史萊姆空置域完成',
    subTitle: '豬靈交易所 界伏殼農場 20顆無敵水晶',
    paragraph: '',
  },
  {
    imageUrl: 'SurvivalProgress/2022-08-06_12.07.11.webp',
    title: '2022/8/5 - 出生點設施',
    subTitle:
      '全物品空置域、出生點設施、雙維度豬人塔收集、4gt樹場、黑曜石機、雙維度豬人塔、殺雕機、終界清空',
    paragraph: '',
  },
  {
    imageUrl: 'SurvivalProgress/unknown.webp',
    title: '2022/8/6 - 主世界偽和平',
    subTitle: '',
    paragraph: '',
  },
  {
    imageUrl: 'SurvivalProgress/2022-08-07_23.54.46.webp',
    title: '2022/8/8 - 地獄大廳',
    subTitle: '地獄大廳、320熔爐工業區、百萬刷石機、虛空交易所完成、地獄偽和平',
    paragraph: '',
  },
  {
    imageUrl: 'SurvivalProgress/image.webp',
    title: '2022/8/27 - 史萊姆農場',
    subTitle: '史萊姆農場、雙維度鐵人塔8.4w/h、襲擊農場翻新970k/h',
    paragraph: '',
  },
  {
    imageUrl: 'SurvivalProgress/unknown_2.webp',
    title: '2022/8/30 - 72K刷冰機',
    subTitle: '',
    paragraph: '',
  },
  {
    imageUrl: 'SurvivalProgress/unknown_3.webp',
    title: '2022/09/28 - 四聯海貨塔',
    subTitle: '',
    paragraph: '',
  },
  {
    imageUrl: 'SurvivalProgress/CT_quarry_screenshot_2.webp',
    title: '2022/09/23～09/28 - 512寬採礦機',
    subTitle: '',
    paragraph: '',
  },
  {
    imageUrl: 'SurvivalProgress/unknown_4.webp',
    title: '2022/10/10 - 蘑菇牛農場',
    subTitle: '',
    paragraph: '',
  },
  {
    imageUrl: 'SurvivalProgress/2022-11-23_01.39.31.webp',
    title: '2022/10/10 - 主世界切門完成',
    subTitle: '',
    paragraph: '',
  },
  {
    imageUrl: 'SurvivalProgress/CTEC_Sort_7.webp',
    title: '2022/10/26 - 全物品',
    subTitle: '',
    paragraph: '',
  },
  {
    imageUrl: 'SurvivalProgress/2022-12-05_01.09.37.webp',
    title: '2022/12/03 - 終界農業區',
    subTitle: '',
    paragraph: '',
  },
  {
    imageUrl: 'SurvivalProgress/FjIc0oYagAEaTIT.webp',
    title: '2022/12/05 - 白上空置域',
    subTitle: '',
    paragraph: '',
  },
  {
    imageUrl: 'SurvivalProgress/2022-12-11_11.57.06.webp',
    title: '2022/12/11 - 活塞自動合成90K/h',
    subTitle: '',
    paragraph: '',
  },
  {
    imageUrl: 'SurvivalProgress/2022-12-14_01.24.37.webp',
    title: '2022/12/14 - 前往地獄1k空置域之臨時珍珠砲',
    subTitle: '',
    paragraph: '',
  },
  {
    imageUrl: 'SurvivalProgress/2022-12-15_11.45.33.webp',
    title: '2022/12/15 - 虛空交易巔峰',
    subTitle: '',
    paragraph: '',
  },
  {
    imageUrl: 'SurvivalProgress/image_2.webp',
    title: '2023/01/06 - 主世界1k空置域',
    subTitle: '',
    paragraph: '',
  },
  {
    imageUrl: 'SurvivalProgress/2023-01-16_23.18.46.webp',
    title: '2023/01/17 - y0切門豬人農場地獄端',
    subTitle: '',
    paragraph: '',
  },
  {
    imageUrl: 'SurvivalProgress/image_3.webp',
    title: '2023/01 - 史萊姆農場翻新',
    subTitle: '',
    paragraph: '',
  },
  {
    imageUrl: 'SurvivalProgress/image_4.webp',
    title: '2023/01 - EOL地獄收集',
    subTitle: '',
    paragraph: '',
  },
  {
    imageUrl: 'SurvivalProgress/maxresdefault.webp',
    title: '2023/02/20 - y0切門豬人農場主世界收集及裝飾',
    subTitle: '',
    paragraph: '',
  },
  {
    imageUrl: 'SurvivalProgress/2023-04-12_11.17.23.webp',
    title: '2023/04/12 - EOL地獄收集翻新',
    subTitle: '',
    paragraph: '',
  },
  {
    imageUrl: 'SurvivalProgress/2023-07-21_10.53.51.webp',
    title: '2023/04/16 - EOL主世界裝飾',
    subTitle: '',
    paragraph: '',
  },
  {
    imageUrl: 'SurvivalProgress/2023-04-24_23.webp',
    title: '2023/04/23 - 地獄1k空置域',
    subTitle: '移除基岩共消耗508萬活塞、獲得遠古遺骸共6232個',
    paragraph: '',
  },
  {
    imageUrl: 'SurvivalProgress/image_5.webp',
    title: '2023/04/26 - 天使的秘密',
    subTitle: '共91,841,829方塊',
    paragraph: '',
  },
  {
    imageUrl: 'SurvivalProgress/My_wrath_can_consume_worlds._1.webp',
    title: '2023/6-2023/7 - 新出生點',
    subTitle: '',
    paragraph: '',
  },
  {
    imageUrl:
      'SurvivalProgress/Base_Profile_Screenshot_2023.11.05_-_20.25.12.76.webp',
    title: '2023/08/20 - 全編碼全物品',
    subTitle: '',
    paragraph: '',
  },
  {
    imageUrl:
      'SurvivalProgress/Desktop_Screenshot_2023.09.08_-_15.58.31.10.webp',
    title: '2023/9/8 - 末地大廳',
    subTitle: '',
    paragraph: '',
  },
  {
    imageUrl: 'SurvivalProgress/2023-09-25_20.webp',
    title: '2023/09/29 - 月宮',
    subTitle: '',
    paragraph: '',
  },
  {
    imageUrl:
      'SurvivalProgress/Base_Profile_Screenshot_2023.10.03_-_17.03.47.51.webp',
    title: '2023/10/03 - 蠑螈繁殖',
    subTitle: '',
    paragraph: '',
  },
  {
    imageUrl:
      'SurvivalProgress/Base_Profile_Screenshot_2023.11.13_-_00.07.43.61.webp',
    title: '2023/11/11 - 溺屍農場',
    subTitle: '',
    paragraph: '',
  },
  {
    imageUrl: 'SurvivalProgress/image_6.webp',
    title: '2023/11/14 - 鞘翅砲',
    subTitle: '',
    paragraph: '',
  },
  {
    imageUrl: 'SurvivalProgress/IMG_9507.webp',
    title: '2023/12/2 - 原石启铜',
    subTitle: '',
    paragraph: '',
  },
  {
    imageUrl: 'SurvivalProgress/IMG_9532.webp',
    title: '2023/12/6 - 銅錠農場裝飾',
    subTitle: '',
    paragraph: '',
  },
  {
    imageUrl: 'SurvivalProgress/2023-12-14_01.25.17.webp',
    title: '2023/12/14 - 主世界豬人塔',
    subTitle: '',
    paragraph: '',
  },
  {
    imageUrl: 'SurvivalProgress/image_7.webp',
    title: '2024/01/15 - 雲妹手挖像素畫',
    subTitle: '',
    paragraph: '',
  },
];

const SurvivalProgress = () => {
  const { t } = useTranslation();

  return (
    <>
      <PageHeader
        backgroundComponent={<></>}
        headerTextArray={[t('survivalProgress.title')]}
        subHeaderContentArray={[t('survivalProgress.description')]}
      />
      <Timeline items={timelineItems} />
    </>
  );
};

export default SurvivalProgress;
