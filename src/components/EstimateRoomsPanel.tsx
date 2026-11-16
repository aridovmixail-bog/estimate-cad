import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Room } from '../cad/types';
import { 
  RoomSelectionState, 
  CalculatedProjectEstimate, 
  PirogCategory,
  ActiveWorkRow,
  ActiveMaterialRow,
  EstimateExportOptions,
  PricingTariff,
  REGIONAL_PRESETS,
  PirogDefinition
} from '../estimate/types';
import { PIROG_CATEGORIES, DEFAULT_PIROGS } from '../estimate/defaultPirogs';
import { KRASNODAR_DETAILED_CATALOG } from '../estimate/krasnodarCatalog';
import { calculateProjectEstimate } from '../estimate/estimateEngine';
import { generateEstimateExcel, downloadEstimateExcel, generateTurnkey118Excel } from '../estimate/excelExporter';
import { generateEstimatePdf, generateClientProposalPdf, ClientProposalOptions } from '../estimate/pdfExporter';
import { 
  calculateTurnkey118Estimate, 
  DEFAULT_OBJECT_CONSTANTS, 
  ObjectChecklistConstants, 
  KRASNODAR_118_ITEMS 
} from '../estimate/krasnodarTurnkeyTemplate';
import { 
  FileSpreadsheet, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Check, 
  Building2, 
  User, 
  Hammer,
  Package,
  FileDown,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Layers,
  Search,
  ListTodo,
  CheckSquare,
  HelpCircle,
  Briefcase,
  Zap,
  Upload
} from 'lucide-react';

interface EstimateRoomsPanelProps {
  rooms: Room[];
  electricCountsByRoom?: Record<string, number>;
  plumbingCountsByRoom?: Record<string, number>;
  onClose?: () => void;
  className?: string;
  getCanvasImageBase64?: () => string | null;
  pirogs?: PirogDefinition[];
  onOpenConstructor?: () => void;
  clientInfo?: {
    name: string;
    address: string;
    phone: string;
    contractNumber: string;
    date: string;
  };
  onClientInfoChange?: (info: { name: string; address: string; phone: string; contractNumber: string; date: string }) => void;
  selections?: Record<string, RoomSelectionState>;
  onSelectionsChange?: (selections: Record<string, RoomSelectionState>) => void;
  checklistConstants?: any;
  onChecklistConstantsChange?: (c: any) => void;
  onSwitchToPiecework?: () => void;
  priceOverrides?: Record<string, number>;
  onResetAll?: () => void;
  onLoadBenchmarkRooms?: (benchmarkRooms: any[]) => void;
}

const STORAGE_KEY_SELECTIONS = 'estimate_cad_room_selections_v2';
const STORAGE_KEY_CLIENT = 'estimate_cad_client_info_v2';

