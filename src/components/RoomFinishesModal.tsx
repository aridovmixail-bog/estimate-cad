import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Room } from '../cad/types';
import { PirogCategory, PirogDefinition, RoomSelectionState, PricingTariff, WorkTemplate, MaterialTemplate } from '../estimate/types';
import { CustomPirogCreatorModal } from './CustomPirogCreatorModal';
import { DEFAULT_PIROGS, PIROG_CATEGORIES } from '../estimate/defaultPirogs';
import { 
  Layers, 
  X, 
  Check, 
  Ruler, 
  Hammer, 
  Package, 
  Sparkles, 
  ChevronDown, 
  ChevronRight,
  Info,
  DollarSign,
  Plus,
  Trash2,
  RotateCcw,
  Save,
  Pencil,
  Copy
} from 'lucide-react';

/**
 * Эталонные строительные пироги отделки по Краснодару (ул. Дангиреева, д. 2, к.3, кв. 376):
 */
export const KRASNODAR_ESTIMATE_PIROGS: PirogDefinition[] = [
  // 1. СТЕНЫ
  {
    id: 'KRD-W-WALLPAPER',
    name: '⭐ Обои (по смете: шпатлевка 2 сл + шлифовка + грунтовка 2 раза + поклейка) — 1 320 ₽/м²',
    category: 'walls',
    description: '1. Грунтование стен (70₽)\n2. Шпатлевание стен 2 раза базовый слой (530₽)\n3. Шлифование стен после 2-ух слоев (100₽)\n4. Грунтование стен перед поклейкой (70₽)\n5. Оклеивание стен обоями (550₽)',
    standardPrice: 1320,
    works: [
      { id: 'kw_1', name: 'Грунтование стен (перед шпатлеванием базового слоя)', unit: 'м²', defaultUnitPrice: 70, multiplierType: 'wallNetArea' },
      { id: 'kw_2', name: 'Шпатлевание стен 2 раза (базовый слой)', unit: 'м²', defaultUnitPrice: 530, multiplierType: 'wallNetArea' },
      { id: 'kw_3', name: 'Шлифование стен (после 2-ух базовых слоёв)', unit: 'м²', defaultUnitPrice: 100, multiplierType: 'wallNetArea' },
      { id: 'kw_4', name: 'Грунтование стен (перед поклейкой обоев)', unit: 'м²', defaultUnitPrice: 70, multiplierType: 'wallNetArea' },
      { id: 'kw_5', name: 'Оклеивание стен обоями', unit: 'м²', defaultUnitPrice: 550, multiplierType: 'wallNetArea' },
    ],
    materials: []
  },
  {
    id: 'KRD-W-TILE',
    name: '⭐ Керамогранит 1200×600 (санузел: штукатурка ЦПС + гидроизоляция + укладка + затирка) — 3 860 ₽/м²',
    category: 'walls',
    description: '1. Грунтование стен перед оштукатуриванием (70₽)\n2. Оштукатуривание стен по маякам ЦПС (720₽)\n3. Гидроизоляция стен обмазочная 2 раза (500₽)\n4. Грунтование стен перед плиткой (70₽)\n5. Укладка керамогранита на стены 1200*600 (2000₽)\n6. Затирка цементная стен (500₽)',
    standardPrice: 3860,
    works: [
      { id: 'kt_1', name: 'Грунтование стен (перед оштукатуриванием)', unit: 'м²', defaultUnitPrice: 70, multiplierType: 'wallNetArea' },
      { id: 'kt_2', name: 'Оштукатуривание стен по маякам с использованием ЦПС', unit: 'м²', defaultUnitPrice: 720, multiplierType: 'wallNetArea' },
      { id: 'kt_3', name: 'Гидроизоляция стен обмазочная 2 раза', unit: 'м²', defaultUnitPrice: 500, multiplierType: 'wallNetArea' },
      { id: 'kt_4', name: 'Грунтование стен перед укладкой плитки', unit: 'м²', defaultUnitPrice: 70, multiplierType: 'wallNetArea' },
      { id: 'kt_5', name: 'Укладка керамогранита на стены (формат 1200*600)', unit: 'м²', defaultUnitPrice: 2000, multiplierType: 'wallNetArea' },
      { id: 'kt_6', name: 'Затирка цементная стен', unit: 'м²', defaultUnitPrice: 500, multiplierType: 'wallNetArea' },
    ],
    materials: []
  },
  {
    id: 'KRD-W-PLASTER_ONLY',
    name: '⭐ Штукатурка стен по маякам (черновое выравнивание: грунтовка + ЦПС/гипс) — 790 ₽/м²',
    category: 'walls',
    description: '1. Грунтование стен (70₽)\n2. Оштукатуривание стен по маякам (720₽)',
    standardPrice: 790,
    works: [
      { id: 'kp_1', name: 'Грунтование стен (перед оштукатуриванием)', unit: 'м²', defaultUnitPrice: 70, multiplierType: 'wallNetArea' },
      { id: 'kp_2', name: 'Оштукатуривание стен по маякам с использованием ЦПС', unit: 'м²', defaultUnitPrice: 720, multiplierType: 'wallNetArea' },
    ],
    materials: []
  },
  {
    id: 'KRD-W-PAINT',
    name: 'Под покраску (грунт + шпатлевка база + стеклохолст + финиш + покраска 2 сл) — 1 950 ₽/м²',
    category: 'walls',
    description: '1. Грунтование стен (70₽)\n2. Шпатлевание базовое 2 сл (530₽)\n3. Наклейка малярного стеклохолста (350₽)\n4. Шпатлевание стен финишное 2 сл (450₽)\n5. Шлифование (150₽) + Покраска 2 сл (400₽)',
    standardPrice: 1950,
    works: [
      { id: 'kpt_1', name: 'Грунтование стен (перед шпатлеванием)', unit: 'м²', defaultUnitPrice: 70, multiplierType: 'wallNetArea' },
      { id: 'kpt_2', name: 'Шпатлевание стен 2 раза (базовый слой)', unit: 'м²', defaultUnitPrice: 530, multiplierType: 'wallNetArea' },
      { id: 'kpt_3', name: 'Монтаж малярного стеклохолста (паутинка)', unit: 'м²', defaultUnitPrice: 350, multiplierType: 'wallNetArea' },
      { id: 'kpt_4', name: 'Шпатлевание стен финишной пастой (2 слоя)', unit: 'м²', defaultUnitPrice: 450, multiplierType: 'wallNetArea' },
      { id: 'kpt_5', name: 'Шлифование под покраску', unit: 'м²', defaultUnitPrice: 150, multiplierType: 'wallNetArea' },
      { id: 'kpt_6', name: 'Окрашивание стен водоэмульсионной краской в 2 слоя', unit: 'м²', defaultUnitPrice: 400, multiplierType: 'wallNetArea' },
    ],
    materials: []
  },

  // 2. ПОЛЫ
  {
    id: 'KRD-F-LAMINATE',
    name: '⭐ Ламинат с подложкой (по смете: жилые комнаты + коридор + кухня) — 600 ₽/м²',
    category: 'floor',
    description: 'Укладка ламината с подложкой (600₽)',
    standardPrice: 600,
    works: [
      { id: 'kfl_1', name: 'Укладка ламината с подложкой (жилые комнаты + коридор + кухня)', unit: 'м²', defaultUnitPrice: 600, multiplierType: 'floorArea' }
    ],
    materials: []
  },
  {
    id: 'KRD-F-TILE',
    name: '⭐ Керамогранит на пол 1200×600 (санузел/лоджия: наливной пол + гидроизоляция + укладка + затирка) — 4 020 ₽/м²',
    category: 'floor',
    description: '1. Грунтование пола перед наливным полом (250₽)\n2. Устройство наливного пола до 10 мм (700₽)\n3. Гидроизоляция пола 2 раза (500₽)\n4. Грунтование пола перед плиткой (70₽)\n5. Укладка керамогранита на пол 1200*600 (2000₽)\n6. Затирка цементная пол (500₽)',
    standardPrice: 4020,
    works: [
      { id: 'kft_1', name: 'Грунтование пола перед устройством наливного пола', unit: 'м²', defaultUnitPrice: 250, multiplierType: 'floorArea' },
      { id: 'kft_2', name: 'Устройство наливного пола, до 10 мм', unit: 'м²', defaultUnitPrice: 700, multiplierType: 'floorArea' },
      { id: 'kft_3', name: 'Гидроизоляция пола обмазочная 2 раза', unit: 'м²', defaultUnitPrice: 500, multiplierType: 'floorArea' },
      { id: 'kft_4', name: 'Грунтование пола (перед укладкой плитки)', unit: 'м²', defaultUnitPrice: 70, multiplierType: 'floorArea' },
      { id: 'kft_5', name: 'Укладка керамогранита на пол (формат 1200*600)', unit: 'м²', defaultUnitPrice: 2000, multiplierType: 'floorArea' },
      { id: 'kft_6', name: 'Затирка цементная пола', unit: 'м²', defaultUnitPrice: 500, multiplierType: 'floorArea' },
    ],
    materials: []
  },
  {
    id: 'KRD-F-VINYL',
    name: 'Кварцвинил замковый / SPC с подложкой — 650 ₽/м²',
    category: 'floor',
    description: 'Укладка замкового кварцвинила / SPC (650₽)',
    standardPrice: 650,
    works: [
      { id: 'kfv_1', name: 'Укладка замкового SPC кварцвинила с подложкой', unit: 'м²', defaultUnitPrice: 650, multiplierType: 'floorArea' }
    ],
    materials: []
  },

  // 3. ПОТОЛОК
  {
    id: 'KRD-C-STRETCH',
    name: '⭐ Натяжной потолок матовый белый MSD Premium (по смете объекта) — 750 ₽/м²',
    category: 'ceiling',
    description: 'Монтаж натяжного потолка ПВХ со вставкой по периметру (750₽)',
    standardPrice: 750,
    works: [
      { id: 'kcs_1', name: 'Монтаж натяжного потолка (белый матовый, профиль, вставка)', unit: 'м²', defaultUnitPrice: 750, multiplierType: 'ceilingArea' }
    ],
    materials: []
  },
  {
    id: 'KRD-C-PAINT',
    name: 'Покраска потолка (грунтовка + шпатлевка 2 сл + покраска 2 сл) — 1 450 ₽/м²',
    category: 'ceiling',
    description: '1. Грунтование потолка (80₽)\n2. Шпатлевание потолка 2 сл (750₽)\n3. Шлифование потолка (170₽)\n4. Покраска потолка в 2 слоя (450₽)',
    standardPrice: 1450,
    works: [
      { id: 'kcp_1', name: 'Грунтование потолка перед шпатлеванием', unit: 'м²', defaultUnitPrice: 80, multiplierType: 'ceilingArea' },
      { id: 'kcp_2', name: 'Шпатлевание потолка 2 слоя', unit: 'м²', defaultUnitPrice: 750, multiplierType: 'ceilingArea' },
      { id: 'kcp_3', name: 'Шлифование потолка', unit: 'м²', defaultUnitPrice: 170, multiplierType: 'ceilingArea' },
      { id: 'kcp_4', name: 'Окрашивание потолка в 2 слоя', unit: 'м²', defaultUnitPrice: 450, multiplierType: 'ceilingArea' },
    ],
    materials: []
  },
  {
    id: 'KRD-C-GKL',
    name: 'Гипсокартонный потолок (ГКЛ в 1 ур. под покраску) — 2 650 ₽/м²',
    category: 'ceiling',
    description: 'Монтаж металлокаркаса и ГКЛ в 1 уровень + подготовка под покраску',
    standardPrice: 2650,
    works: [
      { id: 'kcg_1', name: 'Монтаж каркаса и ГКЛ потолка в 1 уровень', unit: 'м²', defaultUnitPrice: 1200, multiplierType: 'ceilingArea' },
      { id: 'kcg_2', name: 'Шпатлевание швов ГКЛ с армирующей лентой', unit: 'м²', defaultUnitPrice: 350, multiplierType: 'ceilingArea' },
      { id: 'kcg_3', name: 'Сплошное шпатлевание и покраска ГКЛ в 2 слоя', unit: 'м²', defaultUnitPrice: 1100, multiplierType: 'ceilingArea' },
    ],
    materials: []
  },

  // 4. ДВЕРНЫЕ БЛОКИ
  {
    id: 'FIN-D-01',
    name: 'Установка межкомнатной двери с доборами и наличниками — 4 700 ₽/шт',
    category: 'doors',
    description: '1. Установка двери с коробкой, наличниками и врезкой фурнитуры (4200₽)\n2. Установка доборов (500₽)',
    standardPrice: 4700,
    works: [
      { id: 'krd_d1', name: 'Установка межкомнатной двери (коробка, полотно, наличники, фурнитура)', unit: 'шт.', defaultUnitPrice: 4200, multiplierType: 'doorsCount' },
      { id: 'krd_d2', name: 'Установка доборов (~5 п.м. на проём)', unit: 'пог. м', defaultUnitPrice: 500, multiplierType: 'fixed', fixedQuantity: 1 }
    ],
    materials: [
      { id: 'krd_dm1', name: 'Пена монтажная проф., крепеж скрытый, герметик акриловый', unit: 'компл.', defaultUnitPrice: 850, normPerUnit: 1.0, multiplierType: 'doorsCount' },
      { id: 'krd_dm2', name: 'Дверное полотно, коробка, наличники, доборы, ручка и замок', unit: 'компл.', defaultUnitPrice: 18500, normPerUnit: 1.0, multiplierType: 'doorsCount' }
    ]
  },

  // 5. ПЛИНТУС НАПОЛЬНЫЙ
  {
    id: 'KRD-O-PLINTH',
    name: '⭐ Монтаж напольного пластикового плинтуса с кабель-каналом — 450 ₽/м.п.',
    category: 'other',
    description: 'Монтаж пластикового плинтуса по периметру (450₽)',
    standardPrice: 450,
    works: [
      { id: 'kpo_1', name: 'Монтаж напольного пластикового плинтуса с кабель-каналом', unit: 'м.пог.', defaultUnitPrice: 450, multiplierType: 'perimeter' }
    ],
    materials: []
  },
  {
    id: 'KRD-O-PLINTH_MDF',
    name: 'Монтаж плинтуса МДФ / дюрополимер с запилом под 45° — 750 ₽/м.п.',
    category: 'other',
    description: 'Монтаж плинтуса МДФ с подрезкой углов под 45° (750₽)',
    standardPrice: 750,
    works: [
      { id: 'kpo_2', name: 'Монтаж плинтуса МДФ / дюрополимер с запилом под 45°', unit: 'м.пог.', defaultUnitPrice: 750, multiplierType: 'perimeter' }
    ],
    materials: []
  }
];

