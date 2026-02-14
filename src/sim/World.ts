import { GameState } from '../core/GameState';
import { Constants } from '../core/Constants';
import { BoatState } from '../types';

export class World {
    static checkCollisions(boat: BoatState, gameState: GameState): void {
        const cosH = Math.cos(boat.heading);
        const sinH = Math.sin(boat.heading);
        const L = boat.length / 2;
        const W = boat.width / 2;
        const mass = Constants.MASS;
        const inertia = Constants.INERTIA;

        // 1. QUAY COLLISION (Y <= QUAY_Y)
        // Hull points for Quay check (8 points)
        const hullPoints = [
            { lx: L * 0.92, ly: 0, name: 'bow' },
            { lx: -L, ly: 0, name: 'stern' },
            { lx: L * 0.70, ly: -(W * 0.8), name: 'port_shoulder' },
            { lx: L * 0.70, ly: (W * 0.8), name: 'star_shoulder' },
            { lx: L * 0.5, ly: -(W + Constants.FENDER_RADIUS), name: 'port_f' },
            { lx: L * 0.5, ly: (W + Constants.FENDER_RADIUS), name: 'star_f' },
            { lx: -L * 0.5, ly: -(W + Constants.FENDER_RADIUS), name: 'port_a' },
            { lx: -L * 0.5, ly: (W + Constants.FENDER_RADIUS), name: 'star_a' },
        ];

        let maxOverlap = 0;
        let totalImpulseVy = 0;
        let totalImpulseVx = 0;
        let totalImpulseOmega = 0;
        for (const hp of hullPoints) {
            const wx = boat.x + hp.lx * cosH - hp.ly * sinH;
            const wy = boat.y + hp.lx * sinH + hp.ly * cosH;

            if (wy < Constants.QUAY_Y) {
                const overlap = Constants.QUAY_Y - wy;
                if (overlap > maxOverlap) maxOverlap = overlap;

                const rx = hp.lx * cosH - hp.ly * sinH;
                const ry = hp.lx * sinH + hp.ly * cosH;

                const vContactX = boat.vx - boat.omega * ry;
                const vContactY = boat.vy + boat.omega * rx;

                // Block motion into quay (Y < 0)
                if (vContactY < 0) {
                    const effectiveMass = 1 / (1 / mass + (rx * rx) / inertia);
                    const j = -vContactY * effectiveMass; // Inelastic
                    const impulse = Math.max(0, j);

                    // Friction
                    const mu = Constants.FENDER_FRICTION;
                    let jX = -vContactX / (1 / mass + (ry * ry) / inertia);
                    const maxFriction = mu * impulse;
                    jX = Math.max(-maxFriction, Math.min(maxFriction, jX));

                    totalImpulseVy += impulse / mass;
                    totalImpulseVx += jX / mass;
                    totalImpulseOmega += (rx * impulse - ry * jX) / inertia;

                    if (gameState.showForces) {
                        gameState.debugVectors.push({
                            x: wx, y: wy,
                            vx: jX, vy: impulse,
                            color: '#ef4444' // Red for collision
                        });
                    }
                }
            }
        }

        if (Math.abs(totalImpulseVy) > 1e-4 || Math.abs(totalImpulseVx) > 1e-4) {
            boat.vy += totalImpulseVy;
            boat.vx += totalImpulseVx;
            boat.omega += totalImpulseOmega;
        }
        if (maxOverlap > 0) {
            boat.y += maxOverlap;
        }

        // 2. JETTY COLLISION
        // Check both Hull Corners AND Fenders against Jetty AABBs
        // Hull axial points (Bow, Stern, Beam)
        const corners = [
            { x: L, y: 0 }, { x: -L, y: 0 }, { x: 0, y: W }, { x: 0, y: -W }
        ];

        for (const j of gameState.harbor.jetties) {
            // Quick AABB
            if (boat.x + L < j.x || boat.x - L > j.x + j.w ||
                boat.y + L < j.y || boat.y - L > j.y + j.h) {
                continue;
            }

            let hitJetty = false;
            let overlapX = 0;
            let overlapY = 0;
            let bestContactWorldX = boat.x;
            let bestContactWorldY = boat.y;

            // 2A. Check Hull Axial Points
            for (const c of corners) {
                const wx = boat.x + c.x * cosH - c.y * sinH;
                const wy = boat.y + c.x * sinH + c.y * cosH;

                if (wx > j.x && wx < j.x + j.w && wy > j.y && wy < j.y + j.h) {
                    hitJetty = true;
                    bestContactWorldX = wx;
                    bestContactWorldY = wy;

                    const dL = wx - j.x;
                    const dR = (j.x + j.w) - wx;
                    const dT = wy - j.y;
                    const dB = (j.y + j.h) - wy;
                    const minD = Math.min(dL, dR, dT, dB);

                    if (minD === dL) overlapX = -dL;
                    else if (minD === dR) overlapX = dR;
                    else if (minD === dT) overlapY = -dT;
                    else overlapY = dB;
                    break;
                }
            }

            // 2B. Check Fenders (Priority)
            const hullHalfWidth = boat.width / 2;
            for (const side of [-1, 1]) {
                const fy = side * hullHalfWidth;
                for (const fx of Constants.FENDER_POSITIONS) {
                    const wx = boat.x + fx * cosH - fy * sinH;
                    const wy = boat.y + fx * sinH + fy * cosH;

                    // Closest point on jetty
                    const cx = Math.max(j.x, Math.min(wx, j.x + j.w));
                    const cy = Math.max(j.y, Math.min(wy, j.y + j.h));
                    const dx = wx - cx;
                    const dy = wy - cy;
                    const distSq = dx * dx + dy * dy;

                    if (distSq < Constants.FENDER_RADIUS * Constants.FENDER_RADIUS) {
                        const dist = Math.sqrt(distSq);
                        const pen = Constants.FENDER_RADIUS - dist;

                        let nx = 1, ny = 0;
                        if (dist > 0.001) { nx = dx / dist; ny = dy / dist; }

                        // If new hit or deeper penetration
                        // Note: Using max penetration logic
                        if (!hitJetty || pen > Math.hypot(overlapX, overlapY)) {
                            hitJetty = true;
                            overlapX = nx * pen;
                            overlapY = ny * pen;
                            bestContactWorldX = wx;
                            bestContactWorldY = wy;
                        }
                    }
                }
            }

            if (hitJetty) {
                const overlapMag = Math.hypot(overlapX, overlapY);
                if (overlapMag > 1e-4) {
                    const nx = overlapX / overlapMag;
                    const ny = overlapY / overlapMag;
                    const contactWorldX = bestContactWorldX - boat.x;
                    const contactWorldY = bestContactWorldY - boat.y;

                    const vContactX = boat.vx - boat.omega * contactWorldY;
                    const vContactY = boat.vy + boat.omega * contactWorldX;
                    const vRel = vContactX * nx + vContactY * ny;

                    if (vRel < 0) {
                        const rCrossN = contactWorldX * ny - contactWorldY * nx;
                        const effectiveMass = 1 / (1 / mass + (rCrossN * rCrossN) / inertia);
                        const impulseMag = -vRel * effectiveMass;

                        boat.vx += impulseMag * nx / mass;
                        boat.vy += impulseMag * ny / mass;
                        boat.omega += (rCrossN * impulseMag) / inertia;

                        // Position Correction
                        boat.x += overlapX * 0.02;
                        boat.y += overlapY * 0.02;

                        // Velocity Damping (Friction/Stickiness)
                        const vDotN = boat.vx * nx + boat.vy * ny;
                        if (vDotN < 0) {
                            boat.vx -= 0.1 * vDotN * nx;
                            boat.vy -= 0.1 * vDotN * ny;
                        }

                        if (gameState.showForces) {
                            gameState.debugVectors.push({
                                x: bestContactWorldX, y: bestContactWorldY,
                                vx: impulseMag * nx, vy: impulseMag * ny,
                                color: '#ef4444'
                            });
                        }
                    }
                }
            }
        }
    }
}
