import { GameState } from './GameState';
import { Constants } from './Constants';

export class Camera {
    public x: number = 0;
    public y: number = 0;
    public zoom: number = 0.6; // Start zoomed out (overview)
    public active: boolean = true;

    // Manual zoom override — can be set by pinch or scroll wheel
    private manualZoom: number | null = null;
    private readonly ZOOM_MIN = 0.3;
    private readonly ZOOM_MAX = 3.0;
    
    private followSmoothness: number = 0.08;
    private zoomSmoothness: number = 0.05;
    private lookAheadFactor: number = 0.6;

    constructor() {
        this.setupZoomControls();
    }

    private setupZoomControls() {
        // Scroll-wheel zoom (desktop)
        window.addEventListener('wheel', (e) => {
            if (!this.active) return;
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            const newZoom = Math.min(this.ZOOM_MAX, Math.max(this.ZOOM_MIN, (this.manualZoom ?? this.zoom) * delta));
            this.manualZoom = newZoom;
        }, { passive: false });

        // Pinch-to-zoom (mobile)
        let lastPinchDist = 0;
        window.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                lastPinchDist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
            }
        }, { passive: true });
        window.addEventListener('touchmove', (e) => {
            if (!this.active || e.touches.length !== 2) return;
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            if (lastPinchDist > 0) {
                const ratio = dist / lastPinchDist;
                const newZoom = Math.min(this.ZOOM_MAX, Math.max(this.ZOOM_MIN, (this.manualZoom ?? this.zoom) * ratio));
                this.manualZoom = newZoom;
            }
            lastPinchDist = dist;
        }, { passive: true });
    }

    /** Call when switching levels/scenarios to reset to overview */
    public resetToOverview() {
        this.manualZoom = null;
        this.zoom = 0.4; // Snap to wide view — will smoothly zoom in when moving
        // Don't reset x/y — camera.update() will snap on first frame anyway
    }

    public update(gameState: GameState) {
        const boat = gameState.boat;

        // 1. Calculate Target Zoom
        const speed = Math.hypot(boat.vx, boat.vy);

        let targetZoom: number;

        if (this.manualZoom !== null) {
            // Player has manually overridden zoom — respect it
            targetZoom = this.manualZoom;
        } else {
            // Auto zoom: wide overview when still, zoomed in when moving
            if (speed < 5) {
                // Standing still / very slow → overview
                targetZoom = 0.5;
            } else if (speed < 20) {
                // Normal speed
                targetZoom = 0.85;
            } else {
                // Fast → zoom out to see ahead
                targetZoom = 0.65;
            }
        }

        // Smooth zoom
        this.zoom += (targetZoom - this.zoom) * this.zoomSmoothness;

        // 2. Calculate Target Position with Look-Ahead
        const lookAheadX = boat.vx * this.lookAheadFactor;
        const lookAheadY = boat.vy * this.lookAheadFactor;

        // Base target on boat + lookahead
        const targetX = boat.x + lookAheadX;
        const targetY = boat.y + lookAheadY;

        // Apply smooth follow
        // On the very first frames, snap to prevent an ugly lerp from 0,0
        if (this.x === 0 && this.y === 0) {
            this.x = targetX;
            this.y = targetY;
        } else {
            this.x += (targetX - this.x) * this.followSmoothness;
            this.y += (targetY - this.y) * this.followSmoothness;
        }
    }

    /**
     * Applies the camera transform to the canvas context.
     * Must be called AFTER the scaling of Constants.GAME_SCALE and BEFORE drawing world objects.
     */
    public applyTransform(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) {
        if (!this.active) return;
        
        // Calculate center of screen in unscaled coordinates
        const centerX = (canvasWidth / Constants.GAME_SCALE) / 2;
        const centerY = (canvasHeight / Constants.GAME_SCALE) / 2;

        // Center transformation
        ctx.translate(centerX, centerY);
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-this.x, -this.y);
    }

    /**
     * Converts a screen click (mouse event coordinates) into a world coordinate, taking camera into account.
     */
    public screenToWorld(clientX: number, clientY: number, canvasRect: DOMRect): { x: number, y: number } {
        // First convert to game canvas internal normalized coordinates (pre game-scale)
        const unscaledX = (clientX - canvasRect.left) / Constants.GAME_SCALE;
        const unscaledY = (clientY - canvasRect.top) / Constants.GAME_SCALE;

        if (!this.active) {
            return { x: unscaledX, y: unscaledY };
        }

        const centerX = (canvasRect.width / Constants.GAME_SCALE) / 2;
        const centerY = (canvasRect.height / Constants.GAME_SCALE) / 2;

        // Reverse the transforms:
        // 1. Remove center translation -> distance from center
        const fromCenterX = unscaledX - centerX;
        const fromCenterY = unscaledY - centerY;

        // 2. Remove zoom
        const unzoomedX = fromCenterX / this.zoom;
        const unzoomedY = fromCenterY / this.zoom;

        // 3. Add camera offset back
        const worldX = unzoomedX + this.x;
        const worldY = unzoomedY + this.y;

        return { x: worldX, y: worldY };
    }
}

export const camera = new Camera();
