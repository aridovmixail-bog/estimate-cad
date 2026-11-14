/**
 * Эталонный сметный шаблон: Капитальный ремонт под ключ (Краснодар)
 * Точно соответствует эталонной смете объекта: ул. Дангиреева, д. 2, к.3, кв. 376 (954 226.40 ₽)
 * 
 * Разделение на:
 * 1. Геометрические работы (рассчитываются строго из площадей и периметров CAD)
 * 2. Константы и штучный чек-лист объекта (точки электрики, сантехники, короба, двери, клининг, мусор)
 */

export interface TemplateWorkItem {
  id: string;
  num: number;
  stageName: string;
  subCategory?: string; // Кухня, Туалет, Ванная, Спальня 1 и т.д.
  trade: string; // Маляры, Плиточники, Электрики, Сантехники, Монтажники, Потолочники, Дверщик, Клининг
  name: string;
  unit: string;
  unitPrice: number;
  isConstant: boolean; // true = фиксированная штучная работа (чек-лист), false = рассчитывается из геометрии CAD
  defaultQuantity: number;
  calcType: 
    | 'fixed'                   // Фиксированное кол-во (из констант)
    | 'roomFloor'               // Площадь пола конкретной комнаты
    | 'roomWallNet'             // Чистая площадь стен конкретной комнаты
    | 'roomPerimeter'           // Периметр конкретной комнаты
    | 'roomWindowSlopes'        // Откосы окон комнаты (пог. м)
    | 'livingFloorsTotal'       // Суммарная площадь жилых комнат + коридор (ламинат)
    | 'livingPlinthTotal'       // Суммарный периметр плинтуса за вычетом дверей
    | 'wetFloorsTotal'          // Суммарная площадь пола санузлов
    | 'wetWallsTotal'           // Суммарная площадь стен санузлов
    | 'wetHydroTotal'           // Гидроизоляция пола + стен санузлов
    | 'totalCeiling'            // Суммарная площадь натяжного потолка
    | 'kitchenWorkZone';        // Протяжка у пола кухни (пог. м)
  note?: string;
}

export interface ObjectChecklistConstants {
  // 1. Подготовительные работы
  prepWorkWrapping: number; // укутывание дверей и окон (компл / шт)

  // 2. Сантехнические работы
  plumbingHotColdPoints: number; // точки ГВС, ХВС (шт)
  plumbingSewerPoints: number;   // точки канализации КС (шт)
  plumbingToiletInstallation: number; // монтаж инсталляции унитаза (шт)

  // 3. Электромонтажные работы
  electricRoughPoints: number; // точки электрики и интернета с гофрой (шт)
  electricFinishPoints: number; // чистовая электрика (розетки, выключатели, рамки) (шт)

  // 4. Монтажные работы и ГКЛ
  kitchenHoodVent: number; // вытяжная вентиляция кухни (шт)
  kitchenGypNicheM: number; // зашивка ниши ГКЛ кухня (м.п.)
  corridorDoorTransomGyp: number; // опуск проема ГКЛ коридор (шт)
  bathVentHole: number; // отверстие вентиляции ванная (шт)
  bathVentFanMount: number; // вытяжная вентиляция ванная (шт)
  bathGypBoxM: number; // короб ГКЛ ванная (м.п.)
  bathShowerTrayPoddon: number; // устройство душевого поддона 800х1500 с облицовкой (шт)
  toiletGypBoxInstall: number; // короб ГКЛ на высоту инсталляции туалет (шт)
  toiletVentFanMount: number; // вытяжная вентиляция туалет (шт)
  toiletGypNicheM: number; // зашивка ниши ГКЛ туалет (м.п.)

  // 5. Плиточные чистовые работы и санфаянс
  tileCleanCutBathToiletM: number; // запил плитки чистый рез 45° (м.п.)
  tileHolesDrilledBath: number; // отверстия в плитке ванная (шт)
  tileHolesDrilledToilet: number; // отверстия в плитке туалет (шт)
  mountSinkWithCabinet: number; // монтаж раковины с тумбой и смесителя (шт)
  mountShowerSystem: number; // монтаж душевой системы (шт)
  mountMirror: number; // монтаж зеркала (шт)
  mountTowelRail: number; // монтаж полотенцесушителя (шт)
  mountExhaustFan: number; // монтаж электрического вентилятора (шт)
  mountHangingToilet: number; // монтаж подвесного унитаза с кнопкой (шт)
  mountHygienicShower: number; // монтаж гигиенического душа (шт)

  // 6. Полы чистовые
  laminateCleanCutM: number; // чистый рез ламината (м.п.)

  // 7. Потолки
  ceilingCurtainTimberM: number; // закладной брус под карниз (м.п.)
  ceilingLampsGX53Count: number; // закладные и монтаж светильников GX53 (шт)

  // 8. Двери
  interiorDoorsCount: number; // монтаж межкомнатных дверей (шт)
  entranceDoorTrim: number; // облагораживание проема входной двери (шт)

  // 9. Прочие
  floorCoveringCardboardM2: number; // укрытие пола гофрокартоном (м²)
  garbageRemovalTrips: number; // вывоз мусора (рейсов / усл.)
  cleaningAfterRenovation: number; // клининг после ремонта (усл.)
}

/**
 * Пустые нулевые константы (для чистого старта или сброса проекта)
 */
export const EMPTY_OBJECT_CONSTANTS: ObjectChecklistConstants = {
  prepWorkWrapping: 0,
  plumbingHotColdPoints: 0,
  plumbingSewerPoints: 0,
  plumbingToiletInstallation: 0,
  electricRoughPoints: 0,
  electricFinishPoints: 0,
  kitchenHoodVent: 0,
  kitchenGypNicheM: 0,
  corridorDoorTransomGyp: 0,
  bathVentHole: 0,
  bathVentFanMount: 0,
  bathGypBoxM: 0,
  bathShowerTrayPoddon: 0,
  toiletGypBoxInstall: 0,
  toiletVentFanMount: 0,
  toiletGypNicheM: 0,
  tileCleanCutBathToiletM: 0,
  tileHolesDrilledBath: 0,
  tileHolesDrilledToilet: 0,
  mountSinkWithCabinet: 0,
  mountShowerSystem: 0,
  mountMirror: 0,
  mountTowelRail: 0,
  mountExhaustFan: 0,
  mountHangingToilet: 0,
  mountHygienicShower: 0,
  laminateCleanCutM: 0,
  ceilingCurtainTimberM: 0,
  ceilingLampsGX53Count: 0,
  interiorDoorsCount: 0,
  entranceDoorTrim: 0,
  floorCoveringCardboardM2: 0,
  garbageRemovalTrips: 0,
  cleaningAfterRenovation: 0,
};

/**
 * Эталонные значения констант для квартиры 63 м² (ул. Дангиреева)
 */
export const BENCHMARK_63_OBJECT_CONSTANTS: ObjectChecklistConstants = {
  prepWorkWrapping: 1,
  plumbingHotColdPoints: 12,
  plumbingSewerPoints: 6,
  plumbingToiletInstallation: 1,
  electricRoughPoints: 20,
  electricFinishPoints: 60,
  kitchenHoodVent: 1,
  kitchenGypNicheM: 3.04,
  corridorDoorTransomGyp: 6,
  bathVentHole: 1,
  bathVentFanMount: 1,
  bathGypBoxM: 1.5,
  bathShowerTrayPoddon: 1,
  toiletGypBoxInstall: 1,
  toiletVentFanMount: 1,
  toiletGypNicheM: 3.04,
  tileCleanCutBathToiletM: 1.6, // 0.8 в ванной + 0.8 в туалете
  tileHolesDrilledBath: 10,
  tileHolesDrilledToilet: 6,
  mountSinkWithCabinet: 2, // ванная + туалет
  mountShowerSystem: 1,
  mountMirror: 2, // ванная + туалет
  mountTowelRail: 1,
  mountExhaustFan: 2, // ванная + туалет
  mountHangingToilet: 1,
  mountHygienicShower: 1,
  laminateCleanCutM: 9.83,
  ceilingCurtainTimberM: 9.16,
  ceilingLampsGX53Count: 52,
  interiorDoorsCount: 6,
  entranceDoorTrim: 1,
  floorCoveringCardboardM2: 63,
  garbageRemovalTrips: 3,
  cleaningAfterRenovation: 1,
};

export const DEFAULT_OBJECT_CONSTANTS: ObjectChecklistConstants = BENCHMARK_63_OBJECT_CONSTANTS;

/**
 * Эталонный список комнат для квартиры 63 м² (ул. Дангиреева 2)
 */
export const BENCHMARK_63_ROOMS = [
  { id: 'bm_kitchen', name: 'Кухня', floorArea: 19.37, wallNetArea: 39.48, perimeter: 17.74 },
  { id: 'bm_toilet', name: 'Туалет', floorArea: 2.60, wallNetArea: 20.65, perimeter: 6.80 },
  { id: 'bm_bath', name: 'Ванная', floorArea: 3.46, wallNetArea: 21.44, perimeter: 7.50 },
  { id: 'bm_balcony', name: 'Лоджия', floorArea: 5.10, wallNetArea: 12.00, perimeter: 9.60 },
  { id: 'bm_bed1', name: 'Спальня 1', floorArea: 11.80, wallNetArea: 34.16, perimeter: 14.00 },
  { id: 'bm_bed2', name: 'Спальня 2', floorArea: 13.19, wallNetArea: 47.19, perimeter: 16.50 },
  { id: 'bm_corridor', name: 'Коридор', floorArea: 9.53, wallNetArea: 40.12, perimeter: 18.00 },
];