export const STORAGE_CUSTOM_PIROGS = 'estimate_cad_custom_pirogs_v2';

export function getBasePirogs(): PirogDefinition[] {
  const merged = [...KRASNODAR_ESTIMATE_PIROGS];
  DEFAULT_PIROGS.forEach(dp => {
    if (!merged.some(m => m.id === dp.id)) {
      merged.push(dp);
    }
  });
  return merged;
}

export function loadEffectivePirogs(): PirogDefinition[] {
  const base = getBasePirogs();
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_PIROGS);
    if (raw) {
      const customList: PirogDefinition[] = JSON.parse(raw);
      const result = [...base];
      customList.forEach(cp => {
        const idx = result.findIndex(p => p.id === cp.id);
        if (idx !== -1) {
          result[idx] = cp;
        } else {
          result.push(cp);
        }
      });
      return result;
    }
  } catch (e) {
    console.error('Failed to load custom pirogs', e);
  }
  return base;
}

export function saveCustomPirog(pirog: PirogDefinition): PirogDefinition[] {
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_PIROGS);
    let list: PirogDefinition[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex(p => p.id === pirog.id);
    if (idx !== -1) {
      list[idx] = pirog;
    } else {
      list.push(pirog);
    }
    localStorage.setItem(STORAGE_CUSTOM_PIROGS, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save custom pirog', e);
  }
  return loadEffectivePirogs();
}

