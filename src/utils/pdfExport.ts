import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, UserAccount } from '../types';

export interface ReportPDFOptions {
  activeReport: 'statement' | 'categories' | 'methods' | 'velocity' | 'tax' | 'trends';
  fromDate: string;
  toDate: string;
  transactions: Transaction[];
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  account?: UserAccount;
  statusBadge: {
    label: string;
    sub: string;
  };
  rule503020?: {
    needs: { amount: number; percent: number; target: number };
    wants: { amount: number; percent: number; target: number };
    savings: { amount: number; percent: number; target: number };
  };
  paymentMethodSummary?: Array<{
    method: string;
    expenseTotal: number;
    count: number;
    percentOfExpenses: number;
  }>;
  velocitySummary?: {
    avgDailyBurn: number;
    projected30DayOutflow: number;
    avgWeekdaySpend: number;
    avgWeekendSpend: number;
    topSpikes: Transaction[];
  };
  taxHighValueSummary?: {
    totalHighValueAmount: number;
    totalDeductiblesAmount: number;
    highValueList: Transaction[];
    taxDeductibleCandidates: Transaction[];
  };
  monthlyMoMSummary?: Array<{
    monthName: string;
    income: number;
    expense: number;
    net: number;
    rate: number;
  }>;
}

// Clean INR formatting that renders reliably in default PDF fonts without unicode symbol rendering defects
function formatInrPdf(val: number): string {
  const isNeg = val < 0;
  const abs = Math.abs(val);
  const formatted = abs.toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  });
  return `${isNeg ? '-' : ''}Rs. ${formatted}`;
}

