import { supabase, supabaseConfigured } from './supabase-client.js';

const form = document.getElementById('authForm');
const message = document.getElementById('authMessage');
const submit = form?.querySelector('button[type="submit"]');
const page = document.body.dataset.authPage || 'login';
const isAdminLogin = page === 'admin-login';

function showMessage(text, kind = 'info') {
  if (!message) return;
  message.textContent = text;
  message.dataset.kind = kind;
  message.hidden = false;
}
function setBusy(busy) {
  if (!submit) return;
  submit.disabled = busy;
  submit.dataset.originalText ||= submit.textContent;
  submit.textContent = busy ? 'Please wait…' : submit.dataset.originalText;
}
async function routeAfterLogin() {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw userError || new Error('Your session could not be verified. Please sign in again.');
  const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profileError) throw new Error('You signed in, but your profile could not be checked. Confirm the Supabase profiles table and row-level security policies.');
  if (!profile?.role) throw new Error('Your account profile is missing. Please contact support before trying to sign in again.');
  const role = profile.role;
  if (isAdminLogin) {
    if (!['admin', 'compliance'].includes(role)) {
      await supabase.auth.signOut();
      throw new Error('This account is not authorized for administrator access. Use Customer Login instead.');
    }
    window.location.replace('admin.html');
    return;
  }
  if (['admin', 'compliance'].includes(role)) {
    await supabase.auth.signOut();
    showMessage('This is an administrator account. Please use the separate Admin Login page.', 'error');
    return;
  }
  if (role !== 'customer') throw new Error('This account role cannot access the customer workspace. Please contact support.');
  window.location.replace('account.html');
}

if (!supabaseConfigured) {
  showMessage('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to Vercel, then redeploy.', 'error');
  if (submit) submit.disabled = true;
} else if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    setBusy(true);
    showMessage('Connecting securely to VELTRION…');
    const data = new FormData(form);
    const email = String(data.get('email') || '').trim().toLowerCase();
    const password = String(data.get('password') || '');
    try {
      if (page === 'signup') {
        const displayName = String(data.get('displayName') || '').trim();
        const { data: result, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { display_name: displayName }, emailRedirectTo: `${window.location.origin}/account.html` },
        });
        if (error) throw error;
        if (result.session) { window.location.replace('account.html'); return; }
        showMessage('Registration was submitted. Check your email and confirm your address before signing in.', 'success');
        form.reset();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await routeAfterLogin();
      }
    } catch (error) {
      const known = {
        'Invalid login credentials': 'Email or password is incorrect. If this is a new account, register first and confirm your email.',
        'Email not confirmed': 'Please confirm your email using the link sent to your inbox before signing in.',
        'User already registered': 'An account with this email already exists. Please sign in instead.',
      };
      showMessage(known[error?.message] || error?.message || 'We could not complete that request. Please try again.', 'error');
    } finally { setBusy(false); }
  });
}
