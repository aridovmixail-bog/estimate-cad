import { PirogCategory, PirogDefinition } from './types';

export const PIROG_CATEGORIES: { id: PirogCategory; name: string; icon: string; iconName: string; defaultUnit: string }[] = [
  { id: 'ceiling', name: 'Потолок', icon: '☁️', iconName: 'Layers', defaultUnit: 'м²' },
  { id: 'walls', name: 'Стены', icon: '🧱', iconName: 'Grid', defaultUnit: 'м²' },
  { id: 'floor', name: 'Пол', icon: '🪵', iconName: 'LayoutGrid', defaultUnit: 'м²' },
  { id: 'electric', name: 'Электрика', icon: '⚡', iconName: 'Zap', defaultUnit: 'точка' },
  { id: 'plumbing', name: 'Сантехника', icon: '🚰', iconName: 'Droplets', defaultUnit: 'точка' },
  { id: 'doors', name: 'Двери и проёмы', icon: '🚪', iconName: 'DoorOpen', defaultUnit: 'шт' },
  { id: 'demolition', name: 'Перегородки и демонтаж', icon: '🔨', iconName: 'Hammer', defaultUnit: 'м²' },
  { id: 'other', name: 'Климат и доп. работы', icon: '❄️', iconName: 'CircleDot', defaultUnit: 'компл' }
];

