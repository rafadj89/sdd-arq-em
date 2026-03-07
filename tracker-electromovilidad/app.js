// Project Tracker Electromovilidad — UPME — Engine
// ── Firebase Config ──
const firebaseConfig={apiKey:'AIzaSyDL3w7XNewKW6OxiggAXTs0aGwZeFLWwV0',authDomain:'upme-tracker-electro.firebaseapp.com',projectId:'upme-tracker-electro',storageBucket:'upme-tracker-electro.firebasestorage.app',messagingSenderId:'431585807289',appId:'1:431585807289:web:5835de74971e68ea868468'};
firebase.initializeApp(firebaseConfig);
const fbAuth=firebase.auth();
const googleProvider=new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({hd:'upme.gov.co'});
const fbStorage=firebase.storage();
const STORAGE_KEY='upme-tracker-kanban-v1',SESSION_KEY='upme-session';
const BOARDS={gerencial:{id:'gerencial',name:'Equipo Gerencial',icon:'🏢',columns:[{id:'backlog',name:'Backlog',color:'#94a3b8'},{id:'por_gestionar',name:'Por Gestionar',color:'#8b5cf6'},{id:'en_gestion',name:'En Gestión',color:'#3b82f6'},{id:'en_revision',name:'En Revisión',color:'#f59e0b'},{id:'resuelto',name:'Resuelto',color:'#10b981'}]},desarrollo:{id:'desarrollo',name:'Equipo Desarrollo',icon:'💻',columns:[{id:'backlog',name:'Backlog',color:'#94a3b8'},{id:'todo',name:'To Do',color:'#8b5cf6'},{id:'en_desarrollo',name:'En Desarrollo',color:'#3b82f6'},{id:'code_review',name:'Code Review',color:'#f59e0b'},{id:'qa_testing',name:'QA / Testing',color:'#ec4899'},{id:'done',name:'Done',color:'#10b981'}]}};
const PHASE_NAMES={'phase-1':'Fase 1: Diseño & Contratación','phase-2':'Fase 2: Infra & Core OCPI','phase-3':'Fase 3: Data Lake & Seguridad','phase-4':'Fase 4: Portal & Integración','phase-5':'Fase 5: Testing & Pre-Prod','phase-6':'Fase 6: Go-Live & Operación'};
const CAPA_NAMES={normativo:'⚖️ Normativo',contratacion:'📋 Contratación',arquitectura:'🏗️ Arquitectura',datos:'📊 Datos',seguridad:'🔒 Seguridad',infraestructura:'🖥️ Infra',devops:'⚙️ DevOps',desarrollo:'💻 Desarrollo',documentacion:'📄 Doc',delivery:'🚀 Delivery',integracion:'🔗 Integración'};
const CAPA_COLORS={normativo:'bg-amber-100 text-amber-800',contratacion:'bg-orange-100 text-orange-800',arquitectura:'bg-blue-100 text-blue-800',datos:'bg-emerald-100 text-emerald-800',seguridad:'bg-red-100 text-red-800',infraestructura:'bg-purple-100 text-purple-800',devops:'bg-violet-100 text-violet-800',desarrollo:'bg-sky-100 text-sky-800',documentacion:'bg-teal-100 text-teal-800',delivery:'bg-indigo-100 text-indigo-800',integracion:'bg-cyan-100 text-cyan-800'};
const AVATAR_COLORS=['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#f97316'];
function uid(){return'id-'+Date.now()+'-'+Math.random().toString(36).substr(2,6)}
function fmtDate(d){if(!d)return'—';try{return new Date(d+'T12:00:00').toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric'})}catch(e){return d}}
function fmtDateTime(d){if(!d)return'—';try{return new Date(d).toLocaleString('es-CO',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}catch(e){return d}}
function daysBetween(a,b){return Math.ceil((new Date(b)-new Date(a))/864e5)}
function initials(n){return(n||'?').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}
function avatarColor(n){let h=0;for(let i=0;i<(n||'').length;i++)h=n.charCodeAt(i)+((h<<5)-h);return AVATAR_COLORS[Math.abs(h)%AVATAR_COLORS.length]}
function getUserName(id){const u=(DATA.users||[]).find(x=>x.id===id);return u?u.name:(id||'—')}
function getColumnName(bId,cId){const b=BOARDS[bId];if(!b)return cId;const c=b.columns.find(x=>x.id===cId);return c?c.name:cId}
function isCompleted(bId,cId){const b=BOARDS[bId];if(!b)return false;const cols=b.columns;return cols.length>0&&cols[cols.length-1].id===cId}
function todayStr(){return new Date().toISOString().split('T')[0]}

let DATA={},currentUser=null,currentBoard='desarrollo',currentView='kanban',searchQuery='',sortableInstances=[],chartStatus=null,chartCapas=null;
let phaseCollapsed={},tlCollapsed={},timelineZoom='6m',timelineOffset=0;

function loadData(){const s=localStorage.getItem(STORAGE_KEY);try{DATA=s?JSON.parse(s):getDefaultData()}catch(e){DATA=getDefaultData()}if(!DATA.users||DATA.users.length===0)DATA=getDefaultData()}
function saveData(){DATA.lastUpdated=new Date().toISOString();localStorage.setItem(STORAGE_KEY,JSON.stringify(DATA))}
function exportAllData(){const b=new Blob([JSON.stringify(DATA,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`tracker-${todayStr()}.json`;a.click()}

function matchGoogleUser(email,displayName){const e=email.toLowerCase();let user=(DATA.users||[]).find(u=>u.email.toLowerCase()===e&&u.active);if(user)return user;user=(DATA.users||[]).find(u=>u.active&&u.role==='admin'&&u.email.toLowerCase()===e);if(user)return user;return null}
function doGoogleLogin(){loadData();const err=document.getElementById('login-error');err.classList.add('hidden');fbAuth.signInWithPopup(googleProvider).then(result=>{const email=result.user.email;if(!email.endsWith('@upme.gov.co')){fbAuth.signOut();err.textContent='Solo cuentas @upme.gov.co están autorizadas.';err.classList.remove('hidden');return}const user=matchGoogleUser(email,result.user.displayName);if(!user){fbAuth.signOut();err.textContent='Tu correo ('+email+') no está registrado en el sistema. Contacta al administrador.';err.classList.remove('hidden');return}currentUser=user;sessionStorage.setItem(SESSION_KEY,JSON.stringify({userId:user.id,method:'google'}));err.classList.add('hidden');document.getElementById('login-screen').classList.add('hidden');document.getElementById('app').classList.remove('hidden');initApp()}).catch(e=>{console.error('Google login error:',e);if(e.code==='auth/popup-closed-by-user')return;err.textContent='Error al iniciar sesión con Google: '+(e.message||e.code);err.classList.remove('hidden')})}
function doLogin(){loadData();const email=document.getElementById('login-email').value.trim().toLowerCase();const pw=document.getElementById('login-password').value;const user=(DATA.users||[]).find(u=>u.email.toLowerCase()===email&&u.password===pw&&u.active);const err=document.getElementById('login-error');if(!user){err.textContent='Credenciales inválidas o usuario inactivo.';err.classList.remove('hidden');return}currentUser=user;sessionStorage.setItem(SESSION_KEY,JSON.stringify({userId:user.id,method:'password'}));err.classList.add('hidden');document.getElementById('login-screen').classList.add('hidden');document.getElementById('app').classList.remove('hidden');initApp()}
function doLogout(){currentUser=null;sessionStorage.removeItem(SESSION_KEY);fbAuth.signOut().catch(()=>{});document.getElementById('app').classList.add('hidden');document.getElementById('login-screen').classList.remove('hidden')}
function restoreSession(){loadData();const s=sessionStorage.getItem(SESSION_KEY);if(s){try{const{userId}=JSON.parse(s);const u=(DATA.users||[]).find(x=>x.id===userId&&x.active);if(u){currentUser=u;return true}}catch(e){}}return false}

function canAccessBoard(bId){if(!currentUser)return false;if(currentUser.role==='admin')return true;if(currentUser.team==='both')return true;return currentUser.team===bId}
function initApp(){document.getElementById('user-name').textContent=currentUser.name;document.getElementById('user-role').textContent=currentUser.role==='admin'?'Administrador':currentUser.team==='gerencial'?'Equipo Gerencial':currentUser.team==='desarrollo'?'Equipo Desarrollo':'Miembro';const av=document.getElementById('user-avatar');av.textContent=initials(currentUser.name);av.style.background=avatarColor(currentUser.name);document.getElementById('nav-admin').classList.toggle('hidden',currentUser.role!=='admin');if(currentUser.team==='gerencial'&&currentUser.role!=='admin')currentBoard='gerencial';else if(currentUser.team==='desarrollo'&&currentUser.role!=='admin')currentBoard='desarrollo';populateReportSelectors();renderAll()}

function showView(name){currentView=name;document.querySelectorAll('.view-panel').forEach(p=>p.classList.remove('active'));document.getElementById('view-'+name).classList.add('active');document.querySelectorAll('nav .sidebar-item').forEach((s,i)=>{s.classList.remove('active')});const items=document.querySelectorAll('nav .sidebar-item');const map={kanban:0,fases:1,timeline:2,dashboard:3,mytasks:4,compromisos:5,informes:6,equipo:7,admin:8};if(items[map[name]])items[map[name]].classList.add('active');const titles={kanban:'Tablero Kanban',fases:'Fases / Épicas',timeline:'Timeline del Proyecto',dashboard:'Dashboard General',mytasks:'Mi Trabajo',compromisos:'Compromisos',informes:'Informes',equipo:'Equipo del Proyecto',admin:'Administración'};document.getElementById('view-title').textContent=titles[name]||name;document.getElementById('view-subtitle').textContent=(name==='kanban'||name==='fases'||name==='timeline')?'— '+BOARDS[currentBoard].name:'';if(name==='dashboard')renderDashboard();if(name==='mytasks')renderMyTasks();if(name==='compromisos')renderCommitments();if(name==='informes')generateReport();if(name==='admin')renderAdmin();if(name==='kanban')renderKanban();if(name==='fases')renderPhases();if(name==='timeline')renderTimeline();if(name==='equipo')renderEquipo()}

function switchBoard(bId){if(!canAccessBoard(bId))return;currentBoard=bId;document.getElementById('view-subtitle').textContent='— '+BOARDS[currentBoard].name;renderBoardSelector();renderBoardTabs();if(currentView==='kanban')renderKanban();if(currentView==='fases')renderPhases();if(currentView==='timeline')renderTimeline();if(currentView==='dashboard')renderDashboard()}
function onSearch(q){searchQuery=q.toLowerCase();renderKanban()}

function renderAll(){renderBoardSelector();renderBoardTabs();populateFilters();renderKanban()}
function renderBoardSelector(){const el=document.getElementById('board-selector');el.innerHTML=Object.values(BOARDS).filter(b=>canAccessBoard(b.id)).map(b=>{const a=b.id===currentBoard;const c=(DATA.tasks||[]).filter(t=>t.board===b.id&&!t.discarded).length;return`<div class="sidebar-item ${a?'active':''}" onclick="switchBoard('${b.id}')"><span>${b.icon}</span><span class="flex-1 text-xs">${b.name}</span><span class="text-[10px] opacity-60">${c}</span></div>`}).join('')}
function renderBoardTabs(){document.getElementById('kanban-board-tabs').innerHTML=Object.values(BOARDS).filter(b=>canAccessBoard(b.id)).map(b=>`<div class="board-tab ${b.id===currentBoard?'active-board':''}" onclick="switchBoard('${b.id}')">${b.icon} ${b.name}</div>`).join('')}
function populateFilters(){const sel=document.getElementById('kf-assignee');const users=DATA.users||[];sel.innerHTML='<option value="all">Todos</option>'+users.filter(u=>u.active).map(u=>`<option value="${u.id}">${u.name}</option>`).join('');const tm=document.getElementById('tm-assignee');tm.innerHTML='<option value="">Sin asignar</option>'+users.filter(u=>u.active).map(u=>`<option value="${u.id}">${u.name}</option>`).join('')}
function getTeamLabel(team){return team==='gerencial'?'Gerencial':team==='desarrollo'?'Desarrollo':team==='both'?'Ambos equipos':'—'}

// ── KANBAN ──
function renderKanban(){
    const container=document.getElementById('kanban-container');
    const board=BOARDS[currentBoard];
    const fA=document.getElementById('kf-assignee').value;
    const fP=document.getElementById('kf-priority').value;
    let tasks=(DATA.tasks||[]).filter(t=>t.board===currentBoard&&!t.discarded);
    if(fA!=='all')tasks=tasks.filter(t=>t.assignee===fA);
    if(fP!=='all')tasks=tasks.filter(t=>t.priority===fP);
    if(searchQuery)tasks=tasks.filter(t=>t.title.toLowerCase().includes(searchQuery)||(t.description||'').toLowerCase().includes(searchQuery));
    sortableInstances.forEach(s=>s.destroy());sortableInstances=[];
    container.innerHTML=board.columns.map(col=>{
        const ct=tasks.filter(t=>t.column===col.id);
        const isLast=col.id===board.columns[board.columns.length-1].id;
        return`<div class="kanban-col flex-shrink-0"><div class="px-4 py-3 flex items-center justify-between" style="border-bottom:3px solid ${col.color}"><div class="flex items-center gap-2"><span class="font-bold text-sm text-slate-700">${col.name}</span><span class="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-semibold">${ct.length}</span></div><button onclick="openTaskModalCol('${col.id}')" class="text-slate-400 hover:text-blue-500 text-lg leading-none" title="Agregar">+</button></div><div class="kanban-col-body" id="col-${col.id}" data-column="${col.id}">${ct.map(t=>kanbanCard(t,isLast)).join('')}</div></div>`;
    }).join('');
    board.columns.forEach(col=>{
        const el=document.getElementById('col-'+col.id);
        if(el){const s=new Sortable(el,{group:'kb-'+currentBoard,animation:200,ghostClass:'sortable-ghost',chosenClass:'sortable-chosen',onEnd:function(evt){const tid=evt.item.dataset.taskId;const nc=evt.to.dataset.column;const oc=evt.from.dataset.column;if(tid&&nc!==oc)moveTask(tid,nc)}});sortableInstances.push(s)}
    });
}

function kanbanCard(t,isDone){
    const u=(DATA.users||[]).find(x=>x.id===t.assignee);const uN=u?u.name:'';
    const cc=CAPA_COLORS[t.capa]||'bg-slate-100 text-slate-600';const cn=CAPA_NAMES[t.capa]||'';
    const over=!isDone&&t.end&&t.end<todayStr();
    const pc=t.priority==='alta'?'p-alta':t.priority==='media'?'p-media':'p-baja';
    const nLinks=(t.links||[]).length;const nComments=(t.comments||[]).length;
    return`<div class="kanban-card ${over?'border-red-300 bg-red-50/30':''}" data-task-id="${t.id}" ondblclick="openDetailModal('${t.id}')"><div class="flex items-start gap-2 mb-2"><div class="priority-dot ${pc} mt-1.5"></div><span class="text-xs font-semibold text-slate-800 leading-snug flex-1">${t.title}</span></div><div class="flex items-center gap-1 flex-wrap mb-2">${cn?`<span class="badge ${cc}">${cn}</span>`:''}${t.tipo==='normativo'?'<span class="badge bg-amber-200 text-amber-900">⚖️</span>':''}${over?'<span class="badge bg-red-100 text-red-700">⚠</span>':''}</div><div class="flex items-center justify-between"><div class="flex items-center gap-2"><span class="text-[10px] text-slate-400">${t.end?fmtDate(t.end):''}</span>${nLinks?`<span class="text-[10px] text-slate-400" title="${nLinks} documento(s)">📎${nLinks}</span>`:''}${nComments?`<span class="text-[10px] text-slate-400" title="${nComments} comentario(s)">💬${nComments}</span>`:''}</div><div class="flex items-center gap-1">${uN?`<div class="avatar" style="width:22px;height:22px;font-size:9px;background:${avatarColor(uN)}" title="${uN}">${initials(uN)}</div>`:''}<button onclick="event.stopPropagation();openTaskModal('${t.id}')" class="text-slate-300 hover:text-blue-500 text-xs">✏️</button></div></div></div>`;
}

function moveTask(taskId,newCol){
    const task=(DATA.tasks||[]).find(t=>t.id===taskId);if(!task)return;
    const old=task.column;task.column=newCol;
    if(!task.history)task.history=[];
    task.history.push({action:'moved',fromColumn:old,column:newCol,timestamp:new Date().toISOString(),userId:currentUser?currentUser.id:'system'});
    if(isCompleted(task.board,newCol))task.completedAt=new Date().toISOString();
    else task.completedAt=null;
    saveData();renderBoardSelector();
}

function openTaskModalCol(colId){openTaskModal();document.getElementById('tm-board').value=currentBoard;updateColumnSelect();document.getElementById('tm-column').value=colId}

// ── LINKS TEMP STATE ──
let tempLinks=[];
function renderModalLinks(){
    const el=document.getElementById('tm-links-list');
    if(!tempLinks.length){el.innerHTML='<div class="text-[10px] text-slate-400">Sin documentos adjuntos.</div>';return}
    el.innerHTML=tempLinks.map((l,i)=>`<div class="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-1.5"><span class="text-xs">📄</span><a href="${l.url}" target="_blank" class="text-xs text-blue-600 hover:underline flex-1 truncate" title="${l.url}">${l.title||l.url}</a><button type="button" onclick="removeLinkFromModal(${i})" class="text-red-400 hover:text-red-600 text-xs">✕</button></div>`).join('');
}
function addLinkToModal(){
    const tEl=document.getElementById('tm-link-title'),uEl=document.getElementById('tm-link-url');
    const title=tEl.value.trim(),url=uEl.value.trim();
    if(!url){alert('La URL es requerida.');return}
    tempLinks.push({id:uid(),title:title||url,url});
    tEl.value='';uEl.value='';renderModalLinks();
}
function removeLinkFromModal(i){tempLinks.splice(i,1);renderModalLinks()}

// ── TASK MODAL ──
function updateColumnSelect(){const bId=document.getElementById('tm-board').value;const b=BOARDS[bId];document.getElementById('tm-column').innerHTML=b.columns.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}

function openTaskModal(editId){
    const modal=document.getElementById('task-modal');
    if(editId&&typeof editId==='string'){
        const t=(DATA.tasks||[]).find(x=>x.id===editId);
        if(t){document.getElementById('tm-title-h').textContent='Editar Tarea';document.getElementById('tm-id').value=t.id;document.getElementById('tm-title').value=t.title;document.getElementById('tm-desc').value=t.description||'';document.getElementById('tm-board').value=t.board;updateColumnSelect();document.getElementById('tm-column').value=t.column;document.getElementById('tm-capa').value=t.capa||'arquitectura';document.getElementById('tm-phase').value=t.phase||'phase-1';document.getElementById('tm-priority').value=t.priority||'media';document.getElementById('tm-tipo').value=t.tipo||'tecnico';document.getElementById('tm-assignee').value=t.assignee||'';document.getElementById('tm-start').value=t.start||'';document.getElementById('tm-end').value=t.end||'';tempLinks=(t.links||[]).map(l=>({...l}));renderModalLinks();const canDiscard=currentUser&&(currentUser.role==='admin'||t.createdBy===currentUser.id);document.getElementById('tm-del-btn').classList.toggle('hidden',!canDiscard);modal.classList.remove('hidden');return}
    }
    document.getElementById('tm-title-h').textContent='Nueva Tarea';document.getElementById('tm-id').value='';document.getElementById('tm-title').value='';document.getElementById('tm-desc').value='';document.getElementById('tm-board').value=currentBoard;updateColumnSelect();document.getElementById('tm-capa').value='arquitectura';document.getElementById('tm-phase').value='phase-1';document.getElementById('tm-priority').value='media';document.getElementById('tm-tipo').value='tecnico';document.getElementById('tm-assignee').value='';document.getElementById('tm-start').value='';document.getElementById('tm-end').value='';tempLinks=[];renderModalLinks();document.getElementById('tm-del-btn').classList.add('hidden');modal.classList.remove('hidden');
}
function closeTaskModal(){document.getElementById('task-modal').classList.add('hidden')}

function saveTask(){
    const id=document.getElementById('tm-id').value;const title=document.getElementById('tm-title').value.trim();
    if(!title){alert('Título requerido.');return}
    const bVal=document.getElementById('tm-board').value,cVal=document.getElementById('tm-column').value,now=new Date().toISOString();
    const fields={title,description:document.getElementById('tm-desc').value.trim(),board:bVal,column:cVal,capa:document.getElementById('tm-capa').value,phase:document.getElementById('tm-phase').value,priority:document.getElementById('tm-priority').value,tipo:document.getElementById('tm-tipo').value,assignee:document.getElementById('tm-assignee').value,start:document.getElementById('tm-start').value,end:document.getElementById('tm-end').value,links:tempLinks.slice()};
    if(id){
        const task=DATA.tasks.find(t=>t.id===id);
        if(task){
            if(!task.history)task.history=[];
            const uid_=currentUser.id;
            // Track each field change individually
            if(task.title!==fields.title)task.history.push({action:'field_changed',field:'title',from:task.title,to:fields.title,column:cVal,timestamp:now,userId:uid_});
            if((task.description||'')!==(fields.description||''))task.history.push({action:'field_changed',field:'description',from:(task.description||'').substring(0,60),to:(fields.description||'').substring(0,60),column:cVal,timestamp:now,userId:uid_});
            if(task.priority!==fields.priority)task.history.push({action:'field_changed',field:'priority',from:task.priority,to:fields.priority,column:cVal,timestamp:now,userId:uid_});
            if(task.assignee!==fields.assignee)task.history.push({action:'field_changed',field:'assignee',from:task.assignee,to:fields.assignee,column:cVal,timestamp:now,userId:uid_});
            if(task.start!==fields.start)task.history.push({action:'field_changed',field:'start',from:task.start,to:fields.start,column:cVal,timestamp:now,userId:uid_});
            if(task.end!==fields.end)task.history.push({action:'field_changed',field:'end',from:task.end,to:fields.end,column:cVal,timestamp:now,userId:uid_});
            if(task.phase!==fields.phase)task.history.push({action:'field_changed',field:'phase',from:task.phase,to:fields.phase,column:cVal,timestamp:now,userId:uid_});
            if(task.capa!==fields.capa)task.history.push({action:'field_changed',field:'capa',from:task.capa,to:fields.capa,column:cVal,timestamp:now,userId:uid_});
            if(task.tipo!==fields.tipo)task.history.push({action:'field_changed',field:'tipo',from:task.tipo,to:fields.tipo,column:cVal,timestamp:now,userId:uid_});
            if(task.board!==fields.board)task.history.push({action:'field_changed',field:'board',from:task.board,to:fields.board,column:cVal,timestamp:now,userId:uid_});
            if(task.column!==cVal)task.history.push({action:'moved',fromColumn:task.column,column:cVal,timestamp:now,userId:uid_});
            // Detect link additions/removals via modal
            const oldIds=new Set((task.links||[]).map(l=>l.id));const newIds=new Set((fields.links||[]).map(l=>l.id));
            (fields.links||[]).filter(l=>!oldIds.has(l.id)).forEach(l=>task.history.push({action:'link_added',column:cVal,timestamp:now,userId:uid_,message:'Enlace agregado: '+(l.title||l.url)}));
            (task.links||[]).filter(l=>!newIds.has(l.id)).forEach(l=>task.history.push({action:'link_removed',column:cVal,timestamp:now,userId:uid_,message:'Enlace eliminado: '+(l.title||l.url)}));
            Object.assign(task,fields);
            if(isCompleted(bVal,cVal))task.completedAt=task.completedAt||now;else task.completedAt=null;
        }
    }else{
        const nt={id:uid(),...fields,comments:[],createdAt:now,completedAt:isCompleted(bVal,cVal)?now:null,createdBy:currentUser.id,history:[{action:'created',column:cVal,timestamp:now,userId:currentUser.id}]};
        DATA.tasks.push(nt);
    }
    saveData();closeTaskModal();renderKanban();renderBoardSelector();
}

function discardTask(id){
    if(!id)return;const task=(DATA.tasks||[]).find(t=>t.id===id);if(!task)return;
    const isAdmin=currentUser&&currentUser.role==='admin';const isCreator=currentUser&&task.createdBy===currentUser.id;
    if(!isAdmin&&!isCreator){alert('Solo el administrador o el creador pueden descartar esta tarea.');return}
    if(!confirm('¿Descartar esta tarea? Quedará oculta pero no se eliminará.'))return;
    task.discarded=true;task.discardedAt=new Date().toISOString();task.discardedBy=currentUser?currentUser.id:'';
    if(!task.history)task.history=[];task.history.push({action:'discarded',column:task.column,timestamp:new Date().toISOString(),userId:currentUser?currentUser.id:'',message:'Tarea descartada'});
    saveData();closeTaskModal();closeDetailModal();renderKanban();renderBoardSelector();
}
function restoreTask(id){
    if(!currentUser||currentUser.role!=='admin')return;const task=(DATA.tasks||[]).find(t=>t.id===id);if(!task)return;
    task.discarded=false;task.discardedAt=null;task.discardedBy=null;
    if(!task.history)task.history=[];task.history.push({action:'restored',column:task.column,timestamp:new Date().toISOString(),userId:currentUser.id,message:'Tarea restaurada'});
    saveData();renderAdmin();
}

// ── DETAIL MODAL ──
function openDetailModal(taskId){
    const task=(DATA.tasks||[]).find(t=>t.id===taskId);if(!task)return;
    if(!task.comments)task.comments=[];
    if(!task.links)task.links=[];
    if(!task.files)task.files=[];
    const board=BOARDS[task.board];const colName=getColumnName(task.board,task.column);
    const user=(DATA.users||[]).find(u=>u.id===task.assignee);
    const creator=(DATA.users||[]).find(u=>u.id===task.createdBy);
    const over=!isCompleted(task.board,task.column)&&task.end&&task.end<todayStr();
    const cc=CAPA_COLORS[task.capa]||'bg-slate-100 text-slate-600';
    const colObj=board?board.columns.find(c=>c.id===task.column):null;
    const colTimes={};const hist=task.history||[];
    for(let i=0;i<hist.length;i++){const e=hist[i],n=hist[i+1];const s=new Date(e.timestamp),en=n?new Date(n.timestamp):new Date();const hrs=Math.round((en-s)/36e5);if(e.column){if(!colTimes[e.column])colTimes[e.column]=0;colTimes[e.column]+=hrs}}
    // Merge history + comments into unified timeline
    const timeline=[];
    (task.history||[]).forEach(h=>timeline.push({type:'history',data:h,ts:h.timestamp}));
    (task.comments||[]).forEach(c=>timeline.push({type:'comment',data:c,ts:c.timestamp}));
    timeline.sort((a,b)=>new Date(b.ts)-new Date(a.ts));
    const content=document.getElementById('detail-content');
    content.innerHTML=`<div class="space-y-5">
        <div><div class="flex items-center gap-2 mb-2"><span class="badge ${cc}">${CAPA_NAMES[task.capa]||''}</span>${task.tipo==='normativo'?'<span class="badge bg-amber-200 text-amber-900">⚖️ Regulatorio</span>':''}${over?'<span class="badge bg-red-100 text-red-700">⚠ Atrasada</span>':''}<span class="badge bg-slate-100 text-slate-600">${PHASE_NAMES[task.phase]||''}</span></div><h3 class="text-xl font-bold text-slate-900 mb-1">${task.title}</h3>${task.description?`<p class="text-sm text-slate-600">${task.description}</p>`:''}</div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div class="bg-slate-50 rounded-lg p-3"><div class="text-[10px] text-slate-500 font-semibold mb-1">TABLERO</div><div class="text-sm font-medium">${board?board.icon+' '+board.name:''}</div></div>
            <div class="bg-slate-50 rounded-lg p-3"><div class="text-[10px] text-slate-500 font-semibold mb-1">ESTADO (COLUMNA)</div><div class="text-sm font-bold" style="color:${colObj?colObj.color:'#333'}">${colName}</div></div>
            <div class="bg-slate-50 rounded-lg p-3"><div class="text-[10px] text-slate-500 font-semibold mb-1">PRIORIDAD</div><div class="text-sm">${task.priority==='alta'?'🔴 Alta':task.priority==='media'?'🟡 Media':'🔵 Baja'}</div></div>
            <div class="bg-slate-50 rounded-lg p-3"><div class="text-[10px] text-slate-500 font-semibold mb-1">RESPONSABLE</div><div class="flex items-center gap-1">${user?`<div class="avatar" style="width:20px;height:20px;font-size:8px;background:${avatarColor(user.name)}">${initials(user.name)}</div><span class="text-sm">${user.name}</span>`:'<span class="text-sm text-slate-400">Sin asignar</span>'}</div></div>
        </div>
        <div class="grid grid-cols-3 gap-3">
            <div class="bg-slate-50 rounded-lg p-3"><div class="text-[10px] text-slate-500 font-semibold mb-1">CREADA</div><div class="text-xs">${fmtDateTime(task.createdAt)}</div><div class="text-[10px] text-slate-400">por ${creator?creator.name:task.createdBy||'—'}</div></div>
            <div class="bg-slate-50 rounded-lg p-3"><div class="text-[10px] text-slate-500 font-semibold mb-1">FECHAS</div><div class="text-xs">${fmtDate(task.start)} → ${fmtDate(task.end)}</div></div>
            <div class="bg-slate-50 rounded-lg p-3"><div class="text-[10px] text-slate-500 font-semibold mb-1">COMPLETADA</div><div class="text-xs">${task.completedAt?fmtDateTime(task.completedAt):'—'}</div></div>
        </div>
        ${Object.keys(colTimes).length>0?`<div><h4 class="font-bold text-sm text-slate-700 mb-2">⏱ Tiempo por columna</h4><div class="flex gap-2 flex-wrap">${Object.entries(colTimes).map(([c,h])=>{const d=Math.floor(h/24);const disp=d>0?d+'d '+(h%24)+'h':h+'h';return`<div class="bg-blue-50 rounded-lg px-3 py-2 text-center"><div class="text-xs font-bold text-blue-700">${disp}</div><div class="text-[10px] text-blue-500">${getColumnName(task.board,c)}</div></div>`}).join('')}</div></div>`:''}
        <div>
            <h4 class="font-bold text-sm text-slate-700 mb-2">📁 Archivos (${task.files.length})</h4>
            ${task.files.length>0?`<div class="space-y-1.5 mb-3">${task.files.map(f=>{const isImg=['jpg','jpeg','png','gif','webp'].includes(f.type);return`<div class="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 group">${isImg?`<img src="${f.url}" class="w-8 h-8 rounded object-cover flex-shrink-0" alt="${f.name}">`:`<span class="text-lg flex-shrink-0">${fileIcon(f.type)}</span>`}<div class="flex-1 min-w-0"><a href="${f.url}" target="_blank" rel="noopener" class="text-xs text-blue-600 hover:underline font-medium block truncate">${f.name}</a><div class="text-[10px] text-slate-400">${formatFileSize(f.size)} · ${getUserName(f.uploadedBy)} · ${fmtDateTime(f.uploadedAt)}</div></div><a href="${f.url}" target="_blank" rel="noopener" class="text-slate-400 hover:text-blue-500 text-xs opacity-0 group-hover:opacity-100" title="Descargar">⬇</a><button onclick="removeTaskFile('${task.id}','${f.id}')" class="text-red-300 hover:text-red-500 text-xs opacity-0 group-hover:opacity-100" title="Eliminar">✕</button></div>`}).join('')}</div>`:'<p class="text-xs text-slate-400 mb-2">Sin archivos adjuntos.</p>'}
            <div id="upload-progress" class="hidden mb-2"></div>
            <input type="file" id="file-upload-input" class="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp">
            <button onclick="triggerFileUpload('${task.id}')" class="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-medium inline-flex items-center gap-1 mb-3">📎 Subir archivo <span class="text-[10px] text-blue-400">(PDF, Word, PPT, imágenes · máx 20MB)</span></button>
        </div>
        <div>
            <h4 class="font-bold text-sm text-slate-700 mb-2">🔗 Enlaces (${task.links.length})</h4>
            ${task.links.length>0?`<div class="space-y-1 mb-3">${task.links.map(l=>`<div class="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 group"><span class="text-sm">🔗</span><a href="${l.url}" target="_blank" rel="noopener" class="text-xs text-blue-600 hover:underline font-medium flex-1 truncate" title="${l.url}">${l.title||l.url}</a><button onclick="removeLinkFromTask('${task.id}','${l.id}')" class="text-red-300 hover:text-red-500 text-[10px] opacity-0 group-hover:opacity-100">✕</button></div>`).join('')}</div>`:'<p class="text-xs text-slate-400 mb-3">Sin enlaces.</p>'}
            <div class="flex gap-2"><input id="detail-link-title" type="text" class="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs" placeholder="Nombre"><input id="detail-link-url" type="url" class="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs" placeholder="https://..."><button onclick="addLinkFromDetail('${task.id}')" class="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-medium flex-shrink-0">+ Agregar</button></div>
        </div>
        <div>
            <h4 class="font-bold text-sm text-slate-700 mb-3">💬 Comentarios & Historial</h4>
            <div class="mb-3"><div class="flex gap-2"><div class="avatar flex-shrink-0" style="width:28px;height:28px;font-size:10px;background:${avatarColor(currentUser?currentUser.name:'')}">${initials(currentUser?currentUser.name:'')}</div><div class="flex-1"><textarea id="detail-comment" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs resize-none h-16" placeholder="Escribe un comentario o nota..."></textarea><div class="flex justify-end mt-1"><button onclick="addComment('${task.id}')" class="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-semibold">Comentar</button></div></div></div></div>
            <div class="space-y-3 border-t pt-3">${timeline.map(entry=>{
                if(entry.type==='comment'){
                    const c=entry.data;
                    return`<div class="flex items-start gap-3"><div class="avatar flex-shrink-0" style="width:24px;height:24px;font-size:9px;background:${avatarColor(getUserName(c.userId))}">${initials(getUserName(c.userId))}</div><div class="flex-1 bg-blue-50 rounded-lg px-3 py-2"><div class="flex items-center gap-2 mb-1"><span class="text-xs font-semibold text-slate-700">${getUserName(c.userId)}</span><span class="text-[10px] text-slate-400">${fmtDateTime(c.timestamp)}</span></div><div class="text-xs text-slate-700 whitespace-pre-wrap">${c.text}</div></div></div>`;
                }else{
                    const h=entry.data;
                    const FIELD_LABELS={title:'Título',description:'Descripción',priority:'Prioridad',assignee:'Responsable',start:'Fecha inicio',end:'Fecha fin',phase:'Fase',capa:'Capa',tipo:'Tipo',board:'Tablero'};
                    const FIELD_ICONS={title:'📝',description:'🗒️',priority:'🚩',assignee:'👤',start:'📅',end:'📅',phase:'🎯',capa:'🏗️',tipo:'📌',board:'📋'};
                    let icon,txt;
                    if(h.action==='field_changed'){
                        icon=FIELD_ICONS[h.field]||'✏️';
                        const label=FIELD_LABELS[h.field]||h.field;
                        let fromV=h.from||'—';let toV=h.to||'—';
                        if(h.field==='assignee'){fromV=getUserName(h.from);toV=getUserName(h.to)}
                        else if(h.field==='phase'){fromV=PHASE_NAMES[h.from]||h.from||'—';toV=PHASE_NAMES[h.to]||h.to||'—'}
                        else if(h.field==='board'){fromV=BOARDS[h.from]?BOARDS[h.from].name:h.from;toV=BOARDS[h.to]?BOARDS[h.to].name:h.to}
                        else if(h.field==='capa'){fromV=CAPA_NAMES[h.from]||h.from||'—';toV=CAPA_NAMES[h.to]||h.to||'—'}
                        else if(h.field==='start'||h.field==='end'){fromV=fmtDate(h.from);toV=fmtDate(h.to)}
                        else if(h.field==='description'){fromV=fromV.length>40?fromV.substring(0,40)+'...':fromV;toV=toV.length>40?toV.substring(0,40)+'...':toV}
                        txt='<b>'+label+'</b> cambiado: <span class="text-slate-400">'+fromV+'</span> → <span class="text-slate-700">'+toV+'</span>';
                    }else{
                    icon=h.action==='created'?'🆕':h.action==='moved'?'➡️':h.action==='comment'?'💬':h.action==='link_added'?'📎':h.action==='link_removed'?'🗑️':h.action==='file_uploaded'?'📁':h.action==='file_removed'?'🗑️':h.action==='discarded'?'🚫':h.action==='restored'?'♻️':'✏️';
                    if(h.action==='created')txt='Creada en <b>'+getColumnName(task.board,h.column)+'</b>';
                    else if(h.action==='moved')txt='Movida de <b>'+getColumnName(task.board,h.fromColumn||'?')+'</b> → <b>'+getColumnName(task.board,h.column)+'</b>';
                    else if(h.action==='comment')txt='<span class="text-blue-600">Comentario:</span> '+(h.message||'').substring(0,80)+(h.message&&h.message.length>80?'...':'');
                    else if(h.action==='link_added')txt='<span class="text-emerald-600">'+(h.message||'Enlace agregado')+'</span>';
                    else if(h.action==='link_removed')txt='<span class="text-red-500">'+(h.message||'Enlace eliminado')+'</span>';
                    else if(h.action==='file_uploaded')txt='<span class="text-emerald-600">'+(h.message||'Archivo subido')+'</span>';
                    else if(h.action==='file_removed')txt='<span class="text-red-500">'+(h.message||'Archivo eliminado')+'</span>';
                    else if(h.action==='discarded')txt='<span class="text-red-500">Tarea descartada</span>';
                    else if(h.action==='restored')txt='<span class="text-emerald-600">Tarea restaurada</span>';
                    else txt='Actualizada en <b>'+getColumnName(task.board,h.column)+'</b>';
                    }
                    return`<div class="flex items-start gap-3"><div class="text-sm">${icon}</div><div class="flex-1"><div class="text-xs text-slate-600">${txt}</div><div class="text-[10px] text-slate-400">${fmtDateTime(h.timestamp)} — ${getUserName(h.userId)}</div></div></div>`;
                }
            }).join('')}</div>
        </div>
        <div class="flex gap-2 pt-3 border-t"><button onclick="closeDetailModal();openTaskModal('${task.id}')" class="text-xs bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold">✏️ Editar</button>${currentUser&&(currentUser.role==='admin'||task.createdBy===currentUser.id)?`<button onclick="discardTask('${task.id}')" class="text-xs text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg">🚫 Descartar</button>`:''}</div>
    </div>`;
    document.getElementById('detail-modal').classList.remove('hidden');
}
function closeDetailModal(){document.getElementById('detail-modal').classList.add('hidden')}

function addComment(taskId){
    const el=document.getElementById('detail-comment');
    const text=el.value.trim();if(!text)return;
    const task=(DATA.tasks||[]).find(t=>t.id===taskId);if(!task)return;
    if(!task.comments)task.comments=[];
    task.comments.push({id:uid(),text,userId:currentUser.id,timestamp:new Date().toISOString()});
    if(!task.history)task.history=[];
    task.history.push({action:'comment',column:task.column,timestamp:new Date().toISOString(),userId:currentUser.id,message:text});
    saveData();openDetailModal(taskId);
}

function addLinkFromDetail(taskId){
    const tEl=document.getElementById('detail-link-title'),uEl=document.getElementById('detail-link-url');
    const title=tEl.value.trim(),url=uEl.value.trim();
    if(!url){alert('La URL es requerida.');return}
    const task=(DATA.tasks||[]).find(t=>t.id===taskId);if(!task)return;
    if(!task.links)task.links=[];
    task.links.push({id:uid(),title:title||url,url});
    if(!task.history)task.history=[];
    task.history.push({action:'link_added',column:task.column,timestamp:new Date().toISOString(),userId:currentUser.id,message:'Enlace agregado: '+(title||url)});
    saveData();openDetailModal(taskId);
}

function removeLinkFromTask(taskId,linkId){
    const task=(DATA.tasks||[]).find(t=>t.id===taskId);if(!task)return;
    const link=(task.links||[]).find(l=>l.id===linkId);
    task.links=(task.links||[]).filter(l=>l.id!==linkId);
    if(!task.history)task.history=[];
    task.history.push({action:'link_removed',column:task.column,timestamp:new Date().toISOString(),userId:currentUser.id,message:'Enlace eliminado: '+(link?link.title:'')});
    saveData();openDetailModal(taskId);
}

// ── FILE UPLOAD (Firebase Storage) ──
const ALLOWED_TYPES={'application/pdf':'pdf','application/msword':'doc','application/vnd.openxmlformats-officedocument.wordprocessingml.document':'docx','application/vnd.ms-powerpoint':'ppt','application/vnd.openxmlformats-officedocument.presentationml.presentation':'pptx','image/jpeg':'jpg','image/png':'png','image/gif':'gif','image/webp':'webp'};
const MAX_FILE_SIZE=20*1024*1024;
function fileIcon(type){if(type==='pdf')return'📕';if(type==='doc'||type==='docx')return'📘';if(type==='ppt'||type==='pptx')return'📙';if(['jpg','png','gif','webp'].includes(type))return'🖼️';return'📄'}
function formatFileSize(bytes){if(bytes<1024)return bytes+' B';if(bytes<1048576)return(bytes/1024).toFixed(1)+' KB';return(bytes/1048576).toFixed(1)+' MB'}
function triggerFileUpload(taskId){document.getElementById('file-upload-input').click();document.getElementById('file-upload-input').onchange=function(){if(this.files.length>0)uploadTaskFile(taskId,this.files[0]);this.value=''}}
function uploadTaskFile(taskId,file){
    const task=(DATA.tasks||[]).find(t=>t.id===taskId);if(!task)return;
    const ext=file.name.split('.').pop().toLowerCase();
    const mimeOk=ALLOWED_TYPES[file.type];const extOk=['pdf','doc','docx','ppt','pptx','jpg','jpeg','png','gif','webp'].includes(ext);
    if(!mimeOk&&!extOk){alert('Tipo de archivo no permitido.\nPermitidos: PDF, Word, PowerPoint, JPEG, PNG, GIF, WebP');return}
    if(file.size>MAX_FILE_SIZE){alert('Archivo demasiado grande. Máximo 20MB.');return}
    const fileId=uid();
    const storagePath=`tasks/${taskId}/${fileId}_${file.name}`;
    const ref=fbStorage.ref(storagePath);
    const progressEl=document.getElementById('upload-progress');
    if(progressEl){progressEl.classList.remove('hidden');progressEl.innerHTML='<div class="flex items-center gap-2"><div class="animate-spin text-blue-500">↻</div><span class="text-xs text-blue-600">Subiendo '+file.name+'...</span><span id="upload-pct" class="text-xs font-bold text-blue-700">0%</span></div><div class="w-full bg-slate-200 rounded-full h-1.5 mt-1"><div id="upload-bar" class="bg-blue-500 h-1.5 rounded-full transition-all" style="width:0%"></div></div>'}
    const uploadTask=ref.put(file);
    uploadTask.on('state_changed',snap=>{const pct=Math.round((snap.bytesTransferred/snap.totalBytes)*100);const pctEl=document.getElementById('upload-pct');const barEl=document.getElementById('upload-bar');if(pctEl)pctEl.textContent=pct+'%';if(barEl)barEl.style.width=pct+'%'},
    error=>{console.error('Upload error:',error);if(progressEl)progressEl.classList.add('hidden');alert('Error al subir archivo: '+error.message)},
    ()=>{uploadTask.snapshot.ref.getDownloadURL().then(url=>{if(!task.files)task.files=[];const fileType=ALLOWED_TYPES[file.type]||ext;task.files.push({id:fileId,name:file.name,url,storagePath,type:fileType,size:file.size,uploadedBy:currentUser?currentUser.id:'',uploadedAt:new Date().toISOString()});if(!task.history)task.history=[];task.history.push({action:'file_uploaded',column:task.column,timestamp:new Date().toISOString(),userId:currentUser?currentUser.id:'',message:'Archivo subido: '+file.name});saveData();if(progressEl)progressEl.classList.add('hidden');openDetailModal(taskId)})})
}
function removeTaskFile(taskId,fileId){
    if(!confirm('¿Eliminar este archivo?'))return;
    const task=(DATA.tasks||[]).find(t=>t.id===taskId);if(!task)return;
    const file=(task.files||[]).find(f=>f.id===fileId);if(!file)return;
    if(file.storagePath){fbStorage.ref(file.storagePath).delete().catch(e=>console.warn('Storage delete error:',e))}
    task.files=(task.files||[]).filter(f=>f.id!==fileId);
    if(!task.history)task.history=[];
    task.history.push({action:'file_removed',column:task.column,timestamp:new Date().toISOString(),userId:currentUser?currentUser.id:'',message:'Archivo eliminado: '+file.name});
    saveData();openDetailModal(taskId);
}

// ── FASES / ÉPICAS ──
function togglePhase(pid){phaseCollapsed[pid]=!phaseCollapsed[pid];renderPhases()}
function renderPhases(){
    const tasks=(DATA.tasks||[]).filter(t=>!t.discarded&&t.board===currentBoard);
    const phases=DATA.phases||[];
    const dfEl=document.getElementById('phase-date-from');const dtEl=document.getElementById('phase-date-to');
    const dateFrom=dfEl?dfEl.value:'';const dateTo=dtEl?dtEl.value:'';
    const todayS=todayStr();
    const el=document.getElementById('phases-container');
    el.innerHTML=phases.map(p=>{
        let pt=tasks.filter(t=>t.phase===p.id);
        if(dateFrom)pt=pt.filter(t=>!t.end||t.end>=dateFrom);
        if(dateTo)pt=pt.filter(t=>!t.start||t.start<=dateTo);
        const done=pt.filter(t=>isCompleted(t.board,t.column)).length;
        const active=pt.filter(t=>{const b=BOARDS[t.board];if(!b)return false;const cols=b.columns;return cols.length>1&&t.column!==cols[0].id&&t.column!==cols[cols.length-1].id}).length;
        const overdue=pt.filter(t=>!isCompleted(t.board,t.column)&&t.end&&t.end<todayS).length;
        const pct=pt.length>0?Math.round((done/pt.length)*100):0;
        const collapsed=phaseCollapsed[p.id];
        const pending=pt.filter(t=>!isCompleted(t.board,t.column)).sort((a,b)=>{const pa={alta:0,media:1,baja:2};return(pa[a.priority]||1)-(pa[b.priority]||1)||(a.end||'9999').localeCompare(b.end||'9999')});
        const completed=pt.filter(t=>isCompleted(t.board,t.column));
        return`<div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-3">
            <div class="cursor-pointer hover:bg-slate-50 px-4 py-3 flex items-center gap-3" onclick="togglePhase('${p.id}')">
                <span class="text-xs text-slate-400 transition-transform ${collapsed?'':'rotate-90'}" style="display:inline-block">▶</span>
                <div class="w-3 h-3 rounded-full flex-shrink-0" style="background:${p.color}"></div>
                <div class="flex-1 min-w-0">
                    <div class="text-sm font-bold text-slate-800">${p.name}</div>
                    <div class="flex items-center gap-3 mt-1 text-[10px]">
                        <span class="text-emerald-600 font-bold">${done} completadas</span>
                        <span class="text-blue-600">${active} activas</span>
                        ${overdue>0?`<span class="text-red-600 font-bold">${overdue} atrasadas</span>`:''}
                        <span class="text-slate-400">${pt.length} total</span>
                    </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                    <div class="w-24 bg-slate-100 rounded-full h-2"><div class="h-2 rounded-full" style="width:${pct}%;background:${p.color}"></div></div>
                    <span class="text-sm font-bold" style="color:${p.color}">${pct}%</span>
                </div>
            </div>
            ${!collapsed?`<div class="border-t border-slate-100">
                ${pending.length>0?`<div class="divide-y divide-slate-50">${pending.map(t=>{
                    const u=(DATA.users||[]).find(x=>x.id===t.assignee);const isOver=t.end&&t.end<todayS;
                    const cn=getColumnName(t.board,t.column);const colObj=BOARDS[t.board]?BOARDS[t.board].columns.find(x=>x.id===t.column):null;
                    const cc=CAPA_COLORS[t.capa]||'bg-slate-100 text-slate-600';
                    return`<div class="px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 cursor-pointer ${isOver?'bg-red-50/30':''}" ondblclick="openDetailModal('${t.id}')">
                        <div class="priority-dot ${t.priority==='alta'?'p-alta':t.priority==='media'?'p-media':'p-baja'}"></div>
                        <div class="flex-1 min-w-0"><div class="text-xs font-semibold text-slate-700 truncate">${t.title}</div>
                        <div class="flex items-center gap-1.5 mt-0.5"><span class="badge ${cc}" style="font-size:9px;padding:1px 5px">${CAPA_NAMES[t.capa]||''}</span><span class="text-[10px] text-slate-400">${fmtDate(t.end)}</span>${isOver?'<span class="text-[10px] text-red-500 font-bold">⚠ Atrasada</span>':''}</div></div>
                        <div class="text-[10px] font-bold px-2 py-0.5 rounded" style="color:${colObj?colObj.color:'#666'};background:${colObj?colObj.color+'15':'#f1f5f9'}">${cn}</div>
                        ${u?`<div class="avatar flex-shrink-0" style="width:22px;height:22px;font-size:9px;background:${avatarColor(u.name)}" title="${u.name}">${initials(u.name)}</div>`:''}
                    </div>`;
                }).join('')}</div>`:''}
                ${completed.length>0?`<div class="px-4 py-2 bg-slate-50/50 text-[10px] text-slate-400"><span class="text-emerald-500">✅</span> ${completed.length} tarea(s) completada(s) — doble clic en cualquier tarea para ver detalle</div>`:''}
                ${pt.length===0?'<div class="px-4 py-3 text-xs text-slate-400 text-center">Sin tareas en esta fase para el rango seleccionado.</div>':''}
            </div>`:''}
        </div>`;
    }).join('');
}

// ── TIMELINE / GANTT ──
function tlToggle(pid){tlCollapsed[pid]=!tlCollapsed[pid];renderTimeline()}
function tlZoom(z){timelineZoom=z;renderTimeline()}
function tlNav(dir){timelineOffset+=dir;renderTimeline()}
function tlToday(){timelineOffset=0;renderTimeline()}
function renderTimeline(){
    const tasks=(DATA.tasks||[]).filter(t=>!t.discarded&&t.board===currentBoard);
    const phases=DATA.phases||[];
    const today=new Date();const todayS=todayStr();
    const zoomMonths=timelineZoom==='3m'?3:timelineZoom==='6m'?6:12;
    const halfM=Math.floor(zoomMonths/2);
    const vs=new Date(today.getFullYear(),today.getMonth()-halfM+timelineOffset,1);
    const ve=new Date(today.getFullYear(),today.getMonth()-halfM+zoomMonths+timelineOffset,0,23,59,59);
    const totalMs=ve.getTime()-vs.getTime();
    function pct(dateStr){if(!dateStr)return-1;const d=new Date(dateStr+'T12:00:00');return((d.getTime()-vs.getTime())/totalMs)*100}
    function clamp(v){return Math.max(0,Math.min(100,v))}
    // Month grid
    const months=[];let mc=new Date(vs);
    while(mc<=ve){const mStart=new Date(mc.getFullYear(),mc.getMonth(),1);const mEnd=new Date(mc.getFullYear(),mc.getMonth()+1,0,23,59,59);
        const left=clamp(((mStart.getTime()-vs.getTime())/totalMs)*100);const right=clamp(((mEnd.getTime()-vs.getTime())/totalMs)*100);
        const isCurrent=mc.getMonth()===today.getMonth()&&mc.getFullYear()===today.getFullYear();
        months.push({label:MONTH_NAMES[mc.getMonth()].substring(0,3),year:mc.getFullYear(),left,width:right-left,isCurrent});
        mc=new Date(mc.getFullYear(),mc.getMonth()+1,1);
    }
    const todayPct=clamp(((today.getTime()-vs.getTime())/totalMs)*100);
    // Build rows
    let rows='';
    phases.forEach(p=>{
        const pt=tasks.filter(t=>t.phase===p.id);
        const done=pt.filter(t=>isCompleted(t.board,t.column)).length;
        const ppct=pt.length>0?Math.round((done/pt.length)*100):0;
        const overdue=pt.filter(t=>!isCompleted(t.board,t.column)&&t.end&&t.end<todayS).length;
        const starts=pt.filter(t=>t.start).map(t=>t.start).sort();
        const ends=pt.filter(t=>t.end).map(t=>t.end).sort();
        const pStart=starts[0]||'';const pEnd=ends[ends.length-1]||'';
        const barLeft=pStart?clamp(pct(pStart)):0;const barRight=pEnd?clamp(pct(pEnd)):0;
        const barWidth=Math.max(barRight-barLeft,0.5);
        const collapsed=tlCollapsed[p.id]!==false;
        // Monthly breakdown for popup
        const monthlyStats=months.map(m=>{const mStart=m.label+' '+m.year;const mTasks=pt.filter(t=>t.end&&t.end.substring(0,7)===m.year+'-'+(months.indexOf(m)+vs.getMonth()+1<10?'0':'')+(vs.getMonth()+months.indexOf(m)+1));return{done:0,pending:0}});
        rows+=`<div class="border-b border-slate-100">
            <div class="flex items-center cursor-pointer hover:bg-slate-50/80 group" onclick="tlToggle('${p.id}')">
                <div class="w-[220px] flex-shrink-0 px-3 py-2.5 flex items-center gap-2 border-r border-slate-100">
                    <span class="text-[10px] text-slate-400 transition-transform inline-block ${collapsed?'':'rotate-90'}">▶</span>
                    <div class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background:${p.color}"></div>
                    <div class="flex-1 min-w-0">
                        <div class="text-[11px] font-bold text-slate-700 truncate">${p.name.replace(/^Fase \d+: /,'')}</div>
                        <div class="text-[9px] text-slate-400">${done}/${pt.length} done · ${ppct}%${overdue?' · <span class="text-red-500">'+overdue+'⚠</span>':''}</div>
                    </div>
                </div>
                <div class="flex-1 relative h-9">
                    ${barWidth>0.5?`<div class="absolute rounded-md h-7 top-1 flex items-center overflow-hidden shadow-sm" style="left:${barLeft}%;width:${barWidth}%;background:${p.color}">
                        <div class="absolute inset-0 rounded-md opacity-20 bg-white" style="width:${ppct}%"></div>
                        ${barWidth>6?`<span class="relative z-10 text-[9px] font-bold text-white px-2 whitespace-nowrap">${ppct}%</span>`:''}
                    </div>`:''}
                </div>
            </div>
            ${!collapsed?`<div class="bg-slate-50/30">${pt.filter(t=>!isCompleted(t.board,t.column)).sort((a,b)=>(a.start||'9999').localeCompare(b.start||'9999')).map(t=>{
                const tStart=t.start?clamp(pct(t.start)):0;const tEnd=t.end?clamp(pct(t.end)):0;
                const tWidth=Math.max(tEnd-tStart,0.3);
                const isOver=!isCompleted(t.board,t.column)&&t.end&&t.end<todayS;
                const tColor=isOver?'#ef4444':t.column==='backlog'?'#94a3b8':'#60a5fa';
                const u=(DATA.users||[]).find(x=>x.id===t.assignee);
                return`<div class="flex items-center hover:bg-white/60 cursor-pointer" ondblclick="openDetailModal('${t.id}')">
                    <div class="w-[220px] flex-shrink-0 px-3 py-1 pl-9 border-r border-slate-100 flex items-center gap-1">
                        <div class="priority-dot ${t.priority==='alta'?'p-alta':t.priority==='media'?'p-media':'p-baja'}" style="width:5px;height:5px"></div>
                        <span class="text-[10px] text-slate-600 truncate flex-1" title="${t.title}">${t.title}</span>
                        ${u?`<div class="avatar flex-shrink-0" style="width:16px;height:16px;font-size:7px;background:${avatarColor(u.name)}">${initials(u.name)}</div>`:''}
                    </div>
                    <div class="flex-1 relative h-5">
                        <div class="absolute rounded h-3 top-1 shadow-sm hover:h-4 hover:top-0.5 transition-all" style="left:${tStart}%;width:${tWidth}%;background:${tColor}" title="${t.title}\n${fmtDate(t.start)} → ${fmtDate(t.end)}${isOver?'\n⚠ Atrasada':''}"></div>
                    </div>
                </div>`;
            }).join('')}
            ${done>0?`<div class="flex items-center"><div class="w-[220px] flex-shrink-0 px-3 py-1 pl-9 border-r border-slate-100"><span class="text-[9px] text-emerald-500">✅ ${done} completada(s)</span></div><div class="flex-1"></div></div>`:''}
            </div>`:''}
        </div>`;
    });
    const el=document.getElementById('timeline-content');
    el.innerHTML=`<div class="relative border border-slate-200 rounded-xl overflow-hidden bg-white">
        <div class="flex items-center sticky top-0 bg-white z-20 border-b border-slate-200">
            <div class="w-[220px] flex-shrink-0 px-3 py-2 border-r border-slate-200 bg-slate-50">
                <span class="text-[10px] font-bold text-slate-500 uppercase">Fases del Proyecto</span>
            </div>
            <div class="flex-1 flex relative">${months.map(m=>`<div class="flex-1 text-center py-2 text-[10px] font-semibold border-r border-slate-100 last:border-0 ${m.isCurrent?'bg-blue-50 text-blue-700':'text-slate-500'}">${m.label}<div class="text-[8px] font-normal ${m.isCurrent?'text-blue-400':'text-slate-300'}">${m.year}</div></div>`).join('')}</div>
        </div>
        <div class="relative">
            <div class="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10" style="left:calc(220px + (100% - 220px) * ${todayPct} / 100)"><div class="absolute -top-0 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[7px] px-1 rounded font-bold">HOY</div></div>
            ${months.map(m=>`<div class="absolute top-0 bottom-0 border-l border-slate-100/80" style="left:calc(220px + (100% - 220px) * ${m.left} / 100)"></div>`).join('')}
            ${rows}
        </div>
    </div>`;
}

// ── DASHBOARD ──
function renderDashboard(){
    const tasks=(DATA.tasks||[]).filter(t=>!t.discarded);const total=tasks.length;
    const completed=tasks.filter(t=>isCompleted(t.board,t.column)).length;
    const inProg=tasks.filter(t=>{const b=BOARDS[t.board];if(!b)return false;const cols=b.columns;return cols.length>1&&t.column!==cols[0].id&&t.column!==cols[cols.length-1].id}).length;
    const overdue=tasks.filter(t=>t.end&&t.end<todayStr()&&!isCompleted(t.board,t.column)).length;
    const pct=total>0?Math.round((completed/total)*100):0;
    const pendC=(DATA.commitments||[]).filter(c=>c.status==='pendiente'||c.status==='vencido').length;
    document.getElementById('dash-kpis').innerHTML=`
        <div class="stat-card text-center"><div class="text-3xl font-bold text-blue-600">${pct}%</div><div class="text-[10px] text-slate-500">Avance Global</div><div class="w-full bg-slate-100 rounded-full h-2 mt-2"><div class="bg-blue-500 h-2 rounded-full" style="width:${pct}%"></div></div></div>
        <div class="stat-card text-center"><div class="text-3xl font-bold text-emerald-600">${completed}</div><div class="text-[10px] text-slate-500">Completadas</div></div>
        <div class="stat-card text-center"><div class="text-3xl font-bold text-blue-500">${inProg}</div><div class="text-[10px] text-slate-500">En Progreso</div></div>
        <div class="stat-card text-center"><div class="text-3xl font-bold text-red-500">${overdue}</div><div class="text-[10px] text-slate-500">Atrasadas</div></div>
        <div class="stat-card text-center"><div class="text-3xl font-bold text-amber-500">${pendC}</div><div class="text-[10px] text-slate-500">Compromisos</div></div>`;
    document.getElementById('dash-phases').innerHTML=(DATA.phases||[]).map(p=>{const pt=tasks.filter(t=>t.phase===p.id);const pc=pt.filter(t=>isCompleted(t.board,t.column)).length;const pp=pt.length>0?Math.round((pc/pt.length)*100):0;return`<div class="mb-3"><div class="flex justify-between text-xs mb-1"><span class="font-medium">${p.name}</span><span class="font-bold" style="color:${p.color}">${pp}% (${pc}/${pt.length})</span></div><div class="w-full bg-slate-100 rounded-full h-2"><div class="h-2 rounded-full" style="width:${pp}%;background:${p.color}"></div></div></div>`}).join('');
    const users=(DATA.users||[]).filter(u=>u.active);
    document.getElementById('dash-workload').innerHTML=users.map(u=>{const ut=tasks.filter(t=>t.assignee===u.id);const uc=ut.filter(t=>isCompleted(t.board,t.column)).length;const ua=ut.length-uc;return`<div class="bg-slate-50 rounded-lg p-3 flex items-center gap-2"><div class="avatar" style="width:32px;height:32px;font-size:11px;background:${avatarColor(u.name)}">${initials(u.name)}</div><div class="flex-1 min-w-0"><div class="text-xs font-semibold truncate">${u.name}</div><div class="text-[10px] text-slate-500">${uc} done · ${ua} activas</div></div></div>`}).join('');
    // Charts
    const ctx1=document.getElementById('chart-status');if(chartStatus)chartStatus.destroy();
    const backlog=tasks.filter(t=>t.column==='backlog').length;
    chartStatus=new Chart(ctx1,{type:'doughnut',data:{labels:['Completado','En Progreso','Backlog'],datasets:[{data:[completed,inProg,backlog],backgroundColor:['#10b981','#3b82f6','#94a3b8'],borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{font:{size:10}}}}}});
    const capas=Object.keys(CAPA_NAMES);const capaData=capas.map(c=>{const ct=tasks.filter(t=>t.capa===c);return ct.length>0?Math.round((ct.filter(t=>isCompleted(t.board,t.column)).length/ct.length)*100):0});
    const ctx2=document.getElementById('chart-capas');if(chartCapas)chartCapas.destroy();
    chartCapas=new Chart(ctx2,{type:'bar',data:{labels:capas.map(c=>(CAPA_NAMES[c]||c).replace(/^[^\s]+\s/,'')),datasets:[{label:'%',data:capaData,backgroundColor:'#3b82f6',borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',scales:{x:{max:100,ticks:{font:{size:10}}},y:{ticks:{font:{size:10}}}},plugins:{legend:{display:false}}}});
}

// ── MY TASKS ──
function renderMyTasks(){
    if(!currentUser)return;const tasks=(DATA.tasks||[]).filter(t=>t.assignee===currentUser.id&&!t.discarded);
    const done=tasks.filter(t=>isCompleted(t.board,t.column)).length;
    const active=tasks.filter(t=>!isCompleted(t.board,t.column)&&t.column!=='backlog').length;
    const over=tasks.filter(t=>!isCompleted(t.board,t.column)&&t.end&&t.end<todayStr()).length;
    document.getElementById('mytasks-summary').innerHTML=`<div class="stat-card text-center"><div class="text-2xl font-bold">${tasks.length}</div><div class="text-[10px] text-slate-500">Total</div></div><div class="stat-card text-center"><div class="text-2xl font-bold text-blue-600">${active}</div><div class="text-[10px] text-slate-500">Activas</div></div><div class="stat-card text-center"><div class="text-2xl font-bold text-emerald-600">${done}</div><div class="text-[10px] text-slate-500">Completadas</div></div><div class="stat-card text-center"><div class="text-2xl font-bold text-red-600">${over}</div><div class="text-[10px] text-slate-500">Atrasadas</div></div>`;
    const c=document.getElementById('mytasks-container');
    if(!tasks.length){c.innerHTML='<div class="text-center text-slate-400 py-8">No tienes tareas asignadas.</div>';return}
    c.innerHTML=tasks.sort((a,b)=>{if(isCompleted(a.board,a.column)!==isCompleted(b.board,b.column))return isCompleted(a.board,a.column)?1:-1;return(a.end||'9999')<(b.end||'9999')?-1:1}).map(t=>{
        const isDone=isCompleted(t.board,t.column);const isOver=!isDone&&t.end&&t.end<todayStr();
        const cn=getColumnName(t.board,t.column);const board=BOARDS[t.board];const colObj=board?board.columns.find(x=>x.id===t.column):null;
        const cc=CAPA_COLORS[t.capa]||'bg-slate-100 text-slate-600';
        return`<div class="bg-white rounded-lg border ${isOver?'border-red-300':'border-slate-200'} p-4 flex items-center gap-3 hover:shadow-md transition cursor-pointer" ondblclick="openDetailModal('${t.id}')"><div class="priority-dot ${t.priority==='alta'?'p-alta':t.priority==='media'?'p-media':'p-baja'}"></div><div class="flex-1 min-w-0"><div class="text-sm font-semibold ${isDone?'line-through text-slate-400':''} truncate">${t.title}</div><div class="flex items-center gap-2 mt-1 flex-wrap"><span class="badge ${cc}">${CAPA_NAMES[t.capa]||''}</span><span class="text-[10px] text-slate-500">${board?board.icon:''} ${cn}</span><span class="text-[10px] text-slate-400">${fmtDate(t.end)}</span>${isOver?'<span class="badge bg-red-100 text-red-700">⚠</span>':''}</div></div><div class="flex-shrink-0 text-xs font-bold px-2 py-1 rounded" style="color:${colObj?colObj.color:'#666'};background:${colObj?colObj.color+'15':'#f1f5f9'}">${cn}</div><button onclick="event.stopPropagation();openTaskModal('${t.id}')" class="text-slate-300 hover:text-blue-500">✏️</button></div>`;
    }).join('');
}

// ── COMMITMENTS ──
function renderCommitments(){
    const filter=document.getElementById('commit-filter').value;const today=todayStr();
    let commits=DATA.commitments||[];commits.forEach(c=>{if(c.status==='pendiente'&&c.date&&c.date<today)c.status='vencido'});
    if(filter!=='all')commits=commits.filter(c=>c.status===filter);
    const el=document.getElementById('commits-container');
    if(!commits.length){el.innerHTML='<div class="text-center text-slate-400 py-8">Sin compromisos.</div>';return}
    const icons={entregable:'📦',reunion:'📋',regulatorio:'⚖️',externo:'🔗'};
    const sc={pendiente:'bg-slate-100 text-slate-600',cumplido:'bg-emerald-100 text-emerald-700',vencido:'bg-red-100 text-red-700',reprogramado:'bg-amber-100 text-amber-700'};
    el.innerHTML=commits.map(c=>{const days=daysBetween(today,c.date);const urg=c.status==='cumplido'?'':days<0?'border-red-300 bg-red-50/30':days<=7?'border-amber-300':'';
    return`<div class="bg-white rounded-lg border border-slate-200 p-4 ${urg}"><div class="flex items-start gap-3"><input type="checkbox" class="mt-1 w-4 h-4" ${c.status==='cumplido'?'checked':''} onchange="toggleCommit('${c.id}',this.checked)"><div class="flex-1"><div class="flex items-center gap-2 flex-wrap"><span>${icons[c.type]||'📌'}</span><span class="font-semibold text-sm ${c.status==='cumplido'?'line-through text-slate-400':''}">${c.title}</span><span class="badge ${sc[c.status]||''}">${c.status}</span></div><div class="flex items-center gap-3 mt-1 text-[11px] text-slate-500"><span>👤 ${c.owner||'—'}</span><span>📅 ${fmtDate(c.date)}</span><span>${c.status!=='cumplido'?(days<0?'⚠ '+Math.abs(days)+'d atraso':days+'d'):'✅'}</span></div>${c.obs?`<div class="mt-2 text-xs text-slate-500 bg-slate-50 rounded p-2">${c.obs}</div>`:''}</div><div class="flex gap-1"><button onclick="openCommitModal('${c.id}')" class="text-xs text-blue-500 hover:bg-blue-50 px-2 py-1 rounded">✏️</button><button onclick="deleteCommit('${c.id}')" class="text-xs text-red-400 hover:bg-red-50 px-2 py-1 rounded">🗑️</button></div></div></div>`}).join('');
}
function toggleCommit(id,chk){const c=(DATA.commitments||[]).find(x=>x.id===id);if(c){c.status=chk?'cumplido':'pendiente';saveData();renderCommitments()}}
function openCommitModal(editId){
    const modal=document.getElementById('commit-modal');
    if(editId&&typeof editId==='string'){const c=(DATA.commitments||[]).find(x=>x.id===editId);if(c){document.getElementById('cm-title-h').textContent='Editar Compromiso';document.getElementById('cm-id').value=c.id;document.getElementById('cm-title').value=c.title;document.getElementById('cm-owner').value=c.owner||'';document.getElementById('cm-date').value=c.date||'';document.getElementById('cm-type').value=c.type||'entregable';document.getElementById('cm-status').value=c.status||'pendiente';document.getElementById('cm-obs').value=c.obs||'';modal.classList.remove('hidden');return}}
    document.getElementById('cm-title-h').textContent='Nuevo Compromiso';document.getElementById('cm-id').value='';document.getElementById('cm-title').value='';document.getElementById('cm-owner').value='';document.getElementById('cm-date').value='';document.getElementById('cm-obs').value='';modal.classList.remove('hidden');
}
function closeCommitModal(){document.getElementById('commit-modal').classList.add('hidden')}
function saveCommitment(){const id=document.getElementById('cm-id').value;const title=document.getElementById('cm-title').value.trim();if(!title){alert('Descripción requerida.');return}const d={title,owner:document.getElementById('cm-owner').value.trim(),date:document.getElementById('cm-date').value,type:document.getElementById('cm-type').value,status:document.getElementById('cm-status').value,obs:document.getElementById('cm-obs').value.trim()};if(id){const i=DATA.commitments.findIndex(c=>c.id===id);if(i>=0)DATA.commitments[i]={...DATA.commitments[i],...d}}else{DATA.commitments.push({id:uid(),...d})}saveData();closeCommitModal();renderCommitments()}
function deleteCommit(id){if(confirm('¿Eliminar?')){DATA.commitments=DATA.commitments.filter(c=>c.id!==id);saveData();renderCommitments()}}

// ── EQUIPO / ORG CHART ──
function renderEquipo(){
    const users=DATA.users||[];const tasks=(DATA.tasks||[]).filter(t=>!t.discarded);const todayS=todayStr();
    function uCard(uid,size){
        const u=users.find(x=>x.id===uid);if(!u)return'';
        const tc=tasks.filter(t=>t.assignee===uid).length;
        const done=tasks.filter(t=>t.assignee===uid&&isCompleted(t.board,t.column)).length;
        const overdue=tasks.filter(t=>t.assignee===uid&&!isCompleted(t.board,t.column)&&t.end&&t.end<todayS).length;
        const pct=tc>0?Math.round((done/tc)*100):0;
        const isLead=size==='lg';
        const teamC=u.team==='gerencial'?'border-amber-300':u.team==='desarrollo'?'border-sky-300':'border-purple-300';
        return`<div class="bg-white rounded-xl border-2 ${teamC} shadow-sm p-${isLead?'5':'3'} flex flex-col items-center text-center hover:shadow-md transition-shadow min-w-[${isLead?'220':'170'}px] max-w-[${isLead?'260':'200'}px]">
            <div class="avatar mb-2" style="width:${isLead?'48':'36'}px;height:${isLead?'48':'36'}px;font-size:${isLead?'16':'12'}px;background:${avatarColor(u.name)}">${initials(u.name)}</div>
            <div class="text-${isLead?'sm':'xs'} font-bold text-slate-800 leading-tight">${u.name}</div>
            <div class="text-[${isLead?'11':'10'}px] font-semibold ${u.role==='admin'?'text-blue-600':'text-slate-500'} mt-0.5">${u.title||''}</div>
            ${u.responsibility?`<div class="text-[9px] text-slate-400 mt-1 leading-tight line-clamp-2">${u.responsibility}</div>`:''}
            <div class="flex items-center gap-1.5 mt-2">
                <span class="text-[10px] text-slate-500">${tc} tareas</span>
                <span class="text-[10px] text-emerald-600">${done}✅</span>
                ${overdue>0?`<span class="text-[10px] text-red-500 font-bold">${overdue}⚠</span>`:''}
            </div>
            <div class="w-full bg-slate-100 rounded-full h-1.5 mt-1.5"><div class="h-1.5 rounded-full bg-emerald-400" style="width:${pct}%"></div></div>
            <div class="text-[9px] text-slate-400 mt-0.5">${pct}% completado</div>
        </div>`;
    }
    const el=document.getElementById('equipo-container');
    el.innerHTML=`
        <div class="flex flex-col items-center gap-0">
            <!-- LEADER -->
            <div class="flex justify-center">${uCard('admin','lg')}</div>
            <div class="w-0.5 h-6 bg-slate-300 mx-auto"></div>
            <!-- BRANCH CONNECTOR -->
            <div class="relative w-full max-w-5xl mx-auto">
                <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-0.5 bg-slate-300"></div>
                <div class="flex justify-around pt-4 gap-3">
                    <!-- GERENCIAL TEAM -->
                    <div class="flex flex-col items-center">
                        <div class="w-0.5 h-4 bg-slate-300 -mt-4"></div>
                        <div class="bg-amber-50 border-2 border-amber-300 rounded-lg px-4 py-2 mb-3 shadow-sm">
                            <div class="text-xs font-bold text-amber-800">🏢 Equipo Gerencial</div>
                            <div class="text-[10px] text-amber-600">Gestión, legal y regulatorio</div>
                        </div>
                        <div class="flex flex-col gap-2 items-center">
                            ${uCard('u-abarrios','sm')}
                            ${uCard('u-cjerez','sm')}
                            ${uCard('u-pm','sm')}
                            ${uCard('u-legal','sm')}
                        </div>
                    </div>
                    <!-- BACKEND TEAM -->
                    <div class="flex flex-col items-center">
                        <div class="w-0.5 h-4 bg-slate-300 -mt-4"></div>
                        <div class="bg-sky-50 border-2 border-sky-300 rounded-lg px-4 py-2 mb-3 shadow-sm">
                            <div class="text-xs font-bold text-sky-800">💻 Backend & Core</div>
                            <div class="text-[10px] text-sky-600">Desarrollo del sistema</div>
                        </div>
                        <div class="flex flex-col gap-2 items-center">
                            ${uCard('u-dev','sm')}
                            ${uCard('u-dev2','sm')}
                            ${uCard('u-dev3','sm')}
                            ${uCard('u-dev4','sm')}
                            ${uCard('u-front','sm')}
                        </div>
                    </div>
                    <!-- DEVSECOPS TEAM -->
                    <div class="flex flex-col items-center">
                        <div class="w-0.5 h-4 bg-slate-300 -mt-4"></div>
                        <div class="bg-violet-50 border-2 border-violet-300 rounded-lg px-4 py-2 mb-3 shadow-sm">
                            <div class="text-xs font-bold text-violet-800">⚙️ DevSecOps</div>
                            <div class="text-[10px] text-violet-600">Infra, CI/CD y ambientes</div>
                        </div>
                        <div class="flex flex-col gap-2 items-center">
                            ${uCard('u-devops','sm')}
                            ${uCard('u-devops-jr','sm')}
                        </div>
                    </div>
                    <!-- DATA & SECURITY TEAM -->
                    <div class="flex flex-col items-center">
                        <div class="w-0.5 h-4 bg-slate-300 -mt-4"></div>
                        <div class="bg-emerald-50 border-2 border-emerald-300 rounded-lg px-4 py-2 mb-3 shadow-sm">
                            <div class="text-xs font-bold text-emerald-800">🔒 Data & Security</div>
                            <div class="text-[10px] text-emerald-600">Datos, seguridad y QA</div>
                        </div>
                        <div class="flex flex-col gap-2 items-center">
                            ${uCard('u-data','sm')}
                            ${uCard('u-sec','sm')}
                            ${uCard('u-qa','sm')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- SUMMARY TABLE -->
        <div class="mt-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="px-4 py-3 bg-slate-50 border-b border-slate-200"><span class="text-sm font-bold text-slate-700">📊 Resumen de Carga por Persona</span></div>
            <table class="w-full text-xs">
                <thead><tr class="bg-slate-50 text-slate-500"><th class="text-left px-4 py-2">Miembro</th><th class="text-left px-4 py-2">Rol</th><th class="text-left px-4 py-2">Equipo</th><th class="text-center px-3 py-2">Total</th><th class="text-center px-3 py-2">✅</th><th class="text-center px-3 py-2">Activas</th><th class="text-center px-3 py-2">⚠ Atraso</th><th class="text-center px-3 py-2">% Avance</th></tr></thead>
                <tbody>${users.filter(u=>u.active).map(u=>{
                    const tc=tasks.filter(t=>t.assignee===u.id).length;
                    const done=tasks.filter(t=>t.assignee===u.id&&isCompleted(t.board,t.column)).length;
                    const active=tc-done;
                    const over=tasks.filter(t=>t.assignee===u.id&&!isCompleted(t.board,t.column)&&t.end&&t.end<todayS).length;
                    const pct=tc>0?Math.round((done/tc)*100):0;
                    const teamC=u.team==='gerencial'?'text-amber-700 bg-amber-50':u.team==='desarrollo'?'text-sky-700 bg-sky-50':'text-purple-700 bg-purple-50';
                    return`<tr class="border-t border-slate-100 hover:bg-slate-50"><td class="px-4 py-2 flex items-center gap-2"><div class="avatar flex-shrink-0" style="width:22px;height:22px;font-size:8px;background:${avatarColor(u.name)}">${initials(u.name)}</div><span class="font-semibold">${u.name}</span>${u.role==='admin'?'<span class="badge bg-blue-100 text-blue-700 text-[9px]">⚡</span>':''}</td><td class="px-4 py-2 text-slate-500">${u.title||''}</td><td class="px-4 py-2"><span class="badge ${teamC} text-[9px]">${u.team==='gerencial'?'🏢 Gerencial':u.team==='desarrollo'?'💻 Desarrollo':'🔄 Ambos'}</span></td><td class="text-center px-3 py-2 font-bold">${tc}</td><td class="text-center px-3 py-2 text-emerald-600">${done}</td><td class="text-center px-3 py-2 text-blue-600">${active}</td><td class="text-center px-3 py-2 ${over>0?'text-red-600 font-bold':''}">${over}</td><td class="text-center px-3 py-2"><div class="flex items-center gap-1 justify-center"><div class="w-12 bg-slate-100 rounded-full h-1.5"><div class="h-1.5 rounded-full bg-emerald-400" style="width:${pct}%"></div></div><span class="font-bold">${pct}%</span></div></td></tr>`;
                }).join('')}</tbody>
            </table>
        </div>`;
}

// ── ADMIN ──
function renderAdmin(){
    if(!currentUser||currentUser.role!=='admin')return;
    const teamBadge=t=>t==='gerencial'?'<span class="badge bg-amber-100 text-amber-700">🏢 Gerencial</span>':t==='desarrollo'?'<span class="badge bg-sky-100 text-sky-700">💻 Desarrollo</span>':'<span class="badge bg-purple-100 text-purple-700">🔄 Ambos</span>';
    document.getElementById('users-container').innerHTML=(DATA.users||[]).map(u=>{const tc=(DATA.tasks||[]).filter(t=>t.assignee===u.id&&!t.discarded).length;return`<div class="bg-white rounded-lg border border-slate-200 p-4 flex items-center gap-3"><div class="avatar" style="width:36px;height:36px;font-size:13px;background:${avatarColor(u.name)}">${initials(u.name)}</div><div class="flex-1"><div class="flex items-center gap-2 flex-wrap"><span class="text-sm font-semibold">${u.name}</span>${u.role==='admin'?'<span class="badge bg-blue-100 text-blue-700">⚡ Admin</span>':''}${teamBadge(u.team)}<span class="badge ${u.active?'bg-emerald-100 text-emerald-700':'bg-red-100 text-red-700'}">${u.active?'Activo':'Inactivo'}</span></div><div class="text-[11px] text-slate-500 mt-0.5">${u.email} · ${tc} tareas activas</div></div><button onclick="openUserModal('${u.id}')" class="text-xs text-blue-500 hover:bg-blue-50 px-3 py-1.5 rounded-lg">✏️</button></div>`}).join('');
    // Discarded tasks section
    const discarded=(DATA.tasks||[]).filter(t=>t.discarded);
    const dc=document.getElementById('discarded-container');
    if(dc){dc.innerHTML=discarded.length>0?discarded.map(t=>{const u=(DATA.users||[]).find(x=>x.id===t.assignee);const discardedBy=getUserName(t.discardedBy);return`<div class="bg-white rounded-lg border border-red-200 p-3 flex items-center gap-3"><div class="text-lg">🚫</div><div class="flex-1 min-w-0"><div class="text-xs font-semibold text-slate-600 truncate">${t.title}</div><div class="text-[10px] text-slate-400">${BOARDS[t.board]?BOARDS[t.board].icon+' '+BOARDS[t.board].name:t.board} · ${getColumnName(t.board,t.column)} · ${u?u.name:'Sin asignar'}</div><div class="text-[10px] text-red-400">Descartada ${fmtDateTime(t.discardedAt)} por ${discardedBy}</div></div><button onclick="restoreTask('${t.id}')" class="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg font-medium">♻️ Restaurar</button><button onclick="openDetailModal('${t.id}')" class="text-xs text-blue-500 hover:bg-blue-50 px-2 py-1.5 rounded-lg">👁</button></div>`}).join(''):'<div class="text-center text-slate-400 py-6 text-xs">Sin tareas descartadas.</div>';}
}
function openUserModal(editId){
    if(!currentUser||currentUser.role!=='admin')return;const modal=document.getElementById('user-modal');
    if(editId&&typeof editId==='string'){const u=(DATA.users||[]).find(x=>x.id===editId);if(u){document.getElementById('um-title-h').textContent='Editar Usuario';document.getElementById('um-id').value=u.id;document.getElementById('um-name').value=u.name;document.getElementById('um-email').value=u.email;document.getElementById('um-pass').value=u.password;document.getElementById('um-role').value=u.role;document.getElementById('um-team').value=u.team||'both';document.getElementById('um-active').checked=u.active;modal.classList.remove('hidden');return}}
    document.getElementById('um-title-h').textContent='Nuevo Usuario';document.getElementById('um-id').value='';document.getElementById('um-name').value='';document.getElementById('um-email').value='';document.getElementById('um-pass').value='';document.getElementById('um-role').value='member';document.getElementById('um-team').value='both';document.getElementById('um-active').checked=true;modal.classList.remove('hidden');
}
function closeUserModal(){document.getElementById('user-modal').classList.add('hidden')}
function saveUser(){const id=document.getElementById('um-id').value;const name=document.getElementById('um-name').value.trim();const email=document.getElementById('um-email').value.trim();const pass=document.getElementById('um-pass').value;if(!name||!email||!pass){alert('Todos los campos son requeridos.');return}const d={name,email,password:pass,role:document.getElementById('um-role').value,team:document.getElementById('um-team').value,active:document.getElementById('um-active').checked};if(id){const i=DATA.users.findIndex(u=>u.id===id);if(i>=0)DATA.users[i]={...DATA.users[i],...d}}else{DATA.users.push({id:uid(),...d,createdAt:new Date().toISOString()})}saveData();closeUserModal();renderAdmin();populateFilters()}

// ── REPORTS ──
const MONTH_NAMES=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
function populateReportSelectors(){
    const mSel=document.getElementById('report-month');const ySel=document.getElementById('report-year');
    const now=new Date();
    mSel.innerHTML=MONTH_NAMES.map((m,i)=>`<option value="${i}" ${i===now.getMonth()?'selected':''}>${m}</option>`).join('');
    const years=[2025,2026,2027,2028];
    ySel.innerHTML=years.map(y=>`<option value="${y}" ${y===now.getFullYear()?'selected':''}>${y}</option>`).join('');
}
function isInMonth(dateStr,month,year){if(!dateStr)return false;const d=new Date(dateStr);return d.getMonth()===month&&d.getFullYear()===year}
function taskHadActivityInMonth(task,month,year){
    const start=new Date(year,month,1);const end=new Date(year,month+1,0,23,59,59);
    if(task.completedAt){const d=new Date(task.completedAt);if(d>=start&&d<=end)return true}
    if(task.createdAt){const d=new Date(task.createdAt);if(d>=start&&d<=end)return true}
    for(const h of(task.history||[])){const d=new Date(h.timestamp);if(d>=start&&d<=end)return true}
    for(const c of(task.comments||[])){const d=new Date(c.timestamp);if(d>=start&&d<=end)return true}
    return false;
}
function getMonthEvents(task,month,year){
    const start=new Date(year,month,1);const end=new Date(year,month+1,0,23,59,59);
    const evts=[];
    for(const h of(task.history||[])){const d=new Date(h.timestamp);if(d>=start&&d<=end)evts.push({type:h.action,ts:h.timestamp,detail:h})}
    for(const c of(task.comments||[])){const d=new Date(c.timestamp);if(d>=start&&d<=end)evts.push({type:'comment',ts:c.timestamp,detail:c})}
    return evts.sort((a,b)=>new Date(a.ts)-new Date(b.ts));
}
function generateReport(){
    const reportType=document.getElementById('report-type').value;
    if(reportType==='monthly')generateMonthlyReport();
    else generateGeneralReport();
}
function generateMonthlyReport(){
    const c=document.getElementById('report-container');const bf=document.getElementById('report-board').value;
    const month=parseInt(document.getElementById('report-month').value);
    const year=parseInt(document.getElementById('report-year').value);
    const monthName=MONTH_NAMES[month];const monthStart=new Date(year,month,1);const monthEnd=new Date(year,month+1,0,23,59,59);
    let allTasks=(DATA.tasks||[]).filter(t=>!t.discarded);if(bf!=='all')allTasks=allTasks.filter(t=>t.board===bf);
    const totalGlobal=allTasks.length;const completedGlobal=allTasks.filter(t=>isCompleted(t.board,t.column)).length;
    const pctGlobal=totalGlobal>0?Math.round((completedGlobal/totalGlobal)*100):0;
    const today=todayStr();
    const overdueAll=allTasks.filter(t=>!isCompleted(t.board,t.column)&&t.end&&t.end<today);
    // Monthly-specific metrics
    const completedThisMonth=allTasks.filter(t=>t.completedAt&&isInMonth(t.completedAt,month,year));
    const createdThisMonth=allTasks.filter(t=>t.createdAt&&isInMonth(t.createdAt,month,year));
    const activeTasks=allTasks.filter(t=>taskHadActivityInMonth(t,month,year));
    // Tasks due this month
    const dueThisMonth=allTasks.filter(t=>t.end&&isInMonth(t.end+'T00:00:00',month,year));
    const dueCompleted=dueThisMonth.filter(t=>isCompleted(t.board,t.column));
    const duePending=dueThisMonth.filter(t=>!isCompleted(t.board,t.column));
    // Tasks starting this month
    const startThisMonth=allTasks.filter(t=>t.start&&isInMonth(t.start+'T00:00:00',month,year));
    // Movements this month
    let movementsThisMonth=0;
    allTasks.forEach(t=>{(t.history||[]).forEach(h=>{if(h.action==='moved'){const d=new Date(h.timestamp);if(d>=monthStart&&d<=monthEnd)movementsThisMonth++}})});
    // Comments this month
    let commentsThisMonth=0;
    allTasks.forEach(t=>{(t.comments||[]).forEach(co=>{const d=new Date(co.timestamp);if(d>=monthStart&&d<=monthEnd)commentsThisMonth++})});
    // Previous month comparison
    const prevM=month===0?11:month-1;const prevY=month===0?year-1:year;
    const completedPrev=allTasks.filter(t=>t.completedAt&&isInMonth(t.completedAt,prevM,prevY)).length;
    const createdPrev=allTasks.filter(t=>t.createdAt&&isInMonth(t.createdAt,prevM,prevY)).length;
    const delta=completedThisMonth.length-completedPrev;const deltaIcon=delta>0?'📈':delta<0?'📉':'➡️';
    // Commitments due this month
    const commitmentsMonth=(DATA.commitments||[]).filter(x=>x.date&&isInMonth(x.date+'T00:00:00',month,year));
    // Milestones this month
    const milestonesMonth=(DATA.regulatoryMilestones||[]).filter(x=>x.date&&isInMonth(x.date+'T00:00:00',month,year));
    // Burndown by week
    const weeks=[];for(let w=0;w<5;w++){const ws=new Date(year,month,1+w*7);const we=new Date(year,month,Math.min(7+w*7,monthEnd.getDate()));if(ws>monthEnd)break;const label='Sem '+(w+1);const compW=allTasks.filter(t=>t.completedAt&&new Date(t.completedAt)>=ws&&new Date(t.completedAt)<=we).length;const crW=allTasks.filter(t=>t.createdAt&&new Date(t.createdAt)>=ws&&new Date(t.createdAt)<=we).length;weeks.push({label,completed:compW,created:crW})}
    // Workload by user this month
    const userWork=(DATA.users||[]).filter(u=>u.active).map(u=>{
        const ut=allTasks.filter(t=>t.assignee===u.id);
        const compM=ut.filter(t=>t.completedAt&&isInMonth(t.completedAt,month,year)).length;
        const activeM=ut.filter(t=>taskHadActivityInMonth(t,month,year)).length;
        const overdueU=ut.filter(t=>!isCompleted(t.board,t.column)&&t.end&&t.end<today).length;
        return{name:u.name,completed:compM,active:activeM,overdue:overdueU,total:ut.length}
    }).filter(u=>u.active>0||u.completed>0||u.overdue>0);

    c.innerHTML=`<div class="print-only text-center mb-6"><h1 class="text-2xl font-bold">UPME — Informe Mensual</h1><p class="text-sm text-slate-500">Electromovilidad — Res. 40559/2025</p></div>
    <div class="border-b pb-4 mb-6"><div class="flex justify-between items-center flex-wrap gap-2"><h3 class="font-bold text-lg">📅 Informe Mensual — ${monthName} ${year}</h3><span class="text-sm text-slate-500">${bf==='all'?'Todos los tableros':BOARDS[bf]?.name||bf}</span></div><p class="text-xs text-slate-400 mt-1">Generado: ${new Date().toLocaleDateString('es-CO',{weekday:'long',year:'numeric',month:'long',day:'numeric'})} ${new Date().toLocaleTimeString('es-CO')}</p></div>

    <h4 class="font-bold text-sm mb-3">1. Resumen del Mes</h4>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="text-center p-3 bg-emerald-50 rounded-lg border border-emerald-100"><div class="text-2xl font-bold text-emerald-700">${completedThisMonth.length}</div><div class="text-[10px] text-emerald-600">Completadas este mes</div></div>
        <div class="text-center p-3 bg-blue-50 rounded-lg border border-blue-100"><div class="text-2xl font-bold text-blue-700">${createdThisMonth.length}</div><div class="text-[10px] text-blue-600">Creadas este mes</div></div>
        <div class="text-center p-3 bg-violet-50 rounded-lg border border-violet-100"><div class="text-2xl font-bold text-violet-700">${activeTasks.length}</div><div class="text-[10px] text-violet-600">Tareas con actividad</div></div>
        <div class="text-center p-3 bg-amber-50 rounded-lg border border-amber-100"><div class="text-2xl font-bold text-amber-700">${movementsThisMonth}</div><div class="text-[10px] text-amber-600">Movimientos de columna</div></div>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div class="text-center p-3 bg-slate-50 rounded-lg border"><div class="text-2xl font-bold text-slate-700">${pctGlobal}%</div><div class="text-[10px]">Avance global</div></div>
        <div class="text-center p-3 bg-slate-50 rounded-lg border"><div class="text-2xl font-bold text-slate-700">${completedGlobal}/${totalGlobal}</div><div class="text-[10px]">Total completadas</div></div>
        <div class="text-center p-3 ${overdueAll.length>0?'bg-red-50 border-red-100':'bg-slate-50'} rounded-lg border"><div class="text-2xl font-bold ${overdueAll.length>0?'text-red-700':'text-slate-700'}">${overdueAll.length}</div><div class="text-[10px]">Atrasadas acumuladas</div></div>
        <div class="text-center p-3 bg-slate-50 rounded-lg border"><div class="text-lg font-bold text-slate-700">${deltaIcon} ${delta>=0?'+':''}${delta}</div><div class="text-[10px]">vs ${MONTH_NAMES[prevM]}</div></div>
    </div>

    <h4 class="font-bold text-sm mb-3">2. Avance Semanal del Mes</h4>
    <div class="mb-6"><table class="w-full text-xs border"><thead><tr class="bg-slate-100"><th class="text-left p-2">Semana</th><th class="text-center p-2">✅ Completadas</th><th class="text-center p-2">🆕 Creadas</th><th class="text-center p-2">Neto</th></tr></thead><tbody>${weeks.map(w=>{const net=w.completed-w.created;return`<tr class="border-t"><td class="p-2 font-medium">${w.label}</td><td class="p-2 text-center text-emerald-600 font-bold">${w.completed}</td><td class="p-2 text-center text-blue-600">${w.created}</td><td class="p-2 text-center ${net>=0?'text-emerald-600':'text-red-600'} font-bold">${net>=0?'+':''}${net}</td></tr>`}).join('')}</tbody></table>
    <div class="flex gap-1 mt-3 items-end h-16">${weeks.map(w=>{const max=Math.max(...weeks.map(x=>Math.max(x.completed,x.created)),1);return`<div class="flex-1 flex flex-col items-center gap-0.5"><div class="w-full flex gap-0.5 items-end justify-center" style="height:48px"><div class="bg-emerald-400 rounded-t" style="width:40%;height:${Math.round(w.completed/max*48)}px" title="${w.completed} completadas"></div><div class="bg-blue-400 rounded-t" style="width:40%;height:${Math.round(w.created/max*48)}px" title="${w.created} creadas"></div></div><div class="text-[9px] text-slate-400">${w.label}</div></div>`}).join('')}</div>
    <div class="flex gap-4 mt-2 text-[10px] text-slate-500"><span class="flex items-center gap-1"><span class="w-2 h-2 bg-emerald-400 rounded inline-block"></span> Completadas</span><span class="flex items-center gap-1"><span class="w-2 h-2 bg-blue-400 rounded inline-block"></span> Creadas</span></div></div>

    <h4 class="font-bold text-sm mb-3">3. Tareas Completadas en ${monthName} (${completedThisMonth.length})</h4>
    ${completedThisMonth.length>0?`<table class="w-full text-xs mb-6 border border-emerald-200"><thead><tr class="bg-emerald-50"><th class="text-left p-2">Tarea</th><th class="p-2">Tablero</th><th class="p-2">Responsable</th><th class="p-2 text-center">Completada</th></tr></thead><tbody>${completedThisMonth.map(t=>`<tr class="border-t border-emerald-100"><td class="p-2 font-medium">${t.title}</td><td class="p-2"><span class="badge ${t.board==='gerencial'?'bg-amber-100 text-amber-700':'bg-blue-100 text-blue-700'}">${BOARDS[t.board]?.name||t.board}</span></td><td class="p-2">${getUserName(t.assignee)}</td><td class="p-2 text-center text-emerald-600">${fmtDate(t.completedAt)}</td></tr>`).join('')}</tbody></table>`:'<p class="text-xs text-slate-400 mb-6 italic">Sin tareas completadas este mes.</p>'}

    <h4 class="font-bold text-sm mb-3">4. Tareas con Vencimiento en ${monthName} (${dueThisMonth.length})</h4>
    ${dueThisMonth.length>0?`<table class="w-full text-xs mb-6 border"><thead><tr class="bg-slate-100"><th class="text-left p-2">Tarea</th><th class="p-2">Responsable</th><th class="p-2 text-center">Vence</th><th class="p-2 text-center">Estado</th></tr></thead><tbody>${dueThisMonth.map(t=>{const done=isCompleted(t.board,t.column);const late=!done&&t.end<today;return`<tr class="border-t"><td class="p-2">${t.title}</td><td class="p-2">${getUserName(t.assignee)}</td><td class="p-2 text-center">${fmtDate(t.end)}</td><td class="p-2 text-center"><span class="badge ${done?'bg-emerald-100 text-emerald-700':late?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700'}">${done?'✅ Completada':late?'⚠ Atrasada':'⏳ Pendiente'}</span></td></tr>`}).join('')}</tbody></table><div class="flex gap-3 mb-6 text-xs"><span class="text-emerald-600 font-bold">✅ ${dueCompleted.length} completadas</span><span class="text-amber-600 font-bold">⏳ ${duePending.filter(t=>!(t.end<today)).length} pendientes</span><span class="text-red-600 font-bold">⚠ ${duePending.filter(t=>t.end<today).length} atrasadas</span></div>`:'<p class="text-xs text-slate-400 mb-6 italic">Sin vencimientos este mes.</p>'}

    <h4 class="font-bold text-sm mb-3">5. Avance por Fase (acumulado a ${monthName})</h4>
    <table class="w-full text-xs mb-6 border"><thead><tr class="bg-slate-100"><th class="text-left p-2">Fase</th><th class="text-center p-2">Total</th><th class="text-center p-2">Done</th><th class="text-center p-2">%</th><th class="p-2" style="width:120px">Progreso</th></tr></thead><tbody>${(DATA.phases||[]).map(p=>{const pt=allTasks.filter(t=>t.phase===p.id);const pc=pt.filter(t=>isCompleted(t.board,t.column)).length;const pp=pt.length>0?Math.round((pc/pt.length)*100):0;const compM=pt.filter(t=>t.completedAt&&isInMonth(t.completedAt,month,year)).length;return`<tr class="border-t"><td class="p-2">${p.name}${compM>0?' <span class="text-emerald-500 font-bold">(+'+compM+' este mes)</span>':''}</td><td class="p-2 text-center">${pt.length}</td><td class="p-2 text-center text-emerald-600">${pc}</td><td class="p-2 text-center font-bold">${pp}%</td><td class="p-2"><div class="w-full bg-slate-200 rounded-full h-2"><div class="h-2 rounded-full" style="width:${pp}%;background:${p.color||'#3b82f6'}"></div></div></td></tr>`}).join('')}</tbody></table>

    <h4 class="font-bold text-sm mb-3">6. Rendimiento por Responsable en ${monthName}</h4>
    ${userWork.length>0?`<table class="w-full text-xs mb-6 border"><thead><tr class="bg-slate-100"><th class="text-left p-2">Responsable</th><th class="text-center p-2">Completadas mes</th><th class="text-center p-2">Activas mes</th><th class="text-center p-2">Atrasadas</th><th class="text-center p-2">Total asignadas</th></tr></thead><tbody>${userWork.map(u=>`<tr class="border-t"><td class="p-2 font-medium">${u.name}</td><td class="p-2 text-center text-emerald-600 font-bold">${u.completed}</td><td class="p-2 text-center text-blue-600">${u.active}</td><td class="p-2 text-center ${u.overdue>0?'text-red-600 font-bold':''}">${u.overdue}</td><td class="p-2 text-center">${u.total}</td></tr>`).join('')}</tbody></table>`:'<p class="text-xs text-slate-400 mb-6 italic">Sin actividad de usuarios este mes.</p>'}

    ${commitmentsMonth.length>0?`<h4 class="font-bold text-sm mb-3">7. Compromisos del Mes (${commitmentsMonth.length})</h4><table class="w-full text-xs mb-6 border border-amber-200"><thead><tr class="bg-amber-50"><th class="text-left p-2">Compromiso</th><th class="p-2">Responsable</th><th class="p-2 text-center">Fecha</th><th class="p-2 text-center">Estado</th></tr></thead><tbody>${commitmentsMonth.map(x=>{const sc=x.status==='cumplido'?'bg-emerald-100 text-emerald-700':x.status==='vencido'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700';return`<tr class="border-t border-amber-100"><td class="p-2">${x.title}</td><td class="p-2">${x.owner}</td><td class="p-2 text-center">${fmtDate(x.date)}</td><td class="p-2 text-center"><span class="badge ${sc}">${x.status}</span></td></tr>`}).join('')}</tbody></table>`:''}

    ${milestonesMonth.length>0?`<h4 class="font-bold text-sm mb-3">${commitmentsMonth.length>0?'8':'7'}. Hitos Regulatorios del Mes</h4><table class="w-full text-xs mb-6 border border-violet-200"><thead><tr class="bg-violet-50"><th class="text-left p-2">Hito</th><th class="text-center p-2">Fecha</th><th class="text-center p-2">Estado</th></tr></thead><tbody>${milestonesMonth.map(r=>{const sc=r.status==='completado'?'bg-emerald-100 text-emerald-700':r.status==='en_progreso'?'bg-blue-100 text-blue-700':'bg-slate-100 text-slate-600';return`<tr class="border-t"><td class="p-2">${r.title}</td><td class="p-2 text-center">${fmtDate(r.date)}</td><td class="p-2 text-center"><span class="badge ${sc}">${r.status}</span></td></tr>`}).join('')}</tbody></table>`:''}

    ${overdueAll.length>0?`<h4 class="font-bold text-sm text-red-700 mb-3">⚠ Tareas Atrasadas Acumuladas (${overdueAll.length})</h4><table class="w-full text-xs mb-6 border border-red-200"><thead><tr class="bg-red-50"><th class="text-left p-2">Tarea</th><th class="p-2">Responsable</th><th class="p-2 text-center">Vencimiento</th><th class="p-2 text-center">Días atraso</th></tr></thead><tbody>${overdueAll.slice(0,20).map(t=>`<tr class="border-t border-red-100"><td class="p-2">${t.title}</td><td class="p-2">${getUserName(t.assignee)}</td><td class="p-2 text-center">${fmtDate(t.end)}</td><td class="p-2 text-center text-red-600 font-bold">${Math.abs(daysBetween(today,t.end))}</td></tr>`).join('')}</tbody></table>`:''}

    <div class="border-t pt-4 mt-6 text-[10px] text-slate-400 text-center">Informe Mensual ${monthName} ${year} — Project Tracker Electromovilidad — UPME — ${new Date().toLocaleDateString('es-CO')} ${new Date().toLocaleTimeString('es-CO')}</div>`;
}

function generateGeneralReport(){
    const c=document.getElementById('report-container');const bf=document.getElementById('report-board').value;
    let tasks=(DATA.tasks||[]).filter(t=>!t.discarded);if(bf!=='all')tasks=tasks.filter(t=>t.board===bf);
    const total=tasks.length;const completed=tasks.filter(t=>isCompleted(t.board,t.column)).length;
    const pct=total>0?Math.round((completed/total)*100):0;const today=todayStr();
    const overdue=tasks.filter(t=>!isCompleted(t.board,t.column)&&t.end&&t.end<today);
    const pendC=(DATA.commitments||[]).filter(x=>x.status==='pendiente'||x.status==='vencido');
    const bSum=Object.entries(BOARDS).map(([bId,b])=>{const bt=tasks.filter(t=>t.board===bId);const bc=bt.filter(t=>isCompleted(t.board,t.column)).length;return{name:b.name,icon:b.icon,total:bt.length,completed:bc,pct:bt.length>0?Math.round((bc/bt.length)*100):0}});
    // Monthly trend (last 6 months)
    const now=new Date();const trend=[];
    for(let i=5;i>=0;i--){const m=new Date(now.getFullYear(),now.getMonth()-i,1);const mEnd=new Date(m.getFullYear(),m.getMonth()+1,0,23,59,59);const compM=tasks.filter(t=>t.completedAt&&new Date(t.completedAt)>=m&&new Date(t.completedAt)<=mEnd).length;const crM=tasks.filter(t=>t.createdAt&&new Date(t.createdAt)>=m&&new Date(t.createdAt)<=mEnd).length;trend.push({label:MONTH_NAMES[m.getMonth()].substring(0,3)+' '+m.getFullYear(),completed:compM,created:crM})}
    c.innerHTML=`<div class="print-only text-center mb-6"><h1 class="text-2xl font-bold">UPME — Informe General</h1><p class="text-sm text-slate-500">Electromovilidad — Res. 40559/2025</p></div>
    <div class="border-b pb-4 mb-6"><div class="flex justify-between items-center flex-wrap gap-2"><h3 class="font-bold text-lg">📊 Informe General — Project Tracker</h3><span class="text-sm text-slate-500">${new Date().toLocaleDateString('es-CO',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</span></div></div>
    <h4 class="font-bold text-sm mb-3">1. Resumen Ejecutivo</h4>
    <div class="grid grid-cols-4 gap-3 mb-6"><div class="text-center p-3 bg-blue-50 rounded-lg border border-blue-100"><div class="text-2xl font-bold text-blue-700">${pct}%</div><div class="text-[10px]">Avance</div></div><div class="text-center p-3 bg-emerald-50 rounded-lg border border-emerald-100"><div class="text-2xl font-bold text-emerald-700">${completed}/${total}</div><div class="text-[10px]">Completadas</div></div><div class="text-center p-3 bg-amber-50 rounded-lg border border-amber-100"><div class="text-2xl font-bold text-amber-700">${pendC.length}</div><div class="text-[10px]">Compromisos pend.</div></div><div class="text-center p-3 bg-red-50 rounded-lg border border-red-100"><div class="text-2xl font-bold text-red-700">${overdue.length}</div><div class="text-[10px]">Atrasadas</div></div></div>
    <h4 class="font-bold text-sm mb-3">2. Tendencia Mensual (últimos 6 meses)</h4>
    <div class="mb-6"><table class="w-full text-xs border"><thead><tr class="bg-slate-100"><th class="text-left p-2">Mes</th><th class="text-center p-2">✅ Completadas</th><th class="text-center p-2">🆕 Creadas</th><th class="text-center p-2">Neto</th></tr></thead><tbody>${trend.map(t=>{const net=t.completed-t.created;return`<tr class="border-t"><td class="p-2 font-medium">${t.label}</td><td class="p-2 text-center text-emerald-600 font-bold">${t.completed}</td><td class="p-2 text-center text-blue-600">${t.created}</td><td class="p-2 text-center ${net>=0?'text-emerald-600':'text-red-600'} font-bold">${net>=0?'+':''}${net}</td></tr>`}).join('')}</tbody></table>
    <div class="flex gap-1 mt-3 items-end h-20">${trend.map(t=>{const max=Math.max(...trend.map(x=>Math.max(x.completed,x.created)),1);return`<div class="flex-1 flex flex-col items-center gap-0.5"><div class="w-full flex gap-0.5 items-end justify-center" style="height:60px"><div class="bg-emerald-400 rounded-t" style="width:40%;height:${Math.round(t.completed/max*60)}px" title="${t.completed} completadas"></div><div class="bg-blue-400 rounded-t" style="width:40%;height:${Math.round(t.created/max*60)}px" title="${t.created} creadas"></div></div><div class="text-[9px] text-slate-400">${t.label}</div></div>`}).join('')}</div>
    <div class="flex gap-4 mt-2 text-[10px] text-slate-500"><span class="flex items-center gap-1"><span class="w-2 h-2 bg-emerald-400 rounded inline-block"></span> Completadas</span><span class="flex items-center gap-1"><span class="w-2 h-2 bg-blue-400 rounded inline-block"></span> Creadas</span></div></div>
    <h4 class="font-bold text-sm mb-3">3. Por Tablero</h4>
    <table class="w-full text-xs mb-6 border"><thead><tr class="bg-slate-100"><th class="text-left p-2">Tablero</th><th class="text-center p-2">Total</th><th class="text-center p-2">Completadas</th><th class="text-center p-2">%</th><th class="p-2" style="width:100px">Progreso</th></tr></thead><tbody>${bSum.map(b=>`<tr class="border-t"><td class="p-2">${b.icon} ${b.name}</td><td class="p-2 text-center">${b.total}</td><td class="p-2 text-center text-emerald-600">${b.completed}</td><td class="p-2 text-center font-bold">${b.pct}%</td><td class="p-2"><div class="w-full bg-slate-200 rounded-full h-2"><div class="h-2 rounded-full bg-blue-500" style="width:${b.pct}%"></div></div></td></tr>`).join('')}</tbody></table>
    <h4 class="font-bold text-sm mb-3">4. Por Fase</h4>
    <table class="w-full text-xs mb-6 border"><thead><tr class="bg-slate-100"><th class="text-left p-2">Fase</th><th class="text-center p-2">Total</th><th class="text-center p-2">Done</th><th class="text-center p-2">%</th><th class="p-2" style="width:120px">Progreso</th></tr></thead><tbody>${(DATA.phases||[]).map(p=>{const pt=tasks.filter(t=>t.phase===p.id);const pc=pt.filter(t=>isCompleted(t.board,t.column)).length;const pp=pt.length>0?Math.round((pc/pt.length)*100):0;return`<tr class="border-t"><td class="p-2">${p.name}</td><td class="p-2 text-center">${pt.length}</td><td class="p-2 text-center text-emerald-600">${pc}</td><td class="p-2 text-center font-bold">${pp}%</td><td class="p-2"><div class="w-full bg-slate-200 rounded-full h-2"><div class="h-2 rounded-full" style="width:${pp}%;background:${p.color||'#3b82f6'}"></div></div></td></tr>`}).join('')}</tbody></table>
    ${overdue.length>0?`<h4 class="font-bold text-sm text-red-700 mb-3">5. Atrasadas (${overdue.length})</h4><table class="w-full text-xs mb-6 border border-red-200"><thead><tr class="bg-red-50"><th class="text-left p-2">Tarea</th><th class="p-2">Responsable</th><th class="p-2 text-center">Fecha</th><th class="p-2 text-center">Días</th></tr></thead><tbody>${overdue.slice(0,20).map(t=>`<tr class="border-t border-red-100"><td class="p-2">${t.title}</td><td class="p-2">${getUserName(t.assignee)}</td><td class="p-2 text-center">${fmtDate(t.end)}</td><td class="p-2 text-center text-red-600 font-bold">${Math.abs(daysBetween(today,t.end))}</td></tr>`).join('')}</tbody></table>`:'<h4 class="font-bold text-sm text-emerald-700 mb-3">5. Sin Atrasadas ✅</h4>'}
    <h4 class="font-bold text-sm mb-3">6. Hitos Regulatorios</h4>
    <table class="w-full text-xs mb-6 border border-violet-200"><thead><tr class="bg-violet-50"><th class="text-left p-2">Hito</th><th class="text-center p-2">Fecha</th><th class="text-center p-2">Estado</th></tr></thead><tbody>${(DATA.regulatoryMilestones||[]).map(r=>{const sc=r.status==='completado'?'bg-emerald-100 text-emerald-700':r.status==='en_progreso'?'bg-blue-100 text-blue-700':'bg-slate-100 text-slate-600';return`<tr class="border-t"><td class="p-2">${r.title}</td><td class="p-2 text-center">${fmtDate(r.date)}</td><td class="p-2 text-center"><span class="badge ${sc}">${r.status}</span></td></tr>`}).join('')}</tbody></table>
    <h4 class="font-bold text-sm mb-3">7. Carga por Responsable</h4>
    <table class="w-full text-xs mb-6 border"><thead><tr class="bg-slate-100"><th class="text-left p-2">Responsable</th><th class="text-center p-2">Total</th><th class="text-center p-2">Done</th><th class="text-center p-2">Activas</th><th class="text-center p-2">Atraso</th></tr></thead><tbody>${(DATA.users||[]).filter(u=>u.active).map(u=>{const ut=tasks.filter(t=>t.assignee===u.id);const uc=ut.filter(t=>isCompleted(t.board,t.column)).length;const uo=ut.filter(t=>!isCompleted(t.board,t.column)&&t.end&&t.end<today).length;return`<tr class="border-t"><td class="p-2">${u.name}</td><td class="p-2 text-center">${ut.length}</td><td class="p-2 text-center text-emerald-600">${uc}</td><td class="p-2 text-center text-blue-600">${ut.length-uc}</td><td class="p-2 text-center ${uo>0?'text-red-600 font-bold':''}">${uo}</td></tr>`}).join('')}</tbody></table>
    <div class="border-t pt-4 mt-6 text-[10px] text-slate-400 text-center">Informe General — Project Tracker Electromovilidad — UPME — ${new Date().toLocaleDateString('es-CO')} ${new Date().toLocaleTimeString('es-CO')}</div>`;
}

// ── DEFAULT DATA ──
function getDefaultData(){
    const now=new Date().toISOString();
    function t(id,title,board,column,phase,capa,tipo,pri,assignee,start,end,desc){return{id,title,board,column,phase,capa,tipo,priority:pri,assignee,start,end,description:desc||'',comments:[],links:[],createdAt:now,completedAt:null,createdBy:'admin',history:[{action:'created',column,timestamp:now,userId:'admin'}]}}
    return{version:1,lastUpdated:now,
    users:[
        {id:'admin',name:'Rafael Andres Dominguez Jimenez',email:'rafael.dominguez@upme.gov.co',password:'Admin2026!',role:'admin',team:'both',title:'Arquitecto Software Senior',responsibility:'Arquitectura de software, decisiones técnicas, liderazgo técnico del proyecto, supervisión transversal de todos los equipos',active:true,createdAt:now},
        {id:'u-pm',name:'Project Manager',email:'pm@upme.gov.co',password:'PM2026!',role:'member',team:'both',title:'Project Manager',responsibility:'Gestión del proyecto, reuniones de seguimiento, coordinación con stakeholders, reportes al MinEnergía',active:true,createdAt:now},
        {id:'u-devops',name:'DevSecOps Lead',email:'devops@upme.gov.co',password:'DevOps2026!',role:'member',team:'desarrollo',title:'DevSecOps Lead',responsibility:'Montaje ambientes Producción y Test, CI/CD pipelines, Terraform IaC, monitoreo OCI, DR',active:true,createdAt:now},
        {id:'u-devops-jr',name:'DevSecOps Junior',email:'devops-jr@upme.gov.co',password:'DevOpsJr2026!',role:'member',team:'desarrollo',title:'DevSecOps Junior',responsibility:'Montaje ambiente local, Docker Compose, Makefile, pre-commit hooks, pruebas internas, tooling desarrollador',active:true,createdAt:now},
        {id:'u-dev',name:'Dev Senior Backend 1',email:'dev@upme.gov.co',password:'Dev2026!',role:'member',team:'desarrollo',title:'Develop Senior Backend 1',responsibility:'Desarrollo Core Sistema: módulos CPO, OCPI ingesta, validación Pydantic, API principal',active:true,createdAt:now},
        {id:'u-dev2',name:'Dev Senior Backend 2',email:'dev2@upme.gov.co',password:'Dev22026!',role:'member',team:'desarrollo',title:'Develop Senior Backend 2',responsibility:'Desarrollo Core Seguridad: módulo auditoría, detección anomalías, health checks, logging, remediación vulnerabilidades',active:true,createdAt:now},
        {id:'u-dev3',name:'Dev SemiSenior Backend 1',email:'dev3@upme.gov.co',password:'Dev32026!',role:'member',team:'desarrollo',title:'Develop SemiSenior Backend 1',responsibility:'Soporte desarrollo backend: compliance suite, módulo Cárgame, API pública, integration tests',active:true,createdAt:now},
        {id:'u-dev4',name:'Dev SemiSenior Backend 2',email:'dev4@upme.gov.co',password:'Dev42026!',role:'member',team:'desarrollo',title:'Develop SemiSenior Backend 2',responsibility:'Soporte desarrollo backend: APIs secundarias, módulos auxiliares, mantenimiento y bug fixes',active:true,createdAt:now},
        {id:'u-front',name:'Dev SemiSenior Frontend 1',email:'front@upme.gov.co',password:'Front2026!',role:'member',team:'desarrollo',title:'Develop SemiSenior Frontend 1',responsibility:'Desarrollo Frontend: portal público, admin panel, developer portal, Sandbox registro y pruebas CPOs',active:true,createdAt:now},
        {id:'u-qa',name:'QA Lead',email:'qa@upme.gov.co',password:'QA2026!',role:'member',team:'desarrollo',title:'Quality Assurance Lead',responsibility:'Pruebas automatizadas E2E, PenTesting, Performance Testing, compliance tests, pruebas funcionales',active:true,createdAt:now},
        {id:'u-data',name:'Data Engineer',email:'data@upme.gov.co',password:'Data2026!',role:'member',team:'desarrollo',title:'Data Engineer',responsibility:'Definición modelo datos, migraciones Alembic, datos electromovilidad en lago de datos, Object Storage, calidad datos',active:true,createdAt:now},
        {id:'u-sec',name:'Security Engineer',email:'sec@upme.gov.co',password:'Sec2026!',role:'member',team:'desarrollo',title:'Security Engineer',responsibility:'Definición políticas WAF, redirect traffic, KeyCloak, OCI Vault, mTLS, threat modeling, hardening, secrets rotation',active:true,createdAt:now},
        {id:'u-legal',name:'Equipo Jurídico',email:'legal@upme.gov.co',password:'Legal2026!',role:'member',team:'gerencial',title:'Equipo Jurídico',responsibility:'Definición términos y condiciones, SLA, condiciones legales, contratación, marco regulatorio CPOs',active:true,createdAt:now},
        {id:'u-cjerez',name:'Cesar Jerez',email:'cesar.jerez@upme.gov.co',password:'CJerez2026!',role:'member',team:'gerencial',title:'Supervisor y Apoyo Gerencial',responsibility:'Supervisión general del proyecto de electromovilidad, apoyo gerencial transversal, seguimiento de avances, coordinación con stakeholders internos UPME',active:true,createdAt:now},
        {id:'u-abarrios',name:'Alejandro Barrios',email:'alejandro.barrios@upme.gov.co',password:'ABarrios2026!',role:'member',team:'gerencial',title:'SubDirector Departamento de Tecnología',responsibility:'Dirección y supervisión del Departamento de Tecnología UPME, decisiones estratégicas de tecnología, aprobación de arquitectura y recursos',active:true,createdAt:now}
    ],
    phases:[
        {id:'phase-1',name:'Fase 1: Fundación (Mar–May 2026)',color:'#475569'},
        {id:'phase-2',name:'Fase 2: Core OCPI (May–Jul 2026)',color:'#3b82f6'},
        {id:'phase-3',name:'Fase 3: Data & Seguridad (Jul–Ago 2026)',color:'#10b981'},
        {id:'phase-4',name:'Fase 4: Portal (Ago–Sep 2026)',color:'#f59e0b'},
        {id:'phase-5',name:'Fase 5: Sandbox (Sep–Oct 2026)',color:'#8b5cf6'},
        {id:'phase-6',name:'Fase 6: Go-Live (Oct–Nov 2026)',color:'#ef4444'}
    ],
    tasks:[
        // ═══════════════════════════════════════════════════════════════
        // TABLERO GERENCIAL — Fase 1: Fundación & Contratación
        // ═══════════════════════════════════════════════════════════════
        // -- Regulatorio / Resolución 40559 --
        t('g1','Análisis requisitos Resolución 40559','gerencial','en_gestion','phase-1','normativo','normativo','alta','u-legal','2026-02-01','2026-03-20','Desglose artículo por artículo: plazos, entregables, obligaciones por actor (CPO, MSP, UPME, MinEnergía, SIC). Incluir análisis de sanciones e implicaciones de incumplimiento.'),
        t('g2','Guía Implementación Res. 40559 (borrador)','gerencial','en_gestion','phase-1','normativo','normativo','alta','admin','2026-02-01','2026-03-31','Documento técnico-regulatorio con requisitos OCPI 2.2.1, protocolos de seguridad (mTLS, OAuth2, API Keys), formatos de datos, procedimientos de registro y certificación. Plazo mandatorio ~Mayo 2026.'),
        t('g3','Borrador TdR regulatorios CPOs','gerencial','por_gestionar','phase-1','normativo','normativo','alta','u-legal','2026-03-01','2026-03-31','Definición de obligaciones OCPI para CPOs: contrato de adhesión, responsabilidades de reporte, penalidades por incumplimiento, proceso de apelación.'),
        t('g4','Definición SLAs regulatorios plataforma','gerencial','por_gestionar','phase-1','normativo','normativo','alta','u-legal','2026-03-15','2026-04-20','API Ingesta ≤100ms P99, Consulta ≤50ms P50, Disponibilidad 99.9%, Sandbox 99.0%. Definir métricas contractuales con CPOs.'),
        t('g5','Marco legal protección datos (Ley 1581/2012)','gerencial','por_gestionar','phase-1','normativo','normativo','alta','u-legal','2026-03-01','2026-04-15','Cumplimiento Ley 1581 protección datos personales. Política de privacidad para clientes consumidores. Acuerdos de uso de datos del Data Lake para áreas internas UPME.'),
        t('g6','Marco legal integración con Cárgame','gerencial','por_gestionar','phase-1','normativo','normativo','alta','u-legal','2026-03-10','2026-04-15','Responsabilidad cuando CPO habilitado/deshabilitado automáticamente. Procedimiento de apelación para CPOs dados de baja. Responsabilidad en caso de indisponibilidad de Cárgame.'),
        t('g7','Términos y condiciones por tipo de actor','gerencial','por_gestionar','phase-1','normativo','normativo','alta','u-legal','2026-03-15','2026-04-30','Definir T&C para cada actor: CPO (contrato adhesión), MSP (acceso red carga), MinEnergía (supervisión), consumidores (privacidad), áreas internas UPME (Data Lake).'),
        // -- Colaboración Externa --
        t('g0','Reunión alineación MinEnergía — arquitectura','gerencial','resuelto','phase-1','normativo','normativo','alta','admin','2026-02-15','2026-02-28','Reunión de alineación con el equipo del Ministerio de Minas y Energía para presentar enfoque arquitectónico de la plataforma de interoperabilidad y validar cronograma de implementación.'),
        t('g46','Reunión Oracle — DataLake y arquitectura electromovilidad','gerencial','resuelto','phase-1','integracion','normativo','alta','admin','2026-03-03','2026-03-03','Reunión con equipo Oracle para revisar propuesta de DataLake y arquitectura del proyecto de electromovilidad. Se discutieron opciones OCI (Object Storage, Autonomous DB, Data Flow), modelo de datos y estrategia de ingesta. Resultado: compromiso de reunión de seguimiento el 9 de marzo.'),
        t('g47','Reunión seguimiento Oracle — revisión arquitectura','gerencial','por_gestionar','phase-1','integracion','normativo','alta','admin','2026-03-09','2026-03-09','Reunión de seguimiento con Oracle derivada de la sesión del 3 de marzo. Revisión detallada de la arquitectura propuesta, validación de componentes OCI seleccionados, dimensionamiento DataLake, y alineación con mejores prácticas Oracle para el proyecto de electromovilidad.'),
        t('g48','Evaluación arquitectura propuesta con insumos Oracle','gerencial','por_gestionar','phase-1','integracion','tecnico','alta','admin','2026-03-03','2026-03-14','Evaluar la arquitectura propuesta del proyecto de electromovilidad con base en los insumos y recomendaciones proporcionados por Oracle. Documentar respaldo técnico, validación de componentes OCI, estimaciones de costos, y decisiones arquitectónicas soportadas por Oracle. Generar documento de respaldo con evidencia.'),
        t('g8','Reunión empresa española OCPI (Red Eléctrica)','gerencial','por_gestionar','phase-1','integracion','normativo','alta','u-pm','2026-03-10','2026-03-28','Workshop arquitectura con entidad española de referencia (REE/e-distribución/CNMC). Benchmarking implementación europea OCPI. Lecciones aprendidas Guía SGV España.'),
        t('g9','Identificar y contactar CPOs piloto','gerencial','por_gestionar','phase-1','integracion','tecnico','alta','u-pm','2026-03-10','2026-04-15','Evaluar CPOs candidatos: Enel X, Celsia, Terpel (grandes), + 1 CPO mediano. Total recomendado: 3-5 CPOs en programa piloto para validar arquitectura desde perspectiva integrador.'),
        t('g10','Acuerdo colaboración Seguridad IT UPME','gerencial','por_gestionar','phase-1','seguridad','normativo','alta','u-pm','2026-03-01','2026-03-20','Coordinar con Seguridad IT UPME: aprobación arquitectura seguridad, políticas WAF, validación VCN/NSGs, política cifrado TLS/mTLS/Vault, filtrado IP pública CPOs.'),
        // -- Contratación --
        t('g11','Estudios previos contratación (Ley 80/93)','gerencial','por_gestionar','phase-1','contratacion','normativo','alta','u-legal','2026-03-02','2026-03-20','Estudios previos según Ley 80/93. Justificación técnica y económica. Análisis de mercado para proveedores cloud e integración.'),
        t('g12','Definición modalidad contractual','gerencial','por_gestionar','phase-1','contratacion','normativo','alta','u-legal','2026-03-02','2026-03-15','Evaluar: Menor Cuantía, Concurso de Méritos, Contratación Directa. Consideraciones especiales por naturaleza tecnológica.'),
        t('g13','Análisis contratos 1 vs 3 años','gerencial','por_gestionar','phase-1','contratacion','normativo','alta','u-legal','2026-03-05','2026-03-20','3 años recomendado por continuidad operacional y amortización de inversión inicial. Incluir cláusulas de escalabilidad.'),
        t('g14','Pliegos Infraestructura Cloud (OCI)','gerencial','backlog','phase-1','contratacion','normativo','alta','u-legal','2026-03-15','2026-03-31','Sizing OKE 3+ nodos, Autonomous DB con Data Guard, Redis HA, OCI Streaming 10 topics. SLAs 99.9% uptime. DR cross-region (São Paulo).'),
        t('g15','Pliegos Data Lake + Analítica','gerencial','backlog','phase-1','contratacion','normativo','alta','u-legal','2026-03-15','2026-03-31','Object Storage medallion (Bronze→Silver→Gold), OCI Data Flow (Spark), Data Catalog, GoldenGate CDC. WORM para auditoría SIC.'),
        t('g16','Publicación SECOP II — Infra Cloud','gerencial','backlog','phase-1','contratacion','normativo','alta','u-legal','2026-04-01','2026-04-20','Proceso licitación 15-20 días hábiles en SECOP II para infraestructura cloud OCI.'),
        t('g17','Publicación SECOP II — Data Lake','gerencial','backlog','phase-1','contratacion','normativo','alta','u-legal','2026-04-01','2026-04-20','Publicación paralela con infra para optimizar tiempos de contratación.'),
        t('g18','Evaluación propuestas técnicas y económicas','gerencial','backlog','phase-1','contratacion','normativo','alta','u-legal','2026-04-20','2026-04-30','Criterios: experiencia técnica 30%, propuesta económica 40%, equipo de trabajo 20%, plan de trabajo 10%.'),
        t('g19','Negociación contractual + PI + NDA','gerencial','backlog','phase-1','contratacion','normativo','alta','u-legal','2026-05-01','2026-05-12','Propiedad intelectual, NDA, SLAs, penalidades, cláusulas de transición y portabilidad de datos.'),
        // ═══════════════════════════════════════════════════════════════
        // TABLERO GERENCIAL — Fase 2: Infra & Core OCPI
        // ═══════════════════════════════════════════════════════════════
        t('g20','Firma contrato Infraestructura Cloud','gerencial','backlog','phase-2','contratacion','normativo','alta','u-legal','2026-05-12','2026-05-22','Contrato a 3 años con OCI. Incluye OKE, Autonomous DB, Redis, Streaming, Vault, WAF, VPN, DR.'),
        t('g21','Firma contrato Data Lake + Analítica','gerencial','backlog','phase-2','contratacion','normativo','alta','u-legal','2026-05-12','2026-05-22','Firma paralela. Object Storage, Data Flow, Data Catalog, GoldenGate.'),
        t('g22','Revisión seguridad con equipo IT UPME (F2)','gerencial','backlog','phase-2','seguridad','normativo','alta','u-pm','2026-05-15','2026-06-05','Validación autenticación/autorización: KeyCloak config, mTLS, OAuth 2.1, DPoP, cert-bound tokens (RFC 8705).'),
        t('g23','Workshop OCPI con entidad española (F2)','gerencial','backlog','phase-2','integracion','normativo','media','u-pm','2026-05-20','2026-06-10','Revisión implementación OCPI vs estándar europeo. Validar módulos obligatorios: Locations, EVSEs, Tariffs, Sessions, CDRs, Tokens, Commands.'),
        t('g24','PoC integración OCPI con CPO piloto (1-2)','gerencial','backlog','phase-2','integracion','tecnico','alta','u-pm','2026-06-01','2026-06-30','1-2 CPOs piloto ejecutan PoC de integración OCPI básica. Validar flujos PUT /locations, PUT /sessions, POST /cdrs.'),
        // ═══════════════════════════════════════════════════════════════
        // TABLERO GERENCIAL — Fase 3: Data Lake & Seguridad
        // ═══════════════════════════════════════════════════════════════
        t('g25','Informe avance Ministerio — primer corte','gerencial','backlog','phase-3','normativo','normativo','alta','u-pm','2026-07-01','2026-07-15','Informe ejecutivo al MinEnergía con estado de avance: infraestructura desplegada, core OCPI funcional, plan de integración CPOs.'),
        t('g26','Revisión legal Guía Implementación (pre-pub)','gerencial','backlog','phase-3','normativo','normativo','alta','u-legal','2026-07-15','2026-08-15','Revisión legal completa de la Guía de Implementación antes de su publicación oficial (~Mayo 2026). Validación de T&C Sandbox y Producción.'),
        t('g27','Publicación oficial Guía Implementación','gerencial','backlog','phase-3','normativo','normativo','alta','u-pm','2026-08-01','2026-08-20','Publicación documento público con requisitos OCPI 2.2.1, protocolos seguridad, formatos, procedimientos registro. Hito mandatorio resolución.'),
        t('g28','Gobernanza datos — acuerdos áreas internas','gerencial','backlog','phase-3','datos','normativo','media','u-pm','2026-07-15','2026-08-15','Definir niveles de acceso al Data Lake por área interna UPME. RBAC por rol. Clasificación datos (público, interno, confidencial, PII).'),
        // ═══════════════════════════════════════════════════════════════
        // TABLERO GERENCIAL — Fase 4: Portal & Integración
        // ═══════════════════════════════════════════════════════════════
        t('g29','Validación portal + UX con CPOs piloto','gerencial','backlog','phase-4','integracion','tecnico','media','u-pm','2026-08-01','2026-08-20','Feedback de CPOs sobre portal de desarrolladores, documentación API, experiencia de onboarding. Mínimo 3 CPOs participan.'),
        t('g30','Definición proceso certificación CPOs','gerencial','backlog','phase-4','normativo','normativo','alta','u-legal','2026-08-15','2026-09-15','Proceso formal: 47 pruebas OCPI 2.2.1 en Sandbox, certificación digital, promoción a producción. Suite de compliance co-creada con CPOs.'),
        t('g31','Acuerdo SLA contractual con CPOs','gerencial','backlog','phase-4','normativo','normativo','alta','u-legal','2026-08-01','2026-08-30','SLA contractual por CPO tier: Pequeño (500 req/min), Mediano (1000), Grande (2500), Enterprise (5000). Burst allowance. Penalidades.'),
        // ═══════════════════════════════════════════════════════════════
        // TABLERO GERENCIAL — Fase 5: Sandbox & Pre-Prod
        // ═══════════════════════════════════════════════════════════════
        t('g32','Revisión seguridad Sandbox público (Sec IT)','gerencial','backlog','phase-5','seguridad','normativo','alta','u-pm','2026-09-15','2026-10-10','Seguridad IT UPME revisa y aprueba Sandbox público. Penetration testing del ambiente expuesto a CPOs.'),
        t('g33','Workshop certificación con entidad española','gerencial','backlog','phase-5','integracion','normativo','media','u-pm','2026-09-01','2026-09-20','Entidad española revisa proceso de certificación Sandbox. Recomendaciones sobre gobernanza datos del sector eléctrico.'),
        t('g34','Beta testing Sandbox con 3-5 CPOs','gerencial','backlog','phase-5','integracion','tecnico','alta','u-pm','2026-09-01','2026-09-30','CPOs piloto ejecutan beta testing completo en Sandbox. Certificación piloto. Reporte de fricciones y dificultades de integración.'),
        t('g35','Demostración plataforma al Ministerio','gerencial','backlog','phase-5','normativo','normativo','alta','u-pm','2026-09-15','2026-09-30','Demostración funcional completa al MinEnergía: portal público, Sandbox, proceso certificación, dashboards operacionales.'),
        t('g36','Informe segundo corte al Ministerio','gerencial','backlog','phase-5','normativo','normativo','alta','u-pm','2026-09-15','2026-09-30','Informe ejecutivo: métricas de avance, CPOs en Sandbox, resultados pruebas, plan Go-Live.'),
        t('g37','Canal quejas/reclamos consumidor (SIC)','gerencial','backlog','phase-5','normativo','normativo','media','u-legal','2026-09-01','2026-09-30','Implementar canal de quejas/reclamos del consumidor integrado con la plataforma. Requerimiento supervisión SIC.'),
        // ═══════════════════════════════════════════════════════════════
        // TABLERO GERENCIAL — Fase 6: Go-Live & Operación
        // ═══════════════════════════════════════════════════════════════
        t('g38','Pentesting final + aprobación Seg IT','gerencial','backlog','phase-6','seguridad','normativo','alta','u-pm','2026-10-01','2026-10-10','Penetration testing final por Seguridad IT UPME. SAST/DAST completo. Aprobación formal para Go-Live.'),
        t('g39','Validación final entidad española pre-Go-Live','gerencial','backlog','phase-6','integracion','normativo','media','u-pm','2026-10-01','2026-10-12','Entidad española valida plataforma completa antes de Go-Live. Recomendaciones finales.'),
        t('g40','Certificación regulatoria final','gerencial','backlog','phase-6','normativo','normativo','alta','u-legal','2026-10-01','2026-10-15','Informe final de cumplimiento regulatorio Resolución 40559. Documentación para MinEnergía y SIC.'),
        t('g41','Certificación piloto CPOs pre Go-Live','gerencial','backlog','phase-6','integracion','tecnico','alta','u-pm','2026-10-05','2026-10-15','3-5 CPOs piloto completan certificación formal en producción. Validación end-to-end del flujo completo.'),
        t('g42','Ceremonia Go-Live + comunicación pública','gerencial','backlog','phase-6','normativo','normativo','alta','u-pm','2026-10-15','2026-10-20','Evento Go-Live con MinEnergía, UPME, CPOs. Comunicado público. Activación ambiente producción.'),
        t('g43','Plan operación y soporte post Go-Live','gerencial','backlog','phase-6','normativo','normativo','alta','u-pm','2026-10-20','2026-11-15','Plan de operación 24/7, escalamiento, monitoreo, soporte N1/N2/N3. War room primeras 48h.'),
        t('g44','Reportes exportables formato SIC','gerencial','backlog','phase-6','normativo','normativo','alta','u-legal','2026-10-20','2026-11-10','Reportes inmutables exportables en formato estándar SIC. Logs WORM Object Storage para auditoría.'),
        t('g45','Plan onboarding masivo CPOs (May 2027)','gerencial','backlog','phase-6','integracion','normativo','alta','u-pm','2026-11-01','2026-11-30','Plan para integración de todos los CPOs regulados antes de Mayo 2027 (operación plena). Cronograma escalonado de certificación.'),
        // ═══ DESARROLLO — Fase 1: Fundación (arq. monolítica sincrónica) ═══
        t('d1','Estrategia datos y gobernanza','desarrollo','done','phase-1','datos','tecnico','alta','admin','2026-02-03','2026-02-28','Clasificación datos (público, interno, confidencial, PII), RBAC. Object Storage con prefijos (raw/, processed/, audit/).'),
        t('d2','Evaluación Infra OCI','desarrollo','done','phase-1','infraestructura','tecnico','alta','admin','2026-02-03','2026-02-28','Container Instances vs Compute VM vs OKE 1 nodo. Autonomous DB. Costos para ~10 usuarios internos + ~10-50 CPOs.'),
        t('d3','Arquitectura C4 + DDD (borrador)','desarrollo','done','phase-1','arquitectura','tecnico','alta','admin','2026-02-10','2026-02-28','C4 L1-L4. Monolito modular Python (FastAPI): módulos CPO, OCPI, Auth, Public, Audit, Cárgame. Sin microservicios.'),
        // ── SPRINT DE APRENDIZAJE (Semanas 1-3 Marzo) ──
        t('d59','Workshop Python FastAPI + Pydantic v2','desarrollo','todo','phase-1','devops','tecnico','alta','admin','2026-03-03','2026-03-07','Capacitación equipo backend (4 personas): FastAPI fundamentals, Pydantic v2 schemas, async vs sync, dependency injection, middleware, error handling. Hands-on: crear API CRUD básica con validación. Resultado: cada dev tiene API local funcional.'),
        t('d60','Workshop React 18 + TypeScript + Vite + TailwindCSS','desarrollo','todo','phase-1','devops','tecnico','alta','u-front','2026-03-03','2026-03-07','Capacitación equipo frontend (2 personas): React 18 hooks, TypeScript strict mode, Vite config, TailwindCSS utility-first, shadcn/ui components, Leaflet maps. Hands-on: portal básico con mapa Colombia.'),
        t('d61','Workshop Docker + Docker Compose + containerización','desarrollo','todo','phase-1','devops','tecnico','alta','u-devops','2026-03-10','2026-03-12','Todo el equipo (8 personas): Dockerfile multi-stage, Docker Compose, volúmenes, networking, .dockerignore, non-root user, health checks. Hands-on: containerizar FastAPI + PostgreSQL + KeyCloak local.'),
        t('d62','Workshop OCI Fundamentals (VCN, Container Instances, DB, Storage, Vault)','desarrollo','todo','phase-1','devops','tecnico','alta','u-devops','2026-03-10','2026-03-14','Todo el equipo: OCI Console, VCN + subnets + NSGs, Container Instances, Autonomous DB, Object Storage (WORM), Vault HSM, WAF, VPN. Hands-on: desplegar Container Instance con app demo.'),
        t('d63','Workshop Terraform IaC + módulos OCI','desarrollo','todo','phase-1','devops','tecnico','alta','u-devops','2026-03-17','2026-03-19','DevOps + Arquitecto (3 personas): Terraform fundamentals, state management (OCI Object Storage backend), módulos reutilizables, variables, outputs, terraform plan/apply. Hands-on: IaC para VCN + Container Instance.'),
        t('d64','Workshop KeyCloak + OAuth 2.0 + RBAC','desarrollo','todo','phase-1','devops','tecnico','alta','u-sec','2026-03-17','2026-03-19','Seguridad + Backend (4 personas): KeyCloak admin console, realms, clients, roles, scopes, OAuth 2.0 flows (client_credentials, authorization_code + PKCE), JWT validation, mTLS básico. Hands-on: proteger API FastAPI con KeyCloak.'),
        t('d65','Workshop Git Flow + Code Review + PR practices','desarrollo','todo','phase-1','devops','tecnico','alta','u-dev','2026-03-03','2026-03-05','Todo el equipo: Git branching (main, develop, feature/*, hotfix/*), conventional commits, PR templates, code review checklist, CODEOWNERS, branch protection rules, squash merge. Hands-on: simular flujo completo feature→PR→review→merge.'),
        t('d66','Workshop Seguridad: OWASP Top 10 + mTLS + secrets management','desarrollo','todo','phase-1','devops','tecnico','alta','u-sec','2026-03-24','2026-03-26','Todo el equipo: OWASP Top 10 2021 aplicado a APIs, mTLS conceptos + certificados X.509, secrets management (nunca hardcoded), detect-secrets, Trivy container scanning, dependency scanning. Hands-on: detectar vulnerabilidades en app demo.'),
        // ── AMBIENTE LOCAL + TOOLING DESARROLLADOR ──
        t('d67','Docker Compose ambiente local completo','desarrollo','todo','phase-1','devops','tecnico','alta','u-devops-jr','2026-03-10','2026-03-25','docker-compose.yml: FastAPI (hot-reload) + PostgreSQL 16 (mock Autonomous DB) + KeyCloak 24 + mock-cargame (WireMock) + Adminer (DB UI). .env.example, volúmenes persistentes, health checks. README onboarding <15 min primer día.'),
        t('d68','Makefile + scripts automatización dev','desarrollo','todo','phase-1','devops','tecnico','media','u-devops-jr','2026-03-14','2026-03-28','Makefile con targets: make setup (instalar deps), make dev (levantar Docker Compose), make test (pytest), make lint (ruff+eslint), make format (ruff format+prettier), make migrate (Alembic), make build (Docker), make clean. Documentado en README.'),
        t('d69','Pre-commit hooks (ruff, eslint, detect-secrets, commitlint)','desarrollo','todo','phase-1','devops','tecnico','media','u-devops-jr','2026-03-14','2026-03-21','Configurar pre-commit framework: ruff (lint+format Python), eslint+prettier (TypeScript), detect-secrets (prevenir API keys en código), commitlint (conventional commits), trailing whitespace. .pre-commit-config.yaml en repo.'),
        t('d70','Git branching strategy + branch protection + PR templates','desarrollo','todo','phase-1','devops','tecnico','media','u-devops-jr','2026-03-07','2026-03-14','Configurar en repo: branch protection rules (main: require PR + 1 approval + CI pass, develop: require CI pass), PR template con checklist (tests, docs, security), CODEOWNERS por módulo, issue templates (bug, feature, security).'),
        // ── ARQUITECTURA (continúa) ──
        t('d4','Arquitectura C4 final','desarrollo','todo','phase-1','arquitectura','tecnico','alta','admin','2026-03-02','2026-03-25','Diagrama deployment OCI: Container Instance + Autonomous DB + Object Storage + KeyCloak. Flujo síncrono completo.'),
        t('d5','Modelado DDD — módulos del monolito','desarrollo','todo','phase-1','arquitectura','tecnico','alta','admin','2026-03-10','2026-03-31','Entidades: CPO, Location, EVSE, Tariff, Session, CDR. VOs: NIT, GeoCoordinate, Energy, Money. CRUD síncrono, sin event sourcing.'),
        t('d6','Threat Modeling STRIDE','desarrollo','todo','phase-1','seguridad','tecnico','alta','u-sec','2026-03-10','2026-03-31','STRIDE por módulo y endpoint. Spoofing CPO, tampering datos OCPI, DoS básico, elevation of privilege.'),
        t('d7','ADRs — Decisiones de Arquitectura','desarrollo','todo','phase-1','arquitectura','tecnico','alta','admin','2026-03-15','2026-03-31','ADRs: monolito FastAPI (no microservicios), CRUD (no CQRS), síncrono (no Kafka), KeyCloak, OCI Container Instances, Autonomous DB, Object Storage WORM, mTLS CPOs.'),
        t('d8','Sizing y networking OCI','desarrollo','todo','phase-1','infraestructura','tecnico','alta','u-devops','2026-03-02','2026-03-25','VCN con 2 subnets (public, private). NSGs. Container Instance 2 OCPUs + 8GB RAM. Autonomous DB 1 OCPU.'),
        t('d9','Estrategia DevOps','desarrollo','todo','phase-1','devops','tecnico','alta','u-devops','2026-03-02','2026-03-20','OCI DevOps pipelines. Deploy directo (sin ArgoCD/GitOps). Branching: main + develop. OCIR para imágenes Docker.'),
        t('d10','Coding standards + quality gates','desarrollo','backlog','phase-1','documentacion','tecnico','media','u-dev','2026-03-10','2026-03-31','Coverage ≥80%, SonarQube en CI, linting Python (ruff) + TypeScript (eslint). Tests unitarios pytest.'),
        t('d11','Diagramas secuencia flujos principales','desarrollo','backlog','phase-1','arquitectura','tecnico','alta','admin','2026-04-01','2026-04-22','CPO reporta Location (síncrono), Onboarding CPO, Consulta pública estaciones, Sync Cárgame (cron job).'),
        t('d12','API Contracts OpenAPI 3.0','desarrollo','backlog','phase-1','arquitectura','tecnico','alta','admin','2026-04-15','2026-04-30','PUT /ocpi/2.2.1/locations, GET /public/v1/stations, POST /api/v1/cpos/register, GET /admin/audit. FastAPI auto-genera OpenAPI.'),
        t('d13','Modelo datos Autonomous DB','desarrollo','backlog','phase-1','datos','tecnico','alta','u-data','2026-04-01','2026-04-20','Schema único: CPOs, Locations, EVSEs, Connectors, Tariffs, Sessions, CDRs, Credentials, AuditLog, Users. Sin TimescaleDB.'),
        t('d14','KeyCloak configuración','desarrollo','backlog','phase-1','seguridad','tecnico','alta','u-sec','2026-04-01','2026-04-25','2 realms: upme-internal (login admin), upme-cpo (client_credentials CPOs). OAuth 2.0 estándar. Sin DPoP — no necesario para 10 usuarios.'),
        t('d15','OCI Vault + secrets','desarrollo','backlog','phase-1','seguridad','tecnico','alta','u-sec','2026-04-05','2026-04-25','OCI Vault para API keys CPOs, certificados TLS, secrets aplicación. Rotación manual 90d.'),
        t('d16','Ambiente Dev/QA (Container Instance)','desarrollo','backlog','phase-1','infraestructura','tecnico','alta','u-devops','2026-04-01','2026-04-22','OCI Container Instance: 1 backend (FastAPI) + 1 KeyCloak. Autonomous DB compartida (schema dev). OCIR.'),
        t('d17','CI/CD pipeline OCI DevOps','desarrollo','backlog','phase-1','devops','tecnico','alta','u-devops','2026-04-05','2026-04-28','Build pipeline: lint → test → SonarQube → Docker build → push OCIR → deploy Container Instance. Sin ArgoCD.'),
        // ── PIPELINE DevSecOps (Abril — progresivo) ──
        t('d71','Base Docker image hardened + multi-stage build + OCIR','desarrollo','backlog','phase-1','devops','tecnico','alta','u-devops','2026-03-25','2026-04-10','Imagen base Python 3.12-slim hardened: non-root user, read-only rootfs, no shell, HEALTHCHECK. Multi-stage build (builder→runner). Push a OCIR. Trivy scan policy: bloquear CRITICAL. Imagen base React: nginx-alpine + CSP headers.'),
        t('d72','SonarQube setup + quality gates definidos','desarrollo','backlog','phase-1','devops','tecnico','alta','u-devops','2026-04-01','2026-04-15','SonarQube Community en Container Instance (ambiente interno). Quality gates: coverage ≥80%, 0 bugs critical/blocker, 0 vulnerabilities critical, 0 security hotspots, duplicación <3%. Integrar con OCI DevOps pipeline. Dashboard por módulo.'),
        t('d73','CI Pipeline completo: lint → test → SAST → build → scan → push','desarrollo','backlog','phase-1','devops','tecnico','alta','u-devops','2026-04-05','2026-04-25','OCI DevOps Build Pipeline 6 stages: (1) ruff lint + eslint, (2) pytest --cov ≥80% + vitest, (3) SonarQube SAST analysis, (4) Docker build multi-stage, (5) Trivy container scan (fail on CRITICAL), (6) push OCIR con tag semver. Notificación Slack/email en fallo.'),
        t('d74','CD Pipeline: auto-deploy Dev, approval manual Sandbox/Prod','desarrollo','backlog','phase-1','devops','tecnico','alta','u-devops','2026-04-15','2026-04-28','OCI DevOps Deployment Pipeline: develop branch → auto-deploy Dev/QA (Container Instance). main branch → manual approval → deploy Sandbox. Release tag → manual approval (2 approvers) → deploy Prod. Rollback = redeploy imagen anterior. Slack notifications.'),
        t('d75','Database migrations con Alembic + seed data + rollback','desarrollo','backlog','phase-1','datos','tecnico','alta','u-data','2026-04-01','2026-04-18','Alembic para migraciones Autonomous DB: auto-generate desde SQLAlchemy models, revision history, upgrade/downgrade. Seed data para Dev/QA (CPOs ficticios, estaciones Colombia). Script rollback. Integrar en CI (alembic upgrade head antes de tests). make migrate target.'),
        t('d76','Dependency scanning automatizado (pip-audit, npm audit, safety)','desarrollo','backlog','phase-1','seguridad','tecnico','media','u-sec','2026-04-10','2026-04-22','Agregar al CI pipeline: pip-audit (Python CVEs), npm audit (JS CVEs), safety check (Python packages). Fail build si hay vulnerabilidades CRITICAL/HIGH. Reporte semanal de dependencias desactualizadas. Dependabot o Renovate para PRs automáticos de actualización.'),
        // ═══ DESARROLLO — Fase 2: Infra & Core OCPI (sincrónico) ═══
        t('d18','mTLS certificados CPOs','desarrollo','backlog','phase-2','seguridad','tecnico','alta','u-sec','2026-05-01','2026-05-18','X.509 TLS para CPOs que lo requieran. OCI Certificates. Rotación manual.'),
        t('d19','OCI WAF + Rate Limiting básico','desarrollo','backlog','phase-2','seguridad','tecnico','alta','u-sec','2026-05-10','2026-05-28','OCI WAF OWASP Top 10. Rate limit global básico por IP/CPO. Sin tiers complejos — todos CPOs mismo límite inicial.'),
        t('d20','VPN IPSec — Cárgame','desarrollo','backlog','phase-2','infraestructura','tecnico','alta','u-devops','2026-05-05','2026-05-25','Un túnel IPSec hacia Cárgame. Timeout 10s con retry síncrono (máx 2 reintentos). Sin circuit breaker complejo.'),
        t('d21','Container Instance producción','desarrollo','backlog','phase-2','infraestructura','tecnico','alta','u-devops','2026-05-15','2026-05-31','OCI Container Instance producción: backend (FastAPI) + KeyCloak. Sin OKE ni Kubernetes. 2 OCPUs, 8GB RAM.'),
        t('d22','IaC Terraform','desarrollo','backlog','phase-2','devops','tecnico','alta','u-devops','2026-05-01','2026-05-28','Módulos Terraform: VCN, Container Instance, Autonomous DB, Object Storage, Vault, WAF, VPN. 2 ambientes: Dev/QA y Prod.'),
        t('d23','Módulo CPO — registro y lifecycle','desarrollo','backlog','phase-2','desarrollo','tecnico','alta','u-dev','2026-05-20','2026-06-10','FastAPI module. CRUD CPOs: register, validate, issueCredentials, certify, suspend. Estados en BD. Sin eventos Kafka — transacciones síncronas.'),
        t('d24','Módulo OCPI — ingesta síncrona','desarrollo','backlog','phase-2','desarrollo','tecnico','alta','u-dev','2026-05-20','2026-06-05','FastAPI endpoints: PUT /ocpi/2.2.1/locations, /sessions, /cdrs, /tariffs. Pydantic validation + DB write síncrono. Sin Kafka, sin Redis.'),
        t('d25','Módulo OCPI — validación Pydantic','desarrollo','backlog','phase-2','desarrollo','tecnico','alta','u-dev','2026-06-01','2026-06-15','Pydantic v2 schemas OCPI 2.2.1 completos. Business rules: geo Colombia, rango precios, campos obligatorios. Validación síncrona en mismo endpoint.'),
        t('d26','Compliance Suite (47 pruebas OCPI)','desarrollo','backlog','phase-2','desarrollo','tecnico','alta','u-dev3','2026-06-01','2026-06-20','Suite pytest automatizada: 47 pruebas OCPI 2.2.1 para certificación CPOs. Ejecutable desde admin panel.'),
        // ── DevSecOps FASE 2: Testing avanzado + Secrets ──
        t('d77','API integration tests automatizados (pytest + httpx)','desarrollo','backlog','phase-2','devops','tecnico','alta','u-dev3','2026-05-10','2026-05-28','Framework pytest + httpx para integration tests contra FastAPI: fixtures con DB transaccional (rollback automático), factory_boy para datos de prueba, test containers (PostgreSQL + KeyCloak). Tests por módulo: CPO lifecycle, OCPI ingesta, auth flows. Ejecutar en CI post-unit tests. Coverage integration ≥60%.'),
        t('d78','Performance baseline tests (Locust)','desarrollo','backlog','phase-2','devops','tecnico','media','u-qa','2026-05-20','2026-06-10','Locust framework para load testing: baseline 50 usuarios concurrentes, 200 req/s ingesta OCPI, 500 req/s consulta pública. Medir P50/P95/P99 latencia. Establecer SLOs baseline. Ejecutar en ambiente Dev post-deploy. Reportes automatizados. Detectar regresiones de performance en CI (optional stage).'),
        t('d79','Secrets rotation automation (OCI Vault + scripts)','desarrollo','backlog','phase-2','seguridad','tecnico','alta','u-sec','2026-05-15','2026-05-28','Scripts automatizados rotación secrets: API keys CPOs (90d), certificados TLS (365d), DB passwords (90d), KeyCloak secrets (90d). OCI Vault + APScheduler cron job. Notificación email 14d antes de expiración. Log de rotación en audit trail. Runbook rotación manual de emergencia.'),
        // ═══ DESARROLLO — Fase 3: Datos & Seguridad (simplificado) ═══
        t('d27','Object Storage — audit logs WORM','desarrollo','backlog','phase-3','datos','tecnico','alta','u-data','2026-07-01','2026-07-15','Bucket con WORM policy para audit logs SIC. Prefijos: raw/ (datos crudos), audit/ (logs inmutables). Sin medallion, sin Spark.'),
        t('d28','SQL scripts transformación datos','desarrollo','backlog','phase-3','datos','tecnico','media','u-data','2026-07-10','2026-07-25','Scripts SQL + Python para reportes agregados. APScheduler ejecuta diariamente. Sin Data Flow, sin GoldenGate, sin Data Catalog.'),
        t('d29','Validación calidad datos (cron)','desarrollo','backlog','phase-3','datos','tecnico','media','u-data','2026-07-15','2026-07-30','Job diario: detecta estaciones fantasma, precios inconsistentes, datos faltantes. Alerta email. Sin streaming — consulta BD directamente.'),
        t('d30','OCI Monitoring + Logging','desarrollo','backlog','phase-3','devops','tecnico','alta','u-devops','2026-07-05','2026-07-20','Monitoreo nativo OCI: métricas container, logs aplicación, alertas email. Sin Prometheus, sin Grafana, sin Jaeger, sin OpenTelemetry.'),
        t('d31','Módulo Auditoría — audit trail','desarrollo','backlog','phase-3','desarrollo','tecnico','alta','u-dev2','2026-07-15','2026-08-05','FastAPI module: tabla AuditLog en BD, GET /admin/audit con filtros. Export WORM a Object Storage (cron diario). Sin Kafka.'),
        t('d32','Detección anomalías (cron job)','desarrollo','backlog','phase-3','desarrollo','tecnico','media','u-dev2','2026-07-20','2026-08-10','Script Python diario: reglas simples — precio negativo, energía > cap, estación inactiva >7d. Alerta email admin. Sin ML, sin streaming.'),
        t('d33','Hardening containers','desarrollo','backlog','phase-3','seguridad','tecnico','alta','u-sec','2026-07-01','2026-07-18','Docker non-root, read-only rootfs, Trivy scanning en CI. Sin Pod Security (no hay K8s), sin Falco, sin Service Mesh.'),
        t('d34','Módulo OCPI completo prod-ready','desarrollo','backlog','phase-3','desarrollo','tecnico','alta','u-dev','2026-07-01','2026-07-25','FastAPI: todos endpoints OCPI (Locations, Sessions, CDRs, Tariffs, Tokens, Commands). Pydantic validation. DB write síncrono. Tests pytest ≥80%.'),
        t('d35','Módulo Cárgame — sync job','desarrollo','backlog','phase-3','desarrollo','tecnico','alta','u-dev3','2026-07-10','2026-07-30','APScheduler job cada 24h: consulta API Cárgame via VPN, valida estado CPOs, actualiza BD. Retry síncrono si falla. Log resultado.'),
        // ── DevSecOps FASE 3: Observabilidad + Structured Logging ──
        t('d80','Health checks + structured logging + correlation IDs','desarrollo','backlog','phase-3','devops','tecnico','alta','u-dev2','2026-07-01','2026-07-12','FastAPI: /health (liveness), /ready (readiness: DB + KeyCloak + Object Storage). Structured logging JSON (structlog): timestamp, level, correlation_id (X-Request-ID), user_id, cpo_id, module, message. Correlation ID propagado en toda la cadena. Log levels: ERROR→email, WARN→dashboard, INFO→OCI Logging.'),
        t('d81','Alerting rules OCI Monitoring + incident response playbooks','desarrollo','backlog','phase-3','devops','tecnico','alta','u-devops','2026-07-10','2026-07-25','Reglas de alerta OCI: container restart >2/h, error rate >5%, latencia P99 >500ms, DB connections >80%, disk >85%, VPN down, cert expiry <30d. Playbooks por alerta: quién responde, pasos diagnóstico, escalamiento, comunicación. Integrar con OCI Notifications → email + Slack.'),
        // ═══ DESARROLLO — Fase 4: Portal & Integración (simplificado) ═══
        t('d36','API consulta pública estaciones','desarrollo','backlog','phase-4','desarrollo','tecnico','alta','u-dev3','2026-08-01','2026-08-22','FastAPI: GET /public/v1/stations, /stations/{id}. Consulta directa BD. Sin Redis cache — el usuario puede esperar. Open Data.'),
        t('d37','Portal Público — mapa estaciones','desarrollo','backlog','phase-4','desarrollo','tecnico','alta','u-front','2026-08-10','2026-08-31','React 18+TS, Vite, Tailwind, shadcn/ui, Leaflet. Mapa estaciones Colombia. Precios, disponibilidad, ubicación. Mandato 90 días resolución.'),
        t('d38','Portal Público — gráficas KPIs','desarrollo','backlog','phase-4','desarrollo','tecnico','media','u-front','2026-08-01','2026-08-15','Chart.js/Recharts. KPIs: estaciones activas, sesiones/día, energía entregada, disponibilidad promedio.'),
        t('d39','Portal Admin — gestión CPOs y dashboard','desarrollo','backlog','phase-4','desarrollo','tecnico','alta','u-front','2026-08-01','2026-08-20','React admin panel. CRUD CPOs, lifecycle, credential management. Dashboard KPIs. Vista anomalías.'),
        t('d40','Developer Portal + Swagger UI','desarrollo','backlog','phase-4','desarrollo','tecnico','alta','u-front','2026-08-05','2026-08-25','Página auto-registro CPOs. Swagger UI auto-generado por FastAPI. Credenciales Sandbox. Documentación OCPI.'),
        t('d41','Sandbox environment','desarrollo','backlog','phase-4','infraestructura','tecnico','alta','u-devops','2026-08-05','2026-08-20','Container Instance separado con datos sintéticos Colombia. Mock Cárgame. Sin OKE — misma infra que prod pero aislado.'),
        t('d42','Notificaciones email (OCI Email)','desarrollo','backlog','phase-4','desarrollo','tecnico','media','u-dev2','2026-08-15','2026-08-30','OCI Email Delivery para: onboarding CPO, suspensión, anomalías detectadas, alertas admin. Templates Jinja2. Sin Kafka, sin WebSocket.'),
        t('d43','PoC integración E2E CPO piloto','desarrollo','backlog','phase-4','integracion','tecnico','alta','admin','2026-08-15','2026-08-31','Flujo completo síncrono: registro→Cárgame sync→credenciales→Sandbox→compliance→producción. Con CPO real.'),
        // ═══ DESARROLLO — Fase 5: Sandbox & Pre-Prod (simplificado) ═══
        t('d44','Pentesting manual pre Go-Live','desarrollo','backlog','phase-5','seguridad','tecnico','alta','u-qa','2026-09-01','2026-09-20','SonarQube SAST en CI + pentesting manual por Seguridad IT UPME. Sin OWASP ZAP automatizado — manual suficiente para esta escala.'),
        t('d45','Remediación vulnerabilidades','desarrollo','backlog','phase-5','seguridad','tecnico','alta','u-dev2','2026-09-15','2026-09-30','Fix vulnerabilidades CRITICAL/HIGH encontradas en pentesting. Rescan verificación.'),
        t('d46','Backups + plan recuperación','desarrollo','backlog','phase-5','infraestructura','tecnico','alta','u-devops','2026-09-01','2026-09-15','Autonomous DB backups automáticos (ya incluido). Object Storage backup cross-region. Plan restore manual documentado. Sin Full Stack DR.'),
        t('d47','Alertas OCI + notificación email','desarrollo','backlog','phase-5','devops','tecnico','alta','u-devops','2026-09-01','2026-09-15','OCI Monitoring alertas: container down, DB errors, VPN disconnect. Notificación email admin. Sin PagerDuty, sin Grafana.'),
        t('d48','Tests E2E aplicación completa','desarrollo','backlog','phase-5','desarrollo','tecnico','alta','u-qa','2026-09-01','2026-09-20','Test E2E síncrono: ingesta OCPI→validación→BD→consulta pública→admin panel→Cárgame sync. pytest + Playwright.'),
        t('d49','Onboarding 3-5 CPOs Sandbox','desarrollo','backlog','phase-5','integracion','tecnico','alta','admin','2026-09-10','2026-09-30','CPOs piloto onboarding completo en Sandbox. Compliance suite 47 pruebas. Certificación.'),
        t('d50','Suite compliance tests automatizados','desarrollo','backlog','phase-5','desarrollo','tecnico','alta','u-qa','2026-09-05','2026-09-25','47 pruebas OCPI 2.2.1 automatizadas (pytest). Ejecutable desde admin panel. Reporte por CPO.'),
        t('d51','Pruebas funcionales completas','desarrollo','backlog','phase-5','delivery','tecnico','alta','u-qa','2026-09-05','2026-09-22','Pruebas con datos de 10-50 CPOs y ~miles estaciones. Sin pruebas de carga extrema (no hay 5000 estaciones simultáneas). Sin chaos engineering.'),
        // ── DevSecOps FASE 5: Hardening Pre-Go-Live ──
        t('d82','DR drill + backup restore test + failover validation','desarrollo','backlog','phase-5','infraestructura','tecnico','alta','u-devops','2026-09-15','2026-09-25','Simulacro completo DR: (1) backup Autonomous DB → restore en nueva instancia, verificar integridad datos, (2) Object Storage cross-region replication check, (3) Container Instance failover: destruir instancia → recrear desde OCIR → verificar <30 min. Documentar tiempos reales RPO/RTO. Comparar vs SLAs comprometidos.'),
        t('d83','Security compliance checklist + pre-Go-Live audit','desarrollo','backlog','phase-5','seguridad','tecnico','alta','u-sec','2026-09-10','2026-09-22','Checklist seguridad pre-producción: ✓ TLS 1.3 everywhere, ✓ mTLS CPOs activo, ✓ WAF OWASP rules, ✓ secrets en Vault (0 hardcoded), ✓ Trivy scan 0 CRITICAL, ✓ SonarQube quality gate passed, ✓ dependency scan clean, ✓ RBAC KeyCloak verificado, ✓ audit trail funcional, ✓ WORM Object Storage activo, ✓ rate limiting activo, ✓ NSGs restrictivos. Informe firmado por Seguridad IT UPME.'),
        // ═══ DESARROLLO — Fase 6: Go-Live & Operación (simplificado) ═══
        t('d52','PROD provisioning','desarrollo','backlog','phase-6','infraestructura','tecnico','alta','u-devops','2026-10-01','2026-10-12','Terraform apply prod: Container Instance, Autonomous DB, Object Storage, Vault, WAF, VPN. Sin OKE, sin Redis, sin Streaming.'),
        t('d53','Go-Live deploy','desarrollo','backlog','phase-6','delivery','tecnico','alta','u-devops','2026-10-15','2026-10-20','Deploy producción: nueva imagen Docker → Container Instance. DNS. SSL certs. WAF activado. Deploy directo (sin Blue/Green).'),
        t('d54','Verificación post-deploy','desarrollo','backlog','phase-6','delivery','tecnico','alta','u-devops','2026-10-20','2026-10-25','Verificación manual: endpoints, health checks, Cárgame VPN, BD queries, Object Storage writes. Rollback = redeploy imagen anterior.'),
        t('d55','Smoke tests producción','desarrollo','backlog','phase-6','delivery','tecnico','alta','u-qa','2026-10-20','2026-10-22','Smoke tests todos endpoints prod. Health checks. Cárgame connectivity. DB read/write.'),
        t('d56','Estabilización y bug fixes','desarrollo','backlog','phase-6','delivery','tecnico','alta','u-dev','2026-10-25','2026-11-30','Bug fixes, query optimization, ajustes UX portal público y admin basados en feedback usuarios.'),
        t('d57','Runbook operacional','desarrollo','backlog','phase-6','documentacion','tecnico','alta','u-devops','2026-10-25','2026-11-15','Procedimientos: restart container, rollback, restore BD, renovar certs, rotar API keys, suspender CPO manual.'),
        t('d58','Documentación API final','desarrollo','backlog','phase-6','documentacion','tecnico','media','admin','2026-10-20','2026-11-10','API docs auto-generadas por FastAPI en /docs (Swagger UI). Ejemplos por módulo OCPI. Publicadas en developer.upme.gov.co.')
    ],
    commitments:[
        {id:'c1',title:'Guía Implementación técnica (Res. 40559)',owner:'Rafael A. Dominguez',date:'2026-03-31',type:'regulatorio',status:'pendiente',obs:'Borrador para revisión legal. Plazo mandatorio.'},
        {id:'c2',title:'Información pública disponible (mandato 90d)',owner:'Equipo IT',date:'2026-04-30',type:'regulatorio',status:'pendiente',obs:'Precios, disponibilidad, ubicación estaciones.'},
        {id:'c3',title:'Publicación pliegos SECOP II',owner:'Equipo Jurídico',date:'2026-04-15',type:'regulatorio',status:'pendiente',obs:'Infra + Data Lake paralelo.'},
        {id:'c4',title:'Firma contratos Infra + Data Lake',owner:'Director UPME',date:'2026-05-22',type:'regulatorio',status:'pendiente',obs:'3 años. OCI completo.'},
        {id:'c5',title:'Publicación oficial Guía Implementación',owner:'PM + Legal',date:'2026-08-20',type:'regulatorio',status:'pendiente',obs:'Hito mandatorio resolución.'},
        {id:'c6',title:'Informe avance MinEnergía (1er corte)',owner:'Project Manager',date:'2026-07-15',type:'regulatorio',status:'pendiente',obs:'Infra + core OCPI funcional.'},
        {id:'c7',title:'Sandbox + Developer Portal operativo',owner:'Equipo IT',date:'2026-08-25',type:'entregable',status:'pendiente',obs:'CPOs pueden iniciar pruebas.'},
        {id:'c8',title:'Portal público operativo (mapa)',owner:'Equipo IT',date:'2026-09-15',type:'regulatorio',status:'pendiente',obs:'Mandato resolución.'},
        {id:'c9',title:'Demo plataforma al Ministerio',owner:'PM + Arquitecto',date:'2026-09-30',type:'regulatorio',status:'pendiente',obs:'Demo funcional completa.'},
        {id:'c10',title:'Go-Live plataforma producción',owner:'Todo el equipo',date:'2026-10-20',type:'entregable',status:'pendiente',obs:'Blue/Green deploy.'},
        {id:'c11',title:'Certificación regulatoria final',owner:'Legal + PM',date:'2026-10-15',type:'regulatorio',status:'pendiente',obs:'Informe MinEnergía + SIC.'},
        {id:'c12',title:'Operación plena — todos CPOs',owner:'Todo el equipo',date:'2027-05-31',type:'regulatorio',status:'pendiente',obs:'~18 meses desde resolución.'},
        {id:'c13',title:'Reunión empresa española OCPI',owner:'Rafael A. Dominguez',date:'2026-03-28',type:'externo',status:'pendiente',obs:'REE/CNMC. Lecciones UE.'},
        {id:'c14',title:'Reunión alineación MinEnergía',owner:'Rafael A. Dominguez',date:'2026-02-28',type:'regulatorio',status:'completado',obs:'Presentación enfoque arquitectónico y validación cronograma.'}
    ],
    regulatoryMilestones:[
        {id:'r1',title:'Publicación Resolución 40559',date:'2025-11-21',status:'completado'},
        {id:'r2',title:'Inicio construcción Guía Técnica',date:'2026-02-01',status:'en_progreso'},
        {id:'r3',title:'Información pública disponible (90 días)',date:'2026-04-30',status:'pendiente'},
        {id:'r4',title:'Guía Técnica Implementación entregada',date:'2026-08-20',status:'pendiente'},
        {id:'r5',title:'Contratación Infra + Data Lake',date:'2026-05-22',status:'pendiente'},
        {id:'r6',title:'Sandbox disponible (post-guía)',date:'2026-08-31',status:'pendiente'},
        {id:'r7',title:'Producción operativa',date:'2026-11-30',status:'pendiente'},
        {id:'r8',title:'Certificación CPOs obligatoria',date:'2027-01-31',status:'pendiente'},
        {id:'r9',title:'Go-Live plataforma',date:'2026-10-20',status:'pendiente'},
        {id:'r10',title:'Operación plena — todos CPOs',date:'2027-05-31',status:'pendiente'},
        {id:'r11',title:'Supervisión SIC activa',date:'2026-11-15',status:'pendiente'},
        {id:'r12',title:'Reunión alineación MinEnergía',date:'2026-02-28',status:'completado'}
    ]};
}

// ── INIT ──
document.addEventListener('DOMContentLoaded',()=>{
    if(restoreSession()){
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        initApp();
    }
});
