import { Point, Wall, Room, DimensionUnit, Fixture } from './types';
import { distance } from './geometry';

/**
 * Форматирование значения размера:
 * - 'mm': целое число в миллиметрах (ГОСТ / АР: 5200, 3670, 1250, 180, 130)
 * - 'cm': в сантиметрах с 1 знаком или целое (ГОСТ / отделка: 520, 367, 125, 18, 13, 848.6)
 * - 'm': в метрах с двумя знаками (5.20 м, 1.25 м)
 */
export function formatDimValue(meters: number, unit: DimensionUnit = 'mm'): string {
  if (unit === 'mm') {
    const val = Math.round(meters * 1000);
    // Разделение разрядов пробелом по ГОСТ: 1 300, 10 080, 5 200, 840
    return val.toLocaleString('ru-RU');
  }
  if (unit === 'cm') {
    const cm = meters * 100;
    if (Math.abs(cm - Math.round(cm)) < 0.05) {
      return Math.round(cm).toLocaleString('ru-RU');
    }
    return cm.toFixed(1).replace('.', ',');
  }
  return `${meters.toFixed(2).replace('.', ',')} м`;
}

/**
 * Отрисовка засечки 45° по ГОСТ/СПДС на конце размерного сегмента
 */
export function drawArchitecturalTick45(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number = 4.5
) {
  ctx.beginPath();
  ctx.moveTo(x - size, y + size);
  ctx.lineTo(x + size, y - size);
  ctx.stroke();
}

/**
 * Отрисовка выносной линии с легким перехлестом (выходом за размерную линию на 2-3px)
 */
function drawWitnessLine(
  ctx: CanvasRenderingContext2D,
  wallPt: Point,
  dimPt: Point,
  overshootPx: number = 3
) {
  const dx = dimPt.x - wallPt.x;
  const dy = dimPt.y - wallPt.y;
  const len = Math.hypot(dx, dy);
  if (len < 1) return;

  const nx = (dx / len) * overshootPx;
  const ny = (dy / len) * overshootPx;

  ctx.beginPath();
  ctx.moveTo(wallPt.x, wallPt.y);
  ctx.lineTo(dimPt.x + nx, dimPt.y + ny);
  ctx.stroke();
}

/**
 * Вычисляет угол поворота текста размера по ГОСТ 2.307-2011:
 * - Для вертикальных линий (|dy| > |dx|): строго -PI / 2 (-90°).
 *   Текст читается снизу вверх, верх цифр направлен строго ВЛЕВО от линии (к левому полю чертежа).
 * - Для горизонтальных и пологих линий (|dx| >= |dy|): 0 (читается слева направо, верх цифр вверх).
 */
export function getStandardDimensionAngle(start: Point, end: Point): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  // Вертикальные линии (боковые стены, вертикальные простенки и вертикальные цепочки привязок)
  if (Math.abs(dy) > Math.abs(dx)) {
    return -Math.PI / 2;
  }

  // Горизонтальные и пологие линии
  let angle = Math.atan2(dy, dx);
  if (angle > Math.PI / 2) {
    angle -= Math.PI;
  } else if (angle < -Math.PI / 2) {
    angle += Math.PI;
  }
  return angle;
}

export interface DimHitBox {
  key: string;
  wallId: string;
  segIndex: number;
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
  lineMid: Point;
  angle: number;
  segLenMeters: number;
  openingId?: string;
  isOpening?: boolean;
  pA?: Point;
  pB?: Point;
  fixtureId?: string;
  isFixtureTie?: boolean;
}

/**
 * Отрисовка размерного числа вдоль линии с правильным поворотом (ГОСТ 2.307-2011)
 * С чистой белой высечкой (knockout), компактным инженерным шрифтом 9px без массивных рамок,
 * поддержкой ручного перетаскивания (Drag-to-Move) с авто-выноской по ГОСТ
 * и защитой от наложений (шахматный разнос на полочку при узких сегментах)
 */
function drawDimensionTextOnLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  start: Point,
  end: Point,
  isHighlight: boolean = false,
  baseFontSize: number = 9.0,
  staggerIndex: number = 0,
  manualOffset?: { x: number; y: number }
): { x: number; y: number; w: number; h: number; angle: number } {
  const segLenPx = Math.hypot(end.x - start.x, end.y - start.y);
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;

  const standardAngle = getStandardDimensionAngle(start, end);
  const hasManual = manualOffset && (Math.abs(manualOffset.x) > 0.5 || Math.abs(manualOffset.y) > 0.5);

  const posX = hasManual ? midX + manualOffset.x : midX;
  const posY = hasManual ? midY + manualOffset.y : midY;
  // При ручном выносе цифры держим горизонтально для идеальной читаемости по ГОСТ
  const angle = hasManual ? 0 : standardAngle;

  // Компактный четкий инженерный ГОСТ-шрифт (аккуратный, без гигантских букв)
  const fontSize = segLenPx < 30 ? Math.max(7.5, baseFontSize - 1.2) : isHighlight ? baseFontSize + 1.5 : baseFontSize;
  ctx.font = `600 ${fontSize}px "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif`;
  try {
    (ctx as any).letterSpacing = '0.2px';
  } catch (e) {
    // игнорируем, если letterSpacing не поддерживается
  }
  const textMetrics = ctx.measureText(text);
  const padX = 2.5;
  const boxW = textMetrics.width + padX * 2;
  const boxH = fontSize + 2.5;

  // Если есть ручной перенос и отодвинули дальше 10px — строим тонкую аккуратную выноску с полочкой по ГОСТ
  if (hasManual && Math.hypot(manualOffset.x, manualOffset.y) > 10) {
    ctx.save();
    ctx.strokeStyle = isHighlight ? '#2563eb' : '#64748b';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(midX, midY);
    ctx.lineTo(posX, posY);
    ctx.stroke();

    // Засечка-точка в месте отрыва от размерной линии
    ctx.fillStyle = isHighlight ? '#2563eb' : '#64748b';
    ctx.beginPath();
    ctx.arc(midX, midY, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(posX, posY);
  if (angle !== 0) {
    ctx.rotate(angle);
  }

  // Если сегмент слишком узкий и нет ручного смещения — выносим в шахматном порядке
  const isNarrow = !hasManual && segLenPx < boxW + 4;
  const offsetY = isNarrow ? (staggerIndex % 2 === 0 ? -10.5 : 10.5) : 0;

  if (isNarrow) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, offsetY > 0 ? offsetY - boxH / 2 : offsetY + boxH / 2);
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.5)';
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }

  // Непрозрачная чистая белая маска под текстом (высечка линии по ГОСТ)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-boxW / 2, -boxH / 2 + offsetY, boxW, boxH);

  // Тонкий контур при выделении или при ручном сдвиге
  if (isHighlight || hasManual) {
    ctx.strokeStyle = isHighlight ? '#2563eb' : '#0284c7';
    ctx.lineWidth = isHighlight ? 1.2 : 0.8;
    ctx.strokeRect(-boxW / 2, -boxH / 2 + offsetY, boxW, boxH);
  }

  // Цвет цифр: синий при ручном сдвиге/выделении или тёмный по чертежу
  ctx.fillStyle = isHighlight ? '#1d4ed8' : hasManual ? '#0369a1' : '#0f172a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, offsetY);

  ctx.restore();

  return {
    x: posX,
    y: posY + offsetY,
    w: boxW,
    h: boxH,
    angle,
  };
}

/**
 * Отрисовка архитектурных размерных цепочек вдоль всех стен:
 * - сплошная цепочка от угла до проема, по проему (дверь/окно), до объектов на стене и до угла
 * - засечки 45°
 * - выносные линии
 * - размеры в мм / см / м
 */
