import { gameState } from './GameState';
import { Constants } from './Constants';
import { tutorial } from './Tutorial';
import { editor } from '../editor/HarborEditor';
import {
    DEFAULT_HARBORS, DEFAULT_SCENARIOS,
    EMPTY_HARBOR_TEMPLATE, officialHarbors,
    setOfficialHarbors, setOfficialScenarios,
    getHarborById, getScenarioById,
    ScenarioData, HarborData
} from '../data/harbors';
import { ApiClient } from './ApiClient';
import { scenarioRunner } from './ScenarioRunner';
import {
    initScenarioEditor,
    wireScenarioEditorUI
} from '../editor/ScenarioEditorController';
import { GameBuilderController } from '../editor/GameBuilderController';
import { GameRunner } from './GameRunner';

export class GameManager {
    private customScenarios: ScenarioData[] = [];
    private officialScenarios: ScenarioData[] = [];
    private customHarbors: HarborData[] = [];

    constructor() {
        this.setupModeButtons();
        this.fetchOfficialHarbors();
        this.fetchOfficialScenarios();
        this.fetchOfficialGames();
        this.fetchCloudScenarios();
        this.fetchCloudGames();
    }

    /** Laad officiële havens — publiek endpoint, ook zonder login */
    public async fetchOfficialHarbors() {
        try {
            const harbors = await ApiClient.getOfficialHarbors();
            const mapped: HarborData[] = harbors.map((h: any) => {
                if (h.json_data) {
                    const data = { ...h.json_data };
                    data.id = `official_${h.id}`;
                    (data as any).db_id = h.id;
                    (data as any).is_official = true;
                    return data;
                }
                return null;
            }).filter(Boolean);
            setOfficialHarbors(mapped);
            this.populateHarborSelector();
        } catch (e) {
            console.warn('Kon officiële havens niet laden:', e);
        }
    }

    public async fetchOfficialScenarios() {
        try {
            const scenarios = await ApiClient.getOfficialScenarios();
            this.officialScenarios = scenarios.map((s: any) => ({
                id: s.id.toString(),
                name: s.name,
                description: s.description,
                harborId: (s.harbor?.is_official) ? `official_${s.harbor_id}` : `custom_${s.harbor_id}`,
                is_official: true,
                wind: s.json_data?.wind || { direction: 0, force: 0 },
                mooringSpots: s.json_data?.mooringSpots || [],
                coins: s.json_data?.coins || [],
                boatStart: s.json_data?.boatStart,
                physics: s.json_data?.physics,
                coinSettings: s.json_data?.coinSettings,
                objectPenalties: s.json_data?.objectPenalties
            }));
            setOfficialScenarios(this.officialScenarios);
            this.populateScenarioSelector();
        } catch (e) {
            console.warn('Kon officiële scenario\'s niet laden:', e);
        }
    }
    public async fetchCloudScenarios() {
        if (!ApiClient.isLoggedIn) return;
        try {
            const scenarios = await ApiClient.getMyScenarios();
            const cloudOnly = scenarios.filter((s: any) => !s.is_official);
            this.customScenarios = cloudOnly.map((s: any) => ({
                id: s.id.toString(),
                name: s.name,
                description: s.description,
                harborId: (s.harbor?.is_official) ? `official_${s.harbor_id}` : `custom_${s.harbor_id}`,
                // API gives json_data back as object (assuming Laravel casts it to array/object)
                wind: s.json_data?.wind || { direction: 0, force: 0 },
                mooringSpots: s.json_data?.mooringSpots || [],
                coins: s.json_data?.coins || [],
                boatStart: s.json_data?.boatStart,
                physics: s.json_data?.physics,
                coinSettings: s.json_data?.coinSettings,
                objectPenalties: s.json_data?.objectPenalties
            }));
            this.populateScenarioSelector();
        } catch (e) {
            console.error('Fout bij ophalen scenarios uit cloud:', e);
        }
    }

    public async fetchOfficialGames() {
        try {
            const games = await ApiClient.getOfficialGames();
            const group = document.getElementById('officialGamesGroup');
            if (group) {
                group.innerHTML = games.map((g: any) => `<option value="g_${g.id}">⭐ ${g.name}</option>`).join('');
            }
        } catch (e) {
            console.error('Fout bij ophalen officiële games:', e);
        }
    }

