import ExcelJS from 'exceljs';
import { CalculatedProjectEstimate, EstimateExportOptions } from './types';

export async function generateEstimateExcel(
  estimate: CalculatedProjectEstimate,
  options?: Partial<EstimateExportOptions>
): Promise<Blob> {
  const hidePrices = !!options?.hidePrices;
  const includeMaterials = options?.includeMaterials !== false; // по умолчанию включены
  const includePlan = !!options?.includePlanImage && !!options?.planImageBase64;

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Estimate CAD App';
  wb.lastModifiedBy = 'Estimate CAD App';
  wb.created = new Date();
  wb.modified = new Date();

  // 1. ЛИСТ ОБМЕРОЧНОГО ПЛАНА (ЕСЛИ ВКЛЮЧЕНА ГАЛОЧКА)
  if (includePlan && options?.planImageBase64) {
    try {
      const wsPlan = wb.addWorksheet('Обмерочный план 2D', {
        views: [{ showGridLines: false }]
      });

      wsPlan.mergeCells('B2:K2');
      const planTitle = wsPlan.getCell('B2');
      planTitle.value = `2D ОБМЕРОЧНЫЙ ПЛАН ПОМЕЩЕНИЙ С РАЗМЕРАМИ`;
      planTitle.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF1E293B' } };
      wsPlan.getRow(2).height = 24;

      wsPlan.mergeCells('B3:K3');
      const planSub = wsPlan.getCell('B3');
      planSub.value = `Объект: ${estimate.clientAddress || 'г. Краснодар'} | Заказчик: ${estimate.clientName || 'Заказчик'} | S пола: ${estimate.totalFloorArea} м²`;
      planSub.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF64748B' } };
      wsPlan.getRow(3).height = 18;

      const cleanBase64 = options.planImageBase64.replace(/^data:image\/\w+;base64,/, '');
      const imgId = wb.addImage({
        base64: cleanBase64,
        extension: 'png'
      });

      wsPlan.addImage(imgId, {
        tl: { col: 1, row: 4 },
        ext: { width: 840, height: 520 }
      });
    } catch (e) {
      console.warn('Не удалось вставить изображение плана в Excel:', e);
    }
  }

  // 2. ОСНОВНОЙ ЛИСТ СМЕТЫ
  const isWorksOnly = options?.exportScope === 'works' || (!options?.includeMaterials && options?.exportScope !== 'materials');
  const isMatsOnly = options?.exportScope === 'materials';

  let sheetName = 'Смета по помещениям';
  if (isWorksOnly) {
    sheetName = hidePrices ? 'Ведомость объёмов работ' : 'Смета на работы';
  } else if (isMatsOnly) {
    sheetName = 'Ведомость материалов';
  } else if (hidePrices) {
    sheetName = 'Ведомость объёмов';
  }

  const ws = wb.addWorksheet(sheetName, {
    views: [{ showGridLines: true }],
    pageSetup: {
      orientation: 'portrait',
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0
    }
  });

  const totalCols = hidePrices ? 4 : 6;

  // Ширина колонок
  if (hidePrices) {
    ws.columns = [
      { key: 'num', width: 7 },       // A: № п/п
      { key: 'name', width: 56 },     // B: Наименование работ/материалов
      { key: 'unit', width: 12 },     // C: Ед. изм.
      { key: 'qty', width: 16 }       // D: Объем / Количество
    ];
  } else {
    ws.columns = [
      { key: 'num', width: 7 },       // A: № п/п
      { key: 'name', width: 50 },     // B: Наименование
      { key: 'unit', width: 11 },     // C: Ед. изм.
      { key: 'qty', width: 13 },      // D: Кол-во
      { key: 'price', width: 15 },    // E: Цена, руб.
      { key: 'sum', width: 18 }       // F: Стоимость, руб.
    ];
  }

  // Стили шрифтов и заливок
  const fontTitle: Partial<ExcelJS.Font> = { name: 'Calibri', size: 15, bold: true, color: { argb: 'FF0F172A' } };
  const fontSubtitle: Partial<ExcelJS.Font> = { name: 'Calibri', size: 10, bold: false, color: { argb: 'FF475569' } };
  const fontMetaLabel: Partial<ExcelJS.Font> = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF334155' } };
  const fontMetaValue: Partial<ExcelJS.Font> = { name: 'Calibri', size: 10, bold: false, color: { argb: 'FF0F172A' } };

  const fillHeader: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  const fontHeader: Partial<ExcelJS.Font> = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };

  const fillRoomHeader: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
  const fontRoomHeader: Partial<ExcelJS.Font> = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };

  const fillSectionWorks: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
  const fontSection: Partial<ExcelJS.Font> = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E293B' } };

  const fillSectionMats: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
  const fontSectionMats: Partial<ExcelJS.Font> = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF92400E' } };

  const fillSubtotal: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  const fontSubtotal: Partial<ExcelJS.Font> = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };

  const fillGrandTotal: ExcelJS.FillPattern = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
  const fontGrandTotal: Partial<ExcelJS.Font> = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF14532D' } };

  const borderThin: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
  };

  const borderDoubleBottom: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FF94A3B8' } },
    left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'double', color: { argb: 'FF0F172A' } },
    right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
  };

  let currentRow = 1;

  // ЗАГОЛОВОК ДОКУМЕНТА
  ws.mergeCells(currentRow, 1, currentRow, totalCols);
  const titleCell = ws.getCell(currentRow, 1);
  if (isWorksOnly) {
    titleCell.value = hidePrices 
      ? 'ВЕДОМОСТЬ ОБЪЁМОВ ОТДЕЛОЧНЫХ РАБОТ' 
      : 'СМЕТНЫЙ РАСЧЁТ СТОИМОСТИ ОТДЕЛОЧНЫХ РАБОТ (ДОГОВОРНАЯ СМЕТА)';
  } else if (isMatsOnly) {
    titleCell.value = hidePrices 
      ? 'ВЕДОМОСТЬ ПОТРЕБНОСТИ ЧЕРНОВЫХ МАТЕРИАЛОВ' 
      : 'ВЕДОМОСТЬ РАСХОДА И СТОИМОСТИ ЧЕРНОВЫХ МАТЕРИАЛОВ';
  } else {
    titleCell.value = hidePrices 
      ? 'ВЕДОМОСТЬ ОБЪЁМОВ РАБОТ И МАТЕРИАЛОВ (ДЛЯ ЗАКАЗЧИКА)' 
      : 'СВОДНЫЙ СМЕТНЫЙ РАСЧЁТ СТОИМОСТИ РЕМОНТА (РАБОТЫ И МАТЕРИАЛЫ)';
  }
  titleCell.font = fontTitle;
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(currentRow).height = 26;
  currentRow++;

  ws.mergeCells(currentRow, 1, currentRow, totalCols);
  const subTitleCell = ws.getCell(currentRow, 1);
  subTitleCell.value = isWorksOnly
    ? 'Расчёт объемов работ по помещениям | Расценки Краснодар | Estimate CAD'
    : isMatsOnly
    ? 'Нормативная спецификация черновых материалов для снабжения объекта | Estimate CAD'
    : 'Среднерыночные расценки г. Краснодар | Сгенерировано в Estimate CAD';
  subTitleCell.font = fontSubtitle;
  subTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(currentRow).height = 18;
  currentRow += 2;

  // КАРТОЧКА ОБЪЕКТА / ЗАКАЗЧИКА
  const addMetaRow = (label1: string, val1: string, label2?: string, val2?: string) => {
    ws.getCell(currentRow, 1).value = label1;
    ws.getCell(currentRow, 1).font = fontMetaLabel;

    if (hidePrices) {
      ws.getCell(currentRow, 2).value = val1;
      ws.getCell(currentRow, 2).font = fontMetaValue;
      if (label2 && val2) {
        ws.getCell(currentRow, 3).value = label2;
        ws.getCell(currentRow, 3).font = fontMetaLabel;
        ws.getCell(currentRow, 4).value = val2;
        ws.getCell(currentRow, 4).font = fontMetaValue;
      }
    } else {
      ws.mergeCells(currentRow, 2, currentRow, 3);
      ws.getCell(currentRow, 2).value = val1;
      ws.getCell(currentRow, 2).font = fontMetaValue;

      if (label2 && val2) {
        ws.getCell(currentRow, 4).value = label2;
        ws.getCell(currentRow, 4).font = fontMetaLabel;
        ws.mergeCells(currentRow, 5, currentRow, 6);
        ws.getCell(currentRow, 5).value = val2;
        ws.getCell(currentRow, 5).font = fontMetaValue;
      }
    }
    ws.getRow(currentRow).height = 19;
    currentRow++;
  };

  addMetaRow('Заказчик:', estimate.clientName || 'Физическое лицо', 'Договор / Смета №:', estimate.contractNumber);
  addMetaRow('Адрес объекта:', estimate.clientAddress || 'г. Краснодар', 'Дата расчета:', estimate.estimateDate);
  addMetaRow(
    'Телефон:', 
    estimate.clientPhone || '+7 (___) ___-__-__', 
    'Параметры объекта:', 
    `S пола = ${estimate.totalFloorArea} м² | S стен = ${estimate.totalWallNetArea} м²`
  );

  currentRow += 1;

  // ШАПКА ТАБЛИЦЫ
  const headers = hidePrices 
    ? ['№', 'Наименование работ и материалов', 'Ед. изм.', 'Объем (кол-во)']
    : ['№', 'Наименование работ и материалов', 'Ед. изм.', 'Кол-во', 'Цена, руб.', 'Стоимость, руб.'];

  const headerRow = ws.getRow(currentRow);
  headerRow.height = 24;

  headers.forEach((h, colIdx) => {
    const cell = headerRow.getCell(colIdx + 1);
    cell.value = h;
    cell.fill = fillHeader;
    cell.font = fontHeader;
    cell.alignment = { horizontal: colIdx === 1 ? 'left' : 'center', vertical: 'middle' };
    cell.border = borderThin;
  });
  currentRow++;

  const roomSubtotalRowIndices: { 
    roomId: string; 
    roomName: string; 
    worksTotalRow: number; 
    matsTotalRow: number; 
    roomTotalRow: number;
    worksCount: number;
  }[] = [];

  // ТАБЛИЧНАЯ ЧАСТЬ ПО КОМНАТАМ
  estimate.rooms.forEach((room, roomIdx) => {
    // Шапка помещения
    ws.mergeCells(currentRow, 1, currentRow, totalCols);
    const roomHeaderCell = ws.getCell(currentRow, 1);
    roomHeaderCell.value = `ПОМЕЩЕНИЕ ${roomIdx + 1}: ${room.roomName.toUpperCase()} (S пола = ${room.floorArea} м², S стен = ${room.wallNetArea} м², P = ${room.perimeter} м${room.doorsCount ? `, Дверей: ${room.doorsCount}` : ''}${room.windowsCount ? `, Окон: ${room.windowsCount}` : ''})`;
    roomHeaderCell.fill = fillRoomHeader;
    roomHeaderCell.font = fontRoomHeader;
    roomHeaderCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    ws.getRow(currentRow).height = 22;
    currentRow++;

    // 1. РАБОТЫ
    ws.mergeCells(currentRow, 1, currentRow, totalCols);
    const worksSecCell = ws.getCell(currentRow, 1);
    worksSecCell.value = '1. РЕМОНТНО-ОТДЕЛОЧНЫЕ РАБОТЫ';
    worksSecCell.fill = fillSectionWorks;
    worksSecCell.font = fontSection;
    worksSecCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    ws.getRow(currentRow).height = 19;
    currentRow++;

    const worksStartRow = currentRow;
    if (room.works.length === 0) {
      ws.mergeCells(currentRow, 1, currentRow, totalCols);
      const emptyCell = ws.getCell(currentRow, 1);
      emptyCell.value = '— Нет назначенных работ —';
      emptyCell.font = fontSubtitle;
      emptyCell.alignment = { horizontal: 'center', vertical: 'middle' };
      ws.getRow(currentRow).height = 18;
      currentRow++;
    } else {
      room.works.forEach((w, wIdx) => {
        const row = ws.getRow(currentRow);
        row.height = 19;

        row.getCell(1).value = `${roomIdx + 1}.${wIdx + 1}`;
        row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(1).border = borderThin;

        row.getCell(2).value = w.name;
        row.getCell(2).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
        row.getCell(2).border = borderThin;

        row.getCell(3).value = w.unit;
        row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(3).border = borderThin;

        row.getCell(4).value = w.quantity;
        row.getCell(4).numFmt = '#,##0.00';
        row.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
        row.getCell(4).border = borderThin;

        if (!hidePrices) {
          row.getCell(5).value = w.unitPrice;
          row.getCell(5).numFmt = '#,##0';
          row.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
          row.getCell(5).border = borderThin;

          row.getCell(6).value = { formula: `D${currentRow}*E${currentRow}`, result: w.total };
          row.getCell(6).numFmt = '#,##0';
          row.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };
          row.getCell(6).border = borderThin;
          row.getCell(6).font = { bold: true };
        }

        currentRow++;
      });
    }
    const worksEndRow = currentRow - 1;

    let worksTotalRowIdx = currentRow;
    if (!hidePrices) {
      // Итог по работам помещения в рублях
      ws.mergeCells(currentRow, 1, currentRow, 5);
      const worksSubCell = ws.getCell(currentRow, 1);
      worksSubCell.value = `Итого работы (${room.roomName}):`;
      worksSubCell.font = fontSubtotal;
      worksSubCell.fill = fillSubtotal;
      worksSubCell.alignment = { horizontal: 'right', vertical: 'middle' };
      worksSubCell.border = borderThin;

      const worksSumCell = ws.getCell(currentRow, 6);
      if (room.works.length > 0) {
        worksSumCell.value = { formula: `SUM(F${worksStartRow}:F${worksEndRow})`, result: room.worksTotal };
      } else {
        worksSumCell.value = 0;
      }
      worksSumCell.numFmt = '#,##0';
      worksSumCell.font = fontSubtotal;
      worksSumCell.fill = fillSubtotal;
      worksSumCell.alignment = { horizontal: 'right', vertical: 'middle' };
      worksSumCell.border = borderThin;
      ws.getRow(currentRow).height = 20;
      currentRow++;
    }

    // 2. ЧЕРНОВЫЕ И РАСХОДНЫЕ МАТЕРИАЛЫ
    let matsTotalRowIdx = currentRow;
    if (includeMaterials) {
      ws.mergeCells(currentRow, 1, currentRow, totalCols);
      const matsSecCell = ws.getCell(currentRow, 1);
      matsSecCell.value = '2. ЧЕРНОВЫЕ И РАСХОДНЫЕ МАТЕРИАЛЫ';
      matsSecCell.fill = fillSectionMats;
      matsSecCell.font = fontSectionMats;
      matsSecCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
      ws.getRow(currentRow).height = 19;
      currentRow++;

      const matsStartRow = currentRow;
      if (room.materials.length === 0) {
        ws.mergeCells(currentRow, 1, currentRow, totalCols);
        const emptyCell = ws.getCell(currentRow, 1);
        emptyCell.value = '— Нет расчетных материалов —';
        emptyCell.font = fontSubtitle;
        emptyCell.alignment = { horizontal: 'center', vertical: 'middle' };
        ws.getRow(currentRow).height = 18;
        currentRow++;
      } else {
        room.materials.forEach((m, mIdx) => {
          const row = ws.getRow(currentRow);
          row.height = 19;

          row.getCell(1).value = `М-${roomIdx + 1}.${mIdx + 1}`;
          row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
          row.getCell(1).border = borderThin;

          const matDisplayName = m.physicalQuantity 
            ? `${m.name} (расход: ~${m.physicalQuantity} ${m.physicalUnit || ''})`
            : m.name;
          row.getCell(2).value = matDisplayName;
          row.getCell(2).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
          row.getCell(2).border = borderThin;

          row.getCell(3).value = m.unit;
          row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
          row.getCell(3).border = borderThin;

          row.getCell(4).value = m.quantity;
          row.getCell(4).numFmt = '#,##0.00';
          row.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
          row.getCell(4).border = borderThin;

          if (!hidePrices) {
            row.getCell(5).value = m.unitPrice;
            row.getCell(5).numFmt = '#,##0';
            row.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
            row.getCell(5).border = borderThin;

            row.getCell(6).value = { formula: `D${currentRow}*E${currentRow}`, result: m.total };
            row.getCell(6).numFmt = '#,##0';
            row.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };
            row.getCell(6).border = borderThin;
            row.getCell(6).font = { bold: true };
          }

          currentRow++;
        });
      }
      const matsEndRow = currentRow - 1;

      if (!hidePrices) {
        matsTotalRowIdx = currentRow;
        ws.mergeCells(currentRow, 1, currentRow, 5);
        const matsSubCell = ws.getCell(currentRow, 1);
        matsSubCell.value = `Итого материалы (${room.roomName}):`;
        matsSubCell.font = fontSubtotal;
        matsSubCell.fill = fillSubtotal;
        matsSubCell.alignment = { horizontal: 'right', vertical: 'middle' };
        matsSubCell.border = borderThin;

        const matsSumCell = ws.getCell(currentRow, 6);
        if (room.materials.length > 0) {
          matsSumCell.value = { formula: `SUM(F${matsStartRow}:F${matsEndRow})`, result: room.materialsTotal };
        } else {
          matsSumCell.value = 0;
        }
        matsSumCell.numFmt = '#,##0';
        matsSumCell.font = fontSubtotal;
        matsSumCell.fill = fillSubtotal;
        matsSumCell.alignment = { horizontal: 'right', vertical: 'middle' };
        matsSumCell.border = borderThin;
        ws.getRow(currentRow).height = 20;
        currentRow++;
      }
    }

    let roomTotalRowIdx = currentRow;
    if (!hidePrices) {
      // ИТОГО ПО ВСЕМУ ПОМЕЩЕНИЮ (РАБОТЫ + МАТЕРИАЛЫ)
      ws.mergeCells(currentRow, 1, currentRow, 5);
      const roomSubCell = ws.getCell(currentRow, 1);
      roomSubCell.value = `ИТОГО ПО ${room.roomName.toUpperCase()}:`;
      roomSubCell.font = { ...fontSubtotal, bold: true, color: { argb: 'FF1E3A8A' } };
      roomSubCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
      roomSubCell.alignment = { horizontal: 'right', vertical: 'middle' };
      roomSubCell.border = borderThin;

      const roomSumCell = ws.getCell(currentRow, 6);
      roomSumCell.value = { formula: `F${worksTotalRowIdx}+F${matsTotalRowIdx}`, result: room.grandTotal };
      roomSumCell.numFmt = '#,##0';
      roomSumCell.font = { ...fontSubtotal, bold: true, color: { argb: 'FF1E3A8A' } };
      roomSumCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
      roomSumCell.alignment = { horizontal: 'right', vertical: 'middle' };
      roomSumCell.border = borderThin;
      ws.getRow(currentRow).height = 22;
      currentRow++;
    }

    roomSubtotalRowIndices.push({
      roomId: room.roomId,
      roomName: room.roomName,
      worksTotalRow: worksTotalRowIdx,
      matsTotalRow: matsTotalRowIdx,
      roomTotalRow: roomTotalRowIdx,
      worksCount: room.works.length
    });

    currentRow++;
  });

  // ИТОГОВАЯ СВОДНАЯ ТАБЛИЦА
  currentRow++;
  ws.mergeCells(currentRow, 1, currentRow, totalCols);
  const summaryHeader = ws.getCell(currentRow, 1);
  summaryHeader.value = hidePrices 
    ? 'СВОДНАЯ ВЕДОМОСТЬ ПЛОЩАДЕЙ И ПОМЕЩЕНИЙ' 
    : 'ИТОГОВЫЙ СВОДНЫЙ РАСЧЁТ ПО ОБЪЕКТУ';
  summaryHeader.fill = fillHeader;
  summaryHeader.font = fontHeader;
  summaryHeader.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(currentRow).height = 24;
  currentRow++;

  if (hidePrices) {
    // Сводка без цен
    ws.getRow(currentRow).height = 20;
    ws.getCell(currentRow, 1).value = '№';
    ws.getCell(currentRow, 1).font = fontMetaLabel;
    ws.getCell(currentRow, 1).border = borderThin;

    ws.getCell(currentRow, 2).value = 'Помещение';
    ws.getCell(currentRow, 2).font = fontMetaLabel;
    ws.getCell(currentRow, 2).border = borderThin;

    ws.getCell(currentRow, 3).value = 'S пола, м²';
    ws.getCell(currentRow, 3).font = fontMetaLabel;
    ws.getCell(currentRow, 3).alignment = { horizontal: 'center' };
    ws.getCell(currentRow, 3).border = borderThin;

    ws.getCell(currentRow, 4).value = 'S стен чистая, м²';
    ws.getCell(currentRow, 4).font = fontMetaLabel;
    ws.getCell(currentRow, 4).alignment = { horizontal: 'center' };
    ws.getCell(currentRow, 4).border = borderThin;
    currentRow++;

    const sumStartRow = currentRow;
    estimate.rooms.forEach((r, idx) => {
      const row = ws.getRow(currentRow);
      row.height = 19;
      row.getCell(1).value = idx + 1;
      row.getCell(1).alignment = { horizontal: 'center' };
      row.getCell(1).border = borderThin;

      row.getCell(2).value = r.roomName;
      row.getCell(2).border = borderThin;

      row.getCell(3).value = r.floorArea;
      row.getCell(3).numFmt = '#,##0.00';
      row.getCell(3).alignment = { horizontal: 'center' };
      row.getCell(3).border = borderThin;

      row.getCell(4).value = r.wallNetArea;
      row.getCell(4).numFmt = '#,##0.00';
      row.getCell(4).alignment = { horizontal: 'center' };
      row.getCell(4).border = borderThin;

      currentRow++;
    });
    const sumEndRow = currentRow - 1;

    // Итоговая строка площадей
    const finRow = ws.getRow(currentRow);
    finRow.height = 24;
    finRow.getCell(1).value = 'ИТОГО:';
    finRow.getCell(1).font = fontGrandTotal;
    finRow.getCell(1).fill = fillGrandTotal;
    finRow.getCell(1).border = borderDoubleBottom;

    finRow.getCell(2).value = 'ВСЕГО ПО ОБЪЕКТУ';
    finRow.getCell(2).font = fontGrandTotal;
    finRow.getCell(2).fill = fillGrandTotal;
    finRow.getCell(2).border = borderDoubleBottom;

    finRow.getCell(3).value = { formula: `SUM(C${sumStartRow}:C${sumEndRow})`, result: estimate.totalFloorArea };
    finRow.getCell(3).numFmt = '#,##0.00';
    finRow.getCell(3).font = fontGrandTotal;
    finRow.getCell(3).fill = fillGrandTotal;
    finRow.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
    finRow.getCell(3).border = borderDoubleBottom;

    finRow.getCell(4).value = { formula: `SUM(D${sumStartRow}:D${sumEndRow})`, result: estimate.totalWallNetArea };
    finRow.getCell(4).numFmt = '#,##0.00';
    finRow.getCell(4).font = fontGrandTotal;
    finRow.getCell(4).fill = fillGrandTotal;
    finRow.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
    finRow.getCell(4).border = borderDoubleBottom;

  } else {
    // Сводка с ценами и суммами
    ws.getRow(currentRow).height = 20;
    ws.getCell(currentRow, 1).value = '№';
    ws.getCell(currentRow, 1).font = fontMetaLabel;
    ws.getCell(currentRow, 1).border = borderThin;

    ws.getCell(currentRow, 2).value = 'Помещение';
    ws.getCell(currentRow, 2).font = fontMetaLabel;
    ws.getCell(currentRow, 2).border = borderThin;

    ws.getCell(currentRow, 3).value = 'S пола, м²';
    ws.getCell(currentRow, 3).font = fontMetaLabel;
    ws.getCell(currentRow, 3).alignment = { horizontal: 'center' };
    ws.getCell(currentRow, 3).border = borderThin;

    ws.getCell(currentRow, 4).value = 'Работы, руб.';
    ws.getCell(currentRow, 4).font = fontMetaLabel;
    ws.getCell(currentRow, 4).alignment = { horizontal: 'right' };
    ws.getCell(currentRow, 4).border = borderThin;

    ws.getCell(currentRow, 5).value = 'Материалы, руб.';
    ws.getCell(currentRow, 5).font = fontMetaLabel;
    ws.getCell(currentRow, 5).alignment = { horizontal: 'right' };
    ws.getCell(currentRow, 5).border = borderThin;

    ws.getCell(currentRow, 6).value = 'Итого, руб.';
    ws.getCell(currentRow, 6).font = fontMetaLabel;
    ws.getCell(currentRow, 6).alignment = { horizontal: 'right' };
    ws.getCell(currentRow, 6).border = borderThin;
    currentRow++;

    const summaryStartRow = currentRow;
    roomSubtotalRowIndices.forEach((ri, idx) => {
      const room = estimate.rooms[idx];
      const row = ws.getRow(currentRow);
      row.height = 19;

      row.getCell(1).value = idx + 1;
      row.getCell(1).alignment = { horizontal: 'center' };
      row.getCell(1).border = borderThin;

      row.getCell(2).value = ri.roomName;
      row.getCell(2).border = borderThin;

      row.getCell(3).value = room.floorArea;
      row.getCell(3).numFmt = '#,##0.00';
      row.getCell(3).alignment = { horizontal: 'center' };
      row.getCell(3).border = borderThin;

      row.getCell(4).value = { formula: `F${ri.worksTotalRow}`, result: room.worksTotal };
      row.getCell(4).numFmt = '#,##0';
      row.getCell(4).alignment = { horizontal: 'right' };
      row.getCell(4).border = borderThin;

      row.getCell(5).value = { formula: `F${ri.matsTotalRow}`, result: room.materialsTotal };
      row.getCell(5).numFmt = '#,##0';
      row.getCell(5).alignment = { horizontal: 'right' };
      row.getCell(5).border = borderThin;

      row.getCell(6).value = { formula: `D${currentRow}+E${currentRow}`, result: room.grandTotal };
      row.getCell(6).numFmt = '#,##0';
      row.getCell(6).font = { bold: true };
      row.getCell(6).alignment = { horizontal: 'right' };
      row.getCell(6).border = borderThin;

      currentRow++;
    });
    const summaryEndRow = currentRow - 1;

    // ИТОГО ПО ОБЪЕКТУ СВОДНОЕ
    const finalRow = ws.getRow(currentRow);
    finalRow.height = 24;

    finalRow.getCell(1).value = 'ВСЕГО:';
    finalRow.getCell(1).font = fontGrandTotal;
    finalRow.getCell(1).fill = fillGrandTotal;
    finalRow.getCell(1).border = borderDoubleBottom;

    finalRow.getCell(2).value = 'ИТОГО ПО ВСЕМ ПОМЕЩЕНИЯМ';
    finalRow.getCell(2).font = fontGrandTotal;
    finalRow.getCell(2).fill = fillGrandTotal;
    finalRow.getCell(2).border = borderDoubleBottom;

    finalRow.getCell(3).value = estimate.totalFloorArea;
    finalRow.getCell(3).numFmt = '#,##0.00';
    finalRow.getCell(3).font = fontGrandTotal;
    finalRow.getCell(3).fill = fillGrandTotal;
    finalRow.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
    finalRow.getCell(3).border = borderDoubleBottom;

    finalRow.getCell(4).value = { formula: `SUM(D${summaryStartRow}:D${summaryEndRow})`, result: estimate.totalWorksPrice };
    finalRow.getCell(4).numFmt = '#,##0';
    finalRow.getCell(4).font = fontGrandTotal;
    finalRow.getCell(4).fill = fillGrandTotal;
    finalRow.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
    finalRow.getCell(4).border = borderDoubleBottom;

    finalRow.getCell(5).value = { formula: `SUM(E${summaryStartRow}:E${summaryEndRow})`, result: estimate.totalMaterialsPrice };
    finalRow.getCell(5).numFmt = '#,##0';
    finalRow.getCell(5).font = fontGrandTotal;
    finalRow.getCell(5).fill = fillGrandTotal;
    finalRow.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
    finalRow.getCell(5).border = borderDoubleBottom;

    finalRow.getCell(6).value = { formula: `SUM(F${summaryStartRow}:F${summaryEndRow})`, result: estimate.grandTotal };
    finalRow.getCell(6).numFmt = '#,##0';
    finalRow.getCell(6).font = fontGrandTotal;
    finalRow.getCell(6).fill = fillGrandTotal;
    finalRow.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };
    finalRow.getCell(6).border = borderDoubleBottom;
  }

  currentRow += 2;

  // Подписи сторон
  const signRow = ws.getRow(currentRow);
  signRow.height = 20;
  signRow.getCell(2).value = 'Исполнитель: _________________ / ____________ /';
  signRow.getCell(2).font = fontMetaLabel;
  signRow.getCell(hidePrices ? 4 : 5).value = 'Заказчик: _________________ / ____________ /';
  signRow.getCell(hidePrices ? 4 : 5).font = fontMetaLabel;

  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Генерация эталонной сметы на 118 строк по эталону Краснодар (ул. Дангиреева) в Excel
 */
