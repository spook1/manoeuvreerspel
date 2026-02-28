import { gameState } from './GameState';
import { Constants } from './Constants';
import { tutorial } from './Tutorial';
import { editor } from '../editor/HarborEditor';
import {
    DEFAULT_HARBORS, DEFAULT_SCENARIOS,
    getHarborById, getScenarioById,
    ScenarioData, HarborData
} from '../data/harbors';
import { ApiClient } from './ApiClient';
import { scenarioRunner } from './ScenarioRunner';
import {
    initScenarioEditor,
    wireScenarioEditorUI
} from '../editor/ScenarioEditorController';


export class GameManager {
    private customScenarios: ScenarioData[] = [];
    private customHarbors: HarborData[] = [];

    constructor() {
        this.setupModeButtons();
    }

    // ── MODE ENTRY POINTS ────────────────────────────────────────────────────

    startGame() {
        const modal = document.getElementById('introModal');
        if (modal) modal.style.display = 'none';
        this.startScenario(gameState.scenario?.id ?? 's1');
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

        const scenarioOverlay = document.getElementById('scenarioEditorOverlay');
        if (scenarioOverlay) scenarioOverlay.style.display = 'none';

        const dash = document.getElementById('gameDashboard');
        if (dash) dash.style.display = 'grid';

        const heSelector = document.getElementById('heHarborSelector') as HTMLSelectElement | null;
        if (heSelector && gameState.harbor) heSelector.value = gameState.harbor.id;

        const nameInput = document.getElementById('harborNameInput') as HTMLInputElement | null;
        if (nameInput) {
            nameInput.value = gameState.harbor.name;
            nameInput.onchange = () => {
                if (gameState.harbor) gameState.harbor.name = nameInput.value;
            };
        }

        this.applyBodyMode('harbor-edit');
        editor.start(gameState);
    }

    startScenarioEdit(harborId?: string) {
        const modal = document.getElementById('introModal');
        if (modal) modal.style.display = 'none';
        const settings = document.getElementById('settingsPanel');
        if (settings) settings.style.display = 'none';

        if (gameState.gameMode === 'harbor-edit') {
            editor.stop();
        }
        const editorOverlay = document.getElementById('editorOverlay');
        if (editorOverlay) editorOverlay.style.display = 'none';

        const dash = document.getElementById('gameDashboard');
        if (dash) dash.style.display = 'grid';

        if (harborId) {
            const harbor = getHarborById(harborId) || this.customHarbors.find(h => h.id === harborId);
            if (harbor) gameState.harbor = JSON.parse(JSON.stringify(harbor));
        }

        gameState.gameMode = 'scenario-edit';
        this.applyBodyMode('scenario-edit');

        const scenarioOverlay = document.getElementById('scenarioEditorOverlay');
        if (scenarioOverlay) scenarioOverlay.style.display = 'flex';

        const seSelector = document.getElementById('seScenarioSelector') as HTMLSelectElement | null;
        if (seSelector) seSelector.value = gameState.scenario ? gameState.scenario.id : 'nieuw';

        const nameInput = document.getElementById('scenarioNameInput') as HTMLInputElement | null;
        if (nameInput) {
            nameInput.value = gameState.scenario ? gameState.scenario.name : '';
            nameInput.onchange = () => {
                if (gameState.scenario) gameState.scenario.name = nameInput.value;
            };
        }

        wireScenarioEditorUI();
    }

    // ── TUTORIAL ─────────────────────────────────────────────────────────────

    endTutorial() { tutorial.stop(); }
    nextTutorialStep() { tutorial.nextStep(gameState); }

    // ── GAME FLOW ────────────────────────────────────────────────────────────