    public async fetchCloudGames() {
        if (!ApiClient.isLoggedIn) return;
        try {
            const games = await ApiClient.getMyGames();
            const group = document.getElementById('customGamesGroup');
            if (group) {
                const cloudOnly = games.filter((g: any) => !g.is_official);
                group.innerHTML = cloudOnly.map((g: any) => `<option value="g_${g.id}">${g.name}</option>`).join('');
            }
        } catch (e) {
            console.error('Fout bij ophalen games uit cloud:', e);
        }
    }

    private loadHarborState(harbor: any) {
        const hData = JSON.parse(JSON.stringify(harbor));

        // Ensure all harbor objects have an ID for scenario referencing
        hData.jetties?.forEach((j: any, i: number) => { if (!j.id) j.id = `jetty_${i}`; });
        hData.piles?.forEach((p: any, i: number) => { if (!p.id) p.id = `pile_${i}`; });
        hData.shores?.forEach((s: any, i: number) => { if (!s.id) s.id = `shore_${i}`; });
        hData.npcs?.forEach((n: any, i: number) => { if (!n.id) n.id = `npc_${i}`; });

        gameState.harbor = {
            ...hData,
            jetties: hData.jetties || [],
            piles: hData.piles || [],
            shores: hData.shores || [],
            npcs: hData.npcs || []
        };
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
            if (harbor) this.loadHarborState(harbor);
        }

        gameState.gameMode = 'scenario-edit';
        this.applyBodyMode('scenario-edit');

        const scenarioOverlay = document.getElementById('scenarioEditorOverlay');
        if (scenarioOverlay) scenarioOverlay.style.display = 'flex';

        // Filter scenarios for the current harbor
        this.populateScenarioSelector();

        const seSelector = document.getElementById('seScenarioSelector') as HTMLSelectElement | null;
        if (seSelector) seSelector.value = gameState.scenario ? gameState.scenario.id : 'nieuw';

        const nameInput = document.getElementById('scenarioNameInput') as HTMLInputElement | null;
        if (nameInput) {
            nameInput.value = gameState.scenario ? gameState.scenario.name : '';
            nameInput.onchange = () => {
                if (gameState.scenario) gameState.scenario.name = nameInput.value;
            };
        }

        const descInput = document.getElementById('scenarioDescInput') as HTMLTextAreaElement | null;
        if (descInput) {
            descInput.value = (gameState.scenario?.description) || '';
            descInput.onchange = () => {
                if (gameState.scenario) gameState.scenario.description = descInput.value;
            };
        }

