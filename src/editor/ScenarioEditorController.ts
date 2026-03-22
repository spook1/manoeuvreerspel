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
import { ApiClient } from '../core/ApiClient';

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

let _onSave: ((scenario: any) => Promise<void>) | null = null;

// ─── Public API ─────────────────────────────────────────────────────────────

export function initScenarioEditor(callbacks: {
    onExit: () => void;
    onSave?: (scenario: any) => Promise<void>;
}) {
    _onExit = callbacks.onExit;
    if (callbacks.onSave) _onSave = callbacks.onSave;
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

    // ── PENALTY SETTINGS ───────────────────────────────────────────────────
    const syncPen = () => {
        if (!gameState.selectedHarborObjectId) return;
        const sc = getOrMakeScenario();
        if (!sc.objectPenalties) sc.objectPenalties = {};
        if (!sc.objectPenalties[gameState.selectedHarborObjectId]) sc.objectPenalties[gameState.selectedHarborObjectId] = {};
        const pen = sc.objectPenalties[gameState.selectedHarborObjectId];

        const sS = g<HTMLInputElement>('seSpeedSoftKnots');
        const sH = g<HTMLInputElement>('seSpeedHardKnots');
        const hS = g<HTMLInputElement>('seHullPenaltySoft');
        const hH = g<HTMLInputElement>('seHullPenaltyHard');
        const fS = g<HTMLInputElement>('seFenderPenaltySoft');
        const fH = g<HTMLInputElement>('seFenderPenaltyHard');
        if (sS) pen.speedThresholdSoft = parseFloat(sS.value) || 0;
        if (sH) pen.speedThresholdHard = parseFloat(sH.value) || 0;
        if (hS) pen.hullPenaltySoft = parseInt(hS.value) || 0;
        if (hH) pen.hullPenaltyHard = parseInt(hH.value) || 0;
        if (fS) pen.fenderPenaltySoft = parseInt(fS.value) || 0;
        if (fH) pen.fenderPenaltyHard = parseInt(fH.value) || 0;
    };

    g('seSpeedSoftKnots')?.addEventListener('input', syncPen);
    g('seSpeedHardKnots')?.addEventListener('input', syncPen);
    g('seHullPenaltySoft')?.addEventListener('input', syncPen);
    g('seHullPenaltyHard')?.addEventListener('input', syncPen);
    g('seFenderPenaltySoft')?.addEventListener('input', syncPen);
    g('seFenderPenaltyHard')?.addEventListener('input', syncPen);

    const updateSEPropertiesPanel = () => {
        const dObjPen = g('seObjectPenaltiesGroup');
        const dObjPenSub = g('seObjectPenaltiesSubtitle');
        if (gameState.selectedHarborObjectId) {
            if (dObjPen) dObjPen.style.display = 'flex';
            if (dObjPenSub) {
                const typeMap: Record<string, string> = { jetty: 'Steiger', shore: 'Oever', npc: 'Boot', pile: 'Paal', cleat: 'Kikker' };
                const t = gameState.selectedHarborObjectId.split('_')[0];
                dObjPenSub.textContent = `Vast aan: ${typeMap[t] || 'Object'} (${gameState.selectedHarborObjectId})`;
            }

            const sc = getOrMakeScenario();
            if (!sc.objectPenalties) sc.objectPenalties = {};
            if (!sc.objectPenalties[gameState.selectedHarborObjectId]) {
                sc.objectPenalties[gameState.selectedHarborObjectId] = { speedThresholdSoft: 1, speedThresholdHard: 2, hullPenaltySoft: 2, hullPenaltyHard: 40, fenderPenaltySoft: 1, fenderPenaltyHard: 3 };
            }
            const pen = sc.objectPenalties[gameState.selectedHarborObjectId];

            const sS = g<HTMLInputElement>('seSpeedSoftKnots');
            const sH = g<HTMLInputElement>('seSpeedHardKnots');
            const hS = g<HTMLInputElement>('seHullPenaltySoft');
            const hH = g<HTMLInputElement>('seHullPenaltyHard');
            const fS = g<HTMLInputElement>('seFenderPenaltySoft');
            const fH = g<HTMLInputElement>('seFenderPenaltyHard');

            if (sS) sS.value = (pen.speedThresholdSoft ?? 1).toString();
            if (sH) sH.value = (pen.speedThresholdHard ?? pen.maxSpeedKnots ?? 2).toString();
            if (hS) hS.value = (pen.hullPenaltySoft ?? 2).toString();
            if (hH) hH.value = (pen.hullPenaltyHard ?? 40).toString();
            if (fS) fS.value = (pen.fenderPenaltySoft ?? 1).toString();
            if (fH) fH.value = (pen.fenderPenaltyHard ?? 3).toString();
        } else {
            if (dObjPen) dObjPen.style.display = 'none';
        }

        const dObjSet = g('seObjectSettingsGroup');
        const dObjSetTitle = g('seObjectSettingsTitle');
        if (gameState.selectedSEObject) {
            const obj = gameState.selectedSEObject;
            const isSpot = obj.width !== undefined;
            if (dObjSet) dObjSet.style.display = 'flex';
            if (dObjSetTitle) {
                dObjSetTitle.textContent = isSpot ? '⚙️ Aanlegplaats (Spot) Instellingen' : '⚙️ Munt Instellingen';
            }

            document.querySelectorAll('.se-spot-only').forEach(el => {
                (el as HTMLElement).style.display = isSpot ? 'inline-block' : 'none';
            });

            const oOrder = g<HTMLInputElement>('seObjOrder');
            const oTime = g<HTMLInputElement>('seObjTimeLimit');
            const oLines = g<HTMLInputElement>('seObjLines');
            const oMooring = g<HTMLInputElement>('seObjMooringTime');

            if (oOrder) oOrder.value = (obj.order ?? 1).toString();
            if (oTime) oTime.value = (obj.timeLimit ?? 120).toString();
            if (isSpot) {
                if (oLines) oLines.value = (obj.linesRequired ?? 3).toString();
                if (oMooring) oMooring.value = (obj.mooringTimeRequired ?? 30).toString();
            }
        } else {
            if (dObjSet) dObjSet.style.display = 'none';
        }
    };

    // Listeners for per-object settings
    const syncObjSettings = () => {
        const obj = gameState.selectedSEObject;
        if (!obj) return;

        const oOrder = g<HTMLInputElement>('seObjOrder');
        const oTime = g<HTMLInputElement>('seObjTimeLimit');

        if (oOrder) obj.order = parseInt(oOrder.value, 10) || 1;
        if (oTime) obj.timeLimit = parseInt(oTime.value, 10) || 0;

        if (obj.width !== undefined) {
            const oLines = g<HTMLInputElement>('seObjLines');
            const oMooring = g<HTMLInputElement>('seObjMooringTime');
            if (oLines) obj.linesRequired = parseInt(oLines.value, 10) || 3;
            if (oMooring) obj.mooringTimeRequired = parseInt(oMooring.value, 10) || 30;
        }
    };

    g('seObjOrder')?.addEventListener('input', syncObjSettings);
    g('seObjTimeLimit')?.addEventListener('input', syncObjSettings);
    g('seObjLines')?.addEventListener('input', syncObjSettings);
    g('seObjMooringTime')?.addEventListener('input', syncObjSettings);



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
                    updateSEPropertiesPanel();
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
                    updateSEPropertiesPanel();
                    return;
                }
            }

            // If not found, check harbor objects for penalty assignment
            gameState.selectedHarborObjectId = null;
            for (const j of gameState.harbor.jetties || []) {
                if (pos.x >= j.x && pos.x <= j.x + j.w && pos.y >= j.y && pos.y <= j.y + j.h) {
                    gameState.selectedHarborObjectId = j.id ?? null; break;
                }
            }
            if (!gameState.selectedHarborObjectId) {
                for (const s of gameState.harbor.shores || []) {
                    if (pos.x >= s.x && pos.x <= s.x + s.w && pos.y >= s.y && pos.y <= s.y + s.h) {
                        gameState.selectedHarborObjectId = s.id ?? null; break;
                    }
                }
            }
            if (!gameState.selectedHarborObjectId) {
                for (const n of gameState.harbor.npcs || []) {
                    if (Math.hypot(n.x - pos.x, n.y - pos.y) < 25) {
                        gameState.selectedHarborObjectId = n.id ?? null; break;
                    }
                }
            }
            if (!gameState.selectedHarborObjectId) {
                for (const p of gameState.harbor.piles || []) {
                    if (Math.hypot(p.x - pos.x, p.y - pos.y) < 15) {
                        gameState.selectedHarborObjectId = p.id?.toString() ?? null; break;
                    }
                }
            }

            updateSEPropertiesPanel();
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
            gameState.selectedHarborObjectId = null;
            updateSEPropertiesPanel();
            const overlay = g('scenarioEditorOverlay');
            if (overlay) overlay.style.display = 'none';
            _onExit?.();
        };
    }

    // ── VERWIJDEREN (CLOUD) ──────────────────────────────────────────────────
    const deleteBtn = g<HTMLButtonElement>('seDeleteScenarioBtn');
    if (deleteBtn) {
        deleteBtn.onclick = async () => {
            if (!gameState.scenario || gameState.scenario.id.startsWith('new_')) {
                alert("Dit scenario is nog niet opgeslagen, bewerk gewoon verder of schakel naar een ander scenario.");
                return;
            }
            if (!confirm(`Weet je zeker dat je het scenario '${gameState.scenario.name}' wilt verwijderen?\n\nDit kan niet ongedaan worden! (Let op: als dit in een game reeks zit, gaat dat stuk)`)) return;
            
            try {
                deleteBtn.textContent = '🗑️...';
                await ApiClient.deleteScenario(Number(gameState.scenario.id));
                alert("Scenario is succesvol verwijderd.");
                
                // Let GameManager refresh
                if ((window as any).refreshScenarios) {
                    await (window as any).refreshScenarios();
                }
                
                // Reset actively edited scenario
                gameState.scenario = null;
                const dropdown = g<HTMLSelectElement>('seScenarioSelector');
                if (dropdown) {
                    dropdown.value = "nieuw";
                    dropdown.dispatchEvent(new Event('change'));
                }
                deleteBtn.textContent = '🗑️';
            } catch (e: any) {
                console.error("Kon scenario niet verwijderen:", e);
                alert("Fout bij verwijderen: " + e.message);
                deleteBtn.textContent = '🗑️';
            }
        };
    }

    // ── OPSLAAN (CLOUD) ─────────────────────────────────────────────────────
    const saveBtn = g<HTMLButtonElement>('seSaveBtn');

    const doSave = async (btn: HTMLButtonElement, defaultLabel: string) => {
        const scenario = getOrMakeScenario();
        const nameInput = g<HTMLInputElement>('scenarioNameInput');
        const descInput = g<HTMLTextAreaElement>('scenarioDescInput');

        if (nameInput?.value) scenario.name = nameInput.value;
        if (descInput) scenario.description = descInput.value;

        btn.textContent = '⏳ ...';
        btn.disabled = true;

        try {
            if (_onSave) await _onSave(scenario);
            btn.textContent = '✅ Opgeslagen';
        } catch (e) {
            btn.textContent = '❌ Fout';
            console.error('Save failed:', e);
        } finally {
            setTimeout(() => {
                btn.disabled = false;
                btn.textContent = defaultLabel;
                updateAdminUI();
            }, 2000);
        }
    };

    if (saveBtn) saveBtn.onclick = () => doSave(saveBtn, '💾 Opslaan');

    // ── ADMIN TOGGLE ────────────────────────────────────────────────────────
    function updateAdminUI() {
        const toggleBtn = g<HTMLButtonElement>('seToggleOfficialBtn');
        const user = (window as any)._currentUser;
        const isAdmin = user?.role === 'admin';

        if (toggleBtn) {
            if (isAdmin && !gameState.scenario?.id?.startsWith('new_')) {
                toggleBtn.style.display = 'block';
                const isOfficial = (gameState.scenario as any)?.is_official === true;
                toggleBtn.textContent = isOfficial ? '⭐ Standaard (actief)' : '☆ Markeer als Standaard';
                toggleBtn.style.background = isOfficial ? '#16a34a' : '#a855f7';
            } else {
                toggleBtn.style.display = 'none';
            }
        }
    }

    // Initial check on mount
    updateAdminUI();

    const toggleBtn = g<HTMLButtonElement>('seToggleOfficialBtn');
    if (toggleBtn) {
        toggleBtn.onclick = async () => {
            const scenId = parseInt((gameState.scenario?.id || '').replace('custom_', '').replace('official_', ''), 10);
            if (isNaN(scenId) || scenId <= 0) {
                alert("Scenario is nog niet opgeslagen! Sla eerst lokaal op.");
                return;
            }
            try {
                toggleBtn.textContent = '⏱️...';
                const res = await ApiClient.toggleOfficialScenario(scenId);
                if (gameState.scenario) {
                    (gameState.scenario as any).is_official = res.scenario.is_official;
                }
                updateAdminUI();
                if ((window as any).refreshScenarios) {
                    await (window as any).refreshScenarios();
                }
            } catch (e) {
                console.error("Fout bij toggle official scenario:", e);
                alert("Fout bij aanpassen standaard-status.");
                updateAdminUI();
            }
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
