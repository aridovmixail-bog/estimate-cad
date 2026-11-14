import { Room, Point, Wall } from './types';

export interface OpeningPreset {
  id: string;
  label: string;
  width: number;
  height: number;
}

export const STANDARD_DOOR_PRESETS: OpeningPreset[] = [
  { id: 'door_070', label: '0.70 × 2.05 м (Санузел / Ванная)', width: 0.70, height: 2.05 },
  { id: 'door_080', label: '0.80 × 2.05 м (Стандарт межкомнатная)', width: 0.80, height: 2.05 },
  { id: 'door_090', label: '0.90 × 2.05 м (Широкая / Входная)', width: 0.90, height: 2.05 },
  { id: 'door_060', label: '0.60 × 2.05 м (Кладовая / Узкая)', width: 0.60, height: 2.05 },
  { id: 'door_120', label: '1.20 × 2.05 м (Двустворчатая)', width: 1.20, height: 2.05 },
];

export const STANDARD_WINDOW_PRESETS: OpeningPreset[] = [
  { id: 'win_140', label: '1.40 × 1.40 м (Стандарт 2-створчатое)', width: 1.40, height: 1.40 },
  { id: 'win_200', label: '2.00 × 1.40 м (Широкое 3-створчатое)', width: 2.00, height: 1.40 },
  { id: 'win_080', label: '0.80 × 1.40 м (Узкое 1-створчатое)', width: 0.80, height: 1.40 },
  { id: 'win_balcony', label: '1.50 × 2.15 м (Балконный блок с дверью)', width: 1.50, height: 2.15 },
  { id: 'win_060', label: '0.60 × 0.60 м (Форточка / Санузел)', width: 0.60, height: 0.60 },
];

export interface RoomPresetTemplate {
  id: string;
  name: string;
  shortLabel: string;
  defaultArea: number;
  isWet: boolean;
  roomType: 'living' | 'wet' | 'balcony' | 'corridor';
  defaultDoorsCount: number;
  defaultDoorPresetId: string;
  defaultWindowsCount: number;
  defaultWindowPresetId: string;
}

