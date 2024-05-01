import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Statistic, Row, Col } from 'antd';

/**
 * HeaderTimer component.
 * @constructor HeaderTimer - React Function Component
 */
const HeaderTimer: React.FC = () => {
  const { t } = useTranslation();
  const [timeDiff, setTimeDiff] = useState(0);

  const serverStartTime = new Date('2022-07-22T16:00:00.000Z').getTime();

  useEffect(() => {
    const updateDiff = () => {
      const now = new Date().getTime();
      const diff = now - serverStartTime;
      setTimeDiff(diff);
    };

    updateDiff();

    const timer = setInterval(updateDiff, 1000);

    return () => clearInterval(timer);
  }, [serverStartTime]);

  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  );
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

  return (
    <Row gutter={16} align='middle' justify='center'>
      <Col>
        <div>{t('home.serverRunning')}</div>
      </Col>
      <Col>
        <Statistic
          value={days}
          suffix={t('time.days')}
          valueStyle={{ color: 'white' }}
        />
      </Col>
      <Col>
        <Statistic
          value={hours}
          suffix={t('time.hours')}
          valueStyle={{ color: 'white' }}
        />
      </Col>
      <Col>
        <Statistic
          value={minutes}
          suffix={t('time.minutes')}
          valueStyle={{ color: 'white' }}
        />
      </Col>
      <Col>
        <Statistic
          value={seconds}
          suffix={t('time.seconds')}
          valueStyle={{ color: 'white' }}
        />
      </Col>
    </Row>
  );
};

export default HeaderTimer;