        wireScenarioEditorUI();
    }

    // ── TUTORIAL ─────────────────────────────────────────────────────────────

    endTutorial() { tutorial.stop(); }
    nextTutorialStep() { tutorial.nextStep(gameState); }

    // ── GAME EDITOR ──────────────────────────────────────────────────────────

    startGameEdit() {
        const modal = document.getElementById('introModal');
        if (modal) modal.style.display = 'none';

        const settings = document.getElementById('settingsPanel');
        if (settings) settings.style.display = 'none';

        if (gameState.gameMode === 'harbor-edit') {
            editor.stop();
        }

        const editorOverlay = document.getElementById('editorOverlay');
        if (editorOverlay) editorOverlay.style.display = 'none';

        const scenarioOverlay = document.getElementById('scenarioEditorOverlay');
        if (scenarioOverlay) scenarioOverlay.style.display = 'none';

        const dash = document.getElementById('gameDashboard');
        if (dash) dash.style.display = 'grid';

        gameState.gameMode = 'game-edit';
        this.applyBodyMode('game-edit');

        GameBuilderController.onExit = () => this.startPracticeMode();
        GameBuilderController.show('new');
    }

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
        if (modal) modal.style.display = 'none'; // Verberg introModal (nieuw gedrag)

        gameState.gameMode = 'game';
        this.applyBodyMode('game');
    }

    startScenario(scenarioIdOrObj: string | any, maintainScore: boolean = false) {
        let scenario: any;
        if (typeof scenarioIdOrObj === 'string') {
            scenario = getScenarioById(scenarioIdOrObj) 
                    ?? this.officialScenarios.find(s => s.id === scenarioIdOrObj)
                    ?? this.customScenarios.find(s => s.id === scenarioIdOrObj);
        } else {
            scenario = scenarioIdOrObj;
        }

        if (!scenario) { console.error(`Scenario niet gevonden!`); return; }

        const harbor = getHarborById(scenario.harborId) || this.customHarbors.find(h => h.id === scenario.harborId);
        if (!harbor) { console.error(`Haven '${scenario.harborId}' niet gevonden!`); return; }

        this.loadHarborState(harbor);
        gameState.scenario = JSON.parse(JSON.stringify(scenario));
        
        if (!maintainScore) {
            gameState.score = 100;
        }
        
        gameState.coins = [];

        if (scenario.physics) this.applyScenarioPhysics(scenario.physics);

        gameState.resetBoat();
        this.updateUI();
        this.updateWindDisplay();

        gameState.gameMode = 'game';
        this.applyBodyMode('game');

        scenarioRunner.onComplete = () => {
            const status = document.getElementById('status');
            const box = document.getElementById('status-message-box');
            if (status && box) {
                status.textContent = `Scenario voltooid! Score: ${Math.floor(gameState.score)}`;
                status.style.color = '#4ade80';
                box.style.display = 'block';
                setTimeout(() => box.style.display = 'none', 4000);
            }
        };

        scenarioRunner.onFail = () => {
            const status = document.getElementById('status');
            const box = document.getElementById('status-message-box');
            if (status && box) {
                status.textContent = 'Scenario mislukt (tijd/score). Probeer opnieuw!';
                status.style.color = '#ef4444';
                box.style.display = 'block';
                setTimeout(() => {
                    box.style.display = 'none';
                    this.resetCurrentLevel();
                }, 3000);
            }
        };

        scenarioRunner.start(gameState);

        const modal = document.getElementById('introModal');
        if (modal) modal.style.display = 'none';

        const sel = document.getElementById('scenarioSelector') as HTMLSelectElement | null;
        if (sel) sel.value = scenario.id;

        console.log(`Scenario '${scenario.name}' gestart op haven '${harbor.name}'`);
    }

    startLevel(level: number) {
        const scenarioId = `s${level}`;
        if (getScenarioById(scenarioId)) {
            this.startScenario(scenarioId);
        } else {
            const index = (level - 1) % DEFAULT_HARBORS.length;
            this.loadHarborState(DEFAULT_HARBORS[index]);
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

    applyBodyMode(mode: 'game' | 'practice' | 'harbor-edit' | 'scenario-edit' | 'game-edit') {
        document.body.classList.remove(
            'mode-game', 'mode-practice', 'mode-edit',
            'mode-harbor-edit', 'mode-scenario-edit', 'mode-game-edit',
            'game-mode-active', 'editor-mode'
        );
        const cssMode = mode === 'harbor-edit' ? 'harbor-edit'
            : mode === 'scenario-edit' ? 'scenario-edit'
                : mode === 'game-edit' ? 'game-edit'
                    : mode;
        document.body.classList.add(`mode-${cssMode}`);

        const btnGame = document.getElementById('btnModeGame');
        const btnPractice = document.getElementById('btnModePractice');
        const btnEdit = document.getElementById('btnModeEdit');
        const btnScenarioEdit = document.getElementById('btnModeScenarioEdit');
        const btnGameEdit = document.getElementById('btnModeGameEdit');

        if (btnGame) btnGame.classList.toggle('active', mode === 'game');
        if (btnPractice) btnPractice.classList.toggle('active', mode === 'practice');
        if (btnEdit) btnEdit.classList.toggle('active', mode === 'harbor-edit');
        if (btnScenarioEdit) btnScenarioEdit.classList.toggle('active', mode === 'scenario-edit');
        if (btnGameEdit) btnGameEdit.classList.toggle('active', mode === 'game-edit');
    }

    setupModeButtons() {
        const btnGame = document.getElementById('btnModeGame');
        const btnPractice = document.getElementById('btnModePractice');
        const btnEdit = document.getElementById('btnModeEdit');
        const btnScenarioEdit = document.getElementById('btnModeScenarioEdit');
        const btnGameEdit = document.getElementById('btnModeGameEdit');

        if (btnGame) btnGame.onclick = () => this.startGameMode();
        if (btnPractice) btnPractice.onclick = () => this.startPracticeMode();
        if (btnEdit) btnEdit.onclick = () => this.startHarborEdit();
        if (btnScenarioEdit) btnScenarioEdit.onclick = () => this.startScenarioEdit();
        if (btnGameEdit) btnGameEdit.onclick = () => this.startGameEdit();
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
            onSave: (scenario) => this.saveScenario(scenario)
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
        (window as any).refreshHarbors = () => this.fetchOfficialHarbors();
        (window as any).refreshScenarios = async () => {
            await this.fetchOfficialScenarios();
            await this.fetchCloudScenarios();
        };
        (window as any).refreshGames = async () => {
            await this.fetchOfficialGames();
            await this.fetchCloudGames();
        }
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

        if (harborSelector) {
            harborSelector.addEventListener('change', () => {
                const val = harborSelector.value;
                if (val === 'create') {
                    this.startHarborEdit(); harborSelector.value = '';
                } else {
                    const harbor = getHarborById(val) || this.customHarbors.find(h => h.id === val);
                    if (harbor) {
                        this.loadHarborState(harbor);
                        gameState.scenario = null;
                        gameState.resetBoat();
                        this.updateWindDisplay();
                    }
                }
            });
        }

        // ── GAME SELECTOR (gamemodus) ───────────────────────────────────
        const gameSelector = document.getElementById('gameSelector') as HTMLSelectElement | null;
        if (gameSelector) {
            gameSelector.addEventListener('change', () => {
                const val = gameSelector.value;
                if (!val) return;

                if (val === 'tutorial') {
                    this.startTutorial();
                } else if (val === 'startgame') {
                    this.startGame();
                } else if (val === 'create') {
                    gameSelector.value = '';
                    this.startGameEdit();
                } else if (val.startsWith('g_')) {
                    const gameId = val.replace('g_', '');
                    gameSelector.value = '';
                    GameRunner.start(gameId, this);
                } else {
                    alert("Onbekende selectie: " + val);
                }
            });
        }

        // ── HAVEN-EDITOR INTERN SELECTOR ────────────────────────────────────
        const heSelector = document.getElementById('heHarborSelector') as HTMLSelectElement | null;
        if (heSelector) {
            heSelector.addEventListener('change', () => {
                if (heSelector.value === 'nieuw') {
                    gameState.harbor = JSON.parse(JSON.stringify(EMPTY_HARBOR_TEMPLATE));
                    gameState.harbor.id = `h_new_${Date.now()}`;
                } else {
                    const harbor = getHarborById(heSelector.value) || this.customHarbors.find(h => h.id === heSelector.value);
                    if (harbor) this.loadHarborState(harbor);
                }
                const nameInput = document.getElementById('harborNameInput') as HTMLInputElement | null;
                if (nameInput) nameInput.value = gameState.harbor.name;
                editor.start(gameState);
            });
        }

        const heDeleteHarborBtn = document.getElementById('heDeleteHarborBtn');
        if (heDeleteHarborBtn) {
            heDeleteHarborBtn.addEventListener('click', async () => {
                if (!heSelector) return;
                const selectedId = heSelector.value;
                if (!selectedId || selectedId === 'nieuw') return;

                const cloudHarbor = this.customHarbors.find(h => h.id === selectedId) as any;
                if (!cloudHarbor || !cloudHarbor.db_id) {
                    alert('Je kunt deze standaard haven niet verwijderen.');
                    return;
                }

                if (confirm('Weet je zeker dat je deze haven definitief wilt verwijderen?')) {
                    try {
                        const numericId = cloudHarbor.db_id;
                        await ApiClient.deleteHarbor(numericId);
                        alert('Haven verwijderd.');
                        await (window as any).refreshHarbors?.();
                        if (heSelector) { heSelector.value = 'nieuw'; heSelector.dispatchEvent(new Event('change')); }
                    } catch (e: any) {
                        alert('Fout bij verwijderen: ' + (e.message || e));
                    }
                }
            });
        }

        // ── SCENARIO-EDITOR INTERN SELECTORs ────────────────────────────────
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
        const seHarborSelector = document.getElementById('seHarborSelector') as HTMLSelectElement | null;
        if (seHarborSelector) {
            seHarborSelector.addEventListener('change', () => {
                const harbor = getHarborById(seHarborSelector.value) || this.customHarbors.find(h => h.id === seHarborSelector.value);
                if (harbor) {
                    this.loadHarborState(harbor);
                    gameState.scenario = null; // Reset scenario mapping when checking out a new harbor
                    this.startScenarioEdit(harbor.id);
                }
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

    private getHarborName(harborId: string): string {
        const oh = officialHarbors.find(h => h.id === harborId);
        if (oh) return oh.name;
        const ch = this.customHarbors.find(h => h.id === harborId);
        if (ch) return ch.name;
        return 'Onbekende Haven';
    }

    async populateHarborSelector() {
        const defaultGroup = document.getElementById('defaultHarborGroup');
        const customGroup = document.getElementById('customHarborGroup');
        const heDefaultGroup = document.getElementById('heDefaultHarborGroup');
        const heCustomGroup = document.getElementById('heCustomHarborGroup');


        // Officiële havens uit cloud (beschikbaar voor iedereen)
        const officialHtml = officialHarbors.map(h => `<option value="${h.id}">⭐ ${h.name}</option>`).join('');
        if (defaultGroup) defaultGroup.innerHTML = officialHtml;
        if (heDefaultGroup) heDefaultGroup.innerHTML = officialHtml;

        let cloudHarborsList: any[] = [];
        if (ApiClient.isLoggedIn) {
            try {
                const cloudHarbors = await ApiClient.getMyHarbors();
                cloudHarborsList = cloudHarbors
                    .filter((h: any) => !h.is_official) // Officiële havens staan al in de 'Standaard' groep
                    .map((h: any) => {
                        if (h.json_data) {
                            (h.json_data as any).db_id = h.id;
                            h.json_data.id = `custom_${h.id}`;
                            return h.json_data;
                        }
                        return null;
                    }).filter(Boolean);
            } catch (e) {
                console.error('Kon cloud havens niet laden:', e);
            }
        }

        this.customHarbors = cloudHarborsList;

        const customHtml = this.customHarbors.map(h => `<option value="${h.id}">${h.name}</option>`).join('');
        if (customGroup) customGroup.innerHTML = customHtml;
        if (heCustomGroup) heCustomGroup.innerHTML = customHtml;

        const heSelector = document.getElementById('heHarborSelector') as HTMLSelectElement;
        if (heSelector && gameState.harbor && gameState.gameMode === 'harbor-edit') {
            heSelector.value = gameState.harbor.id;
        }

        // Vul ook de Haven-kolom in de Scenario Editor
        const seHarborSel = document.getElementById('seHarborSelector') as HTMLSelectElement | null;
        if (seHarborSel) {
            seHarborSel.innerHTML = `
                <optgroup label="⭐ Standaard">${officialHtml}</optgroup>
                <optgroup label="Mijn Havens">${customHtml}</optgroup>
            `;
            if (gameState.harbor?.id) seHarborSel.value = gameState.harbor.id;
        }

        this.populateScenarioSelector();
    }

    populateScenarioSelector() {
        const scenarioGroup = document.getElementById('scenarioDefaultGroup');
        const customGroup = document.getElementById('scenarioCustomGroup');
        const seSelector = document.getElementById('seScenarioSelector') as HTMLSelectElement;

        const combinedBaseScenarios = [...DEFAULT_SCENARIOS, ...this.officialScenarios];
        const offIds = new Set(combinedBaseScenarios.map(s => s.id));
        const customScenarios = this.customScenarios.filter(s => !offIds.has(s.id));

        const sortScenarios = (a: ScenarioData, b: ScenarioData) => {
            const ha = this.getHarborName(a.harborId);
            const hb = this.getHarborName(b.harborId);
            if (ha !== hb) return ha.localeCompare(hb);
            return a.name.localeCompare(b.name);
        };

        combinedBaseScenarios.sort(sortScenarios);
        customScenarios.sort(sortScenarios);

        // Vind de maximale scenario-naamslengte voor uitlijning
        const allScenarios = [...combinedBaseScenarios, ...customScenarios];
        const maxLen = allScenarios.reduce((m, s) => Math.max(m, s.name.length), 0);

        // Standaard scenario's krijgen ⭐, eigen scenario's niet
        const makeBaseHtml = (s: ScenarioData) => {
            const pad = '\u00a0'.repeat(Math.max(0, maxLen - s.name.length + 1));
            const harbor = this.getHarborName(s.harborId);
            return `<option value="${s.id}" data-harbor="${s.harborId}">\u2b50 ${s.name}${pad}│ ${harbor}</option>`;
        };
        const makeCustomHtml = (s: ScenarioData) => {
            const pad = '\u00a0'.repeat(Math.max(0, maxLen - s.name.length + 3));
            const harbor = this.getHarborName(s.harborId);
            return `<option value="${s.id}" data-harbor="${s.harborId}">${s.name}${pad}│ ${harbor}</option>`;
        };

        const html = combinedBaseScenarios.map(makeBaseHtml).join('');
        if (scenarioGroup) scenarioGroup.innerHTML = html;

        const customHtml = customScenarios.map(makeCustomHtml).join('');
        if (customGroup) customGroup.innerHTML = customHtml;

        if (seSelector) {
            seSelector.innerHTML = `
                <option value="nieuw">➕ Nieuw Scenario</option>
                <optgroup label="Standaard">${html}</optgroup>
                <optgroup label="Mijn Scenario's">${customHtml}</optgroup>
            `;

            // Sync haven-kolom als scenario verandert
            seSelector.onchange = () => this.syncSeHarborFromScenario();
        }
    }

    private syncSeHarborFromScenario() {
        const seScenSel = document.getElementById('seScenarioSelector') as HTMLSelectElement | null;
        const seHarbSel = document.getElementById('seHarborSelector') as HTMLSelectElement | null;
        const seHeaderHarborName = document.getElementById('seHeaderHarborName');
        if (!seScenSel || !seHarbSel) return;

        const selectedOpt = seScenSel.options[seScenSel.selectedIndex];
        const harborId = selectedOpt?.dataset?.harbor;
        if (harborId) {
            seHarbSel.value = harborId;
            const harborName = this.getHarborName(harborId);
            if (seHeaderHarborName) seHeaderHarborName.textContent = `[Haven: ${harborName}]`;
        } else {
            if (seHeaderHarborName) seHeaderHarborName.textContent = '';
        }
    }

    async saveScenario(scenario: ScenarioData) {
        if (!ApiClient.isLoggedIn) {
            alert("Je moet ingelogd zijn om scenario's te kunnen opslaan.");
            return;
        }

        // Copy current global settings into the scenario right before saving
        scenario.wind = { ...gameState.activeWind };
        scenario.physics = {
            thrustGain: Constants.THRUST_GAIN,
            rudderWashGain: Constants.RUDDER_WASH_GAIN,
            rudderHydroGain: Constants.RUDDER_HYDRO_GAIN,
            mass: Constants.MASS,
            dragCoeff: Constants.DRAG_COEFF,
            lateralDragCoeff: Constants.LATERAL_DRAG_COEFF,
            lineStrength: Constants.LINE_STRENGTH
        };

        try {
            const dbHarborId = parseInt(scenario.harborId.replace('custom_', '').replace('official_', ''), 10);

            const payload = {
                harbor_id: dbHarborId,
                name: scenario.name,
                description: scenario.description,
                points: 100,
                time_limit: scenario.coinSettings?.timeLimit || 120,
                json_data: {
                    wind: scenario.wind,
                    mooringSpots: scenario.mooringSpots,
                    coins: scenario.coins,
                    boatStart: scenario.boatStart,
                    physics: scenario.physics,
                    coinSettings: scenario.coinSettings,
                    objectPenalties: scenario.objectPenalties
                }
            };

            let returnedId = scenario.id;
            if (scenario.id.startsWith('new_')) {
                const res = await ApiClient.saveScenario(payload);
                returnedId = res.scenario.id.toString();
                scenario.id = returnedId;
                this.customScenarios.push(scenario);
            } else {
                await ApiClient.updateScenario(Number(scenario.id), payload);
                const idx = this.customScenarios.findIndex(s => s.id === scenario.id);
                if (idx !== -1) this.customScenarios[idx] = scenario;
            }
            // Re-populate the selector, filtering by the current harbor
            this.populateScenarioSelector();

            // Explicitly set the newly updated/created scenario as selected
            const seSelector = document.getElementById('seScenarioSelector') as HTMLSelectElement;
            if (seSelector) seSelector.value = scenario.id;
        } catch (e) {
            console.error("Fout bij opslaan scenario in cloud:", e);
            alert("Er is iets misgegaan bij het opslaan.");
        }
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
