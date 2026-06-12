/* SABORÉ — Cadastro Scripts */

// ─── CUSTOM CURSOR DYNAMIC INITIALIZATION ───
const customCursor = document.createElement('div');
customCursor.className = 'custom-cursor';
document.body.appendChild(customCursor);

document.addEventListener('mousemove', (e) => {
  customCursor.style.left = e.clientX + 'px';
  customCursor.style.top = e.clientY + 'px';
});

function updateCursorHoverListeners() {
  const interactives = document.querySelectorAll('a, button, input, select, textarea, [role="button"], .social-btn, .plan-btn, .hamburger');
  interactives.forEach(el => {
    if (el.dataset.cursorBound) return;
    el.dataset.cursorBound = 'true';
    el.addEventListener('mouseenter', () => customCursor.classList.add('hover'));
    el.addEventListener('mouseleave', () => customCursor.classList.remove('hover'));
  });
}

updateCursorHoverListeners();
setInterval(updateCursorHoverListeners, 1000);

document.addEventListener('mouseleave', () => {
  customCursor.style.display = 'none';
});
document.addEventListener('mouseenter', () => {
  customCursor.style.display = 'block';
});

// ─── FIREBASE INITIALIZATION ───
const firebaseConfig = {
  apiKey: "AIzaSyDoi7oFnxm_M3uRHtv8FW5utfNQIiwlXVM",
  authDomain: "sabore-be19b.firebaseapp.com",
  projectId: "sabore-be19b",
  storageBucket: "sabore-be19b.firebasestorage.app",
  messagingSenderId: "304349731243",
  appId: "1:304349731243:web:8dc64e1a2550821dd75aee"
};

try {
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();

  // Password toggle
  const toggleBtn = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('senha');

  if (toggleBtn && passwordInput) {
    toggleBtn.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      toggleBtn.innerHTML = isPassword ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
    });
  }

  // Password strength
  const strengthIndicator = document.getElementById('strengthIndicator');
  const bars = [
    document.getElementById('bar1'),
    document.getElementById('bar2'),
    document.getElementById('bar3'),
    document.getElementById('bar4'),
  ];
  const strengthLabel = document.getElementById('strengthLabel');

  function getStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return Math.min(4, Math.ceil(score * 4 / 5));
  }

  if (passwordInput) {
    passwordInput.addEventListener('input', () => {
      const val = passwordInput.value;
      if (val.length === 0) {
        strengthIndicator.style.display = 'none';
        return;
      }
      strengthIndicator.style.display = 'flex';

      const strength = getStrength(val);
      const classes = ['', 'weak', 'weak', 'medium', 'strong'];
      const labels = ['', 'Fraca', 'Fraca', 'Média', 'Forte'];

      bars.forEach((bar, i) => {
        bar.className = 'strength-bar';
        if (i < strength) {
          bar.classList.add(classes[strength]);
        }
      });

      strengthLabel.textContent = labels[strength];
      strengthLabel.style.color =
        strength <= 2 ? '#e85555' :
        strength === 3 ? '#e8b355' : '#55c97a';
    });
  }

  // Signup with Email and Password
  const btnCadastro = document.getElementById('btnCadastro');
  if (btnCadastro) {
    btnCadastro.addEventListener('click', () => {
      const nome = document.getElementById('nome').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('senha').value;
      const acceptTerms = document.getElementById('terms').checked;

      if (!nome || !email || !password) {
        alert('Por favor, preencha todos os campos.');
        return;
      }

      if (!acceptTerms) {
        alert('Você precisa aceitar os Termos de Uso e Política de Privacidade.');
        return;
      }

      btnCadastro.textContent = 'Criando conta...';
      btnCadastro.disabled = true;

      auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
          // Update user profile display name
          return userCredential.user.updateProfile({
            displayName: nome
          }).then(() => {
            window.location.href = '../Dashboard/home/index.html';
          });
        })
        .catch((error) => {
          console.error(error);
          let message = 'Erro ao criar conta. Por favor, tente novamente.';
          if (error.code === 'auth/email-already-in-use') {
            message = 'Este e-mail já está em uso.';
          } else if (error.code === 'auth/weak-password') {
            message = 'A senha é muito fraca (mínimo 6 caracteres).';
          } else if (error.code === 'auth/invalid-email') {
            message = 'E-mail inválido.';
          }
          alert(message);
          btnCadastro.textContent = 'Criar conta grátis';
          btnCadastro.disabled = false;
        });
    });
  }

  // Signup with Google
  const btnGoogle = document.querySelector('.btn-social');
  if (btnGoogle) {
    btnGoogle.addEventListener('click', () => {
      const provider = new firebase.auth.GoogleAuthProvider();
      btnGoogle.innerHTML = '<span><i class="fa-solid fa-circle-notch fa-spin"></i></span> Conectando...';
      btnGoogle.disabled = true;

      auth.signInWithPopup(provider)
        .then((result) => {
          window.location.href = '../Dashboard/home/index.html';
        })
        .catch((error) => {
          console.error(error);
          alert('Erro ao cadastrar com o Google: ' + error.message);
          btnGoogle.innerHTML = '<img src="../assets/Logo Google.png" alt="Google" class="social-icon-img"> Google';
          btnGoogle.disabled = false;
        });
    });
  }

  // Enter key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const btn = document.getElementById('btnCadastro');
      if (btn && !btn.disabled) btn.click();
    }
  });

} catch (fbError) {
  console.warn("Firebase failed to initialize. Make sure you are connected to the internet.", fbError);
}

// Input focus
document.querySelectorAll('.field input').forEach(input => {
  const wrap = input.closest('.input-wrap');
  input.addEventListener('focus', () => { wrap.style.transform = 'scale(1.01)'; });
  input.addEventListener('blur', () => { wrap.style.transform = ''; });
});