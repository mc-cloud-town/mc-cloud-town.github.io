import { ConfigProvider } from 'antd';
import { Outlet } from 'react-router-dom';
import NavigationBar from '#/common/NavigationBar.tsx';
import Footer from '#/common/Footer.tsx';
import ScrollToTopButton from '#/common/ScrollToTopButton.tsx';

export const Layout = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          // Primary colors - richer, more vibrant
          colorPrimary: '#4a8b8d',
          colorInfo: '#5bb8c9',
          colorSuccess: '#52c4a0',
          colorWarning: '#f5a623',
          colorError: '#e74c3c',

          // Background and text
          colorBgContainer: '#ffffff',
          colorTextBase: '#2c3e50',
          borderRadius: 12,

          // Links and borders
          colorLink: '#4a8b8d',
          colorLinkHover: '#6bb5b7',
          colorBorder: 'rgba(111, 155, 156, 0.3)',

          // Enhanced shadows
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          boxShadowSecondary: '0 8px 24px rgba(0, 0, 0, 0.12)',
        },
        components: {
          Button: {
            primaryShadow: '0 4px 16px rgba(74, 139, 141, 0.4)',
            borderRadius: 8,
          },
          Card: {
            borderRadiusLG: 16,
            boxShadowTertiary: '0 8px 32px rgba(0, 0, 0, 0.08)',
          },
          Timeline: {
            dotBg: '#4a8b8d',
            dotBorderWidth: 2,
            itemPaddingBottom: 20,
            tailColor: 'rgba(255, 255, 255, 0.2)',
            tailWidth: 2,
          },
          Menu: {
            darkItemBg: 'transparent',
            darkSubMenuItemBg: 'rgba(0, 0, 0, 0.2)',
          },
        },
      }}
    >
      <NavigationBar />
      <Outlet />
      <Footer />
      <ScrollToTopButton />
    </ConfigProvider>
  );
};
