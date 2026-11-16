import React, { useState, useEffect, useCallback } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CadCanvas } from './cad/CadCanvas';
import { Room, WindowSizePreset } from './cad/types';
import { EstimateRoomsPanel } from './components/EstimateRoomsPanel';
import { RoomFinishesModal, KRASNODAR_ESTIMATE_PIROGS, loadEffectivePirogs } from './components/RoomFinishesModal';
import { RoomSelectionState, PirogDefinition } from './estimate/types';
import { DEFAULT_PIROGS } from './estimate/defaultPirogs';
import { PieceworkSurveyPanel } from './components/PieceworkSurveyPanel';
import { InlineRoomSurveyPanel } from './components/InlineRoomSurveyPanel';
import { 
  ObjectChecklistConstants, 
  DEFAULT_OBJECT_CONSTANTS,
  EMPTY_OBJECT_CONSTANTS,
  KRASNODAR_STREET_PRESETS
} from './estimate/krasnodarTurnkeyTemplate';
import { 
  FileSpreadsheet,
  Building2, 
  Home, 
  Layers, 
  Ruler, 
  Sparkles, 
  DoorOpen, 
  LayoutGrid, 
  Zap,
  User,
  MapPin,
  Phone,
  FileText,
  ChevronRight,
  Settings2
} from 'lucide-react';

const DEFAULT_WINDOW_PRESETS: WindowSizePreset[] = [
  { id: 'win_std_2', label: '1.40 × 1.40 м (Стандарт 2-ств.)', width: 1.40, height: 1.40, isFavorite: true },
  { id: 'win_wide_3', label: '2.00 × 1.40 м (Широкое 3-ств.)', width: 2.00, height: 1.40, isFavorite: true },
  { id: 'win_narrow_2', label: '1.20 × 1.40 м (Узкое 2-ств.)', width: 1.20, height: 1.40, isFavorite: true },
  { id: 'win_single', label: '0.80 × 1.40 м (Одностворчатое)', width: 0.80, height: 1.40, isFavorite: true },
  { id: 'win_large', label: '2.10 × 1.50 м (Большое / Эркер)', width: 2.10, height: 1.50, isFavorite: false },
  { id: 'win_balcony', label: '0.90 × 2.10 м (Балконный блок)', width: 0.90, height: 2.10, isFavorite: false },
  { id: 'win_small', label: '0.60 × 0.90 м (Санузел / Котельная)', width: 0.60, height: 0.90, isFavorite: false },
];

const parsePositiveNumber = (val: string, fallback: number): number => {
  const clean = val.replace(',', '.').trim();
  const num = parseFloat(clean);
  return !isNaN(num) && num > 0 ? num : fallback;
};

const STORAGE_KEY_CLIENT = 'estimate_cad_client_info_v2';
const STORAGE_KEY_SELECTIONS = 'estimate_cad_room_selections_v2';
const STORAGE_KEY_SIDEBAR_WIDTH = 'estimate_cad_sidebar_width_v2';
const STORAGE_KEY_CONSTANTS = 'estimate_cad_checklist_constants_v2';
const STORAGE_KEY_PRICE_OVERRIDES = 'estimate_cad_price_overrides_v2';

export const getEmptyClientInfo = () => {
  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;
  return {
    name: '',
    address: '',
    phone: '',
    contractNumber: '',
    date: dateStr
  };
};

export const getDemoClientInfo = () => {
  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;
  return {
    name: 'Иванов Иван Иванович',
    address: 'г. Краснодар, ул. Дангиреева, д. 2, к.3, кв. 376',
    phone: '+7 (918) 123-45-67',
    contractNumber: `КР-${now.getFullYear()}-376`,
    date: dateStr
  };
};

