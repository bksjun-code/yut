/**
 * Game Engine for Yut Nori
 */

const YUT_RESULTS = {
    DO: 1,      // 1 face up
    GAE: 2,     // 2 faces up
    GEOL: 3,    // 3 faces up
    YUT: 4,     // 4 faces up
    MO: 5,      // 4 faces down (all flat)
    BACK_DO: -1 // 1 face up with mark
};

/**
 * Board Positions (0-28)
 * 0-19: Outer circle (Anti-clockwise starting from bottom-right)
 * 20-24: Diagonal from top-right to bottom-left (Shortcut 1)
 * 25-28: Diagonal from top-left to bottom-right (Shortcut 2, excluding center which is already in S1)
 * 
 * Approximate Coordinates for 2752x1536 background (mapped to percent for flexibility)
 */
const BOARD_POSITIONS = [
    // Outer Path (0 to 19)
    { x: 92, y: 92 }, // 0: Start
    { x: 92, y: 74 }, { x: 92, y: 56 }, { x: 92, y: 38 }, { x: 92, y: 20 },
    { x: 92, y: 8 },  // 5: Top-Right Corner
    { x: 74, y: 8 },  { x: 56, y: 8 },  { x: 38, y: 8 },  { x: 20, y: 8 },
    { x: 8, y: 8 },   // 10: Top-Left Corner
    { x: 8, y: 20 },  { x: 8, y: 38 },  { x: 8, y: 56 },  { x: 8, y: 74 },
    { x: 8, y: 92 },  // 15: Bottom-Left Corner
    { x: 20, y: 92 }, { x: 38, y: 92 }, { x: 56, y: 92 }, { x: 74, y: 92 },
    
    // Diagonal 1 (Top-Right to Bottom-Left)
    { x: 75, y: 25 }, { x: 62, y: 38 }, 
    { x: 50, y: 50 }, // 22: Center
    { x: 38, y: 62 }, { x: 25, y: 75 },
 
    // Diagonal 2 (Top-Left to Bottom-Right)
    { x: 25, y: 25 }, { x: 38, y: 38 },
    // Center is 22
    { x: 62, y: 62 }, { x: 75, y: 75 }
];

class YutGame {
    constructor() {
        this.players = [
            { id: 1, name: "나 (강아지)", color: "blue", isAI: false, mals: Array(4).fill(null).map((_, i) => ({ id: i, pos: -1, status: 'WAITING' })) },
            { id: 2, name: "컴퓨터 (송아지)", color: "red", isAI: true, mals: Array(4).fill(null).map((_, i) => ({ id: i, pos: -1, status: 'WAITING' })) }
        ];
        this.currentPlayerIndex = 0;
        this.gameState = 'IDLE'; 
        this.lastThrow = null;
        this.pendingMoves = [];
        this.extraThrows = 0;
        this.specialSpots = {
            pongdang: [],
            pregnancy: []
        };
        this.initSpecialSpots();
    }

    initSpecialSpots() {
        const availablePositions = Array.from({ length: 28 }, (_, i) => i + 1); // Positions 1-28 (exclude 0/start)
        const shuffle = (array) => {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        };
        shuffle(availablePositions);
        
        this.specialSpots.pongdang = availablePositions.slice(0, 1);
        this.specialSpots.pregnancy = availablePositions.slice(1, 2);
    }

