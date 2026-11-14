import React, { useState, useEffect, useCallback } from 'react';
import { CadCanvas } from './cad/CadCanvas';
import { Room, WindowSizePreset } from './cad/types';
import { EstimateRoomsPanel } from './components/EstimateRoomsPanel';
import { RoomFinishesModal, KRASNODAR_ESTIMATE_PIROGS } from './components/RoomFinishesModal';
import { RoomSelectionState } from './estimate/types';
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

  // Параметры высоты
  const [ceilingHeight, setCeilingHeight] = useState<number>(2.70);

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
      localStorage.setItem(STORAGE_KEY_CLIENT, JSON.stringify(emptyClient));
      localStorage.removeItem(STORAGE_KEY_SELECTIONS);
      localStorage.removeItem(STORAGE_KEY_CONSTANTS);
      localStorage.removeItem('estimate_cad_checklist_constants_v2');
      localStorage.removeItem('estimate_cad_survey_state');
      localStorage.removeItem('estimate_cad_survey_appliances_v2');
      localStorage.removeItem('estimate_cad_survey_extra_items_v2');
      localStorage.removeItem('estimate_cad_imported_rooms');
    } catch {}
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
              {(clientInfo.name || clientInfo.address || clientInfo.phone || clientInfo.contractNumber) ? (
                <button
                  type="button"
                  onClick={() => {
                    const empty = getEmptyClientInfo();
                    setClientInfo(empty);
                    try {
                      localStorage.setItem(STORAGE_KEY_CLIENT, JSON.stringify(empty));
                    } catch {}
                  }}
                  className="text-[10px] text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Очистить данные заказчика"
                >
                  Очистить
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const demo = getDemoClientInfo();
                    setClientInfo(demo);
                    try {
                      localStorage.setItem(STORAGE_KEY_CLIENT, JSON.stringify(demo));
                    } catch {}
                  }}
                  className="text-[10px] text-blue-600 hover:text-blue-800 transition-colors cursor-pointer font-bold"
                  title="Заполнить демо-данные"
                >
                  ⚡ Демо
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

              {/* Быстрые подсказки адресов по Краснодару */}
              <div className="flex flex-wrap gap-1 pt-1">
                <span className="text-[10px] text-slate-400 font-semibold self-center">Быстро:</span>
                <button
                  type="button"
                  onClick={() => setClientInfo({ ...clientInfo, address: 'г. Краснодар, ул. Дангиреева, д. 2, к.3, кв. 376' })}
                  className="px-2 py-0.5 rounded bg-blue-100 hover:bg-blue-200 text-blue-800 text-[10px] font-bold transition-colors cursor-pointer"
                >
                  ⚡ Дангиреева 2 к3
                </button>
                <button
                  type="button"
                  onClick={() => setClientInfo({ ...clientInfo, address: 'г. Краснодар, ул. Красная, д. 120, кв. 45' })}
                  className="px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-medium transition-colors cursor-pointer"
                >
                  ул. Красная 120
                </button>
                <button
                  type="button"
                  onClick={() => setClientInfo({ ...clientInfo, address: 'г. Краснодар, ул. Западный Обход, д. 42' })}
                  className="px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-medium transition-colors cursor-pointer"
                >
                  Западный Обход
                </button>
              </div>
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
                onChange={(e) => setCeilingHeight(parsePositiveNumber(e.target.value, 2.70))}
                className="w-16 px-2 py-1 text-xs font-mono font-bold text-center bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
              />
              <span className="text-xs text-slate-500 font-bold">м</span>
            </div>
          </div>
        </div>

        {/* 2. СПИСОК ПОМЕЩЕНИЙ (ДВОЙНОЙ КЛИК ОТКРЫВАЕТ ОКНО РАБОТ) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Помещения ({rooms.length})
            </span>
            <span className="text-[10px] text-blue-600 font-medium">
              Клик для выбора отделки
            </span>
          </div>

          {rooms.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-500 space-y-2">
              <Home className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-700">На плане пока нет комнат</p>
              <p className="text-[11px] text-slate-400">
                Чертите стены на холсте — комната замкнется автоматически, появится в списке, а двойным кликом откроются работы по стенам, полу и потолку.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {rooms.map((room, idx) => {
                const roomSel = selections[room.id]?.selectedPirogIds || {};
                const allPirogsList = [...KRASNODAR_ESTIMATE_PIROGS, ...DEFAULT_PIROGS];
                const ceilingPirog = allPirogsList.find(p => p.id === roomSel.ceiling);
                const wallsPirog = allPirogsList.find(p => p.id === roomSel.walls);
                const floorPirog = allPirogsList.find(p => p.id === roomSel.floor);

                return (
                  <div 
                    key={room.id}
                    onClick={() => setActiveFinishesRoom(room)}
                    className="p-3 bg-white hover:bg-blue-50/40 border border-slate-200 hover:border-blue-400 rounded-xl transition-all shadow-2xs cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900 group-hover:text-blue-700 transition-colors">
                          {room.name}
                        </span>
                        <span className="text-[10px] font-mono bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-bold">
                          #{idx + 1}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveFinishesRoom(room);
                        }}
                        className="text-[10px] font-bold text-blue-600 group-hover:text-blue-800 bg-blue-50 group-hover:bg-blue-100 px-2 py-0.5 rounded-lg border border-blue-200 flex items-center gap-1 transition-colors"
                      >
                        <Layers className="w-3 h-3" />
                        <span>Отделка</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Геометрия комнаты */}
                    <div className="grid grid-cols-3 gap-1 text-[11px] font-mono text-slate-600 bg-slate-50 p-1.5 rounded-lg border border-slate-100 mb-2">
                      <div>Пол: <b className="text-blue-700">{room.floorArea}м²</b></div>
                      <div>Стены: <b className="text-emerald-700">{room.wallNetArea}м²</b></div>
                      <div>P: <b className="text-slate-800">{room.perimeter}м</b></div>
                    </div>

                    {/* Выбранные пироги работ */}
                    <div className="space-y-1 text-[10px]">
                      <div className="flex items-center justify-between text-slate-600">
                        <span>☁️ Потолок:</span>
                        <span className="font-medium text-slate-900 truncate max-w-[170px]" title={ceilingPirog?.name}>
                          {ceilingPirog ? ceilingPirog.name : '— Без отделки —'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>🧱 Стены:</span>
                        <span className="font-medium text-slate-900 truncate max-w-[170px]" title={wallsPirog?.name}>
                          {wallsPirog ? wallsPirog.name : '— Без отделки —'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>🪵 Пол:</span>
                        <span className="font-medium text-slate-900 truncate max-w-[170px]" title={floorPirog?.name}>
                          {floorPirog ? floorPirog.name : '— Без отделки —'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Итого по объекту */}
        {rooms.length > 0 && (
          <div className="p-3 bg-blue-50/80 border-t border-blue-200 text-xs font-mono space-y-1 shrink-0">
            <div className="flex justify-between text-slate-700">
              <span className="font-sans font-bold">Площадь пола (S общ):</span>
              <span className="font-bold text-blue-700">{totalFloorArea.toFixed(2)} м²</span>
            </div>
            <div className="flex justify-between text-slate-600 text-[11px]">
              <span className="font-sans">Стены (чистые под отделку):</span>
              <span className="font-bold text-emerald-700">{totalWallNetArea.toFixed(2)} м²</span>
            </div>
            <div className="flex justify-between text-slate-500 text-[11px]">
              <span className="font-sans">Общий периметр (плинтус):</span>
              <span>{totalPerimeter.toFixed(2)} м</span>
            </div>
          </div>
        )}
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
      <div className="flex-1 h-full relative">
        <CadCanvas 
          ceilingHeight={ceilingHeight}
          doorDefaultHeight={doorHeight}
          doorDefaultWidth={doorWidth}
          windowWidth={1.40}
          windowHeight={1.40}
          windowPresets={windowPresets}
          onRoomsUpdated={handleRoomsUpdated}
          onOpenRoomFinishes={(room) => setActiveFinishesRoom(room)}
          onClearAll={handleClearAllProject}
          onNavigateToEstimate={() => setSidebarTab('estimate')}
        />
      </div>

      {/* Модальное окно выбора работ по комнате (двойной клик по помещению) */}
      <RoomFinishesModal
        isOpen={!!activeFinishesRoom}
        room={activeFinishesRoom}
        onClose={() => setActiveFinishesRoom(null)}
        selections={selections}
        onSaveFinishes={handleSaveRoomFinishes}
      />
    </div>
  );
};
