import { supabase, supabaseConfigured } from './supabase-client.js';

const form = document.getElementById('authForm');
const message = document.getElementById('authMessage');
const submit = form?.querySelector('button[type="submit"]');
const page = document.body.dataset.authPage;

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

if (!supabaseConfigured) {
  showMessage('Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to your deployment environment, then rebuild the site.', 'error');
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
          email,
          password,
          options: {
            data: { display_name: displayName },
            emailRedirectTo: `${window.location.origin}/account.html`,
          },
        });
        if (error) throw error;
        if (result.session) {
          window.location.assign('account.html');
          return;
        }
        showMessage('Registration received. Check your email for the confirmation link before signing in.', 'success');
        form.reset();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.assign('account.html');
      }
    } catch (error) {
      const safeMessages = {
        'Invalid login credentials': 'Email or password is incorrect. Check your details and try again.',
        'Email not confirmed': 'Please confirm your email using the link we sent you before signing in.',
        'User already registered': 'An account with this email already exists. Please sign in instead.',
      };
      showMessage(safeMessages[error?.message] || error?.message || 'We could not complete that request. Please try again.', 'error');
    } finally {
      setBusy(false);
    }
  });
}
