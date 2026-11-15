import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Check, 
  Sparkles, 
  DoorClosed, 
  Square,
  ArrowRight,
  AlertCircle,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { 
  ImportedRoomData, 
  createImportedRoom, 
  estimatePerimeterFromArea
} from '../cad/roomDataSheet';

interface DetectedRoomsModalProps {
  isOpen: boolean;
  onClose: () => void;
  detectedRooms: ImportedRoomData[];
  onApplyToSurvey: (rooms: ImportedRoomData[]) => void;
  globalCeilingHeight: number;
}

export const DetectedRoomsModal: React.FC<DetectedRoomsModalProps> = ({
  isOpen,
  onClose,
  detectedRooms,
  onApplyToSurvey,
  globalCeilingHeight
}) => {
  const [editableRooms, setEditableRooms] = useState<ImportedRoomData[]>([]);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      if (detectedRooms && detectedRooms.length > 0) {
        setEditableRooms(JSON.parse(JSON.stringify(detectedRooms)));
      } else {
        setEditableRooms([]);
      }
      setIsMinimized(false);
    }
  }, [isOpen, detectedRooms]);

  if (!isOpen) return null;

  const handleUpdateRoom = (id: string, updates: Partial<ImportedRoomData>) => {
    setEditableRooms(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, ...updates };

      if ('floorArea' in updates && updates.floorArea !== undefined) {
        const area = Math.max(0, updates.floorArea);
        updated.floorArea = area;
        if (updated.perimeter === 0 || !updated.perimeter) {
          updated.perimeter = area > 0 ? estimatePerimeterFromArea(area) : 0;
        }
      }

      const perim = updated.perimeter || (updated.floorArea > 0 ? estimatePerimeterFromArea(updated.floorArea) : 0);
      const gross = perim * (updated.ceilingHeight || globalCeilingHeight);
      const doorsArea = (updated.doorsCount || 0) * (updated.doorWidth || 0.8) * (updated.doorHeight || 2.05);
      const winsArea = (updated.windowsCount || 0) * (updated.windowWidth || 1.4) * (updated.windowHeight || 1.4);
      const net = Math.max(0, gross - (doorsArea + winsArea));

      updated.wallGrossArea = Number(gross.toFixed(2));
      updated.openingsTotalArea = Number((doorsArea + winsArea).toFixed(2));
      updated.wallNetArea = Number(net.toFixed(2));

      return updated;
    }));
  };

  const handleAddRoom = () => {
    const newRoom = createImportedRoom({
      name: `Помещение ${editableRooms.length + 1}`,
      floorArea: 0,
      perimeter: 0,
      ceilingHeight: globalCeilingHeight,
      doorsCount: 1,
      doorWidth: 0.80,
      windowsCount: 1,
      windowWidth: 1.40,
      windowHeight: 1.40
    });
    setEditableRooms(prev => [...prev, newRoom]);
  };

  const handleDeleteRoom = (id: string) => {
    setEditableRooms(prev => prev.filter(r => r.id !== id));
  };

  const handleApply = () => {
    try {
      localStorage.setItem('estimate_cad_imported_rooms', JSON.stringify(editableRooms));
    } catch {}

    // Извлекаем высоту потолков из переносимых комнат
    const foundHeight = editableRooms.find(r => r.ceilingHeight && Number(r.ceilingHeight) > 0)?.ceilingHeight;
    if (foundHeight) {
      const hNum = Number(Number(foundHeight).toFixed(2));
      try {
        localStorage.setItem('estimate_cad_ceiling_height', JSON.stringify(hNum));
      } catch {}
      window.dispatchEvent(new CustomEvent('estimate_cad_ceiling_height_updated', { detail: hNum }));
    }

    window.dispatchEvent(new CustomEvent('estimate_cad_rooms_transferred', { detail: editableRooms }));
    onApplyToSurvey(editableRooms);
    onClose();
  };

  const totalArea = editableRooms.reduce((sum, r) => sum + (r.floorArea || 0), 0);

  if (isMinimized) {
    return (
      <div className="fixed right-3 top-16 z-40 animate-in fade-in">
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white rounded-2xl shadow-xl border border-white/20 font-bold text-xs cursor-pointer transition-all hover:scale-102"
          title="Развернуть окно экспликации комнат"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Экспликация: {editableRooms.length} комн. ({totalArea.toFixed(1)} м²)</span>
          <Maximize2 className="w-3.5 h-3.5 text-blue-200" />
        </button>
      </div>
    );
  }

  return (
    <aside 
      className="fixed right-3 top-14 bottom-3 w-[470px] max-w-[calc(100vw-24px)] z-40 flex flex-col pointer-events-auto select-none animate-in slide-in-from-right-4 duration-200"
      aria-label="Распознанные помещения с чертежа"
    >
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-300 flex-1 flex flex-col overflow-hidden">
        {/* Шапка боковой панели */}
        <div className="p-3.5 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-800 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-white">Экспликация с чертежа</h2>
                <span className="text-[11px] font-mono font-bold bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full">
                  {editableRooms.length} комн.
                </span>
              </div>
              <p className="text-[10px] text-blue-100">
                Чертите стены по чертежу или перенесите данные в «Обмер»
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="Свернуть окно"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="Закрыть окно"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Список / Таблица распознанных комнат */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/80">
          {editableRooms.length === 0 ? (
            <div className="p-6 text-center text-slate-500 space-y-2 bg-white rounded-xl border border-dashed border-slate-300">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-semibold text-xs text-slate-700">Текст комнат не обнаружен</p>
              <p className="text-[11px] text-slate-400">
                Вы можете добавить помещения вручную кнопкой ниже.
              </p>
              <button
                type="button"
                onClick={handleAddRoom}
                className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Добавить помещение</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2 select-text">
              {editableRooms.map((room, idx) => (
                <div 
                  key={room.id}
                  className="p-2.5 bg-white rounded-xl border border-slate-200 hover:border-blue-400 shadow-2xs space-y-2 transition-all"
                >
                  {/* Верхняя строчка: №, Название, Мокрая зона, Удалить */}
                  <div className="flex items-center gap-1.5">
                    <span className="w-6 text-center font-mono font-bold text-xs text-slate-400 shrink-0">
                      #{idx + 1}
                    </span>
                    <input
                      type="text"
                      value={room.name}
                      onChange={e => handleUpdateRoom(room.id, { name: e.target.value })}
                      className="flex-1 px-2.5 py-1 text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-lg focus:outline-none transition-colors"
                      placeholder="Название комнаты..."
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdateRoom(room.id, { isWet: !room.isWet })}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 transition-colors cursor-pointer ${
                        room.isWet ? 'bg-cyan-100 text-cyan-800 border border-cyan-300' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                      title={room.isWet ? 'Мокрая зона (плитка/гидроизоляция)' : 'Сделать мокрой зоной'}
                    >
                      {room.isWet ? '💧 Мокрая' : 'Сухая'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRoom(room.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Удалить строку"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Нижняя строчка: S пола, H потолка, Двери, Окна */}
                  <div className="grid grid-cols-4 gap-1.5 text-xs">
                    {/* S пола */}
                    <div className="flex items-center justify-between bg-blue-50/70 border border-blue-200/80 px-2 py-1 rounded-lg">
                      <span className="text-[10px] font-bold text-blue-800">S:</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={room.floorArea === 0 ? '' : room.floorArea}
                        placeholder="0.00"
                        onChange={e => handleUpdateRoom(room.id, { floorArea: parseFloat(e.target.value) || 0 })}
                        className="w-14 text-center font-mono font-bold text-xs text-blue-800 bg-transparent focus:outline-none"
                      />
                      <span className="text-[10px] font-bold text-blue-600">м²</span>
                    </div>

                    {/* H потолка */}
                    <div className="flex items-center justify-between bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
                      <span className="text-[10px] font-bold text-slate-500">H:</span>
                      <input
                        type="number"
                        step="0.05"
                        min="1.8"
                        max="6.0"
                        value={room.ceilingHeight || globalCeilingHeight}
                        onChange={e => handleUpdateRoom(room.id, { ceilingHeight: parseFloat(e.target.value) || globalCeilingHeight })}
                        className="w-10 text-center font-mono font-bold text-xs text-slate-800 bg-transparent focus:outline-none"
                      />
                      <span className="text-[10px] font-bold text-slate-400">м</span>
                    </div>

                    {/* Двери */}
                    <div className="flex items-center justify-between bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg" title="Количество дверей">
                      <DoorClosed className="w-3 h-3 text-amber-700 shrink-0" />
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={room.doorsCount}
                        onChange={e => handleUpdateRoom(room.id, { doorsCount: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="w-8 text-center font-mono font-bold text-xs bg-transparent focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-400">дв</span>
                    </div>

                    {/* Окна */}
                    <div className="flex items-center justify-between bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg" title="Количество окон">
                      <Square className="w-3 h-3 text-blue-700 shrink-0" />
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={room.windowsCount}
                        onChange={e => handleUpdateRoom(room.id, { windowsCount: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="w-8 text-center font-mono font-bold text-xs bg-transparent focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-400">ок</span>
                    </div>
                  </div>
                </div>
              ))}

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleAddRoom}
                  className="w-full py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-dashed border-slate-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-600" />
                  <span>Добавить помещение</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Подвал с итогами и кнопками действий */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between shrink-0 shadow-lg gap-2">
          <div className="flex flex-col text-[11px] font-mono leading-tight">
            <span className="text-slate-500 font-sans">ИТОГО:</span>
            <span className="text-slate-900 font-bold">
              {editableRooms.length} комн. · <b className="text-blue-700">{totalArea.toFixed(2)} м²</b>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Закрыть
            </button>

            <button
              type="button"
              onClick={handleApply}
              disabled={editableRooms.length === 0}
              className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-98"
              title="Перенести все помещения в раздел «1. Обмер»"
            >
              <Check className="w-4 h-4" />
              <span>Перенести в «Обмер»</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
