import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import NotFoundPage from '@/pages/NotFoundPage';
import { ConfigProvider } from 'antd';

const App = () => (
  <>
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
          borderRadius: 4,

          colorLink: '#6f9b9c',
          colorBorder: '#96dbe6',
        }
      }}
    >
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </ConfigProvider>
  </>
);

export default App;
