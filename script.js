
function openEditGroup(id){
  const g = reservations.find(r=>r.id===id);
  if(!g) return;
  openNewGroupModal(g);
}

// openNewGroupModal(group?) - if group provided, modal is in edit mode
function openNewGroupModal(group){
  const modal = document.getElementById('newGroupModal');
  modal.innerHTML = '';
  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden','false');
  modal.classList.add('modal','open');
  const nameVal = group ? group.name : '';
  const villaVal = group ? group.villa : 'Villa Verano';
  const startVal = group ? (group.startISO || group.startISO || group.startISO) : '';
  const endVal = group ? (group.endISO || group.endISO || group.end) : '';
  const typeVal = group ? group.type : 'vv';
  const statusVal = group ? group.status : 'upcoming';
  const idVal = group ? group.id : '';

  modal.innerHTML = `<div class="modal-wrap"><h3>${group? 'Editar Grupo' : 'Crear Nuevo Grupo'}</h3>
    <div class="form-row"><div style='flex:1'><label>Nombre</label><input id='ng_name' type='text' placeholder='Nombre del grupo' value="${nameVal}"></div><div style='width:140px'><label>Villa</label><select id='ng_villa'><option value='Villa Verano'>Villa Verano</option><option value='Beach House'>Beach House</option><option value='Todas las Villas'>Todas las Villas</option></select></div></div>
    <div class="form-row"><div style='flex:1'><label>Fecha inicio</label><input id='ng_start' type='date' value="${group && group.startISO ? group.startISO : (group && group.start ? (group.startISO || '') : '')}"></div><div style='flex:1'><label>Fecha fin</label><input id='ng_end' type='date' value="${group && group.endISO ? group.endISO : (group && group.end ? (group.endISO || '') : '')}"></div></div>
    <div class="form-row"><div style='flex:1'><label>Tipo</label><select id='ng_type'><option value='vv'>vv</option><option value='bh'>bh</option><option value='mixed'>mixed</option><option value='all'>all</option></select></div><div style='width:140px'><label>Estado</label><select id='ng_status'><option value='upcoming'>upcoming</option><option value='active'>active</option><option value='completed'>completed</option></select></div></div>
    <div class="actions"><button id='ng_cancel' class='btn ghost'>Cancelar</button><button id='ng_save' class='btn'>${group? 'Guardar cambios' : 'Crear grupo'}</button></div>
  </div>`;

  // set selects to values after insertion
  setTimeout(()=>{
    try{
      document.getElementById('ng_villa').value = villaVal;
      document.getElementById('ng_type').value = typeVal;
      document.getElementById('ng_status').value = statusVal;
      if(idVal) document.getElementById('ng_save').setAttribute('data-edit-id', idVal);
    }catch(e){console.warn(e)}
  },10);

  document.getElementById('ng_cancel').onclick = ()=> closeNewGroupModal();
  document.getElementById('ng_save').onclick = ()=>{
    const name = document.getElementById('ng_name').value.trim();
    const villa = document.getElementById('ng_villa').value;
    const start = document.getElementById('ng_start').value;
    const end = document.getElementById('ng_end').value;
    const type = document.getElementById('ng_type').value;
    const status = document.getElementById('ng_status').value;
    if(!name || !start){ alert('Nombre y fecha inicio son obligatorios'); return; }
    const sDate = parseDateISO(start); const eDate = parseDateISO(end) || sDate;

    const editId = document.getElementById('ng_save').getAttribute('data-edit-id');
    if(editId){
      // update existing
      const idx = reservations.findIndex(x=> String(x.id)===String(editId));
      if(idx>-1){
        reservations[idx].name = name;
        reservations[idx].villa = villa;
        reservations[idx].type = type;
        reservations[idx].status = status;
        reservations[idx].startISO = start;
        reservations[idx].endISO = end || start;
        reservations[idx].start = start.split('-').slice(2).join(' ');
        reservations[idx].end = end ? end.split('-').slice(2).join(' ') : reservations[idx].end;
      }
    } else {
      // create new
      const id = Date.now();
      const newGroup = { id, name, start: start.split('-').slice(2).join(' '), end: end? end.split('-').slice(2).join(' '): '', year: sDate.getFullYear(), villa, type, status, itinerary:[], shoppingList:[], notes:'', startISO:start, endISO:end };
      reservations.push(newGroup);
    }

    saveState();
    closeNewGroupModal();
    render();
    renderCalendar(currentCalendarYear, currentCalendarMonth);
  };
}

