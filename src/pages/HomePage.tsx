import { Content } from 'antd/lib/layout/layout';
import styled from 'styled-components';
import { Button } from 'antd';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

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
          'Cloud Town Exquisite Craft',
          '雲鎮工藝 | CTEC',
          '云镇工艺 | CTEC'
        ]}
        subHeaderContentArray={[
          <span>{t('home.description')}</span>,
          <HeaderTimer />,
          <Link to="/join">
            <Button
              color="primary"
              size="large"
              ghost={true}
            >
              {t('home.joinButton')}
            </Button>
          </Link>
        ]}
        useTyped={true}
      />
      <StyledContent>
      </StyledContent>
    </>
  );
};

export default HomePage;
