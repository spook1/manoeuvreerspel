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
    instructionMobile?: string;
    coins: TutorialCoin[];
    setup: (gs: GameState) => void;
    checkComplete: (gs: GameState, tutorial: Tutorial) => boolean;
    hint?: string;
    hintMobile?: string;
}

export class Tutorial {
    active: boolean = false;
    currentStep: number = 0;
    steps: TutorialStep[] = [];
    coins: TutorialCoin[] = [];
    mooringTarget: { x: number; y: number; w: number; h: number } | null = null;
    stepStartTime: number = 0;
    collectRadius: number = 18;
    private stepTransitionScheduled: boolean = false;

    constructor() {
        this.buildSteps();
    }

    private buildSteps() {
        this.steps = [
            {
                title: 'Stap 1: Vooruit varen',
                instruction: 'Druk op pijltje omhoog om gas te geven.\nVaar naar de munt!',
                instructionMobile: 'Zet de gashendel omhoog naar Vooruit.\nVaar naar de munt!',
                coins: [{ x: 400, y: 400, collected: false, radius: 10 }],
                setup: (gs) => {
                    gs.boat.x = 200;
                    gs.boat.y = 400;
                    gs.boat.heading = 0;
                    gs.boat.vx = 0;
                    gs.boat.vy = 0;
                    gs.boat.omega = 0;
                    gs.boat.throttle = 0;
                    gs.boat.rudder = 0;
                    if (gs.harbor.wind) gs.harbor.wind.force = 0;
                    else gs.harbor.wind = { direction: 0, force: 0 };
                    gs.lines = [];
                },
                checkComplete: (_gs, tut) => tut.allCoinsCollected(),
            },
            {
                title: 'Stap 2: Sturen',
                instruction: 'Gebruik links en rechts om te sturen.\nVaar naar de munt!',
                instructionMobile: 'Beweeg de roerslider links of rechts om te sturen.\nVaar naar de munt!',
                coins: [{ x: 350, y: 280, collected: false, radius: 10 }],
                setup: (gs) => {
                    if (gs.harbor.wind) gs.harbor.wind.force = 0;
                    else gs.harbor.wind = { direction: 0, force: 0 };
                },
                checkComplete: (_gs, tut) => tut.allCoinsCollected(),
            },
            {
                title: 'Stap 3: Achteruit varen',
                instruction: 'Druk spatie voor neutraal.\nDruk pijltje omlaag voor achteruit.\nVaar naar de munt achter je!',
                instructionMobile: 'Zet de gashendel in Neutraal (midden).\nTrek daarna omlaag naar Achteruit.\nVaar naar de munt achter je!',
                coins: [],
                setup: (gs) => {
                    const behindX = gs.boat.x - Math.cos(gs.boat.heading) * 150;
                    const behindY = gs.boat.y - Math.sin(gs.boat.heading) * 150;
                    this.coins = [{ x: behindX, y: Math.max(180, Math.min(500, behindY)), collected: false, radius: 10 }];
                    if (gs.harbor.wind) gs.harbor.wind.force = 0;
                    else gs.harbor.wind = { direction: 0, force: 0 };
                },
                checkComplete: (_gs, tut) => tut.allCoinsCollected(),
            },
            {
                title: 'Stap 4: Schroefeffect',
                instruction: 'Let op: achteruit heeft de boot een zijwaartse afwijking!\nCorrigeer met je roer en pak de munten.',
                instructionMobile: 'Let op: achteruit heeft de boot een zijwaartse afwijking!\nCorrigeer met de roerslider en pak de munten.',
                hint: 'Dit heet schroefeffect: de schroef duwt de achterkant opzij.',
                coins: [],
                setup: (gs) => {
                    const h = gs.boat.heading;
                    const coins: TutorialCoin[] = [];
                    for (let i = 1; i <= 3; i++) {
                        coins.push({
                            x: gs.boat.x - Math.cos(h) * (80 * i),
                            y: Math.max(180, Math.min(500, gs.boat.y - Math.sin(h) * (80 * i))),
                            collected: false,
                            radius: 10,
                        });
                    }
                    this.coins = coins;
                    if (gs.harbor.wind) gs.harbor.wind.force = 0;
                    else gs.harbor.wind = { direction: 0, force: 0 };
                },
                checkComplete: (_gs, tut) => tut.allCoinsCollected(),
            },
            {
                title: 'Stap 5: Snel vooruit!',
                instruction: 'Snel omschakelen!\nDruk spatie en daarna snel 2x omhoog (dubbelklik = sneller gassen).\nPak de munt!',
                instructionMobile: 'Snel omschakelen!\nZet de hendel kort in Neutraal en direct weer naar Vooruit.\nPak de munt!',
                hint: 'Dubbelklik op omhoog binnen 250ms geeft 75% gas in plaats van 50%.',
                hintMobile: 'Hoe verder de hendel omhoog staat, hoe meer stuwkracht je hebt.',
                coins: [],
                setup: (gs) => {
                    const h = gs.boat.heading;
                    this.coins = [{
                        x: gs.boat.x + Math.cos(h) * 250,
                        y: Math.max(180, Math.min(500, gs.boat.y + Math.sin(h) * 250)),
                        collected: false,
                        radius: 10,
                    }];
                },
                checkComplete: (_gs, tut) => tut.allCoinsCollected(),
            },
            {
                title: 'Stap 6: Scherpe bochten',
                instruction: 'Dubbelklik links of rechts voor een grote roeruitslag!\n2x = 45 graden, 3x = 75 graden roer.\nVerzamel de munten!',
                instructionMobile: 'Geef grote roeruitslag met de roerslider (tot 75 graden).\nVerzamel de munten!',
                hintMobile: 'Hoe verder van het midden, hoe scherper je bocht.',
                coins: [],
                setup: (gs) => {
                    const startX = gs.boat.x;
                    const startY = gs.boat.y;
                    this.coins = [
                        { x: startX + 120, y: startY - 80, collected: false, radius: 10 },
                        { x: startX + 240, y: startY + 80, collected: false, radius: 10 },
                        { x: startX + 360, y: startY - 60, collected: false, radius: 10 },
                    ];
                    if (gs.harbor.wind) gs.harbor.wind.force = 0;
                    else gs.harbor.wind = { direction: 0, force: 0 };
                },
                checkComplete: (_gs, tut) => tut.allCoinsCollected(),
            },
            {
                title: 'Stap 7: Aanleggen!',
                instruction: 'Vaar naar de groene aanlegplek.\nLeg de boot stil op de plek.\nKlik een kikker op de boot en daarna op een paal.\nMaak minstens 2 lijnen vast!',
                instructionMobile: 'Vaar naar de groene aanlegplek.\nLeg de boot stil op de plek.\nTik een kikker op de boot en tik daarna op een paal.\nMaak minstens 2 lijnen vast!',
                hint: 'Klik op een kikker en klik daarna op een paal.',
                coins: [],
                setup: (gs) => {
                    this.coins = [];
                    gs.lines = [];
                    this.mooringTarget = { x: 350, y: 155, w: 80, h: 30 };
                    if (gs.harbor.wind) gs.harbor.wind.force = 0;
                    else gs.harbor.wind = { direction: 0, force: 0 };
                },
                checkComplete: (gs) => {
                    const speed = Math.hypot(gs.boat.vx, gs.boat.vy);
                    return gs.lines.length >= 2 && speed < 0.5;
                },
            },
        ];
    }

