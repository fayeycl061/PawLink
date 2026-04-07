// ===== State =====
let state = {
  pet: null,
  records: [],
  reminders: [],
};

// ===== Init =====
function init() {
  loadFromStorage();
  renderAll();
  // Set default dates
  const today = new Date().toISOString().split('T')[0];
  const recordDate = document.getElementById('recordDate');
  if (recordDate) recordDate.value = today;
  const reminderDate = document.getElementById('reminderDate');
  if (reminderDate) reminderDate.value = today;
}

function loadFromStorage() {
  try {
    const pet = localStorage.getItem('pawlink_pet');
    const records = localStorage.getItem('pawlink_records');
    const reminders = localStorage.getItem('pawlink_reminders');
    if (pet) state.pet = JSON.parse(pet);
    if (records) state.records = JSON.parse(records);
    if (reminders) state.reminders = JSON.parse(reminders);
  } catch (e) {}
}

function saveToStorage() {
  localStorage.setItem('pawlink_pet', JSON.stringify(state.pet));
  localStorage.setItem('pawlink_records', JSON.stringify(state.records));
  localStorage.setItem('pawlink_reminders', JSON.stringify(state.reminders));
}

function renderAll() {
  renderSidebarPet();
  renderProfile();
  renderRecords();
  renderReminders();
  renderHomeStats();
  renderHealthContext();
  renderCompanionBanner();
}

// ===== Navigation =====
function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + tabId).classList.add('active');
  document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
}

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// ===== Pet Profile =====
function savePetProfile() {
  const name = document.getElementById('petName').value.trim();
  if (!name) { showToast('请输入猫咪名字'); return; }

  state.pet = {
    name,
    breed: document.getElementById('petBreed').value.trim(),
    gender: document.getElementById('petGender').value,
    birthday: document.getElementById('petBirthday').value,
    weight: document.getElementById('petWeight').value,
    neutered: document.getElementById('petNeutered').value,
    allergies: document.getElementById('petAllergies').value.trim(),
    notes: document.getElementById('petNotes').value.trim(),
  };

  saveToStorage();
  renderAll();
  closeModal('profileModal');
  showToast('档案已保存 ✓');
}

function openProfileModal() {
  if (state.pet) {
    document.getElementById('petName').value = state.pet.name || '';
    document.getElementById('petBreed').value = state.pet.breed || '';
    document.getElementById('petGender').value = state.pet.gender || '';
    document.getElementById('petBirthday').value = state.pet.birthday || '';
    document.getElementById('petWeight').value = state.pet.weight || '';
    document.getElementById('petNeutered').value = state.pet.neutered || '';
    document.getElementById('petAllergies').value = state.pet.allergies || '';
    document.getElementById('petNotes').value = state.pet.notes || '';
  }
  openModal('profileModal');
}

function renderProfile() {
  const el = document.getElementById('profileDisplay');
  if (!state.pet) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">🐾</div><p>还没有猫咪档案，点击右上角添加吧</p></div>`;
    return;
  }
  const p = state.pet;
  const age = p.birthday ? calcAge(p.birthday) : null;
  const tags = [p.gender, p.neutered ? `已绝育:${p.neutered}` : null, p.weight ? `${p.weight}kg` : null, age].filter(Boolean);

  el.innerHTML = `
    <div class="profile-card">
      <div class="profile-main">
        <div class="profile-avatar">🐱</div>
        <div>
          <div class="profile-name">${escHtml(p.name)}</div>
          <div class="profile-breed">${escHtml(p.breed || '品种未知')}</div>
          <div class="profile-tags">
            ${tags.map(t => `<span class="profile-tag">${escHtml(t)}</span>`).join('')}
          </div>
        </div>
      </div>
      <div class="profile-fields">
        ${p.birthday ? `<div class="profile-field"><label>出生/到家日期</label><span>${p.birthday}</span></div>` : ''}
        ${p.allergies ? `<div class="profile-field" style="grid-column:1/-1;"><label>过敏/疾病史</label><span>${escHtml(p.allergies)}</span></div>` : ''}
        ${p.notes ? `<div class="profile-field" style="grid-column:1/-1;"><label>备注</label><span>${escHtml(p.notes)}</span></div>` : ''}
      </div>
    </div>`;
}

