import JSZip from 'jszip';
import { CalculatedProjectEstimate, ClientInfo } from './types';
import { generateTurnkey118Excel, generateEstimateExcel } from './excelExporter';
import { generateClientProposalPdf, ClientProposalOptions } from './pdfExporter';
import { Turnkey118CalculationResult } from './krasnodarTurnkeyTemplate';

export interface ExportPackageOptions {
  clientInfo: ClientInfo;
  projectEstimate: CalculatedProjectEstimate;
  turnkey118Result: Turnkey118CalculationResult;
  estimateMode: 'turnkey_118' | 'by_rooms';
  planImageBase64?: string | null;
  proposalOptions: ClientProposalOptions;
}

/**
 * Пакетный экспорт в 1 клик комплекта документов в ZIP-архив с папкой [Адрес]_[ИмяЗаказчика]
 * Включает:
 * 1. Коммерческое предложение (КП) в PDF с логотипом и чертежом
 * 2. Договорную смету в Excel (.xlsx) с живыми формулами и разбивкой по мастерам
 * 3. 2D обмерочный план помещения в формате PNG (высокое разрешение)
 * 4. Текстовый паспорт объекта со сводными параметрами
 */
export async function exportClientPackageZip(options: ExportPackageOptions): Promise<void> {
  const {
    clientInfo,
    projectEstimate,
    turnkey118Result,
    estimateMode,
    planImageBase64,
    proposalOptions
  } = options;

  const zip = new JSZip();

  // Формируем чистое имя папки по шаблону: [Адрес]_[ИмяЗаказчика]
  const rawAddr = clientInfo.address || 'Краснодар';
  const rawName = clientInfo.name || 'Заказчик';
  const cleanAddr = rawAddr.replace(/[/\\?%*:|"<>]/g, '_').trim().slice(0, 40);
  const cleanName = rawName.replace(/[/\\?%*:|"<>]/g, '_').trim().slice(0, 24);
  const folderName = `${cleanAddr}_${cleanName}`;
  const folder = zip.folder(folderName) || zip;

  // 1. Формируем Коммерческое Предложение в PDF (пропускаем браузерный авто-сейв)
  const proposalBlob = await generateClientProposalPdf(projectEstimate, {
    ...proposalOptions,
    planImageBase64: planImageBase64 || proposalOptions.planImageBase64,
    skipAutoSave: true
  });
  folder.file(`1_Коммерческое_предложение_КП_${cleanName}.pdf`, proposalBlob);

  // 2. Формируем Смету в Excel (.xlsx)
  if (estimateMode === 'turnkey_118') {
    const excelBlob = await generateTurnkey118Excel(clientInfo, turnkey118Result.rows, {
      hidePrices: false,
      planImageBase64
    });
    folder.file(`2_Смета_118_позиций_Краснодар_${cleanName}.xlsx`, excelBlob);
  } else {
    const excelBlob = await generateEstimateExcel(projectEstimate, {
      exportExcel: true,
      exportPdf: false,
      hidePrices: false,
      includeMaterials: true,
      includePlanImage: !!planImageBase64,
      planImageBase64
    });
    folder.file(`2_Смета_покомнатная_${cleanName}.xlsx`, excelBlob);
  }

  // 3. Отдельный графический 2D план помещения (PNG)
  if (planImageBase64 && planImageBase64.includes('base64,')) {
    const base64Content = planImageBase64.split('base64,')[1];
    folder.file(`3_Обмерочный_план_2D_${cleanName}.png`, base64Content, { base64: true });
  }

  // 4. Текстовый паспорт объекта
  const grandTotal = estimateMode === 'turnkey_118' ? turnkey118Result.grandTotal : projectEstimate.grandTotal;
  const totalPerimeter = projectEstimate.rooms.reduce((s, r) => s + (r.perimeter || 0), 0);
  const formatPrice = (v: number) => new Intl.NumberFormat('ru-RU').format(Math.round(v));
  const currentDate = new Date().toLocaleDateString('ru-RU');

  const passportLines = [
    `========================================================================`,
    `                 ПАСПОРТ ОБЪЕКТА И СМЕТНОГО РАСЧЕТА                    `,
    `========================================================================`,
    `Заказчик:          ${clientInfo.name || 'Физическое лицо'}`,
    `Телефон:           ${clientInfo.phone || 'Не указан'}`,
    `Адрес объекта:     ${clientInfo.address || 'г. Краснодар'}`,
    `Номер договора:    ${clientInfo.contractNumber}`,
    `Дата формирования: ${currentDate}`,
    ``,
    `------------------------------------------------------------------------`,
    `1. ГЕОМЕТРИЧЕСКИЕ ХАРАКТЕРИСТИКИ ПОМЕЩЕНИЙ (CAD 2D):`,
    `------------------------------------------------------------------------`,
    `• Общая площадь пола (S общ):     ${projectEstimate.totalFloorArea.toFixed(2)} м²`,
    `• Чистая площадь стен под отделку: ${projectEstimate.totalWallNetArea.toFixed(2)} м²`,
    `• Общий периметр комнат (плинтус): ${totalPerimeter.toFixed(2)} м`,
    `• Высота потолков:                 ${clientInfo.ceilingHeight || 3.04} м`,
    `• Количество комнат:               ${projectEstimate.rooms.length} шт`,
    ``,
    `Экспликация помещений:`
  ];

  projectEstimate.rooms.forEach((r, idx) => {
    passportLines.push(`  ${idx + 1}. ${(r.roomName || 'Помещение').padEnd(22)} S пола: ${r.floorArea.toFixed(2)} м², S стен: ${r.wallNetArea.toFixed(2)} м², P: ${r.perimeter.toFixed(2)} м`);
  });

  passportLines.push(
    ``,
    `------------------------------------------------------------------------`,
    `2. СМЕТНЫЙ РАСЧЕТ И ФИНАНСОВЫЙ ИТОГ:`,
    `------------------------------------------------------------------------`,
    `• Режим ценообразования:           ${estimateMode === 'turnkey_118' ? 'Эталонная смета 118 позиций (Краснодар Стандарт)' : 'Покомнатный расчет'}`,
    `• Итоговая стоимость работ:        ${formatPrice(grandTotal)} руб.`
  );

  if (estimateMode === 'turnkey_118') {
    passportLines.push(`  (включая работы по геометрии CAD: ${formatPrice(turnkey118Result.geometryTotal)} руб. + штучный чек-лист: ${formatPrice(turnkey118Result.constantsTotal)} руб.)`);
  }

  passportLines.push(
    ``,
    `------------------------------------------------------------------------`,
    `3. СОСТАВ ПАКЕТА ДОКУМЕНТОВ:`,
    `------------------------------------------------------------------------`,
    `1. 1_Коммерческое_предложение_КП_${cleanName}.pdf — Коммерческое предложение с 2D-планом и итогом`,
    `2. 2_Смета_118_позиций_Краснодар_${cleanName}.xlsx — Полная договорная смета с разбивкой по мастерам`,
    planImageBase64 ? `3. 3_Обмерочный_план_2D_${cleanName}.png — Графический план в высоком разрешении` : '',
    `4. Паспорт_объекта.txt — Данный сводный текстовый файл`,
    `========================================================================`,
    `Сформировано автоматически в программном комплексе Estimate CAD`
  );

  folder.file(`Паспорт_объекта.txt`, passportLines.filter(Boolean).join('\r\n'));

  // 5. Генерируем ZIP-архив и запускаем скачивание
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `${folderName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}
