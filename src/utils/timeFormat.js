export function formatTime(milliseconds) {
  const safeMilliseconds = Math.max(0, Math.floor(milliseconds || 0));
  const totalSeconds = Math.floor(safeMilliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((safeMilliseconds % 1000) / 100);

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${tenths}`;
}