// ===== Sidebar Pet =====
function renderSidebarPet() {
  const el = document.getElementById('sidebarPetCard');
  if (state.pet) {
    el.querySelector('.pet-name').textContent = state.pet.name;
    const age = state.pet.birthday ? calcAge(state.pet.birthday) : '年龄未知';
    el.querySelector('.pet-meta').textContent = `${state.pet.breed || '未知品种'} · ${age}`;
  }
}

// ===== Health Records =====
function saveRecord() {
  const title = document.getElementById('recordTitle').value.trim();
  if (!title) { showToast('请填写标题'); return; }

  state.records.unshift({
    id: Date.now(),
    type: document.getElementById('recordType').value,
    date: document.getElementById('recordDate').value || new Date().toISOString().split('T')[0],
    title,
    detail: document.getElementById('recordDetail').value.trim(),
  });

  saveToStorage();
  renderRecords();
  renderHomeStats();
  closeModal('recordModal');
  showToast('记录已添加 ✓');

  // Reset form
  document.getElementById('recordTitle').value = '';
  document.getElementById('recordDetail').value = '';
}

function deleteRecord(id) {
  state.records = state.records.filter(r => r.id !== id);
  saveToStorage();
  renderRecords();
  renderHomeStats();
  showToast('已删除');
}

function renderRecords() {
  const el = document.getElementById('recordsList');
  if (!state.records.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">📝</div><p>暂无健康记录</p></div>`;
    return;
  }
  el.innerHTML = state.records.map(r => `
    <div class="record-item">
      <span class="record-type-badge badge-${r.type}">${r.type}</span>
      <div class="record-content">
        <div class="record-title">${escHtml(r.title)}</div>
        <div class="record-date">${r.date}</div>
        ${r.detail ? `<div class="record-detail">${escHtml(r.detail)}</div>` : ''}
      </div>
      <button class="record-delete" onclick="deleteRecord(${r.id})">🗑</button>
    </div>`).join('');
}

// ===== Quick Input =====
function processQuickInput() {
  const text = document.getElementById('quickInput').value.trim();
  if (!text) { showToast('请先输入内容'); return; }

  const resultEl = document.getElementById('quickInputResult');
  resultEl.style.display = 'block';
  resultEl.innerHTML = `<div class="loading"><div class="spinner"></div> AI 正在提炼信息...</div>`;

  // Simulate AI extraction
  setTimeout(() => {
    const extracted = extractHealthInfo(text);
    resultEl.innerHTML = `
      <div style="font-weight:600;margin-bottom:8px;color:var(--primary-dark)">✨ AI 提炼结果</div>
      ${extracted.map(item => `<div style="margin-bottom:4px;">• ${item}</div>`).join('')}
      <div style="margin-top:12px;display:flex;gap:8px;">
        <button class="btn btn-primary btn-sm" onclick="saveExtractedRecord(${JSON.stringify(extracted).replace(/"/g, '&quot;')})">存入档案</button>
        <button class="btn btn-outline btn-sm" onclick="document.getElementById('quickInputResult').style.display='none'">忽略</button>
      </div>`;
  }, 1200);
}

