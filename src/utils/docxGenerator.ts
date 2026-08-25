import {
  AlignmentType,
  BorderStyle,
  Document,
  ImageRun,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  Header,
  PageBreak
} from 'docx';
import { ShiftReportData } from '../types';
import { getLogoBuffer } from './logo';

const BLUE = '1a6b8a';
const LBLUE = 'e8f6fb';
const NAVY = '1e3a5f';
const GRAY = '6c757d';
const BLACK = '212529';
const WHITE = 'FFFFFF';

const bdr = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const bdrs = { top: bdr, bottom: bdr, left: bdr, right: bdr };
const hbdr = { style: BorderStyle.SINGLE, size: 1, color: BLUE };
const hbdrs = { top: hbdr, bottom: hbdr, left: hbdr, right: hbdr };
const CM = { top: 60, bottom: 60, left: 100, right: 100 };

const hc = (t: string, w: number) =>
  new TableCell({
    borders: hbdrs,
    width: { size: w, type: WidthType.DXA },
    shading: { fill: BLUE, type: ShadingType.CLEAR },
    margins: CM,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: String(t), bold: true, color: WHITE, size: 18 })]
      })
    ]
  });

const dc = (t: string, w: number, opts: { center?: boolean; bold?: boolean } = {}) =>
  new TableCell({
    borders: bdrs,
    width: { size: w, type: WidthType.DXA },
    margins: CM,
    children: [
      new Paragraph({
        alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
        children: [
          new TextRun({
            text: String(t || ''),
            bold: opts.bold || false,
            size: 18,
            color: BLACK
          })
        ]
      })
    ]
  });

const tc = (t: string, w: number, opts: { center?: boolean } = {}) =>
  new TableCell({
    borders: bdrs,
    width: { size: w, type: WidthType.DXA },
    margins: CM,
    shading: { fill: LBLUE, type: ShadingType.CLEAR },
    children: [
      new Paragraph({
        alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
        children: [new TextRun({ text: String(t || ''), bold: true, size: 18, color: BLUE })]
      })
    ]
  });

const sectionHeader = (text: string) =>
  new Paragraph({
    spacing: { before: 280, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE, space: 1 } },
    children: [new TextRun({ text, bold: true, size: 26, color: NAVY })]
  });

const sp = (after = 100) => new Paragraph({ spacing: { after }, children: [] });

export function getFilename(d: ShiftReportData): string {
  const contractor = d.contractor.trim() || 'Unknown';
  const project = d.project.trim() || '';
  let dateStr = d.date;
  if (d.date) {
    const [y, m, day] = d.date.split('-');
    dateStr = `${parseInt(m, 10)}-${parseInt(day, 10)}-${y}`;
  } else {
    const now = new Date();
    dateStr = `${now.getMonth() + 1}-${now.getDate()}-${now.getFullYear()}`;
  }
  const reportName = d.activityType === 'fiber' ? 'Fiber End Of Day Shift Report' : 'End Of Day Shift Report';
  const parts = [dateStr, reportName];
  if (project) parts.push(project);
  parts.push(contractor);
  return parts.join(' ') + '.docx';
}

