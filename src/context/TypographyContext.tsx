import React, { createContext, useContext, useState, useEffect } from 'react';

export type FontScale = 'sm' | 'md' | 'lg';

interface TypographyContextType {
  fontScale: FontScale;
  scaleFactor: number;
  setFontScale: (scale: FontScale) => void;
  increaseFontScale: () => void;
  decreaseFontScale: () => void;
}

const SCALE_FACTORS: Record<FontScale, number> = {
  sm: 1.0,
  md: 1.25,
  lg: 1.55,
};

const TypographyContext = createContext<TypographyContextType>({
  fontScale: 'sm',
  scaleFactor: 1.0,
  setFontScale: () => {},
  increaseFontScale: () => {},
  decreaseFontScale: () => {},
});

export const TypographyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fontScale, setFontScaleState] = useState<FontScale>(() => {
    try {
      const saved = localStorage.getItem('estimate_cad_font_scale');
      if (saved === 'sm' || saved === 'md' || saved === 'lg') {
        return saved;
      }
    } catch {}
    return 'sm';
  });

  const setFontScale = (scale: FontScale) => {
    setFontScaleState(scale);
    try {
      localStorage.setItem('estimate_cad_font_scale', scale);
    } catch {}
  };

  const increaseFontScale = () => {
    if (fontScale === 'sm') setFontScale('md');
    else if (fontScale === 'md') setFontScale('lg');
  };

  const decreaseFontScale = () => {
    if (fontScale === 'lg') setFontScale('md');
    else if (fontScale === 'md') setFontScale('sm');
  };

  const scaleFactor = SCALE_FACTORS[fontScale] || 1.0;

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.setAttribute('data-font-scale', fontScale);
      root.style.setProperty('--app-font-scale', String(scaleFactor));
      
      // Scaling html root font-size smoothly scales all Tailwind rem units across the app
      if (fontScale === 'sm') {
        root.style.fontSize = '13.5px';
      } else if (fontScale === 'md') {
        root.style.fontSize = '14.5px';
      } else if (fontScale === 'lg') {
        root.style.fontSize = '16px';
      }
    }
  }, [fontScale, scaleFactor]);

  return (
    <TypographyContext.Provider
      value={{
        fontScale,
        scaleFactor,
        setFontScale,
        increaseFontScale,
        decreaseFontScale,
      }}
    >
      {children}
    </TypographyContext.Provider>
  );
};

export const useTypography = () => useContext(TypographyContext);
