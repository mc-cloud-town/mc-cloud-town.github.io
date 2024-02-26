import { Row, Col } from 'antd';

import { member } from '@/types/member';
import 'react-lazy-load-image-component/src/effects/blur.css';
import MemberCard from '#/members/MemberCard.tsx';

const MemberCase = ({ members }: { members: Array<member> }) => {
  return (
    <Row gutter={[16, 16]}>
      {members.map((member, index) => (
        <Col key={index} span={24} md={12} lg={8}>
          <MemberCard member={member} />
        </Col>
      ))}
    </Row>
  );
};

export default MemberCase;