    resetCurrentLevel() {
        if (gameState.gameMode === 'game') {
            if (gameState.scenario) this.startScenario(gameState.scenario.id);
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
        gameState.scenario = null;
        this.applyBodyMode('practice');

        const dash = document.getElementById('gameDashboard');
        if (dash) dash.style.display = 'grid';

        const modal = document.getElementById('introModal');
        if (modal) modal.style.display = 'none';

        const editorOverlay = document.getElementById('editorOverlay');
        if (editorOverlay) editorOverlay.style.display = 'none';
        const scenarioOverlay = document.getElementById('scenarioEditorOverlay');
        if (scenarioOverlay) scenarioOverlay.style.display = 'none';
    }

    startGameMode() {
        const dash = document.getElementById('gameDashboard');
        if (dash) dash.style.display = 'grid';

        const editorOverlay = document.getElementById('editorOverlay');
        if (editorOverlay) editorOverlay.style.display = 'none';
        const scenarioOverlay = document.getElementById('scenarioEditorOverlay');
        if (scenarioOverlay) scenarioOverlay.style.display = 'none';

        const modal = document.getElementById('introModal');
        if (modal) modal.style.display = 'flex';
    }

    startScenario(scenarioId: string) {
        const scenario = getScenarioById(scenarioId)
            ?? this.customScenarios.find(s => s.id === scenarioId);

        if (!scenario) { console.error(`Scenario '${scenarioId}' niet gevonden!`); return; }

        const harbor = getHarborById(scenario.harborId);
        if (!harbor) { console.error(`Haven '${scenario.harborId}' niet gevonden!`); return; }

        gameState.harbor = JSON.parse(JSON.stringify(harbor));
        gameState.scenario = JSON.parse(JSON.stringify(scenario));
        gameState.score = 100;
        gameState.coins = [];

        if (scenario.physics) this.applyScenarioPhysics(scenario.physics);

        gameState.resetBoat();
        this.updateUI();
        this.updateWindDisplay();

        gameState.gameMode = 'game';
        this.applyBodyMode('game');
        scenarioRunner.start(gameState);

        const modal = document.getElementById('introModal');
        if (modal) modal.style.display = 'none';

        const sel = document.getElementById('scenarioSelector') as HTMLSelectElement | null;
        if (sel) sel.value = scenarioId;

        console.log(`Scenario '${scenario.name}' gestart op haven '${harbor.name}'`);
    }

    startLevel(level: number) {
        const scenarioId = `s${level}`;
        if (getScenarioById(scenarioId)) {
            this.startScenario(scenarioId);
        } else {
            const index = (level - 1) % DEFAULT_HARBORS.length;
            gameState.harbor = JSON.parse(JSON.stringify(DEFAULT_HARBORS[index]));
            gameState.scenario = null;
            gameState.currentLevel = level;
            gameState.resetBoat();
            this.updateUI();
            this.updateWindDisplay();
            gameState.gameMode = 'game';
            this.applyBodyMode('game');
        }
    }

    applyScenarioPhysics(p: NonNullable<ScenarioData['physics']>) {
        if (p.mass !== undefined) (Constants as any).MASS = p.mass;
        if (p.dragCoeff !== undefined) (Constants as any).DRAG_COEFF = p.dragCoeff;
        if (p.lateralDragCoeff !== undefined) (Constants as any).LATERAL_DRAG_COEFF = p.lateralDragCoeff;
        if (p.thrustGain !== undefined) (Constants as any).THRUST_GAIN = p.thrustGain;
        if (p.rudderWashGain !== undefined) (Constants as any).RUDDER_WASH_GAIN = p.rudderWashGain;
        if (p.rudderHydroGain !== undefined) (Constants as any).RUDDER_HYDRO_GAIN = p.rudderHydroGain;
        if (p.lineStrength !== undefined) (Constants as any).LINE_STRENGTH = p.lineStrength;
        if (p.propDirection !== undefined) gameState.boat.propDirection = p.propDirection;
    }

    // ── UI HELPERS ───────────────────────────────────────────────────────────

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
    }

    applyBodyMode(mode: 'game' | 'practice' | 'harbor-edit' | 'scenario-edit') {
        document.body.classList.remove(
            'mode-game', 'mode-practice', 'mode-edit',
            'mode-harbor-edit', 'mode-scenario-edit',
            'game-mode-active', 'editor-mode'
        );
        const cssMode = mode === 'harbor-edit' ? 'harbor-edit'
            : mode === 'scenario-edit' ? 'scenario-edit'
                : mode;
        document.body.classList.add(`mode-${cssMode}`);

        const btnGame = document.getElementById('btnModeGame');
        const btnPractice = document.getElementById('btnModePractice');
        const btnEdit = document.getElementById('btnModeEdit');
        const btnScenarioEdit = document.getElementById('btnModeScenarioEdit');

        if (btnGame) btnGame.classList.toggle('active', mode === 'game');
        if (btnPractice) btnPractice.classList.toggle('active', mode === 'practice');
        if (btnEdit) btnEdit.classList.toggle('active', mode === 'harbor-edit');
        if (btnScenarioEdit) btnScenarioEdit.classList.toggle('active', mode === 'scenario-edit');
    }

