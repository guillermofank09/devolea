import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Header from './components/common/header';
import Sidebar from './components/sidebar';
import Courts from './pages/courts';
import Players from './pages/players';
import Tournaments from './pages/tournaments';
import TournamentDetail from './pages/tournaments/TournamentDetail';
import Profile from './pages/profile';
import Settings from './pages/settings';
import Logout from './pages/logout';
import Login from './pages/login';
import Register from './pages/register';
import Stats from './pages/stats';
import Profesores from './pages/profesores';
import { useAuth } from './context/AuthContext';
import './App.css';

type NavKey = 'canchas' | 'jugadores' | 'torneos' | 'profesores';

function ProtectedApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeSection: NavKey =
    location.pathname.startsWith('/players') ? 'jugadores' :
    location.pathname.startsWith('/tournaments') ? 'torneos' :
    location.pathname.startsWith('/profesores') ? 'profesores' :
    'canchas';

  const handleSelect = (key: NavKey) => {
    if (key === 'canchas') navigate('/');
    else if (key === 'jugadores') navigate('/players');
    else if (key === 'torneos') navigate('/tournaments');
    else if (key === 'profesores') navigate('/profesores');
  };

  return (
    <div className="root-layout">
      <Header onMenuClick={() => setMobileOpen(true)} />
      <div className="body-area">
        <Sidebar
          initialActive={activeSection}
          onSelect={handleSelect}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
        {mobileOpen && (
          <div className="sb-backdrop" onClick={() => setMobileOpen(false)} />
        )}
        <main className="page-main">
          <Routes>
            <Route path="/" element={<Courts />} />
            <Route path="/players" element={<Players />} />
            <Route path="/tournaments" element={<Tournaments />} />
            <Route path="/tournaments/:id" element={<TournamentDetail />} />
            <Route path="/profile"  element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profesores" element={<Profesores />} />
            <Route path="/stats"    element={<Stats />} />
            <Route path="/logout"   element={<Logout />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login"    element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} />
      <Route
        path="/*"
        element={isAuthenticated ? <ProtectedApp /> : <Navigate to="/login" replace />}
      />
    </Routes>
  );
}

export default App;
