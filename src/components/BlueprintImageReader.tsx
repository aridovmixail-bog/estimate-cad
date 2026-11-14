import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Maximize2, 
  Sun, 
  Contrast, 
  RefreshCw, 
  Move,
  FileImage,
  AlertCircle
} from 'lucide-react';

export interface BlueprintImageReaderProps {
  imageUrl?: string | null;
  imageTitle?: string;
  onClose?: () => void;
  className?: string;
}

export const BlueprintImageReader: React.FC<BlueprintImageReaderProps> = ({
  imageUrl,
  imageTitle = 'Оригинальный обмерный план',
  onClose,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Трансформации: масштаб, смещение, поворот
  const [scale, setScale] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270

  // Фильтры читаемости (карандаш, выцветшая ручка, пожелтевшая бумага)
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [invertColor, setInvertColor] = useState<boolean>(false);
  const [grayscale, setGrayscale] = useState<boolean>(false);

  // Состояние перетаскивания (Drag-to-Pan)
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialPanX: number; initialPanY: number }>({
    startX: 0,
    startY: 0,
    initialPanX: 0,
    initialPanY: 0
  });

  // Автоматический сброс вида и вписывание при смене картинки
  const handleResetView = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  }, []);

  useEffect(() => {
    handleResetView();
  }, [imageUrl, handleResetView]);

  // Зум колесиком мыши
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    setScale(prev => {
      const next = prev * zoomFactor;
      return Math.min(Math.max(0.2, next), 6.0); // от 20% до 600%
    });
  };

  // Старт перетаскивания
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 && e.button !== 1) return; // ЛКМ или СКМ
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialPanX: pan.x,
      initialPanY: pan.y
    };
  };

  // Перемещение мыши
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;
    setPan({
      x: dragStartRef.current.initialPanX + dx,
      y: dragStartRef.current.initialPanY + dy
    });
  };

  // Завершение перетаскивания
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Поворот на 90 градусов по часовой стрелке
  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  // Кнопки масштабирования
  const zoomIn = () => setScale(prev => Math.min(prev * 1.25, 6.0));
  const zoomOut = () => setScale(prev => Math.max(prev * 0.8, 0.2));
  const zoomActual = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  // Формирование CSS-фильтра для максимальной читаемости карандаша
  const getFilterStyle = () => {
    const filters: string[] = [];
    if (highContrast) {
      // Усиление контраста: делает бледный карандаш ярче и темнее
      filters.push('contrast(220%)', 'brightness(92%)');
    }
    if (grayscale) {
      filters.push('grayscale(100%)');
    }
    if (invertColor) {
      // Негатив: белый чертеж на темном фоне
      filters.push('invert(100%)', 'contrast(150%)');
    }
    return filters.length > 0 ? filters.join(' ') : 'none';
  };

  return (
    <div className={`flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden select-none border-r border-slate-700/80 ${className}`}>
      {/* 1. Верхний тулбар управления чертежом */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-800/95 border-b border-slate-700 text-xs shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded bg-teal-500/20 text-teal-300">
            <FileImage className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-slate-200 truncate" title={imageTitle}>
            {imageTitle}
          </span>
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-700/80 text-slate-300 font-medium">
            {Math.round(scale * 100)}%
          </span>
        </div>

        {/* Кнопки зума и поворота */}
        <div className="flex items-center gap-1">
          <button
            onClick={zoomIn}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Приблизить (Колесико мыши вверх)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={zoomOut}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Отдалить (Колесико мыши вниз)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={zoomActual}
            className="px-1.5 py-0.5 rounded hover:bg-slate-700 text-[10px] font-mono text-slate-300 hover:text-white transition-colors"
            title="Масштаб 1:1 (100%)"
          >
            1:1
          </button>
          <button
            onClick={handleResetView}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Вписать в окно и сбросить панораму"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />
          <button
            onClick={handleRotate}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1"
            title={`Повернуть на 90° (сейчас: ${rotation}°)`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            {rotation > 0 && <span className="text-[9px] font-mono">{rotation}°</span>}
          </button>
        </div>
      </div>

      {/* 2. Полоса инструментов улучшения читаемости (Контраст, Ч/Б, Негатив) */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/60 border-b border-slate-700/60 text-[11px] shrink-0">
        <span className="text-slate-400 flex items-center gap-1 text-[10px]">
          <Move className="w-3 h-3 text-slate-500" />
          Тяните мышью для панорамы
        </span>

        <div className="flex items-center gap-1">
          {/* Кнопка "Усилить карандаш / Контраст" */}
          <button
            onClick={() => setHighContrast(prev => !prev)}
            className={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 transition-all ${
              highContrast 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm' 
                : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300'
            }`}
            title="Увеличить контрастность карандашных линий и надписей"
          >
            <Contrast className="w-3 h-3" />
            Контраст {highContrast ? 'ON' : ''}
          </button>

          {/* Кнопка Ч/Б */}
          <button
            onClick={() => setGrayscale(prev => !prev)}
            className={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 transition-all ${
              grayscale 
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm' 
                : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300'
            }`}
            title="Убрать цветность (черно-белый режим)"
          >
            <Sun className="w-3 h-3" />
            Ч/Б
          </button>

          {/* Кнопка Инверсия (Негатив) */}
          <button
            onClick={() => setInvertColor(prev => !prev)}
            className={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 transition-all ${
              invertColor 
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm' 
                : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300'
            }`}
            title="Инвертировать цвета (белые линии на темном фоне)"
          >
            <RefreshCw className="w-3 h-3" />
            Негатив
          </button>
        </div>
      </div>

      {/* 3. Интерактивная зона просмотра с плавным Drag-and-Drop и Zoom */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative flex-1 w-full h-full overflow-hidden bg-slate-950 flex items-center justify-center ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{
          backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      >
        {imageUrl ? (
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.05s ease-out'
            }}
            className="inline-block shrink-0 max-w-none pointer-events-none"
          >
            <img
              src={imageUrl}
              alt="Оригинал обмерного плана"
              style={{
                filter: getFilterStyle(),
                maxWidth: '90%',
                maxHeight: '90%',
                objectFit: 'contain'
              }}
              className="rounded shadow-2xl border border-slate-700/60 block"
              draggable={false}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-500 p-6 text-center max-w-xs">
            <AlertCircle className="w-8 h-8 text-slate-600 mb-2" />
            <span className="text-xs font-medium text-slate-400">Изображение плана не загружено</span>
            <span className="text-[11px] text-slate-500 mt-1">
              Загрузите скан или фото чертежа во вкладке «Подложка плана», и он отобразится здесь для сверки цифр.
            </span>
          </div>
        )}

        {/* Плавающая плашка-подсказка внизу */}
        {imageUrl && (
          <div className="absolute bottom-2 left-2 z-10 bg-slate-900/80 backdrop-blur px-2.5 py-1 rounded text-[10px] text-slate-400 border border-slate-800 pointer-events-none flex items-center gap-1.5">
            <span>🔍 Колесико: зум</span>
            <span>•</span>
            <span>✋ Зажмите ЛКМ: двигать</span>
          </div>
        )}
      </div>
    </div>
  );
};
