import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
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
import Equipos from './pages/equipos';
import AdminUsers from './pages/admin/users';
import ClubPublicPage from './pages/public/ClubPublicPage';
import { useAuth } from './context/AuthContext';
import { usePageTracking } from './hooks/usePageTracking';
import './App.css';

type NavKey = 'canchas' | 'jugadores' | 'torneos' | 'profesores' | 'equipos';

// Paths that belong to the authenticated app — everything else is a public club page
const PROTECTED_PREFIXES = ['/players', '/tournaments', '/profile', '/settings', '/profesores', '/equipos', '/stats', '/logout', '/admin'];
function isPublicClubPath(pathname: string): boolean {
  if (pathname === '/') return false;
  return !PROTECTED_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'));
}

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

function ImpersonationBanner() {
  const { user, stopImpersonating } = useAuth();
  return (
    <Box sx={{
      bgcolor: "#F5AD27",
      px: { xs: 2, md: 3 },
      py: 0.75,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 1,
      flexShrink: 0,
    }}>
      <Typography variant="caption" fontWeight={700} sx={{ color: "#111" }}>
        Accediendo al portal de <strong>@{user?.username}</strong> como superadmin
      </Typography>
      <Button
        size="small"
        startIcon={<ExitToAppIcon sx={{ fontSize: 15 }} />}
        onClick={stopImpersonating}
        sx={{ textTransform: "none", fontWeight: 700, color: "#111", fontSize: "0.75rem", py: 0.25, px: 1.25, minWidth: 0, bgcolor: "rgba(0,0,0,0.1)", borderRadius: 1.5, "&:hover": { bgcolor: "rgba(0,0,0,0.18)" } }}
      >
        Salir
      </Button>
    </Box>
  );
}

function ProtectedApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isImpersonating } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (user?.role === "superadmin") return <SuperAdminApp />;

  // Public club pages: render without sidebar, user menu, or locked-height layout
  if (isPublicClubPath(location.pathname)) {
    return (
      <>
        <Header publicMode />
        <Routes>
          <Route path="/:username" element={<ClubPublicPage />} />
          <Route path="/:username/canchas" element={<ClubPublicPage />} />
          <Route path="/:username/torneos" element={<ClubPublicPage />} />
          <Route path="/:username/profesores" element={<ClubPublicPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </>
    );
  }

  const activeSection: NavKey =
    location.pathname.startsWith('/players') ? 'jugadores' :
    location.pathname.startsWith('/tournaments') ? 'torneos' :
    location.pathname.startsWith('/profesores') ? 'profesores' :
    location.pathname.startsWith('/equipos') ? 'equipos' :
    'canchas';

  const handleSelect = (key: NavKey) => {
    if (key === 'canchas') navigate('/');
    else if (key === 'jugadores') navigate('/players');
    else if (key === 'torneos') navigate('/tournaments');
    else if (key === 'profesores') navigate('/profesores');
    else if (key === 'equipos') navigate('/equipos');
  };

  return (
    <div className="root-layout">
      <Header onMenuClick={() => setMobileOpen(true)} />
      {isImpersonating && <ImpersonationBanner />}
      <div className="body-area">
        <Sidebar
          initialActive={activeSection}
          onSelect={handleSelect}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
          sports={user?.sports ?? []}
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
            <Route path="/equipos" element={<Equipos />} />
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
  usePageTracking();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/"          element={<Landing />} />
        <Route path="/login"     element={<Login />} />
        <Route path="/register"  element={<Register />} />
        <Route path="/:username" element={<><Header publicMode /><ClubPublicPage /></>} />
        <Route path="/:username/canchas" element={<><Header publicMode /><ClubPublicPage /></>} />
        <Route path="/:username/torneos" element={<><Header publicMode /><ClubPublicPage /></>} />
        <Route path="/:username/profesores" element={<><Header publicMode /><ClubPublicPage /></>} />
        <Route path="*"          element={<Navigate to="/login" replace />} />
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
