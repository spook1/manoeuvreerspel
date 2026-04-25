import { GameState, gameState } from '../core/GameState';
import { Constants } from '../core/Constants';
import { ApiClient } from '../core/ApiClient';
import { hasOfficialCurationAccess } from '../core/roles';
import { drawShores, drawNPCBoats } from '../ui/DrawHarborEnvironment';

interface EditorAction {
    type: 'add' | 'delete' | 'move' | 'rotate';
    objects: any[];
    // For move/rotate:
    prevState?: { x: number, y: number, angle?: number }[];
    newState?: { x: number, y: number, angle?: number }[];
}

export class HarborEditor {
    canvas: HTMLCanvasElement;
    activeTool: 'select' | 'jetty' | 'pile' | 'cleat' | 'wind' | 'coin' | 'spot' | 'shore' | 'npc' = 'select';

    // Sub-tool settings
    shoreType: 'rock' | 'reed' | 'concrete' = 'rock';
    npcType: 'small' | 'motorboat' | 'sailboat' | 'large' = 'small';

    // Interaction State
    isDragging: boolean = false;
    isMarqueeSelecting: boolean = false;
    dragStart: { x: number, y: number } | null = null;
    mousePos: { x: number, y: number } = { x: 0, y: 0 };

    // Selection
    selectedObjects: any[] = [];
    dragOffsets: { dx: number, dy: number }[] = [];
    dragStartStates: { x: number, y: number, angle?: number }[] = []; // For Undo
    clipboard: any[] = [];

    // Resize State
    resizeHandle: { obj: any, side: 'N' | 'S' | 'E' | 'W' } | null = null;
    resizeStartGeometry: { x: number, y: number, w: number, h: number, angle: number } | null = null;

    // UI Refs
    propertiesPanel: HTMLElement | null = null;

    // Undo History
    history: EditorAction[] = [];
    historyIndex: number = -1; // Points to current state (last applied action)

    // Ghost/Preview for creation
    ghostJetty: { x: number, y: number, w: number, h: number } | null = null;