export function drawArchitecturalWallChains(
  ctx: CanvasRenderingContext2D,
  walls: Wall[],
  rooms: Room[],
  toScreen: (x: number, y: number) => Point,
  scale: number,
  options: {
    unit: DimensionUnit;
    selectedWallId: string | null;
    hoveredWallId: string | null;
    chainOffsetMeters?: number;
    fixtures?: Fixture[];
    ghostFixture?: { wallId?: string; distanceFromCorner?: number };
    fontSize?: number;
    manualOffsets?: Record<string, { x: number; y: number }>;
    onRegisterHitBox?: (hitBox: DimHitBox) => void;
  }
) {
  const { 
    unit, 
    selectedWallId, 
    hoveredWallId, 
    chainOffsetMeters = 0.28, 
    fixtures, 
    ghostFixture, 
    fontSize = 9.0,
    manualOffsets,
    onRegisterHitBox
  } = options;

  // Пространственный список нарисованных меток для предотвращения наложений в углах (Smart ГОСТ)
  const drawnLabelPositions: { x: number; y: number }[] = [];

  walls.forEach(wall => {
    const wallLen = distance(wall.start, wall.end);
    if (wallLen < 0.20) return;

    const isSelected = wall.id === selectedWallId;
    const isHovered = wall.id === hoveredWallId;

    const ux = (wall.end.x - wall.start.x) / wallLen;
    const uy = (wall.end.y - wall.start.y) / wallLen;

    // Нормаль к стене
    const n1 = { x: -uy, y: ux };
    const n2 = { x: uy, y: -ux };

    // Выбираем сторону смещения размерной цепочки:
    // если стена принадлежит комнате, смещаем внутрь комнаты для чистоты плана
    let norm = n1;
    const room = rooms.find(r => r.walls?.some(w => w.id === wall.id));
    if (room && room.points.length >= 3) {
      const midWall = { x: (wall.start.x + wall.end.x) / 2, y: (wall.start.y + wall.end.y) / 2 };
      const testPt = { x: midWall.x + n1.x * 0.15, y: midWall.y + n1.y * 0.15 };
      // Простая проверка через центроид
      let inside = false;
      const poly = room.points;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i].x, yi = poly[i].y;
        const xj = poly[j].x, yj = poly[j].y;
        const intersect = ((yi > testPt.y) !== (yj > testPt.y)) &&
          (testPt.x < (xj - xi) * (testPt.y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }
      norm = inside ? n1 : n2;
    }

    const halfThick = (wall.thickness || 0.15) / 2;
    // Если на этой стене есть розетки или оборудование, смещаем общую архитектурную цепочку
    // дальше в комнату, чтобы она не накладывалась на ярусы розеток, а шла отдельным ярусом
    const wallFixCount = fixtures ? fixtures.filter(f => f.wallId === wall.id).length : 0;
    const fixtureClearance = wallFixCount > 0 ? (34 + (wallFixCount - 1) * 30 + 36) / scale : 0;
    const actualOffset = halfThick + Math.max(chainOffsetMeters, fixtureClearance);

    // Проверяем толщину примыкающих в углах стен для чистового размера (от штукатурки до штукатурки)
    let startInset = 0;
    let endInset = 0;
    if (room) {
      walls.forEach(other => {
        if (other.id === wall.id) return;
        const otherHalf = (other.thickness || 0.10) / 2;
        if (distance(other.start, wall.start) < 0.06 || distance(other.end, wall.start) < 0.06) {
          startInset = Math.max(startInset, otherHalf);
        }
        if (distance(other.start, wall.end) < 0.06 || distance(other.end, wall.end) < 0.06) {
          endInset = Math.max(endInset, otherHalf);
        }
      });
    }

    const startBound = startInset;
    const endBound = Math.max(startBound + 0.10, wallLen - endInset);

    // 1. Собираем точки деления стены проемами (двери, окна)
    const cutOffsets: number[] = [startBound, endBound];
    if (wall.openings && wall.openings.length > 0) {
      wall.openings.forEach(op => {
        const pStart = Math.max(startBound, op.offsetMeters - op.width / 2);
        const pEnd = Math.min(endBound, op.offsetMeters + op.width / 2);
        if (pStart > startBound + 0.02 && pStart < endBound - 0.02) cutOffsets.push(pStart);
        if (pEnd > startBound + 0.02 && pEnd < endBound - 0.02) cutOffsets.push(pEnd);
      });
    }

    // Сортируем и удаляем дубликаты
    cutOffsets.sort((a, b) => a - b);
    const uniqueOffsets: number[] = [];
    cutOffsets.forEach(val => {
      if (uniqueOffsets.length === 0 || Math.abs(val - uniqueOffsets[uniqueOffsets.length - 1]) > 0.02) {
        uniqueOffsets.push(val);
      }
    });

    if (uniqueOffsets.length < 2) return;

    // Настройка стилей линий чертежа
    ctx.save();
    ctx.strokeStyle = isSelected ? '#1d4ed8' : isHovered ? '#2563eb' : '#334155';
    ctx.lineWidth = isSelected ? 1.4 : 0.9;

    // 2. Рисуем выносные линии от углов и стыков проемов/объектов до размерной линии
    const screenWallPoints: Point[] = [];
    const screenDimPoints: Point[] = [];

    uniqueOffsets.forEach(off => {
      const wallPtX = wall.start.x + ux * off;
      const wallPtY = wall.start.y + uy * off;
      const dimPtX = wallPtX + norm.x * actualOffset;
      const dimPtY = wallPtY + norm.y * actualOffset;

      const scrWall = toScreen(wallPtX, wallPtY);
      const scrDim = toScreen(dimPtX, dimPtY);

      screenWallPoints.push(scrWall);
      screenDimPoints.push(scrDim);

      drawWitnessLine(ctx, scrWall, scrDim, 3);
      drawArchitecturalTick45(ctx, scrDim.x, scrDim.y, 4);
    });

    // 3. Рисуем размерные сегменты и подписи чисел
    for (let i = 0; i < uniqueOffsets.length - 1; i++) {
      const pA = screenDimPoints[i];
      const pB = screenDimPoints[i + 1];
      const segLenMeters = uniqueOffsets[i + 1] - uniqueOffsets[i];
      if (segLenMeters < 0.03) continue;

      // Размерная линия между засечками
      ctx.beginPath();
      ctx.moveTo(pA.x, pA.y);
      ctx.lineTo(pB.x, pB.y);
      ctx.stroke();

      const dimKey = `${wall.id}_seg_${i}`;
      const manual = manualOffsets ? manualOffsets[dimKey] : undefined;
      const midX = (pA.x + pB.x) / 2;
      const midY = (pA.y + pB.y) / 2;

      // Если нет ручного смещения — проверяем наложение в углах (Smart ГОСТ)
      if (!manual) {
        const hasCollision = drawnLabelPositions.some(
          pos => Math.hypot(pos.x - midX, pos.y - midY) < 22
        );
        // Если это микро-сегмент в углу (< 28 см) и есть коллизия — пропускаем дублирующую цифру
        if (hasCollision && segLenMeters < 0.28) {
          continue;
        }
      }

      // Текстовая подпись размера (например 5200, 1260, 180 в мм, или 520, 126 в см)
      const text = formatDimValue(segLenMeters, unit);
      const box = drawDimensionTextOnLine(ctx, text, pA, pB, isSelected, fontSize, i, manual);
      drawnLabelPositions.push({ x: box.x, y: box.y });

      if (onRegisterHitBox) {
        onRegisterHitBox({
          key: dimKey,
          wallId: wall.id,
          segIndex: i,
          text,
          x: box.x,
          y: box.y,
          w: box.w,
          h: box.h,
          lineMid: { x: midX, y: midY },
          angle: box.angle,
          segLenMeters,
        });
      }
    }

    ctx.restore();
  });
}

