import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Check, 
  Sparkles, 
  Building2, 
  DoorClosed, 
  Square,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { 
  ImportedRoomData, 
  createImportedRoom, 
  convertImportedRoomsToCadRooms,
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

  useEffect(() => {
    if (isOpen) {
      if (detectedRooms && detectedRooms.length > 0) {
        setEditableRooms(JSON.parse(JSON.stringify(detectedRooms)));
      } else {
        setEditableRooms([]);
      }
    }
  }, [isOpen, detectedRooms]);

  if (!isOpen) return null;

  const handleUpdateRoom = (id: string, updates: Partial<ImportedRoomData>) => {
    setEditableRooms(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, ...updates };

      // Если изменилась площадь и периметр не был задан вручную
      if ('floorArea' in updates && updates.floorArea !== undefined) {
        const area = Math.max(0, updates.floorArea);
        updated.floorArea = area;
        if (updated.perimeter === 0 || !updated.perimeter) {
          updated.perimeter = area > 0 ? estimatePerimeterFromArea(area) : 0;
        }
      }

      // Пересчет чистой площади стен
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
    onApplyToSurvey(editableRooms);
    onClose();
  };

  const totalArea = editableRooms.reduce((sum, r) => sum + (r.floorArea || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Шапка модального окна */}
        <div className="p-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-800 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-extrabold flex items-center gap-2">
                <span>Распознанные помещения с чертежа</span>
                <span className="text-xs font-mono font-bold bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full">
                  {editableRooms.length} комнат
                </span>
              </h2>
              <p className="text-xs text-blue-100">
                Чертёж загружен как фоновая подложка. Проверьте экспликацию, отредактируйте данные и перенесите в раздел «Обмер».
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="Закрыть окно"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Список / Таблица распознанных комнат */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-50">
          {editableRooms.length === 0 ? (
            <div className="p-8 text-center text-slate-500 space-y-2 bg-white rounded-xl border border-dashed border-slate-300">
              <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-700">Текст комнат не обнаружен автоматически</p>
              <p className="text-xs text-slate-400">
                Вы можете добавить помещения вручную кнопкой ниже или ввести их прямо в разделе «1. Обмер».
              </p>
              <button
                type="button"
                onClick={handleAddRoom}
                className="mt-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Добавить помещение</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 px-3 py-1 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                <span className="col-span-1 text-center">№</span>
                <span className="col-span-4">Название помещения</span>
                <span className="col-span-2 text-center">S пола (м²)</span>
                <span className="col-span-2 text-center">Высота H (м)</span>
                <span className="col-span-2 text-center">Двери / Окна</span>
                <span className="col-span-1 text-center">Удалить</span>
              </div>

              {editableRooms.map((room, idx) => (
                <div 
                  key={room.id}
                  className="grid grid-cols-12 gap-2 items-center p-2.5 bg-white rounded-xl border border-slate-200 hover:border-blue-400 shadow-2xs transition-all"
                >
                  {/* № */}
                  <div className="col-span-1 text-center font-mono font-bold text-xs text-slate-600">
                    #{idx + 1}
                  </div>

                  {/* Название */}
                  <div className="col-span-4 flex items-center gap-1.5">
                    <input
                      type="text"
                      value={room.name}
                      onChange={e => handleUpdateRoom(room.id, { name: e.target.value })}
                      className="w-full px-2.5 py-1 text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-lg focus:outline-none transition-colors"
                      placeholder="Название комнаты..."
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdateRoom(room.id, { isWet: !room.isWet })}
                      className={`px-1.5 py-1 rounded text-[10px] font-bold shrink-0 transition-colors cursor-pointer ${
                        room.isWet ? 'bg-cyan-100 text-cyan-800 border border-cyan-300' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                      title={room.isWet ? 'Мокрая зона (плитка/гидроизоляция)' : 'Сделать мокрой зоной'}
                    >
                      💧
                    </button>
                  </div>

                  {/* S пола */}
                  <div className="col-span-2 flex items-center justify-center">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={room.floorArea === 0 ? '' : room.floorArea}
                      placeholder="0.00"
                      onChange={e => handleUpdateRoom(room.id, { floorArea: parseFloat(e.target.value) || 0 })}
                      className="w-20 text-center font-mono font-bold text-xs text-blue-700 bg-blue-50/60 border border-blue-200 rounded-lg py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Высота H */}
                  <div className="col-span-2 flex items-center justify-center">
                    <input
                      type="number"
                      step="0.05"
                      min="1.8"
                      max="6.0"
                      value={room.ceilingHeight || globalCeilingHeight}
                      onChange={e => handleUpdateRoom(room.id, { ceilingHeight: parseFloat(e.target.value) || globalCeilingHeight })}
                      className="w-16 text-center font-mono font-bold text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Двери / Окна */}
                  <div className="col-span-2 flex items-center justify-center gap-1.5 text-xs">
                    <div className="flex items-center gap-1 bg-slate-50 px-1.5 py-1 rounded border border-slate-200" title="Количество дверей">
                      <DoorClosed className="w-3.5 h-3.5 text-amber-700" />
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={room.doorsCount}
                        onChange={e => handleUpdateRoom(room.id, { doorsCount: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="w-7 text-center font-mono font-bold bg-transparent focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1 bg-slate-50 px-1.5 py-1 rounded border border-slate-200" title="Количество окон">
                      <Square className="w-3.5 h-3.5 text-blue-700" />
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={room.windowsCount}
                        onChange={e => handleUpdateRoom(room.id, { windowsCount: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="w-7 text-center font-mono font-bold bg-transparent focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Удалить */}
                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteRoom(room.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Удалить строку"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleAddRoom}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-600" />
                  <span>+ Добавить помещение</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Подвал с итогами и кнопками действий */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0 shadow-lg">
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="font-sans font-bold text-slate-700">ИТОГО:</span>
            <span>Помещений: <b className="text-slate-900">{editableRooms.length}</b></span>
            <span>Общая площадь S: <b className="text-blue-700 text-sm">{totalArea.toFixed(2)} м²</b></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Отмена
            </button>

            <button
              type="button"
              onClick={handleApply}
              disabled={editableRooms.length === 0}
              className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-98"
            >
              <Check className="w-4 h-4" />
              <span>📥 Перенести в раздел «Обмер»</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
