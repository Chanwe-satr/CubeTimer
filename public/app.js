// ================= 全局状态与配置 =================
let currentPuzzle = '333';
let currentScrambleStr = '';
let appState = 'IDLE'; // IDLE, HOLDING, READY, RUNNING
let timerStart = 0;
let timerInt = null;
let holdingTimeout = null;
let solves = []; // 内存中的成绩列表
let wakeLock = null;
let currentSolveTime = 0;
let currentAuthTab = 'login'; // login, register
let timerPrecision = localStorage.getItem('cubeTimerPrecision') || '2';

const API_BASE = '/api';

const SUSPICIOUS_THRESHOLDS = { 
    '222': 500, '333': 4000, '333oh': 4000, '333bld': 8000,
    '444': 15000, '555': 30000, '666': 60000, '777': 100000, 
    'pyram': 1000, 'mega': 20000, 'skewb': 1000, 'sq1': 4000, 'clock': 3000 
};

const PUZZLE_NAMES = { 
    '222': '2x2x2 Cube', '333': '3x3x3 Cube', '333oh': '3x3x3 (单手)', '333bld': '3x3x3 (盲拧)',
    '444': '4x4x4 Cube', '555': '5x5x5 Cube', '666': '6x6x6 Cube', '777': '7x7x7 Cube', 
    'pyram': 'Pyraminx', 'mega': 'Megaminx', 'skewb': 'Skewb', 'sq1': 'Square-1', 'clock': '魔表' 
};

// ================= DOM 元素引用 =================
let elTimer, elScramble, elVisualizer, elSelect, elInstruction, elTopControls;
let elAuthModal, elAuthBox, elAuthAlert, elAuthSubmitBtn;
let elSettingNicknameDisplay, elAccountActionArea, elSyncBtn;

// ================= 初始化入口 =================
window.addEventListener('DOMContentLoaded', () => {
    // 绑定 DOM 元素
    elTimer = document.getElementById('timerDisplay');
    elScramble = document.getElementById('scrambleDisplay');
    elVisualizer = document.getElementById('visualizer');
    elSelect = document.getElementById('puzzleType');
    elInstruction = document.getElementById('instruction');
    elTopControls = document.getElementById('topControls');
    
    elAuthModal = document.getElementById('authModal');
    elAuthBox = document.getElementById('authBox');
    elAuthAlert = document.getElementById('authAlert');
    elAuthSubmitBtn = document.getElementById('authSubmitBtn');
    elSettingNicknameDisplay = document.getElementById('settingNicknameDisplay');
    elAccountActionArea = document.getElementById('accountActionArea');
    elSyncBtn = document.getElementById('syncBtn');

    // 绑定触摸区域计时器操作
    const timerView = document.getElementById('timerView');
    timerView.addEventListener('touchstart', e => { 
        if (e.target.closest('select') || e.target.closest('.scramble-text') || e.target.closest('button')) return; 
        e.preventDefault(); 
        handleDown(); 
    }, { passive: false });
    timerView.addEventListener('touchend', e => { 
        if (e.target.closest('select') || e.target.closest('button')) return; 
        e.preventDefault(); 
        handleUp(); 
    });

    // 载入主题与设置
    initAppTheme();
    initTimerPrecision();
    
    // 初始化登录状态并加载历史数据
    checkLoginStatus().then(() => {
        loadHistory();
        newScramble();
    });
    
    // 监听键盘空格
    document.addEventListener('keydown', e => { 
        if (e.code === 'Space' && !e.repeat && !document.getElementById('timerView').classList.contains('hidden')) {
            handleDown(); 
        }
    }); 
    document.addEventListener('keyup', e => { 
        if (e.code === 'Space' && !document.getElementById('timerView').classList.contains('hidden')) {
            handleUp(); 
        }
    });
});

// ================= API 请求公共模块（支持降级） =================
async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('cubeToken');
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
    };
    
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
        if (response.status === 401 || response.status === 403) {
            handleLogout();
            throw new Error('登录失效，请重新登录');
        }
        return await response.json();
    } catch (err) {
        console.warn(`接口请求失败 [${endpoint}]:`, err.message);
        throw err;
    }
}

// ================= 用户认证与同步逻辑 =================

// 检查登录状态并渲染 UI
async function checkLoginStatus() {
    const token = localStorage.getItem('cubeToken');
    const nickname = localStorage.getItem('cubeNickname');
    const username = localStorage.getItem('cubeUsername');

    if (token && nickname) {
        elSettingNicknameDisplay.innerText = `已登录: ${nickname} (${username})`;
        elAccountActionArea.innerHTML = `<button onclick="window.handleLogout()" class="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition-colors">退出登录</button>`;
        elSyncBtn.disabled = false;
        return true;
    } else {
        elSettingNicknameDisplay.innerText = '未登录，同步服务不可用';
        elAccountActionArea.innerHTML = `<button onclick="window.showAuthModal()" class="bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition-colors">登录 / 注册</button>`;
        elSyncBtn.disabled = true;
        return false;
    }
}

// 展开登录/注册模态框
function showAuthModal() {
    elAuthAlert.innerText = '';
    elAuthModal.classList.remove('hidden');
    setTimeout(() => elAuthBox.classList.remove('scale-95', 'opacity-0'), 10);
    switchAuthTab('login');
}

function closeAuthModal() {
    elAuthBox.classList.add('scale-95', 'opacity-0');
    setTimeout(() => elAuthModal.classList.add('hidden'), 200);
}

// 切换登录/注册卡片页
function switchAuthTab(tab) {
    currentAuthTab = tab;
    elAuthAlert.innerText = '';
    const tabLogin = document.getElementById('authTabLogin');
    const tabRegister = document.getElementById('authTabRegister');
    const formLogin = document.getElementById('authLoginForm');
    const formRegister = document.getElementById('authRegisterForm');

    if (tab === 'login') {
        tabLogin.className = 'flex-1 pb-3 text-sm font-bold text-center border-b-2 border-blue-500 text-blue-500';
        tabRegister.className = 'flex-1 pb-3 text-sm font-bold text-center border-b-2 border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200';
        formLogin.classList.remove('hidden');
        formRegister.classList.add('hidden');
        elAuthSubmitBtn.innerText = '确认登录';
    } else {
        tabRegister.className = 'flex-1 pb-3 text-sm font-bold text-center border-b-2 border-blue-500 text-blue-500';
        tabLogin.className = 'flex-1 pb-3 text-sm font-bold text-center border-b-2 border-transparent text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200';
        formRegister.classList.remove('hidden');
        formLogin.classList.add('hidden');
        elAuthSubmitBtn.innerText = '立即注册';
    }
}

// 登录/注册提交
async function submitAuth() {
    elAuthAlert.innerText = '';
    
    if (currentAuthTab === 'login') {
        const u = document.getElementById('loginUsername').value.trim();
        const p = document.getElementById('loginPassword').value;

        if (!u || !p) {
            elAuthAlert.innerText = '请填写账号和密码';
            return;
        }

        try {
            elAuthSubmitBtn.disabled = true;
            elAuthSubmitBtn.innerText = '登录中...';
            const res = await apiRequest('/login', {
                method: 'POST',
                body: JSON.stringify({ username: u, password: p })
            });

            if (res.success) {
                localStorage.setItem('cubeToken', res.token);
                localStorage.setItem('cubeNickname', res.user.nickname);
                localStorage.setItem('cubeUsername', res.user.username);
                closeAuthModal();
                await checkLoginStatus();
                // 登录成功后，立即拉取服务器数据进行合并
                await syncData();
            } else {
                elAuthAlert.innerText = res.message || '登录失败';
            }
        } catch (err) {
            elAuthAlert.innerText = '连接本地服务器失败，请确保后端已启动';
        } finally {
            elAuthSubmitBtn.disabled = false;
            elAuthSubmitBtn.innerText = '确认登录';
        }
    } else {
        const u = document.getElementById('registerUsername').value.trim();
        const n = document.getElementById('registerNickname').value.trim();
        const p = document.getElementById('registerPassword').value;

        if (!u || !n || !p) {
            elAuthAlert.innerText = '请填全注册信息';
            return;
        }

        try {
            elAuthSubmitBtn.disabled = true;
            elAuthSubmitBtn.innerText = '注册中...';
            const res = await apiRequest('/register', {
                method: 'POST',
                body: JSON.stringify({ username: u, password: p, nickname: n })
            });

            if (res.success) {
                elAuthAlert.className = 'text-xs text-green-500 font-bold mt-4 text-center';
                elAuthAlert.innerText = '注册成功！正在切回登录页...';
                setTimeout(() => {
                    elAuthAlert.className = 'text-xs text-red-500 font-bold mt-4 text-center';
                    switchAuthTab('login');
                    document.getElementById('loginUsername').value = u;
                }, 1500);
            } else {
                elAuthAlert.innerText = res.message || '注册失败';
            }
        } catch (err) {
            elAuthAlert.innerText = '连接本地服务器失败';
        } finally {
            elAuthSubmitBtn.disabled = false;
            elAuthSubmitBtn.innerText = '立即注册';
        }
    }
}

