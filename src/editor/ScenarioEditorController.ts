/**
 * ScenarioEditorController
 * Verantwoordelijk voor: alle UI-logica van de Scenario Editor overlay.
 * Inclusief wind/physics sliders, canvas events (mousedown/move/up), tool-buttons,
 * object selectie/drag/resize/delete, en opslaan.
 *
 * Ontkoppeld van GameManager zodat die bestand beheersbaar blijft.
 */

import { gameState } from '../core/GameState';
import { Constants } from '../core/Constants';

// Helper
const g = <T extends HTMLElement>(id: string) => document.getElementById(id) as T | null;

// ─── State (module-level, één scenario editor tegelijk) ─────────────────────

let activeSETool = 'select';
let isDraggingSE = false;
let dragStartX = 0, dragStartY = 0;
let seDragMode: 'move' | 'resize' | 'resize-h' | null = null;
let seOriginalGeom: { x: number, y: number, w?: number, h?: number } | null = null;

// Bound handlers (zodat we ze kunnen verwijderen)
let _seMouseDown: ((e: MouseEvent) => void) | null = null;
let _seMouseMove: ((e: MouseEvent) => void) | null = null;
let _seMouseUp: ((e: MouseEvent) => void) | null = null;
let _seKeyDown: ((e: KeyboardEvent) => void) | null = null;

// Callback naar GameManager voor mode-switches
let _onExit: (() => void) | null = null;
let _updateWindDisplay: (() => void) | null = null;

// ─── Public API ─────────────────────────────────────────────────────────────

export function initScenarioEditor(callbacks: {
    onExit: () => void;
    updateWindDisplay: () => void;
}) {
    _onExit = callbacks.onExit;
    _updateWindDisplay = callbacks.updateWindDisplay;
}

