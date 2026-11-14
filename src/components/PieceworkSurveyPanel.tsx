import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Zap, 
  Droplets, 
  UtensilsCrossed, 
  DoorClosed, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Check, 
  FolderPlus, 
  Edit2,
  X,
  ChevronRight,
  Info,
  GripVertical,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { 
  ObjectChecklistConstants, 
  DEFAULT_OBJECT_CONSTANTS,
  EMPTY_OBJECT_CONSTANTS,
  BENCHMARK_63_OBJECT_CONSTANTS
} from '../estimate/krasnodarTurnkeyTemplate';

export interface CustomSectionItem {
  id: string;
  name: string;
  unit: string;
  unitPrice: number;
  quantity: number;
}

export interface CustomSurveySection {
  id: string;
  title: string;
  description: string;
  items: CustomSectionItem[];
}

export interface BathAppliancesState {
  toiletCount: number;
  toiletInstallationMount: number;
  bathOrShowerCount: number;
  sinkCount: number;
  washingMachineCount: number;
  hygienicShowerCount: number;
  hygienicWaterPoints: number;
  towelRailCount: number;
  towelRailWaterPoints: number;
  showerTray800x1500: number;
  tileCleanCutM: number;
  tileHolesCount: number;
  sanitaryFixturesSet: number;
}

export interface KitchenAppliancesState {
  kitchenSinkCount: number;
  dishwasherCount: number;
}

export interface ElectricState {
  roughPoints: number;
  finishPoints: number;
  gx53Lamps: number;
}

export interface ServiceState {
  wrappingDoorsWindows: number;
  interiorDoors: number;
  ventilationSet: number;
  drywallTransomsAndBoxes: number;
  garbageRemovalAndCleaning: number;
}

export interface SurveyPricesState {
  // 1. Электромонтажные точки
  electricRough: number;            // 1 700 ₽ / шт
  electricFinish: number;           // 400 ₽ / шт
  lampGX53: number;                 // 750 ₽ / шт

  // 2. Сантехника: Туалет + Ванная
  toiletFixture: number;            // 4 000 ₽ / компл (1 вода + 1 канализация)
  toiletInstallationMount: number;  // 4 500 ₽ / шт (монтаж инсталляции)
  bathFixture: number;              // 6 200 ₽ / компл (2 воды + 1 канализация)
  sinkFixture: number;              // 6 200 ₽ / компл (2 воды + 1 канализация)
  washingMachineFixture: number;    // 4 000 ₽ / компл (1 вода + 1 канализация)
  hygienicShowerFixture: number;    // 6 200 ₽ / компл (2 воды + 1 канализация)
  towelRailFixture: number;         // 1 800 ₽ / компл (0 воды + 1 канализация)
  showerTray800x1500: number;       // 18 000 ₽ / шт
  tileCleanCutM: number;            // 2 000 ₽ / м.п.
  tileHolesCount: number;           // 600 ₽ / шт
  sanitaryFixturesSet: number;      // 24 500 ₽ / компл

  // 3. Сантехника: Кухня
  kitchenSinkFixture: number;       // 6 200 ₽ / компл (2 воды + 1 канализация)
  dishwasherFixture: number;        // 4 000 ₽ / компл (1 вода + 1 канализация)

  // 4. Двери, подготовка и сервис
  wrappingDoorsWindows: number;     // 14 000 ₽ / компл
  interiorDoors: number;            // 4 500 ₽ / шт
  ventilationUnit: number;          // 4 266 ₽ / шт
  drywallTransomsBoxes: number;     // 28 500 ₽ / компл
  garbageRemovalCleaning: number;   // 27 500 ₽ / компл
}

export const DEFAULT_SURVEY_PRICES: SurveyPricesState = {
  electricRough: 1700,
  electricFinish: 400,
  lampGX53: 750,
  toiletFixture: 4000,
  toiletInstallationMount: 4500,
  bathFixture: 6200,
  sinkFixture: 6200,
  washingMachineFixture: 4000,
  hygienicShowerFixture: 6200,
  towelRailFixture: 1800,
  showerTray800x1500: 18000,
  tileCleanCutM: 2000,
  tileHolesCount: 600,
  sanitaryFixturesSet: 24500,
  kitchenSinkFixture: 6200,
  dishwasherFixture: 4000,
  wrappingDoorsWindows: 14000,
  interiorDoors: 4500,
  ventilationUnit: 4266,
  drywallTransomsBoxes: 28500,
  garbageRemovalCleaning: 27500,
};

export const DEFAULT_WORK_TITLES: Record<string, string> = {
  electricRough: 'Электромонтажные точки (подрозетники/выводы)',
  electricFinish: 'Установка чистовой электрики (розетки, рамки, выключатели, люстры)',
  lampGX53: 'Монтаж светильников GX53 в натяжной потолок',
  toiletFixture: 'Туалет (подключение унитаза)',
  toiletInstallationMount: 'Монтаж скрытой инсталляции подвесного унитаза',
  bathFixture: 'Ванна / Душевая зона (подводка)',
  sinkFixture: 'Раковина (ванная / санузел)',
  washingMachineFixture: 'Стиральная машина (подводка)',
  hygienicShowerFixture: 'Гигиенический душ',
  towelRailFixture: 'Сушилка (сушильная машина / полотенцесушитель)',
  showerTray800x1500: 'Устройство душевого поддона 800х1500',
  tileCleanCutM: 'Запил плитки под 45° (чистый рез)',
  tileHolesCount: 'Отверстия в керамограните алмазной коронкой',
  sanitaryFixturesSet: 'Установка чистового санфаянса (комплекс)',
  kitchenSinkFixture: 'Раковина (мойка кухни)',
  dishwasherFixture: 'Посудомоечная машина',
  wrappingDoorsWindows: 'Укутывание дверей и окон защитной пленкой',
  interiorDoors: 'Монтаж межкомнатных дверей с доборами',
  ventilationUnit: 'Вытяжная вентиляция и отверстия (кухня, ванна, с/у)',
  drywallTransomsBoxes: 'Опуски проемов (6 шт.) и короба стояков ГКЛ',
  garbageRemovalCleaning: 'Вывоз строительного мусора (Газель) и клининг',
};

interface PieceworkSurveyPanelProps {
  constants: ObjectChecklistConstants;
  onChange: (updated: ObjectChecklistConstants) => void;
  priceOverrides?: Record<string, number>;
  onPriceOverridesChange?: (overrides: Record<string, number>) => void;
  onNavigateToEstimate?: () => void;
  className?: string;
}

const STORAGE_KEY_CUSTOM_SECTIONS = 'estimate_cad_custom_survey_sections_v2';
const STORAGE_KEY_SURVEY_STATE = 'estimate_cad_survey_appliances_v2';
const STORAGE_KEY_SURVEY_PRICES = 'estimate_cad_survey_prices_v2';
const STORAGE_KEY_SURVEY_TITLES = 'estimate_cad_survey_titles_v2';
const STORAGE_KEY_SURVEY_EXTRA_ITEMS = 'estimate_cad_survey_extra_items_v2';
const STORAGE_KEY_SURVEY_ITEM_ORDER = 'estimate_cad_survey_item_order_v2';
const STORAGE_KEY_SURVEY_HIDDEN_ITEMS = 'estimate_cad_survey_hidden_items_v2';

export const DEFAULT_SECTION_ITEM_ORDERS: Record<string, string[]> = {
  sec_electric: [
    'electricRough', 
    'electricFinish', 
    'lampGX53'
  ],
  sec_bath: [
    'toiletFixture', 
    'toiletInstallationMount', 
    'bathFixture', 
    'sinkFixture', 
    'washingMachineFixture', 
    'hygienicShowerFixture', 
    'towelRailFixture', 
    'showerTray800x1500', 
    'tileCleanCutM', 
    'tileHolesCount', 
    'sanitaryFixturesSet'
  ],
  sec_kitchen: [
    'kitchenSinkFixture', 
    'dishwasherFixture'
  ],
  sec_service: [
    'wrappingDoorsWindows', 
    'interiorDoors', 
    'ventilationUnit', 
    'drywallTransomsBoxes', 
    'garbageRemovalCleaning'
  ]
};

export const EMPTY_BATH_APPLIANCES: BathAppliancesState = {
  toiletCount: 0,
  toiletInstallationMount: 0,
  bathOrShowerCount: 0,
  sinkCount: 0,
  washingMachineCount: 0,
  hygienicShowerCount: 0,
  hygienicWaterPoints: 0,
  towelRailCount: 0,
  towelRailWaterPoints: 0,
  showerTray800x1500: 0,
  tileCleanCutM: 0,
  tileHolesCount: 0,
  sanitaryFixturesSet: 0,
};

export const BENCHMARK_BATH_APPLIANCES: BathAppliancesState = {
  toiletCount: 1,
  toiletInstallationMount: 1,
  bathOrShowerCount: 1,
  sinkCount: 2,
  washingMachineCount: 1,
  hygienicShowerCount: 1,
  hygienicWaterPoints: 2,
  towelRailCount: 1,
  towelRailWaterPoints: 0,
  showerTray800x1500: 1,
  tileCleanCutM: 1.6,
  tileHolesCount: 16,
  sanitaryFixturesSet: 1,
};

export const EMPTY_KITCHEN_APPLIANCES: KitchenAppliancesState = {
  kitchenSinkCount: 0,
  dishwasherCount: 0,
};

export const BENCHMARK_KITCHEN_APPLIANCES: KitchenAppliancesState = {
  kitchenSinkCount: 1,
  dishwasherCount: 1,
};

export const EMPTY_ELECTRIC_STATE: ElectricState = {
  roughPoints: 0,
  finishPoints: 0,
  gx53Lamps: 0,
};

export const BENCHMARK_ELECTRIC_STATE: ElectricState = {
  roughPoints: 20,
  finishPoints: 60,
  gx53Lamps: 52,
};

export const EMPTY_SERVICE_STATE: ServiceState = {
  wrappingDoorsWindows: 0,
  interiorDoors: 0,
  ventilationSet: 0,
  drywallTransomsAndBoxes: 0,
  garbageRemovalAndCleaning: 0,
};

export const BENCHMARK_SERVICE_STATE: ServiceState = {
  wrappingDoorsWindows: 1,
  interiorDoors: 6,
  ventilationSet: 3,
  drywallTransomsAndBoxes: 1,
  garbageRemovalAndCleaning: 1,
};

const formatPrice = (val: number): string => {
  return Math.round(val).toLocaleString('ru-RU');
};

/**
 * Универсальная строка позиции: Название (с возможностью редактирования), Описание, 
 * Редактируемая цена за единицу, Счётчик [-] [кол-во] [+] и Итого + DND перетягивание
 */
interface SurveyItemRowProps {
  id?: string;
  secId?: string;
  title: string;
  desc?: string;
  badge?: React.ReactNode;
  unitPrice: number;
  unit: string;
  qty: number;
  step?: number;
  onPriceChange: (newPrice: number) => void;
  onQtyChange: (newQty: number) => void;
  onTitleChange?: (newTitle: string) => void;
  onDelete?: () => void;
  // Drag and Drop
  draggable?: boolean;
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
}

