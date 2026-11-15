import { Fixture, FixtureDefinition, FixtureType, Point, Wall, Room, DimensionUnit } from './types';
import { distance, projectPointOnSegment, isPointInsidePolygon } from './geometry';
import { formatDimValue, drawArchitecturalTick45, getStandardDimensionAngle, DimHitBox } from './dimensions';

// Кэш загруженных пользовательских изображений (SVG / PNG)
const imageCache = new Map<string, HTMLImageElement>();

export function getCachedImage(url: string): HTMLImageElement | null {
  if (!url) return null;
  const existing = imageCache.get(url);
  if (existing) {
    return existing.complete && existing.naturalWidth > 0 ? existing : null;
  }
  const img = new Image();
  img.src = url;
  imageCache.set(url, img);
  return null;
}

export const FIXTURE_CATALOG: FixtureDefinition[] = [
  // ==========================================
  // --- ЭЛЕКТРИКА (ГОСТ 21.614-88) ---
  // ==========================================
  {
    type: 'socket_single',
    category: 'electric',
    name: 'Розетка 220V (одинарная)',
    shortLabel: 'Розетка 1-я',
    width: 0.30,
    height: 0.30,
    color: '#2563eb',
    defaultHeightFromFloor: 0.30, // 30 см от пола (евростандарт)
  },
  {
    type: 'socket_double',
    category: 'electric',
    name: 'Розетка 220V (двойная)',
    shortLabel: 'Розетка 2-я',
    width: 0.45,
    height: 0.30,
    color: '#1d4ed8',
    defaultHeightFromFloor: 0.30,
  },
  {
    type: 'socket_triple',
    category: 'electric',
    name: 'Розетка 220V (тройная)',
    shortLabel: 'Розетка 3-я',
    width: 0.60,
    height: 0.30,
    color: '#1e40af',
    defaultHeightFromFloor: 0.30,
  },
  {
    type: 'socket_ip44',
    category: 'electric',
    name: 'Розетка влагозащищенная IP44',
    shortLabel: 'Розетка IP44',
    width: 0.35,
    height: 0.30,
    color: '#0284c7',
    defaultHeightFromFloor: 1.00, // в санузле/кухне
  },
  {
    type: 'socket_cooktop',
    category: 'electric',
    name: 'Розетка плиты 380V/32A',
    shortLabel: 'Розетка плиты',
    width: 0.35,
    height: 0.35,
    color: '#dc2626',
    defaultHeightFromFloor: 0.10, // в плинтусе/цоколе
  },
  {
    type: 'switch_single',
    category: 'electric',
    name: 'Выключатель 1-клавишный',
    shortLabel: 'Выкл. 1-кл',
    width: 0.30,
    height: 0.30,
    color: '#0284c7',
    defaultHeightFromFloor: 0.90, // 90 см от пола
  },
  {
    type: 'switch_double',
    category: 'electric',
    name: 'Выключатель 2-клавишный',
    shortLabel: 'Выкл. 2-кл',
    width: 0.35,
    height: 0.30,
    color: '#0369a1',
    defaultHeightFromFloor: 0.90,
  },
  {
    type: 'switch_dimmer',
    category: 'electric',
    name: 'Диммер (светорегулятор)',
    shortLabel: 'Диммер',
    width: 0.30,
    height: 0.30,
    color: '#7c3aed',
    defaultHeightFromFloor: 0.90,
  },
  {
    type: 'light_point',
    category: 'electric',
    name: 'Точка освещения / Люстра',
    shortLabel: 'Свет / Люстра',
    width: 0.40,
    height: 0.40,
    color: '#eab308',
    defaultHeightFromFloor: 2.70, // потолок
  },
  {
    type: 'light_wall',
    category: 'electric',
    name: 'Бра настенное',
    shortLabel: 'Бра',
    width: 0.30,
    height: 0.25,
    color: '#ca8a04',
    defaultHeightFromFloor: 1.80,
  },
  {
    type: 'ac_power',
    category: 'electric',
    name: 'Вывод кондиционера',
    shortLabel: 'Кондиционер',
    width: 0.45,
    height: 0.30,
    color: '#6366f1',
    defaultHeightFromFloor: 2.20, // под потолком (ГОСТ)
  },
  {
    type: 'electrical_panel',
    category: 'electric',
    name: 'Электрощит (ЩО / ЩР)',
    shortLabel: 'Электрощит',
    width: 0.45,
    height: 0.20,
    color: '#0f172a',
    defaultHeightFromFloor: 1.60,
  },
  {
    type: 'thermostat',
    category: 'electric',
    name: 'Терморегулятор теплого пола',
    shortLabel: 'Термостат',
    width: 0.25,
    height: 0.25,
    color: '#ea580c',
    defaultHeightFromFloor: 0.90,
  },
  {
    type: 'tv_internet',
    category: 'electric',
    name: 'Блок TV + RJ45 Интернет',
    shortLabel: 'TV / LAN',
    width: 0.45,
    height: 0.30,
    color: '#4f46e5',
    defaultHeightFromFloor: 0.30,
  },

  // ==========================================
  // --- САНТЕХНИКА (ГОСТ 21.205-93) ---
  // ==========================================
  {
    type: 'sink',
    category: 'plumbing',
    name: 'Раковина / Умывальник',
    shortLabel: 'Раковина',
    width: 0.60,
    height: 0.50,
    color: '#0891b2',
    defaultHeightFromFloor: 0.85,
  },
  {
    type: 'toilet',
    category: 'plumbing',
    name: 'Унитаз с бачком (напольный)',
    shortLabel: 'Унитаз',
    width: 0.45,
    height: 0.70,
    color: '#0d9488',
    defaultHeightFromFloor: 0.40,
  },
  {
    type: 'toilet_install',
    category: 'plumbing',
    name: 'Унитаз подвесной (инсталляция)',
    shortLabel: 'Инсталляция',
    width: 0.50,
    height: 0.55,
    color: '#0f766e',
    defaultHeightFromFloor: 0.42,
  },
  {
    type: 'bidet',
    category: 'plumbing',
    name: 'Биде',
    shortLabel: 'Биде',
    width: 0.40,
    height: 0.65,
    color: '#0f766e',
    defaultHeightFromFloor: 0.40,
  },
  {
    type: 'bath',
    category: 'plumbing',
    name: 'Ванна прямоугольная 170×70',
    shortLabel: 'Ванна',
    width: 1.70, // 1.70 м вдоль стены ("боком к стене")
    height: 0.70, // 0.70 м глубина от стены в комнату
    color: '#0284c7',
    defaultHeightFromFloor: 0.60,
  },
  {
    type: 'bath_corner',
    category: 'plumbing',
    name: 'Ванна угловая 140×140',
    shortLabel: 'Ванна угл.',
    width: 1.40,
    height: 1.40,
    color: '#0369a1',
    defaultHeightFromFloor: 0.60,
  },
  {
    type: 'shower',
    category: 'plumbing',
    name: 'Душевая кабина / Трап',
    shortLabel: 'Душ',
    width: 0.90,
    height: 0.90,
    color: '#0ea5e9',
    defaultHeightFromFloor: 0.15,
  },
  {
    type: 'towel_heater',
    category: 'plumbing',
    name: 'Полотенцесушитель',
    shortLabel: 'Полотенцесуш.',
    width: 0.60,
    height: 0.20,
    color: '#f97316',
    defaultHeightFromFloor: 1.10,
  },
  {
    type: 'water_heater',
    category: 'plumbing',
    name: 'Бойлер / Водонагреватель',
    shortLabel: 'Бойлер',
    width: 0.50,
    height: 0.50,
    color: '#0284c7',
    defaultHeightFromFloor: 1.60,
  },
  {
    type: 'water_manifold',
    category: 'plumbing',
    name: 'Коллекторный узел ХВС/ГВС',
    shortLabel: 'Коллектор',
    width: 0.60,
    height: 0.20,
    color: '#0f172a',
    defaultHeightFromFloor: 0.70,
  },
  {
    type: 'washing_machine',
    category: 'plumbing',
    name: 'Стиральная машина 60×60',
    shortLabel: 'Стиралка',
    width: 0.60,
    height: 0.60,
    color: '#475569',
    defaultHeightFromFloor: 0.85,
  },

  // ==========================================
  // --- КУХНЯ ---
  // ==========================================
  {
    type: 'kitchen_sink',
    category: 'kitchen',
    name: 'Кухонная мойка',
    shortLabel: 'Мойка кухни',
    width: 0.75,
    height: 0.50,
    color: '#0284c7',
    defaultHeightFromFloor: 0.85,
  },
  {
    type: 'kitchen_hob',
    category: 'kitchen',
    name: 'Варочная панель',
    shortLabel: 'Варочная',
    width: 0.60,
    height: 0.52,
    color: '#dc2626',
    defaultHeightFromFloor: 0.85,
  },
  {
    type: 'kitchen_oven',
    category: 'kitchen',
    name: 'Духовой шкаф / СВЧ',
    shortLabel: 'Духовка',
    width: 0.60,
    height: 0.55,
    color: '#475569',
    defaultHeightFromFloor: 0.85,
  },
  {
    type: 'kitchen_fridge',
    category: 'kitchen',
    name: 'Холодильник',
    shortLabel: 'Холодильник',
    width: 0.60,
    height: 0.65,
    color: '#334155',
    defaultHeightFromFloor: 1.85,
  },
  {
    type: 'kitchen_dishwasher',
    category: 'kitchen',
    name: 'Посудомоечная машина (ПММ)',
    shortLabel: 'ПММ',
    width: 0.60,
    height: 0.60,
    color: '#0284c7',
    defaultHeightFromFloor: 0.85,
  },
  {
    type: 'kitchen_hood',
    category: 'kitchen',
    name: 'Вытяжка кухонная',
    shortLabel: 'Вытяжка',
    width: 0.60,
    height: 0.45,
    color: '#64748b',
    defaultHeightFromFloor: 1.65,
  },

  // ==========================================
  // --- ВАННАЯ И САНУЗЕЛ ---
  // ==========================================
  {
    type: 'vanity_unit',
    category: 'bathroom',
    name: 'Тумба с раковиной',
    shortLabel: 'Тумба с раков.',
    width: 0.80,
    height: 0.50,
    color: '#0891b2',
    defaultHeightFromFloor: 0.85,
  },
  {
    type: 'washing_dryer',
    category: 'bathroom',
    name: 'Колонна Стиралка + Сушилка',
    shortLabel: 'СМА + Сушилка',
    width: 0.60,
    height: 0.65,
    color: '#334155',
    defaultHeightFromFloor: 1.75,
  },

  // ==========================================
  // --- СТОЯКИ И ИНЖЕНЕРНЫЕ УЗЛЫ (ГОСТ АР) ---
  // ==========================================
  {
    type: 'riser_sewer',
    category: 'riser',
    name: 'Стояк канализации (● К)',
    shortLabel: 'Стояк К',
    width: 0.18,
    height: 0.18,
    color: '#0f172a',
    defaultHeightFromFloor: 3.00,
  },
  {
    type: 'riser_water_hot_cold',
    category: 'riser',
    name: 'Стояк ХВС / ГВС (● Х.Г.)',
    shortLabel: 'Стояк Х.Г.',
    width: 0.14,
    height: 0.14,
    color: '#0f172a',
    defaultHeightFromFloor: 3.00,
  },
  {
    type: 'riser_water_cold',
    category: 'riser',
    name: 'Стояк ХВС технич. (● Х.Т.)',
    shortLabel: 'Стояк Х.Т.',
    width: 0.14,
    height: 0.14,
    color: '#0f172a',
    defaultHeightFromFloor: 3.00,
  },
  {
    type: 'vent_shaft_double',
    category: 'riser',
    name: 'Вентшахта 2 канала (31×71 см)',
    shortLabel: 'Вентшахта 31×71',
    width: 0.71,
    height: 0.31,
    color: '#0f172a',
    defaultHeightFromFloor: 3.00,
  },
  {
    type: 'vent_shaft_single',
    category: 'riser',
    name: 'Вентшахта 1 канал (30×30 см)',
    shortLabel: 'Вентшахта 30×30',
    width: 0.30,
    height: 0.30,
    color: '#0f172a',
    defaultHeightFromFloor: 3.00,
  },
];

