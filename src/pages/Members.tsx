import NavigationBar from '#/common/NavigationBar';

import MemberCase from '#/members/MemberCase.tsx';
import styled from 'styled-components';
import { member } from '@/types/member';

const MemberPageDiv = styled.div`
  background-color: #ecf0f1
`;

const MembersPage = () => {
  const testMember: member = {
    id: 'test',
    name: 'test',
    introduction: 'test'
  };


  return (
    <MemberPageDiv>
      <NavigationBar />
      <MemberCase
        member={testMember}
      />
    </MemberPageDiv>
  );
};

export default MembersPage;