export const EstimateRoomsPanel: React.FC<EstimateRoomsPanelProps> = ({
  rooms,
  electricCountsByRoom = {},
  plumbingCountsByRoom = {},
  onClose,
  className = '',
  getCanvasImageBase64,
  pirogs,
  onOpenConstructor,
  clientInfo: externalClientInfo,
  onClientInfoChange,
  selections: externalSelections,
  onSelectionsChange
}) => {
  // Информация о клиенте и объекте
  const [internalClientInfo, setInternalClientInfo] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CLIENT);
      if (saved) return JSON.parse(saved);
    } catch {}
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;
    return {
      name: 'Иванов Иван Иванович',
      address: 'г. Краснодар, ул. Дангиреева, д. 2, к.3, кв. 376',
      phone: '+7 (918) 123-45-67',
      contractNumber: `КР-${now.getFullYear()}-376`,
      date: dateStr
    };
  });

  const clientInfo = externalClientInfo || internalClientInfo;
  const setClientInfo = (info: { name: string; address: string; phone: string; contractNumber: string; date: string }) => {
    setInternalClientInfo(info);
    if (onClientInfoChange) onClientInfoChange(info);
    try {
      localStorage.setItem(STORAGE_KEY_CLIENT, JSON.stringify(info));
    } catch {}
  };


  // Выбранные пироги и ручные правки по комнатам
  const [internalSelections, setInternalSelections] = useState<Record<string, RoomSelectionState>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SELECTIONS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  const selections = externalSelections || internalSelections;
  const setSelections = (action: React.SetStateAction<Record<string, RoomSelectionState>>) => {
    setInternalSelections(prev => {
      const next = typeof action === 'function' ? action(prev) : action;
      if (onSelectionsChange) onSelectionsChange(next);
      try {
        localStorage.setItem(STORAGE_KEY_SELECTIONS, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Раскрытые аккордеоны комнат: по умолчанию первая открыта
  const [expandedRooms, setExpandedRooms] = useState<Record<string, boolean>>({});

  // Раскрытые подразделы категорий (например: "room1_walls": true)
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  // Модальное окно экспорта и опции с галочками
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [exportOptions, setExportOptions] = useState<EstimateExportOptions>({
    exportExcel: true,
    exportPdf: false,
    hidePrices: false,
    includePlanImage: true,
    includeMaterials: false,
    exportScope: 'works'
  });

  // Статус экспорта
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  // Тариф и региональный коэффициент Краснодарского края
  const [tariff, setTariff] = useState<PricingTariff>(() => {
    return (localStorage.getItem('estimate_cad_tariff') as PricingTariff) || 'standard';
  });
  const [regionalPresetId, setRegionalPresetId] = useState<string>(() => {
    return localStorage.getItem('estimate_cad_region') || 'krd_base';
  });

  const selectedRegion = useMemo(() => {
    return REGIONAL_PRESETS.find(r => r.id === regionalPresetId) || REGIONAL_PRESETS[0];
  }, [regionalPresetId]);
  const regionalCoeff = selectedRegion.coeff;

  useEffect(() => {
    try {
      localStorage.setItem('estimate_cad_tariff', tariff);
    } catch {}
  }, [tariff]);

  useEffect(() => {
    try {
      localStorage.setItem('estimate_cad_region', regionalPresetId);
    } catch {}
  }, [regionalPresetId]);

  // Режим сметы: Эталон 118 строк Краснодара (по умолчанию) или по помещениям
  const [estimateMode, setEstimateMode] = useState<'turnkey_118' | 'by_rooms'>('turnkey_118');

  // Константы и штучный чек-лист объекта
  const [checklistConstants, setChecklistConstants] = useState<ObjectChecklistConstants>(() => {
    try {
      const saved = localStorage.getItem('estimate_cad_checklist_constants_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_OBJECT_CONSTANTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('estimate_cad_checklist_constants_v2', JSON.stringify(checklistConstants));
    } catch {}
  }, [checklistConstants]);

  const [isChecklistExpanded, setIsChecklistExpanded] = useState<boolean>(false);
  const [showProposalModal, setShowProposalModal] = useState<boolean>(false);
  const [proposalPriceMode, setProposalPriceMode] = useState<'total_only' | 'stages'>('total_only');
  const [companySettings, setCompanySettings] = useState<{
    name: string;
    phone: string;
    tagline: string;
    logoBase64: string | null;
  }>(() => {
    try {
      const saved = localStorage.getItem('estimate_cad_company_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      name: 'СТРОИТЕЛЬНАЯ КОМПАНИЯ «КРАСНОДАР РЕМОНТ»',
      phone: '+7 (918) 123-45-67',
      tagline: 'Качественный ремонт и отделка квартир под ключ в Краснодаре и крае',
      logoBase64: null,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('estimate_cad_company_settings', JSON.stringify(companySettings));
    } catch {}
  }, [companySettings]);

  // Расчет эталонной 118-позиционной сметы
  const turnkey118Result = useMemo(() => {
    return calculateTurnkey118Estimate(rooms, checklistConstants);
  }, [rooms, checklistConstants]);

  const handleLoadDangireevaTemplate = () => {
    setClientInfo({
      name: 'Иванов Иван Иванович',
      address: 'г. Краснодар, ул. Дангиреева, д. 2, к.3, кв. 376',
      phone: '+7 (918) 123-45-67',
      contractNumber: 'КР-2026-376',
      date: new Date().toLocaleDateString('ru-RU')
    });
    setChecklistConstants(DEFAULT_OBJECT_CONSTANTS);
    setEstimateMode('turnkey_118');
    setExportSuccessMessage('✅ Загружен эталон: ул. Дангиреева 2 (118 позиций, 954 226.40 ₽)');
    setTimeout(() => setExportSuccessMessage(null), 4000);
  };

  // Поиск по детальному каталогу КРД (459 поз.)
  const [catalogSearchQuery, setCatalogSearchQuery] = useState<string>('');

  const filteredCatalog = useMemo(() => {
    if (!catalogSearchQuery.trim()) return [];
    const q = catalogSearchQuery.toLowerCase();
    return KRASNODAR_DETAILED_CATALOG.filter(item => 
      item.name.toLowerCase().includes(q) || item.code.toLowerCase().includes(q) || item.section.toLowerCase().includes(q)
    ).slice(0, 30);
  }, [catalogSearchQuery]);

  // Форма добавления ручной строки
  const [addingRowToRoom, setAddingRowToRoom] = useState<{ roomId: string; type: 'work' | 'material' } | null>(null);
  const [newRowName, setNewRowName] = useState<string>('');
  const [newRowUnit, setNewRowUnit] = useState<string>('м²');
  const [newRowPrice, setNewRowPrice] = useState<string>('500');
  const [newRowQty, setNewRowQty] = useState<string>('1');

  // Сохранение в LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SELECTIONS, JSON.stringify(selections));
    } catch (e) {
      console.error(e);
    }
  }, [selections]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CLIENT, JSON.stringify(clientInfo));
    } catch (e) {
      console.error(e);
    }
  }, [clientInfo]);

  // Умная начальная инициализация пирогов для новых комнат
  useEffect(() => {
    if (rooms.length === 0) return;

    setSelections(prev => {
      let changed = false;
      const next = { ...prev };

      rooms.forEach((room) => {
        if (!next[room.id]) {
          changed = true;
          const rName = (room.name || '').toLowerCase();
          const isBath = rName.includes('ванн') || rName.includes('санузел') || rName.includes('туалет') || rName.includes('душ');
          const isKitchen = rName.includes('кухн') || rName.includes('столов');
          const isBalcony = rName.includes('балкон') || rName.includes('лоджи');

          next[room.id] = {
            roomId: room.id,
            selectedPirogIds: {
              ceiling: isBalcony ? null : 'FIN-C-01',
              walls: isBath ? 'FIN-W-04' : (isKitchen ? 'FIN-W-02' : 'FIN-W-01'),
              floor: isBath ? 'FIN-F-04' : (isKitchen ? 'FIN-F-03' : 'FIN-F-01'),
              electric: 'FIN-E-01',
              plumbing: isBath || isKitchen ? 'FIN-S-01' : null,
              doors: 'FIN-D-01',
              demolition: null,
              other: isKitchen ? 'FIN-A-01' : null
            },
            overridePrices: {},
            customWorks: [],
            customMaterials: []
          };
        }
      });

      return changed ? next : prev;
    });

    // Раскрываем первую комнату по умолчанию
    setExpandedRooms(prev => {
      if (Object.keys(prev).length === 0 && rooms.length > 0) {
        return { [rooms[0].id]: true };
      }
      return prev;
    });
  }, [rooms]);

  // Актуальный набор бутербродов (пользовательский из конструктора или по умолчанию)
  const effectivePirogs = useMemo(() => {
    return (pirogs && pirogs.length > 0) ? pirogs : DEFAULT_PIROGS;
  }, [pirogs]);

  // Расчет итоговой сметы
  const projectEstimate: CalculatedProjectEstimate = useMemo(() => {
    return calculateProjectEstimate(
      rooms,
      selections,
      effectivePirogs,
      electricCountsByRoom,
      plumbingCountsByRoom,
      clientInfo,
      tariff,
      regionalCoeff
    );
  }, [rooms, selections, effectivePirogs, electricCountsByRoom, plumbingCountsByRoom, clientInfo, tariff, regionalCoeff]);

  // Переключение аккордеона комнаты
  const toggleRoomAccordion = (roomId: string) => {
    setExpandedRooms(prev => ({
      ...prev,
      [roomId]: !prev[roomId]
    }));
  };

  // Переключение аккордеона категории внутри комнаты
  const toggleCategoryAccordion = (roomId: string, catId: string) => {
    const key = `${roomId}_${catId}`;
    setExpandedCats(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Смена выбранного пирога в подразразделе комнаты
  const handlePirogChange = (roomId: string, category: PirogCategory, pirogId: string) => {
    setSelections(prev => {
      const roomSel = prev[roomId] || {
        roomId,
        selectedPirogIds: {},
        overridePrices: {},
        customWorks: [],
        customMaterials: []
      };

      return {
        ...prev,
        [roomId]: {
          ...roomSel,
          selectedPirogIds: {
            ...roomSel.selectedPirogIds,
            [category]: pirogId === 'none' ? null : pirogId
          }
        }
      };
    });
  };

  // Редактирование цены единицы (inline override)
  const handlePriceChange = (roomId: string, templateId: string, newPriceStr: string) => {
    const num = parseFloat(newPriceStr.replace(',', '.'));
    if (isNaN(num) || num < 0) return;

    setSelections(prev => {
      const roomSel = prev[roomId];
      if (!roomSel) return prev;

      return {
        ...prev,
        [roomId]: {
          ...roomSel,
          overridePrices: {
            ...roomSel.overridePrices,
            [templateId]: num
          }
        }
      };
    });
  };

  // Добавление пользовательской строки (работы или материала)
  const handleAddCustomRow = (roomId: string) => {
    if (!addingRowToRoom || !newRowName.trim()) return;

    const price = parseFloat(newRowPrice.replace(',', '.')) || 0;
    const qty = parseFloat(newRowQty.replace(',', '.')) || 1;
    const total = Math.round(price * qty);

    setSelections(prev => {
      const roomSel = prev[roomId] || {
        roomId,
        selectedPirogIds: {},
        overridePrices: {},
        customWorks: [],
        customMaterials: []
      };

      if (addingRowToRoom.type === 'work') {
        const newWork: ActiveWorkRow = {
          id: `custom_work_${Date.now()}`,
          name: newRowName.trim(),
          unit: newRowUnit.trim() || 'шт',
          unitPrice: price,
          quantity: qty,
          total,
          isCustom: true
        };
        return {
          ...prev,
          [roomId]: {
            ...roomSel,
            customWorks: [...roomSel.customWorks, newWork]
          }
        };
      } else {
        const newMat: ActiveMaterialRow = {
          id: `custom_mat_${Date.now()}`,
          name: newRowName.trim(),
          unit: newRowUnit.trim() || 'шт',
          unitPrice: price,
          quantity: qty,
          total,
          isCustom: true
        };
        return {
          ...prev,
          [roomId]: {
            ...roomSel,
            customMaterials: [...roomSel.customMaterials, newMat]
          }
        };
      }
    });

    setAddingRowToRoom(null);
    setNewRowName('');
    setNewRowPrice('500');
    setNewRowQty('1');
  };

  // Удаление пользовательской строки
  const handleDeleteCustomRow = (roomId: string, type: 'work' | 'material', rowId: string) => {
    setSelections(prev => {
      const roomSel = prev[roomId];
      if (!roomSel) return prev;

      if (type === 'work') {
        return {
          ...prev,
          [roomId]: {
            ...roomSel,
            customWorks: roomSel.customWorks.filter(w => w.id !== rowId)
          }
        };
      } else {
        return {
          ...prev,
          [roomId]: {
            ...roomSel,
            customMaterials: roomSel.customMaterials.filter(m => m.id !== rowId)
          }
        };
      }
    });
  };

  // Сброс переопределений цен комнаты к заводским
  const handleResetRoomPrices = (roomId: string) => {
    setSelections(prev => {
      const roomSel = prev[roomId];
      if (!roomSel) return prev;
      return {
        ...prev,
        [roomId]: {
          ...roomSel,
          overridePrices: {}
        }
      };
    });
  };

  // Захват снимка 2D чертежа с холста
  const captureCadCanvasImage = (): string | null => {
    if (getCanvasImageBase64) {
      const img = getCanvasImageBase64();
      if (img) return img;
    }
    try {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
      if (!canvas) return null;

      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = canvas.width;
      exportCanvas.height = canvas.height;
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) return null;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
      ctx.drawImage(canvas, 0, 0);

      return exportCanvas.toDataURL('image/png');
    } catch (e) {
      console.warn('Не удалось захватить снимок холста:', e);
      return null;
    }
  };

  // Выполнение экспорта с выбранными опциями (Excel, PDF, без цен, обмерочный план)
  const handleExecuteExport = async () => {
    if (!exportOptions.exportExcel && !exportOptions.exportPdf) {
      alert('Пожалуйста, выберите хотя бы один формат для экспорта: Excel или PDF');
      return;
    }

    try {
      setIsExporting(true);
      const planImageBase64 = exportOptions.includePlanImage ? captureCadCanvasImage() : null;
      const opts: EstimateExportOptions = {
        ...exportOptions,
        planImageBase64
      };

      const safeAddr = (clientInfo.address || 'Краснодар').replace(/[/\\?%*:|"<>]/g, '_').slice(0, 26);
      const docTypePrefix = exportOptions.hidePrices ? 'Ведомость_Заказчик' : 'Смета';

      // 1. Экспорт в Excel (.xlsx)
      if (exportOptions.exportExcel) {
        if (estimateMode === 'turnkey_118') {
          const blob = await generateTurnkey118Excel(clientInfo, turnkey118Result.rows, {
            hidePrices: exportOptions.hidePrices,
            planImageBase64
          });
          downloadEstimateExcel(blob, `${docTypePrefix}_${safeAddr}_${projectEstimate.contractNumber}.xlsx`);
        } else {
          const blob = await generateEstimateExcel(projectEstimate, opts);
          downloadEstimateExcel(blob, `${docTypePrefix}_${safeAddr}_${projectEstimate.contractNumber}.xlsx`);
        }
      }

      // 2. Экспорт в PDF (.pdf)
      if (exportOptions.exportPdf) {
        await generateEstimatePdf(projectEstimate, opts);
      }

      const formatsList = [exportOptions.exportExcel ? 'Excel' : '', exportOptions.exportPdf ? 'PDF' : ''].filter(Boolean).join(' и ');
      setExportSuccessMessage(`Файл (${formatsList}) успешно сформирован!`);
      setShowExportModal(false);
      setTimeout(() => setExportSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Ошибка экспорта сметы:', err);
      alert('Произошла ошибка при экспорте сметы');
    } finally {
      setIsExporting(false);
    }
  };

  // Генерация Коммерческого предложения для заказчика (PDF с логотипом, планом и ценой)
  const handleGenerateProposal = async () => {
    try {
      setIsExporting(true);
      const planImageBase64 = captureCadCanvasImage();
      await generateClientProposalPdf(projectEstimate, {
        planImageBase64,
        logoBase64: companySettings.logoBase64,
        companyName: companySettings.name,
        companyPhone: companySettings.phone,
        companyTagline: companySettings.tagline,
        priceMode: proposalPriceMode,
        totalPrice: estimateMode === 'turnkey_118' ? turnkey118Result.grandTotal : projectEstimate.grandTotal,
        stages: turnkey118Result.stages.map(s => ({ stageName: s.stageName, total: s.total }))
      });
      setShowProposalModal(false);
      setExportSuccessMessage('✅ Коммерческое предложение (КП) в PDF успешно сформировано!');
      setTimeout(() => setExportSuccessMessage(null), 4000);
    } catch (e) {
      console.error('Ошибка генерации КП:', e);
      alert('Произошла ошибка при генерации КП');
    } finally {
      setIsExporting(false);
    }
  };

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('ru-RU').format(Math.round(val));
  };

  return (
    <div className={`flex flex-col h-full bg-white text-slate-800 select-none overflow-hidden relative ${className}`}>
      {/* 1. ВЕРХНИЙ ХЕДЕР СМЕТЫ (СВЕТЛЫЙ) */}
      <div className="p-3.5 bg-slate-50 text-slate-800 border-b border-slate-200 shrink-0 shadow-2xs">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600 rounded-lg text-white shadow-2xs">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-tight text-slate-900 flex items-center gap-1.5">
                <span>Смета по комнатам</span>
                <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded border border-blue-200">
                  Краснодар 2026
                </span>
              </h2>
              <p className="text-[11px] text-slate-500">
                {rooms.length} {rooms.length === 1 ? 'помещение' : (rooms.length > 4 ? 'помещений' : 'помещения')} • S пола: {projectEstimate.totalFloorArea} м²
              </p>
            </div>
          </div>

          {onClose && (
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-200 text-xs cursor-pointer transition-colors"
              title="Свернуть смету"
            >
              ✕
            </button>
          )}
        </div>

        {/* ОБЩАЯ СУММА И КНОПКА ЭКСПОРТА */}
        <div className="bg-white rounded-xl p-2.5 border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                ИТОГО СМЕТА:
              </div>
              <div className="text-lg font-black font-mono text-emerald-600 tracking-tight leading-tight">
                {formatPrice(estimateMode === 'turnkey_118' ? turnkey118Result.grandTotal : projectEstimate.grandTotal)} ₽
              </div>
              <div className="text-[10px] text-slate-600 space-x-2 font-mono">
                {estimateMode === 'turnkey_118' ? (
                  <>
                    <span title="Рассчитано из геометрии чертежа">📐 CAD: <b>{formatPrice(turnkey118Result.geometryTotal)} ₽</b></span>
                    <span>•</span>
                    <span title="Штучные работы чек-листа">📌 Чек-лист: <b>{formatPrice(turnkey118Result.constantsTotal)} ₽</b></span>
                  </>
                ) : (
                  <>
                    <span>Раб: <b>{formatPrice(projectEstimate.totalWorksPrice)} ₽</b></span>
                    <span>•</span>
                    <span>Мат: <b>{formatPrice(projectEstimate.totalMaterialsPrice)} ₽</b></span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowProposalModal(true)}
                className="px-2.5 py-2 rounded-xl font-bold text-xs bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer"
                title="Сформировать фирменное Коммерческое Предложение для Заказчика (PDF)"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>КП Заказчику</span>
              </button>

              <button
                onClick={() => setShowExportModal(true)}
                disabled={isExporting || (rooms.length === 0 && estimateMode === 'by_rooms')}
                className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                  exportSuccessMessage 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                } cursor-pointer`}
                title="Экспорт в Excel / PDF"
              >
                {exportSuccessMessage ? (
                  <>
                    <Check className="w-4 h-4 text-white animate-bounce" />
                    <span>Готово!</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4 text-white" />
                    <span>Экспорт</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Быстрая загрузка прайс-базы */}
          <div className="flex items-center justify-end pt-1.5 border-t border-slate-100">
            {onOpenConstructor && (
              <button
                onClick={onOpenConstructor}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 px-2 py-1 rounded hover:bg-slate-100 flex items-center gap-1 transition-colors cursor-pointer"
                title="Конструктор базы расценок"
              >
                <Layers className="w-3 h-3 text-slate-400" />
                <span>Прайс-база</span>
              </button>
            )}
          </div>
        </div>

        {/* ПЕРЕКЛЮЧАТЕЛЬ РЕЖИМА СМЕТЫ */}
        <div className="flex bg-slate-200/70 p-1 rounded-xl gap-1 mt-2">
          <button
            onClick={() => setEstimateMode('turnkey_118')}
            className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              estimateMode === 'turnkey_118'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3 h-3 text-emerald-600" />
            <span>Сводная смета (118)</span>
          </button>
          <button
            onClick={() => setEstimateMode('by_rooms')}
            className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              estimateMode === 'by_rooms'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3 h-3 text-blue-600" />
            <span>По комнатам</span>
          </button>
        </div>

        {/* УВЕДОМЛЕНИЕ ОБ УСПЕШНОМ ЭКСПОРТЕ */}
        {exportSuccessMessage && (
          <div className="mt-2 p-1.5 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 text-[11px] flex items-center gap-1.5 animate-in fade-in">
            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{exportSuccessMessage}</span>
          </div>
        )}
      </div>

      {/* 2. СПИСОК ПОМЕЩЕНИЙ ИЛИ ЭТАЛОННАЯ СМЕТА 118 СТРОК (ОСНОВНАЯ ЧАСТЬ) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-100/70">
        {estimateMode === 'turnkey_118' ? (
          <div className="space-y-3">
            {/* Карточка чек-листа констант объекта */}
            <div className="bg-white rounded-xl border border-amber-300 shadow-xs overflow-hidden transition-all">
              <div 
                onClick={() => setIsChecklistExpanded(!isChecklistExpanded)}
                className="p-3 cursor-pointer flex items-center justify-between gap-2 bg-gradient-to-r from-amber-50 to-orange-50/50 border-b border-amber-200"
              >
                <div className="flex items-center gap-2">
                  <ListTodo className="w-4 h-4 text-amber-600" />
                  <div>
                    <div className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
                      <span>Чек-лист констант объекта (штучные работы)</span>
                      <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-bold">
                        {formatPrice(turnkey118Result.constantsTotal)} ₽
                      </span>
                    </div>
                    <div className="text-[10px] text-amber-800">
                      Точки электрики, сантехники, короба, двери, клининг (не зависят от стен)
                    </div>
                  </div>
                </div>
                <button className="text-amber-700 p-0.5">
                  {isChecklistExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              </div>

              {isChecklistExpanded && (
                <div className="p-3 space-y-3 text-xs bg-amber-50/20">
                  <div className="p-2 bg-amber-100/60 border border-amber-300/80 rounded-lg text-[11px] text-amber-900 flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <b>Принцип разделения сметы:</b>
                      <div className="mt-0.5 text-[10px] text-amber-800 space-y-0.5">
                        <div>• <b>Геометрия CAD ({formatPrice(turnkey118Result.geometryTotal)} ₽):</b> площади пола, стен, откосов окон, плинтусов и потолков рассчитываются строго по чертежу.</div>
                        <div>• <b>Константы ({formatPrice(turnkey118Result.constantsTotal)} ₽):</b> штучные объемы с замера. Вы можете изменить любое число ниже под конкретную квартиру.</div>
                      </div>
                    </div>
                  </div>

                  {/* Сетка редактирования констант */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 bg-white rounded-lg border border-slate-200 space-y-1">
                      <span className="text-[10px] text-slate-500 font-bold block">1. Сантехника</span>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-700">Точки ГВС/ХВС (2200 ₽):</span>
                        <input 
                          type="number" 
                          value={checklistConstants.plumbingHotColdPoints} 
                          onChange={e => setChecklistConstants({ ...checklistConstants, plumbingHotColdPoints: Number(e.target.value) })}
                          className="w-12 px-1 py-0.5 border rounded text-right font-mono font-bold"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-700">Точки канализации КС (1800 ₽):</span>
                        <input 
                          type="number" 
                          value={checklistConstants.plumbingSewerPoints} 
                          onChange={e => setChecklistConstants({ ...checklistConstants, plumbingSewerPoints: Number(e.target.value) })}
                          className="w-12 px-1 py-0.5 border rounded text-right font-mono font-bold"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-700">Инсталляция унитаза (4500 ₽):</span>
                        <input 
                          type="number" 
                          value={checklistConstants.plumbingToiletInstallation} 
                          onChange={e => setChecklistConstants({ ...checklistConstants, plumbingToiletInstallation: Number(e.target.value) })}
                          className="w-12 px-1 py-0.5 border rounded text-right font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="p-2 bg-white rounded-lg border border-slate-200 space-y-1">
                      <span className="text-[10px] text-slate-500 font-bold block">2. Электрика</span>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-700">Черновые точки с гофрой (1700 ₽):</span>
                        <input 
                          type="number" 
                          value={checklistConstants.electricRoughPoints} 
                          onChange={e => setChecklistConstants({ ...checklistConstants, electricRoughPoints: Number(e.target.value) })}
                          className="w-12 px-1 py-0.5 border rounded text-right font-mono font-bold"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-700">Чистовая электрика (400 ₽):</span>
                        <input 
                          type="number" 
                          value={checklistConstants.electricFinishPoints} 
                          onChange={e => setChecklistConstants({ ...checklistConstants, electricFinishPoints: Number(e.target.value) })}
                          className="w-12 px-1 py-0.5 border rounded text-right font-mono font-bold"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-700">Светильники GX53 (700 ₽):</span>
                        <input 
                          type="number" 
                          value={checklistConstants.ceilingLampsGX53Count} 
                          onChange={e => setChecklistConstants({ ...checklistConstants, ceilingLampsGX53Count: Number(e.target.value) })}
                          className="w-12 px-1 py-0.5 border rounded text-right font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="p-2 bg-white rounded-lg border border-slate-200 space-y-1">
                      <span className="text-[10px] text-slate-500 font-bold block">3. Монтаж и ГКЛ</span>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-700">Душевой поддон 800х1500:</span>
                        <input 
                          type="number" 
                          value={checklistConstants.bathShowerTrayPoddon} 
                          onChange={e => setChecklistConstants({ ...checklistConstants, bathShowerTrayPoddon: Number(e.target.value) })}
                          className="w-12 px-1 py-0.5 border rounded text-right font-mono font-bold"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-700">Опуск проемов ГКЛ (750 ₽):</span>
                        <input 
                          type="number" 
                          value={checklistConstants.corridorDoorTransomGyp} 
                          onChange={e => setChecklistConstants({ ...checklistConstants, corridorDoorTransomGyp: Number(e.target.value) })}
                          className="w-12 px-1 py-0.5 border rounded text-right font-mono font-bold"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-700">Ниши ГКЛ кухня/туалет (м):</span>
                        <input 
                          type="number" 
                          step="0.01"
                          value={checklistConstants.kitchenGypNicheM} 
                          onChange={e => setChecklistConstants({ ...checklistConstants, kitchenGypNicheM: Number(e.target.value), toiletGypNicheM: Number(e.target.value) })}
                          className="w-12 px-1 py-0.5 border rounded text-right font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="p-2 bg-white rounded-lg border border-slate-200 space-y-1">
                      <span className="text-[10px] text-slate-500 font-bold block">4. Двери, мусор, сервис</span>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-700">Двери межкомнатные (5500 ₽):</span>
                        <input 
                          type="number" 
                          value={checklistConstants.interiorDoorsCount} 
                          onChange={e => setChecklistConstants({ ...checklistConstants, interiorDoorsCount: Number(e.target.value) })}
                          className="w-12 px-1 py-0.5 border rounded text-right font-mono font-bold"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-700">Вывоз мусора Газель (8000 ₽):</span>
                        <input 
                          type="number" 
                          value={checklistConstants.garbageRemovalTrips} 
                          onChange={e => setChecklistConstants({ ...checklistConstants, garbageRemovalTrips: Number(e.target.value) })}
                          className="w-12 px-1 py-0.5 border rounded text-right font-mono font-bold"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-700">Клининг после ремонта:</span>
                        <input 
                          type="number" 
                          value={checklistConstants.cleaningAfterRenovation} 
                          onChange={e => setChecklistConstants({ ...checklistConstants, cleaningAfterRenovation: Number(e.target.value) })}
                          className="w-12 px-1 py-0.5 border rounded text-right font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 12 Этапов сводной сметы */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider px-1">
                Разделы работ сводной сметы (118 позиций):
              </div>
              {turnkey118Result.stages.map((stage, sIdx) => {
                const isStageOpen = expandedCats[`stage_${sIdx}`] !== false;
                return (
                  <div key={stage.stageName} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                    <div 
                      onClick={() => setExpandedCats({ ...expandedCats, [`stage_${sIdx}`]: !isStageOpen })}
                      className="p-2.5 bg-slate-50 hover:bg-slate-100 cursor-pointer flex justify-between items-center transition-colors border-b border-slate-100"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">
                          #{sIdx + 1} {stage.stageName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({stage.rows.length} поз.)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-900">
                          {formatPrice(stage.total)} ₽
                        </span>
                        {isStageOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                      </div>
                    </div>

                    {isStageOpen && (
                      <div className="divide-y divide-slate-100 text-[11px]">
                        {stage.rows.map(r => (
                          <div key={r.id} className="p-2 hover:bg-slate-50/80 flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                                  r.isConstant ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {r.isConstant ? '📌 Чек-лист' : '📐 CAD'}
                                </span>
                                <span className="font-semibold text-slate-800 truncate" title={r.name}>
                                  {r.name}
                                </span>
                              </div>
                              {r.subCategory && (
                                <span className="text-[10px] text-slate-400 block pl-1">
                                  ▸ {r.subCategory}
                                </span>
                              )}
                            </div>
                            <div className="text-right shrink-0 font-mono text-[11px]">
                              <span className="text-slate-500 font-normal">{r.quantity} {r.unit} × {formatPrice(r.unitPrice)}</span>
                              <span className="font-bold text-slate-900 block">{formatPrice(r.total)} ₽</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* РЕЖИМ ПО КОМНАТАМ */
          rooms.length === 0 ? (
            <div className="p-6 bg-white rounded-2xl border border-dashed border-slate-300 text-center space-y-2 mt-4">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="font-bold text-sm text-slate-700">Нет начерченных комнат</div>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Начертите стены замкнутой комнаты на плане — помещение автоматически появится в смете со всеми площадями и периметром.
              </p>
            </div>
          ) : (
          projectEstimate.rooms.map((roomEst, roomIdx) => {
            const isRoomExpanded = !!expandedRooms[roomEst.roomId];
            const roomSel = selections[roomEst.roomId] || {
              roomId: roomEst.roomId,
              selectedPirogIds: {},
              overridePrices: {},
              customWorks: [],
              customMaterials: []
            };

            return (
              <div 
                key={roomEst.roomId}
                className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden transition-all"
              >
                {/* ЗАГОЛОВОК АККОРДЕОНА КОМНАТЫ */}
                <div 
                  onClick={() => toggleRoomAccordion(roomEst.roomId)}
                  className={`p-3 cursor-pointer flex items-center justify-between gap-2 border-b transition-colors ${
                    isRoomExpanded ? 'bg-blue-50/60 border-blue-200' : 'bg-white hover:bg-slate-50 border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button className="text-slate-400 hover:text-blue-600 transition-colors p-0.5">
                      {isRoomExpanded ? (
                        <ChevronDown className="w-4 h-4 text-blue-600" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {roomEst.roomName}
                        </span>
                        <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded">
                          #{roomIdx + 1}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                        <span>Пол: <b>{roomEst.floorArea} м²</b></span>
                        <span>•</span>
                        <span>Стены: <b>{roomEst.wallNetArea} м²</b></span>
                        <span>•</span>
                        <span>P: <b>{roomEst.perimeter} м</b></span>
                        {roomEst.doorsCount > 0 && <span>• Дв: {roomEst.doorsCount}</span>}
                        {roomEst.windowsCount > 0 && <span>• Ок: {roomEst.windowsCount}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Итого по комнате */}
                  <div className="text-right shrink-0">
                    <div className="font-black font-mono text-xs text-blue-900">
                      {formatPrice(roomEst.grandTotal)} ₽
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono">
                      раб {formatPrice(roomEst.worksTotal)} | мат {formatPrice(roomEst.materialsTotal)}
                    </div>
                  </div>
                </div>

                {/* ВНУТРЕННОСТЬ АККОРДЕОНА: ПОДРАЗДЕЛЫ (ПОТОЛОК, СТЕНЫ, ПОЛ...) */}
                {isRoomExpanded && (
                  <div className="p-3 space-y-3 bg-slate-50/50">
                    {/* Список категорий с выпадающим списком пирогов */}
                    <div className="space-y-2">
                      {PIROG_CATEGORIES.map(cat => {
                        const currentPirogId = roomSel.selectedPirogIds[cat.id] || null;
                        const availablePirogs = effectivePirogs.filter(p => p.category === cat.id);
                        const isCatOpen = !!expandedCats[`${roomEst.roomId}_${cat.id}`];
                        const activePirog = availablePirogs.find(p => p.id === currentPirogId);

                        return (
                          <div 
                            key={cat.id} 
                            className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden"
                          >
                            {/* Строка выбора категории */}
                            <div className="p-2 flex items-center justify-between gap-2 bg-slate-50/80">
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-sm">{cat.icon}</span>
                                <span className="text-xs font-bold text-slate-800">{cat.name}:</span>
                              </div>

                              {/* ВЫПАДАЮЩИЙ СПИСОК ПИРОГОВ */}
                              <div className="flex-1 max-w-[240px]">
                                <select
                                  value={currentPirogId || 'none'}
                                  onChange={(e) => handlePirogChange(roomEst.roomId, cat.id, e.target.value)}
                                  className="w-full text-[11px] font-medium px-2 py-1 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 truncate"
                                >
                                  <option value="none">— Без отделки / Пропустить —</option>
                                  {availablePirogs.map(p => (
                                    <option key={p.id} value={p.id}>
                                      {p.name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Кнопка раскрытия состава пирога */}
                              {activePirog && (
                                <button
                                  onClick={() => toggleCategoryAccordion(roomEst.roomId, cat.id)}
                                  className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-0.5 shrink-0 px-1 py-0.5 rounded hover:bg-blue-50 cursor-pointer"
                                  title="Показать состав работ и материалов"
                                >
                                  <span>{isCatOpen ? 'Скрыть' : 'Состав'}</span>
                                  {isCatOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                </button>
                              )}
                            </div>

                            {/* РАСКРЫВАЮЩИЙСЯ СОСТАВ ПИРОГА (РАБОТЫ + МАТЕРИАЛЫ С ЦЕНАМИ) */}
                            {isCatOpen && activePirog && (
                              <div className="p-2.5 border-t border-slate-100 bg-white text-[11px] space-y-2.5">
                                <div className="text-[10px] text-slate-500 italic pb-1 border-b border-slate-100">
                                  {activePirog.description}
                                </div>

                                {/* Список работ пирога */}
                                <div className="space-y-1">
                                  <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                                    <Hammer className="w-3 h-3 text-blue-600" />
                                    <span>Работы по подразделу:</span>
                                  </div>
                                  <div className="space-y-1">
                                    {activePirog.works.map(w => {
                                      const row = roomEst.works.find(item => item.workTemplateId === w.id);
                                      const currentPrice = roomSel.overridePrices[w.id] !== undefined 
                                        ? roomSel.overridePrices[w.id] 
                                        : w.defaultUnitPrice;

                                      return (
                                        <div key={w.id} className="flex items-center justify-between gap-1 p-1 bg-slate-50 rounded border border-slate-200/60 text-slate-700">
                                          <div className="min-w-0 flex-1">
                                            <div className="truncate text-slate-800 font-medium" title={w.name}>
                                              {w.name}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-mono">
                                              Объем: <b>{row ? row.quantity : '—'} {w.unit}</b>
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-1 shrink-0">
                                            <div className="flex items-center gap-0.5">
                                              <input
                                                type="number"
                                                value={currentPrice}
                                                onChange={(e) => handlePriceChange(roomEst.roomId, w.id, e.target.value)}
                                                className="w-16 px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold text-right text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                                title="Нажмите для изменения цены за единицу"
                                              />
                                              <span className="text-[10px] text-slate-400">₽</span>
                                            </div>
                                            <div className="w-16 text-right font-mono font-bold text-blue-800 text-xs">
                                              {row ? formatPrice(row.total) : '0'} ₽
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Список материалов пирога */}
                                <div className="space-y-1 pt-1 border-t border-slate-100">
                                  <div className="text-[10px] uppercase font-bold text-amber-600 flex items-center gap-1">
                                    <Package className="w-3 h-3 text-amber-600" />
                                    <span>Черновые материалы:</span>
                                  </div>
                                  <div className="space-y-1">
                                    {activePirog.materials.map(m => {
                                      const row = roomEst.materials.find(item => item.materialTemplateId === m.id);
                                      const currentPrice = roomSel.overridePrices[m.id] !== undefined 
                                        ? roomSel.overridePrices[m.id] 
                                        : m.defaultUnitPrice;

                                      return (
                                        <div key={m.id} className="flex items-center justify-between gap-1 p-1 bg-amber-50/40 rounded border border-amber-200/50 text-slate-700">
                                          <div className="min-w-0 flex-1">
                                            <div className="truncate text-slate-800 font-medium" title={m.name}>
                                              {m.name}
                                            </div>
                                            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 flex-wrap">
                                              <span>Объём: <b>{row ? row.quantity : '—'} {row?.unit || 'м²'}</b></span>
                                              {row?.physicalQuantity ? (
                                                <span className="text-amber-800 bg-amber-100/70 px-1 rounded text-[9.5px]" title={m.packageType ? `Фасовка: ${m.packageType}` : undefined}>
                                                  расход: ~<b>{row.physicalQuantity} {row.physicalUnit || m.unit}</b>
                                                </span>
                                              ) : null}
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-1 shrink-0">
                                            <div className="flex items-center gap-0.5">
                                              <input
                                                type="number"
                                                value={currentPrice}
                                                onChange={(e) => handlePriceChange(roomEst.roomId, m.id, e.target.value)}
                                                className="w-16 px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold text-right text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                                title="Нажмите для изменения цены за единицу"
                                              />
                                              <span className="text-[10px] text-slate-400">₽</span>
                                            </div>
                                            <div className="w-16 text-right font-mono font-bold text-amber-900 text-xs">
                                              {row ? formatPrice(row.total) : '0'} ₽
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* ДОПОЛНИТЕЛЬНЫЕ РУЧНЫЕ ПОЗИЦИИ */}
                    {(roomSel.customWorks.length > 0 || roomSel.customMaterials.length > 0) && (
                      <div className="p-2 bg-indigo-50/60 rounded-lg border border-indigo-200 text-xs space-y-1.5">
                        <div className="text-[10px] uppercase font-bold text-indigo-900">
                          Дополнительные ручные позиции:
                        </div>
                        {roomSel.customWorks.map(w => (
                          <div key={w.id} className="flex items-center justify-between bg-white p-1 rounded border border-indigo-100 font-mono text-[11px]">
                            <span className="text-slate-800 truncate">{w.name} ({w.quantity} {w.unit})</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-indigo-900">{formatPrice(w.total)} ₽</span>
                              <button 
                                onClick={() => handleDeleteCustomRow(roomEst.roomId, 'work', w.id)}
                                className="text-rose-500 hover:text-rose-700 cursor-pointer"
                                title="Удалить"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                        {roomSel.customMaterials.map(m => (
                          <div key={m.id} className="flex items-center justify-between bg-white p-1 rounded border border-indigo-100 font-mono text-[11px]">
                            <span className="text-slate-800 truncate">{m.name} ({m.quantity} {m.unit})</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-indigo-900">{formatPrice(m.total)} ₽</span>
                              <button 
                                onClick={() => handleDeleteCustomRow(roomEst.roomId, 'material', m.id)}
                                className="text-rose-500 hover:text-rose-700 cursor-pointer"
                                title="Удалить"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* КНОПКИ: ДОБАВИТЬ РАБОТУ / МАТЕРИАЛ И СБРОС ЦЕН */}
                    <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setAddingRowToRoom({ roomId: roomEst.roomId, type: 'work' })}
                          className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded text-[11px] font-semibold text-slate-700 flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <Plus className="w-3 h-3 text-blue-600" />
                          <span>+ Своя работа</span>
                        </button>
                        <button
                          onClick={() => setAddingRowToRoom({ roomId: roomEst.roomId, type: 'material' })}
                          className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded text-[11px] font-semibold text-slate-700 flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <Plus className="w-3 h-3 text-amber-600" />
                          <span>+ Свой материал</span>
                        </button>
                      </div>

                      {Object.keys(roomSel.overridePrices).length > 0 && (
                        <button
                          onClick={() => handleResetRoomPrices(roomEst.roomId)}
                          className="text-[10px] text-slate-500 hover:text-rose-600 flex items-center gap-0.5 cursor-pointer"
                          title="Сбросить все измененные цены к стандартным по Краснодару"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Сбросить цены</span>
                        </button>
                      )}
                    </div>

                    {/* ФОРМА ДОБАВЛЕНИЯ СВОЕЙ ПОЗИЦИИ С ПОИСКОМ ПО ПРАЙСУ КРД */}
                    {addingRowToRoom && addingRowToRoom.roomId === roomEst.roomId && (
                      <div className="p-2.5 bg-blue-50/90 rounded-lg border border-blue-200 space-y-2 text-xs animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-blue-950 text-[11px]">
                            Добавить {addingRowToRoom.type === 'work' ? 'работу' : 'материал'} в помещение:
                          </div>
                          {addingRowToRoom.type === 'work' && (
                            <span className="text-[10px] text-blue-600 bg-blue-100/80 px-1.5 py-0.2 rounded font-medium">
                              Прайс Краснодара (459 поз.)
                            </span>
                          )}
                        </div>

                        {/* Поиск по каталогу 459 работ Краснодара */}
                        {addingRowToRoom.type === 'work' && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-blue-300 rounded-md shadow-2xs">
                              <Search className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              <input
                                type="text"
                                value={catalogSearchQuery}
                                onChange={(e) => setCatalogSearchQuery(e.target.value)}
                                placeholder="Быстрый поиск по 459 работам КРД (напр: стяжка, шпаклёвка, плинтус)..."
                                className="w-full text-xs text-slate-800 outline-none"
                              />
                              {catalogSearchQuery && (
                                <button 
                                  onClick={() => setCatalogSearchQuery('')} 
                                  className="text-slate-400 hover:text-slate-700 text-xs px-1 cursor-pointer"
                                >
                                  ✕
                                </button>
                              )}
                            </div>

                            {/* Выпадающий список совпадений */}
                            {filteredCatalog.length > 0 && (
                              <div className="max-h-48 overflow-y-auto bg-white border border-blue-200 rounded-md shadow-lg p-1 divide-y divide-slate-100">
                                <div className="text-[9px] text-slate-400 px-1 py-0.5 font-bold uppercase">
                                  Найдено {filteredCatalog.length} поз. (кликните для авто-заполнения):
                                </div>
                                {filteredCatalog.map(item => (
                                  <button
                                    key={item.code}
                                    type="button"
                                    onClick={() => {
                                      setNewRowName(item.name);
                                      setNewRowUnit(item.unit || 'м²');
                                      const scaledPrice = Math.round(item.price * regionalCoeff);
                                      setNewRowPrice(scaledPrice.toString());
                                      setCatalogSearchQuery('');
                                    }}
                                    className="w-full text-left p-1.5 hover:bg-blue-50 rounded flex items-center justify-between gap-1 text-[11px] cursor-pointer transition-colors"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <span className="text-blue-600 font-mono font-bold text-[10px] mr-1">[{item.code}]</span>
                                      <span className="text-slate-800 font-medium">{item.name}</span>
                                      <div className="text-[9px] text-slate-400">{item.section}</div>
                                    </div>
                                    <div className="shrink-0 text-right font-mono font-bold text-blue-700">
                                      {Math.round(item.price * regionalCoeff)} ₽/{item.unit}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        <input
                          type="text"
                          value={newRowName}
                          onChange={(e) => setNewRowName(e.target.value)}
                          placeholder="Наименование (напр: Монтаж скрытого плинтуса)"
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <div className="grid grid-cols-3 gap-1.5">
                          <div>
                            <label className="text-[10px] text-slate-500 block">Ед. изм:</label>
                            <input
                              type="text"
                              value={newRowUnit}
                              onChange={(e) => setNewRowUnit(e.target.value)}
                              className="w-full px-1.5 py-0.5 bg-white border border-slate-300 rounded text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 block">Кол-во:</label>
                            <input
                              type="number"
                              value={newRowQty}
                              onChange={(e) => setNewRowQty(e.target.value)}
                              className="w-full px-1.5 py-0.5 bg-white border border-slate-300 rounded text-xs font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 block">Цена, ₽:</label>
                            <input
                              type="number"
                              value={newRowPrice}
                              onChange={(e) => setNewRowPrice(e.target.value)}
                              className="w-full px-1.5 py-0.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-1.5 pt-1">
                          <button
                            onClick={() => {
                              setAddingRowToRoom(null);
                              setCatalogSearchQuery('');
                            }}
                            className="px-2 py-1 text-slate-600 hover:bg-slate-200 rounded text-xs cursor-pointer"
                          >
                            Отмена
                          </button>
                          <button
                            onClick={() => handleAddCustomRow(roomEst.roomId)}
                            className="px-3 py-1 bg-blue-600 text-white font-bold rounded text-xs hover:bg-blue-700 shadow-2xs cursor-pointer"
                          >
                            Добавить в смету
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ))}
      </div>

      {/* 3. ПОДВАЛ ПАНЕЛИ СМЕТЫ */}
      <div className="p-3 bg-white border-t border-slate-200 shrink-0 text-xs space-y-2">
        <div className="flex items-center justify-between text-slate-600">
          <span className="font-medium">
            {estimateMode === 'turnkey_118' ? 'Итого под ключ (Краснодар):' : 'Сводная стоимость объекта:'}
          </span>
          <span className="font-mono font-bold text-slate-900 text-sm">
            {formatPrice(estimateMode === 'turnkey_118' ? turnkey118Result.grandTotal : projectEstimate.grandTotal)} ₽
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setShowProposalModal(true)}
            disabled={isExporting}
            className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
            title="Сформировать фирменное Коммерческое Предложение для Заказчика (PDF)"
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>КП Заказчику</span>
          </button>

          <button
            onClick={() => setShowExportModal(true)}
            disabled={isExporting || (rooms.length === 0 && estimateMode === 'by_rooms')}
            className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
            title="Экспорт детальной сметы в Excel или PDF"
          >
            <FileDown className="w-4 h-4 shrink-0" />
            <span>Смета (Excel/PDF)</span>
          </button>
        </div>
      </div>

      {/* 4. МОДАЛЬНОЕ ОКНО ПАРАМЕТРОВ ЭКСПОРТА СМЕТЫ (EXCEL / PDF, БЕЗ ЦЕН, ОБМЕРОЧНЫЙ ПЛАН) */}
      {showExportModal && createPortal(
        <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 text-slate-800">
            {/* Шапка модалки */}
            <div className="px-5 py-3.5 bg-slate-100 text-slate-800 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileDown className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Параметры экспорта сметы</h3>
                  <p className="text-[11px] text-slate-500">Выбор разделов (Работы ⇄ Материалы) и форматов</p>
                </div>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Тело модалки с чекбоксами */}
            <div className="p-5 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
              {/* РАЗДЕЛ 1: СОСТАВ СМЕТЫ (РАБОТЫ / МАТЕРИАЛЫ) */}
              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-500 block">
                  1. Состав экспорта (Работы ⇄ Материалы):
                </label>
                
                <div className="space-y-2">
                  <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    (exportOptions.exportScope === 'works' || (!exportOptions.exportScope && !exportOptions.includeMaterials))
                      ? 'bg-emerald-50/80 border-emerald-400 shadow-2xs' 
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}>
                    <input
                      type="radio"
                      name="export_scope"
                      checked={exportOptions.exportScope === 'works' || (!exportOptions.exportScope && !exportOptions.includeMaterials)}
                      onChange={() => setExportOptions({ 
                        ...exportOptions, 
                        exportScope: 'works',
                        includeMaterials: false 
                      })}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <Hammer className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Смета на ремонтно-отделочные работы (Договорная смета)</span>
                        <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.2 rounded font-bold">Сводная смета</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Выгружаются только строительные и отделочные работы по помещениям. Точное соответствие сумме договора без наценки материалов.
                      </div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    exportOptions.exportScope === 'materials'
                      ? 'bg-amber-50/80 border-amber-400 shadow-2xs' 
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}>
                    <input
                      type="radio"
                      name="export_scope"
                      checked={exportOptions.exportScope === 'materials'}
                      onChange={() => setExportOptions({ 
                        ...exportOptions, 
                        exportScope: 'materials',
                        includeMaterials: true 
                      })}
                      className="mt-0.5 text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Ведомость потребности материалов (Для снабжения и закупки)</span>
                        <span className="bg-amber-100 text-amber-900 text-[9px] px-1.5 py-0.2 rounded font-bold">Только материалы</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Спецификация черновых и расходных материалов с нормами расхода (грунтовка, штукатурка, плиточный клей, подложка, мешки).
                      </div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    exportOptions.exportScope === 'both'
                      ? 'bg-blue-50/80 border-blue-400 shadow-2xs' 
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}>
                    <input
                      type="radio"
                      name="export_scope"
                      checked={exportOptions.exportScope === 'both'}
                      onChange={() => setExportOptions({ 
                        ...exportOptions, 
                        exportScope: 'both',
                        includeMaterials: true 
                      })}
                      className="mt-0.5 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Сводная смета (Работы + Черновые материалы)</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Полный строительный расчет объекта: работы с расценками плюс детальная спецификация всех материалов.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* РАЗДЕЛ 2: ФОРМАТЫ ВЫГРУЗКИ */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-500 block">
                  2. Формат файла:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    exportOptions.exportExcel 
                      ? 'bg-emerald-50/80 border-emerald-400 text-emerald-950 font-bold shadow-2xs' 
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}>
                    <input
                      type="checkbox"
                      checked={exportOptions.exportExcel}
                      onChange={(e) => setExportOptions({ ...exportOptions, exportExcel: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Excel (.xlsx)</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal">С формулами и стилями</div>
                    </div>
                  </label>

                  <label className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    exportOptions.exportPdf 
                      ? 'bg-blue-50/80 border-blue-400 text-blue-950 font-bold shadow-2xs' 
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}>
                    <input
                      type="checkbox"
                      checked={exportOptions.exportPdf}
                      onChange={(e) => setExportOptions({ ...exportOptions, exportPdf: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>PDF (.pdf)</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal">Готовый для печати</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* РАЗДЕЛ 3: ЦЕНЫ И СУММЫ */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-500 block">
                  3. Ценообразование:
                </label>
                
                <div className="space-y-1.5">
                  <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    !exportOptions.hidePrices 
                      ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs' 
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}>
                    <input
                      type="radio"
                      name="pricing_mode"
                      checked={!exportOptions.hidePrices}
                      onChange={() => setExportOptions({ ...exportOptions, hidePrices: false })}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div>
                      <div className="font-bold text-slate-800 text-xs">
                        С ценами и суммами (Договорная смета)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Отображает расценки по Краснодару, суммы по каждой позиции и итоговую стоимость ремонта под ключ.
                      </div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    exportOptions.hidePrices 
                      ? 'bg-amber-50/70 border-amber-300 shadow-2xs' 
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}>
                    <input
                      type="radio"
                      name="pricing_mode"
                      checked={exportOptions.hidePrices}
                      onChange={() => setExportOptions({ ...exportOptions, hidePrices: true })}
                      className="mt-0.5 text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                    <div>
                      <div className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                        <span>Без цен — только объёмы (Ведомость для заказчика)</span>
                        <span className="bg-amber-200 text-amber-900 text-[9px] px-1.5 py-0.2 rounded font-bold">Для клиента</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Скрывает колонки цен и сумм. Заказчик видит только наименования работ, единицы измерения и рассчитанные из плана объемы.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* РАЗДЕЛ 4: ВЛОЖЕНИЯ */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-500 block">
                  4. Вложения:
                </label>

                <div>
                  <label className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exportOptions.includePlanImage}
                      onChange={(e) => setExportOptions({ ...exportOptions, includePlanImage: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-blue-600 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-800">Прикрепить 2D обмерочный план</span>
                        <span className="text-[10px] text-slate-400 block">
                          Вставляет в смету графический снимок текущего чертежа с размерами комнат и стен
                        </span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Подвал модалки */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Отмена
              </button>

              <button
                onClick={handleExecuteExport}
                disabled={isExporting || (!exportOptions.exportExcel && !exportOptions.exportPdf)}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isExporting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Формирование файлов...</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4" />
                    <span>Скачать смету ({[exportOptions.exportExcel ? 'Excel' : '', exportOptions.exportPdf ? 'PDF' : ''].filter(Boolean).join(' + ')})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 5. МОДАЛЬНОЕ ОКНО КОММЕРЧЕСКОГО ПРЕДЛОЖЕНИЯ (КП) ДЛЯ ЗАКАЗЧИКА В PDF */}
      {showProposalModal && createPortal(
        <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 text-slate-800">
            {/* Шапка модалки */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-xs">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Коммерческое предложение (КП) в PDF</h3>
                  <p className="text-[11px] text-blue-200">Фирменный бланк с 2D планом и итоговой стоимостью</p>
                </div>
              </div>
              <button
                onClick={() => setShowProposalModal(false)}
                className="text-white/70 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Тело модалки */}
            <div className="p-5 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
              {/* РАЗДЕЛ 1: РЕКВИЗИТЫ КОМПАНИИ И ЛОГОТИП */}
              <div className="space-y-2.5">
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-500 block">
                  1. Реквизиты вашей компании (сохраняются автоматически):
                </label>

                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Название компании:</label>
                    <input
                      type="text"
                      value={companySettings.name}
                      onChange={(e) => setCompanySettings({ ...companySettings, name: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Строительная компания «КРАСНОДАР РЕМОНТ»"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Телефон для связи:</label>
                      <input
                        type="text"
                        value={companySettings.phone}
                        onChange={(e) => setCompanySettings({ ...companySettings, phone: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="+7 (918) 123-45-67"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Подпись / слоган:</label>
                      <input
                        type="text"
                        value={companySettings.tagline}
                        onChange={(e) => setCompanySettings({ ...companySettings, tagline: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Ремонт и отделка квартир под ключ"
                      />
                    </div>
                  </div>

                  {/* Загрузка логотипа */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {companySettings.logoBase64 ? (
                          <img
                            src={companySettings.logoBase64}
                            alt="Логотип"
                            className="w-10 h-10 object-contain rounded-lg border border-slate-200 bg-white p-0.5 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg border border-dashed border-slate-300 bg-white flex items-center justify-center shrink-0 text-slate-400">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="font-bold text-slate-800 block text-xs">
                            {companySettings.logoBase64 ? 'Логотип загружен' : 'Логотип компании (PNG, JPG)'}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {companySettings.logoBase64 ? 'Отобразится в верхнем левом углу КП' : 'Не обязательно — при отсутствии будет текстовая плашка'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <label className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-[11px] font-semibold text-slate-700 cursor-pointer flex items-center gap-1 transition-colors">
                          <Upload className="w-3.5 h-3.5 text-blue-600" />
                          <span>{companySettings.logoBase64 ? 'Заменить' : 'Загрузить'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                const base64 = ev.target?.result as string;
                                if (base64) {
                                  setCompanySettings({ ...companySettings, logoBase64: base64 });
                                }
                              };
                              reader.readAsDataURL(file);
                            }}
                          />
                        </label>
                        {companySettings.logoBase64 && (
                          <button
                            type="button"
                            onClick={() => setCompanySettings({ ...companySettings, logoBase64: null })}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Удалить логотип"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* РАЗДЕЛ 2: РЕЖИМ СТОИМОСТИ В КП (КЛЮЧЕВАЯ ЗАДАЧА) */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="text-[11px] uppercase tracking-wider font-bold text-slate-500 block">
                  2. Отображение стоимости для заказчика:
                </label>

                <div className="space-y-2">
                  <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    proposalPriceMode === 'total_only'
                      ? 'bg-blue-50/80 border-blue-400 text-blue-950 shadow-2xs' 
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}>
                    <input
                      type="radio"
                      name="proposal_mode"
                      checked={proposalPriceMode === 'total_only'}
                      onChange={() => setProposalPriceMode('total_only')}
                      className="mt-0.5 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div>
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <span>Только итоговая стоимость объекта (Рекомендуется)</span>
                        <span className="bg-blue-200 text-blue-900 text-[9px] px-1.5 py-0.2 rounded font-bold">Как в ТЗ</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        В документе пишется только общая сумма ремонта под ключ ({formatPrice(estimateMode === 'turnkey_118' ? turnkey118Result.grandTotal : projectEstimate.grandTotal)} ₽), площади помещений и план. Никаких расценок на отдельные работы заказчик не видит.
                      </div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    proposalPriceMode === 'stages'
                      ? 'bg-indigo-50/80 border-indigo-400 text-indigo-950 shadow-2xs' 
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}>
                    <input
                      type="radio"
                      name="proposal_mode"
                      checked={proposalPriceMode === 'stages'}
                      onChange={() => setProposalPriceMode('stages')}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div>
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <span>Сводка по 12 крупным этапам ремонта</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Показывает суммы по ключевым этапам: демонтаж, штукатурка стен, сантехника, электрика, плиточные работы, малярные работы и финишные покрытия.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* РАЗДЕЛ 3: ЧТО ВКЛЮЧЕНО В КП */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-300 rounded-xl space-y-1.5 text-emerald-950">
                <div className="font-bold text-xs flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>В готовый PDF-документ автоматически включаются:</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-emerald-900 pt-0.5 pl-5 list-disc">
                  <div>• 2D обмерочный CAD-план с размерами</div>
                  <div>• Экспликация помещений с площадями</div>
                  <div>• Данные заказчика и точный адрес</div>
                  <div>• Гарантия 24 месяца по договору</div>
                  <div>• Блоки для подписей сторон</div>
                  <div>• Контакты прораба и реквизиты</div>
                </div>
              </div>
            </div>

            {/* Подвал модалки */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                onClick={() => setShowProposalModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Отмена
              </button>

              <button
                onClick={handleGenerateProposal}
                disabled={isExporting}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isExporting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Формирование КП...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>Скачать КП в PDF ({formatPrice(estimateMode === 'turnkey_118' ? turnkey118Result.grandTotal : projectEstimate.grandTotal)} ₽)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