export function resetPirogToDefault(pirogId: string): PirogDefinition[] {
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_PIROGS);
    if (raw) {
      let list: PirogDefinition[] = raw ? JSON.parse(raw) : [];
      list = list.filter(p => p.id !== pirogId);
      localStorage.setItem(STORAGE_CUSTOM_PIROGS, JSON.stringify(list));
    }
  } catch (e) {
    console.error('Failed to reset pirog', e);
  }
  return loadEffectivePirogs();
}

const MERGED_PIROGS: PirogDefinition[] = getBasePirogs();

interface RoomFinishesModalProps {
  isOpen: boolean;
  room: Room | null;
  onClose: () => void;
  selections: Record<string, RoomSelectionState>;
  onSaveFinishes: (roomId: string, pirogIds: Record<string, string | null>) => void;
  tariff?: PricingTariff;
  regionalCoeff?: number;
  allPirogs?: PirogDefinition[];
  onPirogsUpdated?: (updatedPirogs: PirogDefinition[]) => void;
}

export const RoomFinishesModal: React.FC<RoomFinishesModalProps> = ({
  isOpen,
  room,
  onClose,
  selections,
  onSaveFinishes,
  tariff = 'standard',
  regionalCoeff = 1.0,
  allPirogs: externalAllPirogs,
  onPirogsUpdated
}) => {
  if (!isOpen || !room) return null;

  const isWetRoom = room.roomType === 'wet' || /ванн|сануз|туалет|душ/i.test(room.name);

  // Список всех доступных пирогов с учетом сохраненных в localStorage
  const [allPirogs, setAllPirogs] = useState<PirogDefinition[]>(() => {
    return externalAllPirogs && externalAllPirogs.length > 0 ? externalAllPirogs : loadEffectivePirogs();
  });

  useEffect(() => {
    if (externalAllPirogs && externalAllPirogs.length > 0) {
      setAllPirogs(externalAllPirogs);
    } else {
      setAllPirogs(loadEffectivePirogs());
    }
  }, [externalAllPirogs]);

  const currentSelection = selections[room.id] || {
    roomId: room.id,
    selectedPirogIds: {},
    overridePrices: {},
    customWorks: [],
    customMaterials: []
  };

  const [localPirogIds, setLocalPirogIds] = useState<Record<string, string | null>>(() => {
    return {
      ceiling: currentSelection.selectedPirogIds.ceiling || 'KRD-C-STRETCH',
      walls: currentSelection.selectedPirogIds.walls || (isWetRoom ? 'KRD-W-TILE' : 'KRD-W-WALLPAPER'),
      floor: currentSelection.selectedPirogIds.floor || (isWetRoom ? 'KRD-F-TILE' : 'KRD-F-LAMINATE'),
      doors: currentSelection.selectedPirogIds.doors || ((room.doorsCount || 0) > 0 ? 'FIN-D-01' : null),
      other: currentSelection.selectedPirogIds.other || (isWetRoom ? null : 'KRD-O-PLINTH'),
    };
  });

  // Раскрытые аккордеоны с составом работ
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Уведомление о сохранении / сбросе
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(prev => prev === msg ? null : prev);
    }, 3500);
  };

  // Модалка для создания нового пирога отделки
  const [newPirogCategory, setNewPirogCategory] = useState<string | null>(null);
  const [isCustomCreatorOpen, setIsCustomCreatorOpen] = useState<boolean>(false);
  const [creatorDefaultCategory, setCreatorDefaultCategory] = useState<PirogCategory>('floor');
  const [newPirogName, setNewPirogName] = useState<string>('');

  useEffect(() => {
    if (room) {
      const isWet = room.roomType === 'wet' || /ванн|сануз|туалет|душ/i.test(room.name);
      const sel = selections[room.id]?.selectedPirogIds || {};
      setLocalPirogIds({
        ceiling: sel.ceiling !== undefined ? sel.ceiling : 'KRD-C-STRETCH',
        walls: sel.walls !== undefined ? sel.walls : (isWet ? 'KRD-W-TILE' : 'KRD-W-WALLPAPER'),
        floor: sel.floor !== undefined ? sel.floor : (isWet ? 'KRD-F-TILE' : 'KRD-F-LAMINATE'),
        doors: sel.doors !== undefined ? sel.doors : ((room.doorsCount || 0) > 0 ? 'FIN-D-01' : null),
        other: sel.other !== undefined ? sel.other : (isWet ? null : 'KRD-O-PLINTH'),
      });
    }
  }, [room, selections]);

  // Длина откосов окон
  const windowSlopesLength = useMemo(() => {
    if (!room.windowsList || room.windowsList.length === 0) return 0;
    return room.windowsList.reduce((acc: number, w: any) => acc + (w.width + 2 * w.height), 0);
  }, [room.windowsList]);

  // Мутации работ и материалов активного пирога
  const handleUpdateWorkField = (pirogId: string, workId: string, field: keyof WorkTemplate, value: any) => {
    setAllPirogs(prev => {
      return prev.map(p => {
        if (p.id !== pirogId) return p;
        return {
          ...p,
          works: p.works.map(w => {
            if (w.id !== workId) return w;
            return { ...w, [field]: value };
          })
        };
      });
    });
  };

  const handleAddWorkRow = (pirogId: string, category: string) => {
    const defaultMult = category === 'floor' ? 'floorArea' : category === 'walls' ? 'wallNetArea' : category === 'ceiling' ? 'ceilingArea' : category === 'doors' ? 'doorsCount' : 'perimeter';
    const newWork: WorkTemplate = {
      id: `custom_w_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: 'Новая работа',
      unit: category === 'doors' ? 'шт.' : category === 'other' ? 'м.пог.' : 'м²',
      defaultUnitPrice: 500,
      multiplierType: defaultMult
    };

    setAllPirogs(prev => {
      return prev.map(p => {
        if (p.id !== pirogId) return p;
        return {
          ...p,
          works: [...p.works, newWork]
        };
      });
    });
  };

  const handleDeleteWorkRow = (pirogId: string, workId: string) => {
    setAllPirogs(prev => {
      return prev.map(p => {
        if (p.id !== pirogId) return p;
        return {
          ...p,
          works: p.works.filter(w => w.id !== workId)
        };
      });
    });
  };

  const handleUpdateMaterialField = (pirogId: string, matId: string, field: keyof MaterialTemplate, value: any) => {
    setAllPirogs(prev => {
      return prev.map(p => {
        if (p.id !== pirogId) return p;
        return {
          ...p,
          materials: p.materials.map(m => {
            if (m.id !== matId) return m;
            return { ...m, [field]: value };
          })
        };
      });
    });
  };

  const handleAddMaterialRow = (pirogId: string, category: string) => {
    const defaultMult = category === 'floor' ? 'floorArea' : category === 'walls' ? 'wallNetArea' : category === 'ceiling' ? 'ceilingArea' : category === 'doors' ? 'doorsCount' : 'perimeter';
    const newMaterial: MaterialTemplate = {
      id: `custom_m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: 'Новый черновой материал',
      unit: 'кг',
      defaultUnitPrice: 250,
      normPerUnit: 1.0,
      multiplierType: defaultMult
    };

    setAllPirogs(prev => {
      return prev.map(p => {
        if (p.id !== pirogId) return p;
        return {
          ...p,
          materials: [...p.materials, newMaterial]
        };
      });
    });
  };

  const handleDeleteMaterialRow = (pirogId: string, matId: string) => {
    setAllPirogs(prev => {
      return prev.map(p => {
        if (p.id !== pirogId) return p;
        return {
          ...p,
          materials: p.materials.filter(m => m.id !== matId)
        };
      });
    });
  };

  // Сохранение изменений в текущий пирог
  const handleSaveCurrentPirog = (pirogId: string) => {
    const target = allPirogs.find(p => p.id === pirogId);
    if (!target) return;
    const updatedList = saveCustomPirog(target);
    setAllPirogs(updatedList);
    onPirogsUpdated?.(updatedList);
    showToast(`💾 Пирог «${target.name.slice(0, 32)}...» сохранен в базу!`);
  };

  // Сохранить как новый пирог
  const handleConfirmSaveAsNewPirog = () => {
    if (!newPirogCategory || !newPirogName.trim()) return;
    const currentId = localPirogIds[newPirogCategory];
    const basePirog = allPirogs.find(p => p.id === currentId);
    if (!basePirog) return;

    const newPirog: PirogDefinition = {
      ...basePirog,
      id: `custom_${Date.now()}`,
      name: newPirogName.trim(),
      isCustom: true,
      works: [...basePirog.works.map(w => ({ ...w, id: `w_${Date.now()}_${Math.random().toString(36).substring(2, 5)}` }))],
      materials: [...basePirog.materials.map(m => ({ ...m, id: `m_${Date.now()}_${Math.random().toString(36).substring(2, 5)}` }))]
    };

    const updatedList = saveCustomPirog(newPirog);
    setAllPirogs(updatedList);
    onPirogsUpdated?.(updatedList);

    setLocalPirogIds(prev => ({
      ...prev,
      [newPirogCategory]: newPirog.id
    }));

    setNewPirogCategory(null);
    setNewPirogName('');
    showToast(`🎉 Создан и выбран новый пирог «${newPirog.name}»!`);
  };

  // Сброс к эталону Краснодара
  const handleResetToBenchmark = (pirogId: string) => {
    const updatedList = resetPirogToDefault(pirogId);
    setAllPirogs(updatedList);
    onPirogsUpdated?.(updatedList);
    showToast('🔄 Пирог сброшен к эталонному составу и расценкам!');
  };

  // Расчет стоимости по выбранным пирогам комнаты
  const calculatedFinishes = useMemo(() => {
    const list: Array<{
      category: PirogCategory;
      categoryName: string;
      icon: string;
      pirog: PirogDefinition | null;
      worksTotal: number;
      materialsTotal: number;
      total: number;
    }> = [];

    const categoriesConfig: Array<{ id: PirogCategory; name: string; icon: string; area: number; unit: string }> = [
      { id: 'ceiling', name: 'Потолок', icon: '☁️', area: room.floorArea, unit: 'м²' },
      { id: 'walls', name: 'Стены', icon: '🧱', area: room.wallNetArea, unit: 'м²' },
      { id: 'floor', name: 'Пол', icon: '🪵', area: room.floorArea, unit: 'м²' },
      { id: 'doors', name: 'Дверные блоки', icon: '🚪', area: room.doorsCount || 0, unit: 'шт' },
      { id: 'other', name: 'Плинтус напольный', icon: '📏', area: room.perimeter, unit: 'м.п.' },
    ];

    for (const cat of categoriesConfig) {
      const selectedId = localPirogIds[cat.id];
      const pirog = selectedId && selectedId !== 'none' 
        ? allPirogs.find(p => p.id === selectedId) || null 
        : null;

      let wTot = 0;
      let mTot = 0;

      if (pirog) {
        pirog.works.forEach(w => {
          let qty = 0;
          if (w.multiplierType === 'floorArea' || w.multiplierType === 'ceilingArea') qty = room.floorArea;
          else if (w.multiplierType === 'wallNetArea') qty = room.wallNetArea;
          else if (w.multiplierType === 'perimeter') qty = room.perimeter;
          else if (w.multiplierType === 'doorsCount') qty = room.doorsCount || 1;
          else if (w.multiplierType === 'windowsCount') qty = room.windowsCount || 0;
          else qty = w.fixedQuantity || 1;

          let unitPrice = w.defaultUnitPrice;
          if (tariff === 'econom' && w.economPrice) unitPrice = w.economPrice;
          else if (tariff === 'design' && w.designPrice) unitPrice = w.designPrice;
          else if (tariff === 'detailed' && w.detailedPrice) unitPrice = w.detailedPrice;

          wTot += Math.round(qty * unitPrice * regionalCoeff);
        });

        pirog.materials.forEach(m => {
          let baseQty = 0;
          if (m.multiplierType === 'floorArea' || m.multiplierType === 'ceilingArea') baseQty = room.floorArea;
          else if (m.multiplierType === 'wallNetArea') baseQty = room.wallNetArea;
          else if (m.multiplierType === 'perimeter') baseQty = room.perimeter;
          else if (m.multiplierType === 'doorsCount') baseQty = room.doorsCount || 1;
          else baseQty = m.fixedQuantity || 1;

          const totalMatQty = baseQty * m.normPerUnit * (m.safetyCoeff || 1.05);
          mTot += Math.round(totalMatQty * m.defaultUnitPrice * regionalCoeff);
        });
      }

      list.push({
        category: cat.id,
        categoryName: cat.name,
        icon: cat.icon,
        pirog,
        worksTotal: wTot,
        materialsTotal: mTot,
        total: wTot + mTot
      });
    }

    const roomGrandTotal = list.reduce((sum, item) => sum + item.total, 0);
    const roomWorksTotal = list.reduce((sum, item) => sum + item.worksTotal, 0);
    const roomMaterialsTotal = list.reduce((sum, item) => sum + item.materialsTotal, 0);

    return { list, roomGrandTotal, roomWorksTotal, roomMaterialsTotal };
  }, [room, localPirogIds, allPirogs, tariff, regionalCoeff]);

  const handleApply = () => {
    onSaveFinishes(room.id, localPirogIds);
    onClose();
  };

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('ru-RU').format(Math.round(val));
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-800 animate-in zoom-in-95">
        
        {/* ШАПКА ОКНА */}
        <div className="px-5 py-3 bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 text-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base tracking-tight">{room.name}</h3>
                <span className="text-[10px] font-mono font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
                  #{room.id.slice(-4)}
                </span>
                {isWetRoom && (
                  <span className="text-[10px] font-bold bg-sky-400 text-blue-950 px-2 py-0.5 rounded-full">
                    💧 Мокрая зона
                  </span>
                )}
              </div>
              <p className="text-[11px] text-blue-100">
                Выбор пирогов отделки, ручная настройка состава работ, расценок и материалов
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setCreatorDefaultCategory('floor');
                setIsCustomCreatorOpen(true);
              }}
              className="px-2.5 py-1 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-lg shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
              title="Создать свой собственный пирог отделки с нуля с любыми работами и ценами"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>+ Свой пирог с нуля</span>
            </button>

            <button
              onClick={onClose}
              className="text-white/70 hover:text-white p-1.5 rounded-lg transition-colors cursor-pointer"
              title="Закрыть [Esc]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ТОСТ УВЕДОМЛЕНИЯ */}
        {toastMsg && (
          <div className="bg-emerald-600 text-white px-4 py-1.5 text-xs font-bold flex items-center justify-between shrink-0 animate-in slide-in-from-top duration-200">
            <span>{toastMsg}</span>
            <button onClick={() => setToastMsg(null)} className="text-white/80 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ГЕОМЕТРИЯ КОМНАТЫ (ПОД ШАПКОЙ) */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-2 text-xs font-mono shrink-0">
          <div className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs flex items-center gap-1.5">
            <span className="text-slate-400">📐 Пол:</span>
            <b className="text-blue-700 text-sm">{room.floorArea} м²</b>
          </div>
          <div className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs flex items-center gap-1.5">
            <span className="text-slate-400">🧱 Стены (чистые):</span>
            <b className="text-emerald-700 text-sm">{room.wallNetArea} м²</b>
            <span className="text-[10px] text-slate-400 font-sans">(брутто {room.wallGrossArea || (room.perimeter * (room.ceilingHeight || 2.7)).toFixed(2)} м²)</span>
          </div>
          <div className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs flex items-center gap-1.5">
            <span className="text-slate-400">📏 Периметр:</span>
            <b className="text-slate-800">{room.perimeter} м</b>
          </div>
          {(room.windowsCount || 0) > 0 && (
            <div className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs flex items-center gap-1.5">
              <span className="text-slate-400">🪟 Откосы окон:</span>
              <b className="text-amber-700">{windowSlopesLength.toFixed(1)} м.п.</b>
            </div>
          )}
        </div>

        {/* ТЕЛО МОДАЛКИ: КАТЕГОРИИ РАБОТ СО СТРЕЛОЧКАМИ ВЫБОРА И РЕДАКТОРОМ */}
        <div className="p-4 space-y-3.5 overflow-y-auto flex-1 bg-slate-50/40">
          {calculatedFinishes.list.map(item => {
            const availablePirogs = allPirogs.filter(p => p.category === item.category);
            const isExpanded = !!expandedSections[item.category];
            const currentPirogId = localPirogIds[item.category] || 'none';

            return (
              <div 
                key={item.category} 
                className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all hover:border-slate-300"
              >
                {/* СТРОКА КАТЕГОРИИ С ВЫПАДАЮЩИМ СПИСКОМ */}
                <div className="p-3 flex items-center justify-between gap-3 bg-slate-50/70 border-b border-slate-100">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="text-xl shrink-0 p-1.5 bg-white rounded-lg shadow-2xs border border-slate-200/60">
                      {item.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          {item.categoryName}:
                          {item.pirog?.isCustom && (
                            <span className="text-[9px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded font-mono font-normal lowercase">
                              пользовательский
                            </span>
                          )}
                        </span>
                        {item.total > 0 && (
                          <span className="text-xs font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 shadow-2xs">
                            {formatPrice(item.total)} ₽
                          </span>
                        )}
                      </div>

                      {/* ВЫПАДАЮЩИЙ СПИСОК (БЕЗ ДВОЙНОЙ СТРЕЛКИ: appearance-none) */}
                      <div className="relative">
                        <select
                          value={currentPirogId}
                          onChange={(e) => {
                            if (e.target.value === '__create_custom__') {
                              setCreatorDefaultCategory(item.category as PirogCategory);
                              setIsCustomCreatorOpen(true);
                              return;
                            }
                            setLocalPirogIds({
                              ...localPirogIds,
                              [item.category]: e.target.value === 'none' ? null : e.target.value
                            });
                          }}
                          className="w-full text-xs font-semibold px-2.5 py-1.5 pr-8 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer truncate appearance-none"
                        >
                          <option value="none">— Без отделки / Ничего —</option>
                          {availablePirogs.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.isCustom ? '⭐ ' : ''}{p.name}
                            </option>
                          ))}
                          <option value="__create_custom__" className="font-bold text-indigo-700 bg-indigo-50">
                            ✨ + Создать свой пирог отделки с нуля...
                          </option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Кнопка показа / скрытия состава работ и редактирования */}
                  {item.pirog && (
                    <button
                      type="button"
                      onClick={() => setExpandedSections(prev => ({ ...prev, [item.category]: !prev[item.category] }))}
                      className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shrink-0 cursor-pointer self-end mb-0.5 border ${
                        isExpanded ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 hover:text-blue-700 hover:bg-slate-100 border-slate-200 shadow-2xs'
                      }`}
                      title="Настроить работы, материалы и цены"
                    >
                      <Pencil className="w-3 h-3" />
                      <span className="text-[10px]">{isExpanded ? 'Свернуть' : 'Состав и цены'}</span>
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>

                {/* РАСКРЫВАЮЩИЙСЯ ИНТЕРАКТИВНЫЙ РЕДАКТОР СОСТАВА, РАСЦЕНОК И МАТЕРИАЛОВ */}
                {isExpanded && item.pirog && (
                  <div className="p-3 bg-white space-y-3 text-xs animate-in fade-in duration-150">
                    
                    {/* Панель быстрых действий по пирогу */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5 pb-2 border-b border-slate-100">
                      <div className="text-[11px] text-slate-500 font-medium italic truncate max-w-xs">
                        {item.pirog.description || item.pirog.name}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleSaveCurrentPirog(item.pirog!.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg shadow-2xs flex items-center gap-1 transition-colors cursor-pointer"
                          title="Сохранить измененные расценки и список работ в этот пирог на будущее"
                        >
                          <Save className="w-3 h-3" />
                          <span>Сохранить в пирог</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setNewPirogCategory(item.category);
                            setNewPirogName(`${item.pirog!.name.split('—')[0].trim()} (свой вариант)`);
                          }}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-[11px] rounded-lg shadow-2xs flex items-center gap-1 transition-colors cursor-pointer"
                          title="Сохранить этот состав как отдельный новый пирог"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Как новый пирог...</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleResetToBenchmark(item.pirog!.id)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-[11px] rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                          title="Сбросить к заводским расценкам сметы Краснодара"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Сбросить к эталону</span>
                        </button>
                      </div>
                    </div>

                    {/* Модальное мини-окно сохранения как нового пирога */}
                    {newPirogCategory === item.category && (
                      <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2 animate-in fade-in">
                        <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Сохранить текущую конфигурацию как новый вариант пирога:</span>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newPirogName}
                            onChange={e => setNewPirogName(e.target.value)}
                            placeholder="Название нового пирога отделки..."
                            className="flex-1 px-2.5 py-1 text-xs bg-white border border-indigo-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={handleConfirmSaveAsNewPirog}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer"
                          >
                            Создать
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewPirogCategory(null)}
                            className="px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    )}

                    {/* БЛОК 1: РАБОТЫ */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between pb-1">
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                          <Hammer className="w-3.5 h-3.5 text-blue-600" />
                          <span>Работы ({formatPrice(item.worksTotal)} ₽):</span>
                        </span>

                        <button
                          type="button"
                          onClick={() => handleAddWorkRow(item.pirog!.id, item.category)}
                          className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Добавить работу</span>
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {item.pirog.works.length === 0 ? (
                          <div className="text-[11px] text-slate-400 italic py-1 pl-2">
                            Нет добавленных работ
                          </div>
                        ) : (
                          item.pirog.works.map(w => {
                            let qty = 0;
                            if (w.multiplierType === 'floorArea' || w.multiplierType === 'ceilingArea') qty = room.floorArea;
                            else if (w.multiplierType === 'wallNetArea') qty = room.wallNetArea;
                            else if (w.multiplierType === 'perimeter') qty = room.perimeter;
                            else if (w.multiplierType === 'doorsCount') qty = room.doorsCount || 1;
                            else if (w.multiplierType === 'windowsCount') qty = room.windowsCount || 0;
                            else qty = w.fixedQuantity || 1;

                            let unitPrice = w.defaultUnitPrice;
                            if (tariff === 'econom' && w.economPrice) unitPrice = w.economPrice;
                            else if (tariff === 'design' && w.designPrice) unitPrice = w.designPrice;
                            else if (tariff === 'detailed' && w.detailedPrice) unitPrice = w.detailedPrice;
                            const lineTot = Math.round(qty * unitPrice * regionalCoeff);

                            return (
                              <div 
                                key={w.id} 
                                className="flex flex-wrap items-center justify-between gap-1.5 p-1.5 bg-slate-50/70 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                              >
                                {/* Наименование работы */}
                                <input
                                  type="text"
                                  value={w.name}
                                  onChange={e => handleUpdateWorkField(item.pirog!.id, w.id, 'name', e.target.value)}
                                  className="flex-1 min-w-[200px] text-xs font-semibold px-2 py-1 bg-white border border-slate-200 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  placeholder="Наименование работы..."
                                />

                                {/* Единица измерения */}
                                <input
                                  type="text"
                                  value={w.unit}
                                  onChange={e => handleUpdateWorkField(item.pirog!.id, w.id, 'unit', e.target.value)}
                                  className="w-14 text-center text-xs font-medium px-1 py-1 bg-white border border-slate-200 rounded text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  title="Единица измерения"
                                />

                                {/* Базовая цена за единицу */}
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min="0"
                                    step="10"
                                    value={w.defaultUnitPrice}
                                    onChange={e => handleUpdateWorkField(item.pirog!.id, w.id, 'defaultUnitPrice', parseFloat(e.target.value) || 0)}
                                    className="w-20 text-right font-mono font-bold text-xs px-1.5 py-1 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    title="Цена за единицу работы (руб)"
                                  />
                                  <span className="text-[11px] text-slate-500 font-bold">₽</span>
                                </div>

                                {/* Тип объема (к чему привязано) */}
                                <select
                                  value={w.multiplierType}
                                  onChange={e => handleUpdateWorkField(item.pirog!.id, w.id, 'multiplierType', e.target.value)}
                                  className="text-[10px] font-semibold px-1.5 py-1 bg-white border border-slate-200 rounded text-slate-700 focus:outline-none cursor-pointer"
                                  title="Привязка объема к геометрии"
                                >
                                  <option value="wallNetArea">S чистых стен ({room.wallNetArea} м²)</option>
                                  <option value="floorArea">S пола ({room.floorArea} м²)</option>
                                  <option value="ceilingArea">S потолка ({room.floorArea} м²)</option>
                                  <option value="perimeter">Периметр ({room.perimeter} м)</option>
                                  <option value="doorsCount">Двери ({room.doorsCount || 1} шт)</option>
                                  <option value="windowsCount">Окна ({room.windowsCount || 0} шт)</option>
                                  <option value="fixed">Фикс. объем (1)</option>
                                </select>

                                {/* Итог по строке */}
                                <div className="min-w-[80px] text-right font-mono text-xs font-bold text-blue-900">
                                  = {formatPrice(lineTot)} ₽
                                </div>

                                {/* Кнопка удаления работы */}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteWorkRow(item.pirog!.id, w.id)}
                                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                  title="Удалить эту работу"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* БЛОК 2: ЧЕРНОВЫЕ МАТЕРИАЛЫ */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between pb-1">
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                          <Package className="w-3.5 h-3.5 text-amber-600" />
                          <span>Черновые материалы ({formatPrice(item.materialsTotal)} ₽):</span>
                        </span>

                        <button
                          type="button"
                          onClick={() => handleAddMaterialRow(item.pirog!.id, item.category)}
                          className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Добавить материал</span>
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {item.pirog.materials.length === 0 ? (
                          <div className="text-[11px] text-slate-400 italic py-1 pl-2">
                            Нет добавленных черновых материалов
                          </div>
                        ) : (
                          item.pirog.materials.map(m => {
                            let baseQty = 0;
                            if (m.multiplierType === 'floorArea' || m.multiplierType === 'ceilingArea') baseQty = room.floorArea;
                            else if (m.multiplierType === 'wallNetArea') baseQty = room.wallNetArea;
                            else if (m.multiplierType === 'perimeter') baseQty = room.perimeter;
                            else if (m.multiplierType === 'doorsCount') baseQty = room.doorsCount || 1;
                            else baseQty = m.fixedQuantity || 1;

                            const totalMatQty = Number((baseQty * m.normPerUnit * (m.safetyCoeff || 1.05)).toFixed(1));
                            const lineTot = Math.round(totalMatQty * m.defaultUnitPrice * regionalCoeff);

                            return (
                              <div 
                                key={m.id} 
                                className="flex flex-wrap items-center justify-between gap-1.5 p-1.5 bg-amber-50/40 border border-amber-200/70 rounded-lg hover:border-amber-300 transition-colors"
                              >
                                {/* Наименование материала */}
                                <input
                                  type="text"
                                  value={m.name}
                                  onChange={e => handleUpdateMaterialField(item.pirog!.id, m.id, 'name', e.target.value)}
                                  className="flex-1 min-w-[200px] text-xs font-semibold px-2 py-1 bg-white border border-slate-200 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                  placeholder="Наименование материала..."
                                />

                                {/* Норма расхода на 1 ед. */}
                                <div className="flex items-center gap-1" title="Норма расхода на 1 единицу площади/проема">
                                  <span className="text-[10px] text-slate-400">расход:</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={m.normPerUnit}
                                    onChange={e => handleUpdateMaterialField(item.pirog!.id, m.id, 'normPerUnit', parseFloat(e.target.value) || 0)}
                                    className="w-14 text-center text-xs font-mono font-bold px-1 py-1 bg-white border border-slate-200 rounded text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                  />
                                </div>

                                {/* Единица измерения */}
                                <input
                                  type="text"
                                  value={m.unit}
                                  onChange={e => handleUpdateMaterialField(item.pirog!.id, m.id, 'unit', e.target.value)}
                                  className="w-14 text-center text-xs font-medium px-1 py-1 bg-white border border-slate-200 rounded text-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                  title="Единица измерения материала (кг, л, рул, шт)"
                                />

                                {/* Базовая цена за единицу */}
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min="0"
                                    step="10"
                                    value={m.defaultUnitPrice}
                                    onChange={e => handleUpdateMaterialField(item.pirog!.id, m.id, 'defaultUnitPrice', parseFloat(e.target.value) || 0)}
                                    className="w-20 text-right font-mono font-bold text-xs px-1.5 py-1 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                    title="Цена за единицу материала (руб)"
                                  />
                                  <span className="text-[11px] text-slate-500 font-bold">₽</span>
                                </div>

                                {/* Итог по материалу */}
                                <div className="min-w-[80px] text-right font-mono text-xs font-bold text-amber-900">
                                  = {formatPrice(lineTot)} ₽
                                </div>

                                {/* Кнопка удаления материала */}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMaterialRow(item.pirog!.id, m.id)}
                                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                  title="Удалить этот материал"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ПОДВАЛ МОДАЛКИ С ИТОГОВОЙ СТОИМОСТЬЮ ПО КОМНАТЕ */}
        <div className="px-5 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
              Итого по помещению ({room.name}):
            </div>
            <div className="text-lg font-black font-mono text-blue-900 leading-tight">
              {formatPrice(calculatedFinishes.roomGrandTotal)} ₽
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              работы {formatPrice(calculatedFinishes.roomWorksTotal)} ₽ | материалы {formatPrice(calculatedFinishes.roomMaterialsTotal)} ₽
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              onClick={handleApply}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Применить к смете</span>
            </button>
          </div>
        </div>

        {/* МОДАЛЬНЫЙ КОНСТРУКТОР ПИРОГА С НУЛЯ */}
        <CustomPirogCreatorModal
          isOpen={isCustomCreatorOpen}
          onClose={() => setIsCustomCreatorOpen(false)}
          defaultCategory={creatorDefaultCategory}
          onSaveNewPirog={(newPirog) => {
            const updated = [...allPirogs, newPirog];
            onPirogsUpdated(updated);
            try {
              const saved = loadEffectivePirogs();
              const existingIdx = saved.findIndex(p => p.id === newPirog.id);
              if (existingIdx >= 0) saved[existingIdx] = newPirog;
              else saved.push(newPirog);
              localStorage.setItem('estimate_cad_custom_pirogs_v2', JSON.stringify(saved));
            } catch {}
            setLocalPirogIds(prev => ({ ...prev, [newPirog.category]: newPirog.id }));
            setExpandedSections(prev => ({ ...prev, [newPirog.category]: true }));
            showToast(`🎉 Пирог «${newPirog.name}» успешно создан и применен!`);
          }}
        />
      </div>
    </div>,
    document.body
  );
};