// 退出登录
function handleLogout() {
    localStorage.removeItem('cubeToken');
    localStorage.removeItem('cubeNickname');
    localStorage.removeItem('cubeUsername');
    checkLoginStatus();
    loadHistory(); // 重新加载本地单机历史
}

// 手动或自动双向同步
async function syncData() {
    const token = localStorage.getItem('cubeToken');
    if (!token) return;

    elSyncBtn.disabled = true;
    elSyncBtn.innerText = '同步中...';

    try {
        // 将本地 localStorage 中的所有成绩传给服务器进行双向去重合并
        const localSolves = JSON.parse(localStorage.getItem('cubeSolvesPro') || '[]');
        const res = await apiRequest('/solves/sync', {
            method: 'POST',
            body: JSON.stringify({ solves: localSolves })
        });

        if (res.success && res.solves) {
            solves = res.solves;
            localStorage.setItem('cubeSolvesPro', JSON.stringify(solves));
            renderHistory();
            updateStats();
            elSyncBtn.innerText = '同步成功';
            setTimeout(() => {
                elSyncBtn.disabled = false;
                elSyncBtn.innerText = '立即同步';
            }, 2000);
        } else {
            throw new Error(res.message);
        }
    } catch (err) {
        elSyncBtn.innerText = '同步失败';
        setTimeout(() => {
            elSyncBtn.disabled = false;
            elSyncBtn.innerText = '立即同步';
        }, 2000);
    }
}

// ================= Tab 切换及色彩主题管理 =================
function switchTab(tabId) {
    if (tabId !== 'tutorial') {
        stopActiveAnimCube();
        expandedFormulaId = null;
    }

    document.querySelectorAll('.tab-view').forEach(el => { 
        el.classList.add('hidden'); 
        el.classList.remove('z-10'); 
        el.classList.add('z-0'); 
    });
    document.getElementById(tabId + 'View').classList.remove('hidden'); 
    document.getElementById(tabId + 'View').classList.add('z-10');
    
    document.querySelectorAll('.nav-btn').forEach(el => { 
        el.classList.remove('text-blue-500'); 
        el.classList.add('text-neutral-400', 'dark:text-neutral-500'); 
    });
    document.getElementById('nav-' + tabId).classList.remove('text-neutral-400', 'dark:text-neutral-500'); 
    document.getElementById('nav-' + tabId).classList.add('text-blue-500');
    
    if (tabId === 'history') { 
        document.getElementById('clearBtn').classList.remove('hidden'); 
        renderHistory(); 
    } else { 
        document.getElementById('clearBtn').classList.add('hidden'); 
    }

    if (tabId === 'community') {
        renderCommunity();
    }
    if (tabId === 'tutorial') {
        renderTutorial();
    }
}

function toggleTheme() {
    const isDark = document.getElementById('themeToggle').checked;
    if (isDark) {
        document.documentElement.classList.add('dark'); 
        document.getElementById('themeColorMeta').content = "#121212"; 
        localStorage.setItem('cubeTheme', 'dark');
    } else {
        document.documentElement.classList.remove('dark'); 
        document.getElementById('themeColorMeta').content = "#ffffff"; 
        localStorage.setItem('cubeTheme', 'light');
    }

    if (expandedFormulaId) {
        renderTutorial();
    }
}

function changeAppTheme() {
    const style = document.getElementById('appThemeSelect').value; 
    localStorage.setItem('appStyle', style);
    
    // 移除所有已选样式 class
    document.body.className = "flex flex-col text-neutral-900 dark:text-[#e5e5e5] transition-colors duration-300";
    
    if (style !== 'minimal') {
        document.body.classList.add(`theme-${style}`);
    }
}

function initAppTheme() {
    // 亮暗色初始化
    const cubeTheme = localStorage.getItem('cubeTheme') || 'dark';
    const toggle = document.getElementById('themeToggle');
    if (cubeTheme === 'light') {
        toggle.checked = false;
        document.documentElement.classList.remove('dark');
        document.getElementById('themeColorMeta').content = "#ffffff";
    } else {
        toggle.checked = true;
        document.documentElement.classList.add('dark');
        document.getElementById('themeColorMeta').content = "#121212";
    }

    // 配色方案初始化
    const savedStyle = localStorage.getItem('appStyle') || 'minimal';
    document.getElementById('appThemeSelect').value = savedStyle;
    changeAppTheme();
}

function initTimerPrecision() {
    const savedPrecision = localStorage.getItem('cubeTimerPrecision') || '2';
    timerPrecision = savedPrecision;
    const select = document.getElementById('timerPrecisionSelect');
    if (select) {
        select.value = savedPrecision;
    }
    if (typeof elTimer !== 'undefined' && elTimer) {
        elTimer.innerText = formatTime(0);
    }
}

function changeTimerPrecision() {
    const precision = document.getElementById('timerPrecisionSelect').value;
    timerPrecision = precision;
    localStorage.setItem('cubeTimerPrecision', precision);
    
    if (typeof currentSolveTime !== 'undefined') {
        elTimer.innerText = formatTime(currentSolveTime);
    } else {
        elTimer.innerText = formatTime(0);
    }
    renderHistory();
}

// ================= WCA SVG 离线魔方渲染引擎 (2x2-7x7) =================
const COLORS = { U: 'c-w', R: 'c-r', F: 'c-g', D: 'c-y', L: 'c-o', B: 'c-b' };
function getSolvedState(size) { 
    const faces = ['U', 'R', 'F', 'D', 'L', 'B']; 
    const state = {}; 
    faces.forEach(f => state[f] = Array(size * size).fill(COLORS[f])); 
    return state; 
}
function getRow(size, r, rev=false) { let res = []; for(let c=0; c<size; c++) res.push(r*size + c); return rev ? res.reverse() : res; }
function getCol(size, c, rev=false) { let res = []; for(let r=0; r<size; r++) res.push(r*size + c); return rev ? res.reverse() : res; }
function cycleFaceNxN(state, face, size) { 
    const arr = state[face], old = [...arr]; 
    for(let r=0; r<size; r++) { 
        for(let c=0; c<size; c++) { 
            state[face][r*size + c] = old[(size-1-c)*size + r]; 
        } 
    } 
}
function cycleSides(state, faces, iList) { 
    const vals = faces.map((f, i) => iList[i].map(idx => state[f][idx])); 
    iList[1].forEach((idx, i) => state[faces[1]][idx] = vals[0][i]); 
    iList[2].forEach((idx, i) => state[faces[2]][idx] = vals[1][i]); 
    iList[3].forEach((idx, i) => state[faces[3]][idx] = vals[2][i]); 
    iList[0].forEach((idx, i) => state[faces[0]][idx] = vals[3][i]); 
}
function doMove(state, size, bMove, depth) {
    let f, iL;
    if (bMove === 'U') { f = ['F', 'L', 'B', 'R']; iL = [getRow(size, depth), getRow(size, depth), getRow(size, depth), getRow(size, depth)]; }
    else if (bMove === 'D') { f = ['F', 'R', 'B', 'L']; iL = [getRow(size, size-1-depth), getRow(size, size-1-depth), getRow(size, size-1-depth), getRow(size, size-1-depth)]; }
    else if (bMove === 'F') { f = ['U', 'R', 'D', 'L']; iL = [getRow(size, size-1-depth), getCol(size, depth), getRow(size, depth, true), getCol(size, size-1-depth, true)]; }
    else if (bMove === 'B') { f = ['U', 'L', 'D', 'R']; iL = [getRow(size, depth, true), getCol(size, depth), getRow(size, size-1-depth), getCol(size, size-1-depth, true)]; }
    else if (bMove === 'L') { f = ['U', 'F', 'D', 'B']; iL = [getCol(size, depth), getCol(size, depth), getCol(size, depth), getCol(size, size-1-depth, true)]; }
    else if (bMove === 'R') { f = ['U', 'B', 'D', 'F']; iL = [getCol(size, size-1-depth, true), getCol(size, depth), getCol(size, size-1-depth, true), getCol(size, size-1-depth, true)]; }
    if (depth === 0) cycleFaceNxN(state, bMove, size); 
    cycleSides(state, f, iL);
}
function applyMove(state, move, type) {
    const size = parseInt(type[0]); 
    let base = move[0], mod = "", depths = [0];
    if (move.includes('w')) { 
        let wIdx = move.indexOf('w'); 
        base = move[wIdx - 1]; 
        let wC = parseInt(move.substring(0, wIdx - 1)) || 2; 
        depths = []; 
        for(let i=0; i<wC; i++) depths.push(i); 
        mod = move.substring(wIdx + 1); 
    } else { 
        mod = move.slice(1); 
    }
    let t = mod === "2" ? 2 : (mod === "'" ? 3 : 1);
    for(let k=0; k<t; k++) depths.forEach(d => doMove(state, size, base, d));
}