export interface PieceworkItemSpec {
  id: string;
  num: number;
  category: 'Подготовка' | 'Сантехника' | 'Электрика' | 'Вентиляция' | 'Монтаж ГКЛ' | 'Плитка' | 'Освещение' | 'Двери' | 'Сервис';
  title: string;
  description: string;
  unit: string;
  unitPrice: number;
  step?: number;
  getQty: (c: ObjectChecklistConstants) => number;
  setQty: (c: ObjectChecklistConstants, val: number) => ObjectChecklistConstants;
  calculateTotal: (c: ObjectChecklistConstants) => number;
}

export const PIECEWORK_15_ITEMS: PieceworkItemSpec[] = [
  {
    id: 'prep',
    num: 1,
    category: 'Подготовка',
    title: 'Укутывание дверей и окон защитной пленкой',
    description: 'Защита входной двери, оконных блоков и остекления перед грязными работами',
    unit: 'компл',
    unitPrice: 14000,
    getQty: c => c.prepWorkWrapping,
    setQty: (c, v) => ({ ...c, prepWorkWrapping: Math.max(0, v) }),
    calculateTotal: c => (c.prepWorkWrapping || 0) * 14000
  },
  {
    id: 'plumbing_hot_cold',
    num: 2,
    category: 'Сантехника',
    title: 'Точки водопровода ГВС, ХВС (разводка)',
    description: 'Разводка труб горячего и холодного водоснабжения под смесители, душ, стиральную машину',
    unit: 'шт',
    unitPrice: 2200,
    getQty: c => c.plumbingHotColdPoints,
    setQty: (c, v) => ({ ...c, plumbingHotColdPoints: Math.max(0, v) }),
    calculateTotal: c => (c.plumbingHotColdPoints || 0) * 2200
  },
  {
    id: 'plumbing_sewer',
    num: 3,
    category: 'Сантехника',
    title: 'Точки канализации КС (сливы с фиксацией)',
    description: 'Прокладка фановых труб канализации с уклоном и жесткой фиксацией',
    unit: 'шт',
    unitPrice: 1800,
    getQty: c => c.plumbingSewerPoints,
    setQty: (c, v) => ({ ...c, plumbingSewerPoints: Math.max(0, v) }),
    calculateTotal: c => (c.plumbingSewerPoints || 0) * 1800
  },
  {
    id: 'plumbing_toilet_install',
    num: 4,
    category: 'Сантехника',
    title: 'Монтаж инсталляции подвесного унитаза',
    description: 'Сборка и анкерное крепление металлической рамы скрытой инсталляции',
    unit: 'шт',
    unitPrice: 4500,
    getQty: c => c.plumbingToiletInstallation,
    setQty: (c, v) => ({ ...c, plumbingToiletInstallation: Math.max(0, v) }),
    calculateTotal: c => (c.plumbingToiletInstallation || 0) * 4500
  },
  {
    id: 'electric_rough',
    num: 5,
    category: 'Электрика',
    title: 'Черновые точки электрики и интернета',
    description: 'Штробление, укладка негорючего кабеля ГОСТ в гофре и вмазка подрозетников',
    unit: 'шт',
    unitPrice: 1700,
    getQty: c => c.electricRoughPoints,
    setQty: (c, v) => ({ ...c, electricRoughPoints: Math.max(0, v) }),
    calculateTotal: c => (c.electricRoughPoints || 0) * 1700
  },
  {
    id: 'electric_finish',
    num: 6,
    category: 'Электрика',
    title: 'Чистовая электрика (розетки, выключатели)',
    description: 'Установка механизмов розеток, выключателей, диммеров, терморегуляторов и рамок',
    unit: 'шт',
    unitPrice: 400,
    getQty: c => c.electricFinishPoints,
    setQty: (c, v) => ({ ...c, electricFinishPoints: Math.max(0, v) }),
    calculateTotal: c => (c.electricFinishPoints || 0) * 400
  },
  {
    id: 'ventilation',
    num: 7,
    category: 'Вентиляция',
    title: 'Вытяжная вентиляция и отверстия',
    description: 'Алмазное бурение вентканалов и монтаж вытяжных вентиляторов (кухня, ванна, с/у)',
    unit: 'шт',
    unitPrice: 4266,
    getQty: c => (c.kitchenHoodVent ? 1 : 0) + (c.bathVentFanMount ? 1 : 0) + (c.toiletVentFanMount ? 1 : 0),
    setQty: (c, v) => {
      const val = Math.max(0, v);
      return {
        ...c,
        kitchenHoodVent: val >= 1 ? 1 : 0,
        bathVentHole: val >= 2 ? 1 : 0,
        bathVentFanMount: val >= 2 ? 1 : 0,
        toiletVentFanMount: val >= 3 ? val - 2 : 0
      };
    },
    calculateTotal: c => {
      const count = (c.kitchenHoodVent ? 1 : 0) + (c.bathVentFanMount ? 1 : 0) + (c.toiletVentFanMount ? 1 : 0);
      return count === 3 ? 12800 : count * 4266;
    }
  },
  {
    id: 'gyp_transoms_boxes',
    num: 8,
    category: 'Монтаж ГКЛ',
    title: 'Опуски дверных проемов и короба ГКЛ',
    description: 'Опуски проемов по коридору (6 шт.) + зашивка ниш стояков ГКЛ в санузле и кухне',
    unit: 'проемов',
    unitPrice: 4750,
    getQty: c => c.corridorDoorTransomGyp,
    setQty: (c, v) => ({ ...c, corridorDoorTransomGyp: Math.max(0, v) }),
    calculateTotal: c => (c.corridorDoorTransomGyp || 0) * 750 + 24000
  },
  {
    id: 'bath_shower_tray',
    num: 9,
    category: 'Сантехника',
    title: 'Устройство душевого поддона 800х1500',
    description: 'Монолитный поддон с трапом, гидроизоляцией и облицовкой плиткой/мозаикой',
    unit: 'шт',
    unitPrice: 18000,
    getQty: c => c.bathShowerTrayPoddon,
    setQty: (c, v) => ({ ...c, bathShowerTrayPoddon: Math.max(0, v) }),
    calculateTotal: c => (c.bathShowerTrayPoddon || 0) * 18000
  },
  {
    id: 'tile_clean_cut',
    num: 10,
    category: 'Плитка',
    title: 'Запил плитки под 45° (чистый рез)',
    description: 'Высокоточная заводская шлифовка внешних углов плитки и керамогранита под 45°',
    unit: 'м.п.',
    step: 0.1,
    unitPrice: 2000,
    getQty: c => c.tileCleanCutBathToiletM,
    setQty: (c, v) => ({ ...c, tileCleanCutBathToiletM: Number(v) }),
    calculateTotal: c => Math.round((c.tileCleanCutBathToiletM || 0) * 2000)
  },
  {
    id: 'tile_holes',
    num: 11,
    category: 'Плитка',
    title: 'Отверстия в керамограните алмазной коронкой',
    description: 'Высверливание отверстий под трубы и розетки коронкой с водяным охлаждением',
    unit: 'шт',
    unitPrice: 600,
    getQty: c => (c.tileHolesDrilledBath || 0) + (c.tileHolesDrilledToilet || 0),
    setQty: (c, v) => {
      const total = Math.max(0, v);
      const bath = Math.ceil(total * 10 / 16);
      const toilet = Math.max(0, total - bath);
      return { ...c, tileHolesDrilledBath: bath, tileHolesDrilledToilet: toilet };
    },
    calculateTotal: c => ((c.tileHolesDrilledBath || 0) + (c.tileHolesDrilledToilet || 0)) * 600
  },
  {
    id: 'mount_sanitary',
    num: 12,
    category: 'Сантехника',
    title: 'Установка чистового санфаянса (комплекс)',
    description: 'Монтаж раковин с тумбой, смесителей, душа, унитаза, гиг. душа, полотенцесушителя',
    unit: 'приборов',
    unitPrice: 3062,
    getQty: c => (c.mountSinkWithCabinet || 0) + (c.mountShowerSystem || 0) + (c.mountTowelRail || 0) + (c.mountHangingToilet || 0) + (c.mountHygienicShower || 0) + (c.mountMirror || 0),
    setQty: (c, v) => {
      const val = Math.max(0, v);
      return {
        ...c,
        mountSinkWithCabinet: Math.min(2, Math.max(1, Math.round(val * 2 / 8))),
        mountShowerSystem: Math.min(1, Math.max(0, Math.round(val * 1 / 8))),
        mountTowelRail: 1,
        mountHangingToilet: 1,
        mountHygienicShower: 1,
        mountMirror: Math.min(2, Math.max(1, Math.round(val * 2 / 8)))
      };
    },
    calculateTotal: () => 24500
  },
  {
    id: 'lamps_gx53',
    num: 13,
    category: 'Освещение',
    title: 'Монтаж светильников GX53 в натяжной потолок',
    description: 'Установка термоколец, закладных платформ и точечных светильников GX53',
    unit: 'шт',
    unitPrice: 750,
    getQty: c => c.ceilingLampsGX53Count,
    setQty: (c, v) => ({ ...c, ceilingLampsGX53Count: Math.max(0, v) }),
    calculateTotal: c => (c.ceilingLampsGX53Count || 0) * 750
  },
  {
    id: 'interior_doors',
    num: 14,
    category: 'Двери',
    title: 'Монтаж межкомнатных дверей с доборами',
    description: 'Установка дверных блоков с врезкой петель, магнитных замков, доборов и наличников',
    unit: 'шт',
    unitPrice: 4500,
    getQty: c => c.interiorDoorsCount,
    setQty: (c, v) => ({ ...c, interiorDoorsCount: Math.max(0, v) }),
    calculateTotal: c => (c.interiorDoorsCount || 0) * 4500
  },
  {
    id: 'garbage_cleaning',
    num: 15,
    category: 'Сервис',
    title: 'Вывоз мусора (Газель) и клининг объекта',
    description: 'Погрузка и вывоз мусора (3 рейса Газель) + финальная уборка после ремонта',
    unit: 'рейсов',
    unitPrice: 8000,
    getQty: c => c.garbageRemovalTrips,
    setQty: (c, v) => ({ ...c, garbageRemovalTrips: Math.max(0, v), cleaningAfterRenovation: 1 }),
    calculateTotal: c => (c.garbageRemovalTrips || 0) * 8000 + (c.cleaningAfterRenovation ? 3500 : 0)
  }
];

