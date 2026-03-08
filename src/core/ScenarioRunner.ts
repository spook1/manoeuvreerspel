/**
 * ScenarioRunner — beheert de geordende afhandeling van spots en coins
 * binnen één actief scenario.
 *
 * Logica:
 * - Elk object (spot/coin) heeft een `order` nummer (1..n). Default = 1.
 * - Objecten met hetzelfde order-nummer zijn tegelijk actief ("batch").
 * - Zodra een batch volledig voltooid is → volgende batch wordt actief.
 * - Elk actief object heeft een countdown-timer (timeLimit seconden).
 * - Als de timer afloopt → scenario MISLUKT → automatisch reset.
 */

import { GameState } from './GameState';
import { HarborMooringSpot, HarborCoin } from '../data/harbors';

export interface RuntimeSpot {
    data: HarborMooringSpot;
    completed: boolean;
    activatedAt: number | null;   // timestamp ms, of null als nog niet actief
    mooredAt: number | null;       // timestamp ms van eerste aanleg op dit object
    linesCount: number;            // bijgehouden lijnen terwijl op spot
}

export interface RuntimeCoin {
    data: HarborCoin;
    completed: boolean;
    activatedAt: number | null;   // timestamp ms, of null als nog niet actief
}

export type ScenarioRunnerState = 'idle' | 'running' | 'complete' | 'failed';

const DEFAULT_SPOT_TIMELIMIT = 90;  // seconden
const DEFAULT_COIN_TIMELIMIT = 30;  // seconden
const DEFAULT_LINES_REQUIRED = 3;
const DEFAULT_MOORING_TIME = 30;

export class ScenarioRunner {
    spots: RuntimeSpot[] = [];
    coins: RuntimeCoin[] = [];

    currentOrder: number = 1;
    maxOrder: number = 1;
    state: ScenarioRunnerState = 'idle';

    /** Callback: scenario mislukt (roept GameManager op voor reset) */
    onFail?: () => void;
    /** Callback: scenario volledig voltooid */
    onComplete?: () => void;

    // ─── Init ────────────────────────────────────────────────────────────────

    start(gs: GameState) {
        const sc = gs.scenario;
        if (!sc) return;

        this.spots = sc.mooringSpots.map(s => ({
            data: s,
            completed: false,
            activatedAt: null,
            mooredAt: null,
            linesCount: 0
        }));

        this.coins = sc.coins.map(c => ({
            data: c,
            completed: false,
            activatedAt: null
        }));

        // Determine max order number
        const allOrders = [
            ...sc.mooringSpots.map(s => s.order ?? 1),
            ...sc.coins.map(c => c.order ?? 1)
        ];
        this.maxOrder = allOrders.length > 0 ? Math.max(...allOrders) : 1;
        this.currentOrder = 1;
        this.state = 'running';

        this.activateCurrentBatch();
    }

    reset() {
        this.spots = [];
        this.coins = [];
        this.currentOrder = 1;
        this.maxOrder = 1;
        this.state = 'idle';
    }

    // ─── Batch management ───────────────────────────────────────────────────

    private activateCurrentBatch() {
        const now = Date.now();
        for (const s of this.spots) {
            if (!s.completed && (s.data.order ?? 1) === this.currentOrder) {
                s.activatedAt = now;
            }
        }
        for (const c of this.coins) {
            if (!c.completed && (c.data.order ?? 1) === this.currentOrder) {
                c.activatedAt = now;
            }
        }
    }

    /** Is object (spot/coin) actief (glowing)? */
    isSpotActive(s: RuntimeSpot): boolean {
        return !s.completed && (s.data.order ?? 1) === this.currentOrder && s.activatedAt !== null;
    }

    isCoinActive(c: RuntimeCoin): boolean {
        return !c.completed && (c.data.order ?? 1) === this.currentOrder && c.activatedAt !== null;
    }

    // ─── Per-frame update ───────────────────────────────────────────────────

