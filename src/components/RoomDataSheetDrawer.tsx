import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  DoorClosed, 
  Square, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  ChevronDown, 
  Layers, 
  Sparkles, 
  Info,
  Maximize2,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { 
  ImportedRoomData, 
  STANDARD_DOOR_PRESETS, 
  STANDARD_WINDOW_PRESETS,
  createImportedRoom,
  calculateRoomMetrics
} from '../cad/roomDataSheet';

interface RoomDataSheetDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialRooms: ImportedRoomData[];
  globalCeilingHeight?: number;
  onApplyRoomsToEstimate: (rooms: ImportedRoomData[]) => void;
  onNavigateToEstimate?: () => void;
  className?: string;
}

export const RoomDataSheetDrawer: React.FC<RoomDataSheetDrawerProps> = ({
  isOpen,
  onClose,
  initialRooms,
  globalCeilingHeight = 3.04,
  onApplyRoomsToEstimate,
  onNavigateToEstimate,
  className = ''
}) => {
  const [rooms, setRooms] = useState<ImportedRoomData[]>(initialRooms);
  const [activeTab, setActiveTab] = useState<'rooms' | 'summary'>('rooms');
  const [appliedSuccess, setAppliedSuccess] = useState<boolean>(false);

  // Синхронизация при внешнем изменении initialRooms
  useEffect(() => {
    if (initialRooms && initialRooms.length > 0) {
      setRooms(initialRooms);
    }
  }, [initialRooms]);

  // Изменение высоты потолков для всех комнат сразу
  const [allHeight, setAllHeight] = useState<number>(globalCeilingHeight);

  const handleApplyGlobalHeight = (newH: number) => {
    const val = Math.max(1.8, Math.min(6.0, newH));
    setAllHeight(val);
    setRooms(prev => prev.map(r => {
      const metrics = calculateRoomMetrics({
        ...r,
        ceilingHeight: val
      });
      return {
        ...r,
        ceilingHeight: val,
        wallGrossArea: metrics.wallGrossArea,
        openingsTotalArea: metrics.openingsTotalArea,
        wallNetArea: metrics.wallNetArea
      };
    }));
  };

  // Редактирование конкретного поля комнаты
  const handleUpdateRoom = (id: string, updates: Partial<ImportedRoomData>) => {
    setRooms(prev => prev.map(r => {
      if (r.id !== id) return r;
      const merged = { ...r, ...updates };

      // Пересчет площадей стен при изменении геометрии или проемов
      const metrics = calculateRoomMetrics({
        floorArea: merged.floorArea,
        ceilingHeight: merged.ceilingHeight,
        perimeter: merged.perimeter,
        doorsCount: merged.doorsCount,
        doorWidth: merged.doorWidth,
        doorHeight: merged.doorHeight,
        windowsCount: merged.windowsCount,
        windowWidth: merged.windowWidth,
        windowHeight: merged.windowHeight
      });

      return {
        ...merged,
        wallGrossArea: metrics.wallGrossArea,
        openingsTotalArea: metrics.openingsTotalArea,
        wallNetArea: metrics.wallNetArea
      };
    }));
  };

  // Изменение количества дверей
  const handleDoorsCountChange = (id: string, delta: number) => {
    const room = rooms.find(r => r.id === id);
    if (!room) return;
    const nextCount = Math.max(0, room.doorsCount + delta);
    handleUpdateRoom(id, { doorsCount: nextCount });
  };

  // Изменение пресета двери
  const handleDoorPresetChange = (id: string, presetId: string) => {
    const preset = STANDARD_DOOR_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    handleUpdateRoom(id, { doorWidth: preset.width, doorHeight: preset.height });
  };

  // Изменение количества окон
  const handleWindowsCountChange = (id: string, delta: number) => {
    const room = rooms.find(r => r.id === id);
    if (!room) return;
    const nextCount = Math.max(0, room.windowsCount + delta);
    handleUpdateRoom(id, { windowsCount: nextCount });
  };

  // Изменение пресета окна
  const handleWindowPresetChange = (id: string, presetId: string) => {
    const preset = STANDARD_WINDOW_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    handleUpdateRoom(id, { windowWidth: preset.width, windowHeight: preset.height });
  };

  // Добавление новой комнаты
  const handleAddRoom = () => {
    const newRoom = createImportedRoom({
      name: `Помещение ${rooms.length + 1}`,
      floorArea: 12.0,
      ceilingHeight: allHeight
    });
    setRooms(prev => [...prev, newRoom]);
  };

  // Удаление комнаты
  const handleDeleteRoom = (id: string) => {
    if (confirm('Удалить это помещение из списка обмера?')) {
      setRooms(prev => prev.filter(r => r.id !== id));
    }
  };

  // Суммарные показатели
  const summary = useMemo(() => {
    const totalFloor = rooms.reduce((sum, r) => sum + r.floorArea, 0);
    const totalWallGross = rooms.reduce((sum, r) => sum + r.wallGrossArea, 0);
    const totalOpenings = rooms.reduce((sum, r) => sum + r.openingsTotalArea, 0);
    const totalWallNet = rooms.reduce((sum, r) => sum + r.wallNetArea, 0);
    const totalPerimeter = rooms.reduce((sum, r) => sum + r.perimeter, 0);
    const totalDoors = rooms.reduce((sum, r) => sum + r.doorsCount, 0);
    const totalWindows = rooms.reduce((sum, r) => sum + r.windowsCount, 0);

    return {
      totalFloor: Number(totalFloor.toFixed(2)),
      totalWallGross: Number(totalWallGross.toFixed(2)),
      totalOpenings: Number(totalOpenings.toFixed(2)),
      totalWallNet: Number(totalWallNet.toFixed(2)),
      totalPerimeter: Number(totalPerimeter.toFixed(2)),
      totalDoors,
      totalWindows,
    };
  }, [rooms]);

  // Применение комнат в смету
  const handleApply = () => {
    if (rooms.length === 0) {
      alert('Список комнат пуст. Добавьте хотя бы одно помещение перед переносом в смету.');
      return;
    }
    onApplyRoomsToEstimate(rooms);
    setAppliedSuccess(true);
    setTimeout(() => {
      setAppliedSuccess(false);
      onClose();
      if (onNavigateToEstimate) onNavigateToEstimate();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-y-0 right-0 z-50 w-full max-w-xl md:max-w-2xl bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200 select-none ${className}`}>
      {/* 1. ШАПКА ПАНЕЛИ */}
      <div className="p-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500 rounded-xl text-white shadow-xs">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-white tracking-tight">
                Данные обмера по комнатам
              </h2>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                {rooms.length} {rooms.length === 1 ? 'комната' : (rooms.length > 4 ? 'комнат' : 'комнаты')}
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Рукописные формулы, площади и вычет проемов (дверей и окон)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAddRoom}
            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer active:scale-95"
            title="Добавить еще одно помещение"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Комната</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="Свернуть панель"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. СВОДНАЯ СТРОКА: ВЫСОТА ПОТОЛКА И СУММАРНЫЕ ПЛОЩАДИ */}
      <div className="px-3.5 py-2.5 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-600">Высота потолков h:</span>
            <input
              type="number"
              step="0.01"
              min="2.0"
              max="5.0"
              value={allHeight}
              onChange={e => handleApplyGlobalHeight(Number(e.target.value) || 3.04)}
              className="w-16 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-center font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs shadow-2xs"
            />
            <span className="text-[11px] text-slate-500 font-bold">м</span>
          </div>

          <span className="text-slate-300 hidden sm:inline">•</span>

          <div className="text-[11px] font-mono text-slate-700 hidden sm:block">
            S пола: <b className="text-blue-700 font-bold">{summary.totalFloor} м²</b>
          </div>

          <span className="text-slate-300 hidden sm:inline">•</span>

          <div className="text-[11px] font-mono text-slate-700 hidden sm:block">
            Чистые стены: <b className="text-emerald-700 font-bold">{summary.totalWallNet} м²</b>
          </div>
        </div>

        <div className="text-[10px] text-slate-500 italic">
          🚪 Двери и 🪟 окна автоматически вычитаются из площади стен
        </div>
      </div>

      {/* 3. СПИСОК ПОМЕЩЕНИЙ */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-50">
        {rooms.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300 space-y-3">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="font-bold text-sm text-slate-800">Помещения не добавлены</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Загрузите фото обмерного листа или нажмите кнопку «Комната», чтобы добавить помещения вручную.
            </p>
            <button
              onClick={handleAddRoom}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить первое помещение</span>
            </button>
          </div>
        ) : (
          rooms.map((room, idx) => {
            const currentDoorPreset = STANDARD_DOOR_PRESETS.find(p => p.width === room.doorWidth && p.height === room.doorHeight)?.id || 'custom';
            const currentWinPreset = STANDARD_WINDOW_PRESETS.find(p => p.width === room.windowWidth && p.height === room.windowHeight)?.id || 'custom';

            return (
              <div 
                key={room.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-sm transition-all overflow-hidden p-3.5 space-y-2.5"
              >
                {/* Верхняя плашка комнаты: Номер, Название, Тип и Удаление */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-bold font-mono text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={room.name}
                      onChange={e => handleUpdateRoom(room.id, { name: e.target.value })}
                      className="font-bold text-xs text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none px-1 py-0.5 flex-1 min-w-0"
                      placeholder="Название комнаты"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Переключатель типа помещения (клик меняет жилая / мокрая / балкон) */}
                    <button
                      type="button"
                      onClick={() => {
                        const nextType = room.roomType === 'living' ? 'wet' : (room.roomType === 'wet' ? 'balcony' : 'living');
                        handleUpdateRoom(room.id, { 
                          roomType: nextType,
                          isWet: nextType === 'wet'
                        });
                      }}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                        room.roomType === 'wet'
                          ? 'bg-cyan-50 text-cyan-800 border-cyan-200 hover:bg-cyan-100'
                          : room.roomType === 'balcony'
                          ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      }`}
                      title="Нажмите для смены категории (Жилая / Мокрая / Балкон)"
                    >
                      {room.roomType === 'wet' ? '💧 Мокрая зона' : (room.roomType === 'balcony' ? '☀️ Балкон/Лоджия' : '🪵 Жилая зона')}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteRoom(room.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Удалить комнату"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Формула расчета из рукописного обмерного листа (если есть) */}
                {room.formula && (
                  <div className="p-1.5 bg-amber-50/80 border border-amber-200/70 rounded-lg text-[10px] font-mono text-amber-900 flex items-center justify-between gap-1.5">
                    <span className="truncate">📐 Формула: <b>{room.formula}</b></span>
                    <span className="text-[9px] text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded font-bold shrink-0">
                      с листа
                    </span>
                  </div>
                )}

                {/* Числовые параметры: Площадь пола, Периметр, Высота */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50/80 p-2 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">S пола (м²):</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={room.floorArea}
                      onChange={e => handleUpdateRoom(room.id, { floorArea: Number(e.target.value) || 0 })}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg font-mono font-bold text-blue-700 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Периметр P (м):</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      value={room.perimeter}
                      onChange={e => handleUpdateRoom(room.id, { perimeter: Number(e.target.value) || 0 })}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                      title="Периметр стен комнаты"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Высота h (м):</label>
                    <input
                      type="number"
                      step="0.01"
                      min="1.8"
                      max="6.0"
                      value={room.ceilingHeight}
                      onChange={e => handleUpdateRoom(room.id, { ceilingHeight: Number(e.target.value) || allHeight })}
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-700 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                    />
                  </div>
                </div>

                {/* БЛОК ПРОЕМОВ: ДВЕРИ И ОКНА С ВЫЧЕТОМ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {/* ДВЕРИ */}
                  <div className="p-2 rounded-xl bg-orange-50/50 border border-orange-200/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-orange-950">
                        <DoorClosed className="w-3.5 h-3.5 text-orange-600" />
                        <span>Двери:</span>
                      </div>
                      <div className="flex items-center gap-1 bg-white border border-orange-200 rounded-lg px-1 py-0.5 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => handleDoorsCountChange(room.id, -1)}
                          className="w-4 h-4 rounded text-xs font-bold text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-4 text-center font-bold text-xs font-mono text-orange-900">
                          {room.doorsCount}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDoorsCountChange(room.id, 1)}
                          className="w-4 h-4 rounded text-xs font-bold text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {room.doorsCount > 0 && (
                      <div className="flex items-center justify-between gap-1 text-[10px]">
                        <select
                          value={currentDoorPreset}
                          onChange={e => handleDoorPresetChange(room.id, e.target.value)}
                          className="flex-1 bg-white border border-orange-200 rounded px-1.5 py-0.5 text-[10px] text-slate-800 font-medium focus:outline-none"
                        >
                          {STANDARD_DOOR_PRESETS.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.width.toFixed(2)} × {p.height.toFixed(2)} м
                            </option>
                          ))}
                        </select>
                        <span className="text-orange-800 font-mono font-bold shrink-0">
                          -{(room.doorsCount * room.doorWidth * room.doorHeight).toFixed(2)} м²
                        </span>
                      </div>
                    )}
                  </div>

                  {/* ОКНА */}
                  <div className="p-2 rounded-xl bg-blue-50/50 border border-blue-200/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-blue-950">
                        <Square className="w-3.5 h-3.5 text-blue-600" />
                        <span>Окна:</span>
                      </div>
                      <div className="flex items-center gap-1 bg-white border border-blue-200 rounded-lg px-1 py-0.5 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => handleWindowsCountChange(room.id, -1)}
                          className="w-4 h-4 rounded text-xs font-bold text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-4 text-center font-bold text-xs font-mono text-blue-900">
                          {room.windowsCount}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleWindowsCountChange(room.id, 1)}
                          className="w-4 h-4 rounded text-xs font-bold text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {room.windowsCount > 0 && (
                      <div className="flex items-center justify-between gap-1 text-[10px]">
                        <select
                          value={currentWinPreset}
                          onChange={e => handleWindowPresetChange(room.id, e.target.value)}
                          className="flex-1 bg-white border border-blue-200 rounded px-1.5 py-0.5 text-[10px] text-slate-800 font-medium focus:outline-none"
                        >
                          {STANDARD_WINDOW_PRESETS.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.width.toFixed(2)} × {p.height.toFixed(2)} м
                            </option>
                          ))}
                        </select>
                        <span className="text-blue-800 font-mono font-bold shrink-0">
                          -{(room.windowsCount * room.windowWidth * room.windowHeight).toFixed(2)} м²
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ИТОГ ПО КОМНАТЕ: ЧИСТАЯ ПЛОЩАДЬ СТЕН */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                  <div className="text-[10px] text-slate-500">
                    Стены: <b>{room.wallGrossArea} м²</b> {room.openingsTotalArea > 0 && <span className="text-rose-600 font-bold">− {room.openingsTotalArea} м²</span>}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-sans text-slate-500 block">Чистая отделка стен:</span>
                    <span className="font-extrabold text-emerald-600 text-sm">
                      {room.wallNetArea} м²
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. ПОДВАЛ ПАНЕЛИ: ИТОГИ И ГЛАВНАЯ КНОПКА ПРИМЕНЕНИЯ В СМЕТУ */}
      <div className="p-3.5 bg-white border-t border-slate-200 shadow-xl space-y-2.5 shrink-0">
        <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono bg-slate-50 p-2 rounded-xl border border-slate-200">
          <div>
            <div className="text-[9px] uppercase font-sans font-bold text-slate-400">S пола</div>
            <div className="font-extrabold text-blue-700">{summary.totalFloor} м²</div>
          </div>
          <div>
            <div className="text-[9px] uppercase font-sans font-bold text-slate-400">S стен (net)</div>
            <div className="font-extrabold text-emerald-600">{summary.totalWallNet} м²</div>
          </div>
          <div>
            <div className="text-[9px] uppercase font-sans font-bold text-slate-400">Периметр</div>
            <div className="font-extrabold text-slate-800">{summary.totalPerimeter} м</div>
          </div>
          <div>
            <div className="text-[9px] uppercase font-sans font-bold text-slate-400">Проемы</div>
            <div className="font-extrabold text-orange-700">{summary.totalDoors}д / {summary.totalWindows}ок</div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleApply}
          className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer ${
            appliedSuccess
              ? 'bg-emerald-600 text-white'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-600/20'
          }`}
        >
          {appliedSuccess ? (
            <>
              <Check className="w-5 h-5 text-white animate-bounce" />
              <span>Данные успешно загружены в смету!</span>
            </>
          ) : (
            <>
              <FileSpreadsheet className="w-5 h-5" />
              <span>Применить в смету и пересчитать ({rooms.length} комн.)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
