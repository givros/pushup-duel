import Icon from './Icon.jsx';

const navItems = [
  { id: 'shop', icon: 'shopping_cart', label: 'Boutique', disabled: true },
  { id: 'stats', icon: 'leaderboard', label: 'Stats' },
  { id: 'home', icon: 'sports_esports', label: 'Duel', featured: true },
  { id: 'history', icon: 'flag', label: 'Historique' },
  { id: 'profile', icon: 'person', label: 'Profil' }
];

export default function BottomNav({ active = 'home', onNavigate }) {
  return (
    <nav className="bottom-nav" aria-label="Navigation principale">
      {navItems.map((item) => (
        <button
          className={`nav-item ${item.featured ? 'featured' : ''} ${active === item.id ? 'active' : ''}`}
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
