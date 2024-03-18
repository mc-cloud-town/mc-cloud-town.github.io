import { Modal } from 'antd';
import { IPortfolioModal } from '@/types/IPortfolio.ts';
import React, { Dispatch, SetStateAction } from 'react';

interface PortfolioModalProps {
  isModalOpen: boolean;
  setIsModalOpen: Dispatch<SetStateAction<boolean>>;
  data: IPortfolioModal;
}

const PortfolioModal: React.FC<PortfolioModalProps> = ({
  isModalOpen,
  setIsModalOpen,
  data,
}) => {
  return (
    <>
      <Modal
        width={720}
        centered={true}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        title={data.Title}
      ></Modal>
    </>
  );
};

export default PortfolioModal;
