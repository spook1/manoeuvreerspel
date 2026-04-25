import { input } from '../core/Input';
import { Constants } from '../core/Constants';

export class TouchUI {
    private container?: HTMLDivElement;
    private isTouchDevice: boolean;
    private rudderLabel?: HTMLElement;
    private throttleThumb?: HTMLDivElement;
    private throttleForwardFill?: HTMLDivElement;
    private throttleReverseFill?: HTMLDivElement;
    private throttleLabel?: HTMLElement;
    private throttleModeLabel?: HTMLElement;
    private lastThrottleMode: 'forward' | 'neutral' | 'reverse' = 'neutral';
    private gestureGuardsInstalled: boolean = false;

    constructor() {
        this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        if (!this.isTouchDevice) return;

        this.container = document.createElement('div');
        this.container.id = 'touch-ui-container';
        this.injectStyles();
        this.buildRudderWheel();
        this.buildThrottleLever();
        document.body.appendChild(this.container);
        this.container.style.display = 'none';
        this.installGestureGuards();
    }

    private injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #touch-ui-container {
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                pointer-events: none;
                touch-action: none;
                z-index: 1000;
            }

            /* === RUDDER WHEEL (bottom-left) === */
            .rudder-panel {
                position: absolute;
                bottom: calc(env(safe-area-inset-bottom, 0px) + 16px);
                left: calc(env(safe-area-inset-left, 0px) + 16px);
                width: 248px;
                padding: 10px 12px 8px;
                background: rgba(10, 25, 50, 0.65);
                border: 1px solid rgba(100, 150, 255, 0.15);
                border-radius: 14px;
                backdrop-filter: blur(8px);
                pointer-events: auto;
                touch-action: none;
                box-shadow: 0 4px 16px rgba(0,0,0,0.3);
            }
            .rudder-wheel-viewport {
                position: relative;
                height: 88px;
                overflow: hidden;
                border-radius: 10px;
                background: linear-gradient(180deg, rgba(2,10,24,0.58), rgba(2,10,24,0.2));
                border: 1px solid rgba(100, 150, 255, 0.14);
                touch-action: none;
            }
            .rudder-zero-mark {
                position: absolute;
                left: 50%;
                top: 4px;
                width: 2px;
                height: 22px;
                background: rgba(96,165,250,0.55);
                transform: translateX(-50%);
                border-radius: 1px;
                z-index: 3;
                pointer-events: none;
            }
            .rudder-wheel-image {
                position: absolute;
                width: 228px;
                height: 228px;
                left: 50%;
                top: 28px;
                transform: translateX(-50%) rotate(0deg);
                transform-origin: 50% 50%;
                background-image: url('/ui/helm-wheel.svg');
                background-size: contain;
                background-repeat: no-repeat;
                background-position: center;
                filter: drop-shadow(0 6px 12px rgba(0,0,0,0.35));
                transition: transform 0.18s ease-out;
                z-index: 2;
                pointer-events: none;
            }
            .rudder-wheel-image.active {
                filter: drop-shadow(0 8px 18px rgba(37,99,235,0.35));
            }
            .rudder-wheel-hit {
                position: absolute;
                inset: 0;
                z-index: 4;
                touch-action: none;
                cursor: grab;
            }
            .rudder-wheel-hit:active {
                cursor: grabbing;
            }
            .rudder-scale {
                display: flex;
                justify-content: space-between;
                font-size: 9px;
                color: rgba(203,213,225,0.6);
                letter-spacing: 0.5px;
                margin-top: 6px;
                font-family: 'Courier New', monospace;
            }
            .rudder-value {
                text-align: center;
                font-size: 12px;
                font-weight: 700;
                color: #e0f2fe;
                margin-top: 4px;
                font-family: 'Courier New', monospace;
                letter-spacing: 0.5px;
            }

            /* === THROTTLE LEVER (bottom-right) === */
            .throttle-panel {
                position: absolute;
                bottom: calc(env(safe-area-inset-bottom, 0px) + 16px);
                right: calc(env(safe-area-inset-right, 0px) + 16px);
                width: 132px;
                padding: 10px 10px 8px;
                background: rgba(10, 25, 50, 0.65);
                border: 1px solid rgba(100, 150, 255, 0.15);
                border-radius: 14px;
                backdrop-filter: blur(8px);
                box-shadow: 0 4px 16px rgba(0,0,0,0.3);
                pointer-events: auto;
                touch-action: none;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
            }
            .throttle-row {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .throttle-labels {
                height: 128px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                align-items: flex-end;
                font-size: 10px;
                font-weight: 700;
                color: rgba(203,213,225,0.75);
                letter-spacing: 0.35px;
                text-transform: uppercase;
            }
            .throttle-slider-shell {
                width: 54px;
                height: 160px;
                border-radius: 12px;
                border: 1px solid rgba(100, 150, 255, 0.16);
                background: rgba(2, 10, 24, 0.45);
                display: flex;
                align-items: center;
                justify-content: center;
                touch-action: none;
            }
            .throttle-track {
                position: relative;
                width: 10px;
                height: 128px;
                border-radius: 6px;
                background: rgba(255,255,255,0.1);
            }
            .throttle-track::after {
                content: '';
                position: absolute;
                left: 50%;
                top: 50%;
                width: 18px;
                height: 2px;
                background: rgba(250, 204, 21, 0.75);
                transform: translate(-50%, -50%);
                border-radius: 2px;
            }
            .throttle-fill-forward {
                position: absolute;
                left: 0;
                bottom: 50%;
                width: 100%;
                height: 0%;
                background: linear-gradient(180deg, rgba(34,197,94,0.6), rgba(22,163,74,0.35));
                border-radius: 6px 6px 0 0;
                transition: height 0.05s;
            }
            .throttle-fill-reverse {
                position: absolute;
                left: 0;
                top: 50%;
                width: 100%;
                height: 0%;
                background: linear-gradient(180deg, rgba(248,113,113,0.35), rgba(239,68,68,0.6));
                border-radius: 0 0 6px 6px;
                transition: height 0.05s;
            }
            .throttle-thumb {
                position: absolute;
                top: 50%;
                left: 50%;
                width: 34px;
                height: 22px;
                background: linear-gradient(180deg, #facc15, #ca8a04);
                border: 2px solid rgba(255,255,255,0.32);
                border-radius: 7px;
                transform: translate(-50%, -50%);
                box-shadow: 0 2px 10px rgba(250,204,21,0.45);
                transition: box-shadow 0.15s;
            }
            .throttle-thumb.active {
                box-shadow: 0 2px 18px rgba(255,255,255,0.7);
                border-color: rgba(255,255,255,0.7);
            }
            .throttle-state {
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.45px;
                color: #fde047;
                text-transform: uppercase;
                font-family: 'Courier New', monospace;
            }
            .throttle-pct {
                font-size: 11px;
                font-weight: 700;
                color: rgba(203,213,225,0.82);
                font-family: 'Courier New', monospace;
                line-height: 1;
            }

            @media (max-width: 600px) {
                .rudder-panel { width: 214px; }
                .rudder-wheel-viewport { height: 80px; }
                .rudder-wheel-image { width: 200px; height: 200px; top: 25px; }
                .throttle-panel { width: 120px; }
                .throttle-labels { height: 112px; }
                .throttle-slider-shell { height: 142px; }
                .throttle-track { height: 112px; }
            }
        `;
        document.head.appendChild(style);
    }

    private buildRudderWheel() {
        const panel = document.createElement('div');
        panel.className = 'rudder-panel';

        const viewport = document.createElement('div');
        viewport.className = 'rudder-wheel-viewport';

        const zeroMark = document.createElement('div');
        zeroMark.className = 'rudder-zero-mark';
        viewport.appendChild(zeroMark);

        const wheel = document.createElement('div');
        wheel.className = 'rudder-wheel-image';
        viewport.appendChild(wheel);

        const hitArea = document.createElement('div');
        hitArea.className = 'rudder-wheel-hit';
        viewport.appendChild(hitArea);

        panel.appendChild(viewport);

        const scale = document.createElement('div');
        scale.className = 'rudder-scale';
        scale.innerHTML = '<span>-75\u00B0 BB</span><span>0\u00B0</span><span>+75\u00B0 SB</span>';
        panel.appendChild(scale);

        const label = document.createElement('div');
        label.className = 'rudder-value';
        label.textContent = '0\u00B0';
        this.rudderLabel = label;
        panel.appendChild(label);

        this.setupRudderTouch(hitArea, wheel);
        this.container!.appendChild(panel);
    }

    private setupRudderTouch(hitArea: HTMLDivElement, wheel: HTMLDivElement) {
        let isDragging = false;
        let startX = 0;
        let startDeg = 0;
        let currentDeg = 0;
        const MAX_DEG = 75;
        const DEG_PER_PIXEL = 0.55;

        const applyRudder = (degrees: number) => {
            currentDeg = Math.max(-MAX_DEG, Math.min(MAX_DEG, Math.round(degrees)));
            wheel.style.transform = `translateX(-50%) rotate(${currentDeg}deg)`;
            input.touchRudderOverride = currentDeg;
            if (this.rudderLabel) {
                const sign = currentDeg > 0 ? '+' : '';
                this.rudderLabel.textContent = `${sign}${currentDeg}\u00B0`;
            }
        };

        const release = () => {
            if (!isDragging) return;
            isDragging = false;
            wheel.classList.remove('active');
            wheel.style.transition = 'transform 0.18s ease-out';
            applyRudder(0);
            input.touchRudderOverride = 0;
            if (this.rudderLabel) this.rudderLabel.textContent = '0\u00B0';
            setTimeout(() => {
                if (!isDragging) input.touchRudderOverride = null;
            }, 300);
        };

        hitArea.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            isDragging = true;
            startX = e.clientX;
            startDeg = currentDeg;
            wheel.classList.add('active');
            wheel.style.transition = 'none';
            try { hitArea.setPointerCapture(e.pointerId); } catch {}
            if (navigator.vibrate) navigator.vibrate(5);
        });

        hitArea.addEventListener('pointermove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const deltaX = e.clientX - startX;
            applyRudder(startDeg + (deltaX * DEG_PER_PIXEL));
        });

        hitArea.addEventListener('pointerup', release);
        hitArea.addEventListener('pointercancel', release);
        hitArea.addEventListener('lostpointercapture', release);
    }

    private buildThrottleLever() {
        const panel = document.createElement('div');
        panel.className = 'throttle-panel';

        const row = document.createElement('div');
        row.className = 'throttle-row';

        const labels = document.createElement('div');
        labels.className = 'throttle-labels';
        labels.innerHTML = '<span>Vooruit</span><span>Neutraal</span><span>Achteruit</span>';
        row.appendChild(labels);

        const shell = document.createElement('div');
        shell.className = 'throttle-slider-shell';

        const track = document.createElement('div');
        track.className = 'throttle-track';

        const forwardFill = document.createElement('div');
        forwardFill.className = 'throttle-fill-forward';
        track.appendChild(forwardFill);

        const reverseFill = document.createElement('div');
        reverseFill.className = 'throttle-fill-reverse';
        track.appendChild(reverseFill);

        const thumb = document.createElement('div');
        thumb.className = 'throttle-thumb';
        track.appendChild(thumb);

        shell.appendChild(track);
        row.appendChild(shell);
        panel.appendChild(row);

        const mode = document.createElement('div');
        mode.className = 'throttle-state';
        mode.textContent = 'Neutraal';
        panel.appendChild(mode);

        const pct = document.createElement('div');
        pct.className = 'throttle-pct';
        pct.textContent = '0%';
        panel.appendChild(pct);

        this.throttleThumb = thumb;
        this.throttleForwardFill = forwardFill;
        this.throttleReverseFill = reverseFill;
        this.throttleModeLabel = mode;
        this.throttleLabel = pct;

        this.setupThrottleTouch(track, thumb);
        this.setThrottleSigned(0, false);

        this.container!.appendChild(panel);
    }

    private setThrottleSigned(rawSigned: number, withHaptic: boolean) {
        const thumb = this.throttleThumb;
        const forwardFill = this.throttleForwardFill;
        const reverseFill = this.throttleReverseFill;
        if (!thumb || !forwardFill || !reverseFill) return;

        const DETENT = 0.08;
        let signed = Math.max(-1, Math.min(1, rawSigned));
        if (Math.abs(signed) < DETENT) {
            signed = 0;
        }

        const topPct = ((1 - signed) / 2) * 100;
        thumb.style.top = `${topPct}%`;

        forwardFill.style.height = `${Math.max(0, signed) * 50}%`;
        reverseFill.style.height = `${Math.max(0, -signed) * 50}%`;

        const pct = Math.round(Math.abs(signed) * 100);
        if (this.throttleLabel) {
            this.throttleLabel.textContent = `${pct}%`;
        }

        let mode: 'forward' | 'neutral' | 'reverse' = 'neutral';
        if (signed > 0) mode = 'forward';
        if (signed < 0) mode = 'reverse';

        if (this.throttleModeLabel) {
            if (mode === 'forward') {
                this.throttleModeLabel.textContent = 'Vooruit';
                this.throttleModeLabel.style.color = '#4ade80';
            } else if (mode === 'reverse') {
                this.throttleModeLabel.textContent = 'Achteruit';
                this.throttleModeLabel.style.color = '#f87171';
            } else {
                this.throttleModeLabel.textContent = 'Neutraal';
                this.throttleModeLabel.style.color = '#fde047';
            }
        }

        if (mode === 'forward') {
            thumb.style.background = 'linear-gradient(180deg, #4ade80, #16a34a)';
        } else if (mode === 'reverse') {
            thumb.style.background = 'linear-gradient(180deg, #f87171, #dc2626)';
        } else {
            thumb.style.background = 'linear-gradient(180deg, #facc15, #ca8a04)';
        }

        if (withHaptic && mode !== this.lastThrottleMode && navigator.vibrate) {
            navigator.vibrate(8);
        }
        this.lastThrottleMode = mode;

        input.touchThrottleOverride = signed * Constants.MAX_THROTTLE;
    }

    private setupThrottleTouch(track: HTMLDivElement, thumb: HTMLDivElement) {
        let isDragging = false;

        const updateFromPointer = (clientY: number) => {
            const rect = track.getBoundingClientRect();
            const ratio = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));
            const signed = (ratio - 0.5) * 2;
            this.setThrottleSigned(signed, true);
        };

        const release = () => {
            if (!isDragging) return;
            isDragging = false;
            thumb.classList.remove('active');
        };

        track.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            isDragging = true;
            thumb.classList.add('active');
            try { track.setPointerCapture(e.pointerId); } catch {}
            updateFromPointer(e.clientY);
            if (navigator.vibrate) navigator.vibrate(5);
        });

        track.addEventListener('pointermove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            updateFromPointer(e.clientY);
        });

        track.addEventListener('pointerup', release);
        track.addEventListener('pointercancel', release);
        track.addEventListener('lostpointercapture', release);
    }

    private isControlsActive(): boolean {
        return !!this.container && this.container.style.display !== 'none';
    }

    private installGestureGuards() {
        if (this.gestureGuardsInstalled) return;
        this.gestureGuardsInstalled = true;

        const shouldBlock = (target: EventTarget | null): boolean => {
            const el = target as HTMLElement | null;
            if (!el) return false;
            return !!el.closest('#touch-ui-container') || el.id === 'simCanvas';
        };

        const blockPinchLikeGesture = (e: TouchEvent) => {
            if (!this.isControlsActive()) return;
            if (e.touches.length < 2) return;
            if (!shouldBlock(e.target)) return;
            e.preventDefault();
        };

        const blockIOSGesture = (e: Event) => {
            if (!this.isControlsActive()) return;
            if (!shouldBlock(e.target)) return;
            e.preventDefault();
        };

        document.addEventListener('touchstart', blockPinchLikeGesture, { passive: false });
        document.addEventListener('touchmove', blockPinchLikeGesture, { passive: false });
        document.addEventListener('gesturestart', blockIOSGesture as EventListener, { passive: false });
        document.addEventListener('gesturechange', blockIOSGesture as EventListener, { passive: false });
        document.addEventListener('gestureend', blockIOSGesture as EventListener, { passive: false });
    }

    public syncVisibility(gameMode: string) {
        if (!this.isTouchDevice) return;

        if (gameMode === 'game' || gameMode === 'practice') {
            this.container!.style.display = 'block';
        } else {
            this.container!.style.display = 'none';
            this.setThrottleSigned(0, false);
            input.touchRudderOverride = null;
            input.touchThrottleOverride = null;
        }
    }
}

export const touchUI = new TouchUI();
