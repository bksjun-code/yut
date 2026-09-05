/**
 * YutAudioSynthesizer - Web Audio API based traditional sound synthesizer
 */
class YutAudioSynthesizer {
    constructor() {
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playMove() {
        this.init();
        const now = this.ctx.currentTime;
        this.createWoodClick(now);
        this.createWoodClick(now + 0.08);
    }

    createWoodClick(time) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(750, time);
        osc.frequency.exponentialRampToValueAtTime(120, time + 0.05);
        
        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + 0.06);
    }

    playStack() {
        this.init();
        const now = this.ctx.currentTime;
        const freqs = [392, 523.25, 659.25, 784]; // G4, C5, E5, G5 (traditional major chord)
        freqs.forEach((freq, idx) => {
            const time = now + idx * 0.04;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, time);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.9, time + 0.3);
            
            gain.gain.setValueAtTime(0.15, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(time);
            osc.stop(time + 0.35);
        });
    }

    playCatch() {
        this.init();
        const now = this.ctx.currentTime;
        
        // 1. Sharp wood clap noise
        const bufferSize = this.ctx.sampleRate * 0.15;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noiseNode = this.ctx.createBufferSource();
        noiseNode.buffer = buffer;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1000;
        filter.Q.value = 2.0;
        
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.4, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        
        noiseNode.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);
        noiseNode.start(now);
        noiseNode.stop(now + 0.15);
        
        // 2. Heavy traditional sub-bass drum beat
        const drumOsc = this.ctx.createOscillator();
        const drumGain = this.ctx.createGain();
        drumOsc.frequency.setValueAtTime(140, now);
        drumOsc.frequency.exponentialRampToValueAtTime(40, now + 0.25);
        
        drumGain.gain.setValueAtTime(0.5, now);
        drumGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        
        drumOsc.connect(drumGain);
        drumGain.connect(this.ctx.destination);
        drumOsc.start(now);
        drumOsc.stop(now + 0.3);
        
        // 3. Bright success chord
        const freqs = [523.25, 659.25, 784, 1046.5];
        freqs.forEach((freq, idx) => {
            const time = now + 0.05 + idx * 0.02;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, time);
            
            gain.gain.setValueAtTime(0.12, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(time);
            osc.stop(time + 0.28);
        });
    }

    playPongdang() {
        this.init();
        const now = this.ctx.currentTime;
        
        // Descending pitch whistle
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(550, now);
        osc.frequency.linearRampToValueAtTime(120, now + 0.35);
        
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.05, now + 0.35);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.38);
        
        // Water splash noise
        setTimeout(() => {
            if (!this.ctx) return;
            const splashNow = this.ctx.currentTime;
            const bufferSize = this.ctx.sampleRate * 0.3;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            
            const bandpass = this.ctx.createBiquadFilter();
            bandpass.type = 'bandpass';
            bandpass.frequency.setValueAtTime(280, splashNow);
            bandpass.frequency.exponentialRampToValueAtTime(1100, splashNow + 0.25);
            
            const splashGain = this.ctx.createGain();
            splashGain.gain.setValueAtTime(0.25, splashNow);
            splashGain.gain.exponentialRampToValueAtTime(0.001, splashNow + 0.28);
            
            noise.connect(bandpass);
            bandpass.connect(splashGain);
            splashGain.connect(this.ctx.destination);
            noise.start(splashNow);
            noise.stop(splashNow + 0.3);
        }, 350);
    }

    playPregnancy() {
        this.init();
        const now = this.ctx.currentTime;
        
        const scale = [523.25, 587.33, 659.25, 698.46, 784, 880, 987.77, 1046.5];
        scale.forEach((freq, idx) => {
            const time = now + idx * 0.05;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, time);
            
            gain.gain.setValueAtTime(0.08, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(time);
            osc.stop(time + 0.18);
        });
    }

    playVictory() {
        this.init();
        const now = this.ctx.currentTime;
        
        // 1. Traditional gong shimmering sound
        for (let i = 0; i < 3; i++) {
            const time = now + i * 0.6;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(240 + i * 20, time);
            osc.frequency.linearRampToValueAtTime(80, time + 0.8);
            
            gain.gain.setValueAtTime(0.18, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.8);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(time);
            osc.stop(time + 0.85);
        }
        
        // 2. Trumpet/Flute celebratory melody
        const melody = [
            { f: 523.25, d: 0.2 },
            { f: 587.33, d: 0.2 },
            { f: 659.25, d: 0.2 },
            { f: 784.00, d: 0.4 },
            { f: 659.25, d: 0.2 },
            { f: 784.00, d: 0.2 },
            { f: 880.00, d: 0.2 },
            { f: 1046.50, d: 0.8 }
        ];
        
        let melodyTime = now;
        melody.forEach((note) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(note.f, melodyTime);
            
            gain.gain.setValueAtTime(0.12, melodyTime);
            gain.gain.exponentialRampToValueAtTime(0.001, melodyTime + note.d - 0.02);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(melodyTime);
            osc.stop(melodyTime + note.d);
            
            melodyTime += note.d;
        });
    }
}