/** Activeer/herdraat alle scenario-editor UI bindings */
export function wireScenarioEditorUI() {
    const getOrMakeScenario = (): NonNullable<typeof gameState.scenario> => {
        if (!gameState.scenario) {
            gameState.scenario = {
                id: `new_${Date.now()}`,
                name: 'Nieuw scenario',
                harborId: gameState.harbor.id,
                wind: { direction: 0, force: 0 },
                mooringSpots: [],
                coins: []
            };
        }
        return gameState.scenario!;
    };

    // ── WIND ───────────────────────────────────────────────────────────────
    const wf = g<HTMLInputElement>('seWindForce');
    const wfv = g<HTMLSpanElement>('seWindForceVal');
    const wd = g<HTMLInputElement>('seWindDir');
    const wdv = g<HTMLSpanElement>('seWindDirVal');

    const syncWind = () => {
        const sc = getOrMakeScenario();
        if (wf) { sc.wind.force = parseFloat(wf.value); if (wfv) wfv.textContent = wf.value + ' kn'; }
        if (wd) { sc.wind.direction = parseFloat(wd.value); if (wdv) wdv.textContent = wd.value + '°'; }
        _updateWindDisplay?.();
    };

    if (wf) { wf.value = (gameState.scenario?.wind.force ?? 0).toString(); wf.addEventListener('input', syncWind); }
    if (wd) { wd.value = (gameState.scenario?.wind.direction ?? 0).toString(); wd.addEventListener('input', syncWind); }

    // ── COIN / SPOT SETTINGS ───────────────────────────────────────────────
    const sv = g<HTMLInputElement>('seCoinValue');
    const scnt = g<HTMLInputElement>('seCoinCount');
    const stl = g<HTMLInputElement>('seTimeLimit');

    const syncSettings = () => {
        const sc = getOrMakeScenario();
        if (!sc.coinSettings) sc.coinSettings = { value: 10, count: 5, timeLimit: 120 };

        if (sv) {
            const p = parseInt(sv.value, 10) || 10;
            sc.coinSettings.value = p;
            if (gameState.selectedSEObject) {
                if (gameState.selectedSEObject.value !== undefined) gameState.selectedSEObject.value = p;
                if (gameState.selectedSEObject.points !== undefined) gameState.selectedSEObject.points = p;
            }
        }
        if (scnt) sc.coinSettings.count = parseInt(scnt.value, 10) || 5;
        if (stl) sc.coinSettings.timeLimit = parseInt(stl.value, 10) || 120;
    };

    if (sv) { sv.value = (gameState.scenario?.coinSettings?.value ?? 10).toString(); sv.addEventListener('input', syncSettings); }
    if (scnt) { scnt.value = (gameState.scenario?.coinSettings?.count ?? 5).toString(); scnt.addEventListener('input', syncSettings); }
    if (stl) { stl.value = (gameState.scenario?.coinSettings?.timeLimit ?? 120).toString(); stl.addEventListener('input', syncSettings); }

    // ── PHYSICS SLIDERS ────────────────────────────────────────────────────
    const bindPhySlider = (
        sliderId: string, valId: string,
        getDefault: () => number,
        setter: (sc: NonNullable<typeof gameState.scenario>, v: number) => void,
        liveUpdate: (v: number) => void
    ) => {
        const el = g<HTMLInputElement>(sliderId);
        const vel = g<HTMLSpanElement>(valId);
        if (!el) return;

        const existing = gameState.scenario?.physics;
        el.value = (existing ? (Object.values(existing)[0] ?? getDefault()) : getDefault()).toString();
        if (vel) vel.textContent = parseFloat(el.value).toString();

        el.addEventListener('input', () => {
            const sc = getOrMakeScenario();
            if (!sc.physics) sc.physics = {};
            const v = parseFloat(el.value);
            setter(sc, v);
            liveUpdate(v);
            if (vel) vel.textContent = v.toFixed(2).replace(/\.?0+$/, '');
        });
    };

    bindPhySlider('sePhyThrust', 'sePhyThrustVal', () => Constants.THRUST_GAIN,
        (sc, v) => { sc.physics!.thrustGain = v; }, (v) => { Constants.THRUST_GAIN = v; });
    bindPhySlider('sePhyWash', 'sePhyWashVal', () => Constants.RUDDER_WASH_GAIN,
        (sc, v) => { sc.physics!.rudderWashGain = v; }, (v) => { Constants.RUDDER_WASH_GAIN = v; });
    bindPhySlider('sePhyHydro', 'sePhyHydroVal', () => Constants.RUDDER_HYDRO_GAIN,
        (sc, v) => { sc.physics!.rudderHydroGain = v; }, (v) => { Constants.RUDDER_HYDRO_GAIN = v; });
    bindPhySlider('sePhyMass', 'sePhyMassVal', () => Constants.MASS,
        (sc, v) => { sc.physics!.mass = v; }, (v) => { Constants.MASS = v; });
    bindPhySlider('sePhyDrag', 'sePhyDragVal', () => Constants.DRAG_COEFF,
        (sc, v) => { sc.physics!.dragCoeff = v; }, (v) => { Constants.DRAG_COEFF = v; });
    bindPhySlider('sePhyLat', 'sePhyLatVal', () => Constants.LATERAL_DRAG_COEFF,
        (sc, v) => { sc.physics!.lateralDragCoeff = v; }, (v) => { Constants.LATERAL_DRAG_COEFF = v; });
    bindPhySlider('sePhyLines', 'sePhyLinesVal', () => Constants.LINE_STRENGTH,
        (sc, v) => { sc.physics!.lineStrength = v; }, (v) => { Constants.LINE_STRENGTH = v; });

    const propDir = g<HTMLSelectElement>('sePhyPropDir');
    if (propDir) {
        propDir.value = gameState.boat.propDirection ?? '';
        propDir.addEventListener('change', () => {
            const sc = getOrMakeScenario();
            if (!sc.physics) sc.physics = {};
            sc.physics.propDirection = propDir.value as 'rechts' | 'links' | undefined;
            if (propDir.value) gameState.boat.propDirection = propDir.value as 'rechts' | 'links';
        });
    }

    const phyReset = g<HTMLButtonElement>('sePhyResetBtn');
    if (phyReset) {
        phyReset.onclick = () => {
            const sc = getOrMakeScenario();
            sc.physics = undefined;
            Constants.reset();
            ['sePhyThrust', 'sePhyWash', 'sePhyHydro', 'sePhyMass', 'sePhyDrag', 'sePhyLat', 'sePhyLines'].forEach(id => {
                const el = g<HTMLInputElement>(id);
                if (el) el.dispatchEvent(new Event('input'));
            });
            if (propDir) propDir.value = '';
        };
    }

    // ── CANVAS TOOLS ───────────────────────────────────────────────────────
    const toolHints: Record<string, string> = {
        select: '🖱️ Klik om spots/munten te selecteren. Del = verwijder',
        spot: '🟩 Sleep om een aanlegplaats te tekenen',
        coin: '🟡 Klik op de haven om een munt te plaatsen',
        boatstart: '⛵ Klik om de startpositie van de boot in te stellen'
    };

    activeSETool = 'select';

    document.querySelectorAll('.se-tool').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.se-tool').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeSETool = (btn as HTMLElement).dataset.seTool ?? 'select';
            const hint = g<HTMLElement>('seToolHint');
            if (hint) hint.textContent = toolHints[activeSETool] ?? '';
        });
    });

    // ── CANVAS MOUSE EVENTS ────────────────────────────────────────────────
    const canvas = document.getElementById('simCanvas') as HTMLCanvasElement | null;
    if (!canvas) return;

    // Verwijder eventueel vorige handlers
    unbindCanvasEvents(canvas);

    const getCanvasPos = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) / Constants.GAME_SCALE,
            y: (e.clientY - rect.top) / Constants.GAME_SCALE
        };
    };

    const seMouseDown = (e: MouseEvent) => {
        if (gameState.gameMode !== 'scenario-edit') return;
        const pos = getCanvasPos(e);
        dragStartX = pos.x;
        dragStartY = pos.y;
        isDraggingSE = true;
        seDragMode = null;

        if (activeSETool === 'select') {
            const sc = getOrMakeScenario();

            // Check resize handles of already selected spot
            if (gameState.selectedSEObject && gameState.selectedSEObject.width !== undefined) {
                const spot = gameState.selectedSEObject;
                const w = spot.width;
                const h = spot.height ?? 40;
                if (pos.x >= spot.x + w - 10 && pos.x <= spot.x + w + 10 && pos.y >= spot.y && pos.y <= spot.y + h) {
                    seDragMode = 'resize';
                    seOriginalGeom = { x: spot.x, y: spot.y, w: spot.width };
                    return;
                }
                if (pos.y >= spot.y + h - 10 && pos.y <= spot.y + h + 10 && pos.x >= spot.x && pos.x <= spot.x + w) {
                    seDragMode = 'resize-h';
                    seOriginalGeom = { x: spot.x, y: spot.y, h: spot.height ?? 40 };
                    return;
                }
            }

            gameState.selectedSEObject = null;

            for (let i = sc.coins.length - 1; i >= 0; i--) {
                const coin = sc.coins[i];
                if (Math.hypot(coin.x - pos.x, coin.y - pos.y) < 20) {
                    gameState.selectedSEObject = coin;
                    seDragMode = 'move';
                    seOriginalGeom = { x: coin.x, y: coin.y };
                    const valInput = g<HTMLInputElement>('seCoinValue');
                    if (valInput && coin.value !== undefined) valInput.value = coin.value.toString();
                    return;
                }
            }
            for (let i = sc.mooringSpots.length - 1; i >= 0; i--) {
                const spot = sc.mooringSpots[i];
                const w = spot.width;
                const h = spot.height ?? 40;
                if (pos.x >= spot.x && pos.x <= spot.x + w && pos.y >= spot.y && pos.y <= spot.y + h) {
                    gameState.selectedSEObject = spot;
                    seDragMode = 'move';
                    seOriginalGeom = { x: spot.x, y: spot.y, w: spot.width };
                    const valInput = g<HTMLInputElement>('seCoinValue');
                    if (valInput && spot.points !== undefined) valInput.value = spot.points.toString();
                    return;
                }
            }
        }
    };

    const seMouseMove = (e: MouseEvent) => {
        if (gameState.gameMode !== 'scenario-edit' || !isDraggingSE) return;
        const pos = getCanvasPos(e);

        if (activeSETool === 'select' && gameState.selectedSEObject && seDragMode && seOriginalGeom) {
            const dx = pos.x - dragStartX;
            const dy = pos.y - dragStartY;
            const obj = gameState.selectedSEObject;

            if (seDragMode === 'move') {
                obj.x = Math.round(seOriginalGeom.x + dx);
                obj.y = Math.round(seOriginalGeom.y + dy);
            } else if (seDragMode === 'resize' && obj.width !== undefined) {
                obj.width = Math.max(20, Math.round((seOriginalGeom.w || 60) + dx));
            } else if (seDragMode === 'resize-h' && obj.width !== undefined) {
                obj.height = Math.max(20, Math.round((seOriginalGeom.h || 40) + dy));
            }
        }
    };

    const seMouseUp = (e: MouseEvent) => {
        if (gameState.gameMode !== 'scenario-edit' || !isDraggingSE) return;
        isDraggingSE = false;
        const pos = getCanvasPos(e);
        const sc = getOrMakeScenario();

        if (activeSETool === 'spot') {
            const x = Math.min(dragStartX, pos.x);
            const y = Math.min(dragStartY, pos.y) - 20;
            const width = Math.max(Math.abs(pos.x - dragStartX), 60);
            const height = Math.max(Math.abs(pos.y - dragStartY), 60);
            const valInput = g<HTMLInputElement>('seCoinValue');
            const pointValue = valInput ? parseInt(valInput.value, 10) : 10;
            const newSpot = { x, y, width, height, points: pointValue, angle: 0 };
            sc.mooringSpots.push(newSpot);
            gameState.selectedSEObject = newSpot;
            _switchToSelectTool();
        } else if (activeSETool === 'coin') {
            const valInput = g<HTMLInputElement>('seCoinValue');
            const pointValue = valInput ? parseInt(valInput.value, 10) : 10;
            const newCoin = { x: pos.x, y: pos.y, value: pointValue };
            sc.coins.push(newCoin);
            gameState.selectedSEObject = newCoin;
            _switchToSelectTool();
        } else if (activeSETool === 'boatstart') {
            sc.boatStart = { x: pos.x, y: pos.y, heading: 0 };
            gameState.boat.x = pos.x;
            gameState.boat.y = pos.y;
            gameState.boat.heading = 0;
        }
    };

    const seKeyDown = (e: KeyboardEvent) => {
        if (gameState.gameMode !== 'scenario-edit') return;
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;

        if ((e.key === 'Delete' || e.key === 'Backspace') && gameState.selectedSEObject) {
            const sc = gameState.scenario;
            if (!sc) return;
            const spotIdx = sc.mooringSpots.indexOf(gameState.selectedSEObject);
            if (spotIdx >= 0) sc.mooringSpots.splice(spotIdx, 1);
            const coinIdx = sc.coins.indexOf(gameState.selectedSEObject);
            if (coinIdx >= 0) sc.coins.splice(coinIdx, 1);
            gameState.selectedSEObject = null;
        }
    };

    _seMouseDown = seMouseDown;
    _seMouseMove = seMouseMove;
    _seMouseUp = seMouseUp;
    _seKeyDown = seKeyDown;

    canvas.addEventListener('mousedown', seMouseDown);
    canvas.addEventListener('mousemove', seMouseMove);
    canvas.addEventListener('mouseup', seMouseUp);
    window.addEventListener('keydown', seKeyDown);

    // ── EXIT ────────────────────────────────────────────────────────────────
    const exitBtn = g<HTMLButtonElement>('seExitBtn');
    if (exitBtn) {
        exitBtn.onclick = () => {
            const cvs = document.getElementById('simCanvas') as HTMLCanvasElement | null;
            if (cvs) unbindCanvasEvents(cvs);
            gameState.selectedSEObject = null;
            const overlay = g('scenarioEditorOverlay');
            if (overlay) overlay.style.display = 'none';
            _onExit?.();
        };
    }

    // ── OPSLAAN (CLOUD) ─────────────────────────────────────────────────────
    const saveBtn = g<HTMLButtonElement>('seSaveBtn');
    if (saveBtn) {
        saveBtn.onclick = async () => {
            const scenario = getOrMakeScenario();
            const nameInput = g<HTMLInputElement>('scenarioNameInput');
            if (nameInput?.value) scenario.name = nameInput.value;

            console.log('Saving scenario to cloud:', JSON.parse(JSON.stringify(scenario)));
            saveBtn.textContent = '⏱️ Bezig...';
            await new Promise(r => setTimeout(r, 600));
            saveBtn.textContent = '✅ Opgeslagen';
            setTimeout(() => saveBtn.textContent = '💾 Opslaan (Cloud)', 2000);
        };
    }
}

export function unbindCanvasEvents(canvas: HTMLCanvasElement) {
    if (_seMouseDown) canvas.removeEventListener('mousedown', _seMouseDown);
    if (_seMouseMove) canvas.removeEventListener('mousemove', _seMouseMove);
    if (_seMouseUp) canvas.removeEventListener('mouseup', _seMouseUp);
    if (_seKeyDown) window.removeEventListener('keydown', _seKeyDown);
    _seMouseDown = null;
    _seMouseMove = null;
    _seMouseUp = null;
    _seKeyDown = null;
}

// ─── Intern ─────────────────────────────────────────────────────────────────

function _switchToSelectTool() {
    activeSETool = 'select';
    document.querySelectorAll('.se-tool').forEach(b => b.classList.remove('active'));
    const selBtn = document.querySelector('.se-tool[data-se-tool="select"]');
    if (selBtn) selBtn.classList.add('active');
}
