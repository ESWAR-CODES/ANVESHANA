import ExcelJS from 'exceljs';
import { IEvent, IRegistration, FormFieldConfig } from '../types/models';

/**
 * Sanitizes user-supplied values to prevent Spreadsheet Formula Injection (CSV Injection).
 * Any value beginning with dangerous formula triggers (=, +, -, @, \t, \r, %, |)
 * even if preceded by whitespace or control characters is safely escaped with a leading apostrophe (').
 */
export const sanitizeFormulaInjection = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) {
    return value.map((v) => sanitizeFormulaInjection(v)).join(', ');
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  const str = String(value);

  // Check if string starts with formula operators even if preceded by whitespace or control characters
  if (/^[\s\u0000-\u001F]*[=+\-@\t\r%|]/.test(str)) {
    return `'${str}`;
  }

  return str;
};

/**
 * Escapes a single string value for RFC 4180 standard CSV output.
 */
export const escapeCsvCell = (value: any): string => {
  const sanitized = sanitizeFormulaInjection(value);
  const str = String(sanitized);

  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export interface UnifiedFieldDefinition {
  id: string;
  label: string;
  type: string;
}

/**
 * Builds a unified list of dynamic field definitions across the active form schema
 * and all historical version snapshots, handling renames and deleted fields gracefully.
 */
export const buildUnifiedFieldCatalog = (event: IEvent): UnifiedFieldDefinition[] => {
  const fieldMap = new Map<string, UnifiedFieldDefinition>();

  // 1. First add all historical snapshots in chronological order
  if (Array.isArray(event.formHistory)) {
    for (const snapshot of event.formHistory) {
      if (Array.isArray(snapshot.schema)) {
        for (const field of snapshot.schema) {
          fieldMap.set(field.id, {
            id: field.id,
            label: field.label,
            type: field.type,
          });
        }
      }
    }
  }

  // 2. Override/add active published schema (takes precedence for current labels)
  if (Array.isArray(event.formSchema)) {
    for (const field of event.formSchema) {
      fieldMap.set(field.id, {
        id: field.id,
        label: field.label,
        type: field.type,
      });
    }
  }

  return Array.from(fieldMap.values());
};

/**
 * Formats a Date object to IST (Asia/Kolkata) string.
 */
export const formatDateToIST = (dateInput: Date | string | null | undefined): string => {
  if (!dateInput) return 'N/A';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    return d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch {
    return String(dateInput);
  }
};

/**
 * Generates an RFC 4180 compliant CSV string with unified headers and formula injection protection.
 */
export const generateParticipantCsv = (
  event: IEvent,
  registrations: IRegistration[]
): string => {
  const dynamicFields = buildUnifiedFieldCatalog(event);

  // Define column headers
  const headers = [
    'Reference Number',
    'Student ID',
    'Email',
    'Submission Date (IST)',
    'Form Version',
    ...dynamicFields.map((f) => f.label),
  ];

  const lines: string[] = [];
  lines.push(headers.map(escapeCsvCell).join(','));

  for (const reg of registrations) {
    const answers = reg.answers || {};

    const rowValues = [
      reg.referenceNumber || reg._id,
      reg.studentId || 'N/A',
      reg.email || 'N/A',
      formatDateToIST(reg.submittedAt || reg.createdAt),
      `v${reg.formVersion || 1}`,
      ...dynamicFields.map((f) => {
        const val = answers[f.id];
        return val !== undefined && val !== null ? val : '';
      }),
    ];

    lines.push(rowValues.map(escapeCsvCell).join(','));
  }

  return lines.join('\r\n');
};

/**
 * Generates an authentic Excel (.xlsx) file buffer using ExcelJS with styled headers
 * and cell-level formula injection protection.
 */
export const generateParticipantXlsx = async (
  event: IEvent,
  registrations: IRegistration[]
): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Anveshana Club Website — Mohan Babu University';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Participants', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  const dynamicFields = buildUnifiedFieldCatalog(event);

  // Setup columns
  const columns: Array<{ header: string; key: string; width: number }> = [
    { header: 'Reference Number', key: 'ref', width: 20 },
    { header: 'Student ID', key: 'studentId', width: 18 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Submission Date (IST)', key: 'submittedAt', width: 25 },
    { header: 'Form Version', key: 'formVersion', width: 14 },
  ];

  for (const f of dynamicFields) {
    columns.push({
      header: f.label,
      key: f.id,
      width: Math.max(16, f.label.length + 4),
    });
  }

  worksheet.columns = columns;

  // Style Header Row (Navy Blue, Gold Accents, Bold White Text)
  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0B132B' }, // Anveshana Navy
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

  // Add Data Rows with Formula Sanitization
  for (const reg of registrations) {
    const answers = reg.answers || {};

    const rowData: Record<string, any> = {
      ref: sanitizeFormulaInjection(reg.referenceNumber || reg._id),
      studentId: sanitizeFormulaInjection(reg.studentId || 'N/A'),
      email: sanitizeFormulaInjection(reg.email || 'N/A'),
      submittedAt: formatDateToIST(reg.submittedAt || reg.createdAt),
      formVersion: `v${reg.formVersion || 1}`,
    };

    for (const f of dynamicFields) {
      const rawAnswer = answers[f.id];
      rowData[f.id] = sanitizeFormulaInjection(rawAnswer !== undefined && rawAnswer !== null ? rawAnswer : '');
    }

    const row = worksheet.addRow(rowData);
    row.height = 20;
    row.alignment = { vertical: 'middle', horizontal: 'left' };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

export interface ParticipantExportRecord {
  referenceNumber: string;
  eventTitle: string;
  fullName: string;
  studentId: string;
  email: string;
  phone: string;
  submittedAt: Date | string;
  formVersion: number;
  answersSummary?: string;
}

/**
 * Generates CSV for all participants across events with formula injection protection.
 */
export const generateAllParticipantsCsv = (records: ParticipantExportRecord[]): string => {
  const headers = [
    'Reference Number',
    'Event Title',
    'Full Name',
    'Student ID',
    'Email',
    'Phone',
    'Submission Date (IST)',
    'Form Version',
    'Answers Summary',
  ];

  const lines: string[] = [];
  lines.push(headers.map(escapeCsvCell).join(','));

  for (const rec of records) {
    const row = [
      rec.referenceNumber,
      rec.eventTitle,
      rec.fullName,
      rec.studentId,
      rec.email,
      rec.phone,
      formatDateToIST(rec.submittedAt),
      `v${rec.formVersion || 1}`,
      rec.answersSummary || '',
    ];
    lines.push(row.map(escapeCsvCell).join(','));
  }

  return lines.join('\r\n');
};

/**
 * Generates XLSX for all participants across events with formula injection protection.
 */
export const generateAllParticipantsXlsx = async (records: ParticipantExportRecord[]): Promise<Buffer> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Anveshana Club Website — Mohan Babu University';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('All Participants', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  worksheet.columns = [
    { header: 'Reference Number', key: 'ref', width: 20 },
    { header: 'Event Title', key: 'eventTitle', width: 28 },
    { header: 'Full Name', key: 'fullName', width: 24 },
    { header: 'Student ID', key: 'studentId', width: 18 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Phone', key: 'phone', width: 18 },
    { header: 'Submission Date (IST)', key: 'submittedAt', width: 25 },
    { header: 'Form Version', key: 'formVersion', width: 14 },
    { header: 'Answers Summary', key: 'answersSummary', width: 40 },
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0B132B' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

  for (const rec of records) {
    const row = worksheet.addRow({
      ref: sanitizeFormulaInjection(rec.referenceNumber),
      eventTitle: sanitizeFormulaInjection(rec.eventTitle),
      fullName: sanitizeFormulaInjection(rec.fullName),
      studentId: sanitizeFormulaInjection(rec.studentId),
      email: sanitizeFormulaInjection(rec.email),
      phone: sanitizeFormulaInjection(rec.phone),
      submittedAt: formatDateToIST(rec.submittedAt),
      formVersion: `v${rec.formVersion || 1}`,
      answersSummary: sanitizeFormulaInjection(rec.answersSummary || ''),
    });
    row.height = 20;
    row.alignment = { vertical: 'middle', horizontal: 'left' };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};
