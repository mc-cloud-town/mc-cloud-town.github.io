import styled from 'styled-components';
import {member} from "@/types/member";

const Member = styled.div`
  display: flex;
  align-items: center;
`;

const MemberImage = styled.div`
  padding-right: 30px;
`;



const MemberCase = ({member}:{member:member}) => {
  const url = `https://mineskin.eu/armor/body/${member.id}/100.png`
  return (
    <Member>
    <MemberImage>
      <img src={url} alt={member.id}></img>
    </MemberImage>
    <div className="memberinfo">
      <h2>{member.name}</h2>
      <span>{member.introduction}</span>
    </div>
    </Member>
  )
}

export default MemberCase;

