import React, { useState } from 'react';
import { getTeamColors } from '../utils/teamData';

interface PixelHelmetProps {
  teamCode?: string;
  teamName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | number;
  className?: string;
  alt?: string;
}

const SIZE_MAP = {
  xs: 18,
  sm: 24,
  md: 32,
  lg: 44,
};

export const normalizeTeamCode = (code?: string): string => {
  if (!code) return '';
  const clean = code.trim().toUpperCase();
  const map: Record<string, string> = {
    ARIZONA: 'ARI',
    ATLANTA: 'ATL',
    BALTIMORE: 'BAL',
    BUFFALO: 'BUF',
    CAROLINA: 'CAR',
    CHICAGO: 'CHI',
    CINCINNATI: 'CIN',
    CLEVELAND: 'CLE',
    DALLAS: 'DAL',
    DENVER: 'DEN',
    DETROIT: 'DET',
    GREEN_BAY: 'GB',
    GREENBAY: 'GB',
    HOUSTON: 'HOU',
    INDIANAPOLIS: 'IND',
    JACKSONVILLE: 'JAX',
    JAC: 'JAX',
    KANSAS_CITY: 'KC',
    KANSASCITY: 'KC',
    LAS_VEGAS: 'LV',
    LASVEGAS: 'LV',
    LAS: 'LV',
    OAK: 'LV',
    OAKLAND: 'LV',
    LOS_ANGELES_CHARGERS: 'LAC',
    CHARGERS: 'LAC',
    LOS_ANGELES_RAMS: 'LAR',
    RAMS: 'LAR',
    LA: 'LAR',
    LAR: 'LAR',
    LAC: 'LAC',
    MIAMI: 'MIA',
    MINNESOTA: 'MIN',
    NEW_ENGLAND: 'NE',
    NEWENGLAND: 'NE',
    PATRIOTS: 'NE',
    NEW_ORLEANS: 'NO',
    NEWORLEANS: 'NO',
    SAINTS: 'NO',
    NEW_YORK_GIANTS: 'NYG',
    GIANTS: 'NYG',
    NEW_YORK_JETS: 'NYJ',
    JETS: 'NYJ',
    PHILADELPHIA: 'PHI',
    EAGLES: 'PHI',
    PITTSBURGH: 'PIT',
    STEELERS: 'PIT',
    SAN_FRANCISCO: 'SF',
    SANFRANCISCO: 'SF',
    SEATTLE: 'SEA',
    SEAHAWKS: 'SEA',
    TAMPA_BAY: 'TB',
    TAMPABAY: 'TB',
    BUCCANEERS: 'TB',
    TENNESSEE: 'TEN',
    TITANS: 'TEN',
    WASHINGTON: 'WSH',
    COMMANDERS: 'WSH',
    WSH: 'WSH',
    WAS: 'WSH',
  };
  return map[clean] || clean;
};

export const PixelHelmet: React.FC<PixelHelmetProps> = ({
  teamCode = '',
  teamName = '',
  size = 'md',
  className = '',
  alt,
}) => {
  const [hasError, setHasError] = useState(false);
  const normalized = normalizeTeamCode(teamCode || teamName);
  const pixelSize = typeof size === 'number' ? size : SIZE_MAP[size] || 32;

  if (!normalized) return null;

  const colors = getTeamColors(normalized);

  if (hasError) {
    // Authentic SVG Football Helmet fallback styled with the team's official colors
    return (
      <svg
        width={pixelSize}
        height={pixelSize}
        viewBox="0 0 32 32"
        className={`select-none shrink-0 inline-block drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] ${className}`}
        aria-label={alt || `${normalized} Helmet`}
      >
        {/* Helmet Outer Shell */}
        <path
          d="M 6 18 C 6 10 11 5 20 5 C 27 5 29 10 29 17 C 29 23 26 26 21 26 L 12 26 C 8 26 6 22 6 18 Z"
          fill={colors.helmet}
          stroke="#000000"
          strokeWidth="1.5"
        />
        {/* Authentic Team Stripe */}
        <path
          d="M 12 5.5 C 17 5.5 22 7.5 25 11"
          fill="none"
          stroke={colors.stripe || '#ffffff'}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Facemask Visor & Bars */}
        <path
          d="M 21 16 L 28 17 M 21 19 L 27 21 M 21 23 L 26 24"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* Earhole */}
        <circle cx="15" cy="18" r="2" fill="#1e293b" />
      </svg>
    );
  }

  return (
    <img
      src={`/helmets/${normalized}.png`}
      alt={alt || `${normalized} Helmet`}
      width={pixelSize}
      height={pixelSize}
      onError={() => setHasError(true)}
      style={{
        width: `${pixelSize}px`,
        height: `${pixelSize}px`,
        objectFit: 'contain',
        imageRendering: 'pixelated',
      }}
      className={`select-none shrink-0 inline-block drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] ${className}`}
      loading="lazy"
    />
  );
};
