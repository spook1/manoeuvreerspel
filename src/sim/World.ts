import { GameState } from '../core/GameState';
import { Constants } from '../core/Constants';
import { BoatState } from '../types';
import { NPC_SPECS } from '../ui/DrawNPC';

export class World {
    private static lastCollisionTime: Record<string, number> = {};

    private static applyPenalty(gameState: GameState, objectId: string | number | undefined, vRelSpeed: number, isFender: boolean) {
        if (!objectId || gameState.gameMode !== 'game') return;
        const key = objectId.toString();

        const now = Date.now();
        if (this.lastCollisionTime[key] && now - this.lastCollisionTime[key] < 1000) {
            return;
        }

        const pen = gameState.scenario?.objectPenalties?.[key] ?? {
            speedThresholdSoft: 1,
            speedThresholdHard: 2,
            hullPenaltySoft: 2,
            hullPenaltyHard: 40,
            fenderPenaltySoft: 1,
            fenderPenaltyHard: 3
        };

        const vKnot = Math.abs(vRelSpeed) / Constants.PX_PER_KNOT;
        const tSoft = pen.speedThresholdSoft ?? 1;
        const tHard = pen.speedThresholdHard ?? pen.maxSpeedKnots ?? 2;

        let penalty = 0;
        let typeStr = "";

        if (vKnot >= tHard) {
            penalty = isFender ? (pen.fenderPenaltyHard ?? 3) : (pen.hullPenaltyHard ?? 40);
            typeStr = "Harde botsing";
        } else if (vKnot >= tSoft) {
            penalty = isFender ? (pen.fenderPenaltySoft ?? 1) : (pen.hullPenaltySoft ?? 2);
            typeStr = "Zachte botsing";
        }

        if (penalty > 0) {
            this.lastCollisionTime[key] = now;
            gameState.score -= penalty;
            console.log(`[Penalty] ${typeStr} met ${objectId} (${vKnot.toFixed(1)} kn) → -${penalty} pt. Score: ${gameState.score}`);

            const status = document.getElementById('status');
            const box = document.getElementById('status-message-box');
            if (status && box) {
                status.textContent = `${typeStr}! -${penalty}pt`;
                status.style.color = '#ef4444';
                box.style.display = 'block';
                setTimeout(() => box.style.display = 'none', 2000);
            }
        }
    }

    private static getFenderLocalY(boat: BoatState, fx: number): number {
        const halfWidth = boat.width / 2;
        const sternHalfWidth = halfWidth * 0.55;
        if (fx > boat.length / 4) {
            const t = (fx - boat.length / 4) / (boat.length / 4);
            return halfWidth * (1 - t * 0.6);
        }
        if (fx < -boat.length / 4) return sternHalfWidth + 1;
        return halfWidth;
    }

