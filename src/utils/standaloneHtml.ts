import { getLogoBase64 } from './logo';

export async function getStandaloneHtml(): Promise<string> {
  const base64Logo = await getLogoBase64();

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>End of Day Shift Report — LSCG / Full Circle Fiber</title>
  <script src="https://unpkg.com/docx@8.5.0/build/index.js"></script>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --blue: #29a9e1;
      --blue-dark: #1a6b8a;
      --blue-header: #1e7aaa;
      --gray-50: #f8f9fa;
      --gray-100: #f1f3f5;
      --gray-200: #e9ecef;
      --gray-300: #dee2e6;
      --gray-400: #ced4da;
      --gray-500: #adb5bd;
      --gray-600: #6c757d;
      --gray-700: #495057;
      --gray-800: #666e75;
      --gray-900: #212529;
      --green: #2d9e6b;
      --red: #c0392b;
      --red-light: #fdf0ee;
      --radius: 8px;
      --shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #eef2f7;
      color: var(--gray-900);
      min-height: 100vh;
      padding: 24px 16px 48px;
    }
    .page-header {
      max-width: 860px;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      background: white;
      border-radius: 12px;
      padding: 16px 24px;
      box-shadow: var(--shadow);
    }
    .logo-img { height: 52px; width: auto; display: block; }
    .header-right { text-align: right; }
    .header-right .report-title { font-size: 15px; font-weight: 600; color: var(--gray-800); }
    .header-right .report-sub { font-size: 12px; color: var(--gray-600); margin-top: 2px; }
    .date-badge {
      font-size: 12px;
      color: var(--gray-600);
      margin-top: 4px;
      font-weight: 500;
    }
    .form-card {
      max-width: 860px;
      margin: 0 auto 14px;
      background: white;
      border-radius: 12px;
      box-shadow: var(--shadow);
      overflow: hidden;
    }
    .card-header {
      background: var(--blue-header);
      padding: 12px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px;
    }
    .card-header svg { flex-shrink: 0; }
    .activity-type-toggle {
      display: flex;
      background: rgba(0,0,0,0.15);
      padding: 3px;
      border-radius: var(--radius);
      gap: 4px;
    }
    .toggle-btn {
      padding: 4px 10px;
      background: transparent;
      color: rgba(255,255,255,0.85);
      border: none;
      border-radius: calc(var(--radius) - 2px);
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.15s, color 0.15s;
    }
    .toggle-btn:hover {
      color: white;
    }
    .toggle-btn.active {
      background: white;
      color: var(--blue-header);
    }
    .card-header-text { color: white; }
    .card-header-text strong { font-size: 13px; font-weight: 600; display: block; }
    .card-header-text span { font-size: 11px; opacity: 0.8; }
    .card-body { padding: 18px 20px; }
    .field-grid { display: grid; gap: 12px; margin-bottom: 12px; }
    .grid-2 { grid-template-columns: 1fr 1fr; }
    .grid-3 { grid-template-columns: 1fr 1fr 1fr; }
    .grid-4 { grid-template-columns: 1fr 1fr 1fr 1fr; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: var(--gray-600);
    }
    .field input, .field select, .field textarea {
      width: 100%;
      padding: 8px 10px;
      border: 1px solid var(--gray-300);
      border-radius: var(--radius);
      font-size: 13px;
      color: var(--gray-900);
      background: var(--gray-50);
      font-family: inherit;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .field input:focus, .field select:focus, .field textarea:focus {
      outline: none;
      border-color: var(--blue);
      box-shadow: 0 0 0 3px rgba(41,169,225,0.15);
      background: white;
    }
    .field textarea { resize: vertical; min-height: 68px; line-height: 1.5; }
    .vendor-badge {
      padding: 8px 10px;
      background: #e8f6fb;
      border: 1px solid #b3dff0;
      border-radius: var(--radius);
      font-size: 13px;
      font-weight: 600;
      color: var(--blue-dark);
    }
    .table-header { display: grid; gap: 8px; padding: 0 0 6px; border-bottom: 1px solid var(--gray-200); margin-bottom: 8px; }
    .act-header { grid-template-columns: 3fr 2fr 90px 32px; }
    .mot-header { grid-template-columns: 2fr 1fr 80px 32px; }
    .table-header span { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--gray-500); }
    .act-row {
      display: grid;
      grid-template-columns: 3fr 2fr 90px 32px;
      gap: 8px;
      align-items: start;
      margin-bottom: 8px;
    }
    .mot-row {
      display: grid;
      grid-template-columns: 2fr 1fr 80px 32px;
      gap: 8px;
      align-items: start;
      margin-bottom: 8px;
    }
    .act-row input, .act-row select, .mot-row input, .mot-row select {
      width: 100%;
      padding: 7px 8px;
      border: 1px solid var(--gray-300);
      border-radius: var(--radius);
      font-size: 13px;
      color: var(--gray-900);
      background: var(--gray-50);
      font-family: inherit;
      transition: border-color 0.15s;
    }
    .act-row input:focus, .act-row select:focus, .mot-row input:focus, .mot-row select:focus {
      outline: none;
      border-color: var(--blue);
      box-shadow: 0 0 0 3px rgba(41,169,225,0.12);
      background: white;
    }
    .qty-wrap { display: flex; align-items: center; gap: 4px; }
    .qty-wrap input { width: 54px !important; text-align: center; }
    .qty-wrap span { font-size: 11px; color: var(--gray-500); font-weight: 600; }
    .remove-btn {
      width: 28px; height: 28px;
      border: 1px solid var(--gray-300);
      border-radius: 6px;
      background: white;
      color: var(--gray-500);
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px;
      margin-top: 1px;
      flex-shrink: 0;
      transition: background 0.12s, color 0.12s, border-color 0.12s;
    }
    .remove-btn:hover { background: var(--red-light); color: var(--red); border-color: var(--red); }
    .add-row-btn {
      width: 100%; padding: 7px;
      border: 1.5px dashed var(--gray-300);
      border-radius: var(--radius);
      background: none; color: var(--gray-600);
      font-size: 13px; cursor: pointer; font-family: inherit;
      transition: border-color 0.15s, color 0.15s, background 0.15s;
      margin-top: 4px;
    }
    .add-row-btn:hover { border-color: var(--blue); color: var(--blue); background: #e8f6fb; }
    .total-footage-bar {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-top: 14px;
      padding: 12px 14px;
      background: #e8f6fb;
      border: 1px solid #b3dff0;
      border-radius: var(--radius);
    }
    .total-footage-bar label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: var(--blue-dark);
      white-space: nowrap;
    }
    .total-footage-bar input {
      width: 100px;
      padding: 6px 10px;
      border: 1px solid #b3dff0;
      border-radius: var(--radius);
      font-size: 14px;
      font-weight: 600;
      color: var(--blue-dark);
      background: white;
      font-family: inherit;
      text-align: center;
    }
    .total-footage-bar input:focus {
      outline: none;
      border-color: var(--blue);
      box-shadow: 0 0 0 3px rgba(41,169,225,0.15);
    }
    .total-footage-bar span { font-size: 13px; font-weight: 600; color: var(--blue-dark); }
    .notes-grid { display: grid; gap: 12px; }
    .sig-field input {
      font-family: Georgia, serif;
      font-style: italic;
      font-size: 15px;
      letter-spacing: 0.03em;
      border-bottom: 2px solid var(--gray-400) !important;
      border-top: none !important; border-left: none !important; border-right: none !important;
      border-radius: 0 !important;
      background: transparent !important;
      padding-left: 0 !important;
    }
    .sig-field input:focus { box-shadow: none !important; border-bottom-color: var(--blue) !important; }
    .form-footer { max-width: 860px; margin: 0 auto; display: flex; gap: 10px; }
    .btn-primary {
      flex: 1; padding: 12px 24px;
      background: var(--blue-header); color: white;
      border: none; border-radius: var(--radius);
      font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit;
      box-shadow: var(--shadow);
      transition: background 0.15s, transform 0.1s;
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .btn-primary:hover { background: var(--blue-dark); }
    .btn-primary:active { transform: scale(0.98); }
    .btn-secondary {
      padding: 12px 18px;
      background: white; color: var(--gray-700);
      border: 1px solid var(--gray-300);
      border-radius: var(--radius);
      font-size: 13px; font-weight: 500; cursor: pointer; font-family: inherit;
      transition: background 0.15s;
    }
    .btn-secondary:hover { background: var(--gray-100); }
    .toast {
      position: fixed; bottom: 24px; right: 24px;
      background: var(--green); color: white;
      padding: 12px 20px; border-radius: var(--radius);
      font-size: 14px; font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      opacity: 0; transform: translateY(8px);
      transition: opacity 0.25s, transform 0.25s;
      pointer-events: none; z-index: 999;
    }
    .toast.show { opacity: 1; transform: translateY(0); }
    @media print {
      body { background: white; padding: 0; }
      .form-footer, .add-row-btn, .remove-btn { display: none !important; }
      .form-card { box-shadow: none; border: 1px solid #ccc; margin-bottom: 10px; }
      .page-header { box-shadow: none; border: 1px solid #ccc; margin-bottom: 10px; }
    }
    @media (max-width: 640px) {
      .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
      .act-row, .mot-row { grid-template-columns: 1fr; }
      .table-header { display: none; }
    }
  </style>
</head>
<body>
  <div class="page-header">
    <img src="${base64Logo}" class="logo-img" alt="LSCG Logo">
    <div class="header-right">
      <div class="report-title">End of Day Shift Report</div>
      <div class="report-sub">Tillman Fiber</div>
      <div class="date-badge" id="live-date"></div>
    </div>
  </div>

  <!-- General Info -->
  <div class="form-card">
    <div class="card-header">
      <svg width="16" height="16" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
      <div class="card-header-text"><strong>General information</strong><span>Report header details</span></div>
    </div>
    <div class="card-body">
      <div class="field-grid grid-3">
        <div class="field"><label>Date</label><input type="date" id="f-date"></div>
        <div class="field"><label>Project #</label><input type="text" id="f-project" placeholder="e.g. TF-2026-01"></div>
        <div class="field"><label>Contractor name</label><input type="text" id="f-contractor" placeholder="e.g. Rocky Meek"></div>
      </div>
      <div class="field-grid grid-2">
        <div class="field"><label>Vendor</label><div class="vendor-badge">LSCG / Full Circle Fiber</div></div>
        <div class="field"><label>Submitted by</label><input type="text" id="f-submitter" placeholder="Supervisor or foreman name"></div>
      </div>
    </div>
  </div>

  <!-- Construction Activity -->
  <div class="form-card">
    <div class="card-header">
      <div style="display:flex; align-items:center; gap:10px">
        <svg width="16" height="16" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <div class="card-header-text"><strong id="card-2-title">Construction EOS</strong><span>Work completed this shift</span></div>
      </div>
      <div class="activity-type-toggle">
        <button type="button" class="toggle-btn active" id="btn-construction" onclick="setActivityType('construction')">Construction EOS</button>
        <button type="button" class="toggle-btn" id="btn-fiber" onclick="setActivityType('fiber')">Fiber EOS</button>
      </div>
    </div>
    <div class="card-body">
      <div class="total-footage-bar" style="margin-bottom:14px">
        <label>Total drill footage (manual entry):</label>
        <input type="number" min="0" id="f-total-footage" placeholder="0">
        <span>FT</span>
      </div>
      <div class="field-grid grid-2" style="margin-bottom:14px">
        <div class="field"><label>Start Address</label><input type="text" id="f-start-address" placeholder="Enter start address"></div>
        <div class="field"><label>End Address</label><input type="text" id="f-end-address" placeholder="Enter end address"></div>
      </div>
      <div class="table-header act-header">
        <span>Activity description</span>
        <span>Material / type</span>
        <span>Qty</span>
        <span></span>
      </div>
      <div id="activity-rows"></div>
      <button class="add-row-btn" onclick="addActivityRow()">+ Add activity row</button>
    </div>
  </div>

  <!-- MOT Activity -->
  <div class="form-card">
    <div class="card-header">
      <svg width="16" height="16" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      <div class="card-header-text"><strong>MOT activity</strong><span>Maintenance of traffic</span></div>
    </div>
    <div class="card-body">
      <div class="table-header mot-header">
        <span>Activity</span>
        <span>Code</span>
        <span>Hours</span>
        <span></span>
      </div>
      <div id="mot-rows"></div>
      <button class="add-row-btn" onclick="addMOTRow()">+ Add MOT row</button>
    </div>
  </div>

  <!-- Notes & Deviations -->
  <div class="form-card">
    <div class="card-header">
      <svg width="16" height="16" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
      <div class="card-header-text"><strong>Notes & deviations</strong><span>Issues, changes, and next day plan</span></div>
    </div>
    <div class="card-body">
      <div class="notes-grid">
        <div class="field"><label>Revisions / deviations from design</label><textarea id="f-revisions" placeholder="Describe any changes from the approved design..."></textarea></div>
        <div class="field"><label>Issues or damages</label><textarea id="f-issues" placeholder="Utility strikes, access issues, damage to property..."></textarea></div>
        <div class="field"><label>Contractor plan for next day</label><textarea id="f-nextday" placeholder="What the crew plans to accomplish tomorrow..."></textarea></div>
      </div>
    </div>
  </div>

  <!-- Sign-off -->
  <div class="form-card">
    <div class="card-header">
      <svg width="16" height="16" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      <div class="card-header-text"><strong>Sign-off</strong><span>Contractor and supervisor acknowledgment</span></div>
    </div>
    <div class="card-body">
      <div class="field-grid grid-2">
        <div class="field sig-field"><label>Contractor signature</label><input type="text" id="f-sig" placeholder="Type full name as signature"></div>
        <div class="field"><label>Supervisor / reviewer</label><input type="text" id="f-supervisor" placeholder="Supervisor name"></div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="form-footer">
    <button class="btn-primary" onclick="generateReport()">
      <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      Generate Word Report
    </button>
    <button class="btn-secondary" onclick="window.print()">Print</button>
    <button class="btn-secondary" onclick="clearForm()">Clear</button>
  </div>

  <div class="toast" id="toast"></div>

  <script>
    const CONSTRUCTION_MATERIAL_TYPES = [
      '1.5" Conduit Bore',
      '24 Way HEX Bore',
      '12 Way HEX Bore',
      '2 Way HEX Bore',
      '2 Way HEX Hand Dig',
      'Toby Boxes',
      'DAP PITs',
      'Micro Splices',
      'FDH',
      'Ground Rod',
      'Vault',
      'MacLean Switch',
      'Other'
    ];

    const FIBER_MATERIAL_TYPES = [
      '48ct Fiber',
      '96ct Fiber',
      '144ct Fiber',
      'Tracer Wire',
      '144ct Fiber Tracer Wire',
      'Stingray'
    ];

    let currentActivityType = 'construction';

    function setActivityType(type) {
      if (currentActivityType === type) return;
      currentActivityType = type;
      
      document.getElementById('btn-construction').classList.toggle('active', type === 'construction');
      document.getElementById('btn-fiber').classList.toggle('active', type === 'fiber');
      document.getElementById('card-2-title').textContent = type === 'fiber' ? 'Fiber EOS' : 'Construction EOS';
      
      const rows = document.querySelectorAll('.act-row');
      const list = type === 'fiber' ? FIBER_MATERIAL_TYPES : CONSTRUCTION_MATERIAL_TYPES;
      
      rows.forEach(row => {
        const sel = row.querySelector('select');
        const currentVal = sel ? sel.value : '';
        let opts = '<option value="">Select type...</option>';
        list.forEach(m => {
          opts += '<option value="' + m + '"' + (m === currentVal ? ' selected' : '') + '>' + m + '</option>';
        });
        if (sel) sel.innerHTML = opts;
      });
    }

    function addActivityRow(activity='', mat='', qty='') {
      const container = document.getElementById('activity-rows');
      const row = document.createElement('div');
      row.className = 'act-row';
      const list = currentActivityType === 'fiber' ? FIBER_MATERIAL_TYPES : CONSTRUCTION_MATERIAL_TYPES;
      const opts = list.map(m =>
        '<option value="' + m + '"' + (m === mat ? ' selected' : '') + '>' + m + '</option>'
      ).join('');
      row.innerHTML = ''
        + '<input type="text" placeholder="Describe work activity" value="' + activity + '">'
        + '<select><option value="">Select type...</option>' + opts + '</select>'
        + '<div class="qty-wrap">'
        +   '<input type="number" min="0" placeholder="0" value="' + qty + '">'
        + '</div>'
        + '<button class="remove-btn" onclick="this.closest(\'.act-row\').remove()" title="Remove">✕</button>';
      container.appendChild(row);
    }

    function addMOTRow(activity='', code='', hours='') {
      const container = document.getElementById('mot-rows');
      const row = document.createElement('div');
      row.className = 'mot-row';
      row.innerHTML = ''
        + '<input type="text" placeholder="MOT activity description" value="' + activity + '">'
        + '<input type="text" placeholder="Code" value="' + code + '" style="text-transform:uppercase">'
        + '<input type="number" min="0" step="0.5" placeholder="0.0" value="' + hours + '">'
        + '<button class="remove-btn" onclick="this.closest(\'.mot-row\').remove()" title="Remove">✕</button>';
      container.appendChild(row);
    }

    function getFilename() {
      const dateVal = document.getElementById('f-date').value;
      const contractor = document.getElementById('f-contractor').value.trim() || 'Unknown';
      const project = document.getElementById('f-project').value.trim() || '';
      let dateStr = dateVal;
      if (dateVal) {
        const partsD = dateVal.split('-');
        dateStr = parseInt(partsD[1]) + '-' + parseInt(partsD[2]) + '-' + partsD[0];
      }
      const parts = [dateStr, 'End Of Day Shift Report'];
      if (project) parts.push(project);
      parts.push(contractor);
      return parts.join(' ') + '.docx';
    }

    function collectData() {
      const activities = [];
      document.querySelectorAll('.act-row').forEach(row => {
        const inputs = row.querySelectorAll('input');
        const sel = row.querySelector('select');
        activities.push({
          description: inputs[0].value,
          material: sel ? sel.value : '',
          quantity: inputs[1] ? inputs[1].value : ''
        });
      });
      const motItems = [];
      document.querySelectorAll('.mot-row').forEach(row => {
        const inputs = row.querySelectorAll('input');
        motItems.push({ activity: inputs[0].value, code: inputs[1].value, hours: inputs[2].value });
      });
      return {
        date: document.getElementById('f-date').value,
        project: document.getElementById('f-project').value,
        submittedBy: document.getElementById('f-submitter').value,
        contractor: document.getElementById('f-contractor').value,
        vendor: 'LSCG / Full Circle Fiber',
        totalFootage: document.getElementById('f-total-footage').value,
        startAddress: document.getElementById('f-start-address').value,
        endAddress: document.getElementById('f-end-address').value,
        activityType: currentActivityType,
        activities: activities,
        motItems: motItems,
        revisions: document.getElementById('f-revisions').value,
        issues: document.getElementById('f-issues').value,
        nextDay: document.getElementById('f-nextday').value,
        signature: document.getElementById('f-sig').value,
        supervisor: document.getElementById('f-supervisor').value
      };
    }

    function base64ToArrayBuffer(base64) {
      var parts = base64.split(',');
      var raw = window.atob(parts.length > 1 ? parts[1] : parts[0]);
      var rawLength = raw.length;
      var array = new Uint8Array(rawLength);
      for(var i = 0; i < rawLength; i++) {
        array[i] = raw.charCodeAt(i);
      }
      return array.buffer;
    }

    async function buildDocx(d) {
      const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
              ImageRun, AlignmentType, WidthType, BorderStyle, ShadingType } = docx;

      const logoBuffer = base64ToArrayBuffer("${base64Logo}");
      const filename = getFilename();

      let dateDisplay = d.date || '—';
      if (d.date) {
        const partsD = d.date.split('-');
        const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        dateDisplay = months[parseInt(partsD[1])-1] + ' ' + parseInt(partsD[2]) + ', ' + partsD[0];
      }

      const BLUE   = '1a6b8a';
      const LBLUE  = 'e8f6fb';
      const NAVY   = '1e3a5f';
      const GRAY   = '6c757d';
      const BLACK  = '212529';
      const WHITE  = 'FFFFFF';
      const bdr    = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
      const bdrs   = { top: bdr, bottom: bdr, left: bdr, right: bdr };
      const hbdr   = { style: BorderStyle.SINGLE, size: 1, color: BLUE };
      const hbdrs  = { top: hbdr, bottom: hbdr, left: hbdr, right: hbdr };
      const CM     = { top: 60, bottom: 60, left: 100, right: 100 };

      const hc = (t, w) => new TableCell({
        borders: hbdrs, width: { size: w, type: WidthType.DXA },
        shading: { fill: BLUE, type: ShadingType.CLEAR }, margins: CM,
        children: [new Paragraph({ alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: String(t), bold: true, color: WHITE, size: 18 })] })]
      });

      const dc = (t, w, opts) => new TableCell({
        borders: bdrs, width: { size: w, type: WidthType.DXA }, margins: CM,
        children: [new Paragraph({
          alignment: (opts && opts.center) ? AlignmentType.CENTER : AlignmentType.LEFT,
          children: [new TextRun({ text: String(t || ''), bold: (opts && opts.bold) || false, size: 18, color: BLACK })]
        })]
      });

      const tc = (t, w, opts) => new TableCell({
        borders: bdrs, width: { size: w, type: WidthType.DXA }, margins: CM,
        shading: { fill: LBLUE, type: ShadingType.CLEAR },
        children: [new Paragraph({
          alignment: (opts && opts.center) ? AlignmentType.CENTER : AlignmentType.LEFT,
          children: [new TextRun({ text: String(t || ''), bold: true, size: 18, color: BLUE })]
        })]
      });

      const sectionHeader = (text) => new Paragraph({
        spacing: { before: 280, after: 120 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE, space: 1 } },
        children: [new TextRun({ text: text, bold: true, size: 26, color: NAVY })]
      });

      const sp = (after) => new Paragraph({ spacing: { after: after || 100 }, children: [] });

      const actRows = d.activities.filter(a => a.description || a.material);
      const actTableRows = [
        new TableRow({
          tableHeader: true,
          children: [hc('Activity Description', 5500), hc('Material / Type', 2500), hc('Qty', 1080)]
        }),
        ...(actRows.length ? actRows.map(a => new TableRow({ children: [
          dc(a.description, 5500), dc(a.material, 2500), dc(a.quantity || '0', 1080, { center: true })
        ]})) : [new TableRow({ children: [dc('No activities logged', 9080)] })])
      ];

      const motRows = d.motItems.filter(m => m.activity || m.code);
      const motTableRows = [
        new TableRow({
          tableHeader: true,
          children: [hc('Activity', 5000), hc('Code', 2000), hc('Hours', 1960)]
        }),
        ...(motRows.length ? motRows.map(m => new TableRow({ children: [
          dc(m.activity, 5000), dc(m.code, 2000, { center: true }), dc(m.hours || '0', 1960, { center: true })
        ]})) : [new TableRow({ children: [dc('No MOT activity logged', 8960)] })])
      ];

      const doc = new Document({
        sections: [{
          properties: {
            page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } }
          },
          children: [
            new Paragraph({ spacing: { before: 0, after: 100 }, children: [new ImageRun({ data: logoBuffer, transformation: { width: 180, height: 65 }, type: 'png' })] }),
            new Paragraph({ spacing: { before: 0, after: 0 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '29a9e1', space: 4 } }, children: [] }),
            new Paragraph({ spacing: { before: 120, after: 60 }, children: [new TextRun({ text: 'End of Day Shift Report', bold: true, size: 36, color: NAVY })] }),
            new Paragraph({ spacing: { before: 0, after: 200 }, children: [new TextRun({ text: 'LSCG / Full Circle Fiber  —  Tillman Fiber', size: 20, color: GRAY })] }),

            sectionHeader('General Information'), sp(80),
            new Table({
              width: { size: 9080, type: WidthType.DXA }, columnWidths: [2000, 2360, 2360, 2360],
              rows: [
                new TableRow({ children: [hc('Date', 2000), hc('Project #', 2360), hc('Contractor', 2360), hc('Submitted By', 2360)] }),
                new TableRow({ children: [dc(dateDisplay, 2000), dc(d.project || '—', 2360), dc(d.contractor || '—', 2360), dc(d.submittedBy || '—', 2360)] }),
                new TableRow({ children: [hc('Vendor', 9080)] }),
                new TableRow({ children: [new TableCell({
                  borders: bdrs, width: { size: 9080, type: WidthType.DXA }, columnSpan: 4, margins: CM,
                  shading: { fill: LBLUE, type: ShadingType.CLEAR },
                  children: [new Paragraph({ children: [new TextRun({ text: d.vendor, bold: true, size: 20, color: BLUE })] })]
                })] })
              ]
            }),
            sp(200),

            sectionHeader(d.activityType === 'fiber' ? 'Fiber EOS' : 'Construction EOS'), sp(80),
            new Table({
              width: { size: 9080, type: WidthType.DXA }, columnWidths: [3000, 6080],
              rows: [
                new TableRow({ children: [tc('Total Drill Footage', 3000), dc((d.totalFootage || '0') + ' FT', 6080)] }),
                new TableRow({ children: [tc('Start Address', 3000), dc(d.startAddress || '—', 6080)] }),
                new TableRow({ children: [tc('End Address', 3000), dc(d.endAddress || '—', 6080)] })
              ]
            }),
            sp(100),
            new Table({ width: { size: 9080, type: WidthType.DXA }, columnWidths: [5500, 2500, 1080], rows: actTableRows }),
            sp(200),

            sectionHeader('MOT Activity'), sp(80),
            new Table({ width: { size: 8960, type: WidthType.DXA }, columnWidths: [5000, 2000, 1960], rows: motTableRows }),
            sp(200),

            sectionHeader('Notes & Deviations'), sp(80),
            new Table({
              width: { size: 9080, type: WidthType.DXA }, columnWidths: [9080],
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

            sectionHeader('Sign-Off'), sp(80),
            new Table({
              width: { size: 9080, type: WidthType.DXA }, columnWidths: [4540, 4540],
              rows: [
                new TableRow({ children: [hc('Contractor Signature', 4540), hc('Supervisor / Reviewer', 4540)] }),
                new TableRow({ children: [
                  new TableCell({ borders: bdrs, width: { size: 4540, type: WidthType.DXA }, margins: CM,
                    children: [new Paragraph({ children: [new TextRun({ text: d.signature || '________________________', italics: true, font: 'Georgia', size: 24, color: BLACK })] })] }),
                  dc(d.supervisor || '—', 4540)
                ] })
              ]
            }),
            sp(200),

            new Paragraph({ spacing: { before: 200, after: 0 }, border: { top: { style: BorderStyle.SINGLE, size: 2, color: 'CCCCCC', space: 4 } },
              children: [new TextRun({ text: 'Generated: ' + new Date().toLocaleString() + ' — LSCG / Full Circle Fiber — Tillman Fiber', size: 16, color: GRAY, italics: true })] })
          ]
        }]
      });

      return { doc: doc, filename: filename };
    }

    async function generateReport() {
      const btn = document.querySelector('.btn-primary');
      btn.textContent = 'Generating Word Report...';
      btn.disabled = true;
      try {
        const d = collectData();
        const res = await buildDocx(d);
        const buffer = await docx.Packer.toBuffer(res.doc);
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = res.filename;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Downloaded: ' + res.filename);
      } catch(e) {
        showToast('Error: ' + e.message);
        console.error(e);
      }
      btn.innerHTML = '<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> Generate Word Report';
      btn.disabled = false;
    }

    function showToast(msg) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.classList.add('show');
      setTimeout(function() { t.classList.remove('show'); }, 3500);
    }

    function clearForm() {
      ['f-date','f-project','f-submitter','f-contractor','f-total-footage','f-start-address','f-end-address','f-revisions','f-issues','f-nextday','f-sig','f-supervisor']
        .forEach(function(id) { document.getElementById(id).value = ''; });
      document.getElementById('activity-rows').innerHTML = '';
      document.getElementById('mot-rows').innerHTML = '';
      setActivityType('construction');
      addDefaultRows();
      showToast('Form cleared.');
    }

    function addDefaultRows() {
      addActivityRow('','1.5" Conduit Bore','');
      addActivityRow('','24 Way HEX Bore','');
      addActivityRow('','12 Way HEX Bore','');
      addActivityRow('','2 Way HEX Bore','');
      addActivityRow('','Toby Boxes','');
      addActivityRow('','DAP PITs','');
      addActivityRow('','Micro Splices','');
      addMOTRow(); addMOTRow(); addMOTRow();
    }

    const today = new Date();
    document.getElementById('f-date').value = today.toISOString().split('T')[0];
    document.getElementById('live-date').textContent = today.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });
    addDefaultRows();
  </script>
</body>
</html>`;
}
