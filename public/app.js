// --- 1. 榄旀柟閫昏緫寮曟搸 (Cube Engine) ---

        const COLORS = { U: 'c-w', R: 'c-r', F: 'c-g', D: 'c-y', L: 'c-o', B: 'c-b' };

       

        function getSolvedState(size) {

            const faces = ['U', 'R', 'F', 'D', 'L', 'B'];

            const state = {};

            faces.forEach(f => {

                state[f] = Array(size * size).fill(COLORS[f]);

            });

            return state;

        }



        const MOVES_333 = {

            'U': (s) => cycleFace(s, 'U', [0,1,2,5,8,7,6,3]) & cycleSides(s, ['F', 'L', 'B', 'R'], [[0,1,2], [0,1,2], [0,1,2], [0,1,2]]),

            'D': (s) => cycleFace(s, 'D', [0,1,2,5,8,7,6,3]) & cycleSides(s, ['F', 'R', 'B', 'L'], [[6,7,8], [6,7,8], [6,7,8], [6,7,8]]),

            'F': (s) => cycleFace(s, 'F', [0,1,2,5,8,7,6,3]) & cycleSides(s, ['U', 'R', 'D', 'L'], [[6,7,8], [0,3,6], [2,1,0], [8,5,2]]),

            'B': (s) => cycleFace(s, 'B', [0,1,2,5,8,7,6,3]) & cycleSides(s, ['U', 'L', 'D', 'R'], [[2,1,0], [0,3,6], [6,7,8], [8,5,2]]),

            'L': (s) => cycleFace(s, 'L', [0,1,2,5,8,7,6,3]) & cycleSides(s, ['U', 'F', 'D', 'B'], [[0,3,6], [0,3,6], [0,3,6], [8,5,2]]),

            'R': (s) => cycleFace(s, 'R', [0,1,2,5,8,7,6,3]) & cycleSides(s, ['U', 'B', 'D', 'F'], [[8,5,2], [0,3,6], [8,5,2], [8,5,2]]),

        };



        const MOVES_222 = {

            'U': (s) => cycleFace(s, 'U', [0,1,3,2]) & cycleSides(s, ['F', 'L', 'B', 'R'], [[0,1], [0,1], [0,1], [0,1]]),

            'D': (s) => cycleFace(s, 'D', [0,1,3,2]) & cycleSides(s, ['F', 'R', 'B', 'L'], [[2,3], [2,3], [2,3], [2,3]]),

            'F': (s) => cycleFace(s, 'F', [0,1,3,2]) & cycleSides(s, ['U', 'R', 'D', 'L'], [[2,3], [0,2], [1,0], [3,1]]),

            'B': (s) => cycleFace(s, 'B', [0,1,3,2]) & cycleSides(s, ['U', 'L', 'D', 'R'], [[1,0], [0,2], [2,3], [3,1]]),

            'L': (s) => cycleFace(s, 'L', [0,1,3,2]) & cycleSides(s, ['U', 'F', 'D', 'B'], [[0,2], [0,2], [0,2], [3,1]]),

            'R': (s) => cycleFace(s, 'R', [0,1,3,2]) & cycleSides(s, ['U', 'B', 'D', 'F'], [[1,3], [2,0], [1,3], [1,3]]),

        };



        function cycleFace(state, face, indices) {

            const arr = state[face];

            const old = [...arr];

            if(indices.length === 8) {

                const map = [6,3,0,7,4,1,8,5,2];

                const newFace = arr.map((_, i) => old[map[i]]);

                state[face] = newFace;

            } else if (indices.length === 4) {

                const map = [2,0,3,1];

                const newFace = arr.map((_, i) => old[map[i]]);

                state[face] = newFace;

            }

            return 1;

        }



        function cycleSides(state, faces, indicesList) {

            const vals = faces.map((f, i) => indicesList[i].map(idx => state[f][idx]));

            indicesList[1].forEach((idx, i) => state[faces[1]][idx] = vals[0][i]);

            indicesList[2].forEach((idx, i) => state[faces[2]][idx] = vals[1][i]);

            indicesList[3].forEach((idx, i) => state[faces[3]][idx] = vals[2][i]);

            indicesList[0].forEach((idx, i) => state[faces[0]][idx] = vals[3][i]);

            return 1;

        }



        function applyMove(state, move, type) {

            const base = move[0];

            const mod = move.length > 1 ? move.slice(1) : "";

            const moveFunc = type === '333' ? MOVES_333[base] : MOVES_222[base];

            if (!moveFunc) return;

            let times = 1;

            if (mod === "2") times = 2;

            else if (mod === "'") times = 3;

            for(let k=0; k<times; k++) moveFunc(state);

        }



        function renderCubeSVG(state, type) {

            const size = type === '222' ? 2 : 3;

            const cellSize = 15;

            const gap = 2;

            const faceSize = size * cellSize;

            const offsets = {

                U: [faceSize + gap, 0],

                L: [0, faceSize + gap],

                F: [faceSize + gap, faceSize + gap],

                R: [(faceSize + gap) * 2, faceSize + gap],

                B: [(faceSize + gap) * 3, faceSize + gap],

                D: [faceSize + gap, (faceSize + gap) * 2]

            };

           

            // 浣跨敤 viewBox 鑷€傚簲瀹瑰櫒澶у皬

            let svgHTML = `<svg viewBox="0 0 ${faceSize*4 + gap*3} ${faceSize*3 + gap*2}" class="h-full w-auto">`;

            ['U', 'L', 'F', 'R', 'B', 'D'].forEach(face => {

                const [ox, oy] = offsets[face];

                state[face].forEach((colorClass, idx) => {

                    const row = Math.floor(idx / size);

                    const col = idx % size;

                    svgHTML += `<rect x="${ox + col*cellSize}" y="${oy + row*cellSize}" width="${cellSize}" height="${cellSize}" class="cube-face ${colorClass}" />`;

                });

            });

            svgHTML += '</svg>';

            return svgHTML;

        }



        // --- 2. 鏍稿績 App 閫昏緫 ---



        let currentPuzzle = '333';

        let currentScrambleStr = '';

        let appState = 'IDLE';

        let timerStart = 0;

        let timerInt = null;

        let holdingTimeout = null;

        let solves = [];

        let splashDone = false;

       



        const elTimer = document.getElementById('timerDisplay');

        const elScramble = document.getElementById('scrambleDisplay');

        const elVisualizer = document.getElementById('visualizer');

        const elSelect = document.getElementById('puzzleType');

        const elInstruction = document.getElementById('instruction');



        window.addEventListener('DOMContentLoaded', () => {

            loadHistory();

            newScramble();

            setupPWA();

        });



        function changePuzzleType() {

            currentPuzzle = elSelect.value;

            if (currentPuzzle === '444') {

                elVisualizer.style.display = 'none';

            } else {

                elVisualizer.style.display = 'flex';

            }

            newScramble();

        }



        function newScramble() {

            if (appState === 'RUNNING') return;

           

            currentScrambleStr = generateScrambleText(currentPuzzle);

            const scrambleDisplay = document.getElementById('scrambleDisplay');

            if(scrambleDisplay) scrambleDisplay.innerText = currentScrambleStr;



            if (currentPuzzle !== '444') {

                const state = getSolvedState(currentPuzzle === '222' ? 2 : 3);

                const moves = currentScrambleStr.split(' ');

                moves.forEach(m => applyMove(state, m, currentPuzzle));

                const viz = document.getElementById('visualizer');

                if(viz) {

                    viz.innerHTML = renderCubeSVG(state, currentPuzzle);

                    viz.style.opacity = '1';

                }

            }

        }



        function generateScrambleText(type) {

            let moves = [];

            let len = 20;

            let axis = [];

           

            if (type === '222') {

                len = 9;

                axis = ['R', 'U', 'F'];

            } else if (type === '333') {

                len = 20;

                axis = ['R', 'L', 'U', 'D', 'F', 'B'];

            } else if (type === '444') {

                len = 40;

                axis = ['R', 'L', 'U', 'D', 'F', 'B', 'Rw', 'Uw', 'Fw'];

            }



            let lastAxis = -1;

           

            for(let i=0; i<len; i++) {

                let r;

                do {

                    r = Math.floor(Math.random() * axis.length);

                } while (getBaseAxis(axis[r]) === lastAxis);

               

                lastAxis = getBaseAxis(axis[r]);

               

                let suffix = '';

                const rand = Math.random();

                if (rand < 0.33) suffix = "'";

                else if (rand < 0.66) suffix = "2";

               

                moves.push(axis[r] + suffix);

            }

            return moves.join(" ");

        }



        function getBaseAxis(move) {

            if (['R','L','Rw','Lw'].some(x => move.startsWith(x))) return 0;

            if (['U','D','Uw','Dw'].some(x => move.startsWith(x))) return 1;

            return 2;

        }



        // --- 3. 璁℃椂鍣ㄩ€昏緫 ---



        function updateTimer() {

            const now = Date.now();

            const diff = now - timerStart;

            let s = Math.floor(diff / 1000);

            let ms = Math.floor((diff % 1000) / 10);

            elTimer.innerText = `${s}.${ms.toString().padStart(2, '0')}`;

        }



        function startTimer() {

            appState = 'RUNNING';

            timerStart = Date.now();

            elTimer.className = 'timer-font text-[24vw] md:text-[12rem] lg:text-[14rem] font-bold leading-none timer-running';

           

            elInstruction.style.opacity = '0';

            elVisualizer.style.opacity = '0';

            elScramble.style.opacity = '0';

           

            timerInt = setInterval(updateTimer, 10);

        }



        function stopTimer() {

            clearInterval(timerInt);

            const finalTime = Date.now() - timerStart;

            appState = 'IDLE';

           

            let s = Math.floor(finalTime / 1000);

            let ms = Math.floor((finalTime % 1000) / 10);

            elTimer.innerText = `${s}.${ms.toString().padStart(2, '0')}`;

            elTimer.className = 'timer-font text-[24vw] md:text-[12rem] lg:text-[14rem] font-bold leading-none timer-idle';



            elInstruction.style.opacity = '0.6';

            elVisualizer.style.opacity = '1';

            elScramble.style.opacity = '1';



            saveSolve(finalTime);

            newScramble();

        }



        // --- 4. 浜や簰 (Touch/Keyboard) ---



        function handleDown() {

            if (appState === 'RUNNING') {

                stopTimer();

                return;

            }

            if (appState === 'IDLE') {

                appState = 'HOLDING';

                elTimer.className = 'timer-font text-[24vw] md:text-[12rem] lg:text-[14rem] font-bold leading-none timer-holding';

                elTimer.innerText = "0.00";



                holdingTimeout = setTimeout(() => {

                    if (appState === 'HOLDING') {

                        appState = 'READY';

                        elTimer.className = 'timer-font text-[24vw] md:text-[12rem] lg:text-[14rem] font-bold leading-none timer-ready';

                    }

                }, 550); // WCA Green Light 0.55s

            }

        }



        function handleUp() {

            if (appState === 'READY') {

                startTimer();

            } else if (appState === 'HOLDING') {

                clearTimeout(holdingTimeout);

                appState = 'IDLE';

                elTimer.className = 'timer-font text-[24vw] md:text-[12rem] lg:text-[14rem] font-bold leading-none timer-idle';

            }

        }



        document.addEventListener('keydown', e => {

            if (e.code === 'Space') {

                e.preventDefault();

                if (!e.repeat) handleDown();

            }

        });

        document.addEventListener('keyup', e => {

            if (e.code === 'Space') handleUp();

        });



        const touchArea = document.getElementById('touchArea');

       

        // 浠讳綍鍦版柟鐐瑰嚮閮借兘娑堥櫎 Splash

        function initSplash() {

            const splash = document.getElementById('splashScreen');

            if (!splash) return;



            function dismiss() {

                if (splashDone) return;

                splashDone = true;

                splash.classList.add('splash-hidden');

                setTimeout(() => splash.remove(), 500);

            }



            splash.addEventListener('pointerdown', e => {

                e.stopPropagation();

                dismiss();

            });

        }





        touchArea.addEventListener('touchstart', e => {

            if (!e.target.closest('button') && !e.target.closest('select') && !e.target.closest('.scramble-text')) {

                e.preventDefault();

                handleDown();

            }

        }, { passive: false });

        touchArea.addEventListener('touchend', e => {

            if (!e.target.closest('button') && !e.target.closest('select')) {

                handleUp();

            }

        });



        // --- 5. 鍘嗗彶涓庣粺璁?---

       

        function saveSolve(ms) {

            const s = { id: Date.now(), time: ms, type: currentPuzzle, scramble: currentScrambleStr };

            solves.unshift(s);

            localStorage.setItem('cubeSolvesV2', JSON.stringify(solves));

            renderHistory();

            updateStats();

        }



        function loadHistory() {

            const d = localStorage.getItem('cubeSolvesV2');

            if (d) solves = JSON.parse(d);

            renderHistory();

            updateStats();

        }



        function renderHistory() {

            const list = document.getElementById('historyList');

            list.innerHTML = '';

            const filtered = solves.filter(s => s.type === currentPuzzle);

           

            filtered.slice(0, 50).forEach((s, i) => {

                const el = document.createElement('div');

                el.className = "bg-neutral-800 rounded p-2 flex justify-between items-center border border-neutral-700 text-xs";

               

                let timeStr = (s.time / 1000).toFixed(2);

                let tagColor = s.type === '333' ? 'text-blue-400' : (s.type === '222' ? 'text-yellow-400' : 'text-purple-400');

               

                el.innerHTML = `

                    <div class="flex items-center gap-2">

                        <span class="font-bold text-neutral-500 w-4">${filtered.length - i}</span>

                        <span class="font-bold text-[10px] ${tagColor} border border-neutral-600 px-1 rounded">${s.type}</span>

                        <span class="font-bold text-white text-sm">${timeStr}</span>

                    </div>

                    <button onclick="delSolve(${s.id})" class="text-neutral-600 hover:text-red-400 px-2"><i class="fas fa-times"></i></button>

                `;

                list.appendChild(el);

            });

        }



        window.delSolve = function(id) {

            if(!confirm('Delete this solve?')) return;

            solves = solves.filter(s => s.id !== id);

            localStorage.setItem('cubeSolvesV2', JSON.stringify(solves));

            renderHistory();

            updateStats();

        };



        window.clearHistory = function() {

            if(!confirm('Clear all history?')) return;

            solves = [];

            localStorage.removeItem('cubeSolvesV2');

            renderHistory();

            updateStats();

        };



        function updateStats() {

            const filtered = solves.filter(s => s.type === currentPuzzle);

            document.getElementById('statCount').innerText = filtered.length;

           

            if (filtered.length > 0) {

                const best = Math.min(...filtered.map(s => s.time));

                document.getElementById('statBest').innerText = (best / 1000).toFixed(2);

            } else {

                document.getElementById('statBest').innerText = "--";

            }

            document.getElementById('statAo5').innerText = calcAoN(filtered, 5);

            document.getElementById('statAo12').innerText = calcAoN(filtered, 12);

        }



        function calcAoN(list, n) {

            if (list.length < n) return "--";

            const subset = list.slice(0, n).map(s => s.time).sort((a,b)=>a-b);

            let sum = 0;

            for(let i=1; i<n-1; i++) sum += subset[i];

            return (sum / (n-2) / 1000).toFixed(2);

        }



        // --- PWA ---

        function setupPWA() {

            try {

                const m = {

                    name: "CubeTimer Pro",

                    short_name: "CubeTimer",

                    display: "standalone",

                    start_url: ".",

                    background_color: "#1a1a1a",

                    theme_color: "#1a1a1a",

                    icons: [{ src: "https://cdn-icons-png.flaticon.com/512/566/566300.png", sizes: "512x512", type: "image/png" }]

                };

                const b = new Blob([JSON.stringify(m)], {type: 'application/json'});

                const linkEl = document.getElementById('manifest-placeholder');

                if (linkEl) {

                    linkEl.href = URL.createObjectURL(b);

                }

            } catch (e) {

                console.warn("PWA setup failed, potentially due to restricted environment:", e);

            }

        }

       

        let prompt;

        window.addEventListener('beforeinstallprompt', e => {

            e.preventDefault();

            prompt = e;

            document.getElementById('installBtn').classList.remove('hidden');

        });

        window.installApp = async () => {

            if(prompt) {

                prompt.prompt();

                prompt = null;

                document.getElementById('installBtn').classList.add('hidden');

            }

        };

        window.addEventListener('DOMContentLoaded', initSplash);

