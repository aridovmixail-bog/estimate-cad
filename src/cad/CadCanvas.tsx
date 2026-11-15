import React, { useRef, useEffect, useState, useCallback } from 'react';

import { Point, Wall, Room, Opening, WindowSizePreset, Fixture, FixtureType, FixtureCategory, FixtureDefinition, DimensionUnit, DimensionStyle, CadBackdrop, BackdropCalibrationState } from './types';

import {

  distance,

  calculateSmartSnap,

  calculatePolygonArea,

  calculatePerimeter,

  getCentroid,

  findNearestWall,

  findNearestOpening,

  snapOpeningOffset,

  projectPointOnSegment,

  resizeWall,

  resizeWallWithConnected,

  resizeRoomSpanDimension,

  moveWallVertex,

  detectRoomsFromWalls,

  splitWallAtPoint,

  dissolveVertex,

  findBestInteriorRoomLabelPoint,

  AlignmentGuide,

  isPointInsidePolygon

} from './geometry';

import { EstimateRoomsPanel } from '../components/EstimateRoomsPanel';

import { SandwichConstructorModal } from '../components/SandwichConstructorModal';

import { PlanNotesSidePanel } from '../components/PlanNotesSidePanel';
import { DetectedRoomsModal } from '../components/DetectedRoomsModal';
import { FixtureEditModal } from './FixtureEditModal';

import { vectorizePlanImage } from './planVectorizer';

import { useTypography } from '../context/TypographyContext';

import { DEFAULT_PIROGS } from '../estimate/defaultPirogs';

import { PirogDefinition } from '../estimate/types';
import { 
  ImportedRoomData, 
  createImportedRoom, 
  convertImportedRoomsToCadRooms, 
  parseHandwrittenNotesToRooms 
} from './roomDataSheet';

import { 

  FileSpreadsheet,

  Maximize2, 

  RotateCcw, 

  CheckCircle2, 

  Grid, 

  Ruler, 

  Layers, 

  ZoomIn, 

  ZoomOut, 

  Pencil, 

  Trash2, 

  DoorOpen, 

  LayoutGrid, 

  Zap, 

  Droplets, 

  CircleDot,

  Utensils,

  Bath,

  Plus, 

  MousePointer, 

  Undo2, 

  Sparkles, 

  Square,

  X, 

  AlertTriangle, 

  Move, 

  MoveHorizontal, 

  Target,

  ArrowLeftRight,

  RotateCw,

  Hand,

  HelpCircle,

  Info,

  ListOrdered,

  ChevronDown,

  ChevronUp,

  Copy,

  Check,

  Upload,

  Image as ImageIcon,

  Palette,

  FileText,

  Wand2,

  Search,

  ClipboardList,

  Eye,

  EyeOff,

  Lock,

  Unlock,

  Loader2

} from 'lucide-react';

import { actionLogger, ActionLogEntry } from './actionLogger';

import { 

  FIXTURE_CATALOG, 

  getFixtureDefinition, 

  findNearestFixture, 

  drawFixture2D, 

  drawFixtureDimensionTies, 

  drawWallFixtureTiers,

  snapFixtureToNearestWallInRoom,

  getActiveFixtureCatalog,

  setCustomFixtureCatalogRegistry

} from './fixtures';

import {

  GRAPHIC_SYMBOLS_CATALOG,

  getGraphicSymbolsByCategory,

  getGraphicSymbolById,

  GraphicSymbolItem

} from './symbolCatalog';

import { SymbolThumbnail } from './SymbolThumbnail';

import { drawArchitecturalWallChains, drawRoomSpanDimensions, drawCeilingHeightStamp, formatDimValue, DimHitBox } from './dimensions';



interface CadCanvasProps {

  ceilingHeight: number;

  doorDefaultHeight: number;

  doorDefaultWidth: number;

  windowWidth: number;

  windowHeight: number;

  windowPresets: WindowSizePreset[];

  onRoomCreated?: (room: Room) => void;

  onRoomsUpdated?: (rooms: Room[]) => void;

  onOpenRoomFinishes?: (room: Room) => void;

  onClearAll?: () => void;
  onCeilingHeightChange?: (height: number) => void;

  onNavigateToEstimate?: () => void;

  externalRooms?: Room[];

}



interface ContextMenuState {

  visible: boolean;

  screenPos: Point;

  worldPos: Point;

  targetFixture: Fixture | null;

  targetOpening: { wall: Wall; opening: Opening } | null;

  targetVertex: Point | null;

  targetWall: Wall | null;

  targetRoom: Room | null;

  offsetAlongWall: number;

}



interface HistorySnapshot {

  walls: Wall[];

  rooms: Room[];

}



interface SelectedOpeningState {

  wallId: string;

  openingId: string;

}



export const CadCanvas: React.FC<CadCanvasProps> = ({ 

  ceilingHeight,

  doorDefaultHeight,

  doorDefaultWidth,

  windowWidth,

  windowHeight,

  windowPresets,

  onRoomCreated,

  onRoomsUpdated,

  onOpenRoomFinishes,
  onClearAll,
  onCeilingHeightChange,
  externalRooms

}) => {

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);



  // Блокировка контекстного меню браузера внутри рабочей области CAD:

  // При нажатии ПКМ открывается ТОЛЬКО инженерное меню CAD, а не меню браузера!

  useEffect(() => {

    const handleGlobalContextMenu = (e: MouseEvent) => {

      if (containerRef.current && containerRef.current.contains(e.target as Node)) {

        e.preventDefault();

      }

    };

    window.addEventListener('contextmenu', handleGlobalContextMenu, { capture: true });

    return () => window.removeEventListener('contextmenu', handleGlobalContextMenu, { capture: true });

  }, []);



  // Выборка размеров окон при вставке

  const [showWindowPresetMenu, setShowWindowPresetMenu] = useState<boolean>(false);



  // Режим инструмента: 'draw' (черчение), 'select' (выбор), 'pan' (панорама), 'room_rect' (быстрая комната)

  const [toolMode, setToolMode] = useState<'draw' | 'select' | 'pan' | 'room_rect' | 'move_all'>('draw');

  const [isDraggingAllApartment, setIsDraggingAllApartment] = useState<boolean>(false);

  const moveAllStartRef = useRef<{

    startWorld: Point;

    initialWalls: Wall[];

    initialFixtures: Fixture[];

    initialRooms: Room[];

  } | null>(null);



  // Глобальный масштаб шрифтов из TypographyContext

  const { fontScale, scaleFactor: fontScaleFactor, setFontScale, increaseFontScale, decreaseFontScale } = useTypography();

  const [rectStartPoint, setRectStartPoint] = useState<Point | null>(null);

  const [rectCurrentPoint, setRectCurrentPoint] = useState<Point | null>(null);

  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);

  const [isShiftPressed, setIsShiftPressed] = useState<boolean>(false);



  // Обозначения (Электрика и Сантехника)

  const [fixtures, setFixtures] = useState<Fixture[]>(() => {

    try {

      const saved = localStorage.getItem('estimate_cad_fixtures');

      return saved ? JSON.parse(saved) : [];

    } catch {

      return [];

    }

  });

  const [activeFixtureType, setActiveFixtureType] = useState<FixtureType | null>(null);

  const [fixtureRotation, setFixtureRotation] = useState<number>(0);

  const [selectedFixtureId, setSelectedFixtureId] = useState<string | null>(null);
  const [hoveredFixtureId, setHoveredFixtureId] = useState<string | null>(null);
  const [draggingFixture, setDraggingFixture] = useState<{ id: string; offsetWorld: Point } | null>(null);
  const [editingFixtureModalTarget, setEditingFixtureModalTarget] = useState<Fixture | null>(null);

  const [fixtureCornerInput, setFixtureCornerInput] = useState<string>('');

  const [showFixturePalette, setShowFixturePalette] = useState<boolean>(false);

  const [fixtureCategoryTab, setFixtureCategoryTab] = useState<FixtureCategory>('electric');

  const [fixtureCatalog, setFixtureCatalog] = useState<FixtureDefinition[]>(getActiveFixtureCatalog);

  const [editingFixtureDef, setEditingFixtureDef] = useState<FixtureDefinition | null>(null);

  const [isAddingFixtureDef, setIsAddingFixtureDef] = useState<boolean>(false);

  const [showEstimateWindow, setShowEstimateWindow] = useState<boolean>(false);



  // Галерея символов ГОСТ и загрузка пользовательских обозначений с ПК

  const [showSymbolGalleryModal, setShowSymbolGalleryModal] = useState<boolean>(false);

  const [galleryCategoryFilter, setGalleryCategoryFilter] = useState<string>('all');

  const [gallerySearchQuery, setGallerySearchQuery] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);



  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {

    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/') && !file.name.endsWith('.svg')) {

      showToast('⚠️ Выберите файл изображения (SVG, PNG, JPG)');

      return;

    }

    const cleanName = file.name.replace(/\.[^/.]+$/, '');

    const reader = new FileReader();

    reader.onload = (event) => {

      const dataUrl = event.target?.result as string;

      if (!dataUrl) return;



      setEditingFixtureDef(prev => {

        if (prev) {

          return {

            ...prev,

            customIconUrl: dataUrl,

            baseGraphic: 'custom_image',

            name: prev.name && !prev.name.startsWith('Новое') ? prev.name : cleanName,

            shortLabel: prev.shortLabel || cleanName.slice(0, 14)

          };

        }

        // Если редактор не был открыт — создаем новое обозначение с загруженным изображением

        return {

          type: `custom_${Date.now()}`,

          name: cleanName,

          shortLabel: cleanName.slice(0, 14),

          category: (galleryCategoryFilter === 'all' ? 'electric' : galleryCategoryFilter) as FixtureCategory,

          width: 0.40,

          height: 0.40,

          color: '#2563eb',

          defaultHeightFromFloor: 0.50,

          baseGraphic: 'custom_image',

          customIconUrl: dataUrl,

          isCustom: true

        };

      });

      setIsAddingFixtureDef(true);

      setShowSymbolGalleryModal(false);

      showToast(`✅ Загружен элемент с ПК: ${file.name}`);

    };

    reader.readAsDataURL(file);

    e.target.value = '';

  };



  // Подложка чертежа (Backdrop): по умолчанию отключена, чертёж чертится прямо на чистом листе CAD

  // Подложка чертежа (Backdrop): восстанавливаем из localStorage при наличии

  const [backdrop, setBackdrop] = useState<CadBackdrop | null>(() => {

    try {

      const meta = localStorage.getItem('estimate_cad_backdrop_meta');

      const imgUrl = localStorage.getItem('estimate_cad_backdrop_img') || localStorage.getItem('estimate_cad_current_blueprint');

      if (meta && imgUrl) {

        const parsed = JSON.parse(meta);

        const img = new Image();

        img.src = imgUrl;

        return {

          ...parsed,

          imageUrl: imgUrl,

          imageElement: img,

          visible: parsed.visible !== false,

          locked: parsed.locked !== false

        };

      }

    } catch {}

    return null;

  });



  // Шпаргалка с данными чертежа (экспликация, общая площадь, высоты, примечания)

  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState<boolean>(false);

  const [isCheatSheetLoading, setIsCheatSheetLoading] = useState<boolean>(false);

  const [cheatSheetData, setCheatSheetData] = useState<{

    rooms: Array<{ id?: string; name: string; area: number; isWet?: boolean; isLiving?: boolean }>;

    totalArea?: number;

    ceilingHeightMm?: number;

    textNotes: string[];

    rawSummary?: string;

    detectedDimensions?: Array<{ valueMm: number; text: string; normX: number; normY: number; xPx?: number; yPx?: number }>;

  } | null>(() => {

    try {

      const saved = localStorage.getItem('estimate_cad_cheatsheet_data');

      if (saved) return JSON.parse(saved);

    } catch {}

    return null;

  });



  const [calibration, setCalibration] = useState<BackdropCalibrationState>({

    active: false,

    step: 'pick_p1',

    p1World: null,

    p2World: null

  });

  const [calibrationInputMm, setCalibrationInputMm] = useState<string>('3000');

  const [isMovingBackdrop, setIsMovingBackdrop] = useState<boolean>(false);

  const [isDraggingBackdrop, setIsDraggingBackdrop] = useState<boolean>(false);

  const backdropDragStart = useRef<{ mouseWorld: Point; originBackdrop: Point } | null>(null);

  const backdropFileInputRef = useRef<HTMLInputElement | null>(null);



  // Пользовательские бутерброды (пироги отделки)

  const [customPirogs, setCustomPirogs] = useState<PirogDefinition[]>(() => {

    try {

      const saved = localStorage.getItem('estimate_cad_custom_pirogs_v1');

      if (saved) return JSON.parse(saved);

    } catch (e) {

      console.warn('Не удалось загрузить пользовательские бутерброды:', e);

    }

    return DEFAULT_PIROGS;

  });



  const handleSaveCustomPirogs = (updated: PirogDefinition[]) => {

    setCustomPirogs(updated);

    try {

      localStorage.setItem('estimate_cad_custom_pirogs_v1', JSON.stringify(updated));

    } catch (e) {

      console.error('Ошибка записи бутербродов в localStorage:', e);

    }

    showToast('✅ База бутербродов успешно обновлена!');

  };



  const [showConstructorModal, setShowConstructorModal] = useState<boolean>(false);
  const [isDetectedModalOpen, setIsDetectedModalOpen] = useState<boolean>(false);
  const [rawDetectedRooms, setRawDetectedRooms] = useState<ImportedRoomData[]>([]);

  // Двусторонняя синхронизация комнат из раздела «Обмер» на холст чертежа
  useEffect(() => {
    if (externalRooms && externalRooms.length > 0) {
      setRooms(prevRooms => {
        let changed = false;
        const updated = prevRooms.map(r => {
          const ext = externalRooms.find(e => e.id === r.id);
          if (ext && (ext.name !== r.name || ext.doorsCount !== r.doorsCount || ext.windowsCount !== r.windowsCount)) {
            changed = true;
            return { ...r, name: ext.name, doorsCount: ext.doorsCount, windowsCount: ext.windowsCount };
          }
          return r;
        });
        return changed ? updated : prevRooms;
      });
    }
  }, [externalRooms]);

  const [showDetectedTextModal, setShowDetectedTextModal] = useState<boolean>(false);

  const [isCalqueModeActive, setIsCalqueModeActive] = useState<boolean>(false);

  const [detectedTextNotes, setDetectedTextNotes] = useState<string[]>([]);

  const [vectorizeSummary, setVectorizeSummary] = useState<string>('');

  const [isVectorizing, setIsVectorizing] = useState<boolean>(false);

  const [currentBlueprintImageUrl, setCurrentBlueprintImageUrl] = useState<string | null>(() => {

    try {

      return localStorage.getItem('estimate_cad_current_blueprint') || null;

    } catch {

      return null;

    }

  });

  const [currentBlueprintName, setCurrentBlueprintName] = useState<string>(() => {

    try {

      return localStorage.getItem('estimate_cad_current_blueprint_name') || 'Обмерный план';

    } catch {

      return 'Обмерный план';

    }

  });



  const applyCalibration = () => {

    if (!backdrop || !calibration.p1World || !calibration.p2World) return;

    const targetMm = parseFloat(calibrationInputMm.replace(',', '.'));

    if (isNaN(targetMm) || targetMm <= 0) {

      showToast('⚠️ Введите корректный размер в мм');

      return;

    }

    const currentDistM = distance(calibration.p1World, calibration.p2World);

    if (currentDistM <= 0.001) {

      showToast('⚠️ Отрезок слишком мал для калибровки');

      return;

    }

    const targetDistM = targetMm / 1000;

    const ratio = targetDistM / currentDistM;



    setBackdrop(prev => {

      if (!prev) return null;

      const newW = prev.widthMeters * ratio;

      const newH = prev.heightMeters * ratio;

      const p1 = calibration.p1World!;

      const relX = p1.x - prev.x;

      const relY = p1.y - prev.y;

      const newX = p1.x - relX * ratio;

      const newY = p1.y - relY * ratio;



      const updated = {

        ...prev,

        x: newX,

        y: newY,

        widthMeters: newW,

        heightMeters: newH

      };



      try {

        localStorage.setItem('estimate_cad_backdrop_meta', JSON.stringify({

          id: updated.id,

          name: updated.name,

          x: updated.x,

          y: updated.y,

          widthMeters: updated.widthMeters,

          heightMeters: updated.heightMeters,

          aspectRatio: updated.aspectRatio,

          rotationDeg: updated.rotationDeg,

          opacity: updated.opacity,

          visible: updated.visible,

          locked: updated.locked

        }));

      } catch {}



      return updated;

    });



    setCalibration({

      active: false,

      step: 'pick_p1',

      p1World: null,

      p2World: null

    });

    showToast(`🎯 Масштаб подложки откалиброван 1:1 (${targetMm} мм)!`);

  };



  // Тихое фоновое распознавание данных чертежа в шпаргалку (без блокировки холста и без модалок)

  const fetchQuietCheatSheetData = async (imageUrl: string) => {

    setIsCheatSheetLoading(true);

    try {

      const result = await vectorizePlanImage(imageUrl, {

        approxTotalWidthMeters: 10.0

      });



      if (result) {

        const explicationRooms = (result.explication?.rooms && result.explication.rooms.length > 0)

          ? result.explication.rooms.map((r: any, idx: number) => ({

              id: r.id || `expl_room_${idx + 1}`,

              name: r.name || `Помещение ${idx + 1}`,

              area: Number(r.area) || 0,

              isWet: Boolean(r.isWet),

              isLiving: Boolean(r.isLiving)

            }))

          : (result.detectedRooms || []).map((r: any, idx: number) => ({

              id: r.id || `det_room_${idx + 1}`,

              name: r.name || `Помещение ${idx + 1}`,

              area: Number(r.floorArea || r.areaApprox) || 0,

              isWet: Boolean(r.isWet),

              isLiving: !r.isWet && !r.isShaft

            }));



        let totalArea = Number(result.explication?.totalArea || result.totalCalculatedArea) || 0;

        if (totalArea <= 0 && explicationRooms.length > 0) {

          totalArea = explicationRooms.reduce((sum, r) => sum + (r.area || 0), 0);

        }



        let hMm: number | undefined = undefined;

        if (result.explication?.ceilingHeight && result.explication.ceilingHeight > 0) {

          hMm = Math.round(result.explication.ceilingHeight * 1000);

        } else if ((result as any).ceiling_height_mm) {

          hMm = Number((result as any).ceiling_height_mm);

        }



        const sheetData = {

          rooms: explicationRooms,

          totalArea: totalArea > 0 ? Math.round(totalArea * 100) / 100 : undefined,

          ceilingHeightMm: hMm,

          textNotes: result.detectedTextNotes || [],

          rawSummary: result.rawSummary || '',

          detectedDimensions: result.detectedDimensions || []

        };



        setCheatSheetData(sheetData);

        try {

          localStorage.setItem('estimate_cad_cheatsheet_data', JSON.stringify(sheetData));

        } catch {}



        if (result.detectedTextNotes && result.detectedTextNotes.length > 0) {

          setDetectedTextNotes(result.detectedTextNotes);

        }

        if (result.rawSummary) {

          setVectorizeSummary(result.rawSummary);

        }



        const currentH = (hMm && hMm > 0) ? hMm / 1000 : ceilingHeight;
        let finalImportedRooms: ImportedRoomData[] = [];

        if (result.detectedTextNotes && result.detectedTextNotes.length > 0) {
          const parsed = parseHandwrittenNotesToRooms(result.detectedTextNotes, currentH);
          if (parsed.rooms && parsed.rooms.length > 0) {
            finalImportedRooms = parsed.rooms;
          }
        }

        if (finalImportedRooms.length === 0 && explicationRooms && explicationRooms.length > 0) {
          finalImportedRooms = explicationRooms.map((r: any) => {
            const area = Number(r.area) || 0;
            const isWet = Boolean(r.isWet);
            return createImportedRoom({
              name: r.name || 'Помещение',
              floorArea: area,
              ceilingHeight: currentH,
              doorsCount: 1,
              doorWidth: isWet ? 0.70 : 0.80,
              windowsCount: isWet ? 0 : 1,
              windowWidth: 1.40,
              windowHeight: 1.40
            });
          });
        }

        if (finalImportedRooms.length > 0) {
          setRawDetectedRooms(finalImportedRooms);
          setIsDetectedModalOpen(true);
          showToast(`📋 На чертеже распознано ${finalImportedRooms.length} помещений. Открыто окно проверки!`);
        }

        setIsCheatSheetOpen(false);

      }

    } catch (err) {

      console.warn('Quiet cheat sheet fetch error:', err);

    } finally {

      setIsCheatSheetLoading(false);

    }

  };



  // Единое надежное панорамирование листа (без рывков и скачков)

  const [isPanning, setIsPanning] = useState<boolean>(false);

  const panDragRef = useRef<{

    startX: number;

    startY: number;

    startOffsetX: number;

    startOffsetY: number;

    isDragging: boolean;

    hasMoved: boolean;

    isSheetHold: boolean;

  } | null>(null);



  // Перетаскивание и динамическое положение подписи комнаты

  const [draggingRoomLabelId, setDraggingRoomLabelId] = useState<string | null>(null);

  const [roomLabelDragOffset, setRoomLabelDragOffset] = useState<Point>({ x: 0, y: 0 });



  // Режим отображения размеров (ГОСТ / АР как на образце vs бейджи)

  const [dimensionUnit, setDimensionUnit] = useState<DimensionUnit>(() => {

    return (localStorage.getItem('estimate_cad_dim_unit') as DimensionUnit) || 'mm';

  });

  const [dimensionStyle, setDimensionStyle] = useState<DimensionStyle>(() => {

    return (localStorage.getItem('estimate_cad_dim_style') as DimensionStyle) || 'architectural';

  });

  const [showRoomSpans, setShowRoomSpans] = useState<boolean>(true);



  useEffect(() => {

    localStorage.setItem('estimate_cad_dim_unit', dimensionUnit);

  }, [dimensionUnit]);



  useEffect(() => {

    localStorage.setItem('estimate_cad_dim_style', dimensionStyle);

  }, [dimensionStyle]);



  useEffect(() => {

    try {

      localStorage.setItem('estimate_cad_fixtures', JSON.stringify(fixtures));

    } catch (e) {

      console.error(e);

    }

  }, [fixtures]);



  // Камера: зум и панорама

  const [scale, setScale] = useState<number>(70);

  const [offset, setOffset] = useState<Point>({ x: 350, y: 350 });



  // Параметры черчения

  const [wallThickness, setWallThickness] = useState<number>(0.10); // Единая стандартная толщина всех стен 100 мм

  const [orthoMode, setOrthoMode] = useState<boolean>(false);



  // Гарантируем одинаковую толщину всех стен (100 мм) вне зависимости от раздела

  useEffect(() => {

    setAllWalls(prev => {

      const hasDifferent = prev.some(w => w.thickness !== 0.10);

      if (hasDifferent) {

        return prev.map(w => ({ ...w, thickness: 0.10 }));

      }

      return prev;

    });

  }, []);

  

  // Состояние чертежа

  const [rooms, setRooms] = useState<Room[]>([]);



  // Расчет точек электрики и сантехники по помещениям для сметы

  const electricCountsByRoom = React.useMemo(() => {

    const counts: Record<string, number> = {};

    rooms.forEach(room => { counts[room.id] = 0; });

    fixtures.forEach(f => {

      if (f.category === 'electric') {

        const room = f.roomId 

          ? rooms.find(r => r.id === f.roomId) 

          : rooms.find(r => isPointInsidePolygon({ x: f.x, y: f.y }, r.points));

        if (room) {

          counts[room.id] = (counts[room.id] || 0) + 1;

        }

      }

    });

    return counts;

  }, [rooms, fixtures]);



  const plumbingCountsByRoom = React.useMemo(() => {

    const counts: Record<string, number> = {};

    rooms.forEach(room => { counts[room.id] = 0; });

    fixtures.forEach(f => {

      if (f.category === 'plumbing') {

        const room = f.roomId 

          ? rooms.find(r => r.id === f.roomId) 

          : rooms.find(r => isPointInsidePolygon({ x: f.x, y: f.y }, r.points));

        if (room) {

          counts[room.id] = (counts[room.id] || 0) + 1;

        }

      }

    });

    return counts;

  }, [rooms, fixtures]);

  const [allWalls, setAllWalls] = useState<Wall[]>([]);

  const [currentWallStart, setCurrentWallStart] = useState<Point | null>(null);

  const [cursorWorld, setCursorWorld] = useState<Point>({ x: 0, y: 0 });

  const [snappedCursor, setSnappedCursor] = useState<Point>({ x: 0, y: 0 });

  const [activeGuides, setActiveGuides] = useState<AlignmentGuide[]>([]);

  const [isSnapToClose, setIsSnapToClose] = useState<boolean>(false);

  const [isSnappedToVertex, setIsSnappedToVertex] = useState<boolean>(false);

  const [isSnappedToWall, setIsSnappedToWall] = useState<boolean>(false);



  // Выделенная комната

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  const [expandedRoomWallsId, setExpandedRoomWallsId] = useState<string | null>(null);



  // Цепочка точек активного черчения

  const [chainPoints, setChainPoints] = useState<Point[]>([]);



  // Выделенная стена

  const [selectedWallId, setSelectedWallId] = useState<string | null>(null);

  const [hoveredWallId, setHoveredWallId] = useState<string | null>(null);

  const [editWallLengthInput, setEditWallLengthInput] = useState<string>('');



  // Выделенная угловая точка / вершина

  const [selectedVertex, setSelectedVertex] = useState<Point | null>(null);

  const [dragStartPos, setDragStartPos] = useState<Point | null>(null);

  const [hasMovedDuringVertexDrag, setHasMovedDuringVertexDrag] = useState<boolean>(false);



  // Перетаскивание вершин углов (Corner handles dragging)

  const [draggingVertex, setDraggingVertex] = useState<Point | null>(null);

  const [hoveredVertex, setHoveredVertex] = useState<Point | null>(null);

  const [pendingVertexClick, setPendingVertexClick] = useState<Point | null>(null);

  const [mouseDownPos, setMouseDownPos] = useState<Point | null>(null);



  // Выделенный проем

  const [selectedOpening, setSelectedOpening] = useState<SelectedOpeningState | null>(null);

  const [isDraggingOpening, setIsDraggingOpening] = useState<boolean>(false);

  const [hoveredOpeningId, setHoveredOpeningId] = useState<string | null>(null);



  // Свободное перемещение цифр размеров мышкой (ГОСТ выноски с полочками)

  const [manualDimOffsets, setManualDimOffsets] = useState<Record<string, { x: number; y: number }>>({});

  const dimHitBoxesRef = useRef<DimHitBox[]>([]);

  const [hoveredDimKey, setHoveredDimKey] = useState<string | null>(null);

  const [draggingDimKey, setDraggingDimKey] = useState<string | null>(null);

  const dragDimStartMouseRef = useRef<Point>({ x: 0, y: 0 });

  const dragDimInitialOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const dragDimCandidateRef = useRef<{ hitDim: DimHitBox; mouseStart: Point; initialOffset: { x: number; y: number } } | null>(null);



  // Всплывающее редактирование размера / проёма по двойному клику

  const [inlineDimEditTarget, setInlineDimEditTarget] = useState<{

    type: 'dim' | 'opening';

    wallId: string;

    dimKey?: string;

    openingId?: string;

    currentValMm: number;

    title: string;

    screenX: number;

    screenY: number;

  } | null>(null);

  const [inlineDimEditValue, setInlineDimEditValue] = useState<string>('');



  // История (Undo)

  const [history, setHistory] = useState<HistorySnapshot[]>([]);



  // Вкладки ленты Ribbon (AutoCAD / NanoCAD стиль)

  const [activeRibbonTab, setActiveRibbonTab] = useState<'drawing' | 'gost' | 'estimate' | 'backdrop'>('drawing');

  const [showGrid, setShowGrid] = useState<boolean>(true);

  const [smartSnapEnabled, setSmartSnapEnabled] = useState<boolean>(true);



  // Модалка очистки

  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);



  // Ручной ввод длины новой стены

  const [isEditingLength, setIsEditingLength] = useState<boolean>(false);

  const [manualLengthInput, setManualLengthInput] = useState<string>('');

  const inputRef = useRef<HTMLInputElement | null>(null);



  // Редактирование имени комнаты

  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);

  const [editingRoomName, setEditingRoomName] = useState<string>('');



  // Контекстное меню ПКМ

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({

    visible: false,

    screenPos: { x: 0, y: 0 },

    worldPos: { x: 0, y: 0 },

    targetFixture: null,

    targetOpening: null,

    targetVertex: null,

    targetWall: null,

    targetRoom: null,

    offsetAlongWall: 0

  });



  // Подсказки, журнал действий и модалка справки

  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  const [showActionDrawer, setShowActionDrawer] = useState<boolean>(false);

  const [actionLogs, setActionLogs] = useState<ActionLogEntry[]>([]);

  const [copiedLogs, setCopiedLogs] = useState<boolean>(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);



  const showToast = useCallback((msg: string) => {

    setToastMessage(msg);

    setTimeout(() => {

      setToastMessage(prev => prev === msg ? null : prev);

    }, 3500);

  }, []);



  useEffect(() => {

    return actionLogger.subscribe(setActionLogs);

  }, []);



  // Преобразование координат

  const screenToWorld = useCallback((screenX: number, screenY: number): Point => {

    return {

      x: (screenX - offset.x) / scale,

      y: (screenY - offset.y) / scale,

    };

  }, [offset, scale]);



  const worldToScreen = useCallback((worldX: number, worldY: number): Point => {

    return {

      x: worldX * scale + offset.x,

      y: worldY * scale + offset.y,

    };

  }, [offset, scale]);



  // Сохранение истории

  const pushHistory = useCallback(() => {

    setHistory(prev => [...prev.slice(-25), { walls: allWalls, rooms }]);

  }, [allWalls, rooms]);



  const handleUndo = () => {

    if (history.length === 0) return;

    const lastSnapshot = history[history.length - 1];

    setHistory(prev => prev.slice(0, prev.length - 1));

    setAllWalls(lastSnapshot.walls);

    setRooms(lastSnapshot.rooms);

    if (onRoomsUpdated) onRoomsUpdated(lastSnapshot.rooms);

    setSelectedWallId(null);

    setSelectedOpening(null);

  };



  // Автоматический пересчет замкнутых комнат на базе графа стен

  const updateRoomsFromWalls = useCallback((newWalls: Wall[]) => {

    if (!newWalls || newWalls.length < 3) {

      setRooms([]);

      if (onRoomsUpdated) onRoomsUpdated([]);

      return;

    }

    setRooms(prevRooms => {

      const detected = detectRoomsFromWalls(newWalls, ceilingHeight, prevRooms);

      if (onRoomsUpdated) onRoomsUpdated(detected);

      return detected;

    });

  }, [ceilingHeight, onRoomsUpdated]);



  // Реакция на изменение высоты потолков из боковой панели проекта

  const prevCeilingHeightRef = useRef(ceilingHeight);

  useEffect(() => {

    if (prevCeilingHeightRef.current !== ceilingHeight) {

      prevCeilingHeightRef.current = ceilingHeight;

      if (allWalls.length >= 3) {

        updateRoomsFromWalls(allWalls);

      }

    }

  }, [ceilingHeight, allWalls, updateRoomsFromWalls]);



  // Защита целостности: ручные и импортированные комнаты не удаляются при отсутствии стен!



  // Интеллектуальное преобразование растрового плана в нативные стены CAD + извлечение текста

  const handleVectorizeBackdrop = async (targetBackdrop?: CadBackdrop | string | null) => {

    let imageUrl = '';

    if (typeof targetBackdrop === 'string') {

      imageUrl = targetBackdrop;

    } else if (targetBackdrop?.imageUrl) {

      imageUrl = targetBackdrop.imageUrl;

    } else if (backdrop?.imageUrl) {

      imageUrl = backdrop.imageUrl;

    }



    if (!imageUrl) {

      showToast('⚠️ Сначала выберите файл изображения плана');

      return;

    }



    // Сохраняем исходное изображение для просмотрщика в боковой панели сравнения:

    setCurrentBlueprintImageUrl(imageUrl);

    try {

      localStorage.setItem('estimate_cad_current_blueprint', imageUrl);

    } catch {}



    setIsVectorizing(true);

    showToast('🔍 Сканирование чертежа и чтение надписей (RapidOCR + OpenCV)...');

    try {

      // Загружаем план как полупрозрачную подложку (кальку) на правый рабочий холст

      const img = new Image();

      img.src = imageUrl;

      img.onload = () => {

        const aspect = (img.width || 1000) / (img.height || 800);

        const wMeters = 10.0;

        const hMeters = wMeters / aspect;

        const newBackdrop: CadBackdrop = {

          id: `backdrop_${Date.now()}`,

          name: currentBlueprintName || 'Обмерный план',

          imageUrl,

          imageElement: img,

          x: 0,

          y: 0,

          widthMeters: wMeters,

          heightMeters: hMeters,

          aspectRatio: aspect,

          rotationDeg: 0,

          opacity: 0.50, // 50% полупрозрачная калька

          visible: true,

          locked: false

        };

        setBackdrop(newBackdrop);

        try {

          localStorage.setItem('estimate_cad_backdrop_meta', JSON.stringify({

            id: newBackdrop.id,

            name: newBackdrop.name,

            x: 0,

            y: 0,

            widthMeters: wMeters,

            heightMeters: hMeters,

            aspectRatio: aspect,

            rotationDeg: 0,

            opacity: 0.50,

            visible: true,

            locked: false

          }));

          localStorage.setItem('estimate_cad_backdrop_img', imageUrl);

        } catch {}

      };



      const result = await vectorizePlanImage(imageUrl, {

        approxTotalWidthMeters: 8.5

      });



      if (!result.walls || result.walls.length === 0) {

        setAllWalls([]);

        setRooms([]);

        if (result.detectedTextNotes && result.detectedTextNotes.length > 0) {

          setDetectedTextNotes(result.detectedTextNotes);

        }

        if (result.rawSummary) {

          setVectorizeSummary(result.rawSummary);

        }

        setIsVectorizing(false);

        setToolMode('room_rect');



        const canvasW = canvasRef.current?.width || 800;

        const canvasH = canvasRef.current?.height || 600;

        const targetScale = Math.min(canvasW / 12, canvasH / 10, 50);

        setScale(targetScale);

        setOffset({

          x: canvasW / 2 - 5 * targetScale,

          y: canvasH / 2 - 4 * targetScale

        });



        showToast('📐 План загружен как калька (подложка). Откалибруйте масштаб [📏] или обведите комнаты [🏠 Быстрая комната]!');

        if (result.detectedTextNotes && result.detectedTextNotes.length > 0) {
          const parsed = parseHandwrittenNotesToRooms(result.detectedTextNotes, ceilingHeight);
          if (parsed.rooms && parsed.rooms.length > 0) {
            try {
              localStorage.setItem('estimate_cad_imported_rooms', JSON.stringify(parsed.rooms));
            } catch {}
            const cadRooms = convertImportedRoomsToCadRooms(parsed.rooms);
            setRooms(cadRooms);
            if (onRoomsUpdated) onRoomsUpdated(cadRooms);
            showToast('📋 Рукописные замеры чертежа прочитаны и записаны во вкладку «1. Обмер»!');
          }
        }

        return;

      }



      // Сохраняем состояние холста в историю для отката (Ctrl+Z)

      pushHistory();



      const positionedWalls: Wall[] = (result.walls || []).map(w => ({

        ...w,

        id: w.id || `wall_lego_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,

        start: { x: Math.round(w.start.x * 100) / 100, y: Math.round(w.start.y * 100) / 100 },

        end: { x: Math.round(w.end.x * 100) / 100, y: Math.round(w.end.y * 100) / 100 },

        openings: w.openings && w.openings.length > 0 ? [...w.openings] : []

      }));



      // Чертёж ложится СТРОГО как фоновая подложка (без автоматического нагромождения стен)!
      setAllWalls([]);
      setRooms([]);

      // Подготавливаем распознанные комнаты для модального окна проверки
      let autoDetectedRooms: ImportedRoomData[] = [];
      if (result.detectedRooms && result.detectedRooms.length > 0) {
        autoDetectedRooms = result.detectedRooms.map((r: any, idx: number) => {
          const area = Number(r.floorArea || r.areaApprox) || 0;
          return createImportedRoom({
            name: r.name || `Помещение ${idx + 1}`,
            floorArea: area,
            ceilingHeight: ceilingHeight,
            doorsCount: 1,
            doorWidth: r.isWet ? 0.70 : 0.80,
            windowsCount: r.isWet ? 0 : 1,
            windowWidth: 1.40,
            windowHeight: 1.40
          });
        });
      } else if (result.detectedTextNotes && result.detectedTextNotes.length > 0) {
        const parsed = parseHandwrittenNotesToRooms(result.detectedTextNotes, ceilingHeight);
        if (parsed.rooms && parsed.rooms.length > 0) {
          autoDetectedRooms = parsed.rooms;
        }
      }

      if (autoDetectedRooms.length > 0) {
        setRawDetectedRooms(autoDetectedRooms);
        setIsDetectedModalOpen(true);
        showToast(`📐 Чертёж загружен как подложка. Найдено ${autoDetectedRooms.length} помещений — проверьте в открывшемся окне!`);
      } else {
        showToast('📐 Чертёж загружен как подложка (фон). Откалибруйте масштаб [📏] или чертите стены!');
      }



      // Комнаты формируются строго по параметрическим блокам синтезатора "Магнитное Лего"

      const finalRooms: Room[] = (result.detectedRooms || []).map((r: any, idx: number) => {

        const rawPts = r.points || [];

        const pts = rawPts.map((p: any) => ({

          x: Math.round((p.x ?? 0) * 100) / 100,

          y: Math.round((p.y ?? 0) * 100) / 100

        }));

        const area = Number(r.floorArea || r.areaApprox) || 0;

        const perim = Number(r.perimeter) || (pts.length >= 3 ? pts.reduce((acc: number, pt: any, pIdx: number) => {

          const next = pts[(pIdx + 1) % pts.length];

          return acc + Math.hypot(next.x - pt.x, next.y - pt.y);

        }, 0) : 0);

        const roomH = Number(r.height_mm ? r.height_mm / 1000 : ceilingHeight) || 2.70;

        const grossWall = Number(r.wallGrossArea) || Math.round(perim * roomH * 100) / 100;

        const netWall = Number(r.wallNetArea) || Math.round(grossWall * 0.85 * 100) / 100;



        return {

          id: r.id || ('room_lego_' + (idx + 1)),

          name: r.name || ('Помещение ' + (idx + 1)),

          floorArea: area,

          perimeter: Math.round(perim * 100) / 100,

          ceilingHeight: roomH,

          wallGrossArea: grossWall,

          wallNetArea: netWall,

          openingsTotalArea: 0,

          doorsCount: 1,

          doorsArea: 1.6,

          windowsCount: 1,

          windowsArea: 2.0,

          points: pts,

          walls: [],

          labelPosition: r.suggestedCenter ? {

            x: Math.round((r.suggestedCenter.x ?? 0) * 100) / 100,

            y: Math.round((r.suggestedCenter.y ?? 0) * 100) / 100

          } : undefined,

          roomType: (r.isWet ? 'wet' : 'living') as any,

          isShaft: Boolean(r.isShaft)

        };

      });



      setRooms(finalRooms);

      if (onRoomsUpdated) {

        onRoomsUpdated(finalRooms);

      }



      if (result.scaleMetersPerPx && result.imageWidthPx) {

        const wMeters = result.imageWidthPx * result.scaleMetersPerPx;

        const hMeters = (result.imageHeightPx || 1) * result.scaleMetersPerPx;

        setBackdrop(prev => prev ? {

          ...prev,

          widthMeters: wMeters,

          heightMeters: hMeters

        } : null);

      }





      // Центрируем камеру холста на новые начерченные стены

      const curMinX = Math.min(...positionedWalls.flatMap(w => [w.start.x, w.end.x]));

      const curMaxX = Math.max(...positionedWalls.flatMap(w => [w.start.x, w.end.x]));

      const curMinY = Math.min(...positionedWalls.flatMap(w => [w.start.y, w.end.y]));

      const curMaxY = Math.max(...positionedWalls.flatMap(w => [w.start.y, w.end.y]));

      const planW = curMaxX - curMinX || 8;

      const planH = curMaxY - curMinY || 7;

      const canvasW = canvasRef.current?.width || 800;

      const canvasH = canvasRef.current?.height || 600;

      const targetScale = Math.min(canvasW / (planW + 3), canvasH / (planH + 3), 65);

      const centerX = (curMinX + curMaxX) / 2;

      const centerY = (curMinY + curMaxY) / 2;

      setScale(targetScale);

      setOffset({

        x: canvasW / 2 - centerX * targetScale,

        y: canvasH / 2 - centerY * targetScale

      });



      setDetectedTextNotes(result.detectedTextNotes || []);

      setVectorizeSummary(result.rawSummary || '');

      setIsCalqueModeActive(Boolean(result.useCalqueMode));
      // Не открываем отдельное модальное окно — данные сразу записаны в раздел «Обмер»



      if (result.explication?.hasExplication) {

        showToast(`🎉 Экспликация распознана: ${finalRooms.length} комнат, S=${result.explication.totalArea || Math.round(finalRooms.reduce((s, r) => s + r.floorArea, 0))} м²! Смета рассчитана.`);

      } else {

        showToast(`🎉 Чертёж начерчен на листе! Стен: ${positionedWalls.length}, комнат: ${finalRooms.length}`);

      }

    } catch (err) {

      console.error('Ошибка векторизации чертежа:', err);

      showToast('⚠️ Ошибка при векторизации плана');

    } finally {

      setIsVectorizing(false);

    }

  };



  // Загрузка файла и мгновенный перенос в стены CAD (Поддержка PDF, PNG, JPG, WEBP, SVG)

    // Авто-черновик плана через Gemini 2.5 Flash Vision поверх координатной сетки 100px

  const handleGeminiGridDraft = async () => {

    const imageUrl = backdrop?.imageUrl || currentBlueprintImageUrl;

    if (!imageUrl) {

      showToast('⚠️ Сначала загрузите изображение или PDF плана');

      return;

    }



    const apiKey = localStorage.getItem('estimate_cad_gemini_key') || '';

    setIsVectorizing(true);

    showToast('🤖 Генерация координатной сетки 100px и запрос к Gemini через прокси 127.0.0.1:20809...');



    try {

      const resp = await fetch('http://127.0.0.1:8001/api/gemini-grid-draft', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({

          imageDataUrl: imageUrl,

          apiKey: apiKey || undefined,

          approxTotalWidthMeters: backdrop?.widthMeters || 10.0,

          defaultWallThickness: wallThickness || 0.10

        })

      });



      if (!resp.ok) {

        throw new Error(`Ошибка сервиса: ${resp.status}`);

      }



      const data = await resp.json();

      if (data.walls && data.walls.length > 0) {

        pushHistory();

        setAllWalls(data.walls);

        const nextRooms = detectRoomsFromWalls(data.walls, ceilingHeight);

        setRooms(nextRooms);

        if (onRoomsUpdated) onRoomsUpdated(nextRooms);

        showToast(`✅ Gemini распознал ${data.detectedRooms?.length || nextRooms.length} комнат и ${data.walls.length} стен!`);

        actionLogger.addLog('tool', `Gemini Auto-Draft: ${data.walls.length} стен, ${nextRooms.length} комнат`);

      } else {

        showToast('⚠️ Gemini не вернул замкнутых комнат, используйте ручную обводку [🏠]');

      }

    } catch (err: any) {

      console.error('Gemini Draft Error:', err);

      showToast(`⚠️ Ошибка авто-черновика: ${err.message || 'Проверьте прокси 127.0.0.1:20809 или ключ Gemini API'}`);

    } finally {

      setIsVectorizing(false);

    }

  };



const handleBackdropUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {

    const file = e.target.files?.[0];

    if (!file) return;



    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|svg)$/i.test(file.name);



    if (!isPdf && !isImage) {

      showToast('⚠️ Выберите файл чертежа: PDF, PNG, JPG или WEBP');

      return;

    }



    const reader = new FileReader();

    reader.onload = async (event) => {

      const rawDataUrl = event.target?.result as string;

      if (!rawDataUrl) return;



      let displayImageUrl = rawDataUrl;



      // Если загружен PDF — отправляем на рендеринг первой страницы в 200 DPI через PyMuPDF

      if (isPdf) {

        showToast('📄 Обработка PDF чертежа через PyMuPDF...');

        try {

          const res = await fetch('http://127.0.0.1:8001/api/cad/render-pdf', {

            method: 'POST',

            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify({ fileBase64: rawDataUrl, dpi: 200 })

          });

          if (res.ok) {

            const data = await res.json();

            if (data.pngDataUrl) {

              displayImageUrl = data.pngDataUrl;

              showToast('✅ PDF чертёж успешно конвертирован и открыт!');

            }

          }

        } catch (err) {

          console.warn('PDF render fallback:', err);

        }

      }



      setCurrentBlueprintImageUrl(displayImageUrl);

      setCurrentBlueprintName(file.name || 'План помещения');

      try {

        localStorage.setItem('estimate_cad_current_blueprint', displayImageUrl);

        localStorage.setItem('estimate_cad_current_blueprint_name', file.name || 'План помещения');

      } catch {}



      // 1. Мгновенное открытие чертежа как подложки прямо на главном холсте (0.05-0.1 сек):

      const img = new Image();

      img.src = displayImageUrl;

      img.onload = () => {

        const aspect = (img.width || 1000) / (img.height || 800);

        const wMeters = 10.0;

        const hMeters = wMeters / aspect;

        const newBackdrop: CadBackdrop = {

          id: `backdrop_${Date.now()}`,

          name: file.name || 'План помещения',

          imageUrl: displayImageUrl,

          imageElement: img,

          x: 0,

          y: 0,

          widthMeters: wMeters,

          heightMeters: hMeters,

          aspectRatio: aspect,

          rotationDeg: 0,

          opacity: 0.50, // 50% прозрачности по умолчанию

          visible: true,

          locked: true // locked = true по умолчанию (защита от случайного сдвига)

        };

        setBackdrop(newBackdrop);

        try {

          localStorage.setItem('estimate_cad_backdrop_meta', JSON.stringify({

            id: newBackdrop.id,

            name: newBackdrop.name,

            x: 0,

            y: 0,

            widthMeters: wMeters,

            heightMeters: hMeters,

            aspectRatio: aspect,

            rotationDeg: 0,

            opacity: 0.50,

            visible: true,

            locked: true

          }));

          localStorage.setItem('estimate_cad_backdrop_img', displayImageUrl);

        } catch {}



        // 2. Авто-центрирование (Auto-Fit to View):

        const canvasW = canvasRef.current?.width || window.innerWidth;

        const canvasH = canvasRef.current?.height || window.innerHeight;

        const targetScale = Math.min((canvasW * 0.75) / wMeters, (canvasH * 0.75) / hMeters, 60);

        setScale(targetScale);

        setOffset({

          x: canvasW / 2 - (wMeters / 2) * targetScale,

          y: canvasH / 2 - (hMeters / 2) * targetScale

        });



        // 3. Авто-переключение на инструмент "Стена" (курсор сразу готов к обводке):

        setToolMode('draw');

        setSelectedWallId(null);

        setSelectedOpening(null);

        setSelectedVertex(null);

        showToast('📐 Чертеж открыт как подложка. Включен инструмент «Стена». Калибруйте масштаб [📏] или обводите стены!');

      };



      // 4. Тихое фоновое чтение данных (экспликация, общая площадь, высоты) в шпаргалку:

      fetchQuietCheatSheetData(displayImageUrl);

    };

    reader.readAsDataURL(file);

    e.target.value = '';

  };



  // Реакция на изменение параметров дверей по умолчанию из боковой панели (авто-синхронизация дверей на чертеже)

  const prevDoorHeightRef = useRef(doorDefaultHeight);

  const prevDoorWidthRef = useRef(doorDefaultWidth);



  useEffect(() => {

    const prevH = prevDoorHeightRef.current;

    const prevW = prevDoorWidthRef.current;

    prevDoorHeightRef.current = doorDefaultHeight;

    prevDoorWidthRef.current = doorDefaultWidth;



    if (allWalls.length > 0 && (prevH !== doorDefaultHeight || prevW !== doorDefaultWidth)) {

      let hasChanges = false;

      const updated = allWalls.map(w => {

        let wallChanged = false;

        const newOps = w.openings.map(op => {

          if (op.type === 'door') {

            let h = op.height;

            let wth = op.width;

            if (prevH !== doorDefaultHeight && (Math.abs(op.height - prevH) < 0.02 || op.height === 2.05)) {

              h = doorDefaultHeight;

              wallChanged = true;

            }

            if (prevW !== doorDefaultWidth && (Math.abs(op.width - prevW) < 0.02 || op.width === 0.80)) {

              wth = doorDefaultWidth;

              wallChanged = true;

            }

            return { ...op, height: h, width: wth };

          }

          return op;

        });

        if (wallChanged) {

          hasChanges = true;

          return { ...w, openings: newOps };

        }

        return w;

      });



      if (hasChanges) {

        setAllWalls(updated);

        updateRoomsFromWalls(updated);

      }

    }

  }, [doorDefaultHeight, doorDefaultWidth, allWalls, updateRoomsFromWalls]);



  // Сбор всех уникальных вершин на плане

  const getAllVertices = useCallback((): Point[] => {

    const pts: Point[] = [];

    allWalls.forEach(w => {

      if (!pts.some(p => distance(p, w.start) < 0.04)) pts.push(w.start);

      if (!pts.some(p => distance(p, w.end) < 0.04)) pts.push(w.end);

    });

    return pts;

  }, [allWalls]);



  // Сбор опорных точек для привязки

  const getAllReferencePoints = useCallback((): Point[] => {

    const pts: Point[] = [];

    if (chainPoints.length > 0) {

      pts.push(chainPoints[0]);

      for (let i = 1; i < chainPoints.length - 1; i++) {

        pts.push(chainPoints[i]);

      }

    }

    allWalls.forEach(w => {

      pts.push(w.start);

      pts.push(w.end);

    });

    return pts;

  }, [chainPoints, allWalls]);



  // Поиск ближайшей вершины под курсором (для перетаскивания угла)

  const findNearestVertex = useCallback((cursor: Point): Point | null => {

    const vertices = getAllVertices();

    const thresholdM = 16 / scale;

    for (const v of vertices) {

      if (distance(cursor, v) <= thresholdM) {

        return v;

      }

    }

    return null;

  }, [getAllVertices, scale]);



  // Поиск хитбокса размера под курсором (для свободного перемещения выносок и редактирования по двойному клику)

  const findDimHitBoxAtScreenPos = (screenX: number, screenY: number): DimHitBox | null => {

    for (const box of dimHitBoxesRef.current) {

      // 1. Проверка попадания в ориентированный прямоугольник цифры с запасом в 16px

      const cosA = Math.cos(-box.angle);

      const sinA = Math.sin(-box.angle);

      const dx = screenX - box.x;

      const dy = screenY - box.y;

      const localX = Math.abs(dx * cosA - dy * sinA);

      const localY = Math.abs(dx * sinA + dy * cosA);



      const pad = 16;

      if (localX <= (box.w / 2 + pad) && localY <= (box.h / 2 + pad)) {

        return box;

      }

      if (Math.hypot(dx, dy) <= 26) {

        return box;

      }



      // 2. Проверка попадания в саму размерную линию (между pA и pB) с допуском 14px

      if (box.pA && box.pB) {

        const segProj = projectPointOnSegment({ x: screenX, y: screenY }, box.pA, box.pB);

        if (segProj.dist <= 14) {

          return box;

        }

      }

    }

    return null;

  };



  // Применение измененного размера или проема из инлайн-инпута (со смещением стены без обрыва)

  const handleApplyInlineDimEdit = () => {

    if (!inlineDimEditTarget) return;

    const rawVal = parseFloat(inlineDimEditValue.replace(',', '.'));

    if (isNaN(rawVal) || rawVal <= 0) {

      setInlineDimEditTarget(null);

      return;

    }

    // Автоопределение: если ввели < 35, значит ввели в метрах (например 7.918), если >= 35, в миллиметрах (7918)

    const newM = rawVal >= 35 ? rawVal / 1000 : rawVal;

    const newMm = Math.round(newM * 1000);

    pushHistory();



    if (inlineDimEditTarget.type === 'dim') {

      // Редактирование чистового габарита комнаты (Span Dimensions)

      if (inlineDimEditTarget.dimKey && inlineDimEditTarget.dimKey.startsWith('span_')) {

        const match = inlineDimEditTarget.dimKey.match(/^span_(.+)_(w|h)$/);

        if (match) {

          const roomId = match[1];

          const axis = match[2] as 'w' | 'h';

          const updated = resizeRoomSpanDimension(allWalls, rooms, roomId, axis, newM);

          setAllWalls(updated);

          updateRoomsFromWalls(updated);

          showToast(`📐 Чистовой габарит комнаты обновлён: ${newMm} мм (стена смещена)`);

        }

      } else {

        // Редактирование конкретной стены

        const updated = resizeWallWithConnected(allWalls, inlineDimEditTarget.wallId, newM, rooms);

        setAllWalls(updated);

        updateRoomsFromWalls(updated);

        showToast(`📐 Размер стены скорректирован: ${newMm} мм (стена смещена)`);

      }

    } else if (inlineDimEditTarget.type === 'opening') {

      const updated = allWalls.map(w => {

        if (w.id === inlineDimEditTarget.wallId) {

          return {

            ...w,

            openings: (w.openings || []).map(o => o.id === inlineDimEditTarget.openingId ? { ...o, width: newM } : o)

          };

        }

        return w;

      });

      setAllWalls(updated);

      updateRoomsFromWalls(updated);

      showToast(`🚪 Ширина проема скорректирована: ${newMm} мм`);

    }



    setInlineDimEditTarget(null);

  };



  // Движение мыши

  const handleMouseMove = (e: React.MouseEvent) => {

    const canvas = canvasRef.current;

    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    const screenX = e.clientX - rect.left;

    const screenY = e.clientY - rect.top;



    // -0.1. ПЕРЕМЕЩЕНИЕ ЦИФРЫ РАЗМЕРА МЫШКОЙ (РУЧНАЯ ВЫНОСКА ПО ГОСТ)

    if (dragDimCandidateRef.current && !draggingDimKey) {

      const c = dragDimCandidateRef.current;

      if (Math.hypot(screenX - c.mouseStart.x, screenY - c.mouseStart.y) > 4) {

        setDraggingDimKey(c.hitDim.key);

        dragDimStartMouseRef.current = c.mouseStart;

        dragDimInitialOffsetRef.current = c.initialOffset;

        dragDimCandidateRef.current = null;

        return;

      }

    }

    if (draggingDimKey) {

      // Обработка драга вынесена в глобальный window-эффект с requestAnimationFrame для 60 FPS

      return;

    }



    // -0.05. СДВИГ ВСЕЙ КВАРТИРЫ МЫШЬЮ (MOVE ALL APARTMENT)

    if (isDraggingAllApartment && moveAllStartRef.current) {

      const rawWorld = screenToWorld(screenX, screenY);

      const dx = rawWorld.x - moveAllStartRef.current.startWorld.x;

      const dy = rawWorld.y - moveAllStartRef.current.startWorld.y;



      const shiftedWalls = moveAllStartRef.current.initialWalls.map(w => ({

        ...w,

        start: {

          x: Math.round((w.start.x + dx) * 1000) / 1000,

          y: Math.round((w.start.y + dy) * 1000) / 1000

        },

        end: {

          x: Math.round((w.end.x + dx) * 1000) / 1000,

          y: Math.round((w.end.y + dy) * 1000) / 1000

        }

      }));

      setAllWalls(shiftedWalls);



      const shiftedFixtures = moveAllStartRef.current.initialFixtures.map(f => ({

        ...f,

        x: Math.round((f.x + dx) * 1000) / 1000,

        y: Math.round((f.y + dy) * 1000) / 1000

      }));

      setFixtures(shiftedFixtures);



      const shiftedRooms = moveAllStartRef.current.initialRooms.map(r => ({

        ...r,

        points: r.points ? r.points.map(p => ({

          x: Math.round((p.x + dx) * 1000) / 1000,

          y: Math.round((p.y + dy) * 1000) / 1000

        })) : []

      }));

      setRooms(shiftedRooms);

      return;

    }



    // 0. ЕДИНОЕ ПАНОРАМИРОВАНИЕ ЧЕРТЕЖА БЕЗ РЫВКОВ (ЛКМ на пустом поле, СКМ, Пробел или режим 'pan')

    if (panDragRef.current) {

      const dx = screenX - panDragRef.current.startX;

      const dy = screenY - panDragRef.current.startY;

      const dist = Math.hypot(dx, dy);



      if (!panDragRef.current.isDragging && dist > 4) {

        panDragRef.current.isDragging = true;

        panDragRef.current.hasMoved = true;

        setIsPanning(true);

      }



      if (panDragRef.current.isDragging) {

        setOffset({

          x: panDragRef.current.startOffsetX + dx,

          y: panDragRef.current.startOffsetY + dy

        });

        return;

      }

    }



    const rawWorld = screenToWorld(screenX, screenY);

    setCursorWorld(rawWorld);



    // Быстрая комната: обновление текущей точки растягиваемого прямоугольника

    if (toolMode === 'room_rect' && rectStartPoint) {

      setRectCurrentPoint(rawWorld);

      return;

    }



    // Перетаскивание подложки плана

    if (isDraggingBackdrop && backdropDragStart.current && backdrop) {

      const dx = rawWorld.x - backdropDragStart.current.mouseWorld.x;

      const dy = rawWorld.y - backdropDragStart.current.mouseWorld.y;

      setBackdrop(prev => prev ? {

        ...prev,

        x: backdropDragStart.current!.originBackdrop.x + dx,

        y: backdropDragStart.current!.originBackdrop.y + dy

      } : null);

      return;

    }



    // Перетаскивание названия комнаты

    if (draggingRoomLabelId) {

      const targetPt: Point = {

        x: Number((rawWorld.x + roomLabelDragOffset.x).toFixed(2)),

        y: Number((rawWorld.y + roomLabelDragOffset.y).toFixed(2))

      };

      setRooms(prev => prev.map(r => r.id === draggingRoomLabelId ? { ...r, labelPosition: targetPt } : r));

      return;

    }



    // 1. ТЯНЕМ ПРОЁМ (ДВЕРЬ / ОКНО) ВДОЛЬ СТЕНЫ

    if (isDraggingOpening && selectedOpening) {

      const wall = allWalls.find(w => w.id === selectedOpening.wallId);

      if (wall) {

        const wallLen = distance(wall.start, wall.end);

        const proj = projectPointOnSegment(rawWorld, wall.start, wall.end);

        const op = wall.openings.find(o => o.id === selectedOpening.openingId);

        if (op) {

          const rawOffset = proj.t * wallLen;

          const snapped = snapOpeningOffset(rawOffset, op.width, wallLen);

          

          setAllWalls(prev => prev.map(w => {

            if (w.id === wall.id) {

              return {

                ...w,

                openings: w.openings.map(o => o.id === op.id ? { ...o, offsetMeters: snapped.offset } : o)

              };

            }

            return w;

          }));

        }

      }

      return;

    }



    // 2. ТЯНЕМ УГЛОВУЮ ВЕРШИНУ (CORNER HANDLE DRAGGING)

    if (pendingVertexClick && mouseDownPos) {

      if (Math.hypot(screenX - mouseDownPos.x, screenY - mouseDownPos.y) > 5) {

        pushHistory();

        setDraggingVertex(pendingVertexClick);

        setHasMovedDuringVertexDrag(true);

        setPendingVertexClick(null);

      }

    }



    if (draggingVertex) {

      if (dragStartPos && Math.hypot(screenX - dragStartPos.x, screenY - dragStartPos.y) > 3) {

        setHasMovedDuringVertexDrag(true);

      }

      const otherPoints = getAllReferencePoints().filter(p => distance(p, draggingVertex) > 0.05);

      const smart = calculateSmartSnap(null, rawWorld, otherPoints, scale, orthoMode, allWalls);

      const updatedWalls = moveWallVertex(allWalls, draggingVertex, smart.point);

      setAllWalls(updatedWalls);

      setDraggingVertex(smart.point);

      setSelectedVertex(smart.point);

      updateRoomsFromWalls(updatedWalls);

      return;

    }



    // 3. Hover на вершины, проемы, размеры и отметки обозначений
    if (!currentWallStart) {
      const nearDim = findDimHitBoxAtScreenPos(screenX, screenY);
      setHoveredDimKey(nearDim ? nearDim.key : null);
      if (nearDim && nearDim.fixtureId) {
        setHoveredFixtureId(nearDim.fixtureId);
      } else {
        const nearFix = findNearestFixture(rawWorld, fixtures, 0.45);
        setHoveredFixtureId(nearFix ? nearFix.id : null);
      }



      const nearV = findNearestVertex(rawWorld);

      setHoveredVertex(nearV);



      const nearOp = findNearestOpening(rawWorld, allWalls, scale);

      setHoveredOpeningId(nearOp ? nearOp.opening.id : null);



      if (!nearOp && !nearV && !nearDim) {

        const nearWall = findNearestWall(rawWorld, allWalls, scale);

        setHoveredWallId(nearWall ? nearWall.wall.id : null);

      } else {

        setHoveredWallId(null);

      }

    }



    // Перетаскивание обозначения с гарантированным положением ВНУТРИ комнаты

    if (draggingFixture) {

      const curFix = fixtures.find(f => f.id === draggingFixture.id);

      if (curFix) {

        const def = getFixtureDefinition(curFix.type);

        const targetPt = {

          x: rawWorld.x + draggingFixture.offsetWorld.x,

          y: rawWorld.y + draggingFixture.offsetWorld.y

        };

        const snapped = snapFixtureToNearestWallInRoom(targetPt, allWalls, rooms, def, 0.45);

        setFixtures(prev => prev.map(f => {

          if (f.id === draggingFixture.id) {

            return {

              ...f,

              x: snapped.point.x,

              y: snapped.point.y,

              rotationDeg: snapped.wallId ? snapped.rotationDeg : f.rotationDeg,

              roomId: snapped.roomId || f.roomId,

              wallId: snapped.wallId,

              distanceFromCorner: snapped.distanceFromCorner

            };

          }

          return f;

        }));

      }

    }



    // Подсветка обозначений при наведении

    const hoverFix = findNearestFixture(rawWorld, fixtures, 0.40);

    setHoveredFixtureId(hoverFix ? hoverFix.id : null);



    // 4. Привязка при черчении стены: если зажат Пробел — угол строго 0°/90°/180°/270°

    const effectiveOrtho = orthoMode || (currentWallStart !== null && (isSpacePressed || isShiftPressed));

    const refPoints = getAllReferencePoints();

    const smart = calculateSmartSnap(currentWallStart, rawWorld, refPoints, scale, effectiveOrtho, allWalls);



    setSnappedCursor(smart.point);

    setActiveGuides(smart.guides);

    setIsSnappedToVertex(smart.isSnappedToVertex);

    setIsSnappedToWall(smart.isSnappedToWall);



    if (chainPoints.length >= 3) {

      const firstPt = chainPoints[0];

      const distToStartPx = distance(smart.point, firstPt) * scale;

      setIsSnapToClose(distToStartPx <= 18);

    } else {

      setIsSnapToClose(false);

    }

  };



  // Зум колесиком

  const handleWheel = (e: React.WheelEvent) => {

    e.preventDefault();

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;

    const newScale = Math.min(Math.max(scale * zoomFactor, 20), 250);



    const canvas = canvasRef.current;

    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    const mouseX = e.clientX - rect.left;

    const mouseY = e.clientY - rect.top;



    const newOffsetX = mouseX - (mouseX - offset.x) * (newScale / scale);

    const newOffsetY = mouseY - (mouseY - offset.y) * (newScale / scale);



    setScale(newScale);

    setOffset({ x: newOffsetX, y: newOffsetY });

  };



  // Нажатие мыши

  const handleMouseDown = (e: React.MouseEvent) => {

    if (contextMenu.visible) {

      setContextMenu(prev => ({ ...prev, visible: false }));

    }



    // Панорамирование: СКМ (1), Alt+ЛКМ, зажатый Пробел, или режим инструмента 'pan'

    if (e.button === 1 || (e.button === 0 && (e.altKey || (!currentWallStart && isSpacePressed) || toolMode === 'pan'))) {

      const canvas = canvasRef.current;

      if (canvas) {

        const rect = canvas.getBoundingClientRect();

        const sx = e.clientX - rect.left;

        const sy = e.clientY - rect.top;

        panDragRef.current = {

          startX: sx,

          startY: sy,

          startOffsetX: offset.x,

          startOffsetY: offset.y,

          isDragging: true,

          hasMoved: true,

          isSheetHold: false

        };

        setIsPanning(true);

      }

      return;

    }



    // ПРАВАЯ КНОПКА МЫШИ (ПКМ) — ВЫХОД ИЗ РЕЖИМА ОБОЗНАЧЕНИЙ / ОТМЕНА ЧЕРЧЕНИЯ / ИНСПЕКТОР

    if (e.button === 2) {

      e.preventDefault();

      // 0. Если активен режим добавления обозначений — ПКМ мгновенно выходит из него!

      if (activeFixtureType) {

        setActiveFixtureType(null);

        showToast('Выход из режима добавления обозначений [ПКМ]');

        actionLogger.addLog('tool', 'Выход из режима добавления обозначений [ПКМ]');

        return;

      }



      // 1. Если активно черчение стены — ПКМ отменяет последнюю точку / сегмент

      if (currentWallStart) {

        handleRemoveLastPoint();

        actionLogger.addLog('draw', 'Отмена последней точки черчения [ПКМ]');

        return;

      }



      // 2. Иначе — открываем окно редактирования и информации по объекту

      handleContextMenuOpen(e);

      return;

    }



    // ЛЕВАЯ КНОПКА МЫШИ (ЛКМ)

    if (e.button === 0 && !isEditingLength) {

      if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) {

        (document.activeElement as HTMLElement).blur();

      }

      canvasRef.current?.focus();



      const canvas = canvasRef.current;

      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();

      const screenX = e.clientX - rect.left;

      const screenY = e.clientY - rect.top;

      const rawWorld = screenToWorld(screenX, screenY);



      // -0.04. Режим сдвига всей квартиры (Group Move)

      if (toolMode === 'move_all') {

        setIsDraggingAllApartment(true);

        moveAllStartRef.current = {

          startWorld: { ...rawWorld },

          initialWalls: allWalls.map(w => ({

            ...w,

            start: { ...w.start },

            end: { ...w.end },

            openings: w.openings ? w.openings.map(op => ({ ...op })) : []

          })),

          initialFixtures: fixtures.map(f => ({

            ...f

          })),

          initialRooms: rooms.map(r => ({

            ...r,

            points: r.points ? r.points.map(p => ({ ...p })) : []

          }))

        };

        return;

      }



      // -0.05. Быстрая комната: начало перетаскивания прямоугольника

      if (toolMode === 'room_rect') {

        setRectStartPoint(rawWorld);

        setRectCurrentPoint(rawWorld);

        return;

      }



      // -0.1. Калибровка масштаба подложки (если активен режим калибровки)

      if (calibration.active) {

        if (calibration.step === 'pick_p1') {

          setCalibration(prev => ({

            ...prev,

            step: 'pick_p2',

            p1World: { ...rawWorld }

          }));

          showToast('📍 Точка 1 зафиксирована! Теперь кликните точку 2 на другом конце отрезка');

          return;

        } else if (calibration.step === 'pick_p2') {

          const p2 = { ...rawWorld };

          const distM = distance(calibration.p1World!, p2);

          const initialMm = Math.round(distM * 1000);

          setCalibrationInputMm(initialMm > 0 ? initialMm.toString() : '3000');

          setCalibration(prev => ({

            ...prev,

            step: 'input_length',

            p2World: p2

          }));

          return;

        }

      }



      // -0.2. Сдвиг подложки плана мышкой (если включен режим перемещения подложки)

      if (isMovingBackdrop && backdrop && !backdrop.locked) {

        setIsDraggingBackdrop(true);

        backdropDragStart.current = {

          mouseWorld: { ...rawWorld },

          originBackdrop: { x: backdrop.x, y: backdrop.y }

        };

        return;

      }



      // 0.0. Захват отметки обозначения (выноски с полочкой) или размерного числа
      const hitDim = findDimHitBoxAtScreenPos(screenX, screenY);
      if (hitDim) {
        if (hitDim.fixtureId) {
          const targetFix = fixtures.find(f => f.id === hitDim.fixtureId);
          if (targetFix) {
            pushHistory();
            setSelectedFixtureId(targetFix.id);
            setSelectedWallId(null);
            setSelectedOpening(null);
            setSelectedVertex(null);
            setSelectedRoomId(null);
            setDraggingFixture({
              id: targetFix.id,
              offsetWorld: { x: targetFix.x - rawWorld.x, y: targetFix.y - rawWorld.y }
            });
            actionLogger.addLog('click', `Выбрано обозначение: ${targetFix.name}`, `Перемещение по стене`);
            return;
          }
        }
        const currentOffset = manualDimOffsets[hitDim.key] || { x: 0, y: 0 };
        dragDimCandidateRef.current = {
          hitDim,
          mouseStart: { x: screenX, y: screenY },
          initialOffset: currentOffset
        };
        return;
      }



      // 0.1. Установка выбранного обозначения (ВНУТРИ комнаты, прижато к стене)

      if (activeFixtureType) {

        pushHistory();

        const def = getFixtureDefinition(activeFixtureType);

        // Умная привязка: объект всегда ставится ВНУТРИ комнаты лицом внутрь

        const snapped = snapFixtureToNearestWallInRoom(rawWorld, allWalls, rooms, def, 0.55);

        const newFix: Fixture = {

          id: `fix_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,

          type: activeFixtureType,

          category: def.category,

          name: def.name,

          x: snapped.point.x,

          y: snapped.point.y,

          rotationDeg: snapped.wallId ? snapped.rotationDeg : fixtureRotation,

          width: def.width,

          height: def.height,

          roomId: snapped.roomId,

          wallId: snapped.wallId,

          distanceFromCorner: snapped.distanceFromCorner,

          installationHeight: def.defaultHeightFromFloor

        };

        setFixtures(prev => [...prev, newFix]);

        setSelectedFixtureId(null);

        showToast(`✅ ${def.name} установлено внутри комнаты (h=${def.defaultHeightFromFloor.toFixed(2)}м)`);

        actionLogger.addLog('draw', `Установлено обозначение: ${def.name}`, `Внутри комнаты, от угла: ${snapped.distanceFromCorner ? snapped.distanceFromCorner + 'м' : 'свободно'}, h=${def.defaultHeightFromFloor}м`);

        return;

      }



      // 0.2. Клик по существующему обозначению (выбор / начало перетаскивания)

      const hitFixture = findNearestFixture(rawWorld, fixtures, 0.40);

      if (hitFixture) {

        pushHistory();

        setSelectedFixtureId(hitFixture.id);

        setSelectedWallId(null);

        setSelectedOpening(null);

        setSelectedVertex(null);

        setSelectedRoomId(null);

        setDraggingFixture({

          id: hitFixture.id,

          offsetWorld: { x: hitFixture.x - rawWorld.x, y: hitFixture.y - rawWorld.y }

        });

        actionLogger.addLog('click', `Выбрано обозначение: ${hitFixture.name}`, `Угол: ${hitFixture.rotationDeg}°`);

        return;

      }



      // 1. Клик по проёму (двери или окну)

      const hitOp = findNearestOpening(rawWorld, allWalls, scale);

      if (hitOp) {

        pushHistory();

        setSelectedOpening({ wallId: hitOp.wall.id, openingId: hitOp.opening.id });

        setSelectedWallId(null);

        setSelectedRoomId(null);

        setSelectedVertex(null);

        setIsDraggingOpening(true);

        actionLogger.addLog(

          'click',

          `Выбран проём: ${hitOp.opening.type === 'door' ? 'Дверь' : 'Окно'}`,

          `Размер: ${hitOp.opening.width.toFixed(2)} × ${hitOp.opening.height.toFixed(2)} м`,

          'Тяните проём мышкой вдоль стены или настройте параметры.'

        );

        return;

      }



      // 2. Если пользователь явно переключился в режим ВЫБОРА ('select'):

      if (toolMode === 'select' && !currentWallStart) {

        const hitVertex = findNearestVertex(rawWorld);

        if (hitVertex) {

          pushHistory();

          setDraggingVertex(hitVertex);

          setDragStartPos({ x: screenX, y: screenY });

          setSelectedVertex(hitVertex);

          setSelectedWallId(null);

          setSelectedOpening(null);

          setSelectedRoomId(null);

          return;

        }



        const nearWall = findNearestWall(rawWorld, allWalls, scale);

        if (nearWall) {

          setSelectedWallId(nearWall.wall.id);

          setSelectedOpening(null);

          setSelectedRoomId(null);

          setSelectedVertex(null);

          const wallLen = distance(nearWall.wall.start, nearWall.wall.end);

          setEditWallLengthInput(wallLen.toFixed(2));

          return;

        }



        const hitRoom = rooms.find(r => isPointInsidePolygon(rawWorld, r.points));

        if (hitRoom) {

          setSelectedRoomId(hitRoom.id);

          setSelectedWallId(null);

          setSelectedOpening(null);

          setSelectedVertex(null);

          return;

        }



        // Панорама при клике в пустоту в режиме выбора

        panDragRef.current = {

          startX: screenX,

          startY: screenY,

          startOffsetX: offset.x,

          startOffsetY: offset.y,

          isDragging: true,

          hasMoved: true,

          isSheetHold: false

        };

        setIsPanning(true);

        return;

      }



      // 3. ОСНОВНОЙ РЕЖИМ ЧЕРЧЕНИЯ («ТОЧКА - ЛИНИЯ - СТЕНА»):

      // 3.1. Клик по существующей точке угла

      const hitVertex = findNearestVertex(rawWorld);

      if (hitVertex) {

        setPendingVertexClick(hitVertex);

        setMouseDownPos({ x: screenX, y: screenY });

        setDragStartPos({ x: screenX, y: screenY });

        return;

      }



      // 3.2. Клик по существующей стене (поставить точку на стене / начать или завершить перегородку)

      const hitWallData = findNearestWall(rawWorld, allWalls, scale);

      if (hitWallData) {

        handleWallClick(hitWallData.wall, currentWallStart ? snappedCursor : rawWorld);

        return;

      }



      // 3.3. Зажатие на пустом поле (захват листа и перемещение при удержании БЕЗ рывков)

      panDragRef.current = {

        startX: screenX,

        startY: screenY,

        startOffsetX: offset.x,

        startOffsetY: offset.y,

        isDragging: false,

        hasMoved: false,

        isSheetHold: true

      };

    }

  };



  const handleMouseUp = (e: React.MouseEvent) => {

    dragDimCandidateRef.current = null;

    if (draggingDimKey) {

      setDraggingDimKey(null);

      return;

    }

    if (isDraggingAllApartment) {

      setIsDraggingAllApartment(false);

      if (moveAllStartRef.current) {

        const dx = cursorWorld.x - moveAllStartRef.current.startWorld.x;

        const dy = cursorWorld.y - moveAllStartRef.current.startWorld.y;

        if (Math.abs(dx) > 0.005 || Math.abs(dy) > 0.005) {

          pushHistory();

          updateRoomsFromWalls(allWalls);

          showToast(`✅ Вся квартира смещена: dx=${Math.round(dx * 1000)} мм, dy=${Math.round(dy * 1000)} мм`);

          actionLogger.addLog('tool', `Сдвиг квартиры: dx=${dx.toFixed(3)}м, dy=${dy.toFixed(3)}м`);

        }

      }

      moveAllStartRef.current = null;

      return;

    }



    if (isDraggingBackdrop) {

      setIsDraggingBackdrop(false);

      backdropDragStart.current = null;

    }

    if (draggingFixture) {

      setDraggingFixture(null);

    }

    if (draggingRoomLabelId) {

      setDraggingRoomLabelId(null);

      if (onRoomsUpdated) onRoomsUpdated(rooms);

    }

    if (toolMode === 'room_rect' && rectStartPoint && rectCurrentPoint) {

      const x1 = Math.min(rectStartPoint.x, rectCurrentPoint.x);

      const x2 = Math.max(rectStartPoint.x, rectCurrentPoint.x);

      const y1 = Math.min(rectStartPoint.y, rectCurrentPoint.y);

      const y2 = Math.max(rectStartPoint.y, rectCurrentPoint.y);

      const w = Math.round((x2 - x1) * 100) / 100;

      const h = Math.round((y2 - y1) * 100) / 100;



      setRectStartPoint(null);

      setRectCurrentPoint(null);



      if (w >= 0.35 && h >= 0.35) {

        pushHistory();

        const nowTs = Date.now();

        const newWalls: Wall[] = [

          {

            id: `wall_rect_${nowTs}_top`,

            start: { x: x1, y: y1 },

            end: { x: x2, y: y1 },

            thickness: wallThickness,

            openings: []

          },

          {

            id: `wall_rect_${nowTs}_right`,

            start: { x: x2, y: y1 },

            end: { x: x2, y: y2 },

            thickness: wallThickness,

            openings: []

          },

          {

            id: `wall_rect_${nowTs}_bot`,

            start: { x: x2, y: y2 },

            end: { x: x1, y: y2 },

            thickness: wallThickness,

            openings: []

          },

          {

            id: `wall_rect_${nowTs}_left`,

            start: { x: x1, y: y2 },

            end: { x: x1, y: y1 },

            thickness: wallThickness,

            openings: []

          }

        ];



        const nextWalls = [...allWalls, ...newWalls];

        setAllWalls(nextWalls);

        const updatedRooms = detectRoomsFromWalls(nextWalls, ceilingHeight);

        setRooms(updatedRooms);

        if (onRoomsUpdated) onRoomsUpdated(updatedRooms);



        const area = (w * h).toFixed(2);

        const perim = (2 * (w + h)).toFixed(2);

        const wallArea = (2 * (w + h) * ceilingHeight).toFixed(2);

        showToast(`🏠 Комната создана: ${area} м² | Периметр: ${perim} м.п. | Площадь стен: ${wallArea} м²`);

        actionLogger.addLog('draw', `Создана комната ${w}×${h}м (${area} м²)`);

      }

      return;

    }



    if (panDragRef.current) {

      const wasSheetHold = panDragRef.current.isSheetHold;

      const hasMoved = panDragRef.current.hasMoved;

      panDragRef.current = null;

      setIsPanning(false);



      if (toolMode === 'pan') {

        setToolMode('draw');

      }



      if (wasSheetHold) {

        if (hasMoved) {

          // Пользователь тянул лист при удержании мышки — точка НЕ должна фиксироваться!

          return;

        } else {

          // Чистый клик без движения мыши — фиксируем точку

          handleEmptySpaceClick();

          return;

        }

      }

      return;

    }

    if (isPanning) {

      setIsPanning(false);

      if (toolMode === 'pan') {

        setToolMode('draw');

      }

    }

    if (draggingVertex) {

      if (!hasMovedDuringVertexDrag && dragStartPos) {

        setSelectedVertex(draggingVertex);

      }

      setDraggingVertex(null);

      setDragStartPos(null);

      setHasMovedDuringVertexDrag(false);

      updateRoomsFromWalls(allWalls);

      return;

    }

    if (isDraggingOpening) {

      setIsDraggingOpening(false);

      updateRoomsFromWalls(allWalls);

      return;

    }



    // Если был нажат угол и мышь НЕ двигалась — это чистый КЛИК ПО ТОЧКЕ!

    if (pendingVertexClick) {

      const v = pendingVertexClick;

      setPendingVertexClick(null);

      setMouseDownPos(null);

      setDragStartPos(null);

      handleVertexClick(v);

      return;

    }

  };



  // Двойной клик — редактирование размера/проема, открытие отделки комнаты или фиксация текущей точки

  const handleDoubleClick = (e?: React.MouseEvent) => {

    if (e && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const rawW = screenToWorld(sx, sy);

      // 0. Двойной клик по отметке или размеру обозначения (выноска с полочкой, ярус привязки)
      let hitDim = findDimHitBoxAtScreenPos(sx, sy);
      if (hitDim && hitDim.fixtureId) {
        const targetFix = fixtures.find(f => f.id === hitDim.fixtureId);
        if (targetFix) {
          setSelectedFixtureId(targetFix.id);
          setEditingFixtureModalTarget(targetFix);
          return;
        }
      }

      // 0.1. Двойной клик напрямую по самому обозначению на чертеже (розетка, выключатель, сантехника и т.д.)
      const hitFixture = findNearestFixture(rawW, fixtures, 0.45);
      if (hitFixture) {
        setSelectedFixtureId(hitFixture.id);
        setEditingFixtureModalTarget(hitFixture);
        return;
      }

      if (!hitDim) {
        // Запасной поиск: клик по стене рядом с размером (в пределах 24px)
        const nearWall = findNearestWall(rawW, allWalls, scale);

        if (nearWall && nearWall.distPx < 24) {

          const foundBox = dimHitBoxesRef.current.find(b => b.wallId === nearWall.wall.id);

          if (foundBox) {

            hitDim = foundBox;

          } else {

            const wallLen = distance(nearWall.wall.start, nearWall.wall.end);

            const valMm = Math.round(wallLen * 1000);

            setInlineDimEditTarget({

              type: 'dim',

              wallId: nearWall.wall.id,

              currentValMm: valMm,

              title: `Длина стены (${valMm} мм)`,

              screenX: sx,

              screenY: sy - 25,

            });

            setInlineDimEditValue(String(valMm));

            return;

          }

        }

      }



      if (hitDim) {

        const valMm = Math.round(hitDim.segLenMeters * 1000);

        const isSpan = hitDim.key.startsWith('span_');

        const title = isSpan

          ? (hitDim.segIndex === 0 ? `Ширина комнаты (${hitDim.text})` : `Длина комнаты (${hitDim.text})`)

          : `Размер стены (${hitDim.text})`;

        setInlineDimEditTarget({

          type: 'dim',

          wallId: hitDim.wallId,

          dimKey: hitDim.key,

          currentValMm: valMm,

          title,

          screenX: sx,

          screenY: sy - 25,

        });

        setInlineDimEditValue(String(valMm));

        return;

      }



      // Двойной клик внутри комнаты — открывает окно работ и отделки
      const clickedRoom = rooms.find(r => isPointInsidePolygon(rawW, r.points));

      if (clickedRoom) {

        if (onOpenRoomFinishes) {

          onOpenRoomFinishes(clickedRoom);

        }

        return;

      }

    }

    if (currentWallStart) {

      setCurrentWallStart(null);

      setChainPoints([]);

      setIsSnapToClose(false);

      actionLogger.addLog(

        'draw',

        'Фиксация точки без продолжения линии [Двойной клик]',

        undefined,

        'Черчение завершено. Кликните в любое место, стену или угол для начала новой линии.'

      );

      showToast('⏹ Черчение линии завершено (двойной клик).');

    }

  };



  // Клик по стене: ставит точку на стене, разделяет стену и тянет перегородку

  const handleWallClick = (targetWall: Wall, rawWorld: Point) => {

    pushHistory();

    let pointToProject = rawWorld;



    // В режиме Орто (зажат Пробел, Shift или включен режим Ortho 90°):

    // точка на целевой стене СТРОГО фиксируется перпендикулярно от стартовой точки!

    if (currentWallStart && (orthoMode || isSpacePressed || isShiftPressed)) {

      const dx = rawWorld.x - currentWallStart.x;

      const dy = rawWorld.y - currentWallStart.y;

      const isVertical = Math.abs(dy) >= Math.abs(dx);

      if (isVertical) {

        pointToProject = { x: currentWallStart.x, y: rawWorld.y };

      } else {

        pointToProject = { x: rawWorld.x, y: currentWallStart.y };

      }

    }



    const proj = projectPointOnSegment(pointToProject, targetWall.start, targetWall.end);

    const splitPoint: Point = {

      x: Number(proj.point.x.toFixed(3)),

      y: Number(proj.point.y.toFixed(3))

    };



    // Дополнительное выравнивание координат для 100% строгой вертикали или горизонтали перегородки

    if (currentWallStart && (orthoMode || isSpacePressed || isShiftPressed)) {

      const dx = rawWorld.x - currentWallStart.x;

      const dy = rawWorld.y - currentWallStart.y;

      const isVertical = Math.abs(dy) >= Math.abs(dx);

      if (isVertical && Math.abs(targetWall.start.y - targetWall.end.y) < 0.08) {

        // Целевая стена горизонтальная, перегородка вертикальная -> X строго равен стартовой точке!

        splitPoint.x = currentWallStart.x;

      } else if (!isVertical && Math.abs(targetWall.start.x - targetWall.end.x) < 0.08) {

        // Целевая стена вертикальная, перегородка горизонтальная -> Y строго равен стартовой точке!

        splitPoint.y = currentWallStart.y;

      }

    }



    // СЛУЧАЙ 1: Линия еще НЕ тянулась (!currentWallStart)

    // Пользователь ставит точку на стене для старта перегородки

    if (!currentWallStart) {

      const [seg1, seg2] = splitWallAtPoint(targetWall, splitPoint);

      const updatedWalls = allWalls.filter(w => w.id !== targetWall.id).concat([seg1, seg2]);

      setAllWalls(updatedWalls);

      updateRoomsFromWalls(updatedWalls);



      setCurrentWallStart(splitPoint);

      setChainPoints([splitPoint]);

      setSelectedWallId(null);

      setSelectedOpening(null);

      setSelectedVertex(null);

      setSelectedRoomId(null);



      actionLogger.addLog(

        'draw',

        'Точка поставлена на стене',

        `Стена разделена в точке (${splitPoint.x.toFixed(2)}, ${splitPoint.y.toFixed(2)})`,

        'Тяните перегородку через комнату к противоположной стене или углу.'

      );

      showToast('📍 Точка поставлена на стене! Тяните перегородку.');

      return;

    }



    // СЛУЧАЙ 2: Линия УЖЕ тянется (currentWallStart !== null)

    // Пользователь дотянул перегородку до стены: соединяем и разделяем комнату!

    if (distance(currentWallStart, splitPoint) < 0.1) return;



    const [seg1, seg2] = splitWallAtPoint(targetWall, splitPoint);

    const newPartitionWall: Wall = {

      id: 'wall_partition_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),

      start: currentWallStart,

      end: splitPoint,

      thickness: wallThickness,

      openings: []

    };



    const updatedWalls = allWalls.filter(w => w.id !== targetWall.id).concat([seg1, seg2, newPartitionWall]);

    setAllWalls(updatedWalls);

    updateRoomsFromWalls(updatedWalls);



    setCurrentWallStart(null);

    setChainPoints([]);

    setIsSnapToClose(false);



    actionLogger.addLog(

      'draw',

      'Перегородка установлена',

      `Стена соединена в (${splitPoint.x.toFixed(2)}, ${splitPoint.y.toFixed(2)})`,

      'Комната успешно разделена на 2 помещения.'

    );

    showToast('✨ Перегородка установлена! Комната разделена.');

  };



  // Клик по существующей точке угла: старт линии от неё либо соединение линии

  const handleVertexClick = (vertex: Point) => {

    pushHistory();

    // СЛУЧАЙ 1: Линия еще не тянулась — начинаем тянуть от этой точки!

    if (!currentWallStart) {

      setCurrentWallStart(vertex);

      setChainPoints([vertex]);

      setSelectedWallId(null);

      setSelectedOpening(null);

      setSelectedVertex(null);

      setSelectedRoomId(null);



      actionLogger.addLog(

        'draw',

        'Линия начата от точки угла',

        `Координаты: (${vertex.x.toFixed(2)}, ${vertex.y.toFixed(2)})`,

        'Тяните стену за мышкой. Кликните для следующей точки, ПКМ — отмена.'

      );

      showToast('📍 Точка зафиксирована! Линия тянется от угла.');

      return;

    }



    // СЛУЧАЙ 2: Линия уже тянулась — соединяем стену с этой вершиной!

    if (distance(currentWallStart, vertex) < 0.08) return;



    const newWall: Wall = {

      id: 'wall_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),

      start: currentWallStart,

      end: vertex,

      thickness: wallThickness,

      openings: []

    };



    const nextWalls = [...allWalls, newWall];

    setAllWalls(nextWalls);

    updateRoomsFromWalls(nextWalls);



    const isClosedToStart = isSnapToClose || (chainPoints.length >= 2 && distance(vertex, chainPoints[0]) < 0.08);



    setCurrentWallStart(null);

    setChainPoints([]);

    setIsSnapToClose(false);



    if (isClosedToStart) {

      actionLogger.addLog(

        'draw',

        'Контур комнаты замкнут!',

        `Стен: ${nextWalls.length}`,

        'Комната сформирована. В центре отображается штамп с площадью.'

      );

      showToast('🎉 Контур замкнут! Комната сформирована.');

    } else {

      actionLogger.addLog(

        'draw',

        'Стена соединена с углом',

        `Точка: (${vertex.x.toFixed(2)}, ${vertex.y.toFixed(2)})`

      );

      showToast('🔗 Стена соединена с углом!');

    }

  };



  // Клик по пустому пространству холста

  const handleEmptySpaceClick = () => {

    pushHistory();

    const pt: Point = {

      x: Number(snappedCursor.x.toFixed(3)),

      y: Number(snappedCursor.y.toFixed(3))

    };



    if (!currentWallStart) {

      setCurrentWallStart(pt);

      setChainPoints([pt]);

      setSelectedWallId(null);

      setSelectedOpening(null);

      setSelectedVertex(null);

      setSelectedRoomId(null);



      actionLogger.addLog(

        'draw',

        'Начата стена',

        `Точка: (${pt.x.toFixed(2)}, ${pt.y.toFixed(2)})`,

        'Тяните стену за мышкой. Кликните для следующей точки, ПКМ — отмена.'

      );

      showToast('📍 Точка поставлена. Тяните линию...');

    } else {

      const wallLen = distance(currentWallStart, pt);

      if (wallLen < 0.1) return;



      const newWall: Wall = {

        id: 'wall_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),

        start: currentWallStart,

        end: pt,

        thickness: wallThickness,

        openings: []

      };



      const nextWalls = [...allWalls, newWall];

      setAllWalls(nextWalls);

      updateRoomsFromWalls(nextWalls);



      setCurrentWallStart(pt);

      setChainPoints(prev => [...prev, pt]);

      actionLogger.addLog(

        'draw',

        `Поставлена точка #${chainPoints.length + 1}`,

        `Длина стены: ${wallLen.toFixed(2)} м`,

        'Продолжайте периметр. Двойной клик — завершить без продолжения, ПКМ — отмена.'

      );

    }

  };



  // Сохранение отредактированного или созданного обозначения

  const handleSaveFixtureDef = (def: FixtureDefinition) => {

    let updated: FixtureDefinition[];

    const exists = fixtureCatalog.some(f => f.type === def.type);

    if (exists) {

      updated = fixtureCatalog.map(f => f.type === def.type ? def : f);

    } else {

      updated = [...fixtureCatalog, def];

    }

    setFixtureCatalog(updated);

    setCustomFixtureCatalogRegistry(updated);

    setEditingFixtureDef(null);

    setIsAddingFixtureDef(false);

    showToast(`✅ Обозначение «${def.name}» сохранено`);

  };



  // Удаление пользовательского обозначения

  const handleDeleteFixtureDef = (type: string) => {

    const target = fixtureCatalog.find(f => f.type === type);

    const updated = fixtureCatalog.filter(f => f.type !== type);

    setFixtureCatalog(updated);

    setCustomFixtureCatalogRegistry(updated);

    setEditingFixtureDef(null);

    setIsAddingFixtureDef(false);

    showToast(`🗑 Обозначение «${target?.name || type}» удалено`);

  };



  // Старт создания нового обозначения

  const handleStartAddFixtureDef = () => {

    const newDef: FixtureDefinition = {

      type: `custom_${Date.now()}`,

      name: '',

      shortLabel: '',

      category: fixtureCategoryTab,

      width: 0.08,

      height: 0.05,

      color: fixtureCategoryTab === 'electric' ? '#2563eb' : fixtureCategoryTab === 'plumbing' ? '#0d9488' : '#d97706',

      defaultHeightFromFloor: fixtureCategoryTab === 'electric' ? 0.30 : 0.60,

      baseGraphic: fixtureCategoryTab === 'electric' ? 'socket' : 'box',

      iconText: '',

      isCustom: true

    };

    setEditingFixtureDef(newDef);

    setIsAddingFixtureDef(true);

  };



  // Контекстное меню ПКМ

  const handleContextMenuOpen = (e: React.MouseEvent) => {

    const canvas = canvasRef.current;

    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    const screenPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    const worldPos = screenToWorld(screenPos.x, screenPos.y);



    // Поиск объектов по приоритету:

    // 1. Обозначение (розетка, выключатель, сантехника)

    const hitFixture = findNearestFixture(worldPos, fixtures, 0.40);

    // 2. Проем (дверь или окно)

    const hitOpening = findNearestOpening(worldPos, allWalls, scale);

    // 3. Вершина (угловая или промежуточная точка)

    const hitVertex = findNearestVertex(worldPos);

    // 4. Стена

    const hitWallData = findNearestWall(worldPos, allWalls, scale);

    // 5. Комната

    let foundRoom: Room | null = null;

    for (const r of rooms) {

      if (isPointInsidePolygon(worldPos, r.points)) {

        foundRoom = r;

        break;

      }

    }



    if (hitFixture) {

      setSelectedFixtureId(hitFixture.id);

      setSelectedWallId(null);

      setSelectedOpening(null);

      setSelectedVertex(null);

    } else if (hitOpening) {

      setSelectedOpening({ wallId: hitOpening.wall.id, openingId: hitOpening.opening.id });

      setSelectedWallId(null);

      setSelectedVertex(null);

      setSelectedFixtureId(null);

    } else if (hitVertex) {

      setSelectedVertex(hitVertex);

      setSelectedWallId(null);

      setSelectedOpening(null);

      setSelectedFixtureId(null);

    } else if (hitWallData) {

      setSelectedWallId(hitWallData.wall.id);

      setSelectedOpening(null);

      setSelectedVertex(null);

      setSelectedFixtureId(null);

      setEditWallLengthInput(distance(hitWallData.wall.start, hitWallData.wall.end).toFixed(2));

    } else if (foundRoom) {

      // При клике на комнату снимаем выделения других объектов,

      // но НЕ открываем старую дублирующую карточку на холсте!

      setSelectedWallId(null);

      setSelectedOpening(null);

      setSelectedVertex(null);

      setSelectedFixtureId(null);

    }



    setContextMenu({

      visible: true,

      screenPos,

      worldPos,

      targetFixture: hitFixture,

      targetOpening: hitOpening,

      targetVertex: hitVertex,

      targetWall: hitWallData ? hitWallData.wall : null,

      targetRoom: foundRoom,

      offsetAlongWall: hitWallData ? hitWallData.offsetMeters : 0

    });

  };



  const isPointInsidePolygon = (p: Point, poly: Point[]): boolean => {

    let inside = false;

    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {

      const xi = poly[i].x, yi = poly[i].y;

      const xj = poly[j].x, yj = poly[j].y;

      const intersect = ((yi > p.y) !== (yj > p.y)) &&

        (p.x < (xj - xi) * (p.y - yi) / (yj - yi) + xi);

      if (intersect) inside = !inside;

    }

    return inside;

  };





  // Ручной ввод длины новой стены (поддерживает как метры 5.2, так и миллиметры 5200)

  const applyManualLength = () => {

    let targetLength = parseFloat(manualLengthInput.replace(',', '.'));

    if (!currentWallStart || isNaN(targetLength) || targetLength <= 0) {

      setIsEditingLength(false);

      return;

    }



    // Если введено число >= 50, считаем ввод в миллиметрах (например, 5200 мм = 5.20 м, 3670 мм = 3.67 м)

    if (targetLength >= 50) {

      targetLength = targetLength / 1000;

    }



    const dx = snappedCursor.x - currentWallStart.x;

    const dy = snappedCursor.y - currentWallStart.y;

    const currentDist = Math.hypot(dx, dy);



    let unitX = 1;

    let unitY = 0;

    // В ортогональном режиме или при явном движении мыши выравниваем строго по 90° (0°, 90°, 180°, 270°)

    if (orthoMode || isSpacePressed || isShiftPressed || Math.abs(dx) > 0.02 || Math.abs(dy) > 0.02) {

      if (Math.abs(dx) >= Math.abs(dy)) {

        unitX = dx >= 0 ? 1 : -1;

        unitY = 0;

      } else {

        unitX = 0;

        unitY = dy >= 0 ? 1 : -1;

      }

    } else if (currentDist > 0.001) {

      unitX = dx / currentDist;

      unitY = dy / currentDist;

    }



    let endPoint: Point = {

      x: Number((currentWallStart.x + unitX * targetLength).toFixed(3)),

      y: Number((currentWallStart.y + unitY * targetLength).toFixed(3))

    };



    // Проверяем замыкание контура на стартовую точку цепи стен

    const isClosing = chainPoints.length >= 2 && distance(endPoint, chainPoints[0]) <= 0.25;

    if (isClosing) {

      endPoint = { x: chainPoints[0].x, y: chainPoints[0].y };

    }



    const newWall: Wall = {

      id: 'wall_' + Date.now(),

      start: currentWallStart,

      end: endPoint,

      thickness: wallThickness,

      openings: []

    };



    const nextWalls = [...allWalls, newWall];

    setAllWalls(nextWalls);

    updateRoomsFromWalls(nextWalls);



    if (isClosing) {

      setCurrentWallStart(null);

      setChainPoints([]);

      showToast('🎉 Контур комнаты замкнут!');

    } else {

      setChainPoints(prev => [...prev, endPoint]);

      setCurrentWallStart(endPoint);

      showToast(`📏 Стена ${targetLength >= 1 ? targetLength.toFixed(2) + ' м' : Math.round(targetLength * 1000) + ' мм'} зафиксирована! Введите следующую или сделайте двойной клик.`);

    }



    setIsEditingLength(false);

    setManualLengthInput('');

  };



  // Изменение длины существующей стены с сохранением угловых связей (со смещением стены)

  const applySelectedWallLength = () => {

    if (!selectedWallId) return;

    const rawVal = parseFloat(editWallLengthInput.replace(',', '.'));

    if (isNaN(rawVal) || rawVal <= 0) return;

    const newLen = rawVal >= 35 ? rawVal / 1000 : rawVal;



    pushHistory();

    const updated = resizeWallWithConnected(allWalls, selectedWallId, newLen, rooms);

    setAllWalls(updated);

    updateRoomsFromWalls(updated);

    showToast(`📐 Длина стены обновлена: ${Math.round(newLen * 1000)} мм (стена смещена)`);

  };



  const handleResizeRoomWall = (wallId: string, newLength: number) => {

    if (isNaN(newLength) || newLength <= 0) return;

    const newLen = newLength >= 35 ? newLength / 1000 : newLength;

    pushHistory();

    const updated = resizeWallWithConnected(allWalls, wallId, newLen, rooms);

    setAllWalls(updated);

    updateRoomsFromWalls(updated);

    showToast(`📐 Длина стены обновлена: ${Math.round(newLen * 1000)} мм (стена смещена)`);

  };



  const deleteWall = (wallId: string) => {

    pushHistory();

    const updated = allWalls.filter(w => w.id !== wallId);

    setAllWalls(updated);

    if (selectedWallId === wallId) {

      setSelectedWallId(null);

    }

    setContextMenu(prev => ({ ...prev, visible: false }));

    updateRoomsFromWalls(updated);

  };



  // Вставка проема на стену

  const addOpeningToWall = (wallId: string, type: 'door' | 'window', width?: number, height?: number, offsetM?: number) => {

    pushHistory();

    const finalWidth = width && width > 0 ? width : (type === 'door' ? doorDefaultWidth : windowWidth);

    const finalHeight = height && height > 0 ? height : (type === 'door' ? doorDefaultHeight : windowHeight);



    const updated = allWalls.map(w => {

      if (w.id === wallId) {

        const wallLen = distance(w.start, w.end);

        const targetOffset = offsetM !== undefined ? offsetM : wallLen / 2;

        const newOpening: Opening = {

          id: 'op_' + Date.now(),

          type,

          width: finalWidth,

          height: finalHeight,

          offsetMeters: Math.max(finalWidth / 2 + 0.05, Math.min(wallLen - finalWidth / 2 - 0.05, targetOffset)),

          doorSwingInside: true,

          doorHingeLeft: true

        };

        return {

          ...w,

          openings: [...w.openings, newOpening]

        };

      }

      return w;

    });



    setAllWalls(updated);

    updateRoomsFromWalls(updated);

    setSelectedOpening(null);

    setContextMenu(prev => ({ ...prev, visible: false, targetOpening: null }));

    showToast(type === 'door' ? `✅ Дверь (${finalWidth}×${finalHeight}м) врезана в стену` : `✅ Окно (${finalWidth}×${finalHeight}м) врезано в стену`);

    actionLogger.addLog('draw', `Врезан проём: ${type === 'door' ? 'Дверь' : 'Окно'}`, `Размер: ${finalWidth} × ${finalHeight} м`);

  };



  const updateOpeningParams = (wallId: string, opId: string, updates: Partial<Opening>) => {

    pushHistory();

    const updated = allWalls.map(w => {

      if (w.id === wallId) {

        return {

          ...w,

          openings: w.openings.map(o => o.id === opId ? { ...o, ...updates } : o)

        };

      }

      return w;

    });

    setAllWalls(updated);

    updateRoomsFromWalls(updated);

  };



  const deleteOpening = (wallId: string, opId: string) => {

    pushHistory();

    const updated = allWalls.map(w => {

      if (w.id === wallId) {

        return {

          ...w,

          openings: w.openings.filter(o => o.id !== opId)

        };

      }

      return w;

    });

    setAllWalls(updated);

    setSelectedOpening(null);

    updateRoomsFromWalls(updated);

  };



  const deleteRoom = (roomId: string) => {

    pushHistory();

    const updated = rooms.filter(r => r.id !== roomId);

    setRooms(updated);

    if (onRoomsUpdated) onRoomsUpdated(updated);

    setContextMenu(prev => ({ ...prev, visible: false }));

  };



  // Удаление подложки чертежа

  const handleRemoveBackdrop = (silent: boolean = false) => {

    setBackdrop(null);

    setIsMovingBackdrop(false);

    setCalibration({ active: false, step: 'pick_p1', p1World: null, p2World: null });

    setDetectedTextNotes([]);

    setVectorizeSummary('');

    setCheatSheetData(null);

    setIsCheatSheetOpen(false);

    try {

      localStorage.removeItem('estimate_cad_backdrop_meta');

      localStorage.removeItem('estimate_cad_backdrop_img');

      localStorage.removeItem('estimate_cad_cheatsheet_data');

    } catch (e) {

      console.error(e);

    }

    if (!silent) {

      showToast('🗑️ Подложка и данные чертежа удалены');

    }

  };



  const handleClearAll = () => {

    pushHistory();

    setRooms([]);

    setAllWalls([]);

    setFixtures([]);

    setSelectedFixtureId(null);

    setHoveredFixtureId(null);

    setActiveFixtureType(null);

    setCurrentWallStart(null);

    setChainPoints([]);

    setIsSnapToClose(false);

    setSelectedWallId(null);

    setSelectedOpening(null);

    setSelectedRoomId(null);

    setSelectedVertex(null);

    setHoveredVertex(null);

    setHoveredWallId(null);

    setHoveredOpeningId(null);

    setDraggingVertex(null);

    setIsDraggingOpening(false);

    setDraggingFixture(null);

    setDraggingRoomLabelId(null);

    setContextMenu(prev => ({ ...prev, visible: false }));

    setShowClearConfirm(false);



    // Удаляем фоновую подложку плана

    handleRemoveBackdrop(true);



    try {

      localStorage.removeItem('estimate_cad_fixtures');

      localStorage.removeItem('estimate_cad_walls');

      localStorage.removeItem('estimate_cad_rooms');

    } catch (e) {

      console.error(e);

    }

    if (onRoomsUpdated) onRoomsUpdated([]);
    if (onClearAll) onClearAll();

    showToast('План, помещения и данные проекта полностью очищены');

    actionLogger.addLog('delete', 'Очищен весь чертеж: стены, комнаты, проемы, обозначения и фон подложки');

  };



  const fitView = () => {

    setScale(70);

    setOffset({ x: 350, y: 350 });

  };



  // УДАЛЕНИЕ ПОСЛЕДНЕЙ ПОСТАВЛЕННОЙ ТОЧКИ ПРИ ЧЕРЧЕНИИ

  const handleRemoveLastPoint = useCallback(() => {

    if (!currentWallStart) return;

    pushHistory();

    if (chainPoints.length > 1) {

      const nextWalls = allWalls.slice(0, -1);

      const prevPoints = chainPoints.slice(0, -1);

      const newStart = prevPoints[prevPoints.length - 1];

      setChainPoints(prevPoints);

      setCurrentWallStart(newStart);

      setAllWalls(nextWalls);

      updateRoomsFromWalls(nextWalls);

    } else {

      setCurrentWallStart(null);

      setChainPoints([]);

      setIsSnapToClose(false);

      setIsEditingLength(false);

    }

  }, [currentWallStart, chainPoints, allWalls, pushHistory, updateRoomsFromWalls]);



  // УДАЛЕНИЕ ВЫДЕЛЕННОЙ УГЛОВОЙ ТОЧКИ (ВЕРШИНЫ)

    // Проверка: лежит ли вершина на одной прямой линии между двумя сегментами стены

  const isVertexOnStraightLine = useCallback((v: Point): boolean => {

    const isTarget = (p: Point) => distance(p, v) <= 0.08;

    const incident = allWalls.filter(w => isTarget(w.start) || isTarget(w.end));

    if (incident.length === 2) {

      const ptA = isTarget(incident[0].end) ? incident[0].start : incident[0].end;

      const ptB = isTarget(incident[1].start) ? incident[1].end : incident[1].start;

      const vA = { x: ptA.x - v.x, y: ptA.y - v.y };

      const vB = { x: ptB.x - v.x, y: ptB.y - v.y };

      const lenA = Math.hypot(vA.x, vA.y);

      const lenB = Math.hypot(vB.x, vB.y);

      return lenA > 0.01 && lenB > 0.01 && ((vA.x * vB.x + vA.y * vB.y) / (lenA * lenB)) < -0.80;

    }

    return false;

  }, [allWalls]);



    // Изменение расстояния привязки обозначения от угла стены

  const applyFixtureDistance = useCallback((fix: Fixture, newDist: number) => {

    if (isNaN(newDist) || newDist <= 0 || !fix.wallId) return;

    const wall = allWalls.find(w => w.id === fix.wallId);

    if (!wall) return;

    const wallLen = distance(wall.start, wall.end);

    const clampedDist = Math.max(0.1, Math.min(wallLen - 0.1, newDist));

    const t = clampedDist / wallLen;

    const basePt = {

      x: wall.start.x + (wall.end.x - wall.start.x) * t,

      y: wall.start.y + (wall.end.y - wall.start.y) * t

    };

    const def = getFixtureDefinition(fix.type);

    const snapped = snapFixtureToNearestWallInRoom(basePt, allWalls, rooms, def, 0.40);



    pushHistory();

    setFixtures(prev => prev.map(f => {

      if (f.id === fix.id) {

        return {

          ...f,

          x: snapped.point.x,

          y: snapped.point.y,

          distanceFromCorner: Number(clampedDist.toFixed(2))

        };

      }

      return f;

    }));

    setContextMenu(prev => prev.targetFixture ? {

      ...prev,

      targetFixture: {

        ...prev.targetFixture,

        x: snapped.point.x,

        y: snapped.point.y,

        distanceFromCorner: Number(clampedDist.toFixed(2))

      }

    } : prev);

    showToast(`Привязка к углу изменена: ${clampedDist.toFixed(2)} м`);

  }, [allWalls, rooms, pushHistory, showToast]);



  // Изменение высоты установки обозначения от пола (h)

  const updateFixtureHeight = useCallback((fixId: string, hVal: number) => {

    pushHistory();

    setFixtures(prev => prev.map(f => f.id === fixId ? { ...f, installationHeight: hVal } : f));

    setContextMenu(prev => prev.targetFixture && prev.targetFixture.id === fixId ? {

      ...prev,

      targetFixture: { ...prev.targetFixture, installationHeight: hVal }

    } : prev);

    showToast(`Высота установки h = ${hVal.toFixed(2)} м`);

  }, [pushHistory, showToast]);



  const deleteVertex = useCallback((vertex: Point, mode: 'auto' | 'dissolve' | 'remove_corner' = 'auto') => {

    pushHistory();

    const updated = dissolveVertex(allWalls, vertex, mode);

    setAllWalls(updated);

    setSelectedVertex(null);

    setHoveredVertex(null);

    updateRoomsFromWalls(updated);

    if (contextMenu.visible) {

      setContextMenu(prev => ({ ...prev, visible: false }));

    }

  }, [allWalls, pushHistory, updateRoomsFromWalls, contextMenu.visible]);



  // НАДЕЖНАЯ ОБРАБОТКА ГОРЯЧИХ КЛАВИШ: ДВИЖЕНИЕ ПОЛЯ, УДАЛЕНИЕ ТОЧЕК И ЭЛЕМЕНТОВ

  useEffect(() => {

    const handleKeyDown = (e: KeyboardEvent) => {

      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {

        return;

      }



      // Цифровой ввод длины с клавиатуры во время черчения стены (Numpad или 0-9)

      if (currentWallStart && !isEditingLength && !e.ctrlKey && !e.altKey && !e.metaKey) {

        const isDigit = (e.key >= '0' && e.key <= '9') || (e.code.startsWith('Numpad') && e.key >= '0' && e.key <= '9');

        const isSep = e.key === '.' || e.key === ',';

        if (isDigit || isSep) {

          e.preventDefault();

          setIsEditingLength(true);

          setManualLengthInput(e.key);

          setTimeout(() => {

            if (inputRef.current) {

              inputRef.current.focus();

              inputRef.current.value = e.key;

            }

          }, 30);

          return;

        }

      }



      // Горячая клавиша M: Сдвиг всей квартиры

      if ((e.code === 'KeyM' || e.key === 'm' || e.key === 'M' || e.key === 'ь' || e.key === 'Ь') && !e.repeat && !e.ctrlKey && !e.metaKey) {

        e.preventDefault();

        setToolMode(prev => prev === 'move_all' ? 'draw' : 'move_all');

        showToast(toolMode === 'move_all' ? 'Инструмент «Стена» включен' : '↔️ Режим сдвига всей квартиры: зажмите ЛКМ и перетащите чертеж');

        return;

      }



      // Ctrl + A: Выделение всех стен и режим группового перемещения

      if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyA' || e.key === 'a' || e.key === 'A' || e.key === 'ф' || e.key === 'Ф')) {

        e.preventDefault();

        setToolMode('move_all');

        showToast('↔️ Выделены все стены (Ctrl+A)! Зажмите ЛКМ и перетащите квартиру');

        return;

      }



      // Ctrl + / Ctrl -: Глобальный масштаб шрифтов

      if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+' || e.code === 'NumpadAdd')) {

        e.preventDefault();

        increaseFontScale();

        return;

      }

      if ((e.ctrlKey || e.metaKey) && (e.key === '-' || e.key === '_' || e.code === 'NumpadSubtract')) {

        e.preventDefault();

        decreaseFontScale();

        return;

      }



      // Escape: выход из режима сдвига квартиры

      if (e.key === 'Escape' && toolMode === 'move_all') {

        e.preventDefault();

        setToolMode('draw');

        showToast('Инструмент «Стена» включен');

        return;

      }



      // Пробел: режим ортогонального черчения 90° (или панорама если нет активной стены)

      if (e.code === 'Space' && !e.repeat) {

        e.preventDefault();

        setIsSpacePressed(true);

        if (currentWallStart) {

          const refPoints = getAllReferencePoints();

          const smart = calculateSmartSnap(currentWallStart, cursorWorld, refPoints, scale, true, allWalls);

          setSnappedCursor(smart.point);

          setActiveGuides(smart.guides);

          setIsSnappedToVertex(smart.isSnappedToVertex);

          setIsSnappedToWall(smart.isSnappedToWall);

        }

        return;

      }



      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {

        e.preventDefault();

        if (currentWallStart) {

          handleRemoveLastPoint();

        } else {

          handleUndo();

        }

        return;

      }



      // КЛАВИША DELETE ИЛИ BACKSPACE — УДАЛЕНИЕ ПОСТАВЛЕННОЙ ТОЧКИ, СТЕНЫ, ПРОЕМА ИЛИ ВЕРШИНЫ

      if (e.key === 'Delete' || e.key === 'Backspace') {

        // Приоритет 1: наведённая или выделенная угловая точка

        if (hoveredVertex) {

          e.preventDefault();

          deleteVertex(hoveredVertex);

          actionLogger.addLog('delete', 'Удалена угловая точка [Del]', `Координаты: (${hoveredVertex.x.toFixed(2)}, ${hoveredVertex.y.toFixed(2)})`);

          showToast('🗑 Точка угла удалена [Del]');

          return;

        }

        if (selectedVertex) {

          e.preventDefault();

          deleteVertex(selectedVertex);

          actionLogger.addLog('delete', 'Удалена угловая точка [Del]');

          showToast('🗑 Точка угла удалена [Del]');

          return;

        }



        // Приоритет 2: активное черчение — удаляем последнюю точку

        if (currentWallStart) {

          e.preventDefault();

          handleRemoveLastPoint();

          actionLogger.addLog(

            'delete',

            'Удалена последняя точка стены [Backspace]',

            `Осталось точек: ${chainPoints.length - 1}`

          );

          return;

        }



        // Приоритет 3: наведённая или выделенная стена

        if (hoveredWallId) {

          e.preventDefault();

          deleteWall(hoveredWallId);

          actionLogger.addLog('delete', 'Удалена стена [Del]');

          showToast('🗑 Стена удалена [Del]');

          return;

        }

        if (selectedOpening) {

          e.preventDefault();

          deleteOpening(selectedOpening.wallId, selectedOpening.openingId);

          actionLogger.addLog(

            'delete',

            'Удален проём [Del]',

            undefined,

            'Проём удален со стены, чистая площадь стен пересчитана.'

          );

          showToast('🗑 Проём удален со стены');

          return;

        }

        if (selectedWallId) {

          e.preventDefault();

          deleteWall(selectedWallId);

          actionLogger.addLog(

            'delete',

            'Удалена стена [Del]',

            `ID стены: ${selectedWallId}`,

            'Стена удалена из чертежа. Комнаты пересчитаны.'

          );

          showToast('🗑 Стена удалена');

          return;

        }

        if (selectedRoomId) {

          e.preventDefault();

          deleteRoom(selectedRoomId);

          setSelectedRoomId(null);

          actionLogger.addLog(

            'delete',

            'Удалена комната [Del]',

            undefined,

            'Комната удалена из списка сметы.'

          );

          showToast('🗑 Комната удалена');

          return;

        }



        // Если ничего не было выбрано:

        e.preventDefault();

        actionLogger.addLog(

          'warning',

          'Нажата клавиша Delete, но объект не был выбран',

          'Ни одна стена, точка или проём не были предварительно выделены.',

          '💡 Сначала кликните левой кнопкой мыши по любой стене или углу (чтобы появился оранжевый контур), а затем нажмите Delete.'

        );

        showToast('⚠️ Сначала кликните по стене или точке угла, чтобы выделить её для удаления [Del]');

      }



      if (e.key === 'Escape') {

        if (selectedVertex) {

          setSelectedVertex(null);

          actionLogger.addLog('info', 'Выделение угла снято [Esc]');

        } else if (selectedOpening) {

          setSelectedOpening(null);

          actionLogger.addLog('info', 'Выделение проема снято [Esc]');

        } else if (selectedWallId) {

          setSelectedWallId(null);

          actionLogger.addLog('info', 'Выделение стены снято [Esc]');

        } else if (selectedRoomId) {

          setSelectedRoomId(null);

          setExpandedRoomWallsId(null);

          actionLogger.addLog('info', 'Окно комнаты закрыто [Esc]');

          showToast('Окно комнаты закрыто');

        } else if (currentWallStart) {

          setCurrentWallStart(null);

          setChainPoints([]);

          setIsSnapToClose(false);

          actionLogger.addLog('draw', 'Точка отменена [Esc]');

          showToast('↩ Точка отменена [Esc]. Готово к новой точке.');

        }

        setContextMenu(prev => ({ ...prev, visible: false }));

        setIsEditingLength(false);

      } else if (e.key === 'Enter' && isEditingLength) {

        e.preventDefault();

        applyManualLength();

      }



      if (e.key.toLowerCase() === 'r') {

        setToolMode('room_rect');

        setCurrentWallStart(null);

        setChainPoints([]);

        setSelectedWallId(null);

        setSelectedOpening(null);

        setSelectedRoomId(null);

        setSelectedVertex(null);

        actionLogger.addLog('tool', 'Переключение в режим «Быстрая комната [R]»');

        showToast('🏠 Режим «Быстрая комната [R]»: растяните прямоугольник мышкой поверх подложки');

      } else if (e.key.toLowerCase() === 'w') {

        setToolMode('draw');

        setSelectedWallId(null);

        setSelectedOpening(null);

        setSelectedRoomId(null);

        setSelectedVertex(null);

        actionLogger.addLog('tool', 'Переключение в режим «Чертить [W]»');

      } else if (e.key.toLowerCase() === 'v') {

        setToolMode('select');

        setCurrentWallStart(null);

        setChainPoints([]);

        actionLogger.addLog('tool', 'Переключение в режим «Выбор [V]»');

      } else if (e.key.toLowerCase() === 'o') {

        setOrthoMode(prev => {

          const next = !prev;

          showToast(next ? '⬚ Режим «Орто 90°» ВКЛ' : '📐 Режим «Свободный угол» ВКЛ (под любым углом)');

          return next;

        });

      } else if (e.key.toLowerCase() === 'h') {

        setToolMode('pan');

        setCurrentWallStart(null);

        setChainPoints([]);

        actionLogger.addLog('tool', 'Переключение в режим «Панорама [H]»');

      }

    };



    const handleKeyUp = (e: KeyboardEvent) => {

      if (e.key === 'Shift') {

        setIsShiftPressed(false);

      }

      if (e.code === 'Space') {

        setIsSpacePressed(false);

        setIsPanning(false);

        if (currentWallStart) {

          const refPoints = getAllReferencePoints();

          const smart = calculateSmartSnap(currentWallStart, cursorWorld, refPoints, scale, orthoMode, allWalls);

          setSnappedCursor(smart.point);

          setActiveGuides(smart.guides);

        }

      }

    };



    window.addEventListener('keydown', handleKeyDown, { capture: true });

    window.addEventListener('keyup', handleKeyUp, { capture: true });

    return () => {

      window.removeEventListener('keydown', handleKeyDown, { capture: true });

      window.removeEventListener('keyup', handleKeyUp, { capture: true });

    };

  }, [

    selectedWallId, 

    selectedOpening, 

    selectedRoomId, 

    selectedVertex, 

    currentWallStart, 

    chainPoints, 

    history, 

    allWalls, 

    isEditingLength, 

    handleRemoveLastPoint, 

    deleteVertex, 

    handleUndo

  ]);



  // Глобальный слушатель отжатия мыши (чтобы режим "тянуть" гарантированно отключался в любой точке экрана)

  useEffect(() => {

    const handleGlobalMouseUp = () => {

      if (toolMode === 'room_rect' && rectStartPoint && rectCurrentPoint) {

      const x1 = Math.min(rectStartPoint.x, rectCurrentPoint.x);

      const x2 = Math.max(rectStartPoint.x, rectCurrentPoint.x);

      const y1 = Math.min(rectStartPoint.y, rectCurrentPoint.y);

      const y2 = Math.max(rectStartPoint.y, rectCurrentPoint.y);

      const w = Math.round((x2 - x1) * 100) / 100;

      const h = Math.round((y2 - y1) * 100) / 100;



      setRectStartPoint(null);

      setRectCurrentPoint(null);



      if (w >= 0.35 && h >= 0.35) {

        pushHistory();

        const nowTs = Date.now();

        const newWalls: Wall[] = [

          {

            id: `wall_rect_${nowTs}_top`,

            start: { x: x1, y: y1 },

            end: { x: x2, y: y1 },

            thickness: wallThickness,

            openings: []

          },

          {

            id: `wall_rect_${nowTs}_right`,

            start: { x: x2, y: y1 },

            end: { x: x2, y: y2 },

            thickness: wallThickness,

            openings: []

          },

          {

            id: `wall_rect_${nowTs}_bot`,

            start: { x: x2, y: y2 },

            end: { x: x1, y: y2 },

            thickness: wallThickness,

            openings: []

          },

          {

            id: `wall_rect_${nowTs}_left`,

            start: { x: x1, y: y2 },

            end: { x: x1, y: y1 },

            thickness: wallThickness,

            openings: []

          }

        ];



        const nextWalls = [...allWalls, ...newWalls];

        setAllWalls(nextWalls);

        const updatedRooms = detectRoomsFromWalls(nextWalls, ceilingHeight);

        setRooms(updatedRooms);

        if (onRoomsUpdated) onRoomsUpdated(updatedRooms);



        const area = (w * h).toFixed(2);

        const perim = (2 * (w + h)).toFixed(2);

        const wallArea = (2 * (w + h) * ceilingHeight).toFixed(2);

        showToast(`🏠 Комната создана: ${area} м² | Периметр: ${perim} м.п. | Площадь стен: ${wallArea} м²`);

        actionLogger.addLog('draw', `Создана комната ${w}×${h}м (${area} м²)`);

      }

      return;

    }



    if (panDragRef.current) {

        panDragRef.current = null;

        setIsPanning(false);

        if (toolMode === 'pan') {

          setToolMode('draw');

        }

      }

      if (isPanning) {

        setIsPanning(false);

        if (toolMode === 'pan') {

          setToolMode('draw');

        }

      }

      if (draggingRoomLabelId) {

        setDraggingRoomLabelId(null);

      }

      if (draggingFixture) {

        setDraggingFixture(null);

      }

      if (draggingVertex) {

        setDraggingVertex(null);

        setDragStartPos(null);

        setHasMovedDuringVertexDrag(false);

      }

      if (isDraggingOpening) {

        setIsDraggingOpening(false);

      }

      if (draggingDimKey) {

        setDraggingDimKey(null);

      }

    };



    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {

      window.removeEventListener('mouseup', handleGlobalMouseUp);

    };

  }, [toolMode, isPanning, draggingFixture, draggingVertex, isDraggingOpening, draggingRoomLabelId, draggingDimKey]);



  // Неразрывное плавное перемещение цифры размера за курсором мыши (Live 60 FPS Drag)

  useEffect(() => {

    if (!draggingDimKey) return;



    let rafId: number | null = null;

    let pendingOffset: { x: number; y: number } | null = null;



    const onGlobalMouseMove = (e: MouseEvent) => {

      const canvas = canvasRef.current;

      if (!canvas || !draggingDimKey) return;

      const rect = canvas.getBoundingClientRect();

      const curScreenX = e.clientX - rect.left;

      const curScreenY = e.clientY - rect.top;



      const dx = curScreenX - dragDimStartMouseRef.current.x;

      const dy = curScreenY - dragDimStartMouseRef.current.y;

      const targetX = dragDimInitialOffsetRef.current.x + dx;

      const targetY = dragDimInitialOffsetRef.current.y + dy;



      pendingOffset = { x: targetX, y: targetY };



      if (!rafId) {

        rafId = requestAnimationFrame(() => {

          if (pendingOffset && draggingDimKey) {

            setManualDimOffsets(prev => ({

              ...prev,

              [draggingDimKey]: pendingOffset!

            }));

          }

          rafId = null;

        });

      }

    };



    const onGlobalMouseUp = () => {

      if (rafId) {

        cancelAnimationFrame(rafId);

        rafId = null;

      }

      if (pendingOffset && draggingDimKey) {

        setManualDimOffsets(prev => ({

          ...prev,

          [draggingDimKey]: pendingOffset!

        }));

      }

      setDraggingDimKey(null);

    };



    window.addEventListener('mousemove', onGlobalMouseMove, { passive: true });

    window.addEventListener('mouseup', onGlobalMouseUp);

    return () => {

      if (rafId) cancelAnimationFrame(rafId);

      window.removeEventListener('mousemove', onGlobalMouseMove);

      window.removeEventListener('mouseup', onGlobalMouseUp);

    };

  }, [draggingDimKey]);



  // Основной цикл отрисовки Canvas

  useEffect(() => {

    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (!ctx) return;



    const width = canvas.parentElement?.clientWidth || 800;

    const height = canvas.parentElement?.clientHeight || 600;

    if (canvas.width !== width || canvas.height !== height) {

      canvas.width = width;

      canvas.height = height;

    }



    ctx.fillStyle = '#f8fafc';

    ctx.fillRect(0, 0, width, height);



    // 0. ПОДЛОЖКА ЧЕРТЕЖА (BACKDROP LAYER)

    if (backdrop && backdrop.visible && backdrop.imageElement && backdrop.imageElement.complete) {

      ctx.save();

      ctx.globalAlpha = backdrop.opacity;

      const bScreen = worldToScreen(backdrop.x, backdrop.y);

      const bw = backdrop.widthMeters * scale;

      const bh = backdrop.heightMeters * scale;



      if (backdrop.rotationDeg !== 0) {

        ctx.translate(bScreen.x + bw / 2, bScreen.y + bh / 2);

        ctx.rotate((backdrop.rotationDeg * Math.PI) / 180);

        ctx.drawImage(backdrop.imageElement, -bw / 2, -bh / 2, bw, bh);

      } else {

        ctx.drawImage(backdrop.imageElement, bScreen.x, bScreen.y, bw, bh);

      }

      ctx.restore();

    }



    if (showGrid) {

      drawGrid(ctx, width, height, scale, offset);

    }



    // Заливка комнат (только при наличии замкнутых стен)

    activeRooms.forEach(room => {

      drawRoomPolygon(ctx, room, worldToScreen, room.id === selectedRoomId);

    });



    drawAlignmentGuides(ctx, activeGuides, worldToScreen);



    // 1. Отрисовка монолитных стен

    drawAllSolidWalls(ctx, allWalls, worldToScreen, scale, selectedWallId, hoveredWallId);



    // 2. Отрисовка проемов (окна, двери) - вырезают участки стен

    allWalls.forEach(wall => {

      drawWallOpenings(ctx, wall, worldToScreen, scale, selectedOpening, hoveredOpeningId);

    });



    // 3. Динамическая отрисовка размеров стен и проемов

    if (dimensionStyle === 'architectural') {

      const activeDef = activeFixtureType ? getFixtureDefinition(activeFixtureType) : null;

      const ghostSnapped = activeDef 

        ? snapFixtureToNearestWallInRoom(cursorWorld, allWalls, rooms, activeDef, 0.55)

        : null;



      dimHitBoxesRef.current = [];
      drawArchitecturalWallChains(ctx, allWalls, activeRooms, worldToScreen, scale, {
        unit: dimensionUnit,
        selectedWallId,
        hoveredWallId,
        fixtures,
        ghostFixture: ghostSnapped?.wallId ? { wallId: ghostSnapped.wallId, distanceFromCorner: ghostSnapped.distanceFromCorner } : undefined,
        manualOffsets: manualDimOffsets,
        fontSize: Math.round(9.5 * fontScaleFactor * 10) / 10,
        onRegisterHitBox: (hitBox) => {
          dimHitBoxesRef.current.push(hitBox);
        }
      });

      // Подсветка активной или перетаскиваемой цифры размера
      if (hoveredDimKey || draggingDimKey) {
        const activeKey = draggingDimKey || hoveredDimKey;
        const hb = dimHitBoxesRef.current.find(b => b.key === activeKey);
        if (hb) {
          ctx.save();
          ctx.strokeStyle = '#2563eb';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(hb.x - hb.w / 2 - 2, hb.y - hb.h / 2 - 1, hb.w + 4, hb.h + 2);
          ctx.restore();
        }
      }

      if (showRoomSpans && activeRooms.length > 0) {
        drawRoomSpanDimensions(
          ctx, 
          activeRooms, 
          worldToScreen, 
          scale, 
          dimensionUnit, 
          (hitBox) => {
            dimHitBoxesRef.current.push(hitBox);
          },
          Math.round(9.5 * fontScaleFactor * 10) / 10
        );
      }

      drawCeilingHeightStamp(ctx, width, ceilingHeight, Math.round(18 * fontScaleFactor));
    } else {
      drawAllWallDimensionBadges(ctx, allWalls, worldToScreen, selectedWallId, hoveredWallId);
    }

    // 4. Отрисовка размерных привязок розеток и оборудования по ГОСТ (ярусы размеров по ГОСТ 21.501-2018)
    const wallsWithFixtures = allWalls.filter(w => fixtures.some(f => f.wallId === w.id));
    wallsWithFixtures.forEach(wall => {
      const room = activeRooms.find(r => r.walls?.some(w => w.id === wall.id));
      drawWallFixtureTiers(
        ctx,
        wall,
        fixtures,
        room,
        worldToScreen,
        scale,
        dimensionUnit,
        selectedFixtureId,
        hoveredFixtureId,
        (hitBox) => {
          dimHitBoxesRef.current.push(hitBox);
        },
        Math.round(9.5 * fontScaleFactor * 10) / 10
      );
    });

    // Для свободно стоящих объектов (ванна, унитаз, инсталляция, раковина, мебель)
    fixtures.filter(f => !f.wallId).forEach(fix => {
      drawFixtureDimensionTies(
        ctx,
        fix,
        allWalls,
        rooms,
        worldToScreen,
        scale,
        dimensionUnit,
        fix.id === selectedFixtureId,
        fix.id === hoveredFixtureId || draggingFixture?.id === fix.id,
        (hitBox) => {
          dimHitBoxesRef.current.push(hitBox);
        },
        Math.round(9.5 * fontScaleFactor * 10) / 10
      );
    });



    // Отрисовка установленных обозначений (Розетки, Выключатели, Сантехника, Стояки)

    fixtures.forEach(fix => {

      const scr = worldToScreen(fix.x, fix.y);

      drawFixture2D(

        ctx,

        fix,

        scr.x,

        scr.y,

        scale,

        fix.id === selectedFixtureId,

        fix.id === hoveredFixtureId

      );

    });



    // Если размещаем новое обозначение - рисуем живую подвязку яруса по ГОСТ

    if (activeFixtureType) {

      const def = getFixtureDefinition(activeFixtureType);

      const ghostSnapped = snapFixtureToNearestWallInRoom(cursorWorld, allWalls, rooms, def, 0.55);

      if (ghostSnapped.wallId) {

        const wall = allWalls.find(w => w.id === ghostSnapped.wallId);

        if (wall) {

          const room = rooms.find(r => r.id === ghostSnapped.roomId) || rooms.find(r => r.walls?.some(w => w.id === wall.id));

          drawWallFixtureTiers(

            ctx,

            wall,

            [

              ...fixtures.filter(f => f.wallId === wall.id),

              {

                id: 'ghost_tier',

                type: activeFixtureType,

                category: def.category,

                name: def.name,

                x: ghostSnapped.point.x,

                y: ghostSnapped.point.y,

                rotationDeg: ghostSnapped.rotationDeg,

                width: def.width,

                height: def.height,

                wallId: wall.id,

                distanceFromCorner: ghostSnapped.distanceFromCorner,

                installationHeight: def.defaultHeightFromFloor

              }

            ],

            room,

            worldToScreen,

            scale,

            dimensionUnit,

            'ghost_tier',
            null,
            undefined,
            Math.round(9.5 * fontScaleFactor * 10) / 10
          );

        }

      }

    }



    // Отрисовка фантомного превью обозначения при наведении курсора (авто-ориентация к стене)

    if (activeFixtureType) {

      const def = getFixtureDefinition(activeFixtureType);

      const ghostSnapped = snapFixtureToNearestWallInRoom(cursorWorld, allWalls, rooms, def, 0.55);

      const targetPt = ghostSnapped.wallId ? ghostSnapped.point : (isSnappedToWall || isSnappedToVertex ? snappedCursor : cursorWorld);

      const targetRot = ghostSnapped.wallId ? ghostSnapped.rotationDeg : fixtureRotation;

      const ghostScr = worldToScreen(targetPt.x, targetPt.y);

      ctx.save();

      ctx.globalAlpha = 0.85;

      drawFixture2D(

        ctx,

        {

          id: 'ghost',

          type: activeFixtureType,

          category: def.category,

          name: def.name,

          x: targetPt.x,

          y: targetPt.y,

          rotationDeg: targetRot,

          width: def.width,

          height: def.height

        },

        ghostScr.x,

        ghostScr.y,

        scale,

        false,

        true

      );

      ctx.restore();

    }



    // Отрисовка угловых маркеров (Corner handles)

    drawCornerHandles(ctx, getAllVertices(), worldToScreen, hoveredVertex, draggingVertex, selectedVertex);



    // Бейджи размеров для выделенной стены

    if (selectedWallId) {

      const wall = allWalls.find(w => w.id === selectedWallId);

      if (wall) {

        drawSelectedWallHandles(ctx, wall, worldToScreen);

      }

    }



    // Привязка к вершине (зеленая точка)

    if (isSnappedToVertex && !isSnapToClose) {

      const snapScr = worldToScreen(snappedCursor.x, snappedCursor.y);

      ctx.save();

      ctx.strokeStyle = '#10b981';

      ctx.lineWidth = 2.5;

      ctx.beginPath();

      ctx.arc(snapScr.x, snapScr.y, 8, 0, Math.PI * 2);

      ctx.stroke();



      ctx.fillStyle = '#10b981';

      ctx.beginPath();

      ctx.arc(snapScr.x, snapScr.y, 3.5, 0, Math.PI * 2);

      ctx.fill();

      ctx.restore();

    }



    // Привязка к существующей стене (желтая точка)

    if (isSnappedToWall && !isSnappedToVertex) {

      const snapScr = worldToScreen(snappedCursor.x, snappedCursor.y);

      ctx.save();

      ctx.strokeStyle = '#eab308';

      ctx.lineWidth = 2.5;

      ctx.beginPath();

      ctx.arc(snapScr.x, snapScr.y, 8, 0, Math.PI * 2);

      ctx.stroke();



      ctx.fillStyle = '#eab308';

      ctx.beginPath();

      ctx.arc(snapScr.x, snapScr.y, 3.5, 0, Math.PI * 2);

      ctx.fill();

      ctx.restore();

    }



    // Чертимая стена (фантом)

    if (currentWallStart) {

      const p1 = worldToScreen(currentWallStart.x, currentWallStart.y);

      const p2 = worldToScreen(snappedCursor.x, snappedCursor.y);



      ctx.save();

      ctx.lineWidth = wallThickness * scale;

      ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';

      ctx.lineCap = 'square';

      ctx.beginPath();

      ctx.moveTo(p1.x, p1.y);

      ctx.lineTo(p2.x, p2.y);

      ctx.stroke();



      ctx.setLineDash([4, 4]);

      ctx.strokeStyle = '#2563eb';

      ctx.lineWidth = 1.5;

      ctx.beginPath();

      ctx.moveTo(p1.x, p1.y);

      ctx.lineTo(p2.x, p2.y);

      ctx.stroke();

      ctx.setLineDash([]);



      ctx.fillStyle = '#2563eb';

      ctx.beginPath();

      ctx.arc(p1.x, p1.y, 4, 0, Math.PI * 2);

      ctx.fill();



      ctx.fillStyle = isSnapToClose ? '#16a34a' : '#2563eb';

      ctx.beginPath();

      ctx.arc(p2.x, p2.y, isSnapToClose ? 8 : 4, 0, Math.PI * 2);

      ctx.fill();



      if (isSnapToClose) {

        ctx.strokeStyle = '#16a34a';

        ctx.lineWidth = 2.5;

        ctx.beginPath();

        ctx.arc(p2.x, p2.y, 16, 0, Math.PI * 2);

        ctx.stroke();

      }

      ctx.restore();

    }



    // 6. Отрисовка калибровки масштаба подложки

    if (calibration.active && calibration.p1World) {

      const p1Scr = worldToScreen(calibration.p1World.x, calibration.p1World.y);

      const targetWorld = calibration.p2World || cursorWorld;

      const p2Scr = worldToScreen(targetWorld.x, targetWorld.y);



      ctx.save();

      // Пунктирная линия замера

      ctx.strokeStyle = '#ef4444';

      ctx.lineWidth = 2;

      ctx.setLineDash([6, 4]);

      ctx.beginPath();

      ctx.moveTo(p1Scr.x, p1Scr.y);

      ctx.lineTo(p2Scr.x, p2Scr.y);

      ctx.stroke();

      ctx.setLineDash([]);



      // Точка 1: красный маркер и перекрестие

      ctx.fillStyle = '#ef4444';

      ctx.beginPath();

      ctx.arc(p1Scr.x, p1Scr.y, 6, 0, Math.PI * 2);

      ctx.fill();

      ctx.strokeStyle = '#ef4444';

      ctx.beginPath();

      ctx.moveTo(p1Scr.x - 14, p1Scr.y); ctx.lineTo(p1Scr.x + 14, p1Scr.y);

      ctx.moveTo(p1Scr.x, p1Scr.y - 14); ctx.lineTo(p1Scr.x, p1Scr.y + 14);

      ctx.stroke();



      // Точка 2: синий маркер и перекрестие

      ctx.fillStyle = '#2563eb';

      ctx.beginPath();

      ctx.arc(p2Scr.x, p2Scr.y, 6, 0, Math.PI * 2);

      ctx.fill();

      ctx.strokeStyle = '#2563eb';

      ctx.beginPath();

      ctx.moveTo(p2Scr.x - 14, p2Scr.y); ctx.lineTo(p2Scr.x + 14, p2Scr.y);

      ctx.moveTo(p2Scr.x, p2Scr.y - 14); ctx.lineTo(p2Scr.x, p2Scr.y + 14);

      ctx.stroke();



      // Бейдж с размером

      const midX = (p1Scr.x + p2Scr.x) / 2;

      const midY = (p1Scr.y + p2Scr.y) / 2 - 16;

      const distMm = Math.round(distance(calibration.p1World, targetWorld) * 1000);

      const badgeText = `📏 Калибровка: ${distMm} мм`;



      ctx.font = 'bold 12px Inter, sans-serif';

      const textW = ctx.measureText(badgeText).width;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';

      ctx.fillRect(midX - textW / 2 - 8, midY - 14, textW + 16, 22);

      ctx.strokeStyle = '#38bdf8';

      ctx.lineWidth = 1;

      ctx.strokeRect(midX - textW / 2 - 8, midY - 14, textW + 16, 22);



      ctx.fillStyle = '#38bdf8';

      ctx.fillText(badgeText, midX - textW / 2, midY + 2);

      ctx.restore();

    }



    // Быстрая комната: интерактивный полупрозрачный прямоугольник с бейджем размеров

    if (toolMode === 'room_rect' && rectStartPoint && rectCurrentPoint) {

      const rx1 = Math.min(rectStartPoint.x, rectCurrentPoint.x);

      const rx2 = Math.max(rectStartPoint.x, rectCurrentPoint.x);

      const ry1 = Math.min(rectStartPoint.y, rectCurrentPoint.y);

      const ry2 = Math.max(rectStartPoint.y, rectCurrentPoint.y);

      const rw = rx2 - rx1;

      const rh = ry2 - ry1;



      const pTopLeft = worldToScreen(rx1, ry1);

      const scrW = rw * scale;

      const scrH = rh * scale;



      ctx.save();

      ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';

      ctx.fillRect(pTopLeft.x, pTopLeft.y, scrW, scrH);

      ctx.strokeStyle = '#2563eb';

      ctx.lineWidth = 2;

      ctx.setLineDash([6, 4]);

      ctx.strokeRect(pTopLeft.x, pTopLeft.y, scrW, scrH);



      // Бейдж с размерами и площадью по центру

      const centerScr = { x: pTopLeft.x + scrW / 2, y: pTopLeft.y + scrH / 2 };

      const dimText = `${Math.round(rw * 1000)} × ${Math.round(rh * 1000)} мм (${(rw * rh).toFixed(2)} м²)`;

      ctx.font = 'bold 12px Inter, sans-serif';

      const textMetrics = ctx.measureText(dimText);

      const pad = 6;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';

      ctx.beginPath();

      ctx.roundRect(

        centerScr.x - textMetrics.width / 2 - pad,

        centerScr.y - 12 - pad,

        textMetrics.width + pad * 2,

        24 + pad,

        6

      );

      ctx.fill();

      ctx.fillStyle = '#ffffff';

      ctx.textAlign = 'center';

      ctx.textBaseline = 'middle';

      ctx.fillText(dimText, centerScr.x, centerScr.y);

      ctx.restore();

    }

  }, [scale, offset, rooms, allWalls, currentWallStart, snappedCursor, activeGuides, isSnapToClose, isSnappedToVertex, isSnappedToWall, selectedRoomId, wallThickness, selectedWallId, hoveredWallId, selectedOpening, hoveredOpeningId, hoveredVertex, draggingVertex, worldToScreen, backdrop, calibration, cursorWorld, manualDimOffsets, draggingDimKey, hoveredDimKey, toolMode, rectStartPoint, rectCurrentPoint, fontScale, fontScaleFactor, dimensionUnit, ceilingHeight, fixtures, selectedFixtureId, hoveredFixtureId, activeFixtureType, showRoomSpans]);



  // Сетка

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number, s: number, off: Point) => {

    ctx.save();

    const stepMinor = 0.2 * s;

    if (stepMinor > 8) {

      ctx.strokeStyle = '#e2e8f0';

      ctx.lineWidth = 0.5;

      ctx.beginPath();

      const startX = off.x % stepMinor;

      for (let x = startX; x < width; x += stepMinor) {

        ctx.moveTo(x, 0);

        ctx.lineTo(x, height);

      }

      const startY = off.y % stepMinor;

      for (let y = startY; y < height; y += stepMinor) {

        ctx.moveTo(0, y);

        ctx.lineTo(width, y);

      }

      ctx.stroke();

    }



    const stepMajor = 1.0 * s;

    ctx.strokeStyle = '#cbd5e1';

    ctx.lineWidth = 1;

    ctx.beginPath();

    const majorStartX = off.x % stepMajor;

    for (let x = majorStartX; x < width; x += stepMajor) {

      ctx.moveTo(x, 0);

      ctx.lineTo(x, height);

    }

    const majorStartY = off.y % stepMajor;

    for (let y = majorStartY; y < height; y += stepMajor) {

      ctx.moveTo(0, y);

      ctx.lineTo(width, y);

    }

    ctx.stroke();

    ctx.restore();

  };



  // Проекционные лучи

  const drawAlignmentGuides = (

    ctx: CanvasRenderingContext2D,

    guides: AlignmentGuide[],

    toScreen: (x: number, y: number) => Point

  ) => {

    if (guides.length === 0) return;

    ctx.save();

    ctx.setLineDash([5, 5]);

    ctx.strokeStyle = '#10b981';

    ctx.lineWidth = 1.2;



    guides.forEach(g => {

      const pFrom = toScreen(g.from.x, g.from.y);

      const pTo = toScreen(g.to.x, g.to.y);

      ctx.beginPath();

      ctx.moveTo(pFrom.x, pFrom.y);

      ctx.lineTo(pTo.x, pTo.y);

      ctx.stroke();



      ctx.fillStyle = '#10b981';

      ctx.beginPath();

      ctx.arc(pFrom.x, pFrom.y, 3, 0, Math.PI * 2);

      ctx.fill();

    });

    ctx.restore();

  };



  // Стены (Сплошные несущие vs Пустотелые перегородки/ограждения с окантовкой по краям)

  const drawAllSolidWalls = (

    ctx: CanvasRenderingContext2D,

    walls: Wall[],

    toScreen: (x: number, y: number) => Point,

    s: number,

    selId: string | null,

    hovId: string | null

  ) => {

    if (walls.length === 0) return;

    ctx.save();



    // 1. Отрисовка сплошных стен (несущие толстые чёрные, перегородки тонкие чёрные)

    walls.forEach(w => {

      const isHollow = Boolean(w.isHollow) || w.wallType === 'railing' || w.wallType === 'hollow';

      if (isHollow) return;



      const p1 = toScreen(w.start.x, w.start.y);

      const p2 = toScreen(w.end.x, w.end.y);

      const isSelected = w.id === selId;

      const isHovered = w.id === hovId && !isSelected;



      ctx.lineWidth = w.thickness * s;

      ctx.lineCap = 'square';

      ctx.lineJoin = 'miter';



      if (isSelected) {

        ctx.strokeStyle = '#f59e0b';

      } else if (isHovered) {

        ctx.strokeStyle = '#3b82f6';

      } else {

        ctx.strokeStyle = '#0f172a'; // Чёрный цвет по ГОСТ: перегородка тоньше, несущая толще

      }



      ctx.beginPath();

      ctx.moveTo(p1.x, p1.y);

      ctx.lineTo(p2.x, p2.y);

      ctx.stroke();

    });



    // Круглые заглушки только для СПЛОШНЫХ стен

    walls.forEach(w => {

      const isHollow = Boolean(w.isHollow) || w.wallType === 'railing' || w.wallType === 'hollow';

      if (isHollow) return;



      const p1 = toScreen(w.start.x, w.start.y);

      const p2 = toScreen(w.end.x, w.end.y);

      const radius = (w.thickness * s) / 2;

      const isSelected = w.id === selId;



      ctx.fillStyle = isSelected ? '#f59e0b' : '#0f172a';

      ctx.beginPath();

      ctx.arc(p1.x, p1.y, radius, 0, Math.PI * 2);

      ctx.fill();



      ctx.beginPath();

      ctx.arc(p2.x, p2.y, radius, 0, Math.PI * 2);

      ctx.fill();

    });



    // 2. Отрисовка ПУСТОТЕЛЫХ стен (ограждения балкона: внутри белые/пустые, окантовка по краям)

    walls.forEach(w => {

      const isHollow = Boolean(w.isHollow) || w.wallType === 'railing' || w.wallType === 'hollow';

      if (!isHollow) return;



      const p1 = toScreen(w.start.x, w.start.y);

      const p2 = toScreen(w.end.x, w.end.y);

      const isSelected = w.id === selId;

      const isHovered = w.id === hovId && !isSelected;



      const dx = w.end.x - w.start.x;

      const dy = w.end.y - w.start.y;

      const len = Math.hypot(dx, dy);

      if (len < 0.001) return;



      const nx = -dy / len;

      const ny = dx / len;

      const halfW = (w.thickness * s) / 2;



      // 4 вершины прямоугольника стены на экране

      const c1 = { x: p1.x + nx * halfW, y: p1.y + ny * halfW };

      const c2 = { x: p2.x + nx * halfW, y: p2.y + ny * halfW };

      const c3 = { x: p2.x - nx * halfW, y: p2.y - ny * halfW };

      const c4 = { x: p1.x - nx * halfW, y: p1.y - ny * halfW };



      // Внутри стена пустая (заливка белым)

      ctx.fillStyle = '#ffffff';

      ctx.beginPath();

      ctx.moveTo(c1.x, c1.y);

      ctx.lineTo(c2.x, c2.y);

      ctx.lineTo(c3.x, c3.y);

      ctx.lineTo(c4.x, c4.y);

      ctx.closePath();

      ctx.fill();



      // Окантовка по краям (две параллельные линии)

      ctx.lineWidth = isSelected ? 2.5 : isHovered ? 2.0 : 1.5;

      ctx.strokeStyle = isSelected ? '#f59e0b' : isHovered ? '#3b82f6' : '#1e293b';



      ctx.beginPath();

      ctx.moveTo(c1.x, c1.y);

      ctx.lineTo(c2.x, c2.y);

      ctx.moveTo(c4.x, c4.y);

      ctx.lineTo(c3.x, c3.y);

      ctx.stroke();



      // Замыкание торцев (если к концу не примыкает другая стена)

      const hasStartNeighbor = walls.some(other => other.id !== w.id && (distance(other.start, w.start) < 0.08 || distance(other.end, w.start) < 0.08));

      const hasEndNeighbor = walls.some(other => other.id !== w.id && (distance(other.start, w.end) < 0.08 || distance(other.end, w.end) < 0.08));



      ctx.beginPath();

      if (!hasStartNeighbor) {

        ctx.moveTo(c4.x, c4.y);

        ctx.lineTo(c1.x, c1.y);

      }

      if (!hasEndNeighbor) {

        ctx.moveTo(c2.x, c2.y);

        ctx.lineTo(c3.x, c3.y);

      }

      ctx.stroke();

    });



    ctx.restore();

  };



  // Угловые ручки (Corner handles) для растягивания стен и выделения точек

  const drawCornerHandles = (

    ctx: CanvasRenderingContext2D,

    vertices: Point[],

    toScreen: (x: number, y: number) => Point,

    hovV: Point | null,

    dragV: Point | null,

    selV: Point | null = null

  ) => {

    vertices.forEach(v => {

      const p = toScreen(v.x, v.y);

      const isSel = selV && distance(v, selV) < 0.05;

      const isHov = hovV && distance(v, hovV) < 0.05;

      const isDrag = dragV && distance(v, dragV) < 0.05;



      ctx.save();

      if (isSel) {

        ctx.fillStyle = '#f59e0b';

        ctx.strokeStyle = '#d97706';

        ctx.lineWidth = 3;

        ctx.beginPath();

        ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);

        ctx.fill();

        ctx.stroke();



        ctx.strokeStyle = '#fbbf24';

        ctx.lineWidth = 2;

        ctx.beginPath();

        ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);

        ctx.stroke();

      } else {

        ctx.fillStyle = isDrag ? '#3b82f6' : '#ffffff';

        ctx.strokeStyle = isDrag || isHov ? '#2563eb' : '#64748b';

        ctx.lineWidth = isDrag || isHov ? 2.5 : 1.5;

        ctx.beginPath();

        ctx.arc(p.x, p.y, isDrag || isHov ? 6 : 4, 0, Math.PI * 2);

        ctx.fill();

        ctx.stroke();

      }

      ctx.restore();

    });

  };



  // Ручки концов выделенной стены

  const drawSelectedWallHandles = (

    ctx: CanvasRenderingContext2D,

    wall: Wall,

    toScreen: (x: number, y: number) => Point

  ) => {

    const p1 = toScreen(wall.start.x, wall.start.y);

    const p2 = toScreen(wall.end.x, wall.end.y);



    [p1, p2].forEach(p => {

      ctx.save();

      ctx.fillStyle = '#ffffff';

      ctx.strokeStyle = '#f59e0b';

      ctx.lineWidth = 2.5;

      ctx.beginPath();

      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);

      ctx.fill();

      ctx.stroke();

      ctx.restore();

    });

  };



  // Отрисовка проемов (окна, двери) + ВЫНОСНЫЕ РАЗМЕРЫ ДО УГЛОВ СТЕНЫ + СТОРОНА ОТКРЫВАНИЯ

  const drawWallOpenings = (

    ctx: CanvasRenderingContext2D,

    wall: Wall,

    toScreen: (x: number, y: number) => Point,

    s: number,

    selOp: SelectedOpeningState | null,

    hovOpId: string | null

  ) => {

    if (!wall.openings || wall.openings.length === 0) return;



    const wallLen = distance(wall.start, wall.end);

    if (wallLen < 0.001) return;



    const ux = (wall.end.x - wall.start.x) / wallLen;

    const uy = (wall.end.y - wall.start.y) / wallLen;

    const nx = -uy;

    const ny = ux;



    wall.openings.forEach(op => {

      const isSelected = selOp?.wallId === wall.id && selOp?.openingId === op.id;

      const isHovered = hovOpId === op.id;



      const cx = wall.start.x + ux * op.offsetMeters;

      const cy = wall.start.y + uy * op.offsetMeters;

      const halfW = op.width / 2;



      const p1 = toScreen(cx - ux * halfW + nx * (wall.thickness / 2), cy - uy * halfW + ny * (wall.thickness / 2));

      const p2 = toScreen(cx + ux * halfW + nx * (wall.thickness / 2), cy + uy * halfW + ny * (wall.thickness / 2));

      const p3 = toScreen(cx + ux * halfW - nx * (wall.thickness / 2), cy + uy * halfW - ny * (wall.thickness / 2));

      const p4 = toScreen(cx - ux * halfW - nx * (wall.thickness / 2), cy - uy * halfW - ny * (wall.thickness / 2));



      ctx.save();

      ctx.fillStyle = '#ffffff';

      ctx.beginPath();

      ctx.moveTo(p1.x, p1.y);

      ctx.lineTo(p2.x, p2.y);

      ctx.lineTo(p3.x, p3.y);

      ctx.lineTo(p4.x, p4.y);

      ctx.closePath();

      ctx.fill();



      ctx.strokeStyle = isSelected ? '#f59e0b' : '#1e293b';

      ctx.lineWidth = isSelected ? 2.5 : 1.5;

      ctx.beginPath();

      ctx.moveTo(p1.x, p1.y);

      ctx.lineTo(p4.x, p4.y);

      ctx.moveTo(p2.x, p2.y);

      ctx.lineTo(p3.x, p3.y);

      ctx.stroke();



      if (op.type === 'window') {

        ctx.strokeStyle = isSelected ? '#0284c7' : '#38bdf8';

        ctx.lineWidth = 2.5;

        const mid1 = toScreen(cx - ux * halfW, cy - uy * halfW);

        const mid2 = toScreen(cx + ux * halfW, cy + uy * halfW);

        ctx.beginPath();

        ctx.moveTo(mid1.x, mid1.y);

        ctx.lineTo(mid2.x, mid2.y);

        ctx.stroke();

      } else if (op.type === 'opening' || op.type === 'portal') {

        // ОТКРЫТЫЙ ПРОЕМ (без дверного полотна по ГОСТ 21.501)

        const mid1 = toScreen(cx - ux * halfW, cy - uy * halfW);

        const mid2 = toScreen(cx + ux * halfW, cy + uy * halfW);

        ctx.setLineDash([4, 3]);

        ctx.strokeStyle = isSelected ? '#f59e0b' : '#94a3b8';

        ctx.lineWidth = 1.2;

        ctx.beginPath();

        ctx.moveTo(mid1.x, mid1.y);

        ctx.lineTo(mid2.x, mid2.y);

        ctx.stroke();

        ctx.setLineDash([]);

      } else {

        // ДВЕРЬ С УЧЕТОМ СТОРОНЫ ПЕТЕЛЬ И НАПРАВЛЕНИЯ ОТКРЫВАНИЯ

        const hingeLeft = op.doorHingeLeft !== false; // по умолчанию петли слева

        const swingInside = op.doorSwingInside !== false; // по умолчанию открывание внутрь



        const hingeX = hingeLeft ? cx - ux * halfW : cx + ux * halfW;

        const hingeY = hingeLeft ? cy - uy * halfW : cy + uy * halfW;

        const hingeScr = toScreen(hingeX, hingeY);



        const normalMult = swingInside ? 1 : -1;

        const doorLenPx = op.width * s;



        // Вектор закрытого полотна вдоль стены

        const dirClosedX = hingeLeft ? ux : -ux;

        const dirClosedY = hingeLeft ? uy : -uy;



        // Вектор открытого полотна (перпендикулярно)

        const dirOpenX = nx * normalMult;

        const dirOpenY = ny * normalMult;



        const openScrX = hingeScr.x + dirOpenX * doorLenPx;

        const openScrY = hingeScr.y + dirOpenY * doorLenPx;



        // Полотно двери в открытом положении

        ctx.strokeStyle = isSelected ? '#ea580c' : '#fb923c';

        ctx.lineWidth = 2.5;

        ctx.beginPath();

        ctx.moveTo(hingeScr.x, hingeScr.y);

        ctx.lineTo(openScrX, openScrY);

        ctx.stroke();



        // Петля (точка)

        ctx.fillStyle = isSelected ? '#ea580c' : '#f97316';

        ctx.beginPath();

        ctx.arc(hingeScr.x, hingeScr.y, 3, 0, Math.PI * 2);

        ctx.fill();



        // Дуга траектории открывания

        const angleClosed = Math.atan2(dirClosedY, dirClosedX);

        const angleOpen = Math.atan2(dirOpenY, dirOpenX);



        ctx.setLineDash([3, 3]);

        ctx.strokeStyle = isSelected ? '#ea580c' : '#f97316';

        ctx.lineWidth = 1.2;

        ctx.beginPath();

        const cross = dirClosedX * dirOpenY - dirClosedY * dirOpenX;

        const anticlockwise = cross < 0;

        ctx.arc(hingeScr.x, hingeScr.y, doorLenPx, angleClosed, angleOpen, anticlockwise);

        ctx.stroke();

        ctx.setLineDash([]);

      }



      // Выносные размеры до углов

      if (isSelected || isHovered) {

        const distLeft = op.offsetMeters - halfW;

        const distRight = wallLen - (op.offsetMeters + halfW);



        const wallStartScr = toScreen(wall.start.x, wall.start.y);

        const opStartScr = toScreen(cx - ux * halfW, cy - uy * halfW);

        const wallEndScr = toScreen(wall.end.x, wall.end.y);

        const opEndScr = toScreen(cx + ux * halfW, cy + uy * halfW);



        const isWallVert = Math.abs(wall.end.y - wall.start.y) > Math.abs(wall.end.x - wall.start.x);

        const opBadgeAngle = isWallVert ? -Math.PI / 2 : 0;



        if (distLeft > 0.05) {

          const midLeftX = (wallStartScr.x + opStartScr.x) / 2;

          const midLeftY = (wallStartScr.y + opStartScr.y) / 2;

          drawDimensionBadge(ctx, `${distLeft.toFixed(2)} м`, midLeftX, midLeftY, Math.abs(distLeft - 0.10) < 0.02, false, opBadgeAngle);

        }



        if (distRight > 0.05) {

          const midRightX = (opEndScr.x + wallEndScr.x) / 2;

          const midRightY = (opEndScr.y + wallEndScr.y) / 2;

          drawDimensionBadge(ctx, `${distRight.toFixed(2)} м`, midRightX, midRightY, Math.abs(distRight - 0.10) < 0.02, false, opBadgeAngle);

        }

      }



      ctx.restore();

    });

  };



  const drawDimensionBadge = (

    ctx: CanvasRenderingContext2D, 

    text: string, 

    x: number, 

    y: number, 

    isHighlight: boolean = false, 

    isHover: boolean = false,

    angle: number = 0

  ) => {

    ctx.save();

    ctx.translate(x, y);

    if (angle !== 0) {

      ctx.rotate(angle);

    }



    const baseFontPx = isHighlight ? 10 : 9;

    const fontPx = Math.round(baseFontPx * fontScaleFactor);

    ctx.font = `${isHighlight ? 'bold' : '500'} ${fontPx}px monospace`;

    const textW = ctx.measureText(text).width;

    const badgeW = textW + Math.round(6 * fontScaleFactor);

    const badgeH = Math.round(15 * fontScaleFactor);



    ctx.fillStyle = isHighlight ? '#f59e0b' : isHover ? '#2563eb' : 'rgba(30, 41, 59, 0.85)';

    ctx.beginPath();

    ctx.roundRect(-badgeW / 2, -badgeH / 2, badgeW, badgeH, 4);

    ctx.fill();



    if (isHighlight || isHover) {

      ctx.strokeStyle = '#ffffff';

      ctx.lineWidth = 1;

      ctx.stroke();

    }



    ctx.fillStyle = '#ffffff';

    ctx.textAlign = 'center';

    ctx.textBaseline = 'middle';

    ctx.fillText(text, 0, 0);

    ctx.restore();

  };



  const drawAllWallDimensionBadges = (

    ctx: CanvasRenderingContext2D,

    walls: Wall[],

    toScreen: (x: number, y: number) => Point,

    selId: string | null,

    hovId: string | null

  ) => {

    walls.forEach(w => {

      const wallLen = distance(w.start, w.end);

      if (wallLen < 0.25) return;



      const isSelected = w.id === selId;

      const isHovered = w.id === hovId;



      const dx = (w.end.x - w.start.x) / wallLen;

      const dy = (w.end.y - w.start.y) / wallLen;

      const nx = -dy;

      const ny = dx;



      // Угол поворота по ГОСТ 2.307-2011:

      // На вертикальных стенах (|dy| > |dx|) строго -PI / 2 (снизу вверх, верх цифр влево)

      const isVertical = Math.abs(w.end.y - w.start.y) > Math.abs(w.end.x - w.start.x);

      const badgeAngle = isVertical ? -Math.PI / 2 : 0;



      // Если у стены нет дверей и окон - ставим точно по центру

      if (!w.openings || w.openings.length === 0) {

        const mid = toScreen((w.start.x + w.end.x) / 2, (w.start.y + w.end.y) / 2);

        drawDimensionBadge(ctx, `${wallLen.toFixed(2)} м`, mid.x, mid.y, isSelected, isHovered, badgeAngle);

        return;

      }



      // Если есть проемы: проверяем, не перекрывает ли дверь/окно центр стены

      const midOffset = wallLen / 2;

      const collidesWithOpening = w.openings.some(op => {

        const halfW = op.width / 2 + 0.18;

        return midOffset >= (op.offsetMeters - halfW) && midOffset <= (op.offsetMeters + halfW);

      });



      if (!collidesWithOpening) {

        // Центр свободен

        const mid = toScreen((w.start.x + w.end.x) / 2, (w.start.y + w.end.y) / 2);

        drawDimensionBadge(ctx, `${wallLen.toFixed(2)} м`, mid.x, mid.y, isSelected, isHovered, badgeAngle);

        return;

      }



      // Центр перекрыт дверью или окном!

      // Ищем самый длинный чистый цельный участок стены между углами и проемами

      const sortedOps = [...w.openings].sort((a, b) => a.offsetMeters - b.offsetMeters);

      const intervals: { start: number; end: number; len: number }[] = [];

      let cur = 0;

      for (const op of sortedOps) {

        const opStart = Math.max(0, op.offsetMeters - op.width / 2);

        const opEnd = Math.min(wallLen, op.offsetMeters + op.width / 2);

        if (opStart - cur > 0.05) {

          intervals.push({ start: cur, end: opStart, len: opStart - cur });

        }

        cur = Math.max(cur, opEnd);

      }

      if (wallLen - cur > 0.05) {

        intervals.push({ start: cur, end: wallLen, len: wallLen - cur });

      }



      const bestInterval = intervals.reduce(

        (max, it) => (it.len > max.len ? it : max),

        { start: 0, end: 0, len: 0 }

      );



      if (bestInterval.len >= 0.55) {

        // Ставим бейдж в центр самого длинного чистого участка

        const targetOffset = (bestInterval.start + bestInterval.end) / 2;

        const targetX = w.start.x + dx * targetOffset;

        const targetY = w.start.y + dy * targetOffset;

        const scr = toScreen(targetX, targetY);

        drawDimensionBadge(ctx, `${wallLen.toFixed(2)} м`, scr.x, scr.y, isSelected, isHovered, badgeAngle);

      } else {

        // Выносим размерную линию параллельно стене наружу, чтобы она никогда не перекрывалась

        const offsetDist = (w.thickness / 2 + 0.28);

        const outX = (w.start.x + w.end.x) / 2 + nx * offsetDist;

        const outY = (w.start.y + w.end.y) / 2 + ny * offsetDist;

        const outScr = toScreen(outX, outY);

        drawDimensionBadge(ctx, `${wallLen.toFixed(2)} м`, outScr.x, outScr.y, isSelected, isHovered, badgeAngle);

      }

    });

  };



  const drawRoomPolygon = (

    ctx: CanvasRenderingContext2D,

    room: Room,

    toScreen: (x: number, y: number) => Point,

    isSel: boolean = false

  ) => {

    if (room.points.length < 3) return;

    ctx.save();

    ctx.beginPath();

    const p0 = toScreen(room.points[0].x, room.points[0].y);

    ctx.moveTo(p0.x, p0.y);

    for (let i = 1; i < room.points.length; i++) {

      const pi = toScreen(room.points[i].x, room.points[i].y);

      ctx.lineTo(pi.x, pi.y);

    }

    ctx.closePath();



    if (room.isShaft) {

      // Это ВЕНТКАНАЛ / ШАХТА / КОРОБ (по ГОСТ 21.501 перечеркивается крестом диагоналей X)

      ctx.fillStyle = isSel ? 'rgba(203, 213, 225, 0.75)' : 'rgba(241, 245, 249, 0.85)';

      ctx.fill();

      ctx.strokeStyle = isSel ? '#2563eb' : '#64748b';

      ctx.lineWidth = isSel ? 2 : 1.2;

      ctx.stroke();



      // Рисуем диагональный крест X

      if (room.points.length >= 4) {

        const p1 = toScreen(room.points[1].x, room.points[1].y);

        const p2 = toScreen(room.points[2].x, room.points[2].y);

        const p3 = toScreen(room.points[3].x, room.points[3].y);

        ctx.beginPath();

        ctx.moveTo(p0.x, p0.y);

        ctx.lineTo(p2.x, p2.y);

        ctx.moveTo(p1.x, p1.y);

        ctx.lineTo(p3.x, p3.y);

        ctx.stroke();

      }

      ctx.restore();

      return;

    }



    ctx.fillStyle = isSel ? 'rgba(191, 219, 254, 0.65)' : 'rgba(219, 234, 254, 0.45)';

    ctx.fill();

    ctx.strokeStyle = isSel ? '#2563eb' : '#60a5fa';

    ctx.lineWidth = isSel ? 2.5 : 1.5;

    ctx.stroke();



    if (isSel) {

      room.points.forEach(pt => {

        const p = toScreen(pt.x, pt.y);

        ctx.fillStyle = '#2563eb';

        ctx.strokeStyle = '#ffffff';

        ctx.lineWidth = 2;

        ctx.beginPath();

        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);

        ctx.fill();

        ctx.stroke();

      });

    }



    ctx.restore();

  };



  // Координаты бейджей

  const currentWallLength = currentWallStart ? distance(currentWallStart, snappedCursor) : 0;

  const currentWallMidpoint = currentWallStart

    ? worldToScreen(

        (currentWallStart.x + snappedCursor.x) / 2,

        (currentWallStart.y + snappedCursor.y) / 2

      )

    : { x: 0, y: 0 };



  const selectedWall = allWalls.find(w => w.id === selectedWallId);

  const selectedWallMidpoint = selectedWall

    ? worldToScreen(

        (selectedWall.start.x + selectedWall.end.x) / 2,

        (selectedWall.start.y + selectedWall.end.y) / 2

      )

    : null;





  // Активные комнаты строго привязаны к наличию замкнутых стен (если стен нет или < 3 — комнат нет)

  const activeRooms = allWalls.length >= 3 ? rooms : [];



  // Динамический курсор для холста

  const selectedFixture = fixtures.find(f => f.id === selectedFixtureId) || null;



  const getCursorClass = () => {

    if (toolMode === 'move_all' || isDraggingAllApartment) return 'cursor-move';

    if (draggingDimKey || hoveredDimKey) return 'cursor-move';

    if (isPanning || panDragRef.current?.isDragging) return 'cursor-grabbing';

    if (isSpacePressed || toolMode === 'pan') return 'cursor-grab';

    if (draggingVertex) return 'cursor-move';

    if (isDraggingOpening) return 'cursor-ew-resize';

    if (toolMode === 'draw' || toolMode === 'room_rect') return 'cursor-crosshair';

    if (hoveredVertex) return 'cursor-move';

    if (hoveredOpeningId) return 'cursor-ew-resize';

    if (hoveredWallId) return 'cursor-pointer';

    return 'cursor-default';

  };



  return (

    <div

      ref={containerRef}

      onContextMenu={(e) => {

        e.preventDefault();

        e.stopPropagation();

      }}

      className="relative w-full h-full flex flex-col bg-slate-100 select-none overflow-hidden"

    >

      {/* Скрытый input для выбора файла с ПК (SVG / PNG / JPG) */}

      <input

        type="file"

        ref={fileInputRef}

        onChange={handleCustomFileUpload}

        accept="image/png,image/jpeg,image/svg+xml,.svg,.png,.jpg,.jpeg"

        className="hidden"

        style={{ display: 'none' }}

      />

      {/* 1. ВЕРХНИЙ СВЕТЛЫЙ ЗАГОЛОВОК ОКНА CAD */}

      <div className="h-10 bg-white border-b border-slate-200 px-4 flex items-center justify-between z-20 shrink-0">

        <div className="flex items-center gap-3">

          <div className="flex items-center gap-2">

            <span className="px-2.5 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 font-extrabold text-xs tracking-wide flex items-center gap-1.5 shadow-2xs">

              <Pencil className="w-3.5 h-3.5 text-blue-600" />

              ESTIMATE CAD 2.0

            </span>

            <span className="text-slate-300 font-light">|</span>

            <span className="text-xs font-semibold text-slate-700">

              Обмерный план

            </span>

            <span className="text-[11px] text-slate-400 font-mono">

              (стен: {allWalls.length}, комнат: {rooms.length})

            </span>

            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2 py-0.5 rounded-full font-bold">

              ✓ Сохранено

            </span>

          </div>

        </div>



        {/* Быстрые действия в шапке */}

        <div className="flex items-center gap-2">

          {/* Селектор глобального размера шрифта */}

          <div className="flex items-center bg-slate-100/90 rounded-lg p-0.5 border border-slate-200 text-xs shadow-2xs mr-1">

            <span className="text-[10px] text-slate-500 font-bold px-1.5 select-none" title="Глобальный размер шрифта в UI и на чертеже (Ctrl+ / Ctrl-)">

              Шрифт:

            </span>

            <button
              type="button"
              onClick={() => {
                setFontScale('sm');
                showToast('🔤 Мелкий шрифт (100%)');
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                fontScale === 'sm' ? 'bg-white text-blue-700 shadow-xs border border-blue-400 ring-1 ring-blue-300' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
              title="Мелкий шрифт (100%) — компактный"
            >
              🔤 Мелкий
            </button>
            <button
              type="button"
              onClick={() => {
                setFontScale('md');
                showToast('🔠 Средний шрифт (130%)');
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                fontScale === 'md' ? 'bg-white text-blue-700 shadow-xs border border-blue-400 ring-1 ring-blue-300' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
              title="Средний шрифт (130%) — стандартный"
            >
              🔠 Средний
            </button>
            <button
              type="button"
              onClick={() => {
                setFontScale('lg');
                showToast('🅰️ Крупный шрифт (165%)');
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                fontScale === 'lg' ? 'bg-white text-blue-700 shadow-xs border border-blue-400 ring-1 ring-blue-300' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
              title="Крупный шрифт (165%) — крупный для чертежей"
            >
              🅰️ Крупный
            </button>

          </div>



          <div className="h-4 w-px bg-slate-200 mx-0.5" />



          {/* Undo */}

          <button

            onClick={handleUndo}

            disabled={history.length === 0}

            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors ${

              history.length > 0 

                ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 cursor-pointer shadow-2xs' 

                : 'text-slate-300 border-slate-200 cursor-not-allowed bg-slate-50'

            }`}

            title="Отменить действие [Ctrl+Z]"

          >

            <Undo2 className="w-3.5 h-3.5" />

            <span>Назад</span>

          </button>



          {/* Шпаргалка */}

          <button

            onClick={() => setShowHelpModal(true)}

            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"

            title="Шпаргалка по клавишам [?]"

          >

            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />

            <span>Подсказки [?]</span>

          </button>



          <div className="h-4 w-px bg-slate-200 mx-1" />



          {/* Очистить всё */}

          <button

            onClick={() => setShowClearConfirm(true)}

            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-red-600 bg-red-50/80 border border-red-200 hover:bg-red-100 transition-colors shadow-2xs cursor-pointer"

            title="Очистить всё поле чертежа"

          >

            <Trash2 className="w-3.5 h-3.5 text-red-500" />

            <span>Очистить всё</span>

          </button>

        </div>

      </div>



      {/* 2. ПОЛОСА ВКЛАДОК ЛЕНТЫ (RIBBON TABS - СВЕТЛАЯ) */}

      <div className="h-9 bg-slate-100 border-b border-slate-200 px-4 flex items-end justify-between z-10 shrink-0">

        <div className="flex gap-1">

          <button

            type="button"

            onClick={() => setActiveRibbonTab('drawing')}

            className={`px-4 py-1.5 rounded-t-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${

              activeRibbonTab === 'drawing'

                ? 'bg-white text-blue-700 border-t-2 border-t-blue-600 border-x border-slate-200 shadow-2xs'

                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'

            }`}

          >

            <Pencil className="w-3.5 h-3.5 text-blue-600" />

            <span>Черчение и Стены</span>

          </button>



          <button

            type="button"

            onClick={() => setActiveRibbonTab('gost')}

            className={`px-4 py-1.5 rounded-t-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${

              activeRibbonTab === 'gost'

                ? 'bg-white text-blue-700 border-t-2 border-t-blue-600 border-x border-slate-200 shadow-2xs'

                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'

            }`}

          >

            <Ruler className="w-3.5 h-3.5 text-indigo-600" />

            <span>Оформление & ГОСТ</span>

          </button>



          <button

            type="button"

            onClick={() => setActiveRibbonTab('estimate')}

            className={`px-4 py-1.5 rounded-t-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${

              activeRibbonTab === 'estimate'

                ? 'bg-white text-blue-700 border-t-2 border-t-blue-600 border-x border-slate-200 shadow-2xs'

                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'

            }`}

          >

            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />

            <span>Смета и Бутерброды</span>

          </button>



          <button

            type="button"

            onClick={() => setActiveRibbonTab('backdrop')}

            className={`px-4 py-1.5 rounded-t-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${

              activeRibbonTab === 'backdrop'

                ? 'bg-white text-blue-700 border-t-2 border-t-blue-600 border-x border-slate-200 shadow-2xs'

                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'

            }`}

          >

            <Layers className="w-3.5 h-3.5 text-indigo-600" />

            <span>Подложка плана</span>

            {backdrop && (

              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" title="Подложка активна" />

            )}

          </button>

        </div>



        {/* Быстрые глобальные кнопки сметы справа */}

        <div className="flex items-center gap-2 pb-1">

          <button

            type="button"

            onClick={() => setShowEstimateWindow(prev => !prev)}

            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs ${

              showEstimateWindow

                ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'

                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300'

            }`}

            title="Открыть смету по комнатам"

          >

            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />

            <span>Смета</span>

            {rooms.length > 0 && (

              <span className="bg-emerald-700 text-white font-mono px-1.5 py-0.2 rounded-full text-[10px]">

                {rooms.length}

              </span>

            )}

          </button>



          <button

            type="button"

            onClick={() => setShowConstructorModal(true)}

            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 transition-all cursor-pointer shadow-2xs"

            title="Открыть конструктор бутербродов отделки"

          >

            <Layers className="w-3.5 h-3.5 text-indigo-600" />

            <span>Бутерброды</span>

            <span className="bg-indigo-700 text-white font-mono px-1.5 py-0.2 rounded-full text-[10px]">

              {customPirogs.length}

            </span>

          </button>



          <input

            type="file"

            ref={backdropFileInputRef}

            onChange={handleBackdropUpload}

            accept="image/*,application/pdf,.pdf"

            className="hidden"

          />

          <button

            type="button"

            onClick={() => backdropFileInputRef.current?.click()}

            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-300 transition-all cursor-pointer shadow-2xs"

            title="Загрузить чертеж: автоматическая оцифровка в нативные стены CAD через OCR"

          >

            <Wand2 className={`w-3.5 h-3.5 text-blue-600 ${isVectorizing ? 'animate-spin' : ''}`} />

            <span>{isVectorizing ? 'Оцифровка...' : '📐 Загрузить план'}</span>

          </button>

        </div>

      </div>



      {/* 3. КОНТЕЙНЕР ИНСТРУМЕНТОВ ЛЕНТЫ (RIBBON BAR - СВЕТЛЫЙ) */}

      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-4 text-xs overflow-x-auto z-10 shrink-0 min-h-[58px]">

        {activeRibbonTab === 'drawing' && (

          <>

            {/* Группа 1: Режимы работы курсора */}

            <div className="flex items-center gap-1 pr-3 border-r border-slate-200">

              <button

                type="button"

                onClick={() => {

                  setToolMode('draw');

                  setSelectedWallId(null);

                  setSelectedOpening(null);

                  setSelectedVertex(null);

                }}

                className={`flex flex-col items-center justify-center p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer min-w-[56px] ${

                  toolMode === 'draw'

                    ? 'bg-blue-50 text-blue-700 border border-blue-300 font-bold shadow-2xs'

                    : 'text-slate-700 hover:bg-slate-100 border border-transparent'

                }`}

                title="Режим черчения стен [W]"

              >

                <Pencil className="w-4 h-4 text-blue-600 mb-0.5" />

                <span className="text-[10px]">Чертить [W]</span>

              </button>



              <button

                type="button"

                onClick={() => {

                  setToolMode('select');

                  setCurrentWallStart(null);

                  setChainPoints([]);

                }}

                className={`flex flex-col items-center justify-center p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer min-w-[56px] ${

                  toolMode === 'select'

                    ? 'bg-blue-50 text-blue-700 border border-blue-300 font-bold shadow-2xs'

                    : 'text-slate-700 hover:bg-slate-100 border border-transparent'

                }`}

                title="Режим выбора и перемещения [V]"

              >

                <MousePointer className="w-4 h-4 text-slate-700 mb-0.5" />

                <span className="text-[10px]">Выбор [V]</span>

              </button>



              <button

                type="button"

                onClick={() => {

                  setToolMode('pan');

                  setCurrentWallStart(null);

                  setChainPoints([]);

                }}

                className={`flex flex-col items-center justify-center p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer min-w-[56px] ${

                  toolMode === 'pan'

                    ? 'bg-blue-50 text-blue-700 border border-blue-300 font-bold shadow-2xs'

                    : 'text-slate-700 hover:bg-slate-100 border border-transparent'

                }`}

                title="Панорама поля [H] или зажмите Пробел / СКМ"

              >

                <Hand className="w-4 h-4 text-slate-700 mb-0.5" />

                <span className="text-[10px]">Рука [H]</span>

              </button>



              <button

                type="button"

                onClick={() => {

                  setToolMode('room_rect');

                  setCurrentWallStart(null);

                  setChainPoints([]);

                  setSelectedWallId(null);

                  setSelectedOpening(null);

                  setSelectedRoomId(null);

                  setSelectedVertex(null);

                  showToast('🏠 Режим «Быстрая комната [R]»: растяните прямоугольник по комнате на подложке');

                }}

                className={`flex flex-col items-center justify-center p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer min-w-[62px] ${

                  toolMode === 'room_rect'

                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-400 font-bold shadow-2xs'

                    : 'text-slate-700 hover:bg-slate-100 border border-transparent'

                }`}

                title="Быстрая комната [R]: растяните прямоугольник поверх комнаты — создадутся 4 стены с расчётом площади и периметра"

              >

                <Square className="w-4 h-4 text-emerald-600 mb-0.5" />

                <span className="text-[10px]">Комната [R]</span>

              </button>



              <button

                type="button"

                onClick={() => {

                  setToolMode(prev => prev === 'move_all' ? 'draw' : 'move_all');

                  setCurrentWallStart(null);

                  setChainPoints([]);

                  showToast(toolMode === 'move_all' ? 'Инструмент «Стена» включен' : '↔️ Режим сдвига всей квартиры: зажмите ЛКМ и перетащите чертеж');

                }}

                className={`flex flex-col items-center justify-center p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer min-w-[66px] ${

                  toolMode === 'move_all'

                    ? 'bg-amber-100 text-amber-900 border border-amber-400 font-bold shadow-2xs ring-1 ring-amber-300'

                    : 'text-slate-700 hover:bg-slate-100 border border-transparent'

                }`}

                title="Сдвиг всей квартиры [M] / [Ctrl+A]: зажмите ЛКМ в любой точке холста и переместите все стены и комнаты целиком"

              >

                <Move className="w-4 h-4 text-amber-600 mb-0.5" />

                <span className="text-[10px]">Сдвиг [M]</span>

              </button>

            </div>



            {/* Группа 2: Стены и перегородки (единая толщина 100 мм) */}

            <div className="flex items-center gap-1.5 pr-3 border-r border-slate-200">

              <button

                type="button"

                onClick={() => {

                  setWallThickness(0.10);

                  setToolMode('draw');

                  showToast('🧱 Выбрана стена 100 мм (единая толщина)');

                }}

                className={`flex flex-col items-center justify-center p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer min-w-[70px] ${

                  toolMode === 'draw' && wallThickness === 0.10

                    ? 'bg-blue-50 text-blue-700 border border-blue-300 font-bold shadow-2xs'

                    : 'text-slate-700 hover:bg-slate-100 border border-transparent'

                }`}

                title="Стена 100 мм (единая стандартная толщина для всех стен и перегородок)"

              >

                <span className="text-sm">🧱</span>

                <span className="text-[10px]">Стена 100</span>

              </button>



              <button

                type="button"

                onClick={() => {

                  setWallThickness(0.10);

                  setAllWalls(prev => prev.map(w => ({ ...w, thickness: 0.10 })));

                  showToast('📐 Все стены на плане выровнены до единой толщины 100 мм');

                }}

                className="flex flex-col items-center justify-center p-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-transparent transition-all cursor-pointer min-w-[76px]"

                title="Принудительно сделать все стены и перегородки чертежа одинаковой толщины (100 мм)"

              >

                <span className="text-sm">📏</span>

                <span className="text-[10px]">Выровнять 100</span>

              </button>



              <div className="flex flex-col gap-0.5 ml-1">

                <span className="text-[9px] uppercase font-bold text-slate-400">Толщина:</span>

                <select

                  value={wallThickness}

                  onChange={(e) => {

                    const newT = parseFloat(e.target.value);

                    setWallThickness(newT);

                    setAllWalls(prev => prev.map(w => ({ ...w, thickness: newT })));

                  }}

                  className="bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"

                  title="Выбор единой толщины для стен чертежа"

                >

                  <option value={0.10}>100 мм (единая)</option>

                  <option value={0.15}>150 мм</option>

                  <option value={0.20}>200 мм</option>

                  <option value={0.25}>250 мм</option>

                </select>

              </div>

            </div>



            {/* Группа 3: Инженерия и проемы */}

            <div className="flex items-center gap-1.5 pr-3 border-r border-slate-200">

              <button

                type="button"

                onClick={() => {

                  setShowFixturePalette(prev => !prev);

                }}

                className={`flex flex-col items-center justify-center p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer min-w-[64px] ${

                  showFixturePalette || activeFixtureType

                    ? 'bg-amber-50 text-amber-900 border border-amber-300 font-bold shadow-2xs'

                    : 'text-slate-700 hover:bg-slate-100 border border-transparent'

                }`}

                title="Палитра обозначений: розетки, выключатели, свет, сантехника"

              >

                <Zap className="w-4 h-4 text-amber-500 fill-amber-400 mb-0.5" />

                <span className="text-[10px]">⚡ Обозначения</span>

              </button>

            </div>



            {/* Контекстные кнопки при черчении */}

            {currentWallStart && (

              <div className="flex items-center gap-1.5 pl-1 animate-in fade-in">

                <button

                  type="button"

                  onClick={handleRemoveLastPoint}

                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer shadow-2xs"

                  title="Удалить последнюю поставленную точку [Backspace / Ctrl+Z]"

                >

                  <Undo2 className="w-3.5 h-3.5 text-amber-600" />

                  <span>Удалить точку [Backspace]</span>

                </button>

                <button

                  type="button"

                  onClick={() => {

                    setCurrentWallStart(null);

                    setChainPoints([]);

                    setIsSnapToClose(false);

                  }}

                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"

                  title="Отменить черчение [Esc / ПКМ]"

                >

                  <X className="w-4 h-4" />

                </button>

              </div>

            )}



            {/* Выход из режима обозначений */}

            {activeFixtureType && (

              <button

                type="button"

                onClick={() => {

                  setActiveFixtureType(null);

                  showToast('Выход из режима обозначений');

                }}

                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-all cursor-pointer shadow-2xs ml-1"

                title="Завершить добавление обозначений [ПКМ / Esc]"

              >

                <X className="w-3.5 h-3.5 text-red-600" />

                <span>Выйти из обозначений [Esc]</span>

              </button>

            )}

          </>

        )}



        {activeRibbonTab === 'gost' && (

          <>

            {/* Группа 1: Размеры по ГОСТ */}

            <div className="flex items-center gap-2 pr-3 border-r border-slate-200">

              <div className="flex flex-col gap-0.5">

                <span className="text-[9px] uppercase font-bold text-slate-400">Стиль размеров:</span>

                <button

                  type="button"

                  onClick={() => {

                    const next = dimensionStyle === 'architectural' ? 'badges' : 'architectural';

                    setDimensionStyle(next);

                    showToast(next === 'architectural' ? '📐 Стиль: Архитектурный чертеж ГОСТ (цепочки с засечками 45°)' : '🏷️ Стиль: Крупные бейджи');

                  }}

                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${

                    dimensionStyle === 'architectural'

                      ? 'bg-indigo-50 text-indigo-700 border-indigo-300 shadow-2xs'

                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'

                  }`}

                >

                  <Ruler className="w-3.5 h-3.5 text-indigo-600" />

                  <span>{dimensionStyle === 'architectural' ? '📐 Цепочки ГОСТ 45°' : '🏷️ Бейджи'}</span>

                </button>

              </div>



              <div className="flex flex-col gap-0.5">

                <span className="text-[9px] uppercase font-bold text-slate-400">Габариты комнат:</span>

                <button

                  type="button"

                  onClick={() => {

                    setShowRoomSpans(prev => !prev);

                    showToast(!showRoomSpans ? 'Габаритные линии комнат ВКЛ' : 'Габаритные линии комнат ВЫКЛ');

                  }}

                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${

                    showRoomSpans

                      ? 'bg-slate-800 text-white border-slate-800 shadow-2xs'

                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'

                  }`}

                >

                  <span>{showRoomSpans ? '📏 Габариты: ВКЛ' : '📏 Габариты: ВЫКЛ'}</span>

                </button>

              </div>



              <div className="flex flex-col gap-0.5">

                <span className="text-[9px] uppercase font-bold text-slate-400">Выноски:</span>

                <button

                  type="button"

                  onClick={() => {

                    setManualDimOffsets({});

                    showToast('↩ Положение всех цифр размеров сброшено в авто-режим');

                  }}

                  disabled={Object.keys(manualDimOffsets).length === 0}

                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${

                    Object.keys(manualDimOffsets).length > 0

                      ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 cursor-pointer shadow-2xs'

                      : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'

                  }`}

                  title="Сбросить все смещенные вручную цифры размеров"

                >

                  <RotateCcw className="w-3.5 h-3.5 text-amber-600" />

                  <span>Сброс выносок {Object.keys(manualDimOffsets).length > 0 ? `(${Object.keys(manualDimOffsets).length})` : ''}</span>

                </button>

              </div>



              <div className="flex flex-col gap-0.5">

                <span className="text-[9px] uppercase font-bold text-slate-400">Единицы:</span>

                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">

                  <button

                    type="button"

                    onClick={() => setDimensionUnit('mm')}

                    className={`px-2 py-0.5 rounded text-xs font-bold ${

                      dimensionUnit === 'mm' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'

                    }`}

                  >

                    мм

                  </button>

                  <button

                    type="button"

                    onClick={() => setDimensionUnit('cm')}

                    className={`px-2 py-0.5 rounded text-xs font-bold ${

                      dimensionUnit === 'cm' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'

                    }`}

                  >

                    см

                  </button>

                  <button

                    type="button"

                    onClick={() => setDimensionUnit('m')}

                    className={`px-2 py-0.5 rounded text-xs font-bold ${

                      dimensionUnit === 'm' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'

                    }`}

                  >

                    м

                  </button>

                </div>

              </div>

            </div>



            {/* Группа 2: Текст и экспликация */}

            <div className="flex items-center gap-2 pr-3 border-r border-slate-200">

              <button

                type="button"

                onClick={() => setShowDetectedTextModal(prev => !prev)}

                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs ${

                  showDetectedTextModal 

                    ? 'bg-teal-600 text-white shadow-teal-600/30' 

                    : 'text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-300'

                }`}

                title="Открыть блокнот заметок замерщика и экспликации рядом с чертежом"

              >

                <FileText className="w-3.5 h-3.5" />

                <span>📝 Заметки замерщика</span>

                {detectedTextNotes.length > 0 && (

                  <span className={`font-mono px-1.5 py-0.2 rounded-full text-[10px] ${

                    showDetectedTextModal ? 'bg-teal-800 text-white' : 'bg-teal-700 text-white'

                  }`}>

                    {detectedTextNotes.length}

                  </span>

                )}

              </button>

            </div>

          </>

        )}



            {/* Группа 7: Управление подложкой (чертеж на фоне) */}

            {backdrop && (

              <div className="flex items-center gap-2 px-3 py-1 bg-amber-50/80 border border-amber-200 rounded-xl">

                <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">

                  <span>📐 Фон:</span>

                </span>



                {/* Прозрачность */}

                <div className="flex items-center gap-1" title="Прозрачность подложки">

                  <input

                    type="range"

                    min="0.05"

                    max="1.0"

                    step="0.05"

                    value={backdrop.opacity}

                    onChange={e => {

                      const val = parseFloat(e.target.value);

                      setBackdrop(prev => prev ? { ...prev, opacity: val } : null);

                    }}

                    className="w-16 accent-amber-600 cursor-pointer h-1.5"

                  />

                  <span className="font-mono text-amber-900 text-[11px] font-bold w-6">

                    {Math.round(backdrop.opacity * 100)}%

                  </span>

                </div>



                {/* Калибровка */}

                <button

                  type="button"

                  onClick={() => {

                    setCalibration({ active: true, step: 'pick_p1', p1World: null, p2World: null });

                    showToast('📏 Кликните Точку 1 на чертеже');

                  }}

                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white text-indigo-700 border border-indigo-300 hover:bg-indigo-50 font-bold text-[11px] cursor-pointer transition-colors shadow-2xs"

                  title="Калибровать масштаб 1:1 по 2 точкам"

                >

                  <Ruler className="w-3.5 h-3.5" />

                  <span>Калибровать 1:1</span>

                </button>



                {/* Поворот 90° */}

                <button

                  type="button"

                  onClick={() => {

                    setBackdrop(prev => {

                      if (!prev) return null;

                      const nextRot = (prev.rotationDeg + 90) % 360;

                      return { ...prev, rotationDeg: nextRot };

                    });

                  }}

                  className="p-1 hover:bg-amber-100 text-amber-800 rounded-lg cursor-pointer transition-colors border border-amber-200"

                  title="Повернуть чертеж на 90°"

                >

                  <RotateCw className="w-3.5 h-3.5" />

                </button>



                {/* Зафиксировать / Сдвинуть */}

                <button

                  type="button"

                  onClick={() => {

                    setBackdrop(prev => {

                      if (!prev) return null;

                      const nextLocked = !prev.locked;

                      showToast(nextLocked ? '🔒 Фон зафиксирован' : '🔓 Фон разблокирован для перемещения');

                      return { ...prev, locked: nextLocked };

                    });

                  }}

                  className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${

                    backdrop.locked

                      ? 'bg-amber-100 text-amber-900 border border-amber-300'

                      : 'bg-emerald-100 text-emerald-900 border border-emerald-300'

                  }`}

                  title={backdrop.locked ? 'Фон зафиксирован (нажмите для разблокировки)' : 'Фон разблокирован (нажмите для фиксации)'}

                >

                  {backdrop.locked ? <Lock className="w-3 h-3 text-amber-700" /> : <Unlock className="w-3 h-3 text-emerald-700" />}

                  <span>{backdrop.locked ? 'Зафиксирован' : 'Сдвинуть'}</span>

                </button>



                {/* Видимость */}

                <button

                  type="button"

                  onClick={() => {

                    setBackdrop(prev => prev ? { ...prev, visible: !prev.visible } : null);

                  }}

                  className="p-1 hover:bg-amber-100 text-amber-800 rounded-lg cursor-pointer transition-colors border border-amber-200"

                  title={backdrop.visible ? 'Скрыть подложку' : 'Показать подложку'}

                >

                  {backdrop.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}

                </button>



                {/* Удалить подложку */}

                <button

                  type="button"

                  onClick={() => {

                    if (window.confirm('Удалить подложку с холста?')) {

                      handleRemoveBackdrop();

                    }

                  }}

                  className="p-1 hover:bg-red-100 text-red-600 rounded-lg cursor-pointer transition-colors"

                  title="Удалить подложку с чертежа"

                >

                  <Trash2 className="w-3.5 h-3.5" />

                </button>

              </div>

            )}

                {activeRibbonTab === 'estimate' && (

          <>

            {/* Группа 1: Модули сметы */}

            <div className="flex items-center gap-2 pr-3 border-r border-slate-200">

              <button

                type="button"

                onClick={() => setShowEstimateWindow(true)}

                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-all cursor-pointer shadow-2xs"

              >

                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />

                <span>📋 Покомнатная смета отделки</span>

                <span className="bg-emerald-700 text-white font-mono px-1.5 py-0.2 rounded-full text-[10px]">

                  {rooms.length} комн.

                </span>

              </button>



              <button

                type="button"

                onClick={() => setShowConstructorModal(true)}

                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 transition-all cursor-pointer shadow-2xs"

              >

                <Layers className="w-4 h-4 text-indigo-600" />

                <span>🥪 Конструктор бутербродов (база КРД 2026)</span>

                <span className="bg-indigo-700 text-white font-mono px-1.5 py-0.2 rounded-full text-[10px]">

                  {customPirogs.length}

                </span>

              </button>

            </div>

          </>

        )}



        {activeRibbonTab === 'backdrop' && (

          <>

            {/* Группа 1: Загрузка подложки */}

            <div className="flex items-center gap-2 pr-3 border-r border-slate-200">

              <button

                type="button"

                onClick={() => backdropFileInputRef.current?.click()}

                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-300 transition-all cursor-pointer shadow-2xs"

              >

                <Wand2 className={`w-3.5 h-3.5 text-blue-600 ${isVectorizing ? 'animate-spin' : ''}`} />

                <span>📐 Оцифровать чертеж (AI OCR)</span>

              </button>



              <button

                type="button"

                onClick={() => fileInputRef.current?.click()}

                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-all cursor-pointer shadow-2xs"

              >

                <Layers className="w-3.5 h-3.5 text-slate-600" />

                <span>Загрузить фон вручную</span>

              </button>



              {/* Настройка ключа Gemini API для рукописных планов */}

              <button

                type="button"

                onClick={() => {

                  const currentKey = localStorage.getItem('estimate_cad_gemini_key') || '';

                  const newKey = window.prompt('🔑 Введите ключ Gemini API для оцифровки любых нестандартных рукописных чертежей и заметок:\n(Оставьте пустым для использования встроенного OCR RapidOCR + OpenCV)', currentKey);

                  if (newKey !== null) {

                    localStorage.setItem('estimate_cad_gemini_key', newKey.trim());

                    showToast(newKey.trim() ? '✅ Ключ Gemini API успешно сохранён!' : 'ℹ️ Используется локальный OCR');

                  }

                }}

                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-all cursor-pointer shadow-2xs"

                title="Настроить ключ Gemini API для распознавания рукописного текста"

              >

                <Sparkles className="w-3.5 h-3.5 text-amber-500" />

                <span>🔑 Gemini Vision API</span>

              </button>

            </div>



            {/* Группа 2: Управление загруженной подложкой */}

            {backdrop && (

              <div className="flex items-center gap-3 pr-3 border-r border-slate-200">

                <div className="flex items-center gap-1.5">

                  <span className="text-slate-500 text-[11px] font-medium">Прозрачность:</span>

                  <input

                    type="range"

                    min="0.05"

                    max="1.0"

                    step="0.05"

                    value={backdrop.opacity}

                    onChange={e => {

                      const val = parseFloat(e.target.value);

                      setBackdrop(prev => prev ? { ...prev, opacity: val } : null);

                    }}

                    className="w-16 accent-indigo-600 cursor-pointer"

                  />

                  <span className="font-mono text-slate-800 text-[11px] font-bold">{Math.round(backdrop.opacity * 100)}%</span>

                </div>



                <button

                  type="button"

                  onClick={() => {

                    setCalibration({ active: true, step: 'pick_p1', p1World: null, p2World: null });

                    showToast('📏 Кликните первую точку известного отрезка на плане');

                  }}

                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 font-bold cursor-pointer transition-colors shadow-2xs"

                >

                  <Ruler className="w-3.5 h-3.5" />

                  <span>Калибровать 1:1</span>

                </button>



                <button

                  type="button"

                  onClick={() => {

                    setBackdrop(null);

                    showToast('🗑 Фоновая подложка удалена');

                  }}

                  className="p-1 rounded text-red-600 hover:bg-red-50 border border-red-200 cursor-pointer"

                  title="Удалить подложку плана"

                >

                  <Trash2 className="w-3.5 h-3.5" />

                </button>

              </div>

            )}

          </>

        )}

      </div>



      {/* Интерактивная строка подсказок по текущему режиму (светлая) */}

      <div className="bg-slate-100/90 text-slate-700 px-4 py-1.5 flex items-center justify-between text-xs border-b border-slate-200 shadow-2xs z-10">

        <div className="flex items-center gap-2 truncate">

          <span className="flex h-2 w-2 relative shrink-0">

            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>

            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>

          </span>

          <span className="font-bold text-amber-700 shrink-0">

            {toolMode === 'move_all' ? (

              '↔️ Сдвиг квартиры:'

            ) : toolMode === 'draw' ? (

              currentWallStart ? '✏️ Идёт черчение стены:' : '✏️ Режим черчения:'

            ) : toolMode === 'pan' ? (

              '✋ Режим панорамы:'

            ) : (

              '↖️ Режим выбора:'

            )}

          </span>

          <span className="text-slate-600 truncate">

            {currentWallStart ? (

              'Кликните следующую точку или замкните в зелёную точку для создания комнаты. [Backspace] — удалить точку, [Esc] или ПКМ — отмена.'

            ) : selectedWallId ? (

              'Выделена стена. Нажмите [Delete] для удаления стены или введите точную длину в окне.'

            ) : selectedVertex ? (

              'Выделена точка угла. Нажмите [Delete] для удаления угла или тяните мышкой для растягивания стен.'

            ) : selectedOpening ? (

              'Выделен проём. Тяните его мышкой вдоль стены или нажмите [Delete].'

            ) : selectedRoomId ? (

              'Открыто окно комнаты. Нажмите [✕ Закрыть] в правом верхнем углу окна или [Esc] для закрытия.'

            ) : toolMode === 'move_all' ? (

              'Зажмите ЛКМ в любой точке холста и перетащите всю нарисованную геометрию квартиры. [Esc] — завершить.'

            ) : toolMode === 'draw' ? (

              'Кликните в любое место для старта стены. Клик по готовой стене выделит её.'

            ) : toolMode === 'pan' ? (

              'Зажмите ЛКМ и двигайте чертёж. Нажмите [V] или Esc для возврата в выбор.'

            ) : (

              'Кликните по любой стене или углу, чтобы редактировать или удалить [Del]. Пробел + мышь — двигать поле.'

            )}

          </span>

        </div>



        <div className="flex items-center gap-3 shrink-0 pl-2">

          <button

            onClick={() => setShowHelpModal(true)}

            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold text-xs cursor-pointer hover:underline"

          >

            <HelpCircle className="w-3.5 h-3.5" />

            <span>Шпаргалка [?]</span>

          </button>

        </div>

      </div>



      {/* ПЛАВАЮЩЕЕ РАБОЧЕЕ ОКНО СМЕТЫ ПО КОМНАТАМ (СЛЕВА) */}

      {showEstimateWindow && (

        <div className="absolute top-14 left-4 z-40 bg-white/95 backdrop-blur-md border border-slate-300 rounded-2xl shadow-2xl w-[460px] max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-3">

          <EstimateRoomsPanel

            rooms={rooms}

            electricCountsByRoom={electricCountsByRoom}

            plumbingCountsByRoom={plumbingCountsByRoom}

            onClose={() => setShowEstimateWindow(false)}

            pirogs={customPirogs}

            onOpenConstructor={() => setShowConstructorModal(true)}

          />

        </div>

      )}



      {/* ПЛАВАЮЩАЯ ПАЛИТРА ОБОЗНАЧЕНИЙ (ЭЛЕКТРИКА, САНТЕХНИКА, КУХНЯ, ВАННАЯ, СТОЯКИ АР) */}

      {showFixturePalette && (

        <div className="absolute top-14 right-4 z-40 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-2xl w-96 overflow-hidden animate-in fade-in slide-in-from-top-3">

          {/* Шапка палитры */}

          <div className="px-4 py-2.5 bg-slate-100 text-slate-800 border-b border-slate-200 flex items-center justify-between">

            <div className="flex items-center gap-2">

              <Zap className="w-4 h-4 text-amber-500 fill-amber-400" />

              <span className="font-bold text-xs uppercase tracking-wider text-slate-800">Обозначения по ГОСТ (CAD)</span>

            </div>

            <div className="flex items-center gap-1.5">

              <button

                type="button"

                onClick={() => {

                  setGalleryCategoryFilter(fixtureCategoryTab);

                  setShowSymbolGalleryModal(true);

                }}

                className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-md text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer border border-amber-300"

                title="Открыть большой графический каталог всех символов ГОСТ"

              >

                <Palette className="w-3 h-3 text-amber-600" />

                <span>Галерея ГОСТ</span>

              </button>

              <button

                type="button"

                onClick={handleStartAddFixtureDef}

                className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"

                title="Добавить своё обозначение (символ, текст, высоту)"

              >

                <Plus className="w-3 h-3" />

                <span>Добавить</span>

              </button>

              <button

                onClick={() => setShowFixturePalette(false)}

                className="p-1 hover:bg-slate-200 rounded-md text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"

                title="Закрыть палитру [Esc]"

              >

                <X className="w-3.5 h-3.5" />

              </button>

            </div>

          </div>



          {/* Вкладки: Электрика / Сантехника / Кухня / Ванная / Климат / Стояки АР */}

          <div className="flex border-b border-slate-200 bg-slate-50 text-[11px] font-bold overflow-x-auto scrollbar-none">

            <button

              onClick={() => setFixtureCategoryTab('electric')}

              className={`px-3 py-2 text-center whitespace-nowrap transition-colors flex items-center justify-center gap-1 cursor-pointer ${

                fixtureCategoryTab === 'electric'

                  ? 'bg-white text-blue-700 border-b-2 border-blue-600 shadow-2xs'

                  : 'text-slate-500 hover:text-slate-800'

              }`}

            >

              <Zap className="w-3.5 h-3.5" />

              <span>Электрика</span>

            </button>

            <button

              onClick={() => setFixtureCategoryTab('plumbing')}

              className={`px-3 py-2 text-center whitespace-nowrap transition-colors flex items-center justify-center gap-1 cursor-pointer ${

                fixtureCategoryTab === 'plumbing'

                  ? 'bg-white text-teal-700 border-b-2 border-teal-600 shadow-2xs'

                  : 'text-slate-500 hover:text-slate-800'

              }`}

            >

              <Droplets className="w-3.5 h-3.5" />

              <span>Сантехника</span>

            </button>

            <button

              onClick={() => setFixtureCategoryTab('kitchen')}

              className={`px-3 py-2 text-center whitespace-nowrap transition-colors flex items-center justify-center gap-1 cursor-pointer ${

                fixtureCategoryTab === 'kitchen'

                  ? 'bg-white text-amber-700 border-b-2 border-amber-600 shadow-2xs'

                  : 'text-slate-500 hover:text-slate-800'

              }`}

            >

              <Utensils className="w-3.5 h-3.5" />

              <span>Кухня</span>

            </button>

            <button

              onClick={() => setFixtureCategoryTab('bathroom')}

              className={`px-3 py-2 text-center whitespace-nowrap transition-colors flex items-center justify-center gap-1 cursor-pointer ${

                fixtureCategoryTab === 'bathroom'

                  ? 'bg-white text-cyan-700 border-b-2 border-cyan-600 shadow-2xs'

                  : 'text-slate-500 hover:text-slate-800'

              }`}

            >

              <Bath className="w-3.5 h-3.5" />

              <span>Ванная</span>

            </button>

            <button

              onClick={() => setFixtureCategoryTab('climate')}

              className={`px-3 py-2 text-center whitespace-nowrap transition-colors flex items-center justify-center gap-1 cursor-pointer ${

                fixtureCategoryTab === 'climate'

                  ? 'bg-white text-sky-700 border-b-2 border-sky-600 shadow-2xs'

                  : 'text-slate-500 hover:text-slate-800'

              }`}

            >

              <span>❄️ Климат</span>

            </button>

            <button

              onClick={() => setFixtureCategoryTab('riser')}

              className={`px-3 py-2 text-center whitespace-nowrap transition-colors flex items-center justify-center gap-1 cursor-pointer ${

                fixtureCategoryTab === 'riser'

                  ? 'bg-white text-slate-900 border-b-2 border-slate-900 shadow-2xs'

                  : 'text-slate-500 hover:text-slate-800'

              }`}

            >

              <CircleDot className="w-3.5 h-3.5" />

              <span>Стояки АР</span>

            </button>

          </div>



          {/* Сетка элементов */}

          <div className="p-3 max-h-80 overflow-y-auto grid grid-cols-2 gap-2 text-xs">

            {fixtureCatalog.filter(f => f.category === fixtureCategoryTab).map(f => {

              const isActive = activeFixtureType === f.type;

              return (

                <div

                  key={f.type}

                  onClick={() => {

                    if (isActive) {

                      setActiveFixtureType(null);

                    } else {

                      setActiveFixtureType(f.type);

                      setToolMode('draw');

                      showToast(`Выбрано: ${f.name}. Кликните на чертеже для установки. [R] - повернуть.`);

                    }

                  }}

                  className={`group relative p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${

                    isActive

                      ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-400/50 shadow-sm'

                      : 'bg-white hover:bg-slate-50 border-slate-200'

                  }`}

                >

                  <div className="flex items-start justify-between gap-1.5 mb-1.5">

                    <div className="flex items-center gap-2 min-w-0">

                      <div className="w-7 h-7 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">

                        <SymbolThumbnail

                          svgType={f.baseGraphic || f.type}

                          customIconUrl={f.customIconUrl}

                          color={f.color}

                          size={22}

                        />

                      </div>

                      <div className="font-bold text-[11px] text-slate-800 leading-tight truncate">

                        {f.name}

                      </div>

                    </div>

                    <button

                      type="button"

                      onClick={(e) => {

                        e.stopPropagation();

                        setEditingFixtureDef({ ...f });

                        setIsAddingFixtureDef(false);

                      }}

                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md shrink-0 opacity-80 group-hover:opacity-100 transition-opacity cursor-pointer"

                      title="Редактировать обозначение (текст, символ, высоту)"

                    >

                      <Pencil className="w-3 h-3" />

                    </button>

                  </div>

                  <div className="space-y-0.5">

                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">

                      <span>{Math.round(f.width * 1000)}×{Math.round(f.height * 1000)}мм</span>

                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: f.color }} />

                    </div>

                    <div className="flex justify-between items-center text-[9.5px]">

                      <span className="text-blue-600 font-mono font-medium">

                        H={Math.round(f.defaultHeightFromFloor * 1000)} мм

                      </span>

                      <span className="font-mono text-slate-500 font-semibold bg-slate-100 px-1 rounded text-[9px]">

                        {f.shortLabel}

                      </span>

                    </div>

                  </div>

                </div>

              );

            })}

          </div>



          {/* Информационный футер */}

          <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-500 flex items-center justify-between">

            <span>Поворот: <b className="text-slate-700 font-mono">{fixtureRotation}°</b> ([R])</span>

            <button

              onClick={() => setFixtureRotation(prev => (prev + 90) % 360)}

              className="px-2 py-0.5 rounded bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold flex items-center gap-1 cursor-pointer"

            >

              <RotateCw className="w-3 h-3" />

              <span>+90°</span>

            </button>

          </div>

        </div>

      )}



      {/* МОДАЛЬНОЕ ОКНО СОЗДАНИЯ И РЕДАКТИРОВАНИЯ ОБОЗНАЧЕНИЙ (ГОСТ / ПОЛЬЗОВАТЕЛЬСКИЕ) */}

      {editingFixtureDef && (

        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">

          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95">

            <div className="p-4 bg-slate-100 text-slate-800 border-b border-slate-200 flex items-center justify-between">

              <div className="flex items-center gap-2">

                <Zap className="w-4 h-4 text-amber-500 fill-amber-400" />

                <span className="font-bold text-sm text-slate-800">

                  {isAddingFixtureDef ? 'Добавить обозначение' : 'Редактировать обозначение'}

                </span>

              </div>

              <button

                onClick={() => {

                  setEditingFixtureDef(null);

                  setIsAddingFixtureDef(false);

                }}

                className="p-1 hover:bg-slate-200 rounded-md text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"

              >

                <X className="w-4 h-4" />

              </button>

            </div>



            <form

              onSubmit={(e) => {

                e.preventDefault();

                if (!editingFixtureDef.name.trim()) {

                  showToast('⚠️ Введите название обозначения');

                  return;

                }

                const finalDef: FixtureDefinition = {

                  ...editingFixtureDef,

                  name: editingFixtureDef.name.trim(),

                  shortLabel: (editingFixtureDef.shortLabel || editingFixtureDef.name).trim().slice(0, 16),

                  width: Math.max(0.04, editingFixtureDef.width || 0.08),

                  height: Math.max(0.04, editingFixtureDef.height || 0.05),

                  defaultHeightFromFloor: Math.max(0, editingFixtureDef.defaultHeightFromFloor || 0.30),

                  baseGraphic: editingFixtureDef.baseGraphic || 'socket_single',

                  customIconUrl: editingFixtureDef.customIconUrl,

                  color: editingFixtureDef.color || '#2563eb',

                  isCustom: true

                };

                handleSaveFixtureDef(finalDef);

              }}

              className="p-4 space-y-3 text-xs text-slate-700"

            >

              <div>

                <label className="block font-bold text-slate-800 mb-1">

                  Название оборудования / обозначения:

                </label>

                <input

                  type="text"

                  required

                  placeholder="Например: Розетка ТВ, Вытяжка, Бра..."

                  value={editingFixtureDef.name}

                  onChange={(e) => setEditingFixtureDef(prev => prev ? { ...prev, name: e.target.value } : null)}

                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"

                />

              </div>



              <div className="grid grid-cols-2 gap-3">

                <div>

                  <label className="block font-bold text-slate-800 mb-1">

                    Категория:

                  </label>

                  <select

                    value={editingFixtureDef.category}

                    onChange={(e) => {

                      const newCat = e.target.value as FixtureCategory;

                      const catSyms = getGraphicSymbolsByCategory(newCat);

                      const firstSym = catSyms[0];

                      setEditingFixtureDef(prev => prev ? {

                        ...prev,

                        category: newCat,

                        baseGraphic: prev.customIconUrl ? prev.baseGraphic : (firstSym ? firstSym.svgType : prev.baseGraphic)

                      } : null);

                    }}

                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"

                  >

                    <option value="electric">⚡ Электрика</option>

                    <option value="plumbing">🚰 Сантехника</option>

                    <option value="kitchen">🍳 Кухня</option>

                    <option value="bathroom">🛁 Ванная</option>

                    <option value="climate">❄️ Климат и отопление</option>

                    <option value="riser">🔘 Стояки АР</option>

                    <option value="other">📐 Другое / Мебель</option>

                  </select>

                </div>

                <div>

                  <label className="block font-bold text-slate-800 mb-1">

                    Текст на полке-выноске:

                  </label>

                  <input

                    type="text"

                    placeholder="Розетка 1-я / Кондиц."

                    value={editingFixtureDef.shortLabel}

                    onChange={(e) => setEditingFixtureDef(prev => prev ? { ...prev, shortLabel: e.target.value } : null)}

                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"

                  />

                </div>

              </div>



              {/* ВЫБОР ГРАФИЧЕСКОГО СИМВОЛА ПО ГОСТ ИЛИ ЗАГРУЗКА С ПК */}

              <div>

                <div className="flex items-center justify-between mb-1">

                  <label className="font-bold text-slate-800 text-xs">

                    Графический символ (ГОСТ):

                  </label>

                  <div className="flex items-center gap-1.5">

                    <button

                      type="button"

                      onClick={() => {

                        setGalleryCategoryFilter(editingFixtureDef.category);

                        setShowSymbolGalleryModal(true);

                      }}

                      className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[11px] font-bold border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer"

                      title="Открыть большой каталог всех доступных обозначений по ГОСТ"

                    >

                      <Palette className="w-3 h-3" />

                      <span>Каталог ГОСТ (галерея)</span>

                    </button>

                    <button

                      type="button"

                      onClick={() => fileInputRef.current?.click()}

                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold border border-slate-300 transition-colors flex items-center gap-1 cursor-pointer"

                      title="Загрузить свой графический элемент (SVG / PNG / JPG) с компьютера"

                    >

                      <Upload className="w-3 h-3" />

                      <span>С ПК</span>

                    </button>

                  </div>

                </div>



                <div className="flex items-center gap-2">

                  <select

                    value={editingFixtureDef.customIconUrl ? 'custom_image' : (editingFixtureDef.baseGraphic || 'socket_single')}

                    onChange={(e) => {

                      const val = e.target.value;

                      if (val === 'custom_image') {

                        fileInputRef.current?.click();

                        return;

                      }

                      const found = getGraphicSymbolById(val) || GRAPHIC_SYMBOLS_CATALOG.find(s => s.svgType === val);

                      setEditingFixtureDef(prev => prev ? {

                        ...prev,

                        baseGraphic: val,

                        customIconUrl: undefined,

                        shortLabel: prev.shortLabel || found?.shortLabel || prev.name,

                        defaultHeightFromFloor: prev.defaultHeightFromFloor || found?.defaultHeightFromFloor || 0.30,

                        width: prev.width || found?.defaultWidth || 0.10,

                        height: prev.height || found?.defaultHeight || 0.08

                      } : null);

                    }}

                    className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"

                  >

                    {editingFixtureDef.customIconUrl && (

                      <option value="custom_image">📁 Пользовательское изображение с ПК</option>

                    )}

                    <optgroup label={`Символы категории: ${editingFixtureDef.category}`}>

                      {getGraphicSymbolsByCategory(editingFixtureDef.category).map(sym => (

                        <option key={sym.id} value={sym.svgType}>

                          {sym.name}

                        </option>

                      ))}

                    </optgroup>

                    <optgroup label="Все категории (быстрый выбор)">

                      {GRAPHIC_SYMBOLS_CATALOG.filter(s => s.category !== editingFixtureDef.category).map(sym => (

                        <option key={sym.id} value={sym.svgType}>

                          [{sym.categoryLabel}] {sym.name}

                        </option>

                      ))}

                    </optgroup>

                  </select>



                  {/* Мини-превью выбранного графического символа */}

                  <div className="p-1 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 w-10 h-10 shadow-2xs">

                    <SymbolThumbnail

                      svgType={editingFixtureDef.baseGraphic || 'socket_single'}

                      customIconUrl={editingFixtureDef.customIconUrl}

                      color={editingFixtureDef.color}

                      size={28}

                    />

                  </div>

                </div>



                {editingFixtureDef.customIconUrl && (

                  <div className="mt-1 flex items-center justify-between text-[11px] text-teal-700 bg-teal-50 px-2 py-1 rounded border border-teal-200">

                    <span>Используется загруженное изображение с ПК</span>

                    <button

                      type="button"

                      onClick={() => setEditingFixtureDef(prev => prev ? { ...prev, customIconUrl: undefined, baseGraphic: 'socket_single' } : null)}

                      className="text-red-600 hover:text-red-700 font-bold underline cursor-pointer"

                    >

                      Сбросить

                    </button>

                  </div>

                )}

              </div>



              <div>

                <label className="block font-bold text-slate-800 mb-1">

                  Текст внутри символа (буква / цифра):

                </label>

                <input

                  type="text"

                  maxLength={5}

                  placeholder="ТВ, К, X, 2..."

                  value={editingFixtureDef.iconText || ''}

                  onChange={(e) => setEditingFixtureDef(prev => prev ? { ...prev, iconText: e.target.value } : null)}

                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"

                />

              </div>



              <div className="grid grid-cols-3 gap-2">

                <div>

                  <label className="block font-bold text-slate-800 mb-1 text-[11px]">

                    Высота H (мм):

                  </label>

                  <input

                    type="number"

                    min={0}

                    max={4000}

                    step={50}

                    value={Math.round(editingFixtureDef.defaultHeightFromFloor * 1000)}

                    onChange={(e) => {

                      const mm = parseFloat(e.target.value) || 0;

                      setEditingFixtureDef(prev => prev ? { ...prev, defaultHeightFromFloor: mm / 1000 } : null);

                    }}

                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"

                  />

                </div>

                <div>

                  <label className="block font-bold text-slate-800 mb-1 text-[11px]">

                    Ширина (мм):

                  </label>

                  <input

                    type="number"

                    min={20}

                    max={2000}

                    step={10}

                    value={Math.round(editingFixtureDef.width * 1000)}

                    onChange={(e) => {

                      const mm = parseFloat(e.target.value) || 50;

                      setEditingFixtureDef(prev => prev ? { ...prev, width: mm / 1000 } : null);

                    }}

                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"

                  />

                </div>

                <div>

                  <label className="block font-bold text-slate-800 mb-1 text-[11px]">

                    Глубина (мм):

                  </label>

                  <input

                    type="number"

                    min={20}

                    max={2000}

                    step={10}

                    value={Math.round(editingFixtureDef.height * 1000)}

                    onChange={(e) => {

                      const mm = parseFloat(e.target.value) || 50;

                      setEditingFixtureDef(prev => prev ? { ...prev, height: mm / 1000 } : null);

                    }}

                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"

                  />

                </div>

              </div>



              <div>

                <label className="block font-bold text-slate-800 mb-1">

                  Цвет обозначения на чертеже:

                </label>

                <div className="flex items-center gap-2">

                  <input

                    type="color"

                    value={editingFixtureDef.color}

                    onChange={(e) => setEditingFixtureDef(prev => prev ? { ...prev, color: e.target.value } : null)}

                    className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"

                  />

                  <div className="flex items-center gap-1.5">

                    {['#2563eb', '#0d9488', '#d97706', '#dc2626', '#0f172a', '#7c3aed'].map(c => (

                      <button

                        type="button"

                        key={c}

                        onClick={() => setEditingFixtureDef(prev => prev ? { ...prev, color: c } : null)}

                        style={{ backgroundColor: c }}

                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer ${editingFixtureDef.color === c ? 'border-blue-900 ring-2 ring-blue-300' : 'border-white'}`}

                      />

                    ))}

                  </div>

                </div>

              </div>



              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">

                {editingFixtureDef.isCustom && !isAddingFixtureDef ? (

                  <button

                    type="button"

                    onClick={() => handleDeleteFixtureDef(editingFixtureDef.type)}

                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold flex items-center gap-1 text-xs border border-red-200 transition-colors cursor-pointer"

                  >

                    <Trash2 className="w-3.5 h-3.5" />

                    <span>Удалить</span>

                  </button>

                ) : (

                  <div />

                )}

                <div className="flex items-center gap-2">

                  <button

                    type="button"

                    onClick={() => {

                      setEditingFixtureDef(null);

                      setIsAddingFixtureDef(false);

                    }}

                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"

                  >

                    Отмена

                  </button>

                  <button

                    type="submit"

                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition-all hover:scale-105 cursor-pointer"

                  >

                    Сохранить в палитру

                  </button>

                </div>

              </div>

            </form>

          </div>

        </div>

      )}



      {/* БОЛЬШАЯ ГАЛЕРЕЯ СИМВОЛОВ ГОСТ (КАТАЛОГ С ПОИСКОМ И ВЫБОРОМ) */}

      {showSymbolGalleryModal && (

        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">

          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95">

            {/* Шапка каталога */}

            <div className="p-4 bg-slate-100 text-slate-800 border-b border-slate-200 flex items-center justify-between shrink-0">

              <div className="flex items-center gap-2">

                <Palette className="w-5 h-5 text-amber-500" />

                <div>

                  <h3 className="font-bold text-base leading-tight text-slate-900">

                    Библиотека графических обозначений ГОСТ (АР / ЭОМ / ВК)

                  </h3>

                  <p className="text-[11px] text-slate-500">

                    ГОСТ 21.501-2018, ГОСТ 21.614-88, ГОСТ 21.205-93. Кликните на элемент для выбора в проект.

                  </p>

                </div>

              </div>

              <div className="flex items-center gap-2">

                <button

                  type="button"

                  onClick={() => fileInputRef.current?.click()}

                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"

                  title="Загрузить свой файл SVG или PNG с компьютера"

                >

                  <Upload className="w-3.5 h-3.5" />

                  <span>Загрузить с ПК</span>

                </button>

                <button

                  onClick={() => setShowSymbolGalleryModal(false)}

                  className="p-1.5 hover:bg-white/20 rounded-lg text-white transition-colors cursor-pointer"

                >

                  <X className="w-5 h-5" />

                </button>

              </div>

            </div>



            {/* Фильтры и поиск */}

            <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">

              {/* Категории */}

              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">

                {[

                  { id: 'all', label: 'Все символы' },

                  { id: 'electric', label: '⚡ Электрика' },

                  { id: 'plumbing', label: '🚰 Сантехника' },

                  { id: 'kitchen', label: '🍳 Кухня' },

                  { id: 'bathroom', label: '🛁 Ванная' },

                  { id: 'climate', label: '❄️ Климат' },

                  { id: 'riser', label: '🔘 Стояки АР' }

                ].map(cat => (

                  <button

                    key={cat.id}

                    onClick={() => setGalleryCategoryFilter(cat.id)}

                    className={`px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${

                      galleryCategoryFilter === cat.id

                        ? 'bg-blue-600 text-white shadow-xs'

                        : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300'

                    }`}

                  >

                    {cat.label}

                  </button>

                ))}

              </div>



              {/* Поиск */}

              <div className="relative w-64">

                <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />

                <input

                  type="text"

                  placeholder="Поиск по названию или ГОСТ..."

                  value={gallerySearchQuery}

                  onChange={(e) => setGallerySearchQuery(e.target.value)}

                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"

                />

              </div>

            </div>



            {/* Сетка символов */}

            <div className="p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 flex-1">

              {GRAPHIC_SYMBOLS_CATALOG

                .filter(sym => {

                  if (galleryCategoryFilter !== 'all' && sym.category !== galleryCategoryFilter && sym.category !== 'general') {

                    return false;

                  }

                  if (gallerySearchQuery.trim()) {

                    const q = gallerySearchQuery.toLowerCase();

                    return sym.name.toLowerCase().includes(q) ||

                           sym.shortLabel.toLowerCase().includes(q) ||

                           sym.description.toLowerCase().includes(q);

                  }

                  return true;

                })

                .map(sym => (

                  <div

                    key={sym.id}

                    onClick={() => {

                      if (editingFixtureDef) {

                        setEditingFixtureDef(prev => prev ? {

                          ...prev,

                          baseGraphic: sym.svgType,

                          category: (sym.category === 'general' ? prev.category : sym.category) as FixtureCategory,

                          shortLabel: sym.shortLabel,

                          width: sym.defaultWidth,

                          height: sym.defaultHeight,

                          defaultHeightFromFloor: sym.defaultHeightFromFloor,

                          color: sym.defaultColor || prev.color,

                          name: (!prev.name || prev.name.startsWith('Новое') ? sym.name : prev.name),

                          customIconUrl: undefined

                        } : null);

                        setShowSymbolGalleryModal(false);

                        showToast(`Выбран символ: ${sym.name}`);

                      } else {

                        // Если открыли галерею напрямую, создаем новое обозначение

                        const newDef: FixtureDefinition = {

                          type: `custom_${Date.now()}`,

                          name: sym.name,

                          shortLabel: sym.shortLabel,

                          category: (sym.category === 'general' ? 'electric' : sym.category) as FixtureCategory,

                          width: sym.defaultWidth,

                          height: sym.defaultHeight,

                          color: sym.defaultColor || '#2563eb',

                          defaultHeightFromFloor: sym.defaultHeightFromFloor,

                          baseGraphic: sym.svgType,

                          iconText: '',

                          isCustom: true

                        };

                        setEditingFixtureDef(newDef);

                        setIsAddingFixtureDef(true);

                        setShowSymbolGalleryModal(false);

                      }

                    }}

                    className="p-3 bg-white hover:bg-blue-50/70 border border-slate-200 hover:border-blue-400 rounded-xl transition-all shadow-2xs hover:shadow-md cursor-pointer flex gap-3 items-start group"

                  >

                    <div className="w-14 h-14 bg-slate-50 group-hover:bg-white rounded-lg border border-slate-200 flex items-center justify-center shrink-0 shadow-inner">

                      <SymbolThumbnail

                        svgType={sym.svgType}

                        color={sym.defaultColor || '#1e293b'}

                        size={40}

                      />

                    </div>

                    <div className="flex-1 min-w-0">

                      <div className="flex items-center justify-between gap-1 mb-0.5">

                        <span className="font-bold text-xs text-slate-800 group-hover:text-blue-700 truncate">

                          {sym.name}

                        </span>

                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono shrink-0">

                          {sym.categoryLabel}

                        </span>

                      </div>

                      <p className="text-[11px] text-slate-500 leading-snug line-clamp-2 mb-1.5">

                        {sym.description}

                      </p>

                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">

                        <span>{Math.round(sym.defaultWidth * 1000)}×{Math.round(sym.defaultHeight * 1000)}мм</span>

                        <span>•</span>

                        <span className="text-blue-600 font-semibold">H={Math.round(sym.defaultHeightFromFloor * 1000)}мм</span>

                        <span>•</span>

                        <span className="text-slate-700 font-semibold">{sym.shortLabel}</span>

                      </div>

                    </div>

                  </div>

                ))}

            </div>



            {/* Футер модалки галереи */}

            <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 shrink-0">

              <span>

                Всего символов в библиотеке: <b>{GRAPHIC_SYMBOLS_CATALOG.length}</b> шт. (соответствуют ГОСТ)

              </span>

              <button

                type="button"

                onClick={() => setShowSymbolGalleryModal(false)}

                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-colors cursor-pointer"

              >

                Закрыть

              </button>

            </div>

          </div>

        </div>

      )}



      {/* ПЛАШКА АКТИВНОЙ УСТАНОВКИ ОБОЗНАЧЕНИЯ С КНОПКОЙ ВЫХОДА */}

      {activeFixtureType && (

        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 text-white px-4 py-2.5 rounded-2xl shadow-2xl border-2 border-amber-500/80 flex items-center gap-4 animate-in fade-in slide-in-from-top-2 text-xs select-none">

          <div className="flex items-center gap-2">

            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />

            <span className="font-bold text-amber-300 text-sm">

              Установка: {getFixtureDefinition(activeFixtureType).name}

            </span>

          </div>

          <div className="text-slate-300 text-[11px] hidden sm:block">

            Кликните на чертеже внутри комнаты · <b>[R]</b> повернуть ({fixtureRotation}°) · <b>[ПКМ]</b> выход

          </div>

          <button

            type="button"

            onClick={() => {

              setActiveFixtureType(null);

              showToast('Выход из режима добавления обозначений');

            }}

            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all hover:scale-105 cursor-pointer ml-1"

            title="Завершить добавление [Правая кнопка мыши / Esc]"

          >

            <X className="w-3.5 h-3.5" />

            <span>Выйти из режима [ПКМ]</span>

          </button>

        </div>

      )}



      {/* Всплывающее уведомление-подсказка (Toast) (Светлое) */}

      {toastMessage && (

        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-white/95 text-slate-900 px-4 py-2 rounded-xl shadow-2xl border-2 border-slate-200 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">

          <span>{toastMessage}</span>

        </div>

      )}



      {/* Холст Canvas */}

      <div

        className={`relative flex-1 w-full h-full ${getCursorClass()}`}

        onContextMenu={(e) => {

          e.preventDefault();

          e.stopPropagation();

        }}

      >

        <canvas

          ref={canvasRef}

          tabIndex={0}

          onWheel={handleWheel}

          onMouseMove={handleMouseMove}

          onMouseDown={handleMouseDown}

          onMouseUp={handleMouseUp}

          onDoubleClick={handleDoubleClick}

          onContextMenu={(e) => e.preventDefault()}

          style={{ cursor: 'inherit' }}

          className="absolute inset-0 block w-full h-full outline-none"

        />



        {/* ВСПЛЫВАЮЩИЙ ИНЛАЙН-ИНПУТ ДЛЯ БЫСТРОГО ВВОДА РАЗМЕРА / ПРОЕМА ПО ДВОЙНОМУ КЛИКУ */}

        {inlineDimEditTarget && (

          <div

            className="absolute z-50 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-2xl border border-blue-500/40 flex items-center gap-2 animate-in fade-in zoom-in-95 pointer-events-auto"

            style={{ left: inlineDimEditTarget.screenX, top: inlineDimEditTarget.screenY, transform: 'translate(-50%, -100%)' }}

          >

            <div className="flex flex-col">

              <span className="text-[10px] text-slate-500 font-bold truncate max-w-[190px]">{inlineDimEditTarget.title}</span>

              <div className="flex items-center gap-1.5 mt-1">

                <input

                  autoFocus

                  type="text"

                  value={inlineDimEditValue}

                  onChange={(e) => setInlineDimEditValue(e.target.value)}

                  onKeyDown={(e) => {

                    if (e.key === 'Enter') handleApplyInlineDimEdit();

                    if (e.key === 'Escape') setInlineDimEditTarget(null);

                  }}

                  className="w-20 px-2 py-1 text-xs font-mono font-bold bg-white text-slate-900 border border-slate-300 rounded focus:border-blue-500 focus:outline-none"

                />

                <span className="text-[10px] font-bold text-slate-400">мм</span>

                <button

                  type="button"

                  onClick={handleApplyInlineDimEdit}

                  className="p-1 rounded bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"

                  title="Применить размер [Enter]"

                >

                  <Check className="w-3.5 h-3.5" />

                </button>

                <button

                  type="button"

                  onClick={() => setInlineDimEditTarget(null)}

                  className="p-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 cursor-pointer"

                  title="Отмена [Esc]"

                >

                  <X className="w-3.5 h-3.5" />

                </button>

              </div>

            </div>

          </div>

        )}



        {/* ИНДИКАТОР РЕЖИМА СДВИГА ВСЕЙ КВАРТИРЫ */}

        {toolMode === 'move_all' && (

          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-amber-600/95 text-white px-5 py-2.5 rounded-2xl shadow-2xl border-2 border-amber-400 flex items-center gap-3 animate-in slide-in-from-top-4 text-xs select-none">

            <span className="relative flex h-3 w-3">

              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>

              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>

            </span>

            <span className="font-bold sm:text-sm">

              ↔️ Режим сдвига всей квартиры: зажмите ЛКМ и перетащите стены в нужное место

            </span>

            <button

              type="button"

              onClick={() => setToolMode('draw')}

              className="px-2.5 py-1 text-xs font-semibold bg-white/20 hover:bg-white/30 text-white rounded-lg cursor-pointer transition-colors border border-white/40"

            >

              Завершить [Esc]

            </button>

          </div>

        )}



        {/* БАННЕР КАЛИБРОВКИ МАСШТАБА (СВЕТЛЫЙ) */}

        {calibration.active && (

          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-white/95 text-slate-800 px-5 py-2.5 rounded-2xl shadow-2xl border-2 border-indigo-500 flex items-center gap-4 animate-in slide-in-from-top-4">

            <div className="flex items-center gap-2.5">

              <span className="relative flex h-3 w-3">

                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>

                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600"></span>

              </span>

              <span className="font-bold text-xs sm:text-sm text-slate-900">

                {calibration.step === 'pick_p1' && 'Шаг 1 из 2: Кликните первую точку известного отрезка на плане (например, угол стены)'}

                {calibration.step === 'pick_p2' && 'Шаг 2 из 2: Кликните вторую точку известного отрезка на плане'}

              </span>

            </div>

            <button

              onClick={() => setCalibration({ active: false, step: 'pick_p1', p1World: null, p2World: null })}

              className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer transition-colors border border-slate-300"

            >

              Отмена

            </button>

          </div>

        )}



        {/* МОДАЛЬНОЕ ОКНО ВВОДА РЕАЛЬНОЙ ДЛИНЫ ДЛЯ КАЛИБРОВКИ */}

        {calibration.step === 'input_length' && (

          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">

            <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-sm p-5 animate-in zoom-in-95">

              <div className="flex items-center gap-2.5 mb-2 text-slate-900 font-bold text-base">

                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">

                  <Ruler className="w-5 h-5" />

                </div>

                <div>

                  <h3 className="font-bold text-slate-900 text-sm">Калибровка масштаба 1:1</h3>

                  <p className="text-[11px] text-slate-500 font-normal">Укажите реальную длину отрезка</p>

                </div>

              </div>

              <p className="text-xs text-slate-600 mb-3 bg-slate-50 p-2 rounded-lg border border-slate-200">

                Отрезок между выбранными точками зафиксирован. Введите его реальный размер в миллиметрах, чтобы чертёж встал в точный строительный масштаб.

              </p>

              <div className="mb-4">

                <label className="block text-xs font-bold text-slate-700 mb-1">Реальная длина отрезка (мм):</label>

                <div className="flex items-center gap-2">

                  <input

                    type="number"

                    value={calibrationInputMm}

                    onChange={e => setCalibrationInputMm(e.target.value)}

                    onKeyDown={e => { if (e.key === 'Enter') applyCalibration(); }}

                    autoFocus

                    placeholder="3000"

                    className="flex-1 px-3 py-2 border-2 border-indigo-400 focus:border-indigo-600 rounded-xl text-lg font-bold font-mono text-slate-900 outline-none"

                  />

                  <span className="text-sm font-bold text-slate-500">мм</span>

                </div>

              </div>

              <div className="flex items-center justify-end gap-2">

                <button

                  onClick={() => setCalibration({ active: false, step: 'pick_p1', p1World: null, p2World: null })}

                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"

                >

                  Отмена

                </button>

                <button

                  onClick={applyCalibration}

                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md cursor-pointer flex items-center gap-1.5"

                >

                  <Check className="w-4 h-4" />

                  <span>Применить масштаб</span>

                </button>

              </div>

            </div>

          </div>

        )}



        {/* ПЛАВАЮЩАЯ ПАНЕЛЬ УПРАВЛЕНИЯ ПОДЛОЖКОЙ ПЛАНА (СВЕТЛАЯ) */}

        {backdrop && !calibration.active && (

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 bg-white/95 backdrop-blur-md text-slate-800 px-4 py-2 rounded-2xl shadow-2xl border-2 border-slate-200/90 flex flex-wrap items-center gap-2.5 text-xs animate-in slide-in-from-bottom-3">

            <div className="flex items-center gap-1.5 font-bold max-w-[140px] truncate text-indigo-900">

              <ImageIcon className="w-4 h-4 shrink-0 text-indigo-600" />

              <span className="truncate" title={backdrop.name}>{backdrop.name}</span>

            </div>



            {/* Кнопка Загрузить новый план / Заменить */}

            <button

              type="button"

              onClick={() => backdropFileInputRef.current?.click()}

              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold cursor-pointer transition-colors shadow-2xs"

              title="Загрузить другое фото или скан плана (заменить текущий фон)"

            >

              <Upload className="w-3.5 h-3.5" />

              <span>Загрузить новый</span>

            </button>



            <div className="h-4 w-px bg-slate-200" />



            {/* Прозрачность */}

            <div className="flex items-center gap-1.5">

              <span className="text-slate-500 text-[11px] font-medium">Прозрачность:</span>

              <input

                type="range"

                min="0.05"

                max="1.0"

                step="0.05"

                value={backdrop.opacity}

                onChange={e => {

                  const val = parseFloat(e.target.value);

                  setBackdrop(prev => prev ? { ...prev, opacity: val } : null);

                }}

                className="w-18 accent-indigo-600 cursor-pointer"

              />

              <span className="font-mono text-slate-800 text-[11px] font-bold w-7 text-right">{Math.round(backdrop.opacity * 100)}%</span>

            </div>



            <div className="h-4 w-px bg-slate-200" />



            {/* Калибровка */}

            <button

              type="button"

              onClick={() => {

                setCalibration({ active: true, step: 'pick_p1', p1World: null, p2World: null });

                showToast('📏 Кликните первую точку известного отрезка на плане');

              }}

              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer transition-colors shadow-xs"

              title="Откалибровать масштаб подложки по известному отрезку стены в мм"

            >

              <Ruler className="w-3.5 h-3.5" />

              <span>Калибровать 1:1</span>

            </button>



            {/* Поворот на 90° */}

            <button

              type="button"

              onClick={() => {

                setBackdrop(prev => {

                  if (!prev) return null;

                  const nextRot = (prev.rotationDeg + 90) % 360;

                  return { ...prev, rotationDeg: nextRot };

                });

              }}

              className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-200"

              title="Повернуть подложку на 90°"

            >

              <RotateCw className="w-3.5 h-3.5" />

            </button>



            {/* Кнопка сдвига всей нарисованной квартиры */}

            <button

              type="button"

              onClick={() => {

                setToolMode(prev => prev === 'move_all' ? 'draw' : 'move_all');

                showToast(toolMode === 'move_all' ? 'Инструмент «Стена» включен' : '↔️ Режим сдвига квартиры: зажмите ЛКМ и переместите стены');

              }}

              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors shadow-2xs ${

                toolMode === 'move_all'

                  ? 'bg-amber-600 text-white'

                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300'

              }`}

              title="Сдвинуть нарисованную квартиру целиком мышкой [M]"

            >

              <Move className="w-3.5 h-3.5" />

              <span>{toolMode === 'move_all' ? 'Сдвиг ВКЛ' : 'Сдвинуть квартиру'}</span>

            </button>



            {/* Режим перемещения подложки */}

            <button

              type="button"

              onClick={() => {

                setIsMovingBackdrop(prev => !prev);

                showToast(isMovingBackdrop ? 'Режим сдвига подложки выключен' : 'Зажмите ЛКМ и перетащите подложку в нужное место');

              }}

              className={`flex items-center gap-1 px-2 py-1 rounded-lg cursor-pointer transition-colors ${

                isMovingBackdrop ? 'bg-amber-600 text-white font-bold' : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-transparent hover:border-slate-200'

              }`}

              title="Включить свободное перемещение подложки мышью по холсту"

            >

              <MoveHorizontal className="w-3.5 h-3.5" />

              <span>{isMovingBackdrop ? 'Сдвиг ВКЛ' : 'Сдвинуть'}</span>

            </button>



            {/* Замочек блокировки */}

            <button

              type="button"

              onClick={() => {

                setBackdrop(prev => prev ? { ...prev, locked: !prev.locked } : null);

                showToast(backdrop.locked ? 'Подложка разблокирована' : 'Подложка зафиксирована от случайного сдвига');

              }}

              className={`p-1.5 rounded-lg cursor-pointer transition-colors ${

                backdrop.locked ? 'text-amber-700 bg-amber-100 border border-amber-300' : 'text-slate-600 hover:bg-slate-100 border border-transparent hover:border-slate-200'

              }`}

              title={backdrop.locked ? 'Подложка заблокирована (кликните для разблокировки)' : 'Подложка свободна (кликните для блокировки)'}

            >

              {backdrop.locked ? '🔒' : '🔓'}

            </button>



            {/* Глаз скрытия */}

            <button

              type="button"

              onClick={() => {

                setBackdrop(prev => prev ? { ...prev, visible: !prev.visible } : null);

              }}

              className={`p-1.5 rounded-lg cursor-pointer transition-colors ${

                !backdrop.visible ? 'text-slate-400 bg-slate-100 border border-slate-200' : 'text-slate-700 hover:bg-slate-100 border border-transparent hover:border-slate-200'

              }`}

              title={backdrop.visible ? 'Скрыть подложку' : 'Показать подложку'}

            >

              {backdrop.visible ? '👁️' : '🕶️'}

            </button>



            {/* Удалить */}

            <button

              type="button"

              onClick={() => {

                if (window.confirm('Удалить фоновую подложку плана с холста?')) {

                  handleRemoveBackdrop();

                }

              }}

              className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-red-200"

              title="Удалить подложку с холста"

            >

              <Trash2 className="w-3.5 h-3.5" />

            </button>

          </div>

        )}



        {/* Плавающий сворачиваемый виджет «Данные с чертежа» (Шпаргалка) */}

        {(backdrop || cheatSheetData || isCheatSheetLoading || (rawDetectedRooms && rawDetectedRooms.length > 0)) && (

          <div className="absolute top-4 right-4 z-40 flex flex-col items-end gap-2">

            {rawDetectedRooms && rawDetectedRooms.length > 0 && !isDetectedModalOpen && (
              <button
                type="button"
                onClick={() => setIsDetectedModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl shadow-lg border border-white/20 font-bold text-xs transition-all hover:scale-102 cursor-pointer animate-in fade-in"
                title="Открыть экспликацию помещений с чертежа"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Экспликация ({rawDetectedRooms.length} комн.)</span>
              </button>
            )}

            {!isCheatSheetOpen ? (

              <button

                type="button"

                onClick={() => setIsCheatSheetOpen(true)}

                className="flex items-center gap-2 px-3.5 py-2 bg-white/95 backdrop-blur-md hover:bg-white text-slate-800 rounded-2xl shadow-xl border border-slate-200/90 font-bold text-xs transition-all hover:shadow-2xl cursor-pointer hover:border-amber-400 group animate-in fade-in"

                title="Открыть шпаргалку с экспликацией и размерами"

              >

                <ClipboardList className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />

                <span>📋 Данные с чертежа</span>

                {isCheatSheetLoading ? (

                  <span className="flex items-center gap-1 text-[11px] text-amber-600 font-normal">

                    <Loader2 className="w-3.5 h-3.5 animate-spin" />

                    <span>чтение...</span>

                  </span>

                ) : cheatSheetData ? (

                  <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full text-[10px] font-mono">

                    {cheatSheetData.rooms.length > 0 ? `${cheatSheetData.rooms.length} комн.` : `${cheatSheetData.textNotes.length} зам.`}

                    {cheatSheetData.totalArea ? ` · ${cheatSheetData.totalArea} м²` : ''}

                  </span>

                ) : null}

              </button>

            ) : (

              <div className="w-88 sm:w-96 max-h-[75vh] flex flex-col bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden animate-in fade-in slide-in-from-top-2">

                {/* Шапка */}

                <div className="px-4 py-3 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border-b border-slate-200/80 flex items-center justify-between">

                  <div className="flex items-center gap-2">

                    <div className="p-1.5 bg-amber-500 text-white rounded-lg shadow-xs">

                      <ClipboardList className="w-4 h-4" />

                    </div>

                    <div>

                      <h3 className="text-xs font-bold text-slate-900 leading-tight">Данные с чертежа</h3>

                      <p className="text-[10px] text-slate-500 leading-tight">Шпаргалка для ручной обводки стен</p>

                    </div>

                  </div>



                  <div className="flex items-center gap-1">

                    {isCheatSheetLoading && (

                      <span className="flex items-center gap-1 text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-medium">

                        <Loader2 className="w-3 h-3 animate-spin" />

                        <span>OCR...</span>

                      </span>

                    )}

                    <button
                      type="button"
                      onClick={() => setIsDetectedModalOpen(true)}
                      className="px-2 py-0.5 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                      title="Редактировать распознанные помещения и перенести в раздел «Обмер»"
                    >
                      <Sparkles className="w-3 h-3 text-blue-600" />
                      <span>Комнаты OCR</span>
                    </button>

                    <button

                      type="button"

                      onClick={() => setIsCheatSheetOpen(false)}

                      className="p-1 hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer transition-colors"

                      title="Свернуть шпаргалку"

                    >

                      <X className="w-4 h-4" />

                    </button>

                  </div>

                </div>



                {/* Контент */}

                <div className="p-3.5 overflow-y-auto space-y-3 text-xs">

                  {/* Общая проектная площадь и потолки */}

                  <div className="grid grid-cols-2 gap-2">

                    <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5">

                      <div className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">S проектная</div>

                      <div className="text-base font-extrabold text-amber-950 font-mono mt-0.5">

                        {cheatSheetData?.totalArea ? `${cheatSheetData.totalArea} м²` : '—'}

                      </div>

                    </div>



                    <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-2.5">

                      <div className="text-[10px] uppercase font-bold text-blue-800 tracking-wider">Высота потолков</div>

                      <div className="mt-0.5">

                        <span className="text-base font-extrabold text-blue-950 font-mono">

                          {cheatSheetData?.ceilingHeightMm ? `${(cheatSheetData.ceilingHeightMm / 1000).toFixed(2)} м` : `${ceilingHeight.toFixed(2)} м`}

                        </span>

                        {cheatSheetData?.ceilingHeightMm && (

                          <span className="block text-[10px] text-blue-600 font-medium mt-0.5">

                            (по чертежу: {cheatSheetData.ceilingHeightMm} мм)

                          </span>

                        )}

                      </div>

                    </div>

                  </div>



                  {/* Таблица экспликации помещений */}

                  {cheatSheetData && cheatSheetData.rooms.length > 0 ? (

                    <div>

                      <div className="flex items-center justify-between mb-1.5">

                        <span className="font-bold text-slate-800 text-[11px]">Экспликация помещений ({cheatSheetData.rooms.length}):</span>

                        <button

                          type="button"

                          onClick={() => {

                            const text = cheatSheetData.rooms.map((r, i) => `${i + 1}. ${r.name}: ${r.area.toFixed(2)} м²`).join('\n') + `\nИтого: ${cheatSheetData.totalArea || ''} м²`;

                            navigator.clipboard?.writeText(text);

                            showToast('📋 Экспликация скопирована в буфер обмена!');

                          }}

                          className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer hover:underline flex items-center gap-0.5"

                        >

                          <Copy className="w-3 h-3" />

                          <span>Скопировать</span>

                        </button>

                      </div>



                      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">

                        <table className="w-full text-left" style={{ fontSize: `${Math.round(11 * fontScaleFactor)}px` }}>

                          <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">

                            <tr>

                              <th className="py-1.5 px-2 w-7 text-center">#</th>

                              <th className="py-1.5 px-2">Помещение</th>

                              <th className="py-1.5 px-2 text-right">S проект</th>

                            </tr>

                          </thead>

                          <tbody className="divide-y divide-slate-100">

                            {cheatSheetData.rooms.map((rm, idx) => (

                              <tr key={rm.id || idx} className="hover:bg-amber-50/40 transition-colors">

                                <td className="py-1.5 px-2 text-center text-slate-500 font-mono text-[10px]">{idx + 1}</td>

                                <td className="py-1.5 px-2 text-slate-800 font-medium">

                                  <div className="flex items-center gap-1.5">

                                    <span>{rm.name}</span>

                                    {rm.isWet && <span className="text-[9px] bg-cyan-100 text-cyan-800 px-1 rounded font-bold">💧 мокрая</span>}

                                  </div>

                                </td>

                                <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-900">

                                  {rm.area.toFixed(2)} м²

                                </td>

                              </tr>

                            ))}

                          </tbody>

                        </table>

                      </div>

                    </div>

                  ) : isCheatSheetLoading ? (

                    <div className="py-6 flex flex-col items-center justify-center text-slate-500 gap-2">

                      <Loader2 className="w-5 h-5 animate-spin text-amber-500" />

                      <span className="text-[11px]">Идет чтение экспликации и размеров...</span>

                    </div>

                  ) : (

                    <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center text-slate-500 text-[11px]">

                      Таблица экспликации не обнаружена на чертеже.

                    </div>

                  )}



                  {/* Текстовые заметки / размеры */}

                  {cheatSheetData && cheatSheetData.textNotes.length > 0 && (

                    <div>

                      <div className="flex items-center justify-between mb-1">

                        <span className="font-bold text-slate-800 text-[11px]">Размеры и примечания ({cheatSheetData.textNotes.length}):</span>

                        <button

                          type="button"

                          onClick={() => {

                            navigator.clipboard?.writeText(cheatSheetData.textNotes.join('\n'));

                            showToast('📋 Примечания скопированы в буфер!');

                          }}

                          className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer hover:underline flex items-center gap-0.5"

                        >

                          <Copy className="w-3 h-3" />

                          <span>Скопировать</span>

                        </button>

                      </div>

                      <div className="max-h-32 overflow-y-auto bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono text-slate-700 space-y-1" style={{ fontSize: `${Math.round(10 * fontScaleFactor)}px` }}>

                        {cheatSheetData.textNotes.slice(0, 30).map((note, nIdx) => (

                          <div key={nIdx} className="truncate hover:text-slate-900" title={note}>

                            • {note}

                          </div>

                        ))}

                        {cheatSheetData.textNotes.length > 30 && (

                          <div className="text-slate-400 italic">

                            ...и еще {cheatSheetData.textNotes.length - 30} записей

                          </div>

                        )}

                      </div>

                    </div>

                  )}



                </div>



                {/* Подвал */}

                <div className="px-3.5 py-2 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-[11px]">

                  <span className="text-slate-500 italic">Обводите стены поверх чертежа</span>

                  <button

                    type="button"

                    onClick={() => setIsCheatSheetOpen(false)}

                    className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-300 cursor-pointer shadow-2xs transition-colors"

                  >

                    Свернуть

                  </button>

                </div>

              </div>

            )}

          </div>

        )}



        {hoveredVertex && !currentWallStart && (

          <div

            style={{

              position: 'absolute',

              left: `${worldToScreen(hoveredVertex.x, hoveredVertex.y).x}px`,

              top: `${worldToScreen(hoveredVertex.x, hoveredVertex.y).y - 32}px`,

              transform: 'translate(-50%, -50%)',

            }}

            className="z-40 pointer-events-auto bg-white/95 border-2 border-red-400 rounded-lg shadow-xl p-1 flex items-center gap-1.5 animate-in fade-in zoom-in-95"

          >

            <span className="text-[10px] font-mono text-slate-500 font-bold px-1">

              ({hoveredVertex.x.toFixed(2)}, {hoveredVertex.y.toFixed(2)})

            </span>

            <button

              type="button"

              onClick={(e) => {

                e.stopPropagation();

                const isOnLine = isVertexOnStraightLine(hoveredVertex);

                deleteVertex(hoveredVertex, 'auto');

                showToast(isOnLine ? '🔗 Точка растворена, стена объединена' : '🗑 Точка угла удалена');

              }}

              className={`px-2 py-0.5 rounded border text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${

                isVertexOnStraightLine(hoveredVertex)

                  ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'

                  : 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200'

              }`}

              title={

                isVertexOnStraightLine(hoveredVertex)

                  ? 'Растворить промежуточную точку и объединить стену в одну [Delete / Backspace]'

                  : 'Удалить угол [Delete / Backspace]'

              }

            >

              {isVertexOnStraightLine(hoveredVertex) ? (

                <>

                  <Maximize2 className="w-3.5 h-3.5 text-blue-600" />

                  <span>Растворить точку [Del]</span>

                </>

              ) : (

                <>

                  <Trash2 className="w-3.5 h-3.5 text-red-600" />

                  <span>Удалить угол [Del]</span>

                </>

              )}

            </button>

          </div>

        )}



        {/* ПОДСКАЗКА ПРИВЯЗКИ К ТОЧКЕ/УГЛУ */}

        {isSnappedToVertex && !isSnapToClose && (

          <div

            style={{

              position: 'absolute',

              left: `${worldToScreen(snappedCursor.x, snappedCursor.y).x}px`,

              top: `${worldToScreen(snappedCursor.x, snappedCursor.y).y - 28}px`,

              transform: 'translate(-50%, -50%)',

            }}

            className="z-30 bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow pointer-events-none flex items-center gap-1"

          >

            <Target className="w-3 h-3 text-emerald-300" />

            <span>Подвязка к углу</span>

          </div>

        )}



        {/* ПОДСКАЗКА ПРИВЯЗКИ К СТЕНЕ */}

        {isSnappedToWall && !isSnappedToVertex && !isSnapToClose && (

          <div

            style={{

              position: 'absolute',

              left: `${worldToScreen(snappedCursor.x, snappedCursor.y).x}px`,

              top: `${worldToScreen(snappedCursor.x, snappedCursor.y).y - 28}px`,

              transform: 'translate(-50%, -50%)',

            }}

            className="z-30 bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow pointer-events-none flex items-center gap-1"

          >

            <Target className="w-3 h-3 text-amber-200" />

            <span>Привязка к стене</span>

          </div>

        )}



        {/* 1. Живой бейдж размера чертимой стены + Кнопка удаления последней точки */}

        {currentWallStart && (

          <div

            style={{

              position: 'absolute',

              left: `${currentWallMidpoint.x}px`,

              top: `${currentWallMidpoint.y - 28}px`,

              transform: 'translate(-50%, -50%)',

            }}

            className="z-20 pointer-events-auto flex items-center gap-1.5"

          >

            {currentWallLength > 0.05 && (

              !isEditingLength ? (

                <button

                  onClick={(e) => {

                    e.stopPropagation();

                    setIsEditingLength(true);

                    setManualLengthInput(currentWallLength.toFixed(2));

                    setTimeout(() => inputRef.current?.select(), 50);

                  }}

                  className="bg-slate-900/90 text-white hover:bg-blue-600 text-xs font-mono font-semibold px-2.5 py-1 rounded shadow-md border border-slate-700/50 flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105"

                  title="Кликните, чтобы ввести точную длину с клавиатуры"

                >

                  <Ruler className="w-3 h-3 text-blue-300" />

                  <span>

                    {dimensionUnit === 'mm' 

                      ? `${Math.round(currentWallLength * 1000)} мм` 

                      : dimensionUnit === 'cm'

                      ? `${formatDimValue(currentWallLength, 'cm')} см`

                      : `${currentWallLength.toFixed(2)} м`}

                  </span>

                  {currentWallStart && (

                    <span className="text-[10px] text-blue-300 font-mono pl-0.5">

                      · {Math.round((Math.atan2(snappedCursor.y - currentWallStart.y, snappedCursor.x - currentWallStart.x) * 180 / Math.PI + 360) % 360)}°

                    </span>

                  )}

                  {(isSpacePressed || isShiftPressed || orthoMode) && (

                    <span className="text-[9px] bg-emerald-500 text-white font-bold px-1.5 py-0.5 rounded shadow-xs uppercase tracking-tight ml-1 animate-pulse">

                      {isSpacePressed ? 'ПРОБЕЛ: СТРОГО 90°' : 'ОРТО 90°'}

                    </span>

                  )}

                </button>

              ) : (

                <form

                  onSubmit={(e) => {

                    e.preventDefault();

                    applyManualLength();

                  }}

                  className="flex items-center gap-1 bg-white p-1 rounded-lg shadow-xl border-2 border-blue-500 animate-in fade-in"

                >

                  <input

                    ref={inputRef}

                    type="text"

                    value={manualLengthInput}

                    onChange={(e) => setManualLengthInput(e.target.value)}

                    onKeyDown={(e) => {

                      if (e.key === 'Escape') setIsEditingLength(false);

                    }}

                    placeholder="5200 или 5.2"

                    className="w-24 px-2 py-0.5 text-xs font-mono font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-center"

                    autoFocus

                  />

                  <span className="text-[11px] font-mono text-blue-700 font-bold px-1 bg-blue-50 rounded border border-blue-200">

                    {parseFloat(manualLengthInput.replace(',', '.') || '0') >= 50 ? 'мм' : 'м'}

                  </span>

                  <button

                    type="submit"

                    className="bg-blue-600 hover:bg-blue-700 text-white rounded p-1 text-xs cursor-pointer"

                  >

                    <CheckCircle2 className="w-3.5 h-3.5" />

                  </button>

                </form>

              )

            )}



            {/* Кнопка отмены/удаления последней точки */}

            <button

              type="button"

              onClick={(e) => {

                e.stopPropagation();

                handleRemoveLastPoint();

              }}

              className="bg-amber-600/95 hover:bg-amber-700 text-white text-[11px] font-bold px-2 py-1 rounded shadow-md border border-amber-500/50 flex items-center gap-1 transition-all cursor-pointer hover:scale-105"

              title="Удалить последнюю точку [Backspace]"

            >

              <Undo2 className="w-3 h-3" />

              <span>Удалить точку</span>

            </button>

          </div>

        )}



        {/* ВЫДЕЛЕННАЯ УГЛОВАЯ ТОЧКА (ВЕРШИНА) С КНОПКОЙ УДАЛЕНИЯ [Del] */}

        {selectedVertex && !contextMenu.visible && (

          <div

            style={{

              position: 'absolute',

              left: `${worldToScreen(selectedVertex.x, selectedVertex.y).x}px`,

              top: `${worldToScreen(selectedVertex.x, selectedVertex.y).y - 34}px`,

              transform: 'translate(-50%, -50%)',

            }}

            className="z-30 bg-white/95 text-slate-800 border border-slate-200 rounded-xl shadow-xl p-1.5 flex items-center gap-1.5 text-xs pointer-events-auto animate-in fade-in zoom-in-95"

          >

            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700 px-1">

              <Target className="w-3.5 h-3.5 text-emerald-600" />

              <span>Точка угла</span>

            </div>

            <div className="h-4 w-px bg-slate-200" />

            <button

              onClick={() => deleteVertex(selectedVertex)}

              className="p-1 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-1 text-[11px] font-bold px-2 transition-colors cursor-pointer"

              title="Удалить эту угловую точку [Delete / Backspace]"

            >

              <Trash2 className="w-3.5 h-3.5" />

              <span>Удалить [Del]</span>

            </button>

            <button

              onClick={() => setSelectedVertex(null)}

              className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"

              title="Снять выделение [Esc]"

            >

              <X className="w-3.5 h-3.5" />

            </button>

          </div>

        )}



        {/* 2. ПАНЕЛЬ ВЫДЕЛЕННОЙ СТЕНЫ С РУЧНЫМ ВВОДОМ ДЛИНЫ И УДАЛЕНИЕМ [Del] */}

        {selectedWall && selectedWallMidpoint && !contextMenu.visible && (

          <div

            style={{

              position: 'absolute',

              left: `${selectedWallMidpoint.x}px`,

              top: `${selectedWallMidpoint.y - 45}px`,

              transform: 'translate(-50%, -50%)',

            }}

            className="z-30 bg-white/95 text-slate-800 border border-slate-200 rounded-xl shadow-xl p-2 flex items-center gap-2 text-xs font-medium pointer-events-auto animate-in fade-in zoom-in-95"

          >

            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">

              <span className="text-[11px] font-bold text-slate-700">Длина:</span>

              <input

                type="text"

                value={editWallLengthInput}

                onChange={(e) => setEditWallLengthInput(e.target.value)}

                onKeyDown={(e) => {

                  if (e.key === 'Enter') applySelectedWallLength();

                  if (e.key === 'Escape') setSelectedWallId(null);

                }}

                className="w-14 px-1 py-0.5 text-xs font-mono font-bold text-center bg-white text-slate-900 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"

              />

              <span className="text-[11px] text-slate-500 font-bold">м</span>

              <button

                onClick={applySelectedWallLength}

                className="bg-blue-600 hover:bg-blue-700 text-white p-0.5 rounded ml-0.5 cursor-pointer"

                title="Применить длину [Enter]"

              >

                <CheckCircle2 className="w-3 h-3" />

              </button>

            </div>



            <div className="h-4 w-px bg-slate-700" />



            {/* Вставка стандартной двери (0.80 × 2.05 м) */}

            <button

              onClick={() => addOpeningToWall(selectedWall.id, 'door', 0.80, 2.05, distance(selectedWall.start, selectedWall.end) / 2)}

              className="p-1 bg-slate-800 hover:bg-slate-700 text-orange-400 rounded-lg border border-slate-700 flex items-center gap-1 text-[11px] px-2 cursor-pointer transition-colors"

              title="Вставить дверь стандартного размера 0.80 × 2.05 м"

            >

              <DoorOpen className="w-3.5 h-3.5" />

              <span>Дверь (0.8×2.05)</span>

            </button>



            {/* Вставка окна с выпадающей выборкой типовых размеров */}

            <div className="relative">

              <button

                type="button"

                onClick={() => setShowWindowPresetMenu(!showWindowPresetMenu)}

                className="p-1 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg border border-slate-700 flex items-center gap-1 text-[11px] px-2 cursor-pointer transition-colors"

                title="Выбрать типовой размер окна и вставить в стену"

              >

                <LayoutGrid className="w-3.5 h-3.5" />

                <span>Окно ▾</span>

              </button>



              {showWindowPresetMenu && (

                <div className="absolute bottom-full mb-1 left-0 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 min-w-[240px] text-xs z-50 text-slate-200">

                  <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1 border-b border-slate-800">

                    Выберите размер окна:

                  </div>

                  <div className="space-y-0.5 pt-1">

                    {windowPresets.map(preset => (

                      <button

                        key={preset.id}

                        type="button"

                        onClick={() => {

                          addOpeningToWall(selectedWall.id, 'window', preset.width, preset.height, distance(selectedWall.start, selectedWall.end) / 2);

                          setShowWindowPresetMenu(false);

                        }}

                        className="w-full text-left px-2 py-1.5 hover:bg-slate-800 rounded-lg flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer"

                      >

                        <span className="font-semibold text-white">{preset.label}</span>

                        <span className="text-[10px] text-sky-400 font-mono">{(preset.width * preset.height).toFixed(2)} м²</span>

                      </button>

                    ))}

                  </div>

                </div>

              )}

            </div>



            {/* ПЕРЕКЛЮЧАТЕЛЬ: Тип стены (Стена 100 мм / Ограждение 100 мм) */}

            <button

              onClick={() => {

                const isCurrentlyHollow = Boolean(selectedWall.isHollow || selectedWall.wallType === 'railing' || selectedWall.wallType === 'hollow');

                setAllWalls(prev => prev.map(w => w.id === selectedWall.id ? {

                  ...w,

                  isHollow: !isCurrentlyHollow,

                  wallType: isCurrentlyHollow ? 'partition' : 'railing',

                  thickness: 0.10

                } : w));

                showToast(!isCurrentlyHollow ? '◽ Стена переключена в режим ограждения (балкон)' : '⬛ Сплошная стена 100 мм');

              }}

              className={`p-1 rounded-lg border flex items-center gap-1 text-[11px] px-2 font-bold cursor-pointer transition-colors ${

                (selectedWall.isHollow || selectedWall.wallType === 'railing' || selectedWall.wallType === 'hollow')

                  ? 'bg-amber-100 text-amber-900 border-amber-300'

                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'

              }`}

              title="Переключить тип стены: Сплошная стена 100 мм / Ограждение балкона 100 мм"

            >

              <span>

                {(selectedWall.isHollow || selectedWall.wallType === 'railing' || selectedWall.wallType === 'hollow')

                  ? '◽ Контур (балкон)'

                  : '⬛ Стена 100мм'}

              </span>

            </button>



            <div className="h-4 w-px bg-slate-700" />



            {/* КНОПКА УДАЛИТЬ СТЕНУ [Del] */}

            <button

              onClick={() => deleteWall(selectedWall.id)}

              className="p-1 bg-red-600/90 hover:bg-red-600 text-white rounded-lg flex items-center gap-1 text-[11px] px-2 font-bold transition-colors cursor-pointer"

              title="Удалить эту стену [Delete / Backspace]"

            >

              <Trash2 className="w-3.5 h-3.5" />

              <span>Удалить [Del]</span>

            </button>



            <button

              onClick={() => setSelectedWallId(null)}

              className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"

              title="Снять выделение [Esc]"

            >

              <X className="w-3.5 h-3.5" />

            </button>

          </div>

        )}



        {/* ПЛАВАЮЩИЙ ИНСПЕКТОР ВЫДЕЛЕННОГО ПРОЁМА НА СХЕМЕ (ДВЕРЬ / ОКНО) */}

        {selectedOpening && (() => {

          const wall = allWalls.find(w => w.id === selectedOpening.wallId);

          const op = wall?.openings.find(o => o.id === selectedOpening.openingId);

          if (!wall || !op) return null;



          const angle = Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x);

          const opWorld = {

            x: wall.start.x + Math.cos(angle) * op.offsetMeters,

            y: wall.start.y + Math.sin(angle) * op.offsetMeters

          };

          const opScreen = worldToScreen(opWorld.x, opWorld.y);



          return (

            <div

              style={{

                position: 'absolute',

                left: `${opScreen.x}px`,

                top: `${opScreen.y - 45}px`,

                transform: 'translate(-50%, -50%)',

              }}

              className="z-30 bg-white/95 text-slate-800 border border-slate-300 rounded-xl shadow-xl p-2 flex items-center gap-2 text-xs font-medium pointer-events-auto animate-in fade-in zoom-in-95"

            >

              <div className="flex items-center gap-1.5 font-bold text-slate-900 pr-1 border-r border-slate-200">

                {op.type === 'door' ? (

                  <DoorOpen className="w-4 h-4 text-orange-600" />

                ) : (

                  <LayoutGrid className="w-4 h-4 text-sky-600" />

                )}

                <span>{op.type === 'door' ? 'Дверь' : 'Окно'}</span>

              </div>



              {/* Ширина */}

              <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">

                <span className="text-[10px] text-slate-500 font-bold">Ш:</span>

                <input

                  type="number"

                  step="0.05"

                  min="0.3"

                  max="3.5"

                  value={op.width}

                  onChange={(e) => {

                    const val = parseFloat(e.target.value) || 0.8;

                    updateOpeningParams(wall.id, op.id, { width: val });

                  }}

                  className="w-12 text-center text-xs font-mono font-bold bg-white border border-slate-300 rounded px-1 py-0.5"

                />

                <span className="text-[10px] text-slate-400">м</span>

              </div>



              {/* Высота */}

              <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">

                <span className="text-[10px] text-slate-500 font-bold">В:</span>

                <input

                  type="number"

                  step="0.05"

                  min="0.4"

                  max="3.5"

                  value={op.height}

                  onChange={(e) => {

                    const val = parseFloat(e.target.value) || (op.type === 'door' ? 2.05 : 1.40);

                    updateOpeningParams(wall.id, op.id, { height: val });

                  }}

                  className="w-12 text-center text-xs font-mono font-bold bg-white border border-slate-300 rounded px-1 py-0.5"

                />

                <span className="text-[10px] text-slate-400">м</span>

              </div>



              {/* Переключатели стороны открывания для двери */}

              {op.type === 'door' && (

                <div className="flex items-center gap-1 pl-1 border-l border-slate-200">

                  <button

                    type="button"

                    onClick={() => updateOpeningParams(wall.id, op.id, { doorSwingInside: !op.doorSwingInside })}

                    className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold cursor-pointer"

                    title="Переключить открывание (внутрь/наружу)"

                  >

                    {op.doorSwingInside ? 'Внутрь' : 'Наружу'}

                  </button>

                  <button

                    type="button"

                    onClick={() => updateOpeningParams(wall.id, op.id, { doorHingeLeft: !op.doorHingeLeft })}

                    className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold cursor-pointer"

                    title="Переключить петли (слева/справа)"

                  >

                    {op.doorHingeLeft ? 'Петли L' : 'Петли R'}

                  </button>

                </div>

              )}



              {/* Удалить */}

              <button

                type="button"

                onClick={() => {

                  deleteOpening(wall.id, op.id);

                  setSelectedOpening(null);

                }}

                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer transition-colors ml-1"

                title="Удалить проём [Del]"

              >

                <Trash2 className="w-3.5 h-3.5" />

              </button>



              {/* Закрыть панель */}

              <button

                type="button"

                onClick={() => setSelectedOpening(null)}

                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded cursor-pointer transition-colors"

                title="Закрыть [Esc]"

              >

                <X className="w-3.5 h-3.5" />

              </button>

            </div>

          );

        })()}



        {/* 4. Замыкание в первую точку */}

        {isSnapToClose && (

          <div

            style={{

              position: 'absolute',

              left: `${worldToScreen(snappedCursor.x, snappedCursor.y).x}px`,

              top: `${worldToScreen(snappedCursor.x, snappedCursor.y).y - 36}px`,

              transform: 'translate(-50%, -50%)',

            }}

            className="z-30 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-lg animate-bounce pointer-events-none flex items-center gap-1"

          >

            <CheckCircle2 className="w-3.5 h-3.5" />

            <span>Кликните, чтобы замкнуть комнату</span>

          </div>

        )}



        {/* 5. Марки комнат на свободном месте плана (компактные по ГОСТ, уменьшенные в 2 раза) */}

        {activeRooms.map(room => {

          if (room.isShaft) return null; // вентканалы перечеркнуты крестом X по ГОСТ, без лишних плашек



          const roomObstacles = fixtures.filter(f => f.roomId === room.id).map(f => ({ x: f.x, y: f.y }));

          const bestLabelPoint = room.labelPosition || findBestInteriorRoomLabelPoint(room.points, roomObstacles);

          const screenPos = worldToScreen(bestLabelPoint.x, bestLabelPoint.y);



          return (

            <div

              key={room.id}

              onDoubleClick={(e) => {

                e.stopPropagation();

                if (onOpenRoomFinishes) {

                  onOpenRoomFinishes(room);

                }

              }}

              onMouseDown={(e) => {

                if (e.button === 0 && canvasRef.current) {

                  const rect = canvasRef.current.getBoundingClientRect();

                  const rawW = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);

                  setDraggingRoomLabelId(room.id);

                  setRoomLabelDragOffset({

                    x: bestLabelPoint.x - rawW.x,

                    y: bestLabelPoint.y - rawW.y

                  });

                }

              }}

              onContextMenu={(e) => {

                e.preventDefault();

                e.stopPropagation();

                const canvas = canvasRef.current;

                if (!canvas) return;

                const rect = canvas.getBoundingClientRect();

                setContextMenu({

                  visible: true,

                  screenPos: { x: e.clientX - rect.left, y: e.clientY - rect.top },

                  worldPos: bestLabelPoint,

                  targetFixture: null,

                  targetOpening: null,

                  targetVertex: null,

                  targetWall: null,

                  targetRoom: room,

                  offsetAlongWall: 0

                });

              }}

              style={{
                position: 'absolute',
                left: `${screenPos.x}px`,
                top: `${screenPos.y}px`,
                transform: 'translate(-50%, -50%)',
                padding: `${Math.round(2 * fontScaleFactor)}px ${Math.round(6 * fontScaleFactor)}px`
              }}
              className={`z-10 text-center cursor-pointer select-none rounded-md border pointer-events-auto transition-transform hover:scale-105 shadow-xs ${
                room.id === selectedRoomId 
                  ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-400' 
                  : 'bg-white/95 border-slate-300 hover:border-blue-400'
              }`}

              title="Двойной клик — выбор отделки и работ; перетаскивание ЛКМ; ПКМ — меню параметров"

            >

              <div

                style={{ fontSize: `${Math.round(11 * fontScaleFactor)}px` }}

                className="font-bold text-slate-800 tracking-tight leading-tight"

              >

                {room.name}

              </div>

              <div

                style={{ fontSize: `${Math.round(10 * fontScaleFactor)}px` }}

                className="font-mono font-bold text-blue-700 leading-tight"

              >

                {room.floorArea} м²

              </div>

            </div>

          );

        })}



        {/* 6. Контекстное меню ПКМ */}

        {/* УНИВЕРСАЛЬНОЕ ОКНО РЕДАКТИРОВАНИЯ И ИНФОРМАЦИИ ПО ОБЪЕКТУ (ПКМ) */}

        {contextMenu.visible && (

          <div

            style={{

              position: 'absolute',

              left: `${Math.min(contextMenu.screenPos.x, (canvasRef.current?.clientWidth || 800) - 340)}px`,

              top: `${Math.min(contextMenu.screenPos.y, (canvasRef.current?.clientHeight || 600) - 440)}px`,

            }}

            onContextMenu={(e) => {

              e.preventDefault();

              e.stopPropagation();

            }}

            className="z-50 bg-white rounded-2xl shadow-2xl border border-slate-300 w-80 text-xs font-medium text-slate-700 animate-in fade-in zoom-in-95 pointer-events-auto overflow-hidden flex flex-col"

          >

            {/* 1. ИНСПЕКТОР ОБОЗНАЧЕНИЯ (РОЗЕТКА, ВЫКЛЮЧАТЕЛЬ, САНТЕХНИКА, КУХНЯ, ВАННАЯ, СТОЯКИ) */}

            {contextMenu.targetFixture ? (

              <div>

                <div className="p-3.5 bg-slate-100 text-slate-800 border-b border-slate-200 flex items-center justify-between shrink-0">

                  <div className="flex items-center gap-2.5 min-w-0">

                    <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">

                      <Zap className="w-4 h-4 text-amber-500 fill-amber-400" />

                    </div>

                    <div className="min-w-0">

                      <h4 className="font-bold text-sm tracking-tight text-slate-900 truncate">

                        {contextMenu.targetFixture.name}

                      </h4>

                      <div className="flex items-center gap-1.5 mt-0.5">

                        <span className="text-[10px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-200">

                          {contextMenu.targetFixture.category === 'electric' ? '⚡ Электрика' : contextMenu.targetFixture.category === 'plumbing' ? '🚰 Сантехника' : contextMenu.targetFixture.category === 'kitchen' ? '🍳 Кухня' : contextMenu.targetFixture.category === 'bathroom' ? '🛁 Ванная' : contextMenu.targetFixture.category === 'climate' ? '❄️ Климат' : '🔘 Стояк'}

                        </span>

                        <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">

                          {contextMenu.targetFixture.rotationDeg}°

                        </span>

                      </div>

                    </div>

                  </div>

                  <button

                    onClick={() => setContextMenu(prev => ({ ...prev, visible: false }))}

                    className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"

                    title="Закрыть окно [Esc]"

                  >

                    <X className="w-4 h-4" />

                  </button>

                </div>



                <div className="p-3.5 space-y-2.5 bg-slate-50">

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs text-[11px] flex justify-between items-center">

                    <span className="text-slate-500 font-medium">Габариты изделия:</span>

                    <span className="font-mono font-bold text-slate-800">

                      {Math.round(contextMenu.targetFixture.width * 1000)} × {Math.round(contextMenu.targetFixture.height * 1000)} мм

                    </span>

                  </div>



                  {/* Привязка к углу стены */}

                  {contextMenu.targetFixture.wallId && (

                    <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">

                      <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Привязка к углу стены:</span>

                      <div className="flex items-center gap-1.5">

                        <input

                          type="number"

                          step="0.05"

                          min="0.05"

                          value={fixtureCornerInput !== '' ? fixtureCornerInput : (contextMenu.targetFixture.distanceFromCorner || 0).toFixed(2)}

                          onChange={(e) => setFixtureCornerInput(e.target.value)}

                          className="w-20 px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-xs"

                        />

                        <span className="text-slate-500 text-xs">м</span>

                        <button

                          onClick={() => applyFixtureDistance(contextMenu.targetFixture!, parseFloat(fixtureCornerInput || String(contextMenu.targetFixture!.distanceFromCorner || 0.5)))}

                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer"

                        >

                          Применить

                        </button>

                      </div>

                    </div>

                  )}



                  {/* Высота от чистого пола h */}

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">

                    <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Высота от пола (h):</span>

                    <div className="flex items-center gap-1.5">

                      <input

                        type="number"

                        step="0.05"

                        min="0"

                        max="4.0"

                        value={contextMenu.targetFixture.installationHeight ?? getFixtureDefinition(contextMenu.targetFixture.type).defaultHeightFromFloor}

                        onChange={(e) => {

                          const val = parseFloat(e.target.value) || 0;

                          updateFixtureHeight(contextMenu.targetFixture!.id, val);

                        }}

                        className="w-20 px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-xs"

                      />

                      <span className="text-slate-500 text-xs font-bold">м</span>

                    </div>

                    <div className="flex flex-wrap gap-1 pt-0.5">

                      {[0.30, 0.90, 1.05, 2.20].map(hVal => (

                        <button

                          key={hVal}

                          onClick={() => updateFixtureHeight(contextMenu.targetFixture!.id, hVal)}

                          className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-[10px] font-mono font-bold border border-slate-200 transition-colors cursor-pointer"

                        >

                          {hVal.toFixed(2)}м

                        </button>

                      ))}

                    </div>

                  </div>



                  <div className="space-y-1.5 pt-1">

                    <button

                      onClick={() => {

                        const fid = contextMenu.targetFixture!.id;

                        setFixtures(prev => prev.map(f => f.id === fid ? { ...f, rotationDeg: (f.rotationDeg + 90) % 360 } : f));

                        setContextMenu(prev => prev.targetFixture ? {

                          ...prev,

                          targetFixture: { ...prev.targetFixture, rotationDeg: (prev.targetFixture.rotationDeg + 90) % 360 }

                        } : prev);

                        showToast('🔄 Повёрнуто на 90° [R]');

                      }}

                      className="w-full py-1.5 px-3 bg-white hover:bg-blue-50 text-blue-700 font-bold rounded-xl flex items-center justify-center gap-1.5 border border-slate-200 hover:border-blue-300 transition-colors cursor-pointer"

                    >

                      <RotateCw className="w-3.5 h-3.5" />

                      <span>Повернуть на 90° [R]</span>

                    </button>

                    <button

                      onClick={() => {

                        const fid = contextMenu.targetFixture!.id;

                        setFixtures(prev => prev.filter(f => f.id !== fid));

                        if (selectedFixtureId === fid) setSelectedFixtureId(null);

                        setContextMenu(prev => ({ ...prev, visible: false }));

                        showToast('🗑 Обозначение удалено');

                      }}

                      className="w-full py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl flex items-center justify-center gap-1.5 border border-red-200 transition-colors cursor-pointer"

                    >

                      <Trash2 className="w-3.5 h-3.5" />

                      <span>Удалить обозначение [Del]</span>

                    </button>

                  </div>

                </div>

              </div>

            ) : contextMenu.targetOpening ? (

              /* 2. ИНСПЕКТОР ПРОЁМА (ДВЕРЬ / ОКНО) */

              <div>

                <div className="p-3.5 bg-slate-100 text-slate-800 border-b border-slate-200 flex items-center justify-between shrink-0">

                  <div className="flex items-center gap-2.5 min-w-0">

                    <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0">

                      {contextMenu.targetOpening.opening.type === 'door' ? (

                        <DoorOpen className="w-4 h-4 text-orange-600" />

                      ) : (

                        <LayoutGrid className="w-4 h-4 text-sky-600" />

                      )}

                    </div>

                    <div className="min-w-0">

                      <h4 className="font-bold text-sm tracking-tight text-slate-900 truncate">

                        {contextMenu.targetOpening.opening.type === 'door' ? 'Дверной проём' : 'Оконный блок'}

                      </h4>

                      <div className="flex items-center gap-1.5 mt-0.5">

                        <span className="text-[10px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-200">

                          {contextMenu.targetOpening.opening.type === 'door' ? 'Дверь' : 'Окно'}

                        </span>

                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">

                          {(contextMenu.targetOpening.opening.width * contextMenu.targetOpening.opening.height).toFixed(2)} м²

                        </span>

                      </div>

                    </div>

                  </div>

                  <button

                    onClick={() => setContextMenu(prev => ({ ...prev, visible: false }))}

                    className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"

                    title="Закрыть окно [Esc]"

                  >

                    <X className="w-4 h-4" />

                  </button>

                </div>



                <div className="p-3.5 space-y-2.5 bg-slate-50">

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">

                    <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Размеры проёма:</span>

                    <div className="grid grid-cols-2 gap-2">

                      <div>

                        <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Ширина (м)</label>

                        <input

                          type="number"

                          step="0.05"

                          min="0.3"

                          max="3.5"

                          value={contextMenu.targetOpening.opening.width}

                          onChange={(e) => {

                            const val = parseFloat(e.target.value) || 0.8;

                            updateOpeningParams(contextMenu.targetOpening!.wall.id, contextMenu.targetOpening!.opening.id, { width: val });

                            setContextMenu(prev => prev.targetOpening ? {

                              ...prev,

                              targetOpening: {

                                ...prev.targetOpening,

                                opening: { ...prev.targetOpening.opening, width: val }

                              }

                            } : prev);

                          }}

                          className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-xs"

                        />

                      </div>

                      <div>

                        <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Высота (м)</label>

                        <input

                          type="number"

                          step="0.05"

                          min="0.3"

                          max="3.5"

                          value={contextMenu.targetOpening.opening.height}

                          onChange={(e) => {

                            const val = parseFloat(e.target.value) || 2.05;

                            updateOpeningParams(contextMenu.targetOpening!.wall.id, contextMenu.targetOpening!.opening.id, { height: val });

                            setContextMenu(prev => prev.targetOpening ? {

                              ...prev,

                              targetOpening: {

                                ...prev.targetOpening,

                                opening: { ...prev.targetOpening.opening, height: val }

                              }

                            } : prev);

                          }}

                          className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-xs"

                        />

                      </div>

                    </div>



                    {/* Выбор из пресетов для Окна */}

                    {contextMenu.targetOpening.opening.type === 'window' && windowPresets.length > 0 && (

                      <div className="pt-2 border-t border-slate-100">

                        <label className="text-[10px] text-slate-500 font-bold block mb-1">Пресет из каталога окон:</label>

                        <select

                          onChange={(e) => {

                            const p = windowPresets.find(item => item.id === e.target.value);

                            if (p) {

                              updateOpeningParams(contextMenu.targetOpening!.wall.id, contextMenu.targetOpening!.opening.id, {

                                width: p.width,

                                height: p.height

                              });

                              setContextMenu(prev => prev.targetOpening ? {

                                ...prev,

                                targetOpening: {

                                  ...prev.targetOpening,

                                  opening: { ...prev.targetOpening.opening, width: p.width, height: p.height }

                                }

                              } : prev);

                            }

                          }}

                          className="w-full text-[11px] bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 truncate font-medium"

                        >

                          <option value="">Выбрать размер из каталога...</option>

                          {windowPresets.map(p => (

                            <option key={p.id} value={p.id}>

                              {p.label}

                            </option>

                          ))}

                        </select>

                      </div>

                    )}



                    {/* Сброс размеров двери к стандарту проекта */}

                    {contextMenu.targetOpening.opening.type === 'door' && (

                      <div className="pt-2 border-t border-slate-100">

                        <button

                          type="button"

                          onClick={() => {

                            updateOpeningParams(contextMenu.targetOpening!.wall.id, contextMenu.targetOpening!.opening.id, {

                              width: doorDefaultWidth,

                              height: doorDefaultHeight

                            });

                            setContextMenu(prev => prev.targetOpening ? {

                              ...prev,

                              targetOpening: {

                                ...prev.targetOpening,

                                opening: { ...prev.targetOpening.opening, width: doorDefaultWidth, height: doorDefaultHeight }

                              }

                            } : prev);

                            showToast(`Установлены стандартные размеры из проекта: ${doorDefaultWidth}×${doorDefaultHeight}м`);

                          }}

                          className="w-full py-1.5 px-2 text-[11px] text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors font-bold text-center cursor-pointer"

                        >

                          Из проекта (${doorDefaultWidth}×${doorDefaultHeight}м)

                        </button>

                      </div>

                    )}

                  </div>



                  {contextMenu.targetOpening.opening.type === 'door' && (

                    <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">

                      <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Направление открывания:</span>

                      <div className="grid grid-cols-2 gap-1.5 text-[11px]">

                        <button

                          onClick={() => {

                            const cur = contextMenu.targetOpening!.opening.doorSwingInside;

                            updateOpeningParams(contextMenu.targetOpening!.wall.id, contextMenu.targetOpening!.opening.id, { doorSwingInside: !cur });

                            setContextMenu(prev => prev.targetOpening ? {

                              ...prev,

                              targetOpening: { ...prev.targetOpening, opening: { ...prev.targetOpening.opening, doorSwingInside: !cur } }

                            } : prev);

                          }}

                          className="py-1.5 px-2 rounded-lg border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-900 font-semibold cursor-pointer text-center"

                        >

                          {contextMenu.targetOpening.opening.doorSwingInside ? 'Внутрь' : 'Наружу'}

                        </button>

                        <button

                          onClick={() => {

                            const cur = contextMenu.targetOpening!.opening.doorHingeLeft;

                            updateOpeningParams(contextMenu.targetOpening!.wall.id, contextMenu.targetOpening!.opening.id, { doorHingeLeft: !cur });

                            setContextMenu(prev => prev.targetOpening ? {

                              ...prev,

                              targetOpening: { ...prev.targetOpening, opening: { ...prev.targetOpening.opening, doorHingeLeft: !cur } }

                            } : prev);

                          }}

                          className="py-1.5 px-2 rounded-lg border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-900 font-semibold cursor-pointer text-center"

                        >

                          {contextMenu.targetOpening.opening.doorHingeLeft ? 'Слева петли' : 'Справа петли'}

                        </button>

                      </div>

                    </div>

                  )}



                  <div className="pt-1">

                    <button

                      onClick={() => {

                        deleteOpening(contextMenu.targetOpening!.wall.id, contextMenu.targetOpening!.opening.id);

                        setContextMenu(prev => ({ ...prev, visible: false }));

                        showToast('🗑 Проём удален');

                      }}

                      className="w-full py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl flex items-center justify-center gap-1.5 border border-red-200 transition-colors cursor-pointer"

                    >

                      <Trash2 className="w-3.5 h-3.5" />

                      <span>Удалить проём [Del]</span>

                    </button>

                  </div>

                </div>

              </div>

            ) : contextMenu.targetWall ? (

              /* 3. ИНСПЕКТОР СТЕНЫ */

              <div>

                <div className="p-3.5 bg-slate-100 text-slate-800 border-b border-slate-200 flex items-center justify-between shrink-0">

                  <div className="flex items-center gap-2.5 min-w-0">

                    <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">

                      <Ruler className="w-4 h-4 text-blue-600" />

                    </div>

                    <div className="min-w-0">

                      <h4 className="font-bold text-sm tracking-tight text-slate-900 truncate">

                        Параметры стены

                      </h4>

                      <div className="flex items-center gap-1.5 mt-0.5">

                        <span className="text-[10px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-200">

                          Толщина {Math.round((contextMenu.targetWall.thickness || 0.15) * 1000)} мм

                        </span>

                        <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">

                          {distance(contextMenu.targetWall.start, contextMenu.targetWall.end).toFixed(2)} м

                        </span>

                      </div>

                    </div>

                  </div>

                  <button

                    onClick={() => setContextMenu(prev => ({ ...prev, visible: false }))}

                    className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"

                    title="Закрыть окно [Esc]"

                  >

                    <X className="w-4 h-4" />

                  </button>

                </div>



                <div className="p-3.5 space-y-2.5 bg-slate-50">

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">

                    <label className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Длина стены:</label>

                    <div className="flex items-center gap-1.5">

                      <input

                        type="text"

                        value={editWallLengthInput}

                        onChange={(e) => setEditWallLengthInput(e.target.value)}

                        className="w-20 px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-xs"

                      />

                      <span className="text-slate-500 text-xs font-bold">м</span>

                      <button

                        onClick={() => {

                          const num = parseFloat(editWallLengthInput.replace(',', '.'));

                          if (!isNaN(num) && num > 0.1) {

                            handleResizeRoomWall(contextMenu.targetWall!.id, num);

                            showToast(`Длина стены изменена на ${num.toFixed(2)} м`);

                          }

                        }}

                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer"

                      >

                        Применить

                      </button>

                    </div>

                  </div>



                  <div className="space-y-1.5">

                    <button

                      onClick={() => addOpeningToWall(contextMenu.targetWall!.id, 'door', doorDefaultWidth, doorDefaultHeight, contextMenu.offsetAlongWall)}

                      className="w-full px-3 py-1.5 bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-300 rounded-xl flex items-center gap-2 text-left transition-colors cursor-pointer font-medium"

                    >

                      <DoorOpen className="w-4 h-4 text-orange-500" />

                      <span>Вставить дверь ({doorDefaultWidth}×{doorDefaultHeight}м)</span>

                    </button>

                    <button

                      onClick={() => addOpeningToWall(contextMenu.targetWall!.id, 'window', windowWidth, windowHeight, contextMenu.offsetAlongWall)}

                      className="w-full px-3 py-1.5 bg-white hover:bg-sky-50 border border-slate-200 hover:border-sky-300 rounded-xl flex items-center gap-2 text-left transition-colors cursor-pointer font-medium"

                    >

                      <LayoutGrid className="w-4 h-4 text-sky-500" />

                      <span>Вставить окно ({windowWidth}×{windowHeight}м)</span>

                    </button>

                    <button

                      onClick={() => {

                        const w = contextMenu.targetWall!;

                        const midPt = { x: (w.start.x + w.end.x) / 2, y: (w.start.y + w.end.y) / 2 };

                        const [w1, w2] = splitWallAtPoint(w, midPt);

                        const updated = allWalls.flatMap(item => item.id === w.id ? [w1, w2] : [item]);

                        setAllWalls(updated);

                        updateRoomsFromWalls(updated);

                        setContextMenu(prev => ({ ...prev, visible: false }));

                        showToast('✂️ Стена разделена пополам, создана точка');

                      }}

                      className="w-full px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-2 text-left transition-colors cursor-pointer text-[11px]"

                    >

                      <span>✂️ Разделить стену пополам</span>

                    </button>

                  </div>



                  <div className="pt-1">

                    <button

                      onClick={() => {

                        deleteWall(contextMenu.targetWall!.id);

                        setContextMenu(prev => ({ ...prev, visible: false }));

                      }}

                      className="w-full py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl flex items-center justify-center gap-1.5 border border-red-200 transition-colors cursor-pointer"

                    >

                      <Trash2 className="w-3.5 h-3.5" />

                      <span>Удалить стену [Del]</span>

                    </button>

                  </div>

                </div>

              </div>

            ) : contextMenu.targetVertex ? (

              /* 4. ИНСПЕКТОР ВЕРШИНЫ (УГЛОВОЙ ИЛИ ПРОМЕЖУТОЧНОЙ ТОЧКИ) */

              <div>

                <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">

                  <div className="flex items-center gap-2.5 min-w-0">

                    <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">

                      <Target className="w-4 h-4 text-emerald-400" />

                    </div>

                    <div className="min-w-0">

                      <h4 className="font-bold text-sm tracking-tight text-white truncate">

                        Точка на чертеже

                      </h4>

                      <div className="flex items-center gap-1.5 mt-0.5">

                        <span className="text-[10px] font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">

                          {isVertexOnStraightLine(contextMenu.targetVertex) ? 'На прямой стене' : 'Угловая вершина'}

                        </span>

                      </div>

                    </div>

                  </div>

                  <button

                    onClick={() => setContextMenu(prev => ({ ...prev, visible: false }))}

                    className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"

                    title="Закрыть окно [Esc]"

                  >

                    <X className="w-4 h-4" />

                  </button>

                </div>



                <div className="p-3.5 space-y-2.5 bg-slate-50">

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs text-[11px] space-y-1">

                    <div className="flex justify-between">

                      <span className="text-slate-500 font-medium">Координаты точки:</span>

                      <span className="font-mono font-bold text-slate-800">

                        ({contextMenu.targetVertex.x.toFixed(2)}, {contextMenu.targetVertex.y.toFixed(2)}) м

                      </span>

                    </div>

                  </div>



                  <div className="space-y-1.5">

                    {isVertexOnStraightLine(contextMenu.targetVertex) ? (

                      <button

                        onClick={() => {

                          deleteVertex(contextMenu.targetVertex!, 'dissolve');

                          setContextMenu(prev => ({ ...prev, visible: false }));

                          showToast('🔗 Точка растворена, стена объединена');

                        }}

                        className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"

                      >

                        <Maximize2 className="w-3.5 h-3.5" />

                        <span>Растворить точку (объединить) [Del]</span>

                      </button>

                    ) : (

                      <>

                        <button

                          onClick={() => {

                            deleteVertex(contextMenu.targetVertex!, 'remove_corner');

                            setContextMenu(prev => ({ ...prev, visible: false }));

                            showToast('🗑 Угол и стены удалены');

                          }}

                          className="w-full py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl flex items-center justify-center gap-1.5 border border-red-200 transition-colors cursor-pointer"

                        >

                          <Trash2 className="w-3.5 h-3.5" />

                          <span>Удалить угол [Del]</span>

                        </button>

                        <button

                          onClick={() => {

                            deleteVertex(contextMenu.targetVertex!, 'dissolve');

                            setContextMenu(prev => ({ ...prev, visible: false }));

                            showToast('🔗 Угол срезан, концы соединены');

                          }}

                          className="w-full py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl flex items-center justify-center gap-1.5 border border-slate-200 transition-colors cursor-pointer text-[11px]"

                        >

                          <span>Соединить смежные концы напрямую</span>

                        </button>

                      </>

                    )}

                  </div>

                </div>

              </div>

            ) : contextMenu.targetRoom ? (

              /* 5. ИНСПЕКТОР КОМНАТЫ */

              <div>

                <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">

                  <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">

                    <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">

                      <Layers className="w-4 h-4 text-indigo-400" />

                    </div>

                    <div className="min-w-0 flex-1">

                      {editingRoomId === contextMenu.targetRoom.id ? (

                        <div className="flex items-center gap-1">

                          <input

                            type="text"

                            value={editingRoomName}

                            onChange={(e) => setEditingRoomName(e.target.value)}

                            className="w-full text-xs font-bold text-slate-900 bg-white border border-blue-400 rounded-lg px-2 py-0.5"

                            autoFocus

                            onKeyDown={(e) => {

                              if (e.key === 'Enter') {

                                const updated = rooms.map(r => r.id === contextMenu.targetRoom!.id ? { ...r, name: editingRoomName } : r);

                                setRooms(updated);

                                if (onRoomsUpdated) onRoomsUpdated(updated);

                                setContextMenu(prev => prev.targetRoom ? { ...prev, targetRoom: { ...prev.targetRoom, name: editingRoomName } } : prev);

                                setEditingRoomId(null);

                              }

                            }}

                          />

                          <button

                            onClick={() => {

                              const updated = rooms.map(r => r.id === contextMenu.targetRoom!.id ? { ...r, name: editingRoomName } : r);

                              setRooms(updated);

                              if (onRoomsUpdated) onRoomsUpdated(updated);

                              setContextMenu(prev => prev.targetRoom ? { ...prev, targetRoom: { ...prev.targetRoom, name: editingRoomName } } : prev);

                              setEditingRoomId(null);

                            }}

                            className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg p-1 cursor-pointer shrink-0"

                          >

                            <CheckCircle2 className="w-3.5 h-3.5" />

                          </button>

                        </div>

                      ) : (

                        <div className="flex items-center gap-1.5 truncate">

                          <h4 className="font-bold text-sm tracking-tight text-white truncate">

                            {contextMenu.targetRoom.name}

                          </h4>

                          <button

                            onClick={() => {

                              setEditingRoomId(contextMenu.targetRoom!.id);

                              setEditingRoomName(contextMenu.targetRoom!.name);

                            }}

                            className="p-0.5 text-slate-400 hover:text-white rounded cursor-pointer shrink-0"

                            title="Переименовать помещение"

                          >

                            <Pencil className="w-3 h-3" />

                          </button>

                        </div>

                      )}

                      <span className="text-[10px] font-mono text-emerald-400 block mt-0.5">

                        {contextMenu.targetRoom.floorArea} м² · h={contextMenu.targetRoom.ceilingHeight || ceilingHeight}м

                      </span>

                    </div>

                  </div>

                  <button

                    onClick={() => setContextMenu(prev => ({ ...prev, visible: false }))}

                    className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"

                    title="Закрыть окно [Esc]"

                  >

                    <X className="w-4 h-4" />

                  </button>

                </div>



                <div className="p-3.5 space-y-2.5 bg-slate-50 max-h-[70vh] overflow-y-auto">

                  {/* КНОПКА ВЫБОРА ОТДЕЛКИ И РАБОТ */}

                  <button

                    type="button"

                    onClick={() => {

                      const r = contextMenu.targetRoom!;

                      setContextMenu(prev => ({ ...prev, visible: false }));

                      if (onOpenRoomFinishes) {

                        onOpenRoomFinishes(r);

                      }

                    }}

                    className="w-full py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-98 cursor-pointer text-xs"

                  >

                    <Layers className="w-4 h-4" />

                    <span>🛠️ Выбрать отделку и работы комнаты</span>

                  </button>



                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-1 text-[11px] font-mono">

                    <div className="flex justify-between font-bold text-slate-800">

                      <span className="font-sans text-slate-600">Площадь пола / потолка:</span>

                      <span className="text-blue-700">{contextMenu.targetRoom.floorArea} м²</span>

                    </div>

                    <div className="flex justify-between text-slate-600">

                      <span className="font-sans">Периметр комнаты:</span>

                      <span>{contextMenu.targetRoom.perimeter} м</span>

                    </div>

                    <div className="flex justify-between text-slate-600">

                      <span className="font-sans">Высота потолка:</span>

                      <span>{contextMenu.targetRoom.ceilingHeight || ceilingHeight} м</span>

                    </div>

                    <div className="flex justify-between text-slate-500 text-[10px]">

                      <span className="font-sans">Площадь стен (брутто):</span>

                      <span>{contextMenu.targetRoom.wallGrossArea} м²</span>

                    </div>

                    {contextMenu.targetRoom.openingsTotalArea > 0 && (

                      <div className="flex justify-between text-amber-700 text-[10px]">

                        <span className="font-sans">Вычет проёмов:</span>

                        <span className="font-bold">-{contextMenu.targetRoom.openingsTotalArea} м²</span>

                      </div>

                    )}

                    <div className="flex justify-between font-bold text-slate-900 border-t border-slate-100 pt-1">

                      <span className="font-sans text-emerald-800">Стены под отделку (чистые):</span>

                      <span className="text-emerald-700">{contextMenu.targetRoom.wallNetArea} м²</span>

                    </div>

                  </div>



                  {/* Двери и окна комнаты */}

                  {((contextMenu.targetRoom.doorsCount ?? 0) > 0 || (contextMenu.targetRoom.windowsCount ?? 0) > 0) && (

                    <div className="space-y-1 text-[11px]">

                      {(contextMenu.targetRoom.doorsCount ?? 0) > 0 && (

                        <div className="bg-orange-50 rounded-xl p-2 border border-orange-200/70 text-orange-950 flex items-center justify-between">

                          <span className="flex items-center gap-1 font-semibold">

                            <DoorOpen className="w-3.5 h-3.5 text-orange-600" />

                            Двери: {contextMenu.targetRoom.doorsCount} шт

                          </span>

                          <span className="font-mono font-bold">{contextMenu.targetRoom.doorsArea?.toFixed(2)} м²</span>

                        </div>

                      )}

                      {(contextMenu.targetRoom.windowsCount ?? 0) > 0 && (

                        <div className="bg-sky-50 rounded-xl p-2 border border-sky-200/70 text-sky-950 flex items-center justify-between">

                          <span className="flex items-center gap-1 font-semibold">

                            <LayoutGrid className="w-3.5 h-3.5 text-sky-600" />

                            Окна: {contextMenu.targetRoom.windowsCount} шт

                          </span>

                          <span className="font-mono font-bold">{contextMenu.targetRoom.windowsArea?.toFixed(2)} м²</span>

                        </div>

                      )}

                    </div>

                  )}



                  {/* ПЕРЕКЛЮЧАТЕЛЬ: ЖИЛОЕ ПОМЕЩЕНИЕ vs ВЕНТКАНАЛ / КОРОБ / ШАХТА (X) */}

                  <div className="pt-1">

                    <button

                      type="button"

                      onClick={() => {

                        const target = contextMenu.targetRoom;

                        if (!target) return;

                        const nextShaft = !target.isShaft;

                        setRooms(prev => prev.map(r => r.id === target.id ? {

                          ...r,

                          isShaft: nextShaft,

                          name: nextShaft 

                            ? (r.name.includes('Вентканал') ? r.name : `Вентканал (${r.name})`) 

                            : r.name.replace(/Вентканал \((.*?)\)/, '$1')

                        } : r));

                        setContextMenu(prev => ({

                          ...prev,

                          targetRoom: prev.targetRoom ? { ...prev.targetRoom, isShaft: nextShaft } : null

                        }));

                        showToast(nextShaft ? '🔘 Помечено как вентканал / короб (крест X, исключено из сметы)' : '🏠 Помечено как жилое помещение');

                      }}

                      className={`w-full py-1.5 px-3 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${

                        contextMenu.targetRoom?.isShaft

                          ? 'bg-amber-100 text-amber-900 border-amber-300'

                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'

                      }`}

                      title="Вентканалы и шахты не имеют окон/дверей, помечаются крестом X и исключаются из отделочной сметы"

                    >

                      <span>{contextMenu.targetRoom?.isShaft ? '🔘 Вентканал / Короб [X] (исключён из сметы)' : '🏠 Жилое помещение (включено в смету)'}</span>

                    </button>

                  </div>



                  {/* Блок ручного редактирования стен комнаты */}

                  <div className="pt-1">

                    <button

                      type="button"

                      onClick={() => setExpandedRoomWallsId(prev => prev === contextMenu.targetRoom!.id ? null : contextMenu.targetRoom!.id)}

                      className="w-full py-1.5 px-2 text-[11px] font-bold text-blue-700 bg-white hover:bg-blue-50 rounded-xl border border-slate-200 hover:border-blue-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"

                    >

                      <Ruler className="w-3.5 h-3.5 text-blue-600" />

                      <span>{expandedRoomWallsId === contextMenu.targetRoom.id ? 'Скрыть длины стен' : '📐 Редактировать длины стен'}</span>

                    </button>



                    {expandedRoomWallsId === contextMenu.targetRoom.id && (

                      <div className="mt-2 space-y-1.5 bg-white p-2.5 rounded-xl border border-slate-200">

                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">

                          Стены помещения:

                        </div>

                        <div className="max-h-36 overflow-y-auto space-y-1 pr-0.5">

                          {contextMenu.targetRoom.walls.map((w, idx) => {

                            const liveWall = allWalls.find(item => item.id === w.id) || w;

                            const len = distance(liveWall.start, liveWall.end);

                            return (

                              <div

                                key={w.id}

                                className="flex items-center justify-between bg-slate-50 p-1 rounded-lg border border-slate-200 text-[11px]"

                              >

                                <span className="text-slate-600 font-medium">Стена #{idx + 1}:</span>

                                <div className="flex items-center gap-1">

                                  <input

                                    type="number"

                                    step="0.05"

                                    min="0.2"

                                    defaultValue={len.toFixed(2)}

                                    key={liveWall.id + '_' + len.toFixed(2)}

                                    onBlur={(e) => {

                                      const val = parseFloat(e.target.value.replace(',', '.'));

                                      if (!isNaN(val) && val > 0) handleResizeRoomWall(liveWall.id, val);

                                    }}

                                    onKeyDown={(e) => {

                                      if (e.key === 'Enter') {

                                        const val = parseFloat((e.target as HTMLInputElement).value.replace(',', '.'));

                                        if (!isNaN(val) && val > 0) handleResizeRoomWall(liveWall.id, val);

                                      }

                                    }}

                                    className="w-14 px-1 py-0.5 text-center font-bold font-mono text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"

                                  />

                                  <span className="text-[10px] text-slate-400 font-bold">м</span>

                                </div>

                              </div>

                            );

                          })}

                        </div>

                      </div>

                    )}

                  </div>



                  <div className="pt-1">

                    <button

                      onClick={() => {

                        setShowEstimateWindow(true);

                        setContextMenu(prev => ({ ...prev, visible: false }));

                      }}

                      className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl flex items-center justify-center gap-2 border border-emerald-300 transition-colors cursor-pointer mb-2"

                    >

                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />

                      <span>Открыть смету помещения (пироги, цены)</span>

                    </button>



                    <button

                      onClick={() => {

                        deleteRoom(contextMenu.targetRoom!.id);

                        setContextMenu(prev => ({ ...prev, visible: false }));

                        showToast('🗑 Комната удалена');

                      }}

                      className="w-full py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl flex items-center justify-center gap-2 border border-red-200 transition-colors cursor-pointer"

                    >

                      <Trash2 className="w-3.5 h-3.5" />

                      <span>Удалить комнату [Del]</span>

                    </button>

                  </div>

                </div>

              </div>

            ) : (

              /* 6. УПРАВЛЕНИЕ ЧЕРТЕЖОМ (КЛИК В ПУСТОТУ) */

              <div>

                <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">

                  <div className="flex items-center gap-2.5 min-w-0">

                    <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">

                      <LayoutGrid className="w-4 h-4 text-blue-400" />

                    </div>

                    <div>

                      <h4 className="font-bold text-sm tracking-tight text-white">

                        Управление чертежом

                      </h4>

                      <span className="text-[10px] font-mono text-slate-400 block">

                        Быстрые действия

                      </span>

                    </div>

                  </div>

                  <button

                    onClick={() => setContextMenu(prev => ({ ...prev, visible: false }))}

                    className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"

                    title="Закрыть [Esc]"

                  >

                    <X className="w-4 h-4" />

                  </button>

                </div>

                <div className="p-3.5 space-y-1.5 bg-slate-50">

                  <button

                    onClick={() => {

                      setShowFixturePalette(true);

                      setContextMenu(prev => ({ ...prev, visible: false }));

                    }}

                    className="w-full px-3 py-2 bg-white hover:bg-amber-50 text-slate-800 font-semibold flex items-center gap-2 text-left rounded-xl border border-slate-200 hover:border-amber-300 transition-colors cursor-pointer"

                  >

                    <Zap className="w-4 h-4 text-amber-500" />

                    <span>Палитра обозначений (ГОСТ)</span>

                  </button>

                  <button

                    onClick={() => {

                      setOrthoMode(prev => !prev);

                      setContextMenu(prev => ({ ...prev, visible: false }));

                    }}

                    className="w-full px-3 py-2 bg-white hover:bg-blue-50 text-slate-800 font-semibold flex items-center gap-2 text-left rounded-xl border border-slate-200 hover:border-blue-300 transition-colors cursor-pointer"

                  >

                    <Grid className="w-4 h-4 text-blue-500" />

                    <span>Режим «Орто 90°» ({orthoMode ? 'ВКЛ' : 'ВЫКЛ'})</span>

                  </button>

                  <button

                    onClick={() => {

                      setOffset({ x: 350, y: 350 });

                      setScale(70);

                      setContextMenu(prev => ({ ...prev, visible: false }));

                    }}

                    className="w-full px-3 py-2 bg-white hover:bg-slate-100 text-slate-800 font-semibold flex items-center gap-2 text-left rounded-xl border border-slate-200 transition-colors cursor-pointer"

                  >

                    <Target className="w-4 h-4 text-slate-500" />

                    <span>Сбросить вид в центр</span>

                  </button>

                  {backdrop && (

                    <button

                      type="button"

                      onClick={() => {

                        handleRemoveBackdrop();

                        setContextMenu(prev => ({ ...prev, visible: false }));

                      }}

                      className="w-full px-3 py-2 bg-white hover:bg-red-50 text-red-600 font-semibold flex items-center gap-2 text-left rounded-xl border border-slate-200 hover:border-red-300 transition-colors cursor-pointer"

                    >

                      <Trash2 className="w-4 h-4 text-red-500" />

                      <span>Удалить подложку плана</span>

                    </button>

                  )}

                  <button

                    type="button"

                    onClick={() => {

                      backdropFileInputRef.current?.click();

                      setContextMenu(prev => ({ ...prev, visible: false }));

                    }}

                    className="w-full px-3 py-2 bg-white hover:bg-indigo-50 text-indigo-700 font-semibold flex items-center gap-2 text-left rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors cursor-pointer"

                  >

                    <Upload className="w-4 h-4 text-indigo-500" />

                    <span>{backdrop ? 'Загрузить другой план' : 'Загрузить план (фото/скан)'}</span>

                  </button>

                  <div className="pt-1">

                    <button

                      onClick={() => {

                        setShowClearConfirm(true);

                        setContextMenu(prev => ({ ...prev, visible: false }));

                      }}

                      className="w-full px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl flex items-center justify-center gap-1.5 border border-red-200 transition-colors cursor-pointer"

                    >

                      <Trash2 className="w-4 h-4" />

                      <span>Очистить всё поле</span>

                    </button>

                  </div>

                </div>

              </div>

            )}

          </div>

        )}



        {/* 7. МОДАЛЬНОЕ ОКНО ОЧИСТКИ */}

        {showClearConfirm && (

          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">

            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 text-center animate-in fade-in zoom-in-95">

              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center mb-3">

                <AlertTriangle className="w-6 h-6" />

              </div>

              <h3 className="text-base font-bold text-slate-900 mb-1">

                Очистить всё поле?

              </h3>

              <p className="text-xs text-slate-500 mb-5">

                Все начерченные стены, комнаты, проёмы, обозначения и фоновая подложка плана будут удалены. Это действие можно отменить кнопкой «Назад» [Ctrl+Z].

              </p>

              <div className="flex items-center justify-center gap-3">

                <button

                  onClick={() => setShowClearConfirm(false)}

                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"

                >

                  Отмена

                </button>

                <button

                  onClick={handleClearAll}

                  className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"

                >

                  <Trash2 className="w-3.5 h-3.5" />

                  <span>Да, очистить всё</span>

                </button>

              </div>

            </div>

          </div>

        )}



        {/* ВСПЛЫВАЮЩИЙ ЖУРНАЛ ДЕЙСТВИЙ И СОВЕТЫ */}

        {showActionDrawer && (

          <div className="absolute bottom-10 right-4 z-40 w-96 max-h-[480px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2">

            <div className="p-3 bg-slate-900 text-white flex items-center justify-between">

              <div className="flex items-center gap-2 font-bold text-xs">

                <ListOrdered className="w-4 h-4 text-blue-400" />

                <span>Журнал действий и история</span>

              </div>

              <div className="flex items-center gap-1.5">

                <button

                  onClick={() => {

                    const text = actionLogs.map(l => `[${l.time}] [${l.type.toUpperCase()}] ${l.title}${l.details ? ` (${l.details})` : ''}${l.advice ? ` -> СОВЕТ: ${l.advice}` : ''}`).join('\n');

                    navigator.clipboard.writeText(text);

                    setCopiedLogs(true);

                    setTimeout(() => setCopiedLogs(false), 2000);

                  }}

                  className="px-2 py-0.5 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 flex items-center gap-1 cursor-pointer"

                  title="Скопировать весь журнал в буфер обмена"

                >

                  {copiedLogs ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}

                  <span>{copiedLogs ? 'Скопировано!' : 'Копировать'}</span>

                </button>

                <button

                  onClick={() => actionLogger.clear()}

                  className="px-2 py-0.5 text-[10px] bg-slate-800 hover:bg-red-900 text-slate-300 hover:text-red-200 rounded border border-slate-700 cursor-pointer"

                >

                  Очистить

                </button>

                <button

                  onClick={() => setShowActionDrawer(false)}

                  className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"

                >

                  <X className="w-3.5 h-3.5" />

                </button>

              </div>

            </div>



            {/* Список записей с рекомендациями */}

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-[380px] bg-slate-50 text-xs">

              {actionLogs.length === 0 ? (

                <div className="text-center text-slate-400 py-8">

                  Журнал пока пуст

                </div>

              ) : (

                actionLogs.map((log) => (

                  <div

                    key={log.id}

                    className={`p-2.5 rounded-xl border text-xs shadow-2xs transition-all ${

                      log.type === 'warning'

                        ? 'bg-amber-50/90 border-amber-200 text-amber-900'

                        : log.type === 'delete'

                        ? 'bg-red-50/80 border-red-200 text-red-900'

                        : log.type === 'draw'

                        ? 'bg-blue-50/80 border-blue-200 text-blue-900'

                        : log.type === 'click'

                        ? 'bg-white border-slate-200 text-slate-800'

                        : 'bg-white border-slate-200 text-slate-700'

                    }`}

                  >

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">

                      <span className="font-bold flex items-center gap-1">

                        {log.type === 'warning' && '⚠️ ПРЕДУПРЕЖДЕНИЕ'}

                        {log.type === 'delete' && '🗑️ УДАЛЕНИЕ'}

                        {log.type === 'draw' && '✏️ ЧЕРЧЕНИЕ'}

                        {log.type === 'click' && '🖱️ КЛИК'}

                        {log.type === 'tool' && '🔧 ИНСТРУМЕНТ'}

                        {log.type === 'key' && '⌨️ КЛАВИША'}

                        {log.type === 'info' && 'ℹ️ ИНФО'}

                      </span>

                      <span>{log.time}</span>

                    </div>



                    <div className="font-bold text-slate-900 text-xs">

                      {log.title}

                    </div>



                    {log.details && (

                      <div className="text-[11px] text-slate-600 mt-0.5">

                        {log.details}

                      </div>

                    )}



                    {log.advice && (

                      <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 text-[11px] font-medium text-emerald-800 bg-emerald-50/70 p-1.5 rounded-lg flex items-start gap-1.5">

                        <span className="text-emerald-600 font-bold shrink-0">💡 Совет:</span>

                        <span>{log.advice}</span>

                      </div>

                    )}

                  </div>

                ))

              )}

            </div>

          </div>

        )}



        {/* МОДАЛЬНОЕ ОКНО ШПАРГАЛКИ / СПРАВКИ ПО КЛАВИШАМ */}

        {showHelpModal && (

          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">

            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 text-slate-800 animate-in fade-in zoom-in-95">

              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">

                <div className="flex items-center gap-2">

                  <HelpCircle className="w-5 h-5 text-blue-600" />

                  <h2 className="text-base font-bold text-slate-900">

                    Шпаргалка и подсказки по работе в Estimate CAD

                  </h2>

                </div>

                <button

                  onClick={() => setShowHelpModal(false)}

                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"

                >

                  <X className="w-5 h-5" />

                </button>

              </div>



              <div className="space-y-4 text-xs leading-relaxed max-h-[480px] overflow-y-auto pr-1">

                <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3">

                  <h4 className="font-bold text-blue-900 mb-1 flex items-center gap-1.5 text-sm">

                    <span>✏️ 1. Как начертить комнату</span>

                  </h4>

                  <p className="text-slate-700">

                    Выберите <b>«Чертить [W]»</b>, кликайте левой кнопкой мыши последовательно по углам стен. Когда доведёте линию до первой зелёной точки (появится надпись <i>«Кликните, чтобы замкнуть»</i>), кликните — комната сформируется автоматически с расчётом площади и периметра, и программа автоматически перейдёт в режим выбора!

                  </p>

                </div>



                <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3">

                  <h4 className="font-bold text-amber-950 mb-1 flex items-center gap-1.5 text-sm">

                    <span>🗑️ 2. Как удалять стены, точки и комнаты [Delete / Backspace]</span>

                  </h4>

                  <ul className="list-disc pl-4 space-y-1 text-amber-900">

                    <li><b>Стена</b>: кликните на стену (она подсветится оранжевым) и нажмите клавишу <b>Delete</b> или красную кнопку <b>«Удалить [Del]»</b>.</li>

                    <li><b>Точка угла</b>: кликните на угол стены (появится золотое кольцо) и нажмите <b>Delete</b>.</li>

                    <li><b>При черчении</b>: если поставили точку не туда — нажмите <b>Backspace</b> или кнопку <b>«↩ Удалить точку»</b>.</li>

                    <li><b>Комната</b>: кликните по названию комнаты и нажмите иконку корзины или клавишу <b>Delete</b>.</li>

                  </ul>

                </div>



                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">

                  <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-1.5 text-sm">

                    <span>🚪 3. Двери и окна</span>

                  </h4>

                  <p className="text-slate-700">

                    Кликните по любой стене $\to$ нажмите кнопку <b>«Вставить дверь»</b> или <b>«Вставить окно»</b>. После вставки вы можете перетаскивать проём мышкой вдоль стены, менять ширину/высоту, сторону петель и направление открывания створки.

                  </p>

                </div>



                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">

                  <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5 text-sm">

                    <span>⌨️ Горячие клавиши</span>

                  </h4>

                  <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">

                    <div className="bg-white p-2 rounded border border-slate-200">

                      <span className="font-bold text-blue-600">W</span> — Режим черчения

                    </div>

                    <div className="bg-white p-2 rounded border border-slate-200">

                      <span className="font-bold text-blue-600">V</span> — Режим выбора

                    </div>

                    <div className="bg-white p-2 rounded border border-slate-200">

                      <span className="font-bold text-blue-600">H</span> / <span className="font-bold text-blue-600">Пробел</span> — Двигать полем

                    </div>

                    <div className="bg-white p-2 rounded border border-slate-200">

                      <span className="font-bold text-red-600">Delete / Backspace</span> — Удалить

                    </div>

                    <div className="bg-white p-2 rounded border border-slate-200">

                      <span className="font-bold text-slate-700">Esc / ПКМ</span> — Отмена / сброс

                    </div>

                    <div className="bg-white p-2 rounded border border-slate-200">

                      <span className="font-bold text-slate-700">Ctrl + Z</span> — Назад

                    </div>

                  </div>

                </div>

              </div>



              <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">

                <button

                  onClick={() => setShowHelpModal(false)}

                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"

                >

                  Понятно, спасибо!

                </button>

              </div>

            </div>

          </div>

        )}

        {/* ПОЛНОЭКРАННЫЙ КОНСТРУКТОР БУТЕРБРОДОВ (ПИРОГОВ) И МАТРИЧНАЯ БАЗА */}

        {/* МОДАЛЬНОЕ ОКНО ПАРАМЕТРОВ ОБОЗНАЧЕНИЯ (ДВОЙНОЙ КЛИК ПО РОЗЕТКЕ / ОТМЕТКЕ) */}
        <FixtureEditModal
          isOpen={!!editingFixtureModalTarget}
          fixture={editingFixtureModalTarget}
          walls={allWalls}
          rooms={rooms}
          onClose={() => setEditingFixtureModalTarget(null)}
          onSave={(updated) => {
            pushHistory();
            setFixtures(prev => prev.map(f => f.id === updated.id ? updated : f));
            setSelectedFixtureId(updated.id);
            showToast(`✅ Параметры «${updated.name}» сохранены`);
          }}
          onDelete={(fixtureId) => {
            pushHistory();
            setFixtures(prev => prev.filter(f => f.id !== fixtureId));
            if (selectedFixtureId === fixtureId) setSelectedFixtureId(null);
            showToast('🗑️ Обозначение удалено');
          }}
          onDuplicate={(fix) => {
            pushHistory();
            const wall = fix.wallId ? allWalls.find(w => w.id === fix.wallId) : null;
            const wallLen = wall ? distance(wall.start, wall.end) : 0;
            const newDist = wallLen > 0 ? Math.min(wallLen - 0.1, (fix.distanceFromCorner || 0.5) + 0.20) : (fix.distanceFromCorner || 0.5);
            let newX = fix.x + 0.20;
            let newY = fix.y;
            if (wall && wallLen > 0) {
              const t = newDist / wallLen;
              newX = wall.start.x + (wall.end.x - wall.start.x) * t;
              newY = wall.start.y + (wall.end.y - wall.start.y) * t;
            }
            const duplicated: Fixture = {
              ...fix,
              id: `fix_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              x: newX,
              y: newY,
              distanceFromCorner: Number(newDist.toFixed(3)),
            };
            setFixtures(prev => [...prev, duplicated]);
            setSelectedFixtureId(duplicated.id);
            showToast(`📋 Создана копия «${duplicated.name}» (+200 мм)`);
          }}
        />

        {/* МОДАЛЬНОЕ ОКНО ПРОВЕРКИ И РЕДАКТИРОВАНИЯ РАСПОЗНАННЫХ КОМНАТ С ЧЕРТЕЖА */}
        <DetectedRoomsModal
          isOpen={isDetectedModalOpen}
          onClose={() => setIsDetectedModalOpen(false)}
          detectedRooms={rawDetectedRooms}
          globalCeilingHeight={ceilingHeight}
          onApplyToSurvey={(appliedRooms) => {
            try {
              localStorage.setItem('estimate_cad_imported_rooms', JSON.stringify(appliedRooms));
            } catch {}
            const foundHeight = appliedRooms.find(r => r.ceilingHeight && Number(r.ceilingHeight) > 0)?.ceilingHeight;
            if (foundHeight) {
              const hNum = Number(Number(foundHeight).toFixed(2));
              try {
                localStorage.setItem('estimate_cad_ceiling_height', JSON.stringify(hNum));
              } catch {}
              if (onCeilingHeightChange) {
                onCeilingHeightChange(hNum);
              }
              window.dispatchEvent(new CustomEvent('estimate_cad_ceiling_height_updated', { detail: hNum }));
            }
            const cadRooms = convertImportedRoomsToCadRooms(appliedRooms);
            setRooms(cadRooms);
            if (onRoomsUpdated) onRoomsUpdated(cadRooms);
            window.dispatchEvent(new CustomEvent('estimate_cad_rooms_transferred', { detail: appliedRooms }));
            showToast(`🎉 ${appliedRooms.length} помещений перенесены в раздел «1. Обмер»!`);
          }}
        />

        <SandwichConstructorModal

          isOpen={showConstructorModal}

          onClose={() => setShowConstructorModal(false)}

          pirogs={customPirogs}

          onSavePirogs={handleSaveCustomPirogs}

        />



        {/* ПОЛНОЭКРАННЫЙ ВИЗУАЛЬНЫЙ КОМПАРАТОР «БЫЛО ➔ СТАЛО» (ОРИГИНАЛ ПЛАНА | CAD-ЧЕРТЁЖ) И ЭКСПЛИКАЦИЯ */}

        <PlanNotesSidePanel

          isOpen={showDetectedTextModal}

          onClose={() => setShowDetectedTextModal(false)}

          detectedTextNotes={detectedTextNotes}

          rawSummary={vectorizeSummary}

          detectedWallsCount={allWalls.length}

          detectedRoomsCount={rooms.length}

          rooms={rooms}

          walls={allWalls}

          onUpdateRooms={(updated) => {

            setRooms(updated);

            if (onRoomsUpdated) onRoomsUpdated(updated);

          }}

          onUpdateWalls={(updated) => {

            setAllWalls(updated);

          }}

          onNotesChange={(newNotes) => {

            setDetectedTextNotes(newNotes);

          }}

          blueprintImageUrl={currentBlueprintImageUrl || backdrop?.imageUrl || null}

          blueprintName={currentBlueprintName || backdrop?.name || 'Обмерный план'}

          useCalqueMode={isCalqueModeActive}

          manualDimOffsets={manualDimOffsets}

          onUpdateManualDimOffsets={setManualDimOffsets}

          onApplyToCanvas={(edited, offsets) => {

            if (edited && edited.length > 0) {

              setAllWalls(edited);

            }

            if (offsets) {

              setManualDimOffsets(offsets);

            }

            setShowDetectedTextModal(false);

            showToast('🎉 Векторный чертёж и выноски размеров применены на рабочий холст!');

          }}

        />

      </div>



      {/* 5. НИЖНЯЯ СИСТЕМНАЯ СТРОКА СОСТОЯНИЯ ГОСТ (STATUS BAR - СВЕТЛАЯ) */}

      <div className="h-8 bg-slate-100 border-t border-slate-300 px-4 flex items-center justify-between text-xs select-none shrink-0 z-20">

        <div className="flex items-center gap-3 font-mono text-[11px] text-slate-700">

          <span className="font-bold text-blue-700">

            X: {dimensionUnit === 'mm' ? Math.round(cursorWorld.x * 1000) : cursorWorld.x.toFixed(2)} | Y: {dimensionUnit === 'mm' ? Math.round(cursorWorld.y * 1000) : cursorWorld.y.toFixed(2)} {dimensionUnit}

          </span>

          <span className="text-slate-300">|</span>

          <span className="text-slate-500">Шаг: 10 мм</span>

          <span className="text-slate-300">|</span>

          <span className="text-slate-700 font-semibold">

            Масштаб 1:{Math.round(100 * (70 / Math.max(scale, 1)))} ({Math.round(scale)} px/м)

          </span>

          <span className="text-slate-300">|</span>

          <span className="text-emerald-700 font-bold">

            Sобщ = {rooms.filter(r => !r.isShaft).reduce((sum, r) => sum + r.floorArea, 0).toFixed(2)} м²

          </span>

        </div>



        {/* Инженерные переключатели САПР */}

        <div className="flex items-center gap-1.5 text-[11px]">

          <button

            type="button"

            onClick={() => {

              const next = !orthoMode;

              setOrthoMode(next);

              showToast(next ? '⬚ Режим «Орто 90°» ВКЛ' : '📐 Режим «Свободный угол» ВКЛ');

            }}

            className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer border ${

              orthoMode

                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'

                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-200'

            }`}

            title="Переключить режим угла [O / F8]"

          >

            ОРТО [O]

          </button>



          <button

            type="button"

            onClick={() => {

              setShowGrid(prev => !prev);

              showToast(!showGrid ? 'Сетка миллиметровки ВКЛ' : 'Сетка миллиметровки ВЫКЛ');

            }}

            className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer border ${

              showGrid

                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'

                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-200'

            }`}

            title="Показать / скрыть сетку миллиметровки [G]"

          >

            СЕТКА [G]

          </button>



          <button

            type="button"

            onClick={() => {

              const next = !smartSnapEnabled;

              setSmartSnapEnabled(next);

              showToast(next ? 'Умные привязки ВКЛ' : 'Умные привязки ВЫКЛ');

            }}

            className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer border ${

              smartSnapEnabled

                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'

                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-200'

            }`}

            title="Умные привязки к вершинам и стенам [S]"

          >

            ПРИВЯЗКА [S]

          </button>



          <span className="text-slate-300 mx-0.5">|</span>



          {/* Единицы */}

          <div className="flex items-center bg-white rounded border border-slate-300 p-0.5">

            <button

              type="button"

              onClick={() => setDimensionUnit('mm')}

              className={`px-1.5 py-0.2 rounded font-bold text-[10px] cursor-pointer ${

                dimensionUnit === 'mm' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'

              }`}

            >

              мм

            </button>

            <button

              type="button"

              onClick={() => setDimensionUnit('cm')}

              className={`px-1.5 py-0.2 rounded font-bold text-[10px] cursor-pointer ${

                dimensionUnit === 'cm' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'

              }`}

            >

              см

            </button>

            <button

              type="button"

              onClick={() => setDimensionUnit('m')}

              className={`px-1.5 py-0.2 rounded font-bold text-[10px] cursor-pointer ${

                dimensionUnit === 'm' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'

              }`}

            >

              м

            </button>

          </div>



          <span className="text-slate-300 mx-0.5">|</span>



          {/* Зум */}

          <button

            type="button"

            onClick={() => setScale(s => Math.max(s * 0.8, 20))}

            className="p-1 rounded bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 cursor-pointer"

            title="Отдалить"

          >

            <ZoomOut className="w-3 h-3" />

          </button>

          <button

            type="button"

            onClick={() => setScale(s => Math.min(s * 1.2, 250))}

            className="p-1 rounded bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 cursor-pointer"

            title="Приблизить"

          >

            <ZoomIn className="w-3 h-3" />

          </button>

          <button

            type="button"

            onClick={fitView}

            className="p-1 rounded bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 cursor-pointer"

            title="Вписать в экран"

          >

            <Maximize2 className="w-3 h-3" />

          </button>



          <span className="text-slate-300 mx-0.5">|</span>



          {/* Журнал действий */}

          <button

            type="button"

            onClick={() => setShowActionDrawer(!showActionDrawer)}

            className={`px-2 py-0.5 rounded font-bold flex items-center gap-1 transition-colors cursor-pointer border ${

              showActionDrawer

                ? 'bg-slate-800 text-white border-slate-800'

                : 'bg-white hover:bg-slate-200 text-slate-700 border-slate-300'

            }`}

            title="Журнал действий и история"

          >

            <ListOrdered className="w-3 h-3 text-blue-600" />

            <span>Журнал ({actionLogs.length})</span>

          </button>

        </div>

      </div>

    </div>

  );

};