export const App: React.FC = () => {
  // 3 главных раздела приложения (Обмер CAD -> Штучные работы -> Смета)
  const [sidebarTab, setSidebarTab] = useState<'cad' | 'piecework' | 'estimate'>('cad');

  // Единая ширина боковой панели для всех 3 разделов с плавным ресайзом
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SIDEBAR_WIDTH);
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 380 && val <= 1100) return val;
      }
    } catch {}
    return 540; // Комфортная ширина по умолчанию
  });

  const [isResizingSidebar, setIsResizingSidebar] = useState<boolean>(false);

  useEffect(() => {
    if (!isResizingSidebar) return;
    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(380, Math.min(e.clientX, window.innerWidth - 450));
      setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => {
      setIsResizingSidebar(false);
      try {
        localStorage.setItem(STORAGE_KEY_SIDEBAR_WIDTH, sidebarWidth.toString());
      } catch {}
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingSidebar, sidebarWidth]);

  // Константы и штучный чек-лист (синхронизируются со 2 и 3 разделами)
  const [checklistConstants, setChecklistConstants] = useState<ObjectChecklistConstants>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONSTANTS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return EMPTY_OBJECT_CONSTANTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONSTANTS, JSON.stringify(checklistConstants));
    } catch {}
  }, [checklistConstants]);

  // Переопределения цен для эталонной 118 сметы
  const [priceOverrides, setPriceOverrides] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PRICE_OVERRIDES);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PRICE_OVERRIDES, JSON.stringify(priceOverrides));
    } catch {}
  }, [priceOverrides]);

  // Список всех пирогов с учетом сохраненных пользовательских настроек
  const [effectivePirogs, setEffectivePirogs] = useState<PirogDefinition[]>(() => loadEffectivePirogs());

  // Данные о заказчике (в самом верху)
  const [clientInfo, setClientInfo] = useState<{
    name: string;
    address: string;
    phone: string;
    contractNumber: string;
    date: string;
  }>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CLIENT);
      if (saved) return JSON.parse(saved);
    } catch {}
    return getEmptyClientInfo();
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CLIENT, JSON.stringify(clientInfo));
    } catch {}
  }, [clientInfo]);

  // Выбранные пироги отделки по комнатам (синхронизируются со сметой)
  const [selections, setSelections] = useState<Record<string, RoomSelectionState>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SELECTIONS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SELECTIONS, JSON.stringify(selections));
    } catch {}
  }, [selections]);

  // Активная комната для модального окна выбора отделки (открывается по двойному клику)
  const [activeFinishesRoom, setActiveFinishesRoom] = useState<Room | null>(null);

  // Ключ для мгновенного сброса холста чертежа при полной очистке проекта
  const [cadResetKey, setCadResetKey] = useState<number>(0);

  // Параметры высоты
  const [ceilingHeight, setCeilingHeight] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('estimate_cad_ceiling_height');
      if (saved) {
        const val = parseFloat(saved);
        if (val && val > 0) return Number(val.toFixed(2));
      }
    } catch {}
    return 2.70;
  });

  // Автоматическое обновление высоты потолков при переносе данных с чертежа
  useEffect(() => {
    const handleHeightUpdate = (e: any) => {
      const h = Number(e.detail);
      if (h && h > 0 && !isNaN(h)) {
        const rounded = Number(h.toFixed(2));
        setCeilingHeight(rounded);
        try {
          localStorage.setItem('estimate_cad_ceiling_height', JSON.stringify(rounded));
        } catch {}
      }
    };

    const handleRoomsTransferred = (e: any) => {
      let roomsList: any[] = [];
      let newH: number | null = null;
      if (Array.isArray(e.detail)) {
        roomsList = e.detail;
      } else if (e.detail && typeof e.detail === 'object') {
        if (Array.isArray(e.detail.rooms)) roomsList = e.detail.rooms;
        if (e.detail.ceilingHeight) newH = Number(e.detail.ceilingHeight);
      }

      if (!newH && roomsList.length > 0) {
        const found = roomsList.find(r => r.ceilingHeight && Number(r.ceilingHeight) > 0);
        if (found) newH = Number(found.ceilingHeight);
      }

      if (newH && newH > 0 && !isNaN(newH)) {
        const rounded = Number(newH.toFixed(2));
        setCeilingHeight(rounded);
        try {
          localStorage.setItem('estimate_cad_ceiling_height', JSON.stringify(rounded));
        } catch {}
      }
    };

    window.addEventListener('estimate_cad_ceiling_height_updated', handleHeightUpdate);
    window.addEventListener('estimate_cad_rooms_transferred', handleRoomsTransferred);
    return () => {
      window.removeEventListener('estimate_cad_ceiling_height_updated', handleHeightUpdate);
      window.removeEventListener('estimate_cad_rooms_transferred', handleRoomsTransferred);
    };
  }, []);

  // Стандартные размеры двери (константы: 0.80 × 2.05 м)
  const doorHeight = 2.05;
  const doorWidth = 0.80;

  // Пресеты окон для выпадающей выборки при вставке на схеме
  const [windowPresets] = useState<WindowSizePreset[]>(() => {
    try {
      const saved = localStorage.getItem('estimate_cad_window_presets');
      return saved ? JSON.parse(saved) : DEFAULT_WINDOW_PRESETS;
    } catch {
      return DEFAULT_WINDOW_PRESETS;
    }
  });

  // Список комнат
  const [rooms, setRooms] = useState<Room[]>([]);

  const handleRoomsUpdated = useCallback((updatedRooms: Room[]) => {
    setRooms(updatedRooms);
  }, []);

  // Полная очистка проекта (сброс комнат, отделки, данных заказчика и штучных объемов в 0 при сохранении расценок)
  const handleClearAllProject = useCallback(() => {
    setRooms([]);
    setSelections({});
    setChecklistConstants(EMPTY_OBJECT_CONSTANTS);
    const emptyClient = getEmptyClientInfo();
    setClientInfo(emptyClient);
    setCeilingHeight(2.70);
    try {
      localStorage.removeItem('estimate_cad_ceiling_height');
    } catch {}
    try {
      localStorage.setItem(STORAGE_KEY_CLIENT, JSON.stringify(emptyClient));
      localStorage.removeItem(STORAGE_KEY_SELECTIONS);
      localStorage.removeItem(STORAGE_KEY_CONSTANTS);
      localStorage.removeItem('estimate_cad_checklist_constants_v2');
      localStorage.removeItem('estimate_cad_survey_state');
      localStorage.removeItem('estimate_cad_survey_appliances_v2');
      localStorage.removeItem('estimate_cad_survey_extra_items_v2');
      localStorage.removeItem('estimate_cad_imported_rooms');
      localStorage.removeItem('estimate_cad_walls');
      localStorage.removeItem('estimate_cad_rooms');
      localStorage.removeItem('estimate_cad_fixtures');
      localStorage.removeItem('estimate_cad_backdrop_v2');
      localStorage.removeItem('estimate_cad_backdrop_img');
      localStorage.removeItem('estimate_cad_cheatsheet_data');
      window.dispatchEvent(new CustomEvent('estimate_cad_rooms_transferred', { detail: [] }));
    } catch {}
    setCadResetKey(prev => prev + 1);
  }, []);

  // Загрузка эталонных комнат для квартиры 63 м²
  const handleLoadBenchmarkRooms = useCallback((benchmarkRooms: any[]) => {
    setRooms(benchmarkRooms as Room[]);
  }, []);

  // Сохранение выбранных пирогов отделки из модалки
  const handleSaveRoomFinishes = (roomId: string, pirogIds: Record<string, string | null>) => {
    setSelections(prev => {
      const roomSel = prev[roomId] || {
        roomId,
        selectedPirogIds: {},
        overridePrices: {},
        customWorks: [],
        customMaterials: []
      };
      const updated = {
        ...prev,
        [roomId]: {
          ...roomSel,
          selectedPirogIds: {
            ...roomSel.selectedPirogIds,
            ...pirogIds
          }
        }
      };
      try {
        localStorage.setItem(STORAGE_KEY_SELECTIONS, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const totalFloorArea = rooms.reduce((acc, r) => acc + r.floorArea, 0);
  const totalWallGrossArea = rooms.reduce((acc, r) => acc + r.wallGrossArea, 0);
  const totalWallNetArea = rooms.reduce((acc, r) => acc + r.wallNetArea, 0);
  const totalOpeningsArea = rooms.reduce((acc, r) => acc + (r.openingsTotalArea || 0), 0);
  const totalDoorsCount = rooms.reduce((acc, r) => acc + (r.doorsCount || 0), 0);
  const totalDoorsArea = rooms.reduce((acc, r) => acc + (r.doorsArea || 0), 0);
  const totalWindowsCount = rooms.reduce((acc, r) => acc + (r.windowsCount || 0), 0);
  const totalWindowsArea = rooms.reduce((acc, r) => acc + (r.windowsArea || 0), 0);
  const totalPerimeter = rooms.reduce((acc, r) => acc + r.perimeter, 0);
  const totalFixturesCount = rooms.reduce((acc, r) => acc + (r.fixturesCount || 0), 0);

  return (
    <ErrorBoundary fallbackTitle="Главное окно приложения">
      <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans">
      {/* Боковая панель: 3 главных раздела (одинаковая ширина с возможностью изменения) */}
      <div 
        style={{ width: `${sidebarWidth}px` }} 
        className="h-full bg-white border-r border-slate-200 flex flex-col z-30 shadow-md shrink-0 select-text"
      >
        {/* Шапка боковой панели */}
        <div className="p-3 border-b border-slate-200 bg-white text-slate-800 shadow-2xs shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h1 className="font-bold text-base tracking-tight text-slate-900">Estimate CAD</h1>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline" title="Текущая ширина боковой панели">
                {sidebarWidth}px
              </span>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>v1.2</span>
              </div>
            </div>
          </div>

          {/* 3 Вкладки переключения разделов */}
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1 border border-slate-200">
            <button
              onClick={() => setSidebarTab('cad')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                sidebarTab === 'cad'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Ruler className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate">1. Обмер</span>
            </button>

            <button
              onClick={() => setSidebarTab('piecework')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                sidebarTab === 'piecework'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-amber-800 hover:bg-white/50'
              }`}
            >
              <Zap className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">2. Штучные</span>
            </button>

            <button
              onClick={() => setSidebarTab('estimate')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                sidebarTab === 'estimate'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-white/50'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">3. Смета</span>
              {rooms.length > 0 && (
                <span className={`text-[10px] font-mono px-1 rounded-full font-bold ${sidebarTab === 'estimate' ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-200 text-slate-700'}`}>
                  {rooms.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 3 ВАРИАНТА СОДЕРЖИМОГО */}
        {sidebarTab === 'estimate' ? (
          <div className="flex-1 overflow-hidden">
            <EstimateRoomsPanel 
              rooms={rooms} 
              clientInfo={clientInfo}
              onClientInfoChange={setClientInfo}
              selections={selections}
              onSelectionsChange={setSelections}
              checklistConstants={checklistConstants}
              onChecklistConstantsChange={setChecklistConstants}
              onSwitchToPiecework={() => setSidebarTab('piecework')}
              priceOverrides={priceOverrides}
              onResetAll={handleClearAllProject}
              onLoadBenchmarkRooms={handleLoadBenchmarkRooms}
              pirogs={effectivePirogs}
            />
          </div>
        ) : sidebarTab === 'piecework' ? (
          <div className="flex-1 overflow-hidden">
            <PieceworkSurveyPanel 
              constants={checklistConstants}
              onChange={setChecklistConstants}
              priceOverrides={priceOverrides}
              onPriceOverridesChange={setPriceOverrides}
              onNavigateToEstimate={() => setSidebarTab('estimate')}
            />
          </div>
        ) : (<>

        {/* 1. В САМОМ ВЕРХУ: ДАННЫЕ О ЗАКАЗЧИКЕ */}
        <div className="p-3 border-b border-slate-200 bg-slate-50/80 space-y-2 shrink-0">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span className="flex items-center gap-1.5 text-blue-700">
              <User className="w-3.5 h-3.5" />
              <span>Данные заказчика и объекта</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400">{clientInfo.contractNumber || 'Б/Н'}</span>
              {(clientInfo.name || clientInfo.address || clientInfo.phone || clientInfo.contractNumber || rooms.length > 0) && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Очистить весь проект? Будут удалены данные заказчика, все помещения, чертёж и расчёт сметы.')) {
                      handleClearAllProject();
                    }
                  }}
                  className="text-[10px] text-slate-400 hover:text-rose-600 transition-colors cursor-pointer font-bold hover:underline"
                  title="Очистить весь проект (данные заказчика, чертёж, обмер и смету)"
                >
                  Очистить
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <div>
              <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">ФИО Заказчика:</label>
              <input
                type="text"
                value={clientInfo.name}
                onChange={(e) => setClientInfo({ ...clientInfo, name: e.target.value })}
                className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                placeholder="Иванов И.И."
              />
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Телефон:</label>
                <input
                  type="text"
                  value={clientInfo.phone}
                  onChange={(e) => setClientInfo({ ...clientInfo, phone: e.target.value })}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                  placeholder="+7 (918) 123-45-67"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Договор №:</label>
                <input
                  type="text"
                  value={clientInfo.contractNumber}
                  onChange={(e) => setClientInfo({ ...clientInfo, contractNumber: e.target.value })}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                  placeholder="КР-2026-01"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Адрес объекта (Краснодар):</label>
              <input
                type="text"
                list="krasnodar-streets-datalist"
                value={clientInfo.address}
                onChange={(e) => setClientInfo({ ...clientInfo, address: e.target.value })}
                className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                placeholder="г. Краснодар, ул. Красная"
              />
              <datalist id="krasnodar-streets-datalist">
                {KRASNODAR_STREET_PRESETS.map((street, idx) => (
                  <option key={idx} value={street} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Высота потолков (компактно в одну строчку) */}
          <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700">
              Высота потолков:
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.05"
                min="2.0"
                max="6.0"
                value={ceilingHeight}
                onChange={(e) => {
                  const val = parsePositiveNumber(e.target.value, 2.70);
                  setCeilingHeight(val);
                  try {
                    localStorage.setItem('estimate_cad_ceiling_height', JSON.stringify(val));
                  } catch {}
                }}
                className="w-16 px-2 py-1 text-xs font-mono font-bold text-center bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
              />
              <span className="text-xs text-slate-500 font-bold">м</span>
            </div>
          </div>
        </div>

        {/* 2. ИНЛАЙН-ОБМЕР ПОМЕЩЕНИЙ С ВЫБОРОМ ИЗ СПИСКА И ВЫЧЕТОМ ПРОЕМОВ */}
        <div className="flex-1 overflow-y-auto p-3">
          <InlineRoomSurveyPanel
            rooms={rooms}
            onRoomsChange={handleRoomsUpdated}
            globalCeilingHeight={ceilingHeight}
            onOpenRoomFinishes={(room) => setActiveFinishesRoom(room)}
            onNavigateToEstimate={() => setSidebarTab('estimate')}
            selections={selections}
          />
        </div>
        </>)}
      </div>

      {/* ИНТЕРАКТИВНЫЙ РЕСАЙЗЕР ШИРИНЫ (drag-to-resize, одинаков для всех 3 разделов) */}
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          setIsResizingSidebar(true);
        }}
        className={`w-2 hover:w-3 cursor-col-resize z-40 shrink-0 select-none group flex items-center justify-center transition-all ${
          isResizingSidebar ? 'bg-blue-600 w-3' : 'bg-slate-200/80 hover:bg-blue-400'
        }`}
        title="Потяните для изменения ширины боковой панели (одинакова для всех 3 разделов)"
      >
        <div className="w-0.5 h-10 bg-slate-400 group-hover:bg-white rounded-full" />
      </div>

      {/* Центральный холст CAD */}
      <div className="flex-1 min-w-0 h-full relative overflow-hidden">
        <CadCanvas 
          key={cadResetKey}
          ceilingHeight={ceilingHeight}
          onCeilingHeightChange={(newH) => {
            setCeilingHeight(newH);
            try {
              localStorage.setItem('estimate_cad_ceiling_height', JSON.stringify(newH));
            } catch {}
          }}
          doorDefaultHeight={doorHeight}
          doorDefaultWidth={doorWidth}
          windowWidth={1.40}
          windowHeight={1.40}
          windowPresets={windowPresets}
          externalRooms={rooms}
          onRoomsUpdated={handleRoomsUpdated}
          onOpenRoomFinishes={(room) => setActiveFinishesRoom(room)}
          onClearAll={handleClearAllProject}
          onNavigateToEstimate={() => setSidebarTab('estimate')}
        />
      </div>

      {/* Модальное окно выбора работ по комнате (двойной клик по помещению) */}
      {!!activeFinishesRoom && (
        <RoomFinishesModal
          isOpen={!!activeFinishesRoom}
          room={activeFinishesRoom}
          onClose={() => setActiveFinishesRoom(null)}
          selections={selections}
          onSaveFinishes={handleSaveRoomFinishes}
          allPirogs={effectivePirogs}
          onPirogsUpdated={setEffectivePirogs}
        />
      )}
    </div>
    </ErrorBoundary>
  );
};
