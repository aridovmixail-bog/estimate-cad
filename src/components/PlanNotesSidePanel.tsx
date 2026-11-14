import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Copy, 
  Check, 
  X, 
  Minus, 
  Edit3, 
  Layers, 
  Save, 
  RotateCcw, 
  Plus, 
  CheckCircle2, 
  Ruler, 
  Home, 
  Columns,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  GripHorizontal
} from 'lucide-react';
import { Room, Wall } from '../cad/types';
import { BlueprintImageReader } from './BlueprintImageReader';
import { CadVectorPreview } from './CadVectorPreview';

export interface PlanNotesSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  detectedTextNotes: string[];
  rawSummary?: string;
  detectedWallsCount?: number;
  detectedRoomsCount?: number;
  rooms?: Room[];
  walls?: Wall[];
  manualDimOffsets?: Record<string, { x: number; y: number }>;
  onUpdateManualDimOffsets?: (offsets: Record<string, { x: number; y: number }>) => void;
  onUpdateRooms?: (updatedRooms: Room[]) => void;
  onUpdateWalls?: (updatedWalls: Wall[]) => void;
  onNotesChange?: (notes: string[]) => void;
  blueprintImageUrl?: string | null;
  blueprintName?: string;
  useCalqueMode?: boolean;
  onApplyToCanvas?: (updatedWalls?: Wall[], updatedOffsets?: Record<string, { x: number; y: number }>) => void;
}

