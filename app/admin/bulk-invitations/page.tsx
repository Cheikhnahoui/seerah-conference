'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface ParsedRow {
  full_name: string;
  phone_number?: string;
  city?: string;
  occupation?: string;
}

interface RowResult {
  full_name: string;
  success: boolean;
  registration_number?: string;
  error?: string;
}

const BATCH_SIZE = 100; // rows per request — keeps each API call well under Vercel's timeout

/**
 * Minimal CSV line splitter — handles quoted fields containing commas.
 * A line with no commas at all is just treated as a bare name.
 */
function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

function parseNames(text: string): ParsedRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  // Skip an obvious header row if present.
  const firstCells = parseCsvLine(lines[0]).map((c) => c.toLowerCase());
  const looksLikeHeader =
    firstCells.some((c) => ['name', 'full_name', 'الاسم', 'اسم'].includes(c));
  const dataLines = looksLikeHeader ? lines.slice(1) : lines;

  return dataLines.map((line) => {
    const cells = parseCsvLine(line);
    return {
      full_name: cells[0] || '',
      phone_number: cells[1] || '',
      city: cells[2] || '',
      occupation: cells[3] || '',
    };
  });
}

export default function BulkInvitationsPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rawText, setRawText] = useState('');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState<RowResult[] | null>(null);
  const [serverError, setServerError] = useState('');

  const getToken = () => localStorage.getItem('admin_token') || '';

  useEffect(() => {
    if (!getToken()) {
      router.replace('/admin');
      return;
    }
    setCheckingAuth(false);
  }, [router]);

  const handleTextChange = (text: string) => {
    setRawText(text);
    setRows(parseNames(text));
    setResults(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isExcel = /\.(xlsx|xls)$/i.test(file.name);

    if (isExcel) {
      setServerError('');
      try {
        const XLSX = await import('xlsx');
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: unknown[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        if (rows.length === 0) {
          setServerError('الملف فارغ');
          return;
        }

        // Find the column whose header looks like a "name" column,
        // wherever it is (your sheet might have it 4th, not 1st).
        const headerRow = rows[0].map((c) => String(c ?? '').trim().toLowerCase());
        const nameColIndex = headerRow.findIndex((c) =>
          ['name', 'full_name', 'الاسم', 'اسم'].includes(c)
        );

        const colIndex = nameColIndex !== -1 ? nameColIndex : 0;
        const dataRows = nameColIndex !== -1 ? rows.slice(1) : rows;

        const names = dataRows
          .map((r) => String(r[colIndex] ?? '').trim())
          .filter((n) => n.length > 0);

        if (names.length === 0) {
          setServerError('لم أجد أي أسماء في الملف. تأكد أن عمود الاسم يحمل رأساً واضحاً مثل "الاسم".');
          return;
        }

        setRawText(names.join('\n'));
        setRows(names.map((full_name) => ({ full_name })));
        setResults(null);
      } catch (err) {
        console.error('Excel parse error:', err);
        setServerError('تعذّرت قراءة ملف Excel. تأكد أنه بصيغة .xlsx صالحة.');
      }
      return;
    }

    // Plain text / CSV path (unchanged).
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      handleTextChange(text);
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleSubmit = async () => {
    if (rows.length === 0) return;
    setSubmitting(true);
    setServerError('');
    setResults(null);

    const allResults: RowResult[] = [];
    const batches: ParsedRow[][] = [];
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      batches.push(rows.slice(i, i + BATCH_SIZE));
    }

    setProgress({ done: 0, total: rows.length });

    for (const batch of batches) {
      try {
        const response = await fetch('/api/attendees/bulk-create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify({ rows: batch }),
        });

        if (response.status === 401) {
          router.replace('/admin');
          return;
        }

        const data = await response.json();
        if (data.success) {
          allResults.push(...data.results);
        } else {
          // Mark this whole batch as failed but keep going with the rest.
          batch.forEach((r) =>
            allResults.push({ full_name: r.full_name, success: false, error: data.error || 'فشلت الدفعة' })
          );
        }
      } catch {
        batch.forEach((r) =>
          allResults.push({ full_name: r.full_name, success: false, error: 'خطأ في الاتصال' })
        );
      }

      setProgress((prev) => ({ ...prev, done: Math.min(prev.done + batch.length, rows.length) }));
    }

    setResults(allResults);
    setSubmitting(false);
  };

  const reset = () => {
    setRawText('');
    setRows([]);
    setResults(null);
    setServerError('');
    setProgress({ done: 0, total: 0 });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  const successCount = results?.filter((r) => r.success).length ?? 0;
  const failCount = results ? results.length - successCount : 0;
  const progressPercent = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-green-dark)', fontFamily: 'Cairo, sans-serif' }}>
          رفع دعوات جماعياً
        </h1>
        <p className="text-sm mt-1" style={{ color: '#444444' }}>
          الصق قائمة الأسماء — اسم واحد في كل سطر — أو ارفع ملف نصي/CSV. كل شخص سيحصل على بطاقة دعوة وQR فريد ومقبولة مباشرة، بدون حاجة لرقم هاتف.
        </p>
      </div>

      {!results ? (
        <div className="rounded-2xl p-6 space-y-5" style={{ background: '#fff', border: '1px solid var(--color-border)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          {serverError && (
            <div className="alert-error rounded-xl p-4 text-center text-sm">{serverError}</div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#1a1a1a' }}>
              ارفع ملف (Excel أو CSV أو نصي)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleFileUpload}
              className="input-islamic w-full px-4 py-3 rounded-xl text-sm"
              disabled={submitting}
            />
          </div>

          <div className="text-center text-xs" style={{ color: '#999' }}>— أو —</div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#1a1a1a' }}>
              الصق الأسماء مباشرة (اسم في كل سطر)
            </label>
            <textarea
              value={rawText}
              onChange={(e) => handleTextChange(e.target.value)}
              rows={10}
              placeholder={'محمد أحمد\nفاطمة علي\nأحمد سالم\n...'}
              className="input-islamic w-full px-4 py-3 rounded-xl text-sm"
              disabled={submitting}
            />
          </div>

          {rows.length > 0 && !submitting && (
            <div className="rounded-xl p-3" style={{ background: 'rgba(45,110,45,0.06)', border: '1px dashed var(--color-green)' }}>
              <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-green-dark)' }}>
                معاينة: {rows.length} شخص {rows.length > BATCH_SIZE && `(سيُرسَل على ${Math.ceil(rows.length / BATCH_SIZE)} دفعة تلقائياً)`}
              </p>
              <div className="max-h-48 overflow-y-auto text-xs space-y-1">
                {rows.slice(0, 20).map((r, i) => (
                  <p key={i} style={{ color: '#555' }}>{i + 1}. {r.full_name || '—'}</p>
                ))}
                {rows.length > 20 && <p style={{ color: '#999' }}>و{rows.length - 20} آخرين...</p>}
              </div>
            </div>
          )}

          {submitting && (
            <div className="rounded-xl p-4" style={{ background: 'rgba(201,168,76,0.08)', border: '1px dashed var(--color-gold)' }}>
              <p className="text-sm font-semibold mb-2 text-center" style={{ color: 'var(--color-gold)' }}>
                جاري الإنشاء: {progress.done} / {progress.total}
              </p>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
                <div
                  className="h-full transition-all duration-300"
                  style={{ width: `${progressPercent}%`, background: 'var(--color-gold)' }}
                />
              </div>
              <p className="text-xs text-center mt-2" style={{ color: '#888' }}>لا تُغلق الصفحة أثناء الرفع...</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={submitting || rows.length === 0}
              className="btn-gold flex-1 py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-3"
            >
              {submitting ? (
                <>
                  <span className="spinner w-5 h-5" style={{ borderWidth: '2px', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                  <span>جاري الإنشاء...</span>
                </>
              ) : (
                <span>إنشاء {rows.length > 0 ? `(${rows.length})` : ''} دعوة</span>
              )}
            </button>
            {rows.length > 0 && !submitting && (
              <button
                onClick={reset}
                className="px-6 py-4 rounded-xl text-sm font-medium"
                style={{ background: 'rgba(0,0,0,0.05)', color: '#555' }}
              >
                مسح
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl p-6 space-y-4" style={{ background: '#fff', border: '1px solid var(--color-border)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="flex gap-4 text-center">
            <div className="flex-1 rounded-xl p-4" style={{ background: 'rgba(45,122,95,0.1)' }}>
              <p className="text-2xl font-bold" style={{ color: '#1a5c2a' }}>{successCount}</p>
              <p className="text-xs" style={{ color: '#555' }}>تم بنجاح</p>
            </div>
            <div className="flex-1 rounded-xl p-4" style={{ background: 'rgba(239,68,68,0.08)' }}>
              <p className="text-2xl font-bold" style={{ color: '#dc2626' }}>{failCount}</p>
              <p className="text-xs" style={{ color: '#555' }}>فشل</p>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-1">
            {results.map((r, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-sm"
                style={{ background: r.success ? 'rgba(45,122,95,0.06)' : 'rgba(239,68,68,0.06)' }}
              >
                <span>{r.full_name}</span>
                {r.success ? (
                  <span className="text-xs font-mono" style={{ color: '#1a5c2a' }}>{r.registration_number}</span>
                ) : (
                  <span className="text-xs" style={{ color: '#dc2626' }}>{r.error}</span>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <a
              href="/admin/manual-invitations"
              className="flex-1 py-3 rounded-xl text-sm font-bold text-center"
              style={{ background: 'rgba(26,92,42,0.1)', color: 'var(--color-green)' }}
            >
              الذهاب لسجل الدعوات
            </a>
            <button
              onClick={reset}
              className="btn-gold flex-1 py-3 rounded-xl text-sm font-bold"
            >
              رفع دفعة أخرى
            </button>
          </div>
        </div>
      )}
    </div>
  );
}