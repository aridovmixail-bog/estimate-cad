import { Point, Wall, Opening, Room } from './types';

export const SNAP_RADIUS_PX = 24; // Радиус магнитного притяжения в пикселях
export const ALIGN_GUIDE_THRESHOLD_PX = 18;
export const ORTHO_ANGLE_THRESHOLD_DEG = 12;

export function distance(p1: Point, p2: Point): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

/**
 * Проекция точки P на отрезок AB.
 */
export function projectPointOnSegment(p: Point, a: Point, b: Point): { point: Point; t: number; dist: number } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;

  if (lenSq < 0.00001) {
    return { point: a, t: 0, dist: distance(p, a) };
  }

  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const proj = { x: a.x + t * dx, y: a.y + t * dy };
  return { point: proj, t, dist: distance(p, proj) };
}

export interface AlignmentGuide {
  from: Point;
  to: Point;
  axis: 'x' | 'y';
}

export interface SmartSnapResult {
  point: Point;
  isSnappedToVertex: boolean;
  snappedVertex: Point | null;
  isSnappedToWall: boolean;
  snappedWall: Wall | null;
  guides: AlignmentGuide[];
}

export function calculateSmartSnap(
  startPoint: Point | null,
  rawCursor: Point,
  referencePoints: Point[],
  scale: number,
  orthoMode: boolean,
  walls: Wall[] = []
): SmartSnapResult {
  const thresholdMeters = SNAP_RADIUS_PX / scale;
  const guideThresholdMeters = ALIGN_GUIDE_THRESHOLD_PX / scale;

  // =========================================================================
  // РЕЖИМ 1: ОРТОГОНАЛЬНОЕ ЧЕРЧЕНИЕ (Зажат Пробел или включен режим Ortho 90°)
  // Линия ОБЯЗАНА быть СТРОГО 90° (горизонтальной либо вертикальной).
  // Никакие угловые вершины или косые проекции НЕ ДОЛЖНЫ отклонять угол!
  // =========================================================================
  if (startPoint && orthoMode) {
    const dx = rawCursor.x - startPoint.x;
    const dy = rawCursor.y - startPoint.y;
    const isHorizontal = Math.abs(dx) >= Math.abs(dy);

    let currentX = rawCursor.x;
    let currentY = rawCursor.y;
    const guides: AlignmentGuide[] = [];
    let isSnappedToVertex = false;
    let snappedVertex: Point | null = null;
    let isSnappedToWall = false;
    let snappedWall: Wall | null = null;

    if (isHorizontal) {
      // СТРОГО фиксируем Y на уровне стартовой точки!
      currentY = startPoint.y;

      // 1. Привязка к существующей вертикальной стене / пересечению стены горизонтальным лучом
      for (const w of walls) {
        const minY = Math.min(w.start.y, w.end.y) - 0.02;
        const maxY = Math.max(w.start.y, w.end.y) + 0.02;
        if (startPoint.y >= minY && startPoint.y <= maxY) {
          const dyW = w.end.y - w.start.y;
          if (Math.abs(dyW) > 0.001) {
            const t = (startPoint.y - w.start.y) / dyW;
            if (t >= -0.01 && t <= 1.01) {
              const xInt = w.start.x + t * (w.end.x - w.start.x);
              if (Math.abs(xInt - rawCursor.x) <= thresholdMeters) {
                currentX = Number(xInt.toFixed(3));
                isSnappedToWall = true;
                snappedWall = w;
                break;
              }
            }
          }
        }
      }

      // 2. Если к стене не привязались, проверяем выравнивание по X с вершинами (углами)
      if (!isSnappedToWall) {
        for (const ref of referencePoints) {
          if (Math.abs(ref.x - rawCursor.x) <= guideThresholdMeters) {
            currentX = ref.x;
            guides.push({
              from: ref,
              to: { x: ref.x, y: currentY },
              axis: 'x'
            });
            if (Math.abs(ref.y - currentY) <= thresholdMeters) {
              isSnappedToVertex = true;
              snappedVertex = ref;
            }
            break;
          }
        }
      }

      return {
        point: { x: Number(currentX.toFixed(3)), y: Number(currentY.toFixed(3)) },
        isSnappedToVertex,
        snappedVertex,
        isSnappedToWall,
        snappedWall,
        guides
      };
    } else {
      // СТРОГО фиксируем X на уровне стартовой точки!
      currentX = startPoint.x;

      // 1. Привязка к существующей горизонтальной стене / пересечению стены вертикальным лучом
      for (const w of walls) {
        const minX = Math.min(w.start.x, w.end.x) - 0.02;
        const maxX = Math.max(w.start.x, w.end.x) + 0.02;
        if (startPoint.x >= minX && startPoint.x <= maxX) {
          const dxW = w.end.x - w.start.x;
          if (Math.abs(dxW) > 0.001) {
            const t = (startPoint.x - w.start.x) / dxW;
            if (t >= -0.01 && t <= 1.01) {
              const yInt = w.start.y + t * (w.end.y - w.start.y);
              if (Math.abs(yInt - rawCursor.y) <= thresholdMeters) {
                currentY = Number(yInt.toFixed(3));
                isSnappedToWall = true;
                snappedWall = w;
                break;
              }
            }
          }
        }
      }

      // 2. Если к стене не привязались, проверяем выравнивание по Y с вершинами (углами)
      if (!isSnappedToWall) {
        for (const ref of referencePoints) {
          if (Math.abs(ref.y - rawCursor.y) <= guideThresholdMeters) {
            currentY = ref.y;
            guides.push({
              from: ref,
              to: { x: currentX, y: ref.y },
              axis: 'y'
            });
            if (Math.abs(ref.x - currentX) <= thresholdMeters) {
              isSnappedToVertex = true;
              snappedVertex = ref;
            }
            break;
          }
        }
      }

      return {
        point: { x: Number(currentX.toFixed(3)), y: Number(currentY.toFixed(3)) },
        isSnappedToVertex,
        snappedVertex,
        isSnappedToWall,
        snappedWall,
        guides
      };
    }
  }

  // =========================================================================
  // РЕЖИМ 2: СВОБОДНЫЙ УГОЛ (Привязка к вершинам и телам стен без орто)
  // =========================================================================
  // 1. Приоритет 1: Привязка к существующим вершинам (углам)
  for (const ref of referencePoints) {
    if (distance(rawCursor, ref) <= thresholdMeters) {
      return {
        point: { x: ref.x, y: ref.y },
        isSnappedToVertex: true,
        snappedVertex: ref,
        isSnappedToWall: false,
        snappedWall: null,
        guides: []
      };
    }
  }

  let currentX = rawCursor.x;
  let currentY = rawCursor.y;
  const guides: AlignmentGuide[] = [];

  // 2. Приоритет 2: Привязка к телу существующей стены (проекция на стену)
  let wallSnap: { point: Point; wall: Wall } | null = null;
  let minWallDist = Infinity;

  for (const w of walls) {
    const proj = projectPointOnSegment({ x: currentX, y: currentY }, w.start, w.end);
    if (proj.dist <= thresholdMeters && proj.dist < minWallDist && proj.t > 0.01 && proj.t < 0.99) {
      minWallDist = proj.dist;
      wallSnap = {
        point: { x: Number(proj.point.x.toFixed(3)), y: Number(proj.point.y.toFixed(3)) },
        wall: w
      };
    }
  }

  if (wallSnap) {
    return {
      point: wallSnap.point,
      isSnappedToVertex: false,
      snappedVertex: null,
      isSnappedToWall: true,
      snappedWall: wallSnap.wall,
      guides
    };
  }

  return {
    point: { x: Number(currentX.toFixed(3)), y: Number(currentY.toFixed(3)) },
    isSnappedToVertex: false,
    snappedVertex: null,
    isSnappedToWall: false,
    snappedWall: null,
    guides
  };
}

