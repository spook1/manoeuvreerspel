import { GameState } from './GameState';
import { Constants } from './Constants';

export class Camera {
    public x: number = 0;
    public y: number = 0;
    public zoom: number = 1.0;
    public active: boolean = true;
    
    // Configurable parameters
    private followSmoothness: number = 0.08;
    private zoomSmoothness: number = 0.05;
    private lookAheadFactor: number = 0.6; // How far ahead to look based on velocity
    private isMobile: boolean;

    constructor() {
        this.isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    }

    public update(gameState: GameState) {
        const boat = gameState.boat;
        
        // 1. Calculate Target Zoom
        // The smaller the screen, the more we need to zoom by default, but zooming OUT actually means making things smaller (lower zoom value).
        // Wait, on mobile the screen is physically small. But the coordinate system is fixed CSS pixels.
        // A phone is like 400px wide. With GAME_SCALE it's maybe smaller. Let's just use 1.0 for desktop and 0.8 / 1.5 logic.
        let baseZoom = this.isMobile ? 0.9 : 1.0; // Mobile might want slightly more overview
        
        let targetZoom = baseZoom;

        // Calculate speed in px/sec
        const speed = Math.hypot(boat.vx, boat.vy);

        // Dynamic Zoom: zoom out when moving fast to see further
        if (speed > 40) {
            targetZoom = baseZoom * 0.8;
        } else if (speed < 10) {
            targetZoom = baseZoom * 1.25;
        }

        // Apply smooth zoom
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
