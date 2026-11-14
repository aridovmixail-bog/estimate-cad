import {
  ActiveMaterialRow,
  ActiveWorkRow,
  CalculatedProjectEstimate,
  CalculatedRoomEstimate,
  CatalogWorkItem,
  ClientInfo,
  EstimateExportOptions,
  MultiplierType,
  PirogCategory,
  PirogDefinition,
  PricingTariff,
  RoomSelectionState
} from '../estimate/types';

export type {
  ActiveMaterialRow,
  ActiveWorkRow,
  CalculatedProjectEstimate,
  CalculatedRoomEstimate,
  CatalogWorkItem,
  ClientInfo,
  EstimateExportOptions,
  MultiplierType,
  PirogCategory,
  PirogDefinition,
  PricingTariff,
  RoomSelectionState
};

export interface Point {
  x: number;
  y: number;
}

export interface Opening {
  id: string;
  type: 'door' | 'window' | string;
  width: number;
  height: number;
  positionAlongWall?: number;
  offsetMeters?: number;
  isBalconyDoor?: boolean;
  openDirection?: 'inward' | 'outward';
  hingeSide?: 'left' | 'right';
  sillHeight?: number;
  [key: string]: any;
}

export interface Wall {
  id: string;
  start: Point;
  end: Point;
  thickness: number;
  openings: Opening[];
  isBearing?: boolean;
  [key: string]: any;
}

export interface Room {
  id: string;
  name: string;
  points: Point[];
  walls: Wall[];
  floorArea: number;
  wallNetArea: number;
  ceilingArea?: number;
  perimeter: number;
  ceilingHeight?: number;
  doorsCount?: number;
  windowsCount?: number;
  doorWidth?: number;
  doorHeight?: number;
  windowWidth?: number;
  windowHeight?: number;
  isShaft?: boolean;
  roomType?: string;
  labelPosition?: Point;
  wallGrossArea?: number;
  openingsTotalArea?: number;
  doorsArea?: number;
  windowsArea?: number;
  fixturesCount?: number;
  [key: string]: any;
}

export type DimensionUnit = 'mm' | 'cm' | 'm';
export type DimensionStyle = 'architectural' | 'simple' | 'badges' | string;

export type FixtureCategory = 'electric' | 'plumbing' | 'furniture' | 'hvac' | 'custom' | string;
export type FixtureType = string;

export interface Fixture {
  id: string;
  type: FixtureType;
  category: FixtureCategory;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotationDeg: number;
  heightFromFloor?: number;
  installationHeight?: number;
  roomId?: string | null;
  wallId?: string | null;
  distanceFromCorner?: number;
  customIconUrl?: string;
  baseGraphic?: string;
  [key: string]: any;
}

export interface FixtureDefinition {
  type: FixtureType;
  category: FixtureCategory;
  name: string;
  shortLabel?: string;
  width: number;
  height: number;
  color?: string;
  defaultHeightFromFloor?: number;
  customIconUrl?: string;
  baseGraphic?: string;
  iconText?: string;
  isCustom?: boolean;
  [key: string]: any;
}

export interface CadBackdrop {
  id: string;
  name: string;
  imageUrl: string;
  imageElement?: HTMLImageElement | null;
  x: number;
  y: number;
  widthMeters: number;
  heightMeters: number;
  aspectRatio: number;
  rotationDeg: number;
  opacity: number;
  visible?: boolean;
  locked?: boolean;
  [key: string]: any;
}

export interface BackdropCalibrationState {
  active: boolean;
  step: 'pick_p1' | 'pick_p2' | 'input_length';
  p1World: Point | null;
  p2World: Point | null;
  [key: string]: any;
}

export interface WindowSizePreset {
  id: string;
  label: string;
  width: number;
  height: number;
  isFavorite?: boolean;
}