/**
 * Отрисовка внутренних габаритных линий комнат (Span Dimensions):
 * - Тонкие поперечные размерные линии с засечками 45° (как 5200 и 3670 в Кухне на образце)
 */
export function drawRoomSpanDimensions(
  ctx: CanvasRenderingContext2D,
  rooms: Room[],
  toScreen: (x: number, y: number) => Point,
  scale: number,
  unit: DimensionUnit = 'mm',
  onRegisterHitBox?: (hitBox: DimHitBox) => void,
  fontSize: number = 9.0
) {
  if (scale < 25) return; // Не перегружать при сильном отдалении

  rooms.forEach(room => {
    if (room.points.length < 3) return;

    // В малых помещениях (санузлы, ванные, гардеробные, тамбуры площадью < 6.8 м²)
    // габаритные перекрестные стрелки не рисуем, так как стены уже имеют полные размерные цепочки.
    // Это исключает визуальную "кашу" и наложения в узких зонах.
    if (room.floorArea < 6.8) return;

    // Находим габариты комнаты (bounding box)
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    room.points.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });

    const roomW = maxX - minX;
    const roomH = maxY - minY;

    // Центр комнаты
    let cx = 0, cy = 0;
    room.points.forEach(p => {
      cx += p.x;
      cy += p.y;
    });
    cx /= room.points.length;
    cy /= room.points.length;

    // Вычисляем чистовые внутренние габариты (от штукатурки до штукатурки по граням стен)
    let leftThick = 0;
    let rightThick = 0;
    let topThick = 0;
    let bottomThick = 0;

    if (room.walls && room.walls.length > 0) {
      room.walls.forEach(w => {
        const isVert = Math.abs(w.end.x - w.start.x) < Math.abs(w.end.y - w.start.y);
        const mid = { x: (w.start.x + w.end.x) / 2, y: (w.start.y + w.end.y) / 2 };
        const halfT = (w.thickness || 0.10) / 2;
        if (isVert) {
          if (mid.x <= minX + 0.15) leftThick = Math.max(leftThick, halfT);
          if (mid.x >= maxX - 0.15) rightThick = Math.max(rightThick, halfT);
        } else {
          if (mid.y <= minY + 0.15) topThick = Math.max(topThick, halfT);
          if (mid.y >= maxY - 0.15) bottomThick = Math.max(bottomThick, halfT);
        }
      });
    }

    const clearMinX = minX + leftThick;
    const clearMaxX = maxX - rightThick;
    const clearMinY = minY + topThick;
    const clearMaxY = maxY - bottomThick;

    const clearW = Math.max(0.6, clearMaxX - clearMinX);
    const clearH = Math.max(0.6, clearMaxY - clearMinY);

    ctx.save();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 0.85;

    // Находим положение марки помещения, чтобы размерные линии никогда не накладывались на нее
    const labelPt = room.labelPosition || { x: cx, y: cy };

    // 1. Горизонтальная внутренняя размерная линия (чистая ширина комнаты в чистоте, например 5200)
    if (clearW >= 0.9) {
      let lineY = clearMinY + Math.max(clearH * 0.24, 0.55);
      if (Math.abs(lineY - labelPt.y) < 0.50) {
        lineY = labelPt.y > cy ? clearMinY + clearH * 0.18 : clearMaxY - clearH * 0.18;
      }

      const scrStart = toScreen(clearMinX, lineY);
      const scrEnd = toScreen(clearMaxX, lineY);

      ctx.beginPath();
      ctx.moveTo(scrStart.x, scrStart.y);
      ctx.lineTo(scrEnd.x, scrEnd.y);
      ctx.stroke();

      drawArchitecturalTick45(ctx, scrStart.x, scrStart.y, 4);
      drawArchitecturalTick45(ctx, scrEnd.x, scrEnd.y, 4);

      const text = formatDimValue(clearW, unit);
      drawDimensionTextOnLine(ctx, text, scrStart, scrEnd, false, fontSize, 0);
    }

    // 2. Вертикальная внутренняя размерная линия (чистая длина комнаты в чистоте, например 3670)
    if (clearH >= 0.9) {
      let lineX = clearMinX + Math.max(clearW * 0.24, 0.55);
      if (Math.abs(lineX - labelPt.x) < 0.50) {
        lineX = labelPt.x > cx ? clearMinX + clearW * 0.18 : clearMaxX - clearW * 0.18;
      }

      const scrStart = toScreen(lineX, clearMinY);
      const scrEnd = toScreen(lineX, clearMaxY);

      ctx.beginPath();
      ctx.moveTo(scrStart.x, scrStart.y);
      ctx.lineTo(scrEnd.x, scrEnd.y);
      ctx.stroke();

      drawArchitecturalTick45(ctx, scrStart.x, scrStart.y, 4);
      drawArchitecturalTick45(ctx, scrEnd.x, scrEnd.y, 4);

      const text = formatDimValue(clearH, unit);
      drawDimensionTextOnLine(ctx, text, scrStart, scrEnd, false, fontSize, 1);
    }

    ctx.restore();
  });
}