// Theme helper: persist theme choice and allow toggling between default and carmine-primary
const THEME_KEY = 'villa_theme';
function applyThemeFromStorage(){
  const t = localStorage.getItem(THEME_KEY) || 'default';
  if(t === 'carmine') document.body.classList.add('theme-carmine-primary');
  else document.body.classList.remove('theme-carmine-primary');
}
function toggleTheme(){
  const isCarmine = document.body.classList.toggle('theme-carmine-primary');
  localStorage.setItem(THEME_KEY, isCarmine ? 'carmine' : 'default');
}

// Add a small theme toggle button in the header (creates it only once)
function ensureThemeToggle(){
  const header = document.querySelector('.header');
  if(!header) return;
  if(document.getElementById('themeToggle')) return;
  const btn = document.createElement('button');
  btn.id = 'themeToggle';
  btn.className = 'theme-toggle';
  btn.textContent = 'Tema alterno';
  btn.onclick = toggleTheme;
  const meta = header.querySelector('.meta');
  if(meta) meta.appendChild(btn);
  else header.appendChild(btn);
}

// Run theme setup early
applyThemeFromStorage();
window.addEventListener('DOMContentLoaded', ensureThemeToggle);

// --- rest of app (existing functions) ---

// Datos base y persistencia (mantenemos STORAGE_KEY)
const STORAGE_KEY = 'villa_manager_data_v1';

function safeParse(raw){ try{return JSON.parse(raw);}catch(e){return null;} }

let reservations = [];
if(localStorage.getItem(STORAGE_KEY)){
  const loaded = safeParse(localStorage.getItem(STORAGE_KEY));
  if(Array.isArray(loaded)) reservations = loaded;
}

if(!reservations || reservations.length===0){
  reservations = [
    { id:1, name: "Reservación VV", start: "22 Nov", end: "29 Nov", year:2025, villa:"Villa Verano", type:'vv', itinerary:[], shoppingList:[], notes:'' },
    { id:2, name: "Keneth", start: "26 Dic", end: "03 Ene", year:2025, villa:"Beach House", type:'bh', itinerary:[], shoppingList:[], notes:'' },
    { id:3, name: "Greg Leeh", start: "04 Ene", end: "07 Ene", year:2026, villa:"Villa Verano", type:'vv', itinerary:[], shoppingList:[], notes:'' }
  ];
}

function saveState(){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations)); }catch(e){ console.warn('no se pudo guardar',e); } }

const listEl = document.getElementById('list');
const panelEl = document.getElementById('panel');
const filtersEl = document.getElementById('filters');
const upcomingCountEl = document.getElementById('upcoming-count');
const statsEl = document.getElementById('stats');
const qEl = document.getElementById('q');

let filter = 'all';
let selectedId = null;
let activeTab = 'info';

function renderFilters(){
  const opts = [{k:'all',t:'Todos'},{k:'vv',t:'Villa Verano'},{k:'bh',t:'Beach House'},{k:'mixed',t:'Mixto'}];
  filtersEl.innerHTML='';
  opts.forEach(o=>{ const b=document.createElement('button'); b.className='pill'+(filter===o.k?' active':''); b.textContent=o.t; b.onclick=()=>{ filter=o.k; render(); }; filtersEl.appendChild(b); });
}

function matchesQuery(r,q){ if(!q) return true; q=q.toLowerCase(); return String(r.name).toLowerCase().includes(q) || String(r.villa).toLowerCase().includes(q); }
function filtered(){ let list = reservations.filter(r=> matchesQuery(r, qEl.value)); if(filter==='all') return list; if(filter==='vv') return list.filter(r=>r.type==='vv'); if(filter==='bh') return list.filter(r=>r.type==='bh'); if(filter==='mixed') return list.filter(r=>r.type==='mixed' || r.type==='all'); return list; }

