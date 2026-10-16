import { supabase, supabaseConfigured } from './supabase-client.js';
const status = document.getElementById('adminStatus');
const workspace = document.getElementById('adminWorkspace');
const $ = (id) => document.getElementById(id);
let customers = [];
function message(el, text, error = false) { if (!el) return; el.textContent = text; el.className = `admin-result${error ? ' error' : ''}`; }
function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function statusMessage(text, error = false) { status.textContent = text; status.dataset.kind = error ? 'error' : 'info'; status.hidden = !text; }
async function boot() {
  if (!supabaseConfigured) { statusMessage('Supabase is not configured. Add the VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY environment variables before building.', true); return; }
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) { window.location.replace('login.html?next=admin'); return; }
  const { data: profile, error: profileError } = await supabase.from('profiles').select('role,display_name').eq('id', user.id).maybeSingle();
  if (profileError || !profile || !['admin','compliance'].includes(profile.role)) { statusMessage('Access denied. This account is not authorized for the administrator console.', true); return; }
  $('adminRole').textContent = profile.role.toUpperCase();
  workspace.hidden = false;
  statusMessage(`Authenticated as ${profile.display_name || user.email}.`);
  await loadCustomers();
  await loadAudit();
}
async function loadCustomers() {
  const { data, error } = await supabase.rpc('admin_list_customers');
  if (error) { statusMessage(`Could not load customer directory: ${error.message}. Confirm the admin migration has been run and this account has an authorized role.`, true); return; }
  customers = data || [];
  $('customerCount').textContent = String(customers.length);
  const options = customers.map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.display_name || c.email || c.id)} · ${escapeHtml(c.email || '')}</option>`).join('');
  $('customerSelect').innerHTML = `<option value="">Select a customer</option>${options}`;
  $('notifyRecipient').innerHTML = `<option value="all">All customers (${customers.length})</option>${customers.map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.display_name || c.email || c.id)} · ${escapeHtml(c.email || '')}</option>`).join('')}`;
  $('customerDirectory').innerHTML = customers.length ? customers.map(c => `<div class="customer-balance-row"><div><b>${escapeHtml(c.display_name || 'VELTRION customer')}</b><small>${escapeHtml(c.email || '')}</small><small>${escapeHtml(c.id)}</small></div><strong>${escapeHtml(c.verification_status || 'unverified')}</strong></div>`).join('') : '<p>No customer accounts yet.</p>';
}
async function loadAudit() {
  const { data, error } = await supabase.from('audit_events').select('created_at,event_type,target_type,target_id,metadata').order('created_at', { ascending: false }).limit(30);
  const tbody = $('auditRows');
  if (error) { tbody.innerHTML = `<tr><td colspan="4">Unable to load audit events. ${escapeHtml(error.message)}</td></tr>`; return; }
  tbody.innerHTML = data?.length ? data.map(e => `<tr><td>${escapeHtml(new Date(e.created_at).toLocaleString())}</td><td>${escapeHtml(e.event_type)}</td><td>${escapeHtml(e.target_type || '')} ${escapeHtml(e.target_id || '')}</td><td>${escapeHtml(JSON.stringify(e.metadata || {}))}</td></tr>`).join('') : '<tr><td colspan="4">No audit events recorded yet.</td></tr>';
}
$('submitAdjustment')?.addEventListener('click', async () => {
  const userId = $('customerSelect').value;
  const asset = $('adjustAsset').value.trim().toUpperCase();
  const amount = Number($('adjustAmount').value);
  const reason = $('adjustReason').value.trim();
  if (!userId || !Number.isFinite(amount) || amount === 0 || !reason) { message($('adjustmentResult'), 'Choose a customer, enter a non-zero amount, and provide a reason.', true); return; }
  const button = $('submitAdjustment'); button.disabled = true;
  const idempotency = crypto.randomUUID();
  const { data, error } = await supabase.rpc('admin_adjust_balance', { p_user_id: userId, p_asset_symbol: asset, p_amount: amount, p_reason: reason, p_idempotency_key: idempotency });
  button.disabled = false;
  if (error) { message($('adjustmentResult'), `Adjustment failed: ${error.message}`, true); return; }
  message($('adjustmentResult'), `Ledger entry recorded successfully. Reference: ${data}. Amount: ${amount} ${asset}.`);
  $('adjustAmount').value = ''; $('adjustReason').value = '';
  await loadAudit();
});
$('sendNotification')?.addEventListener('click', async () => {
  const recipient = $('notifyRecipient').value;
  const title = $('notifyTitle').value.trim(); const body = $('notifyBody').value.trim(); const kind = $('notifyKind').value;
  if (!title || !body) { message($('notificationResult'), 'Enter both a title and a message.', true); return; }
  const button = $('sendNotification'); button.disabled = true;
  const { data, error } = await supabase.rpc('admin_send_notification', { p_user_id: recipient === 'all' ? null : recipient, p_title: title, p_body: body, p_kind: kind });
  button.disabled = false;
  if (error) { message($('notificationResult'), `Notification failed: ${error.message}`, true); return; }
  message($('notificationResult'), `Notification saved for ${data} customer(s).`);
  $('notifyTitle').value = ''; $('notifyBody').value = '';
  await loadAudit();
});
$('adminSignOut')?.addEventListener('click', async () => { await supabase.auth.signOut(); window.location.replace('login.html'); });
boot().catch(error => statusMessage(error?.message || 'Could not initialize administrator console.', true));
