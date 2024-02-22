import { Content } from 'antd/lib/layout/layout';
import styled from 'styled-components';
import { Button } from 'antd';
import { useTranslation } from 'react-i18next';

import PageHeader from '#/common/PageHeader.tsx';
import HeaderBackground from '#/homePage/header/HeaderBackground.tsx';
import HeaderTimer from '#/homePage/header/HeaderTimer.tsx';

const StyledContent = styled(Content)`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  margin: 50px;
  background: rgba(255, 255, 255, 0.8);
`;

const HomePage = () => {
  const { t } = useTranslation();

  return (
    <>
      <PageHeader
        backgroundComponent={<HeaderBackground />}
        headerTextArray={[
          'Welcome to Cloud Town Exquisite Craft',
          '歡迎來到雲鎮工藝 | CTEC',
          '欢迎来到云镇工艺 | CTEC'
        ]}
        subHeaderContentArray={[
          <HeaderTimer />,
          <Button
            color="primary"
            size="large"
            ghost={true}
            href="/join"
          >
            {t('home.joinButton')}
          </Button>
        ]}
        useTyped={true}
      />
      <StyledContent>
      </StyledContent>
    </>
  );
};

export default HomePage;