function renderList(){ listEl.innerHTML=''; const items = filtered(); items.forEach(r=>{
  const card = document.createElement('div'); card.className='card'; if(selectedId===r.id) card.classList.add('selected');
  card.onclick = ()=>{ selectedId = r.id; openPanel(); render(); };
  const row = document.createElement('div'); row.className='row';
  const date = document.createElement('div'); date.className='date';
  const sm = document.createElement('small'); sm.textContent = (r.start||'').split(' ')[1] || '';
  const sd = document.createElement('strong'); sd.textContent = (r.start||'').split(' ')[0] || '';
  date.appendChild(sm); date.appendChild(sd);
  const meta = document.createElement('div'); meta.className='meta';
  const title = document.createElement('div'); title.className='title'; title.textContent = r.name;
  const mr = document.createElement('div'); mr.className='meta-row';
  const badge = document.createElement('div'); badge.className='badge'; badge.textContent = r.villa;
  const end = document.createElement('div'); end.style.color='var(--muted)'; end.style.fontSize='13px'; end.textContent = `${r.end} · ${r.year}`;
  mr.appendChild(badge); mr.appendChild(end);
  meta.appendChild(title); meta.appendChild(mr);
  row.appendChild(date); row.appendChild(meta); card.appendChild(row);
  if((r.itinerary && r.itinerary.length) || (r.shoppingList && r.shoppingList.length)){
    const foot = document.createElement('div'); foot.className='foot'; foot.textContent = (r.itinerary && r.itinerary.length? r.itinerary.length+' Actividades':'') + (r.itinerary && r.itinerary.length && r.shoppingList && r.shoppingList.length? ' · ':'') + (r.shoppingList && r.shoppingList.length? r.shoppingList.length+' Compras':''); card.appendChild(foot);
  }
  listEl.appendChild(card);
 });
 upcomingCountEl.textContent = reservations.length + ' grupos programados';
 statsEl.textContent = filtered().length + ' resultados';
}

function isWide(){ return window.matchMedia('(min-width:980px)').matches; }
function lockScroll(){ document.body.style.overflow = 'hidden'; }
function unlockScroll(){ document.body.style.overflow = ''; }

function openPanel(){ const kind = isWide() ? 'drawer' : 'modal'; panelEl.classList.remove('drawer','modal'); panelEl.classList.add('open', kind); panelEl.setAttribute('aria-hidden','false'); lockScroll(); renderPanel(); setTimeout(()=>{ window.addEventListener('keydown', escHandler); },10); panelEl.addEventListener('click', overlayClickHandler); }
function closePanel(){ saveState(); selectedId = null; panelEl.classList.remove('open','drawer','modal'); panelEl.setAttribute('aria-hidden','true'); render(); unlockScroll(); window.removeEventListener('keydown', escHandler); panelEl.removeEventListener('click', overlayClickHandler); }
function overlayClickHandler(e){ if(e.target === panelEl) closePanel(); }
function escHandler(e){ if(e.key === 'Escape'){ closePanel(); } }