function extractHealthInfo(text) {
  const results = [];
  const lower = text.toLowerCase();

  if (lower.includes('吃') || lower.includes('食')) {
    const match = text.match(/吃了([^，。,\.]+)/);
    if (match) results.push(`饮食：${match[1].trim()}`);
  }
  if (lower.includes('喝水')) results.push('饮水状况：' + (lower.includes('正常') ? '正常' : '异常'));
  if (lower.includes('精神')) results.push('精神状态：' + (lower.includes('好') || lower.includes('活') ? '良好' : '欠佳'));
  if (lower.includes('呕吐') || lower.includes('吐')) results.push('症状：呕吐');
  if (lower.includes('拉稀') || lower.includes('腹泻')) results.push('症状：腹泻');
  if (lower.includes('疫苗') || lower.includes('打针')) results.push('记录类型：疫苗/就诊');
  if (lower.includes('驱虫')) results.push('记录类型：驱虫');
  if (lower.includes('体重') || lower.includes('公斤') || lower.includes('kg')) {
    const match = text.match(/(\d+\.?\d*)\s*(kg|公斤|千克)/i);
    if (match) results.push(`体重：${match[1]} kg`);
  }

  if (!results.length) results.push('日常记录：' + text.substring(0, 60) + (text.length > 60 ? '...' : ''));

  results.push(`记录时间：${new Date().toLocaleDateString('zh-CN')}`);
  return results;
}

function saveExtractedRecord(extracted) {
  state.records.unshift({
    id: Date.now(),
    type: '日常',
    date: new Date().toISOString().split('T')[0],
    title: 'AI 快速记录',
    detail: extracted.join(' | '),
  });
  saveToStorage();
  renderRecords();
  renderHomeStats();
  document.getElementById('quickInput').value = '';
  document.getElementById('quickInputResult').style.display = 'none';
  showToast('已存入档案 ✓');
}

function handleFileUpload(input) {
  if (input.files && input.files[0]) {
    showToast('图片已选择，AI 将在提炼时解析内容');
  }
}

// ===== Safety Check =====
let safetyMode = 'ingredient';

function setMode(mode, btn) {
  safetyMode = mode;
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const placeholders = {
    ingredient: '直接输入成分名称，例如：木糖醇、葱、洋葱、丙二醇...',
    plant: '输入植物名称，例如：百合花、橡皮树、常春藤...',
    food: '输入食物名称，例如：牛油果、葡萄、巧克力...',
  };
  document.getElementById('safetyTextInput').placeholder = placeholders[mode];
}

function handleSafetyUpload(input) {
  if (!input.files || !input.files[0]) return;
  const reader = new FileReader();
  reader.onload = e => {
    const preview = document.getElementById('safetyPreview');
    const placeholder = document.getElementById('uploadPlaceholder');
    preview.src = e.target.result;
    preview.style.display = 'block';
    placeholder.style.display = 'none';
  };
  reader.readAsDataURL(input.files[0]);
}

function runSafetyCheck() {
  const textInput = document.getElementById('safetyTextInput').value.trim();
  const hasImage = document.getElementById('safetyPreview').style.display !== 'none';

  if (!textInput && !hasImage) {
    showToast('请上传图片或输入查询内容');
    return;
  }

  const resultEl = document.getElementById('safetyResult');
  resultEl.style.display = 'block';
  resultEl.innerHTML = `<div class="loading"><div class="spinner"></div> AI 正在分析...</div>`;

  setTimeout(() => {
    const query = textInput || '上传的图片内容';
    const result = analyzeSafety(query, safetyMode);
    renderSafetyResult(resultEl, result, query);
  }, 1400);
}

const DANGEROUS = ['百合', '洋葱', '葱', '大蒜', '葡萄', '提子', '木糖醇', '巧克力', '可可', '咖啡', '酒精', '牛油果', '澳洲坚果', '夏威夷果', '茶叶', '烟草'];
const CAUTION = ['牛奶', '乳制品', '生肉', '生鱼', '肝脏', '橡皮树', '常春藤', '万年青', '滴水观音', '芦荟'];
const PLANTS_DANGEROUS = ['百合', '夹竹桃', '水仙', '郁金香', '绣球', '薰衣草'];

function analyzeSafety(query, mode) {
  const lower = query.toLowerCase();

  const isDangerous = DANGEROUS.some(d => lower.includes(d) || query.includes(d));
  const isCaution = !isDangerous && CAUTION.some(c => lower.includes(c) || query.includes(c));
  const isPlantDanger = mode === 'plant' && PLANTS_DANGEROUS.some(p => query.includes(p));

  if (isDangerous || isPlantDanger) return 'danger';
  if (isCaution) return 'caution';
  return 'safe';
}

