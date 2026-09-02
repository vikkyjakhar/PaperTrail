import { createBrowserRouter, redirect } from 'react-router';
import Root from './layouts/Root';
import Landing from './pages/Landing';
import ToolPage from './pages/ToolPage';
import AIToolPage from './pages/AIToolPage';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: Landing },
      { path: 'tools/:toolId', Component: ToolPage },
      { path: 'ai/:toolId', Component: AIToolPage },
      { path: '*', loader: () => redirect('/') },
    ],
  },
]);