const SurveyItemRow: React.FC<SurveyItemRowProps> = ({
  id,
  secId,
  title,
  desc,
  badge,
  unitPrice,
  unit,
  qty,
  step = 1,
  onPriceChange,
  onQtyChange,
  onTitleChange,
  onDelete,
  draggable = true,
  isDragging = false,
  isDragOver = false,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}) => {
  const lineTotal = Number((qty * unitPrice).toFixed(1));
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);

  useEffect(() => {
    setTempTitle(title);
  }, [title]);

  const handleSaveTitle = () => {
    if (tempTitle.trim() && onTitleChange) {
      onTitleChange(tempTitle.trim());
    }
    setIsEditingTitle(false);
  };

  return (
    <div 
      draggable={draggable && !isEditingTitle}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`p-2.5 rounded-xl bg-white border transition-all shadow-2xs space-y-2 group ${
        isDragging 
          ? 'opacity-30 border-dashed border-amber-400 bg-amber-50/70 scale-[0.98]' 
          : isDragOver
            ? 'border-t-4 border-t-amber-500 border-x-amber-200 border-b-amber-200 bg-amber-50/40 shadow-sm'
            : 'border-slate-200 hover:border-amber-300'
      }`}
    >
      {/* Верхняя строка: Ручка DND, Название (с возможностью редактирования), бейдж и сумма */}
      <div className="flex items-start justify-between gap-1.5">
        <div className="flex items-start gap-1.5 flex-1 min-w-0">
          {/* Ручка перетягивания */}
          {draggable && (
            <div 
              className="text-slate-300 group-hover:text-slate-500 hover:text-amber-600 active:text-amber-700 cursor-grab active:cursor-grabbing p-0.5 -ml-1 mt-0.5 rounded transition-colors shrink-0 flex items-center justify-center select-none"
              title="Потяните, чтобы поменять местами с другой позицией в разделе"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            {isEditingTitle ? (
              <div 
                className="flex items-center gap-1 w-full my-0.5 animate-in fade-in"
                onMouseDown={e => e.stopPropagation()}
              >
                <input
                  type="text"
                  autoFocus
                  value={tempTitle}
                  onChange={e => setTempTitle(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') {
                      setTempTitle(title);
                      setIsEditingTitle(false);
                    }
                  }}
                  className="flex-1 px-2 py-0.5 text-xs font-bold text-slate-900 bg-amber-50/60 border border-amber-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-inner"
                />
                <button
                  type="button"
                  onClick={handleSaveTitle}
                  className="p-1 rounded bg-amber-600 hover:bg-amber-700 text-white cursor-pointer shadow-xs"
                  title="Сохранить название [Enter]"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTempTitle(title);
                    setIsEditingTitle(false);
                  }}
                  className="p-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 cursor-pointer"
                  title="Отмена [Esc]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  onClick={() => onTitleChange && setIsEditingTitle(true)}
                  className={`font-bold text-xs text-slate-900 leading-tight ${
                    onTitleChange ? 'cursor-pointer hover:text-amber-800 transition-colors' : ''
                  }`}
                  title={onTitleChange ? 'Кликните, чтобы изменить название работы' : undefined}
                >
                  {title}
                </span>
                {onTitleChange && (
                  <button
                    type="button"
                    onClick={() => setIsEditingTitle(true)}
                    className="p-1 rounded-md text-slate-400 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer shrink-0"
                    title="Изменить название работы (кликните на название или на карандаш)"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                  </button>
                )}
                {badge}
              </div>
            )}

            {desc && (
              <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                {desc}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/60 block">
            {formatPrice(lineTotal)} ₽
          </span>
          {onDelete && (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onDelete();
              }}
              onMouseDown={e => e.stopPropagation()}
              className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
              title="Удалить позицию"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Нижняя строка: Редактируемая цена за единицу + Счётчик количества */}
      <div 
        className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs"
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Редактируемая цена за единицу */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400 font-semibold">Цена:</span>
          <div className="flex items-center border border-slate-300 rounded-lg px-1.5 py-0.5 bg-slate-50 focus-within:bg-white focus-within:ring-1 focus-within:ring-amber-500 focus-within:border-amber-500 transition-colors">
            <input
              type="number"
              value={unitPrice || 0}
              onChange={e => onPriceChange(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-16 text-right font-mono font-bold text-xs bg-transparent focus:outline-none text-slate-800"
              title="Нажмите, чтобы изменить цену за единицу"
              placeholder="0"
            />
            <span className="text-[10px] font-mono text-slate-500 ml-1">₽ / {unit}</span>
          </div>
        </div>

        {/* Счётчик количества [-] [qty] [+] */}
        <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white shrink-0 shadow-2xs">
          <button
            type="button"
            onClick={() => onQtyChange(Math.max(0, Number((qty - step).toFixed(2))))}
            className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors select-none cursor-pointer"
            title="Уменьшить количество"
          >
            -
          </button>
          <input
            type="number"
            step={step}
            value={qty}
            onChange={e => onQtyChange(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-12 text-center text-xs font-mono font-bold border-x border-slate-300 py-1 bg-white focus:outline-none focus:bg-amber-50"
          />
          <button
            type="button"
            onClick={() => onQtyChange(Number((qty + step).toFixed(2)))}
            className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors select-none cursor-pointer"
            title="Увеличить количество"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};

export const PieceworkSurveyPanel: React.FC<PieceworkSurveyPanelProps> = ({
  constants,
  onChange,
  onPriceOverridesChange,
  onNavigateToEstimate,
  className = ''
}) => {
  // 1. Цены за единицу по ВСЕМ позициям (полностью редактируемые)
  const [prices, setPrices] = useState<SurveyPricesState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SURVEY_PRICES);
      if (saved) return { ...DEFAULT_SURVEY_PRICES, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_SURVEY_PRICES;
  });

  // 2. Пользовательские переименования названий работ
  const [workTitles, setWorkTitles] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SURVEY_TITLES);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  const getWorkTitle = (key: string, defaultTitle: string) => workTitles[key] || defaultTitle;
  const setWorkTitle = (key: string, newTitle: string) => {
    setWorkTitles(prev => ({ ...prev, [key]: newTitle }));
  };

  // 3. Дополнительные позиции в стандартных разделах (1. Электрика, 2. Сантехника ванная, 3. Кухня, 4. Двери/сервис)
  const [sectionExtraItems, setSectionExtraItems] = useState<Record<string, CustomSectionItem[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SURVEY_EXTRA_ITEMS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  // 4. Сантехника Туалет + Ванная (приборы)
  const [bathAppliances, setBathAppliances] = useState<BathAppliancesState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SURVEY_STATE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.bathAppliances) return parsed.bathAppliances;
      }
    } catch {}
    if (constants.plumbingHotColdPoints > 0 || constants.plumbingToiletInstallation > 0) {
      return BENCHMARK_BATH_APPLIANCES;
    }
    return EMPTY_BATH_APPLIANCES;
  });

  // 5. Сантехника Кухня (приборы)
  const [kitchenAppliances, setKitchenAppliances] = useState<KitchenAppliancesState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SURVEY_STATE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.kitchenAppliances) return parsed.kitchenAppliances;
      }
    } catch {}
    if (constants.plumbingHotColdPoints > 0) {
      return BENCHMARK_KITCHEN_APPLIANCES;
    }
    return EMPTY_KITCHEN_APPLIANCES;
  });

  // 6. Электрика
  const [electricState, setElectricState] = useState<ElectricState>(() => {
    return {
      roughPoints: constants.electricRoughPoints ?? 0,
      finishPoints: constants.electricFinishPoints ?? 0,
      gx53Lamps: constants.ceilingLampsGX53Count ?? 0,
    };
  });

  // 7. Двери, подготовка и сервис
  const [serviceState, setServiceState] = useState<ServiceState>(() => {
    return {
      wrappingDoorsWindows: constants.prepWorkWrapping ?? 0,
      interiorDoors: constants.interiorDoorsCount ?? 0,
      ventilationSet: (constants.bathVentFanMount || constants.toiletVentFanMount || constants.kitchenHoodVent) ? 3 : 0,
      drywallTransomsAndBoxes: (constants.corridorDoorTransomGyp || constants.bathGypBoxM || constants.toiletGypBoxInstall) ? 1 : 0,
      garbageRemovalAndCleaning: (constants.garbageRemovalTrips || constants.cleaningAfterRenovation) ? 1 : 0,
    };
  });

  // 8. Пользовательские разделы
  const [customSections, setCustomSections] = useState<CustomSurveySection[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_SECTIONS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // 9. Форма добавления позиции (с выбором раздела или созданием нового)
  const formTopRef = useRef<HTMLDivElement>(null);
  const [isAddingPosition, setIsAddingPosition] = useState<boolean>(false);
  const [addPosSectionId, setAddPosSectionId] = useState<string>('sec_electric');
  const [addPosIsNewSection, setAddPosIsNewSection] = useState<boolean>(false);
  const [addPosNewSectionTitle, setAddPosNewSectionTitle] = useState<string>('');
  const [addPosNewSectionDesc, setAddPosNewSectionDesc] = useState<string>('');
  const [addPosName, setAddPosName] = useState<string>('');
  const [addPosUnitPrice, setAddPosUnitPrice] = useState<number>(1500);
  const [addPosUnit, setAddPosUnit] = useState<string>('шт');
  const [addPosQuantity, setAddPosQuantity] = useState<number>(1);

  // 10. Форма быстрого создания раздела внизу
  const [isCreatingSectionOnly, setIsCreatingSectionOnly] = useState<boolean>(false);
  const [newOnlySectionTitle, setNewOnlySectionTitle] = useState<string>('');
  const [newOnlySectionDesc, setNewOnlySectionDesc] = useState<string>('');

  // 11. Порядок позиций в разделах (Drag and Drop перетягивание)
  const [itemOrders, setItemOrders] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SURVEY_ITEM_ORDER);
      if (saved) return { ...DEFAULT_SECTION_ITEM_ORDERS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_SECTION_ITEM_ORDERS;
  });

  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [draggedSecId, setDraggedSecId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);

  // 12. Скрытые (удаленные пользователем) стандартные позиции
  const [hiddenItemIds, setHiddenItemIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SURVEY_HIDDEN_ITEMS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SURVEY_HIDDEN_ITEMS, JSON.stringify(hiddenItemIds));
    } catch {}
  }, [hiddenItemIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SURVEY_ITEM_ORDER, JSON.stringify(itemOrders));
    } catch {}
  }, [itemOrders]);

  useEffect(() => {
    if (isAddingPosition && formTopRef.current) {
      formTopRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isAddingPosition]);

  // Сохранение в localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SURVEY_PRICES, JSON.stringify(prices));
    } catch {}
  }, [prices]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SURVEY_TITLES, JSON.stringify(workTitles));
    } catch {}
  }, [workTitles]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SURVEY_EXTRA_ITEMS, JSON.stringify(sectionExtraItems));
    } catch {}
  }, [sectionExtraItems]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SURVEY_STATE, JSON.stringify({
        bathAppliances,
        kitchenAppliances
      }));
    } catch {}
  }, [bathAppliances, kitchenAppliances]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM_SECTIONS, JSON.stringify(customSections));
    } catch {}
  }, [customSections]);

  // Расчет точек сантехники Туалет + Ванная
  const bathPlumbingPoints = useMemo(() => {
    return (
      bathAppliances.toiletCount * 1 +
      bathAppliances.bathOrShowerCount * 2 +
      bathAppliances.sinkCount * 2 +
      bathAppliances.washingMachineCount * 1 +
      bathAppliances.hygienicShowerCount * (bathAppliances.hygienicWaterPoints || 2) +
      bathAppliances.towelRailCount * (bathAppliances.towelRailWaterPoints || 0)
    );
  }, [bathAppliances]);

  const bathSewerPoints = useMemo(() => {
    return (
      bathAppliances.toiletCount * 1 +
      bathAppliances.bathOrShowerCount * 1 +
      bathAppliances.sinkCount * 1 +
      bathAppliances.washingMachineCount * 1 +
      bathAppliances.hygienicShowerCount * 1 +
      bathAppliances.towelRailCount * 1
    );
  }, [bathAppliances]);

  // Расчет точек сантехники Кухня
  const kitchenPlumbingPoints = useMemo(() => {
    return (
      kitchenAppliances.kitchenSinkCount * 2 +
      kitchenAppliances.dishwasherCount * 1
    );
  }, [kitchenAppliances]);

  const kitchenSewerPoints = useMemo(() => {
    return (
      kitchenAppliances.kitchenSinkCount * 1 +
      kitchenAppliances.dishwasherCount * 1
    );
  }, [kitchenAppliances]);

  // Общие точки по всему объекту
  const totalWaterPoints = bathPlumbingPoints + kitchenPlumbingPoints;
  const totalSewerPoints = bathSewerPoints + kitchenSewerPoints;

  // Автоматическая синхронизация с constants сметы
  useEffect(() => {
    const updated: ObjectChecklistConstants = {
      ...constants,
      plumbingHotColdPoints: totalWaterPoints,
      plumbingSewerPoints: totalSewerPoints,
      plumbingToiletInstallation: bathAppliances.toiletInstallationMount,
      bathShowerTrayPoddon: bathAppliances.showerTray800x1500,
      tileCleanCutBathToiletM: bathAppliances.tileCleanCutM,
      electricRoughPoints: electricState.roughPoints,
      electricFinishPoints: electricState.finishPoints,
      ceilingLampsGX53Count: electricState.gx53Lamps,
      interiorDoorsCount: serviceState.interiorDoors,
      prepWorkWrapping: serviceState.wrappingDoorsWindows,
    };
    onChange(updated);

    // Уведомляем о переопределении цен для 118 сметы
    if (onPriceOverridesChange) {
      onPriceOverridesChange({
        'krd_118_1': prices.wrappingDoorsWindows,
        'krd_118_6': prices.toiletInstallationMount,
        'krd_118_7': prices.electricRough,
        'krd_118_10': prices.electricFinish,
        'krd_118_29': prices.showerTray800x1500,
        'krd_118_42': prices.tileCleanCutM,
        'krd_118_58': prices.tileCleanCutM,
        'krd_118_46': prices.tileHolesCount,
        'krd_118_63': prices.tileHolesCount,
        'krd_118_113': prices.lampGX53,
        'krd_118_114': prices.interiorDoors,
      });
    }
  }, [totalWaterPoints, totalSewerPoints, bathAppliances, kitchenAppliances, electricState, serviceState, prices]);

  // Стоимости по разделам (включая дополнительные позиции в каждом разделе)
  const isItemHidden = (id: string) => hiddenItemIds.includes(id);

  const electricTotal = useMemo(() => {
    const base = (isItemHidden('electricRough') ? 0 : electricState.roughPoints * prices.electricRough) +
      (isItemHidden('electricFinish') ? 0 : electricState.finishPoints * prices.electricFinish) +
      (isItemHidden('lampGX53') ? 0 : electricState.gx53Lamps * prices.lampGX53);
    const extra = (sectionExtraItems['sec_electric'] || []).reduce((sum, it) => sum + (it.quantity * it.unitPrice), 0);
    return base + extra;
  }, [electricState, prices, sectionExtraItems, hiddenItemIds]);

  const bathTotal = useMemo(() => {
    const base = (isItemHidden('toiletFixture') ? 0 : bathAppliances.toiletCount * prices.toiletFixture) +
      (isItemHidden('toiletInstallationMount') ? 0 : bathAppliances.toiletInstallationMount * prices.toiletInstallationMount) +
      (isItemHidden('bathFixture') ? 0 : bathAppliances.bathOrShowerCount * prices.bathFixture) +
      (isItemHidden('sinkFixture') ? 0 : bathAppliances.sinkCount * prices.sinkFixture) +
      (isItemHidden('washingMachineFixture') ? 0 : bathAppliances.washingMachineCount * prices.washingMachineFixture) +
      (isItemHidden('hygienicShowerFixture') ? 0 : bathAppliances.hygienicShowerCount * prices.hygienicShowerFixture) +
      (isItemHidden('towelRailFixture') ? 0 : bathAppliances.towelRailCount * prices.towelRailFixture) +
      (isItemHidden('showerTray800x1500') ? 0 : bathAppliances.showerTray800x1500 * prices.showerTray800x1500) +
      (isItemHidden('tileCleanCutM') ? 0 : Math.round(bathAppliances.tileCleanCutM * prices.tileCleanCutM)) +
      (isItemHidden('tileHolesCount') ? 0 : bathAppliances.tileHolesCount * prices.tileHolesCount) +
      (isItemHidden('sanitaryFixturesSet') ? 0 : bathAppliances.sanitaryFixturesSet * prices.sanitaryFixturesSet);
    const extra = (sectionExtraItems['sec_bath'] || []).reduce((sum, it) => sum + (it.quantity * it.unitPrice), 0);
    return base + extra;
  }, [bathAppliances, prices, sectionExtraItems, hiddenItemIds]);

  const kitchenTotal = useMemo(() => {
    const base = (isItemHidden('kitchenSinkFixture') ? 0 : kitchenAppliances.kitchenSinkCount * prices.kitchenSinkFixture) +
      (isItemHidden('dishwasherFixture') ? 0 : kitchenAppliances.dishwasherCount * prices.dishwasherFixture);
    const extra = (sectionExtraItems['sec_kitchen'] || []).reduce((sum, it) => sum + (it.quantity * it.unitPrice), 0);
    return base + extra;
  }, [kitchenAppliances, prices, sectionExtraItems, hiddenItemIds]);

  const serviceTotal = useMemo(() => {
    const base = (isItemHidden('wrappingDoorsWindows') ? 0 : serviceState.wrappingDoorsWindows * prices.wrappingDoorsWindows) +
      (isItemHidden('interiorDoors') ? 0 : serviceState.interiorDoors * prices.interiorDoors) +
      (isItemHidden('ventilationUnit') ? 0 : serviceState.ventilationSet * prices.ventilationUnit) +
      (isItemHidden('drywallTransomsBoxes') ? 0 : serviceState.drywallTransomsAndBoxes * prices.drywallTransomsBoxes) +
      (isItemHidden('garbageRemovalCleaning') ? 0 : serviceState.garbageRemovalAndCleaning * prices.garbageRemovalCleaning);
    const extra = (sectionExtraItems['sec_service'] || []).reduce((sum, it) => sum + (it.quantity * it.unitPrice), 0);
    return base + extra;
  }, [serviceState, prices, sectionExtraItems, hiddenItemIds]);

  const customSectionsTotal = useMemo(() => {
    return customSections.reduce((acc, sec) => {
      const secSum = sec.items.reduce((sum, it) => sum + (it.quantity * it.unitPrice), 0);
      return acc + secSum;
    }, 0);
  }, [customSections]);

  const grandPieceworkTotal = electricTotal + bathTotal + kitchenTotal + serviceTotal + customSectionsTotal;

  // 1. Сброс всех количеств в 0 с сохранением всех указанных расценок и цен за единицу
  const handleResetQuantities = () => {
    if (confirm('Сбросить все количества в 0?\n\nВсе указанные расценки и цены за единицу будут сохранены.')) {
      setBathAppliances(EMPTY_BATH_APPLIANCES);
      setKitchenAppliances(EMPTY_KITCHEN_APPLIANCES);
      setElectricState(EMPTY_ELECTRIC_STATE);
      setServiceState(EMPTY_SERVICE_STATE);
      setCustomSections(prev => prev.map(s => ({
        ...s,
        items: s.items.map(it => ({ ...it, quantity: 0 }))
      })));
      setSectionExtraItems(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(k => {
          next[k] = next[k].map(it => ({ ...it, quantity: 0 }));
        });
        return next;
      });
      try {
        localStorage.removeItem(STORAGE_KEY_SURVEY_STATE);
        localStorage.removeItem(STORAGE_KEY_SURVEY_EXTRA_ITEMS);
      } catch {}
      onChange(EMPTY_OBJECT_CONSTANTS);
    }
  };

  // 2. Загрузка заводского эталона квартиры 63 м²
  const handleLoadBenchmark = () => {
    setBathAppliances(BENCHMARK_BATH_APPLIANCES);
    setKitchenAppliances(BENCHMARK_KITCHEN_APPLIANCES);
    setElectricState(BENCHMARK_ELECTRIC_STATE);
    setServiceState(BENCHMARK_SERVICE_STATE);
    onChange(BENCHMARK_63_OBJECT_CONSTANTS);
  };

  // 3. Сброс цен к заводским
  const handleResetPricesToFactory = () => {
    if (confirm('Сбросить все расценки и названия работ к заводским по Краснодару?')) {
      setPrices(DEFAULT_SURVEY_PRICES);
      setWorkTitles({});
      setItemOrders(DEFAULT_SECTION_ITEM_ORDERS);
      setHiddenItemIds([]);
      try {
        localStorage.removeItem(STORAGE_KEY_SURVEY_PRICES);
        localStorage.removeItem(STORAGE_KEY_SURVEY_TITLES);
        localStorage.removeItem(STORAGE_KEY_SURVEY_ITEM_ORDER);
        localStorage.removeItem(STORAGE_KEY_SURVEY_HIDDEN_ITEMS);
      } catch {}
    }
  };

  // Сохранение новой позиции (из формы добавления)
  const handleSaveNewPosition = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!addPosName.trim()) {
      alert('Пожалуйста, введите название работы или материала');
      return;
    }

    const newItem: CustomSectionItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: addPosName.trim(),
      unit: addPosUnit.trim() || 'шт',
      unitPrice: Math.max(0, addPosUnitPrice || 0),
      quantity: Math.max(1, addPosQuantity || 1),
    };

    if (addPosIsNewSection) {
      const newSecTitle = addPosNewSectionTitle.trim() || 'Новый раздел';
      const newSec: CustomSurveySection = {
        id: `sec_${Date.now()}`,
        title: newSecTitle,
        description: addPosNewSectionDesc.trim(),
        items: [newItem]
      };
      setCustomSections(prev => [...prev, newSec]);
    } else if (customSections.some(s => s.id === addPosSectionId)) {
      setCustomSections(prev => prev.map(s => {
        if (s.id !== addPosSectionId) return s;
        return {
          ...s,
          items: [...s.items, newItem]
        };
      }));
    } else {
      // Стандартный раздел (sec_electric, sec_bath, sec_kitchen, sec_service)
      setSectionExtraItems(prev => ({
        ...prev,
        [addPosSectionId]: [...(prev[addPosSectionId] || []), newItem]
      }));
    }

    // Сброс формы
    setAddPosName('');
    setAddPosUnitPrice(1500);
    setAddPosQuantity(1);
    setAddPosNewSectionTitle('');
    setAddPosNewSectionDesc('');
    setIsAddingPosition(false);
  };

  // Сохранение нового раздела внизу (быстрое создание пустого раздела)
  const handleSaveNewSectionOnly = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newOnlySectionTitle.trim()) {
      alert('Пожалуйста, введите название нового раздела');
      return;
    }
    const newSec: CustomSurveySection = {
      id: `sec_${Date.now()}`,
      title: newOnlySectionTitle.trim(),
      description: newOnlySectionDesc.trim(),
      items: []
    };
    setCustomSections(prev => [...prev, newSec]);
    setNewOnlySectionTitle('');
    setNewOnlySectionDesc('');
    setIsCreatingSectionOnly(false);
  };

  // Управление позициями в стандартных разделах
  const handleUpdateExtraItem = (secId: string, itemId: string, field: keyof CustomSectionItem, val: any) => {
    setSectionExtraItems(prev => {
      const list = prev[secId] || [];
      return {
        ...prev,
        [secId]: list.map(it => it.id === itemId ? { ...it, [field]: val } : it)
      };
    });
  };

  const handleDeleteExtraItem = (secId: string, itemId: string) => {
    setSectionExtraItems(prev => {
      const list = prev[secId] || [];
      return {
        ...prev,
        [secId]: list.filter(it => it.id !== itemId)
      };
    });
  };

  // Управление пользовательскими разделами
  const handleDeleteSection = (secId: string) => {
    if (confirm('Удалить этот раздел штучных работ со всеми позициями?')) {
      setCustomSections(prev => prev.filter(s => s.id !== secId));
    }
  };

  const handleUpdateSectionTitle = (secId: string, newTitle: string) => {
    setCustomSections(prev => prev.map(s => s.id === secId ? { ...s, title: newTitle } : s));
  };

  const handleUpdateCustomItem = (secId: string, itemId: string, field: keyof CustomSectionItem, val: any) => {
    setCustomSections(prev => prev.map(s => {
      if (s.id !== secId) return s;
      return {
        ...s,
        items: s.items.map(it => it.id === itemId ? { ...it, [field]: val } : it)
      };
    }));
  };

  const handleDeleteCustomItem = (secId: string, itemId: string) => {
    setCustomSections(prev => prev.map(s => {
      if (s.id !== secId) return s;
      return {
        ...s,
        items: s.items.filter(it => it.id !== itemId)
      };
    }));
  };

  // --- DRAG AND DROP (DND): ПЕРЕМЕЩЕНИЕ И СОРТИРОВКА ПОЗИЦИЙ В РАЗДЕЛАХ ---
  const getOrderedItemIds = (secId: string, standardIds: string[], extraItems: CustomSectionItem[]): string[] => {
    const currentOrder = itemOrders[secId] || standardIds;
    const extraIds = extraItems.map(it => it.id);
    const allKnownIds = new Set([...standardIds, ...extraIds]);

    const result: string[] = currentOrder.filter(id => allKnownIds.has(id) && !hiddenItemIds.includes(id));
    standardIds.forEach(id => {
      if (!result.includes(id) && !hiddenItemIds.includes(id)) result.push(id);
    });
    extraIds.forEach(id => {
      if (!result.includes(id) && !hiddenItemIds.includes(id)) result.push(id);
    });
    return result;
  };

  // Удаление стандартной позиции (скрытие из замера и обнуление объема)
  const handleDeleteStandardItem = (itemId: string, itemTitle: string) => {
    if (confirm(`Удалить позицию «${itemTitle}» из сметы замера?\nЕе можно будет восстановить в любое время.`)) {
      setHiddenItemIds(prev => prev.includes(itemId) ? prev : [...prev, itemId]);
      switch (itemId) {
        case 'electricRough': setElectricState(prev => ({ ...prev, roughPoints: 0 })); break;
        case 'electricFinish': setElectricState(prev => ({ ...prev, finishPoints: 0 })); break;
        case 'lampGX53': setElectricState(prev => ({ ...prev, gx53Lamps: 0 })); break;
        case 'toiletFixture': setBathAppliances(prev => ({ ...prev, toiletCount: 0 })); break;
        case 'toiletInstallationMount': setBathAppliances(prev => ({ ...prev, toiletInstallationMount: 0 })); break;
        case 'bathFixture': setBathAppliances(prev => ({ ...prev, bathOrShowerCount: 0 })); break;
        case 'sinkFixture': setBathAppliances(prev => ({ ...prev, sinkCount: 0 })); break;
        case 'washingMachineFixture': setBathAppliances(prev => ({ ...prev, washingMachineCount: 0 })); break;
        case 'hygienicShowerFixture': setBathAppliances(prev => ({ ...prev, hygienicShowerCount: 0 })); break;
        case 'towelRailFixture': setBathAppliances(prev => ({ ...prev, towelRailCount: 0 })); break;
        case 'showerTray800x1500': setBathAppliances(prev => ({ ...prev, showerTray800x1500: 0 })); break;
        case 'tileCleanCutM': setBathAppliances(prev => ({ ...prev, tileCleanCutM: 0 })); break;
        case 'tileHolesCount': setBathAppliances(prev => ({ ...prev, tileHolesCount: 0 })); break;
        case 'sanitaryFixturesSet': setBathAppliances(prev => ({ ...prev, sanitaryFixturesSet: 0 })); break;
        case 'kitchenSinkFixture': setKitchenAppliances(prev => ({ ...prev, kitchenSinkCount: 0 })); break;
        case 'dishwasherFixture': setKitchenAppliances(prev => ({ ...prev, dishwasherCount: 0 })); break;
        case 'wrappingDoorsWindows': setServiceState(prev => ({ ...prev, wrappingDoorsWindows: 0 })); break;
        case 'interiorDoors': setServiceState(prev => ({ ...prev, interiorDoors: 0 })); break;
        case 'ventilationUnit': setServiceState(prev => ({ ...prev, ventilationSet: 0 })); break;
        case 'drywallTransomsBoxes': setServiceState(prev => ({ ...prev, drywallTransomsAndBoxes: 0 })); break;
        case 'garbageRemovalCleaning': setServiceState(prev => ({ ...prev, garbageRemovalAndCleaning: 0 })); break;
        default: break;
      }
    }
  };

  // Восстановление удаленной позиции
  const handleRestoreStandardItem = (itemId: string) => {
    setHiddenItemIds(prev => prev.filter(id => id !== itemId));
    switch (itemId) {
      case 'electricRough': setElectricState(prev => ({ ...prev, roughPoints: prev.roughPoints || 60 })); break;
      case 'electricFinish': setElectricState(prev => ({ ...prev, finishPoints: prev.finishPoints || 60 })); break;
      case 'lampGX53': setElectricState(prev => ({ ...prev, gx53Lamps: prev.gx53Lamps || 52 })); break;
      case 'toiletFixture': setBathAppliances(prev => ({ ...prev, toiletCount: prev.toiletCount || 1 })); break;
      case 'toiletInstallationMount': setBathAppliances(prev => ({ ...prev, toiletInstallationMount: prev.toiletInstallationMount || 1 })); break;
      case 'bathFixture': setBathAppliances(prev => ({ ...prev, bathOrShowerCount: prev.bathOrShowerCount || 1 })); break;
      case 'sinkFixture': setBathAppliances(prev => ({ ...prev, sinkCount: prev.sinkCount || 2 })); break;
      case 'washingMachineFixture': setBathAppliances(prev => ({ ...prev, washingMachineCount: prev.washingMachineCount || 1 })); break;
      case 'hygienicShowerFixture': setBathAppliances(prev => ({ ...prev, hygienicShowerCount: prev.hygienicShowerCount || 1 })); break;
      case 'towelRailFixture': setBathAppliances(prev => ({ ...prev, towelRailCount: prev.towelRailCount || 1 })); break;
      case 'showerTray800x1500': setBathAppliances(prev => ({ ...prev, showerTray800x1500: prev.showerTray800x1500 || 1 })); break;
      case 'tileCleanCutM': setBathAppliances(prev => ({ ...prev, tileCleanCutM: prev.tileCleanCutM || 1.6 })); break;
      case 'tileHolesCount': setBathAppliances(prev => ({ ...prev, tileHolesCount: prev.tileHolesCount || 16 })); break;
      case 'sanitaryFixturesSet': setBathAppliances(prev => ({ ...prev, sanitaryFixturesSet: prev.sanitaryFixturesSet || 1 })); break;
      case 'kitchenSinkFixture': setKitchenAppliances(prev => ({ ...prev, kitchenSinkCount: prev.kitchenSinkCount || 1 })); break;
      case 'dishwasherFixture': setKitchenAppliances(prev => ({ ...prev, dishwasherCount: prev.dishwasherCount || 1 })); break;
      case 'wrappingDoorsWindows': setServiceState(prev => ({ ...prev, wrappingDoorsWindows: prev.wrappingDoorsWindows || 1 })); break;
      case 'interiorDoors': setServiceState(prev => ({ ...prev, interiorDoors: prev.interiorDoors || 5 })); break;
      case 'ventilationUnit': setServiceState(prev => ({ ...prev, ventilationSet: prev.ventilationSet || 2 })); break;
      case 'drywallTransomsBoxes': setServiceState(prev => ({ ...prev, drywallTransomsAndBoxes: prev.drywallTransomsAndBoxes || 1 })); break;
      case 'garbageRemovalCleaning': setServiceState(prev => ({ ...prev, garbageRemovalAndCleaning: prev.garbageRemovalAndCleaning || 1 })); break;
      default: break;
    }
  };

  const handleRestoreAllHidden = () => {
    setHiddenItemIds([]);
  };

  const handleDragStart = (e: React.DragEvent, secId: string, itemId: string) => {
    setDraggedItemId(itemId);
    setDraggedSecId(secId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', itemId);
  };

  const handleDragOver = (e: React.DragEvent, secId: string, itemId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverItemId !== itemId) {
      setDragOverItemId(itemId);
    }
  };

  const handleDragLeave = () => {
    // leave
  };

  const handleMoveItem = (secId: string, fromId: string, toId: string) => {
    if (fromId === toId) return;

    if (secId.startsWith('sec_')) {
      setItemOrders(prev => {
        const standardIds = DEFAULT_SECTION_ITEM_ORDERS[secId] || [];
        const extraItems = sectionExtraItems[secId] || [];
        const currentOrder = getOrderedItemIds(secId, standardIds, extraItems);
        const fromIdx = currentOrder.indexOf(fromId);
        const toIdx = currentOrder.indexOf(toId);
        if (fromIdx === -1 || toIdx === -1) return prev;

        const newOrder = [...currentOrder];
        newOrder.splice(fromIdx, 1);
        newOrder.splice(toIdx, 0, fromId);

        return {
          ...prev,
          [secId]: newOrder
        };
      });
    } else {
      // Пользовательский раздел
      setCustomSections(prev => prev.map(sec => {
        if (sec.id !== secId) return sec;
        const items = [...sec.items];
        const fromIdx = items.findIndex(it => it.id === fromId);
        const toIdx = items.findIndex(it => it.id === toId);
        if (fromIdx === -1 || toIdx === -1) return sec;

        const [moved] = items.splice(fromIdx, 1);
        items.splice(toIdx, 0, moved);
        return { ...sec, items };
      }));
    }
  };

  const handleDrop = (e: React.DragEvent, secId: string, targetItemId: string) => {
    e.preventDefault();
    if (draggedItemId && draggedSecId === secId && draggedItemId !== targetItemId) {
      handleMoveItem(secId, draggedItemId, targetItemId);
    }
    setDraggedItemId(null);
    setDraggedSecId(null);
    setDragOverItemId(null);
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
    setDraggedSecId(null);
    setDragOverItemId(null);
  };

  // --- РЕНДЕР ПОЗИЦИЙ РАЗДЕЛА 1: ЭЛЕКТРОМОНТАЖ ---
  const renderElectricItem = (itemId: string) => {
    if (itemId === 'electricRough') {
      return (
        <SurveyItemRow
          key="electricRough"
          id="electricRough"
          secId="sec_electric"
          draggable
          isDragging={draggedItemId === 'electricRough'}
          isDragOver={dragOverItemId === 'electricRough'}
          onDragStart={e => handleDragStart(e, 'sec_electric', 'electricRough')}
          onDragOver={e => handleDragOver(e, 'sec_electric', 'electricRough')}
          onDragLeave={handleDragLeave}
          onDrop={e => handleDrop(e, 'sec_electric', 'electricRough')}
          onDragEnd={handleDragEnd}
          title={getWorkTitle('electricRough', DEFAULT_WORK_TITLES.electricRough)}
          desc="Штробление, укладка негорючего кабеля ВВГ-Пнг в гофре, установка подрозетников"
          unitPrice={prices.electricRough}
          unit="шт"
          qty={electricState.roughPoints}
          onTitleChange={newTitle => setWorkTitle('electricRough', newTitle)}
          onPriceChange={newPrice => setPrices(prev => ({ ...prev, electricRough: newPrice }))}
          onQtyChange={newQty => setElectricState(prev => ({ ...prev, roughPoints: newQty }))}
          onDelete={() => handleDeleteStandardItem('electricRough', getWorkTitle('electricRough', DEFAULT_WORK_TITLES.electricRough))}
        />
      );
    }
    if (itemId === 'electricFinish') {
      return (
        <SurveyItemRow
          key="electricFinish"
          id="electricFinish"
          secId="sec_electric"
          draggable
          isDragging={draggedItemId === 'electricFinish'}
          isDragOver={dragOverItemId === 'electricFinish'}
          onDragStart={e => handleDragStart(e, 'sec_electric', 'electricFinish')}
          onDragOver={e => handleDragOver(e, 'sec_electric', 'electricFinish')}
          onDragLeave={handleDragLeave}
          onDrop={e => handleDrop(e, 'sec_electric', 'electricFinish')}
          onDragEnd={handleDragEnd}
          title={getWorkTitle('electricFinish', DEFAULT_WORK_TITLES.electricFinish)}
          desc="Монтаж механизмов, рамок, диммеров, терморегуляторов теплого пола и подвес люстр"
          unitPrice={prices.electricFinish}
          unit="шт"
          qty={electricState.finishPoints}
          onTitleChange={newTitle => setWorkTitle('electricFinish', newTitle)}
          onPriceChange={newPrice => setPrices(prev => ({ ...prev, electricFinish: newPrice }))}
          onQtyChange={newQty => setElectricState(prev => ({ ...prev, finishPoints: newQty }))}
          onDelete={() => handleDeleteStandardItem('electricFinish', getWorkTitle('electricFinish', DEFAULT_WORK_TITLES.electricFinish))}
        />
      );
    }
    if (itemId === 'lampGX53') {
      return (
        <SurveyItemRow
          key="lampGX53"
          id="lampGX53"
          secId="sec_electric"
          draggable
          isDragging={draggedItemId === 'lampGX53'}
          isDragOver={dragOverItemId === 'lampGX53'}
          onDragStart={e => handleDragStart(e, 'sec_electric', 'lampGX53')}
          onDragOver={e => handleDragOver(e, 'sec_electric', 'lampGX53')}
          onDragLeave={handleDragLeave}
          onDrop={e => handleDrop(e, 'sec_electric', 'lampGX53')}
          onDragEnd={handleDragEnd}
          title={getWorkTitle('lampGX53', DEFAULT_WORK_TITLES.lampGX53)}
          desc="Установка термоколец, закладных платформ и расключение"
          unitPrice={prices.lampGX53}
          unit="шт"
          qty={electricState.gx53Lamps}
          onTitleChange={newTitle => setWorkTitle('lampGX53', newTitle)}
          onPriceChange={newPrice => setPrices(prev => ({ ...prev, lampGX53: newPrice }))}
          onQtyChange={newQty => setElectricState(prev => ({ ...prev, gx53Lamps: newQty }))}
          onDelete={() => handleDeleteStandardItem('lampGX53', getWorkTitle('lampGX53', DEFAULT_WORK_TITLES.lampGX53))}
        />
      );
    }
    const extra = (sectionExtraItems['sec_electric'] || []).find(it => it.id === itemId);
    if (extra) {
      return (
        <SurveyItemRow
          key={extra.id}
          id={extra.id}
          secId="sec_electric"
          draggable
          isDragging={draggedItemId === extra.id}
          isDragOver={dragOverItemId === extra.id}
          onDragStart={e => handleDragStart(e, 'sec_electric', extra.id)}
          onDragOver={e => handleDragOver(e, 'sec_electric', extra.id)}
          onDragLeave={handleDragLeave}
          onDrop={e => handleDrop(e, 'sec_electric', extra.id)}
          onDragEnd={handleDragEnd}
          title={extra.name}
          unitPrice={extra.unitPrice}
          unit={extra.unit}
          qty={extra.quantity}
          onTitleChange={newTitle => handleUpdateExtraItem('sec_electric', extra.id, 'name', newTitle)}
          onPriceChange={newPrice => handleUpdateExtraItem('sec_electric', extra.id, 'unitPrice', newPrice)}
          onQtyChange={newQty => handleUpdateExtraItem('sec_electric', extra.id, 'quantity', newQty)}
          onDelete={() => handleDeleteExtraItem('sec_electric', extra.id)}
        />
      );
    }
    return null;
  };

  // --- РЕНДЕР ПОЗИЦИЙ РАЗДЕЛА 2: САНТЕХНИКА ТУАЛЕТ + ВАННАЯ ---
  const renderBathItem = (itemId: string) => {
    switch (itemId) {
      case 'toiletFixture':
        return (
          <SurveyItemRow
            key="toiletFixture"
            id="toiletFixture"
            secId="sec_bath"
            draggable
            isDragging={draggedItemId === 'toiletFixture'}
            isDragOver={dragOverItemId === 'toiletFixture'}
            onDragStart={e => handleDragStart(e, 'sec_bath', 'toiletFixture')}
            onDragOver={e => handleDragOver(e, 'sec_bath', 'toiletFixture')}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, 'sec_bath', 'toiletFixture')}
            onDragEnd={handleDragEnd}
            title={getWorkTitle('toiletFixture', DEFAULT_WORK_TITLES.toiletFixture)}
            desc="1 точка сантехники (ХВС) + 1 точка канализации"
            badge={<span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-medium">1 вода + 1 кан.</span>}
            unitPrice={prices.toiletFixture}
            unit="шт"
            qty={bathAppliances.toiletCount}
            onTitleChange={newTitle => setWorkTitle('toiletFixture', newTitle)}
            onPriceChange={newPrice => setPrices(prev => ({ ...prev, toiletFixture: newPrice }))}
            onQtyChange={newQty => setBathAppliances(prev => ({ ...prev, toiletCount: newQty }))}
            onDelete={() => handleDeleteStandardItem('toiletFixture', getWorkTitle('toiletFixture', DEFAULT_WORK_TITLES.toiletFixture))}
          />
        );
      case 'toiletInstallationMount':
        return (
          <SurveyItemRow
            key="toiletInstallationMount"
            id="toiletInstallationMount"
            secId="sec_bath"
            draggable
            isDragging={draggedItemId === 'toiletInstallationMount'}
            isDragOver={dragOverItemId === 'toiletInstallationMount'}
            onDragStart={e => handleDragStart(e, 'sec_bath', 'toiletInstallationMount')}
            onDragOver={e => handleDragOver(e, 'sec_bath', 'toiletInstallationMount')}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, 'sec_bath', 'toiletInstallationMount')}
            onDragEnd={handleDragEnd}
            title={getWorkTitle('toiletInstallationMount', DEFAULT_WORK_TITLES.toiletInstallationMount)}
            desc="Сборка и анкерное крепление металлической рамы инсталляции к полу и стене"
            unitPrice={prices.toiletInstallationMount}
            unit="шт"
            qty={bathAppliances.toiletInstallationMount}
            onTitleChange={newTitle => setWorkTitle('toiletInstallationMount', newTitle)}
            onPriceChange={newPrice => setPrices(prev => ({ ...prev, toiletInstallationMount: newPrice }))}
            onQtyChange={newQty => setBathAppliances(prev => ({ ...prev, toiletInstallationMount: newQty }))}
            onDelete={() => handleDeleteStandardItem('toiletInstallationMount', getWorkTitle('toiletInstallationMount', DEFAULT_WORK_TITLES.toiletInstallationMount))}
          />
        );
      case 'bathFixture':
        return (
          <SurveyItemRow
            key="bathFixture"
            id="bathFixture"
            secId="sec_bath"
            draggable
            isDragging={draggedItemId === 'bathFixture'}
            isDragOver={dragOverItemId === 'bathFixture'}
            onDragStart={e => handleDragStart(e, 'sec_bath', 'bathFixture')}
            onDragOver={e => handleDragOver(e, 'sec_bath', 'bathFixture')}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, 'sec_bath', 'bathFixture')}
            onDragEnd={handleDragEnd}
            title={getWorkTitle('bathFixture', DEFAULT_WORK_TITLES.bathFixture)}
            desc="2 точки сантехники (ГВС+ХВС) + 1 точка канализации"
            badge={<span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-medium">2 воды + 1 кан.</span>}
            unitPrice={prices.bathFixture}
            unit="шт"
            qty={bathAppliances.bathOrShowerCount}
            onTitleChange={newTitle => setWorkTitle('bathFixture', newTitle)}
            onPriceChange={newPrice => setPrices(prev => ({ ...prev, bathFixture: newPrice }))}
            onQtyChange={newQty => setBathAppliances(prev => ({ ...prev, bathOrShowerCount: newQty }))}
            onDelete={() => handleDeleteStandardItem('bathFixture', getWorkTitle('bathFixture', DEFAULT_WORK_TITLES.bathFixture))}
          />
        );
      case 'sinkFixture':
        return (
          <SurveyItemRow
            key="sinkFixture"
            id="sinkFixture"
            secId="sec_bath"
            draggable
            isDragging={draggedItemId === 'sinkFixture'}
            isDragOver={dragOverItemId === 'sinkFixture'}
            onDragStart={e => handleDragStart(e, 'sec_bath', 'sinkFixture')}
            onDragOver={e => handleDragOver(e, 'sec_bath', 'sinkFixture')}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, 'sec_bath', 'sinkFixture')}
            onDragEnd={handleDragEnd}
            title={getWorkTitle('sinkFixture', DEFAULT_WORK_TITLES.sinkFixture)}
            desc="2 точки сантехники (ГВС+ХВС) + 1 точка канализации"
            badge={<span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-medium">2 воды + 1 кан.</span>}
            unitPrice={prices.sinkFixture}
            unit="шт"
            qty={bathAppliances.sinkCount}
            onTitleChange={newTitle => setWorkTitle('sinkFixture', newTitle)}
            onPriceChange={newPrice => setPrices(prev => ({ ...prev, sinkFixture: newPrice }))}
            onQtyChange={newQty => setBathAppliances(prev => ({ ...prev, sinkCount: newQty }))}
            onDelete={() => handleDeleteStandardItem('sinkFixture', getWorkTitle('sinkFixture', DEFAULT_WORK_TITLES.sinkFixture))}
          />
        );
      case 'washingMachineFixture':
        return (
          <SurveyItemRow
            key="washingMachineFixture"
            id="washingMachineFixture"
            secId="sec_bath"
            draggable
            isDragging={draggedItemId === 'washingMachineFixture'}
            isDragOver={dragOverItemId === 'washingMachineFixture'}
            onDragStart={e => handleDragStart(e, 'sec_bath', 'washingMachineFixture')}
            onDragOver={e => handleDragOver(e, 'sec_bath', 'washingMachineFixture')}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, 'sec_bath', 'washingMachineFixture')}
            onDragEnd={handleDragEnd}
            title={getWorkTitle('washingMachineFixture', DEFAULT_WORK_TITLES.washingMachineFixture)}
            desc="1 точка сантехники (ХВС) + 1 точка канализации"
            badge={<span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-medium">1 вода + 1 кан.</span>}
            unitPrice={prices.washingMachineFixture}
            unit="шт"
            qty={bathAppliances.washingMachineCount}
            onTitleChange={newTitle => setWorkTitle('washingMachineFixture', newTitle)}
            onPriceChange={newPrice => setPrices(prev => ({ ...prev, washingMachineFixture: newPrice }))}
            onQtyChange={newQty => setBathAppliances(prev => ({ ...prev, washingMachineCount: newQty }))}
            onDelete={() => handleDeleteStandardItem('washingMachineFixture', getWorkTitle('washingMachineFixture', DEFAULT_WORK_TITLES.washingMachineFixture))}
          />
        );
      case 'hygienicShowerFixture':
        return (
          <SurveyItemRow
            key="hygienicShowerFixture"
            id="hygienicShowerFixture"
            secId="sec_bath"
            draggable
            isDragging={draggedItemId === 'hygienicShowerFixture'}
            isDragOver={dragOverItemId === 'hygienicShowerFixture'}
            onDragStart={e => handleDragStart(e, 'sec_bath', 'hygienicShowerFixture')}
            onDragOver={e => handleDragOver(e, 'sec_bath', 'hygienicShowerFixture')}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, 'sec_bath', 'hygienicShowerFixture')}
            onDragEnd={handleDragEnd}
            title={getWorkTitle('hygienicShowerFixture', DEFAULT_WORK_TITLES.hygienicShowerFixture)}
            desc="Подводка труб водоснабжения и слива"
            badge={
              <button
                type="button"
                onClick={() => setBathAppliances(prev => ({ ...prev, hygienicWaterPoints: prev.hygienicWaterPoints === 2 ? 1 : 2 }))}
                className="text-[9px] bg-blue-100 hover:bg-blue-200 text-blue-900 px-1.5 py-0.2 rounded font-medium transition-colors cursor-pointer"
                title="Нажмите для переключения между 1 и 2 точками воды"
              >
                {bathAppliances.hygienicWaterPoints} воды + 1 кан. ↺
              </button>
            }
            unitPrice={prices.hygienicShowerFixture}
            unit="шт"
            qty={bathAppliances.hygienicShowerCount}
            onTitleChange={newTitle => setWorkTitle('hygienicShowerFixture', newTitle)}
            onPriceChange={newPrice => setPrices(prev => ({ ...prev, hygienicShowerFixture: newPrice }))}
            onQtyChange={newQty => setBathAppliances(prev => ({ ...prev, hygienicShowerCount: newQty }))}
            onDelete={() => handleDeleteStandardItem('hygienicShowerFixture', getWorkTitle('hygienicShowerFixture', DEFAULT_WORK_TITLES.hygienicShowerFixture))}
          />
        );
      case 'towelRailFixture':
        return (
          <SurveyItemRow
            key="towelRailFixture"
            id="towelRailFixture"
            secId="sec_bath"
            draggable
            isDragging={draggedItemId === 'towelRailFixture'}
            isDragOver={dragOverItemId === 'towelRailFixture'}
            onDragStart={e => handleDragStart(e, 'sec_bath', 'towelRailFixture')}
            onDragOver={e => handleDragOver(e, 'sec_bath', 'towelRailFixture')}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, 'sec_bath', 'towelRailFixture')}
            onDragEnd={handleDragEnd}
            title={getWorkTitle('towelRailFixture', DEFAULT_WORK_TITLES.towelRailFixture)}
            desc="0 сантехники + 1 канализация (слив конденсата)"
            badge={<span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-medium">1 канализация</span>}
            unitPrice={prices.towelRailFixture}
            unit="шт"
            qty={bathAppliances.towelRailCount}
            onTitleChange={newTitle => setWorkTitle('towelRailFixture', newTitle)}
            onPriceChange={newPrice => setPrices(prev => ({ ...prev, towelRailFixture: newPrice }))}
            onQtyChange={newQty => setBathAppliances(prev => ({ ...prev, towelRailCount: newQty }))}
            onDelete={() => handleDeleteStandardItem('towelRailFixture', getWorkTitle('towelRailFixture', DEFAULT_WORK_TITLES.towelRailFixture))}
          />
        );
      case 'showerTray800x1500':
        return (
          <SurveyItemRow
            key="showerTray800x1500"
            id="showerTray800x1500"
            secId="sec_bath"
            draggable
            isDragging={draggedItemId === 'showerTray800x1500'}
            isDragOver={dragOverItemId === 'showerTray800x1500'}
            onDragStart={e => handleDragStart(e, 'sec_bath', 'showerTray800x1500')}
            onDragOver={e => handleDragOver(e, 'sec_bath', 'showerTray800x1500')}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, 'sec_bath', 'showerTray800x1500')}
            onDragEnd={handleDragEnd}
            title={getWorkTitle('showerTray800x1500', DEFAULT_WORK_TITLES.showerTray800x1500)}
            desc="Формирование монолитного поддона, трап, гидроизоляция и облицовка"
            unitPrice={prices.showerTray800x1500}
            unit="шт"
            qty={bathAppliances.showerTray800x1500}
            onTitleChange={newTitle => setWorkTitle('showerTray800x1500', newTitle)}
            onPriceChange={newPrice => setPrices(prev => ({ ...prev, showerTray800x1500: newPrice }))}
            onQtyChange={newQty => setBathAppliances(prev => ({ ...prev, showerTray800x1500: newQty }))}
            onDelete={() => handleDeleteStandardItem('showerTray800x1500', getWorkTitle('showerTray800x1500', DEFAULT_WORK_TITLES.showerTray800x1500))}
          />
        );
      case 'tileCleanCutM':
        return (
          <SurveyItemRow
            key="tileCleanCutM"
            id="tileCleanCutM"
            secId="sec_bath"
            draggable
            isDragging={draggedItemId === 'tileCleanCutM'}
            isDragOver={dragOverItemId === 'tileCleanCutM'}
            onDragStart={e => handleDragStart(e, 'sec_bath', 'tileCleanCutM')}
            onDragOver={e => handleDragOver(e, 'sec_bath', 'tileCleanCutM')}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, 'sec_bath', 'tileCleanCutM')}
            onDragEnd={handleDragEnd}
            title={getWorkTitle('tileCleanCutM', DEFAULT_WORK_TITLES.tileCleanCutM)}
            desc="Высокоточная заводская шлифовка внешних углов керамики и керамогранита"
            unitPrice={prices.tileCleanCutM}
            unit="м.п."
            step={0.1}
            qty={bathAppliances.tileCleanCutM}
            onTitleChange={newTitle => setWorkTitle('tileCleanCutM', newTitle)}
            onPriceChange={newPrice => setPrices(prev => ({ ...prev, tileCleanCutM: newPrice }))}
            onQtyChange={newQty => setBathAppliances(prev => ({ ...prev, tileCleanCutM: newQty }))}
            onDelete={() => handleDeleteStandardItem('tileCleanCutM', getWorkTitle('tileCleanCutM', DEFAULT_WORK_TITLES.tileCleanCutM))}
          />
        );
      case 'tileHolesCount':
        return (
          <SurveyItemRow
            key="tileHolesCount"
            id="tileHolesCount"
            secId="sec_bath"
            draggable
            isDragging={draggedItemId === 'tileHolesCount'}
            isDragOver={dragOverItemId === 'tileHolesCount'}
            onDragStart={e => handleDragStart(e, 'sec_bath', 'tileHolesCount')}
            onDragOver={e => handleDragOver(e, 'sec_bath', 'tileHolesCount')}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, 'sec_bath', 'tileHolesCount')}
            onDragEnd={handleDragEnd}
            title={getWorkTitle('tileHolesCount', DEFAULT_WORK_TITLES.tileHolesCount)}
            desc="Высверливание отверстий под водорозетки, смесители и розетки"
            unitPrice={prices.tileHolesCount}
            unit="шт"
            qty={bathAppliances.tileHolesCount}
            onTitleChange={newTitle => setWorkTitle('tileHolesCount', newTitle)}
            onPriceChange={newPrice => setPrices(prev => ({ ...prev, tileHolesCount: newPrice }))}
            onQtyChange={newQty => setBathAppliances(prev => ({ ...prev, tileHolesCount: newQty }))}
            onDelete={() => handleDeleteStandardItem('tileHolesCount', getWorkTitle('tileHolesCount', DEFAULT_WORK_TITLES.tileHolesCount))}
          />
        );
      case 'sanitaryFixturesSet':
        return (
          <SurveyItemRow
            key="sanitaryFixturesSet"
            id="sanitaryFixturesSet"
            secId="sec_bath"
            draggable
            isDragging={draggedItemId === 'sanitaryFixturesSet'}
            isDragOver={dragOverItemId === 'sanitaryFixturesSet'}
            onDragStart={e => handleDragStart(e, 'sec_bath', 'sanitaryFixturesSet')}
            onDragOver={e => handleDragOver(e, 'sec_bath', 'sanitaryFixturesSet')}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, 'sec_bath', 'sanitaryFixturesSet')}
            onDragEnd={handleDragEnd}
            title={getWorkTitle('sanitaryFixturesSet', DEFAULT_WORK_TITLES.sanitaryFixturesSet)}
            desc="Монтаж ванны/тумбы, раковины, смесителей, душа, подвесного унитаза, гиг. душа"
            unitPrice={prices.sanitaryFixturesSet}
            unit="компл"
            qty={bathAppliances.sanitaryFixturesSet}
            onTitleChange={newTitle => setWorkTitle('sanitaryFixturesSet', newTitle)}
            onPriceChange={newPrice => setPrices(prev => ({ ...prev, sanitaryFixturesSet: newPrice }))}
            onQtyChange={newQty => setBathAppliances(prev => ({ ...prev, sanitaryFixturesSet: newQty }))}
            onDelete={() => handleDeleteStandardItem('sanitaryFixturesSet', getWorkTitle('sanitaryFixturesSet', DEFAULT_WORK_TITLES.sanitaryFixturesSet))}
          />
        );
      default: {
        const extra = (sectionExtraItems['sec_bath'] || []).find(it => it.id === itemId);
        if (extra) {
          return (
            <SurveyItemRow
              key={extra.id}
              id={extra.id}
              secId="sec_bath"
              draggable
              isDragging={draggedItemId === extra.id}
              isDragOver={dragOverItemId === extra.id}
              onDragStart={e => handleDragStart(e, 'sec_bath', extra.id)}
              onDragOver={e => handleDragOver(e, 'sec_bath', extra.id)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, 'sec_bath', extra.id)}
              onDragEnd={handleDragEnd}
              title={extra.name}
              unitPrice={extra.unitPrice}
              unit={extra.unit}
              qty={extra.quantity}
              onTitleChange={newTitle => handleUpdateExtraItem('sec_bath', extra.id, 'name', newTitle)}
              onPriceChange={newPrice => handleUpdateExtraItem('sec_bath', extra.id, 'unitPrice', newPrice)}
              onQtyChange={newQty => handleUpdateExtraItem('sec_bath', extra.id, 'quantity', newQty)}
              onDelete={() => handleDeleteExtraItem('sec_bath', extra.id)}
            />
          );
        }
        return null;
      }
    }
  };

  // --- РЕНДЕР ПОЗИЦИЙ РАЗДЕЛА 3: САНТЕХНИКА КУХНЯ ---
  const renderKitchenItem = (itemId: string) => {
    switch (itemId) {
      case 'kitchenSinkFixture':
        return (
          <SurveyItemRow
            key="kitchenSinkFixture"
            id="kitchenSinkFixture"
            secId="sec_kitchen"
            draggable
            isDragging={draggedItemId === 'kitchenSinkFixture'}
            isDragOver={dragOverItemId === 'kitchenSinkFixture'}
            onDragStart={e => handleDragStart(e, 'sec_kitchen', 'kitchenSinkFixture')}
            onDragOver={e => handleDragOver(e, 'sec_kitchen', 'kitchenSinkFixture')}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, 'sec_kitchen', 'kitchenSinkFixture')}
            onDragEnd={handleDragEnd}
            title={getWorkTitle('kitchenSinkFixture', DEFAULT_WORK_TITLES.kitchenSinkFixture)}
            desc="2 точки сантехники (ГВС+ХВС) + 1 точка канализации"
            badge={<span className="text-[9px] bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded font-medium">2 воды + 1 кан.</span>}
            unitPrice={prices.kitchenSinkFixture}
            unit="шт"
            qty={kitchenAppliances.kitchenSinkCount}
            onTitleChange={newTitle => setWorkTitle('kitchenSinkFixture', newTitle)}
            onPriceChange={newPrice => setPrices(prev => ({ ...prev, kitchenSinkFixture: newPrice }))}
            onQtyChange={newQty => setKitchenAppliances(prev => ({ ...prev, kitchenSinkCount: newQty }))}
            onDelete={() => handleDeleteStandardItem('kitchenSinkFixture', getWorkTitle('kitchenSinkFixture', DEFAULT_WORK_TITLES.kitchenSinkFixture))}
          />
        );
      case 'dishwasherFixture':
        return (
          <SurveyItemRow
            key="dishwasherFixture"
            id="dishwasherFixture"
            secId="sec_kitchen"
            draggable
            isDragging={draggedItemId === 'dishwasherFixture'}
            isDragOver={dragOverItemId === 'dishwasherFixture'}
            onDragStart={e => handleDragStart(e, 'sec_kitchen', 'dishwasherFixture')}
            onDragOver={e => handleDragOver(e, 'sec_kitchen', 'dishwasherFixture')}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, 'sec_kitchen', 'dishwasherFixture')}
            onDragEnd={handleDragEnd}
            title={getWorkTitle('dishwasherFixture', DEFAULT_WORK_TITLES.dishwasherFixture)}
            desc="1 точка сантехники (ХВС) + 1 точка канализации"
            badge={<span className="text-[9px] bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded font-medium">1 вода + 1 кан.</span>}
            unitPrice={prices.dishwasherFixture}
            unit="шт"
            qty={kitchenAppliances.dishwasherCount}
            onTitleChange={newTitle => setWorkTitle('dishwasherFixture', newTitle)}
            onPriceChange={newPrice => setPrices(prev => ({ ...prev, dishwasherFixture: newPrice }))}
            onQtyChange={newQty => setKitchenAppliances(prev => ({ ...prev, dishwasherCount: newQty }))}
            onDelete={() => handleDeleteStandardItem('dishwasherFixture', getWorkTitle('dishwasherFixture', DEFAULT_WORK_TITLES.dishwasherFixture))}
          />
        );
      default: {
        const extra = (sectionExtraItems['sec_kitchen'] || []).find(it => it.id === itemId);
        if (extra) {
          return (
            <SurveyItemRow
              key={extra.id}
              id={extra.id}
              secId="sec_kitchen"
              draggable
              isDragging={draggedItemId === extra.id}
              isDragOver={dragOverItemId === extra.id}
              onDragStart={e => handleDragStart(e, 'sec_kitchen', extra.id)}
              onDragOver={e => handleDragOver(e, 'sec_kitchen', extra.id)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, 'sec_kitchen', extra.id)}
              onDragEnd={handleDragEnd}
              title={extra.name}
              unitPrice={extra.unitPrice}
              unit={extra.unit}
              qty={extra.quantity}
              onTitleChange={newTitle => handleUpdateExtraItem('sec_kitchen', extra.id, 'name', newTitle)}
              onPriceChange={newPrice => handleUpdateExtraItem('sec_kitchen', extra.id, 'unitPrice', newPrice)}
              onQtyChange={newQty => handleUpdateExtraItem('sec_kitchen', extra.id, 'quantity', newQty)}
              onDelete={() => handleDeleteExtraItem('sec_kitchen', extra.id)}
            />
          );
        }
        return null;
      }
    }
  };

  // --- РЕНДЕР ПОЗИЦИЙ РАЗДЕЛА 4: ДВЕРИ, ПОДГОТОВКА И СЕРВИС ---
  const renderServiceItem = (itemId: string) => {
    switch (itemId) {
      case 'wrappingDoorsWindows':
        return (
          <SurveyItemRow
            key="wrappingDoorsWindows"
            id="wrappingDoorsWindows"
            secId="sec_service"
            draggable
            isDragging={draggedItemId === 'wrappingDoorsWindows'}
            isDragOver={dragOverItemId === 'wrappingDoorsWindows'}
            onDragStart={e => handleDragStart(e, 'sec_service', 'wrappingDoorsWindows')}
            onDragOver={e => handleDragOver(e, 'sec_service', 'wrappingDoorsWindows')}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, 'sec_service', 'wrappingDoorsWindows')}
            onDragEnd={handleDragEnd}
            title={getWorkTitle('wrappingDoorsWindows', DEFAULT_WORK_TITLES.wrappingDoorsWindows)}
            desc="Комплексная защита входной двери, оконных рам и остекления перед грязными работами"
            unitPrice={prices.wrappingDoorsWindows}
            unit="компл"
            qty={serviceState.wrappingDoorsWindows}
            onTitleChange={newTitle => setWorkTitle('wrappingDoorsWindows', newTitle)}
            onPriceChange={newPrice => setPrices(prev => ({ ...prev, wrappingDoorsWindows: newPrice }))}
            onQtyChange={newQty => setServiceState(prev => ({ ...prev, wrappingDoorsWindows: newQty }))}
            onDelete={() => handleDeleteStandardItem('wrappingDoorsWindows', getWorkTitle('wrappingDoorsWindows', DEFAULT_WORK_TITLES.wrappingDoorsWindows))}
          />
        );
      case 'interiorDoors':
        return (
          <SurveyItemRow
            key="interiorDoors"
            id="interiorDoors"
            secId="sec_service"
            draggable
            isDragging={draggedItemId === 'interiorDoors'}
            isDragOver={dragOverItemId === 'interiorDoors'}
            onDragStart={e => handleDragStart(e, 'sec_service', 'interiorDoors')}
            onDragOver={e => handleDragOver(e, 'sec_service', 'interiorDoors')}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, 'sec_service', 'interiorDoors')}
            onDragEnd={handleDragEnd}
            title={getWorkTitle('interiorDoors', DEFAULT_WORK_TITLES.interiorDoors)}
            desc="Установка дверных блоков с врезкой петель, магнитных замков, доборов и наличников"
            unitPrice={prices.interiorDoors}
            unit="шт"
            qty={serviceState.interiorDoors}
            onTitleChange={newTitle => setWorkTitle('interiorDoors', newTitle)}
            onPriceChange={newPrice => setPrices(prev => ({ ...prev, interiorDoors: newPrice }))}
            onQtyChange={newQty => setServiceState(prev => ({ ...prev, interiorDoors: newQty }))}
            onDelete={() => handleDeleteStandardItem('interiorDoors', getWorkTitle('interiorDoors', DEFAULT_WORK_TITLES.interiorDoors))}
          />
        );
      case 'ventilationUnit':
        return (
          <SurveyItemRow
            key="ventilationUnit"
            id="ventilationUnit"
            secId="sec_service"
            draggable
            isDragging={draggedItemId === 'ventilationUnit'}
            isDragOver={dragOverItemId === 'ventilationUnit'}
            onDragStart={e => handleDragStart(e, 'sec_service', 'ventilationUnit')}
            onDragOver={e => handleDragOver(e, 'sec_service', 'ventilationUnit')}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, 'sec_service', 'ventilationUnit')}
            onDragEnd={handleDragEnd}
            title={getWorkTitle('ventilationUnit', DEFAULT_WORK_TITLES.ventilationUnit)}
            desc="Алмазное бурение вентканалов и монтаж вытяжных вентиляторов"
            unitPrice={prices.ventilationUnit}
            unit="шт"
            qty={serviceState.ventilationSet}
            onTitleChange={newTitle => setWorkTitle('ventilationUnit', newTitle)}
            onPriceChange={newPrice => setPrices(prev => ({ ...prev, ventilationUnit: newPrice }))}
            onQtyChange={newQty => setServiceState(prev => ({ ...prev, ventilationSet: newQty }))}
            onDelete={() => handleDeleteStandardItem('ventilationUnit', getWorkTitle('ventilationUnit', DEFAULT_WORK_TITLES.ventilationUnit))}
          />
        );
      case 'drywallTransomsBoxes':
        return (
          <SurveyItemRow
            key="drywallTransomsBoxes"
            id="drywallTransomsBoxes"
            secId="sec_service"
            draggable
            isDragging={draggedItemId === 'drywallTransomsBoxes'}
            isDragOver={dragOverItemId === 'drywallTransomsBoxes'}
            onDragStart={e => handleDragStart(e, 'sec_service', 'drywallTransomsBoxes')}
            onDragOver={e => handleDragOver(e, 'sec_service', 'drywallTransomsBoxes')}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, 'sec_service', 'drywallTransomsBoxes')}
            onDragEnd={handleDragEnd}
            title={getWorkTitle('drywallTransomsBoxes', DEFAULT_WORK_TITLES.drywallTransomsBoxes)}
            desc="Опуски дверных проемов по коридору и зашивка стояков ГКЛ в туалете и кухне"
            unitPrice={prices.drywallTransomsBoxes}
            unit="компл"
            qty={serviceState.drywallTransomsAndBoxes}
            onTitleChange={newTitle => setWorkTitle('drywallTransomsBoxes', newTitle)}
            onPriceChange={newPrice => setPrices(prev => ({ ...prev, drywallTransomsBoxes: newPrice }))}
            onQtyChange={newQty => setServiceState(prev => ({ ...prev, drywallTransomsAndBoxes: newQty }))}
            onDelete={() => handleDeleteStandardItem('drywallTransomsBoxes', getWorkTitle('drywallTransomsBoxes', DEFAULT_WORK_TITLES.drywallTransomsBoxes))}
          />
        );
      case 'garbageRemovalCleaning':
        return (
          <SurveyItemRow
            key="garbageRemovalCleaning"
            id="garbageRemovalCleaning"
            secId="sec_service"
            draggable
            isDragging={draggedItemId === 'garbageRemovalCleaning'}
            isDragOver={dragOverItemId === 'garbageRemovalCleaning'}
            onDragStart={e => handleDragStart(e, 'sec_service', 'garbageRemovalCleaning')}
            onDragOver={e => handleDragOver(e, 'sec_service', 'garbageRemovalCleaning')}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, 'sec_service', 'garbageRemovalCleaning')}
            onDragEnd={handleDragEnd}
            title={getWorkTitle('garbageRemovalCleaning', DEFAULT_WORK_TITLES.garbageRemovalCleaning)}
            desc="Погрузка и вывоз мусора (3 рейса Газель) + генеральная уборка после отделки"
            unitPrice={prices.garbageRemovalCleaning}
            unit="компл"
            qty={serviceState.garbageRemovalAndCleaning}
            onTitleChange={newTitle => setWorkTitle('garbageRemovalCleaning', newTitle)}
            onPriceChange={newPrice => setPrices(prev => ({ ...prev, garbageRemovalCleaning: newPrice }))}
            onQtyChange={newQty => setServiceState(prev => ({ ...prev, garbageRemovalCleaning: newQty }))}
            onDelete={() => handleDeleteStandardItem('garbageRemovalCleaning', getWorkTitle('garbageRemovalCleaning', DEFAULT_WORK_TITLES.garbageRemovalCleaning))}
          />
        );
      default: {
        const extra = (sectionExtraItems['sec_service'] || []).find(it => it.id === itemId);
        if (extra) {
          return (
            <SurveyItemRow
              key={extra.id}
              id={extra.id}
              secId="sec_service"
              draggable
              isDragging={draggedItemId === extra.id}
              isDragOver={dragOverItemId === extra.id}
              onDragStart={e => handleDragStart(e, 'sec_service', extra.id)}
              onDragOver={e => handleDragOver(e, 'sec_service', extra.id)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, 'sec_service', extra.id)}
              onDragEnd={handleDragEnd}
              title={extra.name}
              unitPrice={extra.unitPrice}
              unit={extra.unit}
              qty={extra.quantity}
              onTitleChange={newTitle => handleUpdateExtraItem('sec_service', extra.id, 'name', newTitle)}
              onPriceChange={newPrice => handleUpdateExtraItem('sec_service', extra.id, 'unitPrice', newPrice)}
              onQtyChange={newQty => handleUpdateExtraItem('sec_service', extra.id, 'quantity', newQty)}
              onDelete={() => handleDeleteExtraItem('sec_service', extra.id)}
            />
          );
        }
        return null;
      }
    }
  };

  return (
    <div className={`flex flex-col h-full bg-slate-50 text-slate-800 ${className}`}>
      {/* 1. ШАПКА РАЗДЕЛА */}
      <div className="p-3 bg-white border-b border-slate-200 shrink-0 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-bold text-sm text-slate-900 tracking-tight">
                  Штучные работы и точки замера
                </h2>
                {/* Знак вопроса с компактной всплывающей подсказкой при наведении */}
                <div className="relative group">
                  <span
                    className="w-4 h-4 rounded-full bg-slate-100 hover:bg-amber-100 text-slate-500 hover:text-amber-800 flex items-center justify-center cursor-help transition-colors text-[10px] font-bold border border-slate-200"
                    title="Наведите для подсказки"
                  >
                    ?
                  </span>
                  <div className="absolute left-0 top-full mt-1.5 w-72 p-2.5 bg-slate-900 text-slate-100 rounded-xl shadow-2xl border border-slate-700 text-[11px] leading-relaxed z-50 hidden group-hover:block pointer-events-none animate-in fade-in">
                    <p className="font-bold text-amber-400 mb-1 flex items-center gap-1">
                      <span>💡 Штучные работы и точки:</span>
                    </p>
                    <ul className="space-y-1 list-disc pl-3 text-slate-300">
                      <li><b>Сортировка:</b> зажмите ⠿ или карточку и перетяните в нужное место.</li>
                      <li><b>Редактирование:</b> кликните на название или карандаш ✏️.</li>
                      <li><b>Цены и объемы:</b> вводятся прямо в полях карточки.</li>
                      <li><b>Удаление:</b> иконка 🗑️ на карточке удаляет позицию.</li>
                    </ul>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-500">
                Названия и цены за единицу можно редактировать в любой строке
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleResetQuantities}
              className="px-2 py-1 text-[11px] font-bold text-slate-700 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
              title="Сбросить все количества в 0 (указанные расценки и цены за единицу сохраняются)"
            >
              <RotateCcw className="w-3 h-3 text-slate-500" />
              <span>Сброс</span>
            </button>

            {onNavigateToEstimate && (
              <button
                onClick={onNavigateToEstimate}
                className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                title="Перейти к итоговой смете на 118 позиций"
              >
                <span>В смету</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Сводная плашка суммы */}
        <div className="p-2 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-950 block">
              Итого штучных работ объекта:
            </span>
            <span className="text-[10px] text-amber-700">
              Все позиции синхронизируются со сметой и КП
            </span>
          </div>
          <div className="text-right">
            <span className="text-base font-extrabold text-amber-900 font-mono">
              {formatPrice(grandPieceworkTotal)} ₽
            </span>
          </div>
        </div>

        {/* Плашка скрытых/удаленных позиций с возможностью восстановить */}
        {hiddenItemIds.length > 0 && (
          <div className="flex items-center justify-between px-2.5 py-1.5 bg-amber-50/90 border border-amber-300 rounded-xl text-xs text-amber-900 animate-in fade-in">
            <div className="flex items-center gap-1.5 min-w-0">
              <Trash2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="truncate">Удалено позиций: <strong className="font-bold">{hiddenItemIds.length}</strong></span>
            </div>
            <button
              type="button"
              onClick={handleRestoreAllHidden}
              className="px-2 py-0.5 text-[11px] font-bold text-amber-900 hover:text-amber-950 bg-white hover:bg-amber-100 rounded-lg border border-amber-300 transition-colors flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
              title="Восстановить все скрытые позиции назад в разделы"
            >
              <RotateCcw className="w-3 h-3 text-amber-700" />
              <span>Восстановить все</span>
            </button>
          </div>
        )}

        {/* КНОПКА БЫСТРОГО ДОБАВЛЕНИЯ ПОЗИЦИИ ИЛИ РАЗДЕЛА */}
        <div className="flex items-center gap-2 pt-0.5">
          <button
            type="button"
            onClick={() => {
              setAddPosSectionId('sec_electric');
              setAddPosIsNewSection(false);
              setIsAddingPosition(true);
            }}
            className="flex-1 py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить позицию / работу</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAddPosIsNewSection(true);
              setIsAddingPosition(true);
            }}
            className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-1 cursor-pointer transition-all"
            title="Создать новый раздел штучных работ"
          >
            <FolderPlus className="w-3.5 h-3.5 text-indigo-600" />
            <span>Новый раздел</span>
          </button>
        </div>
      </div>

      {/* 2. СКРОЛЛИРУЕМАЯ ОБЛАСТЬ РАЗДЕЛОВ */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* ФОРМА ДОБАВЛЕНИЯ НОВОЙ ПОЗИЦИИ (ПРИ АКТИВАЦИИ КНОПКИ) */}
        {isAddingPosition && (
          <div ref={formTopRef} className="p-3.5 bg-gradient-to-br from-amber-500/10 via-amber-100/40 to-white rounded-2xl border-2 border-amber-400 shadow-md space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-xs text-amber-950">
                <Plus className="w-4 h-4 text-amber-600" />
                <span>Добавление новой позиции в замер</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingPosition(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                title="Закрыть форму"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 1. Выбор раздела (существующий или новый) */}
            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-1">
                Раздел для работы:
              </label>
              <select
                value={addPosIsNewSection ? 'NEW_SECTION' : addPosSectionId}
                onChange={e => {
                  if (e.target.value === 'NEW_SECTION') {
                    setAddPosIsNewSection(true);
                  } else {
                    setAddPosIsNewSection(false);
                    setAddPosSectionId(e.target.value);
                  }
                }}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
              >
                <optgroup label="Стандартные разделы замера:">
                  <option value="sec_electric">⚡ 1. Электромонтажные точки</option>
                  <option value="sec_bath">💧 2. Сантехника: Туалет + Ванная</option>
                  <option value="sec_kitchen">🍳 3. Сантехника: Кухня</option>
                  <option value="sec_service">🚪 4. Двери, подготовка и сервис</option>
                </optgroup>
                {customSections.length > 0 && (
                  <optgroup label="Пользовательские разделы:">
                    {customSections.map((sec, idx) => (
                      <option key={sec.id} value={sec.id}>📁 {idx + 5}. {sec.title}</option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Создать другой:">
                  <option value="NEW_SECTION">➕ [ + Создать новый раздел... ]</option>
                </optgroup>
              </select>
            </div>

            {/* Если выбран «Создать новый раздел» */}
            {addPosIsNewSection && (
              <div className="p-2.5 bg-white/90 rounded-xl border border-amber-300 space-y-2 animate-in fade-in">
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                    Название нового раздела:
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={addPosNewSectionTitle}
                    onChange={e => setAddPosNewSectionTitle(e.target.value)}
                    placeholder="Например: Вентиляция и кондиционеры"
                    className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                    Описание раздела (необязательно):
                  </label>
                  <input
                    type="text"
                    value={addPosNewSectionDesc}
                    onChange={e => setAddPosNewSectionDesc(e.target.value)}
                    placeholder="Монтаж трасс сплит-систем, дренаж"
                    className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                  />
                </div>
              </div>
            )}

            {/* 2. Название работы */}
            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-1">
                Название работы или материала:
              </label>
              <input
                type="text"
                value={addPosName}
                onChange={e => setAddPosName(e.target.value)}
                placeholder="Например: Монтаж трассы сплит-системы"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
              />
            </div>

            {/* 3. Цена и единица измерения */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Цена за единицу (₽):
                </label>
                <div className="flex items-center bg-white border border-slate-300 rounded-xl px-2 py-1 focus-within:ring-2 focus-within:ring-amber-500 shadow-2xs">
                  <input
                    type="number"
                    value={addPosUnitPrice || 0}
                    onChange={e => setAddPosUnitPrice(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full text-xs font-mono font-bold text-slate-900 focus:outline-none"
                    placeholder="0"
                  />
                  <span className="text-[10px] text-slate-400 font-mono ml-1">₽</span>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Единица:
                </label>
                <select
                  value={addPosUnit}
                  onChange={e => setAddPosUnit(e.target.value)}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                >
                  <option value="шт">шт (штука)</option>
                  <option value="компл">компл (комплект)</option>
                  <option value="м.п.">м.п. (метр погонный)</option>
                  <option value="м²">м² (метр квадратный)</option>
                  <option value="точка">точка</option>
                  <option value="час">час</option>
                </select>
              </div>
            </div>

            {/* 4. Количество и предварительный итог */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-600">Кол-во:</span>
                <input
                  type="number"
                  min="1"
                  value={addPosQuantity}
                  onChange={e => setAddPosQuantity(Math.max(1, parseFloat(e.target.value) || 1))}
                  className="w-14 px-2 py-1 text-center font-mono font-bold text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                />
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Итого по позиции:</span>
                <span className="text-xs font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                  {formatPrice(addPosQuantity * addPosUnitPrice)} ₽
                </span>
              </div>
            </div>

            {/* Кнопки формы */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200">
              <button
                type="button"
                onClick={() => setIsAddingPosition(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleSaveNewPosition}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Сохранить позицию</span>
              </button>
            </div>
          </div>
        )}

        {/* РАЗДЕЛ 1: ЭЛЕКТРОМОНТАЖНЫЕ ТОЧКИ */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-2.5 bg-gradient-to-r from-amber-500/10 to-orange-500/5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600" />
              <span className="font-bold text-xs text-slate-900">1. Электромонтажные точки</span>
            </div>
            <span className="text-xs font-mono font-bold text-amber-900">
              {formatPrice(electricTotal)} ₽
            </span>
          </div>

          <div className="p-3 space-y-2.5">
            {getOrderedItemIds('sec_electric', DEFAULT_SECTION_ITEM_ORDERS.sec_electric, sectionExtraItems['sec_electric'] || []).map(renderElectricItem)}

            <button
              type="button"
              onClick={() => {
                setAddPosSectionId('sec_electric');
                setAddPosIsNewSection(false);
                setIsAddingPosition(true);
              }}
              className="w-full py-1 text-center text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg border border-dashed border-amber-300 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Добавить позицию в раздел «Электромонтаж»</span>
            </button>
          </div>
        </div>

        {/* РАЗДЕЛ 2: САНТЕХНИКА: ТУАЛЕТ + ВАННАЯ */}
        <div className="bg-white rounded-xl border border-blue-200 shadow-2xs overflow-hidden">
          <div className="p-2.5 bg-gradient-to-r from-blue-500/10 to-cyan-500/5 border-b border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-600" />
              <div>
                <span className="font-bold text-xs text-slate-900 block leading-tight">2. Сантехника: Туалет + Ванная</span>
                <span className="text-[10px] text-blue-700 font-mono">
                  {bathPlumbingPoints} точек воды • {bathSewerPoints} точек канализации
                </span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-blue-900">
              {formatPrice(bathTotal)} ₽
            </span>
          </div>

          <div className="p-3 space-y-2.5">
            {getOrderedItemIds('sec_bath', DEFAULT_SECTION_ITEM_ORDERS.sec_bath, sectionExtraItems['sec_bath'] || []).map(renderBathItem)}

            <button
              type="button"
              onClick={() => {
                setAddPosSectionId('sec_bath');
                setAddPosIsNewSection(false);
                setIsAddingPosition(true);
              }}
              className="w-full py-1 text-center text-[11px] font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg border border-dashed border-blue-300 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Добавить позицию в раздел «Сантехника»</span>
            </button>
          </div>
        </div>

        {/* РАЗДЕЛ 3: САНТЕХНИКА: КУХНЯ */}
        <div className="bg-white rounded-xl border border-teal-200 shadow-2xs overflow-hidden">
          <div className="p-2.5 bg-gradient-to-r from-teal-500/10 to-emerald-500/5 border-b border-teal-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-teal-600" />
              <div>
                <span className="font-bold text-xs text-slate-900 block leading-tight">3. Сантехника: Кухня</span>
                <span className="text-[10px] text-teal-700 font-mono">
                  {kitchenPlumbingPoints} точек воды • {kitchenSewerPoints} точек канализации
                </span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-teal-900">
              {formatPrice(kitchenTotal)} ₽
            </span>
          </div>

          <div className="p-3 space-y-2.5">
            {getOrderedItemIds('sec_kitchen', DEFAULT_SECTION_ITEM_ORDERS.sec_kitchen, sectionExtraItems['sec_kitchen'] || []).map(renderKitchenItem)}

            <button
              type="button"
              onClick={() => {
                setAddPosSectionId('sec_kitchen');
                setAddPosIsNewSection(false);
                setIsAddingPosition(true);
              }}
              className="w-full py-1 text-center text-[11px] font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg border border-dashed border-teal-300 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Добавить позицию в раздел «Кухня»</span>
            </button>
          </div>
        </div>

        {/* РАЗДЕЛ 4: ДВЕРИ, ПОДГОТОВКА И СЕРВИС */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-2.5 bg-gradient-to-r from-slate-100 to-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DoorClosed className="w-4 h-4 text-slate-700" />
              <span className="font-bold text-xs text-slate-900">4. Двери, подготовка и сервис</span>
            </div>
            <span className="text-xs font-mono font-bold text-slate-900">
              {formatPrice(serviceTotal)} ₽
            </span>
          </div>

          <div className="p-3 space-y-2.5">
            {getOrderedItemIds('sec_service', DEFAULT_SECTION_ITEM_ORDERS.sec_service, sectionExtraItems['sec_service'] || []).map(renderServiceItem)}

            <button
              type="button"
              onClick={() => {
                setAddPosSectionId('sec_service');
                setAddPosIsNewSection(false);
                setIsAddingPosition(true);
              }}
              className="w-full py-1 text-center text-[11px] font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg border border-dashed border-slate-300 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Добавить позицию в раздел «Сервис и двери»</span>
            </button>
          </div>
        </div>

        {/* 5. ПОЛЬЗОВАТЕЛЬСКИЕ РАЗДЕЛЫ */}
        {customSections.map((sec, secIdx) => {
          const secSum = sec.items.reduce((acc, it) => acc + (it.quantity * it.unitPrice), 0);
          return (
            <div key={sec.id} className="bg-white rounded-xl border border-indigo-200 shadow-2xs overflow-hidden">
              <div className="p-2.5 bg-gradient-to-r from-indigo-500/10 to-purple-500/5 border-b border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FolderPlus className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-900 block leading-tight truncate">
                        {secIdx + 5}. {sec.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const newName = prompt('Новое название раздела:', sec.title);
                          if (newName && newName.trim()) {
                            handleUpdateSectionTitle(sec.id, newName.trim());
                          }
                        }}
                        className="text-slate-400 hover:text-indigo-600 p-0.5 cursor-pointer"
                        title="Переименовать раздел"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                    {sec.description && (
                      <span className="text-[10px] text-slate-500 block truncate">{sec.description}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-xs font-mono font-bold text-indigo-900">
                    {formatPrice(secSum)} ₽
                  </span>
                  <button
                    onClick={() => handleDeleteSection(sec.id)}
                    className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                    title="Удалить этот раздел"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-3 space-y-2.5 text-xs">
                {sec.items.map(item => (
                  <SurveyItemRow
                    key={item.id}
                    id={item.id}
                    secId={sec.id}
                    draggable
                    isDragging={draggedItemId === item.id}
                    isDragOver={dragOverItemId === item.id}
                    onDragStart={e => handleDragStart(e, sec.id, item.id)}
                    onDragOver={e => handleDragOver(e, sec.id, item.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={e => handleDrop(e, sec.id, item.id)}
                    onDragEnd={handleDragEnd}
                    title={item.name}
                    unitPrice={item.unitPrice}
                    unit={item.unit}
                    qty={item.quantity}
                    onTitleChange={newTitle => handleUpdateCustomItem(sec.id, item.id, 'name', newTitle)}
                    onPriceChange={newPrice => handleUpdateCustomItem(sec.id, item.id, 'unitPrice', newPrice)}
                    onQtyChange={newQty => handleUpdateCustomItem(sec.id, item.id, 'quantity', newQty)}
                    onDelete={() => handleDeleteCustomItem(sec.id, item.id)}
                  />
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setAddPosSectionId(sec.id);
                    setAddPosIsNewSection(false);
                    setIsAddingPosition(true);
                  }}
                  className="w-full py-1 text-center text-[11px] font-semibold text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 rounded-lg border border-dashed border-indigo-300 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Добавить позицию в раздел «{sec.title}»</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. ПОДВАЛ С ПЕРЕХОДОМ В СМЕТУ */}
      <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between shrink-0 shadow-lg">
        <div>
          <span className="text-[10px] text-slate-400 block font-semibold">СУММА ЧЕК-ЛИСТА:</span>
          <span className="font-mono font-bold text-slate-900 text-base">
            {formatPrice(grandPieceworkTotal)} ₽
          </span>
        </div>
        {onNavigateToEstimate && (
          <button
            type="button"
            onClick={onNavigateToEstimate}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <span>Перейти к смете 118 строк</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