function renderSafetyResult(el, level, query) {
  const petContext = state.pet ? `，考虑到 ${state.pet.name}${state.pet.allergies ? `（已知${state.pet.allergies}）` : ''}的具体情况` : '';

  const templates = {
    danger: {
      icon: '🚨',
      label: '对猫咪有害，请立即远离',
      color: 'danger',
      body: `<strong>${query}</strong> 对猫咪具有毒性${petContext}。<br/><br/>
        <strong>危害说明：</strong>可能引起肾脏损伤、溶血性贫血、肝脏损伤等严重后果，少量摄入即可致命。<br/><br/>
        <strong>紧急处理：</strong><br/>
        • 立即将该物品移到猫咪无法接触的地方<br/>
        • 如果猫咪已经摄入，请<strong>立即就医</strong>，不要催吐（可能加重伤害）<br/>
        • 就医时告知摄入物品名称和估计量<br/><br/>
        <strong>预防建议：</strong>家中种植或存放时请放置在猫咪完全无法接触的封闭区域。`,
    },
    caution: {
      icon: '⚠️',
      label: '需谨慎，可能引起不适',
      color: 'warning',
      body: `<strong>${query}</strong> 对大多数猫咪影响较小，但可能引起轻微不适${petContext}。<br/><br/>
        <strong>注意事项：</strong><br/>
        • 小量偶尔接触通常不会造成严重问题<br/>
        • 建议避免大量或频繁接触<br/>
        • 如出现呕吐、腹泻、精神萎靡等症状，请咨询兽医<br/><br/>
        <strong>科普：</strong>猫咪的消化系统与人类差异较大，部分对人无害的食物对猫却存在风险，建议以专用猫粮为主食。`,
    },
    safe: {
      icon: '✅',
      label: '相对安全，无明显毒性',
      color: 'safe',
      body: `<strong>${query}</strong> 对猫咪通常是安全的${petContext}，目前无已知毒性记录。<br/><br/>
        <strong>温馨提示：</strong><br/>
        • 即便是安全食物，也建议适量给予，不替代正规猫粮<br/>
        • 每只猫咪体质不同，初次接触新食物请少量尝试<br/>
        • 如有任何疑虑或猫咪出现异常反应，请咨询专业兽医<br/><br/>
        <strong>延伸建议：</strong>保持均衡的猫咪日常饮食，定期进行健康检查是最好的预防手段。`,
    },
  };

  const t = templates[level];
  el.innerHTML = `
    <div class="result-status ${t.color}">${t.icon} ${t.label}</div>
    <div class="result-body">${t.body}</div>`;
}

// ===== Health Chat =====
let chatHistory = [];

function sendHealthQuery() {
  const input = document.getElementById('healthInput');
  const text = input.value.trim();
  if (!text) return;

  appendChatMessage(text, 'user');
  input.value = '';

  const container = document.getElementById('chatContainer');
  const loadingId = 'loading-' + Date.now();
  container.innerHTML += `<div class="chat-message ai-message" id="${loadingId}">
    <div class="message-avatar">🐾</div>
    <div class="message-bubble"><div class="loading"><div class="spinner"></div> 正在分析...</div></div>
  </div>`;
  container.scrollTop = container.scrollHeight;

  setTimeout(() => {
    const response = generateHealthResponse(text);
    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) loadingEl.remove();
    appendChatMessage(response, 'ai');
  }, 1600);
}

function appendChatMessage(text, role) {
  const container = document.getElementById('chatContainer');
  const isAI = role === 'ai';
  container.innerHTML += `
    <div class="chat-message ${isAI ? 'ai-message' : 'user-message'}">
      <div class="message-avatar">${isAI ? '🐾' : '😊'}</div>
      <div class="message-bubble">${isAI ? text : escHtml(text)}</div>
    </div>`;
  container.scrollTop = container.scrollHeight;
}

