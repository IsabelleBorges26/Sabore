const customCursor = document.createElement('div');
customCursor.className = 'custom-cursor';
document.body.appendChild(customCursor);
document.addEventListener('mousemove', (e) => {
  customCursor.style.left = e.clientX + 'px';
  customCursor.style.top = e.clientY + 'px';
});

function updateCursorHoverListeners() {
  document.querySelectorAll('a, button, input, select, textarea, [role="button"]').forEach((element) => {
    if (element.dataset.cursorBound) return;
    element.dataset.cursorBound = 'true';
    element.addEventListener('mouseenter', () => customCursor.classList.add('hover'));
    element.addEventListener('mouseleave', () => customCursor.classList.remove('hover'));
  });
}
updateCursorHoverListeners();

const authClient = window.supabaseClient;
const btnLogin = document.getElementById('btnLogin');
const btnGoogle = document.querySelector('.btn-social');
const defaultGoogleButton = '<img src="../assets/branding/Logo Google.png" alt="Google" class="social-icon-img"> Google';
const expiredMessage = document.getElementById('session-expired-message');
const profileSyncError = document.getElementById('profile-sync-error');
const profileSyncErrorText = document.getElementById('profile-sync-error-text');
const retryProfileSync = document.getElementById('retry-profile-sync');
if (expiredMessage && (api.sessionExpiredOnLoad || new URLSearchParams(window.location.search).get('session') === 'expired')) {
  expiredMessage.hidden = false;
}

const setLoginButton = (loading) => {
  if (!btnLogin) return;
  btnLogin.textContent = loading ? 'Entrando...' : 'Entrar na conta';
  btnLogin.disabled = loading;
};

const finishAuthentication = async (session) => {
  if (profileSyncError) profileSyncError.hidden = true;
  api.setToken(session.access_token);
  const user = await api.get('/usuarios/perfil');
  api.setUser(user);
  window.location.replace('/Dashboard/home/index.html');
};

const showProfileSyncError = (error) => {
  if (!profileSyncError || !profileSyncErrorText) return;
  profileSyncErrorText.textContent = `Sua conta foi autenticada, mas não foi possível carregar o perfil: ${error.message || 'servidor indisponível.'}`;
  profileSyncError.hidden = false;
};

if (retryProfileSync) {
  retryProfileSync.addEventListener('click', async () => {
    retryProfileSync.disabled = true;
    try {
      const { data, error } = await authClient.auth.getSession();
      if (error) throw error;
      if (!data.session) throw new Error('Sua sessão terminou. Entre novamente.');
      await finishAuthentication(data.session);
    } catch (error) {
      showProfileSyncError(error);
    } finally {
      retryProfileSync.disabled = false;
    }
  });
}

const getRedirectUrl = () => {
  const origin = window.location.origin === 'null' ? 'http://localhost:3000' : window.location.origin;
  return `${origin}/login/index.html`;
};

const toggleBtn = document.getElementById('togglePassword');
const passwordInput = document.getElementById('senha');
if (toggleBtn && passwordInput) {
  toggleBtn.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    toggleBtn.innerHTML = isPassword
      ? '<i class="fa-solid fa-eye-slash" aria-hidden="true"></i>'
      : '<i class="fa-solid fa-eye" aria-hidden="true"></i>';
  });
}

const formLogin = document.getElementById('formLogin');
const handleLoginSubmit = async (e) => {
  if (e) e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = passwordInput.value;
  if (!email || !password) return alert('Por favor, preencha todos os campos.');
  if (!authClient) return alert(window.SABORE_SUPABASE_CONFIG_ERROR || 'Supabase Auth não inicializado. Atualize a página e tente novamente.');

  setLoginButton(true);
  let authenticated = false;
  try {
    const { data, error } = await authClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    authenticated = true;
    await finishAuthentication(data.session);
  } catch (error) {
    if (authenticated) showProfileSyncError(error);
    else alert(error.message || 'Não foi possível entrar na conta.');
    setLoginButton(false);
  }
};

if (formLogin) {
  formLogin.addEventListener('submit', handleLoginSubmit);
} else if (btnLogin) {
  btnLogin.addEventListener('click', handleLoginSubmit);
}

if (btnGoogle) {
  btnGoogle.addEventListener('click', async () => {
    if (!authClient) return alert(window.SABORE_SUPABASE_CONFIG_ERROR || 'Supabase Auth não inicializado. Atualize a página e tente novamente.');
    btnGoogle.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Conectando...';
    btnGoogle.disabled = true;
    const { error } = await authClient.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: getRedirectUrl() }
    });
    if (error) {
      alert(error.message || 'Não foi possível iniciar o login com Google.');
      btnGoogle.innerHTML = defaultGoogleButton;
      btnGoogle.disabled = false;
    }
  });
}

if (authClient && !api.sessionExpiredOnLoad && new URLSearchParams(window.location.search).get('session') !== 'expired') {
  authClient.auth.getSession().then(async ({ data, error }) => {
    if (error || !data.session) return;
    setLoginButton(true);
    try {
      await finishAuthentication(data.session);
    } catch (syncError) {
      showProfileSyncError(syncError);
      setLoginButton(false);
    }
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && btnLogin && !btnLogin.disabled) btnLogin.click();
});