export const DEFAULT_PIROGS: PirogDefinition[] = [
  // =========================================================================
  // ЭТАЛОННЫЕ ПИРОГИ СМЕТЫ КРАСНОДАР (ОБЪЕКТ: УЛ. ДАНГИРЕЕВА, Д. 2, К.3, КВ. 376)
  // Точные наименования работ, технологии и расценки из файла сметы
  // =========================================================================
  {
    id: 'KRD-W-WALLPAPER',
    name: '⭐ Обои (по смете Дангиреева: шпатлевка 2 сл + шлифовка + грунтовка 2 раза + поклейка) — 1 320 ₽/м²',
    category: 'walls',
    description: '1. Грунтование стен (70₽)\n2. Шпатлевание стен 2 раза базовый слой (530₽)\n3. Шлифование стен после 2-ух слоев (100₽)\n4. Грунтование стен перед поклейкой (70₽)\n5. Оклеивание стен обоями (550₽)',
    standardPrice: 1320,
    works: [
      { id: 'kw_1', name: 'Грунтование стен (перед шпатлеванием базового слоя)', unit: 'м²', defaultUnitPrice: 70, multiplierType: 'wallNetArea' },
      { id: 'kw_2', name: 'Шпатлевание стен 2 раза (базовый слой)', unit: 'м²', defaultUnitPrice: 530, multiplierType: 'wallNetArea' },
      { id: 'kw_3', name: 'Шлифование стен (после 2-ух базовых слоёв)', unit: 'м²', defaultUnitPrice: 100, multiplierType: 'wallNetArea' },
      { id: 'kw_4', name: 'Грунтование стен (перед поклейкой обоев)', unit: 'м²', defaultUnitPrice: 70, multiplierType: 'wallNetArea' },
      { id: 'kw_5', name: 'Оклеивание стен обоями', unit: 'м²', defaultUnitPrice: 550, multiplierType: 'wallNetArea' },
    ],
    materials: []
  },
  {
    id: 'KRD-W-TILE',
    name: '⭐ Керамогранит 1200×600 (санузел/ванная: штукатурка ЦПС + гидроизоляция + укладка + затирка) — 3 860 ₽/м²',
    category: 'walls',
    description: '1. Грунтование стен перед оштукатуриванием (70₽)\n2. Оштукатуривание стен по маякам ЦПС (720₽)\n3. Гидроизоляция стен обмазочная 2 раза (500₽)\n4. Грунтование стен перед плиткой (70₽)\n5. Укладка керамогранита на стены 1200*600 (2000₽)\n6. Затирка цементная стен (500₽)',
    standardPrice: 3860,
    works: [
      { id: 'kt_1', name: 'Грунтование стен (перед оштукатуриванием)', unit: 'м²', defaultUnitPrice: 70, multiplierType: 'wallNetArea' },
      { id: 'kt_2', name: 'Оштукатуривание стен по маякам с использованием ЦПС', unit: 'м²', defaultUnitPrice: 720, multiplierType: 'wallNetArea' },
      { id: 'kt_3', name: 'Гидроизоляция стен обмазочная 2 раза', unit: 'м²', defaultUnitPrice: 500, multiplierType: 'wallNetArea' },
      { id: 'kt_4', name: 'Грунтование стен перед укладкой плитки', unit: 'м²', defaultUnitPrice: 70, multiplierType: 'wallNetArea' },
      { id: 'kt_5', name: 'Укладка керамогранита на стены (формат 1200*600)', unit: 'м²', defaultUnitPrice: 2000, multiplierType: 'wallNetArea' },
      { id: 'kt_6', name: 'Затирка цементная стен', unit: 'м²', defaultUnitPrice: 500, multiplierType: 'wallNetArea' },
    ],
    materials: []
  },
  {
    id: 'KRD-W-PLASTER_ONLY',
    name: '⭐ Штукатурка стен по маякам (черновое выравнивание: грунтовка + ЦПС/гипс) — 790 ₽/м²',
    category: 'walls',
    description: '1. Грунтование стен (70₽)\n2. Оштукатуривание стен по маякам (720₽)',
    standardPrice: 790,
    works: [
      { id: 'kp_1', name: 'Грунтование стен (перед оштукатуриванием)', unit: 'м²', defaultUnitPrice: 70, multiplierType: 'wallNetArea' },
      { id: 'kp_2', name: 'Оштукатуривание стен по маякам с использованием ЦПС', unit: 'м²', defaultUnitPrice: 720, multiplierType: 'wallNetArea' },
    ],
    materials: []
  },
  {
    id: 'KRD-W-PAINT',
    name: 'Под покраску (грунт + шпатлевка база + стеклохолст + финиш + покраска 2 сл) — 1 950 ₽/м²',
    category: 'walls',
    description: '1. Грунтование стен (70₽)\n2. Шпатлевание базовое 2 сл (530₽)\n3. Наклейка малярного стеклохолста (350₽)\n4. Шпатлевание стен финишное 2 сл (450₽)\n5. Шлифование (150₽) + Покраска 2 сл (400₽)',
    standardPrice: 1950,
    works: [
      { id: 'kpt_1', name: 'Грунтование стен (перед шпатлеванием)', unit: 'м²', defaultUnitPrice: 70, multiplierType: 'wallNetArea' },
      { id: 'kpt_2', name: 'Шпатлевание стен 2 раза (базовый слой)', unit: 'м²', defaultUnitPrice: 530, multiplierType: 'wallNetArea' },
      { id: 'kpt_3', name: 'Монтаж малярного стеклохолста (паутинка)', unit: 'м²', defaultUnitPrice: 350, multiplierType: 'wallNetArea' },
      { id: 'kpt_4', name: 'Шпатлевание стен финишной пастой (2 слоя)', unit: 'м²', defaultUnitPrice: 450, multiplierType: 'wallNetArea' },
      { id: 'kpt_5', name: 'Шлифование под покраску', unit: 'м²', defaultUnitPrice: 150, multiplierType: 'wallNetArea' },
      { id: 'kpt_6', name: 'Окрашивание стен водоэмульсионной краской в 2 слоя', unit: 'м²', defaultUnitPrice: 400, multiplierType: 'wallNetArea' },
    ],
    materials: []
  },
  {
    id: 'KRD-F-LAMINATE',
    name: '⭐ Ламинат с подложкой (по смете Дангиреева: жилые комнаты + коридор + кухня) — 600 ₽/м²',
    category: 'floor',
    description: 'Укладка ламината с подложкой (600₽)',
    standardPrice: 600,
    works: [
      { id: 'kfl_1', name: 'Укладка ламината с подложкой (жилые комнаты + коридор + кухня)', unit: 'м²', defaultUnitPrice: 600, multiplierType: 'floorArea' }
    ],
    materials: []
  },
  {
    id: 'KRD-F-TILE',
    name: '⭐ Керамогранит на пол 1200×600 (санузел/лоджия: наливной пол + гидроизоляция + укладка + затирка) — 4 020 ₽/м²',
    category: 'floor',
    description: '1. Грунтование пола перед наливным полом (250₽)\n2. Устройство наливного пола до 10 мм (700₽)\n3. Гидроизоляция пола 2 раза (500₽)\n4. Грунтование пола перед плиткой (70₽)\n5. Укладка керамогранита на пол 1200*600 (2000₽)\n6. Затирка цементная пол (500₽)',
    standardPrice: 4020,
    works: [
      { id: 'kft_1', name: 'Грунтование пола перед устройством наливного пола', unit: 'м²', defaultUnitPrice: 250, multiplierType: 'floorArea' },
      { id: 'kft_2', name: 'Устройство наливного пола, до 10 мм', unit: 'м²', defaultUnitPrice: 700, multiplierType: 'floorArea' },
      { id: 'kft_3', name: 'Гидроизоляция пола обмазочная 2 раза', unit: 'м²', defaultUnitPrice: 500, multiplierType: 'floorArea' },
      { id: 'kft_4', name: 'Грунтование пола (перед укладкой плитки)', unit: 'м²', defaultUnitPrice: 70, multiplierType: 'floorArea' },
      { id: 'kft_5', name: 'Укладка керамогранита на пол (формат 1200*600)', unit: 'м²', defaultUnitPrice: 2000, multiplierType: 'floorArea' },
      { id: 'kft_6', name: 'Затирка цементная пол', unit: 'м²', defaultUnitPrice: 500, multiplierType: 'floorArea' },
    ],
    materials: []
  },
  {
    id: 'KRD-F-SCREED',
    name: 'Только наливной пол (выравнивание стяжки до 10 мм: грунтовка + заливка) — 950 ₽/м²',
    category: 'floor',
    description: '1. Грунтование пола перед устройством наливного пола (250₽)\n2. Устройство наливного пола до 10 мм (700₽)',
    standardPrice: 950,
    works: [
      { id: 'kfs_1', name: 'Грунтование пола перед устройством наливного пола', unit: 'м²', defaultUnitPrice: 250, multiplierType: 'floorArea' },
      { id: 'kfs_2', name: 'Устройство наливного пола, до 10 мм', unit: 'м²', defaultUnitPrice: 700, multiplierType: 'floorArea' },
    ],
    materials: []
  },
  {
    id: 'KRD-C-STRETCH',
    name: '⭐ Натяжной потолок матовый белый MSD Premium (по смете Дангиреева) — 750 ₽/м²',
    category: 'ceiling',
    description: 'Монтаж натяжного потолка (белый матовый MSD Premium) (750₽)',
    standardPrice: 750,
    works: [
      { id: 'kcs_1', name: 'Монтаж натяжного потолка (белый матовый MSD Premium)', unit: 'м²', defaultUnitPrice: 750, multiplierType: 'floorArea' }
    ],
    materials: []
  },
  {
    id: 'KRD-C-PAINT',
    name: 'Покраска потолка (грунтовка + шпатлевка 2 сл + покраска 2 сл) — 1 450 ₽/м²',
    category: 'ceiling',
    description: 'Грунтовка (70₽) + Шпатлевка 2 сл (580₽) + Шлифовка (150₽) + Грунтовка (70₽) + Покраска 2 сл (580₽)',
    standardPrice: 1450,
    works: [
      { id: 'kcp_1', name: 'Грунтование потолка', unit: 'м²', defaultUnitPrice: 70, multiplierType: 'floorArea' },
      { id: 'kcp_2', name: 'Шпатлевание потолка 2 раза', unit: 'м²', defaultUnitPrice: 580, multiplierType: 'floorArea' },
      { id: 'kcp_3', name: 'Шлифование потолка', unit: 'м²', defaultUnitPrice: 150, multiplierType: 'floorArea' },
      { id: 'kcp_4', name: 'Покраска потолка в 2 слоя', unit: 'м²', defaultUnitPrice: 580, multiplierType: 'floorArea' },
    ],
    materials: []
  },
  {
    id: 'KRD-O-PLINTH',
    name: '⭐ Монтаж напольного пластикового плинтуса с кабель-каналом (по смете Дангиреева) — 450 ₽/м.п.',
    category: 'other',
    description: 'Монтаж напольного пластикового плинтуса с кабель-каналом (450₽)',
    standardPrice: 450,
    works: [
      { id: 'kpo_1', name: 'Монтаж напольного пластикового плинтуса с кабель-каналом', unit: 'м.пог.', defaultUnitPrice: 450, multiplierType: 'perimeter' }
    ],
    materials: []
  },
  {
    id: 'KRD-O-PLINTH_MDF',
    name: 'Монтаж плинтуса МДФ / дюрополимер с запилом под 45° — 750 ₽/м.п.',
    category: 'other',
    description: 'Монтаж плинтуса МДФ с подрезкой углов под 45° (750₽)',
    standardPrice: 750,
    works: [
      { id: 'kpo_2', name: 'Монтаж плинтуса МДФ / дюрополимер с запилом под 45°', unit: 'м.пог.', defaultUnitPrice: 750, multiplierType: 'perimeter' }
    ],
    materials: []
  },
  {
    "id": "FIN-W-01",
    "name": "Обои (флизелиновые / виниловые)",
    "category": "walls",
    "description": "1. Очистка (80₽) + Грунт (100₽)\n2. Маяки (120₽) + Штукатурка до 3см (750₽)\n3. Грунт (100₽) + Шпаклёвка 2 сл. (420₽) + Шлифовка (150₽)\n4. Грунт (70₽) + Поклейка обоев (450₽)",
    "roomTypes": "Жилые / Коридор",
    "categoryName": "Стены",
    "economPrice": 1150,
    "standardPrice": 1840,
    "designPrice": 2620,
    "detailedPrice": 2240,
    "works": [
      {
        "id": "W01-01",
        "name": "Очистка основания от пыли и загрязнений",
        "unit": "м²",
        "defaultUnitPrice": 50,
        "economPrice": 30,
        "standardPrice": 50,
        "designPrice": 80,
        "detailedPrice": 80,
        "multiplierType": "wallNetArea",
        "source": "Прайс-459 #246 / Полный #67"
      },
      {
        "id": "W01-02",
        "name": "Грунтование стен (перед штукатуркой)",
        "unit": "м²",
        "defaultUnitPrice": 50,
        "economPrice": 30,
        "standardPrice": 50,
        "designPrice": 80,
        "detailedPrice": 100,
        "multiplierType": "wallNetArea",
        "source": "Прайс-459 #36 / Полный #67"
      },
      {
        "id": "W01-03",
        "name": "Установка штукатурных маяков",
        "unit": "м²",
        "defaultUnitPrice": 150,
        "economPrice": 80,
        "standardPrice": 150,
        "designPrice": 250,
        "detailedPrice": 120,
        "multiplierType": "wallNetArea",
        "source": "Прайс-459 #38 / Полный #31"
      },
      {
        "id": "W01-04",
        "name": "Штукатурка стен по маякам до 3 см (гипсовая)",
        "unit": "м²",
        "defaultUnitPrice": 700,
        "economPrice": 450,
        "standardPrice": 700,
        "designPrice": 950,
        "detailedPrice": 750,
        "multiplierType": "wallNetArea",
        "source": "Прайс-459 #41 / Полный #26"
      },
      {
        "id": "W01-05",
        "name": "Грунтование стен (перед шпаклёвкой)",
        "unit": "м²",
        "defaultUnitPrice": 50,
        "economPrice": 30,
        "standardPrice": 50,
        "designPrice": 80,
        "detailedPrice": 100,
        "multiplierType": "wallNetArea",
        "source": "Прайс-459 #36 / Полный #67"
      },
      {
        "id": "W01-06",
        "name": "Шпаклёвка стен под обои, 2 слоя",
        "unit": "м²",
        "defaultUnitPrice": 300,
        "economPrice": 200,
        "standardPrice": 300,
        "designPrice": 400,
        "detailedPrice": 420,
        "multiplierType": "wallNetArea",
        "source": "Прайс-459 #51 / Полный #69"
      },
      {
        "id": "W01-07",
        "name": "Шлифовка стен",
        "unit": "м²",
        "defaultUnitPrice": 90,
        "economPrice": 50,
        "standardPrice": 90,
        "designPrice": 150,
        "detailedPrice": 150,
        "multiplierType": "wallNetArea",
        "source": "Прайс-459 #56 / Полный #72"
      },
      {
        "id": "W01-08",
        "name": "Грунтование глубокого проникновения (под обои)",
        "unit": "м²",
        "defaultUnitPrice": 50,
        "economPrice": 30,
        "standardPrice": 50,
        "designPrice": 80,
        "detailedPrice": 70,
        "multiplierType": "wallNetArea",
        "source": "Прайс-459 #248 / Полный #67"
      },
      {
        "id": "W01-09",
        "name": "Поклейка флизелиновых / виниловых обоев",
        "unit": "м²",
        "defaultUnitPrice": 400,
        "economPrice": 250,
        "standardPrice": 400,
        "designPrice": 550,
        "detailedPrice": 450,
        "multiplierType": "wallNetArea",
        "source": "Прайс-459 #69-70 / Полный #77"
      }
    ],
    "materials": [
      {
        "id": "MAT-01",
        "name": "Грунтовка глубокого проникновения Knauf Тифенгрунд 10 л",
        "unit": "л",
        "normPerUnit": 0.35,
        "safetyCoeff": 1.05,
        "packageType": "Канистра 10 л",
        "packagePrice": 1150,
        "defaultUnitPrice": 42,
        "multiplierType": "wallNetArea"
      },
      {
        "id": "MAT-02",
        "name": "Профиль маячковый 6 мм, 3 м",
        "unit": "шт.",
        "normPerUnit": 0.6,
        "safetyCoeff": 1.1,
        "packageType": "Штука 3 м",
        "packagePrice": 75,
        "defaultUnitPrice": 50,
        "multiplierType": "wallNetArea"
      },
      {
        "id": "MAT-03",
        "name": "Штукатурка гипсовая Knauf Ротбанд 30 кг (слой ~15 мм)",
        "unit": "кг",
        "normPerUnit": 12.5,
        "safetyCoeff": 1.05,
        "packageType": "Мешок 30 кг",
        "packagePrice": 560,
        "defaultUnitPrice": 245,
        "multiplierType": "wallNetArea"
      },
      {
        "id": "MAT-04",
        "name": "Шпаклёвка полимерная Vetonit LR+ 20 кг",
        "unit": "кг",
        "normPerUnit": 1.6,
        "safetyCoeff": 1.05,
        "packageType": "Мешок 20 кг",
        "packagePrice": 1050,
        "defaultUnitPrice": 88,
        "multiplierType": "wallNetArea"
      },
      {
        "id": "MAT-05",
        "name": "Клей обойный Quelyd Спец-Флизелин 300 г",
        "unit": "пач.",
        "normPerUnit": 0.04,
        "safetyCoeff": 1.1,
        "packageType": "Пачка 300 г",
        "packagePrice": 420,
        "defaultUnitPrice": 18,
        "multiplierType": "wallNetArea"
      },
      {
        "id": "MAT-06",
        "name": "Обои виниловые на флизелине 1.06×10 м",
        "unit": "рул.",
        "normPerUnit": 0.1,
        "safetyCoeff": 1.15,
        "packageType": "Рулон 10.6 м²",
        "packagePrice": 2800,
        "defaultUnitPrice": 322,
        "multiplierType": "wallNetArea"
      }
    ]
  },
  {
    "id": "FIN-W-02",
    "name": "Покраска (со стеклохолстом)",
    "category": "walls",
    "description": "1. Грунт 3 цикла (240₽) + Маяки (120₽) + Штукатурка (750₽)\n2. Стартовая шпаклёвка (280₽) + Стеклохолст (300₽)\n3. Финишная шпаклёвка 2 сл. (600₽) + Шлифовка (150₽)\n4. Окраска стен в 2 слоя (450₽)",
    "roomTypes": "Жилые / Коридор",
    "categoryName": "Стены",
    "economPrice": 1420,
    "standardPrice": 2290,
    "designPrice": 3540,
    "detailedPrice": 2890,
    "works": [
      {
        "id": "W02-01",
        "name": "Грунтование стен (3 цикла между слоями)",
        "unit": "м²",
        "defaultUnitPrice": 150,
        "economPrice": 90,
        "standardPrice": 150,
        "designPrice": 240,
        "detailedPrice": 240,
        "multiplierType": "wallNetArea",
        "source": "Прайс-459 #36+#248 / Полный #67"
      },
      {
        "id": "W02-02",
        "name": "Установка штукатурных маяков",
        "unit": "м²",
        "defaultUnitPrice": 150,
        "economPrice": 80,
        "standardPrice": 150,
        "designPrice": 250,
        "detailedPrice": 120,
        "multiplierType": "wallNetArea",
        "source": "Прайс-459 #38 / Полный #31"
      },
      {
        "id": "W02-03",
        "name": "Штукатурка стен по маякам до 3 см",
        "unit": "м²",
        "defaultUnitPrice": 700,
        "economPrice": 450,
        "standardPrice": 700,
        "designPrice": 950,
        "detailedPrice": 750,
        "multiplierType": "wallNetArea",
        "source": "Прайс-459 #41 / Полный #26"
      },
      {
        "id": "W02-04",
        "name": "Нанесение стартовой шпаклёвки (базовый слой)",
        "unit": "м²",
        "defaultUnitPrice": 300,
        "economPrice": 200,
        "standardPrice": 300,
        "designPrice": 400,
        "detailedPrice": 280,
        "multiplierType": "wallNetArea",
        "source": "Прайс-459 #283 / Полный #69"
      },
      {
        "id": "W02-05",
        "name": "Оклейка стеклохолстом («паутинка»)",
        "unit": "м²",
        "defaultUnitPrice": 180,
        "economPrice": 100,
        "standardPrice": 180,
        "designPrice": 300,
        "detailedPrice": 300,
        "multiplierType": "wallNetArea",
        "source": "Прайс-459 #58 / Полный #68"
      },
      {
        "id": "W02-06",
        "name": "Шпаклёвка стен под покраску, 2 слоя (финишная)",
        "unit": "м²",
        "defaultUnitPrice": 400,
        "economPrice": 250,
        "standardPrice": 400,
        "designPrice": 650,
        "detailedPrice": 600,
        "multiplierType": "wallNetArea",
        "source": "Прайс-459 #52 / Полный #70"
      },
      {
        "id": "W02-07",
        "name": "Шлифовка стен и контроль плоскости под лампу",
        "unit": "м²",
        "defaultUnitPrice": 90,
        "economPrice": 50,
        "standardPrice": 90,
        "designPrice": 150,
        "detailedPrice": 150,
        "multiplierType": "wallNetArea",
        "source": "Прайс-459 #56 / Полный #72"
      },
      {
        "id": "W02-08",
        "name": "Окраска стен в 2 слоя",
        "unit": "м²",
        "defaultUnitPrice": 320,
        "economPrice": 200,
        "standardPrice": 320,
        "designPrice": 600,
        "detailedPrice": 450,
        "multiplierType": "wallNetArea",
        "source": "Прайс-459 #61 / Полный #76"
      }
    ],
    "materials": [
      {
        "id": "MAT-07",
        "name": "Грунтовка Knauf Тифенгрунд 10 л (3 цикла)",
        "unit": "л",
        "normPerUnit": 0.45,
        "safetyCoeff": 1.05,
        "packageType": "Канистра 10 л",
        "packagePrice": 1150,
        "defaultUnitPrice": 54,
        "multiplierType": "wallNetArea"
      },
      {
        "id": "MAT-08",
        "name": "Штукатурка гипсовая Knauf Ротбанд 30 кг + маяки",
        "unit": "кг",
        "normPerUnit": 13,
        "safetyCoeff": 1.05,
        "packageType": "Мешок 30 кг",
        "packagePrice": 580,
        "defaultUnitPrice": 264,
        "multiplierType": "wallNetArea"
      },
      {
        "id": "MAT-09",
        "name": "Стеклохолст малярный Wellton 40 г/м² + клей Oscar",
        "unit": "м²",
        "normPerUnit": 1,
        "safetyCoeff": 1.12,
        "packageType": "Комплект на 50 м²",
        "packagePrice": 3500,
        "defaultUnitPrice": 78,
        "multiplierType": "wallNetArea"
      },
      {
        "id": "MAT-10",
        "name": "Шпаклёвка базовая + финишная паста Danogips SuperFinish",
        "unit": "кг",
        "normPerUnit": 2.4,
        "safetyCoeff": 1.05,
        "packageType": "Ведро 18.1 кг",
        "packagePrice": 2250,
        "defaultUnitPrice": 313,
        "multiplierType": "wallNetArea"
      },
      {
        "id": "MAT-11",
        "name": "Краска интерьерная моющаяся Tikkurila Euro Power 7, 9 л",
        "unit": "л",
        "normPerUnit": 0.22,
        "safetyCoeff": 1.1,
        "packageType": "Ведро 9 л",
        "packagePrice": 7900,
        "defaultUnitPrice": 212,
        "multiplierType": "wallNetArea"
      }
    ]
  },
  {
    "id": "FIN-W-03",
    "name": "Декоративная штукатурка с воском",
    "category": "walls",
    "description": "1. Грунт + Маяки (220₽) + Штукатурка (750₽)\n2. Шпаклёвка 2 сл. со шлифовкой (570₽)\n3. Адгезионный кварц-грунт (150₽)\n4. Декоративная штукатурка (1800₽) + Воск (350₽)",
    "roomTypes": "Жилые / Коридор / Кухня",
    "categoryName": "Стены",
    "economPrice": 1760,
    "standardPrice": 3020,
    "designPrice": 4760,
    "detailedPrice": 3840,
    "works": [
      {
        "id": "W03-01",
        "name": "Грунтование стен и установка маяков",
        "unit": "м²",
        "defaultUnitPrice": 200,
        "economPrice": 110,
        "standardPrice": 200,
        "designPrice": 330,
        "detailedPrice": 220,
        "multiplierType": "wallNetArea",
        "source": "Прайс-459 #36+#38 / Полный #31+#67"
      },
      {
        "id": "W03-02",
        "name": "Штукатурка стен по маякам до 3 см",
        "unit": "м²",
        "defaultUnitPrice": 700,
        "economPrice": 450,
        "standardPrice": 700,
        "designPrice": 950,
        "detailedPrice": 750,
        "multiplierType": "wallNetArea",
        "source": "Прайс-459 #41 / Полный #26"
      },
      {
        "id": "W03-03",
        "name": "Шпаклёвка стен под декоративное покрытие (2 слоя) + шлифовка",
        "unit": "м²",
        "defaultUnitPrice": 390,
        "economPrice": 250,
        "standardPrice": 390,
        "designPrice": 550,
        "detailedPrice": 570,
        "multiplierType": "wallNetArea",
        "source": "Прайс-459 #51+#56 / Полный #69+#72"
      },
      {
        "id": "W03-04",
        "name": "Нанесение адгезионной (кварцевой) грунтовки",
        "unit": "м²",
        "defaultUnitPrice": 80,
        "economPrice": 50,
        "standardPrice": 80,
        "designPrice": 130,
        "detailedPrice": 150,
        "multiplierType": "wallNetArea",
        "source": "Прайс-459 #249 / Полный #67"
      },
      {
        "id": "W03-05",
        "name": "Нанесение декоративной штукатурки",
        "unit": "м²",
        "defaultUnitPrice": 1300,
        "economPrice": 700,
        "standardPrice": 1300,
        "designPrice": 2300,
        "detailedPrice": 1800,
        "multiplierType": "wallNetArea",
        "source": "Прайс-459 #66 / Полный #81"
      },
      {
        "id": "W03-06",
        "name": "Нанесение защитного воска на декоративное покрытие",
        "unit": "м²",
        "defaultUnitPrice": 350,
        "economPrice": 200,
        "standardPrice": 350,
        "designPrice": 500,
        "detailedPrice": 350,
        "multiplierType": "wallNetArea",
        "source": "Прайс-459 #293 / Полный #82"
      }
    ],
    "materials": [
      {
        "id": "MAT-12",
        "name": "Штукатурка гипсовая + шпаклёвка + кварц-грунт",
        "unit": "кг",
        "normPerUnit": 14.5,
        "safetyCoeff": 1.05,
        "packageType": "Комплект смесей",
        "packagePrice": 820,
        "defaultUnitPrice": 416,
        "multiplierType": "wallNetArea"
      },
      {
        "id": "MAT-13",
        "name": "Декоративная штукатурка (шёлк/травертин) + защитный воск",
        "unit": "кг",
        "normPerUnit": 1.2,
        "safetyCoeff": 1.1,
        "packageType": "Ведро 15 кг",
        "packagePrice": 11500,
        "defaultUnitPrice": 1012,
        "multiplierType": "wallNetArea"
      }
    ]
  },
  {
    "id": "FIN-W-04",
    "name": "Керамогранит (цементная штукатурка + гидроизоляция)",
    "category": "walls",
    "description": "1. Грунт 2 цикла (200₽) + Маяки (120₽)\n2. Штукатурка санузла цементной смесью (900₽)\n3. Гидроизоляция мокрых зон (0.4×450₽)\n4. Укладка керамогранита (2200₽) + Затирка эпокс. (750₽) + Очистка (120₽)",
    "roomTypes": "Санузел",
    "categoryName": "Стены",
    "economPrice": 2230,
    "standardPrice": 3870,
    "designPrice": 6350,
    "detailedPrice": 4470,
    "works": [
      {
        "id": "W04-01",
        "name": "Грунтование стен (под штукатурку и плитку, 2 цикла)",
        "unit": "м²",
        "defaultUnitPrice": 100,
        "economPrice": 60,
        "standardPrice": 100,
        "designPrice": 160,
        "detailedPrice": 200,
        "multiplierType": "wallNetArea",
        "source": "Прайс-459 #36 / Полный #67+#75"
      },
      {
        "id": "W04-02",
        "name": "Установка штукатурных маяков",
        "unit": "м²",
        "defaultUnitPrice": 150,
        "economPrice": 80,
        "standardPrice": 150,
        "designPrice": 250,
        "detailedPrice": 120,
        "multiplierType": "wallNetArea",
        "source": "Прайс-459 #38 / Полный #31"
      },
      {
        "id": "W04-03",
        "name": "Штукатурка санузла цементной смесью",
        "unit": "м²",
        "defaultUnitPrice": 700,
        "economPrice": 450,
        "standardPrice": 700,
        "designPrice": 950,
        "detailedPrice": 900,
        "multiplierType": "wallNetArea",
        "source": "Прайс-459 #268 / Санузел #15"
      },
      {
        "id": "W04-04",
        "name": "Гидроизоляция стен обмазочная (мокрые зоны, коэф. 0.4 площади)",
        "unit": "м²",
        "defaultUnitPrice": 550,
        "economPrice": 350,
        "standardPrice": 550,
        "designPrice": 850,
        "detailedPrice": 450,
        "multiplierType": "wallNetArea",
        "source": "Прайс-459 #125 / Санузел #20"
      },
      {
        "id": "W04-05",
        "name": "Укладка керамогранита до 60×60 / 60×120 на стены",
        "unit": "м²",
        "defaultUnitPrice": 2300,
        "economPrice": 1300,
        "standardPrice": 2300,
        "designPrice": 4000,
        "detailedPrice": 2200,
        "multiplierType": "wallNetArea",
        "source": "Прайс-459 #129 / Санузел #22"
      },
      {
        "id": "W04-06",
        "name": "Затирка эпоксидной затиркой (или цементной в Экономе)",
        "unit": "м²",
        "defaultUnitPrice": 300,
        "economPrice": 150,
        "standardPrice": 300,
        "designPrice": 500,
        "detailedPrice": 750,
        "multiplierType": "wallNetArea",
        "source": "Прайс-459 #138 / Санузел #27"
      },
      {
        "id": "W04-07",
        "name": "Очистка плитки после затирки",
        "unit": "м²",
        "defaultUnitPrice": 100,
        "economPrice": 50,
        "standardPrice": 100,
        "designPrice": 150,
        "detailedPrice": 120,
        "multiplierType": "wallNetArea",
        "source": "Прайс-459 #372"
      }
    ],
    "materials": [
      {
        "id": "MAT-14",
        "name": "Штукатурка цементная влагостойкая 25 кг + маяки",
        "unit": "кг",
        "normPerUnit": 16,
        "safetyCoeff": 1.05,
        "packageType": "Мешок 25 кг",
        "packagePrice": 450,
        "defaultUnitPrice": 302,
        "multiplierType": "wallNetArea"
      },
      {
        "id": "MAT-15",
        "name": "Гидроизоляция обмазочная Knauf Флэхендихт 5 кг + лента",
        "unit": "кг",
        "normPerUnit": 0.5,
        "safetyCoeff": 1.05,
        "packageType": "Ведро 5 кг",
        "packagePrice": 2200,
        "defaultUnitPrice": 231,
        "multiplierType": "wallNetArea"
      },
      {
        "id": "MAT-16",
        "name": "Клей плиточный эластичный Ceresit CM 16 (C2TE) 25 кг + СВП",
        "unit": "кг",
        "normPerUnit": 6,
        "safetyCoeff": 1.08,
        "packageType": "Мешок 25 кг",
        "packagePrice": 1150,
        "defaultUnitPrice": 298,
        "multiplierType": "wallNetArea"
      },
      {
        "id": "MAT-17",
        "name": "Керамогранит 60×60 / 60×120 + затирка эпоксидная Litokol",
        "unit": "м²",
        "normPerUnit": 1,
        "safetyCoeff": 1.12,
        "packageType": "Упаковка",
        "packagePrice": 2600,
        "defaultUnitPrice": 2912,
        "multiplierType": "wallNetArea"
      }
    ]
  },
  {
    "id": "FIN-W-05",
    "name": "Фартук кухни из плитки / керамогранита",
    "category": "walls",
    "description": "1. Грунт и локальное выравнивание (450₽)\n2. Укладка плитки фартука (2200₽)\n3. Сверление отверстий под розетки (1.5×450₽)\n4. Эпоксидная затирка и герметизация силиконом (1000₽)",
    "roomTypes": "Кухня",
    "categoryName": "Стены",
    "economPrice": 2300,
    "standardPrice": 3425,
    "designPrice": 4775,
    "detailedPrice": 4325,
    "works": [
      {
        "id": "W05-01",
        "name": "Грунтование и локальное выравнивание основания фартука",
        "unit": "м²",
        "defaultUnitPrice": 400,
        "economPrice": 250,
        "standardPrice": 400,
        "designPrice": 600,
        "detailedPrice": 450,
        "multiplierType": "wallNetArea",
        "source": "Прайс-459 #36+#254"
      },
      {
        "id": "W05-02",
        "name": "Укладка плитки фартука кухни",
        "unit": "м²",
        "defaultUnitPrice": 1800,
        "economPrice": 1300,
        "standardPrice": 1800,
        "designPrice": 2400,
        "detailedPrice": 2200,
        "multiplierType": "wallNetArea",
        "source": "Прайс-459 #353 / Полный #83"
      },
      {
        "id": "W05-03",
        "name": "Сверление отверстий в плитке под розетки (в средн. 1.5 шт/м²)",
        "unit": "м²",
        "defaultUnitPrice": 450,
        "economPrice": 300,
        "standardPrice": 450,
        "designPrice": 650,
        "detailedPrice": 450,
        "multiplierType": "wallNetArea",
        "source": "Прайс-459 #136"
      },
      {
        "id": "W05-04",
        "name": "Затирка эпоксидной затиркой + герметизация санитарным силиконом",
        "unit": "м²",
        "defaultUnitPrice": 550,
        "economPrice": 300,
        "standardPrice": 550,
        "designPrice": 800,
        "detailedPrice": 1000,
        "multiplierType": "wallNetArea",
        "source": "Прайс-459 #138+#208"
      }
    ],
    "materials": [
      {
        "id": "MAT-18",
        "name": "Клей плиточный C2TE + грунт + СВП + коронки + герметик",
        "unit": "кг",
        "normPerUnit": 5.5,
        "safetyCoeff": 1.1,
        "packageType": "Мешок 25 кг",
        "packagePrice": 1350,
        "defaultUnitPrice": 327,
        "multiplierType": "wallNetArea"
      },
      {
        "id": "MAT-19",
        "name": "Керамогранит для фартука + эпоксидная затирка",
        "unit": "м²",
        "normPerUnit": 1,
        "safetyCoeff": 1.12,
        "packageType": "м²",
        "packagePrice": 2900,
        "defaultUnitPrice": 3248,
        "multiplierType": "wallNetArea"
      }
    ]
  },
  {
    "id": "FIN-F-01",
    "name": "Ламинат (стяжка + наливной пол + плинтус)",
    "category": "floor",
    "description": "1. Грунт + демпферная лента + маяки (350₽)\n2. Стяжка ЦПС до 5 см (850₽)\n3. Наливной пол самонивелир (650₽)\n4. Подложка (100₽) + Ламинат (550₽) + Плинтус (0.9×250₽)",
    "roomTypes": "Жилые / Коридор",
    "categoryName": "Пол",
    "economPrice": 1358,
    "standardPrice": 2108,
    "designPrice": 2938,
    "detailedPrice": 2725,
    "works": [
      {
        "id": "F01-01",
        "name": "Грунтование пола + монтаж демпферной ленты и маяков",
        "unit": "м²",
        "defaultUnitPrice": 180,
        "economPrice": 100,
        "standardPrice": 180,
        "designPrice": 280,
        "detailedPrice": 350,
        "multiplierType": "floorArea",
        "source": "Прайс-459 #104+#258+#259"
      },
      {
        "id": "F01-02",
        "name": "Устройство цементно-песчаной стяжки до 5 см",
        "unit": "м²",
        "defaultUnitPrice": 650,
        "economPrice": 450,
        "standardPrice": 650,
        "designPrice": 850,
        "detailedPrice": 850,
        "multiplierType": "floorArea",
        "source": "Прайс-459 #105 / Полный #32"
      },
      {
        "id": "F01-03",
        "name": "Устройство наливного пола (самонивелир)",
        "unit": "м²",
        "defaultUnitPrice": 450,
        "economPrice": 300,
        "standardPrice": 450,
        "designPrice": 650,
        "detailedPrice": 650,
        "multiplierType": "floorArea",
        "source": "Прайс-459 #110 / Полный #36"
      },
      {
        "id": "F01-04",
        "name": "Укладка подложки",
        "unit": "м²",
        "defaultUnitPrice": 80,
        "economPrice": 50,
        "standardPrice": 80,
        "designPrice": 120,
        "detailedPrice": 100,
        "multiplierType": "floorArea",
        "source": "Прайс-459 #113"
      },
      {
        "id": "F01-05",
        "name": "Укладка ламината",
        "unit": "м²",
        "defaultUnitPrice": 550,
        "economPrice": 350,
        "standardPrice": 550,
        "designPrice": 750,
        "detailedPrice": 550,
        "multiplierType": "floorArea",
        "source": "Прайс-459 #114 / Полный #106"
      },
      {
        "id": "F01-06",
        "name": "Монтаж напольного плинтуса (ПВХ/МДФ, коэф. 0.9 п.м. на 1 м² пола)",
        "unit": "пог. м",
        "defaultUnitPrice": 220,
        "economPrice": 120,
        "standardPrice": 220,
        "designPrice": 320,
        "detailedPrice": 250,
        "multiplierType": "floorArea",
        "source": "Прайс-459 #121 / Полный #118"
      }
    ],
    "materials": [
      {
        "id": "MAT-20",
        "name": "Пескобетон М300 40 кг (стяжка 45 мм) + демпферная лента + грунт",
        "unit": "кг",
        "normPerUnit": 75,
        "safetyCoeff": 1.05,
        "packageType": "Мешок 40 кг",
        "packagePrice": 340,
        "defaultUnitPrice": 669,
        "multiplierType": "floorArea"
      },
      {
        "id": "MAT-21",
        "name": "Пол наливной самонивелирующийся Vetonit 3000, 20 кг + подложка",
        "unit": "кг",
        "normPerUnit": 5.5,
        "safetyCoeff": 1.05,
        "packageType": "Мешок 20 кг",
        "packagePrice": 890,
        "defaultUnitPrice": 257,
        "multiplierType": "floorArea"
      },
      {
        "id": "MAT-22",
        "name": "Ламинат 33 класс 8-10 мм + плинтус с крепежом",
        "unit": "м²",
        "normPerUnit": 1,
        "safetyCoeff": 1.08,
        "packageType": "Упаковка",
        "packagePrice": 1650,
        "defaultUnitPrice": 1782,
        "multiplierType": "floorArea"
      }
    ]
  },
  {
    "id": "FIN-F-02",
    "name": "Кварцвинил замковый SPC (стяжка + наливной пол + плинтус МДФ)",
    "category": "floor",
    "description": "1. Грунт + демпфер + маяки (350₽)\n2. Стяжка ЦПС до 5 см (850₽)\n3. Наливной пол (650₽)\n4. Подложка (100₽) + Кварцвинил SPC (650₽) + Плинтус МДФ (0.9×550₽)",
    "roomTypes": "Жилые / Коридор / Кухня",
    "categoryName": "Пол",
    "economPrice": 1458,
    "standardPrice": 2258,
    "designPrice": 3088,
    "detailedPrice": 3095,
    "works": [
      {
        "id": "F02-01",
        "name": "Грунтование пола + монтаж демпферной ленты и маяков",
        "unit": "м²",
        "defaultUnitPrice": 180,
        "economPrice": 100,
        "standardPrice": 180,
        "designPrice": 280,
        "detailedPrice": 350,
        "multiplierType": "floorArea",
        "source": "Прайс-459 #104+#258+#259"
      },
      {
        "id": "F02-02",
        "name": "Устройство цементно-песчаной стяжки до 5 см",
        "unit": "м²",
        "defaultUnitPrice": 650,
        "economPrice": 450,
        "standardPrice": 650,
        "designPrice": 850,
        "detailedPrice": 850,
        "multiplierType": "floorArea",
        "source": "Прайс-459 #105 / Полный #32"
      },
      {
        "id": "F02-03",
        "name": "Устройство наливного пола (идеальная плоскость под SPC)",
        "unit": "м²",
        "defaultUnitPrice": 450,
        "economPrice": 300,
        "standardPrice": 450,
        "designPrice": 650,
        "detailedPrice": 650,
        "multiplierType": "floorArea",
        "source": "Прайс-459 #110 / Полный #36"
      },
      {
        "id": "F02-04",
        "name": "Укладка подложки",
        "unit": "м²",
        "defaultUnitPrice": 80,
        "economPrice": 50,
        "standardPrice": 80,
        "designPrice": 120,
        "detailedPrice": 100,
        "multiplierType": "floorArea",
        "source": "Прайс-459 #113"
      },
      {
        "id": "F02-05",
        "name": "Укладка кварцвинила замкового (SPC/LVT)",
        "unit": "м²",
        "defaultUnitPrice": 700,
        "economPrice": 450,
        "standardPrice": 700,
        "designPrice": 900,
        "detailedPrice": 650,
        "multiplierType": "floorArea",
        "source": "Прайс-459 #115 / Полный #107"
      },
      {
        "id": "F02-06",
        "name": "Монтаж МДФ/дюрополимерного плинтуса (коэф. 0.9 п.м. на 1 м² пола)",
        "unit": "пог. м",
        "defaultUnitPrice": 220,
        "economPrice": 120,
        "standardPrice": 220,
        "designPrice": 320,
        "detailedPrice": 550,
        "multiplierType": "floorArea",
        "source": "Прайс-459 #122 / Полный #118"
      }
    ],
    "materials": [
      {
        "id": "MAT-23",
        "name": "Пескобетон М300 (стяжка) + Наливной пол Vetonit + подложка SPC",
        "unit": "кг",
        "normPerUnit": 80,
        "safetyCoeff": 1.05,
        "packageType": "Мешок 40 кг",
        "packagePrice": 460,
        "defaultUnitPrice": 966,
        "multiplierType": "floorArea"
      },
      {
        "id": "MAT-24",
        "name": "Кварцвинил замковый SPC 4 мм + плинтус МДФ/дюрополимер",
        "unit": "м²",
        "normPerUnit": 1,
        "safetyCoeff": 1.08,
        "packageType": "Упаковка",
        "packagePrice": 2450,
        "defaultUnitPrice": 2646,
        "multiplierType": "floorArea"
      }
    ]
  },
  {
    "id": "FIN-F-03",
    "name": "Керамогранит напольный + Электрический тёплый пол",
    "category": "floor",
    "description": "1. Грунт 2 цикла (200₽) + Стяжка до 5 см (850₽)\n2. Электрический тёплый пол (0.7×1000₽)\n3. Укладка керамогранита до 60×60 (2200₽)\n4. Затирка швов (250₽)",
    "roomTypes": "Кухня / Коридор / Лоджия",
    "categoryName": "Пол",
    "economPrice": 2170,
    "standardPrice": 3300,
    "designPrice": 4535,
    "detailedPrice": 4200,
    "works": [
      {
        "id": "F03-01",
        "name": "Грунтование пола (2 цикла)",
        "unit": "м²",
        "defaultUnitPrice": 100,
        "economPrice": 60,
        "standardPrice": 100,
        "designPrice": 160,
        "detailedPrice": 200,
        "multiplierType": "floorArea",
        "source": "Прайс-459 #104 / Полный #75"
      },
      {
        "id": "F03-02",
        "name": "Устройство цементно-песчаной стяжки до 5 см",
        "unit": "м²",
        "defaultUnitPrice": 650,
        "economPrice": 450,
        "standardPrice": 650,
        "designPrice": 850,
        "detailedPrice": 850,
        "multiplierType": "floorArea",
        "source": "Прайс-459 #105 / Полный #32"
      },
      {
        "id": "F03-03",
        "name": "Монтаж электрического тёплого пола (коэф. 0.7 полезной площади)",
        "unit": "м²",
        "defaultUnitPrice": 500,
        "economPrice": 300,
        "standardPrice": 500,
        "designPrice": 750,
        "detailedPrice": 1000,
        "multiplierType": "floorArea",
        "source": "Прайс-459 #160 / Полный #38"
      },
      {
        "id": "F03-04",
        "name": "Укладка керамогранита до 60×60 на пол",
        "unit": "м²",
        "defaultUnitPrice": 1900,
        "economPrice": 1300,
        "standardPrice": 1900,
        "designPrice": 2500,
        "detailedPrice": 2200,
        "multiplierType": "floorArea",
        "source": "Прайс-459 #129 / Полный #112"
      },
      {
        "id": "F03-05",
        "name": "Затирка цементной / эпоксидной затиркой",
        "unit": "м²",
        "defaultUnitPrice": 300,
        "economPrice": 150,
        "standardPrice": 300,
        "designPrice": 500,
        "detailedPrice": 250,
        "multiplierType": "floorArea",
        "source": "Прайс-459 #137 / Санузел #27"
      }
    ],
    "materials": [
      {
        "id": "MAT-25",
        "name": "Пескобетон М300 (стяжка) + Плиточный клей C2TE + СВП",
        "unit": "кг",
        "normPerUnit": 80,
        "safetyCoeff": 1.05,
        "packageType": "Комплект",
        "packagePrice": 520,
        "defaultUnitPrice": 1092,
        "multiplierType": "floorArea"
      },
      {
        "id": "MAT-26",
        "name": "Керамогранит напольный + Нагревательный мат тёплого пола + затирка",
        "unit": "м²",
        "normPerUnit": 1,
        "safetyCoeff": 1.1,
        "packageType": "Комплект на м²",
        "packagePrice": 3200,
        "defaultUnitPrice": 3520,
        "multiplierType": "floorArea"
      }
    ]
  },
  {
    "id": "FIN-F-04",
    "name": "Керамогранит Санузла (гидроизоляция + стяжка + тёплый пол)",
    "category": "floor",
    "description": "1. Гидроизоляция пола с заходом на стены (1.2×550₽)\n2. Стяжка ЦПС (850₽) + Тёплый пол (0.6×1000₽)\n3. Укладка керамогранита (2200₽)\n4. Затирка эпоксидная (750₽)",
    "roomTypes": "Санузел",
    "categoryName": "Пол",
    "economPrice": 2500,
    "standardPrice": 4210,
    "designPrice": 6820,
    "detailedPrice": 5060,
    "works": [
      {
        "id": "F04-01",
        "name": "Гидроизоляция пола в санузле (с заходом на стены)",
        "unit": "м²",
        "defaultUnitPrice": 550,
        "economPrice": 350,
        "standardPrice": 550,
        "designPrice": 850,
        "detailedPrice": 550,
        "multiplierType": "floorArea",
        "source": "Прайс-459 #126 / Санузел #19"
      },
      {
        "id": "F04-02",
        "name": "Устройство цементно-песчаной стяжки до 5 см",
        "unit": "м²",
        "defaultUnitPrice": 650,
        "economPrice": 450,
        "standardPrice": 650,
        "designPrice": 850,
        "detailedPrice": 850,
        "multiplierType": "floorArea",
        "source": "Прайс-459 #105 / Санузел #17"
      },
      {
        "id": "F04-03",
        "name": "Монтаж электрического тёплого пола (коэф. 0.6 площади СУ)",
        "unit": "м²",
        "defaultUnitPrice": 500,
        "economPrice": 300,
        "standardPrice": 500,
        "designPrice": 750,
        "detailedPrice": 1000,
        "multiplierType": "floorArea",
        "source": "Прайс-459 #160 / Санузел #14"
      },
      {
        "id": "F04-04",
        "name": "Укладка керамогранита до 60×60 на пол санузла",
        "unit": "м²",
        "defaultUnitPrice": 2300,
        "economPrice": 1300,
        "standardPrice": 2300,
        "designPrice": 4000,
        "detailedPrice": 2200,
        "multiplierType": "floorArea",
        "source": "Прайс-459 #129 / Санузел #23"
      },
      {
        "id": "F04-05",
        "name": "Затирка эпоксидной затиркой",
        "unit": "м²",
        "defaultUnitPrice": 300,
        "economPrice": 150,
        "standardPrice": 300,
        "designPrice": 500,
        "detailedPrice": 750,
        "multiplierType": "floorArea",
        "source": "Прайс-459 #138 / Санузел #27"
      }
    ],
    "materials": [
      {
        "id": "MAT-27",
        "name": "Гидроизоляция + лента + Пескобетон М300 + Клей C2TE + СВП",
        "unit": "кг",
        "normPerUnit": 82,
        "safetyCoeff": 1.05,
        "packageType": "Комплект",
        "packagePrice": 640,
        "defaultUnitPrice": 1378,
        "multiplierType": "floorArea"
      },
      {
        "id": "MAT-28",
        "name": "Керамогранит R10 + Эпоксидная затирка + Тёплый пол",
        "unit": "м²",
        "normPerUnit": 1,
        "safetyCoeff": 1.12,
        "packageType": "Комплект на м²",
        "packagePrice": 3500,
        "defaultUnitPrice": 3920,
        "multiplierType": "floorArea"
      }
    ]
  },
  {
    "id": "FIN-C-01",
    "name": "Натяжной потолок ПВХ со светильниками и вставкой",
    "category": "ceiling",
    "description": "1. Монтаж натяжного потолка ПВХ с багетом (850₽)\n2. Закладные под точки (0.5×250₽)\n3. Установка точечных светильников (0.5×500₽)\n4. Потолочный плинтус / вставка (0.9×250₽)",
    "roomTypes": "Все помещения",
    "categoryName": "Потолок",
    "economPrice": 608,
    "standardPrice": 1207,
    "designPrice": 1790,
    "detailedPrice": 1450,
    "works": [
      {
        "id": "C01-01",
        "name": "Монтаж натяжного потолка ПВХ (с багетом)",
        "unit": "м²",
        "defaultUnitPrice": 700,
        "economPrice": 350,
        "standardPrice": 700,
        "designPrice": 1000,
        "detailedPrice": 850,
        "multiplierType": "ceilingArea",
        "source": "Прайс-459 #94 / Полный #97"
      },
      {
        "id": "C01-02",
        "name": "Монтаж закладной под точечный светильник (коэф. 0.5 шт/м²)",
        "unit": "шт.",
        "defaultUnitPrice": 300,
        "economPrice": 150,
        "standardPrice": 300,
        "designPrice": 500,
        "detailedPrice": 250,
        "multiplierType": "ceilingArea",
        "source": "Прайс-459 #323 / Полный #100"
      },
      {
        "id": "C01-03",
        "name": "Установка точечного светильника (коэф. 0.5 шт/м²)",
        "unit": "шт.",
        "defaultUnitPrice": 300,
        "economPrice": 150,
        "standardPrice": 300,
        "designPrice": 450,
        "detailedPrice": 500,
        "multiplierType": "ceilingArea",
        "source": "Прайс-459 #157 / Полный #142"
      },
      {
        "id": "C01-04",
        "name": "Монтаж потолочного плинтуса / вставки (коэф. 0.9 п.м./м²)",
        "unit": "пог. м",
        "defaultUnitPrice": 230,
        "economPrice": 120,
        "standardPrice": 230,
        "designPrice": 350,
        "detailedPrice": 250,
        "multiplierType": "ceilingArea",
        "source": "Прайс-459 #99 / Полный #104"
      }
    ],
    "materials": [
      {
        "id": "MAT-29",
        "name": "Профиль стеновой (багет), закладные платформы, термокольца, крепеж",
        "unit": "компл.",
        "normPerUnit": 1,
        "safetyCoeff": 1.05,
        "packageType": "Комплект на м²",
        "packagePrice": 380,
        "defaultUnitPrice": 399,
        "multiplierType": "ceilingArea"
      },
      {
        "id": "MAT-30",
        "name": "Полотно ПВХ матовое/сатин + вставка + точечные светильники",
        "unit": "м²",
        "normPerUnit": 1,
        "safetyCoeff": 1,
        "packageType": "Комплект на м²",
        "packagePrice": 650,
        "defaultUnitPrice": 650,
        "multiplierType": "ceilingArea"
      }
    ]
  },
  {
    "id": "FIN-C-02",
    "name": "Гипсокартонный потолок (ГКЛ в 1 ур. под покраску)",
    "category": "ceiling",
    "description": "1. Монтаж потолка ГКЛ в 1 уровень (1500₽)\n2. Заделка стыков с лентой и грунт (340₽)\n3. Проклейка стеклохолста (380₽)\n4. Шпаклёвка 2 сл. + шлифовка (850₽) + Окраска 2 сл. (550₽)",
    "roomTypes": "Жилые / Санузел",
    "categoryName": "Потолок",
    "economPrice": 1380,
    "standardPrice": 2120,
    "designPrice": 3350,
    "detailedPrice": 3620,
    "works": [
      {
        "id": "C02-01",
        "name": "Монтаж потолка ГКЛ в 1 уровень на металлокаркасе",
        "unit": "м²",
        "defaultUnitPrice": 950,
        "economPrice": 650,
        "standardPrice": 950,
        "designPrice": 1300,
        "detailedPrice": 1500,
        "multiplierType": "ceilingArea",
        "source": "Прайс-459 #88 / Полный #41"
      },
      {
        "id": "C02-02",
        "name": "Заделка стыков ГКЛ с лентой и грунтование потолка",
        "unit": "м²",
        "defaultUnitPrice": 130,
        "economPrice": 80,
        "standardPrice": 130,
        "designPrice": 200,
        "detailedPrice": 340,
        "multiplierType": "ceilingArea",
        "source": "Прайс-459 #49+#320 / Полный #67"
      },
      {
        "id": "C02-03",
        "name": "Проклейка стеклохолста на потолок",
        "unit": "м²",
        "defaultUnitPrice": 180,
        "economPrice": 100,
        "standardPrice": 180,
        "designPrice": 300,
        "detailedPrice": 380,
        "multiplierType": "ceilingArea",
        "source": "Прайс-459 #285 / Полный #68"
      },
      {
        "id": "C02-04",
        "name": "Шпаклёвка потолка под покраску, 2 слоя + шлифовка",
        "unit": "м²",
        "defaultUnitPrice": 540,
        "economPrice": 350,
        "standardPrice": 540,
        "designPrice": 950,
        "detailedPrice": 850,
        "multiplierType": "ceilingArea",
        "source": "Прайс-459 #55+#57 / Полный #71+#72"
      },
      {
        "id": "C02-05",
        "name": "Окраска потолка в 2 слоя",
        "unit": "м²",
        "defaultUnitPrice": 320,
        "economPrice": 200,
        "standardPrice": 320,
        "designPrice": 600,
        "detailedPrice": 550,
        "multiplierType": "ceilingArea",
        "source": "Прайс-459 #62 / Полный #96"
      }
    ],
    "materials": [
      {
        "id": "MAT-31",
        "name": "Профиль ПП 60×27, ПН 27×28, подвесы, ГКЛ Knauf, Uniflott, стеклохолст, шпаклёвка",
        "unit": "компл.",
        "normPerUnit": 1,
        "safetyCoeff": 1.08,
        "packageType": "Комплект на м²",
        "packagePrice": 1350,
        "defaultUnitPrice": 1458,
        "multiplierType": "ceilingArea"
      },
      {
        "id": "MAT-32",
        "name": "Краска глубокоматовая потолочная Tikkurila Anti-Reflex",
        "unit": "л",
        "normPerUnit": 0.22,
        "safetyCoeff": 1.1,
        "packageType": "Ведро 9 л",
        "packagePrice": 6800,
        "defaultUnitPrice": 183,
        "multiplierType": "ceilingArea"
      }
    ]
  },
  {
    "id": "FIN-P-01",
    "name": "Возведение перегородок (Газоблок 100 мм / ПГП)",
    "category": "demolition",
    "description": "1. Кладка перегородки из газоблока 100 мм (1100₽)\n2. Армирование кладки (180₽)",
    "roomTypes": "Перегородки",
    "categoryName": "Конструктив",
    "economPrice": 700,
    "standardPrice": 1050,
    "designPrice": 1520,
    "detailedPrice": 1280,
    "works": [
      {
        "id": "P01-01",
        "name": "Кладка перегородки из газоблока 100 мм (или ПГП)",
        "unit": "м²",
        "defaultUnitPrice": 900,
        "economPrice": 600,
        "standardPrice": 900,
        "designPrice": 1300,
        "detailedPrice": 1100,
        "multiplierType": "wallNetArea",
        "source": "Прайс-459 #26 / Полный #21"
      },
      {
        "id": "P01-02",
        "name": "Армирование кладки",
        "unit": "м²",
        "defaultUnitPrice": 150,
        "economPrice": 100,
        "standardPrice": 150,
        "designPrice": 220,
        "detailedPrice": 180,
        "multiplierType": "wallNetArea",
        "source": "Прайс-459 #34"
      }
    ],
    "materials": [
      {
        "id": "MAT-33",
        "name": "Газоблок D500 100 мм (8.3 шт/м²) + клей для блоков + арматура + пена",
        "unit": "компл.",
        "normPerUnit": 1,
        "safetyCoeff": 1.05,
        "packageType": "Комплект на м²",
        "packagePrice": 1180,
        "defaultUnitPrice": 1239,
        "multiplierType": "wallNetArea"
      }
    ]
  },
  {
    "id": "FIN-E-01",
    "name": "Электромонтажная точка «под ключ» (штроба + кабель + подрозетник + розетка)",
    "category": "electric",
    "description": "1. Штробление в блоке 1.5 п.м. (525₽)\n2. Прокладка кабеля в гофре 5 п.м. (900₽)\n3. Сверление и вмазка подрозетника (750₽)\n4. Чистовая установка розетки/выключателя (350₽)",
    "roomTypes": "Все помещения",
    "categoryName": "Электрика",
    "economPrice": 905,
    "standardPrice": 1710,
    "designPrice": 2575,
    "detailedPrice": 2525,
    "works": [
      {
        "id": "E01-01",
        "name": "Штробление стены под кабель (блок/кирпич, ~1.5 п.м. на точку)",
        "unit": "пог. м",
        "defaultUnitPrice": 280,
        "economPrice": 150,
        "standardPrice": 280,
        "designPrice": 450,
        "detailedPrice": 350,
        "multiplierType": "fixturesElectric",
        "source": "Прайс-459 #144 / Полный #44"
      },
      {
        "id": "E01-02",
        "name": "Прокладка кабеля в штробе/гофре (~5 п.м. на точку)",
        "unit": "пог. м",
        "defaultUnitPrice": 150,
        "economPrice": 80,
        "standardPrice": 150,
        "designPrice": 220,
        "detailedPrice": 180,
        "multiplierType": "fixturesElectric",
        "source": "Прайс-459 #147 / Полный #45"
      },
      {
        "id": "E01-03",
        "name": "Сверление отверстия и установка подрозетника",
        "unit": "шт.",
        "defaultUnitPrice": 220,
        "economPrice": 100,
        "standardPrice": 220,
        "designPrice": 350,
        "detailedPrice": 750,
        "multiplierType": "fixturesElectric",
        "source": "Прайс-459 #148+#150 / Полный #46"
      },
      {
        "id": "E01-04",
        "name": "Монтаж розетки / выключателя (чистовой механизм)",
        "unit": "шт.",
        "defaultUnitPrice": 320,
        "economPrice": 180,
        "standardPrice": 320,
        "designPrice": 450,
        "detailedPrice": 350,
        "multiplierType": "fixturesElectric",
        "source": "Прайс-459 #151 / Полный #140"
      }
    ],
    "materials": [
      {
        "id": "MAT-34",
        "name": "Кабель ВВГнг(А)-LS 3×2.5 / 3×1.5 ГОСТ (~5 м), гофра, подрозетник, алебастр",
        "unit": "компл.",
        "normPerUnit": 1,
        "safetyCoeff": 1.05,
        "packageType": "На 1 точку",
        "packagePrice": 680,
        "defaultUnitPrice": 714,
        "multiplierType": "fixturesElectric"
      },
      {
        "id": "MAT-35",
        "name": "Механизм розетки / выключателя с рамкой (Schneider / Legrand)",
        "unit": "шт.",
        "normPerUnit": 1,
        "safetyCoeff": 1,
        "packageType": "Штука",
        "packagePrice": 450,
        "defaultUnitPrice": 450,
        "multiplierType": "fixturesElectric"
      }
    ]
  },
  {
    "id": "FIN-S-01",
    "name": "Сантехническая точка (ХВС/ГВС + Канализация со штроблением)",
    "category": "plumbing",
    "description": "1. Штробление под трубы 1.5 п.м. (675₽)\n2. Разводка водоснабжения до точки (4200₽)\n3. Разводка канализации до точки (3000₽)",
    "roomTypes": "Санузел / Кухня",
    "categoryName": "Сантехника",
    "economPrice": 3225,
    "standardPrice": 5420,
    "designPrice": 8275,
    "detailedPrice": 7875,
    "works": [
      {
        "id": "S01-01",
        "name": "Штробление под трубы (блок/кирпич, ~1.5 п.м. на точку)",
        "unit": "пог. м",
        "defaultUnitPrice": 280,
        "economPrice": 150,
        "standardPrice": 280,
        "designPrice": 450,
        "detailedPrice": 450,
        "multiplierType": "fixturesPlumbing",
        "source": "Прайс-459 #166 / Полный #44"
      },
      {
        "id": "S01-02",
        "name": "Разводка водоснабжения до точки (ПП / PEX)",
        "unit": "точка",
        "defaultUnitPrice": 2500,
        "economPrice": 1500,
        "standardPrice": 2500,
        "designPrice": 3800,
        "detailedPrice": 4200,
        "multiplierType": "fixturesPlumbing",
        "source": "Прайс-459 #164 / Полный #51"
      },
      {
        "id": "S01-03",
        "name": "Разводка канализации до точки",
        "unit": "точка",
        "defaultUnitPrice": 2500,
        "economPrice": 1500,
        "standardPrice": 2500,
        "designPrice": 3800,
        "detailedPrice": 3000,
        "multiplierType": "fixturesPlumbing",
        "source": "Прайс-459 #165 / Полный #53"
      }
    ],
    "materials": [
      {
        "id": "MAT-36",
        "name": "Труба PEX/ПП в утеплителе, фитинги, водорозетки, трубы НПВХ 50 мм, крепеж",
        "unit": "компл.",
        "normPerUnit": 1,
        "safetyCoeff": 1.05,
        "packageType": "На 1 водоточку",
        "packagePrice": 2950,
        "defaultUnitPrice": 3098,
        "multiplierType": "fixturesPlumbing"
      }
    ]
  },
  {
    "id": "FIN-D-01",
    "name": "Установка межкомнатной двери с доборами и наличниками",
    "category": "doors",
    "description": "1. Установка двери с коробкой, наличниками и врезкой фурнитуры (5500₽)\n2. Установка доборов 5 п.м. (2750₽)",
    "roomTypes": "Все помещения",
    "categoryName": "Столярные",
    "economPrice": 4000,
    "standardPrice": 6700,
    "designPrice": 10000,
    "detailedPrice": 8250,
    "works": [
      {
        "id": "D01-01",
        "name": "Установка межкомнатной двери (коробка, полотно, наличники, фурнитура)",
        "unit": "шт.",
        "defaultUnitPrice": 4200,
        "economPrice": 2500,
        "standardPrice": 4200,
        "designPrice": 6500,
        "detailedPrice": 5500,
        "multiplierType": "doorsCount",
        "source": "Прайс-459 #188 / Полный #121"
      },
      {
        "id": "D01-02",
        "name": "Установка доборов (~5 п.м. на проём)",
        "unit": "пог. м",
        "defaultUnitPrice": 500,
        "economPrice": 300,
        "standardPrice": 500,
        "designPrice": 700,
        "detailedPrice": 550,
        "multiplierType": "doorsCount",
        "source": "Прайс-459 #192"
      }
    ],
    "materials": [
      {
        "id": "MAT-37",
        "name": "Пена монтажная проф., крепеж скрытый, герметик акриловый",
        "unit": "компл.",
        "normPerUnit": 1,
        "safetyCoeff": 1,
        "packageType": "На 1 дверь",
        "packagePrice": 850,
        "defaultUnitPrice": 850,
        "multiplierType": "doorsCount"
      },
      {
        "id": "MAT-38",
        "name": "Дверное полотно, коробка, наличники, доборы, ручка и замок",
        "unit": "компл.",
        "normPerUnit": 1,
        "safetyCoeff": 1,
        "packageType": "Комплект двери",
        "packagePrice": 18500,
        "defaultUnitPrice": 18500,
        "multiplierType": "doorsCount"
      }
    ]
  },
  {
    "id": "FIN-A-01",
    "name": "Монтаж сплит-системы (с закладкой трассы до 5 м)",
    "category": "other",
    "description": "1. Предмонтаж фреоновой трассы до 5 м в штробе и навеска блоков (9000₽)",
    "roomTypes": "Жилые / Кухня",
    "categoryName": "Климат",
    "economPrice": 6000,
    "standardPrice": 9000,
    "designPrice": 13000,
    "detailedPrice": 9000,
    "works": [
      {
        "id": "A01-01",
        "name": "Монтаж сплит-системы (закладка трассы до 5 м + навеска блоков)",
        "unit": "компл.",
        "defaultUnitPrice": 9000,
        "economPrice": 6000,
        "standardPrice": 9000,
        "designPrice": 13000,
        "detailedPrice": 9000,
        "multiplierType": "fixed",
        "fixedQuantity": 1,
        "source": "Полный #58"
      }
    ],
    "materials": [
      {
        "id": "MAT-39",
        "name": "Медная фреоновая трасса в изоляции (до 5 м), дренаж, кабель, кронштейны",
        "unit": "компл.",
        "normPerUnit": 1,
        "safetyCoeff": 1,
        "packageType": "Трасса 5 м",
        "packagePrice": 5800,
        "defaultUnitPrice": 5800,
        "multiplierType": "fixed",
        "fixedQuantity": 1
      }
    ]
  }
];