function generateHealthResponse(query) {
  const lower = query.toLowerCase();
  const petName = state.pet ? state.pet.name : '你的猫咪';
  const petContext = state.pet
    ? `基于 ${petName}${state.pet.breed ? `（${state.pet.breed}）` : ''}${state.pet.allergies ? `，已知${state.pet.allergies}` : ''} 的情况：`
    : '';

  if (lower.includes('不吃') || lower.includes('没吃') || lower.includes('绝食') || lower.includes('食欲')) {
    return `${petContext}<br/><br/>
      <strong>可能原因分析：</strong><br/>
      • <strong>轻微情况</strong>：换了新猫粮口味、环境变化、天气热<br/>
      • <strong>需关注</strong>：应激反应、口腔问题（牙痛/口炎）、消化不良<br/>
      • <strong>较严重</strong>：肾病、胰腺炎、肝病、感染性疾病<br/><br/>
      <strong>观察建议：</strong><br/>
      • 绝食超过 24 小时请就诊（尤其是肥猫，可能引发肝脂肪变性）<br/>
      • 观察是否有其他症状：呕吐、腹泻、精神萎靡、饮水增多<br/><br/>
      <strong>如果同时伴有</strong>呕吐和精神差，建议今天就带去兽医。`;
  }

  if (lower.includes('呕吐') || lower.includes('吐了') || lower.includes('吐') && lower.includes('次')) {
    return `${petContext}<br/><br/>
      <strong>呕吐频率判断：</strong><br/>
      • <strong>偶尔一次（毛球/进食过快）</strong>：无需太担心，可补充化毛膏，进食放慢<br/>
      • <strong>当天多次呕吐</strong>：可能是肠胃炎、异物摄入、中毒<br/>
      • <strong>持续超过24小时</strong>：建议立即就诊<br/><br/>
      <strong>呕吐物观察：</strong><br/>
      • 黄绿色（胆汁）：空腹过久或肠道问题<br/>
      • 血丝：立即就诊<br/>
      • 含未消化食物：进食过快或食物不耐受<br/><br/>
      请问呕吐了几次？呕吐物的颜色和状态怎样？`;
  }

  if (lower.includes('腹泻') || lower.includes('拉稀') || lower.includes('软便')) {
    return `${petContext}<br/><br/>
      <strong>腹泻常见原因：</strong><br/>
      • 换粮过快、食物不耐受（尤其是乳制品）<br/>
      • 肠道寄生虫（需粪检）<br/>
      • 细菌/病毒感染<br/>
      • 应激、抗生素副作用<br/><br/>
      <strong>处理建议：</strong><br/>
      • 轻微软便：换回原来的猫粮，暂停零食<br/>
      • 水样腹泻或血便：<strong>当天就诊</strong><br/>
      • 持续超过 2 天：就诊做粪便检查<br/><br/>
      注意补充水分，避免脱水。是否有血便或黏液便？`;
  }

  if (lower.includes('精神') || lower.includes('没精神') || lower.includes('萎靡')) {
    return `${petContext}<br/><br/>
      <strong>精神状态评估：</strong>精神差是多种疾病的共同表现，需结合其他症状判断。<br/><br/>
      <strong>请观察以下情况：</strong><br/>
      • 饮食和饮水是否正常<br/>
      • 体温是否正常（正常 38-39.5°C）<br/>
      • 是否有其他症状：呕吐、腹泻、咳嗽、流鼻涕<br/>
      • 最近是否有应激事件（搬家、新成员、打雷等）<br/><br/>
      <strong>一般建议：</strong>若精神差持续超过 24 小时，建议就诊做基础检查。你能描述一下具体的表现吗？`;
  }

  if (lower.includes('皮肤') || lower.includes('掉毛') || lower.includes('瘙痒') || lower.includes('抓') || lower.includes('红疹')) {
    return `${petContext}<br/><br/>
      <strong>皮肤问题常见原因：</strong><br/>
      • <strong>体外寄生虫</strong>：跳蚤（检查腹部细小黑点）、螨虫<br/>
      • <strong>过敏反应</strong>：食物过敏、环境过敏（花粉、清洁剂）<br/>
      • <strong>真菌感染</strong>：猫癣（圆形脱毛斑，可传人）<br/>
      • <strong>季节性换毛</strong>：春秋大量掉毛属正常<br/><br/>
      <strong>建议：</strong><br/>
      • 如有圆形脱毛斑，请戴手套处理并及时就诊（可能传染人）<br/>
      • 定期做体外驱虫是最好的预防措施<br/>
      • 皮肤问题建议就诊做皮肤镜检查确诊`;
  }

  // Generic response
  return `${petContext}<br/><br/>
    感谢你描述的情况。作为 AI 健康顾问，我建议：<br/><br/>
    <strong>基本观察清单：</strong><br/>
    • 进食和饮水是否正常<br/>
    • 排便是否规律、形态正常<br/>
    • 精神状态和活动量<br/>
    • 是否有可见异常（分泌物、肿胀、伤口）<br/><br/>
    <strong>就诊参考：</strong>若症状持续超过 24-48 小时，或伴随精神明显萎靡、完全不进食，建议尽快就诊。<br/><br/>
    你可以告诉我更多具体症状，我会给出更有针对性的分析。<br/><br/>
    <small style="color:var(--text-secondary)">⚠️ 以上建议仅供参考，不替代专业兽医诊断</small>`;
}

