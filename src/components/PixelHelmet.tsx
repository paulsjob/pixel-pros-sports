import React, { useState } from 'react';

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
    KANSAS_CITY: 'KC',
    KANSASCITY: 'KC',
    LAS_VEGAS: 'LV',
    LASVEGAS: 'LV',
    LOS_ANGELES_CHARGERS: 'LAC',
    LOS_ANGELES_RAMS: 'LAR',
    MIAMI: 'MIA',
    MINNESOTA: 'MIN',
    NEW_ENGLAND: 'NE',
    NEWENGLAND: 'NE',
    NEW_ORLEANS: 'NO',
    NEWORLEANS: 'NO',
    NEW_YORK_GIANTS: 'NYG',
    NEW_YORK_JETS: 'NYJ',
    PHILADELPHIA: 'PHI',
    PITTSBURGH: 'PIT',
    SAN_FRANCISCO: 'SF',
    SANFRANCISCO: 'SF',
    SEATTLE: 'SEA',
    TAMPA_BAY: 'TB',
    TAMPABAY: 'TB',
    TENNESSEE: 'TEN',
    WASHINGTON: 'WSH',
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

  if (hasError) {
    // Fallback badge if image fails to load
    return (
      <span
        style={{ width: pixelSize, height: pixelSize }}
        className={`inline-flex items-center justify-center font-pixel text-[9px] font-bold bg-[#12579b] text-[#fae5b8] rounded-xs border border-[#38bdf8]/50 ${className}`}
      >
        {normalized.slice(0, 3)}
      </span>
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
        imageRendering: 'pixelated',
      }}
      className={`select-none shrink-0 inline-block drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)] ${className}`}
      loading="lazy"
    />
  );
};
