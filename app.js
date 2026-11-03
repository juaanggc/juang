(()=>{
const C=window.CFG,$=(s,e=document)=>e.querySelector(s),app=$('#app');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe=u=>/^(https?:|mailto:)/i.test(u||'')?u:'#';
const ICON={note:'✎',link:'↗',file:'▤'},VIS={private:'Privado',restricted:'Restringido',public:'Público'};
const PRE=[
 {n:'Marfil',bg:'#F6F5F2',surf:'#FFFFFF',ink:'#1B2530',mut:'#6B7580',line:'#DEDCD5',acc:'#A98355'},
 {n:'Pizarra',bg:'#14181F',surf:'#1C222B',ink:'#ECE9E2',mut:'#9AA3AE',line:'#2C3440',acc:'#C9A66B'},
 {n:'Salvia',bg:'#F3F5F1',surf:'#FFFFFF',ink:'#20302A',mut:'#66756D',line:'#D9DFD8',acc:'#5E7F6B'},
 {n:'Marino',bg:'#F4F6F8',surf:'#FFFFFF',ink:'#14213D',mut:'#5C6B80',line:'#DCE1E8',acc:'#3D5A80'}];
const FONTS=[['Georgia,serif','Georgia'],['"Palatino Linotype",Palatino,serif','Palatino'],['"Segoe UI",system-ui,sans-serif','Sans moderna'],['"Trebuchet MS",sans-serif','Trebuchet']];
const DEF={theme:{...PRE[0],font:FONTS[0][0],rad:10},blocks:[
 {t:'hero',tag:'Estudiante de Ingeniería en Tecnologías Industriales · ETSII UPM',title:'Juan Gutiérrez Cerdán',
  text:'Me centro en el diseño funcional, la optimización de procesos y la gestión eficiente de proyectos. Entiendo la ingeniería como la capacidad de transformar problemas complejos en soluciones organizadas, estéticas y técnicamente precisas.\n\nEn paralelo a mis estudios desarrollo proyectos web a medida para profesionales y negocios de mi entorno, coordinando cada etapa desde la arquitectura inicial hasta la entrega final. Me mueve la curiosidad, el diseño intuitivo y la búsqueda constante de eficiencia, tanto en sistemas digitales como industriales.',
  btn:'LinkedIn',url:'https://www.linkedin.com/in/juan-guti%C3%A9rrez-cerd%C3%A1n/'},
 {t:'cards',title:'Contenido',sec:''}]};
let U=null,OWN=false,EDIT=false,SITE=DEF,ITEMS=[],USERS=[];
const db=window.supabase.createClient(C.url,C.key);

const applyTheme=t=>{const r=document.documentElement.style;['bg','surf','ink','mut','line','acc'].forEach(k=>r.setProperty('--'+k,t[k]));r.setProperty('--font',t.font);r.setProperty('--rad',t.rad+'px');localStorage.setItem('th',JSON.stringify(t))};
const setUser=u=>{U=u||null;OWN=!!u&&(u.email||'').toLowerCase()===C.owner.toLowerCase()};
const loadItems=async()=>{ITEMS=(await db.from('items').select('*').order('pos')).data||[]};
const loadSite=async()=>{const d=(await db.from('site').select('data').eq('id',1).maybeSingle()).data?.data||{};SITE={theme:{...DEF.theme,...d.theme},blocks:d.blocks||DEF.blocks};applyTheme(SITE.theme)};
const link=id=>location.origin+location.pathname+'#/i/'+id;

async function boot(){
  $('#yr').textContent=new Date().getFullYear();
  try{applyTheme({...DEF.theme,...JSON.parse(localStorage.th)})}catch(e){}
  if(!C.url||C.url.includes('TU-PROYECTO'))return app.innerHTML='<p class="empty">Falta configurar <code>config.js</code>.</p>';
  setUser((await db.auth.getSession()).data.session?.user);
  await Promise.all([loadSite(),loadItems()]);
  db.auth.onAuthStateChange((_,s)=>{setUser(s?.user);head()});
  addEventListener('hashchange',route);route();
}
const head=()=>{$('#nav').innerHTML=OWN?`<a class="btn ghost" href="#/admin">Panel</a><button class="btn ghost" data-a="edit">${EDIT?'Salir de edición':'Editar página'}</button><button class="btn" data-a="out">Salir</button>`
  :U?`<a class="btn ghost" href="#/mis">Mi espacio</a><button class="btn" data-a="out">Salir</button>`:`<a class="btn" href="#/login">Acceder</a>`;document.body.classList.toggle('edit',EDIT)};
function route(){
  const [a,b]=location.hash.replace(/^#\/?/,'').split('/');head();scrollTo(0,0);
  ({login:()=>login(0),registro:()=>login(1),admin,mis,i:()=>view(b)}[a]||home)();
}

// ---- Portada con editor visual ----
const card=i=>`<a class="card" href="#/i/${i.id}"><span class="ic">${ICON[i.kind]}</span><h3>${esc(i.title)}</h3><p>${esc((i.body||i.file_name||i.url||'').slice(0,110))}</p></a>`;
const ed=(i,f,v,tag,cls='')=>`<${tag} class="${cls}" data-b="${i}" data-f="${f}" ${EDIT?'contenteditable="true"':''}>${esc(v)}</${tag}>`;
const R={
  hero:(b,i)=>`<section class="hero">${ed(i,'tag',b.tag,'p','tag')}${ed(i,'title',b.title,'h1')}${ed(i,'text',b.text,'p','lead')}${b.btn||EDIT?`<a class="btn ghost" ${EDIT?'':`target="_blank" rel="noopener" href="${esc(safe(b.url))}"`}>${ed(i,'btn',b.btn,'span')}</a>`:''}</section>`,
  text:(b,i)=>`<section class="block">${ed(i,'title',b.title,'h2')}${ed(i,'body',b.body,'p','lead')}</section>`,
  cards:(b,i)=>`<section class="block">${ed(i,'title',b.title,'h2')}<div class="grid">${ITEMS.filter(x=>x.vis==='public'&&x.listed&&(!b.sec||x.sec===b.sec)).map(card).join('')||(EDIT?'<p class="empty">Aquí aparecerá el contenido público marcado como visible.</p>':'')}</div></section>`};
function home(){
  document.title=SITE.blocks[0]?.title||'Inicio';
  app.innerHTML=SITE.blocks.map((b,i)=>{const h=(R[b.t]||(()=>''))(b,i);
    return EDIT?`<div class="bw"><div class="tb"><button class="btn sm" data-a="mv" data-b="${i}" data-d="-1">↑</button><button class="btn sm" data-a="mv" data-b="${i}" data-d="1">↓</button>
    ${b.t==='cards'?`<button class="btn sm" data-a="sec" data-b="${i}">Sección</button>`:''}${b.t==='hero'?`<button class="btn sm" data-a="lnk" data-b="${i}">Enlace</button>`:''}
    ${b.t==='hero'?'':`<button class="btn sm danger" data-a="rm" data-b="${i}">✕</button>`}</div>${h}</div>`:h}).join('')
  +(EDIT?`<div class="add row"><button class="btn ghost sm" data-a="add" data-t="text">+ Bloque de texto</button><button class="btn ghost sm" data-a="add" data-t="cards">+ Bloque de contenido</button></div>
  <div class="eb"><button class="btn" data-a="save">Guardar</button><button class="btn ghost" data-a="style">Estilo</button><button class="btn ghost" data-a="edit">Salir</button></div>`:'');
}
function style(){
  const t=SITE.theme,d=$('#dlg');
  d.innerHTML=`<form method="dialog"><h2>Estilo</h2><div class="row">${PRE.map((p,k)=>`<button type="button" class="btn sm ghost" data-a="pre" data-k="${k}">${p.n}</button>`).join('')}</div>
  <div class="cols">${[['bg','Fondo'],['surf','Tarjetas'],['ink','Texto'],['mut','Texto suave'],['line','Bordes'],['acc','Acento']].map(([k,n])=>`<label>${n}<input type="color" data-t="${k}" value="${t[k]}"></label>`).join('')}</div>
  <label>Tipografía de títulos<select data-t="font">${FONTS.map(([v,n])=>`<option value="${esc(v)}" ${t.font===v?'selected':''}>${n}</option>`).join('')}</select></label>
  <label>Redondeo<input type="range" min="0" max="24" data-t="rad" value="${t.rad}"></label>
  <p class="empty">Recuerda pulsar «Guardar» en la barra para que lo vea todo el mundo.</p><button class="btn" value="x">Cerrar</button></form>`;
  d.showModal();
}

// ---- Acceso ----
function login(reg){
  if(U)return location.hash=OWN?'#/admin':'#/mis';
  app.innerHTML=`<form class="login" id="lf"><h1>${reg?'Crear cuenta':'Acceder'}</h1>
  <label>Email<input name="e" type="email" required autocomplete="username"></label>
  <label>Contraseña<input name="p" type="password" minlength="6" required autocomplete="${reg?'new-password':'current-password'}"></label>
  <p class="err" id="er"></p><div class="row"><button class="btn">${reg?'Registrarme':'Entrar'}</button><a href="#/${reg?'login':'registro'}">${reg?'Ya tengo cuenta':'Tengo una invitación'}</a></div></form>`;
  $('#lf').onsubmit=async e=>{
    e.preventDefault();const a={email:e.target.e.value.trim(),password:e.target.p.value};
    const {data,error}=await(reg?db.auth.signUp(a):db.auth.signInWithPassword(a));
    if(error||!data.session)return $('#er').textContent=reg?'No se pudo registrar. Comprueba que tu email tiene invitación.':'Email o contraseña incorrectos.';
    setUser(data.session.user);await loadItems();location.hash=OWN?'#/admin':'#/mis';
  };
}
function mis(){
  if(!U)return location.hash='#/login';
  app.innerHTML=`<h1>Mi espacio</h1><p class="empty">Contenido restringido al que tienes acceso.</p><div class="grid">${ITEMS.filter(i=>i.vis==='restricted').map(card).join('')||'<p class="empty">Aún no tienes contenido asignado.</p>'}</div>`;
}

// ---- Contenido compartido ----
async function view(id){
  app.innerHTML='<p class="empty">Cargando…</p>';
  const it=(await db.from('items').select('*').eq('id',id).maybeSingle()).data;
  if(!it)return app.innerHTML=`<div class="view"><h1>No disponible</h1><p>Este contenido no existe o no tienes acceso.</p><div class="row">${U?'':'<a class="btn" href="#/login">Acceder</a>'}<a class="btn ghost" href="#/">Inicio</a></div></div>`;
  let f='';
  if(it.file_path){const u=(await db.storage.from('files').createSignedUrl(it.file_path,3600)).data?.signedUrl,t=it.file_type||'';
    if(u)f=(t.startsWith('image/')?`<img alt="" src="${u}">`:t==='application/pdf'?`<iframe title="${esc(it.file_name)}" src="${u}"></iframe>`:t.startsWith('video/')?`<video controls src="${u}"></video>`:'')+`<p><a class="btn ghost" target="_blank" rel="noopener" href="${u}">Abrir / descargar ${esc(it.file_name)}</a></p>`}
  document.title=it.title;
  app.innerHTML=`<article class="view"><h1>${esc(it.title)}</h1>${it.body?`<p class="body">${esc(it.body)}</p>`:''}${it.url?`<p><a class="btn" target="_blank" rel="noopener" href="${esc(safe(it.url))}">Abrir enlace</a></p>`:''}${f}<p><a href="#/">← Inicio</a></p></article>`;
}

// ---- Panel del propietario ----
const row=i=>`<div class="item"><span class="ic">${ICON[i.kind]}</span><div class="t">${esc(i.title)}<small>${VIS[i.vis]}${i.vis==='public'?(i.listed?' · en portada':' · oculto (solo con enlace)'):''}</small></div>
  ${i.vis!=='private'?`<button class="btn sm ghost" data-a="copy" data-i="${i.id}">Copiar enlace</button>`:''}<button class="btn sm ghost" data-a="edit1" data-i="${i.id}">Editar</button><button class="btn sm danger" data-a="del" data-i="${i.id}">Borrar</button></div>`;
async function admin(){
  if(!OWN)return location.hash='#/login';
  const [inv,pr]=await Promise.all([db.from('invites').select('email'),db.from('profiles').select('id,email')]);
  const reg=new Set((pr.data||[]).map(p=>p.email.toLowerCase()));
  USERS=(pr.data||[]).filter(p=>p.email.toLowerCase()!==C.owner.toLowerCase());
  const secs=[...new Set(ITEMS.map(i=>i.sec))];
  app.innerHTML=`<div class="bar"><h1>Panel</h1><button class="btn" data-a="new">+ Contenido</button></div>`
  +(secs.length?secs.map(s=>`<section class="panel"><h2>${esc(s)}</h2>${ITEMS.filter(i=>i.sec===s).map(row).join('')}</section>`).join(''):'<p class="empty">Aún no hay contenido. Crea el primero con «+ Contenido».</p>')
  +`<section class="panel"><h2>Usuarios</h2><form class="row" id="inv"><input type="email" id="ie" placeholder="email@ejemplo.com" required style="max-width:300px"><button class="btn sm">Invitar</button></form>
  <p class="empty">La persona invitada crea su cuenta en «Acceder → Tengo una invitación». Después podrás darle acceso a contenido restringido.</p>
  ${(inv.data||[]).map(v=>`<div class="item"><div class="t">${esc(v.email)}<small>${reg.has(v.email.toLowerCase())?'Registrado':'Pendiente de registro'}</small></div><button class="btn sm danger" data-a="uninv" data-e="${esc(v.email)}">Quitar invitación</button></div>`).join('')}</section>`;
}
async function openItem(id){
  const it=ITEMS.find(i=>i.id===id)||{kind:'note',sec:'General',title:'',body:'',url:'',vis:'private',listed:false};
  let gr=new Set();
  if(id)gr=new Set(((await db.from('grants').select('user_id').eq('item_id',id)).data||[]).map(g=>g.user_id));
  const d=$('#dlg');
  d.innerHTML=`<form method="dialog"><h2>${id?'Editar':'Nuevo'} contenido</h2>
  <label>Tipo<select name="kind">${[['note','Nota / texto'],['link','Enlace'],['file','Archivo']].map(([v,n])=>`<option value="${v}" ${it.kind===v?'selected':''}>${n}</option>`).join('')}</select></label>
  <label>Título<input name="title" required value="${esc(it.title)}"></label>
  <label>Sección<input name="sec" list="sl" value="${esc(it.sec)}"><datalist id="sl">${[...new Set(ITEMS.map(i=>i.sec))].map(s=>`<option value="${esc(s)}">`).join('')}</datalist></label>
  <label>Texto<textarea name="body" rows="4">${esc(it.body)}</textarea></label>
  <label>URL (para enlaces)<input name="url" value="${esc(it.url)}"></label>
  <label>Archivo ${it.file_name?'(actual: '+esc(it.file_name)+')':''}<input type="file" name="file"></label>
  <label>Acceso<select name="vis" id="vs">${Object.entries(VIS).map(([k,v])=>`<option value="${k}" ${it.vis===k?'selected':''}>${v}</option>`).join('')}</select></label>
  <label class="chk" id="lsd"><input type="checkbox" name="listed" ${it.listed?'checked':''}> Visible en la portada (si no, solo con enlace)</label>
  <fieldset id="gr"><legend>Usuarios con acceso</legend>${USERS.map(u=>`<label class="chk"><input type="checkbox" name="g" value="${u.id}" ${gr.has(u.id)?'checked':''}> ${esc(u.email)}</label>`).join('')||'<span class="empty">Aún no hay usuarios registrados.</span>'}</fieldset>
  <div class="row"><button class="btn" value="ok">Guardar</button><button class="btn ghost" value="x" formnovalidate>Cancelar</button></div></form>`;
  const vs=$('#vs'),sync=()=>{$('#lsd').hidden=vs.value!=='public';$('#gr').hidden=vs.value!=='restricted'};
  vs.onchange=sync;sync();d.showModal();
  d.querySelector('form').onsubmit=async e=>{
    if(e.submitter.value!=='ok')return;
    const f=new FormData(e.target),file=f.get('file'),v=f.get('vis'),rid=id||crypto.randomUUID();
    const r={kind:f.get('kind'),title:f.get('title'),sec:f.get('sec')||'General',body:f.get('body'),url:f.get('url'),vis:v,listed:v==='public'&&!!f.get('listed')};
    if(file&&file.size>50e6)return alert('Máximo 50 MB por archivo (límite del plan gratuito).');
    if(file&&file.size){const p=rid+'/'+file.name.replace(/[^\w.-]+/g,'_');
      const u=await db.storage.from('files').upload(p,file,{upsert:true,contentType:file.type||undefined});
      if(u.error)return alert(u.error.message);
      if(it.file_path&&it.file_path!==p)await db.storage.from('files').remove([it.file_path]);
      Object.assign(r,{file_path:p,file_name:file.name,file_type:file.type})}
    const w=await db.from('items').upsert({id:rid,...r});
    if(w.error)return alert(w.error.message);
    await db.from('grants').delete().eq('item_id',rid);
    if(v==='restricted'){const g=f.getAll('g').map(x=>({item_id:rid,user_id:x}));if(g.length)await db.from('grants').insert(g)}
    await loadItems();admin();
  };
}

// ---- Eventos ----
document.addEventListener('click',async e=>{
  const b=e.target.closest('[data-a]');if(!b)return;
  const {a,i,d}=b.dataset,k=+b.dataset.b,B=SITE.blocks;
  if(a==='out'){await db.auth.signOut();setUser();EDIT=false;await loadItems();location.hash==='#/'?route():location.hash='#/'}
  if(a==='edit'){EDIT=!EDIT;location.hash==='#/'||location.hash===''?route():location.hash='#/'}
  if(a==='new')openItem();
  if(a==='edit1')openItem(i);
  if(a==='del'&&confirm('¿Borrar este contenido?')){const it=ITEMS.find(x=>x.id===i);if(it.file_path)await db.storage.from('files').remove([it.file_path]);await db.from('items').delete().eq('id',i);await loadItems();admin()}
  if(a==='copy'){await navigator.clipboard.writeText(link(i));b.textContent='¡Copiado!'}
  if(a==='uninv'){await db.from('invites').delete().eq('email',b.dataset.e);admin()}
  if(a==='mv'&&B[k+ +d]){[B[k],B[k+ +d]]=[B[k+ +d],B[k]];home()}
  if(a==='rm'&&confirm('¿Quitar este bloque?')){B.splice(k,1);home()}
  if(a==='sec'){const s=prompt('Mostrar solo la sección (vacío = todas):',B[k].sec||'');if(s!==null){B[k].sec=s.trim();home()}}
  if(a==='lnk'){const u=prompt('URL del botón:',B[k].url||'');if(u!==null){B[k].url=u.trim();home()}}
  if(a==='add'){B.push(b.dataset.t==='text'?{t:'text',title:'Nuevo título',body:'Escribe aquí…'}:{t:'cards',title:'Contenido',sec:''});home()}
  if(a==='style')style();
  if(a==='pre'){Object.assign(SITE.theme,PRE[+b.dataset.k]);applyTheme(SITE.theme);style()}
  if(a==='save'){const r=await db.from('site').upsert({id:1,data:SITE});b.textContent=r.error?'Error':'Guardado ✓';setTimeout(()=>b.textContent='Guardar',1800)}
});
document.addEventListener('input',e=>{
  const t=e.target,c=t.closest('[data-b]');
  if(c&&EDIT)SITE.blocks[c.dataset.b][c.dataset.f]=c.innerText.trim();
  if(t.dataset.t){SITE.theme[t.dataset.t]=t.type==='range'?+t.value:t.value;applyTheme(SITE.theme)}
});
document.addEventListener('submit',async e=>{
  if(e.target.id!=='inv')return;e.preventDefault();
  await db.from('invites').upsert({email:$('#ie').value.trim().toLowerCase()});admin();
});
boot();
})();
