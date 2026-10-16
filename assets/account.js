import { supabase, supabaseConfigured } from './supabase-client.js';
const status = document.getElementById('accountStatus');
const nameEl = document.getElementById('accountName');
const emailEl = document.getElementById('accountEmail');
const roleEl = document.getElementById('accountRole');
const signOut = document.getElementById('signOutButton');
const $ = id => document.getElementById(id);
function setStatus(text, kind = 'info') { if (!status) return; status.textContent = text; status.dataset.kind = kind; status.hidden = !text; }
function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
if (!supabaseConfigured) setStatus('Supabase is not configured. Add the two VITE_SUPABASE environment variables and rebuild the site.', 'error');
else {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => { if (event === 'SIGNED_OUT' || !session) window.location.replace('login.html'); });
  window.addEventListener('beforeunload', () => subscription.unsubscribe(), { once: true });
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) window.location.replace('login.html');
    else {
      emailEl.textContent = user.email || 'Email unavailable';
      nameEl.textContent = user.user_metadata?.display_name || 'VELTRION customer';
      const { data: profile, error: profileError } = await supabase.from('profiles').select('display_name,role,verification_status,created_at').eq('id', user.id).maybeSingle();
      if (profileError) setStatus('Signed in, but profile could not be loaded. Check the schema and access policies.', 'error');
      else if (profile) {
        nameEl.textContent = profile.display_name || nameEl.textContent;
        roleEl.textContent = profile.role === 'customer' ? 'Customer account' : `Account role: ${profile.role}`;
        $('verificationStatus').textContent = (profile.verification_status || 'unverified').toUpperCase();
        if (profile.role === 'admin' || profile.role === 'compliance') {
          const adminLink = document.createElement('a'); adminLink.className = 'btn btn-gold'; adminLink.href = 'admin.html'; adminLink.textContent = 'Open admin console'; document.querySelector('.admin-controls')?.append(adminLink);
        }
      }
      await Promise.all([loadBalances(), loadNotifications(), loadLedger()]);
    }
  } catch (error) { setStatus(error?.message || 'Unable to load your account right now.', 'error'); }
}
async function loadBalances() {
  const { data, error } = await supabase.rpc('customer_asset_balances');
  if (error) { $('customerBalances').innerHTML = `<p>${escapeHtml(error.message)}. Balance ledger setup may still be pending.</p>`; $('accountBalanceCount').textContent = '—'; return; }
  $('accountBalanceCount').textContent = String(data?.length || 0);
  $('customerBalances').innerHTML = data?.length ? data.map(row => `<div class="customer-balance-row"><div><b>${escapeHtml(row.asset_symbol)}</b><small>Ledger balance</small></div><strong>${Number(row.balance).toLocaleString('en-US',{maximumFractionDigits:8})} ${escapeHtml(row.asset_symbol)}</strong></div>`).join('') : '<p>No ledger entries yet.</p>';
}
async function loadNotifications() {
  const { data, error } = await supabase.from('notifications').select('id,kind,title,body,read_at,created_at').order('created_at',{ascending:false}).limit(30);
  if (error) { $('customerNotifications').innerHTML = `<p>Could not load notifications: ${escapeHtml(error.message)}</p>`; return; }
  const unread = (data || []).filter(n => !n.read_at); $('unreadCount').textContent = String(unread.length);
  $('customerNotifications').innerHTML = data?.length ? data.map(n => `<article class="customer-balance-row"><div><b>${escapeHtml(n.title)}</b><small>${escapeHtml(n.kind)} · ${escapeHtml(new Date(n.created_at).toLocaleString())}${n.read_at ? ' · Read' : ' · Unread'}</small><p>${escapeHtml(n.body)}</p>${n.read_at ? '' : `<button class="btn btn-ghost" data-read-notification="${escapeHtml(n.id)}" type="button">Mark as read</button>`}</div></article>`).join('') : '<p>You have no notifications.</p>';
  $('customerNotifications').querySelectorAll('[data-read-notification]').forEach(button => button.addEventListener('click', async () => { button.disabled = true; const { error: updateError } = await supabase.from('notifications').update({read_at:new Date().toISOString()}).eq('id',button.dataset.readNotification); if (updateError) { button.disabled = false; setStatus(`Could not mark notification as read: ${updateError.message}`,'error'); } else await loadNotifications(); }));
}
async function loadLedger() {
  const { data, error } = await supabase.from('balance_ledger').select('created_at,asset_symbol,amount,entry_type,reason').order('created_at',{ascending:false}).limit(30);
  const tbody = $('customerLedger');
  if (error) { tbody.innerHTML = `<tr><td colspan="5">Transaction history is unavailable until the ledger migration is installed.</td></tr>`; return; }
  tbody.innerHTML = data?.length ? data.map(r => `<tr><td>${escapeHtml(new Date(r.created_at).toLocaleString())}</td><td>${escapeHtml(r.asset_symbol)}</td><td>${Number(r.amount).toLocaleString('en-US',{maximumFractionDigits:8})}</td><td>${escapeHtml(r.entry_type)}</td><td>${escapeHtml(r.reason)}</td></tr>`).join('') : '<tr><td colspan="5">No transactions recorded yet.</td></tr>';
}
signOut?.addEventListener('click', async () => { signOut.disabled = true; const { error } = await supabase.auth.signOut(); if (error) { setStatus(error.message || 'Could not sign out. Please try again.', 'error'); signOut.disabled = false; } else window.location.replace('login.html'); });
