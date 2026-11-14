import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  ZoomIn,
  Sparkles,
  Plus,
  Sliders, 
  ZoomOut, 
  Maximize2, 
  Ruler, 
  Layers, 
  Sun, 
  Moon, 
  CheckCircle2,
  RotateCcw,
  Move,
  Edit2,
  Check,
  X,
  Trash2,
  DoorOpen,
  Undo2
} from 'lucide-react';
import { Wall, Room, Point, Opening } from '../cad/types';
import { drawArchitecturalWallChains, DimHitBox } from '../cad/dimensions';

export interface CadVectorPreviewProps {
  walls: Wall[];
  rooms: Room[];
  blueprintName?: string;
  unit?: 'mm' | 'cm' | 'm';
  initialManualDimOffsets?: Record<string, { x: number; y: number }>;
  onUpdateManualDimOffsets?: (offsets: Record<string, { x: number; y: number }>) => void;
  onUpdateWalls?: (updatedWalls: Wall[]) => void;
  onUpdateRooms?: (updatedRooms: Room[]) => void;
  onApplyToCanvas?: (updatedWalls?: Wall[], updatedOffsets?: Record<string, { x: number; y: number }>, updatedRooms?: Room[]) => void;
  blueprintImageUrl?: string | null;
  useCalqueMode?: boolean;
}

