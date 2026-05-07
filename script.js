/* ================================================================
   GOLD GREEN TABACARIA - LÓGICA COMPLETA DO APP
   Incluye: Carrinho, Descontos, Gamificação, WhatsApp, Animações
   ================================================================ */

// ================================================================
// CONFIGURAÇÕES GLOBAIS
// ================================================================

const WHATSAPP_NUMBER = '5527997533655';
const FREE_SHIPPING_THRESHOLD = 80;
const STORAGE_KEY = 'goldgreen_tabacaria_v1';

// Frete regional por estado
const REGIONAL_SHIPPING = {
  SP: 14, RJ: 16, MG: 16, ES: 14,
  PR: 18, SC: 18, RS: 20,
  DF: 22, GO: 22, MT: 24, MS: 24,
  BA: 24, SE: 26, AL: 26, PE: 26, PB: 26, RN: 26, CE: 28, PI: 28, MA: 28,
  TO: 28, PA: 30, AM: 34, AP: 34, RR: 36, AC: 34, RO: 32,
  default: 24
};

// Tiers de desconto progressivo
const DISCOUNT_TIERS = [
  { min: 25, pct: 3, label: '3% off' },
  { min: 50, pct: 6, label: '6% off' },
  { min: 75, pct: 10, label: '10% off' }
];

// Catálogo de produtos com imagens reais
const PRODUCTS = [
  { id: 'p1', name: 'Seda Zomo Brown', img: 'https://i.ibb.co/mr6FqQws/IMG-1105.jpg', old: 8.00, price: 5.00, tag: 'top' },
  { id: 'p2', name: 'Isqueiro Elétrico com Lanterna Tipo C', img: 'https://i.ibb.co/gbWQZVmg/IMG-1072.jpg', old: 50.00, price: 35.00, tag: 'novo' },
  { id: 'p3', name: 'Isqueiro Elétrico Dourado de Luxo', img: 'https://i.ibb.co/gMK2FMyj/IMG-1070.jpg', old: 42.00, price: 30.00, tag: 'luxo' },
  { id: 'p4', name: 'Celulose Transparente', img: 'https://i.ibb.co/twdcVL1J/IMG-1073.jpg', old: 10.00, price: 7.00, tag: '-30%' },
  { id: 'p5', name: 'Pote Slick Silicone Mini', img: 'https://i.ibb.co/TMKc8Mfn/IMG-1077.jpg', old: 16.00, price: 9.99, tag: 'mini' },
  { id: 'p6', name: 'Cuia de Silicone Colorido', img: 'https://i.ibb.co/WWFxPbHp/IMG-1075.jpg', old: 15.00, price: 9.99, tag: '-28%' },
  { id: 'p7', name: 'Mini Tesoura Multiuso Plástico Resistente', img: 'https://i.ibb.co/kVpWQwmk/IMG-1119.jpg', old: 19.99, price: 14.99, tag: '-25%' },
  { id: 'p8', name: 'Tesoura de Aço Inox Dobrável Super Resistente', img: 'https://i.ibb.co/8DGk7Hpv/IMG-1118.jpg', old: 29.99, price: 19.99, tag: '-33%' }
];

// ================================================================
// STATE (ESTADO DA APLICAÇÃO)
// ================================================================

let state = {
  user: null,         // {name, state, city, bairro}
  cart: {},           // {productId: quantity}
  xp: 0,              // Pontos de experiência
  coins: 0,           // Moedas virtuais
  chestOpened: false, // Se o baú foi aberto hoje
  bonusPct: 0,        // Desconto bônus do baú
  soundOn: false      // Som ativado
};

// ================================================================
// PERSISTÊNCIA (localStorage)
// ================================================================

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) state = Object.assign(state, JSON.parse(raw));
  } catch (e) { }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) { }
}

// ================================================================
// UTILITÁRIOS
// ================================================================

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const fmt = v => 'R$ ' + v.toFixed(2).replace('.', ',');

// ================================================================
// SISTEMA DE ÁUDIO (Web Audio API)
// ================================================================

let audioCtx = null;

function beep(freq = 660, ms = 80, type = 'sine', vol = 0.05) {
  if (!state.soundOn) return;
  try {
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + ms / 1000);
    o.stop(audioCtx.currentTime + ms / 1000);
  } catch (e) { }
}

function chime() {
  beep(880, 90, 'triangle', 0.05);
  setTimeout(() => beep(1320, 120, 'triangle', 0.04), 80);
}

