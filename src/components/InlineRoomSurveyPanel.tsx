import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Plus, 
  Trash2, 
  Layers, 
  ChevronRight, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  DoorClosed, 
  Square,
  Home,
  SlidersHorizontal,
  Star,
  X,
  Edit2
} from 'lucide-react';
import { Room } from '../cad/types';
import { 
  ImportedRoomData, 
  STANDARD_DOOR_PRESETS, 
  STANDARD_WINDOW_PRESETS,
  ROOM_PRESET_TEMPLATES,
  RoomPresetTemplate,
  createRoomFromPreset,
  createImportedRoom,
  calculateRoomMetrics,
  convertImportedRoomsToCadRooms,
  convertCadRoomToImported
} from '../cad/roomDataSheet';

const STORAGE_KEY_CUSTOM_PRESETS = 'estimate_cad_custom_room_presets';

interface InlineRoomSurveyPanelProps {
  rooms: Room[];
  onRoomsChange: (rooms: Room[]) => void;
  globalCeilingHeight: number;
  onOpenRoomFinishes?: (room: Room) => void;
  onNavigateToEstimate?: () => void;
  selections?: Record<string, any>;
}

export const InlineRoomSurveyPanel: React.FC<InlineRoomSurveyPanelProps> = ({
  rooms,
  onRoomsChange,
  globalCeilingHeight,
  onOpenRoomFinishes,
  onNavigateToEstimate,
  selections = {}
}) => {
  // Локальное состояние комнат в формате ImportedRoomData
  const [importedRooms, setImportedRooms] = useState<ImportedRoomData[]>(() => {
    if (rooms && rooms.length > 0) {
      return rooms.map(convertCadRoomToImported);
    }
    return [];
  });

  // Пользовательские сохраненные шаблоны комнат
  const [customPresets, setCustomPresets] = useState<RoomPresetTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_PRESETS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Временное уведомление о сохранении шаблона
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ID развернутой карточки для тонкой настройки дверей и окон
  const [expandedRoomId, setExpandedRoomId] = useState<string | null>(null);

  // Кастомное имя для произвольной комнаты
  const [customRoomName, setCustomRoomName] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);
  const [saveCustomAsTemplate, setSaveCustomAsTemplate] = useState<boolean>(true);

  // Синхронизация при внешнем изменении rooms (например, из OCR или при черчении стен)
  useEffect(() => {
    if (rooms) {
      const currentIds = importedRooms.map(r => `${r.id}_${r.floorArea}_${r.wallNetArea}_${r.name}`).join('|');
      const newIds = rooms.map(r => `${r.id}_${r.floorArea}_${r.wallNetArea}_${r.name}`).join('|');
      if (currentIds !== newIds) {
        setImportedRooms(rooms.map(convertCadRoomToImported));
      }
    }
  }, [rooms]);

  // Применение изменений обратно в App.tsx
  const commitRooms = (newImported: ImportedRoomData[]) => {
    setImportedRooms(newImported);
    const cadRooms = convertImportedRoomsToCadRooms(newImported);
    onRoomsChange(cadRooms);
    try {
      localStorage.setItem('estimate_cad_imported_rooms', JSON.stringify(newImported));
    } catch {}
  };

  // Все доступные шаблоны комнат (стандартные + сохраненные пользователем)
  const allTemplates = useMemo(() => {
    return [...ROOM_PRESET_TEMPLATES, ...customPresets];
  }, [customPresets]);

  // Добавление комнаты из типового пресета (площадь и периметр СТРОГО 0)
  const handleAddPresetRoom = (preset: RoomPresetTemplate) => {
    const doorPreset = STANDARD_DOOR_PRESETS.find(d => d.id === preset.defaultDoorPresetId) || STANDARD_DOOR_PRESETS[1];
    const winPreset = STANDARD_WINDOW_PRESETS.find(w => w.id === preset.defaultWindowPresetId) || STANDARD_WINDOW_PRESETS[0];

    const newRoom = createImportedRoom({
      name: preset.name,
      floorArea: 0,
      perimeter: 0,
      ceilingHeight: globalCeilingHeight,
      doorsCount: preset.defaultDoorsCount,
      doorWidth: doorPreset.width,
      doorHeight: doorPreset.height,
      windowsCount: preset.defaultWindowsCount,
      windowWidth: winPreset.width,
      windowHeight: winPreset.height
    });

    const updated = [...importedRooms, newRoom];
    commitRooms(updated);
    setExpandedRoomId(newRoom.id);
  };

  // Добавление произвольной комнаты (площадь и периметр СТРОГО 0)
  const handleAddCustomRoom = () => {
    const trimmed = customRoomName.trim();
    if (!trimmed) return;

    const lower = trimmed.toLowerCase();
    const isWet = lower.includes('ванн') || lower.includes('туалет') || lower.includes('санузел') || lower.includes('душ');
    const isBalcony = lower.includes('балкон') || lower.includes('лодж');
    const isCorridor = lower.includes('коридор') || lower.includes('прихож');

    let roomType: 'living' | 'wet' | 'balcony' | 'corridor' = 'living';
    if (isWet) roomType = 'wet';
    else if (isBalcony) roomType = 'balcony';
    else if (isCorridor) roomType = 'corridor';

    const newRoom = createImportedRoom({
      name: trimmed,
      floorArea: 0,
      perimeter: 0,
      ceilingHeight: globalCeilingHeight,
      doorsCount: isCorridor ? 4 : 1,
      doorWidth: isWet ? 0.70 : 0.80,
      windowsCount: (isWet || isCorridor) ? 0 : 1,
      windowWidth: 1.40,
      windowHeight: 1.40
    });

    // Сохранить новое название в список кнопок, если включен флаг
    if (saveCustomAsTemplate) {
      saveNameToTemplates(trimmed, isWet, roomType);
    }

    const updated = [...importedRooms, newRoom];
    commitRooms(updated);
    setCustomRoomName('');
    setShowCustomInput(false);
    setExpandedRoomId(newRoom.id);
  };

  // Сохранить название комнаты в список кнопок-шаблонов
  const saveNameToTemplates = (
    nameToSave: string, 
    isWet = false, 
    roomType: 'living' | 'wet' | 'balcony' | 'corridor' = 'living'
  ) => {
    const trimmed = nameToSave.trim();
    if (!trimmed) return;

    // Проверяем, нет ли уже такого шаблона
    const exists = allTemplates.some(t => t.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      showToast(`Шаблон «${trimmed}» уже есть в списке!`);
      return;
    }

    const newTemplate: RoomPresetTemplate = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: trimmed,
      shortLabel: trimmed,
      defaultArea: 0,
      isWet,
      roomType,
      defaultDoorsCount: 1,
      defaultDoorPresetId: isWet ? 'door_070' : 'door_080',
      defaultWindowsCount: isWet ? 0 : 1,
      defaultWindowPresetId: 'win_140'
    };

    const nextCustom = [...customPresets, newTemplate];
    setCustomPresets(nextCustom);
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM_PRESETS, JSON.stringify(nextCustom));
    } catch {}
    showToast(`⭐ Шаблон «${trimmed}» сохранен в кнопки!`);
  };

  // Удалить пользовательский шаблон из кнопок
  const handleDeleteCustomPreset = (presetId: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Удалить кнопку-шаблон «${name}» из быстрого списка?`)) {
      const nextCustom = customPresets.filter(p => p.id !== presetId);
      setCustomPresets(nextCustom);
      try {
        localStorage.setItem(STORAGE_KEY_CUSTOM_PRESETS, JSON.stringify(nextCustom));
      } catch {}
      showToast(`Шаблон «${name}» удален из списка.`);
    }
  };

  // Удаление комнаты из сметы
  const handleDeleteRoom = (id: string, name: string) => {
    if (confirm(`Удалить помещение «${name}» из сметы?`)) {
      const updated = importedRooms.filter(r => r.id !== id);
      commitRooms(updated);
      if (expandedRoomId === id) setExpandedRoomId(null);
    }
  };

  // Обновление любого числового/текстового поля комнаты
  const handleUpdateField = (id: string, updates: Partial<ImportedRoomData>) => {
    const updated = importedRooms.map(r => {
      if (r.id !== id) return r;
      const merged = { ...r, ...updates };

      // Если изменилось название, автоматически обновляем признак влажности
      if (updates.name !== undefined) {
        const lower = updates.name.toLowerCase();
        merged.isWet = lower.includes('ванн') || lower.includes('туалет') || lower.includes('санузел') || lower.includes('душ');
        if (lower.includes('балкон') || lower.includes('лодж')) merged.roomType = 'balcony';
        else if (merged.isWet) merged.roomType = 'wet';
        else if (lower.includes('коридор') || lower.includes('прихож')) merged.roomType = 'corridor';
        else merged.roomType = 'living';
      }

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
    });

    commitRooms(updated);
  };

  // Сводные данные
  const summary = useMemo(() => {
    const totalFloor = importedRooms.reduce((sum, r) => sum + (r.floorArea || 0), 0);
    const totalWallNet = importedRooms.reduce((sum, r) => sum + (r.wallNetArea || 0), 0);
    const totalDoors = importedRooms.reduce((sum, r) => sum + (r.doorsCount || 0), 0);
    const totalWindows = importedRooms.reduce((sum, r) => sum + (r.windowsCount || 0), 0);

    return {
      totalFloor: Number(totalFloor.toFixed(2)),
      totalWallNet: Number(totalWallNet.toFixed(2)),
      totalDoors,
      totalWindows
    };
  }, [importedRooms]);

  return (
    <div className="space-y-3">
      {/* Всплывающее уведомление о сохранении шаблона */}
      {toastMessage && (
        <div className="p-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-1">
          <span>{toastMessage}</span>
          <button 
            type="button" 
            onClick={() => setToastMessage(null)} 
            className="p-0.5 hover:bg-white/20 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. БЛОК БЫСТРОГО ВЫБОРА КОМНАТ ИЗ ПРЕСЕТОВ */}
      <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-slate-50 border border-blue-200/80 rounded-xl p-2.5 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>Добавить помещение в 1 клик (S=0, P=0):</span>
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            {allTemplates.length} шаблонов
          </span>
        </div>

        {/* Чипы типовых и пользовательских комнат */}
        <div className="flex flex-wrap gap-1">
          {/* Стандартные шаблоны */}
          {ROOM_PRESET_TEMPLATES.map(preset => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleAddPresetRoom(preset)}
              className="px-2 py-1 bg-white hover:bg-blue-600 hover:text-white text-slate-700 text-[11px] font-bold rounded-lg border border-slate-200 hover:border-blue-600 transition-all shadow-2xs cursor-pointer active:scale-95 flex items-center gap-1"
              title={`Добавить «${preset.name}» (площадь и периметр будут 0)`}
            >
              <span>+ {preset.shortLabel}</span>
              {preset.isWet && <span className="text-[9px]" title="Мокрая зона">💧</span>}
            </button>
          ))}

          {/* Сохраненные пользователем шаблоны (со звездочкой и кнопкой удаления) */}
          {customPresets.map(preset => (
            <div
              key={preset.id}
              className="inline-flex items-center bg-amber-50 hover:bg-amber-100 text-amber-950 text-[11px] font-bold rounded-lg border border-amber-300 shadow-2xs transition-all overflow-hidden group"
            >
              <button
                type="button"
                onClick={() => handleAddPresetRoom(preset)}
                className="px-2 py-1 cursor-pointer flex items-center gap-1 hover:text-amber-700"
                title={`Добавить «${preset.name}»`}
              >
                <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                <span>+ {preset.shortLabel}</span>
              </button>
              <button
                type="button"
                onClick={e => handleDeleteCustomPreset(preset.id, preset.name, e)}
                className="px-1 py-1 hover:bg-amber-200 text-amber-700 hover:text-rose-700 cursor-pointer transition-colors"
                title="Удалить этот шаблон из кнопок"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => setShowCustomInput(!showCustomInput)}
            className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            <span>Своё название...</span>
          </button>
        </div>

        {/* Инпут для произвольного названия комнаты с возможностью сохранить в шаблоны */}
        {showCustomInput && (
          <div className="pt-1.5 space-y-1.5 bg-white p-2 rounded-lg border border-blue-300 shadow-xs animate-in fade-in duration-150">
            <div className="flex gap-1.5">
              <input
                type="text"
                value={customRoomName}
                onChange={e => setCustomRoomName(e.target.value)}
                placeholder="Название нового помещения (напр. Кабинет, Сауна)..."
                className="flex-1 px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs font-semibold"
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddCustomRoom();
                }}
                autoFocus
              />
              <button
                type="button"
                onClick={handleAddCustomRoom}
                disabled={!customRoomName.trim()}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Добавить</span>
              </button>
            </div>

            <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={saveCustomAsTemplate}
                onChange={e => setSaveCustomAsTemplate(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>Сохранить это название в список кнопок для будущих проектов</span>
              </span>
            </label>
          </div>
        )}
      </div>

      {/* 2. СПИСОК КОМНАТ ОБМЕРА */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold uppercase tracking-wider text-slate-600">
            Помещения ({importedRooms.length})
          </span>
          <span className="text-[10px] text-slate-500">
            Кликните по названию для правки
          </span>
        </div>

        {importedRooms.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-500 space-y-2">
            <Home className="w-7 h-7 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">Список помещений пуст</p>
            <p className="text-[11px] text-slate-400">
              Нажмите кнопки выше (<b>+ Кухня</b>, <b>+ Комната 1</b> и др.) — комната появится со стартовыми 0 м² площади и 0 м периметра, готовая к вводу ваших замеров!
            </p>
          </div>
        ) : (
          importedRooms.map((room, idx) => {
            const isExpanded = expandedRoomId === room.id;
            const originalCadRoom = rooms.find(r => r.id === room.id);
            const isAlreadyInTemplates = allTemplates.some(t => t.name.toLowerCase() === room.name.trim().toLowerCase());

            return (
              <div 
                key={room.id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl transition-all shadow-2xs overflow-hidden"
              >
                {/* 2.1 Шапка карточки комнаты с возможностью редактирования и сохранения в шаблоны */}
                <div className="p-2.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="text-[10px] font-mono font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded shrink-0">
                      #{idx + 1}
                    </span>

                    {/* Поле прямого редактирования названия комнаты */}
                    <div className="relative flex-1 flex items-center">
                      <input
                        type="text"
                        value={room.name}
                        onChange={e => handleUpdateField(room.id, { name: e.target.value })}
                        className="font-bold text-xs text-slate-900 bg-transparent hover:bg-white focus:bg-white px-1.5 py-0.5 rounded border border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none transition-colors w-full"
                        title="Кликните, чтобы изменить название комнаты"
                        placeholder="Название комнаты..."
                      />
                    </div>

                    {/* Кнопка сохранить название как шаблон в кнопки, если его еще нет */}
                    {!isAlreadyInTemplates && room.name.trim().length > 1 && (
                      <button
                        type="button"
                        onClick={() => saveNameToTemplates(room.name, room.isWet, room.roomType)}
                        className="px-1.5 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded text-[10px] font-bold flex items-center gap-0.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
                        title={`Сохранить «${room.name}» в список кнопок быстрого добавления`}
                      >
                        <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                        <span>В кнопки</span>
                      </button>
                    )}

                    {room.isWet && (
                      <span className="text-[9px] bg-cyan-100 text-cyan-800 font-bold px-1.5 py-0.2 rounded shrink-0">
                        💧 мокрая
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Кнопка перехода к пирогам отделки */}
                    {originalCadRoom && onOpenRoomFinishes && (
                      <button
                        type="button"
                        onClick={() => onOpenRoomFinishes(originalCadRoom)}
                        className="px-2 py-1 text-[10px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Выбрать пироги отделки стен, пола и потолка"
                      >
                        <Layers className="w-3 h-3 text-blue-600" />
                        <span className="hidden sm:inline">Отделка</span>
                      </button>
                    )}

                    {/* Развернуть/свернуть двери и окна */}
                    <button
                      type="button"
                      onClick={() => setExpandedRoomId(isExpanded ? null : room.id)}
                      className={`p-1 rounded-lg border transition-colors cursor-pointer ${
                        isExpanded ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                      title={isExpanded ? 'Свернуть детали проемов' : 'Настроить двери и окна'}
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                    </button>

                    {/* Удалить */}
                    <button
                      type="button"
                      onClick={() => handleDeleteRoom(room.id, room.name)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Удалить комнату"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 2.2 Основные поля обмера (Пол, Потолок, Периметр) со стартовыми 0 */}
                <div className="p-2.5 space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    {/* S пола */}
                    <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-1.5 text-center">
                      <span className="text-[9px] uppercase font-bold text-blue-800 block">S пола, м²</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={room.floorArea === 0 ? '' : room.floorArea}
                        placeholder="0.00"
                        onChange={e => {
                          const val = Math.max(0, parseFloat(e.target.value) || 0);
                          // Если периметр был 0, автоматически рассчитываем его по формуле P = 4.05 * sqrt(S)
                          const autoP = room.perimeter === 0 && val > 0 
                            ? Number((4.05 * Math.sqrt(val)).toFixed(2)) 
                            : room.perimeter;
                          handleUpdateField(room.id, { 
                            floorArea: val,
                            perimeter: autoP
                          });
                        }}
                        className="w-full text-center font-mono font-bold text-xs text-blue-900 bg-white border border-blue-200 rounded py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs mt-0.5 placeholder:text-slate-400"
                      />
                    </div>

                    {/* Периметр P */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-center">
                      <span className="text-[9px] uppercase font-bold text-slate-600 block">Периметр P, м</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={room.perimeter === 0 ? '' : room.perimeter}
                        placeholder="0.00"
                        onChange={e => {
                          const val = Math.max(0, parseFloat(e.target.value) || 0);
                          handleUpdateField(room.id, { perimeter: val });
                        }}
                        className="w-full text-center font-mono font-bold text-xs text-slate-800 bg-white border border-slate-300 rounded py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs mt-0.5 placeholder:text-slate-400"
                      />
                    </div>

                    {/* Высота h */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-center">
                      <span className="text-[9px] uppercase font-bold text-slate-600 block">Высота h, м</span>
                      <input
                        type="number"
                        step="0.01"
                        min="1.8"
                        max="6.0"
                        value={room.ceilingHeight || ''}
                        onChange={e => {
                          const val = Math.max(1.8, parseFloat(e.target.value) || globalCeilingHeight);
                          handleUpdateField(room.id, { ceilingHeight: val });
                        }}
                        className="w-full text-center font-mono font-bold text-xs text-slate-800 bg-white border border-slate-300 rounded py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs mt-0.5"
                      />
                    </div>
                  </div>

                  {/* 2.3 Развернутые детали проемов (двери и окна) */}
                  {isExpanded && (
                    <div className="pt-2 border-t border-slate-200 space-y-2 bg-amber-50/40 -mx-2.5 -mb-2.5 p-2.5 rounded-b-xl animate-in fade-in duration-150">
                      {/* Двери */}
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5">
                          <DoorClosed className="w-3.5 h-3.5 text-amber-700" />
                          <span className="font-bold text-slate-700 text-[11px]">Двери:</span>
                          <div className="flex items-center border border-slate-300 rounded bg-white shadow-2xs">
                            <button
                              type="button"
                              onClick={() => handleUpdateField(room.id, { doorsCount: Math.max(0, room.doorsCount - 1) })}
                              className="px-1.5 py-0.5 hover:bg-slate-100 font-bold text-slate-600 cursor-pointer"
                            >
                              -
                            </button>
                            <span className="px-2 font-mono font-bold text-slate-900 text-[11px]">
                              {room.doorsCount} шт
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateField(room.id, { doorsCount: room.doorsCount + 1 })}
                              className="px-1.5 py-0.5 hover:bg-slate-100 font-bold text-slate-600 cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {room.doorsCount > 0 && (
                          <select
                            value={`${room.doorWidth.toFixed(2)}x${room.doorHeight.toFixed(2)}`}
                            onChange={e => {
                              const [w, h] = e.target.value.split('x').map(Number);
                              handleUpdateField(room.id, { doorWidth: w, doorHeight: h });
                            }}
                            className="text-[10px] font-mono bg-white border border-slate-300 rounded px-1.5 py-0.5 text-slate-800 shadow-2xs focus:outline-none"
                          >
                            {STANDARD_DOOR_PRESETS.map(dp => (
                              <option key={dp.id} value={`${dp.width.toFixed(2)}x${dp.height.toFixed(2)}`}>
                                {dp.width.toFixed(2)}×{dp.height.toFixed(2)} м
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Окна */}
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Square className="w-3.5 h-3.5 text-blue-700" />
                          <span className="font-bold text-slate-700 text-[11px]">Окна:</span>
                          <div className="flex items-center border border-slate-300 rounded bg-white shadow-2xs">
                            <button
                              type="button"
                              onClick={() => handleUpdateField(room.id, { windowsCount: Math.max(0, room.windowsCount - 1) })}
                              className="px-1.5 py-0.5 hover:bg-slate-100 font-bold text-slate-600 cursor-pointer"
                            >
                              -
                            </button>
                            <span className="px-2 font-mono font-bold text-slate-900 text-[11px]">
                              {room.windowsCount} шт
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateField(room.id, { windowsCount: room.windowsCount + 1 })}
                              className="px-1.5 py-0.5 hover:bg-slate-100 font-bold text-slate-600 cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {room.windowsCount > 0 && (
                          <select
                            value={`${room.windowWidth.toFixed(2)}x${room.windowHeight.toFixed(2)}`}
                            onChange={e => {
                              const [w, h] = e.target.value.split('x').map(Number);
                              handleUpdateField(room.id, { windowWidth: w, windowHeight: h });
                            }}
                            className="text-[10px] font-mono bg-white border border-slate-300 rounded px-1.5 py-0.5 text-slate-800 shadow-2xs focus:outline-none"
                          >
                            {STANDARD_WINDOW_PRESETS.map(wp => (
                              <option key={wp.id} value={`${wp.width.toFixed(2)}x${wp.height.toFixed(2)}`}>
                                {wp.width.toFixed(2)}×{wp.height.toFixed(2)} м
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 2.4 Итоговая чистая площадь стен комнаты */}
                  <div className="flex items-center justify-between pt-1 text-[11px] bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                    <span className="text-slate-600 font-medium">
                      Стены чистые (-проемы):
                    </span>
                    <span className="font-mono font-bold text-emerald-700 text-xs">
                      {room.perimeter > 0 ? `${room.wallNetArea} м²` : '0.00 м²'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 3. СВОДНАЯ ПЛАШКА ОБЪЕКТА И ПЕРЕХОД В СМЕТУ */}
      {importedRooms.length > 0 && (
        <div className="p-3 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-xl shadow-md space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-300">ИТОГО ПО ОБЪЕКТУ:</span>
            <span className="text-[10px] font-mono text-slate-300">
              {importedRooms.length} {importedRooms.length === 1 ? 'комната' : (importedRooms.length > 4 ? 'комнат' : 'комнаты')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-white/10 rounded-lg p-1.5">
              <span className="text-[10px] text-slate-300 block">S пола общая:</span>
              <span className="font-extrabold text-white text-sm">
                {summary.totalFloor} м²
              </span>
            </div>

            <div className="bg-white/10 rounded-lg p-1.5">
              <span className="text-[10px] text-slate-300 block">S стен чистая:</span>
              <span className="font-extrabold text-emerald-300 text-sm">
                {summary.totalWallNet} м²
              </span>
            </div>
          </div>

          {onNavigateToEstimate && (
            <button
              type="button"
              onClick={onNavigateToEstimate}
              className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
            >
              <span>Перейти к расчету сметы</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