export const CadVectorPreview: React.FC<CadVectorPreviewProps> = ({
  walls: initialWalls,
  rooms,
  blueprintName = 'Полученный CAD-чертёж',
  unit = 'mm',
  initialManualDimOffsets,
  onUpdateManualDimOffsets,
  onUpdateWalls,
  onUpdateRooms,
  onApplyToCanvas,
  blueprintImageUrl = null,
  useCalqueMode = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Режим кальки (чистый чертеж с бейджами комнат, без искажений и лабиринта стен)
  const isCalque = Boolean(useCalqueMode && initialWalls.length === 0);
  const [calqueOpacity, setCalqueOpacity] = useState<number>(0.50);

  // Загруженная подложка чертежа
  const [backdropImg, setBackdropImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (blueprintImageUrl) {
      const img = new Image();
      img.src = blueprintImageUrl;
      img.onload = () => setBackdropImg(img);
    } else {
      setBackdropImg(null);
    }
  }, [blueprintImageUrl]);

  // Локальное редактируемое состояние стен (для перемещения дверей и изменения размеров)
  const [currentWalls, setCurrentWalls] = useState<Wall[]>(initialWalls);
  const [currentRooms, setCurrentRooms] = useState<Room[]>(rooms);

  useEffect(() => {
    setCurrentRooms(rooms);
  }, [rooms]);

  // Состояние перетаскивания комнаты целиком (Drag & Snap)
  const [draggingRoomId, setDraggingRoomId] = useState<string | null>(null);
  const dragRoomMouseStartRef = useRef<Point>({ x: 0, y: 0 });
  const dragRoomPointsStartRef = useRef<Point[]>([]);
  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);

  // Состояние изменения размеров отдельных стен комнаты (Edge Resizing)
  const [hoveredEdge, setHoveredEdge] = useState<{ roomId: string; edge: 'left' | 'right' | 'top' | 'bottom' } | null>(null);
  const [resizingEdge, setResizingEdge] = useState<{
    roomId: string;
    edge: 'left' | 'right' | 'top' | 'bottom';
    startMouseScreen: Point;
    initialBounds: { minX: number; maxX: number; minY: number; maxY: number };
  } | null>(null);

  // Всплывающий редактор параметров комнаты
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomEditLengthMm, setRoomEditLengthMm] = useState<string>('');
  const [roomEditWidthMm, setRoomEditWidthMm] = useState<string>('');
  const [roomEditAreaM2, setRoomEditAreaM2] = useState<string>('');
  const [roomEditHeightM, setRoomEditHeightM] = useState<string>('2.70');
  const [roomEditName, setRoomEditName] = useState<string>('');

  // Состояние запроса к ИИ Vision
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiStatusMsg, setAiStatusMsg] = useState<string>('');

  // Функция авто-генерации чистых стен по контурам комнат
  const buildWallsFromRooms = useCallback((rms: Room[]): Wall[] => {
    const lineMap: Record<string, { start: Point; end: Point; count: number }> = {};
    rms.forEach(rm => {
      const pts = rm.points;
      if (!pts || pts.length < 3) return;
      for (let i = 0; i < pts.length; i++) {
        const p1 = pts[i];
        const p2 = pts[(i + 1) % pts.length];
        const isForward = (p1.x < p2.x || (p1.x === p2.x && p1.y < p2.y));
        const k = isForward
          ? `${p1.x.toFixed(3)},${p1.y.toFixed(3)}_${p2.x.toFixed(3)},${p2.y.toFixed(3)}`
          : `${p2.x.toFixed(3)},${p2.y.toFixed(3)}_${p1.x.toFixed(3)},${p1.y.toFixed(3)}`;
        const sPt = isForward ? p1 : p2;
        const ePt = isForward ? p2 : p1;
        if (!lineMap[k]) {
          lineMap[k] = { start: sPt, end: ePt, count: 1 };
        } else {
          lineMap[k].count++;
        }
      }
    });

    return Object.values(lineMap).map((wInfo, idx) => ({
      id: `wall_lego_pv_${Date.now()}_${idx}`,
      start: { x: wInfo.start.x, y: wInfo.start.y },
      end: { x: wInfo.end.x, y: wInfo.end.y },
      thickness: wInfo.count > 1 ? 0.10 : 0.25,
      wallType: wInfo.count > 1 ? 'partition' : 'bearing',
      openings: []
    }));
  }, []);


  useEffect(() => {
    setCurrentWalls(initialWalls);
  }, [initialWalls]);

  // Состояние камеры: масштаб (пикселей на метр) и смещение (offset)
  const [scale, setScale] = useState<number>(45);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<Point>({ x: 0, y: 0 });

  // Словарь ручных смещений размерных чисел { [dimKey]: { x, y } }
  const [manualDimOffsets, setManualDimOffsets] = useState<Record<string, { x: number; y: number }>>(initialManualDimOffsets || {});

  useEffect(() => {
    if (initialManualDimOffsets) {
      setManualDimOffsets(initialManualDimOffsets);
    }
  }, [initialManualDimOffsets]);

  const dimHitBoxesRef = useRef<DimHitBox[]>([]);

  // Состояния наведения и перетаскивания цифр размера
  const [hoveredDimKey, setHoveredDimKey] = useState<string | null>(null);
  const [draggingDimKey, setDraggingDimKey] = useState<string | null>(null);
  const dragDimStartMouseRef = useRef<Point>({ x: 0, y: 0 });
  const dragDimInitialOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Выделенный элемент (стена или проём) для операций (удаление, открывание, добавление)
  const [selectedItem, setSelectedItem] = useState<{
    type: 'wall' | 'opening';
    wallId: string;
    openingId?: string;
  } | null>(null);

  // Наведение на стену
  const [hoveredWallId, setHoveredWallId] = useState<string | null>(null);

  // История действий (Undo) для отмены удалений и правок в предпросмотре
  const [history, setHistory] = useState<Wall[][]>([]);
  const pushPreviewHistory = (wallsState: Wall[]) => {
    setHistory(prev => [...prev.slice(-20), JSON.parse(JSON.stringify(wallsState))]);
  };
  const handleUndo = () => {
    if (history.length === 0) return;
    const prevWalls = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setCurrentWalls(prevWalls);
    if (onUpdateWalls) onUpdateWalls(prevWalls);
  };

  // Состояния наведения и перетаскивания дверей/окон
  const [hoveredOpening, setHoveredOpening] = useState<{ wallId: string; openingId: string } | null>(null);
  const [draggingOpening, setDraggingOpening] = useState<{ wallId: string; openingId: string; wallStart: Point; wallEnd: Point; wallLen: number; opWidth: number } | null>(null);

  // Всплывающее поле ввода при двойном клике (Inline Edit)
  const [editingTarget, setEditingTarget] = useState<{
    type: 'dim' | 'opening';
    wallId: string;
    dimKey?: string;
    openingId?: string;
    currentValMm: number;
    title: string;
    screenX: number;
    screenY: number;
  } | null>(null);
  const [editInputValue, setEditInputValue] = useState<string>('');

  // Опции отображения
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [showRoomFills, setShowRoomFills] = useState<boolean>(true);
  const [darkTheme, setDarkTheme] = useState<boolean>(false);

  // Подсчет метрик
  const totalFloorArea = rooms
    .filter(r => !r.isShaft)
    .reduce((sum, r) => sum + (r.floorArea || 0), 0);

  // Вычисление охватывающего прямоугольника всех стен для центрирования
  const computeBoundingBox = useCallback(() => {
    if (currentWalls.length === 0) return null;
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    currentWalls.forEach(w => {
      minX = Math.min(minX, w.start.x, w.end.x);
      maxX = Math.max(maxX, w.start.x, w.end.x);
      minY = Math.min(minY, w.start.y, w.end.y);
      maxY = Math.max(maxY, w.start.y, w.end.y);
    });

    return {
      minX,
      maxX,
      minY,
      maxY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY),
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
    };
  }, [currentWalls]);

  // Функция авто-вписывания чертежа в размеры контейнера (Fit to View)
  const fitToView = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const bb = computeBoundingBox();
    if (!bb) {
      setScale(45);
      setOffset({ x: rect.width / 2, y: rect.height / 2 });
      return;
    }

    const pad = 60;
    const availW = Math.max(100, rect.width - pad * 2);
    const availH = Math.max(100, rect.height - pad * 2);

    const scaleX = availW / bb.width;
    const scaleY = availH / bb.height;
    const optimalScale = Math.max(15, Math.min(120, Math.min(scaleX, scaleY)));

    setScale(optimalScale);
    setOffset({
      x: rect.width / 2 - bb.centerX * optimalScale,
      y: rect.height / 2 - bb.centerY * optimalScale,
    });
  }, [computeBoundingBox]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fitToView();
    }, 60);
    return () => clearTimeout(timer);
  }, [fitToView]);

  // Перевод координат мира (метры) в экранные пиксели
  const worldToScreen = useCallback((x: number, y: number): Point => {
    return {
      x: offset.x + x * scale,
      y: offset.y + y * scale,
    };
  }, [offset, scale]);

  // Перевод экранных пикселей в координаты мира (метры)
  const screenToWorld = useCallback((screenX: number, screenY: number): Point => {
    return {
      x: (screenX - offset.x) / scale,
      y: (screenY - offset.y) / scale,
    };
  }, [offset, scale]);

  // Обработчики колесика мыши (Zoom)
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newScale = Math.max(12, Math.min(300, scale * zoomFactor));

    const newOffsetX = mouseX - (mouseX - offset.x) * (newScale / scale);
    const newOffsetY = mouseY - (mouseY - offset.y) * (newScale / scale);

    setScale(newScale);
    setOffset({ x: newOffsetX, y: newOffsetY });
  };

  // Поиск проема под курсором
  const findOpeningAtScreenPos = (screenX: number, screenY: number) => {
    const worldPt = screenToWorld(screenX, screenY);
    for (const wall of currentWalls) {
      if (!wall.openings || wall.openings.length === 0) continue;
      const wallLen = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
      if (wallLen < 0.05) continue;

      const ux = (wall.end.x - wall.start.x) / wallLen;
      const uy = (wall.end.y - wall.start.y) / wallLen;

      for (const op of wall.openings) {
        const cx = wall.start.x + ux * op.offsetMeters;
        const cy = wall.start.y + uy * op.offsetMeters;
        const distToCenter = Math.hypot(worldPt.x - cx, worldPt.y - cy);
        // Если курсор ближе половины ширины двери + запас толщины стены
        if (distToCenter <= Math.max(op.width / 2 + 0.15, 0.45)) {
          return { wall, op };
        }
      }
    }
    return null;
  };

  // Поиск хитбокса размера под курсором
  const findDimHitBoxAtScreenPos = (screenX: number, screenY: number) => {
    for (const box of dimHitBoxesRef.current) {
      const dist = Math.hypot(screenX - box.x, screenY - box.y);
      if (dist <= Math.max(box.w / 2 + 4, 16)) {
        return box;
      }
    }
    return null;
  };

  // Поиск стены под курсором
  const findWallAtScreenPos = (screenX: number, screenY: number) => {
    const worldPt = screenToWorld(screenX, screenY);
    for (const wall of currentWalls) {
      const wx = wall.end.x - wall.start.x;
      const wy = wall.end.y - wall.start.y;
      const lenSq = wx * wx + wy * wy;
      if (lenSq < 0.0001) continue;
      const t = Math.max(0, Math.min(1, ((worldPt.x - wall.start.x) * wx + (worldPt.y - wall.start.y) * wy) / lenSq));
      const projX = wall.start.x + t * wx;
      const projY = wall.start.y + t * wy;
      const dist = Math.hypot(worldPt.x - projX, worldPt.y - projY);
      if (dist <= Math.max(wall.thickness / 2 + 0.15, 0.35)) {
        return { wall, t };
      }
    }
    return null;
  };

  // --- ДЕЙСТВИЯ НАД ОБЪЕКТАМИ В КОМПАРАТОРЕ ---

  // 1. Удаление проема
  const handleDeleteOpening = (wallId: string, openingId: string) => {
    pushPreviewHistory(currentWalls);
    const updated = currentWalls.map(w => {
      if (w.id === wallId) {
        return {
          ...w,
          openings: (w.openings || []).filter(o => o.id !== openingId)
        };
      }
      return w;
    });
    setCurrentWalls(updated);
    setSelectedItem(null);
    if (onUpdateWalls) onUpdateWalls(updated);
  };

  // 2. Удаление стены
  const handleDeleteWall = (wallId: string) => {
    pushPreviewHistory(currentWalls);
    const updated = currentWalls.filter(w => w.id !== wallId);
    setCurrentWalls(updated);
    setSelectedItem(null);
    if (onUpdateWalls) onUpdateWalls(updated);
  };

  // 3. Смена направления открывания двери (внутрь / наружу)
  const handleToggleDoorSwing = (wallId: string, openingId: string) => {
    pushPreviewHistory(currentWalls);
    const updated = currentWalls.map(w => {
      if (w.id === wallId) {
        return {
          ...w,
          openings: (w.openings || []).map(o => {
            if (o.id === openingId) {
              return { ...o, doorSwingInside: o.doorSwingInside === false ? true : false };
            }
            return o;
          })
        };
      }
      return w;
    });
    setCurrentWalls(updated);
    if (onUpdateWalls) onUpdateWalls(updated);
  };

  // 4. Смена стороны петель (левая / правая)
  const handleToggleDoorHinge = (wallId: string, openingId: string) => {
    pushPreviewHistory(currentWalls);
    const updated = currentWalls.map(w => {
      if (w.id === wallId) {
        return {
          ...w,
          openings: (w.openings || []).map(o => {
            if (o.id === openingId) {
              return { ...o, doorHingeLeft: o.doorHingeLeft === false ? true : false };
            }
            return o;
          })
        };
      }
      return w;
    });
    setCurrentWalls(updated);
    if (onUpdateWalls) onUpdateWalls(updated);
  };

  // 5. Переключение типа проема (Дверь <-> Окно)
  const handleToggleOpeningType = (wallId: string, openingId: string) => {
    pushPreviewHistory(currentWalls);
    const updated = currentWalls.map(w => {
      if (w.id === wallId) {
        return {
          ...w,
          openings: (w.openings || []).map(o => {
            if (o.id === openingId) {
              const nextType: 'door' | 'window' = o.type === 'door' ? 'window' : 'door';
              const nextWidth = nextType === 'window' ? 1.40 : 0.80;
              return { ...o, type: nextType, width: nextWidth };
            }
            return o;
          })
        };
      }
      return w;
    });
    setCurrentWalls(updated);
    if (onUpdateWalls) onUpdateWalls(updated);
  };

  // 6. Добавление новой двери на выбранную стену (800 мм по центру)
  const handleAddDoorToWall = (wallId: string) => {
    pushPreviewHistory(currentWalls);
    const updated = currentWalls.map(w => {
      if (w.id === wallId) {
        const wallLen = Math.hypot(w.end.x - w.start.x, w.end.y - w.start.y);
        const newDoor: Opening = {
          id: `op_door_${Date.now()}`,
          type: 'door',
          width: 0.80,
          height: 2.05,
          offsetMeters: Number((wallLen / 2).toFixed(2)),
          doorSwingInside: true,
          doorHingeLeft: true,
        };
        return {
          ...w,
          openings: [...(w.openings || []), newDoor]
        };
      }
      return w;
    });
    setCurrentWalls(updated);
    if (onUpdateWalls) onUpdateWalls(updated);
  };

  // 7. Добавление нового окна на выбранную стену (1400 мм по центру)
  const handleAddWindowToWall = (wallId: string) => {
    pushPreviewHistory(currentWalls);
    const updated = currentWalls.map(w => {
      if (w.id === wallId) {
        const wallLen = Math.hypot(w.end.x - w.start.x, w.end.y - w.start.y);
        const newWindow: Opening = {
          id: `op_win_${Date.now()}`,
          type: 'window',
          width: 1.40,
          height: 1.40,
          offsetMeters: Number((wallLen / 2).toFixed(2)),
        };
        return {
          ...w,
          openings: [...(w.openings || []), newWindow]
        };
      }
      return w;
    });
    setCurrentWalls(updated);
    if (onUpdateWalls) onUpdateWalls(updated);
  };

  // 8. Переключение толщины стены (100 мм перегородка <-> 200 мм несущая)
  const handleToggleWallThickness = (wallId: string) => {
    pushPreviewHistory(currentWalls);
    const updated = currentWalls.map(w => {
      if (w.id === wallId) {
        const nextThick = Math.abs(w.thickness - 0.10) < 0.03 ? 0.20 : 0.10;
        return { ...w, thickness: nextThick };
      }
      return w;
    });
    setCurrentWalls(updated);
    if (onUpdateWalls) onUpdateWalls(updated);
  };

  // 9. Определение экранных координат для плавающей мини-панели действий
  const getSelectedActionPosition = () => {
    if (!selectedItem) return null;
    if (selectedItem.type === 'opening') {
      const wall = currentWalls.find(w => w.id === selectedItem.wallId);
      if (!wall) return null;
      const op = wall.openings?.find(o => o.id === selectedItem.openingId);
      if (!op) return null;
      const wallLen = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
      if (wallLen < 0.01) return null;
      const ux = (wall.end.x - wall.start.x) / wallLen;
      const uy = (wall.end.y - wall.start.y) / wallLen;
      const cx = wall.start.x + ux * op.offsetMeters;
      const cy = wall.start.y + uy * op.offsetMeters;
      const pt = worldToScreen(cx, cy);
      return { x: pt.x, y: pt.y - 36, wall, op };
    } else {
      const wall = currentWalls.find(w => w.id === selectedItem.wallId);
      if (!wall) return null;
      const cx = (wall.start.x + wall.end.x) / 2;
      const cy = (wall.start.y + wall.end.y) / 2;
      const pt = worldToScreen(cx, cy);
      return { x: pt.x, y: pt.y - 36, wall };
    }
  };

  // Клавиатурные сокращения (Delete / Backspace для удаления, Ctrl+Z для отмены, Esc для сброса)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!selectedItem) return;
        e.preventDefault();
        pushPreviewHistory(currentWalls);

        if (selectedItem.type === 'opening') {
          const updated = currentWalls.map(w => {
            if (w.id === selectedItem.wallId) {
              return {
                ...w,
                openings: (w.openings || []).filter(o => o.id !== selectedItem.openingId)
              };
            }
            return w;
          });
          setCurrentWalls(updated);
          setSelectedItem(null);
          if (onUpdateWalls) onUpdateWalls(updated);
        } else if (selectedItem.type === 'wall') {
          const updated = currentWalls.filter(w => w.id !== selectedItem.wallId);
          setCurrentWalls(updated);
          setSelectedItem(null);
          if (onUpdateWalls) onUpdateWalls(updated);
        }
      } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleUndo();
      } else if (e.key === 'Escape') {
        setSelectedItem(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, currentWalls, history]);

  // Обработчик перемещения мыши
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // 0. Изменение размера комнаты за грань (Edge Resizing)
    if (resizingEdge) {
      const dxM = (mouseX - resizingEdge.startMouseScreen.x) / scale;
      const dyM = (mouseY - resizingEdge.startMouseScreen.y) / scale;
      const b = resizingEdge.initialBounds;

      let newMinX = b.minX;
      let newMaxX = b.maxX;
      let newMinY = b.minY;
      let newMaxY = b.maxY;

      const snapPx = 12 / scale;

      if (resizingEdge.edge === 'left') {
        newMinX = Math.min(b.maxX - 0.4, b.minX + dxM);
        for (const other of currentRooms) {
          if (other.id === resizingEdge.roomId || !other.points) continue;
          const oMaxX = Math.max(...other.points.map(p => p.x));
          const oMinX = Math.min(...other.points.map(p => p.x));
          if (Math.abs(newMinX - oMaxX) < snapPx) newMinX = oMaxX;
          else if (Math.abs(newMinX - oMinX) < snapPx) newMinX = oMinX;
        }
      } else if (resizingEdge.edge === 'right') {
        newMaxX = Math.max(b.minX + 0.4, b.maxX + dxM);
        for (const other of currentRooms) {
          if (other.id === resizingEdge.roomId || !other.points) continue;
          const oMinX = Math.min(...other.points.map(p => p.x));
          const oMaxX = Math.max(...other.points.map(p => p.x));
          if (Math.abs(newMaxX - oMinX) < snapPx) newMaxX = oMinX;
          else if (Math.abs(newMaxX - oMaxX) < snapPx) newMaxX = oMaxX;
        }
      } else if (resizingEdge.edge === 'top') {
        newMinY = Math.min(b.maxY - 0.4, b.minY + dyM);
        for (const other of currentRooms) {
          if (other.id === resizingEdge.roomId || !other.points) continue;
          const oMaxY = Math.max(...other.points.map(p => p.y));
          const oMinY = Math.min(...other.points.map(p => p.y));
          if (Math.abs(newMinY - oMaxY) < snapPx) newMinY = oMaxY;
          else if (Math.abs(newMinY - oMinY) < snapPx) newMinY = oMinY;
        }
      } else if (resizingEdge.edge === 'bottom') {
        newMaxY = Math.max(b.minY + 0.4, b.maxY + dyM);
        for (const other of currentRooms) {
          if (other.id === resizingEdge.roomId || !other.points) continue;
          const oMinY = Math.min(...other.points.map(p => p.y));
          const oMaxY = Math.max(...other.points.map(p => p.y));
          if (Math.abs(newMaxY - oMinY) < snapPx) newMaxY = oMinY;
          else if (Math.abs(newMaxY - oMaxY) < snapPx) newMaxY = oMaxY;
        }
      }

      const wM = Number((newMaxX - newMinX).toFixed(3));
      const hM = Number((newMaxY - newMinY).toFixed(3));
      const newArea = Number((wM * hM).toFixed(2));
      const newPerim = Number((2 * (wM + hM)).toFixed(2));

      const updatedRooms = currentRooms.map(r => {
        if (r.id === resizingEdge.roomId) {
          const hH = r.ceilingHeight || 2.70;
          const wg = Number((newPerim * hH).toFixed(2));
          return {
            ...r,
            floorArea: newArea,
            perimeter: newPerim,
            wallGrossArea: wg,
            wallNetArea: Number((wg * 0.85).toFixed(2)),
            points: [
              { x: newMinX, y: newMinY },
              { x: newMaxX, y: newMinY },
              { x: newMaxX, y: newMaxY },
              { x: newMinX, y: newMaxY }
            ],
            labelPosition: {
              x: Number(((newMinX + newMaxX) / 2).toFixed(3)),
              y: Number(((newMinY + newMaxY) / 2).toFixed(3))
            }
          };
        }
        return r;
      });

      setCurrentRooms(updatedRooms);
      return;
    }

    // Перетаскивание комнаты с плавным магнитным примагничиванием (Drag & Magnetic Snap)
    if (draggingRoomId) {
      const dxM = (mouseX - dragRoomMouseStartRef.current.x) / scale;
      const dyM = (mouseY - dragRoomMouseStartRef.current.y) / scale;

      const initPts = dragRoomPointsStartRef.current;
      if (initPts && initPts.length >= 3) {
        const origMinX = Math.min(...initPts.map(p => p.x));
        const origMinY = Math.min(...initPts.map(p => p.y));
        const origMaxX = Math.max(...initPts.map(p => p.x));
        const origMaxY = Math.max(...initPts.map(p => p.y));
        const wM = origMaxX - origMinX;
        const hM = origMaxY - origMinY;

        let rawMinX = origMinX + dxM;
        let rawMinY = origMinY + dyM;
        let rawMaxX = origMaxX + dxM;
        let rawMaxY = origMaxY + dyM;

        // Плавный порог примагничивания: 12 экранных пикселей
        const snapThreshold = Math.min(0.12, 12 / scale);
        let snappedX = rawMinX;
        let snappedY = rawMinY;

        for (const other of currentRooms) {
          if (other.id === draggingRoomId || !other.points || other.points.length < 3) continue;
          const oMinX = Math.min(...other.points.map(p => p.x));
          const oMaxX = Math.max(...other.points.map(p => p.x));
          const oMinY = Math.min(...other.points.map(p => p.y));
          const oMaxY = Math.max(...other.points.map(p => p.y));

          // Прилипание по X
          if (Math.abs(rawMinX - oMaxX) < snapThreshold) {
            snappedX = oMaxX;
          } else if (Math.abs(rawMaxX - oMinX) < snapThreshold) {
            snappedX = oMinX - wM;
          } else if (Math.abs(rawMinX - oMinX) < snapThreshold) {
            snappedX = oMinX;
          }

          // Прилипание по Y
          if (Math.abs(rawMinY - oMaxY) < snapThreshold) {
            snappedY = oMaxY;
          } else if (Math.abs(rawMaxY - oMinY) < snapThreshold) {
            snappedY = oMinY - hM;
          } else if (Math.abs(rawMinY - oMinY) < snapThreshold) {
            snappedY = oMinY;
          }
        }

        const deltaSnapX = snappedX - origMinX;
        const deltaSnapY = snappedY - origMinY;

        const updatedRooms = currentRooms.map(r => {
          if (r.id === draggingRoomId) {
            const nextPts = initPts.map(p => ({
              x: Number((p.x + deltaSnapX).toFixed(3)),
              y: Number((p.y + deltaSnapY).toFixed(3))
            }));
            const cx = nextPts.reduce((s, p) => s + p.x, 0) / nextPts.length;
            const cy = nextPts.reduce((s, p) => s + p.y, 0) / nextPts.length;
            return {
              ...r,
              points: nextPts,
              labelPosition: { x: Number(cx.toFixed(3)), y: Number(cy.toFixed(3)) }
            };
          }
          return r;
        });

        setCurrentRooms(updatedRooms);
      }
      return;
    }

    // 1. Если перетаскиваем размерное число
    if (draggingDimKey) {
      const dx = mouseX - dragDimStartMouseRef.current.x;
      const dy = mouseY - dragDimStartMouseRef.current.y;
      setManualDimOffsets(prev => ({
        ...prev,
        [draggingDimKey]: {
          x: dragDimInitialOffsetRef.current.x + dx,
          y: dragDimInitialOffsetRef.current.y + dy,
        }
      }));
      return;
    }

    // 2. Если перетаскиваем дверь вдоль стены
    if (draggingOpening) {
      const worldMouse = screenToWorld(mouseX, mouseY);
      const { wallId, openingId, wallStart, wallEnd, wallLen, opWidth } = draggingOpening;

      // Проекция курсора на отрезок стены
      const wx = wallEnd.x - wallStart.x;
      const wy = wallEnd.y - wallStart.y;
      const segLenSq = wx * wx + wy * wy;
      const t = segLenSq > 0.0001
        ? Math.max(0, Math.min(1, ((worldMouse.x - wallStart.x) * wx + (worldMouse.y - wallStart.y) * wy) / segLenSq))
        : 0;

      const rawOffset = t * wallLen;
      // Ограничение: дверь не должна вылезать за пределы стены
      const halfW = opWidth / 2;
      const clampedOffset = Math.max(halfW + 0.05, Math.min(wallLen - halfW - 0.05, rawOffset));

      const updated = currentWalls.map(w => {
        if (w.id === wallId) {
          return {
            ...w,
            openings: (w.openings || []).map(o => o.id === openingId ? { ...o, offsetMeters: Number(clampedOffset.toFixed(3)) } : o)
          };
        }
        return w;
      });

      setCurrentWalls(updated);
      if (onUpdateWalls) onUpdateWalls(updated);
      return;
    }

    // 3. Если панорамируем холст
    if (isPanning) {
      setOffset({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
      return;
    }

    // 3.5. Проверяем наведение на грань комнаты для изменения размера
    const eUnderMouse = findRoomEdgeAtScreenPos(mouseX, mouseY);
    setHoveredEdge(eUnderMouse);

    // 4. Наведение курсора (Hover): проверяем размеры, двери или стены
    const dimHit = findDimHitBoxAtScreenPos(mouseX, mouseY);
    if (dimHit) {
      setHoveredDimKey(dimHit.key);
      setHoveredOpening(null);
      setHoveredWallId(null);
      return;
    }
    setHoveredDimKey(null);

    const opHit = findOpeningAtScreenPos(mouseX, mouseY);
    if (opHit) {
      setHoveredOpening({ wallId: opHit.wall.id, openingId: opHit.op.id });
      setHoveredWallId(null);
      return;
    }
    setHoveredOpening(null);

    const wallHit = findWallAtScreenPos(mouseX, mouseY);
    setHoveredWallId(wallHit ? wallHit.wall.id : null);
  };


  // Проверка попадания точки внутрь полигона комнаты
  const isPointInPolygon = (pt: Point, poly: Point[]): boolean => {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].x, yi = poly[i].y;
      const xj = poly[j].x, yj = poly[j].y;
      const intersect = ((yi > pt.y) !== (yj > pt.y)) &&
        (pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  // Поиск комнаты под экранными координатами
  const findRoomAtScreenPos = (screenX: number, screenY: number): Room | null => {
    const worldPt = screenToWorld(screenX, screenY);
    for (let i = currentRooms.length - 1; i >= 0; i--) {
      const rm = currentRooms[i];
      if (rm.points && rm.points.length >= 3) {
        if (isPointInPolygon(worldPt, rm.points)) {
          return rm;
        }
      }
    }
    return null;
  };

  // Поиск грани стены комнаты под курсором для изменения размера (Edge Detection)
  const findRoomEdgeAtScreenPos = (screenX: number, screenY: number): { roomId: string; edge: 'left' | 'right' | 'top' | 'bottom' } | null => {
    const edgeDistPx = 10;
    for (let i = currentRooms.length - 1; i >= 0; i--) {
      const rm = currentRooms[i];
      if (!rm.points || rm.points.length < 3) continue;
      const minX = Math.min(...rm.points.map(p => p.x));
      const maxX = Math.max(...rm.points.map(p => p.x));
      const minY = Math.min(...rm.points.map(p => p.y));
      const maxY = Math.max(...rm.points.map(p => p.y));

      const sLeft = minX * scale + offset.x;
      const sRight = maxX * scale + offset.x;
      const sTop = minY * scale + offset.y;
      const sBottom = maxY * scale + offset.y;

      const withinY = screenY >= sTop - edgeDistPx && screenY <= sBottom + edgeDistPx;
      const withinX = screenX >= sLeft - edgeDistPx && screenX <= sRight + edgeDistPx;

      if (withinY && Math.abs(screenX - sLeft) <= edgeDistPx) {
        return { roomId: rm.id, edge: 'left' };
      }
      if (withinY && Math.abs(screenX - sRight) <= edgeDistPx) {
        return { roomId: rm.id, edge: 'right' };
      }
      if (withinX && Math.abs(screenY - sTop) <= edgeDistPx) {
        return { roomId: rm.id, edge: 'top' };
      }
      if (withinX && Math.abs(screenY - sBottom) <= edgeDistPx) {
        return { roomId: rm.id, edge: 'bottom' };
      }
    }
    return null;
  };

  // Вызов ИИ Vision (Gemini 2.5 Flash через локальный прокси 127.0.0.1:20809)
  const handleRecognizeAiVision = async () => {
    if (!blueprintImageUrl) return;
    setIsAiLoading(true);
    setAiStatusMsg('Отправка чертежа в Gemini 2.5 Flash через прокси 127.0.0.1:20809...');
    try {
      const storedKey = typeof localStorage !== 'undefined' ? (localStorage.getItem('estimate_cad_gemini_key') || '') : '';
      const resp = await fetch('http://127.0.0.1:8001/api/gemini-passport-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageDataUrl: blueprintImageUrl,
          apiKey: storedKey || undefined
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.detectedRooms && data.detectedRooms.length > 0) {
          setCurrentRooms(data.detectedRooms);
          if (onUpdateRooms) onUpdateRooms(data.detectedRooms);
          if (data.walls && data.walls.length > 0) {
            setCurrentWalls(data.walls);
            if (onUpdateWalls) onUpdateWalls(data.walls);
          }
          setAiStatusMsg(`🎉 Успешно распознан паспорт ${data.detectedRooms.length} комнат!`);
          setTimeout(() => setAiStatusMsg(''), 4000);
        } else {
          setAiStatusMsg('⚠️ ИИ не выделил замкнутые комнаты. Попробуйте обвести вручную.');
        }
      } else {
        const err = await resp.json().catch(() => ({ detail: 'Ошибка сервера' }));
        setAiStatusMsg(`⚠️ Ошибка ИИ: ${err.detail || 'Не удалось распознать'}`);
      }
    } catch (e: any) {
      setAiStatusMsg(`⚠️ Ошибка сети или сервиса 8001: ${e.message}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Добавление новой комнаты блоком (Магнитное Лего)
  const handleAddRoomBlock = () => {
    const idx = currentRooms.length + 1;
    const bb = computeBoundingBox();
    const x0 = bb ? Number((bb.maxX + 0.3).toFixed(2)) : 0;
    const y0 = bb ? Number(bb.minY.toFixed(2)) : 0;
    const w = 4.0;
    const h = 3.0;

    const newRoom: Room = {
      id: `room_lego_manual_${Date.now()}`,
      name: `Комната ${idx}`,
      floorArea: 12.0,
      perimeter: 14.0,
      ceilingHeight: 2.70,
      wallGrossArea: 37.8,
      wallNetArea: 32.1,
      openingsTotalArea: 0,
      doorsCount: 1,
      doorsArea: 1.6,
      windowsCount: 1,
      windowsArea: 2.0,
      points: [
        { x: x0, y: y0 },
        { x: x0 + w, y: y0 },
        { x: x0 + w, y: y0 + h },
        { x: x0, y: y0 + h }
      ],
      walls: [],
      labelPosition: { x: x0 + w / 2, y: y0 + h / 2 },
      roomType: 'living'
    };

    const nextRooms = [...currentRooms, newRoom];
    setCurrentRooms(nextRooms);
    if (onUpdateRooms) onUpdateRooms(nextRooms);
    const nextWalls = buildWallsFromRooms(nextRooms);
    setCurrentWalls(nextWalls);
    if (onUpdateWalls) onUpdateWalls(nextWalls);
  };

  // Очистка стен и комнат
  const handleClearWalls = () => {
    if (confirm('Очистить все стены и комнаты на предпросмотре?')) {
      setCurrentRooms([]);
      setCurrentWalls([]);
      if (onUpdateRooms) onUpdateRooms([]);
      if (onUpdateWalls) onUpdateWalls([]);
    }
  };

  // Открытие редактора параметров комнаты
  const handleOpenRoomEditor = (rm: Room) => {
    setEditingRoom(rm);
    setRoomEditName(rm.name);
    setRoomEditAreaM2(rm.floorArea.toFixed(2));
    setRoomEditHeightM((rm.ceilingHeight || 2.70).toFixed(2));
    let lenMm = 0;
    let widMm = 0;
    if (rm.points && rm.points.length >= 4) {
      const p0 = rm.points[0];
      const p1 = rm.points[1];
      const p3 = rm.points[3];
      const d1 = Math.round(Math.hypot(p1.x - p0.x, p1.y - p0.y) * 1000);
      const d2 = Math.round(Math.hypot(p3.x - p0.x, p3.y - p0.y) * 1000);
      lenMm = Math.max(d1, d2);
      widMm = Math.min(d1, d2);
    }
    if (lenMm <= 0) {
      lenMm = Math.round(Math.sqrt((rm.floorArea || 12) * 1.3) * 1000);
      widMm = Math.round(((rm.floorArea || 12) * 1_000_000) / lenMm);
    }
    setRoomEditLengthMm(String(lenMm));
    setRoomEditWidthMm(String(widMm));
  };

  // Сохранение изменений в комнате из модалки
  const handleSaveRoomEditor = () => {
    if (!editingRoom) return;
    const curLen = editingRoom.points && editingRoom.points.length >= 4
      ? Math.round(Math.hypot(editingRoom.points[1].x - editingRoom.points[0].x, editingRoom.points[1].y - editingRoom.points[0].y) * 1000)
      : 3000;
    const curWid = editingRoom.points && editingRoom.points.length >= 4
      ? Math.round(Math.hypot(editingRoom.points[3].x - editingRoom.points[0].x, editingRoom.points[3].y - editingRoom.points[0].y) * 1000)
      : 2500;

    const lMm = Math.max(400, parseFloat(roomEditLengthMm) || curLen);
    const wMm = Math.max(400, parseFloat(roomEditWidthMm) || curWid);
    const hM = Math.max(1.5, parseFloat(roomEditHeightM) || (editingRoom.ceilingHeight || 2.70));
    const area = Number(((lMm * wMm) / 1000000.0).toFixed(2));
    const perim = Number((2 * (lMm + wMm) / 1000.0).toFixed(2));
    const wg = Number((perim * hM).toFixed(2));
    const wn = Number((wg * 0.85).toFixed(2));

    const wM = lMm / 1000.0;
    const hLenM = wMm / 1000.0;

    const updatedRooms = currentRooms.map(r => {
      if (r.id === editingRoom.id) {
        const originX = r.points && r.points.length > 0 ? r.points[0].x : 0;
        const originY = r.points && r.points.length > 0 ? r.points[0].y : 0;
        return {
          ...r,
          name: roomEditName || r.name,
          floorArea: area,
          perimeter: perim,
          ceilingHeight: hM,
          wallGrossArea: wg,
          wallNetArea: wn,
          points: [
            { x: originX, y: originY },
            { x: originX + wM, y: originY },
            { x: originX + wM, y: originY + hLenM },
            { x: originX, y: originY + hLenM }
          ],
          labelPosition: { x: Number((originX + wM / 2).toFixed(3)), y: Number((originY + hLenM / 2).toFixed(3)) }
        };
      }
      return r;
    });

    setCurrentRooms(updatedRooms);
    if (onUpdateRooms) onUpdateRooms(updatedRooms);
    const updatedWalls = buildWallsFromRooms(updatedRooms);
    setCurrentWalls(updatedWalls);
    if (onUpdateWalls) onUpdateWalls(updatedWalls);

    setEditingRoom(null);
  };

  // Обработчик нажатия мыши (MouseDown)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // 0. Захват грани стены комнаты для изменения размера (Edge Resizing)
    const edgeHit = findRoomEdgeAtScreenPos(mouseX, mouseY);
    if (edgeHit) {
      const rm = currentRooms.find(r => r.id === edgeHit.roomId);
      if (rm && rm.points && rm.points.length >= 3) {
        const minX = Math.min(...rm.points.map(p => p.x));
        const maxX = Math.max(...rm.points.map(p => p.x));
        const minY = Math.min(...rm.points.map(p => p.y));
        const maxY = Math.max(...rm.points.map(p => p.y));
        setResizingEdge({
          roomId: edgeHit.roomId,
          edge: edgeHit.edge,
          startMouseScreen: { x: mouseX, y: mouseY },
          initialBounds: { minX, maxX, minY, maxY }
        });
        return;
      }
    }

    // 1. Проверяем захват размерного числа
    const dimHit = findDimHitBoxAtScreenPos(mouseX, mouseY);
    if (dimHit) {
      setDraggingDimKey(dimHit.key);
      dragDimStartMouseRef.current = { x: mouseX, y: mouseY };
      const currentOffset = manualDimOffsets[dimHit.key] || { x: 0, y: 0 };
      dragDimInitialOffsetRef.current = currentOffset;
      return;
    }

    // 2. Проверяем захват двери / окна
    const opHit = findOpeningAtScreenPos(mouseX, mouseY);
    if (!opHit) {
      const roomHit = findRoomAtScreenPos(mouseX, mouseY);
      if (roomHit) {
        setDraggingRoomId(roomHit.id);
        dragRoomMouseStartRef.current = { x: mouseX, y: mouseY };
        dragRoomPointsStartRef.current = (roomHit.points || []).map(p => ({ ...p }));
        return;
      }
    }
    if (opHit) {
      setSelectedItem({ type: 'opening', wallId: opHit.wall.id, openingId: opHit.op.id });
      const wallLen = Math.hypot(opHit.wall.end.x - opHit.wall.start.x, opHit.wall.end.y - opHit.wall.start.y);
      setDraggingOpening({
        wallId: opHit.wall.id,
        openingId: opHit.op.id,
        wallStart: opHit.wall.start,
        wallEnd: opHit.wall.end,
        wallLen,
        opWidth: opHit.op.width,
      });
      return;
    }

    // 3. Проверяем клик по стене
    const wallHit = findWallAtScreenPos(mouseX, mouseY);
    if (wallHit) {
      setSelectedItem({ type: 'wall', wallId: wallHit.wall.id });
      return;
    }

    // 4. Клик в пустоту — сброс выделения и панорамирование
    setSelectedItem(null);
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX - offset.x,
      y: e.clientY - offset.y,
    };
  };

  // Обработчик отпускания мыши (MouseUp)
  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingDimKey(null);
    setDraggingOpening(null);
    if (resizingEdge) {
      setResizingEdge(null);
      const nextWalls = buildWallsFromRooms(currentRooms);
      setCurrentWalls(nextWalls);
      if (onUpdateRooms) onUpdateRooms(currentRooms);
      if (onUpdateWalls) onUpdateWalls(nextWalls);
    }
    if (draggingRoomId) {
      setDraggingRoomId(null);
      const nextWalls = buildWallsFromRooms(currentRooms);
      setCurrentWalls(nextWalls);
      if (onUpdateRooms) onUpdateRooms(currentRooms);
      if (onUpdateWalls) onUpdateWalls(nextWalls);
    }
  };

  // Обработчик двойного клика для редактирования размера (Double-click Inline Edit)
  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // 0. Двойной клик по комнате — вызов редактора параметров
    const roomHit = findRoomAtScreenPos(mouseX, mouseY);
    if (roomHit) {
      handleOpenRoomEditor(roomHit);
      return;
    }

    // 1. Двойной клик по числу размера
    const dimHit = findDimHitBoxAtScreenPos(mouseX, mouseY);
    if (dimHit) {
      const valMm = Math.round(dimHit.segLenMeters * 1000);
      setEditingTarget({
        type: 'dim',
        wallId: dimHit.wallId,
        dimKey: dimHit.key,
        currentValMm: valMm,
        title: `Размер сегмента стены (${dimHit.text})`,
        screenX: mouseX,
        screenY: mouseY - 25,
      });
      setEditInputValue(String(valMm));
      return;
    }

    // 2. Двойной клик по двери
    const opHit = findOpeningAtScreenPos(mouseX, mouseY);
    if (opHit) {
      const valMm = Math.round(opHit.op.width * 1000);
      setEditingTarget({
        type: 'opening',
        wallId: opHit.wall.id,
        openingId: opHit.op.id,
        currentValMm: valMm,
        title: `Ширина проёма (${opHit.op.type === 'door' ? 'Дверь' : 'Окно'})`,
        screenX: mouseX,
        screenY: mouseY - 25,
      });
      setEditInputValue(String(valMm));
    }
  };

  // Применение измененного значения из инпута
  const handleSaveEditInput = () => {
    if (!editingTarget) return;
    const num = parseFloat(editInputValue);
    if (isNaN(num) || num <= 0) {
      setEditingTarget(null);
      return;
    }
    const newMeters = num / 1000;

    if (editingTarget.type === 'opening' && editingTarget.openingId) {
      const updated = currentWalls.map(w => {
        if (w.id === editingTarget.wallId) {
          return {
            ...w,
            openings: (w.openings || []).map(o => o.id === editingTarget.openingId ? { ...o, width: newMeters } : o)
          };
        }
        return w;
      });
      setCurrentWalls(updated);
      if (onUpdateWalls) onUpdateWalls(updated);
    } else if (editingTarget.type === 'dim') {
      // Корректировка длины стены или простенка
      const wall = currentWalls.find(w => w.id === editingTarget.wallId);
      if (wall) {
        const wallLen = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
        if (wallLen > 0.05) {
          const ux = (wall.end.x - wall.start.x) / wallLen;
          const uy = (wall.end.y - wall.start.y) / wallLen;
          const updated = currentWalls.map(w => {
            if (w.id === wall.id) {
              return {
                ...w,
                end: {
                  x: Number((w.start.x + ux * newMeters).toFixed(3)),
                  y: Number((w.start.y + uy * newMeters).toFixed(3)),
                }
              };
            }
            return w;
          });
          setCurrentWalls(updated);
          if (onUpdateWalls) onUpdateWalls(updated);
        }
      }
    }

    setEditingTarget(null);
  };

  // Сброс всех ручных выносок цифр обратно в авто-режим
  const handleResetDimOffsets = () => {
    setManualDimOffsets({});
  };

  // Определение стиля курсора
  const getCursorClass = () => {
    if (resizingEdge) {
      return (resizingEdge.edge === 'top' || resizingEdge.edge === 'bottom') ? 'cursor-ns-resize' : 'cursor-ew-resize';
    }
    if (hoveredEdge) {
      return (hoveredEdge.edge === 'top' || hoveredEdge.edge === 'bottom') ? 'cursor-ns-resize' : 'cursor-ew-resize';
    }
    if (draggingDimKey) return 'cursor-grabbing';
    if (draggingOpening) return 'cursor-ew-resize';
    if (isPanning) return 'cursor-grabbing';
    if (hoveredDimKey) return 'cursor-move';
    if (hoveredOpening) return 'cursor-ew-resize';
    if (hoveredRoomId) return 'cursor-move';
    return 'cursor-grab';
  };

  // Основной цикл отрисовки чертежа
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const height = container.clientHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. Фон холста
    ctx.fillStyle = darkTheme ? '#0f172a' : '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    // 2. Инженерная сетка (Grid 1м и 0.5м)
    ctx.save();
    ctx.lineWidth = 0.5;
    const gridStepMeters = scale > 50 ? 0.5 : 1.0;
    const gridStepPx = gridStepMeters * scale;
    const startX = (offset.x % gridStepPx + gridStepPx) % gridStepPx;
    const startY = (offset.y % gridStepPx + gridStepPx) % gridStepPx;

    ctx.strokeStyle = darkTheme ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.85)';
    ctx.beginPath();
    for (let x = startX; x < width; x += gridStepPx) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = startY; y < height; y += gridStepPx) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();
    ctx.restore();

    // 2.1. Отрисовка изображения подложки (кальки чертежа)
    if (backdropImg) {
      ctx.save();
      const planW = 10;
      const aspect = (backdropImg.width || 1) / (backdropImg.height || 1);
      const planH = planW / aspect;
      const p0 = worldToScreen(0, 0);
      const scrW = planW * scale;
      const scrH = planH * scale;

      ctx.globalAlpha = calqueOpacity;
      ctx.drawImage(backdropImg, p0.x, p0.y, scrW, scrH);
      ctx.restore();
    }

    // 3. Комнаты (Room polygons & fills)
    if (showRoomFills && currentRooms.length > 0) {
      currentRooms.forEach(room => {
        if (room.points.length < 3) return;

        ctx.save();
        ctx.beginPath();
        const p0 = worldToScreen(room.points[0].x, room.points[0].y);
        ctx.moveTo(p0.x, p0.y);
        for (let i = 1; i < room.points.length; i++) {
          const pi = worldToScreen(room.points[i].x, room.points[i].y);
          ctx.lineTo(pi.x, pi.y);
        }
        ctx.closePath();

        if (room.isShaft) {
          ctx.fillStyle = darkTheme ? 'rgba(51, 65, 85, 0.6)' : 'rgba(241, 245, 249, 0.9)';
          ctx.fill();
          ctx.strokeStyle = darkTheme ? '#64748b' : '#94a3b8';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          if (room.points.length >= 4) {
            const p1 = worldToScreen(room.points[1].x, room.points[1].y);
            const p2 = worldToScreen(room.points[2].x, room.points[2].y);
            const p3 = worldToScreen(room.points[3].x, room.points[3].y);
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p3.x, p3.y);
            ctx.stroke();
          }
        } else {
          ctx.fillStyle = darkTheme ? 'rgba(30, 58, 138, 0.25)' : 'rgba(224, 242, 254, 0.45)';
          ctx.fill();
          ctx.strokeStyle = darkTheme ? 'rgba(59, 130, 246, 0.5)' : 'rgba(147, 197, 253, 0.6)';
          ctx.lineWidth = 1.0;
          ctx.stroke();

          let cx = 0, cy = 0;
          room.points.forEach(p => {
            cx += p.x;
            cy += p.y;
          });
          cx /= room.points.length;
          cy /= room.points.length;
          const scrCenter = worldToScreen(cx, cy);

          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = '700 11px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = darkTheme ? '#f1f5f9' : '#0f172a';
          ctx.fillText(room.name, scrCenter.x, scrCenter.y - 7);

          ctx.font = '600 10px monospace';
          ctx.fillStyle = darkTheme ? '#60a5fa' : '#0284c7';
          ctx.fillText(`${room.floorArea.toFixed(2)} м²`, scrCenter.x, scrCenter.y + 7);
        }
        ctx.restore();
      });

      // Подсветка активной грани для изменения размера (Edge Resize Indicator)
      const activeEdge = resizingEdge || hoveredEdge;
      if (activeEdge) {
        const targetRm = currentRooms.find(r => r.id === activeEdge.roomId);
        if (targetRm && targetRm.points && targetRm.points.length >= 4) {
          const minX = Math.min(...targetRm.points.map(p => p.x));
          const maxX = Math.max(...targetRm.points.map(p => p.x));
          const minY = Math.min(...targetRm.points.map(p => p.y));
          const maxY = Math.max(...targetRm.points.map(p => p.y));

          let pA = { x: minX, y: minY };
          let pB = { x: maxX, y: minY };
          if (activeEdge.edge === 'bottom') {
            pA = { x: minX, y: maxY };
            pB = { x: maxX, y: maxY };
          } else if (activeEdge.edge === 'left') {
            pA = { x: minX, y: minY };
            pB = { x: minX, y: maxY };
          } else if (activeEdge.edge === 'right') {
            pA = { x: maxX, y: minY };
            pB = { x: maxX, y: maxY };
          }

          const sA = worldToScreen(pA.x, pA.y);
          const sB = worldToScreen(pB.x, pB.y);

          ctx.save();
          ctx.strokeStyle = '#0d9488';
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(sA.x, sA.y);
          ctx.lineTo(sB.x, sB.y);
          ctx.stroke();

          // Маркер ручки перетаскивания
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#0d9488';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc((sA.x + sB.x) / 2, (sA.y + sB.y) / 2, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    // 3.1. В режиме кальки рисуем интерактивные бейджи комнат прямо поверх оригинального чертежа
    if (isCalque && rooms.length > 0) {
      ctx.save();
      rooms.forEach((room, idx) => {
        let pt = room.labelPosition;
        if (!pt && room.points && room.points.length > 0) {
          const cx = room.points.reduce((s, p) => s + p.x, 0) / room.points.length;
          const cy = room.points.reduce((s, p) => s + p.y, 0) / room.points.length;
          pt = { x: cx, y: cy };
        }
        if (!pt) {
          const cols = Math.max(2, Math.ceil(Math.sqrt(rooms.length)));
          const col = idx % cols;
          const row = Math.floor(idx / cols);
          pt = { x: (col + 0.5) * 2.8, y: (row + 0.5) * 2.2 };
        }

        const scr = worldToScreen(pt.x, pt.y);
        const textTitle = room.name;
        const textArea = `${room.floorArea.toFixed(2)} м²`;

        ctx.font = 'bold 11px system-ui, sans-serif';
        const titleW = ctx.measureText(textTitle).width;
        ctx.font = 'bold 10px monospace';
        const areaW = ctx.measureText(textArea).width;
        const boxW = Math.max(titleW, areaW) + 20;
        const boxH = 36;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.roundRect(scr.x - boxW / 2 + 2, scr.y - boxH / 2 + 2, boxW, boxH, 6);
        ctx.fill();

        ctx.fillStyle = darkTheme ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)';
        ctx.strokeStyle = room.roomType === 'wet' ? '#06b6d4' : '#0d9488';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(scr.x - boxW / 2, scr.y - boxH / 2, boxW, boxH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.fillStyle = darkTheme ? '#f1f5f9' : '#0f172a';
        ctx.fillText(textTitle, scr.x, scr.y - 7);

        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = room.roomType === 'wet' ? '#0891b2' : '#0d9488';
        ctx.fillText(textArea, scr.x, scr.y + 8);
      });
      ctx.restore();
    }

    // 4. Сплошные стены (Solid Walls) - только в векторном режиме (в режиме кальки чертеж чистый)
    if (currentWalls.length > 0) {
      ctx.save();
      currentWalls.forEach(w => {
      const p1 = worldToScreen(w.start.x, w.start.y);
      const p2 = worldToScreen(w.end.x, w.end.y);

      const isWallSelected = selectedItem?.type === 'wall' && selectedItem.wallId === w.id;
      const isWallHovered = hoveredWallId === w.id;

      if (isWallSelected) {
        ctx.save();
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = Math.max(6, w.thickness * scale + 8);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.restore();
      }

      ctx.lineWidth = Math.max(2, w.thickness * scale);
      ctx.lineCap = 'square';
      ctx.lineJoin = 'miter';
      ctx.strokeStyle = isWallSelected ? '#1d4ed8' : isWallHovered ? '#2563eb' : darkTheme ? '#cbd5e1' : '#0f172a';

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });

    // Круглые заглушки на стыках стен
    currentWalls.forEach(w => {
      const p1 = worldToScreen(w.start.x, w.start.y);
      const p2 = worldToScreen(w.end.x, w.end.y);
      const r = Math.max(1, (w.thickness * scale) / 2);

      ctx.fillStyle = darkTheme ? '#cbd5e1' : '#0f172a';
      ctx.beginPath();
      ctx.arc(p1.x, p1.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p2.x, p2.y, r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // 5. Проемы (Окна и Двери)
    ctx.save();
    currentWalls.forEach(w => {
      if (!w.openings || w.openings.length === 0) return;
      const wallLen = Math.hypot(w.end.x - w.start.x, w.end.y - w.start.y);
      if (wallLen < 0.01) return;

      const ux = (w.end.x - w.start.x) / wallLen;
      const uy = (w.end.y - w.start.y) / wallLen;
      const nx = -uy;
      const ny = ux;

      w.openings.forEach(op => {
        const isSelectedOp = selectedItem?.type === 'opening' && selectedItem.wallId === w.id && selectedItem.openingId === op.id;
        const isHovered = (hoveredOpening?.wallId === w.id && hoveredOpening?.openingId === op.id) || isSelectedOp;
        const isDraggingThis = draggingOpening?.wallId === w.id && draggingOpening?.openingId === op.id;

        const cx = w.start.x + ux * op.offsetMeters;
        const cy = w.start.y + uy * op.offsetMeters;
        const halfW = op.width / 2;
        const halfThick = w.thickness / 2;

        const p1 = worldToScreen(cx - ux * halfW + nx * halfThick, cy - uy * halfW + ny * halfThick);
        const p2 = worldToScreen(cx + ux * halfW + nx * halfThick, cy + uy * halfW + ny * halfThick);
        const p3 = worldToScreen(cx + ux * halfW - nx * halfThick, cy + uy * halfW - ny * halfThick);
        const p4 = worldToScreen(cx - ux * halfW - nx * halfThick, cy - uy * halfW - ny * halfThick);

        // Вырезаем проем
        ctx.fillStyle = isHovered || isDraggingThis ? 'rgba(254, 243, 199, 0.95)' : darkTheme ? '#0f172a' : '#ffffff';
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.closePath();
        ctx.fill();

        // Торцы проема
        ctx.strokeStyle = isHovered || isDraggingThis ? '#f59e0b' : darkTheme ? '#cbd5e1' : '#0f172a';
        ctx.lineWidth = isHovered || isDraggingThis ? 2.2 : 1.2;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.moveTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.stroke();

        if (op.type === 'window') {
          ctx.strokeStyle = isHovered ? '#0284c7' : darkTheme ? '#38bdf8' : '#0284c7';
          ctx.lineWidth = 2.4;
          const mid1 = worldToScreen(cx - ux * halfW, cy - uy * halfW);
          const mid2 = worldToScreen(cx + ux * halfW, cy + uy * halfW);
          ctx.beginPath();
          ctx.moveTo(mid1.x, mid1.y);
          ctx.lineTo(mid2.x, mid2.y);
          ctx.stroke();
        } else {
          // Дверь
          const hingeLeft = op.doorHingeLeft !== false;
          const swingInside = op.doorSwingInside !== false;
          const hingeX = hingeLeft ? cx - ux * halfW : cx + ux * halfW;
          const hingeY = hingeLeft ? cy - uy * halfW : cy + uy * halfW;
          const hingeScr = worldToScreen(hingeX, hingeY);

          const normalMult = swingInside ? 1 : -1;
          const doorLenPx = op.width * scale;

          const openX = hingeScr.x + (hingeLeft ? -ny : ny) * normalMult * doorLenPx;
          const openY = hingeScr.y + (hingeLeft ? nx : -nx) * normalMult * doorLenPx;

          ctx.strokeStyle = isHovered || isDraggingThis ? '#ea580c' : '#f59e0b';
          ctx.lineWidth = isHovered || isDraggingThis ? 2.4 : 1.6;
          ctx.beginPath();
          ctx.moveTo(hingeScr.x, hingeScr.y);
          ctx.lineTo(openX, openY);
          ctx.stroke();

          // Дуга открывания
          ctx.setLineDash([2, 2]);
          ctx.strokeStyle = isHovered ? 'rgba(234, 88, 12, 0.8)' : 'rgba(245, 158, 11, 0.6)';
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          const startAngle = Math.atan2((hingeLeft ? uy : -uy), (hingeLeft ? ux : -ux));
          const endAngle = Math.atan2((hingeLeft ? -ny : ny) * normalMult, (hingeLeft ? nx : -nx) * normalMult);
          ctx.arc(hingeScr.x, hingeScr.y, doorLenPx, startAngle, endAngle, swingInside ? !hingeLeft : hingeLeft);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });
    });
    ctx.restore();

    // 6. Компактные ГОСТ-размеры с регистрацией хитбоксов и поддержкой ручного сдвига
    dimHitBoxesRef.current = [];
    if (showDimensions && currentWalls.length > 0) {
      drawArchitecturalWallChains(
        ctx,
        currentWalls,
        rooms,
        worldToScreen,
        scale,
        {
          unit,
          selectedWallId: null,
          hoveredWallId: null,
          fontSize: 9.0,
          manualOffsets: manualDimOffsets,
          onRegisterHitBox: (hitBox) => {
            dimHitBoxesRef.current.push(hitBox);
          }
        }
      );
    }
    }

    ctx.restore();
  }, [currentWalls, rooms, offset, scale, showDimensions, showRoomFills, darkTheme, unit, manualDimOffsets, hoveredOpening, draggingOpening, worldToScreen, isCalque, backdropImg, calqueOpacity]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full flex flex-col bg-slate-900 overflow-hidden select-none"
    >
      {/* 1. Верхний информационный тулбар */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none gap-2">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-lg flex items-center gap-2 pointer-events-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
            <span>Векторный CAD-план</span>
            <span className="text-[10px] text-emerald-400 font-mono font-normal">
              (Стен: {currentWalls.length}, Комнат: {rooms.length})
            </span>
          </span>
          {totalFloorArea > 0 && (
            <span className="text-xs font-mono font-bold text-amber-300 pl-2 border-l border-slate-700">
              Sобщ: {totalFloorArea.toFixed(2)} м²
            </span>
          )}
        </div>

        {/* Кнопки зума и настройки вида */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-lg flex items-center gap-1 pointer-events-auto">
          {/* Сброс выносок, если были сдвинуты */}
          {Object.keys(manualDimOffsets).length > 0 && (
            <button
              type="button"
              onClick={handleResetDimOffsets}
              className="px-2 py-1 text-slate-300 hover:text-amber-300 hover:bg-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Сбросить все перемещённые цифры обратно в авто-режим"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden md:inline">Сброс выносок</span>
            </button>
          )}

          {/* Распознать через ИИ Vision */}
          {blueprintImageUrl && (
            <button
              type="button"
              onClick={handleRecognizeAiVision}
              disabled={isAiLoading}
              className="px-2.5 py-1 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              title="Распознать паспорт комнат чертежа через Gemini 2.5 Flash Vision (прокси 127.0.0.1:20809)"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAiLoading ? 'ИИ думает...' : '✨ ИИ Vision'}</span>
            </button>
          )}

          {/* Добавить комнату-кубик */}
          <button
            type="button"
            onClick={handleAddRoomBlock}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            title="Добавить прямоугольную комнату 4×3 м (Магнитное Лего)"
          >
            <Plus className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">+ Комната</span>
          </button>

          {/* Очистить стены */}
          <button
            type="button"
            onClick={handleClearWalls}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Очистить все стены"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />

          {/* Отмена последнего действия */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length === 0}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
              history.length > 0
                ? 'text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer'
                : 'text-slate-600 cursor-not-allowed opacity-50'
            }`}
            title="Отменить действие [Ctrl+Z]"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden md:inline">Отмена</span>
          </button>

          {/* Переключатель размеров */}
          <button
            type="button"
            onClick={() => setShowDimensions(prev => !prev)}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
              showDimensions
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Показать / скрыть компактные размеры ГОСТ"
          >
            <Ruler className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden sm:inline">Размеры</span>
          </button>

          {/* Переключатель заливки комнат */}
          <button
            type="button"
            onClick={() => setShowRoomFills(prev => !prev)}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
              showRoomFills
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Показать / скрыть цветовые зоны комнат"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          {/* Тема фона */}
          <button
            type="button"
            onClick={() => setDarkTheme(prev => !prev)}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Переключить фон"
          >
            {darkTheme ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-300" />}
          </button>

          {backdropImg && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-800/80 rounded-lg text-slate-300 text-[11px]">
              <span className="text-[10px] text-slate-400 font-medium">Калька:</span>
              <input
                type="range"
                min="0.10"
                max="0.90"
                step="0.05"
                value={calqueOpacity}
                onChange={e => setCalqueOpacity(parseFloat(e.target.value))}
                className="w-16 accent-teal-500 cursor-pointer h-1.5"
                title="Прозрачность подложки"
              />
              <span className="font-mono font-bold text-[10px] text-teal-400">{Math.round(calqueOpacity * 100)}%</span>
            </div>
          )}

          <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />

          {/* Zoom Out */}
          <button
            type="button"
            onClick={() => setScale(prev => Math.max(12, prev * 0.85))}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Уменьшить масштаб (-)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="text-[10px] font-mono text-slate-400 px-1 select-none">
            {Math.round(scale)}px/м
          </span>

          {/* Zoom In */}
          <button
            type="button"
            onClick={() => setScale(prev => Math.min(300, prev * 1.15))}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Увеличить масштаб (+)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          {/* Fit to View */}
          <button
            type="button"
            onClick={fitToView}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-teal-700 rounded-lg transition-colors cursor-pointer"
            title="Вписать чертёж по центру"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Интерактивный Canvas векторного чертежа */}
      <canvas
        ref={canvasRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        className={`w-full h-full block ${getCursorClass()}`}
      />

      {/* 3.1. Плавающая контекстная мини-панель над выделенным объектом */}
      {(() => {
        const actionPos = getSelectedActionPosition();
        if (!actionPos) return null;
        return (
          <div
            className="absolute z-40 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl shadow-2xl border border-slate-300 flex items-center gap-1.5 animate-in fade-in zoom-in-95 pointer-events-auto select-none"
            style={{
              left: `${Math.max(120, Math.min(window.innerWidth - 180, actionPos.x))}px`,
              top: `${Math.max(50, actionPos.y)}px`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            {selectedItem?.type === 'opening' && actionPos.op && (
              <>
                <span className="text-[10px] font-bold text-slate-500 uppercase px-1">
                  {actionPos.op.type === 'door' ? '🚪 Дверь' : '🪟 Окно'} ({Math.round(actionPos.op.width * 1000)}мм)
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleOpeningType(selectedItem.wallId, selectedItem.openingId!)}
                  className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Сменить тип проёма (Дверь ↔ Окно)"
                >
                  {actionPos.op.type === 'door' ? '🪟 В окно' : '🚪 В дверь'}
                </button>
                {actionPos.op.type === 'door' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleToggleDoorSwing(selectedItem.wallId, selectedItem.openingId!)}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer transition-colors"
                      title="Направление открывания: внутрь / наружу"
                    >
                      🔄 {actionPos.op.doorSwingInside !== false ? 'Внутрь' : 'Наружу'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleDoorHinge(selectedItem.wallId, selectedItem.openingId!)}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer transition-colors"
                      title="Сторона петель: левая / правая"
                    >
                      ⇄ {actionPos.op.doorHingeLeft !== false ? 'Левая' : 'Правая'}
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => handleDeleteOpening(selectedItem.wallId, selectedItem.openingId!)}
                  className="p-1 rounded bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 cursor-pointer ml-1 transition-colors"
                  title="Удалить проем [Delete]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            {selectedItem?.type === 'wall' && actionPos.wall && (
              <>
                <span className="text-[10px] font-bold text-slate-500 uppercase px-1">
                  🧱 Стена {(Math.hypot(actionPos.wall.end.x - actionPos.wall.start.x, actionPos.wall.end.y - actionPos.wall.start.y)).toFixed(2)}м
                </span>
                <button
                  type="button"
                  onClick={() => handleAddDoorToWall(selectedItem.wallId)}
                  className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer border border-amber-200 transition-colors"
                  title="Добавить дверь 800 мм на эту стену"
                >
                  <DoorOpen className="w-3.5 h-3.5" />
                  <span>+ Дверь</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddWindowToWall(selectedItem.wallId)}
                  className="px-2 py-1 rounded bg-sky-50 hover:bg-sky-100 text-sky-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer border border-sky-200 transition-colors"
                  title="Добавить окно 1400 мм на эту стену"
                >
                  <span>+ Окно</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleWallThickness(selectedItem.wallId)}
                  className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer transition-colors"
                  title="Сменить толщину стены: 100 мм (перегородка) / 200 мм (несущая)"
                >
                  {Math.round(actionPos.wall.thickness * 1000)} мм
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteWall(selectedItem.wallId)}
                  className="p-1 rounded bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 cursor-pointer ml-1 transition-colors"
                  title="Удалить стену [Delete]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        );
      })()}

      {/* 3. Всплывающий инпут прямо на чертеже при двойном клике */}
      {editingTarget && (
        <div
          style={{
            left: `${Math.max(10, Math.min(window.innerWidth - 240, editingTarget.screenX))}px`,
            top: `${Math.max(10, Math.min(window.innerHeight - 80, editingTarget.screenY))}px`,
          }}
          className="absolute z-50 bg-white rounded-xl shadow-2xl border border-teal-500 p-2 flex items-center gap-1.5 animate-in fade-in zoom-in-95 pointer-events-auto"
        >
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 truncate max-w-[150px]">
              {editingTarget.title}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <input
                type="number"
                value={editInputValue}
                onChange={(e) => setEditInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEditInput();
                  if (e.key === 'Escape') setEditingTarget(null);
                }}
                autoFocus
                className="w-24 px-2 py-1 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white text-slate-900"
              />
              <span className="text-xs font-bold text-slate-500 font-mono">мм</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSaveEditInput}
            className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer transition-colors"
            title="Применить (Enter)"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setEditingTarget(null)}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg cursor-pointer transition-colors"
            title="Отмена (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4. Нижняя плашка подсказок и кнопка применения */}
      <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none gap-2">
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-xl px-3 py-1.5 text-[11px] text-slate-400 shadow-lg pointer-events-auto flex items-center gap-2 flex-wrap">
          <span className="text-amber-400 font-medium">✨ ЛКМ по цифре — перетащить выноску</span>
          <span className="text-slate-500">|</span>
          <span className="text-sky-300 font-medium">🚪 ЛКМ по двери — сдвинуть по стене</span>
          <span className="text-slate-500">|</span>
          <span className="text-emerald-300 font-medium">🧱 Клик по объекту — меню / Del (удалить)</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300 font-medium">2x клик — размер</span>
        </div>

        {/* Баннер статуса запроса к ИИ */}
        {aiStatusMsg && (
          <div className="absolute top-12 left-4 z-40 bg-slate-900/95 text-teal-300 text-xs px-3.5 py-2 rounded-xl border border-teal-500/50 shadow-2xl backdrop-blur-md flex items-center gap-2 animate-in fade-in">
            <Sparkles className="w-4 h-4 text-teal-400 shrink-0 animate-spin" />
            <span>{aiStatusMsg}</span>
          </div>
        )}

        {/* Инлайн-редактор параметров комнаты (Ширина, Длина, S пола, Высота) */}
        {editingRoom && (
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl border-2 border-teal-500 shadow-2xl p-5 w-88 font-sans text-xs animate-in zoom-in-95 pointer-events-auto"
            onMouseDown={e => e.stopPropagation()}
            onMouseUp={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}
            onDoubleClick={e => e.stopPropagation()}
            onPointerDown={e => e.stopPropagation()}
            onKeyDown={e => {
              e.stopPropagation();
              if (e.key === 'Enter') handleSaveRoomEditor();
              if (e.key === 'Escape') setEditingRoom(null);
            }}
          >
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-teal-600" />
                <span>Параметры комнаты</span>
              </div>
              <button
                type="button"
                onClick={() => setEditingRoom(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Название помещения:</label>
                <input
                  type="text"
                  value={roomEditName}
                  onChange={e => setRoomEditName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-medium text-slate-800 focus:border-teal-500 outline-none"
                  placeholder="Например: Спальня 1"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Длина стены (мм):</label>
                  <input
                    type="text"
                    value={roomEditLengthMm}
                    onChange={e => {
                      const v = e.target.value;
                      setRoomEditLengthMm(v);
                      const l = parseFloat(v);
                      const w = parseFloat(roomEditWidthMm);
                      if (!isNaN(l) && !isNaN(w) && l > 0 && w > 0) {
                        setRoomEditAreaM2(((l * w) / 1000000).toFixed(2));
                      }
                    }}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:border-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Ширина стены (мм):</label>
                  <input
                    type="text"
                    value={roomEditWidthMm}
                    onChange={e => {
                      const v = e.target.value;
                      setRoomEditWidthMm(v);
                      const w = parseFloat(v);
                      const l = parseFloat(roomEditLengthMm);
                      if (!isNaN(l) && !isNaN(w) && l > 0 && w > 0) {
                        setRoomEditAreaM2(((l * w) / 1000000).toFixed(2));
                      }
                    }}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:border-teal-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Площадь пола (м²):</label>
                  <input
                    type="text"
                    value={roomEditAreaM2}
                    onChange={e => {
                      const v = e.target.value;
                      setRoomEditAreaM2(v);
                      const a = parseFloat(v);
                      const l = parseFloat(roomEditLengthMm);
                      if (!isNaN(a) && !isNaN(l) && a > 0 && l > 0) {
                        setRoomEditWidthMm(String(Math.round((a * 1000000) / l)));
                      }
                    }}
                    className="w-full px-2.5 py-1.5 border border-teal-400 bg-teal-50/50 rounded-lg font-mono font-extrabold text-teal-800 focus:border-teal-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Высота потолка h (м):</label>
                  <input
                    type="text"
                    value={roomEditHeightM}
                    onChange={e => setRoomEditHeightM(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-slate-800 focus:border-teal-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-200">
                <span className="text-[10px] text-slate-400">Enter — применить, Esc — отмена</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingRoom(null)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                  >
                    Отмена
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveRoomEditor}
                    className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Применить</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {onApplyToCanvas && (
          <button
            type="button"
            onClick={() => onApplyToCanvas(currentWalls, manualDimOffsets, currentRooms)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xl shadow-emerald-950/40 flex items-center gap-2 cursor-pointer transition-all hover:scale-102 active:scale-98 pointer-events-auto border border-emerald-400/40"
            title="Перенести полученные стены, двери и выноски размеров на рабочий холст"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-100" />
            <span>Применить на рабочий холст</span>
          </button>
        )}
      </div>
    </div>
  );
};
