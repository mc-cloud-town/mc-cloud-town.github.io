import 'antd/dist/reset.css';
import ReactDOM from 'react-dom/client';

import { Layout } from './Layout';
import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import NotFoundPage from './pages/NotFoundPage';
import HomePage from './pages/HomePage';
import MemberPage from './pages/Members';
import SurvivalProgress from './pages/SurvivalProgress.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="home" element={<HomePage />} />
          <Route path="survival" element={<SurvivalProgress />} />
          <Route path="member" element={<MemberPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
