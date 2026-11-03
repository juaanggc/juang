(()=>{
// ---- Acceso (usuario "juan"). Ver nota de seguridad en el README/respuesta ----
const AUTH={u:'juan',h:'4722f87a2f2744a2a080f787723afe2716d9c89adafb5c4d4763b6af0082a310'};
const $=(s,e=document)=>e.querySelector(s);
const app=$('#app');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,10);
const safe=u=>/^(https?:|mailto:)/i.test(u||'')?u:'#';
const sha=async t=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t)))].map(b=>b.toString(16).padStart(2,'0')).join('');
const toURL=f=>new Promise(r=>{const x=new FileReader();x.onload=()=>r(x.result);x.readAsDataURL(f)});
const dl=(o,n)=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(o)],{type:'application/json'}));a.download=n;a.click()};
const link=id=>location.origin+location.pathname+'#/s/'+id;

// ---- Almacenamiento local (IndexedDB) ----
const idb=()=>new Promise((res,rej)=>{const r=indexedDB.open('juan-site',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
const kv=async(mode,fn)=>{const d=await idb();return new Promise((res,rej)=>{const t=d.transaction('kv',mode);const q=fn(t.objectStore('kv'));t.oncomplete=()=>res(q&&q.result);t.onerror=()=>rej(t.error)})};
const load=()=>kv('readonly',s=>s.get('db'));
const save=()=>kv('readwrite',s=>s.put(DB,'db'));

let PUB={profile:{},sections:[]},DB=null;
const authed=()=>sessionStorage.getItem('auth')==='1';
const GH=()=>JSON.parse(localStorage.getItem('gh')||'{}');
const guess=()=>{const h=location.hostname,g=location.pathname.split('/')[1];return h.endsWith('.github.io')?{repo:h.split('.')[0]+'/'+(g&&!g.includes('.')?g:h)}:{}};
const cfg=()=>({branch:'main',...guess(),...GH()});
const ICON={note:'✎',link:'↗',file:'▤'};

// ---- Rutas ----
async function init(){
  $('#yr').textContent=new Date().getFullYear();
  try{PUB=await(await fetch('content.json?t='+Date.now(),{cache:'no-store'})).json()}catch(e){}
  if(authed())DB=await load()||structuredClone(PUB);
  addEventListener('hashchange',route);route();
}
function route(){
  const [a,b]=location.hash.replace(/^#\/?/,'').split('/');
  const acc=$('#acc');acc.textContent=authed()?'Área privada':'Acceder';acc.href=authed()?'#/admin':'#/login';
  scrollTo(0,0);
  if(a==='login')return login();
  if(a==='admin')return admin();
  if(a==='s')return view(b);
  home();
}

// ---- Página principal ----
const card=i=>`<a class="card" href="#/s/${i.id}"><span class="ic">${ICON[i.type]}</span><h3>${esc(i.title)}</h3><p>${esc((i.text||i.file?.name||i.url||'').slice(0,110))}</p></a>`;
function home(){
  const p=PUB.profile||{};
  const secs=(PUB.sections||[]).filter(s=>s.items.some(i=>i.public));
  document.title=p.name||'Inicio';
  app.innerHTML=`<section class="hero"><p class="tag">${esc(p.tagline)}</p><h1>${esc(p.name)}</h1>
  ${(p.bio||[]).map(t=>`<p class="lead">${esc(t)}</p>`).join('')}
  ${p.linkedin?`<a class="btn ghost" target="_blank" rel="noopener" href="${esc(safe(p.linkedin))}">LinkedIn</a>`:''}</section>`+
  secs.map(s=>`<section class="block"><h2>${esc(s.title)}</h2><div class="grid">${s.items.filter(i=>i.public).map(card).join('')}</div></section>`).join('');
}

// ---- Elemento compartido ----
function view(id){
  let it;
  for(const s of [...(PUB.sections||[]),...(authed()&&DB?DB.sections:[])]){it=s.items.find(i=>i.id===id&&(i.public||authed()));if(it)break}
  if(!it){app.innerHTML='<div class="view"><h1>No encontrado</h1><p>Este enlace no existe o ya no es público.</p><a class="btn" href="#/">Volver al inicio</a></div>';return}
  const f=it.file,t=f?.type||'',src=f?(f.path?encodeURI(f.path):f.data):'';
  app.innerHTML=`<article class="view"><h1>${esc(it.title)}</h1>
  ${it.text?`<p class="body">${esc(it.text)}</p>`:''}
  ${it.url?`<p><a class="btn" target="_blank" rel="noopener" href="${esc(safe(it.url))}">Abrir enlace</a></p>`:''}
  ${f?(t.startsWith('image/')?`<img alt="${esc(f.name)}" src="${src}">`:t==='application/pdf'?`<iframe title="${esc(f.name)}" src="${src}"></iframe>`:t.startsWith('video/')?`<video controls src="${src}"></video>`:'')+`<p><a class="btn ghost" download="${esc(f.name)}" href="${src}">Descargar ${esc(f.name)}</a></p>`:''}
  <p><a href="#/">← Inicio</a></p></article>`;
}

// ---- Login ----
function login(){
  if(authed())return location.hash='#/admin';
  app.innerHTML=`<form class="login" id="lf"><h1>Acceder</h1>
  <label>Usuario<input name="u" autocomplete="username" required></label>
  <label>Contraseña<input name="p" type="password" autocomplete="current-password" required></label>
  <p class="err" id="er"></p><button class="btn">Entrar</button></form>`;
  $('#lf').onsubmit=async e=>{
    e.preventDefault();
    const u=e.target.u.value.trim().toLowerCase(),p=e.target.p.value;
    if(u===AUTH.u&&await sha(u+':'+p)===AUTH.h){
      sessionStorage.setItem('auth','1');DB=await load()||structuredClone(PUB);location.hash='#/admin';
    }else $('#er').textContent='Usuario o contraseña incorrectos.';
  };
}

// ---- Área privada ----
function admin(){
  if(!authed())return location.hash='#/login';
  const p=DB.profile||{},g=cfg();
  app.innerHTML=`<div class="bar"><h1>Área privada</h1><div class="row">
    <button class="btn" data-a="ns">+ Sección</button>
    <button class="btn" data-a="pub">Publicar</button>
    <button class="btn ghost" data-a="out">Salir</button></div></div>
  <p class="note" id="st">Los cambios se guardan en este navegador. Pulsa Publicar para llevar a la web todo lo marcado como público.</p>
  <section class="panel"><h2>Perfil de la página principal</h2>
    <label>Nombre<input data-p="name" value="${esc(p.name)}"></label>
    <label>Subtítulo<input data-p="tagline" value="${esc(p.tagline)}"></label>
    <label>LinkedIn (URL)<input data-p="linkedin" value="${esc(p.linkedin)}"></label>
    <label>Descripción (separa párrafos con una línea en blanco)<textarea data-p="bio" rows="7">${esc((p.bio||[]).join('\n\n'))}</textarea></label></section>
  ${DB.sections.length?DB.sections.map(s=>`<section class="panel"><div class="head"><input data-st="${s.id}" value="${esc(s.title)}" aria-label="Título de sección">
    <button class="btn sm" data-a="add" data-s="${s.id}">+ Elemento</button><button class="btn sm danger" data-a="delsec" data-s="${s.id}">Borrar</button></div>
    ${s.items.length?s.items.map(i=>`<div class="item"><span class="ic">${ICON[i.type]}</span><div class="t">${esc(i.title)}<small>${i.file?esc(i.file.name)+' · '+(i.file.size/1024).toFixed(0)+' KB':esc(i.url||'')}</small></div>
      <label class="chk"><input type="checkbox" data-pub data-s="${s.id}" data-i="${i.id}" ${i.public?'checked':''}> Público</label>
      ${i.public?`<button class="btn sm ghost" data-a="copy" data-i="${i.id}">Copiar enlace</button>`:''}
      <button class="btn sm ghost" data-a="edit" data-s="${s.id}" data-i="${i.id}">Editar</button>
      <button class="btn sm danger" data-a="del" data-s="${s.id}" data-i="${i.id}">Borrar</button></div>`).join(''):'<p class="empty">Sección vacía. Añade tu primer elemento.</p>'}</section>`).join(''):'<p class="empty">Aún no hay secciones. Crea la primera con «+ Sección».</p>'}
  <section class="panel"><h2>Ajustes de publicación</h2>
    <label>Repositorio (usuario/repo)<input data-g="repo" value="${esc(g.repo)}"></label>
    <label>Rama<input data-g="branch" value="${esc(g.branch)}"></label>
    <label>Token de GitHub<input data-g="token" type="password" autocomplete="off" value="${esc(g.token)}"></label>
    <p class="empty">GitHub → Settings → Developer settings → Fine-grained tokens: limitado a este repositorio y con permiso «Contents: Read and write». Se guarda solo en este navegador.</p>
    <div class="row"><button class="btn ghost" data-a="ex2">Copia de seguridad</button><label class="btn ghost" style="margin:0">Restaurar<input type="file" id="imp" accept=".json" hidden></label></div></section>`;
}

const sec=id=>DB.sections.find(s=>s.id===id);
const pubData=()=>({kind:'public',profile:DB.profile,sections:DB.sections.map(s=>({...s,items:s.items.filter(i=>i.public).map(i=>i.file?{...i,file:{name:i.file.name,type:i.file.type,size:i.file.size,path:i.file.path}}:i)})).filter(s=>s.items.length)});

async function publish(){
  const st=$('#st'),say=t=>st.textContent=t,g=cfg();
  if(!g.repo||!g.token)return say('Completa el repositorio y el token en «Ajustes de publicación».');
  const H={Authorization:'Bearer '+g.token,Accept:'application/vnd.github+json'},U=p=>`https://api.github.com/repos/${g.repo}/contents/${p}`;
  const get=async p=>{const r=await fetch(U(p)+'?ref='+g.branch,{headers:H});if(r.status===404)return null;if(!r.ok)throw Error(r.status===401?'Token no válido o caducado.':'Error '+r.status+' al leer el repositorio.');return r.json()};
  const put=async(p,b64,msg)=>{const cur=await get(p);const r=await fetch(U(p),{method:'PUT',headers:H,body:JSON.stringify({message:msg,content:b64,branch:g.branch,sha:cur?.sha})});if(!r.ok)throw Error(r.status===403||r.status===404?'Sin permiso de escritura: revisa el token y el repositorio.':'No se pudo subir '+p+' ('+r.status+').')};
  try{
    const items=DB.sections.flatMap(s=>s.items.filter(i=>i.public&&i.file));
    const todo=items.filter(i=>i.file.data&&!i.file.path);let n=0;
    for(const i of todo){say(`Subiendo archivos ${++n}/${todo.length}…`);const p='files/'+i.id+'-'+i.file.name.replace(/[^\w.-]+/g,'_');await put(p,i.file.data.split(',')[1],'Añadir archivo');i.file.path=p}
    const used=new Set(items.map(i=>i.file.path)),dir=await get('files');
    for(const f of Array.isArray(dir)?dir:[])if(!used.has(f.path))await fetch(U(f.path),{method:'DELETE',headers:H,body:JSON.stringify({message:'Quitar archivo',sha:f.sha,branch:g.branch})});
    DB.sections.forEach(s=>s.items.forEach(i=>{if(i.file&&i.file.data&&i.file.path&&!used.has(i.file.path))delete i.file.path}));
    say('Publicando contenido…');
    const data=pubData();
    await put('content.json',btoa(unescape(encodeURIComponent(JSON.stringify(data,null,1)))),'Actualizar contenido');
    PUB=data;await save();say('Publicado. La web se actualiza en 1–2 minutos.');
  }catch(e){say(e.message)}
}

app.addEventListener('click',async e=>{
  const b=e.target.closest('[data-a]');if(!b)return;
  const {a,s,i}=b.dataset;
  if(a==='ns'){const t=prompt('Nombre de la sección:');if(t){DB.sections.push({id:uid(),title:t,items:[]});await save();admin()}}
  if(a==='add')openItem(s);
  if(a==='edit')openItem(s,i);
  if(a==='del'&&confirm('¿Borrar este elemento?')){sec(s).items=sec(s).items.filter(x=>x.id!==i);await save();admin()}
  if(a==='delsec'&&confirm('¿Borrar la sección y todo su contenido?')){DB.sections=DB.sections.filter(x=>x.id!==s);await save();admin()}
  if(a==='copy'){await navigator.clipboard.writeText(link(i));b.textContent='¡Copiado!'}
  if(a==='pub')publish();
  if(a==='ex2')dl({kind:'full',...DB},'copia-completa.json');
  if(a==='out'){sessionStorage.removeItem('auth');DB=null;location.hash='#/'}
});
app.addEventListener('change',async e=>{
  const t=e.target;
  if(t.dataset.p){const v=t.value;DB.profile[t.dataset.p]=t.dataset.p==='bio'?v.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean):v;await save()}
  if(t.dataset.g){const g=GH();g[t.dataset.g]=t.value.trim();localStorage.setItem('gh',JSON.stringify(g))}
  if(t.dataset.st){sec(t.dataset.st).title=t.value;await save()}
  if(t.hasAttribute('data-pub')){sec(t.dataset.s).items.find(x=>x.id===t.dataset.i).public=t.checked;await save();admin()}
  if(t.id==='imp'&&t.files[0]){
    try{const o=JSON.parse(await t.files[0].text());
      if(!Array.isArray(o.sections))throw 0;
      if(confirm('Esto reemplaza el contenido actual de tu área privada. ¿Continuar?')){DB={profile:o.profile||DB.profile,sections:o.sections};await save();admin()}
    }catch(_){alert('Archivo no válido.')}
  }
});

function openItem(sid,iid){
  const S=sec(sid);
  const it=iid?S.items.find(i=>i.id===iid):{id:uid(),type:'note',title:'',text:'',url:'',public:false};
  const d=$('#dlg');
  d.innerHTML=`<form method="dialog"><h2>${iid?'Editar':'Nuevo'} elemento</h2>
  <label>Tipo<select name="type">${[['note','Nota / texto'],['link','Enlace'],['file','Archivo']].map(([v,n])=>`<option value="${v}" ${it.type===v?'selected':''}>${n}</option>`).join('')}</select></label>
  <label>Título<input name="title" required value="${esc(it.title)}"></label>
  <label>Texto<textarea name="text" rows="5">${esc(it.text)}</textarea></label>
  <label>URL (para enlaces)<input name="url" value="${esc(it.url)}"></label>
  <label>Archivo ${it.file?'(actual: '+esc(it.file.name)+')':''}<input type="file" name="file"></label>
  <label class="chk"><input type="checkbox" name="public" ${it.public?'checked':''}> Público</label>
  <div class="row" style="margin-top:14px"><button class="btn" value="ok">Guardar</button><button class="btn ghost" value="x" formnovalidate>Cancelar</button></div></form>`;
  d.showModal();
  d.querySelector('form').onsubmit=async e=>{
    if(e.submitter.value!=='ok')return;
    const f=new FormData(e.target),file=f.get('file');
    Object.assign(it,{type:f.get('type'),title:f.get('title'),text:f.get('text'),url:f.get('url'),public:!!f.get('public')});
    if(file&&file.size>20e6)return alert('Archivo demasiado grande (máx. 20 MB).');
    if(file&&file.size)it.file={name:file.name,type:file.type,size:file.size,data:await toURL(file)};
    if(!iid)S.items.push(it);
    await save();admin();
  };
}
init();
})();