/**
 * 118 эталонных позиций сметы
 */
export const KRASNODAR_118_ITEMS: TemplateWorkItem[] = [
  // 1. Подготовительные работы
  {
    id: 'krd_118_1',
    num: 1,
    stageName: 'Подготовительные работы',
    trade: 'Маляры',
    name: 'Подготовительные работы перед началом работ на объекте (укутывание входной двери, стеклопакетов) без материала',
    unit: 'шт.',
    unitPrice: 14000,
    isConstant: true,
    defaultQuantity: 1,
    calcType: 'fixed',
    note: 'Константа: базовый комплекс защиты объекта на старте'
  },

  // 2. Сантехнические работы (41 700 ₽)
  {
    id: 'krd_118_4',
    num: 4,
    stageName: 'Сантехнические работы',
    trade: 'Сантехники',
    name: 'Точка ГВС, ХВС',
    unit: 'шт.',
    unitPrice: 2200,
    isConstant: true,
    defaultQuantity: 12,
    calcType: 'fixed',
    note: 'Константа: разводка водорозеток (раковины, душ, инсталляция, СМА, ПММ, мойка)'
  },
  {
    id: 'krd_118_5',
    num: 5,
    stageName: 'Сантехнические работы',
    trade: 'Сантехники',
    name: 'Точка КС (канализация)',
    unit: 'шт.',
    unitPrice: 1800,
    isConstant: true,
    defaultQuantity: 6,
    calcType: 'fixed',
    note: 'Константа: трапы, сливы умывальников, унитаза, ванны'
  },
  {
    id: 'krd_118_6',
    num: 6,
    stageName: 'Сантехнические работы',
    trade: 'Сантехники',
    name: 'Установка инсталляции унитаза',
    unit: 'шт.',
    unitPrice: 4500,
    isConstant: true,
    defaultQuantity: 1,
    calcType: 'fixed',
    note: 'Константа: монтаж скрытого монтажного модуля Geberit/Grohe'
  },

  // 3. Электромонтажные работы (58 000 ₽)
  {
    id: 'krd_118_7',
    num: 7,
    stageName: 'Электромонтажные работы',
    trade: 'Электрики',
    name: 'Монтаж точки электрики и интернета (прокладка кабеля, высверловка отверстия, установка распред. коробок, подрозетника) с учетом гофры',
    unit: 'шт.',
    unitPrice: 1700,
    isConstant: true,
    defaultQuantity: 20,
    calcType: 'fixed',
    note: 'Константа: черновые кабельные трассы и подрозетники'
  },
  {
    id: 'krd_118_10',
    num: 10,
    stageName: 'Электромонтажные работы',
    trade: 'Электрики',
    name: 'Чистовая электрика (установка механизмов розеток, выключателей и рамок)',
    unit: 'шт.',
    unitPrice: 400,
    isConstant: true,
    defaultQuantity: 60,
    calcType: 'fixed',
    note: 'Константа: чистовой монтаж механизмов'
  },

  // 4. Штукатурные работы (39 230.30 ₽)
  {
    id: 'krd_118_11',
    num: 11,
    stageName: 'Штукатурные работы',
    subCategory: 'Кухня',
    trade: 'Штукатуры',
    name: 'Грунтование стен перед оштукатуриванием (зона кухонного гарнитура)',
    unit: 'м.пог.',
    unitPrice: 70,
    isConstant: false,
    defaultQuantity: 8.08,
    calcType: 'kitchenWorkZone',
    note: 'Геометрия: длина фартука и протяжки у пола кухни'
  },
  {
    id: 'krd_118_12',
    num: 12,
    stageName: 'Штукатурные работы',
    subCategory: 'Кухня',
    trade: 'Штукатуры',
    name: 'Оштукатуривание стен, протяжка у пола под кухонный гарнитур',
    unit: 'м.пог.',
    unitPrice: 670,
    isConstant: false,
    defaultQuantity: 8.08,
    calcType: 'kitchenWorkZone',
    note: 'Геометрия: выравнивание геометрии вдоль пола для кухни'
  },
  {
    id: 'krd_118_14',
    num: 14,
    stageName: 'Штукатурные работы',
    subCategory: 'Туалет',
    trade: 'Штукатуры',
    name: 'Грунтование стен (перед оштукатуриванием)',
    unit: 'м²',
    unitPrice: 70,
    isConstant: false,
    defaultQuantity: 20.65,
    calcType: 'roomWallNet',
    note: 'Геометрия: площадь стен туалета'
  },
  {
    id: 'krd_118_15',
    num: 15,
    stageName: 'Штукатурные работы',
    subCategory: 'Туалет',
    trade: 'Штукатуры',
    name: 'Оштукатуривание стен по маякам с использованием ЦПС',
    unit: 'м²',
    unitPrice: 720,
    isConstant: false,
    defaultQuantity: 20.65,
    calcType: 'roomWallNet',
    note: 'Геометрия: штукатурка стен туалета цементной смесью'
  },
  {
    id: 'krd_118_16',
    num: 16,
    stageName: 'Штукатурные работы',
    subCategory: 'Ванная',
    trade: 'Штукатуры',
    name: 'Грунтование стен (перед оштукатуриванием)',
    unit: 'м²',
    unitPrice: 70,
    isConstant: false,
    defaultQuantity: 21.44,
    calcType: 'roomWallNet',
    note: 'Геометрия: площадь стен ванной комнаты'
  },
  {
    id: 'krd_118_17',
    num: 17,
    stageName: 'Штукатурные работы',
    subCategory: 'Ванная',
    trade: 'Штукатуры',
    name: 'Оштукатуривание стен по маякам с использованием ЦПС',
    unit: 'м²',
    unitPrice: 720,
    isConstant: false,
    defaultQuantity: 21.44,
    calcType: 'roomWallNet',
    note: 'Геометрия: штукатурка стен ванной цементной смесью'
  },

  // 5. Работы по полу лоджия (8 160 ₽)
  {
    id: 'krd_118_20',
    num: 20,
    stageName: 'Работы по полу лоджия',
    subCategory: 'Лоджия',
    trade: 'Плиточники',
    name: 'Утепление пола пеноплексом (лоджия)',
    unit: 'м²',
    unitPrice: 600,
    isConstant: false,
    defaultQuantity: 5.1,
    calcType: 'roomFloor',
    note: 'Геометрия: фактическая площадь пола лоджии'
  },
  {
    id: 'krd_118_21',
    num: 21,
    stageName: 'Работы по полу лоджия',
    subCategory: 'Лоджия',
    trade: 'Плиточники',
    name: 'Черновая стяжка пола по маякам с армировкой (лоджия)',
    unit: 'м²',
    unitPrice: 1000,
    isConstant: false,
    defaultQuantity: 5.1,
    calcType: 'roomFloor',
    note: 'Геометрия: стяжка пола лоджии'
  },

  // 6. Монтажные работы (81 530 ₽)
  {
    id: 'krd_118_23',
    num: 23,
    stageName: 'Монтажные работы',
    subCategory: 'Кухня',
    trade: 'Монтажники',
    name: 'Монтаж вытяжной вентиляции для варочной панели',
    unit: 'шт.',
    unitPrice: 4000,
    isConstant: true,
    defaultQuantity: 1,
    calcType: 'fixed',
    note: 'Константа: пластиковый плоский вентканал под потолком'
  },
  {
    id: 'krd_118_24',
    num: 24,
    stageName: 'Монтажные работы',
    subCategory: 'Кухня',
    trade: 'Монтажники',
    name: 'Зашивка ниши ГКЛ по каркасу, 1 слой (H=3.04м)',
    unit: 'м.пог.',
    unitPrice: 1000,
    isConstant: true,
    defaultQuantity: 3.04,
    calcType: 'fixed',
    note: 'Константа: высота потолка h=3.04 м'
  },
  {
    id: 'krd_118_25',
    num: 25,
    stageName: 'Монтажные работы',
    subCategory: 'Коридор',
    trade: 'Монтажники',
    name: 'Формирование дверного проема (опуск по высоте ГКЛ)',
    unit: 'шт.',
    unitPrice: 750,
    isConstant: true,
    defaultQuantity: 6,
    calcType: 'fixed',
    note: 'Константа: опуск 6 проемов под стандартные двери 2050 мм'
  },
  {
    id: 'krd_118_26',
    num: 26,
    stageName: 'Монтажные работы',
    subCategory: 'Ванная',
    trade: 'Монтажники',
    name: 'Устройство отверстия для вентиляции',
    unit: 'шт.',
    unitPrice: 1200,
    isConstant: true,
    defaultQuantity: 1,
    calcType: 'fixed',
    note: 'Константа'
  },
  {
    id: 'krd_118_27',
    num: 27,
    stageName: 'Монтажные работы',
    subCategory: 'Ванная',
    trade: 'Монтажники',
    name: 'Монтаж вытяжной вентиляции',
    unit: 'шт.',
    unitPrice: 4000,
    isConstant: true,
    defaultQuantity: 1,
    calcType: 'fixed',
    note: 'Константа'
  },
  {
    id: 'krd_118_28',
    num: 28,
    stageName: 'Монтажные работы',
    subCategory: 'Ванная',
    trade: 'Монтажники',
    name: 'Монтаж короба из ГКЛ (стояк / трубы)',
    unit: 'м.п.',
    unitPrice: 1500,
    isConstant: true,
    defaultQuantity: 1.5,
    calcType: 'fixed',
    note: 'Константа'
  },
  {
    id: 'krd_118_29',
    num: 29,
    stageName: 'Монтажные работы',
    subCategory: 'Ванная',
    trade: 'Плиточники',
    name: 'Устройство душевого поддона 800х1500 с облицовкой',
    unit: 'шт.',
    unitPrice: 51000,
    isConstant: true,
    defaultQuantity: 1,
    calcType: 'fixed',
    note: 'Константа: строительный трап, кирпичный борт, стяжка с уклоном, гидроизоляция и мозаика/керамогранит'
  },
  {
    id: 'krd_118_30',
    num: 30,
    stageName: 'Монтажные работы',
    subCategory: 'Туалет',
    trade: 'Монтажники',
    name: 'Монтаж короба из ГКЛ на высоту инсталляции шириной до 1.2м',
    unit: 'шт.',
    unitPrice: 4500,
    isConstant: true,
    defaultQuantity: 1,
    calcType: 'fixed',
    note: 'Константа: короб инсталляции с ревизионным люком'
  },
  {
    id: 'krd_118_31',
    num: 31,
    stageName: 'Монтажные работы',
    subCategory: 'Туалет',
    trade: 'Монтажники',
    name: 'Монтаж вытяжной вентиляции',
    unit: 'шт.',
    unitPrice: 4000,
    isConstant: true,
    defaultQuantity: 1,
    calcType: 'fixed',
    note: 'Константа'
  },
  {
    id: 'krd_118_32',
    num: 32,
    stageName: 'Монтажные работы',
    subCategory: 'Туалет',
    trade: 'Монтажники',
    name: 'Зашивка ниши ГКЛ по каркасу, 1 слой (H=3.04м)',
    unit: 'м.пог.',
    unitPrice: 1000,
    isConstant: true,
    defaultQuantity: 3.04,
    calcType: 'fixed',
    note: 'Константа'
  },

  // 7. Плиточные работы (217 014.70 ₽)
  // Лоджия
  {
    id: 'krd_118_33',
    num: 33,
    stageName: 'Плиточные работы',
    subCategory: 'Лоджия',
    trade: 'Плиточники',
    name: 'Грунтовка пола перед укладкой керамогранита',
    unit: 'м²',
    unitPrice: 70,
    isConstant: false,
    defaultQuantity: 5.1,
    calcType: 'roomFloor',
    note: 'Геометрия пола лоджии'
  },
  {
    id: 'krd_118_34',
    num: 34,
    stageName: 'Плиточные работы',
    subCategory: 'Лоджия',
    trade: 'Плиточники',
    name: 'Укладка керамогранита на пол (формат 1200*600)',
    unit: 'м²',
    unitPrice: 2000,
    isConstant: false,
    defaultQuantity: 5.1,
    calcType: 'roomFloor',
    note: 'Геометрия пола лоджии'
  },
  {
    id: 'krd_118_35',
    num: 35,
    stageName: 'Плиточные работы',
    subCategory: 'Лоджия',
    trade: 'Плиточники',
    name: 'Затирка цементная (пол лоджии)',
    unit: 'м²',
    unitPrice: 500,
    isConstant: false,
    defaultQuantity: 5.1,
    calcType: 'roomFloor',
    note: 'Геометрия пола лоджии'
  },
  // Ванная
  {
    id: 'krd_118_36',
    num: 36,
    stageName: 'Плиточные работы',
    subCategory: 'Ванная',
    trade: 'Плиточники',
    name: 'Грунтование пола перед устройством наливного пола',
    unit: 'м²',
    unitPrice: 250,
    isConstant: false,
    defaultQuantity: 2.22,
    calcType: 'roomFloor',
    note: 'Геометрия пола за вычетом поддона'
  },
  {
    id: 'krd_118_37',
    num: 37,
    stageName: 'Плиточные работы',
    subCategory: 'Ванная',
    trade: 'Плиточники',
    name: 'Устройство наливного пола, до 10 мм',
    unit: 'м²',
    unitPrice: 700,
    isConstant: false,
    defaultQuantity: 2.22,
    calcType: 'roomFloor',
    note: 'Геометрия пола за вычетом поддона'
  },
  {
    id: 'krd_118_38',
    num: 38,
    stageName: 'Плиточные работы',
    subCategory: 'Ванная',
    trade: 'Плиточники',
    name: 'Гидроизоляция пола и стен обмазочная (2 раза)',
    unit: 'м²',
    unitPrice: 500,
    isConstant: false,
    defaultQuantity: 24.9,
    calcType: 'wetHydroTotal',
    note: 'Геометрия стен (21.44) + пола ванной'
  },
  {
    id: 'krd_118_39',
    num: 39,
    stageName: 'Плиточные работы',
    subCategory: 'Ванная',
    trade: 'Плиточники',
    name: 'Грунтование пола (перед укладкой плитки)',
    unit: 'м²',
    unitPrice: 70,
    isConstant: false,
    defaultQuantity: 2.22,
    calcType: 'roomFloor',
    note: 'Геометрия'
  },
  {
    id: 'krd_118_40',
    num: 40,
    stageName: 'Плиточные работы',
    subCategory: 'Ванная',
    trade: 'Плиточники',
    name: 'Грунтование стен (перед укладкой плитки)',
    unit: 'м²',
    unitPrice: 70,
    isConstant: false,
    defaultQuantity: 21.44,
    calcType: 'roomWallNet',
    note: 'Геометрия стен ванной'
  },
  {
    id: 'krd_118_41',
    num: 41,
    stageName: 'Плиточные работы',
    subCategory: 'Ванная',
    trade: 'Плиточники',
    name: 'Укладка керамогранита на пол (формат 1200*600)',
    unit: 'м²',
    unitPrice: 2000,
    isConstant: false,
    defaultQuantity: 2.22,
    calcType: 'roomFloor',
    note: 'Геометрия'
  },
  {
    id: 'krd_118_42',
    num: 42,
    stageName: 'Плиточные работы',
    subCategory: 'Ванная',
    trade: 'Плиточники',
    name: 'Запил плитки (чистый рез под 45°)',
    unit: 'м.пог.',
    unitPrice: 2000,
    isConstant: true,
    defaultQuantity: 0.8,
    calcType: 'fixed',
    note: 'Константа: наружные углы коробов и полок'
  },
  {
    id: 'krd_118_43',
    num: 43,
    stageName: 'Плиточные работы',
    subCategory: 'Ванная',
    trade: 'Плиточники',
    name: 'Укладка керамогранита на стены (формат 1200*600)',
    unit: 'м²',
    unitPrice: 2000,
    isConstant: false,
    defaultQuantity: 21.44,
    calcType: 'roomWallNet',
    note: 'Геометрия стен ванной'
  },
  {
    id: 'krd_118_44',
    num: 44,
    stageName: 'Плиточные работы',
    subCategory: 'Ванная',
    trade: 'Плиточники',
    name: 'Затирка цементная пол (ванная)',
    unit: 'м²',
    unitPrice: 500,
    isConstant: false,
    defaultQuantity: 3.46,
    calcType: 'roomFloor',
    note: 'Геометрия пола'
  },
  {
    id: 'krd_118_45',
    num: 45,
    stageName: 'Плиточные работы',
    subCategory: 'Ванная',
    trade: 'Плиточники',
    name: 'Затирка цементная стены (ванная)',
    unit: 'м²',
    unitPrice: 500,
    isConstant: false,
    defaultQuantity: 21.44,
    calcType: 'roomWallNet',
    note: 'Геометрия стен ванной'
  },
  {
    id: 'krd_118_46',
    num: 46,
    stageName: 'Плиточные работы',
    subCategory: 'Ванная',
    trade: 'Плиточники',
    name: 'Высверливание отверстий в плитке (водорозетки, смесители, крепеж)',
    unit: 'шт.',
    unitPrice: 750,
    isConstant: true,
    defaultQuantity: 10,
    calcType: 'fixed',
    note: 'Константа: коронки по керамограниту'
  },
  {
    id: 'krd_118_47',
    num: 47,
    stageName: 'Плиточные работы',
    subCategory: 'Ванная',
    trade: 'Плиточники',
    name: 'Монтаж раковины с тумбой и смесителя',
    unit: 'шт.',
    unitPrice: 9000,
    isConstant: true,
    defaultQuantity: 1,
    calcType: 'fixed',
    note: 'Константа'
  },
  {
    id: 'krd_118_48',
    num: 48,
    stageName: 'Плиточные работы',
    subCategory: 'Ванная',
    trade: 'Плиточники',
    name: 'Монтаж душевой системы (стойка / тропический душ)',
    unit: 'шт.',
    unitPrice: 4000,
    isConstant: true,
    defaultQuantity: 1,
    calcType: 'fixed',
    note: 'Константа'
  },
  {
    id: 'krd_118_49',
    num: 49,
    stageName: 'Плиточные работы',
    subCategory: 'Ванная',
    trade: 'Плиточники',
    name: 'Монтаж зеркала с подсветкой',
    unit: 'шт.',
    unitPrice: 1500,
    isConstant: true,
    defaultQuantity: 1,
    calcType: 'fixed',
    note: 'Константа'
  },
  {
    id: 'krd_118_50',
    num: 50,
    stageName: 'Плиточные работы',
    subCategory: 'Ванная',
    trade: 'Плиточники',
    name: 'Монтаж электрического полотенцесушителя',
    unit: 'шт.',
    unitPrice: 3000,
    isConstant: true,
    defaultQuantity: 1,
    calcType: 'fixed',
    note: 'Константа'
  },
  {
    id: 'krd_118_51',
    num: 51,
    stageName: 'Плиточные работы',
    subCategory: 'Ванная',
    trade: 'Плиточники',
    name: 'Установка электрического вытяжного вентилятора',
    unit: 'шт.',
    unitPrice: 1500,
    isConstant: true,
    defaultQuantity: 1,
    calcType: 'fixed',
    note: 'Константа'
  },

  // Туалет
  {
    id: 'krd_118_52',
    num: 52,
    stageName: 'Плиточные работы',
    subCategory: 'Туалет',
    trade: 'Плиточники',
    name: 'Грунтование пола перед устройством наливного пола',
    unit: 'м²',
    unitPrice: 250,
    isConstant: false,
    defaultQuantity: 2.6,
    calcType: 'roomFloor',
    note: 'Геометрия пола туалета'
  },
  {
    id: 'krd_118_53',
    num: 53,
    stageName: 'Плиточные работы',
    subCategory: 'Туалет',
    trade: 'Плиточники',
    name: 'Устройство наливного пола, до 10 мм',
    unit: 'м²',
    unitPrice: 700,
    isConstant: false,
    defaultQuantity: 2.6,
    calcType: 'roomFloor',
    note: 'Геометрия пола туалета'
  },
  {
    id: 'krd_118_54',
    num: 54,
    stageName: 'Плиточные работы',
    subCategory: 'Туалет',
    trade: 'Плиточники',
    name: 'Гидроизоляция пола и стен (2 раза)',
    unit: 'м²',
    unitPrice: 500,
    isConstant: false,
    defaultQuantity: 23.25,
    calcType: 'wetHydroTotal',
    note: 'Геометрия'
  },
  {
    id: 'krd_118_55',
    num: 55,
    stageName: 'Плиточные работы',
    subCategory: 'Туалет',
    trade: 'Плиточники',
    name: 'Грунтование пола (перед укладкой плитки)',
    unit: 'м²',
    unitPrice: 70,
    isConstant: false,
    defaultQuantity: 2.6,
    calcType: 'roomFloor',
    note: 'Геометрия'
  },
  {
    id: 'krd_118_56',
    num: 56,
    stageName: 'Плиточные работы',
    subCategory: 'Туалет',
    trade: 'Плиточники',
    name: 'Грунтование стен (перед укладкой плитки)',
    unit: 'м²',
    unitPrice: 70,
    isConstant: false,
    defaultQuantity: 20.65,
    calcType: 'roomWallNet',
    note: 'Геометрия стен туалета'
  },
  {
    id: 'krd_118_57',
    num: 57,
    stageName: 'Плиточные работы',
    subCategory: 'Туалет',
    trade: 'Плиточники',
    name: 'Укладка керамогранита на пол (формат 1200*600)',
    unit: 'м²',
    unitPrice: 2000,
    isConstant: false,
    defaultQuantity: 2.6,
    calcType: 'roomFloor',
    note: 'Геометрия'
  },
  {
    id: 'krd_118_58',
    num: 58,
    stageName: 'Плиточные работы',
    subCategory: 'Туалет',
    trade: 'Плиточники',
    name: 'Запил плитки (чистый рез под 45°)',
    unit: 'м.пог.',
    unitPrice: 2000,
    isConstant: true,
    defaultQuantity: 0.8,
    calcType: 'fixed',
    note: 'Константа: углы инсталляции'
  },
  {
    id: 'krd_118_59',
    num: 59,
    stageName: 'Плиточные работы',
    subCategory: 'Туалет',
    trade: 'Плиточники',
    name: 'Укладка керамогранита на стены (формат 1200*600)',
    unit: 'м²',
    unitPrice: 2000,
    isConstant: false,
    defaultQuantity: 16.6,
    calcType: 'roomWallNet',
    note: 'Геометрия стен'
  },
  {
    id: 'krd_118_60',
    num: 60,
    stageName: 'Плиточные работы',
    subCategory: 'Туалет',
    trade: 'Плиточники',
    name: 'Укладка керамогранита на откосы и короба (формат 1200*600)',
    unit: 'м.пог.',
    unitPrice: 2000,
    isConstant: true,
    defaultQuantity: 4,
    calcType: 'fixed',
    note: 'Константа: короба ГКЛ инсталляции'
  },
  {
    id: 'krd_118_61',
    num: 61,
    stageName: 'Плиточные работы',
    subCategory: 'Туалет',
    trade: 'Плиточники',
    name: 'Затирка цементная, пол (туалет)',
    unit: 'м²',
    unitPrice: 500,
    isConstant: false,
    defaultQuantity: 2.6,
    calcType: 'roomFloor',
    note: 'Геометрия'
  },
  {
    id: 'krd_118_62',
    num: 62,
    stageName: 'Плиточные работы',
    subCategory: 'Туалет',
    trade: 'Плиточники',
    name: 'Затирка цементная, стены (туалет)',
    unit: 'м²',
    unitPrice: 500,
    isConstant: false,
    defaultQuantity: 16.6,
    calcType: 'roomWallNet',
    note: 'Геометрия'
  },
  {
    id: 'krd_118_63',
    num: 63,
    stageName: 'Плиточные работы',
    subCategory: 'Туалет',
    trade: 'Плиточники',
    name: 'Высверливание отверстий в плитке',
    unit: 'шт.',
    unitPrice: 750,
    isConstant: true,
    defaultQuantity: 6,
    calcType: 'fixed',
    note: 'Константа'
  },
  {
    id: 'krd_118_64',
    num: 64,
    stageName: 'Плиточные работы',
    subCategory: 'Туалет',
    trade: 'Плиточники',
    name: 'Монтаж подвесного унитаза с кнопкой инсталляции',
    unit: 'шт.',
    unitPrice: 6000,
    isConstant: true,
    defaultQuantity: 1,
    calcType: 'fixed',
    note: 'Константа'
  },
  {
    id: 'krd_118_65',
    num: 65,
    stageName: 'Плиточные работы',
    subCategory: 'Туалет',
    trade: 'Плиточники',
    name: 'Монтаж зеркала',
    unit: 'шт.',
    unitPrice: 1500,
    isConstant: true,
    defaultQuantity: 1,
    calcType: 'fixed',
    note: 'Константа'
  },
  {
    id: 'krd_118_66',
    num: 66,
    stageName: 'Плиточные работы',
    subCategory: 'Туалет',
    trade: 'Плиточники',
    name: 'Монтаж гигиенического душа со скрытым смесителем',
    unit: 'шт.',
    unitPrice: 4000,
    isConstant: true,
    defaultQuantity: 1,
    calcType: 'fixed',
    note: 'Константа'
  },
  {
    id: 'krd_118_67',
    num: 67,
    stageName: 'Плиточные работы',
    subCategory: 'Туалет',
    trade: 'Плиточники',
    name: 'Монтаж раковины с тумбой и смесителя (рукомойник)',
    unit: 'шт.',
    unitPrice: 9000,
    isConstant: true,
    defaultQuantity: 1,
    calcType: 'fixed',
    note: 'Константа'
  },
  {
    id: 'krd_118_68',
    num: 68,
    stageName: 'Плиточные работы',
    subCategory: 'Туалет',
    trade: 'Плиточники',
    name: 'Установка электрического вытяжного вентилятора',
    unit: 'шт.',
    unitPrice: 1500,
    isConstant: true,
    defaultQuantity: 1,
    calcType: 'fixed',
    note: 'Константа'
  },

  // 8. Работы по укладке напольного покрытия (64 045.50 ₽)
  {
    id: 'krd_118_69',
    num: 69,
    stageName: 'Напольные покрытия',
    trade: 'Паркетчики',
    name: 'Укладка ламината с подложкой (жилые комнаты + коридор + кухня)',
    unit: 'м²',
    unitPrice: 600,
    isConstant: false,
    defaultQuantity: 53.9,
    calcType: 'livingFloorsTotal',
    note: 'Геометрия: сумма полов жилых зон без санузлов'
  },
  {
    id: 'krd_118_70',
    num: 70,
    stageName: 'Напольные покрытия',
    trade: 'Паркетчики',
    name: 'Чистый рез ламината (стыки с керамогранитом, дверные проёмы)',
    unit: 'м.пог.',
    unitPrice: 600,
    isConstant: true,
    defaultQuantity: 9.83,
    calcType: 'fixed',
    note: 'Константа: примыкания и фигурные запилы'
  },
  {
    id: 'krd_118_71',
    num: 71,
    stageName: 'Напольные покрытия',
    trade: 'Паркетчики',
    name: 'Монтаж напольного пластикового плинтуса с кабель-каналом',
    unit: 'м.пог.',
    unitPrice: 450,
    isConstant: false,
    defaultQuantity: 57.35,
    calcType: 'livingPlinthTotal',
    note: 'Геометрия: периметр жилых комнат за вычетом дверей'
  },

  // 9. Малярные работы по стенам (260 364.40 ₽)
  // Спальня 1 (стены 34.16 м², откосы 6.08 м)
  {
    id: 'krd_118_72',
    num: 72,
    stageName: 'Малярные работы',
    subCategory: 'Спальня 1',
    trade: 'Маляры',
    name: 'Грунтование стен (перед шпатлеванием базового слоя)',
    unit: 'м²',
    unitPrice: 70,
    isConstant: false,
    defaultQuantity: 34.16,
    calcType: 'roomWallNet',
    note: 'Геометрия стен'
  },
  {
    id: 'krd_118_73',
    num: 73,
    stageName: 'Малярные работы',
    subCategory: 'Спальня 1',
    trade: 'Маляры',
    name: 'Шпатлевание стен 2 раза (базовый слой)',
    unit: 'м²',
    unitPrice: 530,
    isConstant: false,
    defaultQuantity: 34.16,
    calcType: 'roomWallNet',
    note: 'Геометрия стен'
  },
  {
    id: 'krd_118_74',
    num: 74,
    stageName: 'Малярные работы',
    subCategory: 'Спальня 1',
    trade: 'Маляры',
    name: 'Шлифование стен (после 2-ух базовых слоёв)',
    unit: 'м²',
    unitPrice: 100,
    isConstant: false,
    defaultQuantity: 34.16,
    calcType: 'roomWallNet',
    note: 'Геометрия стен'
  },
  {
    id: 'krd_118_75',
    num: 75,
    stageName: 'Малярные работы',
    subCategory: 'Спальня 1',
    trade: 'Маляры',
    name: 'Грунтование стен (перед поклейкой обоев)',
    unit: 'м²',
    unitPrice: 70,
    isConstant: false,
    defaultQuantity: 34.16,
    calcType: 'roomWallNet',
    note: 'Геометрия стен'
  },
  {
    id: 'krd_118_76',
    num: 76,
    stageName: 'Малярные работы',
    subCategory: 'Спальня 1',
    trade: 'Маляры',
    name: 'Оклеивание стен обоями',
    unit: 'м²',
    unitPrice: 550,
    isConstant: false,
    defaultQuantity: 34.16,
    calcType: 'roomWallNet',
    note: 'Геометрия стен'
  },
  {
    id: 'krd_118_77',
    num: 77,
    stageName: 'Малярные работы',
    subCategory: 'Спальня 1',
    trade: 'Маляры',
    name: 'Комплексная отделка откосов окон (грунтовка, шпатлевка 2 слоя база + финиш, шлифовка, покраска 2 раза)',
    unit: 'м.пог.',
    unitPrice: 1970, // 70 + 530 + 600 + 100 + 70 + 600
    isConstant: false,
    defaultQuantity: 6.08,
    calcType: 'roomWindowSlopes',
    note: 'Геометрия: откосы окна спальни'
  },

  // Спальня 2 (с гардеробом) (стены 47.19 м², откосы 6.08 м)
  {
    id: 'krd_118_83',
    num: 83,
    stageName: 'Малярные работы',
    subCategory: 'Спальня 2',
    trade: 'Маляры',
    name: 'Грунтование стен (перед шпатлеванием базового слоя)',
    unit: 'м²',
    unitPrice: 70,
    isConstant: false,
    defaultQuantity: 47.19,
    calcType: 'roomWallNet',
    note: 'Геометрия стен'
  },
  {
    id: 'krd_118_84',
    num: 84,
    stageName: 'Малярные работы',
    subCategory: 'Спальня 2',
    trade: 'Маляры',
    name: 'Шпатлевание стен 2 раза (базовый слой)',
    unit: 'м²',
    unitPrice: 530,
    isConstant: false,
    defaultQuantity: 47.19,
    calcType: 'roomWallNet',
    note: 'Геометрия стен'
  },
  {
    id: 'krd_118_85',
    num: 85,
    stageName: 'Малярные работы',
    subCategory: 'Спальня 2',
    trade: 'Маляры',
    name: 'Шлифование стен (после 2-ух базовых слоёв)',
    unit: 'м²',
    unitPrice: 100,
    isConstant: false,
    defaultQuantity: 47.19,
    calcType: 'roomWallNet',
    note: 'Геометрия стен'
  },
  {
    id: 'krd_118_86',
    num: 86,
    stageName: 'Малярные работы',
    subCategory: 'Спальня 2',
    trade: 'Маляры',
    name: 'Грунтование стен (перед поклейкой обоев)',
    unit: 'м²',
    unitPrice: 70,
    isConstant: false,
    defaultQuantity: 47.19,
    calcType: 'roomWallNet',
    note: 'Геометрия стен'
  },
  {
    id: 'krd_118_87',
    num: 87,
    stageName: 'Малярные работы',
    subCategory: 'Спальня 2',
    trade: 'Маляры',
    name: 'Оклеивание стен обоями',
    unit: 'м²',
    unitPrice: 550,
    isConstant: false,
    defaultQuantity: 47.19,
    calcType: 'roomWallNet',
    note: 'Геометрия стен'
  },
  {
    id: 'krd_118_88',
    num: 88,
    stageName: 'Малярные работы',
    subCategory: 'Спальня 2',
    trade: 'Маляры',
    name: 'Комплексная отделка откосов окон (грунтовка, шпатлевка 2 слоя база + финиш, шлифовка, покраска 2 раза)',
    unit: 'м.пог.',
    unitPrice: 1970,
    isConstant: false,
    defaultQuantity: 6.08,
    calcType: 'roomWindowSlopes',
    note: 'Геометрия: откосы окна спальни 2'
  },

  // Коридор (стены 40.12 м²)
  {
    id: 'krd_118_94',
    num: 94,
    stageName: 'Малярные работы',
    subCategory: 'Коридор',
    trade: 'Маляры',
    name: 'Грунтование стен (перед шпатлеванием базового слоя)',
    unit: 'м²',
    unitPrice: 70,
    isConstant: false,
    defaultQuantity: 40.12,
    calcType: 'roomWallNet',
    note: 'Геометрия стен коридора'
  },
  {
    id: 'krd_118_95',
    num: 95,
    stageName: 'Малярные работы',
    subCategory: 'Коридор',
    trade: 'Маляры',
    name: 'Шпатлевание стен 2 раза (базовый слой)',
    unit: 'м²',
    unitPrice: 530,
    isConstant: false,
    defaultQuantity: 40.12,
    calcType: 'roomWallNet',
    note: 'Геометрия стен'
  },
  {
    id: 'krd_118_96',
    num: 96,
    stageName: 'Малярные работы',
    subCategory: 'Коридор',
    trade: 'Маляры',
    name: 'Шлифование стен (после 2-ух базовых слоёв)',
    unit: 'м²',
    unitPrice: 100,
    isConstant: false,
    defaultQuantity: 40.12,
    calcType: 'roomWallNet',
    note: 'Геометрия стен'
  },
  {
    id: 'krd_118_97',
    num: 97,
    stageName: 'Малярные работы',
    subCategory: 'Коридор',
    trade: 'Маляры',
    name: 'Грунтование стен (перед поклейкой обоев)',
    unit: 'м²',
    unitPrice: 70,
    isConstant: false,
    defaultQuantity: 40.12,
    calcType: 'roomWallNet',
    note: 'Геометрия стен'
  },
  {
    id: 'krd_118_98',
    num: 98,
    stageName: 'Малярные работы',
    subCategory: 'Коридор',
    trade: 'Маляры',
    name: 'Оклеивание стен обоями',
    unit: 'м²',
    unitPrice: 550,
    isConstant: false,
    defaultQuantity: 40.12,
    calcType: 'roomWallNet',
    note: 'Геометрия стен'
  },

  // Кухня (стены 39.48 м², откосы 12.16 м.п.)
  {
    id: 'krd_118_99',
    num: 99,
    stageName: 'Малярные работы',
    subCategory: 'Кухня',
    trade: 'Маляры',
    name: 'Грунтование стен (перед шпатлеванием базового слоя)',
    unit: 'м²',
    unitPrice: 70,
    isConstant: false,
    defaultQuantity: 39.48,
    calcType: 'roomWallNet',
    note: 'Геометрия стен кухни'
  },
  {
    id: 'krd_118_100',
    num: 100,
    stageName: 'Малярные работы',
    subCategory: 'Кухня',
    trade: 'Маляры',
    name: 'Шпатлевание стен 2 раза (базовый слой)',
    unit: 'м²',
    unitPrice: 530,
    isConstant: false,
    defaultQuantity: 39.48,
    calcType: 'roomWallNet',
    note: 'Геометрия стен'
  },
  {
    id: 'krd_118_101',
    num: 101,
    stageName: 'Малярные работы',
    subCategory: 'Кухня',
    trade: 'Маляры',
    name: 'Шлифование стен (после 2-ух базовых слоёв)',
    unit: 'м²',
    unitPrice: 100,
    isConstant: false,
    defaultQuantity: 39.48,
    calcType: 'roomWallNet',
    note: 'Геометрия стен'
  },
  {
    id: 'krd_118_102',
    num: 102,
    stageName: 'Малярные работы',
    subCategory: 'Кухня',
    trade: 'Маляры',
    name: 'Грунтование стен (перед поклейкой обоев)',
    unit: 'м²',
    unitPrice: 70,
    isConstant: false,
    defaultQuantity: 39.48,
    calcType: 'roomWallNet',
    note: 'Геометрия стен'
  },
  {
    id: 'krd_118_103',
    num: 103,
    stageName: 'Малярные работы',
    subCategory: 'Кухня',
    trade: 'Маляры',
    name: 'Оклеивание стен обоями',
    unit: 'м²',
    unitPrice: 550,
    isConstant: false,
    defaultQuantity: 39.48,
    calcType: 'roomWallNet',
    note: 'Геометрия стен'
  },
  {
    id: 'krd_118_104',
    num: 104,
    stageName: 'Малярные работы',
    subCategory: 'Кухня',
    trade: 'Маляры',
    name: 'Комплексная отделка откосов окон (грунтовка, шпатлевка 2 слоя база + финиш, шлифовка, покраска 2 раза)',
    unit: 'м.пог.',
    unitPrice: 1970,
    isConstant: false,
    defaultQuantity: 12.16,
    calcType: 'roomWindowSlopes',
    note: 'Геометрия: откосы окон кухни (выход на лоджию + окно)'
  },

  // 10. Потолочные работы (91 141.50 ₽)
  {
    id: 'krd_118_110',
    num: 110,
    stageName: 'Потолочные работы',
    trade: 'Потолочники',
    name: 'Монтаж натяжного потолка (белый матовый MSD Premium)',
    unit: 'м²',
    unitPrice: 750,
    isConstant: false,
    defaultQuantity: 65.05,
    calcType: 'totalCeiling',
    note: 'Геометрия: общая площадь потолков квартиры'
  },
  {
    id: 'krd_118_112',
    num: 112,
    stageName: 'Потолочные работы',
    trade: 'Потолочники',
    name: 'Монтаж закладного бруса под карниз штор',
    unit: 'м.п',
    unitPrice: 650,
    isConstant: true,
    defaultQuantity: 9.16,
    calcType: 'fixed',
    note: 'Константа: длина карнизов окон'
  },
  {
    id: 'krd_118_113',
    num: 113,
    stageName: 'Потолочные работы',
    trade: 'Потолочники',
    name: 'Монтаж закладной под светильник GX53 с монтажом светильника',
    unit: 'шт.',
    unitPrice: 700,
    isConstant: true,
    defaultQuantity: 52,
    calcType: 'fixed',
    note: 'Константа: точечные светильники по комнатам'
  },

  // 11. Установка дверей (36 000 ₽)
  {
    id: 'krd_118_114',
    num: 114,
    stageName: 'Установка дверей',
    trade: 'Дверщик',
    name: 'Установка межкомнатных дверей (включая врезку петель, замков и наличников)',
    unit: 'шт.',
    unitPrice: 5500,
    isConstant: true,
    defaultQuantity: 6,
    calcType: 'fixed',
    note: 'Константа: 6 межкомнатных дверей'
  },
  {
    id: 'krd_118_115',
    num: 115,
    stageName: 'Установка дверей',
    trade: 'Дверщик',
    name: 'Облагораживание дверного проема входной двери (доборы + наличники)',
    unit: 'шт.',
    unitPrice: 3000,
    isConstant: true,
    defaultQuantity: 1,
    calcType: 'fixed',
    note: 'Константа: портал входной двери'
  },

  // 12. Прочие (43 040 ₽)
  {
    id: 'krd_118_116',
    num: 116,
    stageName: 'Прочие работы',
    trade: 'Маляры',
    name: 'Укрывочные работы по полу (гофрокартон) для сохранности стяжки и плитки',
    unit: 'м²',
    unitPrice: 80,
    isConstant: true,
    defaultQuantity: 63,
    calcType: 'fixed',
    note: 'Константа: площадь укрываемого пола'
  },
  {
    id: 'krd_118_117',
    num: 117,
    stageName: 'Прочие работы',
    trade: 'Разнорабочие',
    name: 'Вывоз строительного мусора (Газель + погрузка мешков)',
    unit: 'усл.',
    unitPrice: 8000,
    isConstant: true,
    defaultQuantity: 3,
    calcType: 'fixed',
    note: 'Константа: 3 рейса машины'
  },
  {
    id: 'krd_118_118',
    num: 118,
    stageName: 'Прочие работы',
    trade: 'Клининг',
    name: 'Клининг (генеральная уборка после ремонта), без мытья окон',
    unit: 'усл.',
    unitPrice: 14000,
    isConstant: true,
    defaultQuantity: 1,
    calcType: 'fixed',
    note: 'Константа: обеспыливание и сдача объекта заказчику'
  }
];