class UIController {
    constructor() {
        this.yutContainer = document.getElementById('yut-sticks-container');
        this.throwButton = document.getElementById('throw-button');
        this.logList = document.getElementById('log-list');
        this.turnIndicator = document.getElementById('turn-indicator');
        this.playerName = this.turnIndicator.querySelector('.player-name');
        this.boardOverlay = document.getElementById('path-markers');
        this.piecesOverlay = document.getElementById('pieces-overlay');
        this.resultBubble = document.getElementById('result-bubble');
        this.actionPool = document.getElementById('action-pool');
        this.spectatorToggle = document.getElementById('spectator-toggle');
        this.spectatorStatus = document.getElementById('spectator-status');

        this.selectedMoveIndex = -1;
        this.isMoving = false; // guards against a second move being started while one is still animating
        this.throwSound = new Audio('assets/yut_throw.mp3');
        this.synth = new YutAudioSynthesizer();
        
        // Victory elements
        this.victoryOverlay = document.getElementById('victory-overlay');
        this.winnerText = document.getElementById('winner-text');
        this.restartButton = document.getElementById('restart-button');

        this.init();
        
        window.onerror = (msg, source, lineno, colno, error) => {
            this.addLog(`에러 발생: ${msg} (${lineno}:${colno})`);
            console.error(msg, error);
            return false;
        };
    }

    init() {
        this.throwButton.addEventListener('click', () => this.handleThrow());
        this.restartButton.addEventListener('click', () => location.reload());

        this.spectatorToggle.checked = game.spectatorMode;
        this.spectatorToggle.addEventListener('change', () => {
            localStorage.setItem('yut_spectator_mode', this.spectatorToggle.checked);
            location.reload();
        });

        // Load last winner to decide who starts
        const lastWinner = localStorage.getItem('yut_last_winner');
        if (lastWinner !== null) {
            game.currentPlayerIndex = parseInt(lastWinner);
        }

        // Keep sidebar labels in sync with player names (they change in spectator mode)
        document.querySelector('.p1 h4').textContent = game.players[0].name;
        document.querySelector('.p2 h4').textContent = game.players[1].name;

        if (game.spectatorMode) {
            this.throwButton.classList.add('hidden');
            this.spectatorStatus.classList.remove('hidden');
        }

        const p = game.players[game.currentPlayerIndex];
        this.turnIndicator.className = `player-${p.id}`;
        this.playerName.textContent = p.name;

        this.renderYutSticks([1, 1, 1, 1]);
        this.renderBoard();
        this.renderPieces();
        this.renderInventory();

        if (p.isAI) {
            this.throwButton.disabled = true;
            this.addLog(`게임을 시작합니다. ${p.name}의 차례입니다.`);
            setTimeout(() => this.handleThrow(), 1500);
        } else {
            this.addLog("게임을 시작합니다. 당신의 차례입니다.");
        }
    }

