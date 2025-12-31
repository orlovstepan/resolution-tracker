import type { User } from '../types';
import styles from './Header.module.scss';
import logo from '../assets/logo.png';

interface HeaderProps {
  user: User;
  onLogout: () => void;
}

export function Header({ user, onLogout }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <img src={logo} alt="Resolution Tracker" className={styles.logo} />
          <h1 className={styles.title}>Resolution Tracker</h1>
          <span className={styles.year}>2026</span>
        </div>
        
        <div className={styles.user}>
          <span className={styles.email}>{user.email}</span>
          <button onClick={onLogout} className="btn-ghost btn-small">
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}

