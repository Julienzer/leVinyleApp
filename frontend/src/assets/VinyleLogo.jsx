export default function VinyleLogo({ className = "", size = 200 }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ animation: 'spin 2s linear infinite' }}
    >
      <defs>
        <radialGradient id="vinyleGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#CFFF04" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#2D0036" stopOpacity="0.1" />
        </radialGradient>
      </defs>
      <circle cx="28" cy="28" r="26" fill="url(#vinyleGlow)" stroke="#CFFF04" strokeWidth="2" />
      <circle cx="28" cy="28" r="18" fill="#18181b" stroke="#CFFF04" strokeWidth="1" />
      <circle cx="28" cy="28" r="4" fill="#CFFF04" />
      <circle cx="28" cy="28" r="2" fill="#2D0036" />
      <g stroke="#CFFF04" strokeWidth="0.5">
        <circle cx="28" cy="28" r="22" fill="none" />
        <circle cx="28" cy="28" r="14" fill="none" />
      </g>
      <style>{`
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </svg>
  );
} 