import styled from 'styled-components';
import { member } from '@/types/member';

const Member = styled.div`
  display: flex;
  align-items: center;
`;

const MemberImage = styled.div`
  padding-right: 50px;
`;

const MemberOut = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 100px;
  padding: 25px;
  
  justify-items: center;
  text-align: center;

  @media (min-width: 900px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const MemberCase = ({ members }: { members: Array<member> }) => {
  const url = `https://mineskin.eu/armor/body/{}/100.png`;

  return (
    <>
      <MemberOut>
        {members.map((mm, index) => {
          return (
            <Member key={`member-${index}`}>
              <MemberImage>
                <img src={url.replace('{}', mm.id)} alt={mm.name} />
              </MemberImage>
              <div>
                <h2>{mm.name}</h2>
                <span>{mm.introduction}</span>
              </div>
            </Member>
          );
        })}
      </MemberOut>;
    </>
  )
    ;
};

export default MemberCase;