export const ROOM_PRESET_TEMPLATES: RoomPresetTemplate[] = [
  {
    id: 'preset_kitchen',
    name: 'Кухня',
    shortLabel: 'Кухня',
    defaultArea: 0,
    isWet: true,
    roomType: 'wet',
    defaultDoorsCount: 1,
    defaultDoorPresetId: 'door_080',
    defaultWindowsCount: 1,
    defaultWindowPresetId: 'win_140'
  },
  {
    id: 'preset_bath',
    name: 'Ванная',
    shortLabel: 'Ванная',
    defaultArea: 0,
    isWet: true,
    roomType: 'wet',
    defaultDoorsCount: 1,
    defaultDoorPresetId: 'door_070',
    defaultWindowsCount: 0,
    defaultWindowPresetId: 'win_140'
  },
  {
    id: 'preset_comb_bath',
    name: 'Совмещенный санузел',
    shortLabel: 'Совм. с/у',
    defaultArea: 0,
    isWet: true,
    roomType: 'wet',
    defaultDoorsCount: 1,
    defaultDoorPresetId: 'door_070',
    defaultWindowsCount: 0,
    defaultWindowPresetId: 'win_140'
  },
  {
    id: 'preset_toilet',
    name: 'Туалет',
    shortLabel: 'Туалет',
    defaultArea: 0,
    isWet: true,
    roomType: 'wet',
    defaultDoorsCount: 1,
    defaultDoorPresetId: 'door_070',
    defaultWindowsCount: 0,
    defaultWindowPresetId: 'win_140'
  },
  {
    id: 'preset_room1',
    name: 'Комната 1',
    shortLabel: 'Комната 1',
    defaultArea: 0,
    isWet: false,
    roomType: 'living',
    defaultDoorsCount: 1,
    defaultDoorPresetId: 'door_080',
    defaultWindowsCount: 1,
    defaultWindowPresetId: 'win_140'
  },
  {
    id: 'preset_room2',
    name: 'Комната 2',
    shortLabel: 'Комната 2',
    defaultArea: 0,
    isWet: false,
    roomType: 'living',
    defaultDoorsCount: 1,
    defaultDoorPresetId: 'door_080',
    defaultWindowsCount: 1,
    defaultWindowPresetId: 'win_140'
  },
  {
    id: 'preset_room3',
    name: 'Комната 3',
    shortLabel: 'Комната 3',
    defaultArea: 0,
    isWet: false,
    roomType: 'living',
    defaultDoorsCount: 1,
    defaultDoorPresetId: 'door_080',
    defaultWindowsCount: 1,
    defaultWindowPresetId: 'win_140'
  },
  {
    id: 'preset_bed1',
    name: 'Спальня 1',
    shortLabel: 'Спальня 1',
    defaultArea: 0,
    isWet: false,
    roomType: 'living',
    defaultDoorsCount: 1,
    defaultDoorPresetId: 'door_080',
    defaultWindowsCount: 1,
    defaultWindowPresetId: 'win_140'
  },
  {
    id: 'preset_bed2',
    name: 'Спальня 2',
    shortLabel: 'Спальня 2',
    defaultArea: 0,
    isWet: false,
    roomType: 'living',
    defaultDoorsCount: 1,
    defaultDoorPresetId: 'door_080',
    defaultWindowsCount: 1,
    defaultWindowPresetId: 'win_140'
  },
  {
    id: 'preset_living',
    name: 'Гостиная',
    shortLabel: 'Гостиная',
    defaultArea: 0,
    isWet: false,
    roomType: 'living',
    defaultDoorsCount: 1,
    defaultDoorPresetId: 'door_080',
    defaultWindowsCount: 1,
    defaultWindowPresetId: 'win_200'
  },
  {
    id: 'preset_corridor',
    name: 'Коридор',
    shortLabel: 'Коридор',
    defaultArea: 0,
    isWet: false,
    roomType: 'corridor',
    defaultDoorsCount: 4,
    defaultDoorPresetId: 'door_080',
    defaultWindowsCount: 0,
    defaultWindowPresetId: 'win_140'
  },
  {
    id: 'preset_balcony',
    name: 'Лоджия',
    shortLabel: 'Лоджия',
    defaultArea: 0,
    isWet: false,
    roomType: 'balcony',
    defaultDoorsCount: 1,
    defaultDoorPresetId: 'door_080',
    defaultWindowsCount: 1,
    defaultWindowPresetId: 'win_balcony'
  },
  {
    id: 'preset_wardrobe',
    name: 'Гардеробная',
    shortLabel: 'Гардероб',
    defaultArea: 0,
    isWet: false,
    roomType: 'living',
    defaultDoorsCount: 1,
    defaultDoorPresetId: 'door_070',
    defaultWindowsCount: 0,
    defaultWindowPresetId: 'win_140'
  },
  {
    id: 'preset_pantry',
    name: 'Кладовая',
    shortLabel: 'Кладовая',
    defaultArea: 0,
    isWet: false,
    roomType: 'living',
    defaultDoorsCount: 1,
    defaultDoorPresetId: 'door_060',
    defaultWindowsCount: 0,
    defaultWindowPresetId: 'win_140'
  }
];