    getCoordsList() {
        return BOARD_POSITIONS;
    }

    getCoords(pos) {
        if (pos === 100) return { x: 50, y: 50 };
        return BOARD_POSITIONS[pos] || { x: 50, y: 50 };
    }

    renderBoard() {
        this.boardOverlay.innerHTML = '';
        const coordsList = this.getCoordsList();
        coordsList.forEach((pos, index) => {
            const slot = document.createElement('div');
            slot.className = 'board-slot';
            
            const isLarge = [0, 5, 10, 15, 22].includes(index);
            if (isLarge) {
                slot.classList.add('large');
            }
            
            if (game.specialSpots.pongdang.includes(index)) {
                slot.classList.add('pongdang');
                slot.title = "퐁당! (시작점으로 되돌아감)";
            } else if (game.specialSpots.pregnancy.includes(index)) {
                slot.classList.add('pregnancy');
                slot.title = "임신! (새로운 말 추가)";
            }
            slot.style.left = `${pos.x}%`;
            slot.style.top = `${pos.y}%`;
            slot.dataset.index = index;
            this.boardOverlay.appendChild(slot);
        });
    }

    renderPieces(excludeIds = []) {
        this.piecesOverlay.innerHTML = '';
        game.players.forEach((player, pIdx) => {
            const groupedMals = {};
            player.mals.forEach(mal => {
                if (mal.pos === -1 || mal.pos === 100) return;
                const malUid = `${pIdx}-${mal.id}`;
                if (excludeIds.includes(malUid)) return;
                
                if (!groupedMals[mal.pos]) groupedMals[mal.pos] = { ids: [], mal: mal };
                groupedMals[mal.pos].ids.push(mal.id);
            });

            for (const posStr in groupedMals) {
                const group = groupedMals[posStr];
                const mal = group.mal;
                const count = group.ids.length;
                
                const token = document.createElement('div');
                token.className = `mal-token p${player.id}`;
                const coords = this.getCoords(mal.pos);
                token.style.left = `${coords.x}%`;
                token.style.top = `${coords.y}%`;
                
                if (count > 1) {
                    const badge = document.createElement('span');
                    badge.className = 'mal-badge';
                    badge.textContent = count;
                    token.appendChild(badge);
                }
                
                if (!player.isAI) {
                    token.addEventListener('click', () => this.handleMalClick(pIdx, mal.id));
                    // Mouse hover highlights for path preview
                    token.addEventListener('mouseenter', () => this.highlightPath(pIdx, mal.id));
                    token.addEventListener('mouseleave', () => this.clearPathHighlight());
                }
                this.piecesOverlay.appendChild(token);
            }
        });
    }

    renderInventory() {
        const slots1 = document.querySelector('.p1 .mal-slots');
        const slots2 = document.querySelector('.p2 .mal-slots');
        
        [slots1, slots2].forEach((slot, idx) => {
            slot.innerHTML = '';
            game.players[idx].mals.forEach(mal => {
                if (mal.pos === -1) {
                    const token = document.createElement('div');
                    token.className = `mal-token p${idx + 1} static`;
                    if (!game.players[idx].isAI) {
                        token.addEventListener('click', () => this.handleMalClick(idx, mal.id));
                        // Mouse hover highlights for path preview
                        token.addEventListener('mouseenter', () => this.highlightPath(idx, mal.id));
                        token.addEventListener('mouseleave', () => this.clearPathHighlight());
                    }
                    slot.appendChild(token);
                }
            });
        });
    }