function reward() {
  beep(660, 80, 'square', 0.04);
  setTimeout(() => beep(990, 100, 'square', 0.04), 90);
  setTimeout(() => beep(1320, 140, 'square', 0.04), 200);
}

// ================================================================
// PARTÍCULAS FLUTUANTES
// ================================================================

function buildParticles() {
  const wrap = $('#particles');
  const colors = ['var(--neon)', 'var(--neon)', 'var(--neon)', 'var(--yellow)', 'var(--red)', 'var(--gold)'];
  
  for (let i = 0; i < 24; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.animationDuration = (8 + Math.random() * 10) + 's';
    p.style.animationDelay = (-Math.random() * 15) + 's';
    p.style.opacity = 0.3 + Math.random() * 0.5;
    
    const c = colors[Math.floor(Math.random() * colors.length)];
    p.style.background = c;
    p.style.boxShadow = '0 0 8px currentColor';
    p.style.color = c;
    wrap.appendChild(p);
  }
}

// ================================================================
// LOADER & BOOT SEQUENCE
// ================================================================

function runBoot() {
  const bars = $$('#bootBars .boot-bar');
  
  bars.forEach((bar, i) => {
    let pct = 0;
    const fill = $('.fill', bar);
    const pTxt = $('.p', bar);
    
    const interval = setInterval(() => {
      pct += Math.random() * 8 + 2;
      if (pct >= 100) {
        pct = 100;
        clearInterval(interval);
      }
      
      fill.style.width = pct + '%';
      pTxt.textContent = Math.round(pct) + '%';
      
      // Mostrar formulário após boot completo
      if (pct === 100 && i === bars.length - 1) {
        setTimeout(() => {
          $('#loginForm').style.display = 'block';
        }, 300);
      }
    }, 180 + i * 60);
  });
}

// ================================================================
// LOGIN & AUTENTICAÇÃO
// ================================================================

function handleLogin(e) {
  e.preventDefault();
  
  const name = $('#f-name').value.trim();
  const stateUF = $('#f-state').value.trim();
  const city = $('#f-city').value.trim();
  const bairro = $('#f-bairro').value.trim();
  
  if (!name || !stateUF || !city || !bairro) {
    // Highlight campos vazios
    [...e.target.querySelectorAll('input,select')].forEach(el => {
      if (!el.value.trim()) el.style.borderColor = 'var(--danger)';
    });
    return;
  }
  
  // Salvar dados do usuário
  state.user = { name, state: stateUF, city, bairro };
  saveState();
  
  // Animar transição para app
  const loader = $('#loader');
  loader.style.transition = 'opacity 0.5s';
  loader.style.opacity = '0';
  
  setTimeout(() => {
    loader.style.display = 'none';
    $('#app').classList.add('live');
    enterApp();
  }, 480);
}

function enterApp() {
  $('#welcomeUser').textContent = `Olá, ${state.user.name.split(' ')[0]}`;
  $('#userCity').textContent = `${state.user.city} · ${state.user.state}`;
  $('#year').textContent = new Date().getFullYear();
  
  renderProducts();
  renderTiers();
  renderCart();
  startLiveToasts();
}

// ================================================================
// RENDERIZAÇÃO DE PRODUTOS
// ================================================================

function renderProducts() {
  const c1 = $('#productsCarousel');
  c1.innerHTML = '';
  const c2 = $('#productsCarousel2');
  c2.innerHTML = '';
  
  PRODUCTS.forEach((p, i) => {
    const target = i < 4 ? c1 : c2;
    target.appendChild(productCard(p));
  });
  
  // Duplicar alguns produtos no segundo carrossel
  if (c2.children.length < 3) {
    PRODUCTS.slice(0, 2).forEach(p => c2.appendChild(productCard(p, true)));
  }
}

