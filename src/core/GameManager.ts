import { gameState } from './GameState';
import { Constants } from './Constants';
import { tutorial } from './Tutorial';
import { editor } from '../editor/HarborEditor';
import { DEFAULT_HARBORS } from '../data/harbors';

export class GameManager {
    constructor() { }

    startGame() {
        // Default to Level 1
        this.startLevel(1);
    }

    startTutorial() {
        const modal = document.getElementById('introModal');
        if (modal) modal.style.display = 'none';
        gameState.gameMode = 'practice';
        tutorial.start(gameState);
    }

    startHarborEdit() {
        const modal = document.getElementById('introModal');
        if (modal) modal.style.display = 'none';
        const settings = document.getElementById('settingsPanel');
        if (settings) settings.style.display = 'none';

        editor.start(gameState);
    }

    endTutorial() {
        tutorial.stop();
    }

    nextTutorialStep() {
        tutorial.nextStep(gameState);
    }

    resetCurrentLevel() {
        // If in game mode, restart the level
        if (gameState.gameMode === 'game') {
            this.startLevel(gameState.currentLevel);
        } else {
            gameState.resetBoat();
        }
    }

    togglePropDirection() {
        gameState.boat.propDirection = (gameState.boat.propDirection === 'rechts') ? 'links' : 'rechts';
        const btn = document.getElementById('propDirToggle');
        if (btn) btn.textContent = gameState.boat.propDirection === 'rechts' ? 'Rechts ↻' : 'Links ↺';
    }

    startPracticeMode() {
        gameState.gameMode = 'practice';
        document.body.classList.remove('game-mode-active');
        const modal = document.getElementById('introModal');
        if (modal) modal.style.display = 'none';

        const btn = document.getElementById('gameModeLabel');
        if (btn) {
            btn.textContent = 'OEFENMODUS';
            btn.style.color = '#4ade80';
            btn.style.background = 'rgba(74, 222, 128, 0.1)';
            btn.style.borderColor = 'rgba(74, 222, 128, 0.2)';
        }

        const ls = document.getElementById('levelSelection');
        if (ls) ls.style.display = 'none';
    }

    startGameMode() {
        this.startLevel(gameState.currentLevel || 1);
    }

    startLevel(level: number) {
        if (!DEFAULT_HARBORS || DEFAULT_HARBORS.length === 0) {
            console.error("No default harbors available!");
            return;
        }
        if (level < 1) level = 1;
        // Allows loading indices if available, but let's stick to valid range checking later if needed.
        // For now, use modulus or clamp? DEFAULT_HARBORS might have fewer.
        const index = (level - 1) % DEFAULT_HARBORS.length;

        gameState.harbor = JSON.parse(JSON.stringify(DEFAULT_HARBORS[index]));
        gameState.currentLevel = level;

        gameState.resetBoat();

        // Setup Coins for Levels
        gameState.coins = [];
        if (level === 1) {
            gameState.coins.push({ x: 400, y: 400, collected: false, radius: 15 });
        } else if (level === 2) {
            // Updated Level 2 difficulty: Coins further away
            gameState.coins.push({ x: 800, y: 250, collected: false, radius: 15 });
            gameState.coins.push({ x: 600, y: 350, collected: false, radius: 15 });
        } else if (level === 3) {
            gameState.coins.push({ x: 200, y: 500, collected: false, radius: 15 });
            gameState.coins.push({ x: 800, y: 500, collected: false, radius: 15 });
        } else if (level === 4) {
            // Harder
            gameState.coins.push({ x: 100, y: 150, collected: false, radius: 15 });
            gameState.coins.push({ x: 900, y: 150, collected: false, radius: 15 });
        }

        this.updateUI();
        this.updateWindDisplay();

        gameState.gameMode = 'game';
        document.body.classList.add('game-mode-active');
        const modal = document.getElementById('introModal');
        if (modal) modal.style.display = 'none';

        const btn = document.getElementById('gameModeLabel');
        if (btn) {
            btn.textContent = 'GAME MODUS';
            btn.style.color = '#fbbf24';
            btn.style.background = 'rgba(251, 191, 36, 0.1)';
            btn.style.borderColor = 'rgba(251, 191, 36, 0.2)';
        }

        const ls = document.getElementById('levelSelection');
        if (ls) ls.style.display = 'flex';

        console.log(`Started Level ${level}`);
    }