    update(gs: GameState, _dt: number) {
        if (this.state !== 'running') return;

        const now = Date.now();

        // ── Check timers on active batch ─────────────────────────────────────
        for (const s of this.spots) {
            if (!this.isSpotActive(s) || s.completed) continue;
            let limitSec = s.data.timeLimit ?? DEFAULT_SPOT_TIMELIMIT;
            if (limitSec === 0) limitSec = Infinity; // 0 = no time limit
            const limitMs = limitSec * 1000;

            if (s.activatedAt && limitMs !== Infinity && now - s.activatedAt > limitMs) {
                this.state = 'failed';
                console.warn(`[ScenarioRunner] Spot tijd voorbij → reset`);
                this.onFail?.();
                return;
            }
        }

        for (const c of this.coins) {
            if (!this.isCoinActive(c) || c.completed) continue;
            let limitSec = c.data.timeLimit ?? DEFAULT_COIN_TIMELIMIT;
            if (limitSec === 0) limitSec = Infinity; // 0 = no time limit
            const limitMs = limitSec * 1000;

            if (c.activatedAt && limitMs !== Infinity && now - c.activatedAt > limitMs) {
                this.state = 'failed';
                console.warn(`[ScenarioRunner] Coin tijd voorbij → reset`);
                this.onFail?.();
                return;
            }
        }

        // ── Spot voltooiing: check per actieve spot ───────────────────────────
        const boat = gs.boat;
        for (const rs of this.spots) {
            if (!this.isSpotActive(rs) || rs.completed) continue;
            const s = rs.data;
            const h = s.height ?? 40;

            // Is boot binnen het vlak?
            const cx = boat.x;
            const cy = boat.y;
            const inSpot = cx >= s.x && cx <= s.x + s.width && cy >= s.y && cy <= s.y + h;

            // Update mooring-state
            const currentLines = gs.lines.length;
            if (inSpot) {
                rs.linesCount = currentLines;
                if (rs.mooredAt === null) rs.mooredAt = now;
            } else {
                rs.mooredAt = null;
            }

            const reqLines = s.linesRequired ?? DEFAULT_LINES_REQUIRED;
            const reqTime = s.mooringTimeRequired ?? DEFAULT_MOORING_TIME;

            const mooredDuration = rs.mooredAt ? (now - rs.mooredAt) / 1000 : 0;
            const linesOk = rs.linesCount >= reqLines;
            const timeOk = mooredDuration >= reqTime;

            if (inSpot && linesOk && timeOk) {
                rs.completed = true;
                gs.score += s.points;
                console.log(`[ScenarioRunner] Spot voltooid! +${s.points} punten`);
            }
        }

        // ── Coin voltooiing: boot binnen radius ──────────────────────────────
        for (const rc of this.coins) {
            if (!this.isCoinActive(rc) || rc.completed) continue;
            const c = rc.data;
            if (Math.hypot(gs.boat.x - c.x, gs.boat.y - c.y) < 20) {
                rc.completed = true;
                gs.score += c.value;
                console.log(`[ScenarioRunner] Coin verzameld! +${c.value} punten`);
            }
        }

        // ── Check of huidige batch klaar is ──────────────────────────────────
        const batchSpots = this.spots.filter(s => (s.data.order ?? 1) === this.currentOrder);
        const batchCoins = this.coins.filter(c => (c.data.order ?? 1) === this.currentOrder);
        const batchDone = batchSpots.every(s => s.completed) && batchCoins.every(c => c.completed);

        if (batchDone) {
            if (this.currentOrder >= this.maxOrder) {
                // Alles klaar!
                this.state = 'complete';
                console.log(`[ScenarioRunner] Scenario voltooid!`);
                this.onComplete?.();
            } else {
                this.currentOrder++;
                console.log(`[ScenarioRunner] Volgende batch: order ${this.currentOrder}`);
                this.activateCurrentBatch();
            }
        }
    }

    // ─── Helpers voor rendering ──────────────────────────────────────────────

    /** Geef resterende seconds voor actieve spots/coins als percentage (0..1) */
    getSpotTimeRemaining(s: RuntimeSpot): number {
        if (!s.activatedAt) return 1;
        const limitSec = s.data.timeLimit ?? DEFAULT_SPOT_TIMELIMIT;
        if (limitSec === 0) return 1; // infinite
        const limitMs = limitSec * 1000;
        return Math.max(0, 1 - (Date.now() - s.activatedAt) / limitMs);
    }

    getCoinTimeRemaining(c: RuntimeCoin): number {
        if (!c.activatedAt) return 1;
        const limitSec = c.data.timeLimit ?? DEFAULT_COIN_TIMELIMIT;
        if (limitSec === 0) return 1; // infinite
        const limitMs = limitSec * 1000;
        return Math.max(0, 1 - (Date.now() - c.activatedAt) / limitMs);
    }

    /** Tekst voor HUD */
    get hudText(): string {
        if (this.state === 'complete') return '✅ Scenario voltooid!';
        if (this.state === 'failed') return '❌ Te laat! Opnieuw...';
        const total = this.maxOrder;
        return `Stap ${this.currentOrder} / ${total}`;
    }
}

export const scenarioRunner = new ScenarioRunner();
