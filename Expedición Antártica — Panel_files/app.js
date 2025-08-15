// Background snow
const bg = document.getElementById('bg-snow'); const bctx = bg.getContext('2d');
function size(){ bg.width=innerWidth; bg.height=innerHeight }
size(); addEventListener('resize', size);
let flakes = Array.from({length: Math.max(140, innerWidth/10)}, () => ({
  x: Math.random()*innerWidth, y: Math.random()*innerHeight, r: Math.random()*1.8+0.8, s: Math.random()*0.7+0.3
}));
(function loop(){
  bctx.clearRect(0,0,bg.width,bg.height);
  bctx.fillStyle = 'rgba(255,255,255,.9)';
  flakes.forEach(f=>{
    bctx.beginPath(); bctx.arc(f.x,f.y,f.r,0,Math.PI*2); bctx.fill();
    f.y+=f.s; f.x+=Math.sin(f.y*.02)*.3; if(f.y>bg.height+6){f.y=-6; f.x=Math.random()*bg.width}
  });
  requestAnimationFrame(loop);
})();

// Local storage
const KEY='EA_PANEL_V4';
function id(){ return Math.random().toString(36).slice(2,9) }
function load(){
  try{
    const raw = localStorage.getItem(KEY);
    if(!raw){
      // 18 participants + Bonju + Duo = 20
      const base = ['Dani','Isa','Vita','Alex','Nico','Luna','Maya','Leo','Sofía','Bruno','Emma','Sam','Kira','Tadeo','Zoe','Omar','Inés','Pablo'];
      return {
        logo:null,
        track:null,
        teams:[{name:'Equipo Blanco',img:null},{name:'Equipo Celeste',img:null},{name:'Equipo Azul',img:null}],
        items: base.map(n=>({id:id(), name:n, pos:'', img:null}))
          .concat([{id:id(), name:'Bonju', pos:'', img:null},{id:id(), name:'Duo Lingo', pos:'', img:null}])
      };
    }
    return JSON.parse(raw);
  }catch(e){ return null }
}
function save(){ localStorage.setItem(KEY, JSON.stringify(state)) }
let state = load();

// DOM
const grid = document.getElementById('cardGrid');
const search = document.getElementById('search');
const clearSearch = document.getElementById('clearSearch');
const logoInput = document.getElementById('logoInput');
const logoPreview = document.getElementById('logoPreview');
const trackInput = document.getElementById('trackInput');
const trackPreview = document.getElementById('trackPreview');
const removeTrack = document.getElementById('removeTrack');

// TEAM handlers
document.querySelectorAll('.team-card .square input').forEach(inp=>{
  inp.addEventListener('change', e=>{
    const idx = Number(e.target.dataset.team);
    const f = e.target.files[0]; if(!f) return;
    const r = new FileReader();
    r.onload = ()=>{
      state.teams[idx].img = r.result;
      const img = document.getElementById('teamImg'+idx);
      img.src = r.result; img.style.display='block';
      img.parentElement.querySelector('.tip').style.display='none';
      save();
    };
    r.readAsDataURL(f);
  });
});
document.querySelectorAll('.team-name').forEach(el=>{
  el.addEventListener('blur', e=>{
    const idx = Number(e.target.dataset.team);
    state.teams[idx].name = e.target.textContent.trim(); save();
  });
});

// Set initial team images from storage
state.teams.forEach((t,i)=>{
  if(t.img){
    const img = document.getElementById('teamImg'+i);
    img.src = t.img; img.style.display='block';
    img.parentElement.querySelector('.tip').style.display='none';
  }
});

// Per-square hover snow for team squares
document.querySelectorAll('.team-card .square').forEach(square=>{
  const canvas = square.querySelector('canvas.snow');
  const ctx = canvas.getContext('2d');
  function resize(){ canvas.width=square.clientWidth; canvas.height=square.clientHeight }
  resize(); new ResizeObserver(resize).observe(square);
  let raf=null; let particles=[];
  function start(){
    particles = Array.from({length:20},()=>({x:Math.random()*canvas.width, y:-5, r:Math.random()*1.5+0.5, s:Math.random()*0.7+0.3}));
    function step(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle='rgba(255,255,255,.95)';
      particles.forEach(p=>{
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
        p.y += p.s; p.x += Math.sin(p.y*.08)*.3;
        if(p.y>canvas.height+4){ p.y=-4; p.x=Math.random()*canvas.width }
      });
      raf = requestAnimationFrame(step);
    }
    cancelAnimationFrame(raf); step();
  }
  function stop(){ cancelAnimationFrame(raf); ctx.clearRect(0,0,canvas.width,canvas.height) }
  square.addEventListener('mouseenter', start);
  square.addEventListener('mouseleave', stop);
});

