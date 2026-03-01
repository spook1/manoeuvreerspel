import { GameState, gameState } from '../core/GameState';
import { Constants } from '../core/Constants';
import { ApiClient } from '../core/ApiClient';
import { drawNPCDetail, NPC_SPECS } from '../ui/DrawNPC';

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

        // Local Save (Download)
        const saveBtn = document.getElementById('saveHarborBtn');
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveHarborLocal());

        // Cloud Save
        const saveCloudBtn = document.getElementById('saveCloudBtn');
        if (saveCloudBtn) saveCloudBtn.addEventListener('click', () => this.promptCloudSave());

        // Cloud Load
        const loadCloudBtn = document.getElementById('loadCloudBtn');
        if (loadCloudBtn) loadCloudBtn.addEventListener('click', () => this.promptCloudLoad());

        // Cloud Confirm Save
        const confirmSaveBtn = document.getElementById('cloudConfirmSaveBtn');
        if (confirmSaveBtn) confirmSaveBtn.addEventListener('click', () => this.executeCloudSave());

        const exitBtn = document.getElementById('exitEditorBtn');
        if (exitBtn) exitBtn.addEventListener('click', () => this.stop());
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

            let newW = start.w;
            let newH = start.h;

            // Symmetric Resize Logic
            if (side === 'E') newW = Math.max(10, start.w + (dx * cos + dy * sin) * 2);
            else if (side === 'W') newW = Math.max(10, start.w - (dx * cos + dy * sin) * 2);
            else if (side === 'S') newH = Math.max(10, start.h + (dx * (-sin) + dy * cos) * 2);
            else if (side === 'N') newH = Math.max(10, start.h - (dx * (-sin) + dy * cos) * 2);

            if (!e.altKey) {
                newW = Math.round(newW / 5) * 5;
                newH = Math.round(newH / 5) * 5;
            }

            if (obj.w !== undefined) {
                obj.w = newW;
                obj.h = newH;
            } else {
                obj.width = newW;
                if (side === 'N' || side === 'S') obj.height = newH;
            }
            this.updateProperties();
            return;
        }

        if (this.isDragging && this.dragStart) {
            if (this.activeTool === 'select') {
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

    private handleMouseUp = () => {
        if (!this.dragStart) return;

        // Finish Resize
        if (this.resizeHandle) {
            // Push resize undo action here if we want undo support for resize
            // For now just clear state
            this.resizeHandle = null;
            this.resizeStartGeometry = null;
        }

        if (this.isDragging && this.activeTool === 'select' && this.selectedObjects.length > 0 && !this.resizeHandle) {
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

    promptCloudSave() {
        if (!ApiClient.isLoggedIn) {
            alert('Je moet ingelogd zijn om op te slaan in de cloud.');
            return;
        }
        const modal = document.getElementById('cloudModal');
        const saveContent = document.getElementById('cloudSaveContent');
        const loadContent = document.getElementById('cloudLoadContent');
        const nameInput = document.getElementById('cloudHarborName') as HTMLInputElement;

        if (modal && saveContent && loadContent) {
            modal.style.display = 'flex';
            saveContent.style.display = 'flex';
            loadContent.style.display = 'none';
            nameInput.value = gameState.harbor.name || '';
        }
    }

    async executeCloudSave() {
        const nameInput = document.getElementById('cloudHarborName') as HTMLInputElement;
        const name = nameInput.value.trim() || 'Naamloze Haven';

        try {
            // Check for existing harbors with same name
            const existingHarbors = await ApiClient.getMyHarbors();
            const existingMatch = existingHarbors.find((h: any) => h.json_data?.name === name);

            // Haven-editor slaat ALLEEN haven-structuur op (geen wind/spots/coins)
            const harborData = {
                id: existingMatch ? existingMatch.json_data.id : (gameState.harbor.id || `custom_${Date.now()}`),
                name: name,
                version: "1.0",
                boatStart: gameState.harbor.boatStart || { x: 200, y: 500, heading: 0 },
                jetties: gameState.harbor.jetties,
                piles: gameState.harbor.piles,
                npcs: gameState.harbor.npcs,
                shores: gameState.harbor.shores
            };

            if (existingMatch) {
                if (confirm(`Je hebt al een haven met de naam "${name}". Wil je deze overschrijven?`)) {
                    await ApiClient.updateHarbor(existingMatch.id, harborData, false);
                } else {
                    return; // abort
                }
            } else {
                await ApiClient.saveHarbor(harborData, false);
            }

            alert('Haven succesvol opgeslagen! ✅');
            document.getElementById('cloudModal')!.style.display = 'none';
            gameState.harbor.name = name;

            if (typeof (window as any).refreshHarbors === 'function') {
                (window as any).refreshHarbors();
            }
        } catch (e: any) {
            console.error(e);
            alert('Fout bij opslaan: ' + (e.message || e));
        }
    }

    async promptCloudLoad() {
        if (!ApiClient.isLoggedIn) {
            alert('Je moet ingelogd zijn om te laden uit de cloud.');
            return;
        }
        const modal = document.getElementById('cloudModal');
        const saveContent = document.getElementById('cloudSaveContent');
        const loadContent = document.getElementById('cloudLoadContent');
        const listDiv = document.getElementById('cloudHarborList');

        if (modal && saveContent && loadContent && listDiv) {
            modal.style.display = 'flex';
            saveContent.style.display = 'none';
            loadContent.style.display = 'flex';

            listDiv.innerHTML = '<div style="padding:10px; color:#94a3b8;">Laden...</div>';

            try {
                const harbors = await ApiClient.getMyHarbors();
                listDiv.innerHTML = '';

                if (harbors.length === 0) {
                    listDiv.innerHTML = '<div style="padding:10px; color:#94a3b8;">Geen havens gevonden.</div>';
                    return;
                }

                harbors.forEach((h: any) => {
                    const row = document.createElement('div');
                    row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; background:#1e293b; padding:8px; margin-bottom:4px; border-radius:4px; border:1px solid #334155;';

                    const nameSpan = document.createElement('span');
                    // Check structure of response: h.json_data.name ?
                    const hName = h.json_data?.name || `Haven #${h.id}`;
                    nameSpan.textContent = hName;
                    nameSpan.style.fontWeight = 'bold';

                    const actionDiv = document.createElement('div');
                    actionDiv.style.display = 'flex';
                    actionDiv.style.gap = '6px';

                    const loadBtn = document.createElement('button');
                    loadBtn.textContent = 'Laden';
                    loadBtn.style.cssText = 'background:#3b82f6; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:12px;';
                    loadBtn.onclick = () => {
                        this.loadHarbor(h.json_data);
                        document.getElementById('cloudModal')!.style.display = 'none';
                    };

                    const delBtn = document.createElement('button');
                    delBtn.textContent = '❌';
                    delBtn.style.cssText = 'background:#ef4444; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:12px;';
                    delBtn.onclick = async () => {
                        if (confirm('Zeker weten verwijderen?')) {
                            await ApiClient.deleteHarbor(h.id);
                            this.promptCloudLoad(); // Refresh local list
                            if (typeof (window as any).refreshHarbors === 'function') {
                                (window as any).refreshHarbors(); // Update dropdowns
                            }
                        }
                    };

                    actionDiv.appendChild(loadBtn);
                    actionDiv.appendChild(delBtn);
                    row.appendChild(nameSpan);
                    row.appendChild(actionDiv);
                    listDiv.appendChild(row);
                });

            } catch (e: any) {
                listDiv.innerHTML = `<div style="color:red; paading:10px;">Fout bij laden lijst: ${e.message || e}</div>`;
            }
        }
    }

    saveHarborLocal() {
        // Haven-editor slaat ALLEEN haven-structuur op
        const data = {
            id: gameState.harbor.id || `custom_${Date.now()}`,
            name: gameState.harbor.name || "Custom Harbor",
            version: "1.0",
            boatStart: gameState.harbor.boatStart || { x: 200, y: 500, heading: 0 },
            jetties: gameState.harbor.jetties || [],
            piles: gameState.harbor.piles || [],
            shores: gameState.harbor.shores || [],
            npcs: gameState.harbor.npcs || []
        };

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        let safeName = (gameState.harbor.name || 'custom_harbor').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        a.download = `${safeName}.hbr`;

        a.click();
        URL.revokeObjectURL(url);

        // OOK Lokaal opslaan in localStorage voor de Editor Dropdowns!
        try {
            const saved = localStorage.getItem('customHarbors');
            const hList = saved ? JSON.parse(saved) : [];
            const idx = hList.findIndex((h: any) => h.id === data.id);
            if (idx !== -1) {
                hList[idx] = data;
            } else {
                hList.push(data);
            }
            localStorage.setItem('customHarbors', JSON.stringify(hList));
            if (typeof (window as any).refreshHarbors === 'function') {
                (window as any).refreshHarbors();
            }
            alert('Haven tijdelijk opgeslagen in je browser (dropdowns) en gedownload (.hbr)! ✅');
        } catch (e) {
            console.error("Localstorage niet beschikbaar: ", e);
        }
    }

    loadHarbor(data: any) {
        if (!data || !data.jetties || !data.piles) {
            alert("Ongeldig haven bestand!");
            return;
        }
        gameState.harbor.id = data.id || `custom_${Date.now()}`;
        gameState.harbor.name = data.name || "Custom";
        gameState.harbor.jetties = data.jetties || [];
        gameState.harbor.piles = data.piles || [];
        gameState.harbor.shores = data.shores || [];
        gameState.harbor.npcs = data.npcs || [];
        if (data.boatStart) gameState.harbor.boatStart = data.boatStart;
        // Ignore scenario-data (wind/mooringSpots/coins) — die horen in ScenarioEditor
        this.selectedObjects = [];
    }


    updateProperties() {
        if (!this.propertiesPanel) return;

        if (this.selectedObjects.length === 0) {
            this.propertiesPanel.innerHTML = '<div style="color:#94a3b8; font-style:italic;">Geen selectie</div>';
            return;
        }

        if (this.selectedObjects.length > 1) {
            this.propertiesPanel.innerHTML = `<div style="color:#fff;">${this.selectedObjects.length} objecten geselecteerd</div>`;
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

    // ── RENDERING: SHORES ───────────────────────────────────────────────────

    drawShores(ctx: CanvasRenderingContext2D) {
        const shores = gameState.harbor.shores;
        if (!shores || shores.length === 0) return;

        for (const s of shores) {
            ctx.save();
            const cx = s.x + s.w / 2;
            const cy = s.y + s.h / 2;
            ctx.translate(cx, cy);
            ctx.rotate((s.angle ?? 0) * Math.PI / 180);

            if (s.type === 'rock') {
                // Grijze achtergrond
                ctx.fillStyle = '#6b6b6b';
                ctx.fillRect(-s.w / 2, -s.h / 2, s.w, s.h);
                // Steen-textuur: paar onregelmatige ovalen
                ctx.fillStyle = '#888';
                const rng = (seed: number) => ((seed * 9301 + 49297) % 233280) / 233280;
                for (let i = 0; i < Math.floor(s.w * s.h / 600); i++) {
                    const rx = (rng(i * 3 + 1) - 0.5) * s.w * 0.7;
                    const ry = (rng(i * 3 + 2) - 0.5) * s.h * 0.7;
                    const rr = 4 + rng(i * 3 + 3) * 8;
                    ctx.beginPath();
                    ctx.ellipse(rx, ry, rr * 1.3, rr * 0.8, rng(i) * Math.PI, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.strokeStyle = '#4a4a4a';
                ctx.lineWidth = 1;
                ctx.strokeRect(-s.w / 2, -s.h / 2, s.w, s.h);
            } else if (s.type === 'reed') {
                // Groen basis
                ctx.fillStyle = '#2d6a1e';
                ctx.fillRect(-s.w / 2, -s.h / 2, s.w, s.h);
                // Rietjes als kleine vertikale lijntjes
                ctx.strokeStyle = '#4caf50';
                ctx.lineWidth = 1.5;
                const cols = Math.max(3, Math.floor(s.w / 6));
                const rows = Math.max(2, Math.floor(s.h / 8));
                for (let ci = 0; ci < cols; ci++) {
                    for (let ri = 0; ri < rows; ri++) {
                        const px = -s.w / 2 + (ci + 0.5) * (s.w / cols) + (ri % 2 === 0 ? 2 : -2);
                        const py = -s.h / 2 + (ri + 0.3) * (s.h / rows);
                        const ph = s.h / rows * 0.6;
                        ctx.beginPath(); ctx.moveTo(px, py + ph); ctx.lineTo(px, py);
                        ctx.moveTo(px, py); ctx.lineTo(px - 3, py - 3);
                        ctx.moveTo(px, py); ctx.lineTo(px + 3, py - 3);
                        ctx.stroke();
                    }
                }
                ctx.strokeStyle = '#1b4d12';
                ctx.lineWidth = 1;
                ctx.strokeRect(-s.w / 2, -s.h / 2, s.w, s.h);
            } else {
                // Concrete: lichtgrijs met voeglijnen
                ctx.fillStyle = '#a0a0a0';
                ctx.fillRect(-s.w / 2, -s.h / 2, s.w, s.h);
                ctx.strokeStyle = '#888';
                ctx.lineWidth = 0.8;
                const brickH = 12;
                for (let by = -s.h / 2; by < s.h / 2; by += brickH) {
                    const offset = Math.floor((by / brickH) % 2) * 18;
                    ctx.beginPath(); ctx.moveTo(-s.w / 2, by); ctx.lineTo(s.w / 2, by); ctx.stroke();
                    for (let bx = -s.w / 2 + offset; bx < s.w / 2; bx += 36) {
                        ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, Math.min(by + brickH, s.h / 2)); ctx.stroke();
                    }
                }
                ctx.strokeStyle = '#777';
                ctx.lineWidth = 1;
                ctx.strokeRect(-s.w / 2, -s.h / 2, s.w, s.h);
            }

            ctx.restore();
        }
    }

    // -- RENDERING: NPC BOATS -----------------------------------------------

    drawNPCs(ctx: CanvasRenderingContext2D) {
        const npcs = gameState.harbor.npcs;
        if (!npcs || npcs.length === 0) return;

        for (const n of npcs) {
            ctx.save();
            ctx.translate(n.x, n.y);
            ctx.rotate((n.heading ?? 0) * Math.PI / 180);

            const sc = n.scale ?? 1;
            drawNPCDetail(ctx, n.type, sc);

            if (n.name) {
                ctx.save();
                ctx.rotate(-(n.heading ?? 0) * Math.PI / 180);
                ctx.font = `bold ${Math.round(10 * sc)}px system-ui`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.shadowColor = 'rgba(0,0,0,0.7)';
                ctx.shadowBlur = 3;
                ctx.fillStyle = '#fff';
                const labelOffset = (NPC_SPECS[n.type]?.W ?? 14) * sc + 8;
                ctx.fillText(n.name, 0, labelOffset);
                ctx.restore();
            }

            ctx.restore();
        }
    }
}

export const editor = new HarborEditor('simCanvas');