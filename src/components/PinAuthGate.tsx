import React, { useState, useEffect } from 'react';
import { Lock, KeyRound, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';

const REQUIRED_PIN = '2024';
const PIN_STORAGE_KEY = 'estimate_cad_auth_pin';

interface PinAuthGateProps {
  children: React.ReactNode;
}

export const PinAuthGate: React.FC<PinAuthGateProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      // 1. Проверяем URL параметр ?pin=2024
      const urlParams = new URLSearchParams(window.location.search);
      const urlPin = urlParams.get('pin');
      if (urlPin === REQUIRED_PIN) {
        localStorage.setItem(PIN_STORAGE_KEY, REQUIRED_PIN);
        return true;
      }
      // 2. Проверяем сохраненную сессию
      const savedPin = localStorage.getItem(PIN_STORAGE_KEY);
      return savedPin === REQUIRED_PIN;
    } catch {
      return false;
    }
  });

  const [inputPin, setInputPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (inputPin.trim() === REQUIRED_PIN) {
      try {
        localStorage.setItem(PIN_STORAGE_KEY, REQUIRED_PIN);
      } catch {}
      setIsAuthenticated(true);
      setError(null);
    } else {
      setError('Неверный код доступа. Попробуйте снова.');
      setInputPin('');
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4 select-none">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Шапка карточки */}
        <div className="p-6 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white text-center relative">
          <div className="w-14 h-14 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Lock className="w-7 h-7 text-amber-300" />
          </div>
          <h1 className="text-xl font-black tracking-tight">ESTIMATE CAD 2.0</h1>
          <p className="text-xs text-blue-100/90 mt-1">Доступ к проекту ограничен паролем</p>
        </div>

        {/* Форма ввода PIN */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-center space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Введите пароль доступа:
            </label>
            <p className="text-[11px] text-slate-400">
              Для работы с чертежами и сметами введите 4 цифры
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <input
              type="password"
              inputMode="numeric"
              maxLength={8}
              autoFocus
              value={inputPin}
              onChange={e => {
                setInputPin(e.target.value);
                if (error) setError(null);
              }}
              placeholder="••••"
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-2xl text-center text-xl font-mono font-black tracking-widest text-slate-900 focus:outline-none transition-all shadow-inner"
            />
          </div>

          {error && (
            <div className="flex items-center gap-1.5 p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-98 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Войти в проект</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="pt-2 text-center">
            <div className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Защищённый режим демонстрации</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