function renderCubeSVG(state, type) {
    const size = parseInt(type[0]); 
    const baseSizes = { 2: 24, 3: 16, 4: 12, 5: 9, 6: 7, 7: 6 }; 
    const cellSize = baseSizes[size] || 15; 
    const gap = 16, faceSize = size * cellSize; 
    const offsets = { 
        U: [faceSize + gap, 0], 
        L: [0, faceSize + gap], 
        F: [faceSize + gap, faceSize + gap], 
        R: [(faceSize + gap) * 2, faceSize + gap], 
        B: [(faceSize + gap) * 3, faceSize + gap], 
        D: [faceSize + gap, (faceSize + gap) * 2] 
    };
    let svgHTML = `<svg viewBox="0 0 ${faceSize*4 + gap*3} ${faceSize*3 + gap*2}" class="h-full w-auto drop-shadow-md">`;
    ['U', 'L', 'F', 'R', 'B', 'D'].forEach(face => {
        const [ox, oy] = offsets[face];
        state[face].forEach((cClass, idx) => {
            svgHTML += `<rect x="${ox + (idx%size)*cellSize}" y="${oy + Math.floor(idx/size)*cellSize}" width="${cellSize}" height="${cellSize}" class="cube-face ${cClass}" />`;
        });
    });
    return svgHTML + '</svg>';
}

// ================= 金字塔 SVG 渲染 =================
function getPyraSolvedState() { 
    return { 
        'F': Array(9).fill('c-g'), 
        'D': Array(9).fill('c-y'), 
        'L': Array(9).fill('c-b'), 
        'R': Array(9).fill('c-r') 
    }; 
}
function pyraCycle(state, scramble) {
    let cyc3 = (f1, i1, f2, i2, f3, i3) => { 
        let temp = state[f3][i3]; 
        state[f3][i3] = state[f2][i2]; 
        state[f2][i2] = state[f1][i1]; 
        state[f1][i1] = temp; 
    };
    for (let m of scramble.split(' ')) {
        if (!m) continue; 
        let base = m[0], times = m.includes("'") ? 2 : 1;
        for(let k=0; k<times; k++) {
            if (base === 'U' || base === 'u') cyc3('F',0, 'L',0, 'R',0);
            if (base === 'U') { cyc3('F',2,'L',2,'R',2); cyc3('F',1,'L',1,'R',1); cyc3('F',3,'L',3,'R',3); }
            if (base === 'L' || base === 'l') cyc3('F',4, 'D',0, 'L',8);
            if (base === 'L') { cyc3('F',5,'D',1,'L',7); cyc3('F',6,'D',5,'L',3); cyc3('F',1,'D',2,'L',6); }
            if (base === 'R' || base === 'r') cyc3('F',8, 'R',4, 'D',4);
            if (base === 'R') { cyc3('F',7,'R',5,'D',3); cyc3('F',3,'R',6,'D',2); cyc3('F',6,'R',1,'D',7); }
            if (base === 'B' || base === 'b') cyc3('D',8, 'R',8, 'L',4);
            if (base === 'B') { cyc3('D',6,'R',7,'L',5); cyc3('D',7,'R',3,'L',6); cyc3('D',5,'R',6,'L',1); }
        }
    }
}
function drawPyraFace(ox, oy, isUp, stateArr) {
    let svg = "", w = 22, h = 19.05;
    let pU = (cx, cy) => `${cx},${cy} ${cx-w/2},${cy+h} ${cx+w/2},${cy+h}`;
    let pD = (cx, cy) => `${cx-w/2},${cy} ${cx+w/2},${cy} ${cx},${cy+h}`;
    if(isUp) {
        svg += `<polygon points="${pU(ox, oy)}" class="cube-face ${stateArr[0]}" /><polygon points="${pU(ox-w/2, oy+h)}" class="cube-face ${stateArr[1]}" /><polygon points="${pD(ox, oy+h)}" class="cube-face ${stateArr[2]}" /><polygon points="${pU(ox+w/2, oy+h)}" class="cube-face ${stateArr[3]}" /><polygon points="${pU(ox-w, oy+2*h)}" class="cube-face ${stateArr[4]}" /><polygon points="${pD(ox-w/2, oy+2*h)}" class="cube-face ${stateArr[5]}" /><polygon points="${pU(ox, oy+2*h)}" class="cube-face ${stateArr[6]}" /><polygon points="${pD(ox+w/2, oy+2*h)}" class="cube-face ${stateArr[7]}" /><polygon points="${pU(ox+w, oy+2*h)}" class="cube-face ${stateArr[8]}" />`;
    } else {
        svg += `<polygon points="${pD(ox-w, oy)}" class="cube-face ${stateArr[0]}" /><polygon points="${pU(ox-w/2, oy)}" class="cube-face ${stateArr[1]}" /><polygon points="${pD(ox, oy)}" class="cube-face ${stateArr[2]}" /><polygon points="${pU(ox+w/2, oy)}" class="cube-face ${stateArr[3]}" /><polygon points="${pD(ox+w, oy)}" class="cube-face ${stateArr[4]}" /><polygon points="${pD(ox-w/2, oy+h)}" class="cube-face ${stateArr[5]}" /><polygon points="${pU(ox, oy+h)}" class="cube-face ${stateArr[6]}" /><polygon points="${pD(ox+w/2, oy+h)}" class="cube-face ${stateArr[7]}" /><polygon points="${pD(ox, oy+2*h)}" class="cube-face ${stateArr[8]}" />`;
    }
    return svg;
}
function renderPyraSVG(state) {
    let w = 22, h = 19.05, gX = 24, gY = 16, ox = 3*w + gX, oy = 2;
    let svg = `<svg viewBox="0 0 ${6*w + 2*gX} ${6*h + 2*gY + 4}" class="h-full w-auto drop-shadow-md">`;
    svg += drawPyraFace(ox, oy, true, state['F']);
    svg += drawPyraFace(ox - 1.5*w - gX, oy + 3*h + gY, true, state['L']);
    svg += drawPyraFace(ox + 1.5*w + gX, oy + 3*h + gY, true, state['R']);
    svg += drawPyraFace(ox, oy + 3*h + gY, false, state['D']);
    return svg + '</svg>';
}

