import { useTranslation } from 'react-i18next';
import styled from 'styled-components'; // 导入 styled-components 库

const Eric = styled.div`
  color: red;
  font-size: 100px;
`;

const Timeline = () => {
  const { t } = useTranslation();
  const eventCount = 2; // 假设这里是 2，实际应根据你的 i18next 文件中的数据来确定

  // 生成事件数组
  const events = [];
  for (let i = 1; i <= eventCount; i++) {
    events.push({
      title: t(`survivalProgress.event${i}.title`),
      description: t(`survivalProgress.event${i}.description`)
    });
  }

  return (
    <Eric>
      {events.map((event, index) => (
        <div key={index}>
          <h2>{event.title}</h2>
          <p>{event.description}</p>
        </div>
      ))}
    </Eric>
  );
};

export default Timeline;
