// app.js - neon theme + repo loader + modal + custom select dropdown
const USER = 'tunakem9889';
const PER_PAGE = 100;
const endpoint = `https://api.github.com/users/${USER}/repos?per_page=${PER_PAGE}&sort=updated`;

// DOM refs
const repoGrid = document.getElementById('repo-grid');
const filterInput = document.getElementById('repo-filter');
const customSelect = document.getElementById('repo-sort');
const modal = document.getElementById('repo-modal');
const modalContent = document.getElementById('modal-content');
const modalClose = document.querySelector('.modal-close');
const yearEl = document.getElementById('year');

yearEl.textContent = new Date().getFullYear();

// util
function el(tag, cls){ const e=document.createElement(tag); if(cls) e.className = cls; return e; }
function formatDate(iso){ const d=new Date(iso); return d.toLocaleDateString(); }

// state
let repos = [];
let currentSort = 'updated';

// ----------------------
// Custom select logic
// ----------------------
function initCustomSelect(){
  if(!customSelect) return;
  const toggle = customSelect.querySelector('.cs-toggle');
  const optionsPanel = customSelect.querySelector('.cs-options');
  const optionItems = Array.from(optionsPanel.querySelectorAll('li'));

  function openPanel(){
    customSelect.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    optionsPanel.focus();
  }
  function closePanel(){
    customSelect.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  // click toggle
  toggle.addEventListener('click', (e)=>{
    e.stopPropagation();
    if(customSelect.classList.contains('open')) closePanel();
    else openPanel();
  });

  // click outside -> close
  document.addEventListener('click', (e)=>{
    if(!customSelect.contains(e.target)) closePanel();
  });

  // option click
  optionItems.forEach(item=>{
    item.addEventListener('click', (e)=>{
      const v = item.getAttribute('data-value');
      setSort(v);
      closePanel();
    });
    // keyboard support
    item.addEventListener('keydown', (ev)=>{
      if(ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        item.click();
      } else if(ev.key === 'ArrowDown') {
        ev.preventDefault();
        const next = item.nextElementSibling || optionItems[0];
        next.focus();
      } else if(ev.key === 'ArrowUp'){
        ev.preventDefault();
        const prev = item.previousElementSibling || optionItems[optionItems.length-1];
        prev.focus();
      } else if(ev.key === 'Escape') {
        closePanel();
        toggle.focus();
      }
    });
  });

  // keyboard open from toggle
  toggle.addEventListener('keydown', (e)=>{
    if(e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPanel();
      // focus first option
      const first = optionsPanel.querySelector('li');
      if(first) first.focus();
    }
  });

  // set default
  setSort(customSelect.getAttribute('data-value') || 'updated');
}

function setSort(value){
  currentSort = value;
  // update toggle label and aria-selected attributes
  if(!customSelect) return;
  const toggle = customSelect.querySelector('.cs-toggle');
  const optionsPanel = customSelect.querySelector('.cs-options');
  toggle.innerHTML = (value === 'updated' ? 'Recently updated' : value === 'stars' ? 'Most stars' : 'Name') + ' <span class="cs-arrow">▾</span>';

  optionsPanel.querySelectorAll('li').forEach(li=>{
    const v = li.getAttribute('data-value');
    const sel = (v === value);
    li.setAttribute('aria-selected', sel ? 'true' : 'false');
  });

  // apply sorting/filtering
  applyFilterSort();
}

// ----------------------
// Repo rendering & logic
// ----------------------
function showLoader(){
  repoGrid.innerHTML = '';
  const l = el('div','loader');
  l.textContent = 'Đang tải repositories…';
  repoGrid.appendChild(l);
}

function renderRepos(list){
  repoGrid.innerHTML = '';
  if(!list.length){
    const n = el('div','loader');
    n.textContent = 'Không có repository phù hợp.';
    repoGrid.appendChild(n);
    return;
  }

  list.forEach((r, idx)=>{
    const card = el('button','repo-card');
    card.setAttribute('aria-label', r.name);
    card.addEventListener('click', ()=> openModal(r));
    card.style.transitionDelay = (idx*18)+'ms';

    const top = el('div','repo-title');
    const title = el('h4'); title.textContent = r.name;
    const star = el('div'); star.textContent = `★ ${r.stargazers_count}`;
    top.appendChild(title); top.appendChild(star);

    const desc = el('div','repo-desc'); desc.textContent = r.description || '';

    const meta = el('div','repo-meta');
    const lang = el('span'); lang.textContent = r.language ? `🧩 ${r.language}` : '';
    const updated = el('span'); updated.textContent = `Updated ${formatDate(r.updated_at)}`;
    meta.appendChild(lang); meta.appendChild(updated);

    card.appendChild(top);
    card.appendChild(desc);
    card.appendChild(meta);

    repoGrid.appendChild(card);

    // tiny entrance
    requestAnimationFrame(()=> {
      card.style.opacity = 0;
      card.style.transform = 'translateY(8px)';
      setTimeout(()=> {
        card.style.transition = 'opacity 420ms cubic-bezier(.2,.9,.3,1), transform 420ms cubic-bezier(.2,.9,.3,1)';
        card.style.opacity = 1;
        card.style.transform = 'translateY(0)';
      }, 30 + idx*18);
    });
  });
}

// filtering & sorting
function applyFilterSort(){
  const q = filterInput.value.trim().toLowerCase();
  let out = repos.slice();

  // filter
  if(q){
    out = out.filter(r=>{
      return (r.name && r.name.toLowerCase().includes(q)) ||
             (r.description && r.description.toLowerCase().includes(q)) ||
             (r.language && r.language.toLowerCase().includes(q));
    });
  }

  // sort
  if(currentSort === 'stars') out.sort((a,b)=> b.stargazers_count - a.stargazers_count);
  else if(currentSort === 'name') out.sort((a,b)=> a.name.localeCompare(b.name));
  else out.sort((a,b)=> new Date(b.updated_at) - new Date(a.updated_at));

  renderRepos(out);
}

// modal
function openModal(r){
  modalContent.innerHTML = `
    <h3 style="color:var(--neon-pink);">${r.name} <small style="color:var(--muted);font-weight:600">★ ${r.stargazers_count}</small></h3>
    <p style="color:var(--muted);margin-top:8px">${r.description || ''}</p>

    <div style="margin-top:12px;display:flex;gap:12px;flex-wrap:wrap">
      <a class="btn primary" href="${r.html_url}" target="_blank" rel="noopener">Open on GitHub</a>
      <a class="btn ghost" href="${r.html_url}/issues" target="_blank" rel="noopener">Issues</a>
      <div style="margin-left:auto;color:var(--muted)">Language: ${r.language || '—'}</div>
    </div>

    <hr style="margin:16px 0;border:none;border-top:1px solid rgba(255,255,255,0.04)">

    <div style="color:var(--muted);font-size:14px">
      <div>Created: ${formatDate(r.created_at)}</div>
      <div>Updated: ${formatDate(r.updated_at)}</div>
      <div>Forks: ${r.forks_count} • Open issues: ${r.open_issues_count}</div>
    </div>
  `;
  modal.setAttribute('aria-hidden','false');
  modalClose.focus();
  if(window.gsap) gsap.from('.modal-panel',{y:18,opacity:0,duration:0.36,ease:'power2.out'});
}
function closeModal(){
  modal.setAttribute('aria-hidden','true');
}

// events
filterInput.addEventListener('input', debounce(applyFilterSort, 180));
modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e)=> {
  if(e.target === modal || e.target.classList.contains('modal-backdrop')) closeModal();
});
document.addEventListener('keydown', e=> { if(e.key==='Escape') closeModal() });

