

document.addEventListener('DOMContentLoaded', () => {

  const user = api.getUser();
  if (!user) {
    window.location.href = "../../login/index.html";
    return;
  }

  const savedAvatar = localStorage.getItem('sabore_user_avatar');
  if (savedAvatar) {
    const userAvatars = document.querySelectorAll('.user-avatar, .large-user-avatar');
    userAvatars.forEach(img => img.src = savedAvatar);
  }

  let userState = {
    isPro: false,
    selectedRecipeToSave: null,
    books: [
      { id: 1, title: 'Café da Manhã', emoji: 'fa-solid fa-mug-hot', count: 12 },
      { id: 2, title: 'Fitness', emoji: 'fa-solid fa-leaf', count: 31 },
      { id: 3, title: 'Sobremesas', emoji: 'fa-solid fa-cake-candles', count: 18 },
      { id: 4, title: 'Favoritas', emoji: 'fa-solid fa-heart', count: 42 },
      { id: 5, title: 'Receitas Rápidas', emoji: 'fa-solid fa-bolt', count: 24 }
    ]
  };

  let pageState = {
    selectedDish: null,
    isScanning: false,
    currentStep: 0,
    recipe: null
  };

  const mockFoodDatabase = {
    pizza: {
      title: "Pizza Margherita Suprema",
      dishName: "Pizza Margherita Identificada!",
      detections: [
        { name: "Massa de Pizza", percent: 99 },
        { name: "Molho de Tomate", percent: 98 },
        { name: "Queijo Mozzarella de Búfala", percent: 96 },
        { name: "Manjericão Fresco", percent: 94 }
      ],
      boundingBoxes: [
        { top: 15, left: 10, width: 80, height: 75, label: "Massa de Pizza (99%)" },
        { top: 25, left: 20, width: 45, height: 45, label: "Molho de Tomate (98%)" },
        { top: 30, left: 35, width: 25, height: 25, label: "Queijo Mozzarella (96%)" },
        { top: 45, left: 40, width: 15, height: 15, label: "Manjericão (94%)" }
      ],
      recipe: {
        time: 25,
        servings: 2,
        difficulty: "Fácil",
        diet: "vegetariano",
        ingredients: [
          "1 Massa de pizza pré-assada de fermentação lenta",
          "1/2 xícara de molho de tomate caseiro temperado",
          "150g de queijo mozzarella de búfala fresca fatiada",
          "Folhas de manjericão fresco a gosto",
          "1 colher de sopa de azeite de oliva extra virgem",
          "Sal marinho e pimenta do reino moída na hora"
        ],
        steps: [
          "Pré-aqueça o seu forno na temperatura máxima (idealmente 220°C a 240°C) por pelo menos 15 minutos.",
          "Disponha a massa de pizza pré-assada sobre uma assadeira e espalhe o molho de tomate uniformemente com as costas de uma colher.",
          "Distribua as fatias de queijo mozzarella de búfala fresca sobre a superfície.",
          "Leve ao forno por cerca de 12 a 15 minutos, ou até que as bordas da massa estejam douradas e crocantes e o queijo completamente derretido e borbulhando.",
          "Retire do forno, espalhe imediatamente as folhas frescas de manjericão por cima (o calor residual vai liberar os óleos aromáticos) e regue com um fio de azeite extra virgem antes de servir."
        ]
      }
    },
    burger: {
      title: "Classic Cheddar Burger com Fritas",
      dishName: "Hambúrguer com Batatas Identificado!",
      detections: [
        { name: "Blend de Carne Bovina", percent: 99 },
        { name: "Pão Brioche Selado", percent: 97 },
        { name: "Queijo Cheddar Fatiado", percent: 95 },
        { name: "Batatas Fritas Palito", percent: 94 }
      ],
      boundingBoxes: [
        { top: 15, left: 25, width: 50, height: 30, label: "Pão Brioche (97%)" },
        { top: 38, left: 22, width: 55, height: 10, label: "Queijo Cheddar (95%)" },
        { top: 45, left: 20, width: 60, height: 20, label: "Blend de Carne (99%)" },
        { top: 55, left: 65, width: 30, height: 35, label: "Batata Frita (94%)" }
      ],
      recipe: {
        time: 30,
        servings: 1,
        difficulty: "Fácil",
        diet: "none",
        ingredients: [
          "180g de blend de carne moída (ex: 50% fraldinha e 50% acém)",
          "1 Pão brioche macio cortado ao meio",
          "2 Fatias de queijo cheddar inglês real",
          "150g de batatas palito prontas para fritar",
          "1 colher de sopa de manteiga com sal",
          "Sal grosso e pimenta do reino a gosto para temperar",
          "Óleo de algodão ou girassol para fritar as batatas"
        ],
        steps: [
          "Aqueça o óleo de fritura a 180°C e frite as batatas palito até que estejam douradas e crocantes. Escorra em papel toalha e tempere com sal.",
          "Modele a carne moída fria no formato de hambúrguer, pressionando levemente o centro para evitar que infle na chapa. Deixe na geladeira até a hora de grelhar.",
          "Espalhe a manteiga nas duas metades do pão brioche e sele em uma frigideira quente até dourar levemente. Reserve.",
          "Aqueça uma frigideira pesada (de preferência ferro fundido) em fogo alto até fumegar. Coloque o hambúrguer, tempere o topo generosamente com sal grosso e pimenta do reino moída.",
          "Deixe grelhar sem mover por 3 a 4 minutos para criar uma crosta saborosa. Vire a carne, adicione as fatias de queijo cheddar por cima e abafe com uma tampa por mais 2 minutos.",
          "Monte o hambúrguer colocando a carne com o cheddar derretido sobre a base do pão brioche, feche com a coroa do pão e sirva quente acompanhado das batatas fritas."
        ]
      }
    },
    salad: {
      title: "Salada César Grelhada Saboré",
      dishName: "Salada César Identificada!",
      detections: [
        { name: "Frango Grelhado em Tiras", percent: 98 },
        { name: "Alface Americana Fresca", percent: 97 },
        { name: "Croutons de Ervas Finas", percent: 95 },
        { name: "Queijo Parmesão Curado", percent: 92 }
      ],
      boundingBoxes: [
        { top: 25, left: 30, width: 40, height: 25, label: "Frango Grelhado (98%)" },
        { top: 45, left: 15, width: 70, height: 45, label: "Alface Americana (97%)" },
        { top: 35, left: 20, width: 15, height: 15, label: "Croutons (95%)" },
        { top: 30, left: 50, width: 20, height: 15, label: "Queijo Parmesão (92%)" }
      ],
      recipe: {
        time: 15,
        servings: 2,
        difficulty: "Fácil",
        diet: "fit",
        ingredients: [
          "1 Peito de frango limpo (cerca de 200g)",
          "1 Maço de alface americana lavada e higienizada",
          "1/2 xícara de croutons de pão italiano temperados",
          "50g de queijo parmesão em lascas finas",
          "3 colheres de sopa de molho César (azeite, parmesão, anchovas e limão)",
          "Sal, pimenta do reino e azeite de oliva a gosto"
        ],
        steps: [
          "Tempere o peito de frango com sal, pimenta e alho em pó. Grelhe em um fio de azeite em frigideira quente por 5-6 minutos de cada lado até cozinhar. Corte em tiras e reserve.",
          "Rasgue as folhas de alface americana lavadas em pedaços médios com as mãos e coloque-as em uma saladeira grande.",
          "Regue a alface com metade do molho César e misture bem com as mãos ou pegadores para espalhar uniformemente pelas folhas.",
          "Disponha as fatias de peito de frango grelhado por cima das folhas.",
          "Finalize salpicando os croutons crocantes e distribuindo as lascas de parmesão curado. Sirva com o restante do molho à parte."
        ]
      }
    },
    sushi: {
      title: "Combinado de Sushi Temaki & Rolls",
      dishName: "Combinado de Sushi Identificado!",
      detections: [
        { name: "Salmão Fresco Gordo", percent: 98 },
        { name: "Arroz de Sushi Temperado (Shari)", percent: 97 },
        { name: "Folhas de Alga Nori", percent: 96 },
        { name: "Cream Cheese Cremoso", percent: 93 }
      ],
      boundingBoxes: [
        { top: 35, left: 20, width: 35, height: 25, label: "Salmão Fresco (98%)" },
        { top: 50, left: 25, width: 45, height: 30, label: "Arroz de Sushi (97%)" },
        { top: 30, left: 55, width: 30, height: 35, label: "Alga Nori (96%)" },
        { top: 40, left: 60, width: 15, height: 15, label: "Cream Cheese (93%)" }
      ],
      recipe: {
        time: 45,
        servings: 2,
        difficulty: "Médio",
        diet: "none",
        ingredients: [
          "1 xícara de arroz especial para culinária japonesa (grão curto)",
          "2 colheres de sopa de vinagre de arroz japonês",
          "1 colher de sopa de açúcar refinado e 1 colher de chá de sal",
          "150g de filé de salmão fresco próprio para consumo cru",
          "2 Folhas inteiras de alga nori",
          "50g de cream cheese em bisnaga gelado",
          "Gergelim torrado preto e branco e molho shoyu para finalizar"
        ],
        steps: [
          "Lave o arroz japonês em água corrente cerca de 5 a 6 vezes até que a água saia transparente. Cozinhe em panela de fundo grosso com 1 e 1/4 xícara de água. Reserve abafado por 10 minutos após desligar.",
          "Em fogo baixo, dissolva o açúcar e o sal no vinagre de arroz (não deixe ferver). Despeje essa calda sobre o arroz cozido e misture delicadamente com uma espátula, esfriando o arroz com um leque ou ventilador. Deixe esfriar por completo.",
          "Corte o salmão fresco em fatias longitudinais finas (para rolls) e em tiras ou cubos (para recheios).",
          "Coloque uma folha de nori com o lado rugoso para cima sobre a esteira de bambu. Umedeça as pontas dos dedos e espalhe o arroz temperado de forma uniforme, deixando um espaço sem arroz na borda superior.",
          "Adicione as tiras de salmão e um fio de cream cheese sobre o terço inferior do arroz. Enrole firmemente com o auxílio da esteira de bambu.",
          "Molhe o fio de uma faca bem afiada e corte o rolo ao meio, depois cada metade em 4 partes iguais. Polvilhe gergelim por cima e sirva acompanhado de molho shoyu."
        ]
      }
    },
    generic: {
      title: "Prato Saudável Caseiro Mix",
      dishName: "Refeição Completa Identificada!",
      detections: [
        { name: "Alimento Grelhado Principal", percent: 95 },
        { name: "Legumes e Verduras Cozidos", percent: 91 },
        { name: "Arroz ou Acompanhamento Base", percent: 88 }
      ],
      boundingBoxes: [
        { top: 20, left: 15, width: 70, height: 65, label: "Refeição Principal (95%)" }
      ],
      recipe: {
        time: 20,
        servings: 2,
        difficulty: "Fácil",
        diet: "none",
        ingredients: [
          "150g de proteína fresca disponível (frango, peixe ou carne)",
          "1 xícara de legumes variados cortados em cubos pequenos",
          "1 colher de sopa de azeite de oliva extra virgem",
          "1 dente de alho picadinho e 1/2 cebola cortada",
          "Sal refinado, pimenta preta moída e ervas finas a gosto"
        ],
        steps: [
          "Higienize e corte todos os ingredientes em pedaços de tamanho similar para cozimento uniforme.",
          "Aqueça o azeite de oliva em uma frigideira larga em fogo médio e doure a cebola e o alho.",
          "Adicione a proteína cortada e refogue até que esteja completamente selada e cozida.",
          "Junte os legumes picados e continue salteando por mais 8 a 10 minutos, adicionando colheres de água se necessário para abafar e cozinhar no vapor.",
          "Tempere com sal, pimenta do reino e suas ervas finas secas ou frescas favoritas e sirva morno."
        ]
      }
    }
  };

  const customCursor = document.createElement('div');
  customCursor.className = 'custom-cursor';
  document.body.appendChild(customCursor);

  document.addEventListener('mousemove', (e) => {
    customCursor.style.left = e.clientX + 'px';
    customCursor.style.top = e.clientY + 'px';
  });

  function updateCursorHoverListeners() {
    const interactives = document.querySelectorAll('a, button, input, select, textarea, [role="button"], .mock-img-btn, .upload-zone, .save-book-option-item, .recipe-ingredient-item');
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

  function updatePlanUI() {
    const navbarPlanTag = document.getElementById('navbar-plan-tag');
    const sidebarUpgradeBtn = document.getElementById('sidebar-upgrade-btn');
    
    if (userState.isPro) {
      if (navbarPlanTag) {
        navbarPlanTag.textContent = 'PRO';
        navbarPlanTag.className = 'user-plan-tag pro';
      }
      if (sidebarUpgradeBtn) {
        sidebarUpgradeBtn.textContent = 'Menu PRO';
        sidebarUpgradeBtn.style.background = 'var(--accent-light)';
        sidebarUpgradeBtn.style.color = 'var(--accent)';
      }
    } else {
      if (navbarPlanTag) {
        navbarPlanTag.textContent = 'Gratuito';
        navbarPlanTag.className = 'user-plan-tag free';
      }
      if (sidebarUpgradeBtn) {
        sidebarUpgradeBtn.textContent = '🚀 Virar PRO';
        sidebarUpgradeBtn.style.background = 'var(--secondary)';
        sidebarUpgradeBtn.style.color = 'var(--dark-deep)';
      }
    }
  }
  
  userState.isPro = false; 
  updatePlanUI();

  const mobileToggle = document.getElementById('mobile-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('active');
    });
    
    document.addEventListener('click', (e) => {
      if (!sidebar.contains(e.target) && !mobileToggle.contains(e.target)) {
        sidebar.classList.remove('active');
      }
    });
  }

  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('open');
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('open');
  }

  const modals = document.querySelectorAll('.modal-overlay');
  modals.forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('open');
      }
    });
  });

  const closeTriggers = [
    { btn: 'close-save-modal', modal: 'save-to-book-modal' },
    { btn: 'close-notif-modal', modal: 'notifications-modal' },
    { btn: 'close-celebration-btn', modal: 'celebration-modal' }
  ];

  closeTriggers.forEach(trigger => {
    const btn = document.getElementById(trigger.btn);
    if (btn) {
      btn.addEventListener('click', () => closeModal(trigger.modal));
    }
  });

  const notifBtn = document.getElementById('notifications-btn');
  if (notifBtn) {
    notifBtn.addEventListener('click', () => {
      openModal('notifications-modal');
      const badge = notifBtn.querySelector('.badge-dot');
      if (badge) badge.style.display = 'none';
    });
  }

  const settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      window.location.href = '../configuracoes/index.html';
    });
  }

  const profileTrigger = document.getElementById('profile-dropdown-trigger');
  if (profileTrigger) {
    profileTrigger.addEventListener('click', () => {
      window.location.href = '../perfil/index.html';
    });
  }

  const upgradeBtnCompact = document.getElementById('sidebar-upgrade-btn');
  const proMenuLink = document.querySelector('[data-target="pro"]');

  const upgradeTriggers = [upgradeBtnCompact, proMenuLink];
  upgradeTriggers.forEach(trigger => {
    if (trigger) {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        userState.isPro = true;
        updatePlanUI();
        openModal('celebration-modal');
      });
    }
  });

  const uploadZone = document.getElementById('photo-upload-zone');
  const fileInput = document.getElementById('photo-file-input');
  const previewContainer = document.getElementById('photo-preview-container');
  const previewImg = document.getElementById('photo-preview-img');
  const removePhotoBtn = document.getElementById('remove-photo-btn');

  if (uploadZone && fileInput) {
    uploadZone.addEventListener('click', () => fileInput.click());

    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
      uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleImageUpload(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleImageUpload(e.target.files[0]);
      }
    });
  }

  function handleImageUpload(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      uploadZone.classList.add('hidden');
      previewContainer.classList.remove('hidden');

      triggerPhotoScanner('generic');
    };
    reader.readAsDataURL(file);
  }

  if (removePhotoBtn) {
    removePhotoBtn.addEventListener('click', () => {
      resetPageToIdle();
    });
  }

  function resetPageToIdle() {
    previewImg.src = '';
    fileInput.value = '';
    previewContainer.classList.add('hidden');
    uploadZone.classList.remove('hidden');

    document.getElementById('state-idle').classList.remove('hidden');
    document.getElementById('state-scanning').classList.add('hidden');
    document.getElementById('state-results').classList.add('hidden');
    document.getElementById('state-recipe').classList.add('hidden');

    document.getElementById('bounding-boxes-container').innerHTML = '';
    document.getElementById('scanner-line').classList.add('hidden');
  }

  const mockButtons = document.querySelectorAll('.mock-img-btn');
  mockButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const foodType = btn.dataset.food;
      const imgSrc = btn.dataset.img;

      previewImg.src = imgSrc;
      uploadZone.classList.add('hidden');
      previewContainer.classList.remove('hidden');

      triggerPhotoScanner(foodType);
    });
  });

  const scannerLine = document.getElementById('scanner-line');
  const boundingBoxesContainer = document.getElementById('bounding-boxes-container');

  let visionAnalysisPromise = null;

  function resizeImageIfNeeded(dataUrl, maxWidth = 512, maxHeight = 512) {
    return new Promise((resolve) => {
      if (!dataUrl.startsWith('data:image/')) {
        resolve(dataUrl);
        return;
      }

      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width <= maxWidth && height <= maxHeight) {
          resolve(dataUrl);
          return;
        }

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => {
        resolve(dataUrl);
      };
    });
  }

  async function analyzeImageWithOpenRouter(imageUrl, onSuccess, onError) {
    try {
      const resizedUrl = await resizeImageIfNeeded(imageUrl);
      const parsedData = await api.post("/ia/analisar-foto", { image: resizedUrl });
      onSuccess(parsedData);
    } catch (error) {
      onError(error);
    }
  }

  async function generateRecipeWithOpenRouter(dishName, ingredientsList, onSuccess, onError) {
    try {
      const activeDiets = [];
      if (localStorage.getItem('sabore_diet_vegan') === 'true') activeDiets.push('Vegano');
      if (localStorage.getItem('sabore_diet_vegetarian') === 'true') activeDiets.push('Vegetariano');
      if (localStorage.getItem('sabore_diet_gluten') === 'true') activeDiets.push('Sem Glúten');
      if (localStorage.getItem('sabore_diet_lactose') === 'true') activeDiets.push('Sem Lactose');
      if (localStorage.getItem('sabore_diet_lowcarb') === 'true') activeDiets.push('Low Carb');
      if (localStorage.getItem('sabore_diet_keto') === 'true') activeDiets.push('Cetogênica');

      const configRestrictionText = activeDiets.length > 0 ? activeDiets.join(', ') : "Nenhuma restrição";
      const servings = localStorage.getItem('sabore_ai_servings') || "2";

      const parsedData = await api.post("/ia/gerar-receita-foto", {
        dishName,
        ingredientsList,
        diet: configRestrictionText,
        servings: servings
      });
      onSuccess(parsedData);
    } catch (error) {
      onError(error);
    }
  }

  function triggerPhotoScanner(foodType) {
    pageState.selectedDish = foodType;
    pageState.isScanning = true;

    boundingBoxesContainer.innerHTML = '';

    scannerLine.classList.remove('hidden');

    document.getElementById('state-idle').classList.add('hidden');
    document.getElementById('state-scanning').classList.remove('hidden');
    document.getElementById('state-results').classList.add('hidden');
    document.getElementById('state-recipe').classList.add('hidden');

    const logs = document.querySelectorAll('.status-line');
    logs.forEach((log, idx) => {
      log.className = 'status-line';
      log.querySelector('i').className = 'fa-regular fa-circle';
      if (idx === 0) {
        log.className = 'status-line active';
        log.querySelector('i').className = 'fa-solid fa-circle-notch fa-spin';
      }
    });

    visionAnalysisPromise = new Promise((resolve, reject) => {
      analyzeImageWithOpenRouter(
        previewImg.src,
        (data) => resolve(data),
        (err) => reject(err)
      );
    });

    let currentStep = 0;
    const stepInterval = setInterval(() => {
      
      logs[currentStep].className = 'status-line done';
      logs[currentStep].querySelector('i').className = 'fa-solid fa-circle-check';

      currentStep++;
      if (currentStep < logs.length) {
        
        logs[currentStep].className = 'status-line active';
        logs[currentStep].querySelector('i').className = 'fa-solid fa-circle-notch fa-spin';
      } else {
        clearInterval(stepInterval);

        visionAnalysisPromise.then((data) => {
          
          const boundingBoxes = (data.detections || []).map((det, index) => {
            return {
              top: 20 + index * 10,
              left: 15 + index * 12,
              width: 40,
              height: 30,
              label: `${det.name} (${det.percent}%)`
            };
          });

          const foodData = {
            title: data.title || "Receita Sugerida",
            dishName: data.dishName || "Prato Identificado!",
            detections: data.detections || [],
            boundingBoxes: boundingBoxes,
            recipe: null
          };

          pageState.recipe = foodData;
          finishScannerSequence(foodData);
        }).catch((err) => {
          const foodData = mockFoodDatabase[foodType] || mockFoodDatabase['generic'];
          pageState.recipe = foodData;
          finishScannerSequence(foodData);
        });
      }
    }, 700);
  }

  function finishScannerSequence(foodData) {
    pageState.isScanning = false;
    scannerLine.classList.add('hidden');

    renderBoundingBoxes(foodData.boundingBoxes);

    document.getElementById('state-scanning').classList.add('hidden');
    const resultsState = document.getElementById('state-results');
    resultsState.classList.remove('hidden');

    document.getElementById('detected-food-title').textContent = foodData.dishName;

    const listContainer = document.getElementById('detection-results-list');
    listContainer.innerHTML = '';

    foodData.detections.forEach(det => {
      const item = document.createElement('div');
      item.className = 'detection-item';
      item.innerHTML = `
        <div class="detection-meta">
          <span class="detection-name">${det.name}</span>
          <span class="detection-percent">${det.percent}%</span>
        </div>
        <div class="detection-bar-bg">
          <div class="detection-bar-fill" style="width: 0%;"></div>
        </div>
      `;
      listContainer.appendChild(item);

      setTimeout(() => {
        item.querySelector('.detection-bar-fill').style.width = det.percent + '%';
      }, 100);
    });

    updateCursorHoverListeners();
  }

  function renderBoundingBoxes(boxes) {
    boundingBoxesContainer.innerHTML = '';
    boxes.forEach((box, index) => {
      
      setTimeout(() => {
        const div = document.createElement('div');
        div.className = 'bounding-box';
        div.style.top = box.top + '%';
        div.style.left = box.left + '%';
        div.style.width = box.width + '%';
        div.style.height = box.height + '%';

        div.innerHTML = `<span class="bounding-box-label">${box.label}</span>`;
        boundingBoxesContainer.appendChild(div);
      }, index * 200);
    });
  }

  const btnResetScan = document.getElementById('btn-reset-scan');
  if (btnResetScan) {
    btnResetScan.addEventListener('click', () => {
      resetPageToIdle();
    });
  }

  const btnGenerateRecipe = document.getElementById('btn-generate-recipe');
  const btnBackToResults = document.getElementById('btn-back-to-results');

  if (btnGenerateRecipe) {
    btnGenerateRecipe.addEventListener('click', () => {
      if (!pageState.recipe) return;

      document.getElementById('state-results').classList.add('hidden');

      const scanningState = document.getElementById('state-scanning');
      scanningState.classList.remove('hidden');
      
      const scanningTitle = scanningState.querySelector('h3');
      scanningTitle.textContent = "O Chef IA está cozinhando...";

      const logsLog = document.getElementById('scan-status-log');
      logsLog.innerHTML = `
        <p class="status-line active"><i class="fa-solid fa-circle-notch fa-spin"></i> Estruturando tempos de cozimento...</p>
        <p class="status-line"><i class="fa-regular fa-circle"></i> Organizando porções e peso...</p>
        <p class="status-line"><i class="fa-regular fa-circle"></i> Redigindo passos culinários...</p>
      `;

      const recipeLogs = logsLog.querySelectorAll('.status-line');
      let currentStep = 0;

      const ingredientsList = pageState.recipe.detections.map(d => d.name);

      const recipePromise = new Promise((resolve, reject) => {
        generateRecipeWithOpenRouter(
          pageState.recipe.title,
          ingredientsList,
          (recipe) => resolve(recipe),
          (err) => reject(err)
        );
      });
      
      const recipeInterval = setInterval(() => {
        recipeLogs[currentStep].className = 'status-line done';
        recipeLogs[currentStep].querySelector('i').className = 'fa-solid fa-circle-check';

        currentStep++;
        if (currentStep < recipeLogs.length) {
          recipeLogs[currentStep].className = 'status-line active';
          recipeLogs[currentStep].querySelector('i').className = 'fa-solid fa-circle-notch fa-spin';
        } else {
          clearInterval(recipeInterval);
          
          recipePromise.then((recipeData) => {
            pageState.recipe.recipe = recipeData;

            scanningTitle.textContent = "Analisando a foto...";
            logsLog.innerHTML = `
              <p class="status-line active"><i class="fa-solid fa-circle-notch fa-spin"></i> Lendo pixels da imagem...</p>
              <p class="status-line"><i class="fa-regular fa-circle"></i> Detectando contornos e formas...</p>
              <p class="status-line"><i class="fa-regular fa-circle"></i> Combinando com base de dados alimentícia...</p>
              <p class="status-line"><i class="fa-regular fa-circle"></i> Finalizando rótulos de confiança...</p>
            `;

            scanningState.classList.add('hidden');
            showRecipeOutput(pageState.recipe);
          }).catch((err) => {
            
            if (!pageState.recipe.recipe) {
              pageState.recipe.recipe = {
                time: 20,
                servings: 2,
                difficulty: "Fácil",
                diet: "none",
                ingredients: ingredientsList.map(i => `100g de ${i}`) || ["Ingredientes frescos a gosto"],
                steps: ["Refogue os ingredientes.", "Grelhe a proteína.", "Tempere e sirva quente."]
              };
            }

            scanningTitle.textContent = "Analisando a foto...";
            logsLog.innerHTML = `
              <p class="status-line active"><i class="fa-solid fa-circle-notch fa-spin"></i> Lendo pixels da imagem...</p>
              <p class="status-line"><i class="fa-regular fa-circle"></i> Detectando contornos e formas...</p>
              <p class="status-line"><i class="fa-regular fa-circle"></i> Combinando com base de dados alimentícia...</p>
              <p class="status-line"><i class="fa-regular fa-circle"></i> Finalizando rótulos de confiança...</p>
            `;

            scanningState.classList.add('hidden');
            showRecipeOutput(pageState.recipe);
          });
        }
      }, 650);
    });
  }

  function showRecipeOutput(foodData) {
    const stateRecipe = document.getElementById('state-recipe');
    stateRecipe.classList.remove('hidden');

    document.getElementById('result-recipe-title').textContent = foodData.title;
    document.getElementById('result-recipe-time').textContent = foodData.recipe.time + ' min';
    document.getElementById('result-recipe-servings').textContent = foodData.recipe.servings + (foodData.recipe.servings > 1 ? ' porções' : ' porção');
    document.getElementById('result-recipe-difficulty').textContent = foodData.recipe.difficulty;

    const dietTag = document.getElementById('result-recipe-diet-tag');
    if (foodData.recipe.diet !== 'none') {
      dietTag.classList.remove('hidden');
      dietTag.innerHTML = `<i class="fa-solid fa-leaf"></i> ${foodData.recipe.diet.toUpperCase()}`;
    } else {
      dietTag.classList.add('hidden');
    }

    const ingList = document.getElementById('result-ingredients-list');
    ingList.innerHTML = '';
    foodData.recipe.ingredients.forEach((ing, index) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <label class="recipe-ingredient-item">
          <div class="ingredient-chk-wrap">
            <input type="checkbox" id="ing-chk-${index}">
            <span class="chk-box-custom"></span>
          </div>
          <span class="ing-text-val">${ing}</span>
        </label>
      `;
      ingList.appendChild(li);
    });

    const stepsList = document.getElementById('result-steps-list');
    stepsList.innerHTML = '';
    foodData.recipe.steps.forEach(step => {
      const li = document.createElement('li');
      li.textContent = step;
      stepsList.appendChild(li);
    });

    updateCursorHoverListeners();
  }

  if (btnBackToResults) {
    btnBackToResults.addEventListener('click', () => {
      document.getElementById('state-recipe').classList.add('hidden');
      document.getElementById('state-results').classList.remove('hidden');
    });
  }

  const saveRecipeBtn = document.getElementById('save-recipe-btn');
  const saveOptionsContainer = document.getElementById('save-book-options-container');

  if (saveRecipeBtn) {
    saveRecipeBtn.addEventListener('click', () => {
      if (!pageState.recipe || !pageState.recipe.recipe) return;

      userState.selectedRecipeToSave = {
        title: pageState.recipe.title,
        description: `Receita gerada automaticamente por IA a partir da imagem identificada de ${pageState.recipe.title}.`,
        time: pageState.recipe.recipe.time || 30,
        difficulty: pageState.recipe.recipe.difficulty || "Médio",
        ingredients: pageState.recipe.recipe.ingredients || [],
        steps: pageState.recipe.recipe.steps || [],
        category: pageState.recipe.recipe.diet !== 'none' ? pageState.recipe.recipe.diet : 'IA Fotos'
      };

      renderBookSaveOptions();
      openModal('save-to-book-modal');
    });
  }

  function renderBookSaveOptions() {
    if (!saveOptionsContainer) return;
    saveOptionsContainer.innerHTML = '';

    userState.books.forEach(book => {
      const item = document.createElement('div');
      item.className = 'save-book-option-item';
      
      item.innerHTML = `
        <div class="save-book-info">
          <div class="save-book-icon"><i class="${book.emoji}"></i></div>
          <div class="save-book-meta">
            <h4>${book.title}</h4>
            <p>${book.count} receitas</p>
          </div>
        </div>
        <button class="btn-select-save-book">Salvar</button>
      `;

      item.querySelector('.btn-select-save-book').addEventListener('click', async () => {
        if (!userState.selectedRecipeToSave) return;
        
        try {
          await api.post("/receitas/cadastrar", {
            titulo: userState.selectedRecipeToSave.title,
            descricao: userState.selectedRecipeToSave.description,
            tempoPreparo: parseInt(userState.selectedRecipeToSave.time) || 30,
            modoPreparo: userState.selectedRecipeToSave.steps.join("\n"),
            dificuldade: userState.selectedRecipeToSave.difficulty,
            criadaPorIA: true,
            ingredientes: userState.selectedRecipeToSave.ingredients,
            categorias: [userState.selectedRecipeToSave.category],
            livroId: book.id,
            publica: false
          });

          book.count += 1;
          closeModal('save-to-book-modal');
          alert(`Receita "${userState.selectedRecipeToSave.title}" salva com sucesso no livro "${book.title}"!`);
        } catch (err) {
          alert("Erro ao salvar receita no livro: " + err.message);
        }
      });

      saveOptionsContainer.appendChild(item);
    });
    updateCursorHoverListeners();
  }

  async function loadInitialData() {
    try {
      const books = await api.get("/livros/listar");
      userState.books = books.map(b => ({
        id: b.id,
        title: b.titulo,
        count: b._count.receitas,
        emoji: b.emoji || 'fa-solid fa-book',
        tag: b.tag
      }));
    } catch (err) {
      console.warn("Erro ao carregar livros do usuário:", err);
    }
  }

  // Carrega os livros reais do usuário no carregamento da página
  loadInitialData();

});
