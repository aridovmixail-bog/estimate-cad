import { Room } from '../cad/types';
import { 
  PirogDefinition, 
  RoomSelectionState, 
  CalculatedRoomEstimate, 
  CalculatedProjectEstimate, 
  ActiveWorkRow, 
  ActiveMaterialRow, 
  MultiplierType,
  PricingTariff
} from './types';
import { DEFAULT_PIROGS } from './defaultPirogs';

export function getMultiplierValue(
  type: MultiplierType,
  room: Room,
  electricCount: number,
  plumbingCount: number
): number {
  switch (type) {
    case 'floorArea':
      return Number(room.floorArea.toFixed(2));
    case 'wallNetArea':
      return Number(room.wallNetArea.toFixed(2));
    case 'ceilingArea':
      return Number(room.floorArea.toFixed(2)); // площадь потолка равна площади пола
    case 'perimeter':
      return Number(room.perimeter.toFixed(2));
    case 'doorsCount':
      return room.doorsCount || 0;
    case 'windowsCount':
      return room.windowsCount || 0;
    case 'fixturesElectric':
      return electricCount > 0 ? electricCount : 4; // если на плане нет точек, берем базовые 4 точки
    case 'fixturesPlumbing':
      return plumbingCount > 0 ? plumbingCount : (room.name.toLowerCase().includes('ванн') || room.name.toLowerCase().includes('санузел') || room.name.toLowerCase().includes('туалет') ? 3 : 1);
    case 'fixed':
    default:
      return 1;
  }
}

export function calculateRoomEstimate(
  room: Room,
  selection: RoomSelectionState,
  allPirogs: PirogDefinition[] = DEFAULT_PIROGS,
  electricCount: number = 0,
  plumbingCount: number = 0,
  tariff: PricingTariff = 'standard',
  regionalCoeff: number = 1.00
): CalculatedRoomEstimate {
  const works: ActiveWorkRow[] = [];
  const materials: ActiveMaterialRow[] = [];

  // Если это вентканал / стояк / короб — чистовая отделка не рассчитывается
  if (room.isShaft) {
    return {
      roomId: room.id,
      roomName: room.name,
      floorArea: room.floorArea,
      perimeter: room.perimeter,
      wallNetArea: room.wallNetArea,
      ceilingArea: room.floorArea,
      doorsCount: room.doorsCount || 0,
      windowsCount: room.windowsCount || 0,
      fixturesElectricCount: 0,
      fixturesPlumbingCount: 0,
      works: [],
      materials: [],
      worksTotal: 0,
      materialsTotal: 0,
      grandTotal: 0
    };
  }

  // Перебираем выбранные пироги по категориям
  Object.entries(selection.selectedPirogIds).forEach(([_, pirogId]) => {
    if (!pirogId) return;
    const pirog = allPirogs.find(p => p.id === pirogId);
    if (!pirog) return;

    // 1. Работы из пирога
    pirog.works.forEach(w => {
      const mult = getMultiplierValue(w.multiplierType, room, electricCount, plumbingCount);
      const qty = w.multiplierType === 'fixed' ? (w.fixedQuantity || 1) : mult;

      // Базовая цена по выбранному тарифу
      let basePrice = w.defaultUnitPrice;
      if (tariff === 'econom' && w.economPrice) basePrice = w.economPrice;
      else if (tariff === 'standard' && w.standardPrice) basePrice = w.standardPrice;
      else if (tariff === 'design' && w.designPrice) basePrice = w.designPrice;
      else if (tariff === 'detailed' && w.detailedPrice) basePrice = w.detailedPrice;

      // Применение регионального коэффициента
      const calcPrice = Math.round(basePrice * regionalCoeff);
      const unitPrice = selection.overridePrices[w.id] !== undefined ? selection.overridePrices[w.id] : calcPrice;
      const total = Math.round(qty * unitPrice);

      works.push({
        id: `work_${room.id}_${w.id}`,
        workTemplateId: w.id,
        name: w.name,
        unit: w.unit,
        unitPrice,
        quantity: Number(qty.toFixed(2)),
        total,
        isCustom: false
      });
    });

    // 2. Материалы из пирога
    pirog.materials.forEach(m => {
      const mult = getMultiplierValue(m.multiplierType, room, electricCount, plumbingCount);
      const baseQty = m.multiplierType === 'fixed' ? (m.fixedQuantity || 1) : mult;

      // В каталоге Краснодара m.defaultUnitPrice рассчитан на 1 ед. базовой поверхности (м² пола, м² стен, шт., точку)
      const unitPrice = selection.overridePrices[m.id] !== undefined ? selection.overridePrices[m.id] : m.defaultUnitPrice;
      const total = Math.round(baseQty * unitPrice);

      // Физический расход сырья (кг, литры, рулоны) с запасом safetyCoeff
      const physicalQty = Number((baseQty * m.normPerUnit * (m.safetyCoeff || 1.0)).toFixed(2));

      let calcUnit = 'м²';
      if (m.multiplierType === 'perimeter') calcUnit = 'м.п.';
      else if (m.multiplierType === 'doorsCount' || m.multiplierType === 'windowsCount') calcUnit = 'шт.';
      else if (m.multiplierType === 'fixturesElectric' || m.multiplierType === 'fixturesPlumbing') calcUnit = 'точ.';
      else if (m.multiplierType === 'fixed') calcUnit = 'компл.';

      materials.push({
        id: `mat_${room.id}_${m.id}`,
        materialTemplateId: m.id,
        name: m.name,
        unit: calcUnit,
        unitPrice,
        quantity: Number(baseQty.toFixed(2)),
        total,
        physicalQuantity: physicalQty,
        physicalUnit: m.unit,
        packageType: m.packageType,
        isCustom: false
      });
    });
  });

  // Добавляем ручные работы и материалы
  if (selection.customWorks && selection.customWorks.length > 0) {
    works.push(...selection.customWorks);
  }
  if (selection.customMaterials && selection.customMaterials.length > 0) {
    materials.push(...selection.customMaterials);
  }

  const worksTotal = works.reduce((sum, w) => sum + w.total, 0);
  const materialsTotal = materials.reduce((sum, m) => sum + m.total, 0);

  return {
    roomId: room.id,
    roomName: room.name,
    floorArea: room.floorArea,
    wallNetArea: room.wallNetArea,
    ceilingArea: room.floorArea,
    perimeter: room.perimeter,
    doorsCount: room.doorsCount || 0,
    windowsCount: room.windowsCount || 0,
    fixturesElectricCount: electricCount,
    fixturesPlumbingCount: plumbingCount,
    works,
    materials,
    worksTotal,
    materialsTotal,
    grandTotal: worksTotal + materialsTotal
  };
}