    updateUI() {
        const ids: { [key: string]: number } = {
            'thrustGainValue': Constants.THRUST_GAIN,
            'propwashGainValue': Constants.RUDDER_WASH_GAIN,
            'rudderHydroGainValue': Constants.RUDDER_HYDRO_GAIN,
            'lateralDragValue': Constants.LATERAL_DRAG_COEFF,
            'lineStrengthValue': Constants.LINE_STRENGTH,
            'massValue': Constants.MASS,
            'dragValue': Constants.DRAG_COEFF
        };

        for (const [id, val] of Object.entries(ids)) {
            const el = document.getElementById(id);
            if (el) el.textContent = val.toString();
        }

        const harborSelect = document.getElementById('harborSelector') as HTMLSelectElement;
        if (harborSelect) harborSelect.value = gameState.currentLevel.toString();
    }

    setupGlobalbindings() {
        (window as any).startGame = () => this.startGame();
        (window as any).startTutorial = () => this.startTutorial();
        (window as any).startHarborEdit = () => this.startHarborEdit();
        (window as any).endTutorial = () => this.endTutorial();
        (window as any).nextTutorialStep = () => this.nextTutorialStep();
        (window as any).resetCurrentLevel = () => this.resetCurrentLevel();
        (window as any).togglePropDirection = () => this.togglePropDirection();
        (window as any).startPracticeMode = () => this.startPracticeMode();
        (window as any).startGameMode = () => this.startGameMode();
        (window as any).updateUI = () => this.updateUI();
        (window as any).startLevel = (n: number) => this.startLevel(n);

        // Physics constants binding
        const bindConstant = (windowKey: string, constantKey: keyof typeof Constants) => {
            Object.defineProperty(window, windowKey, {
                get: () => Constants[constantKey],
                set: (val) => { (Constants as any)[constantKey] = val; }
            });
        };

        bindConstant('THRUST_GAIN', 'THRUST_GAIN');
        bindConstant('RUDDER_WASH_GAIN', 'RUDDER_WASH_GAIN');
        bindConstant('RUDDER_HYDRO_GAIN', 'RUDDER_HYDRO_GAIN');
        bindConstant('LATERAL_DRAG_COEFF', 'LATERAL_DRAG_COEFF');
        bindConstant('LINE_STRENGTH', 'LINE_STRENGTH');

        const massSlider = document.getElementById('massSlider');
        if (massSlider) {
            massSlider.addEventListener('input', (e) => {
                const target = e.target as HTMLInputElement;
                (Constants as any).MASS = parseFloat(target.value);
                this.updateUI();
            });
        }

        const dragSlider = document.getElementById('dragSlider');
        if (dragSlider) {
            dragSlider.addEventListener('input', (e) => {
                const target = e.target as HTMLInputElement;
                (Constants as any).DRAG_COEFF = parseFloat(target.value);
                this.updateUI();
            });
        }


        const settingsBtn = document.getElementById('settingsToggle');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                const panel = document.getElementById('settingsPanel');
                if (panel) {
                    panel.style.display = (panel.style.display === 'flex') ? 'none' : 'flex';
                }
            });
        }

        const showForcesCheck = document.getElementById('showForcesCheck') as HTMLInputElement | null;
        if (showForcesCheck) {
            showForcesCheck.checked = gameState.showForces;
            showForcesCheck.addEventListener('change', () => {
                gameState.showForces = showForcesCheck.checked;
            });
        }

        const harborSelector = document.getElementById('harborSelector') as HTMLSelectElement | null;
        const fileInput = document.getElementById('hbrFileInput') as HTMLInputElement | null;

        if (harborSelector) {
            harborSelector.addEventListener('change', () => {
                const val = harborSelector.value;
                if (val === 'import') {
                    if (fileInput) fileInput.click();
                    harborSelector.value = gameState.currentLevel.toString();
                } else {
                    const level = parseInt(val);
                    if (!isNaN(level)) {
                        this.startLevel(level);
                    }
                }
            });
        }

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const files = (e.target as HTMLInputElement).files;
                if (files && files.length > 0) {
                    const file = files[0];
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        try {
                            const json = evt.target?.result as string;
                            const data = JSON.parse(json);
                            editor.loadHarbor(data);
                            // Switch to edit mode automatically?
                            if (gameState.gameMode !== 'edit') {
                                this.startHarborEdit();
                            }
                        } catch (err) {
                            console.error("Failed to parse harbor file", err);
                            alert("Ongeldig haven bestand! (JSON Error)");
                        }
                    };
                    reader.readAsText(file);
                }
            });
        }

        const windSpeedSlider = document.getElementById('windSpeedSlider') as HTMLInputElement | null;
        const windDirSlider = document.getElementById('windDirSlider') as HTMLInputElement | null;

        if (windSpeedSlider) {
            windSpeedSlider.value = gameState.harbor.wind.force.toString();
            windSpeedSlider.addEventListener('input', () => {
                gameState.harbor.wind.force = parseFloat(windSpeedSlider.value);
                const label = document.getElementById('windSpeedLabel');
                if (label) label.textContent = windSpeedSlider.value;
                this.updateWindDisplay();
            });
        }

        if (windDirSlider) {
            windDirSlider.value = gameState.harbor.wind.direction.toString();
            windDirSlider.addEventListener('input', () => {
                gameState.harbor.wind.direction = parseFloat(windDirSlider.value);
                const label = document.getElementById('windDirLabel');
                if (label) label.textContent = windDirSlider.value;
                this.updateWindDisplay();
            });
        }


        this.populateHarborSelector();
        this.updateUI();
        this.updateWindDisplay();

        const gameModeBtn = document.getElementById('gameModeLabel');
        if (gameModeBtn) {
            gameModeBtn.onclick = null; // Remove inline handler
            gameModeBtn.addEventListener('click', () => {
                if (gameState.gameMode === 'practice') {
                    this.startGameMode();
                } else {
                    this.startPracticeMode();
                }
            });
        }
    }

    populateHarborSelector() {
        const selector = document.getElementById('harborSelector') as HTMLSelectElement;
        const defaultGroup = document.getElementById('defaultHarborGroup');
        if (!selector || !defaultGroup) return;

        defaultGroup.innerHTML = '';
        DEFAULT_HARBORS.forEach((h, index) => {
            const option = document.createElement('option');
            option.value = (index + 1).toString();
            option.textContent = h.name;
            defaultGroup.appendChild(option);
        });

        // Enable level buttons
        const levelBtns = document.querySelectorAll('.levelBtn');
        levelBtns.forEach(btn => {
            const b = btn as HTMLButtonElement;
            b.disabled = false;
            b.addEventListener('click', () => {
                const lvl = parseInt(b.getAttribute('data-level') || '1');
                this.startLevel(lvl);
            });
        });
    }

    updateWindDisplay() {
        const wind = gameState.harbor.wind;
        const windSpeedDisplay = document.getElementById('windSpeedDisplay');
        if (windSpeedDisplay) windSpeedDisplay.textContent = wind.force.toFixed(0) + ' kn';

        const canvas = document.getElementById('windRoseCanvas') as HTMLCanvasElement | null;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const r = Math.min(cx, cy) - 2;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = 'rgba(148, 163, 253, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = 'bold 8px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('N', cx, cy - r + 6);
        ctx.fillText('Z', cx, cy + r - 6);
        ctx.fillText('O', cx + r - 6, cy);
        ctx.fillText('W', cx - r + 6, cy);

        if (wind.force > 0) {
            const len = 8 + Math.min(10, wind.force * 0.4);
            const rad = (wind.direction + 180 - 90) * Math.PI / 180;

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(rad);

            ctx.strokeStyle = '#3b82f6';
            ctx.fillStyle = '#3b82f6';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-len, 0);
            ctx.lineTo(len, 0);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(len, 0);
            ctx.lineTo(len - 5, -3);
            ctx.lineTo(len - 5, 3);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }
}
