// ===== NERV DATABASE — app.js =====
const API_URL = 'https://nge-backend.onrender.com/api'; // Altere para sua URL de produção

// ===== CLOCK =====
function updateClock() {
  const now = new Date();
  document.getElementById('clock').textContent =
    now.toLocaleTimeString('pt-BR', { hour12: false });
}
setInterval(updateClock, 1000);
updateClock();

// ===== TAB NAVIGATION =====
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => { c.classList.add('hidden'); c.classList.remove('active'); });
    btn.classList.add('active');
    const section = document.getElementById(`tab-${target}`);
    section.classList.remove('hidden');
    section.classList.add('active');
  });
});

// ===== CONFIRM MODAL =====
let confirmCallback = null;
const confirmModal = document.getElementById('confirm-modal');
const confirmText = document.getElementById('confirm-text');

function showConfirm(text, onConfirm) {
  confirmText.textContent = text;
  confirmCallback = onConfirm;
  confirmModal.classList.remove('hidden');
}

document.getElementById('confirm-yes').addEventListener('click', () => {
  confirmModal.classList.add('hidden');
  if (confirmCallback) confirmCallback();
});
document.getElementById('confirm-no').addEventListener('click', () => {
  confirmModal.classList.add('hidden');
  confirmCallback = null;
});

// ===== STATUS BADGE =====
function statusBadge(status) {
  const map = {
    'Ativo': 'badge-green',
    'Inativo': 'badge-orange',
    'Desaparecido': 'badge-blue',
    'Terceira Impacto': 'badge-red'
  };
  return `<span class="card-badge ${map[status] || 'badge-orange'}">${status.toUpperCase()}</span>`;
}

// ===== API HELPERS =====
async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Erro na requisição');
  }
  return res.json();
}

function showMsg(el, text, isError = false) {
  el.textContent = text;
  el.style.color = isError ? '#ff2244' : '#00ff88';
  setTimeout(() => { el.textContent = ''; }, 3000);
}

// ===================================================
// ===== EVANGELIONS CRUD =====
// ===================================================
const evaFormWrapper = document.getElementById('eva-form-wrapper');
const evaForm = document.getElementById('eva-form');
const evaFormTitle = document.getElementById('eva-form-title');
const evaMsg = document.getElementById('eva-message');
const evaList = document.getElementById('eva-list');

document.getElementById('eva-new-btn').addEventListener('click', () => {
  clearEvaForm();
  evaFormWrapper.classList.remove('hidden');
  evaFormWrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});
document.getElementById('eva-cancel-btn').addEventListener('click', () => {
  evaFormWrapper.classList.add('hidden');
  clearEvaForm();
});

function clearEvaForm() {
  evaForm.reset();
  document.getElementById('eva-id').value = '';
  evaFormTitle.textContent = 'NOVA UNIDADE';
}

async function loadEvangelions() {
  evaList.innerHTML = `
    <div class="loading-state">
      <div class="loader"></div>
      <span>CARREGANDO DADOS...</span>
    </div>`;
  try {
    const data = await apiFetch(`${API_URL}/evangelions`);
    renderEvangelions(data);
  } catch (e) {
    evaList.innerHTML = `<div class="empty-state">⚠ FALHA NA CONEXÃO COM O SERVIDOR</div>`;
  }
}

function renderEvangelions(list) {
  if (!list.length) {
    evaList.innerHTML = `<div class="empty-state">◈ NENHUMA UNIDADE REGISTRADA</div>`;
    return;
  }
  evaList.innerHTML = list.map(ev => `
    <div class="data-card">
      <div class="card-header">
        <div>
          <div class="card-title">${ev.unit}</div>
          <div class="card-subtitle">${ev.type}</div>
        </div>
        <span class="card-badge badge-orange">${ev.color}</span>
      </div>
      <div class="card-body">
        <div class="card-field">
          <span class="field-label">Piloto</span>
          <span class="field-value">${ev.pilot || '—'}</span>
        </div>
        <div class="card-field">
          <span class="field-label">Capacidades</span>
          <span class="field-value">${ev.abilities}</span>
        </div>
        ${ev.notes ? `<div class="card-field">
          <span class="field-label">Obs.</span>
          <span class="field-value" style="color: var(--text-secondary)">${ev.notes}</span>
        </div>` : ''}
      </div>
      <div class="card-actions">
        <button class="edit-btn" onclick="editEvangelion('${ev._id}')">✎ EDITAR</button>
        <button class="delete-btn" onclick="deleteEvangelion('${ev._id}', '${ev.unit.replace(/'/g, "\\'")}')">✕ EXCLUIR</button>
      </div>
    </div>
  `).join('');
}