function renderHealthContext() {
  if (!state.pet) return;
  const p = state.pet;
  document.getElementById('contextPetName').textContent = p.name;
  document.getElementById('contextAge').textContent = p.birthday ? calcAge(p.birthday) : '';
  document.getElementById('contextBreed').textContent = p.breed || '';
}

// ===== Reminders =====
const PRESET_CONFIG = {
  vaccine:    { title: '疫苗接种', type: 'vaccine',   icon: '💉', days: 365 },
  deworming:  { title: '体内驱虫', type: 'deworming', icon: '🐛', days: 90 },
  flea:       { title: '体外驱虫', type: 'deworming', icon: '🪲', days: 30 },
  checkup:    { title: '年度体检', type: 'checkup',   icon: '🏥', days: 365 },
  grooming:   { title: '美容护理', type: 'grooming',  icon: '✂️', days: 30 },
  teeth:      { title: '洁牙护理', type: 'other',     icon: '🦷', days: 180 },
};

function addPresetReminder(key) {
  const config = PRESET_CONFIG[key];
  const date = new Date();
  date.setDate(date.getDate() + config.days);

  state.reminders.push({
    id: Date.now(),
    title: config.title,
    date: date.toISOString().split('T')[0],
    type: config.type,
    note: `每 ${config.days} 天一次`,
    icon: config.icon,
  });

  saveToStorage();
  renderReminders();
  renderHomeStats();
  showToast(`${config.title} 提醒已添加 ✓`);
}

function saveReminder() {
  const title = document.getElementById('reminderTitle').value.trim();
  const date = document.getElementById('reminderDate').value;
  if (!title) { showToast('请填写提醒事项'); return; }
  if (!date) { showToast('请选择提醒日期'); return; }

  const typeIcons = { vaccine: '💉', deworming: '🐛', checkup: '🏥', grooming: '✂️', other: '📌' };
  const type = document.getElementById('reminderType').value;

  state.reminders.push({
    id: Date.now(),
    title,
    date,
    type,
    note: document.getElementById('reminderNote').value.trim(),
    icon: typeIcons[type] || '📌',
  });

  saveToStorage();
  renderReminders();
  renderHomeStats();
  closeModal('reminderModal');
  showToast('提醒已添加 ✓');

  document.getElementById('reminderTitle').value = '';
  document.getElementById('reminderNote').value = '';
}

function deleteReminder(id) {
  state.reminders = state.reminders.filter(r => r.id !== id);
  saveToStorage();
  renderReminders();
  renderHomeStats();
}