/**
 * Вычисляет смету по эталонному шаблону на основе комнат CAD и текущих констант чек-листа
 */
export function calculateTurnkey118Estimate(
  rooms: { name: string; floorArea: number; wallNetArea: number; perimeter: number }[],
  constants: ObjectChecklistConstants = EMPTY_OBJECT_CONSTANTS,
  priceOverrides: Record<string, number> = {},
  quantityOverrides: Record<string, number> = {},
  customSections: Array<{ id: string; title: string; description?: string; items: Array<{ id: string; name: string; unit: string; unitPrice: number; quantity: number }> }> = [],
  sectionExtraItems: Record<string, Array<{ id: string; name: string; unit: string; unitPrice: number; quantity: number }>> = {},
  customTitles: Record<string, string> = {}
) {
  // Агрегируем площади по комнатам для автопривязки
  const findRoom = (nameSubstring: string) => 
    rooms.find(r => r.name.toLowerCase().includes(nameSubstring.toLowerCase()));

  const zeroRoom = { floorArea: 0, wallNetArea: 0, perimeter: 0 };
  const kitchen = findRoom('кухн') || zeroRoom;
  const toilet = findRoom('туалет') || findRoom('санузел') || zeroRoom;
  const bath = findRoom('ванн') || zeroRoom;
  const balcony = findRoom('лодж') || findRoom('балкон') || zeroRoom;
  const bed1 = findRoom('спальн 1') || findRoom('комн 1') || findRoom('жилая') || zeroRoom;
  const bed2 = findRoom('спальн 2') || findRoom('гардероб') || zeroRoom;
  const corridor = findRoom('коридор') || findRoom('прихож') || zeroRoom;

  const livingRooms = [kitchen, bed1, bed2, corridor];
  const livingFloorTotal = livingRooms.reduce((sum, r) => sum + r.floorArea, 0);
  const livingPerimeterTotal = livingRooms.reduce((sum, r) => sum + r.perimeter, 0);

  const wetRooms = [toilet, bath];
  const wetFloorTotal = wetRooms.reduce((sum, r) => sum + r.floorArea, 0);
  const wetWallTotal = wetRooms.reduce((sum, r) => sum + r.wallNetArea, 0);

  const totalCeilingArea = rooms.length > 0 ? rooms.reduce((sum, r) => sum + r.floorArea, 0) : 0;

  const rows = KRASNODAR_118_ITEMS.map(item => {
    let qty = 0;

    // Привязка количества к геометрии (только если начерчены комнаты)
    if (!item.isConstant) {
      if (rooms.length > 0) {
        switch (item.calcType) {
          case 'roomFloor':
            if (item.subCategory?.includes('Лоджия')) qty = balcony.floorArea;
            else if (item.subCategory?.includes('Туалет')) qty = toilet.floorArea;
            else if (item.subCategory?.includes('Ванная')) {
              qty = bath.floorArea > 0 ? Math.max(0, Number((bath.floorArea - 1.2).toFixed(2))) : 0; // вычет поддона 1.5х0.8=1.2м²
            }
            break;
          case 'roomWallNet':
            if (item.subCategory?.includes('Кухня')) qty = kitchen.wallNetArea;
            else if (item.subCategory?.includes('Туалет')) qty = toilet.wallNetArea;
            else if (item.subCategory?.includes('Ванная')) qty = bath.wallNetArea;
            else if (item.subCategory?.includes('Спальня 1')) qty = bed1.wallNetArea;
            else if (item.subCategory?.includes('Спальня 2')) qty = bed2.wallNetArea;
            else if (item.subCategory?.includes('Коридор')) qty = corridor.wallNetArea;
            break;
          case 'livingFloorsTotal':
            qty = Number(livingFloorTotal.toFixed(2));
            break;
          case 'livingPlinthTotal':
            // Периметр жилых комнат минус проемы дверей
            qty = livingPerimeterTotal > 0 ? Number(Math.max(0, livingPerimeterTotal - 5.4).toFixed(2)) : 0;
            break;
          case 'wetHydroTotal':
            if (item.subCategory?.includes('Туалет')) qty = Number((toilet.wallNetArea + toilet.floorArea).toFixed(2));
            else if (item.subCategory?.includes('Ванная')) qty = Number((bath.wallNetArea + bath.floorArea).toFixed(2));
            break;
          case 'totalCeiling':
            qty = Number(totalCeilingArea.toFixed(2));
            break;
          case 'kitchenWorkZone':
            qty = kitchen.floorArea > 0 ? 8.08 : 0;
            break;
          case 'roomWindowSlopes':
            if (item.subCategory?.includes('Кухня')) qty = kitchen.wallNetArea > 0 ? 12.16 : 0;
            else qty = (bed1.wallNetArea > 0 || bed2.wallNetArea > 0) ? 6.08 : 0;
            break;
          default:
            qty = 0;
            break;
        }
      } else {
        qty = 0;
      }
    } else if (item.isConstant) {
      // Подтягиваем из актуальных констант чек-листа
      switch (item.id) {
        case 'krd_118_1': qty = constants.prepWorkWrapping || 0; break;
        case 'krd_118_4': qty = constants.plumbingHotColdPoints || 0; break;
        case 'krd_118_5': qty = constants.plumbingSewerPoints || 0; break;
        case 'krd_118_6': qty = constants.plumbingToiletInstallation || 0; break;
        case 'krd_118_7': qty = constants.electricRoughPoints || 0; break;
        case 'krd_118_10': qty = constants.electricFinishPoints || 0; break;
        case 'krd_118_23': qty = constants.kitchenHoodVent || 0; break;
        case 'krd_118_24': qty = constants.kitchenGypNicheM || 0; break;
        case 'krd_118_25': qty = constants.corridorDoorTransomGyp || 0; break;
        case 'krd_118_26': qty = constants.bathVentHole || 0; break;
        case 'krd_118_27': qty = constants.bathVentFanMount || 0; break;
        case 'krd_118_28': qty = constants.bathGypBoxM || 0; break;
        case 'krd_118_29': qty = constants.bathShowerTrayPoddon || 0; break;
        case 'krd_118_30': qty = constants.toiletGypBoxInstall || 0; break;
        case 'krd_118_31': qty = constants.toiletVentFanMount || 0; break;
        case 'krd_118_32': qty = constants.toiletGypNicheM || 0; break;
        case 'krd_118_42': qty = (constants.tileCleanCutBathToiletM || 0) / 2; break;
        case 'krd_118_46': qty = constants.tileHolesDrilledBath || 0; break;
        case 'krd_118_47': qty = Math.min(1, constants.mountSinkWithCabinet || 0); break;
        case 'krd_118_48': qty = constants.mountShowerSystem || 0; break;
        case 'krd_118_49': qty = Math.min(1, constants.mountMirror || 0); break;
        case 'krd_118_50': qty = constants.mountTowelRail || 0; break;
        case 'krd_118_51': qty = Math.min(1, constants.mountExhaustFan || 0); break;
        case 'krd_118_58': qty = (constants.tileCleanCutBathToiletM || 0) / 2; break;
        case 'krd_118_63': qty = constants.tileHolesDrilledToilet || 0; break;
        case 'krd_118_64': qty = constants.mountHangingToilet || 0; break;
        case 'krd_118_65': qty = Math.min(1, constants.mountMirror || 0); break;
        case 'krd_118_66': qty = constants.mountHygienicShower || 0; break;
        case 'krd_118_67': qty = Math.min(1, constants.mountSinkWithCabinet || 0); break;
        case 'krd_118_68': qty = Math.min(1, constants.mountExhaustFan || 0); break;
        case 'krd_118_70': qty = constants.laminateCleanCutM || 0; break;
        case 'krd_118_112': qty = constants.ceilingCurtainTimberM || 0; break;
        case 'krd_118_113': qty = constants.ceilingLampsGX53Count || 0; break;
        case 'krd_118_114': qty = constants.interiorDoorsCount || 0; break;
        case 'krd_118_115': qty = constants.entranceDoorTrim || 0; break;
        case 'krd_118_116': qty = constants.floorCoveringCardboardM2 || 0; break;
        case 'krd_118_117': qty = constants.garbageRemovalTrips || 0; break;
        case 'krd_118_118': qty = constants.cleaningAfterRenovation || 0; break;
        default: break;
      }
    }

    // Ручные переопределения если есть
    if (quantityOverrides[item.id] !== undefined) {
      qty = quantityOverrides[item.id];
    }

    const price = priceOverrides[item.id] !== undefined ? priceOverrides[item.id] : item.unitPrice;
    const total = Number((qty * price).toFixed(1));

    let itemName = item.name;
    if (customTitles[item.id]) {
      itemName = customTitles[item.id];
    } else {
      if (item.id === 'krd_118_1' && customTitles['wrappingDoorsWindows']) itemName = customTitles['wrappingDoorsWindows'];
      if (item.id === 'krd_118_6' && customTitles['toiletInstallationMount']) itemName = customTitles['toiletInstallationMount'];
      if (item.id === 'krd_118_7' && customTitles['electricRough']) itemName = customTitles['electricRough'];
      if (item.id === 'krd_118_10' && customTitles['electricFinish']) itemName = customTitles['electricFinish'];
      if (item.id === 'krd_118_29' && customTitles['showerTray800x1500']) itemName = customTitles['showerTray800x1500'];
      if ((item.id === 'krd_118_42' || item.id === 'krd_118_58') && customTitles['tileCleanCutM']) itemName = customTitles['tileCleanCutM'];
      if ((item.id === 'krd_118_46' || item.id === 'krd_118_63') && customTitles['tileHolesCount']) itemName = customTitles['tileHolesCount'];
      if (item.id === 'krd_118_113' && customTitles['lampGX53']) itemName = customTitles['lampGX53'];
      if (item.id === 'krd_118_114' && customTitles['interiorDoors']) itemName = customTitles['interiorDoors'];
      if (item.id === 'krd_118_117' && customTitles['garbageRemovalCleaning']) itemName = customTitles['garbageRemovalCleaning'];
    }

    return {
      ...item,
      name: itemName,
      quantity: qty,
      unitPrice: price,
      total
    };
  });

  // Дополнительные штучные позиции из панели замера
  const extraRows: typeof rows = [];

  (sectionExtraItems['sec_electric'] || []).forEach((it, idx) => {
    extraRows.push({
      id: it.id,
      num: 300 + idx,
      stageName: 'Электромонтажные работы',
      trade: 'Электрики',
      name: it.name,
      unit: it.unit,
      unitPrice: it.unitPrice,
      isConstant: true,
      defaultQuantity: it.quantity,
      calcType: 'fixed',
      quantity: it.quantity,
      total: Number((it.quantity * it.unitPrice).toFixed(1))
    });
  });

  (sectionExtraItems['sec_bath'] || []).forEach((it, idx) => {
    extraRows.push({
      id: it.id,
      num: 200 + idx,
      stageName: 'Сантехнические работы',
      trade: 'Сантехники',
      name: it.name,
      unit: it.unit,
      unitPrice: it.unitPrice,
      isConstant: true,
      defaultQuantity: it.quantity,
      calcType: 'fixed',
      quantity: it.quantity,
      total: Number((it.quantity * it.unitPrice).toFixed(1))
    });
  });

  (sectionExtraItems['sec_kitchen'] || []).forEach((it, idx) => {
    extraRows.push({
      id: it.id,
      num: 250 + idx,
      stageName: 'Сантехнические работы',
      trade: 'Сантехники',
      name: it.name,
      unit: it.unit,
      unitPrice: it.unitPrice,
      isConstant: true,
      defaultQuantity: it.quantity,
      calcType: 'fixed',
      quantity: it.quantity,
      total: Number((it.quantity * it.unitPrice).toFixed(1))
    });
  });

  (sectionExtraItems['sec_service'] || []).forEach((it, idx) => {
    extraRows.push({
      id: it.id,
      num: 150 + idx,
      stageName: 'Подготовительные работы',
      trade: 'Монтажники',
      name: it.name,
      unit: it.unit,
      unitPrice: it.unitPrice,
      isConstant: true,
      defaultQuantity: it.quantity,
      calcType: 'fixed',
      quantity: it.quantity,
      total: Number((it.quantity * it.unitPrice).toFixed(1))
    });
  });

  // Пользовательские разделы
  customSections.forEach((sec, sIdx) => {
    const stageTitle = sec.title;
    sec.items.forEach((it, idx) => {
      extraRows.push({
        id: it.id,
        num: 900 + sIdx * 50 + idx,
        stageName: stageTitle,
        trade: 'Штучные работы',
        name: it.name,
        unit: it.unit,
        unitPrice: it.unitPrice,
        isConstant: true,
        defaultQuantity: it.quantity,
        calcType: 'fixed',
        quantity: it.quantity,
        total: Number((it.quantity * it.unitPrice).toFixed(1))
      });
    });
  });

  const allRows = [...rows, ...extraRows];
  const totalSum = allRows.reduce((sum, r) => sum + r.total, 0);

  // Группировка по этапам
  const stageGroups: Record<string, { stageName: string; total: number; rows: typeof allRows }> = {};
  allRows.forEach(r => {
    if (!stageGroups[r.stageName]) {
      stageGroups[r.stageName] = { stageName: r.stageName, total: 0, rows: [] };
    }
    stageGroups[r.stageName].total += r.total;
    stageGroups[r.stageName].rows.push(r);
  });

  const constantsTotal = allRows.filter(r => r.isConstant).reduce((sum, r) => sum + r.total, 0);
  const geometryTotal = allRows.filter(r => !r.isConstant).reduce((sum, r) => sum + r.total, 0);

  return {
    rows: allRows,
    stages: Object.values(stageGroups),
    constantsTotal,
    geometryTotal,
    grandTotal: Number(totalSum.toFixed(1))
  };
}

