const translations = {
  en: {
    meta: { title: 'cyboREVL — A permanent place for what you want to remember', description: 'cyboREVL keeps the things you want to remember close, with the ease of a sticky note and the memory of a knowledge base.' },
    nav: { system: 'How it works', hardware: 'Hardware', why: 'Why cyboREVL' },
    header: { cta: 'Join the first drop' },
    aria: { principles: 'Product principles', steps: 'cyboREVL interaction steps', sceneControls: 'Scene controls', benefits: 'cyboREVL benefits', switchToChinese: 'Switch to Chinese language', switchToEnglish: 'Switch to English language' },
    hero: { kicker: 'Personal cognitive hardware / 01', title: 'As direct as a sticky note.<span class="hero-break"></span>As lasting as a knowledge base.', intro: 'A Todo and memory layer for life, not a work task list. Close the loop on fragmented information, so saved items become part of you instead of staying trapped in a list.', primaryCta: 'Get early access', secondaryCta: 'See how it works', metaOne: 'Paper-note immediacy', metaTwo: 'Always with you', metaThree: 'Memory over time', note: 'A second surface for what you want to remember.' },
    scene: { title: 'A second surface', body: 'A real-world scene will go here.', aria: 'cyboREVL in use on a commuter train', variants: [{ index: 'SCENE / 01', title: 'A second surface', body: 'A real-world scene will go here.' }, { index: 'SCENE / 02', title: 'A thought in motion', body: 'For the commute, the queue, or the minute before the next thing.' }, { index: 'SCENE / 03', title: 'A place to return', body: 'For the moment a useful idea becomes yours.' }] },
    ticker: { capture: 'CAPTURE WITHOUT SWITCHING', visible: 'VISIBLE BY DEFAULT', human: 'KEEP THINKING HUMAN', between: 'BUILT FOR THE IN-BETWEEN' },
    system: { eyebrow: 'How it works', title: 'Give your mind a little room.', intro: 'Jot it down. Let AI help sort it. Open it again when you have a few minutes.', backplate: 'MAGNETIC BACKPLATE', display: 'REFLECTIVE DISPLAY' },
    experience: {
      activeLabel: 'ACTIVE LOOP / 01',
      capture: { tab: 'Save it', short: 'While it is still in your head', title: 'Save it before it slips away.', body: 'Press the physical key and say it out loud. cyboREVL keeps it for you, so you can stay with whatever is happening around you.', foot: 'PHYSICAL KEY / VOICE NOTE' },
      structure: { tab: 'Sort it', short: 'Without another list to manage', title: 'Make sense of what you saved.', body: 'AI can sort the note for you, but you decide what is worth keeping and what happens next.', foot: 'AI SORTING / YOUR CONTEXT' },
      return: { tab: 'Come back to it', short: 'One push away', title: 'Come back to it.', body: 'When you have a minute, push it open and take another look. Read a line, add one thought, and keep going.', foot: 'QUICK REVIEW / NEXT STEP' },
    },
    hardware: { eyebrow: 'Hardware for everyday gaps', title: 'A second surface on the back of your phone.', intro: 'It sits on the back of your phone. Write when you need to, look when you want to. Folded shut, it stays thin and quiet.', cta: 'See the hardware', productLabel: 'OPEN / SAME PLANE', labelDisplay: '2.8″ FAST-REFRESH E-INK DISPLAY', labelProfile: '≤ 5.5 MM FOLDED PROFILE', labelWeight: '≤ 60 G TARGET WEIGHT', specDisplay: 'Fast-refresh e-ink display', specProfile: 'Folded profile target', specWeight: 'Target weight', specSync: 'Low-power sync' },
    why: { eyebrow: 'Why cyboREVL?', title: 'Let information step outside the platform, so fragmented knowledge can keep moving with you.', intro: 'cyboREVL is not another list for collecting things. It is a word-cloud environment built around you.', focus: { title: 'Stay with what you are doing.', short: 'No switching. No lost context.', body: 'Skip the back-and-forth between apps. The thought stays where you can see it.', tag: 'FOCUS' }, portable: { title: 'Take your notes with you.', short: 'For life and learning.', body: 'What you save stays yours. It can follow you from one part of life to another, outside any one app.', tag: 'YOURS' }, human: { title: 'Let AI help with the sorting.', short: 'Clearer, without taking over.', body: 'AI can organize and remind you to look again. You decide what to do with it.', tag: 'YOUR CALL' } },
    idea: { eyebrow: 'Why we are making it', title: 'Let AI help you sort things.<br /><em>You decide what stays.</em>', body: 'We are not trying to build another place to store everything. We want the things you care about to come back when you are ready for them.' },
    specs: { eyebrow: 'First hardware version', titleOne: 'Quiet structure.', titleTwo: 'Easy to use.', note: 'This is the first hardware version. We want to see it in real life, then keep improving the details.', formLabel: 'FORM', formValue: 'Magnetic backplate + damping hinge', inputLabel: 'INPUT', inputValue: 'Physical capture key + haptic cue', syncLabel: 'SYNC', syncValue: 'Bluetooth Low Energy 5.2+', materialLabel: 'MATERIAL', materialValue: 'Recycled polycarbonate / soft-touch frame' },
    waitlist: { eyebrow: 'First drop / 2026', title: 'Leave room for the next idea.', intro: 'Leave your email and follow the prototype. We will let you know when the first drop is ready.', aside: 'No subscriptions. Only the updates you asked for.' },
    form: { nameLabel: 'Your name', namePlaceholder: 'What should we call you?', emailLabel: 'Email address', emailPlaceholder: 'you@example.com', messageLabel: 'What would you want to keep close?', messagePlaceholder: 'Something you want to remember…', optional: 'Optional', submit: 'Join the early list', joining: 'Joining…', joined: 'Joined ✓', nameError: 'Please add your name.', emailError: 'Please enter a valid email.', success: 'Got it. We will be in touch.', genericError: 'Could not send that. Please try again.', staticNotice: 'The public preview is live. Signup collection will be connected next.' },
    footer: { tagline: 'Personal hardware for everyday life.', earlyAccess: 'Early access' },
    images: { opened: 'cyboREVL shown opened behind a phone', side: 'cyboREVL attached next to a phone in side view', heroScene: 'cyboREVL in use on a commuter train', heroProduct: 'cyboREVL shown attached to a phone' },
  },
  zh: {
    meta: { title: 'cyboREVL — 一块随身常驻的记忆表面', description: 'cyboREVL 把想记的事放在身边，像便利贴一样顺手，也能留下长期记忆。' },
    nav: { system: '怎么用', hardware: '硬件', why: '为什么是 cyboREVL' },
    header: { cta: '加入首批体验' },
    aria: { principles: '产品原则', steps: 'cyboREVL 交互步骤', sceneControls: '场景切换', benefits: 'cyboREVL 核心卖点', switchToChinese: '切换到中文', switchToEnglish: '切换到英文' },
    hero: { kicker: '个人认知硬件 / 01', title: '像便利贴一样直接，<span class="hero-break"></span>像知识库一样记得。', intro: '面向人的 Todo 与备忘，而不是面向工作的任务清单。把碎片化信息的闭环链路续上，让“收藏夹”内化到个人，而不是一直躺在列表。', primaryCta: '获取首发资格', secondaryCta: '看看它如何工作', metaOne: '便利贴的直接', metaTwo: '随身常驻的位置', metaThree: '按时间记住', note: '一块为记忆而生的第二表面。' },
    scene: { title: '一块第二表面', body: '真实使用场景图正在准备。', aria: '通勤列车上使用 cyboREVL 的场景', variants: [{ index: '场景 / 01', title: '一块第二表面', body: '真实使用场景图正在准备。' }, { index: '场景 / 02', title: '一个正在发生的想法', body: '通勤、排队，或下一件事开始前的那一分钟。' }, { index: '场景 / 03', title: '一个可以回到的地方', body: '让一个有用的想法真正回到你手里。' }] },
    ticker: { capture: '随手记下来', visible: '一直看得见', human: '留给自己决定', between: '放在日常里' },
    system: { eyebrow: '怎么用', title: '给脑子留一点空档。', intro: '先记下来，等 AI 帮你理清。想回看的时候，推开它就行。', backplate: '磁吸背板', display: '反射式显示屏' },
    experience: {
      activeLabel: '当前闭环 / 01',
      capture: { tab: '记下来', short: '趁它还在脑中', title: '先把这件事记下来。', body: '按一下实体按键，直接说。cyboREVL 先替你收好，不用停下手里的事。', foot: '实体按键 / 语音记录' },
      structure: { tab: '理一理', short: '不用再翻列表', title: '把收藏的内容理出头绪。', body: 'AI 会帮你分门别类，但什么值得留下，还是由你来决定。', foot: 'AI 归类 / 个人语境' },
      return: { tab: '回到它', short: '单手一推就出现', title: '回到它。', body: '有空的时候，单手推开它看一眼。三分钟也够，读一段，补一句，再接着走。', foot: '随手回看 / 下一步' },
    },
    hardware: { eyebrow: '放在日常里的硬件', title: '一块放在手机背后的第二表面。', intro: '它贴在手机背后，想记就记，想看就看。合上时很薄，不会抢走你的注意力。', cta: '看看硬件细节', productLabel: '展开 / 同一平面', labelDisplay: '2.8″ 快刷新墨水屏', labelProfile: '≤ 5.5 MM 折叠厚度', labelWeight: '≤ 60 G 目标重量', specDisplay: '快刷新墨水屏', specProfile: '折叠厚度目标', specWeight: '目标重量', specSync: '低功耗同步' },
    why: { eyebrow: '为什么做它', title: '让信息跳出平台框架，随时随地续上碎片知识', intro: 'cyboREVL 不是另一个用来堆收藏的列表。而是围绕你个人打造的词云环境。', focus: { title: '先把眼前这件事做好。', short: '不切换，也不丢上下文。', body: '少一点 App 之间的来回，想法就不会因为找不到而断掉。', tag: '专注' }, portable: { title: '收藏的东西，跟着你走。', short: '生活和学习都能用。', body: '你记下的东西属于你自己，可以跟着你走，不必绑在某个工作软件里。', tag: '归你' }, human: { title: 'AI 帮你整理，决定权在你。', short: '理清，不代替。', body: 'AI 可以归类，也可以提醒你回来看。要不要做、什么时候做，还是你说了算。', tag: '自己决定' } },
    idea: { eyebrow: '为什么做它', title: '让 AI 帮你整理。<br /><em>记得什么，由你决定。</em>', body: '我们不想再做一个什么都能存的地方。我们想让你在需要的时候，找回真正想记住的事。' },
    specs: { eyebrow: '首版硬件', titleOne: '结构安静。', titleTwo: '用起来顺手。', note: '这是第一版硬件样机。先让它进入真实生活，再慢慢把细节做好。', formLabel: '形态', formValue: '磁吸背板 + 阻尼转轴', inputLabel: '输入', inputValue: '实体记录键 + 触觉反馈', syncLabel: '连接', syncValue: 'Bluetooth Low Energy 5.2+', materialLabel: '材质', materialValue: '再生聚碳酸酯 / 亲肤软触边框' },
    waitlist: { eyebrow: '首批体验 / 2026', title: '给下一个想法留个位置。', intro: '留下邮箱，看看原型进展。首批开放时，我们会先通知你。', aside: '不发打扰你的消息。' },
    form: { nameLabel: '你的名字', namePlaceholder: '怎么称呼你？', emailLabel: '邮箱地址', emailPlaceholder: 'you@example.com', messageLabel: '你想把什么留在身边？', messagePlaceholder: '一件你想记住的事……', optional: '选填', submit: '加入首批体验', joining: '提交中…', joined: '已加入 ✓', nameError: '请填写你的名字。', emailError: '请输入有效的邮箱地址。', success: '收到，我们会联系你。', genericError: '提交失败，请稍后再试。', staticNotice: '公开预览已经上线，首批体验登记服务将在后端接入后启用。' },
    footer: { tagline: '放在身边的个人硬件。', earlyAccess: '首批体验' },
    images: { opened: 'cyboREVL 在手机背后展开', side: 'cyboREVL 与手机并排连接的侧面视图', heroScene: '通勤列车上使用 cyboREVL', heroProduct: 'cyboREVL 与手机连接的产品形态' },
  },
};

