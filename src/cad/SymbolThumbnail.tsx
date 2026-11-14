import React from 'react';

interface SymbolThumbnailProps {
  svgType: string;
  color?: string;
  size?: number;
  className?: string;
  customIconUrl?: string;
}

export const SymbolThumbnail: React.FC<SymbolThumbnailProps> = ({
  svgType,
  color = '#2563eb',
  size = 36,
  className = '',
  customIconUrl
}) => {
  if (customIconUrl) {
    return (
      <img
        src={customIconUrl}
        alt="Custom icon"
        style={{ width: `${size}px`, height: `${size}px`, objectFit: 'contain' }}
        className={`rounded shrink-0 bg-slate-50 border border-slate-200 ${className}`}
      />
    );
  }

  const stroke = color;
  const strokeWidth = 1.6;

  // Отрисовка четких архитектурных SVG пиктограмм по ГОСТ
  switch (svgType) {
    // --- РОЗЕТКИ ---
    case 'socket_single':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <path d="M 6 22 A 12 12 0 0 1 30 22 Z" fill="#ffffff" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="18" y1="10" x2="18" y2="3" stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );

    case 'socket_double':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <path d="M 6 22 A 12 12 0 0 1 30 22 Z" fill="#ffffff" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="14" y1="12" x2="14" y2="3" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="22" y1="12" x2="22" y2="3" stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );

    case 'socket_triple':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <path d="M 5 22 A 13 13 0 0 1 31 22 Z" fill="#ffffff" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="11" y1="14" x2="11" y2="3" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="18" y1="9" x2="18" y2="3" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="25" y1="14" x2="25" y2="3" stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );

    case 'socket_ip44':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <path d="M 6 22 A 12 12 0 0 1 30 22 Z" fill={stroke} stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="18" y1="10" x2="18" y2="3" stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );

    case 'socket_cooktop':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <path d="M 6 22 A 12 12 0 0 1 30 22 Z" fill="#fee2e2" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="18" y1="10" x2="18" y2="3" stroke={stroke} strokeWidth={strokeWidth} />
          <text x="18" y="20" textAnchor="middle" fontSize="9" fontWeight="bold" fill={stroke}>П</text>
        </svg>
      );

    case 'socket_tv':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <path d="M 6 22 A 12 12 0 0 1 30 22 Z" fill="#ffffff" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="18" y1="10" x2="18" y2="3" stroke={stroke} strokeWidth={strokeWidth} />
          <text x="18" y="20" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill={stroke}>ТВ</text>
        </svg>
      );

    case 'socket_rj45':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <path d="M 6 22 A 12 12 0 0 1 30 22 Z" fill="#ffffff" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="18" y1="10" x2="18" y2="3" stroke={stroke} strokeWidth={strokeWidth} />
          <text x="18" y="20" textAnchor="middle" fontSize="6.5" fontWeight="bold" fill={stroke}>LAN</text>
        </svg>
      );

    case 'socket_usb':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <path d="M 6 22 A 12 12 0 0 1 30 22 Z" fill="#ffffff" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="18" y1="10" x2="18" y2="3" stroke={stroke} strokeWidth={strokeWidth} />
          <text x="18" y="20" textAnchor="middle" fontSize="6.5" fontWeight="bold" fill={stroke}>USB</text>
        </svg>
      );

    // --- ВЫКЛЮЧАТЕЛИ ---
    case 'switch_single':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <circle cx="18" cy="20" r="7" fill="#ffffff" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="18" y1="13" x2="18" y2="4" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="18" y1="4" x2="25" y2="4" stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );

    case 'switch_double':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <circle cx="18" cy="20" r="7" fill="#ffffff" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="18" y1="13" x2="18" y2="4" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="18" y1="4" x2="25" y2="4" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="18" y1="7" x2="25" y2="7" stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );

    case 'switch_pass':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <circle cx="18" cy="20" r="7" fill="#ffffff" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="18" y1="13" x2="18" y2="4" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="18" y1="4" x2="25" y2="4" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="18" y1="7" x2="11" y2="7" stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );

    case 'switch_cross':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <circle cx="18" cy="20" r="7" fill="#ffffff" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="18" y1="13" x2="18" y2="4" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="13" y1="4" x2="23" y2="4" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="13" y1="7" x2="23" y2="7" stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );

    case 'switch_dimmer':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <circle cx="18" cy="18" r="9" fill="#ffffff" stroke={stroke} strokeWidth={strokeWidth} />
          <path d="M 13 19 Q 18 11 23 19" stroke={stroke} strokeWidth={strokeWidth} />
          <polygon points="23,17 25,20 22,21" fill={stroke} />
        </svg>
      );

    case 'thermostat':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <rect x="7" y="7" width="22" height="22" rx="4" fill="#fff7ed" stroke={stroke} strokeWidth={strokeWidth} />
          <text x="18" y="19" textAnchor="middle" fontSize="10" fontWeight="bold" fill={stroke}>t°</text>
          <path d="M 12 24 Q 15 22 18 24 T 24 24" stroke={stroke} strokeWidth="1.2" />
        </svg>
      );

    // --- СВЕТИЛЬНИКИ ---
    case 'light_ceiling':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <circle cx="18" cy="18" r="10" fill="#fef08a" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="11" y1="11" x2="25" y2="25" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="11" y1="25" x2="25" y2="11" stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );

    case 'light_spot':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <circle cx="18" cy="18" r="8" fill="#fef08a" stroke={stroke} strokeWidth={strokeWidth} />
          <circle cx="18" cy="18" r="2.5" fill={stroke} />
        </svg>
      );

    case 'light_wall':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <path d="M 8 20 A 10 10 0 0 1 28 20 Z" fill="#fef08a" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="18" y1="20" x2="18" y2="28" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="13" y1="28" x2="23" y2="28" stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );

    case 'light_led':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <path d="M 5 18 L 11 13 L 17 23 L 23 13 L 29 23 L 32 18" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" />
        </svg>
      );

    case 'light_track':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <line x1="4" y1="18" x2="32" y2="18" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
          <circle cx="10" cy="24" r="3" fill="#fef08a" stroke={stroke} strokeWidth={strokeWidth} />
          <circle cx="18" cy="24" r="3" fill="#fef08a" stroke={stroke} strokeWidth={strokeWidth} />
          <circle cx="26" cy="24" r="3" fill="#fef08a" stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );

    case 'electrical_panel':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <rect x="5" y="10" width="26" height="16" rx="2" fill="#ffffff" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="5" y1="26" x2="31" y2="10" stroke={stroke} strokeWidth={strokeWidth} />
          <polygon points="5,10 31,10 5,26" fill={stroke} />
        </svg>
      );

    case 'doorbell':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <circle cx="18" cy="18" r="10" fill="#ffffff" stroke={stroke} strokeWidth={strokeWidth} />
          <circle cx="18" cy="18" r="4" fill={stroke} />
        </svg>
      );

    case 'intercom':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <rect x="8" y="7" width="20" height="22" rx="3" fill="#ffffff" stroke={stroke} strokeWidth={strokeWidth} />
          <rect x="11" y="10" width="14" height="10" rx="1" fill="#e2e8f0" stroke={stroke} strokeWidth="1" />
          <circle cx="18" cy="24" r="2" fill={stroke} />
        </svg>
      );

    // --- САНТЕХНИКА ---
    case 'sink':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <rect x="5" y="6" width="26" height="24" rx="4" fill="#ffffff" stroke={stroke} strokeWidth={strokeWidth} />
          <ellipse cx="18" cy="18" rx="9" ry="7" fill="#f0fdf4" stroke={stroke} strokeWidth={strokeWidth} />
          <circle cx="18" cy="11" r="1.5" fill={stroke} />
        </svg>
      );

    case 'sink_double':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <rect x="3" y="8" width="30" height="20" rx="3" fill="#ffffff" stroke={stroke} strokeWidth={strokeWidth} />
          <ellipse cx="11" cy="18" rx="6" ry="6" fill="#f0fdf4" stroke={stroke} strokeWidth={strokeWidth} />
          <ellipse cx="25" cy="18" rx="6" ry="6" fill="#f0fdf4" stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );

    case 'toilet':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <rect x="10" y="5" width="16" height="8" rx="2" fill="#ffffff" stroke={stroke} strokeWidth={strokeWidth} />
          <path d="M 12 13 C 12 29 24 29 24 13 Z" fill="#ffffff" stroke={stroke} strokeWidth={strokeWidth} />
          <ellipse cx="18" cy="20" rx="4" ry="5.5" fill="#f0fdf4" stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );

    case 'toilet_install':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <rect x="8" y="5" width="20" height="6" stroke={stroke} strokeWidth={strokeWidth} strokeDasharray="2,2" />
          <path d="M 11 11 C 11 27 25 27 25 11 Z" fill="#ffffff" stroke={stroke} strokeWidth={strokeWidth} />
          <ellipse cx="18" cy="18" rx="4.5" ry="5" fill="#f0fdf4" stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );

    case 'bidet':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <path d="M 11 10 C 11 28 25 28 25 10 Z" fill="#ffffff" stroke={stroke} strokeWidth={strokeWidth} />
          <ellipse cx="18" cy="18" rx="4.5" ry="6" fill="#f0fdf4" stroke={stroke} strokeWidth={strokeWidth} />
          <circle cx="18" cy="12" r="1.5" fill={stroke} />
        </svg>
      );

    case 'hygienic_shower':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <circle cx="14" cy="16" r="5" stroke={stroke} strokeWidth={strokeWidth} />
          <path d="M 18 18 Q 24 22 25 26" stroke={stroke} strokeWidth={strokeWidth} />
          <rect x="23" y="10" width="5" height="12" rx="2" fill={stroke} />
        </svg>
      );

    case 'bath':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <rect x="9" y="3" width="18" height="30" rx="3" fill="#ffffff" stroke={stroke} strokeWidth={strokeWidth} />
          <rect x="11.5" y="5.5" width="13" height="25" rx="6" fill="#f0fdf4" stroke={stroke} strokeWidth={strokeWidth} />
          <circle cx="18" cy="8" r="1.5" fill={stroke} />
        </svg>
      );

    case 'bath_corner':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <path d="M 6 6 L 30 6 A 24 24 0 0 1 6 30 Z" fill="#ffffff" stroke={stroke} strokeWidth={strokeWidth} />
          <path d="M 9 9 L 26 9 A 17 17 0 0 1 9 26 Z" fill="#f0fdf4" stroke={stroke} strokeWidth={strokeWidth} />
          <circle cx="12" cy="12" r="1.5" fill={stroke} />
        </svg>
      );

    case 'shower':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <rect x="6" y="6" width="24" height="24" rx="2" fill="#ffffff" stroke={stroke} strokeWidth={strokeWidth} />
          <path d="M 6 30 A 24 24 0 0 0 30 6" stroke={stroke} strokeWidth={strokeWidth} />
          <circle cx="18" cy="18" r="3" fill="#f0fdf4" stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );

    case 'shower_tray':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <rect x="6" y="14" width="24" height="8" rx="2" fill="#ffffff" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="10" y1="18" x2="26" y2="18" stroke={stroke} strokeWidth="1.2" strokeDasharray="2,2" />
        </svg>
      );

    case 'towel_heater':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <line x1="11" y1="6" x2="11" y2="30" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="25" y1="6" x2="25" y2="30" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="11" y1="10" x2="25" y2="10" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="11" y1="16" x2="25" y2="16" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="11" y1="22" x2="25" y2="22" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="11" y1="28" x2="25" y2="28" stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );

    case 'boiler':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <circle cx="18" cy="18" r="11" fill="#ffffff" stroke={stroke} strokeWidth={strokeWidth} />
          <circle cx="18" cy="18" r="8" stroke={stroke} strokeWidth="1" strokeDasharray="2,2" />
          <line x1="18" y1="7" x2="18" y2="13" stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );

    // --- КУХНЯ ---
    case 'kitchen_sink':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <rect x="5" y="8" width="26" height="20" rx="2" fill="#ffffff" stroke={stroke} strokeWidth={strokeWidth} />
          <rect x="7" y="10" width="12" height="16" rx="2" fill="#fef3c7" stroke={stroke} strokeWidth={strokeWidth} />
          <circle cx="13" cy="18" r="1.5" fill={stroke} />
          <line x1="21" y1="12" x2="29" y2="12" stroke={stroke} strokeWidth="1" />
          <line x1="21" y1="16" x2="29" y2="16" stroke={stroke} strokeWidth="1" />
          <line x1="21" y1="20" x2="29" y2="20" stroke={stroke} strokeWidth="1" />
          <line x1="21" y1="24" x2="29" y2="24" stroke={stroke} strokeWidth="1" />
        </svg>
      );

    case 'cooktop':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <rect x="6" y="6" width="24" height="24" rx="3" fill="#ffffff" stroke={stroke} strokeWidth={strokeWidth} />
          <circle cx="12" cy="12" r="3.5" stroke={stroke} strokeWidth={strokeWidth} />
          <circle cx="24" cy="12" r="4.5" stroke={stroke} strokeWidth={strokeWidth} />
          <circle cx="12" cy="24" r="4.5" stroke={stroke} strokeWidth={strokeWidth} />
          <circle cx="24" cy="24" r="3.5" stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );

    case 'oven':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <rect x="6" y="7" width="24" height="22" rx="2" fill="#ffffff" stroke={stroke} strokeWidth={strokeWidth} />
          <rect x="9" y="13" width="18" height="13" rx="1" fill="#f8fafc" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="9" y1="10" x2="27" y2="10" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'hood':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <path d="M 6 26 L 12 12 L 24 12 L 30 26 Z" fill="#ffffff" stroke={stroke} strokeWidth={strokeWidth} />
          <rect x="14" y="6" width="8" height="6" stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );

    case 'refrigerator':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <rect x="8" y="5" width="20" height="26" rx="2" fill="#ffffff" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="8" y1="15" x2="28" y2="15" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="10" y1="12" x2="10" y2="10" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="10" y1="18" x2="10" y2="24" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case 'dishwasher':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <rect x="6" y="6" width="24" height="24" rx="2" fill="#ffffff" stroke={stroke} strokeWidth={strokeWidth} />
          <text x="18" y="21" textAnchor="middle" fontSize="9" fontWeight="bold" fill={stroke}>ПММ</text>
        </svg>
      );

    case 'microwave':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <rect x="6" y="9" width="24" height="18" rx="2" fill="#ffffff" stroke={stroke} strokeWidth={strokeWidth} />
          <rect x="9" y="12" width="14" height="12" rx="1" fill="#f8fafc" stroke={stroke} strokeWidth="1.2" />
          <circle cx="26" cy="15" r="1.5" fill={stroke} />
          <circle cx="26" cy="20" r="1.5" fill={stroke} />
        </svg>
      );

    // --- БЫТОВАЯ ТЕХНИКА ---
    case 'washing_machine':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <rect x="6" y="6" width="24" height="24" rx="2" fill="#ffffff" stroke={stroke} strokeWidth={strokeWidth} />
          <circle cx="18" cy="19" r="8" fill="#f0f9ff" stroke={stroke} strokeWidth={strokeWidth} />
          <circle cx="18" cy="19" r="5" stroke={stroke} strokeWidth="1" />
          <circle cx="25" cy="10" r="1.5" fill={stroke} />
        </svg>
      );

    case 'dryer_machine':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <rect x="6" y="6" width="24" height="24" rx="2" fill="#ffffff" stroke={stroke} strokeWidth={strokeWidth} />
          <circle cx="18" cy="19" r="8" fill="#f0f9ff" stroke={stroke} strokeWidth={strokeWidth} />
          <path d="M 14 17 Q 18 14 22 17" stroke={stroke} strokeWidth="1.2" />
          <path d="M 14 21 Q 18 18 22 21" stroke={stroke} strokeWidth="1.2" />
        </svg>
      );

    // --- КЛИМАТ И ОТОПЛЕНИЕ ---
    case 'radiator':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <rect x="5" y="12" width="26" height="12" rx="2" fill="#ffffff" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="10" y1="12" x2="10" y2="24" stroke={stroke} strokeWidth="1.2" />
          <line x1="14" y1="12" x2="14" y2="24" stroke={stroke} strokeWidth="1.2" />
          <line x1="18" y1="12" x2="18" y2="24" stroke={stroke} strokeWidth="1.2" />
          <line x1="22" y1="12" x2="22" y2="24" stroke={stroke} strokeWidth="1.2" />
          <line x1="26" y1="12" x2="26" y2="24" stroke={stroke} strokeWidth="1.2" />
        </svg>
      );

    case 'floor_convector':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <rect x="4" y="14" width="28" height="8" stroke={stroke} strokeWidth={strokeWidth} strokeDasharray="3,2" />
          <line x1="8" y1="14" x2="8" y2="22" stroke={stroke} strokeWidth="1" />
          <line x1="14" y1="14" x2="14" y2="22" stroke={stroke} strokeWidth="1" />
          <line x1="20" y1="14" x2="20" y2="22" stroke={stroke} strokeWidth="1" />
          <line x1="26" y1="14" x2="26" y2="22" stroke={stroke} strokeWidth="1" />
        </svg>
      );

    case 'air_conditioner':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <rect x="4" y="11" width="28" height="14" rx="2" fill="#ffffff" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="8" y1="21" x2="28" y2="21" stroke={stroke} strokeWidth={strokeWidth} />
          <circle cx="27" cy="15" r="1.5" fill={stroke} />
        </svg>
      );

    case 'vent_grille':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <rect x="8" y="8" width="20" height="20" rx="1" fill="#ffffff" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="12" y1="12" x2="24" y2="12" stroke={stroke} strokeWidth="1.2" />
          <line x1="12" y1="16" x2="24" y2="16" stroke={stroke} strokeWidth="1.2" />
          <line x1="12" y1="20" x2="24" y2="20" stroke={stroke} strokeWidth="1.2" />
          <line x1="12" y1="24" x2="24" y2="24" stroke={stroke} strokeWidth="1.2" />
        </svg>
      );

    // --- СТОЯКИ ---
    case 'riser_sewer':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <circle cx="18" cy="18" r="11" fill="#ffffff" stroke={stroke} strokeWidth={strokeWidth} />
          <circle cx="18" cy="18" r="4" fill={stroke} />
          <text x="18" y="22" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#ffffff">К</text>
        </svg>
      );

    case 'riser_cold':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <circle cx="18" cy="18" r="11" fill="#ffffff" stroke={stroke} strokeWidth={strokeWidth} />
          <text x="18" y="22" textAnchor="middle" fontSize="11" fontWeight="bold" fill={stroke}>Х</text>
        </svg>
      );

    case 'riser_hot':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <circle cx="18" cy="18" r="11" fill="#ffffff" stroke={stroke} strokeWidth={strokeWidth} />
          <text x="18" y="22" textAnchor="middle" fontSize="11" fontWeight="bold" fill={stroke}>Г</text>
        </svg>
      );

    case 'riser_heat':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <circle cx="18" cy="18" r="11" fill="#ffffff" stroke={stroke} strokeWidth={strokeWidth} />
          <text x="18" y="21" textAnchor="middle" fontSize="9" fontWeight="bold" fill={stroke}>ОТ</text>
        </svg>
      );

    case 'vent_shaft':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <rect x="7" y="7" width="22" height="22" fill="#ffffff" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="7" y1="7" x2="29" y2="29" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="7" y1="29" x2="29" y2="7" stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );

    case 'circle':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <circle cx="18" cy="18" r="10" fill="#f8fafc" stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );

    case 'custom_image':
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <rect x="6" y="6" width="24" height="24" rx="3" stroke={stroke} strokeWidth={strokeWidth} strokeDasharray="3,2" />
          <path d="M 12 24 L 17 17 L 21 21 L 24 16 L 28 24 Z" fill="#93c5fd" />
          <circle cx="13" cy="12" r="2" fill="#f59e0b" />
        </svg>
      );

    default: // box
      return (
        <svg width={size} height={size} viewBox="0 0 36 36" fill="none" className={className}>
          <rect x="6" y="8" width="24" height="20" rx="3" fill="#ffffff" stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
      );
  }
};
