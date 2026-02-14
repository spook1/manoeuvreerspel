import { BoatState, Line, Particle, BrokenLineParticle, Coin } from '../types';
import { HarborData, DEFAULT_HARBORS } from '../data/harbors';

export class GameState {
    boat: BoatState;
    harbor: HarborData;
    gameMode: 'practice' | 'game' | 'edit' = 'practice';
    currentLevel: number = 1;
    score: number = 100;
    lines: Line[] = [];
    propwashParticles: Particle[] = [];
    brokenLineParticles: BrokenLineParticle[] = [];

    // Click-to-attach line state
    selectedPrefix: string | null = null;

    // Flag for delayed line breaking (set in physics, executed after)
    shouldBreakLines: boolean = false;

    // Line break speed threshold (knots)
    lineBreakSpeed: number = 6;

    // World entities (runtime)
    jetties: { x: number, y: number, w: number, h: number }[] = [];
    piles: { x: number, y: number, type: 'cleat' | 'pile', id: number }[] = [];
    coins: Coin[] = [];

    // Debug / Visualization
    showForces: boolean = false;
    debugVectors: { x: number, y: number, vx: number, vy: number, color: string }[] = [];

    // Scoring
    lastLinePenaltyTime: number = 0;

    constructor() {
        this.boat = {
            x: 200,
            y: 400,
            heading: 0,
            vx: 0,
            vy: 0,
            omega: 0,
            length: 72,
            width: 24,
            throttle: 0,
            rudder: 0,
            propDirection: 'rechts'
        };
        this.harbor = DEFAULT_HARBORS[0];
    }

    resetBoat() {
        this.boat.x = 200;
        this.boat.y = 400;
        this.boat.vx = 0; this.boat.vy = 0;
        this.boat.heading = 0; this.boat.omega = 0;
        this.boat.throttle = 0;
        this.boat.rudder = 0;
        this.lines = [];
        this.propwashParticles = [];
        this.brokenLineParticles = [];
        this.shouldBreakLines = false;
    }
}

export const gameState = new GameState();