const languageToggle = document.querySelector('[data-language-toggle]');
const languageKey = 'cyboREVL-language';
let currentLanguage = localStorage.getItem(languageKey) === 'zh' ? 'zh' : 'en';
const getTranslation = (key) => key.split('.').reduce((value, part) => value?.[part], translations[currentLanguage]);

function applyLanguage(language) {
  currentLanguage = language === 'zh' ? 'zh' : 'en';
  localStorage.setItem(languageKey, currentLanguage);
  document.documentElement.lang = currentLanguage === 'zh' ? 'zh-CN' : 'en';
  document.documentElement.dataset.language = currentLanguage;
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const value = getTranslation(element.dataset.i18n);
    if (value) element.innerHTML = value;
  });
  document.querySelectorAll('[data-i18n-attr]').forEach((element) => {
    element.dataset.i18nAttr.split(',').forEach((entry) => {
      const [attribute, key] = entry.split(':').map((item) => item.trim());
      const value = getTranslation(key);
      if (attribute && value) element.setAttribute(attribute, value);
    });
  });
  document.title = getTranslation('meta.title');
  languageToggle.querySelector('.lang-current').textContent = currentLanguage === 'en' ? 'EN' : '中';
  languageToggle.querySelector('.lang-next').textContent = currentLanguage === 'en' ? '中' : 'EN';
  languageToggle.setAttribute('aria-label', getTranslation(currentLanguage === 'en' ? 'aria.switchToChinese' : 'aria.switchToEnglish'));
  updateExperience(activeExperience);
}

