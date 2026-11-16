import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { PirogDefinition, PirogCategory, WorkTemplate, MaterialTemplate, MultiplierType, PricingTariff } from '../estimate/types';
import { PIROG_CATEGORIES, DEFAULT_PIROGS } from '../estimate/defaultPirogs';
import { KRASNODAR_DETAILED_CATALOG, KRASNODAR_MATERIALS_CATALOG, CatalogWorkItem, CatalogMaterialItem } from '../estimate/krasnodarCatalog';
import { ErrorBoundary } from './ErrorBoundary';
import { 
  X, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Check, 
  Search, 
  Hammer, 
  Package, 
  ChevronRight, 
  ArrowUpDown, 
  Sparkles, 
  Layers, 
  GripVertical,
  Copy,
  Info
} from 'lucide-react';

interface SandwichConstructorModalProps {
  isOpen: boolean;
  onClose: () => void;
  pirogs: PirogDefinition[];
  onSavePirogs: (updated: PirogDefinition[]) => void;
  currentTariff?: PricingTariff;
  regionalCoeff?: number;
}

const sanitizeWork = (w: any, idx: number): WorkTemplate => ({
  id: w?.id || `w_${idx}_${Date.now()}`,
  name: typeof w?.name === 'string' ? w.name : 'Работа',
  unit: typeof w?.unit === 'string' ? w.unit : 'м²',
  defaultUnitPrice: Number(w?.defaultUnitPrice) || 0,
  economPrice: Number(w?.economPrice ?? w?.defaultUnitPrice ?? 0),
  standardPrice: Number(w?.standardPrice ?? w?.defaultUnitPrice ?? 0),
  designPrice: Number(w?.designPrice ?? w?.defaultUnitPrice ?? 0),
  multiplierType: w?.multiplierType || 'floorArea',
  source: typeof w?.source === 'string' ? w.source : ''
});

const sanitizeMaterial = (m: any, idx: number): MaterialTemplate => ({
  id: m?.id || `m_${idx}_${Date.now()}`,
  name: typeof m?.name === 'string' ? m.name : 'Материал',
  unit: typeof m?.unit === 'string' ? m.unit : 'шт',
  defaultUnitPrice: Number(m?.defaultUnitPrice) || 0,
  normPerUnit: Number(m?.normPerUnit) || 1,
  safetyCoeff: Number(m?.safetyCoeff) || 1,
  multiplierType: m?.multiplierType || 'floorArea',
  packageType: typeof m?.packageType === 'string' ? m.packageType : 'Стандарт',
  packagePrice: Number(m?.packagePrice) || 0
});

const sanitizePirog = (p: Partial<PirogDefinition> | null | undefined): PirogDefinition => {
  return {
    id: p?.id || `USER-P-${Date.now().toString().slice(-4)}`,
    name: p?.name || 'Бутерброд',
    category: (p?.category as PirogCategory) || 'walls',
    description: p?.description || '',
    works: Array.isArray(p?.works) ? p.works.filter(Boolean).map(sanitizeWork) : [],
    materials: Array.isArray(p?.materials) ? p.materials.filter(Boolean).map(sanitizeMaterial) : [],
    economPrice: p?.economPrice,
    standardPrice: p?.standardPrice,
    designPrice: p?.designPrice,
    totalWorkPrice: p?.totalWorkPrice,
    totalMaterialPrice: p?.totalMaterialPrice,
  };
};

