import PortfolioModal from '#/portfolio/PortfolioModal.tsx';
import { IPortfolioModal } from '@/types/IPortfolio.ts';
import { useState } from 'react';
import { Button } from 'antd';

const data: IPortfolioModal = {
  Title: 'aaa',
  Creator: 'acc',
  Tage: ['acac', 'ccc'],
  Introduce: 'cacacacacacacacac',
};

const PortfolioCard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const showModal = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <Button onClick={showModal}>Open Modal</Button>
      <PortfolioModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        data={data}
      />
    </>
  );
};

export default PortfolioCard;
