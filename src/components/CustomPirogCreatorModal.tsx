import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Check, 
  Sparkles, 
  Hammer, 
  Package, 
  Layers,
  ChevronDown
} from 'lucide-react';
import { PirogDefinition, PirogCategory, WorkTemplate, MaterialTemplate, MultiplierType } from '../estimate/types';

interface CustomPirogCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: PirogCategory;
  initialPirog?: PirogDefinition | null;
  onSaveNewPirog: (newPirog: PirogDefinition) => void;
  onDeletePirog?: (pirogId: string) => void;
}

const CATEGORY_OPTIONS: { id: PirogCategory; label: string; icon: string; defaultMultiplier: MultiplierType }[] = [
  { id: 'ceiling', label: 'Потолок', icon: '☁️', defaultMultiplier: 'ceilingArea' },
  { id: 'walls', label: 'Стены', icon: '🧱', defaultMultiplier: 'wallNetArea' },
  { id: 'floor', label: 'Пол', icon: '🪵', defaultMultiplier: 'floorArea' },
  { id: 'doors', label: 'Дверные блоки', icon: '🚪', defaultMultiplier: 'doorsCount' },
  { id: 'other', label: 'Плинтус напольный', icon: '📏', defaultMultiplier: 'perimeter' },
];

const MULTIPLIER_LABELS: Record<string, string> = {
  floorArea: 'S пола (м²)',
  wallNetArea: 'S стен чистая (м²)',
  ceilingArea: 'S потолка (м²)',
  perimeter: 'Периметр P (м.п.)',
  doorsCount: 'Двери (шт)',
  windowsCount: 'Окна (шт)',
  fixed: 'Фиксировано (1 шт)'
};

