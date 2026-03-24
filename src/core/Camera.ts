import { GameState } from './GameState';
import { Constants } from './Constants';

/**
 * Camera: smooth follow, look-ahead, dynamic zoom, pinch/scroll override.
 *
 * ZOOM REFERENCE — zoom=1.0 is identiek aan het beeld vóór de camera.
 *   < 1.0 = meer van de wereld zichtbaar (uitgezoomd / overzicht)
 *   > 1.0 = dichterbij / ingezoomd
 */
export class Camera {
    public x: number = 0;
    public y: number = 0;
    public zoom: number = 1.0;
    public active: boolean = true;

    // Manual zoom override (scroll wheel / pinch)
    private manualZoom: number | null = null;
    private readonly ZOOM_MIN = 0.3;
    private readonly ZOOM_MAX = 3.0;

    private followSmoothness: number = 0.08;
    private zoomSmoothness: number = 0.04;
    private lookAheadFactor: number = 0.5;

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

    /** Reset to overview (call when loading a new scenario/level) */
    public resetToOverview() {
        this.manualZoom = null;
        this.zoom = 0.85;
        this.x = 0;
        this.y = 0;
    }

    public update(gameState: GameState) {
        const boat = gameState.boat;
        const speed = Math.hypot(boat.vx, boat.vy);

        // zoom=1.0 baseline = zelfde beeld als vóór camera
        // zoom<1.0 = meer zichtbaar (haven overzicht)
        // zoom>1.0 = ingezoomd (dichtbij)
        let targetZoom: number;

        if (this.manualZoom !== null) {
            targetZoom = this.manualZoom;
        } else if (speed < 3) {
            // Stil / nauwelijks beweging → overzicht
            targetZoom = 0.85;
        } else if (speed < 15) {
            // Rustig varen
            targetZoom = 1.0;
        } else {
            // Snelle vaart → iets meer horizon
            targetZoom = 0.9;
        }

        this.zoom += (targetZoom - this.zoom) * this.zoomSmoothness;

        // Look-ahead: camera kijkt iets voor de boot uit
        const lookAheadX = boat.vx * this.lookAheadFactor;
        const lookAheadY = boat.vy * this.lookAheadFactor;

        const targetX = boat.x + lookAheadX;
        const targetY = boat.y + lookAheadY;

        // Snap op eerste frame zodat camera niet van (0,0) lerpt
        if (this.x === 0 && this.y === 0) {
            this.x = targetX;
            this.y = targetY;
        } else {
            this.x += (targetX - this.x) * this.followSmoothness;
            this.y += (targetY - this.y) * this.followSmoothness;
        }
    }

    /**
     * Apply camera transform to ctx.
     * Aanroepen NA ctx.scale(GAME_SCALE), VOOR het tekenen van wereld-objecten.
     * zoom=1.0 → identiek beeld als vóór de camera.
     */
    public applyTransform(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) {
        if (!this.active) return;

        // Middelpunt canvas in wereld-eenheden (GAME_SCALE is al op ctx)
        const centerX = (canvasWidth / Constants.GAME_SCALE) / 2;
        const centerY = (canvasHeight / Constants.GAME_SCALE) / 2;

        ctx.translate(centerX, centerY);
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-this.x, -this.y);
    }

    /**
     * Zet schermcoördinaten om naar wereldcoördinaten (inclusief camera).
     */
    public screenToWorld(clientX: number, clientY: number, canvasRect: DOMRect): { x: number, y: number } {
        const unscaledX = (clientX - canvasRect.left) / Constants.GAME_SCALE;
        const unscaledY = (clientY - canvasRect.top) / Constants.GAME_SCALE;

        if (!this.active) {
            return { x: unscaledX, y: unscaledY };
        }

        const centerX = (canvasRect.width / Constants.GAME_SCALE) / 2;
        const centerY = (canvasRect.height / Constants.GAME_SCALE) / 2;

        const worldX = (unscaledX - centerX) / this.zoom + this.x;
        const worldY = (unscaledY - centerY) / this.zoom + this.y;

        return { x: worldX, y: worldY };
    }
}

export const camera = new Camera();
