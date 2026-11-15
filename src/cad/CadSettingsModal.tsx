import React from 'react';
import { 
  X, 
  Settings, 
  Type, 
  Ruler, 
  Grid, 
  Compass, 
  Magnet, 
  HelpCircle, 
  Trash2, 
  RotateCcw,
  Check
} from 'lucide-react';
import { FontScale } from '../context/TypographyContext';
import { DimensionStyle, DimensionUnit } from './types';

interface CadSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  fontScale: FontScale;
  setFontScale: (scale: FontScale) => void;
  dimensionUnit: DimensionUnit;
  setDimensionUnit: (unit: DimensionUnit) => void;
  dimensionStyle: DimensionStyle;
  setDimensionStyle: (style: DimensionStyle) => void;
  showRoomSpans: boolean;
  setShowRoomSpans: React.Dispatch<React.SetStateAction<boolean>>;
  manualDimOffsetsCount: number;
  onResetManualDimOffsets: () => void;
  orthoMode: boolean;
  setOrthoMode: React.Dispatch<React.SetStateAction<boolean>>;
  showGrid: boolean;
  setShowGrid: React.Dispatch<React.SetStateAction<boolean>>;
  smartSnapEnabled: boolean;
  setSmartSnapEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  onOpenHelp: () => void;
  onClearAll: () => void;
  showToast: (msg: string) => void;
}

