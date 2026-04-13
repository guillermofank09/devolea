import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { initAnalytics } from './lib/analytics';

initAnalytics();
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext';
import axios from 'axios';

axios.interceptors.request.use(config => {
  const token = localStorage.getItem('devolea_token');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </AuthProvider>
    </BrowserRouter>,
);
