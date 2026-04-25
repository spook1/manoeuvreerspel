import { Constants } from './Constants';
import { BoatState } from '../types';

export interface ActionState {
    // Continuous steering — set by both keyboard and touch, separately
    steerLeft: boolean;
    steerRight: boolean;

    // Triggers (cleared each frame)
    throttleUp: boolean;
    throttleDown: boolean;
    throttleStop: boolean;

    // Double taps
    throttleDoubleUp: boolean;
    throttleDoubleDown: boolean;

    // Rudder multi-tap factor: 1=10°, 2=40°, 3=75°
    rudderMultiTapFactor: number;
}

export class InputManager {
    public state: ActionState = {
        steerLeft: false,
        steerRight: false,
        throttleUp: false,
        throttleDown: false,
        throttleStop: false,
        throttleDoubleUp: false,
        throttleDoubleDown: false,
        rudderMultiTapFactor: 1
    };

    // --- Keyboard state (completely separate from touch) ---
    private keys: { [key: string]: boolean } = {};

    // --- Touch state (completely separate from keyboard) ---
    private touchSteerLeft: boolean = false;
    private touchSteerRight: boolean = false;

    // --- Direct touch overrides (new slider-based UI) ---
    /** When non-null, this value is applied directly as boat.rudder (degrees). */
    public touchRudderOverride: number | null = null;
    /** When non-null, this value is applied directly as boat.throttle. */
    public touchThrottleOverride: number | null = null;

    // Double/multi tap logic
    private lastThrottleTapTime: number = 0;
    private lastThrottleTapDir: 'up' | 'down' | null = null;

    private lastRudderTapTime: number = 0;
    private lastRudderTapDir: 'left' | 'right' | null = null;
    private rudderTapCount: number = 1;

    public onLineKey: ((key: string) => void) | null = null;

    constructor() {
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
    }

    private onKeyDown(e: KeyboardEvent) {
        if (!e.key) return;
        if (e.target instanceof HTMLElement) {
            const tag = e.target.tagName.toLowerCase();
            if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
        }

        const key = e.key.toLowerCase();
        if (e.repeat) return;

        if (e.code === 'Space') e.preventDefault();

        this.keys[key] = true;

        // Throttle triggers (keyboard only, no tap-count side-effects on rudder)
        if (['arrowup', 'w'].includes(key)) {
            const now = Date.now();
            if (this.lastThrottleTapDir === 'up' && (now - this.lastThrottleTapTime) < 250) {
                this.state.throttleDoubleUp = true;
            } else {
                this.state.throttleUp = true;
            }
            this.lastThrottleTapDir = 'up';
            this.lastThrottleTapTime = now;
        }
        if (['arrowdown', 's'].includes(key)) {
            const now = Date.now();
            if (this.lastThrottleTapDir === 'down' && (now - this.lastThrottleTapTime) < 250) {
                this.state.throttleDoubleDown = true;
            } else {
                this.state.throttleDown = true;
            }
            this.lastThrottleTapDir = 'down';
            this.lastThrottleTapTime = now;
        }
        if (e.code === 'Space') {
            this.state.throttleStop = true;
        }

        // Rudder multi-tap on keyboard (separate from touch tap count)
        if (['arrowleft', 'a'].includes(key)) {
            const now = Date.now();
            if (this.lastRudderTapDir === 'left' && (now - this.lastRudderTapTime) < 300) {
                this.rudderTapCount = Math.min(3, this.rudderTapCount + 1);
            } else {
                this.rudderTapCount = 1;
            }
            this.lastRudderTapDir = 'left';
            this.lastRudderTapTime = now;
        }
        if (['arrowright', 'd'].includes(key)) {
            const now = Date.now();
            if (this.lastRudderTapDir === 'right' && (now - this.lastRudderTapTime) < 300) {
                this.rudderTapCount = Math.min(3, this.rudderTapCount + 1);
            } else {
                this.rudderTapCount = 1;
            }
            this.lastRudderTapDir = 'right';
            this.lastRudderTapTime = now;
        }

        if (key === 'c' && (window as any).centerCamera) (window as any).centerCamera();

        this.syncCombinedSteerState();

        if (this.onLineKey) {
            this.onLineKey(key);
        }
    }

    private onKeyUp(e: KeyboardEvent) {
        if (!e.key) return;
        if (e.target instanceof HTMLElement) {
            const tag = e.target.tagName.toLowerCase();
            if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
        }

        const key = e.key.toLowerCase();
        this.keys[key] = false;

        if (e.key === 'Shift') {
            this.rudderTapCount = 1;
        }

        this.syncCombinedSteerState();
    }

    /**
     * Combines keyboard + touch steer state into the public state.
     * ONLY touches steerLeft/Right, never rudderMultiTapFactor.
     * Called after any keyboard event.
     */
    private syncCombinedSteerState() {
        this.state.steerLeft  = !!(this.keys['arrowleft'] || this.keys['a']) || this.touchSteerLeft;
        this.state.steerRight = !!(this.keys['arrowright'] || this.keys['d']) || this.touchSteerRight;
    }

    // ---------------------------------------------------------------------------
    // Touch API — called by TouchUI and (legacy) touch button components
    // ---------------------------------------------------------------------------

