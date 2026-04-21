import Icon from './Icon.jsx';

const navItems = [
  { id: 'home', icon: 'sports_esports', label: 'Arène' },
  { id: 'challenges', icon: 'flag', label: 'Défis' },
  { id: 'settings', icon: 'leaderboard', label: 'Suivi' },
  { id: 'shop', icon: 'shopping_cart', label: 'Boutique', disabled: true }
];

export default function BottomNav({ active = 'home', onNavigate }) {
  return (
    <nav className="bottom-nav" aria-label="Navigation principale">
      {navItems.map((item) => (
        <button
          className={`nav-item ${active === item.id ? 'active' : ''}`}
          type="button"
          key={item.id}
          onClick={() => onNavigate?.(item.id)}
          disabled={item.disabled}
        >
          <Icon name={item.icon} className={active === item.id ? 'filled' : ''} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