    start(gs: GameState) {
        this.buildSteps();
        this.active = true;
        this.currentStep = 0;
        this.startStep(gs);
        this.showOverlay();
    }

    stop() {
        this.active = false;
        this.coins = [];
        this.mooringTarget = null;
        this.stepTransitionScheduled = false;
        this.hideOverlay();
    }

    startStep(gs: GameState) {
        const step = this.steps[this.currentStep];
        if (!step) {
            this.stop();
            return;
        }

        this.coins = step.coins.map((c) => ({ ...c }));
        this.mooringTarget = null;
        this.stepStartTime = Date.now();
        this.stepTransitionScheduled = false;

        step.setup(gs);

        this.updateOverlay();
    }

    nextStep(gs: GameState) {
        this.currentStep++;
        if (this.currentStep >= this.steps.length) {
            this.active = false;
            this.coins = [];
            this.mooringTarget = null;
            this.showCompletionMessage();
            return;
        }
        this.startStep(gs);
    }

    update(gs: GameState) {
        if (!this.active) return;

        const step = this.steps[this.currentStep];
        if (!step) return;

        for (const coin of this.coins) {
            if (coin.collected) continue;
            const dx = gs.boat.x - coin.x;
            const dy = gs.boat.y - coin.y;
            if (Math.hypot(dx, dy) < this.collectRadius) {
                coin.collected = true;
            }
        }

        if (!this.stepTransitionScheduled && step.checkComplete(gs, this)) {
            this.stepTransitionScheduled = true;
            setTimeout(() => {
                if (this.active) this.nextStep(gs);
            }, 800);
        }
    }

