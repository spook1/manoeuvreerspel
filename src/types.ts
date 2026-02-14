export interface Point {
    x: number;
    y: number;
}

export interface BoatState {
    x: number;
    y: number;
    heading: number;
    vx: number;
    vy: number;
    omega: number;
    length: number;
    width: number;
    throttle: number;
    rudder: number;
    propDirection: 'rechts' | 'links';
}

export interface Line {
    pile: { x: number, y: number, id?: number };
    local: { lx: number, ly: number };
    restLength: number;
    active: boolean;
    key?: string;
    prefix?: string;
    pileIndex?: number;
    tension?: number; // 0..1 ratio of breaking force
}

export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    decay?: number;
}

export interface BrokenLineParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    decay: number;
    length: number; // Line segment visual length
}

export interface Coin {
    x: number;
    y: number;
    collected: boolean;
    radius: number;
}
