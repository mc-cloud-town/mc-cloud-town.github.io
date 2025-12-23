import { keyframes } from 'styled-components';

// Base fade in animation
export const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Slide up with spring-like bounce effect
export const slideUpSpring = keyframes`
  0% {
    opacity: 0;
    transform: translateY(40px);
  }
  60% {
    opacity: 1;
    transform: translateY(-5px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Subtle floating effect
export const floatIn = keyframes`
  0% {
    opacity: 0;
    transform: translateY(30px) scale(0.98);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

// Glow pulse animation
export const glowPulse = keyframes`
  0%, 100% {
    box-shadow: 0 0 20px var(--color-primary-light, rgba(99, 102, 241, 0.3));
  }
  50% {
    box-shadow: 0 0 40px var(--color-primary, rgba(99, 102, 241, 0.5));
  }
`;

// Slide reveal from left
export const slideRevealLeft = keyframes`
  from {
    opacity: 0;
    transform: translateX(-50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

// Slide reveal from right
export const slideRevealRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

// Shimmer loading effect
export const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

// Scale in animation
export const scaleIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

// Gradient shift animation
export const gradientShift = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

// Float effect for decorative elements
export const float = keyframes`
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  33% {
    transform: translateY(-10px) rotate(1deg);
  }
  66% {
    transform: translateY(-5px) rotate(-1deg);
  }
`;

// Staggered animation helper
export const createStaggeredAnimation = (
  animation: ReturnType<typeof keyframes>,
  baseDelay: number = 0.1,
  duration: number = 0.6,
) => {
  return (index: number) => `
    animation: ${animation} ${duration}s ease-out forwards;
    animation-delay: ${baseDelay * index}s;
  `;
};