    async handleThrow() {
        if (game.gameState === 'FINISHED') return;
        if (game.gameState !== 'IDLE' && game.gameState !== 'SELECTING_MAL') return;
        if (this.isMoving) return; // a move is still animating/processing

        const currentPlayer = game.players[game.currentPlayerIndex];
        game.gameState = 'THROWING';
        this.throwButton.disabled = true;
        
        this.yutContainer.classList.add('throw-active');
        
        // Play sound effect (from 0s to 2s)
        this.throwSound.currentTime = 0;
        this.throwSound.play().catch(e => console.log("Sound play error:", e));
        setTimeout(() => {
            this.throwSound.pause();
        }, 2000);

        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const throwData = game.throwYut();
        this.renderYutSticks(throwData.sticks);
        
        const resultName = game.getResultName(throwData.result);
        
        // Show result bubble
        this.showResultBubble(resultName);
        
        this.addLog(`${currentPlayer.name}: ${resultName}!`);
        this.yutContainer.classList.remove('throw-active');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.hideResultBubble();

        if (game.extraThrows > 0) {
            game.extraThrows--;
        }

        game.pendingMoves.push(throwData.result);
        
        if (throwData.result === YUT_RESULTS.YUT || throwData.result === YUT_RESULTS.MO) {
            this.addLog("한 번 더 던질 수 있습니다!");
            game.extraThrows++;
        }
        
        game.gameState = 'IDLE';
        this.selectedMoveIndex = -1; // Reset selection after throw
        this.processNextPendingMove();
    }

    renderActionPool() {
        this.actionPool.innerHTML = '';
        const currentPlayer = game.players[game.currentPlayerIndex];
        
        game.pendingMoves.forEach((move, index) => {
            const pill = document.createElement('div');
            pill.className = 'action-move-pill';
            pill.textContent = game.getResultName(move);
            
            const isValid = game.hasValidMoves(game.currentPlayerIndex, move);
            if (!isValid) {
                pill.classList.add('disabled');
                pill.title = "이동할 수 있는 말이 없습니다.";
            }
            
            if (this.selectedMoveIndex === index) {
                pill.classList.add('selected');
            }
            
            if (!currentPlayer.isAI && game.gameState === 'SELECTING_MAL') {
                pill.addEventListener('click', () => {
                    this.selectedMoveIndex = index;
                    this.renderActionPool();
                });
            } else if (currentPlayer.isAI || game.gameState !== 'SELECTING_MAL') {
                pill.classList.add('disabled');
            }
            
            this.actionPool.appendChild(pill);
        });
    }

    processNextPendingMove() {
        if (game.gameState === 'FINISHED') return;
        
        const currentPlayer = game.players[game.currentPlayerIndex];

        // If no more throws and no more moves, switch turn
        if (game.pendingMoves.length === 0 && game.extraThrows === 0) {
            this.switchTurn();
            game.gameState = 'IDLE';
            if (!game.players[game.currentPlayerIndex].isAI) {
                this.throwButton.disabled = false;
            }
            return;
        }

        // Check if any of the pending moves are actually valid (Freeze prevention)
        if (game.pendingMoves.length > 0) {
            const hasAnyValidMove = game.pendingMoves.some(move => game.hasValidMoves(game.currentPlayerIndex, move));
            if (!hasAnyValidMove && game.extraThrows === 0) {
                this.addLog(`${currentPlayer.name}: 이동할 수 있는 말이 없습니다. 차례가 넘어갑니다.`);
                game.pendingMoves = [];
                setTimeout(() => {
                    this.switchTurn();
                    game.gameState = 'IDLE';
                    if (!game.players[game.currentPlayerIndex].isAI) {
                        this.throwButton.disabled = false;
                    }
                }, 1500);
                return;
            }
        }

        game.gameState = 'IDLE';

        // Auto-select if only one move exists
        if (game.pendingMoves.length === 1) {
            this.selectedMoveIndex = 0;
        } else if (this.selectedMoveIndex >= game.pendingMoves.length) {
            this.selectedMoveIndex = -1;
        }

        this.renderActionPool();

        if (currentPlayer.isAI) {
            if (game.extraThrows > 0) {
                setTimeout(() => this.handleThrow(), 1000);
            } else if (game.pendingMoves.length > 0) {
                game.gameState = 'SELECTING_MAL';
                this.renderActionPool(); // Re-render once state is set
                setTimeout(() => this.handleAISelection(), 1000);
            }
        } else {
            // Human player
            this.throwButton.disabled = (game.extraThrows === 0);
            if (game.pendingMoves.length > 0) {
                game.gameState = 'SELECTING_MAL';
                this.renderActionPool(); // Re-render once state is set
                this.addLog("이동할 말을 선택하거나 한 번 더 던지세요.");
            } else {
                this.addLog("한 번 더 던지세요.");
            }
        }
    }

