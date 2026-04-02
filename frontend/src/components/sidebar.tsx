import React, { useState, useEffect } from 'react';
import '../styles/Sidebar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import {
  faThLarge,
  faUserFriends,
  faTrophy,
  faChalkboardTeacher,
  faAngleLeft,
  faAngleRight,
} from '@fortawesome/free-solid-svg-icons';

type NavKey = 'canchas' | 'jugadores' | 'torneos' | 'profesores';

interface Props {
  initialActive?: NavKey;
  onSelect?: (key: NavKey) => void;
  defaultCollapsed?: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const NAV_ITEMS: { key: NavKey; label: string; icon: IconProp }[] = [
  { key: 'canchas',    label: 'Canchas',    icon: faThLarge            },
  { key: 'jugadores',  label: 'Jugadores',  icon: faUserFriends        },
  { key: 'profesores', label: 'Profesores', icon: faChalkboardTeacher  },
  { key: 'torneos',    label: 'Torneos',    icon: faTrophy             },
];

const Sidebar: React.FC<Props> = ({
  initialActive = 'canchas',
  onSelect,
  defaultCollapsed = false,
  mobileOpen = false,
  onMobileClose,
}) => {
  const [active, setActive] = useState<NavKey>(initialActive);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  useEffect(() => {
    setActive(initialActive);
  }, [initialActive]);

  function handleSelect(key: NavKey) {
    setActive(key);
    onSelect?.(key);
    onMobileClose?.();
  }

  const classes = [
    'sidebar',
    collapsed ? 'collapsed' : '',
    mobileOpen ? 'mobile-open' : '',
  ].filter(Boolean).join(' ');

  return (
    <aside className={classes} aria-label="Navegación principal">
      {/* Navigation items */}
      <nav className="sb-nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.key}
            className={`sb-item ${active === item.key ? 'active' : ''}`}
            onClick={() => handleSelect(item.key)}
            aria-current={active === item.key ? 'page' : undefined}
            title={collapsed ? item.label : undefined}
          >
            <span className="sb-item-icon" aria-hidden="true">
              <FontAwesomeIcon icon={item.icon} />
            </span>
            <span className="sb-item-label">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer with collapse toggle */}
      <div className="sb-footer">
        <button
          className="sb-collapse-btn"
          onClick={() => setCollapsed(c => !c)}
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          <FontAwesomeIcon icon={collapsed ? faAngleRight : faAngleLeft} />
          {!collapsed && <span className="sb-collapse-label">Colapsar</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
