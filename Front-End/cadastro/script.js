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
const btnCadastro = document.getElementById('btnCadastro');
const btnGoogle = document.querySelector('.btn-social');
const passwordInput = document.getElementById('senha');
const toggleBtn = document.getElementById('togglePassword');
const defaultGoogleButton = '<img src="../assets/Logo Google.png" alt="Google" class="social-icon-img"> Google';

const finishAuthentication = async (session) => {
  api.setToken(session.access_token);
  const user = await api.get('/usuarios/perfil');
  api.setUser(user);
  window.location.replace('../Dashboard/home/index.html');
};

const getRedirectUrl = () => `${window.location.origin}/login/index.html`;

if (toggleBtn && passwordInput) {
  toggleBtn.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    toggleBtn.innerHTML = isPassword
      ? '<i class="fa-solid fa-eye-slash" aria-hidden="true"></i>'
      : '<i class="fa-solid fa-eye" aria-hidden="true"></i>';
  });
}

const strengthIndicator = document.getElementById('strengthIndicator');
const bars = ['bar1', 'bar2', 'bar3', 'bar4'].map((id) => document.getElementById(id));
const strengthLabel = document.getElementById('strengthLabel');
if (passwordInput) {
  passwordInput.addEventListener('input', () => {
    const password = passwordInput.value;
    strengthIndicator.style.display = password ? 'flex' : 'none';
    const score = Math.min(4, [password.length >= 8, password.length >= 12, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length);
    const label = score < 2 ? 'Fraca' : score < 4 ? 'Média' : 'Forte';
    bars.forEach((bar, index) => bar.className = `strength-bar${index < score ? (score < 2 ? ' weak' : score < 4 ? ' medium' : ' strong') : ''}`);
    strengthLabel.textContent = label;
  });
}

if (btnCadastro) {
  btnCadastro.addEventListener('click', async () => {
    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = passwordInput.value;
    if (!nome || !email || !password) return alert('Por favor, preencha todos os campos.');
    if (!document.getElementById('terms').checked) return alert('Você precisa aceitar os Termos de Uso e Política de Privacidade.');
    if (!authClient) return alert('Supabase Auth não configurado. Informe a chave publishable.');

    btnCadastro.textContent = 'Criando conta...';
    btnCadastro.disabled = true;
    try {
      const { data, error } = await authClient.auth.signUp({
        email,
        password,
        options: { data: { full_name: nome }, emailRedirectTo: getRedirectUrl() }
      });
      if (error) throw error;
      if (data.session) return finishAuthentication(data.session);
      alert('Conta criada. Verifique seu e-mail para confirmar o cadastro antes de entrar.');
      window.location.href = '../login/index.html';
    } catch (error) {
      alert(error.message || 'Não foi possível criar a conta.');
      btnCadastro.textContent = 'Criar conta grátis';
      btnCadastro.disabled = false;
    }
  });
}

if (btnGoogle) {
  btnGoogle.addEventListener('click', async () => {
    if (!authClient) return alert('Supabase Auth não configurado. Informe a chave publishable.');
    btnGoogle.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Conectando...';
    btnGoogle.disabled = true;
    const { error } = await authClient.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: getRedirectUrl() } });
    if (error) {
      alert(error.message || 'Não foi possível iniciar o cadastro com Google.');
      btnGoogle.innerHTML = defaultGoogleButton;
      btnGoogle.disabled = false;
    }
  });
}
