import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import '@fontsource/instrument-serif/latin-400.css';
import '@fontsource/instrument-serif/latin-400-italic.css';
import '@fontsource-variable/manrope/wght.css';
// Reference design type (applied through the .ref scope in brand.css)
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource/cormorant-garamond/latin-600.css';
import '@fontsource/cormorant-garamond/latin-700.css';
import '@fontsource/cormorant-garamond/latin-400-italic.css';
import '@fontsource-variable/plus-jakarta-sans/wght.css';
import './styles/index.css';
import { routes } from './app/routes';

// Remove the pre-rendered metadata from the HTML file; each page renders its own via <Seo>,
// so this avoids duplicate titles and descriptions.
document.head.querySelectorAll('[data-static]').forEach((element) => element.remove());

const router = createBrowserRouter(routes);
const root = document.getElementById('root');

if (!root) throw new Error('Root element #root not found');

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
