import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Check,
  Clipboard,
  Settings2,
  HelpCircle,
} from 'lucide-react';
import { Transaction } from '../types';
import { formatINR } from '../utils/formatters';

interface StatementImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmImport: (newTxs: Transaction[]) => void;
  categories: string[];
}

export const StatementImportModal: React.FC<StatementImportModalProps> = ({
  isOpen,
  onClose,
  onConfirmImport,
  categories,
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'paste'>('file');
  const [step, setStep] = useState<'input' | 'review'>('input');
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [pastedText, setPastedText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Manual column mapping fallback state
  const [showColumnMapper, setShowColumnMapper] = useState<boolean>(false);
  const [rawTableRows, setRawTableRows] = useState<any[][]>([]);
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
  const [colMap, setColMap] = useState<{
    dateCol: number;
    descCol: number;
    debitCol: number;
    creditCol: number;
    amountCol: number;
  }>({ dateCol: -1, descCol: -1, debitCol: -1, creditCol: -1, amountCol: -1 });

  const [parsedRows, setParsedRows] = useState<
    (Omit<Transaction, 'id'> & { selected: boolean })[]
  >([]);

  if (!isOpen) return null;

  // -------------------------------------------------------------
  // Clean Amount Parser
  // -------------------------------------------------------------
  const parseAmountString = (val: any): { num: number; isDebit: boolean; isCredit: boolean } => {
    if (val === null || val === undefined || val === '') {
      return { num: 0, isDebit: false, isCredit: false };
    }
    const str = String(val).trim();
    if (!str || str === '-' || str === '—') {
      return { num: 0, isDebit: false, isCredit: false };
    }

    const hasDr = /dr|debit/i.test(str);
    const hasCr = /cr|credit/i.test(str);
    const hasParen = /^\(.*\)$/.test(str);

    // Strip currency symbols, commas, spaces, Dr, Cr
    const clean = str.replace(/[₹$€£\s,]|dr|cr|inr|rs\.?/gi, '').replace(/^\(|\)$/g, '');
    const num = parseFloat(clean);
    if (isNaN(num)) return { num: 0, isDebit: false, isCredit: false };

    return {
      num: Math.abs(num),
      isDebit: hasDr || hasParen || num < 0,
      isCredit: hasCr && !hasDr,
    };
  };

  // -------------------------------------------------------------
  // Clean Date Parser
  // -------------------------------------------------------------
  const parseDateString = (val: any): string | null => {
    if (!val) return null;

    // If Excel serial number (e.g. 45566)
    if (typeof val === 'number' && val > 30000 && val < 60000) {
      const utc_days = Math.floor(val - 25569);
      const utc_value = utc_days * 86400;
      const date_info = new Date(utc_value * 1000);
      return date_info.toISOString().split('T')[0];
    }

    const s = String(val).trim();
    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

    // DD/MM/YYYY or DD-MM-YYYY
    const dmy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
    if (dmy) {
      const d = dmy[1].padStart(2, '0');
      const m = dmy[2].padStart(2, '0');
      let y = dmy[3];
      if (y.length === 2) y = `20${y}`;
      return `${y}-${m}-${d}`;
    }

    // DD-MMM-YYYY (e.g. 14-Oct-2024 or 14 Oct 2024 or 14-OCT-24)
    const monthNames: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    };
    const namedMonth = s.match(/^(\d{1,2})[\s/-]([a-zA-Z]{3})[\s/-](\d{2,4})/);
    if (namedMonth) {
      const d = namedMonth[1].padStart(2, '0');
      const m = monthNames[namedMonth[2].toLowerCase()];
      let y = namedMonth[3];
      if (y.length === 2) y = `20${y}`;
      if (m) return `${y}-${m}-${d}`;
    }

    // Try standard JS date
    try {
      const d = new Date(s);
      if (!isNaN(d.getTime()) && d.getFullYear() > 2000 && d.getFullYear() < 2100) {
        return d.toISOString().split('T')[0];
      }
    } catch {
      // ignore
    }

    return null;
  };

  // -------------------------------------------------------------
  // Smart Category Tagger
  // -------------------------------------------------------------
  const categorizeNarration = (narration: string, isIncome: boolean): string => {
    if (isIncome) return 'Income';
    const text = narration.toLowerCase();

    if (/swiggy|zomato|starbucks|mcdonald|kfc|pizza|food|restaurant|cafe|eat|dining|burger|subway|blinkit|zepto|instamart|grocery|supermarket|dmart|baker/i.test(text)) {
      return 'Food';
    }
    if (/amazon|flipkart|myntra|ajio|zara|h&m|shopping|retail|cloth|mall|store|electronics|croma|reliance digital/i.test(text)) {
      return 'Shopping';
    }
    if (/uber|ola|rapido|metro|petrol|diesel|fuel|hpcl|bpcl|ioc|toll|fastag|parking|auto|cab|train|irctc|flight|air|indigo|vistara/i.test(text)) {
      return 'Transport';
    }
    if (/rent|maintenance|society|housing|landlord|flat|pg|brokerage/i.test(text)) {
      return 'Housing';
    }
    if (/electricity|water|gas|broadband|wifi|jio|airtel|vi|bescom|msedcl|tneb|recharge|dth|tata sky|postpaid|bill/i.test(text)) {
      return 'Utilities';
    }
    if (/hospital|clinic|pharmacy|apollo|medplus|doctor|health|diagnostics|dentist|cult\.fit|gym|fitness|pharma/i.test(text)) {
      return 'Health';
    }
    if (/school|college|udemy|coursera|tuition|course|exam|education|fees|university|books|stationery/i.test(text)) {
      return 'Education';
    }
    if (/netflix|spotify|prime|hotstar|pvr|inox|bookmyshow|cinema|movie|game|steam|playstation/i.test(text)) {
      return 'Entertainment';
    }
    return 'Shopping';
  };

  // -------------------------------------------------------------
  // SheetJS Universal 2D Table Parser
  // -------------------------------------------------------------
  const processTableData = (sheetRows: any[][]) => {
    if (!sheetRows || sheetRows.length === 0) {
      setErrorMessage('The file contains no readable tabular data.');
      return;
    }

    // Filter out completely empty rows
    const nonEmptyRows = sheetRows.filter((row) =>
      row && row.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== '')
    );

    if (nonEmptyRows.length === 0) {
      setErrorMessage('No transaction rows found.');
      return;
    }

    setRawTableRows(nonEmptyRows);

    // 1. Locate the Header Row
    // Scan all rows (up to 40) looking for header keywords
    let headerRowIdx = -1;
    let bestHeaderScore = 0;
    let dateCol = -1;
    let descCol = -1;
    let debitCol = -1;
    let creditCol = -1;
    let amountCol = -1;
    let balanceCol = -1;

    for (let r = 0; r < Math.min(40, nonEmptyRows.length); r++) {
      const row = nonEmptyRows[r];
      let rowScore = 0;
      let dCol = -1, descC = -1, debC = -1, credC = -1, amtC = -1, balC = -1;

      for (let c = 0; c < row.length; c++) {
        const val = String(row[c] || '').trim().toLowerCase();
        if (!val) continue;

        if (/^(date|txn\s*date|value\s*date|transaction\s*date|posting\s*date|tran\s*date)$/i.test(val)) {
          dCol = c; rowScore += 3;
        } else if (/date/i.test(val) && dCol === -1) {
          dCol = c; rowScore += 2;
        }

        if (/^(narration|description|particulars|transaction\s*details|remarks|details)$/i.test(val)) {
          descC = c; rowScore += 3;
        } else if (/narration|description|particulars|remarks/i.test(val) && descC === -1) {
          descC = c; rowScore += 2;
        }

        if (/^(withdrawal|debit|withdrawal\s*amt|debit\s*amount|dr\s*amt|dr\.?)$/i.test(val)) {
          debC = c; rowScore += 3;
        } else if (/debit|withdrawal/i.test(val) && !/credit|balance/i.test(val) && debC === -1) {
          debC = c; rowScore += 2;
        }

        if (/^(deposit|credit|deposit\s*amt|credit\s*amount|cr\s*amt|cr\.?)$/i.test(val)) {
          credC = c; rowScore += 3;
        } else if (/credit|deposit/i.test(val) && !/debit|balance/i.test(val) && credC === -1) {
          credC = c; rowScore += 2;
        }

        if (/^(amount|net\s*amount|txn\s*amount)$/i.test(val) && amtC === -1) {
          amtC = c; rowScore += 2;
        }

        if (/balance|closing/i.test(val) && balC === -1) {
          balC = c;
        }
      }

      // Check if this row looks like the statement header
      if (rowScore > bestHeaderScore && (dCol !== -1 || descC !== -1) && (debC !== -1 || credC !== -1 || amtC !== -1)) {
        bestHeaderScore = rowScore;
        headerRowIdx = r;
        dateCol = dCol;
        descCol = descC;
        debitCol = debC;
        creditCol = credC;
        amountCol = amtC;
        balanceCol = balC;
      }
    }

    // Set detected column headers for mapping fallback
    if (headerRowIdx !== -1) {
      setDetectedHeaders(nonEmptyRows[headerRowIdx].map((c: any) => String(c || '').trim()));
    } else {
      setDetectedHeaders(nonEmptyRows[0].map((_, i) => `Column ${i + 1}`));
    }

    setColMap({ dateCol, descCol, debitCol, creditCol, amountCol });

    // 2. Parse Rows using detected or fallback columns
    const extractedTransactions: (Omit<Transaction, 'id'> & { selected: boolean })[] = [];
    const startIdx = headerRowIdx !== -1 ? headerRowIdx + 1 : 0;

    for (let i = startIdx; i < nonEmptyRows.length; i++) {
      const row = nonEmptyRows[i];

      // Skip footer/summary lines
      const rowString = row.join(' ').toLowerCase();
      if (/total\s*amount|closing\s*balance|opening\s*balance|page\s*\d|disclaimer|generated\s*on/i.test(rowString)) {
        continue;
      }

      // Attempt Date extraction
      let rowDate: string | null = null;
      if (dateCol !== -1 && row[dateCol]) {
        rowDate = parseDateString(row[dateCol]);
      }
      // If not found in dateCol, search across row cells for a valid date
      if (!rowDate) {
        for (let c = 0; c < Math.min(5, row.length); c++) {
          rowDate = parseDateString(row[c]);
          if (rowDate) break;
        }
      }
      if (!rowDate) continue; // Every valid transaction requires a date

      // Attempt Narration/Description extraction
      let rawDesc = '';
      if (descCol !== -1 && row[descCol]) {
        rawDesc = String(row[descCol]).trim();
      }
      if (!rawDesc) {
        // Pick first long text cell
        for (let c = 0; c < row.length; c++) {
          const s = String(row[c] || '').trim();
          if (s.length > 3 && !parseDateString(s) && isNaN(parseFloat(s.replace(/,/g, '')))) {
            rawDesc = s;
            break;
          }
        }
      }
      if (!rawDesc) rawDesc = 'Bank Transaction';

      // Clean merchant name
      let merchantName = rawDesc;
      if (rawDesc.includes('/')) {
        const parts = rawDesc.split('/').map((p) => p.trim()).filter((p) => p.length > 1 && !/upi|p2m|p2a|neft|imps|rtgs|pos|inb|chq/i.test(p));
        if (parts.length > 0) merchantName = parts[0];
      }

      // Attempt Amount extraction
      let finalAmt = 0;
      let isIncome = false;

      // Strategy A: Separate Debit and Credit columns
      if (debitCol !== -1 || creditCol !== -1) {
        const debitData = debitCol !== -1 ? parseAmountString(row[debitCol]) : { num: 0 };
        const creditData = creditCol !== -1 ? parseAmountString(row[creditCol]) : { num: 0 };

        if (creditData.num > 0) {
          finalAmt = creditData.num;
          isIncome = true;
        } else if (debitData.num > 0) {
          finalAmt = -debitData.num;
          isIncome = false;
        }
      }

      // Strategy B: Single Amount column with Dr/Cr detection
      if (finalAmt === 0 && amountCol !== -1 && row[amountCol]) {
        const amtData = parseAmountString(row[amountCol]);
        if (amtData.num > 0) {
          if (amtData.isCredit) {
            finalAmt = amtData.num;
            isIncome = true;
          } else {
            finalAmt = -amtData.num;
            isIncome = false;
          }
        }
      }

      // Strategy C: Cell scan for numeric currency value (excluding balanceCol & date)
      if (finalAmt === 0) {
        for (let c = 0; c < row.length; c++) {
          if (c === dateCol || c === balanceCol || c === descCol) continue;
          const amtData = parseAmountString(row[c]);
          if (amtData.num > 0 && amtData.num < 10000000) {
            finalAmt = amtData.isCredit ? amtData.num : -amtData.num;
            isIncome = amtData.isCredit;
            break;
          }
        }
      }

      if (finalAmt === 0) continue;

      const category = categorizeNarration(rawDesc, isIncome);
      extractedTransactions.push({
        date: rowDate,
        merchant: merchantName.slice(0, 40),
        description: rawDesc.slice(0, 80),
        amount: Math.round(finalAmt),
        category,
        method: /upi/i.test(rawDesc) ? 'UPI' : /pos|card|visa|master/i.test(rawDesc) ? 'Card' : 'Bank Transfer',
        selected: true,
      });
    }

    if (extractedTransactions.length === 0) {
      // If auto-detection didn't extract rows, open the Column Mapper for user guidance
      setShowColumnMapper(true);
      setErrorMessage(
        'Could not automatically detect column positions. Please verify column mapping below.'
      );
    } else {
      setParsedRows(extractedTransactions);
      setErrorMessage('');
      setStep('review');
    }
  };

  // -------------------------------------------------------------
  // File Upload Handler (Supports CSV, XLSX, XLS, TXT, TSV)
  // -------------------------------------------------------------
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage('');
    setShowColumnMapper(false);
    setFileName(file.name);
    setFileSize(`${(file.size / 1024).toFixed(1)} KB`);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result;
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        processTableData(rows);
      } catch (err) {
        setErrorMessage(
          'Failed to parse file. Please upload a standard bank statement in CSV, Excel (.xlsx/.xls), or TXT format.'
        );
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setErrorMessage('Error reading file.');
      setIsProcessing(false);
    };

    reader.readAsArrayBuffer(file);
  };

  // -------------------------------------------------------------
  // Paste Handler (Text / Tabular copy-paste from banking web/PDF)
  // -------------------------------------------------------------
  const handlePasteSubmit = () => {
    if (!pastedText.trim()) {
      setErrorMessage('Please paste bank statement text into the field.');
      return;
    }

    setErrorMessage('');
    setShowColumnMapper(false);
    setFileName('Pasted_Statement.txt');
    setFileSize(`${(new Blob([pastedText]).size / 1024).toFixed(1)} KB`);

    try {
      const workbook = XLSX.read(pastedText, { type: 'string' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      processTableData(rows);
    } catch {
      // Fallback line split
      const lines = pastedText.split(/\r?\n/).map((l) => l.split(/\t|,/));
      processTableData(lines);
    }
  };

  // -------------------------------------------------------------
  // Manual Column Mapping Parser Run
  // -------------------------------------------------------------
  const handleApplyColumnMapping = () => {
    if (colMap.dateCol === -1) {
      setErrorMessage('Please map the Date column.');
      return;
    }
    if (colMap.debitCol === -1 && colMap.creditCol === -1 && colMap.amountCol === -1) {
      setErrorMessage('Please map at least one Debit, Credit, or Amount column.');
      return;
    }

    setErrorMessage('');
    const extracted: (Omit<Transaction, 'id'> & { selected: boolean })[] = [];

    for (let i = 1; i < rawTableRows.length; i++) {
      const row = rawTableRows[i];
      const rowDate = parseDateString(row[colMap.dateCol]);
      if (!rowDate) continue;

      const desc = colMap.descCol !== -1 ? String(row[colMap.descCol] || 'Bank Transaction') : 'Transaction';

      let finalAmt = 0;
      let isIncome = false;

      if (colMap.debitCol !== -1 || colMap.creditCol !== -1) {
        const deb = colMap.debitCol !== -1 ? parseAmountString(row[colMap.debitCol]) : { num: 0 };
        const cred = colMap.creditCol !== -1 ? parseAmountString(row[colMap.creditCol]) : { num: 0 };
        if (cred.num > 0) {
          finalAmt = cred.num;
          isIncome = true;
        } else if (deb.num > 0) {
          finalAmt = -deb.num;
          isIncome = false;
        }
      } else if (colMap.amountCol !== -1) {
        const amtData = parseAmountString(row[colMap.amountCol]);
        finalAmt = amtData.isCredit ? amtData.num : -amtData.num;
        isIncome = amtData.isCredit;
      }

      if (finalAmt === 0) continue;

      extracted.push({
        date: rowDate,
        merchant: desc.slice(0, 40),
        description: desc.slice(0, 80),
        amount: Math.round(finalAmt),
        category: categorizeNarration(desc, isIncome),
        method: 'Bank Import',
        selected: true,
      });
    }

    if (extracted.length === 0) {
      setErrorMessage('No transactions could be extracted with this mapping. Please recheck column selections.');
    } else {
      setParsedRows(extracted);
      setShowColumnMapper(false);
      setStep('review');
    }
  };

  // Selection & Editing
  const handleToggleSelectAll = (checked: boolean) => {
    setParsedRows((prev) => prev.map((r) => ({ ...r, selected: checked })));
  };

  const handleToggleRow = (idx: number) => {
    setParsedRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, selected: !r.selected } : r))
    );
  };

  const handleEditRow = (idx: number, field: keyof Omit<Transaction, 'id'>, value: any) => {
    setParsedRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r))
    );
  };

  const selectedRows = parsedRows.filter((r) => r.selected);
  const totalIncome = selectedRows.filter((r) => r.amount > 0).reduce((s, r) => s + r.amount, 0);
  const totalExpense = selectedRows.filter((r) => r.amount < 0).reduce((s, r) => s + Math.abs(r.amount), 0);

  const handleConfirm = () => {
    const toImport: Transaction[] = selectedRows.map((r, i) => ({
      ...r,
      id: `real-tx-${Date.now()}-${i}`,
    }));
    onConfirmImport(toImport);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-4xl bg-[#FCF9F1] border border-[#E8DDC4] rounded-3xl shadow-2xl p-6 max-h-[92vh] flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E8DDC4]">
          <div>
            <h2 className="text-xl font-bold text-[#102C2B]">
              {step === 'input' ? 'Upload Real Bank Statement' : 'Review & Confirm Live Statement'}
            </h2>
            <p className="text-xs text-[#68746D] mt-0.5">
              {step === 'input'
                ? 'Upload your official bank statement file or paste statement text to calculate real-time cash flow & health'
                : `Parsed ${parsedRows.length} transactions from ${fileName}. Review amounts & categories before importing.`}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5 text-[#68746D]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 overflow-y-auto flex-1">
          {step === 'input' ? (
            <div className="space-y-4">
              {/* Tab Selector: Upload File vs Paste Text */}
              <div className="flex rounded-xl bg-[#F5ECD9] p-1 gap-1 max-w-xs text-xs font-bold">
                <button
                  type="button"
                  onClick={() => { setActiveTab('file'); setErrorMessage(''); }}
                  className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition ${
                    activeTab === 'file' ? 'bg-[#064E49] text-white shadow-xs' : 'text-[#68746D]'
                  }`}
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload File</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('paste'); setErrorMessage(''); }}
                  className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition ${
                    activeTab === 'paste' ? 'bg-[#064E49] text-white shadow-xs' : 'text-[#68746D]'
                  }`}
                >
                  <Clipboard className="w-4 h-4" />
                  <span>Paste Text</span>
                </button>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-[#D94343]/10 border border-[#D94343]/30 text-xs font-semibold text-[#D94343] flex items-center justify-between">
                  <span>{errorMessage}</span>
                  {rawTableRows.length > 0 && !showColumnMapper && (
                    <button
                      type="button"
                      onClick={() => setShowColumnMapper(true)}
                      className="ml-3 px-3 py-1 rounded-lg bg-[#D94343] text-white font-bold hover:bg-[#B33535]"
                    >
                      Map Columns Manually
                    </button>
                  )}
                </div>
              )}

              {/* TAB 1: File Upload */}
              {activeTab === 'file' && (
                <div className="space-y-4">
                  <label className="border-2 border-dashed border-[#D9B45B] hover:border-[#064E49] bg-[#FFF9EF] hover:bg-[#FFF4DE] transition rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-[#D9B45B]/20 text-[#A9822F] flex items-center justify-center">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <div>
                      <span className="font-bold text-sm sm:text-base text-[#102C2B] block">
                        {isProcessing ? 'Processing Statement...' : 'Select or drag & drop your bank statement'}
                      </span>
                      <span className="text-xs text-[#68746D] mt-1 block">
                        Supported: CSV, Excel (.xlsx, .xls), TSV, TXT (from any bank: SBI, HDFC, ICICI, Axis, Kotak, etc.)
                      </span>
                    </div>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls,.tsv,.txt"
                      className="hidden"
                      onChange={handleFileChange}
                      disabled={isProcessing}
                    />
                  </label>

                  <div className="p-4 rounded-2xl bg-[#F5ECD9]/50 border border-[#E8DDC4] text-xs text-[#68746D] space-y-1">
                    <div className="font-bold text-[#102C2B]">Universal Bank Compatibility:</div>
                    <div>• Automatically skips bank address and account summary headers.</div>
                    <div>• Understands Date, Narration, Withdrawals (Debit), and Deposits (Credit).</div>
                    <div>• If your statement has an unusual format, you can also use the <strong>Paste Text</strong> tab to copy rows directly from your net-banking screen.</div>
                  </div>
                </div>
              )}

              {/* TAB 2: Direct Paste Statement Text */}
              {activeTab === 'paste' && (
                <div className="space-y-3">
                  <p className="text-xs text-[#68746D]">
                    Copy transaction rows directly from your Internet Banking, Netbanking table, or PDF, and paste them here:
                  </p>
                  <textarea
                    rows={8}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Example:&#10;Date       Narration                  Debit     Credit&#10;05/10/2024 UPI/Swiggy/Order#99       450.00&#10;06/10/2024 Tech Mahindra Salary                45000.00"
                    className="w-full p-3 rounded-2xl border border-[#E8DDC4] bg-white font-mono text-xs text-[#102C2B] focus:outline-hidden focus:border-[#D9B45B]"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handlePasteSubmit}
                      className="px-5 py-2.5 rounded-xl bg-[#064E49] text-white text-xs sm:text-sm font-bold hover:bg-[#176B62] transition shadow-xs"
                    >
                      Parse Pasted Statement
                    </button>
                  </div>
                </div>
              )}

              {/* Manual Column Mapper (Fallback if automatic headers fail) */}
              {showColumnMapper && rawTableRows.length > 0 && (
                <div className="p-5 rounded-2xl bg-[#FFF9EF] border border-[#D9B45B] space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#102C2B]">
                    <Settings2 className="w-4 h-4 text-[#A9822F]" />
                    <span>Select Statement Column Roles</span>
                  </div>
                  <p className="text-xs text-[#68746D]">
                    Match which columns in your file correspond to Date, Narration, and Outflow/Inflow:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold mb-1 text-[#102C2B]">Date Column *</label>
                      <select
                        value={colMap.dateCol}
                        onChange={(e) => setColMap({ ...colMap, dateCol: Number(e.target.value) })}
                        className="w-full h-9 px-2 rounded-lg border border-[#E8DDC4] bg-white"
                      >
                        <option value={-1}>Select column...</option>
                        {detectedHeaders.map((h, i) => (
                          <option key={i} value={i}>
                            Col {i + 1}: {h || `Column ${i + 1}`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-[#102C2B]">Description / Narration</label>
                      <select
                        value={colMap.descCol}
                        onChange={(e) => setColMap({ ...colMap, descCol: Number(e.target.value) })}
                        className="w-full h-9 px-2 rounded-lg border border-[#E8DDC4] bg-white"
                      >
                        <option value={-1}>Select column...</option>
                        {detectedHeaders.map((h, i) => (
                          <option key={i} value={i}>
                            Col {i + 1}: {h || `Column ${i + 1}`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-[#102C2B]">Withdrawal / Debit (Dr)</label>
                      <select
                        value={colMap.debitCol}
                        onChange={(e) => setColMap({ ...colMap, debitCol: Number(e.target.value) })}
                        className="w-full h-9 px-2 rounded-lg border border-[#E8DDC4] bg-white"
                      >
                        <option value={-1}>Select column...</option>
                        {detectedHeaders.map((h, i) => (
                          <option key={i} value={i}>
                            Col {i + 1}: {h || `Column ${i + 1}`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-[#102C2B]">Deposit / Credit (Cr)</label>
                      <select
                        value={colMap.creditCol}
                        onChange={(e) => setColMap({ ...colMap, creditCol: Number(e.target.value) })}
                        className="w-full h-9 px-2 rounded-lg border border-[#E8DDC4] bg-white"
                      >
                        <option value={-1}>Select column...</option>
                        {detectedHeaders.map((h, i) => (
                          <option key={i} value={i}>
                            Col {i + 1}: {h || `Column ${i + 1}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleApplyColumnMapping}
                      className="px-4 py-2 rounded-xl bg-[#064E49] text-white text-xs font-bold hover:bg-[#176B62]"
                    >
                      Apply Mapping & Parse
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* STEP 2: Review & Edit Parsed Transactions */
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-[#F5ECD9]/60 border border-[#E8DDC4] text-xs">
                <div>
                  <span className="text-[#68746D] block">Selected Records</span>
                  <strong className="text-sm text-[#102C2B]">
                    {selectedRows.length} of {parsedRows.length}
                  </strong>
                </div>
                <div>
                  <span className="text-[#68746D] block">Source</span>
                  <strong className="text-sm text-[#102C2B] truncate block" title={fileName}>
                    {fileName}
                  </strong>
                </div>
                <div>
                  <span className="text-[#68746D] block">Total Inflow</span>
                  <strong className="text-sm text-[#2E7655]">+{formatINR(totalIncome)}</strong>
                </div>
                <div>
                  <span className="text-[#68746D] block">Total Outflow</span>
                  <strong className="text-sm text-[#D94343]">-{formatINR(totalExpense)}</strong>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-[#E8DDC4] max-h-80">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F5ECD9] text-[#68746D] sticky top-0 z-10 border-b border-[#E8DDC4]">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedRows.length === parsedRows.length && parsedRows.length > 0}
                          onChange={(e) => handleToggleSelectAll(e.target.checked)}
                          className="rounded"
                        />
                      </th>
                      <th className="py-2.5 px-3 font-semibold">Date</th>
                      <th className="py-2.5 px-3 font-semibold">Merchant / Narration</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Amount (₹)</th>
                      <th className="py-2.5 px-3 font-semibold">Category</th>
                      <th className="py-2.5 px-3 font-semibold">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8DDC4]/40 bg-[#FCF8EE]">
                    {parsedRows.map((r, idx) => (
                      <tr
                        key={idx}
                        className={`hover:bg-white/70 transition ${
                          !r.selected ? 'opacity-40' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={r.selected}
                            onChange={() => handleToggleRow(idx)}
                            className="rounded"
                          />
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <input
                            type="date"
                            value={r.date}
                            onChange={(e) => handleEditRow(idx, 'date', e.target.value)}
                            className="px-2 py-1 rounded-lg border border-[#E8DDC4] bg-white text-xs"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={r.merchant}
                            onChange={(e) => handleEditRow(idx, 'merchant', e.target.value)}
                            className="w-full min-w-[140px] px-2 py-1 rounded-lg border border-[#E8DDC4] bg-white font-semibold text-xs"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            step="1"
                            value={r.amount}
                            onChange={(e) =>
                              handleEditRow(idx, 'amount', parseFloat(e.target.value) || 0)
                            }
                            className={`w-24 text-right px-2 py-1 rounded-lg border border-[#E8DDC4] bg-white font-bold text-xs ${
                              r.amount < 0 ? 'text-[#D94343]' : 'text-[#2E7655]'
                            }`}
                          />
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={r.category}
                            onChange={(e) => handleEditRow(idx, 'category', e.target.value)}
                            className="px-2 py-1 rounded-lg border border-[#E8DDC4] bg-white text-xs font-semibold"
                          >
                            {categories.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              r.amount < 0
                                ? 'bg-[#D94343]/15 text-[#D94343]'
                                : 'bg-[#2E7655]/15 text-[#2E7655]'
                            }`}
                          >
                            {r.amount < 0 ? 'Expense' : 'Income'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-[#E8DDC4]">
          {step === 'review' ? (
            <button
              onClick={() => setStep('input')}
              className="text-xs font-semibold text-[#68746D] hover:text-[#102C2B]"
            >
              ← Re-upload / Edit Statement
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-[#68746D] hover:bg-black/5"
            >
              Cancel
            </button>
            {step === 'review' && (
              <button
                onClick={handleConfirm}
                disabled={selectedRows.length === 0}
                className="px-6 py-2.5 rounded-xl bg-[#064E49] disabled:bg-[#92968D] text-white text-xs sm:text-sm font-bold hover:bg-[#176B62] transition shadow-xs"
              >
                Confirm Import ({selectedRows.length} Records)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
