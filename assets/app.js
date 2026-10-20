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
if ('IntersectionObserver' in window) { const io = new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.08,rootMargin:'0px 0px -7% 0px'}); revealEls.forEach(el=>io.observe(el)); } else revealEls.forEach(el=>el.classList.add('visible'));
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


// Live market data: refresh automatically every 60 seconds, with a second public
// provider as fallback. Values remain explicitly labelled as preview if both fail.
const liveMarketAssets = [
  { symbol: 'BTC', id: 'bitcoin', binance: 'BTCUSDT' },
  { symbol: 'ETH', id: 'ethereum', binance: 'ETHUSDT' },
  { symbol: 'USDT', id: 'tether', binance: null },
  { symbol: 'BNB', id: 'binancecoin', binance: 'BNBUSDT' },
  { symbol: 'SOL', id: 'solana', binance: 'SOLUSDT' },
  { symbol: 'XRP', id: 'ripple', binance: 'XRPUSDT' },
  { symbol: 'DOGE', id: 'dogecoin', binance: 'DOGEUSDT' },
  { symbol: 'ADA', id: 'cardano', binance: 'ADAUSDT' },
];
(async function liveMarketController() {
  const statusLabels = document.querySelectorAll('[data-market-data-status]');
  const noteLabels = document.querySelectorAll('[data-market-demo-note]');
  const setStatus = text => statusLabels.forEach(el => { el.textContent = text; });
  const setNote = text => noteLabels.forEach(el => { el.textContent = text; });
  const money = value => new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: Number(value) < 1 ? 3 : 2,
    maximumFractionDigits: Number(value) < 1 ? 6 : 2
  }).format(Number(value));
  const changeText = value => `${Number(value) >= 0 ? '+' : ''}${Number(value).toFixed(2)}%`;
  const setChange = (element, value) => {
    if (!element) return;
    element.textContent = changeText(value);
    element.classList.toggle('down', Number(value) < 0);
    element.classList.toggle('negative', Number(value) < 0);
    element.classList.toggle('positive', Number(value) >= 0);
  };
  async function fetchWithTimeout(url, timeoutMs = 9000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { signal: controller.signal, cache: 'no-store', headers: { accept: 'application/json' } });
      if (!response.ok) throw new Error(`Market provider returned HTTP ${response.status}`);
      return await response.json();
    } finally { clearTimeout(timer); }
  }
  async function getMarketData() {
    // Prefer our same-origin Vercel function to avoid browser CORS/provider limits.
    // Direct public-provider calls remain a fallback if the function is unavailable.
    try {
      const response = await fetchWithTimeout('/api/market', 9000);
      if (Array.isArray(response.data) && response.data.length === liveMarketAssets.length) {
        return { bySymbol: new Map(response.data.map(row => [String(row.symbol).toUpperCase(), { price: Number(row.price), change: Number(row.change24h) }])), source: response.provider || 'VELTRION market API' };
      }
      throw new Error('VELTRION market API returned incomplete data');
    } catch (apiError) {
      const ids = liveMarketAssets.map(a => a.id).join(',');
      try {
        const rows = await fetchWithTimeout(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${encodeURIComponent(ids)}&price_change_percentage=24h`);
        if (!Array.isArray(rows) || !rows.length) throw new Error('CoinGecko returned no rows');
        const byId = new Map(rows.map(row => [row.id, { symbol: String(row.symbol).toUpperCase(), price: Number(row.current_price), change: Number(row.price_change_percentage_24h ?? 0) }]));
        if (liveMarketAssets.some(asset => !byId.get(asset.id)?.price)) throw new Error('CoinGecko response was incomplete');
        return { bySymbol: new Map([...byId.values()].map(row => [row.symbol, row])), source: 'CoinGecko direct fallback' };
      } catch (firstError) {
        const symbols = liveMarketAssets.filter(a => a.binance).map(a => a.binance);
        const data = await fetchWithTimeout(`https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(symbols))}`);
        if (!Array.isArray(data) || !data.length) throw firstError || apiError;
        const byPair = new Map(data.map(row => [row.symbol, { price: Number(row.lastPrice), change: Number(row.priceChangePercent || 0) }]));
        const bySymbol = new Map();
        for (const asset of liveMarketAssets) {
          if (!asset.binance && asset.symbol === 'USDT') { bySymbol.set('USDT', { price: 1, change: 0 }); continue; }
          const row = byPair.get(asset.binance);
          if (row && Number.isFinite(row.price) && row.price > 0) bySymbol.set(asset.symbol, row);
        }
        if (bySymbol.size < liveMarketAssets.length) throw firstError || apiError;
        return { bySymbol, source: 'Binance direct fallback' };
      }
    }
  }
  function applyLiveData(bySymbol) {
    document.querySelectorAll('.ticker-item').forEach(item => {
      const symbol = item.querySelector('b')?.textContent?.trim().toUpperCase();
      const coin = bySymbol.get(symbol); if (!coin) return;
      let price = item.querySelector('.ticker-live-price');
      if (!price) { price = document.createElement('small'); price.className = 'ticker-live-price'; item.insertBefore(price, item.querySelector('strong')); }
      price.textContent = money(coin.price);
      setChange(item.querySelector('strong'), coin.change);
      item.dataset.marketSource = 'live';
      item.title = `Live price ${money(coin.price)}; 24-hour change ${changeText(coin.change)}`;
    });
    document.querySelectorAll('.coin-marquee-card').forEach(item => {
      const symbol = item.querySelector('small')?.textContent?.split('·')[0]?.trim().toUpperCase();
      const coin = bySymbol.get(symbol); if (!coin) return;
      item.querySelector('small').textContent = `${symbol} · ${money(coin.price)}`;
      setChange(item.querySelector('em'), coin.change);
    });
    document.querySelectorAll('.asset-card').forEach(card => {
      const symbol = card.querySelector('.asset-card-top small')?.textContent?.trim().toUpperCase();
      const coin = bySymbol.get(symbol); if (!coin) return;
      const price = card.querySelector('.asset-price'); if (price) price.textContent = money(coin.price);
      const change = card.querySelector('.asset-change');
      if (change) {
        change.firstChild.textContent = `${coin.change < 0 ? '↘' : '↗'} ${changeText(coin.change)} `;
        change.classList.toggle('down', coin.change < 0);
        const note = change.querySelector('span'); if (note) note.textContent = 'live 24h change';
      }
      const foot = card.querySelector('.asset-card-footer span:last-child'); if (foot) foot.textContent = 'Live market data';
    });
    document.querySelectorAll('.market-row').forEach(row => {
      const symbol = row.querySelector('.market-asset-cell small')?.textContent?.trim().toUpperCase();
      const coin = bySymbol.get(symbol); if (!coin) return;
      const price = row.querySelector(':scope > strong'); if (price) price.textContent = money(coin.price);
      setChange(row.querySelector(':scope > span'), coin.change);
    });
  }
  let refreshInProgress = false;
  async function refresh() {
    if (refreshInProgress || !document.visibilityState || document.visibilityState === 'hidden') return;
    refreshInProgress = true;
    setStatus('Connecting to live market data…');
    try {
      const result = await getMarketData();
      applyLiveData(result.bySymbol);
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setStatus(`Live prices connected · updated ${time}`);
      setNote(`Live market data from ${result.source}; refreshed every 60 seconds. Prices may be delayed.`);
      document.querySelectorAll('[data-market-demo-note]').forEach(el => { el.dataset.marketState = 'live'; });
    } catch (error) {
      setStatus('Live market data unavailable — preview values are shown.');
      setNote('Could not reach the market providers. Displayed figures are illustrative preview values, not current quotes. The page will retry automatically.');
      document.querySelectorAll('[data-market-demo-note]').forEach(el => { el.dataset.marketState = 'preview'; });
    } finally { refreshInProgress = false; }
  }
  await refresh();
  window.setInterval(refresh, 60_000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refresh(); });
})();

// Market Explorer search: filter the already-rendered asset rows without reloading the page.
const marketSearch = document.getElementById('marketSearch');
if (marketSearch && marketRows) {
  const count = document.getElementById('marketSearchCount');
  const filterRows = () => {
    const query = marketSearch.value.trim().toLowerCase();
    const rows = [...marketRows.querySelectorAll('.market-row')];
    let visible = 0;
    rows.forEach(row => {
      const match = row.textContent.toLowerCase().includes(query);
      row.hidden = !match; if (match) visible++;
    });
    if (count) count.textContent = `Showing ${visible} of ${rows.length} assets`;
  };
  marketSearch.addEventListener('input', filterRows); filterRows();
}

// Enhanced market terminal: CoinGecko market metrics + exchange OHLC candles.
(function initMarketTerminal(){
 const canvas=document.getElementById('marketCandles'); if(!canvas)return;
 const $=id=>document.getElementById(id); const fmtUsd=n=>Number.isFinite(Number(n))?new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:Number(n)<1?5:2}).format(Number(n)):'—';
 const compact=n=>Number.isFinite(Number(n))?new Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:2}).format(Number(n)):'—';
 const ids='bitcoin,ethereum,tether,binancecoin,solana,ripple,dogecoin,cardano'; const symbolInfo={BTC:{id:'bitcoin',name:'Bitcoin',coinId:1},ETH:{id:'ethereum',name:'Ethereum',coinId:1027},USDT:{id:'tether',name:'Tether',coinId:825},BNB:{id:'binancecoin',name:'BNB',coinId:1839},SOL:{id:'solana',name:'Solana',coinId:5426},XRP:{id:'ripple',name:'XRP',coinId:52},DOGE:{id:'dogecoin',name:'Dogecoin',coinId:74},ADA:{id:'cardano',name:'Cardano',coinId:2010}};
 let marketData=[];let candles=[];let candleInterval='1h';let selectedPair='BTCUSDT';
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function renderMarketRows(){const box=$('marketRows');if(!box)return;box.innerHTML=marketData.map((a,i)=>{const change=Number(a.price_change_percentage_24h||0);return `<div class="market-row" data-symbol="${a.symbol}"><div class="market-asset-cell"><img src="https://s2.coinmarketcap.com/static/img/coins/64x64/${symbolInfo[a.symbol]?.coinId||1}.png" alt="${escape(a.name)} logo" loading="lazy"><span><b>${escape(a.name)}</b><small>${escape(a.symbol)}</small></span></div><strong>${fmtUsd(a.current_price)}</strong><span class="${change<0?'negative':'positive'}">${change>=0?'+':''}${change.toFixed(2)}%</span><span class="market-cap-cell">${fmtUsd(a.market_cap)}<small>Market cap</small></span><span class="market-volume-cell">${fmtUsd(a.total_volume)}<small>24h volume</small></span></div>`}).join(''); const search=$('marketSearch');const count=$('marketSearchCount');function filter(){const q=(search?.value||'').trim().toLowerCase();let n=0;box.querySelectorAll('.market-row').forEach(r=>{const yes=r.textContent.toLowerCase().includes(q);r.hidden=!yes;if(yes)n++});if(count)count.textContent=`Showing ${n} of ${marketData.length} assets`;}if(search){search.oninput=filter;filter()}}
 function renderVolume(){const box=$('volumeAnalysis');if(!box)return;const rows=[...marketData].sort((a,b)=>(b.total_volume||0)-(a.total_volume||0));const max=Math.max(1,...rows.map(a=>Number(a.total_volume)||0));box.innerHTML=rows.map(a=>{const pct=Math.max(1,(Number(a.total_volume||0)/max)*100);return `<article class="volume-row"><div class="volume-row-top"><div class="volume-asset"><img src="https://s2.coinmarketcap.com/static/img/coins/64x64/${symbolInfo[a.symbol]?.coinId||1}.png" alt="" loading="lazy"><div><b>${escape(a.name)}</b><small>${escape(a.symbol)} · 24H ACTIVITY</small></div></div><div class="volume-amount">${fmtUsd(a.total_volume)}<small>${pct.toFixed(1)}% of top asset volume</small></div></div><div class="volume-track"><i style="width:${pct}%"></i></div></article>`}).join('')}
 async function loadMarket(){try{const r=await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids='+ids+'&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h',{cache:'no-store'});if(!r.ok)throw Error('Market metrics provider unavailable');const data=await r.json();if(!Array.isArray(data)||data.length<6)throw Error('Incomplete market response');marketData=data.map(a=>({...a,symbol:String(a.symbol).toUpperCase()}));renderMarketRows();renderVolume();$('metricAssets').textContent=String(data.length);$('metricCap').textContent=compact(data.reduce((s,a)=>s+(Number(a.market_cap)||0),0));$('metricVolume').textContent=compact(data.reduce((s,a)=>s+(Number(a.total_volume)||0),0));const up=data.filter(a=>Number(a.price_change_percentage_24h)>=0).length;$('metricBreadth').textContent=`${up} / ${data.length} up`;const selected=marketData.find(a=>a.symbol===selectedPair.slice(0,-4));if(selected){$('chartPrice').textContent=fmtUsd(selected.current_price);$('chartChange').textContent=`${Number(selected.price_change_percentage_24h)>=0?'+':''}${Number(selected.price_change_percentage_24h).toFixed(2)}%`;}$('chartSource').textContent='Price snapshot from CoinGecko public API; exchange candles shown below.';document.querySelectorAll('[data-market-demo-note]').forEach(el=>el.textContent='Market cap and volume snapshot from CoinGecko. Values may be delayed.');}catch(e){$('metricCap').textContent='Unavailable';$('metricVolume').textContent='Unavailable';$('metricBreadth').textContent='Unavailable';$('chartStatus').textContent='Market metrics unavailable; retrying on next refresh.';document.querySelectorAll('[data-market-demo-note]').forEach(el=>el.textContent='Provider unavailable. Metrics are not fabricated; retry later.');}}
 function drawChart(){const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;const dpr=window.devicePixelRatio||1;canvas.width=Math.floor(rect.width*dpr);canvas.height=Math.floor(rect.height*dpr);const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);const w=rect.width,h=rect.height;ctx.clearRect(0,0,w,h);ctx.fillStyle='#09162b';ctx.fillRect(0,0,w,h);const left=8,right=66,top=16,priceBottom=h*.72,volTop=h*.79,bottom=h-22,plotW=w-left-right,plotH=priceBottom-top;if(!candles.length){ctx.fillStyle='#8da5c8';ctx.font='12px sans-serif';ctx.fillText('Waiting for candlestick data…',left+10,h/2);return}const lo=Math.min(...candles.map(c=>c.low)),hi=Math.max(...candles.map(c=>c.high)),span=hi-lo||1,maxVol=Math.max(...candles.map(c=>c.volume),1);ctx.font='10px sans-serif';ctx.textAlign='right';for(let i=0;i<=4;i++){const y=top+plotH*i/4;ctx.strokeStyle='rgba(131,163,215,.13)';ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(w-right+6,y);ctx.stroke();ctx.fillStyle='#8499bb';ctx.fillText(fmtUsd(hi-span*i/4),w-7,y+3)}const step=plotW/candles.length,cw=Math.max(2,Math.min(9,step*.58));candles.forEach((c,i)=>{const x=left+i*step+step/2,yo=top+(hi-c.open)/span*plotH,yc=top+(hi-c.close)/span*plotH,yh=top+(hi-c.high)/span*plotH,yl=top+(hi-c.low)/span*plotH;const up=c.close>=c.open;ctx.strokeStyle=up?'#55dcb0':'#ff7896';ctx.fillStyle=up?'#55dcb0':'#ff7896';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,yh);ctx.lineTo(x,yl);ctx.stroke();ctx.fillRect(x-cw/2,Math.min(yo,yc),cw,Math.max(1,Math.abs(yc-yo)));const vh=(c.volume/maxVol)*(bottom-volTop);ctx.globalAlpha=.55;ctx.fillStyle=up?'#3eae9b':'#c76580';ctx.fillRect(x-cw/2,bottom-vh,cw,vh);ctx.globalAlpha=1});ctx.textAlign='left';ctx.fillStyle='#7f95b7';ctx.fillText('PRICE',left,11);ctx.fillText('VOLUME',left,volTop-5);ctx.textAlign='center';const labels=[0,Math.floor(candles.length/3),Math.floor(candles.length*2/3),candles.length-1];labels.forEach(i=>{const c=candles[i];if(!c)return;ctx.fillStyle='#8499bb';ctx.fillText(new Date(c.time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),left+i*step+step/2,h-5)});}
 async function loadCandles(){const pair=$('chartAsset').value;selectedPair=pair;$('chartTitle').innerHTML=escape((pair==='BTCUSDT'?'Bitcoin':pair==='ETHUSDT'?'Ethereum':pair==='BNBUSDT'?'BNB':pair==='SOLUSDT'?'Solana':pair==='XRPUSDT'?'XRP':pair==='DOGEUSDT'?'Dogecoin':'Cardano'))+' <span>'+pair.replace('USDT',' / USDT')+'</span>';$('chartStatus').textContent='Loading exchange candles…';try{const url=`https://api.binance.com/api/v3/klines?symbol=${pair}&interval=${candleInterval}&limit=100`;const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error('Exchange candles unavailable');const data=await r.json();candles=data.map(k=>({time:Number(k[0]),open:Number(k[1]),high:Number(k[2]),low:Number(k[3]),close:Number(k[4]),volume:Number(k[5])}));if(!candles.length)throw Error('No candles returned');const last=candles[candles.length-1];$('chartPrice').textContent=fmtUsd(last.close);$('chartStatus').textContent=`${candles.length} candles · Binance public data · ${new Date(last.time).toLocaleTimeString()}`;drawChart()}catch(e){candles=[];drawChart();$('chartStatus').textContent='Candlestick provider unavailable. Check connection or try again later.'}}
 $('chartAsset').addEventListener('change',()=>{const sym=$('chartAsset').value.replace('USDT','');const item=marketData.find(a=>a.symbol===sym);if(item){$('chartPrice').textContent=fmtUsd(item.current_price);$('chartChange').textContent=`${Number(item.price_change_percentage_24h)>=0?'+':''}${Number(item.price_change_percentage_24h).toFixed(2)}%`;}loadCandles()});document.querySelectorAll('[data-interval]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-interval]').forEach(x=>x.classList.remove('active'));b.classList.add('active');candleInterval=b.dataset.interval;loadCandles()}));canvas.addEventListener('mousemove',e=>{if(!candles.length)return;const rect=canvas.getBoundingClientRect(),x=e.clientX-rect.left,idx=Math.max(0,Math.min(candles.length-1,Math.floor((x-8)/(rect.width-74)*candles.length))),c=candles[idx],tip=$('chartTooltip');tip.hidden=false;tip.style.left=Math.min(Math.max(8,x+12),rect.width-180)+'px';tip.style.top='12px';tip.innerHTML=`${new Date(c.time).toLocaleString()}<br>O ${fmtUsd(c.open)} · H ${fmtUsd(c.high)}<br>L ${fmtUsd(c.low)} · C ${fmtUsd(c.close)}<br>Volume ${Number(c.volume).toLocaleString(undefined,{maximumFractionDigits:3})}`});canvas.addEventListener('mouseleave',()=>$('chartTooltip').hidden=true);new ResizeObserver(drawChart).observe(canvas);loadMarket();loadCandles();setInterval(()=>{loadMarket();loadCandles()},60000);
})();

