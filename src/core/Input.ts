import { Constants } from './Constants';
import { BoatState } from '../types';

export class Input {
    keys: { [key: string]: boolean } = {};

    // Double-tap detection for throttle
    lastKeyProp: string | null = null;
    lastKeyTimeProp: number = 0;

    // Multi-tap detection for rudder
    lastRudderKey: string | null = null;
    lastRudderKeyTime: number = 0;
    rudderTapCount: number = 0;
    maxRudder: number = 20; // Dynamic: 10° (1 tap), 40° (2 taps), 75° (3 taps)

    // Callback for line key commands
    onLineKey: ((key: string) => void) | null = null;

    constructor() {
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
    }

    isDown(key: string): boolean {
        return !!this.keys[key.toLowerCase()];
    }

    /**
     * Step-based throttle handling on keydown (matches index.html)
     * - First 6 clicks (|throttle| < 0.16): small steps (0.027)
     * - After that: normal steps (0.067)
     * - Double-tap (< 250ms): jump to near max (0.40)
     */
    private handleThrottle(key: string, boat: BoatState): void {
        const now = Date.now();
        let currentStep: number;

        if (this.lastKeyProp === key && (now - this.lastKeyTimeProp) < 250) {
            currentStep = 0.40; // Double-tap: jump to near max
        } else if (Math.abs(boat.throttle) < 0.16) {
            currentStep = 0.027; // Small steps for first 6 clicks
        } else {
            currentStep = 0.067; // Normal steps after
        }
        this.lastKeyProp = key;
        this.lastKeyTimeProp = now;

        if (key === 'arrowup' || key === 'w') {
            const current = Math.round(boat.throttle / 0.01) * 0.01;
            boat.throttle = Math.min(Constants.MAX_THROTTLE, current + currentStep);
        }
        if (key === 'arrowdown' || key === 's') {
            const current = Math.round(boat.throttle / 0.01) * 0.01;
            boat.throttle = Math.max(-Constants.MAX_THROTTLE, current - currentStep);
        }
    }

    /**
     * Multi-tap rudder handling on keydown (matches index.html)
     * - 1 tap: MAX_RUDDER = 10°
     * - 2 taps (< 250ms): MAX_RUDDER = 40°
     * - 3+ taps (< 250ms): MAX_RUDDER = 75°
     */
    private handleRudderTap(key: string): void {
        const now = Date.now();
        if (this.lastRudderKey === key && (now - this.lastRudderKeyTime) < 250) {
            this.rudderTapCount++;
        } else {
            this.rudderTapCount = 1;
        }

        if (this.rudderTapCount === 1) this.maxRudder = 10;
        else if (this.rudderTapCount === 2) this.maxRudder = 40;
        else if (this.rudderTapCount >= 3) this.maxRudder = 75;

        this.lastRudderKey = key;
        this.lastRudderKeyTime = now;
    }

    private onKeyDown(e: KeyboardEvent) {
        if (!e.key) return;

        if (e.target instanceof HTMLElement) {
            const tag = e.target.tagName.toLowerCase();
            if (tag === 'input' || tag === 'textarea' || tag === 'select') {
                return;
            }
        }

        const key = e.key.toLowerCase();
        if (e.repeat) return; // Prevent key repeat for step-based controls

        // Space = neutral throttle
        if (e.code === 'Space') {
            e.preventDefault();
        }

        // Reset
        if (key === 'r') {
            // Will be handled externally
        }

        this.keys[key] = true;

        // Queue throttle keydown for step-based processing
        if (['arrowup', 'w', 'arrowdown', 's'].includes(key)) {
            this.pendingKeyDowns.push(key);
        }

        // Rudder multi-tap detection
        if (['arrowleft', 'a', 'arrowright', 'd'].includes(key)) {
            this.handleRudderTap(key);
        }

        // Line key processing
        if (this.onLineKey) {
            this.onLineKey(key);
        }
    }

    /**
     * Process throttle input. Must be called from main loop with boat reference.
     * This is separated because Input doesn't own the boat state.
     */
    processKeyDown(key: string, boat: BoatState): void {
        // Throttle step handling
        if (['arrowup', 'w', 'arrowdown', 's'].includes(key)) {
            this.handleThrottle(key, boat);
        }
    }

    private onKeyUp(e: KeyboardEvent) {
        if (!e.key) return;

        if (e.target instanceof HTMLElement) {
            const tag = e.target.tagName.toLowerCase();
            if (tag === 'input' || tag === 'textarea' || tag === 'select') {
                return;
            }
        }

        const key = e.key.toLowerCase();
        this.keys[key] = false;

        // Reset rudder max on Shift release
        if (e.key === 'Shift') {
            this.maxRudder = 20;
        }
    }

    /**
     * Process continuous input in the game loop (rudder centering, rudder setting)
     * Matches index.html handleInput()
     */
    handleInput(boat: BoatState): void {
        // Rudder — set to current MAX_RUDDER immediately
        if (this.keys['a'] || this.keys['arrowleft']) {
            boat.rudder = -this.maxRudder;
        } else if (this.keys['d'] || this.keys['arrowright']) {
            boat.rudder = this.maxRudder;
        }

        // Automatic rudder centering when no rudder key pressed
        if (!this.keys['a'] && !this.keys['d'] && !this.keys['arrowleft'] && !this.keys['arrowright']) {
            if (boat.rudder > 0) {
                boat.rudder = Math.max(0, boat.rudder - 10 * Constants.DT * 60 * 0.3);
            } else if (boat.rudder < 0) {
                boat.rudder = Math.min(0, boat.rudder + 10 * Constants.DT * 60 * 0.3);
            }
        }

        // Space = kill throttle immediately
        if (this.keys[' ']) {
            boat.throttle = 0;
        }
    }

    /**
     * Get keys that were pressed this frame (for step-based throttle).
     * Returns key names that just went down since last call.
     */
    private pendingKeyDowns: string[] = [];

    queueKeyDown(key: string): void {
        this.pendingKeyDowns.push(key);
    }

    consumeKeyDowns(): string[] {
        const result = this.pendingKeyDowns.slice();
        this.pendingKeyDowns = [];
        return result;
    }
}

export const input = new Input();