function renderReminders() {
  const el = document.getElementById('remindersList');
  if (!state.reminders.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">🔔</div><p>暂无提醒，添加疫苗、驱虫等计划吧</p></div>`;
    return;
  }

  const sorted = [...state.reminders].sort((a, b) => a.date.localeCompare(b.date));
  const today = new Date(); today.setHours(0,0,0,0);

  el.innerHTML = sorted.map(r => {
    const rDate = new Date(r.date);
    const diff = Math.round((rDate - today) / 86400000);
    let status, badgeClass, badgeText;

    if (diff < 0) { status = 'overdue'; badgeClass = 'badge-overdue'; badgeText = `已逾期 ${Math.abs(diff)} 天`; }
    else if (diff <= 7) { status = 'soon'; badgeClass = 'badge-soon'; badgeText = diff === 0 ? '今天' : `${diff} 天后`; }
    else { status = 'ok'; badgeClass = 'badge-ok'; badgeText = `${diff} 天后`; }

    return `<div class="reminder-item ${status}">
      <div class="reminder-icon">${r.icon || '📌'}</div>
      <div class="reminder-content">
        <div class="reminder-title">${escHtml(r.title)}</div>
        <div class="reminder-date">${r.date}</div>
        ${r.note ? `<div class="reminder-note">${escHtml(r.note)}</div>` : ''}
      </div>
      <span class="reminder-days-badge ${badgeClass}">${badgeText}</span>
      <button class="reminder-delete" onclick="deleteReminder(${r.id})">🗑</button>
    </div>`;
  }).join('');
}

// ===== Companion Banner =====
function renderCompanionBanner() {
  if (!state.pet || !state.pet.birthday) {
    document.getElementById('companionDays').textContent = '—';
    document.getElementById('companionPetName').textContent = '设置猫咪档案后显示';
    return;
  }
  const days = calcDays(state.pet.birthday);
  document.getElementById('companionDays').textContent = days;
  document.getElementById('companionPetName').textContent = state.pet.name;
}

// ===== Home Stats =====
function renderHomeStats() {
  const statsEl = document.getElementById('homeStats');
  if (state.pet) {
    statsEl.style.display = 'flex';
    const days = state.pet.birthday ? calcDays(state.pet.birthday) : 0;
    document.getElementById('statDays').textContent = days;
    document.getElementById('statRecords').textContent = state.records.length;
    document.getElementById('statReminders').textContent = state.reminders.length;
  }
}

// ===== Modals =====
function openModal(id) {
  if (id === 'profileModal') { openProfileModal(); return; }
  document.getElementById(id).classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

// Override openModal for profile
function openModal(id) {
  const el = document.getElementById(id);
  if (id === 'profileModal' && state.pet) {
    document.getElementById('petName').value = state.pet.name || '';
    document.getElementById('petBreed').value = state.pet.breed || '';
    document.getElementById('petGender').value = state.pet.gender || '';
    document.getElementById('petBirthday').value = state.pet.birthday || '';
    document.getElementById('petWeight').value = state.pet.weight || '';
    document.getElementById('petNeutered').value = state.pet.neutered || '';
    document.getElementById('petAllergies').value = state.pet.allergies || '';
    document.getElementById('petNotes').value = state.pet.notes || '';
  }
  // Reset date fields for new modals
  if (id === 'recordModal') {
    document.getElementById('recordDate').value = new Date().toISOString().split('T')[0];
  }
  if (id === 'reminderModal') {
    document.getElementById('reminderDate').value = new Date().toISOString().split('T')[0];
  }
  el.classList.add('open');
}

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

// ===== Toast =====
let toastTimeout;
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 2500);
}

// ===== Utilities =====
function calcDays(dateStr) {
  const birth = new Date(dateStr);
  const now = new Date();
  return Math.max(0, Math.floor((now - birth) / 86400000));
}

function calcAge(dateStr) {
  const birth = new Date(dateStr);
  const now = new Date();
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (months < 12) return `${months} 个月`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years} 岁 ${rem} 个月` : `${years} 岁`;
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Keyboard shortcut: Enter to send health query
document.getElementById('healthInput').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendHealthQuery();
  }
});

// ===== Start =====
init();
