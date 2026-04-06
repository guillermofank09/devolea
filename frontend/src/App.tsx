import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Landing from './pages/landing';
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
import AdminUsers from './pages/admin/users';
import { useAuth } from './context/AuthContext';
import './App.css';

type NavKey = 'canchas' | 'jugadores' | 'torneos' | 'profesores';

function SuperAdminApp() {
  const { user } = useAuth();
  if (user?.role !== "superadmin") return <Navigate to="/" replace />;
  return (
    <div className="root-layout">
      <Header onMenuClick={() => {}} />
      <div className="body-area">
        <main className="page-main">
          <Routes>
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="*" element={<Navigate to="/admin/users" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function ProtectedApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (user?.role === "superadmin") return <SuperAdminApp />;

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

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/"         element={<Landing />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*"         element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login"    element={<Navigate to="/" replace />} />
      <Route path="/register" element={<Navigate to="/" replace />} />
      <Route path="/*"        element={<ProtectedApp />} />
    </Routes>
  );
}

export default App;
