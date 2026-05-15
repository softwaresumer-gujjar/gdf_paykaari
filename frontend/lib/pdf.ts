// Client-side PDF generation utilities using jsPDF + jspdf-autotable
// Dynamic import ensures Next.js doesn't attempt SSR of browser-only modules.

export interface OrgSettings {
  brandName?: string;
  invoiceHeader?: string;
  invoiceFooter?: string;
  signatureName?: string;
  signatureTitle?: string;
  primaryColor?: string;
  address?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  bankName?: string;
  bankAccount?: string;
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [37, 99, 235];
}

async function getJsPDF() {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  return { jsPDF, autoTable };
}

function drawHeader(doc: InstanceType<typeof import('jspdf').default>, settings: OrgSettings, title: string, subtitle?: string) {
  const [r, g, b] = hexToRgb(settings.primaryColor || '#2563eb');
  doc.setFillColor(r, g, b);
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.brandName || 'MilkFlow Business', 14, 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const headerLines = (settings.invoiceHeader || [settings.address, settings.phone, settings.email].filter(Boolean).join(' | '))
    .split('\n').slice(0, 2);
  headerLines.forEach((line, i) => doc.text(line, 14, 19 + i * 4));

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 40);

  if (subtitle) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, 14, 47);
  }

  doc.setTextColor(0, 0, 0);
  return 52;
}

function drawFooter(doc: InstanceType<typeof import('jspdf').default>, settings: OrgSettings) {
  const pageH = doc.internal.pageSize.height;
  doc.setFontSize(7);
  doc.setTextColor(140, 140, 140);
  const footer = settings.invoiceFooter || 'Thank you for your business.';
  doc.text(footer, 14, pageH - 14);
  if (settings.signatureName) {
    doc.text(`${settings.signatureName}${settings.signatureTitle ? ` · ${settings.signatureTitle}` : ''}`, 196, pageH - 14, { align: 'right' });
  }
  doc.setDrawColor(220, 220, 220);
  doc.line(14, pageH - 18, 196, pageH - 18);
}