export const CustomPirogCreatorModal: React.FC<CustomPirogCreatorModalProps> = ({
  isOpen,
  onClose,
  defaultCategory = 'floor',
  initialPirog = null,
  onSaveNewPirog,
  onDeletePirog
}) => {
  const [category, setCategory] = useState<PirogCategory>(defaultCategory);
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const [works, setWorks] = useState<WorkTemplate[]>([]);
  const [materials, setMaterials] = useState<MaterialTemplate[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (initialPirog) {
        setCategory(initialPirog.category);
        setName(initialPirog.name);
        setDescription(initialPirog.description || '');
        setWorks(JSON.parse(JSON.stringify(initialPirog.works || [])));
        setMaterials(JSON.parse(JSON.stringify(initialPirog.materials || [])));
      } else {
        setCategory(defaultCategory);
        setName('');
        setDescription('');

        const defMul = CATEGORY_OPTIONS.find(c => c.id === defaultCategory)?.defaultMultiplier || 'floorArea';
        setWorks([
          {
            id: `w_custom_${Date.now()}_1`,
            name: '',
            unit: 'м²',
            defaultUnitPrice: 500,
            multiplierType: defMul
          }
        ]);
        setMaterials([]);
      }
    }
  }, [isOpen, defaultCategory, initialPirog]);

  if (!isOpen) return null;

  const currentCategoryInfo = CATEGORY_OPTIONS.find(c => c.id === category) || CATEGORY_OPTIONS[0];

  const handleAddWork = () => {
    setWorks(prev => [
      ...prev,
      {
        id: `w_custom_${Date.now()}_${prev.length + 1}`,
        name: '',
        unit: 'м²',
        defaultUnitPrice: 500,
        multiplierType: currentCategoryInfo.defaultMultiplier
      }
    ]);
  };

  const handleUpdateWork = (idx: number, updates: Partial<WorkTemplate>) => {
    setWorks(prev => prev.map((w, i) => i === idx ? { ...w, ...updates } : w));
  };

  const handleDeleteWork = (idx: number) => {
    setWorks(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddMaterial = () => {
    setMaterials(prev => [
      ...prev,
      {
        id: `m_custom_${Date.now()}_${prev.length + 1}`,
        name: '',
        unit: 'кг',
        defaultUnitPrice: 100,
        normPerUnit: 1,
        multiplierType: currentCategoryInfo.defaultMultiplier
      }
    ]);
  };

  const handleUpdateMaterial = (idx: number, updates: Partial<MaterialTemplate>) => {
    setMaterials(prev => prev.map((m, i) => i === idx ? { ...m, ...updates } : m));
  };

  const handleDeleteMaterial = (idx: number) => {
    setMaterials(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      alert('Укажите название нового пирога отделки!');
      return;
    }

    const validWorks = works.filter(w => w.name.trim().length > 0);
    if (validWorks.length === 0) {
      alert('Добавьте хотя бы одно наименование работы в пирог!');
      return;
    }

    const validMaterials = materials.filter(m => m.name.trim().length > 0);

    const newPirog: PirogDefinition = {
      id: initialPirog ? initialPirog.id : `CUSTOM_${category.toUpperCase()}_${Date.now()}`,
      name: trimmedName,
      category,
      description: description.trim() || undefined,
      isCustom: true,
      works: validWorks,
      materials: validMaterials
    };

    onSaveNewPirog(newPirog);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Шапка модального окна */}
        <div className="p-4 bg-gradient-to-r from-indigo-700 via-blue-700 to-slate-800 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-extrabold flex items-center gap-2">
                <span>{initialPirog ? 'Редактирование пирога отделки' : 'Конструктор нового пирога отделки'}</span>
              </h2>
              <p className="text-xs text-blue-100">
                {initialPirog ? 'Изменение состава работ, расценок и материалов текущего пирога.' : 'Задайте категорию, название и наполните пирог своими работами и расценками.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Тело конструктора */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {/* 1. Категория и основные реквизиты */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Категория отделки:
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {CATEGORY_OPTIONS.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCategory(cat.id);
                      // Обновляем базу начисления по умолчанию для работ
                      setWorks(prev => prev.map(w => ({ ...w, multiplierType: cat.defaultMultiplier })));
                    }}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      category === cat.id 
                        ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold shadow-xs' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-[11px] leading-tight">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Название пирога отделки: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Например: Кварцвинил замковый с подложкой..."
                  className="w-full px-3 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 focus:border-blue-500 rounded-lg focus:outline-none shadow-2xs"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Краткое описание (технология / особенности):
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Например: С выравниванием наливным полом..."
                  className="w-full px-3 py-1.5 text-xs text-slate-700 bg-white border border-slate-300 focus:border-blue-500 rounded-lg focus:outline-none shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* 2. Список работ */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Hammer className="w-4 h-4 text-blue-600" />
                <span>Работы в составе пирога ({works.length})</span>
              </span>

              <button
                type="button"
                onClick={handleAddWork}
                className="px-2.5 py-1 text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Добавить работу</span>
              </button>
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-1.5 px-2 text-[10px] font-bold uppercase text-slate-400">
                <span className="col-span-5">Наименование работы</span>
                <span className="col-span-2 text-center">Ед. изм.</span>
                <span className="col-span-2 text-center">Цена (₽)</span>
                <span className="col-span-2 text-center">База начисления</span>
                <span className="col-span-1 text-center">Удалить</span>
              </div>

              {works.map((work, idx) => (
                <div key={work.id} className="grid grid-cols-12 gap-1.5 items-center p-1.5 bg-slate-50/70 rounded-lg border border-slate-200">
                  <div className="col-span-5">
                    <input
                      type="text"
                      value={work.name}
                      onChange={e => handleUpdateWork(idx, { name: e.target.value })}
                      placeholder="Название работы..."
                      className="w-full px-2 py-1 text-xs font-semibold bg-white border border-slate-200 rounded focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="col-span-2">
                    <input
                      type="text"
                      value={work.unit}
                      onChange={e => handleUpdateWork(idx, { unit: e.target.value })}
                      className="w-full text-center px-1 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="col-span-2">
                    <input
                      type="number"
                      min="0"
                      value={work.defaultUnitPrice}
                      onChange={e => handleUpdateWork(idx, { defaultUnitPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full text-center px-1 py-1 text-xs font-mono font-bold text-blue-700 bg-white border border-slate-200 rounded focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="col-span-2">
                    <select
                      value={work.multiplierType}
                      onChange={e => handleUpdateWork(idx, { multiplierType: e.target.value as MultiplierType })}
                      className="w-full text-[10px] font-semibold px-1 py-1 bg-white border border-slate-200 rounded focus:border-blue-500 focus:outline-none truncate"
                    >
                      {Object.entries(MULTIPLIER_LABELS).map(([k, label]) => (
                        <option key={k} value={k}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteWork(idx)}
                      disabled={works.length === 1}
                      className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Список черновых материалов */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-4 h-4 text-amber-600" />
                <span>Черновые материалы ({materials.length})</span>
              </span>

              <button
                type="button"
                onClick={handleAddMaterial}
                className="px-2.5 py-1 text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Добавить материал</span>
              </button>
            </div>

            {materials.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-2">
                Черновые материалы не добавлены (будут рассчитываться только работы).
              </p>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-1.5 px-2 text-[10px] font-bold uppercase text-slate-400">
                  <span className="col-span-5">Наименование материала</span>
                  <span className="col-span-2 text-center">Ед. изм.</span>
                  <span className="col-span-2 text-center">Цена (₽)</span>
                  <span className="col-span-2 text-center">Расход/ед.</span>
                  <span className="col-span-1 text-center">Удалить</span>
                </div>

                {materials.map((mat, idx) => (
                  <div key={mat.id} className="grid grid-cols-12 gap-1.5 items-center p-1.5 bg-slate-50/70 rounded-lg border border-slate-200">
                    <div className="col-span-5">
                      <input
                        type="text"
                        value={mat.name}
                        onChange={e => handleUpdateMaterial(idx, { name: e.target.value })}
                        placeholder="Название материала..."
                        className="w-full px-2 py-1 text-xs font-semibold bg-white border border-slate-200 rounded focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="col-span-2">
                      <input
                        type="text"
                        value={mat.unit}
                        onChange={e => handleUpdateMaterial(idx, { unit: e.target.value })}
                        className="w-full text-center px-1 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="col-span-2">
                      <input
                        type="number"
                        min="0"
                        value={mat.defaultUnitPrice}
                        onChange={e => handleUpdateMaterial(idx, { defaultUnitPrice: parseFloat(e.target.value) || 0 })}
                        className="w-full text-center px-1 py-1 text-xs font-mono font-bold text-amber-800 bg-white border border-slate-200 rounded focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="col-span-2">
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        value={mat.normPerUnit}
                        onChange={e => handleUpdateMaterial(idx, { normPerUnit: parseFloat(e.target.value) || 0 })}
                        className="w-full text-center px-1 py-1 text-xs font-mono font-bold text-slate-700 bg-white border border-slate-200 rounded focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteMaterial(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Подвал */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Отмена
            </button>
            {initialPirog && onDeletePirog && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Удалить пирог «${initialPirog.name}»?`)) {
                    onDeletePirog(initialPirog.id);
                    onClose();
                  }
                }}
                className="px-3 py-2 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                title="Удалить этот пирог"
              >
                <Trash2 className="w-4 h-4" />
                <span>Удалить пирог</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim() || works.length === 0}
            className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-98"
          >
            <Check className="w-4 h-4" />
            <span>{initialPirog ? '💾 Сохранить изменения' : '💾 Создать и сохранить пирог'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
