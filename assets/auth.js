import { supabase, supabaseConfigured } from './supabase-client.js';

const form = document.getElementById('authForm');
const message = document.getElementById('authMessage');
const submit = form?.querySelector('button[type="submit"]');
const page = document.body.dataset.authPage || 'login';
const isAdminLogin = page === 'admin-login';
let pendingSignupEmail = '';
let verificationPanel = null;

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

function showSignupVerification(email) {
  pendingSignupEmail = email;
  const nameField = form.querySelector('[name="displayName"]');
  const emailField = form.querySelector('[name="email"]');
  const passwordField = form.querySelector('[name="password"]');
  const submitButton = form.querySelector('button[type="submit"]');
  if (nameField) nameField.closest('.field')?.setAttribute('hidden', '');
  if (emailField) emailField.closest('.field')?.setAttribute('hidden', '');
  if (passwordField) passwordField.closest('.field')?.setAttribute('hidden', '');
  if (submitButton) submitButton.hidden = true;
  const notice = form.querySelector('.notice:not(#authMessage)');
  if (notice) notice.textContent = `A verification code has been sent to ${email}. Enter the code below to complete your VELTRION registration.`;
  verificationPanel = document.createElement('div');
  verificationPanel.id = 'signupVerificationPanel';
  verificationPanel.innerHTML = `
    <label class="field"><span>Email verification code</span><input id="signupOtp" name="signupOtp" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" minlength="6" required placeholder="Enter 6-digit code" aria-label="Six-digit email verification code"></label>
    <button class="btn btn-gold" id="verifySignupCode" type="button">Verify email & continue ↗</button>
    <p class="form-note">Your code expires after a limited time. Keep it confidential and enter it only on the official VELTRION website.</p>
    <button class="text-link" id="resendSignupCode" type="button">Resend verification code</button>`;
  form.appendChild(verificationPanel);
  document.getElementById('verifySignupCode')?.addEventListener('click', verifySignupCode);
  document.getElementById('resendSignupCode')?.addEventListener('click', resendSignupCode);
  document.getElementById('signupOtp')?.focus();
}

async function verifySignupCode() {
  const otpInput = document.getElementById('signupOtp');
  const button = document.getElementById('verifySignupCode');
  const token = String(otpInput?.value || '').trim();
  if (!/^\d{6}$/.test(token)) {
    showMessage('Enter the six-digit verification code from your email.', 'error');
    otpInput?.focus();
    return;
  }
  if (button) { button.disabled = true; button.textContent = 'Verifying…'; }
  showMessage('Verifying your email securely…');
  try {
    const { error } = await supabase.auth.verifyOtp({ email: pendingSignupEmail, token, type: 'signup' });
    if (error) throw error;
    showMessage('Email verified. Setting up your VELTRION account…', 'success');
    await routeAfterLogin();
  } catch (error) {
    showMessage(error?.message || 'We could not verify that code. Check it and try again.', 'error');
  } finally {
    if (button) { button.disabled = false; button.textContent = 'Verify email & continue ↗'; }
  }
}

async function resendSignupCode() {
  const button = document.getElementById('resendSignupCode');
  if (button) { button.disabled = true; button.textContent = 'Sending…'; }
  try {
    const { error } = await supabase.auth.resend({ type: 'signup', email: pendingSignupEmail });
    if (error) throw error;
    showMessage(`A new verification code has been sent to ${pendingSignupEmail}.`, 'success');
  } catch (error) {
    showMessage(error?.message || 'We could not resend the code. Please wait and try again.', 'error');
  } finally {
    if (button) { button.disabled = false; button.textContent = 'Resend verification code'; }
  }
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
          options: { data: { display_name: displayName } },
        });
        if (error) throw error;
        if (result.session) {
          await routeAfterLogin();
          return;
        }
        if (!result.user) throw new Error('We could not start registration. Please try again.');
        showSignupVerification(email);
        showMessage(`A verification code has been sent to ${email}. Enter it to complete registration.`, 'success');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await routeAfterLogin();
      }
    } catch (error) {
      const known = {
        'Invalid login credentials': 'Email or password is incorrect. If this is a new account, complete email verification first.',
        'Email not confirmed': 'Please complete email verification using the code sent to your inbox before signing in.',
        'User already registered': 'An account with this email already exists. Please sign in instead.',
      };
      showMessage(known[error?.message] || error?.message || 'We could not complete that request. Please try again.', 'error');
    } finally { setBusy(false); }
  });
}
