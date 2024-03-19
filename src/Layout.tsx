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
          colorPrimary: '#6f9b9c',
          colorInfo: '#96dbe6',
          colorSuccess: '#b1dde6',
          colorWarning: '#fadb14',
          colorError: '#f5222d',

          // Alias Token
          colorBgContainer: '#ffffff',
          colorTextBase: '#333333',
          borderRadius: 8,

          colorLink: '#6f9b9c',
          colorBorder: '#96dbe6',
        },
        components: {
          Timeline: {
            dotBg: '#6f9b9c',
            dotBorderWidth: 2,
            itemPaddingBottom: 20,
            tailColor: 'rgba(255, 255, 255, 0.2)',
            tailWidth: 2,
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