    private static resolveCircleContact(
        boat: BoatState,
        gameState: GameState,
        objectId: string | number | undefined,
        circleX: number,
        circleY: number,
        radius: number,
        contactLocalX: number,
        contactLocalY: number,
        isFender: boolean,
        mass: number,
        inertia: number
    ) {
        const cosH = Math.cos(boat.heading);
        const sinH = Math.sin(boat.heading);
        const wx = boat.x + contactLocalX * cosH - contactLocalY * sinH;
        const wy = boat.y + contactLocalX * sinH + contactLocalY * cosH;
        const dx = wx - circleX;
        const dy = wy - circleY;
        const dist = Math.hypot(dx, dy);
        if (dist <= 0.001 || dist >= radius) return;

        const penetration = radius - dist;
        const nx = dx / dist;
        const ny = dy / dist;
        const contactWorldX = wx - boat.x;
        const contactWorldY = wy - boat.y;
        const vContactX = boat.vx - boat.omega * contactWorldY;
        const vContactY = boat.vy + boat.omega * contactWorldX;
        const vRel = vContactX * nx + vContactY * ny;

        if (vRel < 0) {
            this.applyPenalty(gameState, objectId, vRel, isFender);
            const rCrossN = contactWorldX * ny - contactWorldY * nx;
            const effectiveMass = 1 / (1 / mass + (rCrossN * rCrossN) / inertia);
            const impulseMag = -vRel * effectiveMass;
            boat.vx += impulseMag * nx / mass;
            boat.vy += impulseMag * ny / mass;
            boat.omega += (rCrossN * impulseMag) / inertia;
        }

        boat.x += nx * penetration * 0.08;
        boat.y += ny * penetration * 0.08;
    }

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
            let isFenderContact = false;
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
                    isFenderContact = false;
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
            for (const side of [-1, 1]) {
                for (const fx of Constants.FENDER_POSITIONS) {
                    const fy = side * this.getFenderLocalY(boat, fx);
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
                            isFenderContact = true;
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
                        this.applyPenalty(gameState, j.id, vRel, isFenderContact);
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

        // 3. SHORE COLLISION (same physics as jetties — AABB)
        if (gameState.harbor.shores) {
            for (const shore of gameState.harbor.shores) {
                // Convert shore (w,h,angle) to an equivalent jetty-style AABB for broad phase
                // For now treat as axis-aligned rectangle (angle not rotated yet in collision)
                if (boat.x + L < shore.x || boat.x - L > shore.x + shore.w ||
                    boat.y + L < shore.y || boat.y - L > shore.y + shore.h) {
                    continue;
                }

                let hitShore = false;
                let isFenderContact = false;
                let overlapX = 0, overlapY = 0;
                let bestContactWorldX = boat.x, bestContactWorldY = boat.y;

                for (const c of corners) {
                    const wx = boat.x + c.x * cosH - c.y * sinH;
                    const wy = boat.y + c.x * sinH + c.y * cosH;
                    if (wx > shore.x && wx < shore.x + shore.w && wy > shore.y && wy < shore.y + shore.h) {
                        hitShore = true;
                        isFenderContact = false;
                        bestContactWorldX = wx; bestContactWorldY = wy;
                        const dL = wx - shore.x, dR = (shore.x + shore.w) - wx;
                        const dT = wy - shore.y, dB = (shore.y + shore.h) - wy;
                        const minD = Math.min(dL, dR, dT, dB);
                        if (minD === dL) overlapX = -dL;
                        else if (minD === dR) overlapX = dR;
                        else if (minD === dT) overlapY = -dT;
                        else overlapY = dB;
                        break;
                    }
                }

                // Fenders
                for (const side of [-1, 1]) {
                    for (const fx of Constants.FENDER_POSITIONS) {
                        const fy = side * this.getFenderLocalY(boat, fx);
                        const wx = boat.x + fx * cosH - fy * sinH;
                        const wy = boat.y + fx * sinH + fy * cosH;
                        const cx2 = Math.max(shore.x, Math.min(wx, shore.x + shore.w));
                        const cy2 = Math.max(shore.y, Math.min(wy, shore.y + shore.h));
                        const dx = wx - cx2, dy = wy - cy2;
                        const distSq = dx * dx + dy * dy;
                        if (distSq < Constants.FENDER_RADIUS * Constants.FENDER_RADIUS) {
                            const dist = Math.sqrt(distSq);
                            const pen = Constants.FENDER_RADIUS - dist;
                            let nx = 1, ny = 0;
                            if (dist > 0.001) { nx = dx / dist; ny = dy / dist; }
                            if (!hitShore || pen > Math.hypot(overlapX, overlapY)) {
                                hitShore = true;
                                isFenderContact = true;
                                overlapX = nx * pen; overlapY = ny * pen;
                                bestContactWorldX = wx; bestContactWorldY = wy;
                            }
                        }
                    }
                }

                if (hitShore) {
                    const overlapMag = Math.hypot(overlapX, overlapY);
                    if (overlapMag > 1e-4) {
                        const nx = overlapX / overlapMag, ny = overlapY / overlapMag;
                        const contactWorldX = bestContactWorldX - boat.x;
                        const contactWorldY = bestContactWorldY - boat.y;
                        const vContactX = boat.vx - boat.omega * contactWorldY;
                        const vContactY = boat.vy + boat.omega * contactWorldX;
                        const vRel = vContactX * nx + vContactY * ny;
                        if (vRel < 0) {
                            this.applyPenalty(gameState, shore.id, vRel, isFenderContact);
                            const rCrossN = contactWorldX * ny - contactWorldY * nx;
                            const effectiveMass = 1 / (1 / mass + (rCrossN * rCrossN) / inertia);
                            const impulseMag = -vRel * effectiveMass;
                            boat.vx += impulseMag * nx / mass;
                            boat.vy += impulseMag * ny / mass;
                            boat.omega += (rCrossN * impulseMag) / inertia;
                            boat.x += overlapX * 0.02;
                            boat.y += overlapY * 0.02;
                        }
                    }
                }
            }
        }

        // 4. NPC COLLISION (circle-based — radius proportional to scale)
        for (const pile of gameState.harbor.piles || []) {
            const pileRadius = pile.type === 'cleat' ? 4 : (Constants.PILE_RADIUS ?? 5);
            const broad = L + W + pileRadius + Constants.FENDER_RADIUS;
            if (Math.hypot(boat.x - pile.x, boat.y - pile.y) > broad) continue;

            for (const c of corners) {
                this.resolveCircleContact(boat, gameState, pile.id, pile.x, pile.y, pileRadius, c.x, c.y, false, mass, inertia);
            }

            for (const side of [-1, 1]) {
                for (const fx of Constants.FENDER_POSITIONS) {
                    const fy = side * this.getFenderLocalY(boat, fx);
                    this.resolveCircleContact(boat, gameState, pile.id, pile.x, pile.y, pileRadius + Constants.FENDER_RADIUS, fx, fy, true, mass, inertia);
                }
            }
        }

        if (gameState.harbor.npcs) {
            for (const npc of gameState.harbor.npcs) {
                const scale = npc.scale ?? 1;
                const spec = NPC_SPECS[npc.type] ?? NPC_SPECS.motorboat;
                const npcRadius = spec.W * 0.85 * scale;
                const npcL = spec.L * scale; // half-length for broad phase
                const npcHeading = (npc.heading ?? 0) * Math.PI / 180;
                const nCos = Math.cos(npcHeading);
                const nSin = Math.sin(npcHeading);

                if (Math.hypot(boat.x - npc.x, boat.y - npc.y) > L + npcL + npcRadius) continue;

                // Check fenders against NPC circle
                for (const side of [-1, 1]) {
                    for (const fx of Constants.FENDER_POSITIONS) {
                        const fy = side * this.getFenderLocalY(boat, fx);
                        const wx = boat.x + fx * cosH - fy * sinH;
                        const wy = boat.y + fx * sinH + fy * cosH;
                        const dist = Math.hypot(wx - npc.x, wy - npc.y);
                        if (dist < Constants.FENDER_RADIUS + npcRadius && dist > 0.001) {
                            const pen = (Constants.FENDER_RADIUS + npcRadius) - dist;
                            const nx = (wx - npc.x) / dist;
                            const ny = (wy - npc.y) / dist;
                            const contactWorldX = wx - boat.x;
                            const contactWorldY = wy - boat.y;
                            const vContactX = boat.vx - boat.omega * contactWorldY;
                            const vContactY = boat.vy + boat.omega * contactWorldX;
                            const vRel = vContactX * nx + vContactY * ny;
                            if (vRel < 0) {
                                this.applyPenalty(gameState, npc.id, vRel, true);
                                const rCrossN = contactWorldX * ny - contactWorldY * nx;
                                const effectiveMass = 1 / (1 / mass + (rCrossN * rCrossN) / inertia);
                                const impulseMag = -vRel * effectiveMass;
                                boat.vx += impulseMag * nx / mass;
                                boat.vy += impulseMag * ny / mass;
                                boat.omega += (rCrossN * impulseMag) / inertia;
                                boat.x += nx * pen * 0.03;
                                boat.y += ny * pen * 0.03;
                            }
                        }
                    }
                }

                const endCircles = [
                    { lx: -npcL * 0.62, r: npcRadius * 0.9 },
                    { lx: npcL * 0.58, r: npcRadius * 0.75 }
                ];

                for (const circle of endCircles) {
                    const cx = npc.x + circle.lx * nCos;
                    const cy = npc.y + circle.lx * nSin;
                    for (const c of corners) {
                        this.resolveCircleContact(boat, gameState, npc.id, cx, cy, circle.r, c.x, c.y, false, mass, inertia);
                    }
                    for (const side of [-1, 1]) {
                        for (const fx of Constants.FENDER_POSITIONS) {
                            const fy = side * this.getFenderLocalY(boat, fx);
                            this.resolveCircleContact(boat, gameState, npc.id, cx, cy, circle.r + Constants.FENDER_RADIUS, fx, fy, true, mass, inertia);
                        }
                    }
                }
            }
        }
    }
}