function debounce(fn, wait=200){
  let t;
  return (...a)=>{ clearTimeout(t); t=setTimeout(()=> fn.apply(this,a), wait); };
}

// load repos
async function loadRepos(){
  showLoader();
  try{
    const res = await fetch(endpoint);
    if(!res.ok) throw new Error('GitHub API error '+res.status);
    const data = await res.json();
    repos = data; // optionally: data.filter(r=> !r.fork)
    applyFilterSort();
  }catch(err){
    repoGrid.innerHTML = '';
    const errEl = document.createElement('div');
    errEl.className = 'loader';
    errEl.textContent = 'Không thể tải repositories. Vui lòng thử lại sau.';
    repoGrid.appendChild(errEl);
    console.error(err);
  }
}

// init
initCustomSelect();
loadRepos();

/* ---------------------------
   Neon canvas background
   (kept lightweight)
   --------------------------- */
(function neonCanvas(){
  const canvas = document.getElementById('bgcanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let w = canvas.width = innerWidth;
  let h = canvas.height = innerHeight;
  const points = [];
  const colors = [
    {r:0,g:240,b:255,a:0.09},
    {r:255,g:0,b:200,a:0.08},
    {r:139,g:92,b:255,a:0.07}
  ];
  function rand(min,max){ return Math.random()*(max-min)+min; }
  class Point{
    constructor(){ this.reset(); }
    reset(){ this.x=rand(0,w); this.y=rand(0,h); this.vx=rand(-0.3,0.3); this.vy=rand(-0.18,0.18); this.s=rand(0.8,2.6); this.c=colors[Math.floor(Math.random()*colors.length)]; }
    step(){ this.x+=this.vx; this.y+=this.vy; if(this.x<-40||this.x>w+40||this.y<-40||this.y>h+40) this.reset(); }
    draw(){ ctx.beginPath(); ctx.fillStyle=`rgba(${this.c.r},${this.c.g},${this.c.b},${this.c.a})`; ctx.arc(this.x,this.y,this.s,0,Math.PI*2); ctx.fill(); }
  }
  function resize(){ w=canvas.width=innerWidth; h=canvas.height=innerHeight; points.length=0; const count=Math.max(18, Math.floor((w*h)/90000)); for(let i=0;i<count;i++) points.push(new Point()); }
  window.addEventListener('resize', resize);
  resize();
  let t=0;
  function frame(){
    t += 0.002;
    ctx.clearRect(0,0,w,h);
    const g = ctx.createLinearGradient(Math.sin(t)*w*0.5,0,Math.cos(t)*w*0.5,h);
    g.addColorStop(0,'rgba(6,6,12,0.65)'); g.addColorStop(0.5,'rgba(10,6,18,0.45)'); g.addColorStop(1,'rgba(2,2,8,0.8)');
    ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
    const rg = ctx.createRadialGradient(w*0.8,h*0.15,0,w*0.8,h*0.15,500);
    rg.addColorStop(0,'rgba(0,240,255,0.06)'); rg.addColorStop(1,'rgba(255,0,200,0)');
    ctx.fillStyle = rg; ctx.fillRect(0,0,w,h);
    for(const p of points){ p.step(); p.draw(); }
    for(let i=0;i<points.length;i++){
      for(let j=i+1;j<points.length;j++){
        const a=points[i], b=points[j];
        const dx=a.x-b.x, dy=a.y-b.y; const d=dx*dx+dy*dy;
        if(d<7000){
          const alpha = Math.min(0.06,(7000-d)/7000*0.06);
          ctx.strokeStyle = `rgba(110,231,183,${alpha})`;
          ctx.lineWidth = 0.4; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
        }
      }
    }
    requestAnimationFrame(frame);
  }
  frame();
})();