/**
 * Отрисовка чистых архитектурных подписей комнат прямо на холсте (как на чертеже: Кухня, Ванная, h=3,04)
 */
export function drawArchitecturalRoomLabels(
  ctx: CanvasRenderingContext2D,
  rooms: Room[],
  toScreen: (x: number, y: number) => Point,
  scale: number,
  globalCeilingHeight: number = 3.04,
  fontScaleFactor: number = 1.0
) {
  rooms.forEach(room => {
    if (room.points.length < 3) return;

    let cx = 0, cy = 0;
    room.points.forEach(p => {
      cx += p.x;
      cy += p.y;
    });
    cx /= room.points.length;
    cy /= room.points.length;

    const scr = toScreen(cx, cy);

    ctx.save();
    // Название помещения (как «Кухня», «Жилая с гардеробом» на плане)
    const namePx = Math.round(13 * fontScaleFactor);
    ctx.font = `700 ${namePx}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(room.name, scr.x, scr.y - 7 * fontScaleFactor);

    // Площадь комнаты (например 39.95 м²)
    const areaPx = Math.round(11 * fontScaleFactor);
    ctx.font = `600 ${areaPx}px "Consolas", monospace, sans-serif`;
    ctx.fillStyle = '#2563eb';
    ctx.fillText(`${room.floorArea} м²`, scr.x, scr.y + 8 * fontScaleFactor);

    ctx.restore();
  });
}

/**
 * Отрисовка глобальной отметки высоты потолка на плане (например h=3,04 в правом верхнем углу, как на образце)
 */
export function drawCeilingHeightStamp(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  ceilingHeight: number = 3.04,
  fontSize: number = 18
) {
  ctx.save();
  const text = `h=${ceilingHeight.toFixed(2).replace('.', ',')}`;
  ctx.font = `600 ${fontSize}px "Consolas", monospace, sans-serif`;
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText(text, canvasWidth - 28, 24);
  ctx.restore();
}
