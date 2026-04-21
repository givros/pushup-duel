const icons = {
  arrow_back: <path d="M20 11v2H8.8l4.2 4.2-1.4 1.4L5 12l6.6-6.6L13 6.8 8.8 11H20Z" />,
  arrow_downward: (
    <path d="M11 4h2v11.2l4.2-4.2 1.4 1.4L12 19l-6.6-6.6L6.8 11l4.2 4.2V4Z" />
  ),
  arrow_upward: (
    <path d="M11 20V8.8L6.8 13 5.4 11.6 12 5l6.6 6.6-1.4 1.4L13 8.8V20h-2Z" />
  ),
  bolt: <path d="m10.2 21 1.2-7.3H7.2L13.8 3l-1.2 7.3h4.2L10.2 21Z" />,
  center_focus_strong: (
    <>
      <path d="M5 9H3V4.5C3 3.7 3.7 3 4.5 3H9v2H5v4Zm16 0h-2V5h-4V3h4.5c.8 0 1.5.7 1.5 1.5V9ZM9 21H4.5C3.7 21 3 20.3 3 19.5V15h2v4h4v2Zm10.5 0H15v-2h4v-4h2v4.5c0 .8-.7 1.5-1.5 1.5Z" />
      <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" />
    </>
  ),
  check_circle: (
    <path d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20Zm-1.1-6 6-6-1.4-1.4-4.6 4.6-2.4-2.4L7.1 12l3.8 4Z" />
  ),
  close: <path d="m6.4 19-1.4-1.4 5.6-5.6L5 6.4 6.4 5l5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19Z" />,
  delete: (
    <>
      <path d="M7 21c-1.1 0-2-.9-2-2V7h14v12c0 1.1-.9 2-2 2H7Zm2-16V3h6v2h5v2H4V5h5Z" />
    </>
  ),
  flag: <path d="M5 21V4h10.8l.4 2H20v9h-6.8l-.4-2H7v8H5Z" />,
  groups: (
    <>
      <path d="M8.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7 0a2.7 2.7 0 1 0 0-5.4 2.7 2.7 0 0 0 0 5.4Z" />
      <path d="M2.5 19v-1.2c0-2.6 3.9-4 6-4s6 1.4 6 4V19h-12Zm12.3 0v-1.4c0-1.4-.6-2.5-1.6-3.4.8-.3 1.6-.4 2.3-.4 2 0 6 1.3 6 3.8V19h-6.7Z" />
    </>
  ),
  leaderboard: (
    <>
      <path d="M4 11h4v9H4v-9Zm6-7h4v16h-4V4Zm6 5h4v11h-4V9Z" />
    </>
  ),
  pause: <path d="M7 5h4v14H7V5Zm6 0h4v14h-4V5Z" />,
  payments: (
    <>
      <path d="M3 6h18v12H3V6Zm2 3v6h14V9H5Z" />
      <path d="M12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
    </>
  ),
  person: (
    <>
      <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z" />
      <path d="M4 21v-1.4c0-3.2 5.3-5 8-5s8 1.8 8 5V21H4Z" />
    </>
  ),
  play_arrow: <path d="M8 5v14l11-7L8 5Z" />,
  radio_button_checked: (
    <>
      <path d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20Zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
      <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
    </>
  ),
  shopping_cart: (
    <>
      <path d="M7.2 18.5a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6Zm10 0a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6Z" />
      <path d="M5.4 5 7 14h10.2l2.4-7H7.1L6.7 4H3V2h5.4L8.8 5h12l-3.2 11H5.4L3.8 5h1.6Z" />
    </>
  ),
  sports_esports: (
    <>
      <path d="M7.5 8h9A4.5 4.5 0 0 1 21 12.5V17a3 3 0 0 1-5.2 2l-1.7-1.8H9.9L8.2 19A3 3 0 0 1 3 17v-4.5A4.5 4.5 0 0 1 7.5 8Z" />
      <path d="M8 11v2H6v2h2v2h2v-2h2v-2h-2v-2H8Zm7.6 2.2a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm2.6 2.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" fill="#0b1326" />
    </>
  ),
  star: <path d="m12 2 2.8 6 6.5.8-4.8 4.5 1.3 6.5L12 16.6l-5.8 3.2 1.3-6.5-4.8-4.5 6.5-.8L12 2Z" />,
  sync: (
    <path d="M12 6V3l4 4-4 4V8a4 4 0 0 0-3.7 2.5L6.5 9.7A6 6 0 0 1 12 6Zm0 10a4 4 0 0 0 3.7-2.5l1.8.8A6 6 0 0 1 12 18v3l-4-4 4-4v3Z" />
  ),
  timer: (
    <>
      <path d="M10 2h4v2h-4V2Zm1 8h2v5h-2v-5Z" />
      <path d="M12 22a8 8 0 1 1 5.7-13.6l1.4-1.4 1.4 1.4-1.5 1.5A8 8 0 0 1 12 22Zm0-2a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z" />
    </>
  ),
  trending_up: <path d="m4 17 5.7-5.7 3.6 3.6L20 8.2V13h2V5h-8v2h4.8l-5.5 5.5-3.6-3.6L2.6 16 4 17Z" />,
  videocam: <path d="M4 6h10a2 2 0 0 1 2 2v1.8L21 7v10l-5-2.8V16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />
};

export default function Icon({ name, className = '', title }) {
  return (
    <svg
      aria-hidden={title ? undefined : 'true'}
      aria-label={title}
      className={`app-icon ${className}`.trim()}
      focusable="false"
      viewBox="0 0 24 24"
    >
      {icons[name] || icons.radio_button_checked}
    </svg>
  );
}
