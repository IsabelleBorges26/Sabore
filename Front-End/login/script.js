/* SABORÉ — Login Scripts */

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
      toggleBtn.textContent = isPassword ? '🙈' : '👁';
    });
  }

  // Login with Email and Password
  const btnLogin = document.getElementById('btnLogin');
  if (btnLogin) {
    btnLogin.addEventListener('click', () => {
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('senha').value;

      if (!email || !password) {
        alert('Por favor, preencha todos os campos.');
        return;
      }

      btnLogin.textContent = 'Entrando...';
      btnLogin.disabled = true;

      auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
          window.location.href = '../Dashboard/home/index.html';
        })
        .catch((error) => {
          console.error(error);
          let message = 'Erro ao entrar. Por favor, verifique suas credenciais.';
          if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            message = 'E-mail ou senha incorretos.';
          } else if (error.code === 'auth/invalid-email') {
            message = 'E-mail inválido.';
          } else if (error.code === 'auth/user-disabled') {
            message = 'Este usuário foi desativado.';
          }
          alert(message);
          btnLogin.textContent = 'Entrar na conta';
          btnLogin.disabled = false;
        });
    });
  }

  // Login with Google
  const btnGoogle = document.querySelector('.btn-social');
  if (btnGoogle) {
    btnGoogle.addEventListener('click', () => {
      const provider = new firebase.auth.GoogleAuthProvider();
      btnGoogle.innerHTML = '<span>⟳</span> Conectando...';
      btnGoogle.disabled = true;

      auth.signInWithPopup(provider)
        .then((result) => {
          window.location.href = '../Dashboard/home/index.html';
        })
        .catch((error) => {
          console.error(error);
          alert('Erro ao entrar com o Google: ' + error.message);
          btnGoogle.innerHTML = '<img src="../assets/Logo Google.png" alt="Google" class="social-icon-img"> Google';
          btnGoogle.disabled = false;
        });
    });
  }

  // Keyboard shortcut: Enter to login
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const btn = document.getElementById('btnLogin');
      if (btn && !btn.disabled) btn.click();
    }
  });

} catch (fbError) {
  console.warn("Firebase failed to initialize. Make sure you are connected to the internet.", fbError);
}

// Input focus animations
document.querySelectorAll('.field input').forEach(input => {
  const wrap = input.closest('.input-wrap');
  
  input.addEventListener('focus', () => {
    wrap.style.transform = 'scale(1.01)';
  });
  
  input.addEventListener('blur', () => {
    wrap.style.transform = '';
  });
});