    async handleAISelection() {
        if (game.gameState !== 'SELECTING_MAL') return;
        if (this.isMoving) return; // a previous move is still animating/processing

        this.isMoving = true;
        try {
            const currentPlayer = game.players[game.currentPlayerIndex];
            if (!currentPlayer.isAI) return;

            if (game.pendingMoves.length === 0) {
                this.processNextPendingMove();
                return;
            }

            let bestOverAllScore = -Infinity;
            let bestMoveIndex = -1;
            let bestMalId = null;

            // Evaluate every possible (Move, Mal) combination
            game.pendingMoves.forEach((moveAmount, moveIdx) => {
                const malId = game.getBestMove(game.currentPlayerIndex, moveAmount);
                if (malId !== null) {
                    const mal = currentPlayer.mals.find(m => m.id === malId);
                    const path = game.getPath(mal, moveAmount);
                    const newPos = path.length > 0 ? path[path.length - 1] : mal.pos;
                    const score = game.evaluateMove(game.currentPlayerIndex, malId, newPos, moveAmount);
                    
                    if (score > bestOverAllScore) {
                        bestOverAllScore = score;
                        bestMoveIndex = moveIdx;
                        bestMalId = malId;
                    }
                }
            });
            
            if (bestMalId === null || bestMoveIndex === -1) {
                this.addLog("컴퓨터가 이동할 수 있는 말이 없습니다.");
                game.pendingMoves = []; // Clear invalid moves
                this.finishMove(false);
                return;
            }

            const moveAmount = game.pendingMoves.splice(bestMoveIndex, 1)[0];
            this.selectedMoveIndex = -1;
            this.renderActionPool();

            const moveResult = game.moveMal(game.currentPlayerIndex, bestMalId, moveAmount);
            await this.executeMoveResult(game.currentPlayerIndex, bestMalId, moveResult);
        } catch (e) {
            console.error("AI Selection Error:", e);
            this.switchTurn();
            game.gameState = 'IDLE';
            this.throwButton.disabled = false;
        } finally {
            this.isMoving = false;
        }
    }

    finishMove(caught, message = "", scoredCount = 0) {
        if (scoredCount > 0) {
            this.showScoringBubble(scoredCount);
        }
        
        if (message) {
            this.addLog(message);
        }

        if (this.checkWinCondition()) return;
        
        if (caught) {
            game.extraThrows++;
        }
        
        this.processNextPendingMove();
    }


    showScoringBubble(count) {
        const messages = {
            1: "한모 났습니다.",
            2: "두모 났습니다.",
            3: "세모 났습니다.",
            4: "네모 났습니다."
        };
        const msg = messages[count] || "났습니다!";
        this.showResultBubble(msg);
        setTimeout(() => this.hideResultBubble(), 2000);
    }

    async handleMalClick(playerIdx, malId) {
        if (game.gameState === 'FINISHED' || game.gameState !== 'SELECTING_MAL' || playerIdx !== game.currentPlayerIndex) return;
        if (this.isMoving) return; // a previous move is still animating/processing

        // Clear hover highlights immediately on click
        this.clearPathHighlight();

        if (this.selectedMoveIndex === -1) {
            this.addLog("먼저 이동할 결과를 선택하세요.");
            return;
        }

        this.isMoving = true;
        try {
            const moveAmount = game.pendingMoves.splice(this.selectedMoveIndex, 1)[0];
            this.selectedMoveIndex = -1; // Reset after use
            this.renderActionPool();

            const moveResult = game.moveMal(playerIdx, malId, moveAmount);
            await this.executeMoveResult(playerIdx, malId, moveResult);
        } catch (e) {
            console.error("Mal Click Error:", e);
            this.processNextPendingMove();
        } finally {
            this.isMoving = false;
        }
    }