export function generateReportPDF(options: ReportPDFOptions): void {
  const {
    activeReport,
    fromDate,
    toDate,
    transactions,
    totalIncome,
    totalExpenses,
    netSavings,
    savingsRate,
    account,
    statusBadge,
    rule503020,
    paymentMethodSummary,
    velocitySummary,
    taxHighValueSummary,
    monthlyMoMSummary,
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let currentY = margin;

  // Title mapping
  const reportTitles: Record<string, string> = {
    statement: 'Cash Flow & Income Statement (P&L)',
    categories: '50 / 30 / 20 Budget & Category Breakdown',
    methods: 'Payment Modes & Debt Risk Audit',
    velocity: 'Daily Burn Rate & Expense Velocity',
    tax: 'Tax-Deductible & High-Value Ledger',
    trends: 'Month-Over-Month Financial Trends',
  };

  const reportTitle = reportTitles[activeReport] || 'Financial Statement Report';

  // --- 1. HEADER BANNER ---
  doc.setFillColor(6, 78, 73); // Deep Emerald #064E49
  doc.rect(margin, currentY, pageWidth - margin * 2, 26, 'F');

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('ArthDrishti', margin + 6, currentY + 10);

  // Tagline
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(217, 180, 91); // Gold #D9B45B
  doc.text('WEALTH & CASH FLOW INTELLIGENCE', margin + 6, currentY + 15);

  // Subtitle / Type
  doc.setTextColor(240, 240, 240);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(reportTitle.toUpperCase(), margin + 6, currentY + 22);

  // Right-aligned report details
  const todayStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(230, 230, 230);
  const rightX = pageWidth - margin - 6;
  doc.text(`Generated: ${todayStr}`, rightX, currentY + 9, { align: 'right' });
  doc.text(`Period: ${fromDate || 'Start'} to ${toDate || 'Present'}`, rightX, currentY + 14, { align: 'right' });
  doc.text(`User: ${account?.name || 'Account Holder'}`, rightX, currentY + 19, { align: 'right' });

  currentY += 31;

  // --- 2. EXECUTIVE SUMMARY METRICS BOXES ---
  const boxWidth = (pageWidth - margin * 2 - 9) / 4;
  const boxHeight = 18;

  const metrics = [
    {
      title: 'TOTAL INFLOW',
      val: formatInrPdf(totalIncome),
      color: [16, 120, 70], // Green
    },
    {
      title: 'TOTAL OUTFLOW',
      val: formatInrPdf(totalExpenses),
      color: [190, 40, 40], // Red
    },
    {
      title: 'NET SAVINGS',
      val: formatInrPdf(netSavings),
      color: netSavings >= 0 ? [16, 120, 70] : [190, 40, 40],
    },
    {
      title: 'SAVINGS RATE',
      val: `${Math.round(savingsRate)}%`,
      color: savingsRate >= 20 ? [16, 120, 70] : [180, 115, 20],
    },
  ];

  metrics.forEach((m, idx) => {
    const x = margin + idx * (boxWidth + 3);
    doc.setFillColor(248, 249, 250);
    doc.setDrawColor(220, 225, 225);
    doc.roundedRect(x, currentY, boxWidth, boxHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 110, 110);
    doc.text(m.title, x + 3.5, currentY + 5.5);

    doc.setFontSize(10);
    doc.setTextColor(m.color[0], m.color[1], m.color[2]);
    doc.text(m.val, x + 3.5, currentY + 13.5);
  });

  currentY += boxHeight + 4;

  // Status Banner
  doc.setFillColor(243, 248, 246);
  doc.setDrawColor(6, 78, 73);
  doc.rect(margin, currentY, pageWidth - margin * 2, 11, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(6, 78, 73);
  doc.text(`Financial Status: ${statusBadge.label}`, margin + 4, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 90, 90);
  doc.text(statusBadge.sub, margin + 4, currentY + 9);

  currentY += 15;

  // --- 3. REPORT-SPECIFIC SUMMARY SECTION ---
  if (activeReport === 'categories' && rule503020) {
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Budget Pillar', 'Recommended Rule', 'Actual Spending', '% of Total', 'Status']],
      body: [
        [
          'Needs (Rent, Groceries, Utilities, Transit)',
          '50% Target',
          formatInrPdf(rule503020.needs.amount),
          `${rule503020.needs.percent}%`,
          rule503020.needs.percent <= 50 ? 'Within Safe Target' : 'Exceeds 50% Rule',
        ],
        [
          'Wants (Dining, Shopping, Fun)',
          '30% Target',
          formatInrPdf(rule503020.wants.amount),
          `${rule503020.wants.percent}%`,
          rule503020.wants.percent <= 30 ? 'Within Safe Target' : 'Exceeds 30% Rule',
        ],
        [
          'Savings & Wealth Investments',
          '20% Target',
          formatInrPdf(rule503020.savings.amount),
          `${rule503020.savings.percent}%`,
          rule503020.savings.percent >= 20 ? 'Goal Achieved' : 'Below 20% Rule',
        ],
      ],
      headStyles: {
        fillColor: [6, 78, 73],
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: 40,
      },
      theme: 'grid',
    });
    // @ts-expect-error autoTable extends doc
    currentY = doc.lastAutoTable.finalY + 6;
  } else if (activeReport === 'methods' && paymentMethodSummary) {
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Payment Mode', 'Transactions', 'Total Spent', '% of Outflows']],
      body: paymentMethodSummary.map((m) => [
        m.method,
        m.count.toString(),
        formatInrPdf(m.expenseTotal),
        `${Math.round(m.percentOfExpenses)}%`,
      ]),
      headStyles: {
        fillColor: [6, 78, 73],
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: 40,
      },
      theme: 'grid',
    });
    // @ts-expect-error autoTable extends doc
    currentY = doc.lastAutoTable.finalY + 6;
  } else if (activeReport === 'velocity' && velocitySummary) {
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Burn Rate Metric', 'Value', 'Context']],
      body: [
        [
          'Daily Burn Rate (Average Daily Outflow)',
          formatInrPdf(velocitySummary.avgDailyBurn),
          'Average spend pace per day',
        ],
        [
          'Projected 30-Day Outflow',
          formatInrPdf(velocitySummary.projected30DayOutflow),
          'Estimated month outflow at this rate',
        ],
        [
          'Average Weekday Spend',
          formatInrPdf(velocitySummary.avgWeekdaySpend),
          'Monday to Friday daily spend',
        ],
        [
          'Average Weekend Spend',
          formatInrPdf(velocitySummary.avgWeekendSpend),
          'Saturday to Sunday daily spend',
        ],
      ],
      headStyles: {
        fillColor: [6, 78, 73],
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: 40,
      },
      theme: 'grid',
    });
    // @ts-expect-error autoTable extends doc
    currentY = doc.lastAutoTable.finalY + 6;
  } else if (activeReport === 'tax' && taxHighValueSummary) {
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Tax & Audit Category', 'Total Amount', 'Records Count']],
      body: [
        [
          'Tax-Deductible Eligible Items (Insurance, ELSS, Medical, Rent)',
          formatInrPdf(taxHighValueSummary.totalDeductiblesAmount),
          `${taxHighValueSummary.taxDeductibleCandidates.length} transactions`,
        ],
        [
          'High-Value Transactions (>= Rs 10,000)',
          formatInrPdf(taxHighValueSummary.totalHighValueAmount),
          `${taxHighValueSummary.highValueList.length} transactions`,
        ],
      ],
      headStyles: {
        fillColor: [6, 78, 73],
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: 40,
      },
      theme: 'grid',
    });
    // @ts-expect-error autoTable extends doc
    currentY = doc.lastAutoTable.finalY + 6;
  } else if (activeReport === 'trends' && monthlyMoMSummary) {
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Month', 'Inflow', 'Outflow', 'Net Saved', 'Savings Rate']],
      body: monthlyMoMSummary.map((m) => [
        m.monthName,
        formatInrPdf(m.income),
        formatInrPdf(m.expense),
        formatInrPdf(m.net),
        `${m.rate}%`,
      ]),
      headStyles: {
        fillColor: [6, 78, 73],
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: 40,
      },
      theme: 'grid',
    });
    // @ts-expect-error autoTable extends doc
    currentY = doc.lastAutoTable.finalY + 6;
  }

  // Section Header: Detailed Transactions Ledger
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(6, 78, 73);
  doc.text(`Transactions Included in Report (${transactions.length} Records)`, margin, currentY + 3);
  currentY += 6;

  // --- 4. DETAILED TRANSACTION LEDGER TABLE ---
  const tableData = transactions.map((t) => [
    t.date,
    t.merchant,
    t.category,
    t.method || 'General',
    t.amount >= 0 ? 'Credit' : 'Debit',
    formatInrPdf(t.amount),
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin, bottom: 15 },
    head: [['Date', 'Merchant / Payee', 'Category', 'Mode', 'Type', 'Amount']],
    body: tableData,
    headStyles: {
      fillColor: [6, 78, 73],
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: 50,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 30 },
      3: { cellWidth: 24 },
      4: { cellWidth: 16 },
      5: { cellWidth: 26, halign: 'right' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 248],
    },
    didDrawPage: (data) => {
      // Page footer
      const str = `Page ${data.pageNumber}`;
      doc.setFontSize(7);
      doc.setTextColor(140);
      doc.text(
        'ArthDrishti Financial Statement • Confidential & Generated by ArthDrishti Wealth Platform',
        margin,
        pageHeight - 8
      );
      doc.text(str, pageWidth - margin, pageHeight - 8, { align: 'right' });
    },
  });

  // --- 5. TRIGGER DOWNLOAD DIRECTLY TO BROWSER ---
  const safeTitle = activeReport || 'financial';
  const fileName = `ArthDrishti_${safeTitle}_report_${fromDate || 'all'}_to_${toDate || 'present'}.pdf`;
  doc.save(fileName);
}
