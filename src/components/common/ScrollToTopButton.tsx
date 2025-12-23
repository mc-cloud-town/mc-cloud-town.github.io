import { useState, useEffect } from 'react';
import { ArrowUpOutlined } from '@ant-design/icons';
import styled, { css } from 'styled-components';

import useScroll from '@/hooks/useScroll.ts';

const StyledButton = styled.button<{ $show: boolean }>`
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 48px;
  height: 48px;
  border: 1px solid var(--border-color);
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transform: translateY(20px);
  transition: all var(--transition-base);
  box-shadow: var(--shadow-md);

  ${(props) =>
    props.$show &&
    css`
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    `}

  &:hover {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
    transform: ${(props) =>
      props.$show ? 'translateY(-4px)' : 'translateY(20px)'};
    box-shadow: var(--glow-primary);
  }

  .anticon {
    font-size: 20px;
  }
`;

/**
 * Modern scroll-to-top button with glassmorphism effect.
 */
const ScrollToTopButton = () => {
  const { y } = useScroll();
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    setShowButton(y > 400);
  }, [y]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <StyledButton
      onClick={scrollToTop}
      $show={showButton}
      aria-label='Scroll to top'
    >
      <ArrowUpOutlined />
    </StyledButton>
  );
};

export default ScrollToTopButton;
