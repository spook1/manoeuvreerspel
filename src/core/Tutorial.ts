import { GameState } from './GameState';

export interface TutorialCoin {
    x: number;
    y: number;
    collected: boolean;
    radius: number;
}

export interface TutorialStep {
    title: string;
    instruction: string;
    coins: TutorialCoin[];
    /** Called when step starts — set boat position, wind, etc. */
    setup: (gs: GameState) => void;
    /** Check if step is complete — returns true when done */
    checkComplete: (gs: GameState, tutorial: Tutorial) => boolean;
    /** Optional: extra condition text shown below instruction */
    hint?: string;
}

export class Tutorial {
    active: boolean = false;
    currentStep: number = 0;
    steps: TutorialStep[] = [];
    /** Coins for the current step (live state) */
    coins: TutorialCoin[] = [];
    /** Mooring spot for step 8 */
    mooringTarget: { x: number, y: number, w: number, h: number } | null = null;
    /** Time the current step started */
    stepStartTime: number = 0;
    /** Collect radius */
    collectRadius: number = 18;

    constructor() {
        this.buildSteps();
    }

    private buildSteps() {
        this.steps = [
            // Step 1: Go forward
            {
                title: 'Stap 1: Vooruit varen',
                instruction: 'Druk op ⬆️ (pijltje omhoog) om gas te geven.\nVaar naar de munt!',
                coins: [{ x: 400, y: 400, collected: false, radius: 10 }],
                setup: (gs) => {
                    gs.boat.x = 200; gs.boat.y = 400;
                    gs.boat.heading = 0; // Facing right
                    gs.boat.vx = 0; gs.boat.vy = 0; gs.boat.omega = 0;
                    gs.boat.throttle = 0; gs.boat.rudder = 0;
                    if (gs.harbor.wind) gs.harbor.wind.force = 0; else gs.harbor.wind = { direction: 0, force: 0 };
                    gs.lines = [];
                },
                checkComplete: (_gs, tut) => tut.allCoinsCollected()
            },

            // Step 2: Turn
            {
                title: 'Stap 2: Sturen',
                instruction: 'Gebruik ⬅️ ➡️ (pijltjes) om te sturen.\nVaar naar de munt!',
                coins: [{ x: 350, y: 280, collected: false, radius: 10 }],
                setup: (gs) => {
                    // Keep current position, just add the coin
                    if (gs.harbor.wind) gs.harbor.wind.force = 0; else gs.harbor.wind = { direction: 0, force: 0 };
                },
                checkComplete: (_gs, tut) => tut.allCoinsCollected()
            },

            // Step 3: Reverse
            {
                title: 'Stap 3: Achteruit varen',
                instruction: 'Druk SPATIE voor neutraal.\nDruk ⬇️ voor achteruit.\nVaar naar de munt achter je!',
                coins: [], // Will be placed behind boat dynamically
                setup: (gs) => {
                    // Place coin behind the boat (opposite of heading)
                    const behindX = gs.boat.x - Math.cos(gs.boat.heading) * 150;
                    const behindY = gs.boat.y - Math.sin(gs.boat.heading) * 150;
                    this.coins = [{ x: behindX, y: Math.max(180, Math.min(500, behindY)), collected: false, radius: 10 }];
                    if (gs.harbor.wind) gs.harbor.wind.force = 0; else gs.harbor.wind = { direction: 0, force: 0 };
                },
                checkComplete: (_gs, tut) => tut.allCoinsCollected()
            },

            // Step 4: Prop walk
            {
                title: 'Stap 4: Schroefeffect',
                instruction: 'Let op: achteruit heeft de boot een zijwaartse afwijking!\nCorrigeer met je roer en pak de munten.',
                hint: '💡 Dit heet "schroefeffect" — de schroef duwt de achterkant opzij.',
                coins: [], // Set dynamically
                setup: (gs) => {
                    // Place 3 coins in a line behind the boat
                    const h = gs.boat.heading;
                    const coins: TutorialCoin[] = [];
                    for (let i = 1; i <= 3; i++) {
                        coins.push({
                            x: gs.boat.x - Math.cos(h) * (80 * i),
                            y: Math.max(180, Math.min(500, gs.boat.y - Math.sin(h) * (80 * i))),
                            collected: false, radius: 10
                        });
                    }
                    this.coins = coins;
                    if (gs.harbor.wind) gs.harbor.wind.force = 0; else gs.harbor.wind = { direction: 0, force: 0 };
                },
                checkComplete: (_gs, tut) => tut.allCoinsCollected()
            },

            // Step 5: Quick forward (surprise coin in front while going backward)
            {
                title: 'Stap 5: Snel vooruit!',
                instruction: 'Snel omschakelen!\nDruk SPATIE → dan SNEL 2x ⬆️ (dubbelklik = sneller gassen).\nPak de munt!',
                hint: '💡 Dubbelklik op ⬆️ binnen 250ms geeft 75% gas i.p.v. 50%.',
                coins: [], // Set dynamically
                setup: (gs) => {
                    // Place coin far ahead of boat
                    const h = gs.boat.heading;
                    // Coin is forward of current pos
                    this.coins = [{
                        x: gs.boat.x + Math.cos(h) * 250,
                        y: Math.max(180, Math.min(500, gs.boat.y + Math.sin(h) * 250)),
                        collected: false, radius: 10
                    }];
                },
                checkComplete: (_gs, tut) => tut.allCoinsCollected()
            },

            // Step 6: Sharp turns
            {
                title: 'Stap 6: Scherpe bochten',
                instruction: 'Dubbelklik ⬅️ of ➡️ voor een grote roeruitslag!\n2x = 45°, 3x = 75° roer.\nVerzamel de munten!',
                coins: [], // Set dynamically in a zig-zag
                setup: (gs) => {
                    // Place coins in a zig-zag pattern requiring sharp turns
                    const startX = gs.boat.x;
                    const startY = gs.boat.y;
                    this.coins = [
                        { x: startX + 120, y: startY - 80, collected: false, radius: 10 },
                        { x: startX + 240, y: startY + 80, collected: false, radius: 10 },
                        { x: startX + 360, y: startY - 60, collected: false, radius: 10 },
                    ];
                    if (gs.harbor.wind) gs.harbor.wind.force = 0; else gs.harbor.wind = { direction: 0, force: 0 };
                },
                checkComplete: (_gs, tut) => tut.allCoinsCollected()
            },

            // Step 7: Mooring!
            {
                title: 'Stap 7: Aanleggen!',
                instruction: 'Vaar naar de groene aanlegplek.\nLeg de boot stil op de plek.\nKlik een kikker (✕) op de boot → klik op een paal om vast te maken.\nMaak minstens 2 lijnen vast!',
                hint: '🟡 Klik op een kikker → 📍 klik op een paal.',
                coins: [],
                setup: (gs) => {
                    this.coins = [];
                    gs.lines = [];
                    // Mooring target near the quay
                    this.mooringTarget = {
                        x: 350, y: 155,
                        w: 80, h: 30
                    };
                    if (gs.harbor.wind) gs.harbor.wind.force = 0; else gs.harbor.wind = { direction: 0, force: 0 };
                },
                checkComplete: (gs, _tut) => {
                    // Complete when 2+ lines attached and boat nearly stopped
                    const speed = Math.hypot(gs.boat.vx, gs.boat.vy);
                    return gs.lines.length >= 2 && speed < 0.5;
                }
            },
        ];
    }

