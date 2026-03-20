import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { getProcess } from '@/lib/store';

export const runtime = 'nodejs';

const COLUMNS = [
  { header: 'Facility name / Account name', key: 'facilityName',       width: 30 },
  { header: 'Sales Items ID',               key: 'salesItemId',        width: 18 },
  { header: 'Sales item display name',      key: 'displayName',        width: 30 },
  { header: 'NetSuite account',             key: 'netSuiteAccount',    width: 16 },
  { header: 'NetSuite subscription ID',     key: 'subscriptionId',     width: 24 },
  { header: 'NetSuite subscription item ID',key: 'subscriptionItemId', width: 28 },
  { header: 'Start date',                   key: 'startDate',          width: 14 },
  { header: 'Currency',                     key: 'currency',           width: 10 },
  { header: 'Quantity',                     key: 'quantity',           width: 10 },
  { header: 'Rate (Unit price)',            key: 'rate',               width: 16 },
];

export async function GET(request, { params }) {
  const { id } = await params;

  // Support "batch" ID — comma-separated process IDs
  const ids = id.split(',').map(s => s.trim()).filter(Boolean);
  const rows = [];

  for (const pid of ids) {
    const proc = getProcess(pid);
    if (proc?.mergedData) rows.push(...proc.mergedData);
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: 'No data found or import not complete' }, { status: 404 });
  }

  const workbook  = new ExcelJS.Workbook();
  workbook.creator  = 'Pathfinder';
  workbook.created  = new Date();

  const sheet = workbook.addWorksheet('MSS Import Output', {
    pageSetup: { fitToPage: true, fitToWidth: 1 },
  });

  // Columns
  sheet.columns = COLUMNS;

  // Header row styling
  const headerRow = sheet.getRow(1);
  headerRow.eachCell(cell => {
    cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
    cell.font   = { bold: true, color: { argb: 'FF93C5FD' }, size: 10 };
    cell.border = {
      bottom: { style: 'medium', color: { argb: 'FF3B82F6' } },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
  });
  headerRow.height = 22;

  // Data rows
  rows.forEach((row, i) => {
    const excelRow = sheet.addRow(row);
    const isEven   = i % 2 === 0;
    excelRow.eachCell(cell => {
      cell.fill = {
        type: 'pattern', pattern: 'solid',
        fgColor: { argb: isEven ? 'FF0D0D20' : 'FF0A0A1E' },
      };
      cell.font      = { color: { argb: 'FFE2E8F0' }, size: 10 };
      cell.alignment = { vertical: 'middle' };
    });
    excelRow.height = 18;
  });

  // Auto-filter
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to:   { row: 1, column: COLUMNS.length },
  };

  // Freeze header row
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();

  const facilityNames = [...new Set(rows.map(r => r.facilityName))];
  const filename = facilityNames.length === 1
    ? `${facilityNames[0].replace(/[^a-z0-9]/gi, '_')}_output.xlsx`
    : `MSS_Import_${facilityNames.length}_facilities_output.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