// ================= 各类魔方打乱生成引擎 =================
function generatePyraScramble() {
    const moves = ['U', 'L', 'R', 'B'], tips = ['u', 'l', 'r', 'b']; 
    let scramble = [], lastMove = -1, len = Math.floor(Math.random() * 4) + 8;
    for(let i=0; i<len; i++) { 
        let m; 
        do { m = Math.floor(Math.random()*4); } while(m===lastMove); 
        lastMove = m; 
        scramble.push(moves[m] + (Math.random() < 0.5 ? "'" : "")); 
    }
    tips.forEach(t => { 
        if(Math.random() < 0.5) scramble.push(t + (Math.random() < 0.5 ? "'" : "")); 
    }); 
    return scramble.join(" ");
}

function generateMegaScramble() {
    let scramble = []; 
    for (let i = 0; i < 7; i++) { 
        let line = []; 
        for (let j = 0; j < 10; j++) { 
            line.push((j % 2 === 0 ? 'R' : 'D') + (Math.random() < 0.5 ? '++' : '--')); 
        } 
        line.push(Math.random() < 0.5 ? 'U' : "U'"); 
        scramble.push(line.join(" ")); 
    } 
    return scramble.join("\n");
}

function generateSkewbScramble() {
    const moves = ['R', 'L', 'U', 'B'];
    let scramble = [];
    let lastMove = -1;
    for (let i = 0; i < 10; i++) {
        let m;
        do { m = Math.floor(Math.random() * 4); } while (m === lastMove);
        lastMove = m;
        scramble.push(moves[m] + (Math.random() < 0.5 ? "'" : ""));
    }
    return scramble.join(" ");
}

function generateSQ1Scramble() {
    let scramble = [];
    for (let i = 0; i < 12; i++) {
        let x = Math.floor(Math.random() * 12) - 5; // -5 到 6
        let y = Math.floor(Math.random() * 12) - 5;
        if (x === 0 && y === 0) x = 1;
        scramble.push(`(${x},${y})`);
    }
    return scramble.join(" / ") + " /";
}

function generateClockScramble() {
    const dials = ['UR', 'DR', 'DL', 'UL', 'U', 'R', 'D', 'L', 'ALL'];
    let scramble = [];
    dials.forEach(d => {
        let val = Math.floor(Math.random() * 6) + 1; // 1-6
        let sign = Math.random() < 0.5 ? '+' : '-';
        scramble.push(`${d}${val}${sign}`);
    });
    scramble.push('y2');
    const postDials = ['U', 'R', 'D', 'L', 'ALL'];
    postDials.forEach(d => {
        let val = Math.floor(Math.random() * 6) + 1;
        let sign = Math.random() < 0.5 ? '+' : '-';
        scramble.push(`${d}${val}${sign}`);
    });
    const pins = ['UR', 'DR', 'DL', 'UL'];
    pins.forEach(p => {
        if (Math.random() < 0.5) scramble.push(p);
    });
    return scramble.join(" ");
}

function generateScrambleText(type) {
    if (type === 'pyram') return generatePyraScramble();
    if (type === 'mega') return generateMegaScramble();
    if (type === 'skewb') return generateSkewbScramble();
    if (type === 'sq1') return generateSQ1Scramble();
    if (type === 'clock') return generateClockScramble();

    // 默认 NxN 逻辑
    const size = parseInt(type[0]) || 3; 
    let len = size === 2 ? 11 : (size === 3 ? 20 : (size === 4 ? 40 : (size === 5 ? 60 : (size === 6 ? 80 : 100))));
    let axes = [['R', 'L'], ['U', 'D'], ['F', 'B']], moves = [], lastAxis = -1;
    for(let i=0; i<len; i++) {
        let aIdx; 
        do { aIdx = Math.floor(Math.random() * 3); } while (aIdx === lastAxis); 
        lastAxis = aIdx;
        let bMove = axes[aIdx][Math.floor(Math.random() * 2)], wStr = "";
        if (size > 3) { 
            let w = Math.floor(Math.random() * Math.floor(size / 2)) + 1; 
            if (w > 1) wStr = (w > 2 ? w.toString() : "") + "w"; 
        }
        moves.push((wStr.includes('w') && wStr.length>1 ? wStr.charAt(0) : "") + bMove + (wStr.includes('w') ? "w" : "") + ["", "'", "2"][Math.floor(Math.random() * 3)]);
    }
    return moves.join(" ");
}

// ================= UI 下拉事件触发 =================
function changePuzzleType() { 
    currentPuzzle = elSelect.value; 
    document.getElementById('ao5Type').innerText = elSelect.options[elSelect.selectedIndex].text; 
    newScramble(); 
    updateStats(); 
}

// ================= 生成全新打乱与 3D/2D 视图渲染 =================
function newScramble() {
    if (appState === 'RUNNING') return; 
    currentScrambleStr = generateScrambleText(currentPuzzle);
    
    if(elScramble) {
        if(currentPuzzle === 'mega' || currentPuzzle === 'clock') { 
            elScramble.classList.replace('md:text-xl', 'md:text-base'); 
            elScramble.classList.replace('text-base', 'text-xs'); 
        } else { 
            elScramble.classList.replace('md:text-base', 'md:text-xl'); 
            elScramble.classList.replace('text-xs', 'text-base'); 
        }
        elScramble.innerText = currentScrambleStr;
    }
    
    elVisualizer.style.display = 'flex';
    
    if (currentPuzzle === 'pyram') {
        const state = getPyraSolvedState(); 
        pyraCycle(state, currentScrambleStr); 
        elVisualizer.innerHTML = renderPyraSVG(state);
    } else if (['mega', 'skewb', 'sq1', 'clock'].includes(currentPuzzle)) {
        // 动态引入 twisty-player
        if (!document.getElementById('twisty-script')) { 
            const s = document.createElement('script'); 
            s.id = 'twisty-script'; 
            s.src = 'https://cdn.cubing.net/js/cubing/twisty'; 
            s.type = 'module'; 
            document.head.appendChild(s); 
        }
        
        const puzzleMap = { 'mega': 'megaminx', 'skewb': 'skewb', 'sq1': 'square1', 'clock': 'clock' };
        elVisualizer.innerHTML = `<twisty-player puzzle="${puzzleMap[currentPuzzle]}" alg="${currentScrambleStr.replace(/\n/g, ' ')}" visualization="2D" experimental-setup-anchor="end" background="none" control-panel="none" style="width: 100%; height: 100%; pointer-events: none;"></twisty-player>`;
    } else {
        // 渲染普通的 2x2 - 7x7 矢量面
        const size = parseInt(currentPuzzle[0]) || 3;
        const state = getSolvedState(size); 
        currentScrambleStr.split(' ').forEach(m => { if (m) applyMove(state, m, currentPuzzle); });
        elVisualizer.innerHTML = renderCubeSVG(state, currentPuzzle);
    }
    elVisualizer.style.opacity = '1';
}

// ================= 计时器控制 =================
function formatTime(ms) { 
    if (ms === Infinity || ms === -1 || ms === 'DNF') return "DNF"; 
    let s = Math.floor(ms / 1000);
    if (timerPrecision === '3') {
        let mili = Math.floor(ms % 1000);
        return `${s}.${mili.toString().padStart(3, '0')}`;
    } else {
        let mili = Math.floor((ms % 1000) / 10); 
        return `${s}.${mili.toString().padStart(2, '0')}`; 
    }
}

function updateTimer() { 
    elTimer.innerText = formatTime(Date.now() - timerStart); 
}

async function requestWakeLock() { 
    try { 
        if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); 
    } catch (err) {} 
}

function releaseWakeLock() { 
    if (wakeLock !== null) { 
        wakeLock.release().then(() => { wakeLock = null; }); 
    } 
}

function triggerHaptic(type) { 
    if (!navigator.vibrate) return; 
    if (type === 'hold') navigator.vibrate(20); 
    else if (type === 'ready') navigator.vibrate([40, 30, 40]); 
    else if (type === 'start' || type === 'stop') navigator.vibrate(50); 
    else if (type === 'pb') navigator.vibrate([100, 50, 100, 50, 200]); 
}