let customFixtureCatalogRegistry: FixtureDefinition[] = [...FIXTURE_CATALOG];

// Загрузка сохраненного каталога из localStorage
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem('estimate_cad_custom_fixtures');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        customFixtureCatalogRegistry = parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load custom fixtures from localStorage:', e);
  }
}

export function setCustomFixtureCatalogRegistry(catalog: FixtureDefinition[]) {
  customFixtureCatalogRegistry = catalog;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('estimate_cad_custom_fixtures', JSON.stringify(catalog));
    } catch (e) {
      console.error('Failed to save custom fixtures to localStorage:', e);
    }
  }
}

export function getActiveFixtureCatalog(): FixtureDefinition[] {
  return customFixtureCatalogRegistry;
}

export function getFixtureDefinition(type: FixtureType | string): FixtureDefinition {
  return customFixtureCatalogRegistry.find(f => f.type === type) 
    || FIXTURE_CATALOG.find(f => f.type === type) 
    || customFixtureCatalogRegistry[0] 
    || FIXTURE_CATALOG[0];
}

/**
 * Проверка попадания курсора в обозначение
 */
export function findNearestFixture(
  worldPos: Point,
  fixtures: Fixture[],
  thresholdMeters: number = 0.40
): Fixture | null {
  let closest: Fixture | null = null;
  let minDist = thresholdMeters;

  for (const fix of fixtures) {
    const d = Math.hypot(fix.x - worldPos.x, fix.y - worldPos.y);
    const maxBound = Math.max(fix.width, fix.height) / 2 + 0.15;
    if (d < Math.max(minDist, maxBound)) {
      minDist = d;
      closest = fix;
    }
  }

  return closest;
}

/**
 * Проверка: является ли элемент настенным (wall-mounted)
 * Для настенных элементов действует умное магнитирование к стене комнаты
 */
export function isWallMountedFixture(fixtureDefOrType: FixtureDefinition | string): boolean {
  const type = typeof fixtureDefOrType === 'string' ? fixtureDefOrType : fixtureDefOrType.type;
  // Потолочные люстры и светильники размещаются свободно по потолку
  if (type === 'light_point') return false;
  // Все остальные элементы (розетки, выключатели, бра, кондиционеры, щиты,
  // терморегуляторы, TV/LAN, сантехника, кухни, радиаторы) являются настенными
  return true;
}

/**
 * Умная привязка обозначения к стене по ГОСТ:
 * - Если курсор подведён близко к стене (<= maxSnapDist, 0.50 м): объект магнитно привязывается к стене,
 *   плоская задняя часть прижимается к внутренней грани, а рабочая часть смотрит строго внутрь комнаты
 * - Если объект отведен от стены в глубь комнаты (> maxSnapDist): объект ставится свободно
 *   в любой точке пространства и может вращаться произвольно по желанию пользователя
 */
