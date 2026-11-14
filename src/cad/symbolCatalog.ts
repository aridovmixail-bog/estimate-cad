import { FixtureCategory } from './types';

export interface GraphicSymbolItem {
  id: string;
  name: string;
  category: FixtureCategory | 'climate' | 'general';
  categoryLabel: string;
  shortLabel: string;
  defaultWidth: number; // в метрах
  defaultHeight: number; // в метрах
  defaultHeightFromFloor: number; // в метрах
  defaultColor: string;
  svgType: string;
  description: string;
}

export const GRAPHIC_SYMBOLS_CATALOG: GraphicSymbolItem[] = [
  // ==========================================
  // --- ЭЛЕКТРИКА (ГОСТ 21.614-88) ---
  // ==========================================
  {
    id: 'socket_single',
    name: 'Розетка 220V одинарная',
    category: 'electric',
    categoryLabel: 'Электрика',
    shortLabel: 'Розетка 1-я',
    defaultWidth: 0.10,
    defaultHeight: 0.08,
    defaultHeightFromFloor: 0.30,
    defaultColor: '#2563eb',
    svgType: 'socket_single',
    description: 'Одинарная скрытая розетка 220В с заземлением'
  },
  {
    id: 'socket_double',
    name: 'Розетка 220V двойная',
    category: 'electric',
    categoryLabel: 'Электрика',
    shortLabel: 'Розетка 2-я',
    defaultWidth: 0.16,
    defaultHeight: 0.08,
    defaultHeightFromFloor: 0.30,
    defaultColor: '#2563eb',
    svgType: 'socket_double',
    description: 'Блок из 2 розеток 220В в одной рамке'
  },
  {
    id: 'socket_triple',
    name: 'Розетка 220V тройная',
    category: 'electric',
    categoryLabel: 'Электрика',
    shortLabel: 'Розетка 3-я',
    defaultWidth: 0.22,
    defaultHeight: 0.08,
    defaultHeightFromFloor: 0.30,
    defaultColor: '#2563eb',
    svgType: 'socket_triple',
    description: 'Блок из 3 розеток 220В'
  },
  {
    id: 'socket_ip44',
    name: 'Розетка IP44 влагозащищенная',
    category: 'electric',
    categoryLabel: 'Электрика',
    shortLabel: 'Розетка IP44',
    defaultWidth: 0.10,
    defaultHeight: 0.08,
    defaultHeightFromFloor: 1.00,
    defaultColor: '#0284c7',
    svgType: 'socket_ip44',
    description: 'Влагозащищенная розетка с крышкой для санузлов'
  },
  {
    id: 'socket_cooktop',
    name: 'Розетка силовая 380V / плита',
    category: 'electric',
    categoryLabel: 'Электрика',
    shortLabel: 'Розетка плиты',
    defaultWidth: 0.12,
    defaultHeight: 0.10,
    defaultHeightFromFloor: 0.10,
    defaultColor: '#dc2626',
    svgType: 'socket_cooktop',
    description: 'Силовая розетка для варочной панели / духовки'
  },
  {
    id: 'socket_tv',
    name: 'Розетка ТВ / антенна',
    category: 'electric',
    categoryLabel: 'Электрика',
    shortLabel: 'Розетка ТВ',
    defaultWidth: 0.10,
    defaultHeight: 0.08,
    defaultHeightFromFloor: 1.10,
    defaultColor: '#4f46e5',
    svgType: 'socket_tv',
    description: 'Коаксиальная розетка для телевидения'
  },
  {
    id: 'socket_rj45',
    name: 'Розетка интернет (RJ45)',
    category: 'electric',
    categoryLabel: 'Электрика',
    shortLabel: 'Интернет RJ45',
    defaultWidth: 0.10,
    defaultHeight: 0.08,
    defaultHeightFromFloor: 0.30,
    defaultColor: '#4338ca',
    svgType: 'socket_rj45',
    description: 'Компьютерная витая пара RJ45 / LAN'
  },
  {
    id: 'socket_usb',
    name: 'Розетка USB зарядка',
    category: 'electric',
    categoryLabel: 'Электрика',
    shortLabel: 'USB зарядка',
    defaultWidth: 0.10,
    defaultHeight: 0.08,
    defaultHeightFromFloor: 0.90,
    defaultColor: '#0891b2',
    svgType: 'socket_usb',
    description: 'Встроенный блок питания USB-A / Type-C'
  },
  {
    id: 'switch_single',
    name: 'Выключатель 1-клавишный',
    category: 'electric',
    categoryLabel: 'Электрика',
    shortLabel: 'Выкл. 1-кл',
    defaultWidth: 0.10,
    defaultHeight: 0.08,
    defaultHeightFromFloor: 0.90,
    defaultColor: '#1e293b',
    svgType: 'switch_single',
    description: 'Стандартный выключатель на 1 группу света'
  },
  {
    id: 'switch_double',
    name: 'Выключатель 2-клавишный',
    category: 'electric',
    categoryLabel: 'Электрика',
    shortLabel: 'Выкл. 2-кл',
    defaultWidth: 0.10,
    defaultHeight: 0.08,
    defaultHeightFromFloor: 0.90,
    defaultColor: '#1e293b',
    svgType: 'switch_double',
    description: 'Выключатель на 2 независимые группы света'
  },
  {
    id: 'switch_pass',
    name: 'Выключатель проходной (переключатель)',
    category: 'electric',
    categoryLabel: 'Электрика',
    shortLabel: 'Выкл. проходной',
    defaultWidth: 0.10,
    defaultHeight: 0.08,
    defaultHeightFromFloor: 0.90,
    defaultColor: '#1e293b',
    svgType: 'switch_pass',
    description: 'Управление одной группой света из двух мест'
  },
  {
    id: 'switch_cross',
    name: 'Выключатель перекрестный',
    category: 'electric',
    categoryLabel: 'Электрика',
    shortLabel: 'Выкл. перекрестный',
    defaultWidth: 0.10,
    defaultHeight: 0.08,
    defaultHeightFromFloor: 0.90,
    defaultColor: '#1e293b',
    svgType: 'switch_cross',
    description: 'Управление светом из 3 и более мест'
  },
  {
    id: 'switch_dimmer',
    name: 'Диммер (светорегулятор)',
    category: 'electric',
    categoryLabel: 'Электрика',
    shortLabel: 'Диммер',
    defaultWidth: 0.10,
    defaultHeight: 0.08,
    defaultHeightFromFloor: 0.90,
    defaultColor: '#7c3aed',
    svgType: 'switch_dimmer',
    description: 'Плавная регулировка яркости освещения'
  },
  {
    id: 'thermostat',
    name: 'Терморегулятор теплого пола',
    category: 'electric',
    categoryLabel: 'Электрика',
    shortLabel: 'Термостат',
    defaultWidth: 0.12,
    defaultHeight: 0.12,
    defaultHeightFromFloor: 0.90,
    defaultColor: '#ea580c',
    svgType: 'thermostat',
    description: 'Блок управления кабельным или матовым теплым полом'
  },
  {
    id: 'light_ceiling',
    name: 'Светильник потолочный (люстра)',
    category: 'electric',
    categoryLabel: 'Электрика',
    shortLabel: 'Люстра',
    defaultWidth: 0.40,
    defaultHeight: 0.40,
    defaultHeightFromFloor: 2.70,
    defaultColor: '#eab308',
    svgType: 'light_ceiling',
    description: 'Основное потолочное освещение'
  },
  {
    id: 'light_spot',
    name: 'Точечный светильник (спот)',
    category: 'electric',
    categoryLabel: 'Электрика',
    shortLabel: 'Спот',
    defaultWidth: 0.15,
    defaultHeight: 0.15,
    defaultHeightFromFloor: 2.70,
    defaultColor: '#eab308',
    svgType: 'light_spot',
    description: 'Встраиваемый точечный светильник в натяжной/ГКЛ потолок'
  },
  {
    id: 'light_wall',
    name: 'Бра настенное',
    category: 'electric',
    categoryLabel: 'Электрика',
    shortLabel: 'Бра',
    defaultWidth: 0.20,
    defaultHeight: 0.15,
    defaultHeightFromFloor: 1.80,
    defaultColor: '#d97706',
    svgType: 'light_wall',
    description: 'Настенный светильник декоративного или акцентного света'
  },
  {
    id: 'light_led',
    name: 'Светодиодная подсветка (LED)',
    category: 'electric',
    categoryLabel: 'Электрика',
    shortLabel: 'LED лента',
    defaultWidth: 1.00,
    defaultHeight: 0.05,
    defaultHeightFromFloor: 2.50,
    defaultColor: '#f59e0b',
    svgType: 'light_led',
    description: 'Скрытая закарнизная светодиодная подсветка'
  },
  {
    id: 'light_track',
    name: 'Трековый светильник / шина',
    category: 'electric',
    categoryLabel: 'Электрика',
    shortLabel: 'Трек',
    defaultWidth: 1.20,
    defaultHeight: 0.10,
    defaultHeightFromFloor: 2.70,
    defaultColor: '#334155',
    svgType: 'light_track',
    description: 'Магнитный или накладной трековый шинопровод со спотами'
  },
  {
    id: 'electrical_panel',
    name: 'Электрощит (ЩО / ЩР)',
    category: 'electric',
    categoryLabel: 'Электрика',
    shortLabel: 'Щит ЩР',
    defaultWidth: 0.45,
    defaultHeight: 0.20,
    defaultHeightFromFloor: 1.60,
    defaultColor: '#0f172a',
    svgType: 'electrical_panel',
    description: 'Вводно-распределительный щит с автоматикой и УЗО'
  },
  {
    id: 'doorbell',
    name: 'Дверной звонок (кнопка)',
    category: 'electric',
    categoryLabel: 'Электрика',
    shortLabel: 'Звонок',
    defaultWidth: 0.08,
    defaultHeight: 0.08,
    defaultHeightFromFloor: 1.50,
    defaultColor: '#475569',
    svgType: 'doorbell',
    description: 'Кнопка вызова входного звонка'
  },
  {
    id: 'intercom',
    name: 'Домофон (монитор / трубка)',
    category: 'electric',
    categoryLabel: 'Электрика',
    shortLabel: 'Домофон',
    defaultWidth: 0.25,
    defaultHeight: 0.18,
    defaultHeightFromFloor: 1.50,
    defaultColor: '#1e293b',
    svgType: 'intercom',
    description: 'Видеодомофон или аудиотрубка в прихожей'
  },

  // ==========================================
  // --- САНТЕХНИКА (ГОСТ 21.205-93) ---
  // ==========================================
  {
    id: 'sink',
    name: 'Раковина / Умывальник',
    category: 'plumbing',
    categoryLabel: 'Сантехника',
    shortLabel: 'Раковина',
    defaultWidth: 0.60,
    defaultHeight: 0.45,
    defaultHeightFromFloor: 0.85,
    defaultColor: '#0891b2',
    svgType: 'sink',
    description: 'Умывальник с чашей и смесителем'
  },
  {
    id: 'sink_double',
    name: 'Раковина двойная (2 чаши)',
    category: 'plumbing',
    categoryLabel: 'Сантехника',
    shortLabel: 'Раковина 2-я',
    defaultWidth: 1.20,
    defaultHeight: 0.48,
    defaultHeightFromFloor: 0.85,
    defaultColor: '#0891b2',
    svgType: 'sink_double',
    description: 'Двойная раковина для большой ванной'
  },
  {
    id: 'toilet',
    name: 'Унитаз напольный с бачком',
    category: 'plumbing',
    categoryLabel: 'Сантехника',
    shortLabel: 'Унитаз',
    defaultWidth: 0.40,
    defaultHeight: 0.68,
    defaultHeightFromFloor: 0.40,
    defaultColor: '#0d9488',
    svgType: 'toilet',
    description: 'Компакт-унитаз с приставным керамическим бачком'
  },
  {
    id: 'toilet_install',
    name: 'Унитаз подвесной (инсталляция)',
    category: 'plumbing',
    categoryLabel: 'Сантехника',
    shortLabel: 'Инсталляция',
    defaultWidth: 0.50,
    defaultHeight: 0.55,
    defaultHeightFromFloor: 0.42,
    defaultColor: '#0f766e',
    svgType: 'toilet_install',
    description: 'Подвесной унитаз со скрытой монтажной рамой инсталляции'
  },
  {
    id: 'bidet',
    name: 'Биде',
    category: 'plumbing',
    categoryLabel: 'Сантехника',
    shortLabel: 'Биде',
    defaultWidth: 0.40,
    defaultHeight: 0.60,
    defaultHeightFromFloor: 0.40,
    defaultColor: '#0f766e',
    svgType: 'bidet',
    description: 'Биде со смесителем'
  },
  {
    id: 'hygienic_shower',
    name: 'Гигиенический душ',
    category: 'plumbing',
    categoryLabel: 'Сантехника',
    shortLabel: 'Гиг. душ',
    defaultWidth: 0.15,
    defaultHeight: 0.12,
    defaultHeightFromFloor: 0.75,
    defaultColor: '#0891b2',
    svgType: 'hygienic_shower',
    description: 'Встраиваемый смеситель с лейкой гигиенического душа'
  },
  {
    id: 'bath',
    name: 'Ванна прямоугольная 170×70',
    category: 'plumbing',
    categoryLabel: 'Сантехника',
    shortLabel: 'Ванна',
    defaultWidth: 0.70,
    defaultHeight: 1.70,
    defaultHeightFromFloor: 0.60,
    defaultColor: '#0284c7',
    svgType: 'bath',
    description: 'Стандартная прямоугольная ванна'
  },
  {
    id: 'bath_corner',
    name: 'Ванна угловая (радиальная)',
    category: 'plumbing',
    categoryLabel: 'Сантехника',
    shortLabel: 'Ванна угл.',
    defaultWidth: 1.40,
    defaultHeight: 1.40,
    defaultHeightFromFloor: 0.60,
    defaultColor: '#0284c7',
    svgType: 'bath_corner',
    description: 'Угловая акриловая ванна'
  },
  {
    id: 'shower',
    name: 'Душевая кабина / ограждение',
    category: 'plumbing',
    categoryLabel: 'Сантехника',
    shortLabel: 'Душ',
    defaultWidth: 0.90,
    defaultHeight: 0.90,
    defaultHeightFromFloor: 0.15,
    defaultColor: '#0369a1',
    svgType: 'shower',
    description: 'Душевой уголок с поддоном или стеклянным ограждением'
  },
  {
    id: 'shower_tray',
    name: 'Душевой трап в полу',
    category: 'plumbing',
    categoryLabel: 'Сантехника',
    shortLabel: 'Трап душа',
    defaultWidth: 0.70,
    defaultHeight: 0.10,
    defaultHeightFromFloor: 0.00,
    defaultColor: '#0284c7',
    svgType: 'shower_tray',
    description: 'Линейный щелевой трап в строительном исполнении'
  },
  {
    id: 'towel_heater',
    name: 'Полотенцесушитель',
    category: 'plumbing',
    categoryLabel: 'Сантехника',
    shortLabel: 'Полотенцесуш.',
    defaultWidth: 0.50,
    defaultHeight: 0.15,
    defaultHeightFromFloor: 1.20,
    defaultColor: '#0d9488',
    svgType: 'towel_heater',
    description: 'Водяной или электрический полотенцесушитель'
  },
  {
    id: 'boiler',
    name: 'Водонагреватель (бойлер)',
    category: 'plumbing',
    categoryLabel: 'Сантехника',
    shortLabel: 'Бойлер',
    defaultWidth: 0.45,
    defaultHeight: 0.45,
    defaultHeightFromFloor: 1.60,
    defaultColor: '#0369a1',
    svgType: 'boiler',
    description: 'Накопительный бойлер 50-80 литров'
  },
  {
    id: 'water_filter',
    name: 'Фильтр питьевой воды (осмос)',
    category: 'plumbing',
    categoryLabel: 'Сантехника',
    shortLabel: 'Фильтр воды',
    defaultWidth: 0.40,
    defaultHeight: 0.20,
    defaultHeightFromFloor: 0.20,
    defaultColor: '#0891b2',
    svgType: 'water_filter',
    description: 'Система очистки воды обратного осмоса'
  },
  {
    id: 'floor_drain',
    name: 'Сливной трап в полу (аварийный)',
    category: 'plumbing',
    categoryLabel: 'Сантехника',
    shortLabel: 'Трап пола',
    defaultWidth: 0.15,
    defaultHeight: 0.15,
    defaultHeightFromFloor: 0.00,
    defaultColor: '#64748b',
    svgType: 'floor_drain',
    description: 'Аварийный сливной трап от протечек'
  },

  // ==========================================
  // --- КУХНЯ ---
  // ==========================================
  {
    id: 'kitchen_sink',
    name: 'Мойка кухонная (с крылом)',
    category: 'kitchen',
    categoryLabel: 'Кухня',
    shortLabel: 'Мойка кухни',
    defaultWidth: 0.78,
    defaultHeight: 0.50,
    defaultHeightFromFloor: 0.85,
    defaultColor: '#d97706',
    svgType: 'kitchen_sink',
    description: 'Врезная кухонная мойка с чашей и крылом для сушки'
  },
  {
    id: 'kitchen_sink_2',
    name: 'Мойка кухонная (2 чаши)',
    category: 'kitchen',
    categoryLabel: 'Кухня',
    shortLabel: 'Мойка 2-я',
    defaultWidth: 0.86,
    defaultHeight: 0.50,
    defaultHeightFromFloor: 0.85,
    defaultColor: '#d97706',
    svgType: 'kitchen_sink_2',
    description: 'Кухонная мойка с двумя чашами'
  },
  {
    id: 'cooktop',
    name: 'Варочная панель (индукция / 4 конфорки)',
    category: 'kitchen',
    categoryLabel: 'Кухня',
    shortLabel: 'Варочная панель',
    defaultWidth: 0.60,
    defaultHeight: 0.52,
    defaultHeightFromFloor: 0.85,
    defaultColor: '#b45309',
    svgType: 'cooktop',
    description: 'Встраиваемая варочная поверхность на 4 зоны'
  },
  {
    id: 'oven',
    name: 'Духовой шкаф встроенный',
    category: 'kitchen',
    categoryLabel: 'Кухня',
    shortLabel: 'Духовой шкаф',
    defaultWidth: 0.60,
    defaultHeight: 0.55,
    defaultHeightFromFloor: 0.60,
    defaultColor: '#78350f',
    svgType: 'oven',
    description: 'Встраиваемая духовка 60см'
  },
  {
    id: 'hood',
    name: 'Вытяжка кухонная',
    category: 'kitchen',
    categoryLabel: 'Кухня',
    shortLabel: 'Вытяжка',
    defaultWidth: 0.60,
    defaultHeight: 0.45,
    defaultHeightFromFloor: 1.65,
    defaultColor: '#92400e',
    svgType: 'hood',
    description: 'Купольная или встраиваемая кухонная вытяжка'
  },
  {
    id: 'refrigerator',
    name: 'Холодильник (отдельностоящий/встроенный)',
    category: 'kitchen',
    categoryLabel: 'Кухня',
    shortLabel: 'Холодильник',
    defaultWidth: 0.60,
    defaultHeight: 0.65,
    defaultHeightFromFloor: 1.85,
    defaultColor: '#475569',
    svgType: 'refrigerator',
    description: 'Двухкамерный холодильник 60х65см'
  },
  {
    id: 'dishwasher',
    name: 'Посудомоечная машина (ПММ)',
    category: 'kitchen',
    categoryLabel: 'Кухня',
    shortLabel: 'ПММ 60см',
    defaultWidth: 0.60,
    defaultHeight: 0.55,
    defaultHeightFromFloor: 0.85,
    defaultColor: '#059669',
    svgType: 'dishwasher',
    description: 'Встраиваемая посудомоечная машина 60 см'
  },
  {
    id: 'microwave',
    name: 'Микроволновая печь (СВЧ)',
    category: 'kitchen',
    categoryLabel: 'Кухня',
    shortLabel: 'СВЧ',
    defaultWidth: 0.55,
    defaultHeight: 0.38,
    defaultHeightFromFloor: 1.20,
    defaultColor: '#64748b',
    svgType: 'microwave',
    description: 'Встраиваемая или настольная СВЧ печь'
  },

  // ==========================================
  // --- ВАННАЯ И БЫТОВАЯ ТЕХНИКА ---
  // ==========================================
  {
    id: 'washing_machine',
    name: 'Стиральная машина',
    category: 'bathroom',
    categoryLabel: 'Ванная',
    shortLabel: 'Стиральная маш.',
    defaultWidth: 0.60,
    defaultHeight: 0.50,
    defaultHeightFromFloor: 0.85,
    defaultColor: '#0284c7',
    svgType: 'washing_machine',
    description: 'Стиральная машина фронтальной загрузки 60х50см'
  },
  {
    id: 'dryer_machine',
    name: 'Сушильная машина',
    category: 'bathroom',
    categoryLabel: 'Ванная',
    shortLabel: 'Сушильная маш.',
    defaultWidth: 0.60,
    defaultHeight: 0.60,
    defaultHeightFromFloor: 1.70,
    defaultColor: '#0284c7',
    svgType: 'dryer_machine',
    description: 'Сушильная машина в колонну или рядом'
  },
  {
    id: 'mirror_cabinet',
    name: 'Зеркальный шкаф / зеркало с подсветкой',
    category: 'bathroom',
    categoryLabel: 'Ванная',
    shortLabel: 'Зеркало',
    defaultWidth: 0.80,
    defaultHeight: 0.15,
    defaultHeightFromFloor: 1.20,
    defaultColor: '#0ea5e9',
    svgType: 'mirror_cabinet',
    description: 'Навесное зеркало или шкафчик над умывальником'
  },

  // ==========================================
  // --- ОТОПЛЕНИЕ И КЛИМАТ ---
  // ==========================================
  {
    id: 'radiator',
    name: 'Радиатор отопления секционный',
    category: 'climate',
    categoryLabel: 'Климат',
    shortLabel: 'Радиатор',
    defaultWidth: 0.80,
    defaultHeight: 0.12,
    defaultHeightFromFloor: 0.15,
    defaultColor: '#dc2626',
    svgType: 'radiator',
    description: 'Биметаллический или панельный радиатор отопления'
  },
  {
    id: 'floor_convector',
    name: 'Внутрипольный конвектор',
    category: 'climate',
    categoryLabel: 'Климат',
    shortLabel: 'Конвектор',
    defaultWidth: 1.20,
    defaultHeight: 0.20,
    defaultHeightFromFloor: 0.00,
    defaultColor: '#b91c1c',
    svgType: 'floor_convector',
    description: 'Внутрипольный конвектор перед панорамным окном'
  },
  {
    id: 'air_conditioner',
    name: 'Кондиционер сплит (настенный блок)',
    category: 'climate',
    categoryLabel: 'Климат',
    shortLabel: 'Кондиционер',
    defaultWidth: 0.85,
    defaultHeight: 0.25,
    defaultHeightFromFloor: 2.20,
    defaultColor: '#4f46e5',
    svgType: 'air_conditioner',
    description: 'Внутренний настенный блок сплит-системы'
  },
  {
    id: 'vent_grille',
    name: 'Вентиляционная решетка (вытяжка)',
    category: 'climate',
    categoryLabel: 'Климат',
    shortLabel: 'Вентрешетка',
    defaultWidth: 0.20,
    defaultHeight: 0.15,
    defaultHeightFromFloor: 2.50,
    defaultColor: '#64748b',
    svgType: 'vent_grille',
    description: 'Вытяжная решетка естественной или принудительной вентиляции'
  },

  // ==========================================
  // --- СТОЯКИ АР ---
  // ==========================================
  {
    id: 'riser_sewer',
    name: 'Стояк канализации (К) Ø110',
    category: 'riser',
    categoryLabel: 'Стояки АР',
    shortLabel: 'Стояк К',
    defaultWidth: 0.16,
    defaultHeight: 0.16,
    defaultHeightFromFloor: 3.00,
    defaultColor: '#0f172a',
    svgType: 'riser_sewer',
    description: 'Канализационный стояк диаметром 110мм'
  },
  {
    id: 'riser_cold',
    name: 'Стояк холодной воды (ХВ)',
    category: 'riser',
    categoryLabel: 'Стояки АР',
    shortLabel: 'Стояк ХВ',
    defaultWidth: 0.14,
    defaultHeight: 0.14,
    defaultColor: '#0284c7',
    defaultHeightFromFloor: 3.00,
    svgType: 'riser_cold',
    description: 'Стояк ХВС'
  },
  {
    id: 'riser_hot',
    name: 'Стояк горячей воды (ГВ)',
    category: 'riser',
    categoryLabel: 'Стояки АР',
    shortLabel: 'Стояк ГВ',
    defaultWidth: 0.14,
    defaultHeight: 0.14,
    defaultColor: '#dc2626',
    defaultHeightFromFloor: 3.00,
    svgType: 'riser_hot',
    description: 'Стояк ГВС'
  },
  {
    id: 'riser_heat',
    name: 'Стояк отопления (ОТ)',
    category: 'riser',
    categoryLabel: 'Стояки АР',
    shortLabel: 'Стояк ОТ',
    defaultWidth: 0.12,
    defaultHeight: 0.12,
    defaultColor: '#ea580c',
    defaultHeightFromFloor: 3.00,
    svgType: 'riser_heat',
    description: 'Стояк центрального отопления'
  },
  {
    id: 'vent_shaft',
    name: 'Вентшахта / короб',
    category: 'riser',
    categoryLabel: 'Стояки АР',
    shortLabel: 'Вентшахта',
    defaultWidth: 0.40,
    defaultHeight: 0.40,
    defaultHeightFromFloor: 3.00,
    defaultColor: '#334155',
    svgType: 'vent_shaft',
    description: 'Строительный вентиляционный короб'
  },

  // ==========================================
  // --- УНИВЕРСАЛЬНЫЕ И ПОЛЬЗОВАТЕЛЬСКИЕ ---
  // ==========================================
  {
    id: 'box',
    name: 'Прямоугольный блок / прибор',
    category: 'general',
    categoryLabel: 'Универсальные',
    shortLabel: 'Прибор',
    defaultWidth: 0.30,
    defaultHeight: 0.20,
    defaultHeightFromFloor: 0.50,
    defaultColor: '#475569',
    svgType: 'box',
    description: 'Универсальный прямоугольный блок оборудования'
  },
  {
    id: 'circle',
    name: 'Круглый элемент / прибор',
    category: 'general',
    categoryLabel: 'Универсальные',
    shortLabel: 'Прибор',
    defaultWidth: 0.25,
    defaultHeight: 0.25,
    defaultHeightFromFloor: 0.50,
    defaultColor: '#475569',
    svgType: 'circle',
    description: 'Универсальный круглый элемент'
  },
  {
    id: 'custom_image',
    name: 'Пользовательский рисунок (SVG / PNG с ПК)',
    category: 'general',
    categoryLabel: 'Пользовательские',
    shortLabel: 'Свой элемент',
    defaultWidth: 0.40,
    defaultHeight: 0.40,
    defaultHeightFromFloor: 0.50,
    defaultColor: '#2563eb',
    svgType: 'custom_image',
    description: 'Элемент загруженный вручную с вашего компьютера'
  }
];

export function getGraphicSymbolsByCategory(category: string): GraphicSymbolItem[] {
  if (!category || category === 'all') return GRAPHIC_SYMBOLS_CATALOG;
  return GRAPHIC_SYMBOLS_CATALOG.filter(s => s.category === category || s.category === 'general');
}

export function getGraphicSymbolById(id: string): GraphicSymbolItem | undefined {
  return GRAPHIC_SYMBOLS_CATALOG.find(s => s.id === id);
}
