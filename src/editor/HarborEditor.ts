import { GameState, gameState } from '../core/GameState';
import { Constants } from '../core/Constants';

export class HarborEditor {
    canvas: HTMLCanvasElement;
    activeTool: 'select' | 'jetty' | 'pile' | 'cleat' | 'wind' | 'eraser' = 'select';

    // Interaction State
    isDragging: boolean = false;
    dragStart: { x: number, y: number } | null = null;
    mousePos: { x: number, y: number } = { x: 0, y: 0 };

    // Selection
    selectedObjects: any[] = [];
    dragOffsets: { dx: number, dy: number }[] = [];
    clipboard: any[] = [];

    // Ghost/Preview for creation
    ghostJetty: { x: number, y: number, w: number, h: number } | null = null;

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
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
                    this.selectedObjects = []; // Clear selection on tool change?
                    this.updateHint();
                }
            });
        });

        const saveBtn = document.getElementById('saveHarborBtn');
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveHarbor());

        const exitBtn = document.getElementById('exitEditorBtn');
        if (exitBtn) exitBtn.addEventListener('click', () => this.stop());
    }

    setupKeyboard() {
        window.addEventListener('keydown', (e) => {
            if (gameState.gameMode !== 'edit') return;

            // Delete
            if (e.key === 'Delete' || e.key === 'Backspace') {
                this.deleteSelected();
            }

            // Rotate (R)
            if (e.key.toLowerCase() === 'r') {
                this.rotateSelected();
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
        });
    }

    updateHint() {
        const hint = document.getElementById('editorHint');
        if (!hint) return;

        switch (this.activeTool) {
            case 'select': hint.textContent = 'Klik om te selecteren. Shift+Klik voor meer. Sleep om te verplaatsen. R=Roteer, Del=Verwijder, Ctrl+C/V'; break;
            case 'jetty': hint.textContent = 'Sleep om een steiger te trekken'; break;
            case 'pile': hint.textContent = 'Klik om een paal te plaatsen'; break;
            case 'cleat': hint.textContent = 'Klik om een kikker te plaatsen'; break;
            case 'wind': hint.textContent = 'Sleep om wind in te stellen'; break;
            case 'eraser': hint.textContent = 'Klik op object om te verwijderen'; break;
        }
    }

    start(gs: GameState) {
        gs.gameMode = 'edit';
        const overlay = document.getElementById('editorOverlay');
        if (overlay) overlay.style.display = 'flex';
        const settings = document.getElementById('settingsPanel');
        if (settings) settings.style.display = 'none';
        this.bindEvents();
    }

    stop() {
        const overlay = document.getElementById('editorOverlay');
        if (overlay) overlay.style.display = 'none';
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

    // Helper: Hit Test
    private getHitObject(x: number, y: number): any {
        // Piles first
        for (const p of gameState.harbor.piles.concat([]).reverse()) { // Check top first
            if (Math.hypot(p.x - x, p.y - y) <= 15) return p;
        }
        // Jetties
        for (const j of gameState.harbor.jetties.concat([]).reverse()) {
            if (x >= j.x && x <= j.x + j.w && y >= j.y && y <= j.y + j.h) return j;
        }
        return null;
    }

    private handleMouseDown = (e: MouseEvent) => {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / Constants.GAME_SCALE;
        const y = (e.clientY - rect.top) / Constants.GAME_SCALE;
        this.dragStart = { x, y };

        if (this.activeTool === 'select') {
            const hit = this.getHitObject(x, y);
            if (hit) {
                this.isDragging = true;
                if (e.shiftKey || e.ctrlKey) {
                    // Multi-select toggle
                    const idx = this.selectedObjects.indexOf(hit);
                    if (idx >= 0) this.selectedObjects.splice(idx, 1);
                    else this.selectedObjects.push(hit);
                } else {
                    // Single select (unless already selected, then allow drag group)
                    if (!this.selectedObjects.includes(hit)) {
                        this.selectedObjects = [hit];
                    }
                }
                // Prepare drag offsets
                this.dragOffsets = this.selectedObjects.map(obj => ({ dx: x - obj.x, dy: y - obj.y }));
            } else {
                // Clicked empty space
                if (!e.shiftKey && !e.ctrlKey) this.selectedObjects = [];
                // Box select could go here
            }
        }
        else if (this.activeTool === 'eraser') {
            const hit = this.getHitObject(x, y);
            if (hit) this.deleteObject(hit);
        }
        else if (this.activeTool === 'pile') {
            const newPile = { x, y, type: 'pile' as const, id: Date.now() };
            gameState.harbor.piles.push(newPile);
            this.activeTool = 'select'; // Switching back to select feels nicer? Or sticky? Old editor was sticky.
            // Let's keep sticky for creation tools
            // But maybe select the new object?
        }
        else if (this.activeTool === 'cleat') {
            const newCleat = { x, y, type: 'cleat' as const, id: Date.now() };
            gameState.harbor.piles.push(newCleat);
        }
        else if (this.activeTool === 'jetty') {
            this.isDragging = true; // Dragging to create size
        }
        else if (this.activeTool === 'wind') {
            this.isDragging = true;
        }
    };

    private handleMouseMove = (e: MouseEvent) => {
        const rect = this.canvas.getBoundingClientRect();
        this.mousePos.x = (e.clientX - rect.left) / Constants.GAME_SCALE;
        this.mousePos.y = (e.clientY - rect.top) / Constants.GAME_SCALE;

        if (this.isDragging && this.dragStart) {
            if (this.activeTool === 'select') {
                // Drag selected objects
                this.selectedObjects.forEach((obj, i) => {
                    const offset = this.dragOffsets[i];
                    obj.x = this.mousePos.x - offset.dx;
                    obj.y = this.mousePos.y - offset.dy;
                    // Snap to 10
                    if (!e.altKey) {
                        obj.x = Math.round(obj.x / 10) * 10;
                        obj.y = Math.round(obj.y / 10) * 10;
                    }
                });
            }
            else if (this.activeTool === 'jetty') {
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
    };

    private handleMouseUp = () => {
        if (!this.dragStart) return;

        if (this.activeTool === 'jetty' && this.ghostJetty) {
            if (this.ghostJetty.w > 5 && this.ghostJetty.h > 5) {
                gameState.harbor.jetties.push({ ...this.ghostJetty, angle: 0 });
            }
            this.ghostJetty = null;
        }
        else if (this.activeTool === 'wind' && this.isDragging) {
            const dx = this.mousePos.x - this.dragStart.x;
            const dy = this.mousePos.y - this.dragStart.y;
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;
            const force = Math.min(30, Math.hypot(dx, dy) / 10);
            gameState.harbor.wind.direction = (angle + 360) % 360;
            gameState.harbor.wind.force = parseFloat(force.toFixed(1));
        }

        this.isDragging = false;
        this.dragStart = null;
    };

    private deleteSelected() {
        const harbor = gameState.harbor;
        harbor.jetties = harbor.jetties.filter(j => !this.selectedObjects.includes(j));
        harbor.piles = harbor.piles.filter(p => !this.selectedObjects.includes(p));
        this.selectedObjects = [];
    }

    private deleteObject(obj: any) {
        const harbor = gameState.harbor;
        harbor.jetties = harbor.jetties.filter(j => j !== obj);
        harbor.piles = harbor.piles.filter(p => p !== obj);
        this.selectedObjects = this.selectedObjects.filter(o => o !== obj);
    }

    private rotateSelected() {
        this.selectedObjects.forEach(obj => {
            // Piles usually don't rotate, but jetties do
            // Wait, HarborJetty has angle? Yes.
            // HarborPile? No angle in interface usually, but JS object is flexible.
            // Let's check HarborJetty type.
            if (obj.w !== undefined) { // Heuristic for jetty
                obj.angle = ((obj.angle || 0) + 90) % 360;
                // Swap w/h for 90 deg rotation visual?
                // Current render draws generic rect rotated by angle.
                // So we just change angle.
            }
        });
    }

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

    saveHarbor() {
        const data = {
            name: gameState.harbor.name || "Custom Harbor",
            version: "1.0",
            wind: gameState.harbor.wind,
            jetties: gameState.harbor.jetties,
            piles: gameState.harbor.piles,
            mooringSpots: [] // Preserved logic
        };

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'harbor.hbr';
        a.click();
        URL.revokeObjectURL(url);
    }

    loadHarbor(data: any) {
        if (!data || !data.jetties || !data.piles) {
            alert("Ongeldig haven bestand!");
            return;
        }
        gameState.harbor.name = data.name || "Custom";
        gameState.harbor.wind = data.wind || { force: 0, direction: 0 };
        gameState.harbor.jetties = data.jetties;
        gameState.harbor.piles = data.piles;
        this.selectedObjects = []; // Clear selection
    }

    draw(ctx: CanvasRenderingContext2D) {
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

        // Draw Selection Halo
        if (this.selectedObjects.length > 0) {
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 3]);
            this.selectedObjects.forEach(obj => {
                if (obj.w !== undefined) {
                    // Jetty
                    ctx.strokeRect(obj.x - 4, obj.y - 4, obj.w + 8, obj.h + 8);
                } else {
                    // Pile
                    ctx.beginPath();
                    ctx.arc(obj.x, obj.y, 12, 0, Math.PI * 2);
                    ctx.stroke();
                }
            });
            ctx.setLineDash([]);
        }
    }
}

export const editor = new HarborEditor('simCanvas');
