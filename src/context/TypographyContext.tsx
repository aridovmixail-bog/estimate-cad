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
  md: 1.2,
  lg: 1.4,
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