// Persistent Supabase session-aware navigation: home/profile links do not force a second login.
import('./supabase-client.js').then(({supabase,supabaseConfigured})=>{if(!supabaseConfigured||!supabase)return;const update=async session=>{document.querySelectorAll('[data-auth-nav="login"],[data-auth-nav="signup"],[data-auth-nav="account"]').forEach(a=>{a.hidden=a.dataset.authNav==='account'?!session:a.dataset.authNav==='login'||a.dataset.authNav==='signup'?Boolean(session):false});};supabase.auth.getSession().then(({data})=>update(data.session));supabase.auth.onAuthStateChange((_event,session)=>update(session));}).catch(()=>{});

// One-time support invitation: appears 15 seconds after entry, then leaves after 15 seconds.
// A soft two-note 'tu-tu-dum' chime is synthesized locally (no audio file or tracking).
(function supportInvitation(){
 const panel=document.getElementById('supportPopover');
 if(!panel)return;
 let dismissed=false,hideTimer=null,audioContext=null,audioReady=false;
 try{dismissed=sessionStorage.getItem('veltrion-support-dismissed')==='1'}catch{}
 if(dismissed)return;
 // Browsers often block sound until a visitor interacts. Prepare audio after the first gesture.
 const primeAudio=()=>{
  if(audioReady)return;
  try{const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;audioContext=new Ctx();if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});audioReady=true;}catch{}
 };
 window.addEventListener('pointerdown',primeAudio,{once:true,passive:true});
 window.addEventListener('keydown',primeAudio,{once:true});
 const playChime=()=>{
  if(!audioContext||audioContext.state!=='running')return;
  try{const now=audioContext.currentTime;
   [[659.25,0,0.16],[783.99,0.16,0.2],[987.77,0.34,0.25]].forEach(([freq,delay,duration])=>{
    const osc=audioContext.createOscillator(),gain=audioContext.createGain();
    osc.type='sine';osc.frequency.setValueAtTime(freq,now+delay);
    gain.gain.setValueAtTime(0.0001,now+delay);gain.gain.exponentialRampToValueAtTime(0.11,now+delay+0.025);gain.gain.exponentialRampToValueAtTime(0.0001,now+delay+duration);
    osc.connect(gain);gain.connect(audioContext.destination);osc.start(now+delay);osc.stop(now+delay+duration+0.03);
   });
  }catch{}
 };
 const close=()=>{panel.hidden=true;try{sessionStorage.setItem('veltrion-support-dismissed','1')}catch{};clearTimeout(hideTimer);};
 document.getElementById('supportClose')?.addEventListener('click',close);
 setTimeout(()=>{let alreadyDismissed=false;try{alreadyDismissed=sessionStorage.getItem('veltrion-support-dismissed')==='1'}catch{};if(alreadyDismissed)return;panel.hidden=false;if(audioContext&&audioContext.state==='suspended')audioContext.resume().then(playChime).catch(()=>{});else playChime();hideTimer=setTimeout(close,15000)},15000);
})();
