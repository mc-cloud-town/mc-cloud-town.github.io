import { ConfigProvider, theme as antdTheme } from 'antd';
import { Outlet } from 'react-router-dom';
import styled from 'styled-components';
import NavigationBar from '#/common/NavigationBar.tsx';
import Footer from '#/common/Footer.tsx';
import ScrollToTopButton from '#/common/ScrollToTopButton.tsx';
import { useTheme } from '@/hooks/useTheme';

const AppContainer = styled.div`
  min-height: 100vh;
  background: var(--bg-primary);
  transition: background var(--transition-theme);
`;

export const Layout = () => {
  const { isDark } = useTheme();

  // Light theme tokens
  const lightTokens = {
    colorPrimary: '#4a8b8d',
    colorInfo: '#5bb8c9',
    colorSuccess: '#52c4a0',
    colorWarning: '#f5a623',
    colorError: '#e74c3c',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBgBase: '#f8fafc',
    colorTextBase: '#1e293b',
    borderRadius: 12,
    colorLink: '#4a8b8d',
    colorLinkHover: '#3d7374',
    colorBorder: 'rgba(0, 0, 0, 0.08)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    boxShadowSecondary: '0 8px 24px rgba(0, 0, 0, 0.12)',
  };

  // Dark theme tokens
  const darkTokens = {
    colorPrimary: '#6366f1',
    colorInfo: '#8b5cf6',
    colorSuccess: '#10b981',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorBgContainer: '#1a1f2e',
    colorBgElevated: '#1f2937',
    colorBgBase: '#0a0f1a',
    colorTextBase: '#f1f5f9',
    borderRadius: 12,
    colorLink: '#818cf8',
    colorLinkHover: '#a5b4fc',
    colorBorder: 'rgba(255, 255, 255, 0.1)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    boxShadowSecondary: '0 8px 24px rgba(0, 0, 0, 0.4)',
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark
          ? antdTheme.darkAlgorithm
          : antdTheme.defaultAlgorithm,
        token: isDark ? darkTokens : lightTokens,
        components: {
          Button: {
            primaryShadow: isDark
              ? '0 4px 16px rgba(99, 102, 241, 0.4)'
              : '0 4px 16px rgba(74, 139, 141, 0.4)',
            borderRadius: 8,
          },
          Card: {
            borderRadiusLG: 16,
            boxShadowTertiary: isDark
              ? '0 8px 32px rgba(0, 0, 0, 0.3)'
              : '0 8px 32px rgba(0, 0, 0, 0.08)',
          },
          Timeline: {
            dotBg: isDark ? '#6366f1' : '#4a8b8d',
            dotBorderWidth: 2,
            itemPaddingBottom: 20,
            tailColor: isDark
              ? 'rgba(255, 255, 255, 0.15)'
              : 'rgba(0, 0, 0, 0.1)',
            tailWidth: 2,
          },
          Menu: {
            darkItemBg: 'transparent',
            darkSubMenuItemBg: 'rgba(0, 0, 0, 0.2)',
            itemBg: 'transparent',
          },
          Input: {
            borderRadius: 8,
          },
          Select: {
            borderRadius: 8,
          },
        },
      }}
    >
      <AppContainer>
        <NavigationBar />
        <Outlet />
        <Footer />
        <ScrollToTopButton />
      </AppContainer>
    </ConfigProvider>
  );
};
