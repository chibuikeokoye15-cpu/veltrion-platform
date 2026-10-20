const ALLOWED_PAIRS = new Set(['BTCUSDT','ETHUSDT','BNBUSDT','SOLUSDT','XRPUSDT','DOGEUSDT','ADAUSDT']);
const ALLOWED_INTERVALS = new Set(['15m','1h','4h','1d']);
async function json(url, ms=6500){
  const c=new AbortController(); const t=setTimeout(()=>c.abort(),ms);
  try { const r=await fetch(url,{signal:c.signal,headers:{accept:'application/json'}}); if(!r.ok) throw new Error(`HTTP ${r.status}`); return await r.json(); }
  finally { clearTimeout(t); }
}
export default async function handler(req,res){
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Method not allowed'});}
  const pair=String(req.query?.symbol||'BTCUSDT').toUpperCase();
  const interval=String(req.query?.interval||'1h');
  const limit=Math.max(20,Math.min(150,Number(req.query?.limit)||100));
  if(!ALLOWED_PAIRS.has(pair)||!ALLOWED_INTERVALS.has(interval)) return res.status(400).json({error:'Unsupported pair or interval'});
  res.setHeader('Cache-Control','s-maxage=8, stale-while-revalidate=15');
  const hosts=['https://api.binance.com','https://api.binance.us']; const errors=[];
  for(const host of hosts){try{
    const rows=await json(`${host}/api/v3/klines?symbol=${pair}&interval=${interval}&limit=${limit}`);
    if(!Array.isArray(rows)||rows.length<10) throw new Error('Incomplete candle response');
    const candles=rows.map(k=>({time:Number(k[0]),open:Number(k[1]),high:Number(k[2]),low:Number(k[3]),close:Number(k[4]),volume:Number(k[5]),closeTime:Number(k[6]),quoteVolume:Number(k[7]),trades:Number(k[8])}));
    if(candles.some(k=>![k.time,k.open,k.high,k.low,k.close,k.volume].every(Number.isFinite)||k.open<=0||k.low<=0||k.high<=0||k.close<=0)) throw new Error('Invalid candle values');
    return res.status(200).json({provider:host.includes('binance.us')?'Binance.US':'Binance',symbol:pair,interval,updatedAt:new Date().toISOString(),candles});
  }catch(e){errors.push(`${host}: ${e?.message||'unavailable'}`)}}
  return res.status(503).json({error:'Candlestick providers are temporarily unavailable. Retry shortly; no sample candles are substituted.',providers:errors});
}