export const PlanNotesSidePanel: React.FC<PlanNotesSidePanelProps> = ({
  isOpen,
  onClose,
  detectedTextNotes,
  rawSummary = '',
  detectedWallsCount = 0,
  detectedRoomsCount = 0,
  rooms = [],
  walls = [],
  manualDimOffsets,
  onUpdateManualDimOffsets,
  onUpdateRooms,
  onUpdateWalls,
  onNotesChange,
  blueprintImageUrl = null,
  blueprintName = 'Обмерный план',
  useCalqueMode = false,
  onApplyToCanvas,
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isMaximized, setIsMaximized] = useState<boolean>(true);
  const [activeRightTab, setActiveRightTab] = useState<'cad' | 'editor' | 'cards'>('cad');
  const [copied, setCopied] = useState<boolean>(false);
  const [savedFeedback, setSavedFeedback] = useState<boolean>(false);

  // Режим отображения: 'split' (чертёж слева + CAD/блокнот справа) или 'notes'
  const [viewMode, setViewMode] = useState<'split' | 'notes'>(() => {
    return blueprintImageUrl ? 'split' : 'notes';
  });

  // Соотношение сплита: процент ширины левой створки с чертежом (по умолчанию 50%)
  const [splitRatio, setSplitRatio] = useState<number>(50);
  const [isResizingSplit, setIsResizingSplit] = useState<boolean>(false);

  // Координаты окна для свободного перетаскивания (если null — центрируется)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingWindow, setIsDraggingWindow] = useState<boolean>(false);
  const dragOffsetRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0
  });

  // Автоматическое включение сплит-режима и разворот на весь экран при появлении изображения чертежа
  useEffect(() => {
    if (blueprintImageUrl) {
      setViewMode('split');
      setIsMinimized(false);
      setIsMaximized(true);
      if (walls && walls.length > 0) {
        setActiveRightTab('cad');
      }
    }
  }, [blueprintImageUrl, walls]);

  // Живой редактируемый текст блокнота
  const [textContent, setTextContent] = useState<string>(() => {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('estimate_cad_notes') : null;
    if (saved && saved.trim().length > 0) return saved;
    return detectedTextNotes.join('\n');
  });

  // Синхронизация при загрузке новых заметок из распознавания
  useEffect(() => {
    if (detectedTextNotes.length > 0) {
      const formatted = detectedTextNotes.join('\n');
      setTextContent(formatted);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('estimate_cad_notes', formatted);
      }
      setIsMinimized(false);
    }
  }, [detectedTextNotes]);

  // Обработка перетаскивания окна за заголовок
  const handleHeaderMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, input, textarea, a, select')) return;
    if (isMaximized) return;

    const modalEl = document.getElementById('cad-plan-notes-modal');
    if (!modalEl) return;
    const rect = modalEl.getBoundingClientRect();

    setIsDraggingWindow(true);
    dragOffsetRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: rect.left,
      initialY: rect.top
    };
  };

  // Глобальные слушатели движения мыши при перетаскивании или ресайзе сплита
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingWindow && !isMaximized) {
        const dx = e.clientX - dragOffsetRef.current.startX;
        const dy = e.clientY - dragOffsetRef.current.startY;
        const newX = Math.max(10, Math.min(window.innerWidth - 300, dragOffsetRef.current.initialX + dx));
        const newY = Math.max(10, Math.min(window.innerHeight - 150, dragOffsetRef.current.initialY + dy));
        setPosition({ x: newX, y: newY });
      }

      if (isResizingSplit) {
        const modalEl = document.getElementById('cad-plan-notes-modal');
        if (!modalEl) return;
        const rect = modalEl.getBoundingClientRect();
        const relativeX = e.clientX - rect.left;
        const newRatio = (relativeX / rect.width) * 100;
        setSplitRatio(Math.min(Math.max(25, newRatio), 75));
      }
    };

    const handleMouseUp = () => {
      setIsDraggingWindow(false);
      setIsResizingSplit(false);
    };

    if (isDraggingWindow || isResizingSplit) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingWindow, isResizingSplit, isMaximized]);

  if (!isOpen) return null;

  const isSplitActive = viewMode === 'split' && Boolean(blueprintImageUrl);

  // Если окно свернуто в компактный ярлык
  if (isMinimized) {
    return (
      <div 
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-14 right-6 z-50 bg-white/95 backdrop-blur-md border border-teal-400 text-slate-800 rounded-xl px-4 py-2.5 shadow-2xl flex items-center gap-3 cursor-pointer hover:bg-teal-50 transition-all hover:scale-105 select-none animate-in fade-in slide-in-from-bottom-4"
        title="Кликните, чтобы развернуть окно сравнения чертежа и заметок"
      >
        <div className="p-2 rounded-lg bg-teal-100 text-teal-700">
          {isSplitActive ? <Columns className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            {isSplitActive ? '🖼️ Чертёж + Заметки' : '📝 Заметки замерщика'}
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-teal-100 text-teal-800 font-semibold">
              {textContent.split('\n').filter(l => l.trim().length > 0).length}
            </span>
          </span>
          <span className="text-[10px] text-teal-600 font-medium">Развернуть по центру ↗</span>
        </div>
      </div>
    );
  }

  // Копирование всего текста
  const handleCopyAll = () => {
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  // Копирование отдельного фрагмента
  const handleCopySnippet = (snippet: string) => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Сохранение текста
  const handleSave = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('estimate_cad_notes', textContent);
    }
    const lines = textContent.split('\n').map(l => l.trim()).filter(Boolean);
    if (onNotesChange) {
      onNotesChange(lines);
    }
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  // Сброс к исходно распознанным строкам
  const handleResetToRecognized = () => {
    const raw = detectedTextNotes.join('\n');
    setTextContent(raw);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('estimate_cad_notes', raw);
    }
  };

  // Быстрая вставка шаблона в редактор
  const handleInsertTemplate = (tpl: string) => {
    setTextContent(prev => {
      const next = prev.trim() + '\n' + tpl;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('estimate_cad_notes', next);
      }
      return next;
    });
  };

  // Разбор текста на категории для карточек
  const lines = textContent.split('\n').map(l => l.trim()).filter(Boolean);
  const roomCalculations = lines.filter(l => 
    /комн|спальн|кухн|гостин|санузел|ванн|туалет|коридор|прихож|холл|лоджи|балкон|s\s*=|sобщ|всего|площадь/i.test(l) &&
    /(\d+[.,]\d+|\d+)/.test(l)
  );
  const dimensionNotes = lines.filter(l => 
    /h\s*=|высот|толщин|стена|перегородк|простенок|размер|мм|см|окно|дверь|проем/i.test(l) && 
    !roomCalculations.includes(l)
  );
  const otherNotes = lines.filter(l => !roomCalculations.includes(l) && !dimensionNotes.includes(l));

  const totalLinesCount = lines.length;

  // Динамические стили позиционирования и размера
  const getModalStyle = (): React.CSSProperties => {
    if (isMaximized) {
      return {
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        borderRadius: 0,
        zIndex: 50
      };
    }

    if (position) {
      return {
        top: `${position.y}px`,
        left: `${position.x}px`,
        width: isSplitActive ? 'min(96vw, 1820px)' : 'min(90vw, 720px)',
        height: 'min(92vh, 960px)',
        zIndex: 50
      };
    }

    // По умолчанию: строго по центру экрана на всю удобную область
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: isSplitActive ? 'min(96vw, 1820px)' : 'min(90vw, 720px)',
      height: 'min(92vh, 960px)',
      zIndex: 50
    };
  };

  return (
    <>
      {/* Мягкий затемненный фон для концентрации на сверке плана */}
      <div 
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-[1px] z-40 transition-opacity"
        onClick={() => {}}
      />

      <aside 
        id="cad-plan-notes-modal"
        style={{ 
          ...getModalStyle(),
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.5), 0 0 0 1px rgba(203, 213, 225, 0.8)' 
        }}
        className={`fixed flex flex-col bg-white border border-slate-300 ${
          isMaximized ? 'rounded-none' : 'rounded-2xl'
        } shadow-2xl overflow-hidden text-slate-800 ${
          isDraggingWindow || isResizingSplit ? 'transition-none select-none' : 'transition-[width,height,border-radius] duration-150'
        } pointer-events-auto`}
      >
        {/* 1. Верхний заголовок: Перетаскивание за заголовок (Drag-by-Header), кнопки режимов и закрытия */}
        <div 
          onMouseDown={handleHeaderMouseDown}
          onDoubleClick={() => setIsMaximized(prev => !prev)}
          className={`px-4 py-2.5 bg-gradient-to-r from-slate-50 via-teal-50/50 to-slate-100 border-b border-slate-200 flex items-center justify-between select-none shrink-0 ${
            isMaximized ? '' : 'cursor-grab active:cursor-grabbing'
          }`}
          title="Зажмите ЛКМ на шапке для свободного перемещения по экрану. Двойной клик — развернуть / восстановить."
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Иконка перетаскивания */}
            {!isMaximized && (
              <div className="text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing pr-1">
                <GripHorizontal className="w-4 h-4" />
              </div>
            )}
            
            <div className="p-1.5 rounded-xl bg-teal-100 text-teal-800 border border-teal-200 shrink-0">
              {isSplitActive ? <Columns className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            </div>
            
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 truncate">
                <span>{isSplitActive ? 'Сравнение: Оригинал плана ➔ Что получилось в CAD' : 'Заметки и экспликация'}</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-teal-100 text-teal-800 border border-teal-200 shrink-0">
                  {totalLinesCount} строк
                </span>
                {!isMaximized && (
                  <span className="text-[10px] text-slate-400 font-normal hidden md:inline">
                    (Перетаскивайте окно за шапку)
                  </span>
                )}
              </h3>
              <p className="text-[10px] text-slate-500 truncate">
                {isSplitActive 
                  ? 'Слева оригинальный скан с зумом и контрастом, справа векторный CAD-чертёж с компактными размерами ГОСТ' 
                  : 'Рукописные расчеты, размеры комнат и примечания'}
              </p>
            </div>
          </div>

          {/* Правая панель кнопок: Применить, Сплит, Копировать, Полный экран, Свернуть, Закрыть */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Большая зеленая кнопка подтверждения переноса на рабочий холст */}
            <button
              type="button"
              onClick={() => {
                if (onApplyToCanvas) onApplyToCanvas();
                else onClose();
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer transition-all hover:scale-102 active:scale-98"
              title="Зафиксировать и перенести полученный векторный чертёж на рабочий холст"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-100" />
              <span>Применить на холст</span>
            </button>
            {/* Переключатель сплит-режима */}
            {blueprintImageUrl && (
              <button
                type="button"
                onClick={() => setViewMode(prev => prev === 'split' ? 'notes' : 'split')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSplitActive
                    ? 'bg-teal-700 text-white shadow-sm hover:bg-teal-800'
                    : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300'
                }`}
                title={isSplitActive ? "Скрыть чертёж (оставить только блокнот)" : "Показать скан чертежа слева для сверки цифр"}
              >
                {isSplitActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{isSplitActive ? 'Только заметки' : '🖼️ Сравнить с чертежом'}</span>
              </button>
            )}

            {/* Быстрое копирование */}
            <button
              type="button"
              onClick={handleCopyAll}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                copied 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs cursor-pointer'
              }`}
              title="Скопировать весь текст заметок в буфер"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
              <span className="hidden sm:inline">{copied ? 'Скопировано!' : 'Копировать'}</span>
            </button>

            {/* Центрировать окно (если было перемещено вручную) */}
            {position && !isMaximized && (
              <button
                type="button"
                onClick={() => setPosition(null)}
                className="px-2 py-1 text-slate-500 hover:text-teal-700 hover:bg-teal-50 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Вернуть окно строго по центру экрана"
              >
                <span>По центру</span>
              </button>
            )}

            {/* Развернуть на весь экран / Восстановить */}
            <button
              type="button"
              onClick={() => setIsMaximized(prev => !prev)}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
              title={isMaximized ? "Восстановить окно" : "Развернуть на весь экран"}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Свернуть в ярлык */}
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
              title="Свернуть окно в ярлык в углу"
            >
              <Minus className="w-4 h-4" />
            </button>

            {/* Закрыть */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="Закрыть окно"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. ОСНОВНОЙ КОНТЕНТ: Двухстворчатый сплит-экран */}
        <div className="flex-1 flex overflow-hidden min-h-0 relative">
          {/* Левая створка: Читаемый оригинальный план с зумом и инструментами читаемости */}
          {isSplitActive && (
            <div 
              style={{ width: `${splitRatio}%` }}
              className="h-full flex flex-col shrink-0 overflow-hidden"
            >
              <BlueprintImageReader
                imageUrl={blueprintImageUrl}
                imageTitle={blueprintName}
              />
            </div>
          )}

          {/* Интерактивный разделитель колонок (Split Resizer) */}
          {isSplitActive && (
            <div
              onMouseDown={() => setIsResizingSplit(true)}
              className={`w-2 bg-slate-200 hover:bg-teal-500 cursor-col-resize transition-colors flex items-center justify-center relative select-none shrink-0 z-20 group ${
                isResizingSplit ? 'bg-teal-600' : ''
              }`}
              title="Потяните влево или вправо, чтобы изменить ширину чертежа и блокнота"
            >
              <div className="w-0.5 h-8 bg-slate-400 group-hover:bg-white rounded-full" />
            </div>
          )}

          {/* Правая створка: Блокнот, формулы и экспликация */}
          <div 
            style={{ width: isSplitActive ? `${100 - splitRatio}%` : '100%' }}
            className="h-full flex flex-col min-w-0 bg-white"
          >
            {/* Подзаголовок: переключатель вкладок (CAD-предпросмотр / Блокнот / Карточки) */}
            <div className="px-4 py-2 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1.5 bg-white p-0.5 rounded-lg border border-slate-300 text-xs shadow-2xs">
                {walls && walls.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveRightTab('cad')}
                    className={`px-3 py-1 rounded-md font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                      activeRightTab === 'cad'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>📐 CAD (Что получилось)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveRightTab('editor')}
                  className={`px-3 py-1 rounded-md font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeRightTab === 'editor'
                      ? 'bg-teal-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>📝 Блокнот</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveRightTab('cards')}
                  className={`px-3 py-1 rounded-md font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeRightTab === 'cards'
                      ? 'bg-teal-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Экспликация ({roomCalculations.length})</span>
                </button>
              </div>

              <div className="text-xs text-slate-600 font-mono truncate pl-2">
                {detectedWallsCount > 0 ? (
                  <>CAD: <b className="text-slate-900">{detectedWallsCount} стен</b> | <b className="text-slate-900">{detectedRoomsCount || rooms.length} комнат</b></>
                ) : (
                  <span className="text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    Режим кальки (подложка готова к обводке)
                  </span>
                )}
              </div>
            </div>

            {/* Тело правой створки: Либо интерактивный CAD-чертёж, либо Редактор/Карточки */}
            {activeRightTab === 'cad' && ((walls && walls.length > 0) || blueprintImageUrl) ? (
              <div className="flex-1 min-h-0 relative">
                <CadVectorPreview
                  walls={walls}
                  rooms={rooms}
                  blueprintName={blueprintName}
                  blueprintImageUrl={blueprintImageUrl}
                  useCalqueMode={useCalqueMode}
                  initialManualDimOffsets={manualDimOffsets}
                  onUpdateManualDimOffsets={onUpdateManualDimOffsets}
                  onUpdateWalls={onUpdateWalls}
                  onUpdateRooms={onUpdateRooms}
                  onApplyToCanvas={(edited, offsets) => {
                    if (edited && onUpdateWalls) {
                      onUpdateWalls(edited);
                    }
                    if (offsets && onUpdateManualDimOffsets) {
                      onUpdateManualDimOffsets(offsets);
                    }
                    if (onApplyToCanvas) {
                      onApplyToCanvas(edited, offsets);
                    } else {
                      onClose();
                    }
                  }}
                />
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans text-xs">
                  {activeRightTab === 'editor' ? (
                /* ================= ВКЛАДКА 1: ЖИВОЙ РЕДАКТОР ================= */
                <div className="flex flex-col h-full space-y-2.5">
                  {/* Панель быстрых вставок */}
                  <div className="flex items-center gap-1.5 flex-wrap text-xs">
                    <span className="text-slate-400 font-medium">Быстро:</span>
                    <button
                      type="button"
                      onClick={() => handleInsertTemplate('• h = 2.70 м (высота потолка)')}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 cursor-pointer font-medium"
                    >
                      + h=2.70м
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertTemplate('• Перегородки: 100 мм (ГКЛ/пеноблок)')}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 cursor-pointer font-medium"
                    >
                      + Толщины стен
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertTemplate('• Вентканал / Короб: без дверей и окон')}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 cursor-pointer font-medium"
                    >
                      + Вентканал
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertTemplate('• Двери: 800х2050 мм (полотно)')}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 cursor-pointer font-medium"
                    >
                      + Двери
                    </button>
                  </div>

                  {/* Редактируемое поле текста */}
                  <div className="flex-1 flex flex-col min-h-[260px]">
                    <textarea
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      placeholder="Здесь отображаются все распознанные рукописные формулы, размеры и примечания с чертежа..."
                      className="w-full flex-1 p-3.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200/50 outline-none font-mono text-xs text-slate-800 leading-relaxed resize-none shadow-inner"
                    />
                  </div>

                  {/* Сводка распознавания */}
                  {rawSummary && (
                    <div className="p-3 bg-teal-50/70 rounded-xl border border-teal-200 text-xs text-teal-900 flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-teal-950">Сводка распознавания:</div>
                        <div className="text-teal-800 mt-0.5">{rawSummary}</div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* ================= ВКЛАДКА 2: ФОРМАТИРОВАННЫЕ КАРТОЧКИ ================= */
                <div className="space-y-4">
                  {/* ИНТЕРАКТИВНАЯ ТАБЛИЦА СМЕТЫ И ПАСПОРТОВ КОМНАТ */}
                  {rooms && rooms.length > 0 && (
                    <div className="bg-white rounded-xl border border-teal-200 overflow-hidden shadow-2xs mb-3">
                      <div className="px-4 py-2.5 bg-gradient-to-r from-teal-50 via-emerald-50/70 to-slate-50 border-b border-teal-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Home className="w-4 h-4 text-teal-700" />
                          <span className="font-bold text-xs text-slate-800 uppercase tracking-wide">
                            Паспорт помещений (Авто-смета)
                          </span>
                        </div>
                        <span className="text-[11px] font-mono font-bold text-teal-800 bg-teal-100/90 px-2 py-0.5 rounded-full border border-teal-200">
                          {rooms.length} комнат | Sобщ: {rooms.reduce((s, r) => s + (r.floorArea || 0), 0).toFixed(2)} м²
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse font-sans">
                          <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              <th className="py-2 px-3">№ / Название</th>
                              <th className="py-2 px-3">S пола</th>
                              <th className="py-2 px-3">Периметр</th>
                              <th className="py-2 px-3">S стен под отделку</th>
                              <th className="py-2 px-3 text-right">Высота h</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                            {rooms.map((rm, idx) => {
                              const sSten = rm.wallGrossArea || Math.round((rm.perimeter || 0) * (rm.ceilingHeight || 2.70) * 100) / 100;
                              return (
                                <tr key={rm.id || idx} className="hover:bg-teal-50/50 transition-colors">
                                  <td className="py-2 px-3 font-sans font-semibold text-slate-800 flex items-center gap-2">
                                    <span className="w-4 h-4 rounded-full bg-teal-100 text-teal-800 text-[10px] font-mono flex items-center justify-center font-bold">
                                      {idx + 1}
                                    </span>
                                    <span>{rm.name}</span>
                                  </td>
                                  <td className="py-2 px-3 font-bold text-teal-700">
                                    {rm.floorArea.toFixed(2)} м²
                                  </td>
                                  <td className="py-2 px-3 text-slate-600">
                                    {rm.perimeter.toFixed(2)} м.п.
                                  </td>
                                  <td className="py-2 px-3 text-slate-800 font-semibold">
                                    {sSten.toFixed(2)} м²
                                  </td>
                                  <td className="py-2 px-3 text-right text-slate-500 font-mono">
                                    {(rm.ceilingHeight || 2.70).toFixed(2)} м
                                  </td>
                                </tr>
                              );
                            })}
                            <tr className="bg-slate-100/90 font-bold text-slate-900 border-t-2 border-slate-300">
                              <td className="py-2 px-3 font-sans">ИТОГО ПО КВАРТИРЕ:</td>
                              <td className="py-2 px-3 text-teal-800 font-extrabold">
                                {rooms.reduce((s, r) => s + (r.floorArea || 0), 0).toFixed(2)} м²
                              </td>
                              <td className="py-2 px-3 text-slate-800">
                                {rooms.reduce((s, r) => s + (r.perimeter || 0), 0).toFixed(2)} м.п.
                              </td>
                              <td className="py-2 px-3 text-slate-900">
                                {rooms.reduce((s, r) => s + (r.wallGrossArea || ((r.perimeter || 0) * (r.ceilingHeight || 2.70))), 0).toFixed(2)} м²
                              </td>
                              <td className="py-2 px-3 text-right text-teal-700 font-mono text-[10px] font-bold">100% ВЕДОМОСТЬ</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* 1. Группа: Расчеты площадей и формулы комнат */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <Home className="w-4 h-4 text-teal-600" />
                        <span>Расчеты комнат ({roomCalculations.length})</span>
                      </span>
                      {roomCalculations.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleCopySnippet(roomCalculations.join('\n'))}
                          className="text-teal-600 hover:text-teal-800 text-xs font-semibold cursor-pointer"
                        >
                          Копировать группу
                        </button>
                      )}
                    </div>

                    {roomCalculations.length > 0 ? (
                      <div className="grid grid-cols-1 gap-1.5">
                        {roomCalculations.map((calc, idx) => (
                          <div 
                            key={idx}
                            className="p-2.5 bg-slate-50 hover:bg-teal-50/50 rounded-xl border border-slate-200 hover:border-teal-300 text-xs flex items-center justify-between gap-2 transition-all shadow-2xs group"
                          >
                            <span className="font-mono text-slate-800 font-medium break-all flex-1">{calc}</span>
                            <button
                              type="button"
                              onClick={() => handleCopySnippet(calc)}
                              className="text-slate-400 group-hover:text-teal-600 p-1 hover:bg-white rounded cursor-pointer transition-colors"
                              title="Скопировать строку"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 rounded-xl text-center text-slate-400 text-xs">
                        Комнаты и формулы площадей не выделены
                      </div>
                    )}
                  </div>

                  {/* 2. Группа: Линейные размеры и высоты */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <Ruler className="w-4 h-4 text-blue-600" />
                        <span>Размеры и высоты ({dimensionNotes.length})</span>
                      </span>
                      {dimensionNotes.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleCopySnippet(dimensionNotes.join('\n'))}
                          className="text-blue-600 hover:text-blue-800 text-xs font-semibold cursor-pointer"
                        >
                          Копировать группу
                        </button>
                      )}
                    </div>

                    {dimensionNotes.length > 0 ? (
                      <div className="grid grid-cols-1 gap-1.5">
                        {dimensionNotes.map((dim, idx) => (
                          <div 
                            key={idx}
                            className="p-2.5 bg-slate-50 hover:bg-blue-50/50 rounded-xl border border-slate-200 hover:border-blue-300 text-xs flex items-center justify-between gap-2 transition-all shadow-2xs group"
                          >
                            <span className="font-mono text-slate-800 font-medium break-all flex-1">{dim}</span>
                            <button
                              type="button"
                              onClick={() => handleCopySnippet(dim)}
                              className="text-slate-400 group-hover:text-blue-600 p-1 hover:bg-white rounded cursor-pointer transition-colors"
                              title="Скопировать"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 rounded-xl text-center text-slate-400 text-xs">
                        Высоты и габариты не обнаружены
                      </div>
                    )}
                  </div>

                  {/* 3. Группа: Прочие примечания */}
                  {otherNotes.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Технические пометки ({otherNotes.length})
                      </div>
                      <div className="grid grid-cols-1 gap-1.5">
                        {otherNotes.map((on, idx) => (
                          <div 
                            key={idx}
                            className="p-2.5 bg-white/95 rounded-lg border border-amber-200/80 text-xs flex items-start justify-between gap-2 shadow-2xs hover:border-amber-400 transition-colors"
                          >
                            <span className="text-slate-800 break-words flex-1">{on}</span>
                            <button
                              type="button"
                              onClick={() => handleCopySnippet(on)}
                              className="text-slate-400 hover:text-amber-700 p-1 rounded cursor-pointer"
                              title="Скопировать"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Футер правой створки с кнопками сохранения и копирования */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleSave}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
                  savedFeedback
                    ? 'bg-emerald-600 text-white'
                    : 'bg-teal-600 hover:bg-teal-700 text-white cursor-pointer active:scale-98 shadow-teal-600/20'
                }`}
              >
                {savedFeedback ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                <span>{savedFeedback ? 'Сохранено!' : 'Сохранить изменения'}</span>
              </button>

              <button
                type="button"
                onClick={handleResetToRecognized}
                className="py-2.5 px-3.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Сбросить правки к исходно распознанным строкам"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Сброс</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  </aside>
</>
);
};
