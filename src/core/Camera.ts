import { GameState } from './GameState';
import { Constants } from './Constants';

/**
 * Camera: Manual zoom and pan, plus a 'follow' mode.
 */
export class Camera {
    public x: number = 0;
    public y: number = 0;
    public zoom: number = 1.0; // 1.0 is exact native harbor view like editor
    public active: boolean = true;
    public mode: 'follow' | 'free' = 'follow';

    public zoomMin: number = 1.0; // Dynamically calculated max zoom out
    private readonly ZOOM_MAX = 3.0; // Max zoom in
    private viewportW: number = 800;
    private viewportH: number = 600;

    private followSmoothness: number = 0.1;
    
    // Drag/Pan state
    private isDragging: boolean = false;
    private lastDragX: number = 0;
    private lastDragY: number = 0;

    constructor() {
        this.setupControls();
    }

    private setupControls() {
        // Desktop Scroll / Drag
        window.addEventListener('wheel', (e) => {
            if (!this.active) return;
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            this.setZoom(this.zoom * delta);
        }, { passive: false });

        window.addEventListener('mousedown', (e) => {
            if (!this.active || e.target !== document.getElementById('simCanvas')) return;
            this.isDragging = true;
            this.lastDragX = e.clientX;
            this.lastDragY = e.clientY;
        });

        window.addEventListener('mousemove', (e) => {
            if (!this.active || !this.isDragging) return;
            const dx = (e.clientX - this.lastDragX) / (Constants.GAME_SCALE * this.zoom);
            const dy = (e.clientY - this.lastDragY) / (Constants.GAME_SCALE * this.zoom);
            
            this.x -= dx;
            this.y -= dy;
            this.mode = 'free'; // Break out of follow mode
            
            this.lastDragX = e.clientX;
            this.lastDragY = e.clientY;
        });

        window.addEventListener('mouseup', () => this.isDragging = false);

        // Mobile Pinch / Touch Drag
        let lastPinchDist = 0;
        let activeTouches = 0;

        window.addEventListener('touchstart', (e) => {
            if (!this.active || e.target !== document.getElementById('simCanvas')) return;
            activeTouches = e.touches.length;
            
            if (activeTouches === 1) {
                this.isDragging = true;
                this.lastDragX = e.touches[0].clientX;
                this.lastDragY = e.touches[0].clientY;
            } else if (activeTouches === 2) {
                this.isDragging = false; // prioritize pinch over drag
                lastPinchDist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
            }
        }, { passive: true });

        window.addEventListener('touchmove', (e) => {
            if (!this.active) return;
            
            if (e.touches.length === 1 && this.isDragging) {
                const dx = (e.touches[0].clientX - this.lastDragX) / (Constants.GAME_SCALE * this.zoom);
                const dy = (e.touches[0].clientY - this.lastDragY) / (Constants.GAME_SCALE * this.zoom);
                
                if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
                    this.x -= dx;
                    this.y -= dy;
                    this.mode = 'free';
                }
                
                this.lastDragX = e.touches[0].clientX;
                this.lastDragY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                const dist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                if (lastPinchDist > 0) {
                    const ratio = dist / lastPinchDist;
                    this.setZoom(this.zoom * ratio);
                }
                lastPinchDist = dist;
            }
        }, { passive: true });

        window.addEventListener('touchend', (e) => {
            activeTouches = e.touches.length;
            if (activeTouches === 0) this.isDragging = false;
        });
    }

    private setZoom(newZoom: number) {
        this.zoom = Math.min(this.ZOOM_MAX, Math.max(this.zoomMin, newZoom));
    }

    public setViewport(w: number, h: number) {
        this.viewportW = w;
        this.viewportH = h;
        
        // Mobile screens are narrow, calculate the zoom required to see at least 1200 units width
        const minRequiredWorldW = 1200;
        const currentWorldWAtZoom1 = w / Constants.GAME_SCALE;
        
        if (currentWorldWAtZoom1 < minRequiredWorldW) {
            this.zoomMin = currentWorldWAtZoom1 / minRequiredWorldW;
        } else {
            this.zoomMin = 1.0;
        }

        if (this.zoom < this.zoomMin) {
            this.zoom = this.zoomMin;
        }
    }

    /** Reset to follow boat */
    public recenter() {
        this.mode = 'follow';
        this.zoom = 1.0; 
    }

    public update(gameState: GameState) {
        const boat = gameState.boat;

        if (this.mode === 'follow') {
            const targetX = boat.x;
            const targetY = boat.y;

            if (this.x === 0 && this.y === 0) {
                this.x = targetX;
                this.y = targetY;
            } else {
                this.x += (targetX - this.x) * this.followSmoothness;
                this.y += (targetY - this.y) * this.followSmoothness;
            }
        }

        // --- CONSTRAIN CAMERA ---
        // Let's establish the bounds of the "scene".
        // On desktop, the scene is exactly the viewport size at zoom=1.0.
        // On mobile, to see the whole scene we need to pretend the scene is at least 1200 x 800.
        const sceneW = Math.max(1200, this.viewportW / Constants.GAME_SCALE);
        const sceneH = Math.max(800, this.viewportH / Constants.GAME_SCALE);
        
        // Current visible dimensions
        const viewW_world = (this.viewportW / Constants.GAME_SCALE) / this.zoom;
        const viewH_world = (this.viewportH / Constants.GAME_SCALE) / this.zoom;
        
        // Boundaries so the camera never shows space outside [0, sceneW] and [0, sceneH]
        const minX = viewW_world / 2;
        const maxX = Math.max(minX, sceneW - (viewW_world / 2));
        
        const minY = viewH_world / 2;
        const maxY = Math.max(minY, sceneH - (viewH_world / 2));
        
        if (this.x < minX) this.x = minX;
        if (this.x > maxX) this.x = maxX; 
        
        if (this.y < minY) this.y = minY;
        if (this.y > maxY) this.y = maxY;
    }

    public applyTransform(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) {
        if (!this.active) return;
        const centerX = (canvasWidth / Constants.GAME_SCALE) / 2;
        const centerY = (canvasHeight / Constants.GAME_SCALE) / 2;
        ctx.translate(centerX, centerY);
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-this.x, -this.y);
    }

    public screenToWorld(clientX: number, clientY: number, canvasRect: DOMRect): { x: number, y: number } {
        const unscaledX = (clientX - canvasRect.left) / Constants.GAME_SCALE;
        const unscaledY = (clientY - canvasRect.top) / Constants.GAME_SCALE;
        if (!this.active) return { x: unscaledX, y: unscaledY };

        const centerX = (canvasRect.width / Constants.GAME_SCALE) / 2;
        const centerY = (canvasRect.height / Constants.GAME_SCALE) / 2;

        const worldX = (unscaledX - centerX) / this.zoom + this.x;
        const worldY = (unscaledY - centerY) / this.zoom + this.y;

        return { x: worldX, y: worldY };
    }
}

export const camera = new Camera();
(window as any).centerCamera = () => camera.recenter();
