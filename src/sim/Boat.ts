import { GameState } from '../core/GameState';
import { Constants } from '../core/Constants';
import { Physics, ForceAccumulator } from './Physics';
import { World } from './World';

export class Boat {
    static updatePhysics(gameState: GameState): void {
        const boat = gameState.boat;

        // Reset debug vectors at start of frame
        if (gameState.showForces) {
            gameState.debugVectors = [];
        }

        // SUB-STEPPING for stability with stiff springs (K=5000)
        // Runs physics at 600Hz (10 steps per frame)
        const SUBSTEPS = 10;
        const DT = Constants.DT / SUBSTEPS;

        for (let _sub = 0; _sub < SUBSTEPS; _sub++) {
            const isLastStep = (_sub === SUBSTEPS - 1);

            const cosH = Math.cos(boat.heading);
            const sinH = Math.sin(boat.heading);

            const forces: ForceAccumulator = { Fx: 0, Fy: 0, torque: 0 };
            const L = boat.length / 2;

            // =====================================================
            // 1. MOTOR THRUST — Applied at stern (behind CG)
            // =====================================================
            const thrust = Constants.THRUST_GAIN * boat.throttle;
            const thrustFx = thrust * cosH;
            const thrustFy = thrust * sinH;
            const motorLocalX = -boat.length / 2;
            Physics.applyForceAtPoint(thrustFx, thrustFy, motorLocalX, 0, cosH, sinH, forces);

            if (gameState.showForces && isLastStep && Math.abs(thrust) > 0.1) {
                gameState.debugVectors.push({
                    x: boat.x + motorLocalX * cosH,
                    y: boat.y + motorLocalX * sinH,
                    vx: thrustFx,
                    vy: thrustFy,
                    color: '#22c55e' // Green
                });
            }

            // =====================================================
            // 1b. PROPELLER WALK — Lateral force when reversing
            // =====================================================
            if (boat.throttle < -0.05) {
                const walkSign = (boat.propDirection === 'rechts') ? -1 : 1;
                const walkMag = Math.abs(boat.throttle) * Constants.PROP_WALK_STRENGTH;
                const walkFxLocal = 0;
                const walkFyLocal = walkSign * walkMag;
                const walkFx = walkFxLocal * cosH - walkFyLocal * sinH;
                const walkFy = walkFxLocal * sinH + walkFyLocal * cosH;
                Physics.applyForceAtPoint(walkFx, walkFy, motorLocalX, 0, cosH, sinH, forces);
            }

            // =====================================================
            // 2. DRAG — Distributed for natural yaw damping
            // =====================================================
            const vSurge = boat.vx * cosH + boat.vy * sinH;  // Forward speed
            const vSway = -boat.vx * sinH + boat.vy * cosH;  // Sideways speed

            // LONGITUDINAL DRAG — at center (no torque)
            const dragSurge = Constants.DRAG_COEFF * vSurge * Math.abs(vSurge);
            const dragSurgeFx = -dragSurge * cosH;
            const dragSurgeFy = -dragSurge * sinH;
            Physics.applyForceAtPoint(dragSurgeFx, dragSurgeFy, 0, 0, cosH, sinH, forces);

            // LATERAL DRAG — distributed over two points (keel resistance)
            const dragOffset = L * 0.9;
            const lateralDragCoeff = Constants.DRAG_COEFF * Constants.LATERAL_DRAG_COEFF;
            const rotScale = 0.05;

            const swayAtFront = vSway + boat.omega * dragOffset * rotScale;
            const swayAtBack = vSway - boat.omega * dragOffset * rotScale;

            const dragFront = (lateralDragCoeff / 2) * swayAtFront * Math.abs(swayAtFront);
            const dragBack = (lateralDragCoeff / 2) * swayAtBack * Math.abs(swayAtBack);

            const dragFrontFx = dragFront * sinH;
            const dragFrontFy = -dragFront * cosH;
            const dragBackFx = dragBack * sinH;
            const dragBackFy = -dragBack * cosH;

            Physics.applyForceAtPoint(dragFrontFx, dragFrontFy, dragOffset, 0, cosH, sinH, forces);
            Physics.applyForceAtPoint(dragBackFx, dragBackFy, -dragOffset, 0, cosH, sinH, forces);

            // =====================================================
            // 3. WIND — At superstructure (forward of center)
            // =====================================================
            const wind = gameState.activeWind;
            if (wind.force > 0) {
                const windRad = (wind.direction + 180 - 90) * Math.PI / 180;
                const windForce = wind.force * 0.5;
                const windFx = Math.cos(windRad) * windForce;
                const windFy = Math.sin(windRad) * windForce;
                const windLocalX = L * 0.1;

                Physics.applyForceAtPoint(windFx, windFy, windLocalX, 0, cosH, sinH, forces);

                if (gameState.showForces && isLastStep) {
                    gameState.debugVectors.push({
                        x: boat.x + windLocalX * cosH,
                        y: boat.y + windLocalX * sinH,
                        vx: windFx,
                        vy: windFy,
                        color: '#3b82f6' // Blue
                    });
                }
            }

            // =====================================================
            // 4. RUDDER — Physical Force (Lift + Drag)
            // =====================================================
            const rudderPosLocalX = -boat.length / 2;
            const vForward = boat.vx * cosH + boat.vy * sinH;
            let flowSpeed = Math.abs(vForward);

            if (boat.throttle > 0.05 && vForward >= -1) {
                flowSpeed += boat.throttle * (Constants.RUDDER_WASH_GAIN / 10.0);
            }

            if (Math.abs(boat.rudder) > 0.1 && (flowSpeed > 0 || boat.throttle > 0.05)) {
                const rudderRad = boat.rudder * Math.PI / 180;
                const forceMag = flowSpeed * (Constants.RUDDER_HYDRO_GAIN / 5) * Math.abs(Math.sin(rudderRad));

                let forceAngle: number;
                if (boat.rudder > 0) {
                    forceAngle = (1.5 * Math.PI) - rudderRad;
                } else {
                    forceAngle = (0.5 * Math.PI) - rudderRad;
                }

                if (vForward < 0 && boat.throttle <= 0.05) {
                    forceAngle += Math.PI;
                }

                const rudderFxLocal = Math.cos(forceAngle) * forceMag;
                const rudderFyLocal = Math.sin(forceAngle) * forceMag;

                const rFx = rudderFxLocal * cosH - rudderFyLocal * sinH;
                const rFy = rudderFxLocal * sinH + rudderFyLocal * cosH;

                Physics.applyForceAtPoint(rFx, rFy, rudderPosLocalX, 0, cosH, sinH, forces);

                if (gameState.showForces && isLastStep) {
                    gameState.debugVectors.push({
                        x: boat.x + rudderPosLocalX * cosH,
                        y: boat.y + rudderPosLocalX * sinH,
                        vx: rFx,
                        vy: rFy,
                        color: '#f97316' // Orange
                    });
                }
            }

            // =====================================================
            // 5. PROPWASH PARTICLES
            // =====================================================
            if (boat.throttle > 0) {
                if (Math.random() < boat.throttle * 3) {
                    const spread = (Math.random() - 0.5) * 12;
                    const backDist = boat.length / 2 + 2;
                    const px = boat.x - (backDist * cosH) - (spread * sinH);
                    const py = boat.y - (backDist * sinH) + (spread * cosH);

                    const washSpeed = 10 + Math.random() * 20 + boat.throttle * 30;
                    const angle = boat.heading + Math.PI + (Math.random() - 0.5) * 0.4;

                    gameState.propwashParticles.push({
                        x: px, y: py,
                        vx: Math.cos(angle) * washSpeed,
                        vy: Math.sin(angle) * washSpeed,
                        life: 1.0,
                        decay: 0.02 + Math.random() * 0.02
                    });
                }
            }

            // =====================================================
            // 6. MOORING LINES
            // =====================================================
            const lineForces = Boat.applyLineForces(gameState, cosH, sinH, gameState.showForces && isLastStep);
            forces.Fx += lineForces.Fx;
            forces.Fy += lineForces.Fy;
            forces.torque += lineForces.torque;

            // =====================================================
            // INTEGRATION
            // =====================================================
            boat.vx += (forces.Fx / Constants.MASS) * DT;
            boat.vy += (forces.Fy / Constants.MASS) * DT;
            boat.omega += (forces.torque / Constants.INERTIA) * DT;

            if (!isNaN(boat.vx)) boat.x += boat.vx * DT;
            if (!isNaN(boat.vy)) boat.y += boat.vy * DT;
            if (!isNaN(boat.omega)) boat.heading += boat.omega * DT;

            // Collisions (inside substep)
            // World.checkCollisions depends on showForces flag to push to debugVectors
            // We shouldn't need to pass isLastStep, but World pushes EVERY time?
            // World pushes if (gameState.showForces).
            // If we run 10 substeps, we get 10 collision vectors.
            // Ideally we only want the last one, or we clear it.
            // But World.ts logic is "push", not "set".
            // Maybe we should temporarily disable showForces for non-last steps?
            // Hacky but works.
            const originalShowForces = gameState.showForces;
            if (!isLastStep) gameState.showForces = false;

            World.checkCollisions(boat, gameState);

            if (!isLastStep) gameState.showForces = originalShowForces;
        }

        // Normalize heading
        if (boat.heading > Math.PI) boat.heading -= 2 * Math.PI;
        if (boat.heading < -Math.PI) boat.heading += 2 * Math.PI;
    }