    async executeMoveResult(playerIdx, malId, moveResult) {
        // Hide only the mals that were moved for clean animation
        const movedMals = game.players[playerIdx].mals
            .filter(m => m.pos === moveResult.newPos)
            .map(m => `${playerIdx}-${m.id}`);

        this.renderPieces(movedMals);
        this.renderInventory();
        
        await this.animateMove(playerIdx, malId, moveResult.path, movedMals.length);
        
        // Play special graphic effects before rendering final pieces
        if (moveResult.newPos === -1 && moveResult.message && moveResult.message.includes("퐁당")) {
            // Create a temporary spinning/fading token at the trap slot
            const trapSlotIdx = moveResult.path[moveResult.path.length - 1];
            if (trapSlotIdx !== undefined && this.getCoords(trapSlotIdx)) {
                const coords = this.getCoords(trapSlotIdx);
                const tempToken = document.createElement('div');
                tempToken.className = `mal-token p${game.players[playerIdx].id} pongdang-active`;
                tempToken.style.left = `${coords.x}%`;
                tempToken.style.top = `${coords.y}%`;
                this.piecesOverlay.appendChild(tempToken);
                this.synth.playPongdang();
                
                await new Promise(resolve => setTimeout(resolve, 1200));
                tempToken.remove();
            }
        } else if (moveResult.pregnancy) {
            // Create a temporary glowing starburst token at the pregnancy slot
            if (moveResult.newPos !== -1 && this.getCoords(moveResult.newPos)) {
                const coords = this.getCoords(moveResult.newPos);
                const tempToken = document.createElement('div');
                tempToken.className = `mal-token p${game.players[playerIdx].id} pregnancy-active`;
                tempToken.style.left = `${coords.x}%`;
                tempToken.style.top = `${coords.y}%`;
                this.piecesOverlay.appendChild(tempToken);
                this.synth.playPregnancy();
                
                await new Promise(resolve => setTimeout(resolve, 1500));
                tempToken.remove();
            }
        } else if (moveResult.caught) {
            this.synth.playCatch();
        } else if (moveResult.newPos !== 100) {
            // Check if we joined another of our pieces already sitting at the target spot
            const joinedSelf = game.players[playerIdx].mals.some(m => m.pos === moveResult.newPos && m.id !== malId && m.status === 'ON_BOARD');
            if (joinedSelf) {
                this.synth.playStack();
            }
        }

        this.renderPieces();
        this.renderInventory(); // Update inventory after move
        this.finishMove(moveResult.caught, moveResult.message, moveResult.newPos === 100 ? movedMals.length : 0);
    }

