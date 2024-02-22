import { Content } from 'antd/lib/layout/layout';
import styled from 'styled-components';
import PageHeader from '#/common/PageHeader.tsx';
import HeaderBackground from '#/homePage/HeaderBackground.tsx';
import HeaderTimer from '#/homePage/HeaderTimer.tsx';

const StyledContent = styled(Content)`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  margin: 50px;
  background: rgba(255, 255, 255, 0.8);
`;

const HomePage = () => {
  const headerTextArray = [
    'Welcome to Cloud Town Exquisite Craft',
    '歡迎來到雲鎮工藝 | CTEC',
    '欢迎来到云镇工艺 | CTEC'
  ];
  const subHeaderContentArray = [
    <HeaderTimer />
  ];
  return (
    <>
      <PageHeader
        backgroundComponent={<HeaderBackground />}
        headerTextArray={headerTextArray}
        subHeaderContentArray={subHeaderContentArray}
        useTyped={true}
      />
      <StyledContent>
      </StyledContent>
    </>
  );
};

export default HomePage;
