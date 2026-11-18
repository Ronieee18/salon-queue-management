export default function BarberAvatar({ barber, size = 'md' }) {
  const sizes = {
    sm: 'w-9 h-9 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
    tv: 'w-20 h-20 text-2xl',
  };

  const accent = barber?.accent || '#D4A017';
  const initials = barber?.initials || (barber?.name || 'B').slice(0, 2).toUpperCase();

  return (
    <div
      className={`${sizes[size] || sizes.md} rounded-2xl font-extrabold flex items-center justify-center shrink-0 border-2 shadow-inner select-none`}
      style={{
        backgroundColor: `${accent}22`,
        borderColor: `${accent}88`,
        color: accent,
      }}
    >
      {initials}
    </div>
  );
}