    async animateMove(playerIdx, malId, path, count = 1) {
        if (!path || path.length === 0) return;

        const player = game.players[playerIdx];
        
        const token = document.createElement('div');
        token.className = `mal-token p${player.id} animating`;
        
        if (count > 1) {
            const badge = document.createElement('span');
            badge.className = 'mal-badge';
            badge.textContent = count;
            token.appendChild(badge);
        }
        
        this.piecesOverlay.appendChild(token);

        for (let i = 0; i < path.length; i++) {
            const stepPos = path[i];
            if (stepPos === 100 || stepPos === -1) continue;
            
            const coords = this.getCoords(stepPos);
            token.style.left = `${coords.x}%`;
            token.style.top = `${coords.y}%`;
            
            // Play wood hop click
            this.synth.playMove();
            
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        token.remove();
    }

    highlightPath(playerIdx, malId) {
        if (game.gameState !== 'SELECTING_MAL' || playerIdx !== game.currentPlayerIndex) return;
        
        // Find which move is selected or automatically active
        let activeMove = null;
        if (this.selectedMoveIndex !== -1) {
            activeMove = game.pendingMoves[this.selectedMoveIndex];
        } else if (game.pendingMoves.length === 1) {
            activeMove = game.pendingMoves[0];
        }
        
        if (activeMove === null) return;

        const player = game.players[playerIdx];
        const mal = player.mals.find(m => m.id === malId);
        if (!mal || mal.status === 'FINISHED') return;

        // In Back-Do, if piece is at start, it cannot move
        if (mal.pos === -1 && activeMove === -1) return;

        const path = game.getPath(mal, activeMove);
        if (!path || path.length === 0) return;

        const newPos = path[path.length - 1];

        // Draw flowing path highlights
        path.forEach((slotIdx, i) => {
            if (slotIdx === -1 || slotIdx === 100) return;
            const slotEl = this.boardOverlay.querySelector(`[data-index="${slotIdx}"]`);
            if (slotEl) {
                slotEl.style.transitionDelay = `${i * 40}ms`;
                slotEl.classList.add('path-highlight');
            }
        });

        // Pulse glow target destination
        if (newPos !== -1 && newPos !== 100) {
            const targetEl = this.boardOverlay.querySelector(`[data-index="${newPos}"]`);
            if (targetEl) {
                targetEl.classList.add('target-highlight');
                
                const opponentIdx = 1 - playerIdx;
                const hasOpponent = game.players[opponentIdx].mals.some(m => m.pos === newPos && m.pos !== -1);
                const hasSelf = player.mals.some(m => m.pos === newPos && m.id !== malId && m.pos !== -1);
                
                if (hasOpponent) {
                    targetEl.classList.add('target-catch');
                } else if (hasSelf) {
                    targetEl.classList.add('target-stack');
                } else if (game.specialSpots.pongdang.includes(newPos)) {
                    targetEl.classList.add('target-pongdang');
                } else if (game.specialSpots.pregnancy.includes(newPos)) {
                    targetEl.classList.add('target-pregnancy');
                } else {
                    targetEl.classList.add('target-default');
                }
            }
        }
    }

    clearPathHighlight() {
        const slots = this.boardOverlay.querySelectorAll('.board-slot');
        slots.forEach(slot => {
            slot.style.transitionDelay = '0s';
            slot.classList.remove(
                'path-highlight', 
                'target-highlight', 
                'target-catch', 
                'target-stack', 
                'target-pongdang', 
                'target-pregnancy', 
                'target-default'
            );
        });
    }

    showResultBubble(text) {
        this.resultBubble.textContent = text;
        this.resultBubble.classList.add('show');
    }

    hideResultBubble() {
        this.resultBubble.classList.remove('show');
    }

    renderYutSticks(sticks) {
        this.yutContainer.innerHTML = '';
        sticks.forEach((isFront, index) => {
            const stick = document.createElement('div');
            stick.className = `yut-stick ${isFront ? 'front' : 'back'}`;
            if (index === 0) {
                stick.classList.add('back-do-stick');
            }
            this.yutContainer.appendChild(stick);
        });
    }

    addLog(message) {
        const li = document.createElement('li');
        li.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        this.logList.prepend(li);
    }

    switchTurn() {
        game.extraThrows = 0;
        game.pendingMoves = [];
        game.currentPlayerIndex = 1 - game.currentPlayerIndex;
        const p = game.players[game.currentPlayerIndex];
        this.turnIndicator.className = `player-${p.id}`;
        this.playerName.textContent = p.name;

        if (p.isAI) {
            this.throwButton.disabled = true;
            setTimeout(() => this.handleThrow(), 1500);
        }
    }

    checkWinCondition() {
        const player = game.players[game.currentPlayerIndex];
        if (player.mals.every(m => m.pos === 100)) {
            const winnerName = player.name;

            // Save winner for next game
            localStorage.setItem('yut_last_winner', game.currentPlayerIndex);
            
            this.showVictoryPopup(winnerName);
            game.gameState = 'FINISHED';
            return true;
        }
        return false;
    }

    showVictoryPopup(winner) {
        this.winnerText.textContent = `${winner} 승리!`;
        this.victoryOverlay.classList.remove('hidden');
        this.addLog(`${winner} 승리!!! 🎉`);
        this.synth.playVictory();
    }
}

const ui = new UIController();
