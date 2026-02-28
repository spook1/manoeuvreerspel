import { BoatState, Line, Particle, BrokenLineParticle, Coin } from '../types';
import { HarborData, ScenarioData, DEFAULT_HARBORS } from '../data/harbors';

export class GameState {
    boat: BoatState;
    harbor: HarborData;
    scenario: ScenarioData | null = null;  // actief scenario (gamemodus)
    gameMode: 'practice' | 'game' | 'edit' | 'harbor-edit' | 'scenario-edit' = 'practice';
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

    /** Item geselecteerd in Scenario Editor */
    selectedSEObject: any = null;

    // Scoring
    lastLinePenaltyTime: number = 0;

    constructor() {
        this.boat = {
            x: 200,
            y: 500,
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

    // ---- GETTERS die gebruik maken van scenario of haven als fallback ----

    /** Actieve wind: scenario wint van haven (practice gebruikt haven-wind) */
    get activeWind(): { direction: number; force: number } {
        if (this.scenario) return this.scenario.wind;
        return this.harbor.wind ?? { direction: 0, force: 0 };
    }

    /** Actieve aanlegplaatsen: alleen zichtbaar in game/scenario-edit, leeg in oefenmodus of haven-editor */
    get activeMooringSpots() {
        if (this.gameMode === 'practice' || this.gameMode === 'harbor-edit') return [];
        if (this.scenario) return this.scenario.mooringSpots;
        return this.harbor.mooringSpots ?? [];
    }

    /** Actieve munten: alleen zichtbaar in game/scenario-edit, leeg in oefenmodus of haven-editor */
    get activeCoins() {
        if (this.gameMode === 'practice' || this.gameMode === 'harbor-edit') return [];
        if (this.scenario) return this.scenario.coins;
        return this.harbor.coins ?? [];
    }

    /** Actieve bootstartpositie */
    get activeBoatStart() {
        return this.scenario?.boatStart ?? this.harbor.boatStart;
    }

    resetBoat() {
        const start = this.activeBoatStart;
        this.boat.x = start.x;
        this.boat.y = start.y;
        this.boat.heading = start.heading;
        this.boat.vx = 0; this.boat.vy = 0;
        this.boat.omega = 0;
        this.boat.throttle = 0;
        this.boat.rudder = 0;
        this.lines = [];
        this.propwashParticles = [];
        this.brokenLineParticles = [];
        this.shouldBreakLines = false;
    }
}

export const gameState = new GameState();
