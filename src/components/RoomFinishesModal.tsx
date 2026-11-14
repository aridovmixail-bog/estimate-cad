import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Room } from '../cad/types';
import { PirogCategory, PirogDefinition, RoomSelectionState, PricingTariff } from '../estimate/types';
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
  DollarSign
} from 'lucide-react';

/**
 * Эталонные строительные пироги отделки, сформированные СТРОГО на основе
 * вашей оригинальной сметы объекта (ул. Дангиреева, д. 2, к.3, кв. 376):
 * - Стены под обои: грунт 70 + шпатлевка 2 сл 530 + шлифовка 100 + грунт 70 + обои 550 = 1 320 ₽/м²
 * - Стены плитка: грунт 70 + штукатурка ЦПС 720 + гидроизоляция 500 + грунт 70 + укладка 2000 + затирка 500 = 3 860 ₽/м²
 * - Пол ламинат: укладка ламината с подложкой = 600 ₽/м²
 * - Пол керамогранит: наливной пол 700 + грунт 250 + гидроизоляция 500 + плитка 2000 + затирка 500 = 4 020 ₽/м²
 * - Потолок: натяжной потолок матовый белый = 750 ₽/м²
 * - Плинтус: монтаж пластикового плинтуса = 450 ₽/м.п.
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
      { id: 'kft_6', name: 'Затирка цементная пол', unit: 'м²', defaultUnitPrice: 500, multiplierType: 'floorArea' },
    ],
    materials: []
  },
  {
    id: 'KRD-F-SCREED',
    name: 'Только наливной пол (выравнивание стяжки до 10 мм: грунтовка + заливка) — 950 ₽/м²',
    category: 'floor',
    description: '1. Грунтование пола перед устройством наливного пола (250₽)\n2. Устройство наливного пола до 10 мм (700₽)',
    standardPrice: 950,
    works: [
      { id: 'kfs_1', name: 'Грунтование пола перед устройством наливного пола', unit: 'м²', defaultUnitPrice: 250, multiplierType: 'floorArea' },
      { id: 'kfs_2', name: 'Устройство наливного пола, до 10 мм', unit: 'м²', defaultUnitPrice: 700, multiplierType: 'floorArea' },
    ],
    materials: []
  },

  // 3. ПОТОЛКИ
  {
    id: 'KRD-C-STRETCH',
    name: '⭐ Натяжной потолок матовый белый MSD Premium (по смете объекта) — 750 ₽/м²',
    category: 'ceiling',
    description: 'Монтаж натяжного потолка (белый матовый MSD Premium) (750₽)',
    standardPrice: 750,
    works: [
      { id: 'kcs_1', name: 'Монтаж натяжного потолка (белый матовый MSD Premium)', unit: 'м²', defaultUnitPrice: 750, multiplierType: 'floorArea' }
    ],
    materials: []
  },
  {
    id: 'KRD-C-PAINT',
    name: 'Покраска потолка (грунтовка + шпатлевка 2 сл + покраска 2 сл) — 1 450 ₽/м²',
    category: 'ceiling',
    description: 'Грунтовка (70₽) + Шпатлевка 2 сл (580₽) + Шлифовка (150₽) + Грунтовка (70₽) + Покраска 2 сл (580₽)',
    standardPrice: 1450,
    works: [
      { id: 'kcp_1', name: 'Грунтование потолка', unit: 'м²', defaultUnitPrice: 70, multiplierType: 'floorArea' },
      { id: 'kcp_2', name: 'Шпатлевание потолка 2 раза', unit: 'м²', defaultUnitPrice: 580, multiplierType: 'floorArea' },
      { id: 'kcp_3', name: 'Шлифование потолка', unit: 'м²', defaultUnitPrice: 150, multiplierType: 'floorArea' },
      { id: 'kcp_4', name: 'Покраска потолка в 2 слоя', unit: 'м²', defaultUnitPrice: 580, multiplierType: 'floorArea' },
    ],
    materials: []
  },

  // 4. ПЛИНТУС НАПОЛЬНЫЙ
  {
    id: 'KRD-O-PLINTH',
    name: '⭐ Монтаж напольного пластикового плинтуса с кабель-каналом (по смете объекта) — 450 ₽/м.п.',
    category: 'other',
    description: 'Монтаж напольного пластикового плинтуса с кабель-каналом (450₽)',
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

const MERGED_PIROGS: PirogDefinition[] = [
  ...KRASNODAR_ESTIMATE_PIROGS,
  ...DEFAULT_PIROGS.filter(dp => !KRASNODAR_ESTIMATE_PIROGS.some(kp => kp.id === dp.id))
];

interface RoomFinishesModalProps {
  isOpen: boolean;
  room: Room | null;
  onClose: () => void;
  selections: Record<string, RoomSelectionState>;
  onSaveFinishes: (roomId: string, pirogIds: Record<string, string | null>) => void;
  tariff?: PricingTariff;
  regionalCoeff?: number;
  allPirogs?: PirogDefinition[];
}

export const RoomFinishesModal: React.FC<RoomFinishesModalProps> = ({
  isOpen,
  room,
  onClose,
  selections,
  onSaveFinishes,
  tariff = 'standard',
  regionalCoeff = 1.0,
  allPirogs = MERGED_PIROGS,
}) => {
  if (!isOpen || !room) return null;

  const isWetRoom = room.roomType === 'wet' || /ванн|сануз|туалет|душ/i.test(room.name);

  const currentSelection = selections[room.id] || {
    roomId: room.id,
    selectedPirogIds: {},
    overridePrices: {},
    customWorks: [],
    customMaterials: []
  };

  // По умолчанию для комнат подставляем эталонные пироги из сметы Дангиреева:
  // Для санузла/ванной: Керамогранит на стены и пол
  // Для жилых комнат/кухни: Обои + Ламинат + Натяжной потолок + Плинтус
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
    return room.windowsList.reduce((acc, w) => acc + (w.width + 2 * w.height), 0);
  }, [room.windowsList]);

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
        // Считаем работы пирога
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

        // Считаем материалы пирога
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
    <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] text-slate-800 animate-in zoom-in-95">
        
        {/* ШАПКА ОКНА */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between shrink-0 shadow-xs">
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
                    Мокрая зона
                  </span>
                )}
              </div>
              <p className="text-[11px] text-blue-100">
                Выбор пирогов отделки (потолок, стены, пол, плинтус) для автоматического расчета сметы
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-lg transition-colors cursor-pointer"
            title="Закрыть [Esc]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ГЕОМЕТРИЯ КОМНАТЫ (ПОД ШАПКОЙ) */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-2 text-xs font-mono shrink-0">
          <div className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs flex items-center gap-1.5">
            <span className="text-slate-400">📐 Пол:</span>
            <b className="text-blue-700 text-sm">{room.floorArea} м²</b>
          </div>
          <div className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs flex items-center gap-1.5">
            <span className="text-slate-400">🧱 Стены (чистые):</span>
            <b className="text-emerald-700 text-sm">{room.wallNetArea} м²</b>
            <span className="text-[10px] text-slate-400 font-sans">(брутто {room.wallGrossArea} м²)</span>
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

        {/* ТЕЛО МОДАЛКИ: КАТЕГОРИИ РАБОТ СО СТРЕЛОЧКАМИ ВЫБОРА */}
        <div className="p-5 space-y-3.5 overflow-y-auto flex-1">
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
                <div className="p-3 flex items-center justify-between gap-3 bg-slate-50/50">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-lg shrink-0">{item.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                          {item.categoryName}:
                        </span>
                        {item.total > 0 && (
                          <span className="text-xs font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {formatPrice(item.total)} ₽
                          </span>
                        )}
                      </div>

                      {/* ВЫПАДАЮЩИЙ СПИСОК (СТРЕЛОЧКА ВЫБОРА) */}
                      <div className="relative">
                        <select
                          value={currentPirogId}
                          onChange={(e) => setLocalPirogIds({
                            ...localPirogIds,
                            [item.category]: e.target.value === 'none' ? null : e.target.value
                          })}
                          className="w-full text-xs font-semibold px-2.5 py-1.5 pr-8 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer truncate"
                        >
                          <option value="none">— Без отделки / Ничего —</option>
                          {availablePirogs.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Кнопка показа состава работ */}
                  {item.pirog && (
                    <button
                      type="button"
                      onClick={() => setExpandedSections(prev => ({ ...prev, [item.category]: !prev[item.category] }))}
                      className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shrink-0 cursor-pointer self-end mb-0.5"
                      title="Показать подробный состав работ и материалов"
                    >
                      <span className="text-[10px]">{isExpanded ? 'Скрыть' : 'Состав'}</span>
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>

                {/* РАСКРЫВАЮЩИЙСЯ СОСТАВ РАБОТ И МАТЕРИАЛОВ */}
                {isExpanded && item.pirog && (
                  <div className="p-3 bg-white border-t border-slate-100 text-xs space-y-2 animate-in fade-in">
                    <div className="text-[10px] text-slate-500 italic pb-1 border-b border-slate-100">
                      {item.pirog.description}
                    </div>

                    {/* Работы */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Hammer className="w-3 h-3 text-blue-600" />
                        <span>Работы ({formatPrice(item.worksTotal)} ₽):</span>
                      </span>
                      <div className="space-y-1 pl-1">
                        {item.pirog.works.map(w => {
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
                            <div key={w.id} className="flex justify-between items-center text-[11px] py-0.5 text-slate-700 border-b border-slate-50">
                              <span className="truncate pr-2">• {w.name}</span>
                              <span className="font-mono text-slate-500 shrink-0">
                                {qty} {w.unit} × {formatPrice(unitPrice * regionalCoeff)} = <b>{formatPrice(lineTot)} ₽</b>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Материалы */}
                    {item.pirog.materials.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Package className="w-3 h-3 text-amber-600" />
                          <span>Черновые материалы ({formatPrice(item.materialsTotal)} ₽):</span>
                        </span>
                        <div className="space-y-1 pl-1">
                          {item.pirog.materials.map(m => {
                            let baseQty = 0;
                            if (m.multiplierType === 'floorArea' || m.multiplierType === 'ceilingArea') baseQty = room.floorArea;
                            else if (m.multiplierType === 'wallNetArea') baseQty = room.wallNetArea;
                            else if (m.multiplierType === 'perimeter') baseQty = room.perimeter;
                            else if (m.multiplierType === 'doorsCount') baseQty = room.doorsCount || 1;
                            else baseQty = m.fixedQuantity || 1;

                            const totalMatQty = Number((baseQty * m.normPerUnit * (m.safetyCoeff || 1.05)).toFixed(1));
                            const lineTot = Math.round(totalMatQty * m.defaultUnitPrice * regionalCoeff);

                            return (
                              <div key={m.id} className="flex justify-between items-center text-[11px] py-0.5 text-slate-600 border-b border-slate-50">
                                <span className="truncate pr-2">• {m.name}</span>
                                <span className="font-mono text-slate-500 shrink-0">
                                  {totalMatQty} {m.unit} × {formatPrice(m.defaultUnitPrice * regionalCoeff)} = <b>{formatPrice(lineTot)} ₽</b>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
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

      </div>
    </div>,
    document.body
  );
};