    start(gs: GameState) {
        this.active = true;
        this.currentStep = 0;
        this.startStep(gs);
        this.showOverlay();
    }

    stop() {
        this.active = false;
        this.coins = [];
        this.mooringTarget = null;
        this.hideOverlay();
    }

    startStep(gs: GameState) {
        const step = this.steps[this.currentStep];
        if (!step) { this.stop(); return; }

        // Copy coins from step definition
        this.coins = step.coins.map(c => ({ ...c }));
        this.mooringTarget = null;
        this.stepStartTime = Date.now();

        // Run setup
        step.setup(gs);

        this.updateOverlay();
    }

    nextStep(gs: GameState) {
        this.currentStep++;
        if (this.currentStep >= this.steps.length) {
            // Tutorial complete!
            this.active = false;
            this.coins = [];
            this.mooringTarget = null;
            this.showCompletionMessage();
            return;
        }
        this.startStep(gs);
    }

    /** Called every frame */
    update(gs: GameState) {
        if (!this.active) return;

        const step = this.steps[this.currentStep];
        if (!step) return;

        // Check coin collection (distance to boat center)
        for (const coin of this.coins) {
            if (coin.collected) continue;
            const dx = gs.boat.x - coin.x;
            const dy = gs.boat.y - coin.y;
            if (Math.hypot(dx, dy) < this.collectRadius) {
                coin.collected = true;
            }
        }

        // Check step completion
        if (step.checkComplete(gs, this)) {
            // Small delay before next step
            setTimeout(() => this.nextStep(gs), 800);
            // Prevent double-trigger
            step.checkComplete = () => false;
        }
    }

