import NavigationBar  from "#/common/NavigationBar";

import Membercase from "#/members/Membercase";
import styled from "styled-components";
import {member} from "@/types/member";

const MemberPagediv = styled.div`
  background-color:#ecf0f1
`;

const MembersPage = () => {
  const ttmember:member = {
    id: "test",
    name: "test",
    introduction: "test"
  }


  return (
    <MemberPagediv>
      <NavigationBar />
      <Membercase
        member={ttmember}
      />
    </MemberPagediv>
    );
  };

  export default MembersPage;