function startTimer() { 
    appState = 'RUNNING'; 
    triggerHaptic('start'); 
    requestWakeLock(); 
    timerStart = Date.now(); 
    elTimer.className = 'timer-font text-[22vw] md:text-[12rem] font-bold leading-none timer-running'; 
    elInstruction.style.display = 'none'; 
    elVisualizer.style.opacity = '0'; 
    elTopControls.style.opacity = '0'; 
    elTopControls.style.pointerEvents = 'none'; 
    timerInt = setInterval(updateTimer, 10); 
}

function stopTimer() { 
    clearInterval(timerInt); 
    releaseWakeLock(); 
    triggerHaptic('stop'); 
    currentSolveTime = Date.now() - timerStart; 
    appState = 'IDLE'; 
    elTimer.className = 'timer-font text-[22vw] md:text-[12rem] font-bold leading-none timer-idle text-neutral-900 dark:text-neutral-100'; 
    elTimer.innerText = formatTime(currentSolveTime); 
    showPenaltyModal(currentSolveTime); 
}

function showPenaltyModal(time) {
    const modal = document.getElementById('penaltyModal');
    const box = document.getElementById('penaltyBox'); 
    document.getElementById('penaltyTimeDisplay').innerText = formatTime(time);
    
    if (time < SUSPICIOUS_THRESHOLDS[currentPuzzle]) {
        document.getElementById('suspiciousWarning').classList.remove('hidden'); 
    } else {
        document.getElementById('suspiciousWarning').classList.add('hidden');
    }
    
    modal.classList.remove('hidden'); 
    void box.offsetWidth; 
    box.classList.remove('scale-95', 'opacity-0'); 
    box.classList.add('scale-100', 'opacity-100');
}

function checkPB(newSolveObj) {
    if (newSolveObj.penalty === 'DNF') return false; 
    let finalTime = newSolveObj.time + (newSolveObj.penalty === '+2' ? 2000 : 0);
    const valid = solves.filter(s => s.type === currentPuzzle && s.penalty !== 'DNF'); 
    if (valid.length === 0) return true;
    return finalTime < Math.min(...valid.map(s => s.time + (s.penalty === '+2' ? 2000 : 0)));
}

async function confirmSolve(penalty) {
    document.getElementById('penaltyBox').classList.add('scale-95', 'opacity-0'); 
    setTimeout(() => document.getElementById('penaltyModal').classList.add('hidden'), 200);
    
    const solveObj = { 
        id: Date.now(), 
        time: currentSolveTime, 
        type: currentPuzzle, 
        scramble: currentScrambleStr, 
        penalty: penalty 
    }; 
    
    const isNewPB = checkPB(solveObj);
    solves.unshift(solveObj); 
    
    // 同步写入本地
    localStorage.setItem('cubeSolvesPro', JSON.stringify(solves));
    
    // 如果已登录，在后台向本地后端发送新增请求
    const token = localStorage.getItem('cubeToken');
    if (token) {
        apiRequest('/solves', {
            method: 'POST',
            body: JSON.stringify(solveObj)
        }).catch(() => {
            console.warn('单条成绩后台同步失败，将在下次同步时合并');
        });
    }

    if(!document.getElementById('historyView').classList.contains('hidden')) {
        renderHistory(); 
    }
    updateStats();
    
    elInstruction.style.display = 'block'; 
    elInstruction.style.opacity = '0.6'; 
    elVisualizer.style.opacity = '1'; 
    elTopControls.style.opacity = '1'; 
    elTopControls.style.pointerEvents = 'auto';
    
    if (isNewPB && penalty !== 'DNF') {
        triggerPBAnimation(solveObj); 
    }
    newScramble();
}

function triggerPBAnimation(solveObj) {
    let finalTime = solveObj.penalty === '+2' ? solveObj.time + 2000 : solveObj.time; 
    const style = localStorage.getItem('appStyle') || 'minimal';
    if (style === 'cyberpunk') {
        document.getElementById('cyberpunkTime').innerText = formatTime(finalTime); 
        document.getElementById('cyberpunkType').innerText = PUZZLE_NAMES[solveObj.type] || solveObj.type; 
        document.getElementById('cyberpunkPB').classList.remove('hidden');
    } else {
        document.getElementById('minimalTime').innerText = formatTime(finalTime); 
        document.getElementById('minimalType').innerText = PUZZLE_NAMES[solveObj.type] || solveObj.type; 
        document.getElementById('minimalPB').classList.remove('hidden');
    } 
    triggerHaptic('pb');
}

function closePB() { 
    document.getElementById('cyberpunkPB').classList.add('hidden'); 
    document.getElementById('minimalPB').classList.add('hidden'); 
}

function handleDown() {
    if (appState === 'RUNNING') { 
        stopTimer(); 
        return; 
    }
    if (appState === 'IDLE' && 
        document.getElementById('penaltyModal').classList.contains('hidden') && 
        document.getElementById('cyberpunkPB').classList.contains('hidden') && 
        document.getElementById('minimalPB').classList.contains('hidden') &&
        elAuthModal.classList.contains('hidden')) {
        
        appState = 'HOLDING'; 
        triggerHaptic('hold'); 
        elTimer.className = 'timer-font text-[22vw] md:text-[12rem] font-bold leading-none timer-holding'; 
        elTimer.innerText = formatTime(0);
        
        holdingTimeout = setTimeout(() => { 
            if (appState === 'HOLDING') { 
                appState = 'READY'; 
                triggerHaptic('ready'); 
                elTimer.className = 'timer-font text-[22vw] md:text-[12rem] font-bold leading-none timer-ready'; 
            } 
        }, 400); 
    }
}

function handleUp() {
    if (appState === 'READY') {
        startTimer(); 
    } else if (appState === 'HOLDING') { 
        clearTimeout(holdingTimeout); 
        appState = 'IDLE'; 
        elTimer.className = 'timer-font text-[22vw] md:text-[12rem] font-bold leading-none timer-idle text-neutral-900 dark:text-neutral-100'; 
    }
}

// ================= 历史记录与统计渲染 =================
async function loadHistory() { 
    const token = localStorage.getItem('cubeToken');
    if (token) {
        try {
            const res = await apiRequest('/solves');
            if (res.success && res.solves) {
                solves = res.solves;
                localStorage.setItem('cubeSolvesPro', JSON.stringify(solves));
            }
        } catch (err) {
            console.warn('从后端拉取历史失败，降级读取本地存储');
            const d = localStorage.getItem('cubeSolvesPro'); 
            if (d) solves = JSON.parse(d);
        }
    } else {
        const d = localStorage.getItem('cubeSolvesPro'); 
        if (d) solves = JSON.parse(d);
    }
    updateStats(); 
}

function renderHistory() {
    const list = document.getElementById('historyList'); 
    list.innerHTML = ''; 
    const filterVal = document.getElementById('historyFilter').value;
    let filtered = filterVal !== 'ALL' ? solves.filter(s => s.type === filterVal) : solves;
    
    if (filtered.length === 0) { 
        list.innerHTML = '<div class="text-center text-neutral-400 text-sm mt-10">暂无记录 (No history)</div>'; 
        return; 
    }
    
    filtered.forEach((s, i) => {
        const el = document.createElement('div'); 
        el.className = "bg-white dark:bg-neutral-900 rounded-xl p-3 flex flex-col border border-neutral-200 dark:border-neutral-800 shadow-sm transition-colors animate-fade-in";
        
        let displayTime = s.penalty === 'DNF' ? 'DNF' : formatTime(s.penalty === '+2' ? s.time + 2000 : s.time);
        let penaltyTag = s.penalty === '+2' ? `<span class="text-red-500 dark:text-red-400 text-[10px] font-bold ml-1 border border-red-500/30 bg-red-500/10 px-1 rounded">+2</span>` : '';
        let dnfColor = s.penalty === 'DNF' ? 'text-red-600 dark:text-red-500' : 'text-neutral-900 dark:text-white';
        
        el.innerHTML = `
            <div class="flex justify-between items-center w-full cursor-pointer py-1" onclick="window.toggleScramble(${s.id})">
                <div class="flex items-center gap-3">
                    <span class="text-neutral-400 dark:text-neutral-600 text-[10px] font-mono w-5">${filtered.length - i}</span>
                    <span class="font-bold text-[9px] bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-1.5 py-0.5 rounded text-neutral-600 dark:text-neutral-300 shadow-sm">${PUZZLE_NAMES[s.type] || s.type}</span>
                    <span class="font-bold ${dnfColor} text-lg tracking-wide flex items-center">${displayTime} ${penaltyTag}</span>
                </div>
                <div class="flex items-center gap-4">
                    <button onclick="event.stopPropagation(); window.delSolve(${s.id})" class="text-neutral-400 dark:text-neutral-600 active:text-red-500 p-2 -mr-2 transition-colors"><i class="fas fa-trash-alt text-[11px]"></i></button>
                    <i class="fas fa-chevron-down text-neutral-400 dark:text-neutral-500 text-xs transition-transform duration-300" id="chevron-${s.id}"></i>
                </div>
            </div>
            <div class="hidden mt-2 mb-1 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-black/30 p-2 rounded border border-neutral-100 dark:border-transparent scramble-content" id="scramble-${s.id}">${s.scramble || "无打乱数据"}</div>
        `; 
        list.appendChild(el);
    });
}