    public handleTouchDown(action: 'up'|'down'|'left'|'right'|'stop') {
        const now = Date.now();

        if (action === 'up') {
            if (this.lastThrottleTapDir === 'up' && (now - this.lastThrottleTapTime) < 250) {
                this.state.throttleDoubleUp = true;
            } else {
                this.state.throttleUp = true;
            }
            this.lastThrottleTapDir = 'up';
            this.lastThrottleTapTime = now;
        }

        if (action === 'down') {
            if (this.lastThrottleTapDir === 'down' && (now - this.lastThrottleTapTime) < 250) {
                this.state.throttleDoubleDown = true;
            } else {
                this.state.throttleDown = true;
            }
            this.lastThrottleTapDir = 'down';
            this.lastThrottleTapTime = now;
        }

        if (action === 'left') {
            // Release opposite first to avoid stuck state
            this.touchSteerRight = false;
            this.touchSteerLeft  = true;

            if (this.lastRudderTapDir === 'left' && (now - this.lastRudderTapTime) < 300) {
                this.rudderTapCount = Math.min(3, this.rudderTapCount + 1);
            } else {
                this.rudderTapCount = 1;
            }
            this.lastRudderTapDir = 'left';
            this.lastRudderTapTime = now;
        }

        if (action === 'right') {
            // Release opposite first to avoid stuck state
            this.touchSteerLeft  = false;
            this.touchSteerRight = true;

            if (this.lastRudderTapDir === 'right' && (now - this.lastRudderTapTime) < 300) {
                this.rudderTapCount = Math.min(3, this.rudderTapCount + 1);
            } else {
                this.rudderTapCount = 1;
            }
            this.lastRudderTapDir = 'right';
            this.lastRudderTapTime = now;
        }

        if (action === 'stop') {
            this.state.throttleStop = true;
        }

        this.state.rudderMultiTapFactor = this.rudderTapCount;
        this.syncCombinedSteerState();

        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(10);
        }
    }

    public handleTouchUp(action: 'left'|'right') {
        if (action === 'left')  this.touchSteerLeft  = false;
        if (action === 'right') this.touchSteerRight = false;
        // Always sync after releasing touch
        this.syncCombinedSteerState();
    }

    /**
     * Emergency reset — call this if steer state becomes inconsistent.
     * e.g. when switching game modes.
     */
    public resetSteer() {
        this.touchSteerLeft  = false;
        this.touchSteerRight = false;
        this.keys['arrowleft'] = false;
        this.keys['arrowright'] = false;
        this.keys['a'] = false;
        this.keys['d'] = false;
        this.state.steerLeft  = false;
        this.state.steerRight = false;
        this.rudderTapCount = 1;
        this.state.rudderMultiTapFactor = 1;
    }

    // ---------------------------------------------------------------------------
    // Game-loop application
    // ---------------------------------------------------------------------------

    /**
     * Call each frame to apply current input to the boat,
     * then clear single-frame triggers.
     */
    public applyToBoat(boat: BoatState) {
        // Ensure steer state is current
        this.state.rudderMultiTapFactor = this.rudderTapCount;

        this.handleThrottle(boat);
        this.handleRudder(boat);

        // Clear one-frame triggers
        this.state.throttleUp        = false;
        this.state.throttleDown      = false;
        this.state.throttleDoubleUp  = false;
        this.state.throttleDoubleDown = false;
        this.state.throttleStop      = false;
    }

    private handleThrottle(boat: BoatState) {
        // Direct touch override takes priority
        if (this.touchThrottleOverride !== null) {
            boat.throttle = this.touchThrottleOverride;
            return;
        }

        if (this.state.throttleStop) {
            boat.throttle = 0;
        } else if (this.state.throttleDoubleUp) {
            boat.throttle = Math.min(Constants.MAX_THROTTLE, boat.throttle + 0.40);
        } else if (this.state.throttleUp) {
            const step = Math.abs(boat.throttle) < 0.16 ? 0.027 : 0.067;
            const current = Math.round(boat.throttle / 0.01) * 0.01;
            boat.throttle = Math.min(Constants.MAX_THROTTLE, current + step);
        } else if (this.state.throttleDoubleDown) {
            boat.throttle = Math.max(-Constants.MAX_THROTTLE, boat.throttle - 0.40);
        } else if (this.state.throttleDown) {
            const step = Math.abs(boat.throttle) < 0.16 ? 0.027 : 0.067;
            const current = Math.round(boat.throttle / 0.01) * 0.01;
            boat.throttle = Math.max(-Constants.MAX_THROTTLE, current - step);
        }
    }

    private handleRudder(boat: BoatState) {
        // Direct touch override takes priority
        if (this.touchRudderOverride !== null) {
            boat.rudder = this.touchRudderOverride;
            return;
        }

        const factor = this.state.rudderMultiTapFactor;
        const maxRudder = factor === 1 ? 10 : factor === 2 ? 40 : 75;

        if (this.state.steerLeft) {
            boat.rudder = -maxRudder;
        } else if (this.state.steerRight) {
            boat.rudder = maxRudder;
        } else {
            // Auto-recenter rudder towards 0
            const returnRate = 10 * Constants.DT * 60 * 0.3; // ~3 deg/frame
            if (boat.rudder > 0) {
                boat.rudder = Math.max(0, boat.rudder - returnRate);
            } else if (boat.rudder < 0) {
                boat.rudder = Math.min(0, boat.rudder + returnRate);
            }
        }
    }
}

export const input = new InputManager();