export const CadSettingsModal: React.FC<CadSettingsModalProps> = ({
  isOpen,
  onClose,
  fontScale,
  setFontScale,
  dimensionUnit,
  setDimensionUnit,
  dimensionStyle,
  setDimensionStyle,
  showRoomSpans,
  setShowRoomSpans,
  manualDimOffsetsCount,
  onResetManualDimOffsets,
  orthoMode,
  setOrthoMode,
  showGrid,
  setShowGrid,
  smartSnapEnabled,
  setSmartSnapEnabled,
  onOpenHelp,
  onClearAll,
  showToast,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Шапка модального окна */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Settings className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Настройки чертежа и интерфейса</h3>
              <p className="text-[11px] text-slate-500">Параметры отображения, масштаба и инструментов CAD</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            title="Закрыть [Esc]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Тело с секциями настроек */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          
          {/* Секция 1: Размер шрифта и элементов */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
            <div className="flex items-center gap-2 mb-2.5">
              <Type className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-slate-800 text-xs">Масштаб шрифта и размеров</span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Масштабирует размеры стен, площади комнат, выноски и подписи на чертеже:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setFontScale('sm');
                  showToast('🔤 Мелкий шрифт (100%)');
                }}
                className={`py-2 px-3 rounded-lg border text-center font-bold text-xs transition-all cursor-pointer ${
                  fontScale === 'sm'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-300'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <div className="text-sm mb-0.5">🔤 Мелкий</div>
                <div className={`text-[10px] ${fontScale === 'sm' ? 'text-blue-100' : 'text-slate-400'}`}>100% (компакт)</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFontScale('md');
                  showToast('🔠 Средний шрифт (130%)');
                }}
                className={`py-2 px-3 rounded-lg border text-center font-bold text-xs transition-all cursor-pointer ${
                  fontScale === 'md'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-300'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <div className="text-sm mb-0.5">🔠 Средний</div>
                <div className={`text-[10px] ${fontScale === 'md' ? 'text-blue-100' : 'text-slate-400'}`}>130% (стандарт)</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFontScale('lg');
                  showToast('🅰️ Крупный шрифт (165%)');
                }}
                className={`py-2 px-3 rounded-lg border text-center font-bold text-xs transition-all cursor-pointer ${
                  fontScale === 'lg'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-300'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <div className="text-sm mb-0.5">🅰️ Крупный</div>
                <div className={`text-[10px] ${fontScale === 'lg' ? 'text-blue-100' : 'text-slate-400'}`}>165% (для печати)</div>
              </button>
            </div>
          </div>

          {/* Секция 2: Единицы измерения */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
            <div className="flex items-center gap-2 mb-2.5">
              <Ruler className="w-4 h-4 text-indigo-600" />
              <span className="font-bold text-slate-800 text-xs">Единицы измерений на чертеже</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setDimensionUnit('mm');
                  showToast('Единицы измерений: миллиметры (мм)');
                }}
                className={`py-2 px-3 rounded-lg border text-center font-bold text-xs transition-all cursor-pointer ${
                  dimensionUnit === 'mm'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-300'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <div className="text-sm mb-0.5">мм</div>
                <div className={`text-[10px] ${dimensionUnit === 'mm' ? 'text-indigo-100' : 'text-slate-400'}`}>ГОСТ (1500 мм)</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDimensionUnit('cm');
                  showToast('Единицы измерений: сантиметры (см)');
                }}
                className={`py-2 px-3 rounded-lg border text-center font-bold text-xs transition-all cursor-pointer ${
                  dimensionUnit === 'cm'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-300'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <div className="text-sm mb-0.5">см</div>
                <div className={`text-[10px] ${dimensionUnit === 'cm' ? 'text-indigo-100' : 'text-slate-400'}`}>150.0 см</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDimensionUnit('m');
                  showToast('Единицы измерений: метры (м)');
                }}
                className={`py-2 px-3 rounded-lg border text-center font-bold text-xs transition-all cursor-pointer ${
                  dimensionUnit === 'm'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-300'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <div className="text-sm mb-0.5">м</div>
                <div className={`text-[10px] ${dimensionUnit === 'm' ? 'text-indigo-100' : 'text-slate-400'}`}>1.50 м</div>
              </button>
            </div>
          </div>

          {/* Секция 3: Оформление ГОСТ и выноски */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">📐</span>
                <span className="font-bold text-slate-800 text-xs">Стиль размеров и оформление</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = dimensionStyle === 'architectural' ? 'badges' : 'architectural';
                  setDimensionStyle(next);
                  showToast(next === 'architectural' ? '📐 Цепочки ГОСТ (засечки 45°)' : '🏷️ Крупные бейджи');
                }}
                className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-white border border-slate-300 hover:bg-slate-100 cursor-pointer shadow-2xs"
              >
                {dimensionStyle === 'architectural' ? '📐 Цепочки ГОСТ 45°' : '🏷️ Бейджи'}
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <div>
                <span className="font-medium text-slate-700">Габаритные линии комнат</span>
                <p className="text-[10px] text-slate-400">Ширина и длина по осям каждой комнаты</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowRoomSpans(prev => !prev);
                  showToast(!showRoomSpans ? 'Габариты комнат ВКЛ' : 'Габариты комнат ВЫКЛ');
                }}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  showRoomSpans 
                    ? 'bg-slate-800 text-white shadow-2xs' 
                    : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                {showRoomSpans ? 'ВКЛ' : 'ВЫКЛ'}
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <div>
                <span className="font-medium text-slate-700">Сброс положения выносок</span>
                <p className="text-[10px] text-slate-400">Вернуть смещённые вручную цифры в авто-позиции</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onResetManualDimOffsets();
                  showToast('Положение всех выносок сброшено в авто-режим');
                }}
                disabled={manualDimOffsetsCount === 0}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${
                  manualDimOffsetsCount > 0
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 cursor-pointer'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                }`}
              >
                <RotateCcw className="w-3 h-3 text-amber-600" />
                <span>Сброс ({manualDimOffsetsCount})</span>
              </button>
            </div>
          </div>

          {/* Секция 4: Сетка и привязка */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2.5">
            <div className="font-bold text-slate-800 text-xs flex items-center gap-2 mb-1">
              <Grid className="w-4 h-4 text-emerald-600" />
              <span>Сетка и режимы черчения</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setOrthoMode(prev => !prev);
                  showToast(!orthoMode ? '⬚ Режим «Орто 90°» ВКЛ' : '📐 Свободный угол');
                }}
                className={`p-2 rounded-lg border text-center font-bold text-xs transition-all cursor-pointer ${
                  orthoMode
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
                title="Орто режим 90° [горячая клавиша: O]"
              >
                <Compass className="w-4 h-4 mx-auto mb-1 text-emerald-500 fill-emerald-100" />
                <div>ОРТО [O]</div>
                <div className={`text-[10px] ${orthoMode ? 'text-emerald-100' : 'text-slate-400'}`}>
                  {orthoMode ? 'ВКЛ' : 'ВЫКЛ'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowGrid(prev => !prev);
                  showToast(!showGrid ? 'Сетка миллиметровки ВКЛ' : 'Сетка ВЫКЛ');
                }}
                className={`p-2 rounded-lg border text-center font-bold text-xs transition-all cursor-pointer ${
                  showGrid
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
                title="Сетка миллиметровки [горячая клавиша: G]"
              >
                <Grid className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
                <div>СЕТКА [G]</div>
                <div className={`text-[10px] ${showGrid ? 'text-emerald-100' : 'text-slate-400'}`}>
                  {showGrid ? 'ВКЛ' : 'ВЫКЛ'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSmartSnapEnabled(prev => !prev);
                  showToast(!smartSnapEnabled ? 'Умная привязка ВКЛ' : 'Привязка ВЫКЛ');
                }}
                className={`p-2 rounded-lg border text-center font-bold text-xs transition-all cursor-pointer ${
                  smartSnapEnabled
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
                title="Умная привязка к стенам и углам [горячая клавиша: S]"
              >
                <Magnet className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
                <div>ПРИВЯЗКА [S]</div>
                <div className={`text-[10px] ${smartSnapEnabled ? 'text-emerald-100' : 'text-slate-400'}`}>
                  {smartSnapEnabled ? 'ВКЛ' : 'ВЫКЛ'}
                </div>
              </button>
            </div>
          </div>

          {/* Секция 5: Шпаргалка и горячие клавиши */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenHelp();
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span>Шпаргалка и подсказки по клавишам [?]</span>
            </button>

            {/* Очистить всё */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onClearAll();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
              title="Очистить всё поле чертежа"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
              <span>Очистить всё</span>
            </button>
          </div>

        </div>

        {/* Подвал */}
        <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Готово</span>
          </button>
        </div>
      </div>
    </div>
  );
};
