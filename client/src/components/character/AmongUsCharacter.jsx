export default function AmongUsCharacter({ color, className = 'w-24 h-24' }) {
  return (
    <svg viewBox="0 0 100 120" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="15" y="45" width="20" height="45" rx="10" fill={color} stroke="black" strokeWidth="5" />
      <path d="M30 20 C 30 5, 70 5, 70 20 L 75 90 C 75 105, 60 105, 60 90 L 60 110 C 60 115, 45 115, 45 110 L 45 90 L 35 90 L 35 110 C 35 115, 20 115, 20 110 L 20 20 Z" fill={color} stroke="black" strokeWidth="5" />
      <rect x="45" y="30" width="35" height="20" rx="10" fill="#a1d6e2" stroke="black" strokeWidth="5" />
      <path d="M50 35 Q 60 32, 70 35" fill="none" stroke="white" strokeWidth="2" opacity="0.6" />
    </svg>
  );
}