function toggleScramble(id) { 
    const el = document.getElementById(`scramble-${id}`);
    const icon = document.getElementById(`chevron-${id}`); 
    if (el.classList.contains('hidden')) { 
        el.classList.remove('hidden'); 
        icon.classList.add('rotate-180'); 
    } else { 
        el.classList.add('hidden'); 
        icon.classList.remove('rotate-180'); 
    } 
}

async function delSolve(id) { 
    triggerHaptic('hold'); 
    if(!confirm('确定删除这条成绩吗？')) return; 
    
    solves = solves.filter(s => s.id !== id); 
    localStorage.setItem('cubeSolvesPro', JSON.stringify(solves)); 
    
    const token = localStorage.getItem('cubeToken');
    if (token) {
        try {
            await apiRequest(`/solves/${id}`, { method: 'DELETE' });
        } catch(err) {
            console.warn('后端删除同步失败，下次网络连接时将以本地合并为准');
        }
    }
    
    renderHistory(); 
    updateStats(); 
}

async function clearHistory() { 
    triggerHaptic('hold'); 
    if(!confirm('清空所有历史成绩？')) return; 
    
    solves = []; 
    localStorage.removeItem('cubeSolvesPro'); 
    
    const token = localStorage.getItem('cubeToken');
    if (token) {
        try {
            await apiRequest('/solves', { method: 'DELETE' });
        } catch(err) {
            console.warn('后端清空同步失败');
        }
    }
    
    renderHistory(); 
    updateStats(); 
}

function updateStats() { 
    const filtered = solves.filter(s => s.type === currentPuzzle);
    document.getElementById('statAo5').innerText = calcAoN(filtered, 5); 
}

function calcAoN(list, n) {
    if (list.length < n) return "--"; 
    let times = list.slice(0, n).map(s => { 
        return s.penalty === 'DNF' ? Infinity : s.time + (s.penalty === '+2' ? 2000 : 0); 
    }); 
    times.sort((a,b) => a - b);
    if (times.filter(t => t === Infinity).length > 1) return "DNF"; 
    let sum = 0; 
    for(let i=1; i<n-1; i++) { 
        if (times[i] === Infinity) return "DNF"; 
        sum += times[i]; 
    } 
    return formatTime(sum / (n-2));
}

// ================= 社区互动模块 =================
function parseMedia(url, type) {
    if (!url) return '';
    if (type === 'img') {
        return `<img src="${url}" class="mt-2 rounded-xl max-h-48 object-cover w-full shadow-sm hover:scale-[1.01] transition-transform cursor-pointer">`;
    }
    if (type === 'vid') {
        return `<div class="mt-2 aspect-video bg-neutral-100 dark:bg-neutral-800 rounded-xl overflow-hidden flex items-center justify-center border border-neutral-200 dark:border-neutral-800">
                    <a href="${url}" target="_blank" class="text-blue-500 hover:text-blue-600 text-xs font-bold flex items-center gap-2">
                        <i class="fas fa-play-circle text-2xl"></i> 点击跳转播放外部视频
                    </a>
                </div>`;
    }
    return '';
}

