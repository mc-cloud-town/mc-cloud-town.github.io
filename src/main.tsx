import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { Layout } from './Layout';
import NotFoundPage from './pages/NotFoundPage';
import HomePage from './pages/HomePage';
import MemberPage from './pages/Members';
import SurvivalProgress from './pages/SurvivalProgress.tsx';
import OpenSourcePage from './pages/OpenSource.tsx';
import JoinServer from './pages/JoinServer.tsx';
import Partner from './pages/Partner.tsx';
import Donate from './pages/Donate.tsx';

import initI18n from './i18n/i18nConfig';
import 'antd/dist/reset.css';
import 'react-lazy-load-image-component/src/effects/blur.css';

initI18n();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="home" element={<HomePage />} />
          <Route path="join" element={<JoinServer />} />
          <Route path="survival" element={<SurvivalProgress />} />
          <Route path="member" element={<MemberPage />} />
          <Route path="openSource" element={<OpenSourcePage />} />
          <Route path="collaborative" element={<Partner />} />
          <Route path="partner" element={<Partner />} />
          <Route path="donate" element={<Donate />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