export function calculatePolygonArea(points: Point[]): number {
  if (points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

export function calculatePerimeter(points: Point[]): number {
  if (points.length < 2) return 0;
  let p = 0;
  for (let i = 0; i < points.length; i++) {
    const next = points[(i + 1) % points.length];
    p += distance(points[i], next);
  }
  return p;
}

export function getCentroid(points: Point[]): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  let sx = 0;
  let sy = 0;
  for (const pt of points) {
    sx += pt.x;
    sy += pt.y;
  }
  return { x: sx / points.length, y: sy / points.length };
}

export function isPointInsidePolygon(p: Point, poly: Point[]): boolean {
  if (!poly || poly.length < 3) return false;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y;
    const xj = poly[j].x, yj = poly[j].y;
    const intersect = ((yi > p.y) !== (yj > p.y)) &&
      (p.x < (xj - xi) * (p.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function findNearestWall(
  cursor: Point, 
  walls: Wall[], 
  scale: number
): { wall: Wall; projPoint: Point; offsetMeters: number; distPx: number } | null {
  let nearest: { wall: Wall; projPoint: Point; offsetMeters: number; distPx: number } | null = null;
  let minDistMeters = Infinity;

  for (const wall of walls) {
    const proj = projectPointOnSegment(cursor, wall.start, wall.end);
    if (proj.dist < minDistMeters) {
      minDistMeters = proj.dist;
      const wallLen = distance(wall.start, wall.end);
      nearest = {
        wall,
        projPoint: proj.point,
        offsetMeters: proj.t * wallLen,
        distPx: proj.dist * scale
      };
    }
  }

  if (nearest && nearest.distPx <= 28) {
    return nearest;
  }
  return null;
}

export function findNearestOpening(
  cursor: Point,
  walls: Wall[],
  scale: number
): { wall: Wall; opening: Opening; distPx: number } | null {
  for (const wall of walls) {
    const wallLen = distance(wall.start, wall.end);
    if (wallLen < 0.001) continue;
    const ux = (wall.end.x - wall.start.x) / wallLen;
    const uy = (wall.end.y - wall.start.y) / wallLen;

    for (const op of wall.openings) {
      const opCenter: Point = {
        x: wall.start.x + ux * op.offsetMeters,
        y: wall.start.y + uy * op.offsetMeters
      };

      const distM = distance(cursor, opCenter);
      const distPx = distM * scale;
      if (distPx <= 26) {
        return { wall, opening: op, distPx };
      }
    }
  }
  return null;
}

export function snapOpeningOffset(rawOffset: number, openingWidth: number, wallLength: number): { offset: number; snappedTo: 'leftCorner' | 'rightCorner' | 'center' | null } {
  const halfW = openingWidth / 2;
  const minOffset = halfW + 0.02;
  const maxOffset = wallLength - halfW - 0.02;

  let offset = Math.max(minOffset, Math.min(maxOffset, rawOffset));

  const targetLeftOffset = halfW + 0.10;
  if (Math.abs(offset - targetLeftOffset) < 0.08) {
    return { offset: targetLeftOffset, snappedTo: 'leftCorner' };
  }

  const targetRightOffset = wallLength - halfW - 0.10;
  if (Math.abs(offset - targetRightOffset) < 0.08) {
    return { offset: targetRightOffset, snappedTo: 'rightCorner' };
  }

  const centerOffset = wallLength / 2;
  if (Math.abs(offset - centerOffset) < 0.08) {
    return { offset: centerOffset, snappedTo: 'center' };
  }

  return { offset, snappedTo: null };
}

export function resizeWall(wall: Wall, newLength: number): Wall {
  const currentLen = distance(wall.start, wall.end);
  if (currentLen < 0.001 || newLength <= 0) return wall;

  const ux = (wall.end.x - wall.start.x) / currentLen;
  const uy = (wall.end.y - wall.start.y) / currentLen;

  const newEnd: Point = {
    x: Number((wall.start.x + ux * newLength).toFixed(3)),
    y: Number((wall.start.y + uy * newLength).toFixed(3))
  };

  return {
    ...wall,
    end: newEnd
  };
}

/**
 * Изменяет длину стены так, чтобы смежные перпендикулярные стены смещались параллельно,
 * а комната сохраняла свою форму и не обрывалась.
 */
export function resizeWallWithConnected(
  allWalls: Wall[], 
  targetWallId: string, 
  newLength: number,
  rooms?: Room[]
): Wall[] {
  const targetWall = allWalls.find(w => w.id === targetWallId);
  if (!targetWall || newLength <= 0) return allWalls;

  const currentLen = distance(targetWall.start, targetWall.end);
  if (currentLen < 0.001) return allWalls;

  const delta = Number((newLength - currentLen).toFixed(3));
  if (Math.abs(delta) < 0.001) return allWalls;

  const ux = (targetWall.end.x - targetWall.start.x) / currentLen;
  const uy = (targetWall.end.y - targetWall.start.y) / currentLen;

  const isHoriz = Math.abs(uy) < 0.20;
  const isVert = Math.abs(ux) < 0.20;

  const oldEnd = targetWall.end;
  const anchor = targetWall.start;
  const shiftX = Number((ux * delta).toFixed(3));
  const shiftY = Number((uy * delta).toFixed(3));

  // 1. Для горизонтальной стены (смещение по X):
  // Все вершины, которые лежат на вертикальной линии x ~= oldEnd.x,
  // смещаются по X на shiftX (смежная перпендикулярная стена сдвигается параллельно, не скашиваясь!).
  if (isHoriz) {
    const targetX = oldEnd.x;
    return allWalls.map(w => {
      const s = { ...w.start };
      const e = { ...w.end };

      const matchStart = Math.abs(s.x - targetX) < 0.10;
      const matchEnd = Math.abs(e.x - targetX) < 0.10;

      if (matchStart) s.x = Number((s.x + shiftX).toFixed(3));
      if (matchEnd) e.x = Number((e.x + shiftX).toFixed(3));

      let openings = w.openings;
      if (w.id === targetWallId && openings && openings.length > 0) {
        openings = openings.map(op => ({
          ...op,
          offsetMeters: Math.min(newLength - op.width / 2 - 0.05, Math.max(op.width / 2 + 0.05, op.offsetMeters))
        }));
      }

      return { ...w, start: s, end: e, openings };
    });
  }

  // 2. Для вертикальной стены (смещение по Y):
  // Все вершины, которые лежат на горизонтальной линии y ~= oldEnd.y,
  // смещаются по Y на shiftY (смежная перпендикулярная стена сдвигается параллельно, не скашиваясь!).
  if (isVert) {
    const targetY = oldEnd.y;
    return allWalls.map(w => {
      const s = { ...w.start };
      const e = { ...w.end };

      const matchStart = Math.abs(s.y - targetY) < 0.10;
      const matchEnd = Math.abs(e.y - targetY) < 0.10;

      if (matchStart) s.y = Number((s.y + shiftY).toFixed(3));
      if (matchEnd) e.y = Number((e.y + shiftY).toFixed(3));

      let openings = w.openings;
      if (w.id === targetWallId && openings && openings.length > 0) {
        openings = openings.map(op => ({
          ...op,
          offsetMeters: Math.min(newLength - op.width / 2 - 0.05, Math.max(op.width / 2 + 0.05, op.offsetMeters))
        }));
      }

      return { ...w, start: s, end: e, openings };
    });
  }

  // 3. Для произвольного угла: проецируем на нормальную секущую плоскость в точке oldEnd
  return allWalls.map(w => {
    const s = { ...w.start };
    const e = { ...w.end };

    const projS = (s.x - anchor.x) * ux + (s.y - anchor.y) * uy;
    const projE = (e.x - anchor.x) * ux + (e.y - anchor.y) * uy;

    if (Math.abs(projS - currentLen) < 0.10) {
      s.x = Number((s.x + shiftX).toFixed(3));
      s.y = Number((s.y + shiftY).toFixed(3));
    }
    if (Math.abs(projE - currentLen) < 0.10) {
      e.x = Number((e.x + shiftX).toFixed(3));
      e.y = Number((e.y + shiftY).toFixed(3));
    }

    return { ...w, start: s, end: e };
  });
}

/**
 * Изменяет чистовой внутренний габарит комнаты (ширину или длину)
 * со смещением соответствующей стены и сохранением замкнутости всех комнат.
 */
export function resizeRoomSpanDimension(
  allWalls: Wall[],
  rooms: Room[],
  roomId: string,
  axis: 'w' | 'h',
  newLengthM: number
): Wall[] {
  const room = rooms.find(r => r.id === roomId);
  if (!room || room.points.length < 3 || newLengthM <= 0) return allWalls;

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  room.points.forEach(p => {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  });

  const currentSpan = axis === 'w' ? (maxX - minX) : (maxY - minY);
  const delta = Number((newLengthM - currentSpan).toFixed(3));
  if (Math.abs(delta) < 0.001) return allWalls;

  if (axis === 'w') {
    const targetX = maxX;
    return allWalls.map(w => {
      const s = { ...w.start };
      const e = { ...w.end };

      const isStartOnRight = Math.abs(s.x - targetX) < 0.15 && s.y >= minY - 0.15 && s.y <= maxY + 0.15;
      const isEndOnRight = Math.abs(e.x - targetX) < 0.15 && e.y >= minY - 0.15 && e.y <= maxY + 0.15;

      if (isStartOnRight) s.x = Number((s.x + delta).toFixed(3));
      if (isEndOnRight) e.x = Number((e.x + delta).toFixed(3));

      return { ...w, start: s, end: e };
    });
  } else {
    const targetY = maxY;
    return allWalls.map(w => {
      const s = { ...w.start };
      const e = { ...w.end };

      const isStartOnBottom = Math.abs(s.y - targetY) < 0.15 && s.x >= minX - 0.15 && s.x <= maxX + 0.15;
      const isEndOnBottom = Math.abs(e.y - targetY) < 0.15 && e.x >= minX - 0.15 && e.x <= maxX + 0.15;

      if (isStartOnBottom) s.y = Number((s.y + delta).toFixed(3));
      if (isEndOnBottom) e.y = Number((e.y + delta).toFixed(3));

      return { ...w, start: s, end: e };
    });
  }
}

/**
 * Разделяет стену на два сегмента в заданной точке и корректно переносит проёмы
 */
export function splitWallAtPoint(wall: Wall, splitPt: Point): [Wall, Wall] {
  const wallLen = distance(wall.start, wall.end);
  const splitPtClean: Point = {
    x: Number(splitPt.x.toFixed(3)),
    y: Number(splitPt.y.toFixed(3))
  };

  const t = wallLen > 0.001 ? distance(wall.start, splitPtClean) / wallLen : 0.5;
  const splitOffsetM = t * wallLen;

  const openings1: Opening[] = [];
  const openings2: Opening[] = [];

  (wall.openings || []).forEach(op => {
    if (op.offsetMeters < splitOffsetM - op.width / 2) {
      openings1.push(op);
    } else if (op.offsetMeters > splitOffsetM + op.width / 2) {
      openings2.push({
        ...op,
        offsetMeters: Number((op.offsetMeters - splitOffsetM).toFixed(3))
      });
    } else {
      if (splitOffsetM > wallLen / 2) {
        openings1.push({
          ...op,
          offsetMeters: Math.max(op.width / 2 + 0.05, splitOffsetM - op.width / 2 - 0.05)
        });
      } else {
        openings2.push({
          ...op,
          offsetMeters: Math.min(wallLen - splitOffsetM - op.width / 2 - 0.05, op.width / 2 + 0.05)
        });
      }
    }
  });

  const seg1: Wall = {
    id: `${wall.id}_a_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    start: { ...wall.start },
    end: splitPtClean,
    thickness: wall.thickness,
    openings: openings1
  };

  const seg2: Wall = {
    id: `${wall.id}_b_${Date.now() + 1}_${Math.floor(Math.random() * 1000)}`,
    start: splitPtClean,
    end: { ...wall.end },
    thickness: wall.thickness,
    openings: openings2
  };

  return [seg1, seg2];
}

export function moveWallVertex(
  allWalls: Wall[], 
  targetVertex: Point, 
  newPos: Point,
  vertexThreshold: number = 0.06
): Wall[] {
  return allWalls.map(w => {
    let newStart = w.start;
    let newEnd = w.end;

    if (distance(w.start, targetVertex) <= vertexThreshold) {
      newStart = { x: Number(newPos.x.toFixed(3)), y: Number(newPos.y.toFixed(3)) };
    }
    if (distance(w.end, targetVertex) <= vertexThreshold) {
      newEnd = { x: Number(newPos.x.toFixed(3)), y: Number(newPos.y.toFixed(3)) };
    }

    return {
      ...w,
      start: newStart,
      end: newEnd
    };
  });
}

export function normalizeAngle(angle: number): number {
  let r = angle % (2 * Math.PI);
  if (r < 0) r += 2 * Math.PI;
  return r;
}

export function lineIntersection(
  p1: Point, 
  p2: Point, 
  p3: Point, 
  p4: Point
): { x: number; y: number; t1: number; t2: number } | null {
  const d = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x);
  if (Math.abs(d) < 0.00001) return null;
  const t = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / d;
  const u = ((p3.x - p1.x) * (p2.y - p1.y) - (p3.y - p1.y) * (p2.x - p1.x)) / d;
  if (t > 0.01 && t < 0.99 && u > 0.01 && u < 0.99) {
    return {
      x: Number((p1.x + t * (p2.x - p1.x)).toFixed(3)),
      y: Number((p1.y + t * (p2.y - p1.y)).toFixed(3)),
      t1: t,
      t2: u
    };
  }
  return null;
}

/**
 * Автоматически разделяет стены в местах Т-образных стыков и перекрестков
 */
export function splitAllWalls(walls: Wall[]): Wall[] {
  const splitPointsMap = new Map<string, number[]>();
  walls.forEach(w => splitPointsMap.set(w.id, [0, 1]));

  // 1. Т-образные стыки: вершины других стен, лежащие на теле этой стены
  for (let i = 0; i < walls.length; i++) {
    const w = walls[i];
    for (let j = 0; j < walls.length; j++) {
      if (i === j) continue;
      const other = walls[j];
      [other.start, other.end].forEach(pt => {
        const proj = projectPointOnSegment(pt, w.start, w.end);
        if (proj.dist < 0.10 && proj.t > 0.015 && proj.t < 0.985) {
          splitPointsMap.get(w.id)!.push(proj.t);
        }
      });
    }
  }

  // 2. Х-образные перекрестки: пересечения отрезков
  for (let i = 0; i < walls.length; i++) {
    for (let j = i + 1; j < walls.length; j++) {
      const inter = lineIntersection(walls[i].start, walls[i].end, walls[j].start, walls[j].end);
      if (inter) {
        splitPointsMap.get(walls[i].id)!.push(inter.t1);
        splitPointsMap.get(walls[j].id)!.push(inter.t2);
      }
    }
  }

  // Создаем сегментированные стены
  const result: Wall[] = [];
  walls.forEach(w => {
    const ts = splitPointsMap.get(w.id) || [0, 1];
    ts.sort((a, b) => a - b);
    const uniqueTs: number[] = [];
    ts.forEach(t => {
      if (uniqueTs.length === 0 || Math.abs(t - uniqueTs[uniqueTs.length - 1]) > 0.01) {
        uniqueTs.push(t);
      }
    });

    if (uniqueTs.length <= 2) {
      result.push(w);
    } else {
      for (let k = 0; k < uniqueTs.length - 1; k++) {
        const t1 = uniqueTs[k];
        const t2 = uniqueTs[k + 1];
        result.push({
          id: `${w.id}_s${k}`,
          start: {
            x: Number((w.start.x + t1 * (w.end.x - w.start.x)).toFixed(3)),
            y: Number((w.start.y + t1 * (w.end.y - w.start.y)).toFixed(3))
          },
          end: {
            x: Number((w.start.x + t2 * (w.end.x - w.start.x)).toFixed(3)),
            y: Number((w.start.y + t2 * (w.end.y - w.start.y)).toFixed(3))
          },
          thickness: w.thickness,
          openings: w.openings || []
        });
      }
    }
  });

  return result;
}

/**
 * АВТОМАТИЧЕСКИЙ ПОИСК ЗАМКНУТЫХ КОМНАТ В ГРАФЕ СТЕН (Cycle Detection / Planar Faces)
 * Находит замкнутые контуры, даже если комната делит существующие стены с соседними комнатами!
 */
export function detectRoomsFromWalls(
  walls: Wall[],
  ceilingHeight: number,
  existingRooms: Room[] = []
): Room[] {
  if (walls.length < 3) return [];

  // 1. Авто-сегментация стен на Т-стыках
  const segmentedWalls = splitAllWalls(walls);

  // 2. Кластеризация вершин с допуском 0.08 м (8 см)
  const vertices: Point[] = [];
  const getVertexIndex = (p: Point): number => {
    for (let i = 0; i < vertices.length; i++) {
      if (distance(vertices[i], p) <= 0.08) {
        return i;
      }
    }
    vertices.push({ x: Number(p.x.toFixed(3)), y: Number(p.y.toFixed(3)) });
    return vertices.length - 1;
  };

  // 3. Построение ребер графа
  interface Edge {
    u: number;
    v: number;
    angle: number; // угол направления ребра [0, 2*PI)
    wall: Wall;
  }

  const adj: Map<number, Edge[]> = new Map();
  for (let i = 0; i < vertices.length; i++) adj.set(i, []);

  segmentedWalls.forEach(w => {
    const u = getVertexIndex(w.start);
    const v = getVertexIndex(w.end);
    if (u === v) return;

    const angleUV = normalizeAngle(Math.atan2(vertices[v].y - vertices[u].y, vertices[v].x - vertices[u].x));
    const angleVU = normalizeAngle(Math.atan2(vertices[u].y - vertices[v].y, vertices[u].x - vertices[v].x));

    if (!adj.has(u)) adj.set(u, []);
    if (!adj.has(v)) adj.set(v, []);

    adj.get(u)!.push({ u, v, angle: angleUV, wall: w });
    adj.get(v)!.push({ u: v, v: u, angle: angleVU, wall: w });
  });

  // Сортировка ребер вокруг каждой вершины по углу против часовой стрелки
  adj.forEach(edges => {
    edges.sort((a, b) => a.angle - b.angle);
  });

  // 4. Трассировка граней (Planar face traversal)
  const visited = new Set<string>();
  const detectedCycles: { points: Point[]; walls: Wall[] }[] = [];

  adj.forEach((edges) => {
    edges.forEach(edge => {
      const edgeKey = `${edge.u}->${edge.v}`;
      if (visited.has(edgeKey)) return;

      const cyclePoints: Point[] = [];
      const cycleWalls: Wall[] = [];
      let curr = edge;

      while (!visited.has(`${curr.u}->${curr.v}`)) {
        visited.add(`${curr.u}->${curr.v}`);
        cyclePoints.push(vertices[curr.u]);
        cycleWalls.push(curr.wall);

        const vEdges = adj.get(curr.v);
        if (!vEdges || vEdges.length === 0) break;

        const backIdx = vEdges.findIndex(e => e.v === curr.u);
        if (backIdx === -1) break;

        // Поворот по часовой стрелке внутри вершины: (backIdx - 1 + len) % len
        const nextEdge = vEdges[(backIdx - 1 + vEdges.length) % vEdges.length];
        curr = nextEdge;
        if (curr.u === edge.u && curr.v === edge.v) break;
      }

      // Проверка валидности замкнутого цикла (должен вернуться точно в исходное полуребро)
      if (curr.u === edge.u && curr.v === edge.v && cyclePoints.length >= 3) {
        // Площадь со знаком (Shoelace)
        let signedArea = 0;
        for (let i = 0; i < cyclePoints.length; i++) {
          const j = (i + 1) % cyclePoints.length;
          signedArea += cyclePoints[i].x * cyclePoints[j].y;
          signedArea -= cyclePoints[j].x * cyclePoints[i].y;
        }
        signedArea /= 2;

        // Внутренние грани в этой ориентации имеют положительную площадь
        if (signedArea > 0.3 && signedArea < 2000) {
          detectedCycles.push({
            points: cyclePoints,
            walls: cycleWalls
          });
        }
      }
    });
  });

  // 5. Формирование объектов Room
  const resultRooms: Room[] = detectedCycles.map((cycle, idx) => {
    const area = Number(calculatePolygonArea(cycle.points).toFixed(2));
    const perimeter = Number(calculatePerimeter(cycle.points).toFixed(2));
    const wallGrossArea = Number((perimeter * ceilingHeight).toFixed(2));

    // Суммируем уникальные проемы в стенах этой комнаты
    const uniqueWalls = Array.from(new Set(cycle.walls));
    const seenOpIds = new Set<string>();
    const doorsList: Opening[] = [];
    const windowsList: Opening[] = [];

    uniqueWalls.forEach(w => {
      (w.openings || []).forEach(op => {
        if (!seenOpIds.has(op.id)) {
          seenOpIds.add(op.id);
          if (op.type === 'door') doorsList.push(op);
          else if (op.type === 'window') windowsList.push(op);
        }
      });
    });

    const doorsArea = Number(doorsList.reduce((sum, d) => sum + d.width * d.height, 0).toFixed(2));
    const windowsArea = Number(windowsList.reduce((sum, w) => sum + w.width * w.height, 0).toFixed(2));
    const openingsTotalArea = Number((doorsArea + windowsArea).toFixed(2));
    const wallNetArea = Number(Math.max(0, wallGrossArea - openingsTotalArea).toFixed(2));

    // Пробуем сохранить имя и статус вентканала, если комната уже существовала
    const centroid = getCentroid(cycle.points);
    const existing = existingRooms.find(r => distance(getCentroid(r.points), centroid) < 1.0);
    
    // Автоопределение шахты / вентканала: если нет ни дверей, ни окон и площадь < 2.0 м²
    const isAutoShaft = doorsList.length === 0 && windowsList.length === 0 && area < 2.0;
    const isShaft = existing?.isShaft !== undefined ? existing.isShaft : isAutoShaft;
    const defaultName = isShaft ? `Вентканал ${idx + 1}` : `Комната ${idx + 1}`;
    const name = existing ? existing.name : defaultName;

    return {
      id: existing ? existing.id : 'room_auto_' + idx + '_' + Math.round(area * 10),
      name,
      points: cycle.points,
      walls: uniqueWalls,
      floorArea: area,
      perimeter,
      ceilingHeight,
      wallGrossArea,
      wallNetArea,
      openingsTotalArea,
      doorsCount: doorsList.length,
      doorsArea,
      doorsList,
      windowsCount: windowsList.length,
      windowsArea,
      windowsList,
      isShaft,
      roomType: isShaft ? 'shaft' : (existing?.roomType || 'living')
    };
  });

  return resultRooms;
}

export function formatOpeningsDetailed(openings?: Opening[]): string {
  if (!openings || openings.length === 0) return 'нет';
  return openings.map(op => `${op.width.toFixed(2)} × ${op.height.toFixed(2)} м (${(op.width * op.height).toFixed(2)} м²)`).join(', ');
}

/**
 * Удаляет точку, растворяя её: если точка лежит между двумя сегментами стены,
 * они объединяются обратно в одну сплошную стену (с сохранением проёмов).
 */
export function dissolveVertex(
  allWalls: Wall[], 
  targetVertex: Point, 
  mode: 'auto' | 'dissolve' | 'remove_corner' = 'auto'
): Wall[] {
  const isTarget = (p: Point) => distance(p, targetVertex) <= 0.08;

  // Находим все стены, соединённые с этой вершиной
  const incident = allWalls.filter(w => isTarget(w.start) || isTarget(w.end));
  const untouched = allWalls.filter(w => !isTarget(w.start) && !isTarget(w.end));

  // Если это изолированная точка или тупиковая стена (1 стена)
  if (incident.length <= 1) {
    return untouched;
  }

  // Если соединены ровно 2 стены (точка на линии или угол):
  if (incident.length === 2) {
    const w1 = incident[0];
    const w2 = incident[1];

    // Определяем внешние концы A и B
    const ptA = isTarget(w1.end) ? w1.start : w1.end;
    const ptB = isTarget(w2.start) ? w2.end : w2.start;

    const len1 = distance(w1.start, w1.end);
    const len2 = distance(w2.start, w2.end);

    const vA = { x: ptA.x - targetVertex.x, y: ptA.y - targetVertex.y };
    const vB = { x: ptB.x - targetVertex.x, y: ptB.y - targetVertex.y };
    const dot = (len1 > 0.01 && len2 > 0.01) ? (vA.x * vB.x + vA.y * vB.y) / (len1 * len2) : 0;
    const isCollinear = dot < -0.80; // угол близок к 180° (точка на прямой линии)

    // Если это угол (не на прямой линии) и режим auto или remove_corner -> удаляем угол
    if (!isCollinear && mode !== 'dissolve') {
      return untouched;
    }

    // Иначе (точка лежит на линии или запрошено растворение): объединяем сегменты в одну прямую стену
    const mergedOpenings: Opening[] = [];

    // Проёмы первой стены (от точки A до V)
    (w1.openings || []).forEach(op => {
      const offsetFromA = isTarget(w1.end) ? op.offsetMeters : (len1 - op.offsetMeters);
      mergedOpenings.push({
        ...op,
        offsetMeters: Number(offsetFromA.toFixed(3))
      });
    });

    // Проёмы второй стены (от точки V до B)
    (w2.openings || []).forEach(op => {
      const offsetFromV = isTarget(w2.start) ? op.offsetMeters : (len2 - op.offsetMeters);
      mergedOpenings.push({
        ...op,
        offsetMeters: Number((len1 + offsetFromV).toFixed(3))
      });
    });

    const mergedWall: Wall = {
      id: `wall_merged_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      start: { x: Number(ptA.x.toFixed(3)), y: Number(ptA.y.toFixed(3)) },
      end: { x: Number(ptB.x.toFixed(3)), y: Number(ptB.y.toFixed(3)) },
      thickness: w1.thickness,
      openings: mergedOpenings
    };

    return [...untouched, mergedWall];
  }

  // Если 3 стены (Т-стык перегородки к несущей стене):
  if (incident.length === 3) {
    let bestPair: [Wall, Wall] | null = null;
    let maxDot = -Infinity;

    for (let i = 0; i < 3; i++) {
      for (let j = i + 1; j < 3; j++) {
        const wa = incident[i];
        const wb = incident[j];
        const otherA = isTarget(wa.end) ? wa.start : wa.end;
        const otherB = isTarget(wb.end) ? wb.start : wb.end;

        const vA = { x: otherA.x - targetVertex.x, y: otherA.y - targetVertex.y };
        const vB = { x: otherB.x - targetVertex.x, y: otherB.y - targetVertex.y };
        const lenA = Math.hypot(vA.x, vA.y);
        const lenB = Math.hypot(vB.x, vB.y);

        if (lenA > 0.01 && lenB > 0.01) {
          const dot = (vA.x * vB.x + vA.y * vB.y) / (lenA * lenB);
          if (dot < -0.80 && Math.abs(dot + 1) < Math.abs(maxDot + 1)) {
            maxDot = dot;
            bestPair = [wa, wb];
          }
        }
      }
    }

    if (bestPair) {
      const [w1, w2] = bestPair;
      const ptA = isTarget(w1.end) ? w1.start : w1.end;
      const ptB = isTarget(w2.start) ? w2.end : w2.start;
      const len1 = distance(w1.start, w1.end);
      const len2 = distance(w2.start, w2.end);

      const mergedOpenings: Opening[] = [];
      (w1.openings || []).forEach(op => {
        const offsetFromA = isTarget(w1.end) ? op.offsetMeters : (len1 - op.offsetMeters);
        mergedOpenings.push({ ...op, offsetMeters: Number(offsetFromA.toFixed(3)) });
      });
      (w2.openings || []).forEach(op => {
        const offsetFromV = isTarget(w2.start) ? op.offsetMeters : (len2 - op.offsetMeters);
        mergedOpenings.push({ ...op, offsetMeters: Number((len1 + offsetFromV).toFixed(3)) });
      });

      const mergedWall: Wall = {
        id: `wall_merged_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        start: { x: Number(ptA.x.toFixed(3)), y: Number(ptA.y.toFixed(3)) },
        end: { x: Number(ptB.x.toFixed(3)), y: Number(ptB.y.toFixed(3)) },
        thickness: w1.thickness,
        openings: mergedOpenings
      };

      return [...untouched, mergedWall];
    }
  }

  // Fallback: удаляем инцидентные стены
  return untouched;
}

/**
 * Находит оптимальную точку внутри комнаты на пустом месте (Pole of Inaccessibility).
 * Максимизирует расстояние от стен, проёмов, линий габаритов и обозначений,
 * чтобы название комнаты и площадь не перекрывали чертеж и не сливались с цифрами.
 */
export function findBestInteriorRoomLabelPoint(
  poly: Point[],
  obstacles: Point[] = [],
  spanLines: { p1: Point; p2: Point }[] = []
): Point {
  if (!poly || poly.length < 3) {
    return poly[0] || { x: 0, y: 0 };
  }

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  poly.forEach(p => {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  });

  const width = maxX - minX;
  const height = maxY - minY;
  if (width < 0.1 || height < 0.1) {
    return getCentroid(poly);
  }

  // Отрезки стен полигона
  const segments: { a: Point; b: Point }[] = [];
  for (let i = 0; i < poly.length; i++) {
    segments.push({ a: poly[i], b: poly[(i + 1) % poly.length] });
  }

  let bestPoint = getCentroid(poly);
  let maxScore = -Infinity;

  // Сетка кандидатов внутри bounding box (15 × 15)
  const steps = 14;
  for (let ix = 1; ix < steps; ix++) {
    for (let iy = 1; iy < steps; iy++) {
      const candidate: Point = {
        x: minX + (width * ix) / steps,
        y: minY + (height * iy) / steps
      };

      if (!isPointInsidePolygon(candidate, poly)) continue;

      // 1. Расстояние до стен
      let minWallDist = Infinity;
      for (const seg of segments) {
        const proj = projectPointOnSegment(candidate, seg.a, seg.b);
        if (proj.dist < minWallDist) minWallDist = proj.dist;
      }

      // 2. Расстояние до препятствий (розеток, сантехники)
      let minObsDist = Infinity;
      for (const obs of obstacles) {
        const d = distance(candidate, obs);
        if (d < minObsDist) minObsDist = d;
      }

      // 3. Расстояние до линий габаритов (спанов)
      let minSpanDist = Infinity;
      for (const span of spanLines) {
        const proj = projectPointOnSegment(candidate, span.p1, span.p2);
        if (proj.dist < minSpanDist) minSpanDist = proj.dist;
      }

      // Комплексный скор (клиренс свободного пространства)
      // Штрафуем слишком близкое расположение к спанам и объектам
      const effectiveDist = Math.min(minWallDist, minObsDist * 1.2, minSpanDist * 1.5);

      if (effectiveDist > maxScore) {
        maxScore = effectiveDist;
        bestPoint = candidate;
      }
    }
  }

  return bestPoint;
}