languageToggle?.addEventListener('click', () => applyLanguage(currentLanguage === 'en' ? 'zh' : 'en'));

const heroSceneLayer = document.querySelector('.hero-scene-layer');
const heroSceneImages = [...document.querySelectorAll('.hero-scene-image')];
const heroProgressBars = [...document.querySelectorAll('.hero-progress-bar')];
let activeHeroScene = 'product';
let heroSceneTimer;

function setHeroScene(nextScene) {
  if (!heroSceneLayer || heroSceneImages.length < 2) return;
  activeHeroScene = nextScene;
  heroSceneLayer.classList.toggle('is-product-scene', nextScene === 'product');
  heroSceneLayer.classList.toggle('is-commute-scene', nextScene === 'commute');
  document.body.classList.toggle('hero-product-active', nextScene === 'product');
  heroSceneImages.forEach((image) => image.classList.toggle('is-active', image.classList.contains(`hero-scene-image-${nextScene}`)));
  heroProgressBars.forEach((bar, index) => {
    const isActive = (nextScene === 'product' && index === 0) || (nextScene === 'commute' && index === 1);
    bar.classList.toggle('is-active', isActive);
    const fill = bar.querySelector('i');
    if (fill && isActive) {
      fill.style.animation = 'none';
      void fill.offsetWidth;
      fill.style.animation = '';
    }
  });
}