function renderPanel(){
  const r = reservations.find(x=>x.id===selectedId);
  panelEl.innerHTML = '';
  if(!r){ const empty = document.createElement('div'); empty.className='empty'; empty.textContent = 'Selecciona un grupo para ver detalles.'; panelEl.appendChild(empty); return; }
  const container = document.createElement('div'); container.className = 'modal-content';
  const header = document.createElement('div'); header.className='modal-header';
  header.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><div><div style='font-weight:700;font-size:18px'>${r.name}</div><div style='color:var(--muted);margin-top:6px'>${r.start}  ${r.end} · ${r.year}</div></div><div style='text-align:right'><div style='font-size:13px;color:var(--muted)'>${r.villa}</div><div style='margin-top:8px'><button id='closePanelBtn' class='btn ghost'>Cerrar</button></div></div></div>`;
  container.appendChild(header);
  const nav = document.createElement('div'); nav.className='tabs'; ['info','itinerary','shopping'].forEach(t=>{ const b=document.createElement('div'); b.className='tab'+(activeTab===t? ' active':''); b.textContent = t==='info'? 'Resumen' : t==='itinerary'? 'Itinerario' : 'Compras'; b.onclick=()=>{ activeTab=t; renderPanel(); }; nav.appendChild(b); }); container.appendChild(nav);
  const body = document.createElement('div'); body.className='modal-body';
  if(activeTab==='info'){
    const notes = document.createElement('div'); notes.className='card'; notes.style.marginTop='12px'; notes.innerHTML = `<div style='font-weight:700;margin-bottom:8px'>Observaciones</div><textarea id='notes' style='width:100%;min-height:120px;border-radius:10px;border:1px solid rgba(15,23,42,0.06);padding:10px'>${r.notes||''}</textarea><div style='text-align:right;margin-top:8px'><button id='saveNote' class='btn'>Guardar observaciones</button></div>`; body.appendChild(notes);
    setTimeout(()=>{ const btn = document.getElementById('saveNote'); if(btn) btn.onclick = ()=>{ const ta = document.getElementById('notes'); if(ta){ r.notes = ta.value; saveState(); render(); } }; },10);
  }
  if(activeTab==='itinerary'){
    const add = document.createElement('div'); add.className='card'; add.innerHTML = `<div style='font-weight:700;margin-bottom:8px'>Agregar Actividad</div>`;
    const row = document.createElement('div'); row.className='input-row'; const input = document.createElement('input'); input.placeholder='Ej. Cena bienvenida'; const addBtn = document.createElement('button'); addBtn.className='btn'; addBtn.textContent='Agregar'; addBtn.onclick = ()=>{ if(input.value.trim()){ r.itinerary = r.itinerary||[]; r.itinerary.push({ id:Date.now(), text:input.value, completed:false }); input.value=''; saveState(); renderPanel(); renderList(); }}; row.appendChild(input); row.appendChild(addBtn); add.appendChild(row); body.appendChild(add);
    if(!r.itinerary || r.itinerary.length===0){ body.appendChild(Object.assign(document.createElement('div'),{className:'empty',innerHTML:'<div>Sin itinerario definido</div>'})); }
    else{ r.itinerary.forEach(it=>{ const li = document.createElement('div'); li.className='list-item'+(it.completed? ' completed':''); const chk = document.createElement('input'); chk.type='checkbox'; chk.checked=!!it.completed; chk.onchange = ()=>{ it.completed = chk.checked; saveState(); renderPanel(); renderList(); }; const txt = document.createElement('div'); txt.className='text'; txt.textContent = it.text; const del = document.createElement('button'); del.className='btn secondary ghost'; del.textContent='Eliminar'; del.onclick=()=>{ r.itinerary = r.itinerary.filter(x=>x.id!==it.id); saveState(); renderPanel(); renderList(); }; li.appendChild(chk); li.appendChild(txt); li.appendChild(del); body.appendChild(li); }); }
  }
  if(activeTab==='shopping'){
    const add = document.createElement('div'); add.className='card'; add.innerHTML = `<div style='font-weight:700;margin-bottom:8px'>Lista de Compras</div>`;
    const row = document.createElement('div'); row.className='input-row'; const input = document.createElement('input'); input.placeholder='Ej. Agua, Cervezas'; const addBtn = document.createElement('button'); addBtn.className='btn'; addBtn.textContent='Agregar'; addBtn.onclick = ()=>{ if(input.value.trim()){ r.shoppingList = r.shoppingList||[]; r.shoppingList.push({ id:Date.now(), text:input.value, completed:false }); input.value=''; saveState(); renderPanel(); renderList(); }}; row.appendChild(input); row.appendChild(addBtn); add.appendChild(row); body.appendChild(add);
    if(!r.shoppingList || r.shoppingList.length===0){ body.appendChild(Object.assign(document.createElement('div'),{className:'empty',innerHTML:'<div>Lista de compras vacía</div>'})); }
    else{ r.shoppingList.forEach(it=>{ const li = document.createElement('div'); li.className='list-item'+(it.completed? ' completed':''); const chk = document.createElement('input'); chk.type='checkbox'; chk.checked=!!it.completed; chk.onchange = ()=>{ it.completed = chk.checked; saveState(); renderPanel(); renderList(); }; const txt = document.createElement('div'); txt.className='text'; txt.textContent = it.text; const del = document.createElement('button'); del.className='btn secondary ghost'; del.textContent='Eliminar'; del.onclick=()=>{ r.shoppingList = r.shoppingList.filter(x=>x.id!==it.id); saveState(); renderPanel(); renderList(); }; li.appendChild(chk); li.appendChild(txt); li.appendChild(del); body.appendChild(li); }); }
  }
  const footer = document.createElement('div'); footer.className='modal-footer'; footer.style.padding='12px'; footer.style.borderTop='1px solid rgba(15,23,42,0.04)'; footer.innerHTML = `<div style='display:flex;justify-content:space-between;align-items:center'><span class='text-xs' style='color:var(--muted)'>Última actualización: ahora</span><div><button id='saveClose' class='btn ghost'>Guardar</button> <button id='closeBtn' class='btn'>Cerrar</button></div></div>`;
  container.appendChild(body); container.appendChild(footer); panelEl.appendChild(container);
  document.getElementById('closePanelBtn')?.addEventListener('click', closePanel);
  document.getElementById('closeBtn')?.addEventListener('click', closePanel);
  document.getElementById('saveClose')?.addEventListener('click', ()=>{ saveState(); closePanel(); });
}

function render(){ renderFilters(); renderList(); }
qEl.addEventListener('input', ()=>{ render(); });
window.addEventListener('resize', ()=>{ if(panelEl.classList.contains('open')){ const kind = isWide() ? 'drawer' : 'modal'; panelEl.classList.remove('drawer','modal'); panelEl.classList.add(kind); }});

// ensure theme toggle appears after initial render
render();
setTimeout(ensureThemeToggle, 80);

console.log('Theme toggling + accessible palette loaded');

// --- Calendar and New Group UI ---
function formatDateInput(d){ if(!d) return ''; const dt = new Date(d); const yyyy = dt.getFullYear(); const mm = String(dt.getMonth()+1).padStart(2,'0'); const dd = String(dt.getDate()).padStart(2,'0'); return `${yyyy}-${mm}-${dd}`; }

function parseDateISO(s){ if(!s) return null; const t = new Date(s); return isNaN(t) ? null : t; }

function addNewGroupUI(){
  const btn = document.getElementById('newGroupBtn');
  const modal = document.getElementById('newGroupModal');
  if(!btn || !modal) return;
  btn.onclick = ()=> openNewGroupModal();
}

function openNewGroupModal(){
  const modal = document.getElementById('newGroupModal');
  modal.innerHTML = '';
  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden','false');
  modal.classList.add('modal','open');
  modal.innerHTML = `<div class="modal-wrap"><h3>Crear Nuevo Grupo</h3>
    <div class="form-row"><div style='flex:1'><label>Nombre</label><input id='ng_name' type='text' placeholder='Nombre del grupo'></div><div style='width:140px'><label>Villa</label><select id='ng_villa'><option value='Villa Verano'>Villa Verano</option><option value='Beach House'>Beach House</option><option value='Todas las Villas'>Todas las Villas</option></select></div></div>
    <div class="form-row"><div style='flex:1'><label>Fecha inicio</label><input id='ng_start' type='date'></div><div style='flex:1'><label>Fecha fin</label><input id='ng_end' type='date'></div></div>
    <div class="form-row"><div style='flex:1'><label>Tipo</label><select id='ng_type'><option value='vv'>vv</option><option value='bh'>bh</option><option value='mixed'>mixed</option><option value='all'>all</option></select></div><div style='width:140px'><label>Estado</label><select id='ng_status'><option value='upcoming'>upcoming</option><option value='active'>active</option><option value='completed'>completed</option></select></div></div>
    <div class="actions"><button id='ng_cancel' class='btn ghost'>Cancelar</button><button id='ng_save' class='btn'>Crear grupo</button></div>
  </div>`;

  document.getElementById('ng_cancel').onclick = ()=> closeNewGroupModal();
  document.getElementById('ng_save').onclick = ()=>{
    const name = document.getElementById('ng_name').value.trim();
    const villa = document.getElementById('ng_villa').value;
    const start = document.getElementById('ng_start').value;
    const end = document.getElementById('ng_end').value;
    const type = document.getElementById('ng_type').value;
    const status = document.getElementById('ng_status').value;
    if(!name || !start){ alert('Nombre y fecha inicio son obligatorios'); return; }
    const sDate = parseDateISO(start); const eDate = parseDateISO(end) || sDate;
    const nights = Math.max(1, Math.ceil((eDate - sDate)/(1000*60*60*24)));
    const id = Date.now();
    const newGroup = { id, name, start: start.split('-').slice(2).join(' '), end: end? end.split('-').slice(2).join(' '): '', year: sDate.getFullYear(), villa, type, status, itinerary:[], shoppingList:[], notes:'', startISO:start, endISO:end };
    reservations.push(newGroup);
    saveState();
    closeNewGroupModal();
    render();
    renderCalendar(currentCalendarYear, currentCalendarMonth);
  };
}
function closeNewGroupModal(){ const modal = document.getElementById('newGroupModal'); if(!modal) return; modal.style.display='none'; modal.setAttribute('aria-hidden','true'); modal.innerHTML=''; }

// calendar implementation
let currentCalendarYear = (new Date()).getFullYear();
let currentCalendarMonth = (new Date()).getMonth();

function startOfMonth(year, month){ return new Date(year, month, 1); }
function daysInMonth(year, month){ return new Date(year, month+1, 0).getDate(); }

function renderCalendar(year, month){
  currentCalendarYear = year; currentCalendarMonth = month;
  const cal = document.getElementById('calendar'); if(!cal) return;
  cal.innerHTML = '';
  const header = document.createElement('div'); header.className='cal-header';
  const prev = document.createElement('button'); prev.innerHTML=''; prev.onclick = ()=> renderCalendarShift(-1);
  const next = document.createElement('button'); next.innerHTML=''; next.onclick = ()=> renderCalendarShift(1);
  const title = document.createElement('div'); const monthName = startOfMonth(year,month).toLocaleString('es-ES',{month:'long'}); title.textContent = `${monthName} ${year}`;
  const nav = document.createElement('div'); nav.className='cal-nav'; nav.appendChild(prev); nav.appendChild(next);
  header.appendChild(title); header.appendChild(nav);
  cal.appendChild(header);

  const grid = document.createElement('div'); grid.className='cal-grid';
  const weekDays = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
  weekDays.forEach(w=>{ const d = document.createElement('div'); d.className='cal-day'; d.style.fontWeight='700'; d.textContent = w; grid.appendChild(d); });

  const firstDay = new Date(year, month, 1).getDay(); // 0 Sun - 6 Sat
  // convert to Mon=0..Sun=6
  const offset = (firstDay + 6) % 7;
  for(let i=0;i<offset;i++){ const empty = document.createElement('div'); empty.className='cal-day'; grid.appendChild(empty); }

  const dim = daysInMonth(year,month);
  const today = new Date();
  for(let d=1; d<=dim; d++){
    const cell = document.createElement('div'); cell.className='cal-day'; cell.textContent = d;
    const cellDateISO = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    // mark today
    if(today.getFullYear()===year && today.getMonth()===month && today.getDate()===d){ cell.classList.add('today'); }
    // check groups overlapping this date
    const groupsOnDay = reservations.filter(r=>{
      const s = parseDateISO(r.startISO || r.start); const e = parseDateISO(r.endISO || r.end) || s;
      if(!s) return false;
      const target = new Date(year, month, d);
      return target >= new Date(s.getFullYear(), s.getMonth(), s.getDate()) && target <= new Date(e.getFullYear(), e.getMonth(), e.getDate());
    });
    if(groupsOnDay.length>0){ cell.classList.add('has-group'); cell.title = groupsOnDay.map(g=>g.name).join('\n'); }
    cell.onclick = ()=>{ if(groupsOnDay.length>0){ alert('Grupos\n' + groupsOnDay.map(g=>`${g.name}  ${g.villa}`).join('\n')); } };
    grid.appendChild(cell);
  }

  cal.appendChild(grid);
}

function renderCalendarShift(deltaMonths){ let m = currentCalendarMonth + deltaMonths; let y = currentCalendarYear; if(m<0){ m=11; y -=1; } else if(m>11){ m=0; y+=1; } renderCalendar(y,m); }

// initialize calendar and new-group UI after main render
setTimeout(()=>{ renderCalendar(currentCalendarYear, currentCalendarMonth); addNewGroupUI(); },120);




function openDayPanel(year, month, day){
  const panel = document.getElementById('panel');
  const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  const pretty = new Date(dateStr).toLocaleDateString(undefined,{weekday:'long', year:'numeric', month:'short', day:'numeric'});
  const groups = reservations.filter(g => g.startISO && g.endISO && dateStr >= g.startISO && dateStr <= g.endISO);
  panel.innerHTML = '';
  panel.classList.add('open');
  panel.setAttribute('aria-hidden','false');
  lockScroll();

  // Header
  const header = document.createElement('div'); header.className = 'panel-header';
  header.innerHTML = `<div><div class='panel-title'>${pretty}</div><div class='panel-sub'>${groups.length} grupo(s) este día</div></div><div><button class='btn ghost small' id='closePanelBtn'>Cerrar</button></div>`;
  panel.appendChild(header);
  document.getElementById('closePanelBtn').onclick = ()=>{ panel.classList.remove('open'); panel.setAttribute('aria-hidden','true'); unlockScroll(); };

  // Body
  const body = document.createElement('div'); body.className = 'panel-body day-panel';
  if(groups.length===0){ body.innerHTML = `<div class='empty'>No hay grupos en esta fecha. <br><button class='btn' id='createFromDay'>Crear grupo aquí</button></div>`;
    body.querySelector('#createFromDay').onclick = ()=>{ openNewGroupModal({ startISO: dateStr, endISO: dateStr, start: dateStr.split('-').slice(2).join(' '), end: dateStr.split('-').slice(2).join(' ')}); };
  } else {
    groups.forEach(g=>{
      const card = document.createElement('div'); card.className = 'group-card';
      card.innerHTML = `<div class='group-top'><div><div class='group-name'>${escapeHtml(g.name)}</div><div class='group-meta'>${g.villa || ''}  ${g.startISO || g.start}  ${g.endISO || g.end}</div></div><div class='btn-group'><button class='btn small' data-edit='${g.id}'>Editar</button><button class='btn ghost small' data-delete='${g.id}'>Eliminar</button></div></div><div class='group-desc' style='font-size:0.9rem;color:rgba(2,6,23,0.6)'>${(g.itinerary && g.itinerary.length)? 'Itinerario: ' + g.itinerary.join(', '): ''}</div>`;
      body.appendChild(card);

      // Edit handler
      card.querySelector("button[data-edit]").addEventListener('click', (e)=>{ const id = Number(e.currentTarget.getAttribute('data-edit')); openEditGroup(id); });

      // Delete handler with inline confirm
      const delBtn = card.querySelector("button[data-delete]");
      delBtn.addEventListener('click', (e)=>{
        if(card.querySelector('.confirm-delete')) return; // already confirming
        const confirmWrap = document.createElement('div'); confirmWrap.className = 'confirm-delete';
        confirmWrap.innerHTML = `<div class='warn'>¿Eliminar?</div><button class='btn ghost small confirm-yes'>Confirmar</button><button class='btn small confirm-no'>Cancelar</button>`;
        card.appendChild(confirmWrap);
        confirmWrap.querySelector('.confirm-no').addEventListener('click', ()=> confirmWrap.remove());
        confirmWrap.querySelector('.confirm-yes').addEventListener('click', ()=>{
          const id = Number(e.currentTarget.getAttribute('data-delete'));
          const idx = reservations.findIndex(r=>r.id===id);
          if(idx>-1){ reservations.splice(idx,1); saveState(); render(); renderCalendar(currentCalendarYear, currentCalendarMonth); }
          confirmWrap.remove();
        });
      });
    });
  }

  panel.appendChild(body);

  // Footer quick actions
  const footer = document.createElement('div'); footer.className = 'panel-footer'; footer.style.padding = '12px 16px'; footer.style.borderTop='1px solid rgba(255,255,255,0.04)';
  footer.innerHTML = `<div style='display:flex;gap:8px;justify-content:space-between;align-items:center'><div><button class='btn' id='addGroupBtn'>+ Nuevo Grupo</button></div><div><button class='btn ghost small' id='closePanel2'>Cerrar</button></div></div>`;
  panel.appendChild(footer);
  document.getElementById('addGroupBtn').onclick = ()=> openNewGroupModal({ startISO: dateStr, endISO: dateStr });
  document.getElementById('closePanel2').onclick = ()=>{ panel.classList.remove('open'); panel.setAttribute('aria-hidden','true'); unlockScroll(); };
}

function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }



// Calendar dropdown toggle (attach after DOM ready)
function setupCalendarDropdown(){
  const toggle = document.getElementById('calendarToggle');
  const dd = document.getElementById('calendarDropdown');
  if(!toggle || !dd) return;
  const open = ()=>{ dd.style.display='block'; dd.setAttribute('aria-hidden','false'); toggle.setAttribute('aria-expanded','true'); renderCalendar(currentCalendarYear, currentCalendarMonth); };
  const close = ()=>{ dd.style.display='none'; dd.setAttribute('aria-hidden','true'); toggle.setAttribute('aria-expanded','false'); };
  toggle.addEventListener('click', (e)=>{ e.stopPropagation(); if(dd.style.display==='block') close(); else open(); });
  // click outside to close
  document.addEventListener('click', (e)=>{ if(!dd.contains(e.target) && !toggle.contains(e.target)) close(); });
  // Esc to close
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') close(); });
}

// initialize after DOM is ready
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupCalendarDropdown); else setupCalendarDropdown();

