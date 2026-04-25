import { input } from '../core/Input';
import { Constants } from '../core/Constants';

export class TouchUI {
    private container?: HTMLDivElement;
    private isTouchDevice: boolean;
    private rudderLabel?: HTMLSpanElement;
    private throttleThumb?: HTMLDivElement;
    private throttleTrack?: HTMLDivElement;
    private throttleLabel?: HTMLSpanElement;
    private gearButtons: HTMLDivElement[] = [];
    private currentGear: 'forward' | 'neutral' | 'reverse' = 'neutral';

    constructor() {
        this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        if (!this.isTouchDevice) return;

        this.container = document.createElement('div');
        this.container.id = 'touch-ui-container';
        this.injectStyles();
        this.buildRudderSlider();
        this.buildThrottleLever();
        document.body.appendChild(this.container);
        this.container.style.display = 'none';
    }

    private injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #touch-ui-container {
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                pointer-events: none;
                z-index: 1000;
            }

            /* === RUDDER SLIDER (bottom-left) === */
            .rudder-panel {
                position: absolute;
                bottom: calc(env(safe-area-inset-bottom, 0px) + 16px);
                left: calc(env(safe-area-inset-left, 0px) + 16px);
                width: 240px;
                padding: 12px 16px 8px;
                background: rgba(10, 25, 50, 0.65);
                border: 1px solid rgba(100, 150, 255, 0.15);
                border-radius: 14px;
                backdrop-filter: blur(8px);
                pointer-events: auto;
                touch-action: none;
                box-shadow: 0 4px 16px rgba(0,0,0,0.3);
            }
            .rudder-scale {
                display: flex;
                justify-content: space-between;
                font-size: 9px;
                color: rgba(203,213,225,0.6);
                letter-spacing: 0.5px;
                margin-bottom: 6px;
                font-family: 'Courier New', monospace;
            }
            .rudder-track {
                position: relative;
                height: 8px;
                background: rgba(255,255,255,0.08);
                border-radius: 4px;
                margin: 0 20px;
            }
            .rudder-track::after {
                content: '';
                position: absolute;
                left: 50%;
                top: -4px;
                width: 2px;
                height: 16px;
                background: rgba(96,165,250,0.5);
                transform: translateX(-50%);
                border-radius: 1px;
            }
            .rudder-thumb {
                position: absolute;
                top: 50%;
                left: 50%;
                width: 32px;
                height: 32px;
                background: radial-gradient(circle at 40% 35%, #60a5fa, #2563eb);
                border: 2px solid rgba(255,255,255,0.3);
                border-radius: 50%;
                transform: translate(-50%, -50%);
                box-shadow: 0 2px 10px rgba(37,99,235,0.5);
                transition: box-shadow 0.15s;
            }
            .rudder-thumb.active {
                box-shadow: 0 2px 18px rgba(96,165,250,0.8);
                border-color: rgba(255,255,255,0.6);
            }
            .rudder-value {
                text-align: center;
                font-size: 12px;
                font-weight: 700;
                color: #e0f2fe;
                margin-top: 6px;
                font-family: 'Courier New', monospace;
                letter-spacing: 0.5px;
            }

            /* === THROTTLE LEVER (bottom-right) === */
            .throttle-panel {
                position: absolute;
                bottom: calc(env(safe-area-inset-bottom, 0px) + 16px);
                right: calc(env(safe-area-inset-right, 0px) + 16px);
                display: flex;
                gap: 8px;
                align-items: stretch;
                pointer-events: auto;
                touch-action: none;
            }
            .gear-column {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            .gear-btn {
                padding: 10px 14px;
                font-size: 11px;
                font-weight: 700;
                color: #94a3b8;
                background: rgba(10, 25, 50, 0.65);
                border: 1px solid rgba(100, 150, 255, 0.15);
                border-radius: 10px;
                backdrop-filter: blur(8px);
                text-align: center;
                cursor: pointer;
                transition: all 0.15s;
                user-select: none;
                -webkit-user-select: none;
                letter-spacing: 0.3px;
                min-width: 76px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            }
            .gear-btn.active-forward {
                background: rgba(34, 197, 94, 0.25);
                border-color: rgba(34, 197, 94, 0.5);
                color: #4ade80;
            }
            .gear-btn.active-neutral {
                background: rgba(250, 204, 21, 0.2);
                border-color: rgba(250, 204, 21, 0.4);
                color: #fde047;
            }
            .gear-btn.active-reverse {
                background: rgba(239, 68, 68, 0.2);
                border-color: rgba(239, 68, 68, 0.4);
                color: #f87171;
            }
            .throttle-slider-panel {
                width: 52px;
                height: 160px;
                background: rgba(10, 25, 50, 0.65);
                border: 1px solid rgba(100, 150, 255, 0.15);
                border-radius: 14px;
                backdrop-filter: blur(8px);
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 16px rgba(0,0,0,0.3);
            }
            .throttle-track {
                position: relative;
                width: 8px;
                height: 120px;
                background: rgba(255,255,255,0.08);
                border-radius: 4px;
            }
            .throttle-fill {
                position: absolute;
                bottom: 0;
                left: 0;
                width: 100%;
                background: rgba(96,165,250,0.4);
                border-radius: 4px;
                transition: height 0.05s;
            }
            .throttle-thumb {
                position: absolute;
                bottom: 0;
                left: 50%;
                width: 36px;
                height: 20px;
                background: linear-gradient(180deg, #60a5fa, #2563eb);
                border: 2px solid rgba(255,255,255,0.3);
                border-radius: 6px;
                transform: translate(-50%, 50%);
                box-shadow: 0 2px 10px rgba(37,99,235,0.5);
                transition: box-shadow 0.15s;
            }
            .throttle-thumb.active {
                box-shadow: 0 2px 18px rgba(96,165,250,0.8);
                border-color: rgba(255,255,255,0.6);
            }
            .throttle-pct {
                position: absolute;
                bottom: 4px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 10px;
                font-weight: 700;
                color: rgba(203,213,225,0.7);
                font-family: 'Courier New', monospace;
            }

            @media (max-width: 600px) {
                .rudder-panel { width: 200px; }
                .throttle-slider-panel { height: 140px; }
                .throttle-track { height: 100px; }
            }
        `;
        document.head.appendChild(style);
    }

    // ──────────────────────────────────────
    //  RUDDER SLIDER
    // ──────────────────────────────────────
    private buildRudderSlider() {
        const panel = document.createElement('div');
        panel.className = 'rudder-panel';

        // Scale labels
        const scale = document.createElement('div');
        scale.className = 'rudder-scale';
        scale.innerHTML = '<span>-75° BB</span><span>0°</span><span>+75° SB</span>';
        panel.appendChild(scale);

        // Track
        const track = document.createElement('div');
        track.className = 'rudder-track';

        const thumb = document.createElement('div');
        thumb.className = 'rudder-thumb';
        track.appendChild(thumb);
        panel.appendChild(track);

        // Value label
        const label = document.createElement('div');
        label.className = 'rudder-value';
        label.textContent = '0°';
        this.rudderLabel = label;
        panel.appendChild(label);

        this.setupRudderTouch(track, thumb);
        this.container!.appendChild(panel);
    }

    private setupRudderTouch(track: HTMLDivElement, thumb: HTMLDivElement) {
        let isDragging = false;

        const updateFromPointer = (clientX: number) => {
            const rect = track.getBoundingClientRect();
            const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
            const degrees = Math.round((ratio - 0.5) * 150); // -75 to +75
            const clamped = Math.max(-75, Math.min(75, degrees));

            const pct = ((clamped + 75) / 150) * 100;
            thumb.style.left = pct + '%';
            input.touchRudderOverride = clamped;

            if (this.rudderLabel) {
                const sign = clamped > 0 ? '+' : '';
                this.rudderLabel.textContent = `${sign}${clamped}°`;
            }
        };

        const release = () => {
            if (!isDragging) return;
            isDragging = false;
            thumb.classList.remove('active');
            // Snap back to center
            thumb.style.left = '50%';
            input.touchRudderOverride = 0;
            if (this.rudderLabel) this.rudderLabel.textContent = '0°';
            // After a short delay, release override so keyboard can take over
            setTimeout(() => {
                if (!isDragging) input.touchRudderOverride = null;
            }, 300);
        };

        track.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            isDragging = true;
            thumb.classList.add('active');
            try { track.setPointerCapture(e.pointerId); } catch {}
            updateFromPointer(e.clientX);
            if (navigator.vibrate) navigator.vibrate(5);
        });

        track.addEventListener('pointermove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            updateFromPointer(e.clientX);
        });

        track.addEventListener('pointerup', release);
        track.addEventListener('pointercancel', release);
        track.addEventListener('lostpointercapture', release);
    }

    // ──────────────────────────────────────
    //  THROTTLE LEVER
    // ──────────────────────────────────────
    private buildThrottleLever() {
        const panel = document.createElement('div');
        panel.className = 'throttle-panel';

        // Gear buttons
        const gearCol = document.createElement('div');
        gearCol.className = 'gear-column';

        const gears: { label: string; gear: 'forward' | 'neutral' | 'reverse' }[] = [
            { label: 'Vooruit', gear: 'forward' },
            { label: 'Neutraal', gear: 'neutral' },
            { label: 'Achteruit', gear: 'reverse' },
        ];

        for (const g of gears) {
            const btn = document.createElement('div');
            btn.className = 'gear-btn';
            btn.textContent = g.label;
            if (g.gear === 'neutral') btn.classList.add('active-neutral');

            btn.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                this.setGear(g.gear);
                if (navigator.vibrate) navigator.vibrate(10);
            });

            this.gearButtons.push(btn);
            gearCol.appendChild(btn);
        }
        panel.appendChild(gearCol);

        // Vertical slider
        const sliderPanel = document.createElement('div');
        sliderPanel.className = 'throttle-slider-panel';

        const track = document.createElement('div');
        track.className = 'throttle-track';
        this.throttleTrack = track;

        const fill = document.createElement('div');
        fill.className = 'throttle-fill';
        fill.style.height = '0%';
        track.appendChild(fill);

        const thumb = document.createElement('div');
        thumb.className = 'throttle-thumb';
        this.throttleThumb = thumb;
        track.appendChild(thumb);

        sliderPanel.appendChild(track);

        const pct = document.createElement('div');
        pct.className = 'throttle-pct';
        pct.textContent = '0%';
        this.throttleLabel = pct;
        sliderPanel.appendChild(pct);

        this.setupThrottleTouch(track, thumb, fill);
        panel.appendChild(sliderPanel);

        this.container!.appendChild(panel);
    }

    private setGear(gear: 'forward' | 'neutral' | 'reverse') {
        this.currentGear = gear;

        // Update gear button visuals
        const classes = ['active-forward', 'active-neutral', 'active-reverse'];
        const gearNames: ('forward' | 'neutral' | 'reverse')[] = ['forward', 'neutral', 'reverse'];
        for (let i = 0; i < this.gearButtons.length; i++) {
            this.gearButtons[i].classList.remove(...classes);
            if (gearNames[i] === gear) {
                this.gearButtons[i].classList.add(`active-${gear}`);
            }
        }

        // Reset slider visuals
        if (this.throttleThumb) this.throttleThumb.style.bottom = '0';
        const fill = this.throttleTrack?.querySelector('.throttle-fill') as HTMLDivElement;
        if (fill) fill.style.height = '0%';
        if (this.throttleLabel) this.throttleLabel.textContent = '0%';

        // Set throttle
        if (gear === 'neutral') {
            input.touchThrottleOverride = 0;
        } else {
            input.touchThrottleOverride = 0;
        }
    }

    private setupThrottleTouch(track: HTMLDivElement, thumb: HTMLDivElement, fill: HTMLDivElement) {
        let isDragging = false;

        const updateFromPointer = (clientY: number) => {
            if (this.currentGear === 'neutral') return;

            const rect = track.getBoundingClientRect();
            // bottom = 0%, top = 100%
            const ratio = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));

            const pctStr = Math.round(ratio * 100) + '%';
            thumb.style.bottom = pctStr;
            fill.style.height = pctStr;
            if (this.throttleLabel) this.throttleLabel.textContent = pctStr;

            // Apply throttle
            const maxT = Constants.MAX_THROTTLE;
            if (this.currentGear === 'forward') {
                input.touchThrottleOverride = ratio * maxT;
            } else {
                input.touchThrottleOverride = -(ratio * maxT);
            }

            // Color the fill based on gear
            if (this.currentGear === 'forward') {
                fill.style.background = `rgba(34, 197, 94, ${0.3 + ratio * 0.4})`;
            } else {
                fill.style.background = `rgba(239, 68, 68, ${0.3 + ratio * 0.4})`;
            }
        };

        const release = () => {
            if (!isDragging) return;
            isDragging = false;
            thumb.classList.remove('active');
            // Keep current throttle position (don't reset on release)
        };

        track.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            if (this.currentGear === 'neutral') return;
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

    public syncVisibility(gameMode: string) {
        if (!this.isTouchDevice) return;
        if (gameMode === 'game' || gameMode === 'practice') {
            this.container!.style.display = 'block';
        } else {
            this.container!.style.display = 'none';
            // Clear overrides when leaving gameplay
            input.touchRudderOverride = null;
            input.touchThrottleOverride = null;
        }
    }
}

export const touchUI = new TouchUI();