function cycleHeroScene() {
  setHeroScene(activeHeroScene === 'product' ? 'commute' : 'product');
}

function scheduleHeroScene() {
  heroSceneTimer = window.setTimeout(() => {
    cycleHeroScene();
    scheduleHeroScene();
  }, 4000);
}

setHeroScene('product');
scheduleHeroScene();

const experienceTabs = [...document.querySelectorAll('[data-experience]')];
const experienceTitle = document.querySelector('[data-experience-title]');
const experienceBody = document.querySelector('[data-experience-body]');
let activeExperience = 'capture';

function updateExperience(key) {
  activeExperience = key;
  const content = translations[currentLanguage].experience[key];
  experienceTabs.forEach((tab) => {
    const isActive = tab.dataset.experience === key;
    tab.classList.toggle('is-active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
  });
  if (!content || !experienceTitle || !experienceBody) return;
  experienceTitle.textContent = content.title;
  experienceBody.textContent = content.body;
}

experienceTabs.forEach((tab) => tab.addEventListener('click', () => updateExperience(tab.dataset.experience)));

const form = document.querySelector('#feedback-form');
const nameInput = document.querySelector('#name');
const emailInput = document.querySelector('#email');
const messageInput = document.querySelector('#message');
const count = document.querySelector('#character-count');
const formStatus = document.querySelector('#form-status');
const submitButton = document.querySelector('.submit-button');
const isStaticPreview = window.location.hostname.endsWith('.github.io');
const showError = (id, message) => { const el = document.querySelector(id); if (el) el.textContent = message; };
const clearErrors = () => { showError('#name-error', ''); showError('#email-error', ''); };
messageInput?.addEventListener('input', () => { count.textContent = `${messageInput.value.length} / 200`; });

const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add('is-visible'); }), { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearErrors();
  formStatus.textContent = '';
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  let valid = true;
  if (!name) { showError('#name-error', getTranslation('form.nameError')); valid = false; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError('#email-error', getTranslation('form.emailError')); valid = false; }
  if (!valid) return;
  if (isStaticPreview) {
    formStatus.textContent = getTranslation('form.staticNotice');
    return;
  }
  submitButton.disabled = true;
  submitButton.querySelector('[data-i18n]').textContent = getTranslation('form.joining');
  const payload = Object.fromEntries(new FormData(form).entries());
  payload.favoriteColor = ['cream'];
  payload.features = ['memory'];
  payload.preferences = ['launch'];
  try {
    const response = await fetch('/feedback/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || getTranslation('form.genericError'));
    form.reset();
    count.textContent = '0 / 200';
    formStatus.textContent = getTranslation('form.success');
    submitButton.querySelector('[data-i18n]').textContent = getTranslation('form.joined');
  } catch (error) {
    formStatus.textContent = error.message || getTranslation('form.genericError');
    submitButton.disabled = false;
    submitButton.querySelector('[data-i18n]').textContent = getTranslation('form.submit');
  }
});

applyLanguage(currentLanguage);
