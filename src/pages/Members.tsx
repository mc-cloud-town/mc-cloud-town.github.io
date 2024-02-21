import NavigationBar from '#/common/NavigationBar';

import MemberCase from '#/members/MemberCase.tsx';
import styled from 'styled-components';

const MemberPageDiv = styled.div`
  background-color: #ecf0f1
`;

const MembersPage = () => {
  const ttmember =
  {
      id: 'test',
      name: 'test',
      introduction: '這是一個比較長的介紹,這是一個比較長的介紹,這是一個比較長的介紹'
  }
  const testMember = []
  for (let i = 0; i < 20; i++) {
    testMember.push(ttmember)
  }


  return (
    <MemberPageDiv>
      <NavigationBar />
      <MemberCase
        members={testMember}
      />
    </MemberPageDiv>
  );
};

export default MembersPage;