    allCoinsCollected(): boolean {
        return this.coins.length > 0 && this.coins.every(c => c.collected);
    }

    // === UI Overlay ===
    showOverlay() {
        const el = document.getElementById('tutorialOverlay');
        if (el) el.style.display = 'block';
    }

    hideOverlay() {
        const el = document.getElementById('tutorialOverlay');
        if (el) el.style.display = 'none';
    }

    updateOverlay() {
        const step = this.steps[this.currentStep];
        if (!step) return;

        const titleEl = document.getElementById('tutorialTitle');
        const instrEl = document.getElementById('tutorialInstruction');
        const progressEl = document.getElementById('tutorialProgress');
        const skipBtn = document.getElementById('tutorialSkipBtn');

        if (titleEl) titleEl.textContent = step.title;
        if (instrEl) {
            instrEl.innerHTML = step.instruction.replace(/\n/g, '<br>');
            if (step.hint) {
                instrEl.innerHTML += `<br><span style="color:#94a3b8; font-size:13px;">${step.hint}</span>`;
            }
        }
        if (progressEl) progressEl.textContent = `Stap ${this.currentStep + 1}/${this.steps.length}`;
        if (skipBtn) skipBtn.textContent = 'Overslaan →';
    }

    showCompletionMessage() {
        this.hideOverlay();
        const modal = document.getElementById('messageModal');
        const titleEl = document.getElementById('msgModalTitle');
        const textEl = document.getElementById('msgModalText');
        if (modal) modal.style.display = 'block';
        if (titleEl) titleEl.textContent = '🎉 Tutorial Voltooid!';
        if (textEl) textEl.textContent = 'Goed gedaan, kapitein! Je beheerst nu de basisbesturing. Tijd om te oefenen in de haven!';
    }

    /** Draw coins and mooring target on the canvas */
    draw(ctx: CanvasRenderingContext2D) {
        if (!this.active) return;

        const time = Date.now() * 0.003;

        // Draw mooring target (green transparent rectangle)
        if (this.mooringTarget) {
            const t = this.mooringTarget;
            ctx.save();
            ctx.fillStyle = 'rgba(34, 197, 94, 0.25)';
            ctx.fillRect(t.x, t.y, t.w, t.h);
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.strokeRect(t.x, t.y, t.w, t.h);
            ctx.setLineDash([]);
            ctx.restore();
        }

        // Draw coins
        for (const coin of this.coins) {
            if (coin.collected) continue;

            const bob = Math.sin(time + coin.x * 0.1) * 2; // Gentle bobbing
            const cx = coin.x;
            const cy = coin.y + bob;

            ctx.save();

            // Glow
            ctx.beginPath();
            ctx.arc(cx, cy, 14, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(251, 191, 36, 0.2)';
            ctx.fill();

            // Outer ring (pulsing)
            const pulse = 1 + Math.sin(time * 2) * 0.1;
            ctx.beginPath();
            ctx.arc(cx, cy, coin.radius * pulse, 0, Math.PI * 2);
            ctx.fillStyle = '#fbbf24';
            ctx.fill();
            ctx.strokeStyle = '#b45309';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Inner circle
            ctx.beginPath();
            ctx.arc(cx, cy, coin.radius * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = '#fde68a';
            ctx.fill();

            // $ symbol
            ctx.fillStyle = '#92400e';
            ctx.font = 'bold 10px system-ui';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('★', cx, cy);

            ctx.restore();
        }
    }
}

export const tutorial = new Tutorial();
