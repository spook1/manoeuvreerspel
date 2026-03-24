import { Constants } from './Constants';
import { BoatState } from '../types';

export interface ActionState {
    // Continuous
    steerLeft: boolean;
    steerRight: boolean;

    // Triggers (cleared each frame)
    throttleUp: boolean;
    throttleDown: boolean;
    throttleStop: boolean;

    // Double taps
    throttleDoubleUp: boolean;
    throttleDoubleDown: boolean;

    // Rudder overrides
    rudderMultiTapFactor: number; // 1, 2, or 3
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

    // Keyboard internal tracking
    private keys: { [key: string]: boolean } = {};

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
        if (e.repeat) return; // Ignore repeat

        if (e.code === 'Space') e.preventDefault();

        this.keys[key] = true;

        if (['arrowup', 'w'].includes(key)) this.handleTouchDown('up');
        if (['arrowdown', 's'].includes(key)) this.handleTouchDown('down');
        if (['arrowleft', 'a'].includes(key)) this.handleTouchDown('left');
        if (['arrowright', 'd'].includes(key)) this.handleTouchDown('right');
        if (e.code === 'Space') this.handleTouchDown('stop');

        this.updateContinuousState();

        if (this.onLineKey) {
            this.onLineKey(key);
        }
    }

    // Touch API for external UI components
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
            this.state.steerLeft = true; // For touch
            if (this.lastRudderTapDir === 'left' && (now - this.lastRudderTapTime) < 250) {
                this.rudderTapCount = Math.min(3, this.rudderTapCount + 1);
            } else {
                this.rudderTapCount = 1;
            }
            this.lastRudderTapDir = 'left';
            this.lastRudderTapTime = now;
        }

        if (action === 'right') {
            this.state.steerRight = true; // For touch
            if (this.lastRudderTapDir === 'right' && (now - this.lastRudderTapTime) < 250) {
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

        // Vibrate for feedback if supported
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(10);
        }
    }

    public handleTouchUp(action: 'left'|'right') {
        if (action === 'left') this.state.steerLeft = false;
        if (action === 'right') this.state.steerRight = false;
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

        this.updateContinuousState();
    }

    private updateContinuousState() {
        this.state.steerLeft = this.keys['arrowleft'] || this.keys['a'];
        this.state.steerRight = this.keys['arrowright'] || this.keys['d'];
        this.state.rudderMultiTapFactor = this.rudderTapCount;

        // Automatically drop tap memory if keys are released
        if (!this.state.steerLeft && !this.state.steerRight) {
            // We keep the tap factor until pressed again or delay passes, 
            // but the boat will naturally center rudder and next press sets factor.
        }
    }

    /**
     * Call this inside the main loop to apply current input state to the boat,
     * AND to clear any one-frame triggers (like taps).
     */
    public applyToBoat(boat: BoatState) {
        this.handleThrottle(boat);
        this.handleRudder(boat);
        
        // Very important: clear triggers so they don't fire continuously
        this.state.throttleUp = false;
        this.state.throttleDown = false;
        this.state.throttleDoubleUp = false;
        this.state.throttleDoubleDown = false;
        this.state.throttleStop = false;
    }

    private handleThrottle(boat: BoatState) {
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
        let maxRudder = 20; // Default max (if count is somehow reset but held)
        if (this.state.rudderMultiTapFactor === 1) maxRudder = 10;
        if (this.state.rudderMultiTapFactor === 2) maxRudder = 40;
        if (this.state.rudderMultiTapFactor >= 3) maxRudder = 75;

        if (this.state.steerLeft) {
            boat.rudder = -maxRudder;
        } else if (this.state.steerRight) {
            boat.rudder = maxRudder;
        } else {
            // Recenter
            if (boat.rudder > 0) {
                boat.rudder = Math.max(0, boat.rudder - 10 * Constants.DT * 60 * 0.3);
            } else if (boat.rudder < 0) {
                boat.rudder = Math.min(0, boat.rudder - 10 * Constants.DT * 60 * 0.3); // Minus from negative 
                // Wait, if rudder < 0, we want to bring it to 0
                boat.rudder = Math.min(0, boat.rudder + 10 * Constants.DT * 60 * 0.3);
            }
        }
    }

}

export const input = new InputManager();
