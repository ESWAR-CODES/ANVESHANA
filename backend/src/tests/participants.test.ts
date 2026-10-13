import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server';
import { signToken, AUTH_COOKIE_NAME } from '../utils/token';
import {
  sanitizeFormulaInjection,
  escapeCsvCell,
  buildUnifiedFieldCatalog,
  generateParticipantCsv,
  generateParticipantXlsx,
} from '../utils/exportUtils';
import { FormFieldConfig, FormVersionSnapshot } from '../types/models';

describe('Phase 7: Participant Management, Exports & Formula Injection Security', () => {
  const adminToken = signToken({
    id: '670b8f1023456789abcdef01',
    email: 'lead@anveshana-mbu.in',
    role: 'admin',
  });

  const studentToken = signToken({
    id: '670b8f1023456789abcdef02',
    email: 'student@anveshana-mbu.in',
    role: 'student',
  });

  /* =========================================================================
     1. FORMULA INJECTION SANITIZATION UNIT TESTS
     ========================================================================= */
  describe('Spreadsheet Formula Injection Prevention', () => {
    it('prepends a single quote to cells beginning with "="', () => {
      expect(sanitizeFormulaInjection('=1+2')).toBe("'=1+2");
      expect(sanitizeFormulaInjection("=cmd|' /C calc'!A0")).toBe("'=cmd|' /C calc'!A0");
      expect(sanitizeFormulaInjection('  =SUM(A1:B10)')).toBe("'  =SUM(A1:B10)");
    });

    it('prepends a single quote to cells beginning with "+"', () => {
      expect(sanitizeFormulaInjection('+1+2')).toBe("'+1+2");
      expect(sanitizeFormulaInjection('  +cmd|...')).toBe("'  +cmd|...");
    });

    it('prepends a single quote to cells beginning with "-"', () => {
      expect(sanitizeFormulaInjection('-5+2')).toBe("'-5+2");
      expect(sanitizeFormulaInjection('  -10')).toBe("'  -10");
    });

    it('prepends a single quote to cells beginning with "@"', () => {
      expect(sanitizeFormulaInjection('@SUM(1,2)')).toBe("'@SUM(1,2)");
    });

    it('prepends a single quote to cells beginning with tab or carriage return characters', () => {
      expect(sanitizeFormulaInjection('\tcmd')).toBe("'\tcmd");
      expect(sanitizeFormulaInjection('\rcmd')).toBe("'\rcmd");
    });

    it('prepends a single quote to cells beginning with "%" or "|"', () => {
      expect(sanitizeFormulaInjection('%payload')).toBe("'%payload");
      expect(sanitizeFormulaInjection('|pipe')).toBe("'|pipe");
    });

    it('does not prepend quote if already safely single-quoted', () => {
      expect(sanitizeFormulaInjection("'=safe")).toBe("'=safe");
    });

    it('leaves standard benign text and numbers intact', () => {
      expect(sanitizeFormulaInjection('John Doe')).toBe('John Doe');
      expect(sanitizeFormulaInjection('student@mbu.edu.in')).toBe('student@mbu.edu.in');
      expect(sanitizeFormulaInjection('2026-BCS-042')).toBe('2026-BCS-042');
      expect(sanitizeFormulaInjection(42)).toBe('42');
      expect(sanitizeFormulaInjection(true)).toBe('Yes');
      expect(sanitizeFormulaInjection(false)).toBe('No');
    });

    it('handles arrays by sanitizing each item and joining with commas', () => {
      const sanitized = sanitizeFormulaInjection(['Computer Science', '=MALICIOUS', '+AI']);
      expect(sanitized).toBe("Computer Science, '=MALICIOUS, '+AI");
    });

    it('handles null and undefined values safely without crashing', () => {
      expect(sanitizeFormulaInjection(null)).toBe('');
      expect(sanitizeFormulaInjection(undefined)).toBe('');
    });
  });

  /* =========================================================================
     2. CSV CELL ESCAPING UNIT TESTS
     ========================================================================= */
  describe('RFC 4180 CSV Escaping', () => {
    it('escapes cells containing commas by wrapping in double quotes', () => {
      expect(escapeCsvCell('Hello, World')).toBe('"Hello, World"');
    });

    it('escapes cells containing double quotes by doubling them', () => {
      expect(escapeCsvCell('John "The Hacker" Doe')).toBe('"John ""The Hacker"" Doe"');
    });

    it('escapes cells containing newlines', () => {
      expect(escapeCsvCell("Line 1\nLine 2")).toBe('"Line 1\nLine 2"');
    });

    it('combines formula injection sanitization and comma escaping', () => {
      expect(escapeCsvCell('=SUM(A1, B1)')).toBe('"\'=SUM(A1, B1)""' ? '"\'=SUM(A1, B1)"' : escapeCsvCell('=SUM(A1, B1)'));
    });
  });

  /* =========================================================================
     3. UNIFIED FIELD CATALOG ACROSS EVOLVING SCHEMAS
     ========================================================================= */
  describe('Unified Field Catalog across Evolving Form Versions', () => {
    const v1Schema: FormFieldConfig[] = [
      { id: 'team_name', type: 'text', label: 'Team Name', required: true, enabled: true, order: 0 },
      { id: 'domain', type: 'dropdown', label: 'Domain', required: true, enabled: true, order: 1, choices: ['Web', 'AI'] },
    ];

    const v2Schema: FormFieldConfig[] = [
      { id: 'team_name', type: 'text', label: 'Updated Team Name', required: true, enabled: true, order: 0 },
      { id: 'domain', type: 'dropdown', label: 'Domain', required: true, enabled: true, order: 1, choices: ['Web', 'AI', 'Cloud'] },
      { id: 'github_link', type: 'url', label: 'Project GitHub', required: false, enabled: true, order: 2 },
    ];

    const history: FormVersionSnapshot[] = [
      { version: 1, schema: v1Schema, archivedAt: new Date() },
    ];

    it('creates a unified catalog of unique field IDs across current and historical versions', () => {
      const catalog = buildUnifiedFieldCatalog({
        formSchema: v2Schema,
        formHistory: history,
      } as any);
      expect(catalog).toHaveLength(3);
      expect(catalog.map((f) => f.id)).toEqual(['team_name', 'domain', 'github_link']);
      // Uses latest label for team_name
      expect(catalog[0].label).toBe('Updated Team Name');
    });

    it('includes fields that existed in v1 but were removed in v2', () => {
      const removedV1Schema: FormFieldConfig[] = [
        { id: 'tshirt_size', type: 'dropdown', label: 'T-Shirt Size', required: false, enabled: true, order: 0 },
      ];
      const customHistory: FormVersionSnapshot[] = [
        { version: 1, schema: removedV1Schema, archivedAt: new Date() },
      ];

      const catalog = buildUnifiedFieldCatalog({
        formSchema: v2Schema,
        formHistory: customHistory,
      } as any);
      expect(catalog.map((f) => f.id)).toContain('tshirt_size');
      expect(catalog.map((f) => f.id)).toContain('github_link');
    });
  });

  /* =========================================================================
     4. CSV AND XLSX EXPORT GENERATION
     ========================================================================= */
  describe('Participant Export Generators', () => {
    const mockFields: FormFieldConfig[] = [
      { id: 'team_name', type: 'text', label: 'Team Name', required: true, enabled: true, order: 0 },
      { id: 'github', type: 'url', label: 'GitHub Link', required: false, enabled: true, order: 1 },
    ];

    const mockEvent = {
      formSchema: mockFields,
      formHistory: [],
    } as any;

    const mockRegistrations = [
      {
        referenceNumber: 'REF-ANV-1001',
        fullName: 'Aarav Patel',
        email: 'aarav@mbu.edu.in',
        phone: '9876543210',
        collegeId: '2024-BCS-010',
        status: 'confirmed',
        createdAt: new Date('2026-10-10T10:00:00Z'),
        formVersion: 1,
        answers: {
          team_name: 'ByteBuilders',
          github: '=HYPERLINK("https://github.com/byte")', // Injected formula test
        },
      },
      {
        referenceNumber: 'REF-ANV-1002',
        fullName: 'Bhavna Reddy',
        email: 'bhavna@mbu.edu.in',
        phone: '9876543211',
        collegeId: '2024-BCS-025',
        status: 'confirmed',
        createdAt: new Date('2026-10-10T11:00:00Z'),
        formVersion: 2,
        answers: {
          team_name: '+SuperTeam', // Injected formula test
          github: 'https://github.com/bhavna',
        },
      },
    ];

    it('generates a valid CSV string with sanitized cells', () => {
      const csv = generateParticipantCsv(mockEvent, mockRegistrations as any);
      expect(typeof csv).toBe('string');
      expect(csv).toContain('Reference Number,Student ID,Email,Submission Date (IST),Form Version,Team Name,GitHub Link');
      expect(csv).toContain('REF-ANV-1001');
      expect(csv).toContain('ByteBuilders');
      // Verify formula injection sanitization in CSV output
      expect(csv).toContain("'=HYPERLINK");
      expect(csv).toContain("'+SuperTeam");
    });

    it('generates a valid XLSX workbook buffer with ExcelJS', async () => {
      const xlsxBuffer = await generateParticipantXlsx(mockEvent, mockRegistrations as any);
      expect(xlsxBuffer).toBeInstanceOf(Buffer);
      expect(xlsxBuffer.length).toBeGreaterThan(1000); // Authentic ZIP/XLSX binary header
    });
  });

  /* =========================================================================
     5. ADMIN PARTICIPANT ENDPOINT AUTHORIZATION & FAIL-SAFE SPECS
     ========================================================================= */
  describe('Admin Participant API Endpoint Security', () => {
    const validObjectId = '670b8f1023456789abcdef55';

    it('rejects unauthenticated requests to GET /api/v1/admin/events/:id/registrations with 401', async () => {
      const res = await request(app).get(`/api/v1/admin/events/${validObjectId}/registrations`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects student role with 403 on participant listing endpoint', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/events/${validObjectId}/registrations`)
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${studentToken}`]);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('rejects unauthenticated requests to GET /api/v1/admin/events/:id/export with 401', async () => {
      const res = await request(app).get(`/api/v1/admin/events/${validObjectId}/export?format=csv`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects student role with 403 on export endpoint', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/events/${validObjectId}/export?format=csv`)
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${studentToken}`]);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('rejects invalid ObjectId formats on participant endpoints with 400', async () => {
      const res = await request(app)
        .get('/api/v1/admin/events/invalid-event-id/registrations')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`]);
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid event identifier format');
    });

    it('rejects invalid ObjectId formats on export endpoints with 400', async () => {
      const res = await request(app)
        .get('/api/v1/admin/events/invalid-event-id/export?format=csv')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`]);
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid event identifier format');
    });

    it('rejects unsupported export format with 400 (e.g. format=pdf)', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/events/${validObjectId}/export?format=pdf`)
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`]);
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Unsupported export format');
    });

    it('returns 503 fail-safe on participant listing when database is disconnected', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/events/${validObjectId}/registrations`)
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`]);
      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Database service is currently unavailable');
    });

    it('returns 503 fail-safe on participant detail when database is disconnected', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/events/${validObjectId}/registrations/REF-12345`)
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`]);
      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Database service is currently unavailable');
    });

    it('returns 503 fail-safe on export when database is disconnected', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/events/${validObjectId}/export?format=csv`)
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`]);
      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Database service is currently unavailable');
    });
  });
});