    // Grid snapping
    gridSize: number = 5;   // pixels; 1 = vrij (no snap)
    showGrid: boolean = true;

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.propertiesPanel = document.getElementById('toolProperties');
        this.setupToolbar();
        this.setupKeyboard();
    }

    setupToolbar() {
        const tools = document.querySelectorAll('.editor-tool');
        tools.forEach(btn => {
            btn.addEventListener('click', (e) => {
                tools.forEach(t => t.classList.remove('active'));
                const target = e.currentTarget as HTMLElement;
                target.classList.add('active');

                const tool = target.getAttribute('data-tool');
                if (tool) {
                    this.activeTool = tool as any;
                    this.selectedObjects = [];
                    this.updateHint();
                    this.updateProperties();

                    // Show/hide sub-selectors
                    const shoreRow = document.getElementById('shoreTypeRow');
                    const npcRow = document.getElementById('npcTypeRow');
                    if (shoreRow) shoreRow.style.display = tool === 'shore' ? 'flex' : 'none';
                    if (npcRow) npcRow.style.display = tool === 'npc' ? 'flex' : 'none';

                    // Update Cursor
                    this.canvas.className = '';
                    this.canvas.classList.add(`tool-${tool}`);
                }
            });
        });

        // Wire shore/npc type selectors
        const shoreTypeSel = document.getElementById('heShoreType') as HTMLSelectElement | null;
        if (shoreTypeSel) shoreTypeSel.onchange = () => { this.shoreType = shoreTypeSel.value as any; };
        const npcTypeSel = document.getElementById('heNpcType') as HTMLSelectElement | null;
        if (npcTypeSel) npcTypeSel.onchange = () => { this.npcType = npcTypeSel.value as any; };


        // Cloud Save
        const saveCloudBtn = document.getElementById('cloudSaveBtn');
        if (saveCloudBtn) saveCloudBtn.addEventListener('click', () => this.promptCloudSave());



        const exitBtn = document.getElementById('exitEditorBtn');
        if (exitBtn) exitBtn.addEventListener('click', () => this.stop());

        // Alignment Tools
        const bindAlign = (id: string, action: () => void) => {
            const btn = document.getElementById(id);
            if (btn) btn.addEventListener('click', () => { action(); this.updateProperties(); });
        };

        bindAlign('alignLeftBtn', () => this.alignSelected('left'));
        bindAlign('alignCenterHBtn', () => this.alignSelected('centerH'));
        bindAlign('alignRightBtn', () => this.alignSelected('right'));
        bindAlign('alignTopBtn', () => this.alignSelected('top'));
        bindAlign('alignCenterVBtn', () => this.alignSelected('centerV'));
        bindAlign('alignBottomBtn', () => this.alignSelected('bottom'));
        bindAlign('distributeHBtn', () => this.distributeSelected('horizontal'));
        bindAlign('distributeVBtn', () => this.distributeSelected('vertical'));

        // Admin: Toggle Official
        const toggleOfficialBtn = document.getElementById('toggleOfficialBtn');
        if (toggleOfficialBtn) {
            toggleOfficialBtn.addEventListener('click', () => this.toggleOfficial());
        }
    }

    /** Toon/verberg beheer-features (admin + gamemaster) */
    private updateAdminUI() {
        const adminRow = document.getElementById('adminOfficialRow');
        const user = (window as any)._currentUser;
        const canToggleOfficial = hasOfficialCurationAccess(user?.role);

        if (adminRow) adminRow.style.display = canToggleOfficial ? 'flex' : 'none';

        // Update button label
        const btn = document.getElementById('toggleOfficialBtn');
        if (btn && canToggleOfficial) {
            const isOfficial = (gameState.harbor as any).is_official === true;
            btn.textContent = isOfficial ? '⭐ Standaard (actief)' : '☆ Markeer als Standaard';
            btn.style.background = isOfficial ? '#16a34a' : '#a855f7';
        }
    }

    /** Beheer: markeer de huidige haven als officieel/standaard */
    private async toggleOfficial() {
        const dbId = (gameState.harbor as any).db_id;
        if (!dbId) {
            this.showEditorStatus('⚠️ Sla eerst op via "Cloud Opslaan" voordat je de haven als standaard markeert.', 'warn');
            return;
        }

        try {
            const res = await ApiClient.toggleOfficial(Number(dbId));
            const isOfficial = !!res?.harbor?.is_official;
            (gameState.harbor as any).is_official = isOfficial;
            this.showEditorStatus(isOfficial ? '⭐ Haven is nu een standaard haven!' : '☆ Haven is geen standaard meer.', 'ok');
            this.updateAdminUI();
            if (typeof (window as any).refreshHarbors === 'function') {
                await (window as any).refreshHarbors();
            }
        } catch (e: any) {
            this.showEditorStatus('❌ Fout: ' + (e.message || 'Kon status niet wijzigen'), 'error');
        }
    }

    setupKeyboard() {
        window.addEventListener('keydown', (e) => {
            if (gameState.gameMode !== 'harbor-edit') return;
            // Prevent shortcuts when typing in an input field
            const tag = (e.target as HTMLElement).tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return;

            // Delete
            if (e.key === 'Delete' || e.key === 'Backspace') {
                this.deleteSelected();
            }

            // Rotate (R = +15°, Shift+R = -15°)
            if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                this.rotateSelected(e.shiftKey ? -15 : 15);
            }

            // Copy (Ctrl+C)
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
                if (this.selectedObjects.length > 0) {
                    this.clipboard = JSON.parse(JSON.stringify(this.selectedObjects));
                    console.log("Copied to clipboard:", this.clipboard.length);
                }
            }

            // Paste (Ctrl+V)
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
                this.pasteClipboard();
            }

            // Undo (Ctrl+Z)
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undo();
            }

            // Redo (Ctrl+Y or Ctrl+Shift+Z)
            if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
                e.preventDefault();
                this.redo();
            }
        });
    }

    updateHint() {
        const hint = document.getElementById('editorHint');
        if (!hint) return;

        switch (this.activeTool) {
            case 'select': hint.textContent = 'Klik om te selecteren. Shift+Klik voor meer. Sleep om te verplaatsen. R=Roteer (10°), Del=Verwijder, Ctrl+C/V'; break;
            case 'jetty': hint.textContent = 'Sleep om een steiger te trekken'; break;
            case 'pile': hint.textContent = 'Klik om een paal te plaatsen'; break;
            case 'cleat': hint.textContent = 'Klik om een kikker te plaatsen'; break;
            case 'coin': hint.textContent = 'Klik om een munt te plaatsen'; break;
            case 'spot': hint.textContent = 'Sleep om een aanlegplaats te maken'; break;
            case 'wind': hint.textContent = 'Sleep om wind in te stellen'; break;
        }
    }

    start(gs: GameState) {
        gs.gameMode = 'harbor-edit';
        const overlay = document.getElementById('editorOverlay');
        if (overlay) overlay.style.display = 'flex';
        const settings = document.getElementById('settingsPanel');
        if (settings) settings.style.display = 'none';

        // Wire grid controls
        const gridSel = document.getElementById('heGridSize') as HTMLSelectElement | null;
        const showGridCb = document.getElementById('heShowGrid') as HTMLInputElement | null;
        if (gridSel) {
            gridSel.value = this.gridSize.toString();
            gridSel.onchange = () => { this.gridSize = parseInt(gridSel.value, 10) || 1; };
        }
        if (showGridCb) {
            showGridCb.checked = this.showGrid;
            showGridCb.onchange = () => { this.showGrid = showGridCb.checked; };
        }

        this.bindEvents();
        this.updateAdminUI();
    }

    stop() {
        const overlay = document.getElementById('editorOverlay');
        if (overlay) overlay.style.display = 'none';

        // Restore dashboard
        const dash = document.getElementById('gameDashboard');
        if (dash) dash.style.display = 'grid';

        // Restore body mode classes
        document.body.classList.remove(
            'mode-game', 'mode-practice', 'mode-edit',
            'mode-harbor-edit', 'mode-scenario-edit'
        );
        document.body.classList.add('mode-practice');

        // Update nav buttons active state
        const btnGame = document.getElementById('btnModeGame');
        const btnPractice = document.getElementById('btnModePractice');
        const btnEdit = document.getElementById('btnModeEdit');
        const btnScenEdit = document.getElementById('btnModeScenarioEdit');
        if (btnGame) btnGame.classList.remove('active');
        if (btnPractice) btnPractice.classList.add('active');
        if (btnEdit) btnEdit.classList.remove('active');
        if (btnScenEdit) btnScenEdit.classList.remove('active');

        gameState.gameMode = 'practice';
        this.unbindEvents();
    }

    bindEvents() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown);
        window.addEventListener('mousemove', this.handleMouseMove);
        window.addEventListener('mouseup', this.handleMouseUp);
        this.canvas.oncontextmenu = (e) => e.preventDefault();
    }

    unbindEvents() {
        this.canvas.removeEventListener('mousedown', this.handleMouseDown);
        window.removeEventListener('mousemove', this.handleMouseMove);
        window.removeEventListener('mouseup', this.handleMouseUp);
        this.canvas.oncontextmenu = null;
    }

    // Helper: Hit Test (Returns sorted list of hits, top-most first)
    private getCheckHits(x: number, y: number): any[] {
        const hits: any[] = [];

        // Piles / Cleats / Coins (Smaller hitbox radius: 10px) (Coins: 15px)
        for (const p of gameState.harbor.piles.concat([]).reverse()) {
            if (Math.hypot(p.x - x, p.y - y) <= 10) hits.push(p);
        }
        if (gameState.harbor.coins) {
            for (const c of gameState.harbor.coins.concat([]).reverse()) {
                if (Math.hypot(c.x - x, c.y - y) <= 15) hits.push(c);
            }
        }

        // Jetties
        for (const j of gameState.harbor.jetties.concat([]).reverse()) {
            // Jetties can be rotated now too (visual update coming in Render.ts)
            // Use rotated hit test for Jetties if they have angle
            if (j.angle && j.angle !== 0) {
                if (this.isPointInRotatedRect(x, y, j.x, j.y, j.w, j.h, j.angle)) {
                    hits.push(j);
                }
            } else {
                // Std AABB
                if (x >= j.x && x <= j.x + j.w && y >= j.y && y <= j.y + j.h) hits.push(j);
            }
        }

        // Mooring Spots
        if (gameState.harbor.mooringSpots) {
            for (const s of gameState.harbor.mooringSpots.concat([]).reverse()) {
                if (this.isPointInRotatedRect(x, y, s.x, s.y, s.width, 40, s.angle)) {
                    hits.push(s);
                }
            }
        }

        // Shores
        if (gameState.harbor.shores) {
            for (const s of gameState.harbor.shores.concat([]).reverse()) {
                if (this.isPointInRotatedRect(x, y, s.x, s.y, s.w, s.h, s.angle ?? 0)) {
                    hits.push(s);
                }
            }
        }

        // NPCs — use bounding box based on scale
        if (gameState.harbor.npcs) {
            for (const n of gameState.harbor.npcs.concat([]).reverse()) {
                const r = 40 * (n.scale ?? 1);
                if (Math.hypot(n.x - x, n.y - y) <= r) hits.push(n);
            }
        }

        return hits;
    }

    // Helper: Rotated Rectangle Hit Test (Center Pivot)
    private isPointInRotatedRect(px: number, py: number, rx: number, ry: number, rw: number, rh: number, angleDeg: number): boolean {
        // Pivot is Center
        const cx = rx + rw / 2;
        const cy = ry + rh / 2;

        const rad = -angleDeg * (Math.PI / 180); // Negative for inverse rotation

        // Vector from center to point
        const dx = px - cx;
        const dy = py - cy;

        // Rotate point into rect's local space (unrotated)
        const localX = dx * Math.cos(rad) - dy * Math.sin(rad);
        const localY = dx * Math.sin(rad) + dy * Math.cos(rad);

        // Check bounds (relative to center, so -half to +half)
        return localX >= -rw / 2 && localX <= rw / 2 && localY >= -rh / 2 && localY <= rh / 2;
    }

    private rotateSelected(step = 15) {
        if (this.selectedObjects.length === 0) return;

        // Snapshot for Undo
        const prevForUndo = this.selectedObjects.map(o => ({ x: o.x, y: o.y, angle: o.angle, heading: o.heading }));

        this.selectedObjects.forEach(obj => {
            if (obj.heading !== undefined) {
                // NPC uses 'heading' (degrees)
                obj.heading = ((obj.heading ?? 0) + step + 360) % 360;
            } else {
                // Jetty, Shore, Spot, Pile, Cleat use 'angle' (degrees)
                obj.angle = ((obj.angle ?? 0) + step + 360) % 360;
            }
        });

        const newForUndo = this.selectedObjects.map(o => ({ x: o.x, y: o.y, angle: o.angle, heading: o.heading }));

        this.pushAction({
            type: 'rotate',
            objects: this.selectedObjects,
            prevState: prevForUndo,
            newState: newForUndo
        });

        this.updateProperties();
    }

    // ...

    // Draw Resize Handles (Local Space Transformation)
    private drawResizeHandles(ctx: CanvasRenderingContext2D, obj: any) {
        const w = obj.w || obj.width; // Jetty or Spot
        const h = obj.h || (obj.points ? 40 : 0); // Spot default 40
        if (!w || !h) return;

        const handles = [
            { s: 'N', x: 0, y: -h / 2 },
            { s: 'S', x: 0, y: h / 2 },
            { s: 'E', x: w / 2, y: 0 },
            { s: 'W', x: -w / 2, y: 0 }
        ];

        ctx.save();
        // Move to Center
        const cx = obj.x + w / 2;
        const cy = obj.y + h / 2;
        ctx.translate(cx, cy);
        ctx.rotate((obj.angle || 0) * Math.PI / 180);

        handles.forEach(handle => {
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
            const size = 6;
            ctx.fillRect(handle.x - size / 2, handle.y - size / 2, size, size);
            ctx.strokeRect(handle.x - size / 2, handle.y - size / 2, size, size);
        });

        ctx.restore();
    }

    // Check if mouse hits handle (returns 'N', 'S', 'E', 'W' or null)
    private getHandleHit(mx: number, my: number, obj: any): 'N' | 'S' | 'E' | 'W' | null {
        const w = obj.w || obj.width;
        const h = obj.h || (obj.points ? 40 : 0);
        if (!w || !h) return null;

        // Transform mouse into Local Space of obj
        const cx = obj.x + w / 2;
        const cy = obj.y + h / 2;
        const angle = (obj.angle || 0) * Math.PI / 180;

        const dx = mx - cx;
        const dy = my - cy;

        // Inverse Rotate
        const lx = dx * Math.cos(-angle) - dy * Math.sin(-angle);
        const ly = dx * Math.sin(-angle) + dy * Math.cos(-angle);

        // Check against handle positions (in local space)
        const size = 10; // Detection radius
        // N: (0, -h/2)
        if (Math.abs(lx - 0) < size && Math.abs(ly - (-h / 2)) < size) return 'N';
        // S: (0, h/2)
        if (Math.abs(lx - 0) < size && Math.abs(ly - (h / 2)) < size) return 'S';
        // E: (w/2, 0)
        if (Math.abs(lx - (w / 2)) < size && Math.abs(ly - 0) < size) return 'E';
        // W: (-w/2, 0)
        if (Math.abs(lx - (-w / 2)) < size && Math.abs(ly - 0) < size) return 'W';

        return null;
    }

    draw(ctx: CanvasRenderingContext2D) {
        // ── GRID OVERLAY ──────────────────────────────────────────────────────
        if (this.showGrid && this.gridSize > 1 && gameState.gameMode === 'harbor-edit') {
            const cw = ctx.canvas.width / Constants.GAME_SCALE;
            const ch = ctx.canvas.height / Constants.GAME_SCALE;
            const gs = this.gridSize;

            ctx.save();
            ctx.strokeStyle = 'rgba(148, 163, 253, 0.10)';
            ctx.lineWidth = 0.5;

            for (let x = 0; x < cw; x += gs) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke();
            }
            for (let y = 0; y < ch; y += gs) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke();
            }
            ctx.restore();
        }

        // Draw Ghost Jetty

        if (this.activeTool === 'jetty' && this.ghostJetty) {
            ctx.strokeStyle = '#fff';
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(this.ghostJetty.x, this.ghostJetty.y, this.ghostJetty.w, this.ghostJetty.h);
            ctx.setLineDash([]);
        }

        // Draw Wind Line
        else if (this.activeTool === 'wind' && this.isDragging && this.dragStart) {
            ctx.beginPath();
            ctx.moveTo(this.dragStart.x, this.dragStart.y);
            ctx.lineTo(this.mousePos.x, this.mousePos.y);
            ctx.strokeStyle = '#0ea5e9';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Draw Coins (alleen in scenario-gerelateerde modi)
        const activeCoins = gameState.activeCoins;
        if (activeCoins.length > 0) {
            const runner = (gameState.gameMode === 'game') ? (window as any)._scenarioRunner : null;
            const time = Date.now() * 0.004;

            activeCoins.forEach(c => {
                // Find runtime coin for state
                const rc = runner ? runner.coins.find((r: any) => r.data === c) : null;
                const isActive = !runner || (rc && runner.isCoinActive(rc));
                const isCompleted = rc && rc.completed;

                if (isCompleted) return; // Verdwenen munten niet tekenen

                ctx.save();
                const alpha = (runner && !isActive) ? 0.35 : 1.0;
                ctx.globalAlpha = alpha;

                if (isActive && runner) {
                    // Pulserende glow ring
                    const pulseR = 20 + Math.sin(time) * 4;
                    ctx.beginPath();
                    ctx.arc(c.x, c.y, pulseR, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(251,191,36,0.25)';
                    ctx.fill();

                    // Timer arc (groen→rood)
                    const remaining = runner.getCoinTimeRemaining(rc);
                    ctx.beginPath();
                    ctx.arc(c.x, c.y, 19, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * remaining);
                    ctx.strokeStyle = remaining > 0.4 ? '#22c55e' : '#ef4444';
                    ctx.lineWidth = 3;
                    ctx.stroke();
                }

                ctx.beginPath();
                ctx.arc(c.x, c.y, 15, 0, Math.PI * 2);
                ctx.fillStyle = '#fbbf24';
                ctx.fill();
                ctx.strokeStyle = '#d97706';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                ctx.fillStyle = '#fff';
                ctx.font = 'bold 10px system-ui';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(c.value.toString(), c.x, c.y);
                ctx.restore();
            });
        }

        // Draw Mooring Spots (alleen in scenario-gerelateerde modi)
        const activeMooringSpots = gameState.activeMooringSpots;
        if (activeMooringSpots.length > 0) {
            const runner = (gameState.gameMode === 'game') ? (window as any)._scenarioRunner : null;
            const time = Date.now() * 0.003;

            activeMooringSpots.forEach(s => {
                const rs = runner ? runner.spots.find((r: any) => r.data === s) : null;
                const isActive = !runner || (rs && runner.isSpotActive(rs));
                const isCompleted = rs && rs.completed;

                if (isCompleted) return; // Voltooide spots verdwijnen

                ctx.save();
                const alpha = (runner && !isActive) ? 0.3 : 1.0;
                ctx.globalAlpha = alpha;

                const h = s.height ?? 40;
                const cx = s.x + s.width / 2;
                const cy = s.y + h / 2;
                ctx.translate(cx, cy);
                ctx.rotate((s.angle || 0) * Math.PI / 180);

                // Glow background (actieve spots)
                if (isActive && runner) {
                    const pulse = 0.3 + Math.abs(Math.sin(time)) * 0.2;
                    ctx.fillStyle = `rgba(34, 197, 94, ${pulse})`;
                    ctx.fillRect(-s.width / 2 - 6, -h / 2 - 6, s.width + 12, h + 12);

                    // Timer balk onderaan
                    const remaining = runner.getSpotTimeRemaining(rs);
                    ctx.fillStyle = remaining > 0.4 ? '#22c55e' : '#ef4444';
                    const barW = (s.width + 12) * remaining;
                    ctx.fillRect(-s.width / 2 - 6, h / 2 + 2, barW, 4);
                }

                ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
                ctx.strokeStyle = isActive ? '#4ade80' : '#22c55e';
                ctx.lineWidth = isActive ? 2.5 : 1.5;
                ctx.fillRect(-s.width / 2, -h / 2, s.width, h);
                ctx.strokeRect(-s.width / 2, -h / 2, s.width, h);

                ctx.fillStyle = '#fff';
                ctx.font = 'bold 12px system-ui';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(s.points + 'pt', 0, 0);
                ctx.restore();
            });
        }

        // Draw Ghost Spot (during creation)
        if (this.activeTool === 'spot' && this.ghostJetty) {
            ctx.fillStyle = 'rgba(34, 197, 94, 0.5)';
            ctx.fillRect(this.ghostJetty.x, this.ghostJetty.y, this.ghostJetty.w, this.ghostJetty.h ?? 40);
        }

        // Draw Ghost Shore (during creation)
        if (this.activeTool === 'shore' && this.ghostJetty) {
            const colors: Record<string, string> = { rock: 'rgba(100,100,100,0.5)', reed: 'rgba(34,160,34,0.5)', concrete: 'rgba(180,180,180,0.5)' };
            ctx.fillStyle = colors[this.shoreType] ?? 'rgba(100,100,100,0.5)';
            ctx.fillRect(this.ghostJetty.x, this.ghostJetty.y, this.ghostJetty.w, this.ghostJetty.h);
        }

        // Draw Selection Halo (Center Pivot Logic)
        if (this.selectedObjects.length > 0) {
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 3]);
            this.selectedObjects.forEach(obj => {
                ctx.save();

                if (obj.w !== undefined) {
                    // Jetty (Center Hitbox)
                    const cx = obj.x + obj.w / 2;
                    const cy = obj.y + obj.h / 2;
                    ctx.translate(cx, cy);
                    ctx.rotate((obj.angle || 0) * Math.PI / 180);
                    ctx.strokeRect(-obj.w / 2 - 4, -obj.h / 2 - 4, obj.w + 8, obj.h + 8);
                }
                else if (obj.width !== undefined) {
                    // Spot (Center Hitbox)
                    const h = obj.height ?? 40;
                    const cx = obj.x + obj.width / 2;
                    const cy = obj.y + h / 2;
                    ctx.translate(cx, cy);
                    ctx.rotate((obj.angle || 0) * Math.PI / 180);
                    ctx.strokeRect(-obj.width / 2 - 4, -h / 2 - 4, obj.width + 8, h + 8);
                }
                else {
                    // Pile / Cleat (Simple Circle or Rotated if Cleat)
                    ctx.translate(obj.x, obj.y);
                    if (obj.angle) ctx.rotate(obj.angle * Math.PI / 180);

                    ctx.beginPath();
                    ctx.arc(0, 0, 18, 0, Math.PI * 2);
                    ctx.stroke();

                    // Show direction for Cleats
                    if (obj.type === 'cleat') {
                        ctx.beginPath();
                        ctx.moveTo(0, 0);
                        ctx.lineTo(20, 0); // Indicator
                        ctx.stroke();
                    }
                }
                ctx.restore();
            });

            // Render Resize Handles (if exactly one object selected and it is resizable)
            if (this.selectedObjects.length === 1) {
                const obj = this.selectedObjects[0];
                if (obj.w !== undefined || obj.points !== undefined) {
                    this.drawResizeHandles(ctx, obj);
                }
            }

            ctx.setLineDash([]);
        }

        // Draw Marquee Selection Box
        if (this.activeTool === 'select' && this.isMarqueeSelecting && this.dragStart) {
            ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 1;
            const mw = this.mousePos.x - this.dragStart.x;
            const mh = this.mousePos.y - this.dragStart.y;
            ctx.fillRect(this.dragStart.x, this.dragStart.y, mw, mh);
            ctx.strokeRect(this.dragStart.x, this.dragStart.y, mw, mh);
        }
    }

    /** Snap a value to the current grid */
    private snap(v: number): number {
        if (this.gridSize <= 1) return v;
        return Math.round(v / this.gridSize) * this.gridSize;
    }

    private handleMouseDown = (e: MouseEvent) => {
        const rect = this.canvas.getBoundingClientRect();
        const x = this.snap((e.clientX - rect.left) / Constants.GAME_SCALE);
        const y = this.snap((e.clientY - rect.top) / Constants.GAME_SCALE);
        this.dragStart = { x, y };

        if (this.activeTool === 'select') {
            // Check Resize Handles FIRST
            if (this.selectedObjects.length === 1) {
                const obj = this.selectedObjects[0];
                const handle = this.getHandleHit(x, y, obj);
                if (handle) {
                    this.isDragging = true;
                    this.resizeHandle = { obj, side: handle };
                    this.resizeStartGeometry = {
                        x: obj.x, y: obj.y,
                        w: obj.w || obj.width,
                        h: obj.h || (obj.points ? (obj.height || 40) : 0),
                        angle: obj.angle || 0
                    };
                    return; // Stop processing selection logic
                }
            }

            const hits = this.getCheckHits(x, y);
            let hit = null;

            if (hits.length > 0) {
                const selectedInStackIndex = hits.findIndex(h => this.selectedObjects.includes(h));

                if (selectedInStackIndex !== -1) {
                    const nextIndex = (selectedInStackIndex + 1) % hits.length;
                    hit = hits[nextIndex];
                } else {
                    hit = hits[0];
                }
            }

            if (hit) {
                this.isDragging = true;
                if (e.shiftKey || e.ctrlKey) {
                    const idx = this.selectedObjects.indexOf(hit);
                    if (idx >= 0) this.selectedObjects.splice(idx, 1);
                    else this.selectedObjects.push(hit);
                } else {
                    if (!this.selectedObjects.includes(hit)) {
                        this.selectedObjects = [hit];
                    }
                }
                this.updateProperties();
                this.dragOffsets = this.selectedObjects.map(obj => ({ dx: x - obj.x, dy: y - obj.y }));
                this.dragStartStates = this.selectedObjects.map(obj => ({ x: obj.x, y: obj.y, angle: obj.angle }));

            } else {
                if (!e.shiftKey && !e.ctrlKey) this.selectedObjects = [];
                this.updateProperties();
                this.isDragging = true;
                this.isMarqueeSelecting = true;
            }
        }
        else if (this.activeTool === 'pile') {
            const newPile = { x, y, type: 'pile' as const, id: Date.now() };
            gameState.harbor.piles.push(newPile);
            this.pushAction({ type: 'add', objects: [newPile] });
        }
        else if (this.activeTool === 'cleat') {
            const newCleat = { x, y, type: 'cleat' as const, id: Date.now() };
            gameState.harbor.piles.push(newCleat);
            this.pushAction({ type: 'add', objects: [newCleat] });
        }
        else if (this.activeTool === 'coin') {
            const newCoin = { x, y, value: 10, sequenceIndex: gameState.harbor.coins?.length || 0, id: Date.now() };
            if (!gameState.harbor.coins) gameState.harbor.coins = [];
            gameState.harbor.coins.push(newCoin);
            this.pushAction({ type: 'add', objects: [newCoin] });
        }
        else if (this.activeTool === 'jetty' || this.activeTool === 'spot' || this.activeTool === 'shore') {
            // All drag-to-draw tools
            this.isDragging = true;
        }
        else if (this.activeTool === 'npc') {
            // Click to place NPC
            if (!gameState.harbor.npcs) gameState.harbor.npcs = [];
            const newNpc = { x, y, heading: 0, type: this.npcType, scale: 1.0 };
            gameState.harbor.npcs.push(newNpc);
            this.selectedObjects = [newNpc];
            this.pushAction({ type: 'add', objects: [newNpc] });
            this.updateProperties();
        }
        else if (this.activeTool === 'wind') {
            this.isDragging = true;
        }
    };

    private handleMouseMove = (e: MouseEvent) => {
        const rect = this.canvas.getBoundingClientRect();
        this.mousePos.x = this.snap((e.clientX - rect.left) / Constants.GAME_SCALE);
        this.mousePos.y = this.snap((e.clientY - rect.top) / Constants.GAME_SCALE);

        // Resize Interaction
        if (this.isDragging && this.resizeHandle && this.resizeStartGeometry && this.dragStart) {
            const { obj, side } = this.resizeHandle;
            const start = this.resizeStartGeometry;

            const dx = this.mousePos.x - this.dragStart.x;
            const dy = this.mousePos.y - this.dragStart.y;
            const rad = (start.angle || 0) * Math.PI / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);

            const dw = dx * cos + dy * sin;
            const dh = -dx * sin + dy * cos;

            let newW = start.w;
            let newH = start.h;
            let cxOff = 0;
            let cyOff = 0;

            if (side === 'E') {
                newW = Math.max(10, start.w + dw);
                cxOff = (newW - start.w) / 2;
            } else if (side === 'W') {
                newW = Math.max(10, start.w - dw);
                cxOff = -(newW - start.w) / 2;
            } else if (side === 'S') {
                newH = Math.max(10, start.h + dh);
                cyOff = (newH - start.h) / 2;
            } else if (side === 'N') {
                newH = Math.max(10, start.h - dh);
                cyOff = -(newH - start.h) / 2;
            }

            if (!e.altKey) {
                newW = Math.round(newW / 5) * 5;
                newH = Math.round(newH / 5) * 5;
                if (side === 'E') cxOff = (newW - start.w) / 2;
                if (side === 'W') cxOff = -(newW - start.w) / 2;
                if (side === 'S') cyOff = (newH - start.h) / 2;
                if (side === 'N') cyOff = -(newH - start.h) / 2;
            }

            const gCxOff = cxOff * cos - cyOff * sin;
            const gCyOff = cxOff * sin + cyOff * cos;

            const newX = (start.x + start.w / 2 + gCxOff) - newW / 2;
            const newY = (start.y + start.h / 2 + gCyOff) - newH / 2;

            if (obj.w !== undefined) {
                obj.w = newW;
                obj.h = newH;
            } else {
                obj.width = newW;
                if (side === 'N' || side === 'S') obj.height = newH;
            }
            obj.x = newX;
            obj.y = newY;
            this.updateProperties();
            return;
        }

        if (this.isDragging && this.dragStart) {
            if (this.isMarqueeSelecting) {
                // Visual update of rect happens in draw()
            }
            else if (this.activeTool === 'select') {
                this.selectedObjects.forEach((obj, i) => {
                    const offset = this.dragOffsets[i];
                    obj.x = this.snap(this.mousePos.x - offset.dx);
                    obj.y = this.snap(this.mousePos.y - offset.dy);
                    // Alt key bypasses snap
                    if (e.altKey) {
                        obj.x = this.mousePos.x - offset.dx;
                        obj.y = this.mousePos.y - offset.dy;
                    }
                });
            }
            else if (this.activeTool === 'jetty' || this.activeTool === 'spot' || this.activeTool === 'shore') {
                const w = this.mousePos.x - this.dragStart.x;
                const h = this.mousePos.y - this.dragStart.y;
                this.ghostJetty = {
                    x: w > 0 ? this.dragStart.x : this.mousePos.x,
                    y: h > 0 ? this.dragStart.y : this.mousePos.y,
                    w: Math.abs(w),
                    h: Math.abs(h)
                };
            }
        }

        // Hover Cursor
        if (this.activeTool === 'select' && this.selectedObjects.length === 1 && !this.isDragging) {
            const h = this.getHandleHit(this.mousePos.x, this.mousePos.y, this.selectedObjects[0]);
            this.canvas.style.cursor = h ? ((h === 'N' || h === 'S') ? 'ns-resize' : 'ew-resize') : 'default';
        } else {
            this.canvas.style.cursor = 'default';
        }
    };

    private handleMouseUp = (e?: MouseEvent) => {
        if (!this.dragStart) return;

        // Finish Resize
        if (this.resizeHandle) {
            // Push resize undo action here if we want undo support for resize
            // For now just clear state
            this.resizeHandle = null;
            this.resizeStartGeometry = null;
        }

        if (this.isDragging && this.activeTool === 'select' && this.isMarqueeSelecting && this.dragStart) {
            const rx = Math.min(this.dragStart.x, this.mousePos.x);
            const ry = Math.min(this.dragStart.y, this.mousePos.y);
            const rw = Math.max(this.dragStart.x, this.mousePos.x) - rx;
            const rh = Math.max(this.dragStart.y, this.mousePos.y) - ry;

            const getObjsInRect = () => {
                const hits: any[] = [];
                const inP = (ox: number, oy: number) => ox >= rx && ox <= rx + rw && oy >= ry && oy <= ry + rh;

                gameState.harbor.jetties.forEach(j => { if (inP(j.x + j.w / 2, j.y + j.h / 2)) hits.push(j); });
                gameState.harbor.piles.forEach(p => { if (inP(p.x, p.y)) hits.push(p); });
                if (gameState.harbor.coins) gameState.harbor.coins.forEach(c => { if (inP(c.x, c.y)) hits.push(c); });
                if (gameState.harbor.mooringSpots) gameState.harbor.mooringSpots.forEach(s => { if (inP(s.x + s.width / 2, s.y + (s.height ?? 40) / 2)) hits.push(s); });
                if (gameState.harbor.shores) gameState.harbor.shores.forEach(s => { if (inP(s.x + s.w / 2, s.y + s.h / 2)) hits.push(s); });
                if (gameState.harbor.npcs) gameState.harbor.npcs.forEach(n => { if (inP(n.x, n.y)) hits.push(n); });
                return hits;
            };

            const rectHits = getObjsInRect();
            const isAdd = e?.shiftKey || e?.ctrlKey;

            if (isAdd) {
                rectHits.forEach(h => {
                    if (!this.selectedObjects.includes(h)) this.selectedObjects.push(h);
                });
            } else {
                this.selectedObjects = rectHits;
            }
            this.updateProperties();
            this.isMarqueeSelecting = false;
        }
        else if (this.isDragging && this.activeTool === 'select' && this.selectedObjects.length > 0 && !this.resizeHandle) {
            // Check if moved
            const currentStates = this.selectedObjects.map(o => ({ x: o.x, y: o.y, angle: o.angle }));
            const hasMoved = currentStates.some((s, i) => s.x !== this.dragStartStates[i]?.x || s.y !== this.dragStartStates[i]?.y);

            if (hasMoved) {
                this.pushAction({
                    type: 'move',
                    objects: this.selectedObjects,
                    prevState: this.dragStartStates,
                    newState: currentStates
                });
            }
        }

        if (this.activeTool === 'jetty' && this.ghostJetty) {
            if (this.ghostJetty.w > 5 && this.ghostJetty.h > 5) {
                const newJetty = { ...this.ghostJetty, angle: 0 };
                gameState.harbor.jetties.push(newJetty);
                this.pushAction({ type: 'add', objects: [newJetty] });
            }
            this.ghostJetty = null;
        }
        else if (this.activeTool === 'spot' && this.ghostJetty) {
            if (this.ghostJetty.w > 20) {
                if (!gameState.harbor.mooringSpots) gameState.harbor.mooringSpots = [];
                const newSpot = {
                    x: this.ghostJetty.x, y: this.ghostJetty.y,
                    width: this.ghostJetty.w, height: 40,
                    points: 50, angle: 0
                };
                gameState.harbor.mooringSpots.push(newSpot);
                this.pushAction({ type: 'add', objects: [newSpot] });
            }
            this.ghostJetty = null;
        }
        else if (this.activeTool === 'shore' && this.ghostJetty) {
            if (this.ghostJetty.w > 10 || this.ghostJetty.h > 10) {
                if (!gameState.harbor.shores) gameState.harbor.shores = [];
                const newShore = {
                    x: this.ghostJetty.x, y: this.ghostJetty.y,
                    w: Math.max(this.ghostJetty.w, 10),
                    h: Math.max(this.ghostJetty.h, 10),
                    angle: 0, type: this.shoreType
                };
                gameState.harbor.shores.push(newShore);
                this.selectedObjects = [newShore];
                this.pushAction({ type: 'add', objects: [newShore] });
                this.updateProperties();
            }
            this.ghostJetty = null;
        }

        else if (this.activeTool === 'wind' && this.isDragging) {
            // Wind-tool in haven-editor — wordt gemigreerd naar scenario-editor
            // Voorlopig: sla op in harbor.wind als fallback
            const dx = this.mousePos.x - this.dragStart.x;
            const dy = this.mousePos.y - this.dragStart.y;
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;
            const force = Math.min(30, Math.hypot(dx, dy) / 10);
            if (!gameState.harbor.wind) gameState.harbor.wind = { direction: 0, force: 0 };
            gameState.harbor.wind.direction = (angle + 360) % 360;
            gameState.harbor.wind.force = parseFloat(force.toFixed(1));
        }

        this.isDragging = false;
        this.isMarqueeSelecting = false;
        this.dragStart = null;
    };

    private deleteSelected() {
        const harbor = gameState.harbor;
        const toDelete = [...this.selectedObjects];
        if (toDelete.length === 0) return;

        this.pushAction({ type: 'delete', objects: toDelete });

        harbor.jetties = harbor.jetties.filter(j => !this.selectedObjects.includes(j));
        harbor.piles = harbor.piles.filter(p => !this.selectedObjects.includes(p));
        if (harbor.coins) harbor.coins = harbor.coins.filter(c => !this.selectedObjects.includes(c));
        if (harbor.mooringSpots) harbor.mooringSpots = harbor.mooringSpots.filter(s => !this.selectedObjects.includes(s));
        if (harbor.shores) harbor.shores = harbor.shores.filter(s => !this.selectedObjects.includes(s));
        if (harbor.npcs) harbor.npcs = harbor.npcs.filter(n => !this.selectedObjects.includes(n));

        this.selectedObjects = [];
    }



    // Deprecated methods removed


    private pasteClipboard() {
        if (this.clipboard.length === 0) return;

        const newSelection: any[] = [];
        this.clipboard.forEach(item => {
            const newItem = JSON.parse(JSON.stringify(item));
            newItem.x += 20;
            newItem.y += 20;
            // Determine type and push to correct array
            // item doesn't have explicit type field in GameState arrays usually,
            // but we can infer or we should have saved it?
            // GameState data is just raw objects.
            // Jetties have w, h. Piles have type 'pile'/'cleat'.

            if (newItem.w !== undefined) {
                gameState.harbor.jetties.push(newItem);
                newSelection.push(newItem);
            } else {
                // Assume pile/cleat
                // Ensure type is set?
                if (!newItem.type) newItem.type = 'pile';
                gameState.harbor.piles.push(newItem);
                newSelection.push(newItem);
            }
        });
        this.selectedObjects = newSelection;
    }

    // --- UNDO / REDO ---

    private pushAction(action: EditorAction) {
        // Truncate redo history if we are in the middle of history
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        this.history.push(action);
        this.historyIndex++;

        // Limit history size? 50 steps
        if (this.history.length > 50) {
            this.history.shift();
            this.historyIndex--;
        }
    }

    private undo() {
        if (this.historyIndex < 0) return;

        const action = this.history[this.historyIndex];

        if (action.type === 'add') {
            // Un-add = delete
            const harbor = gameState.harbor;
            harbor.jetties = harbor.jetties.filter(j => !action.objects.includes(j));
            harbor.piles = harbor.piles.filter(p => !action.objects.includes(p));
            this.selectedObjects = []; // Clear selection to avoid ghost references
        }
        else if (action.type === 'delete') {
            // Un-delete = add back
            action.objects.forEach(obj => {
                if (obj.w !== undefined) gameState.harbor.jetties.push(obj);
                else gameState.harbor.piles.push(obj);
            });
            this.selectedObjects = [...action.objects]; // Restore selection
        }
        else if (action.type === 'move' || action.type === 'rotate') {
            if (action.prevState) {
                action.objects.forEach((obj, i) => {
                    obj.x = action.prevState![i].x;
                    obj.y = action.prevState![i].y;
                    if (obj.w !== undefined && action.prevState![i].angle !== undefined) {
                        obj.angle = action.prevState![i].angle;
                    }
                });
            }
        }

        this.historyIndex--;
    }

    private redo() {
        if (this.historyIndex >= this.history.length - 1) return;

        this.historyIndex++;
        const action = this.history[this.historyIndex];

        if (action.type === 'add') {
            // Re-add
            action.objects.forEach(obj => {
                if (obj.w !== undefined) gameState.harbor.jetties.push(obj);
                else gameState.harbor.piles.push(obj);
            });
            this.selectedObjects = [...action.objects];
        }
        else if (action.type === 'delete') {
            // Re-delete
            const harbor = gameState.harbor;
            harbor.jetties = harbor.jetties.filter(j => !action.objects.includes(j));
            harbor.piles = harbor.piles.filter(p => !action.objects.includes(p));
            this.selectedObjects = [];
        }
        else if (action.type === 'move' || action.type === 'rotate') {
            if (action.newState) {
                action.objects.forEach((obj, i) => {
                    obj.x = action.newState![i].x;
                    obj.y = action.newState![i].y;
                    if (obj.w !== undefined && action.newState![i].angle !== undefined) {
                        obj.angle = action.newState![i].angle;
                    }
                });
            }
        }
    }

    // --- CLOUD FUNCTIONALITY ---

    // Toon een status-bericht in de editor sidebar (tijdelijk, 4 sec)
    private showEditorStatus(msg: string, type: 'ok' | 'warn' | 'error' = 'ok') {
        let statusEl = document.getElementById('heStatusMsg');
        if (!statusEl) {
            statusEl = document.createElement('div');
            statusEl.id = 'heStatusMsg';
            statusEl.style.cssText = 'padding:8px 10px; border-radius:6px; font-size:12px; margin-top:6px; font-weight:600; transition:opacity 0.5s;';
            const saveBtn = document.querySelector('#editorOverlay .cloud-save-btn') as HTMLElement | null;
            if (saveBtn?.parentElement) {
                saveBtn.parentElement.insertAdjacentElement('afterend', statusEl);
            } else {
                // Fallback: add to editorOverlay first child panel
                const panel = document.querySelector('#editorOverlay > div') as HTMLElement | null;
                if (panel) panel.appendChild(statusEl);
            }
        }
        const colors = {
            ok: 'background:#14532d; color:#86efac; border:1px solid #16a34a;',
            warn: 'background:#713f12; color:#fde68a; border:1px solid #d97706;',
            error: 'background:#4c0519; color:#fca5a5; border:1px solid #dc2626;',
        };
        statusEl.style.cssText = `padding:8px 10px; border-radius:6px; font-size:12px; margin-top:6px; font-weight:600; ${colors[type]}`;
        statusEl.textContent = msg;
        statusEl.style.opacity = '1';
        clearTimeout((statusEl as any)._hideTimer);
        (statusEl as any)._hideTimer = setTimeout(() => { statusEl!.style.opacity = '0'; }, 4000);
    }

    async promptCloudSave() {
        if (!ApiClient.isLoggedIn) {
            this.showEditorStatus('⚠️ Je moet ingelogd zijn om op te slaan.', 'warn');
            return;
        }

        const currentName = gameState.harbor.name || 'Nieuwe Haven';
        const rawInput = window.prompt("Kies een naam voor deze opslag:", currentName);
        if (rawInput === null) return;

        const name = rawInput.trim() || 'Naamloze Haven';

        const saveBtn = document.getElementById('cloudSaveBtn') as HTMLButtonElement | null;
        if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = '⏳ ...'; }

        try {
            const myHarbors = await ApiClient.getMyHarbors();
            const targetName = name.toLowerCase();
            const existing = myHarbors.find((h: any) => {
                const rawName = (h?.name ?? h?.json_data?.name ?? '').toString().trim().toLowerCase();
                return rawName !== '' && rawName === targetName;
            });

            const harborData = {
                id: gameState.harbor.id || `custom_${Date.now()}`,
                name: name,
                version: "1.0",
                boatStart: gameState.harbor.boatStart || { x: 200, y: 500, heading: 0 },
                jetties: gameState.harbor.jetties,
                piles: gameState.harbor.piles,
                npcs: gameState.harbor.npcs,
                shores: gameState.harbor.shores
            };

            if (existing) {
                if (!confirm(`Je hebt al een haven met de naam '${name}'. Wil je deze overschrijven?`)) {
                    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = '💾 Opslaan'; }
                    return;
                }
                // Overschrijven (PUT)
                harborData.id = existing.json_data?.id || harborData.id;
                await ApiClient.updateHarbor(existing.id, harborData, !!existing.is_official);
                gameState.harbor.id = harborData.id;
                (gameState.harbor as any).db_id = existing.id;
                (gameState.harbor as any).is_official = existing.is_official;
                gameState.harbor.name = name;
            } else {
                // Nieuw opslaan (POST)
                const res = await ApiClient.saveHarbor(harborData, false);
                gameState.harbor.id = res.json_data?.id || `custom_${res.id}`;
                (gameState.harbor as any).db_id = res.id;
                (gameState.harbor as any).is_official = false;
                gameState.harbor.name = name;
            }

            if (saveBtn) { saveBtn.textContent = '✅ Opgeslagen'; }

            const nameInput = document.getElementById('harborNameInput') as HTMLInputElement | null;
            if (nameInput) nameInput.value = name;

            if (typeof (window as any).refreshHarbors === 'function') {
                await (window as any).refreshHarbors();
            }

            const heSelector = document.getElementById('heHarborSelector') as HTMLSelectElement | null;
            if (heSelector && gameState.harbor.id) {
                heSelector.value = gameState.harbor.id;
            }
            this.updateAdminUI();
        } catch (e: any) {
            console.error(e);
            if (saveBtn) { saveBtn.textContent = '❌ Fout'; }
            alert('Fout bij opslaan: ' + (e.message || 'Verbindingsfout'));
        } finally {
            setTimeout(() => {
                const saveBtn = document.getElementById('cloudSaveBtn') as HTMLButtonElement | null;
                if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = '💾 Opslaan'; }
            }, 2000);
        }
    }

    updateProperties() {
        if (!this.propertiesPanel) return;

        const alignToolbar = document.getElementById('alignmentToolbar');
        if (alignToolbar) alignToolbar.style.display = 'none';

        if (this.selectedObjects.length === 0) {
            this.propertiesPanel.innerHTML = '<div style="color:#94a3b8; font-style:italic;">Geen selectie</div>';
            return;
        }

        if (this.selectedObjects.length > 1) {
            this.propertiesPanel.innerHTML = `<div style="color:#fff;">${this.selectedObjects.length} objecten geselecteerd</div>`;
            if (alignToolbar) alignToolbar.style.display = 'flex';
            return;
        }

        const obj = this.selectedObjects[0];
        this.propertiesPanel.innerHTML = ''; // Clear

        // Helper to create input
        const createInput = (label: string, value: any, type: string = 'text', onChange: (val: string) => void) => {
            const div = document.createElement('div');
            div.style.marginBottom = '8px';
            const lb = document.createElement('label');
            lb.textContent = label;
            lb.style.display = 'block';
            lb.style.fontSize = '12px';
            lb.style.color = '#94a3b8';
            const inp = document.createElement('input');
            inp.type = type;
            inp.value = value;
            inp.style.width = '100%';
            inp.style.background = '#1e293b';
            inp.style.border = '1px solid #334155';
            inp.style.color = '#fff';
            inp.style.padding = '4px';
            inp.style.borderRadius = '4px';

            inp.addEventListener('change', (e) => {
                // Capture state before change for Undo?
                // This is tricky for individual property Undo. 
                // For now, let's just make sure it updates the object reference tightly.
                // We'll trust the user saves manually or drag-undo works.
                // But user complained about persistence.

                onChange((e.target as HTMLInputElement).value);

                // Tip: Maybe force a "Save Local" or just ensure it's in gameState.
                // It IS in gameState because obj is a reference. 
                // The issue might be that Cloud Save didn't pick up new fields (fixed in previous step).
                // Or that text inputs lose specific type? (handled by parseInt).
            });

            div.appendChild(lb);
            div.appendChild(inp);
            this.propertiesPanel!.appendChild(div);
        };

        if (obj.value !== undefined) {
            // Coin
            createInput('Punten', obj.value, 'number', (v) => { obj.value = parseInt(v) || 0; });
            createInput('Volgorde', obj.sequenceIndex || 0, 'number', (v) => { obj.sequenceIndex = parseInt(v) || 0; });
            createInput('Tijd (sec)', obj.timeout || 0, 'number', (v) => { obj.timeout = parseInt(v) || 0; });
        }
        else if (obj.points !== undefined) {
            // Mooring Spot
            createInput('Punten', obj.points, 'number', (v) => { obj.points = parseInt(v) || 0; });
            createInput('Breedte', obj.width, 'number', (v) => { obj.width = parseInt(v) || 25; });
            createInput('Hoek', obj.angle, 'number', (v) => { obj.angle = parseInt(v) || 0; });
        }
        else if (obj.w !== undefined && obj.type !== undefined && ['rock', 'reed', 'concrete'].includes(obj.type)) {
            // Shore
            createInput('Breedte', obj.w, 'number', (v) => { obj.w = parseInt(v) || 20; });
            createInput('Hoogte', obj.h, 'number', (v) => { obj.h = parseInt(v) || 20; });
            createInput('Hoek', obj.angle || 0, 'number', (v) => { obj.angle = parseFloat(v) || 0; });
        }
        else if (obj.w !== undefined) {
            // Jetty
            createInput('Hoek', obj.angle || 0, 'number', (v) => { obj.angle = parseFloat(v) || 0; });
        }
        else if (obj.heading !== undefined) {
            // NPC
            createInput('Hoek', obj.heading, 'number', (v) => { obj.heading = parseFloat(v) || 0; });
            createInput('Schaal', obj.scale ?? 1, 'number', (v) => { obj.scale = parseFloat(v) || 1; });
            createInput('Naam', obj.name ?? '', 'text', (v) => { obj.name = v; });
        }
        else if (obj.type === 'cleat' || obj.type === 'pile') {
            // Pile / Cleat
            createInput('Hoek', obj.angle || 0, 'number', (v) => { obj.angle = parseFloat(v) || 0; });
        }
    }

    alignSelected(axis: 'left' | 'centerH' | 'right' | 'top' | 'centerV' | 'bottom') {
        if (this.selectedObjects.length < 2) return;

        const prevForUndo = this.selectedObjects.map(o => ({ x: o.x, y: o.y }));
        let targetVal = 0;

        if (axis === 'left') {
            targetVal = Math.min(...this.selectedObjects.map(o => o.x));
            this.selectedObjects.forEach(o => o.x = targetVal);
        } else if (axis === 'right') {
            targetVal = Math.max(...this.selectedObjects.map(o => o.x + (o.w || o.width || 0)));
            this.selectedObjects.forEach(o => o.x = targetVal - (o.w || o.width || 0));
        } else if (axis === 'centerH') {
            const minX = Math.min(...this.selectedObjects.map(o => o.x));
            const maxX = Math.max(...this.selectedObjects.map(o => o.x + (o.w || o.width || 0)));
            targetVal = (minX + maxX) / 2;
            this.selectedObjects.forEach(o => o.x = targetVal - (o.w || o.width || 0) / 2);
        } else if (axis === 'top') {
            targetVal = Math.min(...this.selectedObjects.map(o => o.y));
            this.selectedObjects.forEach(o => o.y = targetVal);
        } else if (axis === 'bottom') {
            targetVal = Math.max(...this.selectedObjects.map(o => o.y + (o.h || o.height || (o.points ? 40 : 0) || 0)));
            this.selectedObjects.forEach(o => o.y = targetVal - (o.h || o.height || (o.points ? 40 : 0) || 0));
        } else if (axis === 'centerV') {
            const minY = Math.min(...this.selectedObjects.map(o => o.y));
            const maxY = Math.max(...this.selectedObjects.map(o => o.y + (o.h || o.height || (o.points ? 40 : 0) || 0)));
            targetVal = (minY + maxY) / 2;
            this.selectedObjects.forEach(o => o.y = targetVal - (o.h || o.height || (o.points ? 40 : 0) || 0) / 2);
        }

        const newForUndo = this.selectedObjects.map(o => ({ x: o.x, y: o.y }));
        this.pushAction({
            type: 'move',
            objects: this.selectedObjects,
            prevState: prevForUndo,
            newState: newForUndo
        });
    }

    distributeSelected(axis: 'horizontal' | 'vertical') {
        if (this.selectedObjects.length < 3) return;

        const prevForUndo = this.selectedObjects.map(o => ({ x: o.x, y: o.y }));

        // Sort objects by their position along the axis
        const sorted = [...this.selectedObjects].sort((a, b) => axis === 'horizontal' ? a.x - b.x : a.y - b.y);

        if (axis === 'horizontal') {
            const first = sorted[0].x;
            const last = sorted[sorted.length - 1].x;
            const step = (last - first) / (sorted.length - 1);
            sorted.forEach((o, i) => o.x = first + (step * i));
        } else {
            const first = sorted[0].y;
            const last = sorted[sorted.length - 1].y;
            const step = (last - first) / (sorted.length - 1);
            sorted.forEach((o, i) => o.y = first + (step * i));
        }

        const newForUndo = this.selectedObjects.map(o => ({ x: o.x, y: o.y }));
        this.pushAction({
            type: 'move',
            objects: this.selectedObjects,
            prevState: prevForUndo,
            newState: newForUndo
        });
    }

    // ── RENDERING: SHORES ───────────────────────────────────────────────────

    drawShores(ctx: CanvasRenderingContext2D) {
        drawShores(ctx, gameState.harbor.shores);
    }

    // -- RENDERING: NPC BOATS -----------------------------------------------

    drawNPCs(ctx: CanvasRenderingContext2D) {
        drawNPCBoats(ctx, gameState.harbor.npcs);
    }
}

export const editor = new HarborEditor('simCanvas');