export async function generateTurnkey118Excel(
  clientInfo: { name: string; address: string; phone?: string; contractNumber?: string; date?: string },
  turnkeyRows: { num: number; trade: string; name: string; unit: string; quantity: number; unitPrice: number; total: number; stageName: string; subCategory?: string }[],
  options?: { hidePrices?: boolean; planImageBase64?: string | null }
): Promise<Blob> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Estimate CAD App';
  wb.created = new Date();

  // Лист обмерочного плана (если есть снимок)
  if (options?.planImageBase64) {
    try {
      const wsPlan = wb.addWorksheet('2D Обмерочный план', { views: [{ showGridLines: false }] });
      wsPlan.mergeCells('B2:H2');
      const title = wsPlan.getCell('B2');
      title.value = `2D ОБМЕРОЧНЫЙ ПЛАН ПОМЕЩЕНИЙ С РАЗМЕРАМИ`;
      title.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF1E293B' } };

      const cleanBase64 = options.planImageBase64.replace(/^data:image\/\w+;base64,/, '');
      const imgId = wb.addImage({ base64: cleanBase64, extension: 'png' });
      wsPlan.addImage(imgId, { tl: { col: 1, row: 3 }, ext: { width: 840, height: 520 } });
    } catch (e) {
      console.warn('Не удалось вставить план в Excel:', e);
    }
  }

  const ws = wb.addWorksheet('Смета ремонтно-отделочных работ', {
    views: [{ showGridLines: true }],
    pageSetup: { orientation: 'portrait', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  });

  const hidePrices = !!options?.hidePrices;

  ws.columns = hidePrices ? [
    { key: 'num', width: 7 },
    { key: 'trade', width: 14 },
    { key: 'name', width: 55 },
    { key: 'unit', width: 11 },
    { key: 'qty', width: 14 }
  ] : [
    { key: 'num', width: 7 },
    { key: 'trade', width: 14 },
    { key: 'name', width: 52 },
    { key: 'unit', width: 11 },
    { key: 'qty', width: 12 },
    { key: 'price', width: 14 },
    { key: 'sum', width: 16 }
  ];

  // Шапка договора
  let row = 1;
  ws.mergeCells(`A${row}:G${row}`);
  ws.getCell(`A${row}`).value = `Приложение 1 к договору № ${clientInfo.contractNumber || 'Б/Н'} от ${clientInfo.date || new Date().toLocaleDateString('ru-RU')}`;
  ws.getCell(`A${row}`).font = { name: 'Calibri', size: 10, italic: true };
  row++;

  ws.mergeCells(`A${row}:G${row}`);
  ws.getCell(`A${row}`).value = `Заказчик: ${clientInfo.name || 'Физическое лицо'}  |  Тел: ${clientInfo.phone || ''}`;
  ws.getCell(`A${row}`).font = { name: 'Calibri', size: 11, bold: true };
  row++;

  ws.mergeCells(`A${row}:G${row}`);
  ws.getCell(`A${row}`).value = `Сметный расчёт стоимости ремонтно-отделочных работ  (Н потолка = 3,04 м)`;
  ws.getCell(`A${row}`).font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FF1E293B' } };
  row++;

  ws.mergeCells(`A${row}:G${row}`);
  ws.getCell(`A${row}`).value = `Адрес объекта: ${clientInfo.address || 'г. Краснодар'}`;
  ws.getCell(`A${row}`).font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF2563EB' } };
  row += 2;

  // Заголовки таблицы
  const headerRow = ws.getRow(row);
  headerRow.height = 24;
  headerRow.values = hidePrices 
    ? ['№ п/п', 'Мастера', 'Наименование работ', 'Ед. изм.', 'Кол-во']
    : ['№ п/п', 'Мастера', 'Наименование работ', 'Ед. изм.', 'Кол-во', 'Цена, ₽', 'Сумма, ₽'];

  for (let c = 1; c <= (hidePrices ? 5 : 7); c++) {
    const cell = headerRow.getCell(c);
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    cell.alignment = { horizontal: c <= 3 ? 'left' : 'center', vertical: 'middle' };
  }
  row++;

  // Группируем по этапам
  let currentStage = '';
  let currentSub = '';

  turnkeyRows.forEach((item) => {
    if (item.stageName !== currentStage) {
      currentStage = item.stageName;
      currentSub = '';
      const stageRow = ws.getRow(row);
      stageRow.height = 20;
      ws.mergeCells(`A${row}:G${row}`);
      const c = stageRow.getCell(1);
      c.value = `Раздел: ${currentStage.toUpperCase()}`;
      c.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF1E3A8A' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
      row++;
    }

    if (item.subCategory && item.subCategory !== currentSub) {
      currentSub = item.subCategory;
      const subRow = ws.getRow(row);
      subRow.height = 18;
      ws.mergeCells(`A${row}:G${row}`);
      const c = subRow.getCell(1);
      c.value = `  ▸ Помещение: ${currentSub}`;
      c.font = { name: 'Calibri', size: 10, bold: true, italic: true, color: { argb: 'FF475569' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      row++;
    }

    const itemRow = ws.getRow(row);
    itemRow.height = 18;
    if (hidePrices) {
      itemRow.values = [item.num, item.trade, item.name, item.unit, item.quantity];
    } else {
      itemRow.values = [item.num, item.trade, item.name, item.unit, item.quantity, item.unitPrice, item.total];
    }

    itemRow.getCell(1).alignment = { horizontal: 'center' };
    itemRow.getCell(2).alignment = { horizontal: 'left' };
    itemRow.getCell(3).alignment = { horizontal: 'left' };
    itemRow.getCell(4).alignment = { horizontal: 'center' };
    itemRow.getCell(5).alignment = { horizontal: 'right' };
    itemRow.getCell(5).numFmt = '#,##0.00';

    if (!hidePrices) {
      itemRow.getCell(6).alignment = { horizontal: 'right' };
      itemRow.getCell(6).numFmt = '#,##0';
      itemRow.getCell(7).alignment = { horizontal: 'right' };
      itemRow.getCell(7).numFmt = '#,##0.00';
      itemRow.getCell(7).font = { bold: true };
    }

    for (let c = 1; c <= (hidePrices ? 5 : 7); c++) {
      itemRow.getCell(c).border = {
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
    }
    row++;
  });

  // ИТОГО СТРОКА
  if (!hidePrices) {
    const grandTotalSum = turnkeyRows.reduce((sum, r) => sum + r.total, 0);
    const totalRow = ws.getRow(row);
    totalRow.height = 24;
    ws.mergeCells(`A${row}:F${row}`);
    const cLabel = totalRow.getCell(1);
    cLabel.value = 'ИТОГО ПО СМЕТЕ (РЕМОНТНО-ОТДЕЛОЧНЫЕ РАБОТЫ):';
    cLabel.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF14532D' } };
    cLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
    cLabel.alignment = { horizontal: 'right', vertical: 'middle' };

    const cSum = totalRow.getCell(7);
    cSum.value = grandTotalSum;
    cSum.numFmt = '#,##0.00 "₽"';
    cSum.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF14532D' } };
    cSum.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
    cSum.alignment = { horizontal: 'right', vertical: 'middle' };
    row += 2;
  }

  // Подписи
  const signRow = ws.getRow(row);
  signRow.getCell(2).value = 'Исполнитель: _________________ / ____________ /';
  signRow.getCell(hidePrices ? 4 : 5).value = 'Заказчик: _________________ / ____________ /';

  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export function downloadEstimateExcel(blob: Blob, filename?: string): void {
  const safeName = filename || `Смета_Краснодар_${new Date().toISOString().slice(0, 10)}.xlsx`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = safeName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
