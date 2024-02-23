import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const HeaderTimer = () => {
  const { t } = useTranslation();
  const [timeDiff, setTimeDiff] = useState('');

  const serverStartTime = new Date('2022-07-22T16:00:00.000Z').getTime();

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const diff = now - serverStartTime;

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeDiff(`${t('home.serverRunning')} ${days} ${t('time.days')} ${hours} ${t('time.hours')} ${minutes} ${t('time.minutes')} ${seconds} ${t('time.seconds')}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [serverStartTime, t]);

  return <div>{timeDiff}</div>;
};

export default HeaderTimer;