function productCard(p, dup = false) {
  const inCart = state.cart[p.id] || 0;
  const tagPalette = ['', 'yellow', 'red'];
  const idx = PRODUCTS.findIndex(x => x.id === p.id);
  const secondTagClass = tagPalette[idx % 3];
  const secondTagLabel = ['Drop', 'Top', 'Hit'][idx % 3];
  
  const div = document.createElement('article');
  div.className = 'product';
  div.innerHTML = `
    <div class="img-wrap">
      <span class="tag">${p.tag}</span>
      ${p.tag !== 'novo' ? `<span class="tag ${secondTagClass}" style="top:38px">${secondTagLabel}</span>` : ''}
      <img src="${p.img}" alt="${p.name}" loading="lazy" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.style.background='linear-gradient(135deg,#0a1410,#000)';this.style.display='none'"/>
    </div>
    <div class="info">
      <h3>${p.name}</h3>
      <div class="prices">
        <span class="old">${fmt(p.old)}</span>
        <span class="now">${fmt(p.price)}</span>
      </div>
      <div class="qty-row">
        <div class="qty">
          <button data-act="dec" data-id="${p.id}">−</button>
          <span data-qty="${p.id}">${inCart}</span>
          <button data-act="inc" data-id="${p.id}">+</button>
        </div>
        <button class="add-btn ${inCart ? 'added' : ''}" data-add="${p.id}">${inCart ? 'No carrinho' : 'Adicionar'}</button>
      </div>
    </div>
  `;
  
  div.addEventListener('click', e => {
    const t = e.target.closest('button');
    if (!t) return;
    
    const id = t.dataset.id || t.dataset.add;
    if (t.dataset.act === 'inc') changeQty(id, +1);
    else if (t.dataset.act === 'dec') changeQty(id, -1);
    else if (t.dataset.add) changeQty(id, +1, true);
  });
  
  return div;
}

// ================================================================
// OPERAÇÕES DE CARRINHO
// ================================================================

function changeQty(id, delta, fromAdd = false) {
  state.cart[id] = Math.max(0, (state.cart[id] || 0) + delta);
  
  if (state.cart[id] === 0) delete state.cart[id];
  
  // Gamificação: XP e Coins
  if (delta > 0) {
    state.xp += 12;
    state.coins += 5;
    chime();
  } else {
    beep(300, 60, 'sine', 0.04);
  }
  
  saveState();
  syncQtyDisplays();
  renderCart();
  pulseFab();
}

function syncQtyDisplays() {
  PRODUCTS.forEach(p => {
    const q = state.cart[p.id] || 0;
    $$(`[data-qty="${p.id}"]`).forEach(el => el.textContent = q);
    $$(`[data-add="${p.id}"]`).forEach(btn => {
      btn.classList.toggle('added', q > 0);
      btn.textContent = q > 0 ? 'No carrinho' : 'Adicionar';
    });
  });
}

function pulseFab() {
  const btn = $('#openCart');
  btn.animate(
    [
      { transform: 'scale(1)' },
      { transform: 'scale(1.18)' },
      { transform: 'scale(1)' }
    ],
    { duration: 380, easing: 'cubic-bezier(0.2, 0.9, 0.3, 1.4)' }
  );
}

// ================================================================
// CÁLCULO DE PREÇOS & DESCONTOS
// ================================================================

function getRegionalShipping() {
  const uf = state.user?.state || 'default';
  return REGIONAL_SHIPPING[uf] ?? REGIONAL_SHIPPING.default;
}

function calcSubtotal() {
  return Object.entries(state.cart).reduce((s, [id, q]) => {
    const p = PRODUCTS.find(x => x.id === id);
    return p ? s + p.price * q : s;
  }, 0);
}

function calcDiscountPct(subtotal) {
  let pct = 0;
  for (const t of DISCOUNT_TIERS) {
    if (subtotal >= t.min) pct = t.pct;
  }
  return pct + (state.bonusPct || 0); // Bônus do baú
}

function calcTotals() {
  const subtotal = calcSubtotal();
  const discPct = calcDiscountPct(subtotal);
  const discount = subtotal * (discPct / 100);
  const afterDisc = subtotal - discount;
  const ship = getRegionalShipping();
  const freeShip = afterDisc >= FREE_SHIPPING_THRESHOLD;
  const total = afterDisc + (freeShip ? 0 : ship);
  
  return { subtotal, discPct, discount, afterDisc, ship, freeShip, total };
}

// ================================================================
// RENDERIZAÇÃO DE TIERS
// ================================================================

function renderTiers() {
  const row = $('#tierRow');
  row.innerHTML = '';
  
  const t = calcTotals();
  
  DISCOUNT_TIERS.forEach(tier => {
    const el = document.createElement('div');
    el.className = 'tier' + (t.subtotal >= tier.min ? ' unlocked' : '');
    el.innerHTML = `<b>${tier.label}</b>${fmt(tier.min)}+`;
    row.appendChild(el);
  });
  
  // Tier de frete grátis
  const free = document.createElement('div');
  free.className = 'tier' + (t.freeShip ? ' unlocked' : '');
  free.innerHTML = `<b>Frete grátis</b>${fmt(FREE_SHIPPING_THRESHOLD)}+`;
  row.appendChild(free);
}

