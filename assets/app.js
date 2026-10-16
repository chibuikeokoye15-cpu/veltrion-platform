const assets = [
  {name:'Bitcoin',symbol:'BTC',id:1,price:67432.21,change:2.31,glow:'rgba(255,157,49,.25)'},
  {name:'Ethereum',symbol:'ETH',id:1027,price:3245.18,change:1.87,glow:'rgba(132,145,255,.25)'},
  {name:'Tether',symbol:'USDT',id:825,price:1.00,change:0.01,glow:'rgba(45,222,165,.23)'},
  {name:'BNB',symbol:'BNB',id:1839,price:589.32,change:2.14,glow:'rgba(255,201,59,.22)'},
  {name:'Solana',symbol:'SOL',id:5426,price:152.76,change:3.42,glow:'rgba(154,101,255,.24)'},
  {name:'XRP',symbol:'XRP',id:52,price:.53,change:1.96,glow:'rgba(120,196,255,.2)'},
  {name:'Dogecoin',symbol:'DOGE',id:74,price:.164,change:-.82,glow:'rgba(255,220,107,.2)'},
  {name:'Cardano',symbol:'ADA',id:2010,price:.452,change:1.12,glow:'rgba(75,133,255,.22)'}
];
const logo = a => `https://s2.coinmarketcap.com/static/img/coins/64x64/${a.id}.png`;
const fmt = n => n >= 1000 ? '$'+n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}) : n >= 1 ? '$'+n.toFixed(2) : '$'+n.toFixed(3);
const pct = n => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
const coinMarkup = a => `<div class="ticker-item"><img src="${logo(a)}" alt="${a.name} logo"><span><b>${a.symbol}</b><small>${a.name}</small></span><strong class="${a.change<0?'down':''}">${pct(a.change)}</strong></div>`;
const ticker = document.getElementById('tickerTrack');
if (ticker) ticker.innerHTML = [...assets,...assets].map(coinMarkup).join('');
const marquee = document.getElementById('coinMarquee');
if (marquee) marquee.innerHTML = [...assets,...assets].map(a=>`<div class="coin-marquee-card"><img src="${logo(a)}" alt="${a.name} cryptocurrency logo"><div><b>${a.name}</b><small>${a.symbol} · preview value</small></div><em class="${a.change<0?'down':''}">${pct(a.change)}</em></div>`).join('');
const grid = document.getElementById('assetGrid');
if (grid) grid.innerHTML = assets.map((a,i)=>`<article class="asset-card" style="--asset-glow:${a.glow}"><div class="asset-card-top"><img src="${logo(a)}" alt="${a.name} logo"><div><b>${a.name}</b><small>${a.symbol}</small></div><span class="asset-badge">${i<3?'POPULAR':'EXPLORE'}</span></div><div class="asset-price">${fmt(a.price)}</div><div class="asset-change ${a.change<0?'down':''}">${a.change<0?'↘':'↗'} ${pct(a.change)} <span>illustrative 24h move</span></div><svg class="asset-spark" viewBox="0 0 250 42" preserveAspectRatio="none"><defs><linearGradient id="spark${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a.change<0?'#ff799f':'#54d9ff'}" stop-opacity=".27"/><stop offset="1" stop-color="${a.change<0?'#ff799f':'#54d9ff'}" stop-opacity="0"/></linearGradient></defs><path d="${sparkPath(i,a.change<0)} L250 42 L0 42Z" fill="url(#spark${i})"/><path d="${sparkPath(i,a.change<0)}" fill="none" stroke="${a.change<0?'#ff799f':'#64e1ff'}" stroke-width="2" stroke-linecap="round"/></svg><div class="asset-card-footer"><span>MARKET SNAPSHOT</span><span>Demo values · Not live</span></div></article>`).join('');
function sparkPath(seed,down){let pts=[];let y=23;for(let x=0;x<=250;x+=25){y += Math.sin((x+seed*17)/18)*5 + Math.cos((x+seed*9)/13)*3 + (down?1.1:-.7);y=Math.max(4,Math.min(37,y));pts.push(`${x===0?'M':'L'}${x} ${y.toFixed(1)}`)}return pts.join(' ')}
// Reveal sections as they enter the viewport.
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) { const io = new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.12}); revealEls.forEach(el=>io.observe(el)); } else revealEls.forEach(el=>el.classList.add('visible'));
// Mobile navigation
const toggle = document.querySelector('.menu-toggle');
if(toggle) toggle.addEventListener('click',()=>document.querySelector('.nav-links')?.classList.toggle('open'));
// Keep newsletter UI honest in preview mode.
const form=document.getElementById('newsletterForm');
if(form) form.addEventListener('submit',e=>{e.preventDefault();const msg=document.getElementById('newsletterMsg');if(msg)msg.textContent='Thanks — newsletter signup is a preview only; no email was stored.';const toast=document.getElementById('toast');if(toast){toast.textContent='Preview only: newsletter service is not connected.';toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),3200)}form.reset()});
// Admin-only local demonstration ledger. Never use localStorage for production financial records.
(function initAdminDemo(){
 const accounts=[
  {id:'DEMO-1001',name:'Avery Morgan',balances:{BTC:0.025,ETH:0.8,USDT:1250,SOL:4.5,BNB:0.3,XRP:125}},
  {id:'DEMO-1002',name:'Jordan Lee',balances:{BTC:0.008,ETH:1.25,USDT:420,SOL:2.1,BNB:0.12,XRP:600}},
  {id:'DEMO-1003',name:'Taylor Quinn',balances:{BTC:0.041,ETH:0.2,USDT:90,SOL:8.2,BNB:0.7,XRP:45}},
  {id:'DEMO-1004',name:'Riley Chen',balances:{BTC:0.002,ETH:2.4,USDT:3150,SOL:1.6,BNB:0.08,XRP:900}}
 ];
 const key='veltrion_admin_demo_ledger_v2';
 if(!document.getElementById('previewAdjustment')) return;
 let state;try{state=JSON.parse(localStorage.getItem(key)||'null')}catch{};
 if(!state||!Array.isArray(state.accounts)){state={accounts,events:[{time:new Date().toLocaleString(),event:'Demo workspace opened',detail:'Local-only preview ledger initialized'}]};persist()}
 function persist(){localStorage.setItem(key,JSON.stringify(state))}
 function log(event,detail){state.events.unshift({time:new Date().toLocaleString(),event,detail});state.events=state.events.slice(0,100);persist();renderAudit()}
 function renderBalances(){const box=document.getElementById('customerBalances');if(!box)return;box.innerHTML=state.accounts.map(a=>`<div class="customer-balance-row"><div><b>${a.name}</b><small>${a.id}</small></div><strong>${Object.keys(a.balances).length} assets</strong><div class="balance-assets">${Object.entries(a.balances).map(([s,q])=>`<span>${s}: ${Number(q).toLocaleString('en-US',{maximumFractionDigits:8})}</span>`).join('')}</div></div>`).join('')}
 function renderAudit(){const body=document.getElementById('auditRows');if(!body)return;body.innerHTML=state.events.map(e=>`<tr><td>${escapeHtml(e.time)}</td><td>${escapeHtml(e.event)}</td><td>${escapeHtml(e.detail)}</td></tr>`).join('')}
 function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
 renderBalances();renderAudit();
 document.getElementById('previewAdjustment').addEventListener('click',()=>{
  const id=document.getElementById('accountRef').value,symbol=document.getElementById('assetSelect').value,qty=Number(document.getElementById('assetQty').value),reason=document.getElementById('adjustReason').value.trim(),result=document.getElementById('adjustmentResult');
  if(!Number.isFinite(qty)||qty<=0){result.className='admin-result error';result.textContent='Enter a quantity greater than zero.';return}
  if(!reason){result.className='admin-result error';result.textContent='Enter a reason or demo reference before crediting the balance.';return}
  const account=state.accounts.find(a=>a.id===id);if(!account){result.className='admin-result error';result.textContent='Demo account not found.';return}
  const before=Number(account.balances[symbol]||0);account.balances[symbol]=before+qty;
  const transaction={reference:'DEMO-CREDIT-'+Date.now().toString().slice(-8),accountId:id,asset:symbol,quantity:qty,previous:before,next:account.balances[symbol],reason};
  state.events.unshift({time:new Date().toLocaleString(),event:'Demo balance credited',detail:`${transaction.reference} · ${id} · +${qty} ${symbol} · ${reason}`});state.events=state.events.slice(0,100);persist();renderBalances();renderAudit();
  result.className='admin-result';result.textContent=`Preview credit recorded: ${qty} ${symbol} added to ${account.name} (${id}). New demo balance: ${account.balances[symbol].toLocaleString('en-US',{maximumFractionDigits:8})} ${symbol}. This change exists only in this browser.`;
  document.getElementById('assetQty').value='';document.getElementById('adjustReason').value='';
 });
 document.querySelectorAll('[data-review]').forEach(button=>button.addEventListener('click',()=>{const type=button.dataset.review,id=button.dataset.id;const status=type==='deposit'?'Marked for manual review in demo':'Withdrawal marked for review in demo';log(type==='deposit'?'Demo deposit reviewed':'Demo withdrawal reviewed',`${id} · ${status}`);button.textContent='Reviewed (demo)';button.disabled=true;button.style.opacity='.6';const toast=document.getElementById('toast');if(toast){toast.textContent='Demo action recorded locally. No funds moved.';toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),3000)}}));
 const save=document.getElementById('saveMarketSettings');if(save)save.addEventListener('click',()=>{const mode=document.getElementById('marketMode').value,movement=document.getElementById('movement').value;localStorage.setItem('veltrion_market_demo_settings',JSON.stringify({mode,movement}));document.getElementById('marketSettingsMsg').textContent=`Saved locally: ${mode}; ${movement}. These settings affect only this browser preview, not customer-facing market data.`;log('Demo market settings changed',`${mode} · ${movement}`)});
})();
// Reusable market explorer rows, using recognizable branded asset logos.
const marketRows=document.getElementById('marketRows');
if(marketRows){marketRows.innerHTML=assets.map((a,i)=>`<div class="market-row"><div class="market-asset-cell"><img src="${logo(a)}" alt="${a.name} logo"><span><b>${a.name}</b><small>${a.symbol}</small></span></div><strong>${fmt(a.price)}</strong><span class="${a.change<0?'negative':'positive'}">${pct(a.change)}</span><span class="mini-bar"><i style="width:${Math.max(15,Math.min(95,48+a.change*12))}%;background:${a.change<0?'#ff799f':'linear-gradient(90deg,#4e9fff,#5ff0db)'}"></i></span><a class="text-link" href="signup.html">Explore ↗</a></div>`).join('')}
