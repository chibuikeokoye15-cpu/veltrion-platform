import assert from 'node:assert/strict';
import handler from '../api/market.js';

const ids = ['bitcoin','ethereum','tether','binancecoin','solana','ripple','dogecoin','cardano'];
const symbols = ['BTC','ETH','USDT','BNB','SOL','XRP','DOGE','ADA'];
const pairs = ['BTCUSDT','ETHUSDT','BNBUSDT','SOLUSDT','XRPUSDT','DOGEUSDT','ADAUSDT'];
const originalFetch = globalThis.fetch;
function responseHarness() {
  return { headers: {}, setHeader(k,v){this.headers[k]=v;}, status(n){this.statusCode=n;return this;}, json(v){this.body=v;return this;} };
}
function coinGeckoRows() {
  return ids.map((id,i)=>({id,symbol:symbols[i].toLowerCase(),current_price:i+1,price_change_percentage_24h:i-2}));
}
function binanceRows() {
  return pairs.map((symbol,i)=>({symbol,lastPrice:String(i+10),priceChangePercent:String(i-3)}));
}
try {
  // Primary provider success: all eight assets returned and response is cacheable.
  globalThis.fetch = async () => new Response(JSON.stringify(coinGeckoRows()), {status:200,headers:{'content-type':'application/json'}});
  let res = responseHarness(); await handler({method:'GET'},res);
  assert.equal(res.statusCode,200); assert.equal(res.body.provider,'CoinGecko'); assert.equal(res.body.data.length,8);
  assert.ok(res.headers['Cache-Control']); assert.ok(res.body.updatedAt);

  // Fallback provider success when CoinGecko is blocked; USDT is explicitly treated as a $1 peg reference.
  globalThis.fetch = async url => {
    if (String(url).includes('coingecko')) return new Response('blocked',{status:403});
    return new Response(JSON.stringify(binanceRows()), {status:200,headers:{'content-type':'application/json'}});
  };
  res = responseHarness(); await handler({method:'GET'},res);
  assert.equal(res.statusCode,200); assert.equal(res.body.provider,'Binance'); assert.equal(res.body.data.length,8);
  assert.equal(res.body.data.find(row=>row.symbol==='USDT').price,1);
  assert.equal(res.body.data.find(row=>row.symbol==='BTC').price,10);

  // Invalid request method is rejected before calling any provider.
  globalThis.fetch = async () => { throw new Error('fetch must not run for a POST'); };
  res = responseHarness(); await handler({method:'POST'},res); assert.equal(res.statusCode,405);

  // Failure of both providers returns 503 rather than inventing market quotes.
  globalThis.fetch = async () => new Response('blocked',{status:403});
  res = responseHarness(); await handler({method:'GET'},res); assert.equal(res.statusCode,503);
  assert.match(res.body.error,/temporarily unavailable/i);
  console.log('Market API smoke tests passed: CoinGecko success, Binance fallback, method guard, and honest 503 on provider failure.');
} finally { globalThis.fetch = originalFetch; }