// ================================================================
// PAINEL DE RECOMPENSAS (ATUALIZAÇÃO DINÂMICA)
// ================================================================

let lastTier = -1;
let lastFree = false;

function updateRewardPanel() {
  const t = calcTotals();
  const target = FREE_SHIPPING_THRESHOLD;
  const remaining = Math.max(0, target - t.afterDisc);
  const pct = Math.min(100, (t.afterDisc / target) * 100);
  
  // Atualizar barra de progresso
  $('#progFill').style.width = pct + '%';
  $('#ftToGo').textContent = remaining > 0 ? fmt(remaining) : '✓ liberado';
  
  // Mensagem motivacional dinâmica
  const msg = $('#rewardMsg');
  let text = '';
  
  if (t.subtotal === 0) {
    text = 'Comece agora — cada R$ 25 desbloqueia um benefício.';
  } else if (t.freeShip) {
    text = '🎉 Frete grátis ativado · ' + t.discPct + '% de desconto';
  } else if (t.discPct > 0 && remaining < 30) {
    text = `Quase lá! Faltam ${fmt(remaining)} para frete grátis`;
  } else if (t.discPct > 0) {
    text = `Você desbloqueou ${t.discPct}% de desconto · faltam ${fmt(remaining)} para frete grátis`;
  } else {
    const next = DISCOUNT_TIERS.find(d => d.min > t.subtotal);
    if (next) text = `Faltam ${fmt(next.min - t.subtotal)} para ${next.label}`;
    else text = 'Continue — mais benefícios à frente';
  }
  
  msg.textContent = text;
  
  // Detectar desbloqueio de novo tier
  let currentTier = -1;
  for (let i = 0; i < DISCOUNT_TIERS.length; i++) {
    if (t.subtotal >= DISCOUNT_TIERS[i].min) currentTier = i;
  }
  
  if (currentTier > lastTier && lastTier !== -1) {
    flashUnlock(`+${DISCOUNT_TIERS[currentTier].pct}% de desconto`);
    msg.classList.remove('flash');
    void msg.offsetWidth;
    msg.classList.add('flash');
    reward();
  }
  
  // Detectar desbloqueio de frete grátis
  if (t.freeShip && !lastFree) {
    flashUnlock('🎉 Frete grátis liberado');
    confettiBurst();
    reward();
  }
  
  lastTier = currentTier;
  lastFree = t.freeShip;
  
  // Atualizar economia total
  $('#savingsTxt').textContent = 'Economia: ' + fmt(t.discount + (t.freeShip ? t.ship : 0));
  
  // Atualizar tiers visuais
  renderTiers();
  
  // Atualizar XP e Coins
  $('#xpNum').textContent = state.xp;
  $('#coinNum').textContent = state.coins;
}

// ================================================================
// FLASH & UNLOCK ANIMATIONS
// ================================================================

function flashUnlock(text) {
  const b = $('#unlockBanner');
  $('#unlockPill').textContent = '🎉 ' + text;
  b.classList.add('show');
  setTimeout(() => b.classList.remove('show'), 2400);
}

// ================================================================
// CONFETTI BURST (EXPLOSÃO DE CONFETE)
// ================================================================

function confettiBurst() {
  const wrap = $('#confetti');
  const colors = ['#00ff88', '#ffd60a', '#ff2e3d', '#ffffff', '#00b864', '#d4af37'];
  
  for (let i = 0; i < 70; i++) {
    const c = document.createElement('i');
    c.style.left = Math.random() * 100 + '%';
    c.style.background = colors[Math.floor(Math.random() * colors.length)];
    c.style.animationDelay = (Math.random() * 0.4) + 's';
    c.style.animationDuration = (1.6 + Math.random() * 1.6) + 's';
    c.style.transform = 'rotate(' + (Math.random() * 360) + 'deg)';
    c.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    
    wrap.appendChild(c);
    setTimeout(() => c.remove(), 3500);
  }
}

// ================================================================
// RENDERIZAÇÃO DO CARRINHO
// ================================================================