export function snapFixtureToNearestWallInRoom(
  worldPt: Point,
  walls: Wall[],
  rooms: Room[],
  fixtureDef: FixtureDefinition,
  maxSnapDist: number = 0.50
): { point: Point; rotationDeg: number; wallId?: string; roomId?: string; distanceFromCorner?: number } {
  if (walls.length === 0) {
    return { point: worldPt, rotationDeg: 0 };
  }

  let nearestWall: Wall | null = null;
  let minDist = maxSnapDist;
  let bestProj: Point | null = null;

  // 1. Проверяем, находится ли точка внутри замкнутого помещения
  const room = rooms.find(r => isPointInsidePolygon(worldPt, r.points));

  const candidateWalls = (room && room.walls && room.walls.length > 0)
    ? room.walls.map(rw => walls.find(w => w.id === rw.id) || rw)
    : walls;

  for (const w of candidateWalls) {
    const res = projectPointOnSegment(worldPt, w.start, w.end);
    if (res.dist < minDist) {
      minDist = res.dist;
      nearestWall = w;
      bestProj = res.point;
    }
  }

  // Если рядом со стеной не найдены (пользователь отвел курсор дальше maxSnapDist):
  // объект ставится СВОБОДНО В ТОЧКЕ КУРСОРА без жесткой привязки к стене!
  if (!nearestWall || !bestProj) {
    return {
      point: worldPt,
      rotationDeg: 0,
      roomId: room?.id
    };
  }

  const wall = nearestWall;
  const hostRoom = room ||
                   rooms.find(r => r.walls?.some(w => w.id === wall.id)) ||
                   rooms.find(r => isPointInsidePolygon(bestProj!, r.points));

  const wallLen = distance(wall.start, wall.end);
  if (wallLen < 0.01) {
    return { point: worldPt, rotationDeg: 0 };
  }

  // Единичные векторы и нормали к стене
  const dx = (wall.end.x - wall.start.x) / wallLen;
  const dy = (wall.end.y - wall.start.y) / wallLen;
  const n1 = { x: -dy, y: dx };
  const n2 = { x: dy, y: -dx };

  let inwardNormal = n1;
  const testDist = Math.max((wall.thickness || 0.15) * 0.75, 0.25);
  if (hostRoom && hostRoom.points.length >= 3) {
    const test1 = { x: bestProj.x + n1.x * testDist, y: bestProj.y + n1.y * testDist };
    const test2 = { x: bestProj.x + n2.x * testDist, y: bestProj.y + n2.y * testDist };
    if (isPointInsidePolygon(test1, hostRoom.points)) {
      inwardNormal = n1;
    } else if (isPointInsidePolygon(test2, hostRoom.points)) {
      inwardNormal = n2;
    } else {
      const vClick = { x: worldPt.x - bestProj.x, y: worldPt.y - bestProj.y };
      inwardNormal = (vClick.x * n1.x + vClick.y * n1.y >= 0) ? n1 : n2;
    }
  } else {
    const vClick = { x: worldPt.x - bestProj.x, y: worldPt.y - bestProj.y };
    inwardNormal = (vClick.x * n1.x + vClick.y * n1.y >= 0) ? n1 : n2;
  }

  // Смещение от оси стены внутрь комнаты:
  // По ГОСТ: базовая грань элемента y=0 совмещается строго с внутренней плоскостью стены!
  const halfThickness = (wall.thickness || 0.15) / 2;
  const offsetIntoRoom = halfThickness;

  const interiorPoint: Point = {
    x: Number((bestProj.x + inwardNormal.x * offsetIntoRoom).toFixed(3)),
    y: Number((bestProj.y + inwardNormal.y * offsetIntoRoom).toFixed(3))
  };

  // Правильная ориентация по ГОСТ:
  // Фасад смотрит в направлении inwardNormal (внутрь комнаты).
  // Значит rotationDeg = normalAngleDeg + 90°!
  const normalAngleDeg = Math.atan2(inwardNormal.y, inwardNormal.x) * 180 / Math.PI;
  const angleInward = Math.round(((normalAngleDeg + 90) % 360 + 360) % 360);
  const distFromStart = Number(distance(wall.start, bestProj).toFixed(3));

  return {
    point: interiorPoint,
    rotationDeg: angleInward,
    wallId: wall.id,
    roomId: hostRoom?.id,
    distanceFromCorner: distFromStart
  };
}

/**
 * Отрисовка засечки 45°
 */
function drawTick45(ctx: CanvasRenderingContext2D, x: number, y: number, size: number = 4) {
  ctx.beginPath();
  ctx.moveTo(x - size, y + size);
  ctx.lineTo(x + size, y - size);
  ctx.stroke();
}

/**
 * Отрисовка подложки под размерное число с поддержкой угла поворота по ГОСТ.
 * Полная визуальная синхронизация с размерами комнат и стен (dimensions.ts):
 * - Инженерный ГОСТ-шрифт 600 9px "Segoe UI"
 * - Аккуратная плоская белая маска-высечка без громоздких серых рамок и скруглений
 * - Идентичный отступ и высота 11.5px
 */