async function renderCommunity() {
    const feed = document.getElementById('postsFeed');
    if(!feed) return; 
    
    feed.innerHTML = '<div class="text-center text-neutral-400 text-sm py-10"><i class="fas fa-circle-notch fa-spin mr-2"></i>正在加载社区内容...</div>';

    try {
        const res = await apiRequest('/posts');
        if (res.success && res.posts) {
            feed.innerHTML = '';
            if (res.posts.length === 0) {
                feed.innerHTML = '<div class="text-center text-neutral-400 text-sm py-10">暂无心得，快来抢沙发！</div>';
                return;
            }

            res.posts.forEach(post => {
                const date = new Date(post.timestamp);
                const timeStr = `${date.getMonth()+1}-${date.getDate()} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
                const el = document.createElement('div');
                el.className = "bg-white dark:bg-neutral-900 rounded-2xl p-4 shadow-sm border border-neutral-200 dark:border-neutral-800 transition-colors animate-fade-in";
                el.innerHTML = `
                    <div class="flex justify-between items-center mb-2">
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-md">
                                ${(post.authorNickname || post.author || 'M').charAt(0).toUpperCase()}
                            </div>
                            <span class="font-bold text-sm text-neutral-900 dark:text-white">${post.authorNickname || post.author}</span>
                        </div>
                        <span class="text-[10px] text-neutral-400 font-mono">${timeStr}</span>
                    </div>
                    <p class="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">${post.content.replace(/</g, "&lt;")}</p>
                    ${parseMedia(post.imageUrl, 'img')} 
                    ${parseMedia(post.videoUrl, 'vid')}
                `;
                feed.appendChild(el);
            });
        }
    } catch(err) {
        feed.innerHTML = '<div class="text-center text-red-500 text-sm py-10">加载社区内容失败，请确保本地后端服务器处于运行状态。</div>';
    }
}

async function submitPost() {
    const alertEl = document.getElementById('communityPostAlert');
    alertEl.innerText = '';
    
    const token = localStorage.getItem('cubeToken');
    if (!token) {
        alertEl.innerText = '请先登录您的云端账户！';
        return;
    }

    const content = document.getElementById('postContent').value.trim();
    const img = document.getElementById('postImage').value.trim();
    const vid = document.getElementById('postVideo').value.trim();

    if (!content && !img && !vid) {
        alertEl.innerText = '内容、图片、视频不能全部为空';
        return;
    }

    try {
        const res = await apiRequest('/posts', {
            method: 'POST',
            body: JSON.stringify({ content, imageUrl: img, videoUrl: vid })
        });

        if (res.success) {
            document.getElementById('postContent').value = ''; 
            document.getElementById('postImage').value = ''; 
            document.getElementById('postVideo').value = '';
            renderCommunity();
        } else {
            alertEl.innerText = res.message || '发布失败';
        }
    } catch(err) {
        alertEl.innerText = '发布失败，无法连接到本地服务器';
    }
}

// ================= CFOP 动态教程引擎 =================
let currentTutorialTab = 'cross';
let tutorialSearchQuery = '';
let expandedFormulaId = null;

// 自动逆公式计算器，用于魔方打乱（Setup-Alg）
function invertAlgorithm(algStr) {
    if (!algStr) return '';
    // 过滤掉括号、中括号和逗号，并将多余的空格合并
    const cleanAlg = algStr.replace(/[()\[\],]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleanAlg) return '';
    const moves = cleanAlg.split(' ');
    const inverted = moves.map(move => {
        if (move.endsWith("2'")) {
            return move.slice(0, -2) + "2";
        } else if (move.endsWith("2")) {
            return move; // X2 的逆动作仍然是 X2
        } else if (move.endsWith("'")) {
            return move.slice(0, -1);
        } else {
            return move + "'";
        }
    });
    return inverted.reverse().join(' ');
}

function switchTutorialTab(tabId) {
    currentTutorialTab = tabId;
    tutorialSearchQuery = '';
    expandedFormulaId = null; // 切换 Tab 时重置展开
    const searchInput = document.getElementById('tutorialSearch');
    if (searchInput) searchInput.value = '';

    // 更新按钮样式
    const tabs = ['cross', 'f2l', 'oll', 'pll'];
    tabs.forEach(t => {
        const btn = document.getElementById(`tutTab-${t}`);
        if (btn) {
            if (t === tabId) {
                btn.className = 'px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-500 text-white transition-all whitespace-nowrap shadow-sm';
            } else {
                btn.className = 'px-3.5 py-2 text-xs font-bold rounded-xl text-neutral-500 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 transition-all whitespace-nowrap';
            }
        }
    });

    // 控制搜索栏显隐
    const searchContainer = document.getElementById('tutorialSearchContainer');
    if (searchContainer) {
        if (tabId === 'cross') {
            searchContainer.classList.add('hidden');
        } else {
            searchContainer.classList.remove('hidden');
        }
    }

    renderTutorial();
}

function toggleFormula(id) {
    if (expandedFormulaId === id) {
        expandedFormulaId = null;
    } else {
        expandedFormulaId = id;
    }
    renderTutorial();
}

// 极速静态 3D 魔方 SVG 渲染引擎 (0.05ms)
function generateCubeSVG(formula) {
    // 0-8:U, 9-17:L, 18-26:F, 27-35:R, 36-44:B, 45-53:D
    const cube = [];
    for (let f = 0; f < 6; f++) {
        for (let i = 0; i < 9; i++) {
            cube.push(f);
        }
    }

    const permute = (map) => {
        const temp = [...cube];
        for (const [to, from] of Object.entries(map)) {
            cube[to] = temp[from];
        }
    };

    const rotCW = (s) => {
        const temp = [...cube];
        cube[s+0] = temp[s+6]; cube[s+1] = temp[s+3]; cube[s+2] = temp[s+0];
        cube[s+3] = temp[s+7];                         cube[s+5] = temp[s+1];
        cube[s+6] = temp[s+8]; cube[s+7] = temp[s+5]; cube[s+8] = temp[s+2];
    };

    const moves = {
        U: () => {
            rotCW(0);
            permute({
                18:27, 19:28, 20:29,
                27:36, 28:37, 29:38,
                36:9,  37:10, 38:11,
                9:18,  10:19, 11:20
            });
        },
        D: () => {
            rotCW(45);
            permute({
                24:15, 25:16, 26:17,
                15:42, 16:43, 17:44,
                42:33, 43:34, 44:35,
                33:24, 34:25, 35:26
            });
        },
        R: () => {
            rotCW(27);
            permute({
                2:20,  5:23,  8:26,
                20:47, 23:50, 26:53,
                47:42, 50:39, 53:36,
                36:8,  39:5,  42:2
            });
        },
        L: () => {
            rotCW(9);
            permute({
                0:44,  3:41,  6:38,
                38:51, 41:48, 44:45,
                45:18, 48:21, 51:24,
                18:0,  21:3,  24:6
            });
        },
        F: () => {
            rotCW(18);
            permute({
                6:17,  7:14,  8:11,
                11:45, 14:46, 17:47,
                45:33, 46:30, 47:27,
                27:6,  30:7,  33:8
            });
        },
        B: () => {
            rotCW(36);
            permute({
                0:29,  1:32,  2:35,
                29:53, 32:52, 35:51,
                51:9,  52:12, 53:15,
                9:2,   12:1,  15:0
            });
        },
        M: () => {
            permute({
                1:43,  4:40,  7:37,
                37:52, 40:49, 43:46,
                46:19, 49:22, 52:25,
                19:1,  22:4,  25:7
            });
        },
        S: () => {
            permute({
                3:16,  4:13,  5:10,
                10:48, 13:49, 16:50,
                48:34, 49:31, 50:28,
                28:3,  31:4,  34:5
            });
        },
        E: () => {
            permute({
                12:21, 13:22, 14:23,
                21:39, 22:40, 23:41,
                39:30, 40:31, 41:32,
                30:12, 31:13, 32:14
            });
        }
    };

    const runMove = (m) => {
        const base = m[0].toUpperCase();
        const isPrime = m.includes("'");
        const isDouble = m.includes('2');
        const times = isDouble ? 2 : (isPrime ? 3 : 1);

        if (moves[base]) {
            for (let t = 0; t < times; t++) moves[base]();
        } else if (m[0] === 'r') {
            for (let t = 0; t < times; t++) {
                moves.R();
                // M'
                moves.M(); moves.M(); moves.M();
            }
        } else if (m[0] === 'l') {
            for (let t = 0; t < times; t++) {
                moves.L();
                moves.M();
            }
        } else if (m[0] === 'f') {
            for (let t = 0; t < times; t++) {
                moves.F();
                moves.S();
            }
        } else if (m[0] === 'b') {
            for (let t = 0; t < times; t++) {
                moves.B();
                moves.S(); moves.S(); moves.S();
            }
        } else if (m[0] === 'u') {
            for (let t = 0; t < times; t++) {
                moves.U();
                moves.E(); moves.E(); moves.E();
            }
        } else if (m[0] === 'd') {
            for (let t = 0; t < times; t++) {
                moves.D();
                moves.E();
            }
        } else if (base === 'Y') {
            for (let t = 0; t < times; t++) {
                rotCW(0);
                rotCW(45); rotCW(45); rotCW(45);
                permute({
                    18:27, 19:28, 20:29, 21:30, 22:31, 23:32, 24:33, 25:34, 26:35,
                    27:36, 28:37, 29:38, 30:39, 31:40, 32:41, 33:42, 34:43, 35:44,
                    36:9,  37:10, 38:11, 39:12, 40:13, 41:14, 42:15, 43:16, 44:17,
                    9:18,  10:19, 11:20, 12:21, 13:22, 14:23, 15:24, 16:25, 17:26
                });
            }
        }
    };

    if (formula) {
        const stepList = formula.replace(/[()\[\],]/g, ' ').replace(/\s+/g, ' ').trim().split(' ');
        stepList.forEach(s => {
            if (s) runMove(s);
        });
    }

    const colorMap = {
        0: '#f4d03f', // U - 黄
        1: '#e67e22', // L - 橙
        2: '#2ecc71', // F - 绿
        3: '#e74c3c', // R - 红
        4: '#3498db', // B - 蓝
        5: '#ffffff'  // D - 白
    };

    const getFill = (idx) => colorMap[cube[idx]] || '#bbb';

    let polygons = '';

    // (1) U面 (顶面, 0-8)
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            const idx = r * 3 + c;
            const x0 = 50 + (c - r) * 13;
            const y0 = 20 + (c + r) * 7.5;
            polygons += `<polygon points="${x0},${y0} ${x0+13},${y0+7.5} ${x0},${y0+15} ${x0-13},${y0+7.5}" fill="${getFill(idx)}" />\n`;
        }
    }

    // (2) F面 (前面, 18-26)
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            const idx = 18 + (r * 3 + c);
            const x0 = 11 + c * 13;
            const y0 = 42.5 + c * 7.5 + r * 15;
            polygons += `<polygon points="${x0},${y0} ${x0+13},${y0+7.5} ${x0+13},${y0+22.5} ${x0},${y0+15}" fill="${getFill(idx)}" />\n`;
        }
    }

    // (3) R面 (右面, 27-35)
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            const idx = 27 + (r * 3 + c);
            const x0 = 50 + c * 13;
            const y0 = 65 - c * 7.5 + r * 15;
            polygons += `<polygon points="${x0},${y0} ${x0+13},${y0-7.5} ${x0+13},${y0+7.5} ${x0},${y0+15}" fill="${getFill(idx)}" />\n`;
        }
    }

    return `
        <svg viewBox="0 0 100 110" class="w-20 h-22 select-none" stroke="#111" stroke-width="0.8" stroke-linejoin="round">
            <g>${polygons}</g>
        </svg>
    `;
}

// 全局声明 acjs 数组以便 AnimCube3 挂载其事件卸载函数
window.acjs_removeListeners = [];

let activeAnimCubeId = null;

function stopActiveAnimCube() {
    if (activeAnimCubeId) {
        if (window.acjs_removeListeners && window.acjs_removeListeners[activeAnimCubeId]) {
            try {
                window.acjs_removeListeners[activeAnimCubeId]();
            } catch (e) {
                console.error("Error removing AnimCube listeners:", e);
            }
            delete window.acjs_removeListeners[activeAnimCubeId];
        }
        activeAnimCubeId = null;
    }
}

function startTutorialAnimCube(formulaId, formulaStr) {
    stopActiveAnimCube();

    const containerId = `tutorial-cube-container-${formulaId}`;
    const container = document.getElementById(containerId);
    if (!container) return;

    // 清空并显示初始化状态
    container.innerHTML = '<div class="text-[10px] text-neutral-400"><i class="fas fa-spinner fa-spin mr-1"></i>正在初始化...</div>';

    // 格式化公式
    let cleanFormula = formulaStr.replace(/[()\[\],]/g, ' ').replace(/\s+/g, ' ').trim();

    // 确定当前的亮/暗背景颜色
    const isDark = document.documentElement.classList.contains('dark');
    const bgcolorHex = isDark ? '181818' : 'f3f4f6';

    // 组装参数
    const paramStr = `id=${containerId}&bgcolor=${bgcolorHex}&buttonbar=0&edit=0&repeat=1&speed=22&movetext=0&clickprogress=0&initrevmove=#&demo=#&move=${encodeURIComponent(cleanFormula)}`;

    try {
        activeAnimCubeId = containerId;
        AnimCube3(paramStr);
    } catch (e) {
        console.error("Error initializing AnimCube3:", e);
        container.innerHTML = '<div class="text-[10px] text-red-500">加载失败</div>';
    }
}

function renderTutorial() {
    const container = document.getElementById('tutorialContent');
    if (!container) return;
    container.innerHTML = '';

    if (currentTutorialTab === 'cross') {
        const cData = window.CFOP_CROSS;
        if (!cData) return;
        
        let stepsHTML = cData.steps.map(step => `<li class="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400 mb-2">${step}</li>`).join('');
        container.innerHTML = `
            <div class="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm transition-colors animate-fade-in">
                <h3 class="font-bold text-base text-blue-500 mb-2">${cData.title}</h3>
                <p class="text-xs text-neutral-500 dark:text-neutral-400 mb-4 leading-relaxed">${cData.concept}</p>
                <h4 class="font-bold text-xs text-neutral-800 dark:text-neutral-200 mb-2">学习与提升步骤建议：</h4>
                <ul class="list-decimal list-inside space-y-1">
                    ${stepsHTML}
                </ul>
            </div>
        `;
    } else {
        let list = [];
        let accentColor = 'text-blue-500';
        if (currentTutorialTab === 'f2l') {
            list = window.CFOP_F2L || [];
            accentColor = 'text-green-500 dark:text-green-400';
        } else if (currentTutorialTab === 'oll') {
            list = window.CFOP_OLL || [];
            accentColor = 'text-yellow-500 dark:text-yellow-400';
        } else if (currentTutorialTab === 'pll') {
            list = window.CFOP_PLL || [];
            accentColor = 'text-red-500 dark:text-red-400';
        }

        if (tutorialSearchQuery) {
            const q = tutorialSearchQuery.toLowerCase();
            list = list.filter(item => 
                item.id.toLowerCase().includes(q) || 
                item.name.toLowerCase().includes(q) || 
                item.formula.toLowerCase().includes(q)
            );
        }

        const currentTutorialList = list;

        if (list.length === 0) {
            container.innerHTML = `<div class="text-center text-neutral-400 text-xs py-10">未搜索到匹配的公式</div>`;
            return;
        }

        const groups = {};
        list.forEach(item => {
            const cat = item.category || '全部公式';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(item);
        });

        Object.keys(groups).forEach(cat => {
            const section = document.createElement('section');
            section.className = 'bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm transition-colors mb-3 animate-fade-in';
            
            let itemsHTML = groups[cat].map(item => {
                const isExpanded = item.id === expandedFormulaId;
                const chevronClass = isExpanded ? 'rotate-chevron expanded' : 'rotate-chevron';

                return `
                    <div class="flex flex-col bg-neutral-50 dark:bg-neutral-800/40 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800/70 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/70 transition-colors">
                        <!-- 头部栏 -->
                        <div onclick="window.toggleFormula('${item.id}')" class="flex items-center justify-between cursor-pointer select-none">
                            <div class="flex items-center gap-2 max-w-[50%]">
                                <i class="fas fa-chevron-right text-[10px] text-neutral-400 ${chevronClass}"></i>
                                <span class="font-bold text-xs ${accentColor} min-w-[50px]">${item.id}</span>
                                <span class="text-xs text-neutral-600 dark:text-neutral-400 truncate" title="${item.name}">${item.name}</span>
                            </div>
                            <div onclick="event.stopPropagation()" class="font-mono text-xs font-bold text-blue-500 dark:text-cyan-400 text-right select-all max-w-[50%] break-words leading-relaxed">${item.formula}</div>
                        </div>

                        <!-- 展开动图演示区 -->
                        ${isExpanded ? `
                            <div class="mt-2 p-2 bg-neutral-100/70 dark:bg-neutral-800/50 border border-neutral-200/40 dark:border-neutral-700/40 rounded-xl animate-fade-in flex items-center justify-between gap-3">
                                <div id="tutorial-cube-container-${item.id}" style="width: 96px; height: 96px;" class="flex justify-center items-center shrink-0 overflow-hidden rounded-lg bg-neutral-100/70 dark:bg-[#181818]">
                                    <div class="text-[10px] text-neutral-400"><i class="fas fa-spinner fa-spin mr-1"></i>正在加载...</div>
                                </div>
                                <div class="flex-1 min-w-0 text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed flex flex-col justify-center select-none">
                                    <div class="font-bold text-neutral-700 dark:text-neutral-300 mb-1 text-xs flex items-center gap-1.5">
                                        <span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                        3D 动画演示 (自动循环)
                                    </div>
                                    <div class="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                        固定 UFR 三面标准视角展示。公式执行完毕后将自动重置并循环演示。
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('<div class="h-2"></div>');

            section.innerHTML = `
                <h3 class="font-bold text-sm text-neutral-800 dark:text-neutral-200 mb-3 flex items-center"><i class="fas fa-cube mr-2 opacity-60"></i>${cat}</h3>
                <div class="space-y-1">${itemsHTML}</div>
            `;
            container.appendChild(section);
        });

        // 动态管理动图动画 (微任务触发)
        if (expandedFormulaId) {
            const formulaObj = currentTutorialList.find(x => x.id === expandedFormulaId);
            if (formulaObj) {
                setTimeout(() => {
                    startTutorialAnimCube(formulaObj.id, formulaObj.formula);
                }, 0);
            }
        } else {
            stopActiveAnimCube();
        }
    }
}

function filterTutorial(query) {
    tutorialSearchQuery = query.trim();
    expandedFormulaId = null; // 搜索时重置展开
    renderTutorial();
}

// ================= 暴露接口至全局 window 对象 =================
window.switchTab = switchTab;
window.toggleTheme = toggleTheme;
window.changeAppTheme = changeAppTheme;
window.changePuzzleType = changePuzzleType;
window.newScramble = newScramble;
window.confirmSolve = confirmSolve;
window.closePB = closePB;
window.renderHistory = renderHistory;
window.toggleScramble = toggleScramble;
window.delSolve = delSolve;
window.clearHistory = clearHistory;
window.showAuthModal = showAuthModal;
window.closeAuthModal = closeAuthModal;
window.switchAuthTab = switchAuthTab;
window.submitAuth = submitAuth;
window.handleLogout = handleLogout;
window.syncData = syncData;
window.submitPost = submitPost;
window.switchTutorialTab = switchTutorialTab;
window.renderTutorial = renderTutorial;
window.filterTutorial = filterTutorial;
window.toggleFormula = toggleFormula;
window.changeTimerPrecision = changeTimerPrecision;
