import CollectionModal from '#/collection/CollectionModal.tsx';
import { IPortfolioModal } from '@/types/IPortfolio.ts';
import { useState } from 'react';
import { Button } from 'antd';

const data: IPortfolioModal = {
  Title: '出生點設施',
  Creator: [
    '專案經理:Fantasy_Sakura',
    '混凝土固化機作者:yisibite',
    '百萬倉庫作者:acaciachan',
    '自適應打包機:redberd',
  ],
  Tage: [
    { Name: '出生點', Link: 'test', Color: 'red' },
    { Name: '設施', Link: 'test', Color: 'volcano' },
    { Name: '2022/8/5', Link: 'test', Color: 'orange' },
  ],
  Introduce: [
    '專案經理:Fantasy_Sakura',
    'acac',
    'acac',
    'acac',
    'acac',
    'acac',
    'acac',
    'acac',
    'acac',
    'acac',
    'acac',
    'acac',
    'acac',
    'acac',
    'acac',
    'acac',
    'acac',
    'acac',
    'acac',
    'acac',
  ],
};

const CollectionCard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const showModal = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <Button onClick={showModal}>Open Modal</Button>
      <CollectionModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        data={data}
      />
    </>
  );
};

export default CollectionCard;
