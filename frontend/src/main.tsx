import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import theme from './theme';
import { initAnalytics } from './lib/analytics';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { APIProvider } from '@vis.gl/react-google-maps';
import axios from 'axios';

axios.interceptors.request.use(config => {
  const token = localStorage.getItem('devolea_token');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

initAnalytics();

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <ToastProvider>
              <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ""} libraries={["places", "geocoding"]}>
                <App />
              </APIProvider>
            </ToastProvider>
          </QueryClientProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>,
);
