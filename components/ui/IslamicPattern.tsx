interface IslamicPatternProps {
  className?: string;
}

export function IslamicPattern({ className = '' }: IslamicPatternProps) {
  return (
    <svg
      className={`absolute inset-0 w-full h-full ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true">
      <defs>
        <pattern id="islamic-pattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          {/* Geometric Islamic star pattern */}
          <g fill="none" stroke="#c9a84c" strokeWidth="0.5">
            {/* 8-pointed star */}
            <polygon points="40,5 47,25 67,25 52,38 58,58 40,47 22,58 28,38 13,25 33,25" />
            {/* Outer octagon */}
            <polygon points="40,0 55,10 70,10 80,25 80,40 70,55 55,70 40,80 25,70 10,55 0,40 0,25 10,10 25,10" />
            {/* Inner details */}
            <line x1="40" y1="0" x2="40" y2="80" />
            <line x1="0" y1="40" x2="80" y2="40" />
            <line x1="0" y1="0" x2="80" y2="80" />
            <line x1="80" y1="0" x2="0" y2="80" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#islamic-pattern)" />
    </svg>
  );
}
