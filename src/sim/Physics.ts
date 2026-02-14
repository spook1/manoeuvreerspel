import { Constants } from '../core/Constants';

export interface ForceAccumulator {
    Fx: number;
    Fy: number;
    torque: number;
}

export class Physics {
    static applyForceAtPoint(fx: number, fy: number, localX: number, localY: number, cosH: number, sinH: number, accum: ForceAccumulator): number {
        accum.Fx += fx;
        accum.Fy += fy;

        const rx = localX * cosH - localY * sinH;
        const ry = localX * sinH + localY * cosH;

        const t = rx * fy - ry * fx;
        accum.torque += t;
        return t;
    }

    static getEffectiveMass(mass: number, inertia: number, rCrossN: number): number {
        return 1 / (1 / mass + (rCrossN * rCrossN) / inertia);
    }

    static calculateLineForce(line: any, boat: any): { Fx: number, Fy: number, torque: number, tension: number, break: boolean } {
        const cosH = Math.cos(boat.heading);
        const sinH = Math.sin(boat.heading);

        const lx = line.local.lx;
        const ly = line.local.ly;

        const attachX = boat.x + lx * cosH - ly * sinH;
        const attachY = boat.y + lx * sinH + ly * cosH;

        const dx = line.pile.x - attachX;
        const dy = line.pile.y - attachY;
        const dist = Math.hypot(dx, dy);

        if (dist <= 1e-4 || dist <= line.restLength + 1e-6) {
            return { Fx: 0, Fy: 0, torque: 0, tension: 0, break: false };
        }

        const ux = dx / dist;
        const uy = dy / dist;
        const excess = dist - line.restLength;

        const K = 5000;
        const C = 500;

        const rx = attachX - boat.x;
        const ry = attachY - boat.y;
        const vRotX = -boat.omega * ry;
        const vRotY = boat.omega * rx;
        const vAx = boat.vx + vRotX;
        const vAy = boat.vy + vRotY;

        const relSpeed = vAx * ux + vAy * uy;

        let fMag = excess * K;
        if (relSpeed < 0) {
            fMag += -relSpeed * C;
        }

        if (fMag <= 0) return { Fx: 0, Fy: 0, torque: 0, tension: 0, break: false };

        const LINE_STRENGTH = Constants.LINE_STRENGTH || 5;
        const breakThreshold = LINE_STRENGTH * 1000;

        if (fMag > breakThreshold) {
            return { Fx: 0, Fy: 0, torque: 0, tension: excess, break: true };
        }

        const MAX_LINE_FORCE = Constants.MAX_LINE_FORCE || 10000;
        const F = Math.min(MAX_LINE_FORCE, fMag);
        const fX = F * ux;
        const fY = F * uy;

        const t = rx * fY - ry * fX;

        return { Fx: fX, Fy: fY, torque: t, tension: excess, break: false };
    }
}