window.editEvangelion = async function(id) {
  try {
    const ev = await apiFetch(`${API_URL}/evangelions/${id}`);
    document.getElementById('eva-id').value = ev._id;
    document.getElementById('eva-unit').value = ev.unit;
    document.getElementById('eva-type').value = ev.type;
    document.getElementById('eva-color').value = ev.color;
    document.getElementById('eva-pilot').value = ev.pilot || '';
    document.getElementById('eva-abilities').value = ev.abilities;
    document.getElementById('eva-notes').value = ev.notes || '';
    evaFormTitle.textContent = 'EDITAR UNIDADE';
    evaFormWrapper.classList.remove('hidden');
    evaFormWrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (e) {
    alert('Erro ao carregar registro.');
  }
};

window.deleteEvangelion = function(id, name) {
  showConfirm(`Remover "${name}" permanentemente do banco de dados NERV?`, async () => {
    try {
      await apiFetch(`${API_URL}/evangelions/${id}`, { method: 'DELETE' });
      loadEvangelions();
    } catch (e) {
      alert('Erro ao excluir.');
    }
  });
};

evaForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('eva-id').value;
  const data = {
    unit: document.getElementById('eva-unit').value,
    type: document.getElementById('eva-type').value,
    color: document.getElementById('eva-color').value,
    pilot: document.getElementById('eva-pilot').value,
    abilities: document.getElementById('eva-abilities').value,
    notes: document.getElementById('eva-notes').value
  };
  try {
    const url = id ? `${API_URL}/evangelions/${id}` : `${API_URL}/evangelions`;
    const method = id ? 'PUT' : 'POST';
    await apiFetch(url, { method, body: JSON.stringify(data) });
    showMsg(evaMsg, id ? '▶ UNIDADE ATUALIZADA COM SUCESSO.' : '▶ NOVA UNIDADE REGISTRADA.');
    clearEvaForm();
    evaFormWrapper.classList.add('hidden');
    loadEvangelions();
  } catch (e) {
    showMsg(evaMsg, '⚠ ERRO AO SALVAR: ' + e.message, true);
  }
});

// ===================================================
// ===== PILOTS CRUD =====
// ===================================================
const pilotFormWrapper = document.getElementById('pilot-form-wrapper');
const pilotForm = document.getElementById('pilot-form');
const pilotFormTitle = document.getElementById('pilot-form-title');
const pilotMsg = document.getElementById('pilot-message');
const pilotList = document.getElementById('pilot-list');

document.getElementById('pilot-new-btn').addEventListener('click', () => {
  clearPilotForm();
  pilotFormWrapper.classList.remove('hidden');
  pilotFormWrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});
document.getElementById('pilot-cancel-btn').addEventListener('click', () => {
  pilotFormWrapper.classList.add('hidden');
  clearPilotForm();
});

function clearPilotForm() {
  pilotForm.reset();
  document.getElementById('pilot-id').value = '';
  pilotFormTitle.textContent = 'NOVO PILOTO';
}

async function loadPilots() {
  pilotList.innerHTML = `
    <div class="loading-state">
      <div class="loader"></div>
      <span>CARREGANDO DADOS...</span>
    </div>`;
  try {
    const data = await apiFetch(`${API_URL}/pilots`);
    renderPilots(data);
  } catch (e) {
    pilotList.innerHTML = `<div class="empty-state">⚠ FALHA NA CONEXÃO COM O SERVIDOR</div>`;
  }
}

