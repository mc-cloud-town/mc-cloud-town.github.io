import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { UpCircleFilled, UpCircleOutlined } from '@ant-design/icons';

import useScroll from '@/hooks/useScroll.ts';

const StyledButton = styled.button<{ show: boolean }>`
  position: fixed;
  right: 20px;
  bottom: 20px;
  width: 25px;
  height: 25px;
  border: none;
  background-color: white;
  color: #6f9b9c;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s, visibility 0.3s;
  
  @media (max-width: 300px) {
    right: 40px;
    bottom: 20px;
  }
  
  ${(props) =>
    props.show &&
    `
    opacity: 0.5;
    visibility: visible;

    &:hover {
      opacity: 1;
    }
  `}
`;

const ScrollToTopButton = () => {
  const { y } = useScroll();
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const shouldBeShown = y > 300;
    setShowButton(shouldBeShown);
  }, [y]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <StyledButton onClick={scrollToTop} show={showButton} aria-label="Scroll to top">
      <UpCircleFilled style={{ fontSize: '40px' }} />
    </StyledButton>
  );
};

export default ScrollToTopButton;