export function calculateProjectEstimate(
  rooms: Room[],
  selections: Record<string, RoomSelectionState>,
  allPirogs: PirogDefinition[] = DEFAULT_PIROGS,
  electricCountsByRoom: Record<string, number> = {},
  plumbingCountsByRoom: Record<string, number> = {},
  clientInfo?: {
    name?: string;
    address?: string;
    phone?: string;
    contractNumber?: string;
    date?: string;
  },
  tariff: PricingTariff = 'standard',
  regionalCoeff: number = 1.00
): CalculatedProjectEstimate {
  const calculatedRooms = rooms.map(room => {
    const sel = selections[room.id] || {
      roomId: room.id,
      selectedPirogIds: {},
      overridePrices: {},
      customWorks: [],
      customMaterials: []
    };
    const eCount = electricCountsByRoom[room.id] || 0;
    const pCount = plumbingCountsByRoom[room.id] || 0;
    return calculateRoomEstimate(room, sel, allPirogs, eCount, pCount, tariff, regionalCoeff);
  });

  const livingRooms = rooms.filter(r => !r.isShaft);
  const totalFloorArea = Number((livingRooms.length > 0 ? livingRooms : rooms).reduce((sum, r) => sum + r.floorArea, 0).toFixed(2));
  const totalWallNetArea = Number((livingRooms.length > 0 ? livingRooms : rooms).reduce((sum, r) => sum + r.wallNetArea, 0).toFixed(2));
  const totalWorksPrice = calculatedRooms.reduce((sum, r) => sum + r.worksTotal, 0);
  const totalMaterialsPrice = calculatedRooms.reduce((sum, r) => sum + r.materialsTotal, 0);

  const now = new Date();
  const dateStr = clientInfo?.date || `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;

  return {
    clientName: clientInfo?.name || 'Иванов Иван Иванович',
    clientAddress: clientInfo?.address || 'г. Краснодар, ул. Красная, д. 120, кв. 45',
    clientPhone: clientInfo?.phone || '+7 (918) 123-45-67',
    contractNumber: clientInfo?.contractNumber || `КР-${now.getFullYear()}-01`,
    estimateDate: dateStr,
    tariff,
    regionalCoeff,
    rooms: calculatedRooms,
    totalFloorArea,
    totalWallNetArea,
    totalWorksPrice,
    totalMaterialsPrice,
    grandTotal: totalWorksPrice + totalMaterialsPrice
  };
}