    allCoinsCollected(): boolean {
        return this.coins.length > 0 && this.coins.every((c) => c.collected);
    }

    showOverlay() {
        const el = document.getElementById('tutorialOverlay');
        if (el) el.style.display = 'block';
    }

    hideOverlay() {
        const el = document.getElementById('tutorialOverlay');
        if (el) el.style.display = 'none';
    }

    private isTouchProfile(): boolean {
        return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    }

    private resolveInstruction(step: TutorialStep): string {
        if (this.isTouchProfile()) {
            return step.instructionMobile || step.instruction;
        }
        return step.instruction;
    }

    private resolveHint(step: TutorialStep): string | undefined {
        if (this.isTouchProfile()) {
            return step.hintMobile || step.hint;
        }
        return step.hint;
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
            const instruction = this.resolveInstruction(step);
            const hint = this.resolveHint(step);
            instrEl.innerHTML = instruction.replace(/\n/g, '<br>');
            if (hint) {
                instrEl.innerHTML += `<br><span style="color:#94a3b8; font-size:13px;">${hint}</span>`;
            }
        }
        if (progressEl) progressEl.textContent = `Stap ${this.currentStep + 1}/${this.steps.length}`;
        if (skipBtn) skipBtn.textContent = 'Overslaan ->';
    }

    showCompletionMessage() {
        this.hideOverlay();
        const modal = document.getElementById('messageModal');
        const titleEl = document.getElementById('msgModalTitle');
        const textEl = document.getElementById('msgModalText');
        if (modal) modal.style.display = 'block';
        if (titleEl) titleEl.textContent = 'Tutorial Voltooid!';
        if (textEl) textEl.textContent = 'Goed gedaan, kapitein! Je beheerst nu de basisbesturing. Tijd om te oefenen in de haven!';
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (!this.active) return;

        const time = Date.now() * 0.003;

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

        for (const coin of this.coins) {
            if (coin.collected) continue;

            const bob = Math.sin(time + coin.x * 0.1) * 2;
            const cx = coin.x;
            const cy = coin.y + bob;

            ctx.save();

            ctx.beginPath();
            ctx.arc(cx, cy, 14, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(251, 191, 36, 0.2)';
            ctx.fill();

            const pulse = 1 + Math.sin(time * 2) * 0.1;
            ctx.beginPath();
            ctx.arc(cx, cy, coin.radius * pulse, 0, Math.PI * 2);
            ctx.fillStyle = '#fbbf24';
            ctx.fill();
            ctx.strokeStyle = '#b45309';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(cx, cy, coin.radius * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = '#fde68a';
            ctx.fill();

            ctx.fillStyle = '#92400e';
            ctx.font = 'bold 10px system-ui';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('*', cx, cy);

            ctx.restore();
        }
    }
}

export const tutorial = new Tutorial();