    setupModeButtons() {
        const btnGame = document.getElementById('btnModeGame');
        const btnPractice = document.getElementById('btnModePractice');
        const btnEdit = document.getElementById('btnModeEdit');
        const btnScenarioEdit = document.getElementById('btnModeScenarioEdit');

        if (btnGame) btnGame.onclick = () => this.startGameMode();
        if (btnPractice) btnPractice.onclick = () => this.startPracticeMode();
        if (btnEdit) btnEdit.onclick = () => this.startHarborEdit();
        if (btnScenarioEdit) btnScenarioEdit.onclick = () => this.startScenarioEdit();
    }

    setMode(mode: 'game' | 'practice') {
        gameState.gameMode = mode;
        this.applyBodyMode(mode);
        const dash = document.getElementById('gameDashboard');
        if (dash) dash.style.display = 'grid';
        this.updateUI();
    }

    // ── GLOBAL BINDINGS ──────────────────────────────────────────────────────

    setupGlobalbindings() {
        // Wire the scenario editor controller exit callback
        initScenarioEditor({
            onExit: () => this.startPracticeMode(),
            updateWindDisplay: () => this.updateWindDisplay()
        });

        (window as any).startGame = () => this.startGame();
        (window as any).startTutorial = () => this.startTutorial();
        (window as any).startHarborEdit = () => this.startHarborEdit();
        (window as any).startScenarioEdit = (hid?: string) => this.startScenarioEdit(hid);
        (window as any).endTutorial = () => this.endTutorial();
        (window as any).nextTutorialStep = () => this.nextTutorialStep();
        (window as any).resetCurrentLevel = () => this.resetCurrentLevel();
        (window as any).togglePropDirection = () => this.togglePropDirection();
        (window as any).startPracticeMode = () => this.startPracticeMode();
        (window as any).startGameMode = () => this.startGameMode();
        (window as any).startScenario = (id: string) => this.startScenario(id);
        (window as any).updateUI = () => this.updateUI();
        (window as any).refreshHarbors = () => this.populateHarborSelector();
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
                (Constants as any).MASS = parseFloat((e.target as HTMLInputElement).value);
                this.updateUI();
            });
        }

        const dragSlider = document.getElementById('dragSlider');
        if (dragSlider) {
            dragSlider.addEventListener('input', (e) => {
                (Constants as any).DRAG_COEFF = parseFloat((e.target as HTMLInputElement).value);
                this.updateUI();
            });
        }

        const settingsBtn = document.getElementById('settingsToggle');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                const panel = document.getElementById('settingsPanel');
                if (panel) panel.style.display = (panel.style.display === 'flex') ? 'none' : 'flex';
            });
        }

        const showForcesCheck = document.getElementById('showForcesCheck') as HTMLInputElement | null;
        if (showForcesCheck) {
            showForcesCheck.checked = gameState.showForces;
            showForcesCheck.addEventListener('change', () => {
                gameState.showForces = showForcesCheck.checked;
            });
        }

        // ── HAVEN SELECTOR (oefenmodus) ─────────────────────────────────────
        const harborSelector = document.getElementById('harborSelector') as HTMLSelectElement | null;
        const fileInput = document.getElementById('hbrFileInput') as HTMLInputElement | null;

        if (harborSelector) {
            harborSelector.addEventListener('change', () => {
                const val = harborSelector.value;
                if (val === 'create') {
                    this.startHarborEdit(); harborSelector.value = '';
                } else if (val === 'import') {
                    if (fileInput) fileInput.click();
                    harborSelector.value = gameState.harbor.id ?? '';
                } else {
                    const harbor = getHarborById(val) || this.customHarbors.find(h => h.id === val);
                    if (harbor) {
                        gameState.harbor = JSON.parse(JSON.stringify(harbor));
                        gameState.scenario = null;
                        gameState.resetBoat();
                        this.updateWindDisplay();
                    }
                }
            });
        }

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const files = (e.target as HTMLInputElement).files;
                if (files && files.length > 0) {
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        try {
                            const data = JSON.parse(evt.target?.result as string);
                            editor.loadHarbor(data);
                            if (gameState.gameMode !== 'harbor-edit') this.startHarborEdit();
                        } catch (err) {
                            console.error('Failed to parse harbor file', err);
                            alert('Ongeldig haven bestand! (JSON Error)');
                        }
                    };
                    reader.readAsText(files[0]);
                }
            });
        }

        // ── SCENARIO SELECTOR (gamemodus) ───────────────────────────────────
        const scenarioSelector = document.getElementById('scenarioSelector') as HTMLSelectElement | null;
        if (scenarioSelector) {
            scenarioSelector.addEventListener('change', () => {
                const val = scenarioSelector.value;
                if (val) this.startScenario(val);
            });
        }

        // ── HAVEN-EDITOR INTERN SELECTOR ────────────────────────────────────
        const heSelector = document.getElementById('heHarborSelector') as HTMLSelectElement | null;
        if (heSelector) {
            heSelector.addEventListener('change', () => {
                if (heSelector.value === 'nieuw') {
                    gameState.harbor = {
                        id: `h_new_${Date.now()}`, name: 'Nieuwe Haven', version: '1.0',
                        jetties: [], piles: [], boatStart: { x: 200, y: 500, heading: 0 }
                    };
                } else {
                    const harbor = getHarborById(heSelector.value) || this.customHarbors.find(h => h.id === heSelector.value);
                    if (harbor) gameState.harbor = JSON.parse(JSON.stringify(harbor));
                }
                const nameInput = document.getElementById('harborNameInput') as HTMLInputElement | null;
                if (nameInput) nameInput.value = gameState.harbor.name;
                editor.start(gameState);
            });
        }

        const heDeleteHarborBtn = document.getElementById('heDeleteHarborBtn');
        if (heDeleteHarborBtn) {
            heDeleteHarborBtn.addEventListener('click', async () => {
                if (!heSelector || heSelector.value === 'nieuw') return;
                const isCloud = this.customHarbors.some(h => h.id === heSelector.value);
                if (!isCloud) { alert('Je kunt deze standaard haven niet verwijderen.'); return; }

                if (confirm('Weet je zeker dat je deze haven definitief wilt verwijderen?')) {
                    try {
                        const numericId = parseInt(heSelector.value.replace('custom_', ''), 10);
                        if (!isNaN(numericId)) {
                            await ApiClient.deleteHarbor(numericId);
                        } else {
                            await ApiClient.deleteHarbor(heSelector.value as any);
                        }
                        alert('Haven verwijderd.');
                        await (window as any).refreshHarbors?.();
                        if (heSelector) { heSelector.value = 'nieuw'; heSelector.dispatchEvent(new Event('change')); }
                    } catch (e: any) {
                        alert('Fout bij verwijderen: ' + (e.message || e));
                    }
                }
            });
        }

        // ── SCENARIO-EDITOR INTERN SELECTOR ────────────────────────────────
        const seSelector = document.getElementById('seScenarioSelector') as HTMLSelectElement | null;
        if (seSelector) {
            seSelector.addEventListener('change', () => {
                if (seSelector.value === 'nieuw') {
                    gameState.scenario = null;
                } else {
                    this.startScenario(seSelector.value);
                }
                this.startScenarioEdit(gameState.harbor.id);
            });
        }

        // ── WIND SLIDERS (oefenmodus) ───────────────────────────────────────
        const windSpeedSlider = document.getElementById('windSpeedSlider') as HTMLInputElement | null;
        const windDirSlider = document.getElementById('windDirSlider') as HTMLInputElement | null;

        if (windSpeedSlider) {
            windSpeedSlider.value = gameState.activeWind.force.toString();
            windSpeedSlider.addEventListener('input', () => {
                if (!gameState.harbor.wind) gameState.harbor.wind = { direction: 0, force: 0 };
                gameState.harbor.wind.force = parseFloat(windSpeedSlider.value);
                const label = document.getElementById('windSpeedLabel');
                if (label) label.textContent = windSpeedSlider.value;
                this.updateWindDisplay();
            });
        }

        if (windDirSlider) {
            windDirSlider.value = gameState.activeWind.direction.toString();
            windDirSlider.addEventListener('input', () => {
                if (!gameState.harbor.wind) gameState.harbor.wind = { direction: 0, force: 0 };
                gameState.harbor.wind.direction = parseFloat(windDirSlider.value);
                const label = document.getElementById('windDirLabel');
                if (label) label.textContent = windDirSlider.value;
                this.updateWindDisplay();
            });
        }

        this.populateHarborSelector();
        this.updateUI();
        this.updateWindDisplay();
        this.applyBodyMode('practice');
    }

    // ── HARBOR/SCENARIO SELECTORS ─────────────────────────────────────────────

    async populateHarborSelector() {
        const defaultGroup = document.getElementById('defaultHarborGroup');
        const customGroup = document.getElementById('customHarborGroup');
        const heDefaultGroup = document.getElementById('heDefaultHarborGroup');
        const heCustomGroup = document.getElementById('heCustomHarborGroup');

        const stdHtml = DEFAULT_HARBORS.map(h => `<option value="${h.id}">${h.name}</option>`).join('');
        if (defaultGroup) defaultGroup.innerHTML = stdHtml;
        if (heDefaultGroup) heDefaultGroup.innerHTML = stdHtml;

        if (ApiClient.isLoggedIn) {
            try {
                const cloudHarbors = await ApiClient.getMyHarbors();
                this.customHarbors = cloudHarbors.map((h: any) => h.json_data).filter(Boolean);
            } catch (e) {
                console.error('Kon cloud havens niet laden:', e);
                this.customHarbors = [];
            }
        } else {
            this.customHarbors = [];
        }

        const customHtml = this.customHarbors.map(h => `<option value="${h.id}">${h.name}</option>`).join('');
        if (customGroup) customGroup.innerHTML = customHtml;
        if (heCustomGroup) heCustomGroup.innerHTML = customHtml;

        const heSelector = document.getElementById('heHarborSelector') as HTMLSelectElement;
        if (heSelector && gameState.harbor && gameState.gameMode === 'harbor-edit') {
            heSelector.value = gameState.harbor.id;
        }

        this.populateScenarioSelector();
    }

    populateScenarioSelector(filterHarborId?: string) {
        const scenarioGroup = document.getElementById('scenarioDefaultGroup');
        const seSelector = document.getElementById('seScenarioSelector') as HTMLSelectElement;

        const scenarios = filterHarborId
            ? DEFAULT_SCENARIOS.filter(s => s.harborId === filterHarborId)
            : DEFAULT_SCENARIOS;

        const html = scenarios.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        if (scenarioGroup) scenarioGroup.innerHTML = html;
        if (seSelector) seSelector.innerHTML = '<option value="nieuw">➕ Nieuw Scenario</option>' + html;
    }

    // ── WIND DISPLAY ─────────────────────────────────────────────────────────

    updateWindDisplay() {
        const wind = gameState.activeWind;
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
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = 'bold 8px system-ui';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('N', cx, cy - r + 6); ctx.fillText('Z', cx, cy + r - 6);
        ctx.fillText('O', cx + r - 6, cy); ctx.fillText('W', cx - r + 6, cy);

        if (wind.force > 0) {
            const len = 8 + Math.min(10, wind.force * 0.4);
            const rad = (wind.direction + 180 - 90) * Math.PI / 180;
            ctx.save();
            ctx.translate(cx, cy); ctx.rotate(rad);
            ctx.strokeStyle = '#3b82f6'; ctx.fillStyle = '#3b82f6'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(-len, 0); ctx.lineTo(len, 0); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(len, 0); ctx.lineTo(len - 5, -3); ctx.lineTo(len - 5, 3);
            ctx.closePath(); ctx.fill();
            ctx.restore();
        }
    }
}
