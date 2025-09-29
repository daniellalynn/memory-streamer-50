import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App.tsx'
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import Auth from './pages/Auth';
import './index.css'

const router = createBrowserRouter([
  {
    path: '/auth',
    element: <Auth />,
  },
  {
    path: '/',
    element: <App />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Index />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(<RouterProvider router={router} />);
