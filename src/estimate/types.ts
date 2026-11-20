export type PricingTariff = 'econom' | 'standard' | 'design' | 'detailed';

export type MultiplierType =
  | 'floorArea'
  | 'wallNetArea'
  | 'ceilingArea'
  | 'perimeter'
  | 'doorsCount'
  | 'windowsCount'
  | 'fixturesElectric'
  | 'fixturesPlumbing'
  | 'fixed'
  | string;

export type PirogCategory =
  | 'ceiling'
  | 'walls'
  | 'floor'
  | 'electric'
  | 'plumbing'
  | 'doors'
  | 'demolition'
  | 'plinth'
  | 'other'
  | string;

export interface WorkTemplate {
  id: string;
  name: string;
  unit: string;
  defaultUnitPrice: number;
  multiplierType: MultiplierType;
  fixedQuantity?: number;
  economPrice?: number;
  standardPrice?: number;
  designPrice?: number;
  detailedPrice?: number;
  source?: string;
  [key: string]: any;
}

export interface MaterialTemplate {
  id: string;
  name: string;
  unit: string;
  defaultUnitPrice: number;
  normPerUnit: number;
  multiplierType: MultiplierType;
  safetyCoeff?: number;
  fixedQuantity?: number;
  packageType?: string;
  packagePrice?: number;
  [key: string]: any;
}

export interface PirogDefinition {
  id: string;
  name: string;
  category: PirogCategory;
  description?: string;
  standardPrice?: number;
  works: WorkTemplate[];
  materials: MaterialTemplate[];
  isCustom?: boolean;
  [key: string]: any;
}

export interface ActiveWorkRow {
  id: string;
  workTemplateId?: string;
  name: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  total: number;
  isCustom?: boolean;
}

export interface ActiveMaterialRow {
  id: string;
  materialTemplateId?: string;
  name: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  total: number;
  physicalQuantity?: number;
  physicalUnit?: string;
  packageType?: string;
  isCustom?: boolean;
}

export interface RoomSelectionState {
  roomId: string;
  selectedPirogIds: Record<string, string>; // category -> pirogId
  overridePrices: Record<string, number>;
  customWorks: ActiveWorkRow[];
  customMaterials: ActiveMaterialRow[];
}

export interface CalculatedRoomEstimate {
  roomId: string;
  roomName: string;
  floorArea: number;
  wallNetArea: number;
  ceilingArea: number;
  perimeter: number;
  doorsCount: number;
  windowsCount: number;
  fixturesElectricCount: number;
  fixturesPlumbingCount: number;
  works: ActiveWorkRow[];
  materials: ActiveMaterialRow[];
  worksTotal: number;
  materialsTotal: number;
  grandTotal: number;
}

export interface CalculatedProjectEstimate {
  clientName: string;
  clientAddress: string;
  clientPhone: string;
  contractNumber: string;
  estimateDate: string;
  tariff: PricingTariff;
  regionalCoeff: number;
  rooms: CalculatedRoomEstimate[];
  totalFloorArea: number;
  totalWallNetArea: number;
  totalWorksPrice: number;
  totalMaterialsPrice: number;
  grandTotal: number;
}

export interface ClientInfo {
  name: string;
  phone: string;
  address: string;
  contractNumber: string;
  date?: string;
  ceilingHeight?: number;
}

export interface EstimateExportOptions {
  exportExcel: boolean;
  exportPdf: boolean;
  hidePrices: boolean;           // true = без цен (для заказчика: только объемы и работы)
  includePlanImage: boolean;     // true = прикрепить 2D обмерочный план с чертежа
  includeMaterials: boolean;     // true = включать черновые материалы
  planImageBase64?: string | null;
  exportScope?: 'works' | 'materials' | 'both'; // 'works' = договорная смета на работы, 'materials' = ведомость материалов, 'both' = сводная
  skipAutoSave?: boolean;
  constants?: { name: string; unit: string; quantity: number; unitPrice: number; total: number }[];
}

export interface RegionalPreset {
  id: string;
  name: string;
  coeff: number;
}

export const REGIONAL_PRESETS: RegionalPreset[] = [
  { id: 'krasnodar', name: 'Краснодар (базовый 100%)', coeff: 1.00 },
  { id: 'sochi', name: 'Сочи / Черноморское побережье (+20%)', coeff: 1.20 },
  { id: 'rostov', name: 'Ростов-на-Дону (+5%)', coeff: 1.05 },
  { id: 'moscow', name: 'Москва / МО (+35%)', coeff: 1.35 },
  { id: 'spb', name: 'Санкт-Петербург (+25%)', coeff: 1.25 },
];

export interface CatalogWorkItem {
  code: string;
  section: string;
  name: string;
  unit: string;
  price: number;
  note?: string;
}
