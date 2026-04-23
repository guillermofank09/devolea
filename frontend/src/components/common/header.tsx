import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import "../../styles/Header.css";
import {
  Avatar,
  Box,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { fetchProfile } from "../../api/profileService";

interface Props {
  onMenuClick?: () => void;
  publicMode?: boolean;
}

const Header = ({ onMenuClick, publicMode }: Props) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const isSuperAdmin = user?.role === "superadmin";
  const open = Boolean(anchor);

  const initials = user?.name
    ? user.name.split(" ").slice(0, 2).map((w) => w[0].toUpperCase()).join("")
    : null;

  const { data: profile } = useQuery({
    queryKey: ["clubProfile"],
    queryFn: fetchProfile,
    enabled: !!user && !publicMode && user.role !== "superadmin",
    staleTime: 30_000,
  });
  const clubLogoSrc = profile?.logoUrl || profile?.logoBase64 || undefined;

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchor(e.currentTarget);
  const handleClose = () => setAnchor(null);

  const go = (path: string) => {
    navigate(path);
    handleClose();
  };

  return (
    <header className="header">
      <div className="header-inner">
        {/* Hamburger — mobile only, hidden in public mode */}
        {!publicMode && (
          <button
            className="header-menu-btn"
            onClick={onMenuClick}
            aria-label="Abrir menú"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="3" y1="6"  x2="21" y2="6"  />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}

        {/* Logo */}
        <img src={logo} alt="Devolea" className="header-logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }} />

        {/* Push user menu to the right */}
        <div className="header-spacer" />

        {/* User avatar + dropdown — hidden in public mode */}
        {!publicMode && (
          <Tooltip title="Mi cuenta">
            <IconButton id="tour-account-btn" onClick={handleOpen} size="small" sx={{ p: 0.5 }} aria-label="Mi cuenta">
              <Avatar
                src={clubLogoSrc}
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: "#111111",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  border: open ? "2px solid #F5AD27" : "2px solid transparent",
                  transition: "border-color 150ms ease",
                  "& img": { objectFit: "contain", p: "3px" },
                }}
              >
                {initials ?? <AccountCircleIcon sx={{ fontSize: 20, color: "#e0e0e0" }} />}
              </Avatar>
            </IconButton>
          </Tooltip>
        )}

        {/* Dropdown menu — only in authenticated mode */}
        {!publicMode && <Menu
          anchorEl={anchor}
          open={open}
          onClose={handleClose}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          slotProps={{
            paper: {
              elevation: 4,
              sx: {
                mt: 1.5,
                minWidth: 210,
                borderRadius: 2,
                overflow: "visible",
                // Arrow pointing up toward the avatar
                "&::before": {
                  content: '""',
                  display: "block",
                  position: "absolute",
                  top: 0,
                  right: 16,
                  width: 10,
                  height: 10,
                  bgcolor: "background.paper",
                  transform: "translateY(-50%) rotate(45deg)",
                  zIndex: 0,
                  boxShadow: "-1px -1px 3px rgba(0,0,0,0.07)",
                },
              },
            },
          }}
        >
          {user && (
            <Box sx={{ px: 2, pt: 1.25, pb: 1 }}>
              <Typography variant="body2" fontWeight={700} noWrap>{user.name}</Typography>
              <Typography variant="caption" color="text.secondary" noWrap>@{user.username}</Typography>
            </Box>
          )}
          {user && <Divider sx={{ mb: 0.5 }} />}

          {isSuperAdmin ? (
            <MenuItem onClick={() => go("/admin/users")} sx={{ py: 1.25, px: 2, gap: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <PeopleOutlineIcon fontSize="small" />
              </ListItemIcon>
              <Typography variant="body2" fontWeight={500}>Gestión de usuarios</Typography>
            </MenuItem>
          ) : (
            <>
              <MenuItem onClick={() => go("/profile")} sx={{ py: 1.25, px: 2, gap: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <PersonOutlineIcon fontSize="small" />
                </ListItemIcon>
                <Typography variant="body2" fontWeight={500}>Mi Club</Typography>
              </MenuItem>

              <MenuItem onClick={() => go("/settings")} sx={{ py: 1.25, px: 2, gap: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <SettingsOutlinedIcon fontSize="small" />
                </ListItemIcon>
                <Typography variant="body2" fontWeight={500}>Ajustes</Typography>
              </MenuItem>

              {user?.username && (
                <MenuItem
                  component="a"
                  href={`/${user.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleClose}
                  sx={{ py: 1.25, px: 2, gap: 0.5 }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <OpenInNewIcon fontSize="small" />
                  </ListItemIcon>
                  <Typography variant="body2" fontWeight={500}>Ver página pública</Typography>
                </MenuItem>
              )}
            </>
          )}

          <Divider sx={{ my: 0.5 }} />

          <MenuItem
            onClick={() => { handleClose(); logout(); navigate("/login", { replace: true }); }}
            sx={{ py: 1.25, px: 2, gap: 0.5, color: "error.main" }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <LogoutIcon fontSize="small" color="error" />
            </ListItemIcon>
            <Typography variant="body2" fontWeight={500} color="error">
              Cerrar Sesión
            </Typography>
          </MenuItem>
        </Menu>}
      </div>
    </header>
  );
};

export default Header;
