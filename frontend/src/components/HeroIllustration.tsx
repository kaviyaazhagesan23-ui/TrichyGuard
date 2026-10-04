import { motion } from 'framer-motion';

/** Decorative smart-city illustration: ambulance on a road heading to a hospital. */
export default function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 460 320"
      className={className}
      role="img"
      aria-label="Illustration of an ambulance driving along a city road toward a hospital"
    >
      <defs>
        <radialGradient id="hero-glow" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#8AAAFF" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#8AAAFF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hero-road" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#35426A" />
          <stop offset="100%" stopColor="#16204A" />
        </linearGradient>
        <linearGradient id="hero-hospital" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E6EEFF" />
        </linearGradient>
      </defs>

      <circle cx="240" cy="140" r="150" fill="url(#hero-glow)" />

      {/* skyline */}
      <g opacity="0.9">
        <rect x="14" y="150" width="46" height="90" rx="8" fill="#DCE6FF" />
        <rect x="66" y="120" width="40" height="120" rx="8" fill="#BACDFF" />
        <rect x="112" y="165" width="36" height="75" rx="8" fill="#DCE6FF" />
        {[0, 1, 2].map((i) => (
          <rect key={i} x="76" y={134 + i * 26} width="20" height="10" rx="3" fill="#fff" opacity="0.85" />
        ))}
      </g>

      {/* hospital */}
      <g>
        <rect x="300" y="78" width="128" height="162" rx="18" fill="url(#hero-hospital)" stroke="#BACDFF" strokeWidth="2" />
        <rect x="334" y="48" width="60" height="44" rx="12" fill="#2F5BFF" />
        <path d="M364 57v26M351 70h26" stroke="#fff" strokeWidth="7" strokeLinecap="round" />
        {[0, 1, 2].map((r) =>
          [0, 1, 2].map((c) => (
            <rect key={`${r}-${c}`} x={318 + c * 34} y={112 + r * 36} width="22" height="20" rx="5" fill={(r + c) % 2 === 0 ? '#BACDFF' : '#8AAAFF'} />
          )),
        )}
        <rect x="350" y="200" width="28" height="40" rx="8" fill="#2F5BFF" />
      </g>

      {/* road */}
      <rect x="0" y="236" width="460" height="68" rx="20" fill="url(#hero-road)" />
      <line x1="10" y1="270" x2="450" y2="270" stroke="#fff" strokeWidth="4" strokeDasharray="28 28" strokeLinecap="round" className="road-dash" opacity="0.85" />

      {/* ambulance */}
      <motion.g animate={{ y: [0, -3, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}>
        <rect x="100" y="182" width="132" height="62" rx="16" fill="#fff" stroke="#DCE6FF" strokeWidth="2" />
        <path d="M196 182h14a22 22 0 0 1 20 13l6 14v35h-40z" fill="#EEF3FF" />
        <path d="M206 192h8a12 12 0 0 1 11 7l4 9h-23z" fill="#8AAAFF" opacity="0.8" />
        <rect x="100" y="218" width="132" height="10" fill="#2F5BFF" />
        <circle cx="150" cy="204" r="17" fill="#FF5A4D" />
        <path d="M150 195v18M141 204h18" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
        <rect x="140" y="170" width="34" height="12" rx="6" fill="#7C4DFF" />
        <rect x="140" y="170" width="17" height="12" rx="6" fill="#FF5A4D" className="animate-blink" />
        <circle cx="136" cy="246" r="14" fill="#16204A" />
        <circle cx="136" cy="246" r="6" fill="#DCE6FF" />
        <circle cx="206" cy="246" r="14" fill="#16204A" />
        <circle cx="206" cy="246" r="6" fill="#DCE6FF" />
      </motion.g>

      {/* floating pins */}
      <motion.g animate={{ y: [0, -9, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}>
        <path d="M84 70c-14 0-25 11-25 25 0 19 25 40 25 40s25-21 25-40c0-14-11-25-25-25z" fill="#FF5A4D" />
        <circle cx="84" cy="95" r="9" fill="#fff" />
      </motion.g>
      <motion.g animate={{ y: [0, -7, 0] }} transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}>
        <path d="M244 36c-10 0-18 8-18 18 0 14 18 29 18 29s18-15 18-29c0-10-8-18-18-18z" fill="#14B8A6" />
        <circle cx="244" cy="54" r="6" fill="#fff" />
      </motion.g>
      <circle cx="84" cy="150" r="10" fill="none" stroke="#FF5A4D" strokeWidth="2" className="pulse-ring" />
    </svg>
  );
}
