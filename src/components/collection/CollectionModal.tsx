import { Modal, Tag } from 'antd';
import { IPortfolioModal } from '@/types/IPortfolio.ts';
import React, { Dispatch, SetStateAction } from 'react';
import styled from 'styled-components';

interface CollectionModalProps {
  isModalOpen: boolean;
  setIsModalOpen: Dispatch<SetStateAction<boolean>>;
  data: IPortfolioModal;
}

const ModalTitle = styled.span`
  text-align: center;
  font-size: xx-large;
`;

const TagDiv = styled.div`
  margin: 0 0 5px;
`;

const StyleTag = styled(Tag)`
  font-weight: bold;
`;

const Creator = styled.div`
  font-size: 24px;
  font-weight: bold;
`;

const StyleCreator = styled.div`
  font-size: 18px;
`;

const StyleIntroduce = styled.div`
  font-size: medium;
`;

const StyleVideo = styled.div`
  display: flex;
  justify-content: center;
`;

const StyleIframe = styled.iframe`
  border: none;
  width: 700px;
  height: 390px;

  @media only screen and (max-width: 620px) {
    width: 100%;
    max-width: 560px;
    height: 300px;
  }

  @media only screen and (max-width: 345px) {
    width: 100%;
    max-width: 300px;
    height: 170px;
  }
`;

const CollectionModal: React.FC<CollectionModalProps> = ({
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
        title={<ModalTitle>{data.Title}</ModalTitle>}
        footer={null}
      >
        {data.Tage && (
          <TagDiv>
            {data.Tage.map((introduce, index) => (
              <StyleTag color={introduce.Color} key={index}>
                <a href={introduce.Link}>{introduce.Name}</a>
              </StyleTag>
            ))}
          </TagDiv>
        )}
        {data.Creator && (
          <>
            <Creator>作者：</Creator>
            <StyleCreator>
              {Array.isArray(data.Creator)
                ? data.Creator.map((introduce, index) => (
                    <p style={{ margin: '0 10px 5px' }} key={index}>
                      {introduce}
                    </p>
                  ))
                : data.Creator}
            </StyleCreator>
          </>
        )}
        {data.Link?.Video && (
          <StyleVideo>
            <StyleIframe
              id={'video'}
              src={data.Link?.Video + '&autoplay=0&enablejsapi=1'}
              title="YouTube video player"
              allowFullScreen
            />
          </StyleVideo>
        )}
        {data.Introduce && (
          <StyleIntroduce>
            {Array.isArray(data.Introduce)
              ? data.Introduce.map((introduce, index) => (
                  <p style={{ margin: '0 0 5px' }} key={index}>
                    {introduce}
                  </p>
                ))
              : data.Introduce}
          </StyleIntroduce>
        )}
      </Modal>
    </>
  );
};

export default CollectionModal;
