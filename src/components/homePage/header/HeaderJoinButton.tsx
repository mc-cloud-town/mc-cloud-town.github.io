import { Button } from 'antd';
import { useTranslation } from 'react-i18next';

const HeaderJoinButton = () => {
  const { t } = useTranslation();

  return (
    <Button
      color="primary"
      size="large"
      ghost={true}
      href="/join"
    >
      {t('home.joinButton')}
    </Button>
  );
}

export default HeaderJoinButton;
