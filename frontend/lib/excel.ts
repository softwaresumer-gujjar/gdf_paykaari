// Client-side Excel export using SheetJS (xlsx)

async function getXLSX() {
  return import('xlsx');
}

export async function downloadExcel(
  filename: string,
  sheets: { name: string; columns: string[]; rows: (string | number | boolean | null)[][] }[],
) {
  const XLSX = await getXLSX();
  const wb = XLSX.utils.book_new();

  for (const sheet of sheets) {
    const wsData = [sheet.columns, ...sheet.rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Auto-width columns
    const colWidths = sheet.columns.map((col, i) => ({
      wch: Math.max(col.length, ...sheet.rows.map((r) => String(r[i] ?? '').length)) + 2,
    }));
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31));
  }

  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

export async function downloadCollectionExcel(
  entries: { date: string; session: string; farmer: { name: string }; collectedMaunds: number; qualityFatPercent?: number; qualityWaterAdded: boolean; qualityPassed: boolean }[],
  dateRange: string,
) {
  await downloadExcel(`collection-report-${Date.now()}.xlsx`, [{
    name: 'Collection Report',
    columns: ['Date', 'Session', 'Farmer', 'Muns Collected', 'Fat %', 'Water Added', 'Quality'],
    rows: entries.map((e) => [
      new Date(e.date).toLocaleDateString(),
      e.session,
      e.farmer.name,
      Number(e.collectedMaunds),
      e.qualityFatPercent != null ? Number(e.qualityFatPercent) : '',
      e.qualityWaterAdded ? 'Yes' : 'No',
      e.qualityPassed ? 'Passed' : 'Failed',
    ]),
  }, {
    name: 'Summary',
    columns: ['Metric', 'Value'],
    rows: [
      ['Report Period', dateRange],
      ['Total Entries', entries.length],
      ['Total Muns', entries.reduce((s, e) => s + Number(e.collectedMaunds), 0).toFixed(2)],
      ['Morning Entries', entries.filter((e) => e.session === 'MORNING').length],
      ['Evening Entries', entries.filter((e) => e.session === 'EVENING').length],
      ['Quality Passed', entries.filter((e) => e.qualityPassed).length],
      ['Quality Failed', entries.filter((e) => !e.qualityPassed).length],
    ],
  }]);
}

export async function downloadDeliveryExcel(
  entries: { date: string; session: string; retailer: { name: string }; deliveredMaunds: number }[],
  dateRange: string,
) {
  await downloadExcel(`delivery-report-${Date.now()}.xlsx`, [{
    name: 'Delivery Report',
    columns: ['Date', 'Session', 'Retailer', 'Muns Delivered'],
    rows: entries.map((e) => [
      new Date(e.date).toLocaleDateString(),
      e.session,
      e.retailer.name,
      Number(e.deliveredMaunds),
    ]),
  }, {
    name: 'Summary',
    columns: ['Metric', 'Value'],
    rows: [
      ['Report Period', dateRange],
      ['Total Entries', entries.length],
      ['Total Muns', entries.reduce((s, e) => s + Number(e.deliveredMaunds), 0).toFixed(2)],
      ['Morning Entries', entries.filter((e) => e.session === 'MORNING').length],
      ['Evening Entries', entries.filter((e) => e.session === 'EVENING').length],
    ],
  }]);
}

export async function downloadFarmerInvoicesExcel(
  invoices: {
    date: string;
    farmer: { name: string };
    contractedMaunds: number;
    suppliedMaunds: number;
    fixedRate: number;
    marketRate: number;
    baseAmount: number;
    shortfallPenalty: number;
    excessBonus: number;
    netAmount: number;
    isPaid: boolean;
    paymentMode?: string;
  }[],
) {
  await downloadExcel(`farmer-invoices-${Date.now()}.xlsx`, [{
    name: 'Farmer Invoices',
    columns: ['Date', 'Farmer', 'Contracted (Muns)', 'Supplied (Muns)', 'Fixed Rate', 'Market Rate', 'Base Amount', 'Shortfall Penalty', 'Excess Bonus', 'Net Amount', 'Status', 'Payment Mode'],
    rows: invoices.map((i) => [
      new Date(i.date).toLocaleDateString(),
      i.farmer.name,
      Number(i.contractedMaunds),
      Number(i.suppliedMaunds),
      Number(i.fixedRate),
      Number(i.marketRate),
      Number(i.baseAmount),
      Number(i.shortfallPenalty),
      Number(i.excessBonus),
      Number(i.netAmount),
      i.isPaid ? 'Paid' : 'Unpaid',
      i.paymentMode || '',
    ]),
  }]);
}

export async function downloadRetailerInvoicesExcel(
  invoices: {
    date: string;
    retailer: { name: string };
    committedMaunds: number;
    purchasedMaunds: number;
    fixedRate: number;
    marketRate: number;
    baseAmount: number;
    excessSurcharge: number;
    netAmount: number;
    isPaid: boolean;
    paymentMode?: string;
  }[],
) {
  await downloadExcel(`retailer-invoices-${Date.now()}.xlsx`, [{
    name: 'Retailer Invoices',
    columns: ['Date', 'Retailer', 'Committed (Muns)', 'Purchased (Muns)', 'Fixed Rate', 'Market Rate', 'Base Amount', 'Excess Surcharge', 'Net Amount', 'Status', 'Payment Mode'],
    rows: invoices.map((i) => [
      new Date(i.date).toLocaleDateString(),
      i.retailer.name,
      Number(i.committedMaunds),
      Number(i.purchasedMaunds),
      Number(i.fixedRate),
      Number(i.marketRate),
      Number(i.baseAmount),
      Number(i.excessSurcharge),
      Number(i.netAmount),
      i.isPaid ? 'Paid' : 'Unpaid',
      i.paymentMode || '',
    ]),
  }]);
}
