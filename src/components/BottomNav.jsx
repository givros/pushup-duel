const navItems = [
  ['sports_esports', 'Arène'],
  ['groups', 'Social'],
  ['leaderboard', 'Suivi'],
  ['shopping_cart', 'Boutique']
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Navigation principale">
      {navItems.map(([icon, label], index) => (
        <button className={`nav-item ${index === 0 ? 'active' : ''}`} type="button" key={label}>
          <span className={`material-symbols-outlined ${index === 0 ? 'filled' : ''}`}>{icon}</span>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