export async function generateDocxBlob(d: ShiftReportData): Promise<{ blob: Blob; filename: string }> {
  const logoBuffer = await getLogoBuffer();
  const filename = getFilename(d);

  // Format date nicely
  let dateDisplay = d.date || '—';
  if (d.date) {
    const [y, m, day] = d.date.split('-');
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    dateDisplay = `${months[parseInt(m, 10) - 1]} ${parseInt(day, 10)}, ${y}`;
  }

  // Activity table rows
  const actRows = d.activities.filter((a) => a.description.trim() || a.material.trim() || a.quantity.trim());
  const actTableRows = [
    new TableRow({
      tableHeader: true,
      children: [
        hc('Activity Description', 5500),
        hc('Material / Type', 2500),
        hc('Qty', 1080)
      ]
    }),
    ...(actRows.length
      ? actRows.map(
          (a) =>
            new TableRow({
              children: [
                dc(a.description, 5500),
                dc(a.material, 2500),
                dc(a.quantity || '0', 1080, { center: true })
              ]
            })
        )
      : [
          new TableRow({
            children: [
              new TableCell({
                borders: bdrs,
                width: { size: 9080, type: WidthType.DXA },
                columnSpan: 3,
                margins: CM,
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: 'No activities logged', size: 18, color: GRAY })]
                  })
                ]
              })
            ]
          })
        ])
  ];

  // MOT table rows
  const motRows = d.motItems.filter((m) => m.activity.trim() || m.code.trim() || m.hours.trim());
  const motTableRows = [
    new TableRow({
      tableHeader: true,
      children: [hc('Activity', 5000), hc('Code', 2000), hc('Hours', 1960)]
    }),
    ...(motRows.length
      ? motRows.map(
          (m) =>
            new TableRow({
              children: [
                dc(m.activity, 5000),
                dc(m.code, 2000, { center: true }),
                dc(m.hours || '0', 1960, { center: true })
              ]
            })
        )
      : [
          new TableRow({
            children: [
              new TableCell({
                borders: bdrs,
                width: { size: 8960, type: WidthType.DXA },
                columnSpan: 3,
                margins: CM,
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: 'No MOT activity logged', size: 18, color: GRAY })]
                  })
                ]
              })
            ]
          })
        ])
  ];

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1080, bottom: 1080, left: 1080 }
          }
        },
        headers: {
          default: new Header({
            children: [
              new Table({
                width: { size: 9080, type: WidthType.DXA },
                columnWidths: [3000, 6080],
                borders: {
                  top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                  bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                  left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                  right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                  insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        width: { size: 3000, type: WidthType.DXA },
                        borders: {
                          top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                          bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                          left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                          right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                        },
                        children: [
                          new Paragraph({
                            spacing: { before: 0, after: 0 },
                            children: [
                              new ImageRun({
                                data: logoBuffer,
                                transformation: { width: 180, height: 65 },
                                type: 'png'
                              })
                            ]
                          })
                        ]
                      }),
                      new TableCell({
                        width: { size: 6080, type: WidthType.DXA },
                        borders: {
                          top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                          bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                          left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                          right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                        },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            spacing: { before: 0, after: 0 },
                            children: [
                              new TextRun({
                                text: d.activityType === 'fiber' ? 'Fiber End of Day Shift Report' : 'End of Day Shift Report',
                                bold: true,
                                size: 24,
                                color: NAVY
                              })
                            ]
                          }),
                          new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            spacing: { before: 40, after: 0 },
                            children: [
                              new TextRun({
                                text: 'LSCG / Full Circle Fiber  —  Tillman Fiber',
                                bold: true,
                                size: 14,
                                color: GRAY
                              })
                            ]
                          })
                        ]
                      })
                    ]
                  })
                ]
              }),
              new Paragraph({
                spacing: { before: 80, after: 0 },
                border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '29a9e1', space: 4 } },
                children: []
              })
            ]
          })
        },
        children: [
          // ── General Info ──
          sectionHeader('General Information'),
          sp(80),
          new Table({
            width: { size: 9080, type: WidthType.DXA },
            columnWidths: [2000, 2360, 2360, 2360],
            rows: [
              new TableRow({
                children: [hc('Date', 2000), hc('Project #', 2360), hc('Contractor', 2360), hc('Submitted By', 2360)]
              }),
              new TableRow({
                children: [
                  dc(dateDisplay, 2000),
                  dc(d.project || '—', 2360),
                  dc(d.contractor || '—', 2360),
                  dc(d.submittedBy || '—', 2360)
                ]
              }),
              new TableRow({ children: [hc('Vendor', 9080)] }),
              new TableRow({
                children: [
                  new TableCell({
                    borders: bdrs,
                    width: { size: 9080, type: WidthType.DXA },
                    columnSpan: 4,
                    margins: CM,
                    shading: { fill: LBLUE, type: ShadingType.CLEAR },
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: d.vendor, bold: true, size: 20, color: BLUE })]
                      })
                    ]
                  })
                ]
              })
            ]
          }),
          sp(200),

          // ── Construction Activity ──
          sectionHeader(d.activityType === 'fiber' ? 'Fiber EOS' : 'Construction EOS'),
          sp(80),
          new Table({
            width: { size: 9080, type: WidthType.DXA },
            columnWidths: [3000, 6080],
            rows: [
              ...(d.activityType !== 'fiber'
                ? [
                    new TableRow({
                      children: [
                        tc('Total Drill Footage', 3000),
                        dc(`${d.totalFootage || '0'} FT`, 6080)
                      ]
                    })
                  ]
                : []),
              new TableRow({
                children: [
                  tc('Start Address', 3000),
                  dc(d.startAddress || '—', 6080)
                ]
              }),
              new TableRow({
                children: [
                  tc('End Address', 3000),
                  dc(d.endAddress || '—', 6080)
                ]
              })
            ]
          }),
          sp(100),
          new Table({
            width: { size: 9080, type: WidthType.DXA },
            columnWidths: [5500, 2500, 1080],
            rows: actTableRows
          }),
          sp(200),

          // ── MOT Activity ──
          sectionHeader('MOT Activity'),
          sp(80),
          new Table({
            width: { size: 8960, type: WidthType.DXA },
            columnWidths: [5000, 2000, 1960],
            rows: motTableRows
          }),
          sp(200),

          // ── Attached Files Summary ──
          ...(d.attachedFilesList && d.attachedFilesList.length > 0
            ? [
                sectionHeader('Attached Files & Photos'),
                sp(80),
                new Table({
                  width: { size: 9080, type: WidthType.DXA },
                  columnWidths: [9080],
                  rows: [
                    new TableRow({ children: [hc('Attachment Filename / Reference', 9080)] }),
                    ...d.attachedFilesList.map(
                      (f) => new TableRow({ children: [dc(`📎 ${f}`, 9080)] })
                    )
                  ]
                }),
                sp(200)
              ]
            : []),

          // Page break before Notes & Deviations
          new Paragraph({
            children: [new PageBreak()]
          }),

          // ── Notes & Deviations ──
          sectionHeader('Notes & Deviations'),
          sp(80),
          new Table({
            width: { size: 9080, type: WidthType.DXA },
            columnWidths: [9080],
            rows: [
              new TableRow({ children: [hc('Revisions / Deviations from Design', 9080)] }),
              new TableRow({ children: [dc(d.revisions || 'None', 9080)] }),
              new TableRow({ children: [hc('Issues or Damages', 9080)] }),
              new TableRow({ children: [dc(d.issues || 'None', 9080)] }),
              new TableRow({ children: [hc("Contractor's Plan for Next Day", 9080)] }),
              new TableRow({ children: [dc(d.nextDay || 'None', 9080)] })
            ]
          }),
          sp(200),

          // ── Sign-off ──
          sectionHeader('Sign-Off'),
          sp(80),
          new Table({
            width: { size: 9080, type: WidthType.DXA },
            columnWidths: [4540, 4540],
            rows: [
              new TableRow({
                children: [hc('Contractor Signature', 4540), hc('Supervisor / Reviewer', 4540)]
              }),
              new TableRow({
                children: [
                  new TableCell({
                    borders: bdrs,
                    width: { size: 4540, type: WidthType.DXA },
                    margins: CM,
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: d.signature || '________________________',
                            italics: true,
                            font: 'Georgia',
                            size: 24,
                            color: BLACK
                          })
                        ]
                      })
                    ]
                  }),
                  dc(d.supervisor || '—', 4540)
                ]
              })
            ]
          }),
          sp(200),

          // Footer note
          new Paragraph({
            spacing: { before: 200, after: 0 },
            border: { top: { style: BorderStyle.SINGLE, size: 2, color: 'CCCCCC', space: 4 } },
            children: [
              new TextRun({
                text: `Generated: ${new Date().toLocaleString()} — LSCG / Full Circle Fiber — Tillman Fiber`,
                size: 16,
                color: GRAY,
                italics: true
              })
            ]
          })
        ]
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  return { blob, filename };
}
