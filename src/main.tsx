import 'antd/dist/reset.css';
import { RouteRecord, ViteReactSSG } from 'vite-react-ssg';
import getStyledComponentsCollector from 'vite-react-ssg/style-collectors/styled-components';
import { lazy } from 'react';

import { Layout } from './Layout';

const routes: RouteRecord[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, Component: lazy(() => import('./pages/HomePage')) },
    ],
  },
  { path: '*', Component: lazy(() => import('./pages/NotFoundPage')) },
];

export const createRoot = ViteReactSSG(
  // react-router-dom data routes
  { routes },
  // function to have custom setups
  // ({ router, routes, isClient, initialState }) => {
  //   // do something.
  // },
  () => {},

  { getStyleCollector: getStyledComponentsCollector },
);

createRoot();
