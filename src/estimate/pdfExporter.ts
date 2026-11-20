import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { CalculatedProjectEstimate, EstimateExportOptions } from './types';

export async function generateEstimatePdf(
  estimate: CalculatedProjectEstimate,
  options?: Partial<EstimateExportOptions>
): Promise<Blob> {
  const hidePrices = !!options?.hidePrices;
  const isWorksOnly = options?.exportScope === 'works' || (options?.includeMaterials === false && options?.exportScope !== 'materials');
  const isMatsOnly = options?.exportScope === 'materials';
  const includeMaterials = !isWorksOnly && (options?.includeMaterials !== false || isMatsOnly);
  const includePlan = !!options?.includePlanImage && !!options?.planImageBase64;

  const formatPrice = (val: number) => new Intl.NumberFormat('ru-RU').format(Math.round(val));

  // 1. Создаем временный DOM контейнер для рендера документа А4
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '800px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = 'Segoe UI, Arial, sans-serif';
  container.style.padding = '32px 36px';
  container.style.boxSizing = 'border-box';
  container.style.zIndex = '-999';

  const docTitle = isWorksOnly
    ? (hidePrices ? 'ВЕДОМОСТЬ ОБЪЁМОВ ОТДЕЛОЧНЫХ РАБОТ' : 'СМЕТНЫЙ РАСЧЁТ СТОИМОСТИ ОТДЕЛОЧНЫХ РАБОТ')
    : isMatsOnly
    ? (hidePrices ? 'ВЕДОМОСТЬ ПОТРЕБНОСТИ МАТЕРИАЛОВ' : 'ВЕДОМОСТЬ РАСХОДА И СТОИМОСТИ МАТЕРИАЛОВ')
    : (hidePrices ? 'ВЕДОМОСТЬ ОБЪЁМОВ РАБОТ И МАТЕРИАЛОВ' : 'СМЕТНЫЙ РАСЧЁТ СТОИМОСТИ РЕМОНТНЫХ РАБОТ И МАТЕРИАЛОВ');

  const docSubTitle = isWorksOnly
    ? 'Договорная смета на отделочные работы по помещениям | Краснодар'
    : isMatsOnly
    ? 'Нормативная спецификация черновых материалов для снабжения объекта'
    : 'Среднерыночные расценки г. Краснодар | Договорная смета';

  // Внутреннее содержимое документа
  container.innerHTML = `
    <!-- ШАПКА ДОКУМЕНТА -->
    <div style="border-bottom: 2px solid #1e293b; padding-bottom: 12px; margin-bottom: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h1 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: -0.02em;">
            ${docTitle}
          </h1>
          <div style="font-size: 11px; color: #64748b;">
            ${docSubTitle}
          </div>
        </div>
        <div style="text-align: right; font-size: 11px; color: #475569;">
          <div><b>Дата:</b> ${estimate.estimateDate}</div>
          <div><b>Договор №:</b> ${estimate.contractNumber}</div>
        </div>
      </div>
    </div>

    <!-- РЕКВИЗИТЫ ЗАКАЗЧИКА И ОБЪЕКТА -->
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 18px; font-size: 11px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
      <div>
        <div style="margin-bottom: 4px;"><b>Заказчик:</b> ${estimate.clientName || 'Физическое лицо'}</div>
        <div style="margin-bottom: 4px;"><b>Телефон:</b> ${estimate.clientPhone || '+7 (___) ___-__-__'}</div>
      </div>
      <div>
        <div style="margin-bottom: 4px;"><b>Адрес объекта:</b> ${estimate.clientAddress || 'г. Краснодар'}</div>
        <div style="margin-bottom: 4px;"><b>Параметры объекта:</b> S пола = <b>${estimate.totalFloorArea} м²</b> | S стен = <b>${estimate.totalWallNetArea} м²</b></div>
      </div>
    </div>

    <!-- 2D ОБМЕРОЧНЫЙ ПЛАН (ЕСЛИ ВКЛЮЧЕНА ГАЛОЧКА) -->
    ${includePlan && options?.planImageBase64 ? `
      <div style="margin-bottom: 24px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; background: #ffffff;">
        <div style="font-size: 12px; font-weight: 700; color: #1e293b; margin-bottom: 8px; display: flex; justify-content: space-between;">
          <span>2D ОБМЕРОЧНЫЙ ПЛАН ПОМЕЩЕНИЙ С РАЗМЕРАМИ</span>
          <span style="font-size: 10px; color: #64748b; font-weight: normal;">Масштаб плана: 1:1</span>
        </div>
        <div style="text-align: center; overflow: hidden; max-height: 440px;">
          <img src="${options.planImageBase64}" style="max-width: 100%; max-height: 420px; object-fit: contain; border-radius: 4px;" alt="Обмерочный план" />
        </div>
      </div>
    ` : ''}

    <!-- ТАБЛИЧНАЯ ЧАСТЬ ПО КОМНАТАМ -->
    <div style="margin-bottom: 20px;">
      ${estimate.rooms.map((room, rIdx) => `
        <div style="margin-bottom: 20px; page-break-inside: avoid;">
          <!-- Шапка комнаты -->
          <div style="background-color: #2563eb; color: #ffffff; padding: 6px 10px; font-size: 11px; font-weight: 700; border-radius: 6px 6px 0 0; display: flex; justify-content: space-between; align-items: center;">
            <span>ПОМЕЩЕНИЕ ${rIdx + 1}: ${room.roomName.toUpperCase()}</span>
            <span style="font-size: 10px; font-weight: normal; opacity: 0.9;">
              S пола: ${room.floorArea} м² | S стен: ${room.wallNetArea} м² | P: ${room.perimeter} м
              ${room.doorsCount ? ` | Дверей: ${room.doorsCount}` : ''}
              ${room.windowsCount ? ` | Окон: ${room.windowsCount}` : ''}
            </span>
          </div>

          <!-- Таблица работ комнаты -->
          <table style="width: 100%; border-collapse: collapse; font-size: 10px; border: 1px solid #cbd5e1; border-top: none;">
            <thead>
              <tr style="background-color: #f1f5f9; color: #334155; border-bottom: 1px solid #cbd5e1;">
                <th style="padding: 5px 6px; width: 36px; text-align: center; border-right: 1px solid #cbd5e1;">№</th>
                <th style="padding: 5px 8px; text-align: left; border-right: 1px solid #cbd5e1;">Наименование работ и материалов</th>
                <th style="padding: 5px 6px; width: 60px; text-align: center; border-right: 1px solid #cbd5e1;">Ед. изм.</th>
                <th style="padding: 5px 8px; width: 75px; text-align: right; border-right: 1px solid #cbd5e1;">Объем</th>
                ${!hidePrices ? `
                  <th style="padding: 5px 8px; width: 80px; text-align: right; border-right: 1px solid #cbd5e1;">Цена, ₽</th>
                  <th style="padding: 5px 8px; width: 95px; text-align: right;">Сумма, ₽</th>
                ` : ''}
              </tr>
            </thead>
            <tbody>
              <!-- Подраздел: Работы -->
              ${!isMatsOnly ? `
                <tr style="background-color: #f8fafc; font-weight: 700; color: #1e293b; border-bottom: 1px solid #e2e8f0;">
                  <td colspan="${hidePrices ? 4 : 6}" style="padding: 4px 8px; font-size: 9px; text-transform: uppercase;">
                    1. Ремонтно-отделочные работы
                  </td>
                </tr>
                ${room.works.filter(w => (Number(w.quantity) || 0) > 0 && (Number(w.total) || 0) > 0).length === 0 ? `
                  <tr><td colspan="${hidePrices ? 4 : 6}" style="padding: 6px; text-align: center; color: #94a3b8; font-style: italic;">— Нет назначенных работ —</td></tr>
                ` : room.works.filter(w => (Number(w.quantity) || 0) > 0 && (Number(w.total) || 0) > 0).map((w, wIdx) => `
                  <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 4px 6px; text-align: center; border-right: 1px solid #e2e8f0; color: #64748b;">${rIdx + 1}.${wIdx + 1}</td>
                    <td style="padding: 4px 8px; border-right: 1px solid #e2e8f0; color: #0f172a;">${w.name}</td>
                    <td style="padding: 4px 6px; text-align: center; border-right: 1px solid #e2e8f0; color: #475569;">${w.unit}</td>
                    <td style="padding: 4px 8px; text-align: right; border-right: 1px solid #e2e8f0; font-family: monospace; font-weight: 600;">${w.quantity}</td>
                    ${!hidePrices ? `
                      <td style="padding: 4px 8px; text-align: right; border-right: 1px solid #e2e8f0; font-family: monospace;">${formatPrice(w.unitPrice)}</td>
                      <td style="padding: 4px 8px; text-align: right; font-family: monospace; font-weight: 700; color: #1e3a8a;">${formatPrice(w.total)}</td>
                    ` : ''}
                  </tr>
                `).join('')}
              ` : ''}

              <!-- Подраздел: Материалы -->
              ${includeMaterials && room.materials.filter(m => (Number(m.quantity) || 0) > 0 && (Number(m.total) || 0) > 0).length > 0 ? `
                <tr style="background-color: #fefce8; font-weight: 700; color: #854d0e; border-bottom: 1px solid #fef08a; border-top: 1px solid #e2e8f0;">
                  <td colspan="${hidePrices ? 4 : 6}" style="padding: 4px 8px; font-size: 9px; text-transform: uppercase;">
                    2. Черновые и расходные материалы
                  </td>
                </tr>
                ${room.materials.filter(m => (Number(m.quantity) || 0) > 0 && (Number(m.total) || 0) > 0).map((m, mIdx) => `
                  <tr style="border-bottom: 1px solid #fefce8;">
                    <td style="padding: 4px 6px; text-align: center; border-right: 1px solid #e2e8f0; color: #854d0e;">М-${mIdx + 1}</td>
                    <td style="padding: 4px 8px; border-right: 1px solid #e2e8f0; color: #1c1917;">
                      ${m.name}${m.physicalQuantity ? `<span style="font-size: 9px; color: #854d0e; display: block;">расход: ~${m.physicalQuantity} ${m.physicalUnit || ''}</span>` : ''}
                    </td>
                    <td style="padding: 4px 6px; text-align: center; border-right: 1px solid #e2e8f0; color: #44403c;">${m.unit}</td>
                    <td style="padding: 4px 8px; text-align: right; border-right: 1px solid #e2e8f0; font-family: monospace; font-weight: 600;">${m.quantity}</td>
                    ${!hidePrices ? `
                      <td style="padding: 4px 8px; text-align: right; border-right: 1px solid #e2e8f0; font-family: monospace;">${formatPrice(m.unitPrice)}</td>
                      <td style="padding: 4px 8px; text-align: right; font-family: monospace; font-weight: 700; color: #854d0e;">${formatPrice(m.total)}</td>
                    ` : ''}
                  </tr>
                `).join('')}
              ` : ''}

              <!-- Итоги по помещению -->
              ${!hidePrices ? `
                <tr style="background-color: #eff6ff; font-weight: 700; border-top: 1px solid #bfdbfe;">
                  <td colspan="5" style="padding: 5px 8px; text-align: right; color: #1e3a8a;">
                    ИТОГО ПО ${room.roomName.toUpperCase()}:
                  </td>
                  <td style="padding: 5px 8px; text-align: right; font-family: monospace; font-size: 11px; color: #1e3a8a;">
                    ${formatPrice(room.grandTotal)} ₽
                  </td>
                </tr>
              ` : ''}
            </tbody>
          </table>
        </div>
      `).join('')}
    </div>

    <!-- СВОДНАЯ ИТОГОВАЯ ТАБЛИЦА -->
    <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin-bottom: 24px; page-break-inside: avoid;">
      <div style="font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 8px; text-transform: uppercase;">
        ${hidePrices ? 'Сводная ведомость площадей по объекту' : 'Итоговый сводный расчет стоимости'}
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
        <thead>
          <tr style="border-bottom: 1px solid #cbd5e1; color: #475569;">
            <th style="padding: 4px 6px; text-align: left;">Помещение</th>
            <th style="padding: 4px 6px; text-align: center;">S пола, м²</th>
            <th style="padding: 4px 6px; text-align: center;">S стен чистая, м²</th>
            ${!hidePrices ? `
              <th style="padding: 4px 6px; text-align: right;">Работы, ₽</th>
              <th style="padding: 4px 6px; text-align: right;">Материалы, ₽</th>
              <th style="padding: 4px 6px; text-align: right;">Итого, ₽</th>
            ` : ''}
          </tr>
        </thead>
        <tbody>
          ${estimate.rooms.map(r => `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 4px 6px; font-weight: 600;">${r.roomName}</td>
              <td style="padding: 4px 6px; text-align: center; font-family: monospace;">${r.floorArea}</td>
              <td style="padding: 4px 6px; text-align: center; font-family: monospace;">${r.wallNetArea}</td>
              ${!hidePrices ? `
                <td style="padding: 4px 6px; text-align: right; font-family: monospace;">${formatPrice(r.worksTotal)}</td>
                <td style="padding: 4px 6px; text-align: right; font-family: monospace;">${formatPrice(r.materialsTotal)}</td>
                <td style="padding: 4px 6px; text-align: right; font-family: monospace; font-weight: 700;">${formatPrice(r.grandTotal)}</td>
              ` : ''}
            </tr>
          `).join('')}
          <!-- Строка Всего -->
          <tr style="background-color: #dcfce7; font-weight: 800; font-size: 11px; border-top: 2px solid #22c55e;">
            <td style="padding: 6px; color: #14532d;">ВСЕГО ПО ОБЪЕКТУ:</td>
            <td style="padding: 6px; text-align: center; font-family: monospace; color: #14532d;">${estimate.totalFloorArea}</td>
            <td style="padding: 6px; text-align: center; font-family: monospace; color: #14532d;">${estimate.totalWallNetArea}</td>
            ${!hidePrices ? `
              <td style="padding: 6px; text-align: right; font-family: monospace; color: #14532d;">${formatPrice(estimate.totalWorksPrice)}</td>
              <td style="padding: 6px; text-align: right; font-family: monospace; color: #14532d;">${formatPrice(estimate.totalMaterialsPrice)}</td>
              <td style="padding: 6px; text-align: right; font-family: monospace; color: #14532d; font-size: 12px;">${formatPrice(estimate.grandTotal)} ₽</td>
            ` : ''}
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ПОДПИСИ СТОРОН -->
    <div style="display: flex; justify-content: space-between; font-size: 11px; color: #334155; margin-top: 24px; padding-top: 12px; border-top: 1px dashed #cbd5e1; page-break-inside: avoid;">
      <div>
        <div><b>Исполнитель / Подрядчик:</b></div>
        <div style="margin-top: 18px;">______________________ / ______________________ /</div>
      </div>
      <div style="text-align: right;">
        <div><b>Заказчик:</b></div>
        <div style="margin-top: 18px;">______________________ / ______________________ /</div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    // 2. Рендерим HTML в canvas высокого разрешения (scale: 2)
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    // 3. Создаем PDF документ А4 (210 × 297 мм)
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = 210;
    const pdfHeight = 297;
    const margin = 10;
    const contentWidth = pdfWidth - margin * 2; // 190 мм

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const totalPdfHeight = (imgHeight * contentWidth) / imgWidth;

    const pageContentHeight = pdfHeight - margin * 2; // 277 мм

    let heightLeft = totalPdfHeight;
    let position = 0;

    // Первый лист
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = imgWidth;
    pageCanvas.height = Math.min(imgHeight, (pageContentHeight * imgWidth) / contentWidth);
    const pctx = pageCanvas.getContext('2d');

    if (pctx) {
      pctx.fillStyle = '#ffffff';
      pctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      pctx.drawImage(canvas, 0, 0);
      const pageData = pageCanvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(pageData, 'JPEG', margin, margin, contentWidth, (pageCanvas.height * contentWidth) / imgWidth);
    }

    heightLeft -= pageContentHeight;
    position += pageContentHeight;

    // Последующие листы при переносе
    while (heightLeft > 0) {
      pdf.addPage();
      const nextCanvas = document.createElement('canvas');
      nextCanvas.width = imgWidth;
      const currentChunkHeightPx = Math.min(
        imgHeight - (position * imgWidth) / contentWidth,
        (pageContentHeight * imgWidth) / contentWidth
      );
      nextCanvas.height = currentChunkHeightPx;
      const nextCtx = nextCanvas.getContext('2d');
      if (nextCtx) {
        nextCtx.fillStyle = '#ffffff';
        nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
        nextCtx.drawImage(
          canvas,
          0,
          (position * imgWidth) / contentWidth,
          imgWidth,
          currentChunkHeightPx,
          0,
          0,
          imgWidth,
          currentChunkHeightPx
        );
        const nextData = nextCanvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(nextData, 'JPEG', margin, margin, contentWidth, (currentChunkHeightPx * contentWidth) / imgWidth);
      }
      heightLeft -= pageContentHeight;
      position += pageContentHeight;
    }

    const pdfBlob = pdf.output('blob');
    if (!options?.skipAutoSave) {
      const safeAddr = (estimate.clientAddress || 'Краснодар').replace(/[/\\?%*:|"<>]/g, '_').slice(0, 24);
      const prefix = hidePrices ? 'Ведомость_Заказчик' : 'Смета';
      pdf.save(`${prefix}_${safeAddr}_${estimate.contractNumber}.pdf`);
    }
    return pdfBlob;
  } finally {
    document.body.removeChild(container);
  }
}

export interface ClientProposalOptions {
  planImageBase64?: string | null;
  logoBase64?: string | null;
  companyName?: string;
  companyPhone?: string;
  companyTagline?: string;
  priceMode?: 'total_only' | 'stages';
  totalPrice?: number;
  stages?: { stageName: string; total: number }[];
  completionDays?: string;
  warrantyMonths?: number;
  skipAutoSave?: boolean;
}

/**
 * Генерация презентабельного Коммерческого Предложения (КП) для Заказчика в PDF:
 * - Шапка с логотипом/эмблемой компании
 * - Реквизиты объекта и заказчика
 * - 2D обмерочный план с размерами
 * - Финансовая часть: только итоговая стоимость ИЛИ сводка по крупным этапам
 * - Гарантии, подписи и печать
 */
export async function generateClientProposalPdf(
  estimate: CalculatedProjectEstimate,
  options?: ClientProposalOptions
): Promise<Blob> {
  const formatPrice = (val: number) => new Intl.NumberFormat('ru-RU').format(Math.round(val));
  const finalPrice = options?.totalPrice !== undefined ? options.totalPrice : estimate.grandTotal;
  const priceMode = options?.priceMode || 'total_only';
  const companyName = options?.companyName || 'РЕМОНТНО-СТРОИТЕЛЬНАЯ КОМПАНИЯ';
  const companyPhone = options?.companyPhone || '+7 (918) 000-00-00';
  const companyTagline = options?.companyTagline || 'Качественный ремонт и отделка квартир под ключ в Краснодаре и крае';
  const completionDays = options?.completionDays || '45-60 рабочих дней';
  const warrantyMonths = options?.warrantyMonths || 24;

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '800px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = 'Segoe UI, -apple-system, Roboto, Arial, sans-serif';
  container.style.padding = '32px 36px';
  container.style.boxSizing = 'border-box';
  container.style.zIndex = '-999';

  container.innerHTML = `
    <!-- ФИРМЕННАЯ ШАПКА С ЭМБЛЕМОЙ -->
    <div style="border-bottom: 2px solid #2563eb; padding-bottom: 14px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
      <div style="display: flex; align-items: center; gap: 14px;">
        ${options?.logoBase64 ? `
          <img src="${options.logoBase64}" style="max-height: 48px; max-width: 140px; object-fit: contain;" alt="Логотип" />
        ` : `
          <div style="width: 44px; height: 44px; border-radius: 8px; background: linear-gradient(135deg, #1e3a8a, #2563eb); color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 18px; letter-spacing: -1px; box-shadow: 0 2px 4px rgba(37,99,235,0.2);">
            СК
          </div>
        `}
        <div>
          <div style="font-size: 16px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: -0.01em;">
            ${companyName}
          </div>
          <div style="font-size: 11px; color: #64748b; font-weight: 500;">
            ${companyTagline}
          </div>
          <div style="font-size: 11px; color: #2563eb; font-weight: 700; margin-top: 2px;">
            📞 ${companyPhone}
          </div>
        </div>
      </div>

      <div style="text-align: right; font-size: 11px; color: #334155; line-height: 1.4;">
        <div style="display: inline-block; background-color: #eff6ff; color: #1d4ed8; font-weight: 700; padding: 4px 8px; rounded: 4px; border: 1px solid #bfdbfe; margin-bottom: 4px; border-radius: 4px;">
          КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ
        </div>
        <div><b>№ объекта:</b> ${estimate.contractNumber}</div>
        <div><b>Дата:</b> ${estimate.estimateDate}</div>
      </div>
    </div>

    <!-- КАРТОЧКА ОБЪЕКТА И ЗАКАЗЧИКА -->
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; margin-bottom: 18px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 11px;">
      <div>
        <div style="margin-bottom: 4px;"><span style="color: #64748b;">Заказчик:</span> <b>${estimate.clientName || 'Физическое лицо'}</b></div>
        <div><span style="color: #64748b;">Телефон:</span> <b>${estimate.clientPhone || 'Не указан'}</b></div>
      </div>
      <div>
        <div style="margin-bottom: 4px;"><span style="color: #64748b;">Адрес объекта:</span> <b>${estimate.clientAddress || 'г. Краснодар'}</b></div>
        <div><span style="color: #64748b;">Характеристики:</span> <b>S пола = ${estimate.totalFloorArea} м²</b> | Потолки: <b>${estimate.rooms[0]?.ceilingArea ? '3.04 м' : '3.04 м'}</b></div>
      </div>
    </div>

    <!-- 2D ОБМЕРОЧНЫЙ ПЛАН ПОМЕЩЕНИЙ -->
    ${options?.planImageBase64 ? `
      <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; background: #ffffff; margin-bottom: 20px; page-break-inside: avoid;">
        <div style="font-size: 11px; font-weight: 700; color: #1e293b; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
          <span style="display: flex; align-items: center; gap: 6px;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background-color: #2563eb;"></span>
            2D ОБМЕРОЧНЫЙ ПЛАН ПОМЕЩЕНИЙ С РАЗМЕРАМИ
          </span>
          <span style="font-size: 10px; color: #64748b; font-weight: normal;">Масштаб 1:1 · Краснодар</span>
        </div>
        <div style="text-align: center; overflow: hidden; max-height: 400px; display: flex; align-items: center; justify-content: center; background: #fafafa; border-radius: 6px; padding: 6px;">
          <img src="${options.planImageBase64}" style="max-width: 100%; max-height: 380px; object-fit: contain;" alt="План помещений" />
        </div>
      </div>
    ` : ''}

    <!-- СТОИМОСТЬ И КОММЕРЧЕСКИЕ УСЛОВИЯ -->
    <div style="margin-bottom: 20px; page-break-inside: avoid;">
      ${priceMode === 'stages' && options?.stages && options.stages.length > 0 ? `
        <!-- РЕЖИМ 1: СВОДКА ПО ЭТАПАМ РАБОТ -->
        <div style="border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; margin-bottom: 16px;">
          <div style="background-color: #1e293b; color: #ffffff; padding: 8px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase;">
            Сводная стоимость ремонтно-отделочных работ по этапам
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
            <tbody>
              ${options.stages.map((st, idx) => `
                <tr style="border-bottom: 1px solid #f1f5f9; background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                  <td style="padding: 6px 12px; color: #475569; width: 30px;">#${idx + 1}</td>
                  <td style="padding: 6px 12px; font-weight: 600; color: #1e293b;">${st.stageName}</td>
                  <td style="padding: 6px 12px; text-align: right; font-family: monospace; font-weight: 700; color: #0f172a;">${formatPrice(st.total)} ₽</td>
                </tr>
              `).join('')}
              <tr style="background-color: #dbeafe; font-weight: 800; font-size: 12px; border-top: 2px solid #2563eb;">
                <td colspan="2" style="padding: 8px 12px; color: #1e3a8a;">ИТОГОВАЯ СТОИМОСТЬ ВСЕХ РАБОТ ПО ОБЪЕКТУ:</td>
                <td style="padding: 8px 12px; text-align: right; font-family: monospace; color: #1e3a8a; font-size: 14px;">${formatPrice(finalPrice)} ₽</td>
              </tr>
            </tbody>
          </table>
        </div>
      ` : `
        <!-- РЕЖИМ 2: ТОЛЬКО ИТОГОВАЯ ФИКСИРОВАННАЯ СУММА -->
        <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #22c55e; border-radius: 10px; padding: 18px 22px; margin-bottom: 16px; box-shadow: 0 2px 6px rgba(34,197,94,0.12);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="font-size: 13px; font-weight: 800; color: #14532d; text-transform: uppercase; letter-spacing: 0.02em;">
              ИТОГОВАЯ СТОИМОСТЬ РЕМОНТНЫХ РАБОТ ПО ОБЪЕКТУ:
            </div>
            <div style="font-size: 22px; font-weight: 900; color: #15803d; font-family: monospace; letter-spacing: -0.5px;">
              ${formatPrice(finalPrice)} ₽
            </div>
          </div>
          <div style="font-size: 11px; color: #166534; line-height: 1.5; border-top: 1px dashed #86efac; padding-top: 8px;">
            В стоимость включен полный комплекс ремонтно-отделочных работ под ключ согласно утвержденному обмерочному плану: подготовка, электромонтаж, сантехника, штукатурка стен, плиточные работы, полы, малярные работы с обоями и откосами, натяжные потолки, двери, вывоз мусора и финишный клининг.
          </div>
        </div>
      `}

      <!-- ГАРАНТИИ И СРОКИ -->
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; font-size: 10px; color: #475569; margin-bottom: 18px;">
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 10px;">
          <div style="font-weight: 700; color: #1e293b; margin-bottom: 2px;">⏱ Срок реализации:</div>
          <div>${completionDays}</div>
        </div>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 10px;">
          <div style="font-weight: 700; color: #1e293b; margin-bottom: 2px;">🛡 Гарантия по договору:</div>
          <div>${warrantyMonths} месяца на все работы</div>
        </div>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 10px;">
          <div style="font-weight: 700; color: #1e293b; margin-bottom: 2px;">💳 Порядок оплаты:</div>
          <div>Поэтапно, по факту приемки работ</div>
        </div>
      </div>
    </div>

    <!-- ПОДПИСИ СТОРОН -->
    <div style="display: flex; justify-content: space-between; font-size: 11px; color: #334155; margin-top: 24px; padding-top: 14px; border-top: 1px solid #cbd5e1; page-break-inside: avoid;">
      <div style="width: 45%;">
        <div><b>Исполнитель / Подрядчик:</b></div>
        <div style="font-size: 10px; color: #64748b; margin-top: 2px;">${companyName}</div>
        <div style="margin-top: 24px; border-bottom: 1px solid #94a3b8; width: 80%;"></div>
        <div style="font-size: 9px; color: #94a3b8; margin-top: 4px;">(подпись, М.П.)</div>
      </div>
      <div style="width: 45%; text-align: right;">
        <div><b>Заказчик:</b></div>
        <div style="font-size: 10px; color: #64748b; margin-top: 2px;">${estimate.clientName || 'Физическое лицо'}</div>
        <div style="margin-top: 24px; border-bottom: 1px solid #94a3b8; width: 80%; margin-left: auto;"></div>
        <div style="font-size: 9px; color: #94a3b8; margin-top: 4px;">(подпись)</div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = 210;
    const pdfHeight = 297;
    const margin = 10;
    const contentWidth = pdfWidth - margin * 2;
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const totalPdfHeight = (imgHeight * contentWidth) / imgWidth;

    if (totalPdfHeight <= pdfHeight - margin * 2) {
      // Помещается на 1 лист
      const pageData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(pageData, 'JPEG', margin, margin, contentWidth, totalPdfHeight);
    } else {
      // 2 листа
      const pageContentHeight = pdfHeight - margin * 2;
      let heightLeft = totalPdfHeight;
      let position = 0;

      while (heightLeft > 0) {
        if (position > 0) pdf.addPage();
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = imgWidth;
        const currentChunkHeightPx = Math.min(
          imgHeight - (position * imgWidth) / contentWidth,
          (pageContentHeight * imgWidth) / contentWidth
        );
        pageCanvas.height = currentChunkHeightPx;
        const nextCtx = pageCanvas.getContext('2d');
        if (nextCtx) {
          nextCtx.fillStyle = '#ffffff';
          nextCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          nextCtx.drawImage(
            canvas,
            0,
            (position * imgWidth) / contentWidth,
            imgWidth,
            currentChunkHeightPx,
            0,
            0,
            imgWidth,
            currentChunkHeightPx
          );
          const nextData = pageCanvas.toDataURL('image/jpeg', 0.95);
          pdf.addImage(nextData, 'JPEG', margin, margin, contentWidth, (currentChunkHeightPx * contentWidth) / imgWidth);
        }
        heightLeft -= pageContentHeight;
        position += pageContentHeight;
      }
    }

    const pdfBlob = pdf.output('blob');
    if (!options?.skipAutoSave) {
      const safeAddr = (estimate.clientAddress || 'Краснодар').replace(/[/\\?%*:|"<>]/g, '_').slice(0, 24);
      const safeName = (estimate.clientName || 'Заказчик').replace(/[/\\?%*:|"<>]/g, '_').slice(0, 16);
      pdf.save(`КП_${safeAddr}_${safeName}.pdf`);
    }
    return pdfBlob;
  } finally {
    document.body.removeChild(container);
  }
}