export type Turnkey118CalculationResult = ReturnType<typeof calculateTurnkey118Estimate>;

/**
 * Популярные улицы и ЖК Краснодара для быстрого автозаполнения адреса объекта
 */
export const KRASNODAR_STREET_PRESETS: string[] = [
  'г. Краснодар, ул. Дангиреева, д. 2, к.3, кв. 376',
  'г. Краснодар, ул. Красная, д. 120, кв. 45',
  'г. Краснодар, ул. Западный Обход, д. 42',
  'г. Краснодар, ул. Петра Метальникова, д. 28',
  'г. Краснодар, ул. Героев-Разведчиков, д. 14',
  'г. Краснодар, ул. 40-летия Победы, д. 65',
  'г. Краснодар, ул. Восточно-Кругликовская, д. 30',
  'г. Краснодар, ул. Ставропольская, д. 180',
  'г. Краснодар, ул. Селезнева, д. 4/13',
  'г. Краснодар, ул. Тургенева, д. 106',
  'г. Краснодар, ул. Дзержинского, д. 98',
  'г. Краснодар, ул. Северная, д. 324',
  'г. Краснодар, ул. Уральская, д. 75',
  'г. Краснодар, ул. Российская, д. 267',
  'г. Краснодар, ул. Командорская, д. 9',
  'г. Краснодар, ул. Кирилла Россинского, д. 12',
  'г. Краснодар, ул. Конгрессная, д. 15',
  'г. Краснодар, ул. Батуринская, д. 18',
  'г. Краснодар, ул. Генерала Трошева, д. 25',
  'г. Краснодар, ул. Чекистов проспект, д. 24',
  'г. Краснодар, ул. Кубанская Набережная, д. 37',
  'г. Краснодар, ЖК Самолет, ул. Ивана Беличенко, д. 90',
  'г. Краснодар, ЖК Достояние, ул. Конгрессная, д. 31',
  'г. Краснодар, ЖК Губернский, ул. Боспорская, д. 6',
  'г. Краснодар, ЖК Панорама, ул. Восточно-Кругликовская, д. 22',
  'г. Краснодар, ЖК Светлоград, ул. Красных Партизан, д. 1/4'
];


