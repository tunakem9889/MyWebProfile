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


// End of app.js
// github-stats.js
// Requires: USER constant (your GitHub username) defined earlier or set here:
const GH_USER = 'tunakem9889'; // <-- đổi nếu cần
// Optionally set a GitHub token to increase rate limit and enable some search endpoints
// Create a Personal Access Token (no scopes required for public data) and paste below.
// If you don't want to put token in client side, skip it (but you may hit rate limits).
const GH_TOKEN = null; // 'ghp_XXXX' or null

// helper fetch with optional token
async function ghFetch(url){
  const headers = { 'Accept': 'application/vnd.github.v3+json' };
  if(GH_TOKEN) headers['Authorization'] = `token ${GH_TOKEN}`;
  const r = await fetch(url, { headers });
  if(!r.ok) {
    const txt = await r.text().catch(()=>r.statusText);
    throw new Error(`GitHub API error ${r.status}: ${txt}`);
  }
  return r;
}

// main function
async function loadGitHubStats(){
  const containerPrefix = 'gh-';
  const el = id => document.getElementById(id);

  try {
    // 1) fetch repos
    const reposRes = await ghFetch(`https://api.github.com/users/${GH_USER}/repos?per_page=100&sort=updated`);
    const repos = await reposRes.json();

    // total stars (sum)
    const totalStars = repos.reduce((s,r)=> s + (r.stargazers_count||0), 0);
    el(containerPrefix + 'total-stars').textContent = totalStars;

    // 2) languages: fetch /languages per repo and aggregate bytes
    const langTotals = {};
    await Promise.all(repos.map(async repo => {
      try {
        const r = await ghFetch(repo.languages_url);
        const langs = await r.json();
        Object.entries(langs).forEach(([l,bytes])=>{
          langTotals[l] = (langTotals[l]||0) + bytes;
        });
      } catch(e) {
        console.warn('languages fetch failed for', repo.name, e);
      }
    }));
    // build list sorted
    const totalBytes = Object.values(langTotals).reduce((a,b)=>a+b, 0) || 1;
    const langEntries = Object.entries(langTotals).sort((a,b)=> b[1]-a[1]).slice(0,8);
    // render bar & list
    const bar = el(containerPrefix + 'langs-bar');
    const list = el(containerPrefix + 'langs-list');
    if(bar && list){
      bar.innerHTML = '';
      list.innerHTML = '';
      const colors = ['#3b82f6','#f59e0b','#06b6d4','#8b5cf6','#ef4444','#06d6a0','#ff6bcb','#ffd166'];
      let left = 0;
      langEntries.forEach(([name,bytes],i)=>{
        const pct = Math.round((bytes/totalBytes)*100*100)/100;
        const span = document.createElement('span');
        span.style.width = pct + '%';
        span.style.background = colors[i % colors.length];
        span.title = `${name} ${pct}%`;
        bar.appendChild(span);

        const li = document.createElement('li');
        li.innerHTML = `<span class="color-dot" style="background:${colors[i % colors.length]}"></span> ${name} ${pct}%`;
        list.appendChild(li);
      });
    }

    // 3) total commits by this user: sum contributions from /contributors for each repo (find entry for GH_USER)
    let totalCommits = 0;
    await Promise.all(repos.map(async repo => {
      try {
        const r = await ghFetch(`https://api.github.com/repos/${GH_USER}/${repo.name}/contributors?per_page=100&anon=true`);
        // contributors endpoint includes contributions counts per contributor
        const contributors = await r.json();
        if(Array.isArray(contributors)){
          const me = contributors.find(c => c.login && c.login.toLowerCase() === GH_USER.toLowerCase());
          if(me) totalCommits += (me.contributions || 0);
        }
      } catch(e) {
        // ignore private/forbidden repos
      }
    }));
    el(containerPrefix + 'total-commits').textContent = totalCommits;

    // 4) total PRs & total Issues authored by user (uses search API — rate limited if unauthenticated)
    // We'll try search open+closed PRs/issues authored by user across GitHub:
    async function countSearch(q){
      try{
        const r = await ghFetch('https://api.github.com/search/issues?q=' + encodeURIComponent(q));
        const j = await r.json();
        return j.total_count || 0;
      }catch(e){
        console.warn('search failed', e);
        return 'N/A';
      }
    }

    const prsCount = await countSearch(`author:${GH_USER} type:pr`);
    const issuesCount = await countSearch(`author:${GH_USER} type:issue`);
    el(containerPrefix + 'total-prs').textContent = prsCount;
    el(containerPrefix + 'total-issues').textContent = issuesCount;

    // 5) contributed to (last year) & streaks: these require GraphQL contributionsCalendar or events scanning.
    // We'll compute a simple "contributed to (last year)" = number of distinct repos with at least one contribution in the last 365 days.
    const since = new Date(); since.setDate(since.getDate() - 365);
    const sinceIso = since.toISOString();
    let contributedRepos = new Set();
    // For each repo, fetch commits by author since date (may be heavy). We'll request commits endpoint for repo with author param
    await Promise.all(repos.map(async repo => {
      try{
        // This counts commits authored by GH_USER since `sinceIso` (may be paginated but we only need >0)
        const url = `https://api.github.com/repos/${repo.owner.login}/${repo.name}/commits?author=${GH_USER}&since=${sinceIso}&per_page=1`;
        const r = await ghFetch(url);
        if(r.status === 200){
          const arr = await r.json();
          if(Array.isArray(arr) && arr.length > 0) contributedRepos.add(repo.name);
        }
      }catch(e){
        // ignore
      }
    }));

    el(containerPrefix + 'contrib-last-year').textContent = contributedRepos.size;

    // 6) Streaks & total contributions (current & longest) require contribution calendar (GraphQL) for accuracy.
    // We'll put totals based on commits counted above (approx).
    el(containerPrefix + 'total-contrib').textContent = totalCommits;
    // If no GH_TOKEN provided we can't fetch contributionsCalendar — show N/A for streaks
    if(!GH_TOKEN){
      el(containerPrefix + 'current-streak').textContent = 'N/A';
      el(containerPrefix + 'longest-streak').textContent = 'N/A';
      el('gh-streak-note')?.classList?.add('visible');
    } else {
      // If token present, call GraphQL contributionsCalendar for streaks (implementation omitted here)
      // (You can request me to implement GraphQL call to compute streaks if you provide token)
      el(containerPrefix + 'current-streak').textContent = '—';
      el(containerPrefix + 'longest-streak').textContent = '—';
    }

  } catch(err){
    console.error('Failed to load GitHub stats', err);
    // show fallback
    ['total-stars','total-commits','total-prs','total-issues','contrib-last-year','total-contrib','current-streak','longest-streak'].forEach(id=>{
      const e = document.getElementById('gh-' + id);
      if(e) e.textContent = '—';
    });
  }
}

// attach to DOM ready
document.addEventListener('DOMContentLoaded', ()=> {
  // small helper to ensure target elements exist
  if(document.getElementById('gh-total-stars')) loadGitHubStats();
});
// End of github-stats.js