function drawTieTextBadge(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  isHighlight: boolean = false,
  angle: number = 0,
  fontSize: number = 9.0
) {
  ctx.save();
  ctx.translate(x, y);
  if (angle !== 0) {
    ctx.rotate(angle);
  }

  // Единый инженерный ГОСТ-шрифт чертежа (как на цепочках стен и комнат)
  ctx.font = `600 ${fontSize}px "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif`;
  try {
    (ctx as any).letterSpacing = '0.2px';
  } catch (e) {}

  const textMetrics = ctx.measureText(text);
  const padX = 2.5;
  const boxW = textMetrics.width + padX * 2;
  const boxH = fontSize + 2.5; // 11.5px

  // Чистая белая прямоугольная маска под текстом (высечка размерной линии по ГОСТ)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-boxW / 2, -boxH / 2, boxW, boxH);

  // Тонкий контур рисуется ТОЛЬКО при выделении (как в dimensions.ts)
  if (isHighlight) {
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 1.0;
    ctx.strokeRect(-boxW / 2, -boxH / 2, boxW, boxH);
  }

  ctx.fillStyle = isHighlight ? '#1d4ed8' : '#0f172a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

/**
 * Линия-выноска с горизонтальной полочкой (ГОСТ лидер):
 * Сверху полочки — название (например: «Розетка 1-я»)
 * Снизу полочки — высота монтажа (например: «H=300»)
 * Выносится ЗА ПРЕДЕЛЫ ВСЕХ размерных цепочек, в чистое пространство комнаты!
 */
function drawLeaderShelf(
  ctx: CanvasRenderingContext2D,
  originScr: Point,
  topText: string,
  bottomText: string,
  inwardNorm: Point,
  maxTierPx: number = 40,
  isHighlight: boolean = false,
  fontSize: number = 9.0
): { x: number; y: number; w: number; h: number } {
  ctx.save();

  // Выносим излом выноски дальше всех размерных ярусов и общих цепочек в чистое поле комнаты!
  const clearDistPx = Math.max(maxTierPx + 44, 76);

  // Точка излома (elbow): отступаем по нормали внутрь комнаты за все размерные линии,
  // плюс легкий сдвиг вдоль стены для естественного эстетичного угла ~45°
  const elbowX = originScr.x + inwardNorm.x * clearDistPx - inwardNorm.y * 22;
  const elbowY = originScr.y + inwardNorm.y * clearDistPx + inwardNorm.x * 22;

  // Полочка всегда строго горизонтальная по ГОСТ/ЕСКД
  // Если нормаль стены направлена влево (inwardNorm.x < -0.1), полочка идет влево, иначе вправо
  const shelfDir = inwardNorm.x < -0.1 ? -1 : 1;

  const topFontPx = Math.max(10, Math.round(fontSize * 1.2));
  const botFontPx = Math.max(9, Math.round(fontSize * 1.05));
  ctx.font = `600 ${topFontPx}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  const topW = ctx.measureText(topText).width;
  ctx.font = `bold ${botFontPx}px "Segoe UI", sans-serif`;
  const botW = ctx.measureText(bottomText).width;
  const maxTextW = Math.max(topW, botW);
  const shelfLen = maxTextW + 14;
  const shelfEndX = elbowX + shelfDir * shelfLen;

  // 1. Точка на элементе
  ctx.fillStyle = isHighlight ? '#1d4ed8' : '#0f172a';
  ctx.beginPath();
  ctx.arc(originScr.x, originScr.y, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // 2. Наклонная линия выноски
  ctx.strokeStyle = isHighlight ? '#1d4ed8' : '#334155';
  ctx.lineWidth = isHighlight ? 1.3 : 1;
  ctx.beginPath();
  ctx.moveTo(originScr.x, originScr.y);
  ctx.lineTo(elbowX, elbowY);
  ctx.stroke();

  // 3. Сплошная непрозрачная белая подложка под всей полочкой и текстом!
  const boxLeft = shelfDir > 0 ? elbowX : shelfEndX;
  const boxW = shelfLen + 6;
  const boxH = Math.max(30, topFontPx + botFontPx + 10);
  const boxY = elbowY - 16;

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(boxLeft - 3, boxY, boxW, boxH, 4);
  ctx.fill();
  ctx.strokeStyle = isHighlight ? '#2563eb' : 'rgba(203, 213, 225, 0.9)';
  ctx.lineWidth = isHighlight ? 1.5 : 0.8;
  ctx.stroke();

  // 4. Горизонтальная полочка
  ctx.strokeStyle = isHighlight ? '#1d4ed8' : '#334155';
  ctx.lineWidth = isHighlight ? 1.3 : 1;
  ctx.beginPath();
  ctx.moveTo(elbowX, elbowY);
  ctx.lineTo(shelfEndX, elbowY);
  ctx.stroke();

  // 5. Текст над полочкой (название: «Розетка 1-я»)
  const textLeftX = shelfDir > 0 ? elbowX + 5 : shelfEndX + 5;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.font = `600 ${topFontPx}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.fillStyle = isHighlight ? '#1d4ed8' : '#0f172a';
  ctx.fillText(topText, textLeftX, elbowY - 2);

  // 6. Текст под полочкой («H=300»)
  ctx.textBaseline = 'top';
  ctx.font = `bold ${botFontPx}px "Segoe UI", sans-serif`;
  ctx.fillStyle = isHighlight ? '#2563eb' : '#475569';
  ctx.fillText(bottomText, textLeftX, elbowY + 2);

  ctx.restore();

  return {
    x: boxLeft - 3,
    y: boxY,
    w: boxW,
    h: boxH
  };
}

/**
 * Отрисовка размерных привязок розеток и оборудования по ГОСТ (ярусы размеров):
 * - Выносная линия от угла
 * - Параллельные ярусы размеров (840, 1 300) с засечками 45°
 * - Линии-выноски с полочками (название + H=2200)
 */
export function drawWallFixtureTiers(
  ctx: CanvasRenderingContext2D,
  wall: Wall,
  fixtures: Fixture[],
  room: Room | undefined,
  toScreen: (x: number, y: number) => Point,
  scale: number,
  unit: DimensionUnit = 'mm',
  selectedFixtureId?: string | null,
  hoveredFixtureId?: string | null,
  onRegisterHitBox?: (hitBox: DimHitBox) => void,
  fontSize: number = 9.0
) {
  const wallLen = distance(wall.start, wall.end);
  if (wallLen < 0.1) return;

  const wallFixes = fixtures.filter(f => f.wallId === wall.id);
  if (wallFixes.length === 0) return;

  const ux = (wall.end.x - wall.start.x) / wallLen;
  const uy = (wall.end.y - wall.start.y) / wallLen;
  const n1 = { x: -uy, y: ux };
  const n2 = { x: uy, y: -ux };

  let inwardNorm = n1;
  if (room && room.points.length >= 3) {
    const midX = (wall.start.x + wall.end.x) / 2;
    const midY = (wall.start.y + wall.end.y) / 2;
    const test1 = { x: midX + n1.x * 0.15, y: midY + n1.y * 0.15 };
    if (isPointInsidePolygon(test1, room.points)) {
      inwardNorm = n1;
    } else {
      inwardNorm = n2;
    }
  }

  // Сортируем объекты по расстоянию от начального угла стены
  const sorted = [...wallFixes].sort((a, b) => {
    const distA = a.distanceFromCorner ?? distance(wall.start, { x: a.x, y: a.y });
    const distB = b.distanceFromCorner ?? distance(wall.start, { x: b.x, y: b.y });
    return distA - distB;
  });

  const numTiers = sorted.length;
  // Высота ярусов: первый ярус ~36px от стены, каждый следующий +30px (ГОСТ 21.501-2018)
  // Комфортный шаг исключает наложение размерных чисел и обеспечивает удобство чтения
  const baseOffsetPx = 36;
  const tierStepPx = 30;
  const maxTierPx = baseOffsetPx + (numTiers - 1) * tierStepPx;

  // 1. Выносная линия от начального угла (угловая засечка)
  const cornerStartScr = toScreen(wall.start.x, wall.start.y);
  const cornerEndWorld = {
    x: wall.start.x + inwardNorm.x * ((maxTierPx + 8) / scale),
    y: wall.start.y + inwardNorm.y * ((maxTierPx + 8) / scale)
  };
  const cornerEndScr = toScreen(cornerEndWorld.x, cornerEndWorld.y);

  ctx.save();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 0.9;

  ctx.beginPath();
  ctx.moveTo(cornerStartScr.x, cornerStartScr.y);
  ctx.lineTo(cornerEndScr.x, cornerEndScr.y);
  ctx.stroke();

  // 2. Рисуем каждый ярус
  sorted.forEach((fix, idx) => {
    const isSel = fix.id === selectedFixtureId;
    const isHov = fix.id === hoveredFixtureId;
    const dist = fix.distanceFromCorner ?? distance(wall.start, { x: fix.x, y: fix.y });
    if (dist < 0.05) return;

    const tierPx = baseOffsetPx + idx * tierStepPx;
    const tierM = tierPx / scale;

    // Точка привязки на угловой выносной линии для этого яруса
    const cTierWorld = {
      x: wall.start.x + inwardNorm.x * tierM,
      y: wall.start.y + inwardNorm.y * tierM
    };
    const cTierScr = toScreen(cTierWorld.x, cTierWorld.y);

    // Точка проекции объекта на стену
    const fixWallWorld = {
      x: wall.start.x + ux * dist,
      y: wall.start.y + uy * dist
    };

    // Точка конца размерной линии этого яруса на выноске объекта
    const fixTierWorld = {
      x: fixWallWorld.x + inwardNorm.x * tierM,
      y: fixWallWorld.y + inwardNorm.y * tierM
    };
    const fixTierScr = toScreen(fixTierWorld.x, fixTierWorld.y);

    const fixScr = toScreen(fix.x, fix.y);

    // Выносная линия от объекта до яруса (с перехлестом 3px)
    const overShootWorld = {
      x: fixWallWorld.x + inwardNorm.x * ((tierPx + 3) / scale),
      y: fixWallWorld.y + inwardNorm.y * ((tierPx + 3) / scale)
    };
    const overShootScr = toScreen(overShootWorld.x, overShootWorld.y);

    ctx.strokeStyle = isSel ? '#1d4ed8' : isHov ? '#2563eb' : '#475569';
    ctx.lineWidth = isSel ? 1.3 : 0.9;

    ctx.beginPath();
    ctx.moveTo(fixScr.x, fixScr.y);
    ctx.lineTo(overShootScr.x, overShootScr.y);
    ctx.stroke();

    // Размерная линия яруса от угла до объекта
    ctx.beginPath();
    ctx.moveTo(cTierScr.x, cTierScr.y);
    ctx.lineTo(fixTierScr.x, fixTierScr.y);
    ctx.stroke();

    // Засечки 45°
    drawTick45(ctx, cTierScr.x, cTierScr.y, 4);
    drawTick45(ctx, fixTierScr.x, fixTierScr.y, 4);

    // Число размера на линии яруса ("840", "1 300"): строго по ГОСТ 2.307
    // На вертикальных стенах поворачивается снизу вверх, верх цифр смотрит влево!
    const midX = (cTierScr.x + fixTierScr.x) / 2;
    const midY = (cTierScr.y + fixTierScr.y) / 2;
    const tieAngle = getStandardDimensionAngle(cTierScr, fixTierScr);
    const dimText = formatDimValue(dist, unit);
    drawTieTextBadge(ctx, dimText, midX, midY, isSel, tieAngle, fontSize);

    if (onRegisterHitBox) {
      onRegisterHitBox({
        key: `fixture_tie_${fix.id}`,
        wallId: wall.id,
        segIndex: idx,
        text: dimText,
        x: midX,
        y: midY,
        w: 38,
        h: 18,
        lineMid: { x: midX, y: midY },
        angle: tieAngle,
        segLenMeters: dist,
        fixtureId: fix.id,
        isFixtureTie: true
      });
    }

    // Линия-выноска с полочкой (выносится за пределы всех цепочек в свободное поле комнаты)
    const def = getFixtureDefinition(fix.type);
    const heightMm = Math.round((fix.installationHeight || def.defaultHeightFromFloor) * 1000);
    const shelfLabel = fix.customName || fix.name || def.shortLabel || def.name;
    const shelfBox = drawLeaderShelf(ctx, fixScr, shelfLabel, `H=${heightMm}`, inwardNorm, maxTierPx, isSel, fontSize);

    if (onRegisterHitBox && shelfBox) {
      onRegisterHitBox({
        key: `fixture_shelf_${fix.id}`,
        wallId: wall.id,
        segIndex: idx,
        text: `${shelfLabel} H=${heightMm}`,
        x: shelfBox.x + shelfBox.w / 2,
        y: shelfBox.y + shelfBox.h / 2,
        w: shelfBox.w,
        h: shelfBox.h,
        lineMid: { x: shelfBox.x + shelfBox.w / 2, y: shelfBox.y + shelfBox.h / 2 },
        angle: 0,
        segLenMeters: dist,
        fixtureId: fix.id,
        isFixtureTie: true
      });
    }
  });

  ctx.restore();
}

/**
 * Одиночная привязка объекта (для отдельно стоящих объектов или подсветки)
 */
export function drawFixtureDimensionTies(
  ctx: CanvasRenderingContext2D,
  fixture: Fixture,
  walls: Wall[],
  rooms: Room[],
  toScreen: (x: number, y: number) => Point,
  scale: number,
  unit: DimensionUnit = 'mm',
  isSelected: boolean = false,
  isHover: boolean = false,
  onRegisterHitBox?: (hitBox: DimHitBox) => void,
  fontSize: number = 9.0
) {
  if (walls.length === 0) return;

  // Если объект привязан к конкретной стене — рисуем ярусные цепочки по ГОСТ
  if (fixture.wallId) {
    const wall = walls.find(w => w.id === fixture.wallId);
    if (wall) {
      const room = rooms.find(r => r.id === fixture.roomId) || rooms.find(r => r.walls.some(w => w.id === wall.id));
      drawWallFixtureTiers(ctx, wall, [fixture], room, toScreen, scale, unit, isSelected ? fixture.id : null, isHover ? fixture.id : null, onRegisterHitBox, fontSize);
      return;
    }
  }

  // Для свободно стоящих объектов (ванна, унитаз, инсталляция, раковина, остров):
  // Находим две ближайшие перпендикулярные стены комнаты (по вертикали X и горизонтали Y)
  const room = rooms.find(r => isPointInsidePolygon({ x: fixture.x, y: fixture.y }, r.points))
    || rooms.find(r => r.id === fixture.roomId);

  const candidateWalls = (room && room.walls && room.walls.length > 0)
    ? room.walls.map(rw => walls.find(w => w.id === rw.id) || rw)
    : walls;

  let nearestVerticalWall: Wall | null = null;
  let minVertDist = Infinity;
  let bestVertProj: Point | null = null;

  let nearestHorizontalWall: Wall | null = null;
  let minHorizDist = Infinity;
  let bestHorizProj: Point | null = null;

  for (const w of candidateWalls) {
    const projResult = projectPointOnSegment({ x: fixture.x, y: fixture.y }, w.start, w.end);
    const dx = Math.abs(w.end.x - w.start.x);
    const dy = Math.abs(w.end.y - w.start.y);
    const isVertical = dy >= dx;

    if (isVertical) {
      if (projResult.dist < minVertDist) {
        minVertDist = projResult.dist;
        nearestVerticalWall = w;
        bestVertProj = projResult.point;
      }
    } else {
      if (projResult.dist < minHorizDist) {
        minHorizDist = projResult.dist;
        nearestHorizontalWall = w;
        bestHorizProj = projResult.point;
      }
    }
  }

  // Если не нашлось строго вертикальных или горизонтальных стен, берем две ближайшие любые
  if (!bestVertProj && !bestHorizProj) {
    let minDist = Infinity;
    for (const w of candidateWalls) {
      const projResult = projectPointOnSegment({ x: fixture.x, y: fixture.y }, w.start, w.end);
      if (projResult.dist < minDist) {
        minDist = projResult.dist;
        bestVertProj = projResult.point;
        minVertDist = projResult.dist;
      }
    }
  }

  ctx.save();
  const strokeColor = isSelected ? '#1d4ed8' : isHover ? '#2563eb' : '#64748b';
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = isSelected ? 1.2 : 0.85;

  const fixScr = toScreen(fixture.x, fixture.y);

  // 1. Привязка к вертикальной стене (размер по горизонтали X)
  if (bestVertProj && minVertDist > 0.08) {
    const projScr = toScreen(bestVertProj.x, bestVertProj.y);

    ctx.setLineDash([3, 2]);
    ctx.beginPath();
    ctx.moveTo(fixScr.x, fixScr.y);
    ctx.lineTo(projScr.x, projScr.y);
    ctx.stroke();

    ctx.setLineDash([]);
    drawArchitecturalTick45(ctx, projScr.x, projScr.y, 4);
    drawArchitecturalTick45(ctx, fixScr.x, fixScr.y, 4);

    const midX = (fixScr.x + projScr.x) / 2;
    const midY = (fixScr.y + projScr.y) / 2;
    const angle = getStandardDimensionAngle(projScr, fixScr);
    const dimText = formatDimValue(minVertDist, unit);
    drawTieTextBadge(ctx, dimText, midX, midY, isSelected, angle, fontSize);

    if (onRegisterHitBox && nearestVerticalWall) {
      onRegisterHitBox({
        key: `fixture_free_tie_vert_${fixture.id}`,
        wallId: nearestVerticalWall.id,
        segIndex: 0,
        text: dimText,
        x: midX,
        y: midY,
        w: 38,
        h: 18,
        lineMid: { x: midX, y: midY },
        angle,
        segLenMeters: minVertDist,
        fixtureId: fixture.id,
        isFixtureTie: true
      });
    }
  }

  // 2. Привязка к горизонтальной стене (размер по вертикали Y)
  if (bestHorizProj && minHorizDist > 0.08) {
    const projScr = toScreen(bestHorizProj.x, bestHorizProj.y);

    ctx.setLineDash([3, 2]);
    ctx.beginPath();
    ctx.moveTo(fixScr.x, fixScr.y);
    ctx.lineTo(projScr.x, projScr.y);
    ctx.stroke();

    ctx.setLineDash([]);
    drawArchitecturalTick45(ctx, projScr.x, projScr.y, 4);
    drawArchitecturalTick45(ctx, fixScr.x, fixScr.y, 4);

    const midX = (fixScr.x + projScr.x) / 2;
    const midY = (fixScr.y + projScr.y) / 2;
    const angle = getStandardDimensionAngle(projScr, fixScr);
    const dimText = formatDimValue(minHorizDist, unit);
    drawTieTextBadge(ctx, dimText, midX, midY, isSelected, angle, fontSize);

    if (onRegisterHitBox && nearestHorizontalWall) {
      onRegisterHitBox({
        key: `fixture_free_tie_horiz_${fixture.id}`,
        wallId: nearestHorizontalWall.id,
        segIndex: 1,
        text: dimText,
        x: midX,
        y: midY,
        w: 38,
        h: 18,
        lineMid: { x: midX, y: midY },
        angle,
        segLenMeters: minHorizDist,
        fixtureId: fixture.id,
        isFixtureTie: true
      });
    }
  }

  ctx.restore();
}

/**
 * Отрисовка 2D архитектурного символа обозначения на Canvas по ГОСТ
 */
export function drawFixture2D(
  ctx: CanvasRenderingContext2D,
  fixture: Fixture,
  screenX: number,
  screenY: number,
  scale: number,
  isSelected: boolean = false,
  isHover: boolean = false
) {
  ctx.save();
  ctx.translate(screenX, screenY);
  ctx.rotate((fixture.rotationDeg * Math.PI) / 180);

  const w = fixture.width * scale;
  const h = fixture.height * scale;
  const halfW = w / 2;
  const halfH = h / 2;

  // Рамка выбора или наведения
  if (isSelected) {
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(-halfW - 5, -halfH - 5, w + 10, h + 10);
    ctx.setLineDash([]);
  } else if (isHover) {
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(-halfW - 3, -halfH - 3, w + 6, h + 6);
    ctx.setLineDash([]);
  }

  const def = getFixtureDefinition(fixture.type);
  const strokeColor = isSelected ? '#1d4ed8' : isHover ? '#d97706' : '#1e293b';
  const fillColor = def.category === 'electric' ? '#ffffff' : '#f8fafc';

  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = fillColor;
  ctx.lineWidth = 1.8;

  const customImgUrl = fixture.customIconUrl || def.customIconUrl;
  if (customImgUrl) {
    const img = getCachedImage(customImgUrl);
    if (img) {
      ctx.drawImage(img, -halfW, -h, w, h);
    } else {
      ctx.strokeRect(-halfW, -h, w, h);
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Загрузка...', 0, -h / 2);
    }
  } else {
    const targetType = fixture.baseGraphic || def.baseGraphic || fixture.type;
    switch (targetType) {
    // --- ЭЛЕКТРИКА: РОЗЕТКИ ПО ГОСТ 21.614-88 ---
    // Плоское основание на y=0 (к стене), полукруг дугой в сторону -Y (в комнату), усики в сторону -Y
    case 'socket_single': {
      const r = Math.min(halfW, halfH) * 0.95;
      ctx.beginPath();
      // Полукруг дугой вверх (-Y, в комнату), диаметр на y=0 (к стене)
      ctx.arc(0, 0, r, Math.PI, 0, false);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Усик розетки перпендикулярно в комнату
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(0, -r * 1.55);
      ctx.stroke();
      break;
    }

    case 'socket_double': {
      const r = Math.min(halfW / 1.3, halfH) * 0.95;
      ctx.beginPath();
      ctx.arc(0, 0, r, Math.PI, 0, false);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Двойной усик в комнату
      ctx.beginPath();
      ctx.moveTo(-r * 0.45, -r * 0.9);
      ctx.lineTo(-r * 0.45, -r * 1.55);
      ctx.moveTo(r * 0.45, -r * 0.9);
      ctx.lineTo(r * 0.45, -r * 1.55);
      ctx.stroke();
      break;
    }

    case 'socket_triple': {
      const r = Math.min(halfW / 1.6, halfH) * 0.95;
      ctx.beginPath();
      ctx.arc(0, 0, r, Math.PI, 0, false);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Тройной усик
      ctx.beginPath();
      ctx.moveTo(-r * 0.6, -r * 0.8);
      ctx.lineTo(-r * 0.6, -r * 1.55);
      ctx.moveTo(0, -r);
      ctx.lineTo(0, -r * 1.55);
      ctx.moveTo(r * 0.6, -r * 0.8);
      ctx.lineTo(r * 0.6, -r * 1.55);
      ctx.stroke();
      break;
    }

    case 'socket_ip44': {
      // Влагозащищенная: закрашенный полукруг по ГОСТ
      const r = Math.min(halfW, halfH) * 0.95;
      ctx.beginPath();
      ctx.arc(0, 0, r, Math.PI, 0, false);
      ctx.closePath();
      ctx.fillStyle = strokeColor;
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(0, -r * 1.55);
      ctx.stroke();
      break;
    }

    case 'socket_cooktop': {
      const r = Math.min(halfW, halfH) * 0.95;
      ctx.beginPath();
      ctx.arc(0, 0, r, Math.PI, 0, false);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Буква «П» или треугольник силовой розетки
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(0, -r * 1.55);
      ctx.stroke();

      ctx.fillStyle = strokeColor;
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('П', 0, -r * 0.45);
      break;
    }

    // --- ВЫКЛЮЧАТЕЛИ ПО ГОСТ 21.614-88 ---
    case 'switch_single': {
      const r = Math.min(halfW, halfH) * 0.75;
      ctx.beginPath();
      // Окружность выключателя примыкает к стене на y=0
      ctx.arc(0, -r, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Штрих от стены через окружность в комнату с флажком
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -r * 2.3);
      ctx.lineTo(r * 0.6, -r * 2.3);
      ctx.stroke();
      break;
    }

    case 'switch_double': {
      const r = Math.min(halfW, halfH) * 0.75;
      ctx.beginPath();
      ctx.arc(0, -r, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -r * 2.3);
      ctx.lineTo(r * 0.6, -r * 2.3);
      ctx.moveTo(0, -r * 1.85);
      ctx.lineTo(r * 0.6, -r * 1.85);
      ctx.stroke();
      break;
    }

    case 'switch_dimmer': {
      const r = Math.min(halfW, halfH) * 0.75;
      ctx.beginPath();
      ctx.arc(0, -r, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Стрелка диммера
      ctx.beginPath();
      ctx.moveTo(-r * 0.5, -r + r * 0.5);
      ctx.lineTo(r * 0.5, -r - r * 0.5);
      ctx.lineTo(r * 0.2, -r - r * 0.5);
      ctx.moveTo(r * 0.5, -r - r * 0.5);
      ctx.lineTo(r * 0.5, -r - r * 0.2);
      ctx.stroke();
      break;
    }

    case 'light_point': {
      const r = Math.min(halfW, halfH) * 0.85;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = '#fef08a';
      ctx.fill();
      ctx.stroke();

      // Крестик люстры / точечного светильника
      ctx.beginPath();
      const cr = r * 0.7;
      ctx.moveTo(-cr, -cr);
      ctx.lineTo(cr, cr);
      ctx.moveTo(-cr, cr);
      ctx.lineTo(cr, -cr);
      ctx.stroke();
      break;
    }

    case 'light_wall': {
      // Бра настенное: диаметр примыкает к стене на y=0, лучи в комнату (-Y)
      const r = Math.min(halfW, halfH) * 0.85;
      ctx.beginPath();
      ctx.arc(0, 0, r, Math.PI, 0, false);
      ctx.closePath();
      ctx.fillStyle = '#fef08a';
      ctx.fill();
      ctx.stroke();

      // Лучи света в комнату
      for (let a = Math.PI * 0.15; a < Math.PI * 0.9; a += Math.PI * 0.25) {
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r, -Math.sin(a) * r);
        ctx.lineTo(Math.cos(a) * (r + 5), -Math.sin(a) * (r + 5));
        ctx.stroke();
      }
      break;
    }

    case 'ac_power': {
      // Кондиционер: задняя стенка примыкает к стене на y=0, корпус в комнате (-Y)
      ctx.fillRect(-halfW, -h, w, h);
      ctx.strokeRect(-halfW, -h, w, h);

      ctx.fillStyle = strokeColor;
      ctx.font = `bold ${Math.max(8, Math.min(12, h * 0.5))}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚡ AC', 0, -h / 2);
      break;
    }

    case 'electrical_panel': {
      // Электрощит: примыкает к стене на y=0
      ctx.fillRect(-halfW, -h, w, h);
      ctx.strokeRect(-halfW, -h, w, h);

      // Диагональная закрашенная половина по ГОСТ
      ctx.fillStyle = strokeColor;
      ctx.beginPath();
      ctx.moveTo(-halfW, -h);
      ctx.lineTo(halfW, -h);
      ctx.lineTo(-halfW, 0);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'thermostat': {
      // Терморегулятор: примыкает к стене на y=0
      ctx.fillRect(-halfW, -h, w, h);
      ctx.strokeRect(-halfW, -h, w, h);

      ctx.fillStyle = strokeColor;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('°t', 0, -h / 2);
      break;
    }

    case 'tv_internet': {
      // ТВ/Интернет розетка: примыкает к стене на y=0
      ctx.fillRect(-halfW, -h, w, h);
      ctx.strokeRect(-halfW, -h, w, h);

      ctx.fillStyle = strokeColor;
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TV/LAN', 0, -h / 2);
      break;
    }

    // --- САНТЕХНИКА ПО ГОСТ 21.205-93 ---
    case 'toilet': {
      // Бачок прижат к стене на y=0
      const tankH = h * 0.30;
      ctx.fillRect(-halfW, -tankH, w, tankH);
      ctx.strokeRect(-halfW, -tankH, w, tankH);

      // Чаша унитаза смотрит в комнату (-Y)
      const bowlCenterY = -tankH - (h - tankH) * 0.48;
      const bowlRadiusX = halfW * 0.85;
      const bowlRadiusY = (h - tankH) * 0.46;

      ctx.beginPath();
      ctx.ellipse(0, bowlCenterY, bowlRadiusX, bowlRadiusY, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(0, bowlCenterY - 2, bowlRadiusX * 0.65, bowlRadiusY * 0.65, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }

    case 'toilet_install': {
      // Инсталляция: скрытая рама на стене y=0 + чаша в комнату (-Y)
      const frameH = h * 0.25;
      ctx.strokeRect(-halfW, -frameH, w, frameH);
      const bowlCenterY = -frameH - (h - frameH) * 0.48;
      const bowlRadiusX = halfW * 0.85;
      const bowlRadiusY = (h - frameH) * 0.46;

      ctx.beginPath();
      ctx.ellipse(0, bowlCenterY, bowlRadiusX, bowlRadiusY, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(0, bowlCenterY - 2, halfW * 0.58, (h - frameH) * 0.32, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }

    case 'bidet': {
      // Биде примыкает к стене на y=0, чаша смотрит в комнату (-Y)
      const bowlCenterY = -h * 0.48;
      ctx.beginPath();
      ctx.ellipse(0, bowlCenterY, halfW * 0.85, h * 0.46, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(0, bowlCenterY - 2, halfW * 0.6, h * 0.32, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }

    case 'bath': {
      // Ванна прямоугольная 170×70:
      // Прижата длинной стороной 1.70м к стене (y=0), чаша направлена внутрь комнаты (-bH)
      const bW = (fixture.width < fixture.height ? fixture.height : fixture.width) * scale;
      const bH = (fixture.width < fixture.height ? fixture.width : fixture.height) * scale;
      const bHalfW = bW / 2;

      ctx.fillRect(-bHalfW, -bH, bW, bH);
      ctx.strokeRect(-bHalfW, -bH, bW, bH);

      const pad = Math.min(bW, bH) * 0.12;
      const innerW = bW - pad * 2;
      const innerH = bH - pad * 2;
      const r = Math.min(innerH / 2, 14);

      ctx.beginPath();
      ctx.roundRect(-innerW / 2, -bH + pad, innerW, innerH, [r, r, r * 0.6, r * 0.6]);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.stroke();

      // Слив у одного из бортов ванны
      ctx.beginPath();
      ctx.arc(-innerW / 2 + 16, -bH / 2, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = strokeColor;
      ctx.fill();
      break;
    }

    case 'bath_corner': {
      ctx.beginPath();
      ctx.moveTo(-halfW, -halfH);
      ctx.lineTo(halfW, -halfH);
      ctx.lineTo(halfW, halfH);
      ctx.arcTo(-halfW, halfH, -halfW, -halfH, halfW);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fillStyle = strokeColor;
      ctx.fill();
      break;
    }

    case 'shower': {
      // Душевой поддон: прижат к стене (y=0), внутрь комнаты (-h)
      ctx.fillRect(-halfW, -h, w, h);
      ctx.strokeRect(-halfW, -h, w, h);

      ctx.beginPath();
      ctx.moveTo(-halfW, -h);
      ctx.lineTo(halfW, 0);
      ctx.moveTo(-halfW, 0);
      ctx.lineTo(halfW, -h);
      ctx.stroke();

      // Трап по центру поддона
      ctx.beginPath();
      ctx.arc(0, -h / 2, Math.min(halfW * 0.25, 7), 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      break;
    }

    case 'sink': {
      ctx.fillRect(-halfW, -h, w, h);
      ctx.strokeRect(-halfW, -h, w, h);

      ctx.beginPath();
      ctx.ellipse(0, -h * 0.5, halfW * 0.78, h * 0.38, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, -h * 0.8, 3, 0, Math.PI * 2);
      ctx.fillStyle = strokeColor;
      ctx.fill();
      break;
    }

    case 'vanity_unit': {
      // Тумба с раковиной: примыкает к стене на y=0
      ctx.fillRect(-halfW, -h, w, h);
      ctx.strokeRect(-halfW, -h, w, h);

      ctx.beginPath();
      ctx.roundRect(-halfW * 0.8, -h * 0.85, w * 0.8, h * 0.7, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, -h * 0.5, 3, 0, Math.PI * 2);
      ctx.fillStyle = strokeColor;
      ctx.fill();
      break;
    }

    case 'towel_heater': {
      ctx.strokeRect(-halfW, -h, w, h);
      const bars = 4;
      for (let i = 1; i < bars; i++) {
        const yPos = -h + (h / bars) * i;
        ctx.beginPath();
        ctx.moveTo(-halfW, yPos);
        ctx.lineTo(halfW, yPos);
        ctx.stroke();
      }
      break;
    }

    case 'water_heater': {
      // Круглый водонагреватель (бойлер): окружность примыкает к стене на y=0
      const r = Math.min(halfW, halfH) * 0.9;
      ctx.beginPath();
      ctx.arc(0, -r, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = strokeColor;
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('♨', 0, -r);
      break;
    }

    case 'water_manifold': {
      ctx.fillRect(-halfW, -h, w, h);
      ctx.strokeRect(-halfW, -h, w, h);

      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(-halfW * 0.4, -h / 2, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.arc(halfW * 0.4, -h / 2, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'washing_machine': {
      ctx.fillRect(-halfW, -halfH, w, h);
      ctx.strokeRect(-halfW, -halfH, w, h);

      ctx.beginPath();
      ctx.arc(0, 3, Math.min(halfW, halfH) * 0.62, 0, Math.PI * 2);
      ctx.fillStyle = '#f1f5f9';
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'washing_dryer': {
      ctx.fillRect(-halfW, -halfH, w, h);
      ctx.strokeRect(-halfW, -halfH, w, h);

      ctx.beginPath();
      ctx.arc(0, 0, Math.min(halfW, halfH) * 0.62, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = strokeColor;
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('СМА+СУШ', 0, 0);
      break;
    }

    // --- КУХНЯ ---
    case 'kitchen_sink': {
      // Мойка кухни примыкает к стене на y=0
      ctx.fillRect(-halfW, -h, w, h);
      ctx.strokeRect(-halfW, -h, w, h);

      // Чаша мойки
      ctx.beginPath();
      ctx.roundRect(-halfW * 0.85, -h * 0.88, halfW * 0.9, h * 0.75, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.stroke();

      // Крыло с бороздками
      const lines = 4;
      for (let i = 1; i <= lines; i++) {
        const xPos = halfW * 0.15 + (halfW * 0.7 / lines) * i;
        ctx.beginPath();
        ctx.moveTo(xPos, -h * 0.8);
        ctx.lineTo(xPos, -h * 0.2);
        ctx.stroke();
      }
      break;
    }

    case 'cooktop':
    case 'kitchen_hob': {
      // Варочная панель примыкает к стене на y=0
      ctx.fillRect(-halfW, -h, w, h);
      ctx.strokeRect(-halfW, -h, w, h);

      // 4 конфорки
      const r1 = Math.min(halfW, h / 2) * 0.28;
      const r2 = Math.min(halfW, h / 2) * 0.20;
      const ox = halfW * 0.5;
      const oy = -h * 0.5;

      ctx.beginPath();
      ctx.arc(-ox, oy - h * 0.2, r1, 0, Math.PI * 2);
      ctx.arc(ox, oy - h * 0.2, r2, 0, Math.PI * 2);
      ctx.arc(-ox, oy + h * 0.2, r2, 0, Math.PI * 2);
      ctx.arc(ox, oy + h * 0.2, r1, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }

    case 'oven':
    case 'kitchen_oven': {
      ctx.fillRect(-halfW, -h, w, h);
      ctx.strokeRect(-halfW, -h, w, h);

      ctx.beginPath();
      ctx.roundRect(-halfW * 0.75, -h * 0.85, w * 0.75, h * 0.7, 3);
      ctx.stroke();
      break;
    }

    case 'refrigerator':
    case 'fridge':
    case 'kitchen_fridge': {
      ctx.fillRect(-halfW, -h, w, h);
      ctx.strokeRect(-halfW, -h, w, h);

      ctx.beginPath();
      ctx.moveTo(-halfW, -h * 0.6);
      ctx.lineTo(halfW, -h * 0.6);
      ctx.stroke();

      ctx.fillStyle = strokeColor;
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ХОЛОД', 0, -h * 0.3);
      break;
    }

    case 'dishwasher':
    case 'kitchen_dishwasher': {
      ctx.fillRect(-halfW, -h, w, h);
      ctx.strokeRect(-halfW, -h, w, h);

      ctx.fillStyle = strokeColor;
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ПММ', 0, -h / 2);
      break;
    }

    case 'hood':
    case 'kitchen_hood': {
      ctx.beginPath();
      ctx.moveTo(-halfW, 0);
      ctx.lineTo(halfW, 0);
      ctx.lineTo(halfW * 0.5, -h);
      ctx.lineTo(-halfW * 0.5, -h);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'radiator': {
      ctx.fillRect(-halfW, -h, w, h);
      ctx.strokeRect(-halfW, -h, w, h);
      const numSections = Math.max(3, Math.floor(w / 14));
      const secW = w / numSections;
      ctx.beginPath();
      for (let i = 1; i < numSections; i++) {
        ctx.moveTo(-halfW + i * secW, -h);
        ctx.lineTo(-halfW + i * secW, 0);
      }
      ctx.stroke();
      break;
    }

    case 'floor_convector': {
      ctx.strokeRect(-halfW, -h, w, h);
      ctx.setLineDash([2, 2]);
      ctx.strokeRect(-halfW + 3, -h + 3, w - 6, h - 6);
      ctx.setLineDash([]);
      break;
    }

    case 'air_conditioner': {
      ctx.fillRect(-halfW, -h, w, h);
      ctx.strokeRect(-halfW, -h, w, h);
      ctx.beginPath();
      ctx.moveTo(-halfW + 4, -h * 0.35);
      ctx.lineTo(halfW - 4, -h * 0.35);
      ctx.stroke();
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(halfW - 8, -h * 0.7, 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'vent_grille': {
      ctx.fillRect(-halfW, -h, w, h);
      ctx.strokeRect(-halfW, -h, w, h);
      ctx.beginPath();
      ctx.moveTo(-halfW + 3, -h * 0.33);
      ctx.lineTo(halfW - 3, -h * 0.33);
      ctx.moveTo(-halfW + 3, -h * 0.66);
      ctx.lineTo(halfW - 3, -h * 0.66);
      ctx.stroke();
      break;
    }

    // --- СТОЯКИ АР (ГОСТ) ---
    case 'riser_sewer':
    case 'riser_water_hot_cold':
    case 'riser_water_cold': {
      const radius = Math.max(5, Math.min(halfW, halfH) * 0.9);
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const label = fixture.type === 'riser_sewer' ? 'К' : fixture.type === 'riser_water_hot_cold' ? 'Х.Г.' : 'Х.Т.';
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 12px "Consolas", monospace, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, radius + 4, -1);
      break;
    }

    case 'vent_shaft_double': {
      // Прямоугольный короб вентшахты
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-halfW, -halfH, w, h);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.6;
      ctx.strokeRect(-halfW, -halfH, w, h);

      // Два круглых канала (ГОСТ АР, как 31×71 на обмерном плане)
      const r = Math.min(halfH * 0.72, halfW * 0.38);
      const shiftX = halfW * 0.46;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-shiftX, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(shiftX, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 8px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('31×71', 0, 0);
      break;
    }

    case 'vent_shaft_single': {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-halfW, -halfH, w, h);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.6;
      ctx.strokeRect(-halfW, -halfH, w, h);

      const r = Math.min(halfW, halfH) * 0.72;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 8px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Вент', 0, 0);
      break;
    }

    default: {
      // Пользовательские обозначения (созданные вручную)
      if (def.baseGraphic === 'socket') {
        const r = Math.min(halfW, halfH) * 0.95;
        ctx.beginPath();
        ctx.arc(0, 0, r, Math.PI, 0, false);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.lineTo(0, -r * 1.55);
        ctx.stroke();

        if (def.iconText) {
          ctx.fillStyle = strokeColor;
          ctx.font = 'bold 8px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(def.iconText, 0, -r * 0.45);
        }
      } else if (def.baseGraphic === 'switch') {
        const r = Math.min(halfW, halfH) * 0.75;
        ctx.beginPath();
        ctx.arc(0, -r, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -r * 2.3);
        ctx.lineTo(r * 0.6, -r * 2.3);
        ctx.stroke();
      } else if (def.baseGraphic === 'light') {
        const r = Math.min(halfW, halfH) * 0.85;
        ctx.beginPath();
        ctx.arc(0, -r, r, 0, Math.PI * 2);
        ctx.fillStyle = '#fef08a';
        ctx.fill();
        ctx.stroke();

        const cr = r * 0.7;
        ctx.beginPath();
        ctx.moveTo(-cr, -r - cr);
        ctx.lineTo(cr, -r + cr);
        ctx.moveTo(-cr, -r + cr);
        ctx.lineTo(cr, -r - cr);
        ctx.stroke();
      } else if (def.baseGraphic === 'circle') {
        const r = Math.min(halfW, halfH) * 0.9;
        ctx.beginPath();
        ctx.arc(0, -r, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = strokeColor;
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(def.iconText || def.shortLabel.slice(0, 3), 0, -r);
      } else {
        // 'box' или стандартный настенный блок
        ctx.fillRect(-halfW, -h, w, h);
        ctx.strokeRect(-halfW, -h, w, h);

        ctx.fillStyle = strokeColor;
        ctx.font = `bold ${Math.max(8, Math.min(11, h * 0.45))}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(def.iconText || def.shortLabel.slice(0, 5), 0, -h / 2);
      }
      break;
    }
  }
}

  // Текстовая подпись: рисуется ТОЛЬКО для свободно стоящих объектов без привязки к стене
  // При наличии стены (wallId) имя и отметка высоты уже отображаются на полочке-выноске
  // в свободном пространстве комнаты, а стена остается чистой
  if (scale >= 45 && !fixture.type.startsWith('riser_') && !fixture.wallId) {
    ctx.save();
    // Разворачиваем угол обратно на 0°, чтобы текст ВСЕГДА был строго горизонтальным
    // и читаемым слева направо (без переворота кверху ногами при любом угле поворота объекта)
    ctx.rotate(-(fixture.rotationDeg * Math.PI) / 180);

    const isToiletInstall = fixture.type === 'toilet_install' || def.baseGraphic === 'toilet_install';
    const topLimit = isToiletInstall ? -h : -halfH;
    const badgeY = topLimit - 12;

    const hStr = `h=${(fixture.installationHeight || def.defaultHeightFromFloor).toFixed(2)}м`;
    const labelText = `${def.shortLabel} (${hStr})`;

    ctx.font = '600 9px "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif';
    const tm = ctx.measureText(labelText);
    const boxW = tm.width + 8;
    const boxH = 13;

    // Сплошная аккуратная белая подложка, чтобы текст не сливался с чертежом
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-boxW / 2, badgeY - boxH / 2, boxW, boxH);

    ctx.strokeStyle = isSelected ? '#2563eb' : 'rgba(203, 213, 225, 0.9)';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(-boxW / 2, badgeY - boxH / 2, boxW, boxH);

    ctx.fillStyle = isSelected ? '#1d4ed8' : '#0f172a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, 0, badgeY);

    ctx.restore();
  }

  ctx.restore();
}