// ─── Farmer Invoice PDF ────────────────────────────────────────────────────────
export async function downloadFarmerInvoicePDF(invoice: {
  id: string;
  date: string;
  farmer: { name: string; phone?: string };
  contractedMaunds: number;
  suppliedMaunds: number;
  fixedRate: number;
  marketRate: number;
  baseAmount: number;
  shortfallPenalty: number;
  excessBonus: number;
  netAmount: number;
  isPaid: boolean;
  paidAt?: string;
  paymentMode?: string;
  paymentReference?: string;
}, settings: OrgSettings = {}) {
  const { jsPDF, autoTable } = await getJsPDF();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const invoiceNo = `FI-${invoice.id.slice(-8).toUpperCase()}`;
  const yStart = drawHeader(doc, settings, 'FARMER INVOICE', `Invoice #${invoiceNo} · Date: ${new Date(invoice.date).toLocaleDateString()}`);

  // Farmer info
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Billed To:', 14, yStart + 2);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.farmer.name, 14, yStart + 8);
  if (invoice.farmer.phone) doc.text(`Phone: ${invoice.farmer.phone}`, 14, yStart + 13);

  // Status badge
  doc.setFillColor(invoice.isPaid ? 22 : 220, invoice.isPaid ? 163 : 50, invoice.isPaid ? 74 : 50);
  doc.roundedRect(150, yStart, 46, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.isPaid ? 'PAID' : 'UNPAID', 173, yStart + 6.5, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  const tableY = yStart + 20;
  autoTable(doc, {
    startY: tableY,
    head: [['Description', 'Qty (Muns)', 'Rate (PKR)', 'Amount (PKR)']],
    body: [
      ['Contracted Supply', String(invoice.contractedMaunds), String(invoice.fixedRate.toLocaleString()), String((invoice.contractedMaunds * invoice.fixedRate).toLocaleString())],
      ['Actual Supply', String(invoice.suppliedMaunds), '—', '—'],
      ['Base Payment', '—', '—', String(invoice.baseAmount.toLocaleString())],
      ...(invoice.shortfallPenalty > 0 ? [['Shortfall Penalty', String((invoice.contractedMaunds - invoice.suppliedMaunds).toFixed(2)), String(invoice.marketRate.toLocaleString()), `(${invoice.shortfallPenalty.toLocaleString()})`]] : []),
      ...(invoice.excessBonus > 0 ? [['Excess Bonus', String((invoice.suppliedMaunds - invoice.contractedMaunds).toFixed(2)), String(invoice.marketRate.toLocaleString()), String(invoice.excessBonus.toLocaleString())]] : []),
    ],
    foot: [['', '', 'NET PAYABLE', `PKR ${invoice.netAmount.toLocaleString()}`]],
    headStyles: { fillColor: hexToRgb(settings.primaryColor || '#2563eb'), textColor: [255, 255, 255], fontSize: 9 },
    footStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 10 },
    styles: { fontSize: 9 },
    columnStyles: { 0: { cellWidth: 80 }, 3: { halign: 'right' } },
  });

  if (invoice.isPaid && invoice.paidAt) {
    const finalY = (doc as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? tableY + 60;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Payment received on ${new Date(invoice.paidAt).toLocaleDateString()} via ${invoice.paymentMode || 'N/A'}`, 14, finalY + 8);
    if (invoice.paymentReference) doc.text(`Reference: ${invoice.paymentReference}`, 14, finalY + 14);
  }

  drawFooter(doc, settings);
  doc.save(`farmer-invoice-${invoiceNo}.pdf`);
}

// ─── Retailer Invoice PDF ──────────────────────────────────────────────────────
export async function downloadRetailerInvoicePDF(invoice: {
  id: string;
  date: string;
  retailer: { name: string; phone?: string };
  committedMaunds: number;
  purchasedMaunds: number;
  fixedRate: number;
  marketRate: number;
  baseAmount: number;
  excessSurcharge: number;
  netAmount: number;
  isPaid: boolean;
  paidAt?: string;
  paymentMode?: string;
}, settings: OrgSettings = {}) {
  const { jsPDF, autoTable } = await getJsPDF();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const invoiceNo = `RI-${invoice.id.slice(-8).toUpperCase()}`;
  const yStart = drawHeader(doc, settings, 'RETAILER INVOICE', `Invoice #${invoiceNo} · Date: ${new Date(invoice.date).toLocaleDateString()}`);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Billed To:', 14, yStart + 2);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.retailer.name, 14, yStart + 8);
  if (invoice.retailer.phone) doc.text(`Phone: ${invoice.retailer.phone}`, 14, yStart + 13);

  doc.setFillColor(invoice.isPaid ? 22 : 220, invoice.isPaid ? 163 : 50, invoice.isPaid ? 74 : 50);
  doc.roundedRect(150, yStart, 46, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.isPaid ? 'PAID' : 'UNPAID', 173, yStart + 6.5, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  autoTable(doc, {
    startY: yStart + 20,
    head: [['Description', 'Qty (Muns)', 'Rate (PKR)', 'Amount (PKR)']],
    body: [
      ['Committed Purchase', String(invoice.committedMaunds), String(invoice.fixedRate.toLocaleString()), String((invoice.committedMaunds * invoice.fixedRate).toLocaleString())],
      ['Actual Purchase', String(invoice.purchasedMaunds), '—', '—'],
      ['Base Amount', '—', '—', String(invoice.baseAmount.toLocaleString())],
      ...(invoice.excessSurcharge > 0 ? [['Excess Surcharge', String((invoice.purchasedMaunds - invoice.committedMaunds).toFixed(2)), `${(invoice.marketRate + 300).toLocaleString()} (+300)`, String(invoice.excessSurcharge.toLocaleString())]] : []),
    ],
    foot: [['', '', 'NET RECEIVABLE', `PKR ${invoice.netAmount.toLocaleString()}`]],
    headStyles: { fillColor: hexToRgb(settings.primaryColor || '#2563eb'), textColor: [255, 255, 255], fontSize: 9 },
    footStyles: { fillColor: [245, 245, 245], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 10 },
    styles: { fontSize: 9 },
    columnStyles: { 0: { cellWidth: 80 }, 3: { halign: 'right' } },
  });

  drawFooter(doc, settings);
  doc.save(`retailer-invoice-${invoiceNo}.pdf`);
}

// ─── Report PDF ────────────────────────────────────────────────────────────────
export async function downloadReportPDF(
  title: string,
  dateRange: string,
  columns: string[],
  rows: (string | number)[][],
  summary?: Record<string, string | number>,
  settings: OrgSettings = {},
) {
  const { jsPDF, autoTable } = await getJsPDF();
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const yStart = drawHeader(doc, settings, title.toUpperCase(), dateRange);

  if (summary) {
    let x = 14;
    const summaryY = yStart + 2;
    Object.entries(summary).forEach(([label, value]) => {
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(label, x, summaryY);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(String(value), x, summaryY + 6);
      doc.setFont('helvetica', 'normal');
      x += 55;
    });
  }

  autoTable(doc, {
    startY: (summary ? yStart + 16 : yStart + 4),
    head: [columns],
    body: rows.map((r) => r.map(String)),
    headStyles: { fillColor: hexToRgb(settings.primaryColor || '#2563eb'), textColor: [255, 255, 255], fontSize: 8 },
    styles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [250, 250, 250] },
  });

  drawFooter(doc, settings);
  doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`);
}
