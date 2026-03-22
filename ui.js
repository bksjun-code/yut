/**
 * UI Controller for Yut Nori
 */

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
        
        // Load last winner to decide who starts
        const lastWinner = localStorage.getItem('yut_last_winner');
        if (lastWinner !== null) {
            game.currentPlayerIndex = parseInt(lastWinner);
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

    renderBoard() {
        this.boardOverlay.innerHTML = '';
        BOARD_POSITIONS.forEach((pos, index) => {
            const slot = document.createElement('div');
            slot.className = 'board-slot';
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
                const coords = BOARD_POSITIONS[mal.pos];
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
                    }
                    slot.appendChild(token);
                }
            });
        });
    }

    async handleThrow() {
        if (game.gameState === 'FINISHED') return;
        if (game.gameState !== 'IDLE' && game.gameState !== 'SELECTING_MAL') return;
        
        const currentPlayer = game.players[game.currentPlayerIndex];
        game.gameState = 'THROWING';
        this.throwButton.disabled = true;
        
        this.yutContainer.classList.add('throw-active');
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
        this.processNextPendingMove();
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

        game.gameState = 'IDLE';

        // Auto-skip invalid moves (like Back-do with no pieces on board)
        if (game.pendingMoves.length > 0) {
            const nextMove = game.pendingMoves[0];
            if (!game.hasValidMoves(game.currentPlayerIndex, nextMove)) {
                const moveName = game.getResultName(nextMove);
                this.addLog(`${moveName}: 이동할 말이 없어 무효 처리됩니다.`);
                game.pendingMoves.shift();
                setTimeout(() => this.processNextPendingMove(), 1000);
                return;
            }
        }

        if (currentPlayer.isAI) {
            if (game.extraThrows > 0) {
                setTimeout(() => this.handleThrow(), 1000);
            } else if (game.pendingMoves.length > 0) {
                game.gameState = 'SELECTING_MAL';
                setTimeout(() => this.handleAISelection(), 1000);
            }
        } else {
            // Human player
            this.throwButton.disabled = (game.extraThrows === 0);
            if (game.pendingMoves.length > 0) {
                game.gameState = 'SELECTING_MAL';
                this.addLog("이동할 말을 선택하거나 한 번 더 던지세요.");
            } else {
                this.addLog("한 번 더 던지세요.");
            }
        }
    }

    async handleAISelection() {
        if (game.gameState !== 'SELECTING_MAL') return;
        
        try {
            const currentPlayer = game.players[game.currentPlayerIndex];
            if (!currentPlayer.isAI) return;

            const moveAmount = game.pendingMoves.shift();
            if (moveAmount === undefined) {
                this.processNextPendingMove();
                return;
            }
            
            const malId = game.getBestMove(game.currentPlayerIndex, moveAmount);
            
            if (malId === null) {
                this.addLog("컴퓨터가 이동할 수 있는 말이 없습니다.");
                this.finishMove(false);
                return;
            }

            const moveResult = game.moveMal(game.currentPlayerIndex, malId, moveAmount);
            await this.executeMoveResult(game.currentPlayerIndex, malId, moveResult);
        } catch (e) {
            console.error("AI Selection Error:", e);
            this.switchTurn();
            game.gameState = 'IDLE';
            this.throwButton.disabled = false;
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

        try {
            const moveAmount = game.pendingMoves.shift();
            if (moveAmount === undefined) return;

            const moveResult = game.moveMal(playerIdx, malId, moveAmount);
            await this.executeMoveResult(playerIdx, malId, moveResult);
        } catch (e) {
            console.error("Mal Click Error:", e);
            this.processNextPendingMove();
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
        
        this.renderPieces();
        this.renderInventory(); // Update inventory after move (especially for Pregnancy)
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
            if (stepPos === 100) continue;
            
            const coords = BOARD_POSITIONS[stepPos];
            token.style.left = `${coords.x}%`;
            token.style.top = `${coords.y}%`;
            
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        token.remove();
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
        sticks.forEach((isFront) => {
            const stick = document.createElement('div');
            stick.className = `yut-stick ${isFront ? 'front' : 'back'}`;
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
            const winnerName = player.isAI ? "컴퓨터" : "나 (강아지)";
            
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
    }
}

const ui = new UIController();