export const SandwichConstructorModal: React.FC<SandwichConstructorModalProps> = ({
  isOpen,
  onClose,
  pirogs,
  onSavePirogs,
  currentTariff = 'standard',
  regionalCoeff = 1.00
}) => {
  // Список пирогов в локальном состоянии модального окна (гарантированно очищенный и не пустой)
  const initialPirogs = useMemo(() => {
    const list = (Array.isArray(pirogs) && pirogs.length > 0) ? pirogs : DEFAULT_PIROGS;
    return list.map(sanitizePirog);
  }, [pirogs]);

  const [localPirogs, setLocalPirogs] = useState<PirogDefinition[]>(initialPirogs);
  const [selectedPirogId, setSelectedPirogId] = useState<string>(initialPirogs[0]?.id || 'FIN-W-01');

  // Вкладка каталога справа: 'works' (459 работ) или 'materials' (39 материалов)
  const [catalogTab, setCatalogTab] = useState<'works' | 'materials'>('works');
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [workSectionFilter, setWorkSectionFilter] = useState<string>('all');

  // Уведомление об успешном сохранении
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Синхронизация при открытии
  React.useEffect(() => {
    if (isOpen) {
      const sanitized = (Array.isArray(pirogs) && pirogs.length > 0 ? pirogs : DEFAULT_PIROGS).map(sanitizePirog);
      setLocalPirogs(sanitized);
      if (!sanitized.some(p => p.id === selectedPirogId)) {
        setSelectedPirogId(sanitized[0]?.id || 'FIN-W-01');
      }
    }
  }, [isOpen, pirogs]);

  // Выбранный для редактирования бутерброд
  const activePirog = useMemo(() => {
    const found = localPirogs.find(p => p.id === selectedPirogId) || localPirogs[0];
    return found ? sanitizePirog(found) : null;
  }, [localPirogs, selectedPirogId]);

  // Уникальные разделы работ из каталога 459
  const workSections = useMemo(() => {
    const set = new Set<string>();
    KRASNODAR_DETAILED_CATALOG.forEach(w => {
      if (w.section) set.add(w.section);
    });
    return Array.from(set);
  }, []);

  // Фильтрованный каталог работ (459)
  const filteredWorks = useMemo(() => {
    const q = catalogSearch.toLowerCase().trim();
    return KRASNODAR_DETAILED_CATALOG.filter(w => {
      const matchSection = workSectionFilter === 'all' || w.section === workSectionFilter;
      const matchText = !q || w.name.toLowerCase().includes(q) || w.code.toLowerCase().includes(q);
      return matchSection && matchText;
    });
  }, [catalogSearch, workSectionFilter]);

  // Фильтрованный каталог материалов (39)
  const filteredMaterials = useMemo(() => {
    const q = catalogSearch.toLowerCase().trim();
    return KRASNODAR_MATERIALS_CATALOG.filter(m => {
      return !q || m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q);
    });
  }, [catalogSearch]);

  if (!isOpen) return null;

  // Обновление свойств активного пирога
  const updateActivePirog = (updater: (prev: PirogDefinition) => PirogDefinition) => {
    setLocalPirogs(prev => {
      const updated = prev.map(p => {
        if (p.id === activePirog?.id) {
          return updater(p);
        }
        return p;
      });
      onSavePirogs(updated);
      return updated;
    });
  };

  // Удаление работы из пирога
  const handleRemoveWork = (workId: string) => {
    updateActivePirog(p => ({
      ...p,
      works: p.works.filter(w => w.id !== workId)
    }));
    triggerToast('Работа удалена из пирога');
  };

  // Удаление материала из пирога
  const handleRemoveMaterial = (matId: string) => {
    updateActivePirog(p => ({
      ...p,
      materials: p.materials.filter(m => m.id !== matId)
    }));
    triggerToast('Материал удален из пирога');
  };

  // Добавление работы из каталога в активный пирог
  const handleAddWorkFromCatalog = (item: CatalogWorkItem) => {
    if (!activePirog) return;
    const newWork: WorkTemplate = {
      id: `w_custom_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: item.name,
      unit: item.unit,
      defaultUnitPrice: item.price,
      economPrice: Math.round(item.price * 0.8),
      standardPrice: item.price,
      designPrice: Math.round(item.price * 1.35),
      multiplierType: 'floorArea',
      source: item.section
    };

    updateActivePirog(p => ({
      ...p,
      works: [...p.works, newWork]
    }));
    triggerToast(`Добавлена работа: ${item.name}`);
  };

  // Добавление материала из каталога в активный пирог
  const handleAddMaterialFromCatalog = (item: CatalogMaterialItem) => {
    if (!activePirog) return;
    const newMat: MaterialTemplate = {
      id: `m_custom_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: item.name,
      unit: item.unit,
      defaultUnitPrice: item.defaultUnitPrice,
      normPerUnit: item.normPerUnit,
      safetyCoeff: item.safetyCoeff,
      multiplierType: 'floorArea',
      packageType: item.packageType,
      packagePrice: item.packagePrice
    };

    updateActivePirog(p => ({
      ...p,
      materials: [...p.materials, newMat]
    }));
    triggerToast(`Добавлен материал: ${item.name}`);
  };

  // Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnWorks = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) return;
      const data = JSON.parse(dataStr);
      if (data.type === 'work' && data.item) {
        handleAddWorkFromCatalog(data.item);
      }
    } catch {}
  };

  const handleDropOnMaterials = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) return;
      const data = JSON.parse(dataStr);
      if (data.type === 'material' && data.item) {
        handleAddMaterialFromCatalog(data.item);
      }
    } catch {}
  };

  // Создание нового пользовательского бутерброда
  const handleCreateNewPirog = () => {
    const newId = `USER-P-${Date.now().toString().slice(-4)}`;
    const newPirog: PirogDefinition = {
      id: newId,
      name: `Пользовательский бутерброд ${localPirogs.length + 1}`,
      category: activePirog?.category || 'walls',
      description: 'Собран вручную в интерактивном конструкторе',
      works: [],
      materials: []
    };

    const updated = [...localPirogs, newPirog];
    setLocalPirogs(updated);
    setSelectedPirogId(newId);
    onSavePirogs(updated);
    triggerToast('Создан новый пустой бутерброд');
  };

  // Сброс всех пирогов к заводским
  const handleResetToDefaults = () => {
    if (window.confirm('Сбросить все бутерброды к заводским предустановкам Краснодар 2026?')) {
      setLocalPirogs(DEFAULT_PIROGS);
      setSelectedPirogId(DEFAULT_PIROGS[0].id);
      onSavePirogs(DEFAULT_PIROGS);
      try {
        localStorage.removeItem('estimate_cad_custom_pirogs_v1');
      } catch {}
      triggerToast('Сброшено к заводским пирогам');
    }
  };

  const triggerToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 2500);
  };

  // Подсчет себестоимости активного пирога
  const activePirogTotals = useMemo(() => {
    if (!activePirog) return { econom: 0, standard: 0, design: 0, materials: 0 };
    
    let econom = 0;
    let standard = 0;
    let design = 0;
    let materials = 0;

    (activePirog.works || []).forEach(w => {
      if (!w) return;
      const def = Number(w.defaultUnitPrice) || 0;
      econom += Number(w.economPrice != null ? w.economPrice : def);
      standard += Number(w.standardPrice != null ? w.standardPrice : def);
      design += Number(w.designPrice != null ? w.designPrice : def);
    });

    (activePirog.materials || []).forEach(m => {
      if (!m) return;
      const price = Number(m.defaultUnitPrice) || 0;
      const norm = Number(m.normPerUnit) || 0;
      const safety = Number(m.safetyCoeff) || 1;
      materials += (price * norm * safety);
    });

    return {
      econom: Math.round(econom),
      standard: Math.round(standard),
      design: Math.round(design),
      materials: Math.round(materials)
    };
  }, [activePirog]);

  const modalContent = (
    <ErrorBoundary fallbackTitle="Конструктор бутербродов" onReset={onClose}>
      <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 text-slate-800 animate-in fade-in duration-150">
        <div className="bg-white border border-slate-300 rounded-2xl shadow-2xl w-full h-[95vh] flex flex-col overflow-hidden text-slate-800">
        
        {/* 1. ВЕРХНИЙ ХЕДЕР МОДАЛКИ (СВЕТЛЫЙ) */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 tracking-tight flex items-center gap-2">
                <span>База расценок и Конструктор «Бутербродов»</span>
                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-full">
                  Краснодар 2026
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Гибкая сборка любых пирогов отделки • 459 расценок работ • 39 норм материалов Бауцентр/Леруа
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {saveToast && (
              <span className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-xl flex items-center gap-1.5 animate-in fade-in">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-medium">{saveToast}</span>
              </span>
            )}

            <button
              onClick={handleCreateNewPirog}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-colors flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Новый бутерброд</span>
            </button>

            <button
              onClick={handleResetToDefaults}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 cursor-pointer transition-colors flex items-center gap-1"
              title="Сбросить все расценки и бутерброды к заводским"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Сброс</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl cursor-pointer transition-colors"
              title="Закрыть конструктор"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. ТРЕХКОЛОНОЧНЫЙ РАБОЧИЙ СТОЛ */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* КОЛОНКА 1: СПИСОК БУТЕРБРОДОВ (280px) */}
          <div className="w-72 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0">
            <div className="p-2.5 border-b border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Доступные бутерброды ({localPirogs.length}):</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-slate-200">
              {PIROG_CATEGORIES.map(cat => {
                const catPirogs = localPirogs.filter(p => p.category === cat.id);
                if (catPirogs.length === 0) return null;

                return (
                  <div key={cat.id} className="pt-2 first:pt-0">
                    <div className="text-[10px] uppercase font-bold text-slate-500 px-2 py-1 flex items-center gap-1.5">
                      <span>{cat.icon}</span>
                      <span>{cat.name} ({catPirogs.length})</span>
                    </div>

                    <div className="space-y-0.5">
                      {catPirogs.map(pirog => {
                        const isSelected = pirog.id === selectedPirogId;
                        return (
                          <button
                            key={pirog.id}
                            onClick={() => setSelectedPirogId(pirog.id)}
                            className={`w-full text-left p-2 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-between gap-2 ${
                              isSelected
                                ? 'bg-indigo-600 text-white font-bold shadow-sm'
                                : 'text-slate-700 hover:bg-slate-200/70 hover:text-slate-900'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-xs font-semibold">{pirog.name}</div>
                              <div className="text-[10px] opacity-75 font-mono">
                                {(pirog.works || []).length} работ • {(pirog.materials || []).length} мат.
                              </div>
                            </div>
                            <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* КОЛОНКА 2: РЕДАКТОР ВЫБРАННОГО БУТЕРБРОДА (FLEX 1) */}
          {activePirog ? (
            <div className="flex-1 bg-slate-100/50 flex flex-col overflow-y-auto p-4 space-y-4">
              
              {/* Шапка бутерброда */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex-1 min-w-[240px]">
                    <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                      Наименование бутерброда (Пресет {activePirog.id}):
                    </label>
                    <input
                      type="text"
                      value={activePirog.name}
                      onChange={e => {
                        const val = e.target.value;
                        updateActivePirog(p => ({ ...p, name: val }));
                      }}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold text-sm focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div className="w-48 shrink-0">
                    <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                      Раздел / Категория:
                    </label>
                    <select
                      value={activePirog.category}
                      onChange={e => {
                        const val = e.target.value as PirogCategory;
                        updateActivePirog(p => ({ ...p, category: val }));
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-800 text-xs font-semibold focus:outline-none focus:border-indigo-600 cursor-pointer"
                    >
                      {PIROG_CATEGORIES.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.icon} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Расчетная стоимость по тарифам */}
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-200">
                  <div className="p-2 bg-amber-50/70 rounded-xl border border-amber-200 text-center">
                    <span className="text-[10px] text-amber-800 font-bold uppercase block">Эконом:</span>
                    <span className="text-sm font-black font-mono text-amber-900">{Math.round(activePirogTotals.econom * regionalCoeff)} ₽</span>
                  </div>
                  <div className="p-2 bg-blue-50/70 rounded-xl border border-blue-200 text-center">
                    <span className="text-[10px] text-blue-800 font-bold uppercase block">Стандарт:</span>
                    <span className="text-sm font-black font-mono text-blue-900">{Math.round(activePirogTotals.standard * regionalCoeff)} ₽</span>
                  </div>
                  <div className="p-2 bg-purple-50/70 rounded-xl border border-purple-200 text-center">
                    <span className="text-[10px] text-purple-800 font-bold uppercase block">Дизайн:</span>
                    <span className="text-sm font-black font-mono text-purple-900">{Math.round(activePirogTotals.design * regionalCoeff)} ₽</span>
                  </div>
                  <div className="p-2 bg-emerald-50/70 rounded-xl border border-emerald-200 text-center">
                    <span className="text-[10px] text-emerald-800 font-bold uppercase block">Материалы:</span>
                    <span className="text-sm font-black font-mono text-emerald-900">{activePirogTotals.materials} ₽</span>
                  </div>
                </div>
              </div>

              {/* 1. БЛОК ЭТАПОВ РАБОТ */}
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDropOnWorks}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hammer className="w-4 h-4 text-blue-600" />
                    <h3 className="font-bold text-sm text-slate-900">
                      Технологические этапы работ ({(activePirog?.works || []).length}):
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Перетащите работу из каталога справа или нажмите [+]
                  </span>
                </div>

                {(activePirog?.works || []).length === 0 ? (
                  <div className="p-6 border-2 border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-500 bg-slate-50">
                    В этом бутерброде пока нет этапов работ. Кликните [+] в правом каталоге, чтобы добавить работы!
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {(activePirog?.works || []).map((w, idx) => (
                      <div 
                        key={w.id}
                        className="bg-slate-50/80 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-slate-400 font-mono text-[10px] w-4">{idx + 1}.</span>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-slate-900 truncate" title={w.name}>{w.name}</div>
                            {w.source && <div className="text-[10px] text-slate-500">{w.source}</div>}
                          </div>
                        </div>

                        {/* Цены этапа */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <span className="text-[9px] text-slate-500 block">Ставка (Стандарт):</span>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={w.standardPrice || w.defaultUnitPrice}
                                onChange={e => {
                                  const val = parseFloat(e.target.value) || 0;
                                  updateActivePirog(p => ({
                                    ...p,
                                    works: p.works.map(item => item.id === w.id ? { ...item, defaultUnitPrice: val, standardPrice: val } : item)
                                  }));
                                }}
                                className="w-16 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-right font-mono font-bold text-slate-900 text-xs"
                              />
                              <span className="text-[10px] text-slate-500">₽/{w.unit}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleRemoveWork(w.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                            title="Удалить этап из бутерброда"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. БЛОК МАТЕРИАЛОВ */}
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDropOnMaterials}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-amber-600" />
                    <h3 className="font-bold text-sm text-slate-900">
                      Черновые материалы ({(activePirog?.materials || []).length}):
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Перетащите материал из каталога справа или нажмите [+]
                  </span>
                </div>

                {(activePirog?.materials || []).length === 0 ? (
                  <div className="p-6 border-2 border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-500 bg-slate-50">
                    Черновые материалы не привязаны. Перетащите материал из правого каталога!
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {(activePirog?.materials || []).map((m, idx) => (
                      <div 
                        key={m.id}
                        className="bg-slate-50/80 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-slate-400 font-mono text-[10px] w-4">{idx + 1}.</span>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-slate-900 truncate" title={m.name}>{m.name}</div>
                            <div className="text-[10px] text-slate-500">
                              Фасовка: {m.packageType || 'Стандарт'} • Норма: {m.normPerUnit} {m.unit}
                            </div>
                          </div>
                        </div>

                        {/* Норма и стоимость */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <span className="text-[9px] text-slate-500 block">Норма расхода:</span>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                step="0.01"
                                value={m.normPerUnit}
                                onChange={e => {
                                  const val = parseFloat(e.target.value) || 0;
                                  updateActivePirog(p => ({
                                    ...p,
                                    materials: p.materials.map(item => item.id === m.id ? { ...item, normPerUnit: val } : item)
                                  }));
                                }}
                                className="w-16 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-right font-mono font-bold text-slate-900 text-xs"
                              />
                              <span className="text-[10px] text-slate-500">{m.unit}</span>
                            </div>
                          </div>

                          <div className="text-right w-16">
                            <span className="text-[9px] text-slate-500 block">Стоимость:</span>
                            <span className="font-mono font-bold text-amber-700 text-xs">
                              {m.defaultUnitPrice} ₽
                            </span>
                          </div>

                          <button
                            onClick={() => handleRemoveMaterial(m.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                            title="Удалить материал из бутерброда"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              Выберите бутерброд слева
            </div>
          )}

          {/* КОЛОНКА 3: КАТАЛОГ БАЗЫ КРД (380px) */}
          <div className="w-96 bg-slate-50 border-l border-slate-200 flex flex-col shrink-0">
            {/* Переключатель вкладок каталога */}
            <div className="p-2 border-b border-slate-200 flex items-center gap-1 bg-white">
              <button
                onClick={() => setCatalogTab('works')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  catalogTab === 'works'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Hammer className="w-3.5 h-3.5" />
                <span>Работы (459)</span>
              </button>
              <button
                onClick={() => setCatalogTab('materials')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  catalogTab === 'materials'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Материалы (39)</span>
              </button>
            </div>

            {/* Поиск и фильтры по разделам */}
            <div className="p-2.5 border-b border-slate-200 space-y-2 bg-slate-50">
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl shadow-2xs">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={e => setCatalogSearch(e.target.value)}
                  placeholder={catalogTab === 'works' ? 'Поиск работы (стяжка, плитка, обои)...' : 'Поиск материала (Knauf, Ceresit)...'}
                  className="w-full text-xs text-slate-900 bg-transparent outline-none placeholder:text-slate-400"
                />
                {catalogSearch && (
                  <button onClick={() => setCatalogSearch('')} className="text-slate-400 hover:text-slate-700 text-xs">
                    ✕
                  </button>
                )}
              </div>

              {catalogTab === 'works' && (
                <select
                  value={workSectionFilter}
                  onChange={e => setWorkSectionFilter(e.target.value)}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-slate-700 text-[11px] outline-none cursor-pointer"
                >
                  <option value="all">Все разделы прайса (459 поз.)</option>
                  {workSections.map(sec => (
                    <option key={sec} value={sec}>{sec}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Список карточек каталога */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {catalogTab === 'works' ? (
                filteredWorks.map(w => (
                  <div
                    key={w.code}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/json', JSON.stringify({ type: 'work', item: w }));
                    }}
                    className="p-2 bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs rounded-xl transition-all flex items-center justify-between gap-2 group cursor-grab shadow-2xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 text-[10px] text-blue-700 font-mono font-semibold">
                        <GripVertical className="w-3 h-3 text-slate-400 group-hover:text-blue-500 shrink-0" />
                        <span>[{w.code}]</span>
                      </div>
                      <div className="text-xs text-slate-900 font-semibold truncate" title={w.name}>
                        {w.name}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {Math.round(w.price * regionalCoeff)} ₽/{w.unit}
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddWorkFromCatalog(w)}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-transparent rounded-lg text-xs font-bold cursor-pointer transition-colors shrink-0 flex items-center gap-1 shadow-2xs"
                      title="Добавить этот этап в выбранный бутерброд"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>В пирог</span>
                    </button>
                  </div>
                ))
              ) : (
                filteredMaterials.map(m => (
                  <div
                    key={m.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/json', JSON.stringify({ type: 'material', item: m }));
                    }}
                    className="p-2 bg-white border border-slate-200 hover:border-amber-400 hover:shadow-xs rounded-xl transition-all flex items-center justify-between gap-2 group cursor-grab shadow-2xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 text-[10px] text-amber-700 font-mono font-semibold">
                        <GripVertical className="w-3 h-3 text-slate-400 group-hover:text-amber-500 shrink-0" />
                        <span>[{m.id}]</span>
                        <span className="text-slate-500">{m.materialType}</span>
                      </div>
                      <div className="text-xs text-slate-900 font-semibold truncate" title={m.name}>
                        {m.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {m.defaultUnitPrice} ₽ • {m.packageType || 'Стандарт'}
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddMaterialFromCatalog(m)}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-600 text-amber-700 hover:text-white border border-amber-200 hover:border-transparent rounded-lg text-xs font-bold cursor-pointer transition-colors shrink-0 flex items-center gap-1 shadow-2xs"
                      title="Добавить этот материал в выбранный бутерброд"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>В пирог</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
    </ErrorBoundary>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
