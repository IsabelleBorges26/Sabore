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
const defaultGoogleButton = '<img src="../assets/Logo Google.png" alt="Google" class="social-icon-img"> Google';

const setLoginButton = (loading) => {
  if (!btnLogin) return;
  btnLogin.textContent = loading ? 'Entrando...' : 'Entrar na conta';
  btnLogin.disabled = loading;
};

const finishAuthentication = async (session) => {
  api.setToken(session.access_token);
  const user = await api.get('/usuarios/perfil');
  api.setUser(user);
  window.location.replace('../Dashboard/home/index.html');
};

const getRedirectUrl = () => `${window.location.origin}/login/index.html`;

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

if (btnLogin) {
  btnLogin.addEventListener('click', async () => {
    const email = document.getElementById('email').value.trim();
    const password = passwordInput.value;
    if (!email || !password) return alert('Por favor, preencha todos os campos.');
    if (!authClient) return alert('Supabase Auth não configurado. Informe a chave publishable.');

    setLoginButton(true);
    try {
      const { data, error } = await authClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await finishAuthentication(data.session);
    } catch (error) {
      alert(error.message || 'Não foi possível entrar na conta.');
      setLoginButton(false);
    }
  });
}

if (btnGoogle) {
  btnGoogle.addEventListener('click', async () => {
    if (!authClient) return alert('Supabase Auth não configurado. Informe a chave publishable.');
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

if (authClient) {
  authClient.auth.getSession().then(async ({ data, error }) => {
    if (error || !data.session) return;
    setLoginButton(true);
    try {
      await finishAuthentication(data.session);
    } catch (syncError) {
      await authClient.auth.signOut();
      api.clearSession();
      alert('Login concluído, mas não foi possível abrir sua conta: ' + syncError.message);
      setLoginButton(false);
    }
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && btnLogin && !btnLogin.disabled) btnLogin.click();
});