    static applyLineForces(gameState: GameState, cosH: number, sinH: number, pushDebug: boolean): { Fx: number, Fy: number, torque: number } {
        // ... (Same as before, simplified for this write_to_file call)
        // I need to include the FULL content of applyLineForces and breakLines
        // because write_to_file overwrites the file.
        // Copying from previous view...

        const boat = gameState.boat;
        let Fx = 0, Fy = 0, torque = 0;
        const breakForce = Constants.LINE_STRENGTH * 25;
        const linesToBreak: number[] = [];

        for (let i = 0; i < gameState.lines.length; i++) {
            const line = gameState.lines[i];
            line.tension = 0;
            const lx = line.local.lx;
            const ly = line.local.ly;
            const attachX = boat.x + lx * cosH - ly * sinH;
            const attachY = boat.y + lx * sinH + ly * cosH;
            const dx = line.pile.x - attachX;
            const dy = line.pile.y - attachY;
            const dist = Math.hypot(dx, dy);
            if (dist <= 1e-4) continue;
            if (dist <= line.restLength + 1e-6) continue;

            const ux = dx / dist;
            const uy = dy / dist;
            const excess = dist - line.restLength;
            const K = Constants.LINE_STRENGTH * 3;
            const C = 2;

            const rx = attachX - boat.x;
            const ry = attachY - boat.y;
            const vRotX = -boat.omega * ry;
            const vRotY = boat.omega * rx;
            const vAx = boat.vx + vRotX;
            const vAy = boat.vy + vRotY;
            const relSpeed = vAx * ux + vAy * uy;

            let fMag = 0;
            if (excess > 0) fMag += excess * K;
            if (relSpeed < 0) fMag += -relSpeed * C;

            if (fMag > 0) {
                line.tension = Math.min(1.0, fMag / breakForce);
                if (fMag >= breakForce) {
                    linesToBreak.push(i);
                    continue;
                }
                const fX = fMag * ux;
                const fY = fMag * uy;

                if (pushDebug) {
                    gameState.debugVectors.push({
                        x: attachX,
                        y: attachY,
                        vx: fX,
                        vy: fY,
                        color: '#eab308'
                    });
                }

                Fx += fX;
                Fy += fY;
                torque += rx * fY - ry * fX;
            }
        }

        if (linesToBreak.length > 0) {
            for (let i = linesToBreak.length - 1; i >= 0; i--) {
                const idx = linesToBreak[i];
                const line = gameState.lines[idx];
                const lx = line.local.lx;
                const ly = line.local.ly;
                const attachX = boat.x + lx * cosH - ly * sinH;
                const attachY = boat.y + lx * sinH + ly * cosH;

                const numParticles = 5 + Math.floor(Math.random() * 4);
                for (let p = 0; p < numParticles; p++) {
                    const t = p / (numParticles - 1);
                    const px = attachX + (line.pile.x - attachX) * t;
                    const py = attachY + (line.pile.y - attachY) * t;
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 20 + Math.random() * 30;
                    gameState.brokenLineParticles.push({
                        x: px, y: py,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        life: 1.0,
                        decay: 0.015 + Math.random() * 0.01,
                        length: 8 + Math.random() * 12
                    });
                }
                gameState.lines.splice(idx, 1);
                gameState.score -= 15;
            }
        }
        return { Fx, Fy, torque };
    }

    static breakLines(gameState: GameState): void {
        const boat = gameState.boat;
        const cosH = Math.cos(boat.heading);
        const sinH = Math.sin(boat.heading);

        for (const line of gameState.lines) {
            const lx = line.local.lx;
            const ly = line.local.ly;
            const attachX = boat.x + lx * cosH - ly * sinH;
            const attachY = boat.y + lx * sinH + ly * cosH;

            const numParticles = 5 + Math.floor(Math.random() * 4);
            for (let i = 0; i < numParticles; i++) {
                const t = i / (numParticles - 1);
                const px = attachX + (line.pile.x - attachX) * t;
                const py = attachY + (line.pile.y - attachY) * t;
                const angle = Math.random() * Math.PI * 2;
                const speed = 20 + Math.random() * 30;

                gameState.brokenLineParticles.push({
                    x: px, y: py,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 1.0,
                    decay: 0.015 + Math.random() * 0.01,
                    length: 8 + Math.random() * 12
                });
            }
        }
        gameState.lines.splice(0, gameState.lines.length);
    }
}