    moveMal(playerIndex, malId, steps) {
        const player = this.players[playerIndex];
        const mal = player.mals.find(m => m.id === malId);
        const oldPos = mal.pos;
        
        const path = this.getPath(mal.pos, steps);
        const newPos = path.length > 0 ? path[path.length - 1] : mal.pos;
        
        // Handle grouping
        const othersAtSameSpot = player.mals.filter(m => m.pos === mal.pos && m.pos !== -1);
        
        // Handle catching
        const opponentIndex = 1 - playerIndex;
        const opponent = this.players[opponentIndex];
        const caught = opponent.mals.filter(m => m.pos === newPos && newPos !== -1 && newPos !== 100);
        
        let caughtMessage = "";
        if (caught.length > 0) {
            caught.forEach(m => {
                m.pos = -1;
                m.status = 'WAITING';
            });
            caughtMessage = "상대 말을 잡았습니다! 한 번 더 던지세요.";
        }

        // Update position for self and grouped pieces
        othersAtSameSpot.forEach(m => {
            m.pos = newPos;
            if (newPos === 100) m.status = 'FINISHED';
            else m.status = 'ON_BOARD';
        });
        
        mal.pos = newPos;
        if (newPos === 100) mal.status = 'FINISHED';
        else mal.status = 'ON_BOARD';

        // Check for special spots
        if (newPos !== -1 && newPos !== 100) {
            if (this.specialSpots.pongdang.includes(newPos)) {
                // Pongdang: Back to start!
                mal.pos = -1;
                mal.status = 'WAITING';
                othersAtSameSpot.forEach(m => {
                    m.pos = -1;
                    m.status = 'WAITING';
                });
                return { newPos: -1, path, caught: caught.length > 0, message: "퐁당! 시작점으로 되돌아갑니다." };
            } else if (this.specialSpots.pregnancy.includes(newPos)) {
                // Pregnancy: Gain a piece if waiting!
                const waitingMal = player.mals.find(m => m.pos === -1);
                if (waitingMal) {
                    waitingMal.pos = newPos;
                    waitingMal.status = 'ON_BOARD';
                    return { newPos, path, caught: caught.length > 0, message: "임신! 새로운 말을 얻었습니다.", pregnancy: true };
                }
            }
        }

        return { newPos, path, caught: caught.length > 0, message: caughtMessage };
    }

    getPath(currentPos, steps) {
        const path = [];
        if (steps === -1) { // Back-Do
            if (currentPos === -1) return [];
            if (currentPos === 0) path.push(19);
            else if (currentPos === 20) path.push(5);
            else if (currentPos === 25) path.push(10);
            else if (currentPos === 27) path.push(22);
            else if (currentPos === 15) path.push(24);
            else path.push(currentPos - 1);
            return path;
        }

        let pos = currentPos;
        if (pos === -1) {
            path.push(0);
            pos = 0;
        }
        
        for (let i = 0; i < steps; i++) {
            if (pos === 0 && !(currentPos === -1 && i === 0)) {
                pos = 100;
            } else {
                let cameFrom = currentPos === -1 ? 0 : currentPos;
                if (path.length >= 2) {
                    cameFrom = path[path.length - 2];
                }
                pos = this.getSingleStep(pos, i === 0, cameFrom);
            }
            path.push(pos);
            if (pos === 100) break;
        }
        return path;
    }

    getSingleStep(pos, isFirstStep, cameFrom) {
        if (isFirstStep) {
            if (pos === 5) return 20;
            if (pos === 10) return 25;
            if (pos === 22) return 27;
        }

        if (pos >= 0 && pos < 19) return pos + 1;
        if (pos === 19) return 0;
        
        if (pos === 20) return 21; // Fix: 20 -> 21
        if (pos === 21) return 22;
        
        if (pos === 22) {
            if (cameFrom === 21) return 23; // Came from Top-Right
            if (cameFrom === 26) return 27; // Came from Top-Left
            return 27; // Default exit
        }
        
        if (pos === 23) return 24;
        if (pos === 24) return 15;
        if (pos === 25) return 26;
        if (pos === 26) return 22;
        if (pos === 27) return 28;
        if (pos === 28) return 0;
        if (pos === -1) return 0; // WAITING to Start
        
        return pos;
    }

    hasValidMoves(playerIndex, steps) {
        const player = this.players[playerIndex];
        return player.mals.some(m => {
            if (m.status === 'FINISHED') return false;
            const path = this.getPath(m.pos, steps);
            const newPos = path.length > 0 ? path[path.length - 1] : m.pos;
            return m.pos !== -1 || newPos !== -1;
        });
    }

    getBestMove(playerIndex, steps) {
        const player = this.players[playerIndex];
        const validMals = player.mals.filter(m => m.status !== 'FINISHED');
        
        if (validMals.length === 0) return null;

        let bestScore = -Infinity;
        let bestMalId = null;

        validMals.forEach(mal => {
            const path = this.getPath(mal.pos, steps);
            const newPos = path.length > 0 ? path[path.length - 1] : mal.pos;
            
            // Skip if no movement possible (invalid back-do)
            if (mal.pos === -1 && newPos === -1) return;

            const score = this.evaluateMove(playerIndex, mal.id, newPos, steps);
            if (score > bestScore) {
                bestScore = score;
                bestMalId = mal.id;
            }
        });

        return bestMalId;
    }

