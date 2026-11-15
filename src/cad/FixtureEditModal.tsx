import React, { useState, useEffect } from 'react';
import { Fixture, Wall, Room, FixtureType } from './types';
import { FIXTURE_CATALOG, getFixtureDefinition } from './fixtures';
import { distance } from './geometry';
import { 
  X, 
  Zap, 
  RotateCw, 
  Trash2, 
  Copy, 
  Check, 
  ArrowLeftRight, 
  Sliders, 
  Layers, 
  MapPin, 
  Ruler,
  Maximize2
} from 'lucide-react';

interface FixtureEditModalProps {
  isOpen: boolean;
  fixture: Fixture | null;
  walls: Wall[];
  rooms: Room[];
  onClose: () => void;
  onSave: (updated: Fixture) => void;
  onDelete: (fixtureId: string) => void;
  onDuplicate: (fixture: Fixture) => void;
}

export const FixtureEditModal: React.FC<FixtureEditModalProps> = ({
  isOpen,
  fixture,
  walls,
  rooms,
  onClose,
  onSave,
  onDelete,
  onDuplicate,
}) => {
  if (!isOpen || !fixture) return null;

  const currentWall = fixture.wallId ? walls.find(w => w.id === fixture.wallId) : null;
  const wallLenM = currentWall ? distance(currentWall.start, currentWall.end) : 0;
  const wallLenMm = Math.round(wallLenM * 1000);

  // Состояние привязки от угла (в миллиметрах)
  const initialDistMm = Math.round((fixture.distanceFromCorner ?? 0.5) * 1000);
  const [distMm, setDistMm] = useState<number>(initialDistMm);
  const [distMStr, setDistMStr] = useState<string>(((fixture.distanceFromCorner ?? 0.5)).toFixed(2));
  const [cornerBase, setCornerBase] = useState<'start' | 'end'>('start');

  // Состояние высоты от чистого пола (в миллиметрах)
  const def = getFixtureDefinition(fixture.type);
  const initialHeightM = fixture.installationHeight ?? def.defaultHeightFromFloor;
  const [heightMm, setHeightMm] = useState<number>(Math.round(initialHeightM * 1000));
  const [heightMStr, setHeightMStr] = useState<string>(initialHeightM.toFixed(2));

  // Название и примечание
  const [customName, setCustomName] = useState<string>(fixture.customName || fixture.name || def.name);
  const [selectedType, setSelectedType] = useState<FixtureType>(fixture.type);
  const [rotationDeg, setRotationDeg] = useState<number>(fixture.rotationDeg || 0);

  // Синхронизация при открытии нового объекта
  useEffect(() => {
    if (fixture) {
      const curDef = getFixtureDefinition(fixture.type);
      const curDistMm = Math.round((fixture.distanceFromCorner ?? 0.5) * 1000);
      setDistMm(curDistMm);
      setDistMStr(((fixture.distanceFromCorner ?? 0.5)).toFixed(2));
      setCornerBase('start');

      const curH = fixture.installationHeight ?? curDef.defaultHeightFromFloor;
      setHeightMm(Math.round(curH * 1000));
      setHeightMStr(curH.toFixed(2));

      setCustomName(fixture.customName || fixture.name || curDef.name);
      setSelectedType(fixture.type);
      setRotationDeg(fixture.rotationDeg || 0);
    }
  }, [fixture]);

  // Обработчик изменения дистанции в мм
  const handleDistMmChange = (valMm: number) => {
    setDistMm(valMm);
    setDistMStr((valMm / 1000).toFixed(2));
  };

  // Обработчик изменения дистанции в метрах
  const handleDistMChange = (valM: string) => {
    setDistMStr(valM);
    const parsed = parseFloat(valM);
    if (!isNaN(parsed)) {
      setDistMm(Math.round(parsed * 1000));
    }
  };

  // Обработчик изменения высоты в мм
  const handleHeightMmChange = (valMm: number) => {
    setHeightMm(valMm);
    setHeightMStr((valMm / 1000).toFixed(2));
  };

  // Обработчик изменения высоты в метрах
  const handleHeightMChange = (valM: string) => {
    setHeightMStr(valM);
    const parsed = parseFloat(valM);
    if (!isNaN(parsed)) {
      setHeightMm(Math.round(parsed * 1000));
    }
  };

  // Сохранение и применение
  const handleApply = () => {
    let finalDistM = distMm / 1000;
    if (currentWall && wallLenM > 0) {
      if (cornerBase === 'end') {
        finalDistM = Math.max(0.05, wallLenM - finalDistM);
      }
      finalDistM = Math.max(0.05, Math.min(wallLenM - 0.05, finalDistM));
    }

    const finalHeightM = Math.max(0, heightMm / 1000);
    const newDef = getFixtureDefinition(selectedType);

    // Вычисляем новые x, y если стена привязана
    let newX = fixture.x;
    let newY = fixture.y;
    if (currentWall && wallLenM > 0) {
      const t = finalDistM / wallLenM;
      newX = currentWall.start.x + (currentWall.end.x - currentWall.start.x) * t;
      newY = currentWall.start.y + (currentWall.end.y - currentWall.start.y) * t;
    }

    onSave({
      ...fixture,
      type: selectedType,
      category: newDef.category,
      name: customName,
      customName,
      x: newX,
      y: newY,
      rotationDeg,
      distanceFromCorner: Number(finalDistM.toFixed(3)),
      installationHeight: Number(finalHeightM.toFixed(3)),
      shortLabel: newDef.shortLabel
    });
    onClose();
  };

  // Список совместимых элементов для быстрой смены (в той же категории)
  const categoryFixtures = FIXTURE_CATALOG.filter(f => f.category === def.category);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Шапка модального окна */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20 shrink-0">
              <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base tracking-tight truncate text-white">
                  Параметры обозначения
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/20 text-white font-medium border border-white/20">
                  {def.category === 'electric' ? '⚡ Электрика' : def.category === 'plumbing' ? '🚰 Сантехника' : def.category === 'kitchen' ? '🍳 Кухня' : def.category === 'climate' ? '❄️ Климат' : '🔘 Оборудование'}
                </span>
              </div>
              <p className="text-xs text-blue-100 truncate mt-0.5">
                {customName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Закрыть [Esc]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Тело окна */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm text-slate-700">
          
          {/* СЕКЦИЯ 1: ПРИВЯЗКА К СТЕНЕ (Смещение от угла) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  1. Привязка к стене (смещение от угла)
                </span>
              </div>
              {currentWall && (
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded border border-blue-200">
                  Длина стены: {wallLenMm} мм ({wallLenM.toFixed(2)} м)
                </span>
              )}
            </div>

            {currentWall ? (
              <div className="space-y-3 pt-1">
                {/* Выбор базы отсчета (угол) */}
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-white rounded-lg border border-slate-200 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setCornerBase('start')}
                    className={`py-1.5 px-2 rounded-md transition-all cursor-pointer text-center ${
                      cornerBase === 'start'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    ⬅️ От левого угла
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCornerBase('start');
                      handleDistMmChange(Math.round(wallLenMm / 2));
                    }}
                    className="py-1.5 px-2 rounded-md transition-all cursor-pointer text-center text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    title="Выставить точно по середине стены"
                  >
                    🎯 По центру
                  </button>
                  <button
                    type="button"
                    onClick={() => setCornerBase('end')}
                    className={`py-1.5 px-2 rounded-md transition-all cursor-pointer text-center ${
                      cornerBase === 'end'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    От правого угла ➡️
                  </button>
                </div>

                {/* Ввод дистанции в мм и метрах */}
                <div className="grid grid-cols-2 gap-3 items-center">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">
                      Расстояние в мм:
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="10"
                        min="50"
                        max={wallLenMm - 50}
                        value={distMm}
                        onChange={(e) => handleDistMmChange(parseInt(e.target.value) || 0)}
                        className="w-full pl-3 pr-10 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                      <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">
                        мм
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase">
                      Расстояние в метрах:
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.05"
                        min="0.05"
                        max={wallLenM - 0.05}
                        value={distMStr}
                        onChange={(e) => handleDistMChange(e.target.value)}
                        className="w-full pl-3 pr-8 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                      <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">
                        м
                      </span>
                    </div>
                  </div>
                </div>

                {/* Быстрые кнопки популярных отступов */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  <span className="text-[11px] text-slate-400 font-medium self-center mr-1">Быстро:</span>
                  {[100, 150, 200, 300, 500, 800, 1000].map(mm => (
                    <button
                      key={mm}
                      type="button"
                      onClick={() => handleDistMmChange(mm)}
                      className={`px-2 py-0.5 rounded text-xs font-mono font-bold border transition-colors cursor-pointer ${
                        distMm === mm 
                          ? 'bg-blue-50 text-blue-700 border-blue-400' 
                          : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      {mm} мм
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleDistMmChange(Math.round(wallLenMm / 2))}
                    className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-50 text-amber-700 border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer"
                  >
                    Центр ({Math.round(wallLenMm / 2)} мм)
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800">
                Элемент размещен свободно в помещении (не привязан к конкретной стене). Вы можете перетащить его мышкой к любой стене для автоматической привязки.
              </div>
            )}
          </div>

          {/* СЕКЦИЯ 2: ВЫСОТА УСТАНОВКИ ОТ ПОЛА (H) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  2. Высота установки от чистого пола (H)
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                H = {heightMm} мм ({heightMStr} м)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">
                  Высота в мм:
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="50"
                    min="0"
                    max="3500"
                    value={heightMm}
                    onChange={(e) => handleHeightMmChange(parseInt(e.target.value) || 0)}
                    className="w-full pl-3 pr-10 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">
                    мм
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">
                  Высота в метрах:
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="3.5"
                    value={heightMStr}
                    onChange={(e) => handleHeightMChange(e.target.value)}
                    className="w-full pl-3 pr-8 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">
                    м
                  </span>
                </div>
              </div>
            </div>

            {/* Стандартные архитектурные высоты по ГОСТ / ПУЭ */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] text-slate-500 font-bold block uppercase tracking-wider">
                Стандарты монтажа (ГОСТ / ПУЭ / СП):
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { mm: 300, m: '0.30м', desc: 'Розетки комнат (евро)' },
                  { mm: 900, m: '0.90м', desc: 'Выключатели у дверей' },
                  { mm: 1050, m: '1.05м', desc: 'Фартук кухни / стол' },
                  { mm: 1300, m: '1.30м', desc: 'ТВ / рабочая зона' },
                  { mm: 1800, m: '1.80м', desc: 'Подсветка зеркала' },
                  { mm: 2200, m: '2.20м', desc: 'Кондиционер / вытяжка' },
                ].map(item => (
                  <button
                    key={item.mm}
                    type="button"
                    onClick={() => handleHeightMmChange(item.mm)}
                    className={`flex items-center justify-between p-2 rounded-lg border text-left transition-all cursor-pointer ${
                      heightMm === item.mm 
                        ? 'bg-blue-50 border-blue-400 text-blue-900 ring-1 ring-blue-300' 
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs">{item.m} ({item.mm} мм)</div>
                      <div className="text-[10px] text-slate-500">{item.desc}</div>
                    </div>
                    {heightMm === item.mm && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* СЕКЦИЯ 3: ТИП И ПОЛЬЗОВАТЕЛЬСКАЯ МАРКИРОВКА */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                3. Название и маркировка на чертеже
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase">
                Текст на выноске (плашке):
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Например: Розетка для СВЧ, Розетка TV..."
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* Выбор типа из каталога */}
            {categoryFixtures.length > 1 && (
              <div className="space-y-1 pt-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">
                  Сменить тип изделия:
                </label>
                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {categoryFixtures.map(item => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => {
                        setSelectedType(item.type);
                        setCustomName(item.name);
                      }}
                      className={`p-2 rounded-lg border text-left text-xs transition-colors cursor-pointer ${
                        selectedType === item.type
                          ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="truncate">{item.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {item.shortLabel || item.type}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* СЕКЦИЯ 4: УПРАВЛЕНИЕ И БЫСТРЫЕ ДЕЙСТВИЯ */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setRotationDeg((prev) => (prev + 90) % 360)}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Поворот ({rotationDeg}°)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onDuplicate(fixture);
                onClose();
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Копия (+200мм)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onDelete(fixture.id);
                onClose();
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl border border-red-200 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Удалить [Del]</span>
            </button>
          </div>
        </div>

        {/* Подвал с кнопками */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Двойной клик на чертеже открывает эти параметры
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Применить изменения</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