function renderCart() {
  const body = $('#cartBody');
  const items = Object.entries(state.cart);
  const t = calcTotals();
  
  // Atualizar badges
  const totalItems = items.reduce((s, [, q]) => s + q, 0);
  $('#cartBadge').textContent = totalItems;
  $('#cartBadgeTop').textContent = totalItems;
  
  // Renderizar items ou empty state
  if (items.length === 0) {
    body.innerHTML = `<div class="empty">Seu carrinho está vazio.<br><br>Adicione um produto para começar a desbloquear recompensas.</div>`;
  } else {
    body.innerHTML = '';
    items.forEach(([id, qty]) => {
      const p = PRODUCTS.find(x => x.id === id);
      if (!p) return;
      
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <img src="${p.img}" alt="" />
        <div class="ci-info">
          <h4>${p.name}</h4>
          <div class="ci-price">${fmt(p.price)} × ${qty} = ${fmt(p.price * qty)}</div>
          <div class="ci-actions">
            <div class="qty">
              <button data-act="dec" data-id="${p.id}">−</button>
              <span>${qty}</span>
              <button data-act="inc" data-id="${p.id}">+</button>
            </div>
            <button class="remove" data-rem="${p.id}">Remover</button>
          </div>
        </div>
      `;
      body.appendChild(row);
    });
    
    body.addEventListener('click', cartBodyClick, { once: true });
  }
  
  // Atualizar resumo financeiro
  $('#subTxt').textContent = fmt(t.subtotal);
  $('#discTxt').textContent = '– ' + fmt(t.discount) + (t.discPct ? ` (${t.discPct}%)` : '');
  
  const shipRow = $('#shipRow');
  if (t.freeShip) {
    shipRow.classList.add('free');
    $('#shipTxt').textContent = 'GRÁTIS';
  } else {
    shipRow.classList.remove('free');
    $('#shipTxt').textContent = fmt(t.ship);
  }
  
  $('#totTxt').textContent = fmt(t.total);
  
  // Atualizar painel de recompensas
  updateRewardPanel();
}

function cartBodyClick(e) {
  const t = e.target.closest('button');
  if (!t) return;
  
  if (t.dataset.act === 'inc') changeQty(t.dataset.id, +1);
  else if (t.dataset.act === 'dec') changeQty(t.dataset.id, -1);
  else if (t.dataset.rem) {
    delete state.cart[t.dataset.rem];
    saveState();
    renderCart();
    syncQtyDisplays();
  }
}

// ================================================================
// DRAWER (CARRINHO DESLIZANTE)
// ================================================================

function openDrawer() {
  $('#drawer').classList.add('open');
  $('#drawerBg').classList.add('open');
  beep(900, 60, 'sine', 0.04);
}

function closeDrawer() {
  $('#drawer').classList.remove('open');
  $('#drawerBg').classList.remove('open');
}

// ================================================================
// CHECKOUT & WHATSAPP
// ================================================================

function checkout() {
  const items = Object.entries(state.cart);
  
  if (!items.length) {
    shake($('#openCart'));
    return;
  }
  
  const t = calcTotals();
  const u = state.user;
  
  // Construir mensagem WhatsApp
  let msg = `*✅ PEDIDO GOLD GREEN TABACARIA*%0A%0A`;
  msg += `*Nome do Cliente:* ${enc(u.name)}%0A`;
  msg += `*Estado:* ${enc(u.state)}%0A`;
  msg += `*Cidade:* ${enc(u.city)}%0A%0A`;
  msg += `*— PRODUTOS PEDIDOS —*%0A`;
  
  items.forEach(([id, q]) => {
    const p = PRODUCTS.find(x => x.id === id);
    msg += `• ${enc(p.name)} (${q}x) — ${enc(fmt(p.price * q))}%0A`;
  });
  
  msg += `%0A`;
  msg += `*Valor dos Produtos:* ${enc(fmt(t.subtotal))}%0A`;
  if (t.discPct > 0) msg += `*Desconto Aplicado:* – ${enc(fmt(t.discount))} (${t.discPct}%)%0A`;
  msg += `*Frete Estimado (${u.state}):* ${t.freeShip ? '✅ *GRÁTIS*' : enc(fmt(t.ship))}%0A%0A`;
  msg += `*💰 VALOR FINAL:* *${enc(fmt(t.total))}*%0A%0A`;
  msg += `_Por favor, confirme os dados de entrega para prosseguir com o pedido._`;
  
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
  window.open(url, '_blank');
  reward();
}

function enc(s) {
  return encodeURIComponent(s).replace(/%0A/g, '%0A');
}

function shake(el) {
  el.animate(
    [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-6px)' },
      { transform: 'translateX(6px)' },
      { transform: 'translateX(0)' }
    ],
    { duration: 280 }
  );
}

// ================================================================
// TOASTS (NOTIFICAÇÕES SIMULADAS)
// ================================================================

const FAKE_NAMES = ['Marina S.', 'Lucas P.', 'Ana R.', 'João T.', 'Camila F.', 'Rafa M.', 'Bia C.', 'Pedro L.', 'Júlia A.', 'Diego V.', 'Karen B.', 'Vitor S.'];
const FAKE_CITIES = ['São Paulo, SP', 'Rio de Janeiro, RJ', 'Belo Horizonte, MG', 'Curitiba, PR', 'Porto Alegre, RS', 'Salvador, BA', 'Recife, PE', 'Fortaleza, CE', 'Brasília, DF'];

function startLiveToasts() {
  setTimeout(showToast, 4500);
  setInterval(showToast, 22000);
}

function showToast() {
  const p = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
  const n = FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)];
  const c = FAKE_CITIES[Math.floor(Math.random() * FAKE_CITIES.length)];
  const min = Math.floor(Math.random() * 8) + 1;
  
  const t = $('#toast');
  $('#toastImg').src = p.img;
  $('#toastName').textContent = n + ' acabou de comprar';
  $('#toastBody').textContent = `${p.name} · ${c} · há ${min} min`;
  
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 4800);
}

// ================================================================
// CHEST (BAÚ DE RECOMPENSAS)
// ================================================================

function openChest() {
  if (state.chestOpened) {
    flashUnlock('Você já abriu o baú hoje');
    return;
  }
  
  const bonuses = [2, 3, 5];
  const pick = bonuses[Math.floor(Math.random() * bonuses.length)];
  
  state.chestOpened = true;
  state.bonusPct = pick;
  state.coins += 25;
  saveState();
  
  flashUnlock(`+${pick}% bônus extra desbloqueado`);
  confettiBurst();
  reward();
  renderCart();
}

// ================================================================
// KITS (ATACADO)
// ================================================================

function setupKits() {
  $$('[data-kit]').forEach(btn => {
    btn.addEventListener('click', () => {
      const n = parseInt(btn.dataset.kit, 10);
      const sorted = [...PRODUCTS].sort((a, b) => a.price - b.price).slice(0, n);
      
      sorted.forEach(p => state.cart[p.id] = (state.cart[p.id] || 0) + 1);
      state.xp += 30 * n;
      state.coins += 10 * n;
      saveState();
      
      syncQtyDisplays();
      renderCart();
      openDrawer();
      reward();
      flashUnlock(`Kit ${n} montado`);
    });
  });
}

// ================================================================
// CONTROLE DE SOM
// ================================================================

function setupSound() {
  const btn = $('#soundToggle');
  
  btn.addEventListener('click', () => {
    state.soundOn = !state.soundOn;
    saveState();
    
    btn.style.color = state.soundOn ? 'var(--neon)' : 'var(--text-dim)';
    
    if (state.soundOn) {
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      chime();
    }
  });
}

// ================================================================
// INICIALIZAÇÃO
// ================================================================

function init() {
  loadState();
  buildParticles();
  
  // Verificar se user já está logado
  if (state.user) {
    $('#loader').style.display = 'none';
    $('#app').classList.add('live');
    enterApp();
  } else {
    runBoot();
  }
  
  // Event listeners
  $('#loginForm').addEventListener('submit', handleLogin);
  $('#openCart').addEventListener('click', openDrawer);
  $('#openCartTop').addEventListener('click', openDrawer);
  $('#closeCart').addEventListener('click', closeDrawer);
  $('#drawerBg').addEventListener('click', closeDrawer);
  $('#checkoutBtn').addEventListener('click', checkout);
  $('#chest').addEventListener('click', openChest);
  $('#chestBtn').addEventListener('click', openChest);
  
  setupKits();
  setupSound();
  
  // Service Worker para PWA
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    const swCode = `self.addEventListener('install',e=>self.skipWaiting());self.addEventListener('activate',e=>self.clients.claim());self.addEventListener('fetch',e=>{e.respondWith(fetch(e.request).catch(()=>new Response('offline')))});`;
    const swUrl = URL.createObjectURL(new Blob([swCode], { type: 'text/javascript' }));
    navigator.serviceWorker.register(swUrl).catch(() => { });
  }
  
  // Restaurar estado do som
  $('#soundToggle').style.color = state.soundOn ? 'var(--neon)' : 'var(--text-dim)';
}

// Iniciar quando DOM carregado
document.addEventListener('DOMContentLoaded', init);