function renderPilots(list) {
  if (!list.length) {
    pilotList.innerHTML = `<div class="empty-state">◉ NENHUM PILOTO REGISTRADO</div>`;
    return;
  }
  pilotList.innerHTML = list.map(p => {
    const syncPct = Math.min((p.syncRate / 400) * 100, 100);
    return `
    <div class="data-card">
      <div class="card-header">
        <div>
          <div class="card-title">${p.name}</div>
          <div class="card-subtitle">CODINOME: ${p.codename}</div>
        </div>
        ${statusBadge(p.status)}
      </div>
      <div class="card-body">
        <div class="card-field">
          <span class="field-label">Idade</span>
          <span class="field-value">${p.age} anos</span>
        </div>
        <div class="card-field" style="flex-direction: column; gap: 4px;">
          <div style="display:flex; justify-content:space-between;">
            <span class="field-label">Sincronia</span>
            <span class="field-value" style="color: var(--green); font-family: var(--font-mono)">${p.syncRate}%</span>
          </div>
          <div class="sync-bar">
            <div class="sync-fill" style="width: ${syncPct}%"></div>
          </div>
        </div>
        <div class="card-field">
          <span class="field-label">Perfil</span>
          <span class="field-value" style="color: var(--text-secondary)">${p.bio}</span>
        </div>
      </div>
      <div class="card-actions">
        <button class="edit-btn" onclick="editPilot('${p._id}')">✎ EDITAR</button>
        <button class="delete-btn" onclick="deletePilot('${p._id}', '${p.name.replace(/'/g, "\\'")}')">✕ EXCLUIR</button>
      </div>
    </div>`;
  }).join('');
}

window.editPilot = async function(id) {
  try {
    const p = await apiFetch(`${API_URL}/pilots/${id}`);
    document.getElementById('pilot-id').value = p._id;
    document.getElementById('pilot-name').value = p.name;
    document.getElementById('pilot-codename').value = p.codename;
    document.getElementById('pilot-age').value = p.age;
    document.getElementById('pilot-sync').value = p.syncRate;
    document.getElementById('pilot-status').value = p.status;
    document.getElementById('pilot-bio').value = p.bio;
    pilotFormTitle.textContent = 'EDITAR PILOTO';
    pilotFormWrapper.classList.remove('hidden');
    pilotFormWrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (e) {
    alert('Erro ao carregar piloto.');
  }
};

window.deletePilot = function(id, name) {
  showConfirm(`Remover o piloto "${name}" permanentemente dos registros NERV?`, async () => {
    try {
      await apiFetch(`${API_URL}/pilots/${id}`, { method: 'DELETE' });
      loadPilots();
    } catch (e) {
      alert('Erro ao excluir.');
    }
  });
};

pilotForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('pilot-id').value;
  const data = {
    name: document.getElementById('pilot-name').value,
    codename: document.getElementById('pilot-codename').value,
    age: Number(document.getElementById('pilot-age').value),
    syncRate: Number(document.getElementById('pilot-sync').value),
    status: document.getElementById('pilot-status').value,
    bio: document.getElementById('pilot-bio').value
  };
  try {
    const url = id ? `${API_URL}/pilots/${id}` : `${API_URL}/pilots`;
    const method = id ? 'PUT' : 'POST';
    await apiFetch(url, { method, body: JSON.stringify(data) });
    showMsg(pilotMsg, id ? '▶ PILOTO ATUALIZADO COM SUCESSO.' : '▶ NOVO PILOTO REGISTRADO.');
    clearPilotForm();
    pilotFormWrapper.classList.add('hidden');
    loadPilots();
  } catch (e) {
    showMsg(pilotMsg, '⚠ ERRO AO SALVAR: ' + e.message, true);
  }
});

// ===== SERVICE WORKER =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      await navigator.serviceWorker.register('./service-worker.js');
      console.log('NERV PWA: Service Worker registrado.');
    } catch (error) {
      console.warn('Service Worker falhou:', error);
    }
  });
}

// ===== INIT =====
loadEvangelions();
loadPilots();