    evaluateMove(playerIndex, malId, newPos, steps) {
        const player = this.players[playerIndex];
        const opponent = this.players[1 - playerIndex];
        const mal = player.mals.find(m => m.id === malId);
        
        let score = 0;

        // 1. Goal (Finishing)
        if (newPos === 100) {
            const carryCount = player.mals.filter(m => m.pos === mal.pos).length;
            score += 200 * carryCount; // Finishing multiple mals is great
            return score; 
        }

        // 2. Pongdang (Danger)
        if (this.specialSpots.pongdang.includes(newPos)) {
            return -1000;
        }

        // 3. Catching Opponent
        const caughtCount = opponent.mals.filter(m => m.pos === newPos && newPos !== -1).length;
        if (caughtCount > 0) {
            score += 150 + (caughtCount * 50);
        }

        // 4. Pregnancy (Bonus Mal)
        if (this.specialSpots.pregnancy.includes(newPos)) {
            const hasWaiting = player.mals.some(m => m.pos === -1);
            if (hasWaiting) score += 120;
        }

        // 5. Upgi (Stacking Self) - Joining another piece already on the board
        const joiningMals = player.mals.filter(m => m.pos === newPos && m.id !== mal.id && newPos !== -1).length;
        if (joiningMals > 0) {
            score += 80;
        }

        // 6. Shortcuts (Corners and Center)
        if (newPos === 5 || newPos === 10) score += 60;
        if (newPos === 22) score += 50;

        // 7. Progress and Deployment
        const carryCount = player.mals.filter(m => m.pos === mal.pos).length;
        if (mal.pos === -1) {
            // Incentive to deploy if we have few pieces out or it's a good roll
            const malsOnBoard = player.mals.filter(m => m.pos !== -1 && m.pos !== 100).length;
            score += (4 - malsOnBoard) * 10; 
        } else {
            if (steps === -1) {
                // Back-Do logic
                if (newPos === 0) {
                    // Reaching the start line via Back-Do is GREAT (next turn finish with any roll)
                    score += 180 * carryCount; 
                } else if (newPos === 19 || newPos === 24 || newPos === 28) {
                    // Moving back into a corner shortcut or finish line
                    score += 150 * carryCount;
                } else {
                    // General backwards move: check the cost
                    score -= 20 * carryCount; // Penalize moving back, especially for stacks
                }
            } else {
                // Regular forward move
                score += steps * 5;
                // Variability: favor moving the one further ahead to finish it
                score += mal.pos * 1.5;
            }
        }

        // 8. Random factor (to prevent purely predictable behavior)
        score += Math.random() * 5;

        return score;
    }


    throwYut() {
        // Probability simulation (Standard Yut Nori)
        // Let 0 = Flat (Back), 1 = Rounded (Front)
        // Standard Yut: 4 sticks
        let sticks = Array(4).fill(0).map(() => Math.random() < 0.5 ? 1 : 0);
        let frontCount = sticks.filter(s => s === 1).length;

        let result;
        if (frontCount === 1) {
            // Special case: Back-Do (1 face up with mark). 
            // Simplified: 1/4 chance of regular Do being Back-Do
            result = Math.random() < 0.25 ? YUT_RESULTS.BACK_DO : YUT_RESULTS.DO;
        } else if (frontCount === 2) {
            result = YUT_RESULTS.GAE;
        } else if (frontCount === 3) {
            result = YUT_RESULTS.GEOL;
        } else if (frontCount === 4) {
            result = YUT_RESULTS.YUT;
        } else {
            result = YUT_RESULTS.MO;
        }

        return { sticks, result };
    }

    getResultName(result) {
        switch(result) {
            case YUT_RESULTS.DO: return "도";
            case YUT_RESULTS.GAE: return "개";
            case YUT_RESULTS.GEOL: return "걸";
            case YUT_RESULTS.YUT: return "윷";
            case YUT_RESULTS.MO: return "모";
            case YUT_RESULTS.BACK_DO: return "뒷도";
            default: return "";
        }
    }
}

const game = new YutGame();
console.log("Game Engine Loaded");
