import styled, { keyframes } from 'styled-components';

const shimmer = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

const SkeletonContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 32px;
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-color);
  background: var(--bg-elevated);
  box-shadow: var(--shadow-sm);
  min-height: 280px;
  position: relative;
  overflow: hidden;
  will-change: transform;
`;

const ShimmerOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  will-change: transform;
  transform: translateX(-100%);
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.08) 30%,
    rgba(255, 255, 255, 0.15) 50%,
    rgba(255, 255, 255, 0.08) 70%,
    transparent 100%
  );
  animation: ${shimmer} 1.5s infinite linear;
  pointer-events: none;
  z-index: 10;
`;

const SkeletonBlock = styled.div<{ $width: string; $height: string; $margin?: string; $radius?: string }>`
  width: ${(props) => props.$width};
  height: ${(props) => props.$height};
  margin: ${(props) => props.$margin || '0'};
  border-radius: ${(props) => props.$radius || 'var(--radius-sm)'};
  background: var(--bg-tertiary);
  opacity: 0.5;
`;

const TopBlock = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 24px;
`;

const SkeletonFooter = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
`;

const RepoCardSkeleton = () => {
  return (
    <SkeletonContainer>
      <ShimmerOverlay />
      <TopBlock>
        <div style={{ width: '100%' }}>
          <SkeletonBlock $width="60%" $height="28px" $margin="0 0 8px 0" />
          <SkeletonBlock $width="40%" $height="18px" />
        </div>
        <SkeletonBlock $width="32px" $height="32px" $radius="50%" />
      </TopBlock>

      <SkeletonBlock $width="100%" $height="16px" $margin="0 0 8px 0" />
      <SkeletonBlock $width="90%" $height="16px" $margin="0 0 8px 0" />
      <SkeletonBlock $width="75%" $height="16px" $margin="0 0 24px 0" />

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <SkeletonBlock $width="60px" $height="26px" $radius="13px" />
        <SkeletonBlock $width="80px" $height="26px" $radius="13px" />
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <SkeletonBlock $width="80px" $height="16px" />
        <SkeletonBlock $width="100px" $height="16px" />
      </div>

      <SkeletonFooter>
        <div style={{ display: 'flex', gap: '16px' }}>
          <SkeletonBlock $width="50px" $height="16px" />
          <SkeletonBlock $width="50px" $height="16px" />
        </div>
        <SkeletonBlock $width="120px" $height="16px" />
      </SkeletonFooter>
    </SkeletonContainer>
  );
};

export default RepoCardSkeleton;