export function createRoomFromPreset(presetId: string, globalCeilingHeight = 2.70): ImportedRoomData {
  const preset = ROOM_PRESET_TEMPLATES.find(p => p.id === presetId) || ROOM_PRESET_TEMPLATES[0];
  const doorPreset = STANDARD_DOOR_PRESETS.find(d => d.id === preset.defaultDoorPresetId) || STANDARD_DOOR_PRESETS[1];
  const winPreset = STANDARD_WINDOW_PRESETS.find(w => w.id === preset.defaultWindowPresetId) || STANDARD_WINDOW_PRESETS[0];

  return createImportedRoom({
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
}

export function convertCadRoomToImported(room: Room): ImportedRoomData {
  const floorArea = room.floorArea || 0;
  const ceilingHeight = room.ceilingHeight || 2.70;
  const perimeter = room.perimeter || estimatePerimeterFromArea(floorArea);
  const isWetRoom = room.roomType === 'wet' || /ванн|туалет|санузел|душ/i.test(room.name);
  const doorsCount = room.doorsCount !== undefined ? room.doorsCount : 1;
  const windowsCount = room.windowsCount !== undefined ? room.windowsCount : (isWetRoom ? 0 : 1);
  const doorWidth = isWetRoom ? 0.70 : 0.80;
  const doorHeight = 2.05;
  const windowWidth = 1.40;
  const windowHeight = 1.40;

  const metrics = calculateRoomMetrics({
    floorArea,
    ceilingHeight,
    perimeter,
    doorsCount,
    doorWidth,
    doorHeight,
    windowsCount,
    windowWidth,
    windowHeight
  });

  return {
    id: room.id,
    name: room.name,
    floorArea,
    ceilingHeight,
    perimeter,
    doorsCount,
    doorWidth,
    doorHeight,
    windowsCount,
    windowWidth,
    windowHeight,
    wallGrossArea: metrics.wallGrossArea,
    openingsTotalArea: metrics.openingsTotalArea,
    wallNetArea: room.wallNetArea || metrics.wallNetArea,
    isWet: isWetRoom,
    roomType: isWetRoom ? 'wet' : (room.roomType === 'balcony' ? 'balcony' : 'living')
  };
}

export interface ImportedRoomData {
  id: string;
  name: string;
  formula?: string;
  floorArea: number;
  ceilingHeight: number;
  perimeter: number;
  // Двери
  doorsCount: number;
  doorWidth: number;
  doorHeight: number;
  // Окна
  windowsCount: number;
  windowWidth: number;
  windowHeight: number;
  // Вычисляемые площади
  wallGrossArea: number;
  openingsTotalArea: number;
  wallNetArea: number;
  // Категория
  isWet?: boolean;
  roomType?: 'living' | 'wet' | 'balcony' | 'corridor';
}

/**
 * Расчет периметра по площади пола (если не задан вручную)
 * Для типового соотношения сторон ~1:1.3: P ≈ 4.05 * sqrt(S)
 */
export function estimatePerimeterFromArea(area: number): number {
  if (area <= 0) return 0;
  return Number((4.05 * Math.sqrt(area)).toFixed(2));
}

/**
 * Вычисляет площади стен с вычетом дверей и окон
 */
export function calculateRoomMetrics(room: {
  floorArea: number;
  ceilingHeight: number;
  perimeter: number;
  doorsCount: number;
  doorWidth: number;
  doorHeight: number;
  windowsCount: number;
  windowWidth: number;
  windowHeight: number;
}): { wallGrossArea: number; openingsTotalArea: number; wallNetArea: number } {
  const wallGrossArea = Number((room.perimeter * room.ceilingHeight).toFixed(2));
  const doorsArea = Number((room.doorsCount * room.doorWidth * room.doorHeight).toFixed(2));
  const windowsArea = Number((room.windowsCount * room.windowWidth * room.windowHeight).toFixed(2));
  const openingsTotalArea = Number((doorsArea + windowsArea).toFixed(2));
  const wallNetArea = Number(Math.max(0, wallGrossArea - openingsTotalArea).toFixed(2));

  return {
    wallGrossArea,
    openingsTotalArea,
    wallNetArea
  };
}

/**
 * Создает карточку комнаты с автоматическим вычислением площадей
 */
export function createImportedRoom(params: {
  id?: string;
  name: string;
  floorArea: number;
  formula?: string;
  ceilingHeight?: number;
  perimeter?: number;
  doorsCount?: number;
  doorWidth?: number;
  doorHeight?: number;
  windowsCount?: number;
  windowWidth?: number;
  windowHeight?: number;
}): ImportedRoomData {
  const id = params.id || `imp_room_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const floorArea = Math.max(0, params.floorArea || 0);
  const ceilingHeight = Math.max(1.8, params.ceilingHeight || 3.04);
  const perimeter = params.perimeter !== undefined
    ? params.perimeter
    : (floorArea > 0 ? estimatePerimeterFromArea(floorArea) : 0);

  const lower = params.name.toLowerCase();
  const isWet = lower.includes('ванн') || lower.includes('туалет') || lower.includes('санузел') || lower.includes('душ');
  const isBalcony = lower.includes('балкон') || lower.includes('лодж');
  const isCorridor = lower.includes('коридор') || lower.includes('прихож') || lower.includes('холл');

  let roomType: 'living' | 'wet' | 'balcony' | 'corridor' = 'living';
  if (isWet) roomType = 'wet';
  else if (isBalcony) roomType = 'balcony';
  else if (isCorridor) roomType = 'corridor';

  // Дефолтные двери: 1 шт (в коридоре обычно двери во все комнаты, но в самой комнате 1 дверь)
  const doorsCount = params.doorsCount !== undefined ? params.doorsCount : 1;
  const doorWidth = params.doorWidth || (isWet ? 0.70 : 0.80);
  const doorHeight = params.doorHeight || 2.05;

  // Дефолтные окна: в жилых и кухне 1 окно, в санузлах и коридоре 0 окон
  const defaultWinCount = (isWet || isCorridor) ? 0 : 1;
  const windowsCount = params.windowsCount !== undefined ? params.windowsCount : defaultWinCount;
  const windowWidth = params.windowWidth || 1.40;
  const windowHeight = params.windowHeight || 1.40;

  const metrics = calculateRoomMetrics({
    floorArea,
    ceilingHeight,
    perimeter,
    doorsCount,
    doorWidth,
    doorHeight,
    windowsCount,
    windowWidth,
    windowHeight
  });

  return {
    id,
    name: params.name,
    formula: params.formula,
    floorArea,
    ceilingHeight,
    perimeter,
    doorsCount,
    doorWidth,
    doorHeight,
    windowsCount,
    windowWidth,
    windowHeight,
    wallGrossArea: metrics.wallGrossArea,
    openingsTotalArea: metrics.openingsTotalArea,
    wallNetArea: metrics.wallNetArea,
    isWet,
    roomType
  };
}

/**
 * Преобразует массив ImportedRoomData в массив рабочих объектов Room для сметы App.tsx
 */
export function convertImportedRoomsToCadRooms(imported: ImportedRoomData[]): Room[] {
  return imported.map((r, idx) => {
    // Формируем виртуальный прямоугольник для совместимости с интерфейсом Point[]
    const width = Math.sqrt(r.floorArea > 0 ? r.floorArea : 1);
    const height = r.floorArea > 0 ? r.floorArea / width : 1;
    const originX = (idx % 3) * 6;
    const originY = Math.floor(idx / 3) * 6;

    const points: Point[] = [
      { x: originX, y: originY },
      { x: originX + width, y: originY },
      { x: originX + width, y: originY + height },
      { x: originX, y: originY + height }
    ];

    const walls: Wall[] = [
      { id: `w_${r.id}_1`, start: points[0], end: points[1], thickness: 0.1, openings: [] },
      { id: `w_${r.id}_2`, start: points[1], end: points[2], thickness: 0.1, openings: [] },
      { id: `w_${r.id}_3`, start: points[2], end: points[3], thickness: 0.1, openings: [] },
      { id: `w_${r.id}_4`, start: points[3], end: points[0], thickness: 0.1, openings: [] }
    ];

    const mappedType: 'living' | 'wet' | 'balcony' = r.roomType === 'wet' ? 'wet' : (r.roomType === 'balcony' ? 'balcony' : 'living');

    return {
      id: r.id,
      name: r.name,
      points,
      walls,
      floorArea: r.floorArea,
      perimeter: r.perimeter,
      ceilingHeight: r.ceilingHeight,
      wallGrossArea: r.wallGrossArea,
      wallNetArea: r.wallNetArea,
      openingsTotalArea: r.openingsTotalArea,
      doorsCount: r.doorsCount,
      doorsArea: Number((r.doorsCount * r.doorWidth * r.doorHeight).toFixed(2)),
      windowsCount: r.windowsCount,
      windowsArea: Number((r.windowsCount * r.windowWidth * r.windowHeight).toFixed(2)),
      isShaft: false,
      roomType: mappedType
    };
  });
}

/**
 * Эталонные комнаты с рукописного обмерного листа (Дангиреева 63 м²)
 */
export const DEFAULT_HANDWRITTEN_ROOMS_DANSHIREEVA: ImportedRoomData[] = [
  createImportedRoom({
    id: 'sheet_kitchen',
    name: 'Кухня',
    formula: '19.08 - 0.24 - 0.48 + 0.32 + 0.27 + 0.42 = 19.37 м²',
    floorArea: 19.37,
    ceilingHeight: 3.04,
    perimeter: 17.74,
    doorsCount: 1,
    windowsCount: 1
  }),
  createImportedRoom({
    id: 'sheet_bed1',
    name: 'Комната 1',
    formula: '11.61 - 0.14 + 0.33 = 11.80 м²',
    floorArea: 11.80,
    ceilingHeight: 3.04,
    perimeter: 14.00,
    doorsCount: 1,
    windowsCount: 1
  }),
  createImportedRoom({
    id: 'sheet_bed2',
    name: 'Комната 2',
    formula: '11.52 + 0.25 = 11.77 м²',
    floorArea: 11.77,
    ceilingHeight: 3.04,
    perimeter: 16.50,
    doorsCount: 1,
    windowsCount: 1
  }),
  createImportedRoom({
    id: 'sheet_wardrobe',
    name: 'Гардероб',
    formula: '1.42 м²',
    floorArea: 1.42,
    ceilingHeight: 3.04,
    perimeter: 4.80,
    doorsCount: 1,
    windowsCount: 0
  }),
  createImportedRoom({
    id: 'sheet_toilet',
    name: 'Туалет',
    formula: '2.96 - 0.36 = 2.60 м²',
    floorArea: 2.60,
    ceilingHeight: 3.04,
    perimeter: 6.80,
    doorsCount: 1,
    windowsCount: 0
  }),
  createImportedRoom({
    id: 'sheet_bath',
    name: 'Ванная',
    formula: '3.46 м²',
    floorArea: 3.46,
    ceilingHeight: 3.04,
    perimeter: 7.50,
    doorsCount: 1,
    windowsCount: 0
  }),
  createImportedRoom({
    id: 'sheet_corridor',
    name: 'Коридор',
    formula: '5.26 + 4.27 = 9.53 м²',
    floorArea: 9.53,
    ceilingHeight: 3.04,
    perimeter: 18.00,
    doorsCount: 6, // двери во все смежные комнаты
    doorWidth: 0.80,
    doorHeight: 2.05,
    windowsCount: 0
  }),
  createImportedRoom({
    id: 'sheet_balcony',
    name: 'Лоджия',
    formula: '4.87 + 0.23 = 5.10 × 0.5 = 2.55 м²',
    floorArea: 5.10,
    ceilingHeight: 3.04,
    perimeter: 9.60,
    doorsCount: 1,
    windowsCount: 1
  }),
];

/**
 * Парсер текстовых заметок OCR в структурированные комнаты
 */
export function parseHandwrittenNotesToRooms(
  notes: string[],
  fallbackHeight = 3.04
): { rooms: ImportedRoomData[]; ceilingHeight: number; totalArea?: number } {
  let detectedHeight = fallbackHeight;
  let totalArea: number | undefined = undefined;
  const rooms: ImportedRoomData[] = [];

  for (const line of notes) {
    const hMatch = line.match(/(?:h|высота|h\s*общ|потолок)\s*[:=]?\s*([0-9]+[.,]?[0-9]*)/i);
    if (hMatch) {
      const val = parseFloat(hMatch[1].replace(',', '.'));
      if (val > 1.8 && val < 6.0) {
        detectedHeight = val;
      } else if (val > 1800 && val < 6000) {
        detectedHeight = val / 1000;
      }
    }
    const sTotMatch = line.match(/(?:s\s*общ|sобщ|общая|итого)\s*[:=]?\s*([0-9]+[.,]?[0-9]*)/i);
    if (sTotMatch) {
      totalArea = parseFloat(sTotMatch[1].replace(',', '.'));
    }
  }

  const roomPatterns = [
    { key: 'кухн', standardName: 'Кухня', isWet: true },
    { key: 'комн 1', standardName: 'Комната 1', isWet: false },
    { key: 'комн 2', standardName: 'Комната 2', isWet: false },
    { key: 'спальн 1', standardName: 'Спальня 1', isWet: false },
    { key: 'спальн 2', standardName: 'Спальня 2', isWet: false },
    { key: 'гардероб', standardName: 'Гардероб', isWet: false },
    { key: 'туал', standardName: 'Туалет', isWet: true },
    { key: 'санузел', standardName: 'Санузел', isWet: true },
    { key: 'ван', standardName: 'Ванная', isWet: true },
    { key: 'корид', standardName: 'Коридор', isWet: false },
    { key: 'прихож', standardName: 'Прихожая', isWet: false },
    { key: 'лодж', standardName: 'Лоджия', isWet: false },
    { key: 'балкон', standardName: 'Балкон', isWet: false }
  ];

  for (const line of notes) {
    const lower = line.toLowerCase();
    for (const pat of roomPatterns) {
      if (lower.includes(pat.key)) {
        const eqMatch = line.match(/=\s*([0-9]+[.,][0-9]+)/);
        let areaVal = 0;
        let formulaStr: string | undefined = undefined;

        if (eqMatch) {
          areaVal = parseFloat(eqMatch[1].replace(',', '.'));
          formulaStr = line.replace(/^[•\s\d.-]+/, '').trim();
        } else {
          const numMatches = [...line.matchAll(/([0-9]+[.,][0-9]+)/g)];
          if (numMatches.length > 0) {
            areaVal = parseFloat(numMatches[numMatches.length - 1][1].replace(',', '.'));
          }
        }

        if (areaVal > 0 && !rooms.some(r => r.name === pat.standardName)) {
          rooms.push(createImportedRoom({
            name: pat.standardName,
            floorArea: areaVal,
            formula: formulaStr,
            ceilingHeight: detectedHeight
          }));
        }
        break;
      }
    }
  }

  return {
    rooms: rooms.length > 0 ? rooms : DEFAULT_HANDWRITTEN_ROOMS_DANSHIREEVA,
    ceilingHeight: detectedHeight,
    totalArea
  };
}