// Participant grid
function render(){
  const q = (search.value||'').toLowerCase().trim();
  grid.innerHTML = '';
  state.items
    .filter(it => !q || it.name.toLowerCase().includes(q) || (it.pos||'').toLowerCase().includes(q))
    .forEach(it => grid.appendChild(createCard(it)));
}

function createCard(item){
  const card = document.createElement('article'); card.className='card'+(item.name.toLowerCase()==='dani'?' dani':'');
  // Badges for Bonju / Duo
  if(item.name.toLowerCase()==='bonju'){
    const b = document.createElement('div'); b.className='top-badge host'; b.textContent='HOST'; card.appendChild(b);
  }else if(item.name.toLowerCase()==='duo lingo'){
    const b = document.createElement('div'); b.className='top-badge staff'; b.textContent='STAFF'; card.appendChild(b);
  }

  // Avatar with hover snow
  const avatar = document.createElement('label'); avatar.className='avatar';
  const img = document.createElement('img'); avatar.appendChild(img);
  const tip = document.createElement('div'); tip.className='tip'; tip.textContent='Sube foto'; avatar.appendChild(tip);
  const inp = document.createElement('input'); inp.type='file'; inp.accept='image/*'; avatar.appendChild(inp);
  const snow = document.createElement('canvas'); snow.className='snow'; avatar.appendChild(snow);

  if(item.img){ img.src=item.img; img.style.display='block'; tip.style.display='none' }

  inp.addEventListener('change', (e)=>{
    const f = e.target.files[0]; if(!f) return;
    const r = new FileReader();
    r.onload = ()=>{ item.img=r.result; img.src=item.img; img.style.display='block'; tip.style.display='none'; save() };
    r.readAsDataURL(f);
  });

  // Hover snow animation setup
  const sctx = snow.getContext('2d');
  function sresize(){ snow.width=avatar.clientWidth; snow.height=avatar.clientHeight }
  sresize(); new ResizeObserver(sresize).observe(avatar);
  let raf=null; let particles=[];
  function start(){
    particles = Array.from({length:18},()=>({x:Math.random()*snow.width, y:-5, r:Math.random()*1.5+0.5, s:Math.random()*0.7+0.3}));
    function step(){
      sctx.clearRect(0,0,snow.width,snow.height);
      sctx.fillStyle='rgba(255,255,255,.95)';
      particles.forEach(p=>{
        sctx.beginPath(); sctx.arc(p.x,p.y,p.r,0,Math.PI*2); sctx.fill();
        p.y += p.s; p.x += Math.sin(p.y*.08)*.3;
        if(p.y>snow.height+4){ p.y=-4; p.x=Math.random()*snow.width }
      });
      raf = requestAnimationFrame(step);
    }
    cancelAnimationFrame(raf); step();
  }
  function stop(){ cancelAnimationFrame(raf); sctx.clearRect(0,0,snow.width,snow.height) }
  avatar.addEventListener('mouseenter', start);
  avatar.addEventListener('mouseleave', stop);

  // Text fields
  const name = document.createElement('h3'); name.className='name'; name.textContent=item.name; name.contentEditable=true;
  name.addEventListener('blur', ()=>{ item.name = name.textContent.trim(); save() });
  const pos = document.createElement('div'); pos.className='pos'; pos.textContent=item.pos||'Posición en la temporada'; pos.contentEditable=true;
  pos.addEventListener('focus', ()=>{ if(pos.textContent==='Posición en la temporada') pos.textContent='' });
  pos.addEventListener('blur', ()=>{ item.pos = pos.textContent.trim(); save() });

  card.appendChild(avatar); card.appendChild(name); card.appendChild(pos);
  return card;
}

// Search
search.addEventListener('input', render);
clearSearch.addEventListener('click', ()=>{ search.value=''; render() });

// Logo
logoInput.addEventListener('change', e=>{
  const f = e.target.files[0]; if(!f) return;
  const r = new FileReader();
  r.onload = ()=>{ state.logo = r.result; logoPreview.src=state.logo; logoPreview.style.display='block'; save() };
  r.readAsDataURL(f);
});
if(state.logo){ logoPreview.src=state.logo; logoPreview.style.display='block' }

// Track
trackInput.addEventListener('change', e=>{
  const f = e.target.files[0]; if(!f) return;
  const r = new FileReader();
  r.onload = ()=>{ state.track = r.result; trackPreview.src=state.track; trackPreview.style.display='block'; save() };
  r.readAsDataURL(f);
});
removeTrack.addEventListener('click', ()=>{ state.track=null; trackPreview.removeAttribute('src'); trackPreview.style.display='none'; save() });
if(state.track){ trackPreview.src=state.track; trackPreview.style.display='block' }

render();
