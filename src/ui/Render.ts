import { GameState } from '../core/GameState';
import { Constants } from '../core/Constants';
import { attachLocalPoint, getAttachmentWorld } from '../core/Utils';
import { tutorial } from '../core/Tutorial';
import { editor } from '../editor/HarborEditor';
import { drawShores, drawNPCBoats } from './DrawHarborEnvironment';
import { camera } from '../core/Camera';

export class Render {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    gameStateRef: GameState | null = null;

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;

        window.addEventListener('resize', () => this.resize());
        this.resize();

        // Click handler for cleat selection and pile attachment
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
    }

    setGameState(gs: GameState) {
        this.gameStateRef = gs;
    }

    private getMousePos(evt: MouseEvent): { x: number, y: number } {
        const rect = this.canvas.getBoundingClientRect();
        return camera.screenToWorld(evt.clientX, evt.clientY, rect);
    }

    private handleCanvasClick(e: MouseEvent) {
        const gs = this.gameStateRef;
        if (!gs) return;

        const mousePos = this.getMousePos(e);
        const mx = mousePos.x;
        const my = mousePos.y;

        // 1. Check if clicking on a cleat (attachment point on boat)
        const prefixes = ['bv', 'bm', 'sm', 'ba', 'sa'];
        for (const p of prefixes) {
            const pt = getAttachmentWorld(p, gs.boat);
            if (!pt) continue;
            const dx = mx - pt.x;
            const dy = my - pt.y;
            if (Math.hypot(dx, dy) < 8) { // Clickable radius
                gs.selectedPrefix = p;
                return;
            }
        }

        // 2. If a cleat is selected, check if clicking on a pile
        if (gs.selectedPrefix) {
            for (let pi = 0; pi < gs.harbor.piles.length; pi++) {
                const pile = gs.harbor.piles[pi];
                const dx = mx - pile.x;
                const dy = my - pile.y;
                if (Math.hypot(dx, dy) < 8) {
                    this.handleLineCommand(gs, gs.selectedPrefix, pi);
                    gs.selectedPrefix = null;
                    return;
                }
            }
            // Clicked elsewhere: deselect
            gs.selectedPrefix = null;
        }
    }

    /**
     * Toggle a line between a cleat and a pile (matches index.html handleLineCommand)
     */
    private handleLineCommand(gs: GameState, prefix: string, pileIndex: number) {
        const local = attachLocalPoint(prefix, gs.boat);
        if (!local) return;

        const pile = gs.harbor.piles[pileIndex];
        if (!pile) return;

        const key = prefix + ':' + pileIndex;

        // Toggle: if line exists, remove it
        const existing = gs.lines.findIndex(l => l.key === key);
        if (existing !== -1) {
            gs.lines.splice(existing, 1);
            return;
        }

        // Create new line with current rest length
        const cosH = Math.cos(gs.boat.heading);
        const sinH = Math.sin(gs.boat.heading);
        const attachX = gs.boat.x + local.lx * cosH - local.ly * sinH;
        const attachY = gs.boat.y + local.lx * sinH + local.ly * cosH;
        const restLength = Math.hypot(pile.x - attachX, pile.y - attachY);

        gs.lines.push({
            key,
            prefix,
            local,
            pileIndex,
            pile: { x: pile.x, y: pile.y },
            restLength,
            active: true
        });
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    draw(gameState: GameState) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.save();
        ctx.scale(Constants.GAME_SCALE, Constants.GAME_SCALE);
        camera.applyTransform(ctx, this.canvas.width, this.canvas.height);

        this.drawWater(gameState);
        this.drawHarbor(gameState);
        this.drawPropwash(gameState);
        this.drawLines(gameState);
        this.drawBoat(gameState);
        this.drawBrokenLines(gameState);
        tutorial.draw(ctx);
        this.drawCoins(gameState);
        editor.draw(ctx);
        this.drawSEObjectHighlight(gameState);
        this.drawDebugForces(gameState);
        ctx.restore();

        // UI Layer (ignoring camera)
        ctx.save();
        ctx.scale(Constants.GAME_SCALE, Constants.GAME_SCALE);
        this.drawScenarioHUD(gameState);
        this.drawUI(gameState);
        ctx.restore();
    }

    private drawScenarioHUD(gameState: GameState) {
        if (gameState.gameMode !== 'game') return;
        const runner = (window as any)._scenarioRunner;
        if (!runner || runner.state === 'idle') return;

        const ctx = this.ctx;
        const cw = this.canvas.width / Constants.GAME_SCALE;

        ctx.save();

        if (runner.state === 'failed') {
            // Rood scherm overlay
            ctx.fillStyle = 'rgba(239,68,68,0.35)';
            ctx.fillRect(0, 0, cw, this.canvas.height / Constants.GAME_SCALE);

            ctx.font = 'bold 28px system-ui';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('❌ Te laat! Scenario start opnieuw...', cw / 2, 300);
        } else if (runner.state === 'complete') {
            ctx.font = 'bold 28px system-ui';
            ctx.fillStyle = '#4ade80';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✅ Scenario voltooid!', cw / 2, 300);
        } else {
            // Stap-indicator rechtsboven
            const text = runner.hudText;
            ctx.font = 'bold 16px system-ui';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'top';
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(cw - 130, 12, 120, 28);
            ctx.fillStyle = '#fff';
            ctx.fillText(text, cw - 16, 18);
        }

        ctx.restore();
    }

    drawWater(gameState: GameState) {
        this.ctx.fillStyle = '#1e3a8a';
        this.ctx.fillRect(0, 0, this.canvas.width / Constants.GAME_SCALE, this.canvas.height / Constants.GAME_SCALE);
        this.drawWaves(gameState);
    }

    drawWaves(gameState: GameState) {
        const wind = gameState.activeWind;
        if (wind.force <= 0.1) return;

        const ctx = this.ctx;
        ctx.save();

        const windSpeed = wind.force;
        // windDirDeg is where wind comes FROM. Wave fronts are perpendicular.
        const windRad = (wind.direction + 180 - 90) * Math.PI / 180;
        const waveAngle = windRad + Math.PI / 2; // Perpendicular to wind
        const cW = Math.cos(waveAngle);
        const sW = Math.sin(waveAngle);

        const time = Date.now() * 0.001; // seconds

        // Wind-responsive spacing: stronger wind = closer waves
        const baseSpacing = 45;
        const spacing = Math.max(25, baseSpacing - windSpeed * 0.5);

        // Wind-responsive opacity: stronger wind = more visible waves
        const baseOpacity = 0.05;
        const maxOpacity = 0.18;
        const waveOpacity = Math.min(maxOpacity, baseOpacity + windSpeed * 0.005);

        // Wind-responsive wave length
        const baseLen = 8;
        const waveLen = baseLen + windSpeed * 0.3;

        const w = this.canvas.width / Constants.GAME_SCALE;
        const h = this.canvas.height / Constants.GAME_SCALE;

        // Primary wave layer
        ctx.strokeStyle = `rgba(255, 255, 255, ${waveOpacity})`;
        ctx.lineWidth = 1.5;

        // Wave movement direction (wind pushes waves)
        const moveX = Math.cos(windRad) * time * (2 + windSpeed * 0.2);
        const moveY = Math.sin(windRad) * time * (2 + windSpeed * 0.2);

        for (let y = -spacing; y < h + spacing; y += spacing) {
            for (let x = -spacing; x < w + spacing; x += spacing) {
                // Animated offset per wave
                const phase = Math.sin((x + moveX) * 0.02 + (y + moveY) * 0.025 + time * 1.5) * 8;
                const cx = x + phase * 0.6;
                const cy = y + Math.cos((x + moveX) * 0.015 + time) * 3;

                ctx.beginPath();
                ctx.moveTo(cx - waveLen * cW, cy - waveLen * sW);
                ctx.lineTo(cx + waveLen * cW, cy + waveLen * sW);
                ctx.stroke();
            }
        }

        // Secondary (smaller) wave layer for detail when windy
        if (windSpeed > 8) {
            const smallSpacing = spacing * 0.5;
            const smallOpacity = (windSpeed - 8) * 0.008;
            ctx.strokeStyle = `rgba(200, 220, 255, ${Math.min(0.1, smallOpacity)})`;
            ctx.lineWidth = 1;

            for (let y = 0; y < h; y += smallSpacing) {
                for (let x = 0; x < w; x += smallSpacing) {
                    const phase = Math.sin(x * 0.04 + y * 0.03 + time * 2.5) * 4;
                    const cx = x + phase;
                    const cy = y;

                    ctx.beginPath();
                    const smallLen = 5;
                    ctx.moveTo(cx - smallLen * cW, cy - smallLen * sW);
                    ctx.lineTo(cx + smallLen * cW, cy + smallLen * sW);
                    ctx.stroke();
                }
            }
        }

        ctx.restore();
    }

    drawHarbor(gameState: GameState) {
        const ctx = this.ctx;
        const canvasW = this.canvas.width / Constants.GAME_SCALE;

        // === QUAY (rich wood textures) ===
        // Base wood
        const quayGrad = ctx.createLinearGradient(0, 0, 0, Constants.QUAY_Y);
        quayGrad.addColorStop(0, '#5c3d1e');
        quayGrad.addColorStop(0.3, '#7c4f2a');
        quayGrad.addColorStop(0.7, '#6b4226');
        quayGrad.addColorStop(1, '#4a2e14');
        ctx.fillStyle = quayGrad;
        ctx.fillRect(0, 0, canvasW, Constants.QUAY_Y);

        // Horizontal plank lines
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 0.5;
        for (let y = 12; y < Constants.QUAY_Y; y += 18) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvasW, y);
            ctx.stroke();
        }

        // Quay edge (dark bottom border)
        ctx.fillStyle = '#3a2010';
        ctx.fillRect(0, Constants.QUAY_Y - 3, canvasW, 3);

        // Edge highlight
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, Constants.QUAY_Y - 3);
        ctx.lineTo(canvasW, Constants.QUAY_Y - 3);
        ctx.stroke();

        // === SHORES (drawn first, so they appear beneath jetties) ===
        this.drawShores(ctx, gameState);

        // === NPCs (drawn before jetties/piles so structures are on top) ===
        this.drawNPCBoats(ctx, gameState);

        // === JETTIES (wood planks, on top of shores and NPCs) ===
        for (const j of gameState.harbor.jetties) {
            // Skip the quay body itself (full-width, y=0 jetties)
            if (j.y === 0 && j.w > 100) continue;

            ctx.save();
            // Rotation Logic (Center Pivot)
            if (j.angle && j.angle !== 0) {
                const cx = j.x + j.w / 2;
                const cy = j.y + j.h / 2;
                ctx.translate(cx, cy);
                ctx.rotate(j.angle * Math.PI / 180);
                ctx.translate(-cx, -cy);
            }

            // Main jetty surface
            const jetGrad = ctx.createLinearGradient(j.x, j.y, j.x + j.w, j.y);
            jetGrad.addColorStop(0, '#8B6D3C');
            jetGrad.addColorStop(0.5, '#9B7D4C');
            jetGrad.addColorStop(1, '#7B5D2C');
            ctx.fillStyle = jetGrad;
            ctx.fillRect(j.x, j.y, j.w, j.h);

            // Plank lines (horizontal for narrow jetties, vertical for wide)
            ctx.strokeStyle = 'rgba(0,0,0,0.12)';
            ctx.lineWidth = 0.5;
            if (j.w < 20) {
                for (let py = j.y + 12; py < j.y + j.h; py += 14) {
                    ctx.beginPath();
                    ctx.moveTo(j.x, py);
                    ctx.lineTo(j.x + j.w, py);
                    ctx.stroke();
                }
            } else {
                for (let px = j.x + 10; px < j.x + j.w; px += 12) {
                    ctx.beginPath();
                    ctx.moveTo(px, j.y);
                    ctx.lineTo(px, j.y + j.h);
                    ctx.stroke();
                }
            }

            // Border
            ctx.strokeStyle = 'rgba(0,0,0,0.25)';
            ctx.lineWidth = 1;
            ctx.strokeRect(j.x, j.y, j.w, j.h);

            ctx.restore();
        }

        // === PILES & CLEATS (always on top) ===
        for (const p of gameState.harbor.piles) {
            ctx.save();
            // Rotation Logic (Pivot is center/position)
            if (p.angle && p.angle !== 0) {
                ctx.translate(p.x, p.y);
                ctx.rotate(p.angle * Math.PI / 180);
                ctx.translate(-p.x, -p.y);
            }

            if (p.type === 'cleat') {
                // T-shaped cleat (bolder/kikker)
                ctx.fillStyle = '#1e293b';
                // Base circle
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                ctx.fill();
                // T-bar (horizontal bar on top)
                ctx.strokeStyle = '#475569';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(p.x - 4, p.y);
                ctx.lineTo(p.x + 4, p.y);
                ctx.stroke();
                // Highlight dot
                ctx.fillStyle = '#94a3b8';
                ctx.beginPath();
                ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Wooden pile (circular with ring)
                // Shadow
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.beginPath();
                ctx.arc(p.x + 1, p.y + 1, 6, 0, Math.PI * 2);
                ctx.fill();
                // Main body
                const pileGrad = ctx.createRadialGradient(p.x - 1, p.y - 1, 0, p.x, p.y, 6);
                pileGrad.addColorStop(0, '#8B6D3C');
                pileGrad.addColorStop(0.7, '#5a3818');
                pileGrad.addColorStop(1, '#3a2010');
                ctx.fillStyle = pileGrad;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 5.5, 0, Math.PI * 2);
                ctx.fill();
                // Metal ring
                ctx.strokeStyle = '#6b7280';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
                ctx.stroke();
                // Center highlight
                ctx.fillStyle = 'rgba(255,255,255,0.15)';
                ctx.beginPath();
                ctx.arc(p.x - 1, p.y - 1, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }

    private drawShores(ctx: CanvasRenderingContext2D, gameState: GameState) {
        drawShores(ctx, gameState.harbor.shores);
    }

    private drawNPCBoats(ctx: CanvasRenderingContext2D, gameState: GameState) {
        drawNPCBoats(ctx, gameState.harbor.npcs);
    }


    drawBoat(gameState: GameState) {
        const ctx = this.ctx;
        const boat = gameState.boat;

        ctx.save();
        ctx.translate(boat.x, boat.y);
        ctx.rotate(boat.heading);

        const L = boat.length;  // 72
        const W = boat.width;   // 24
        const FENDER_RADIUS = Constants.FENDER_RADIUS || 3;

        // 1. Hull shape (narrower stern, pointed bow — matches index.html)
        const sternWidth = W * 0.55; // Stern narrower (55% of max width)
        ctx.beginPath();
        ctx.moveTo(L / 2 + 5, 0); // Bow point (extends 5px beyond half-length)
        // Starboard side — bow to max width to narrow stern
        ctx.bezierCurveTo(L / 3, W / 2, 0, W / 2, -L / 2, sternWidth / 2);
        // Transom (narrower)
        ctx.lineTo(-L / 2, -sternWidth / 2);
        // Port side — narrow stern to max width to bow
        ctx.bezierCurveTo(0, -W / 2, L / 3, -W / 2, L / 2 + 5, 0);
        ctx.closePath();

        // Deck color
        ctx.fillStyle = '#f1f5f9';
        ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.stroke();

        // 2. Cabin (slightly raised)
        ctx.fillStyle = '#cbd5e1';
        const cabinX = -L / 4 - 4;
        const cabinW = L / 2 + 8;
        const cabinH = W - 8;
        ctx.fillRect(cabinX, -cabinH / 2, cabinW, cabinH);
        ctx.strokeRect(cabinX, -cabinH / 2, cabinW, cabinH);

        // 3. Window (front of cabin — curved)
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.moveTo(cabinX + cabinW, -cabinH / 2 + 2);
        ctx.quadraticCurveTo(cabinX + cabinW + 4, 0, cabinX + cabinW, cabinH / 2 - 2);
        ctx.lineTo(cabinX + cabinW - 5, cabinH / 2 - 2);
        ctx.lineTo(cabinX + cabinW - 5, -cabinH / 2 + 2);
        ctx.fill();

        // 4. Aft Deck / Cockpit (draw BEFORE fenders so fenders are on top)
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(-L / 2 + 2, -W / 2 + 3, L / 4, W - 6);
        ctx.strokeRect(-L / 2 + 2, -W / 2 + 3, L / 4, W - 6);

        // 5. Rudder (actual rudder angle in degrees → radians)
        const rudderAngle = -(boat.rudder * Math.PI / 180);
        ctx.save();
        ctx.translate(-L / 2, 0);
        ctx.rotate(rudderAngle);
        ctx.fillStyle = '#b91c1c';
        ctx.beginPath();
        ctx.rect(-12, -2.5, 12, 5); // Larger rudder blade
        ctx.fill();
        ctx.restore();

        // 6. Fenders — Y position follows hull shape (matches index.html)
        ctx.fillStyle = '#111';
        const sternWidthFender = W * 0.55;
        for (const fx of Constants.FENDER_POSITIONS) {
            let fenderY: number;
            if (fx > L / 4) {
                // Bow section: tapers from W/2 to 40% at bow
                const t = (fx - L / 4) / (L / 4);
                fenderY = (W / 2) * (1 - t * 0.6);
            } else if (fx < -L / 4) {
                // Stern section: use stern width + 1px outward
                fenderY = sternWidthFender / 2 + 1;
            } else {
                fenderY = W / 2; // Center section: full width
            }
            // Port (-Y)
            ctx.beginPath();
            ctx.arc(fx, -fenderY, FENDER_RADIUS, 0, Math.PI * 2);
            ctx.fill();
            // Starboard (+Y)
            ctx.beginPath();
            ctx.arc(fx, fenderY, FENDER_RADIUS, 0, Math.PI * 2);
            ctx.fill();
        }

        // 7. Cleats (Kikkers — attachment points)
        const attachmentPoints = [
            { prefix: 'bv', color: '#f59e0b' }, // Orange (Bow center)
            { prefix: 'bm', color: '#ef4444' }, // Red (Midship Port)
            { prefix: 'sm', color: '#22c55e' }, // Green (Midship Starboard)
            { prefix: 'ba', color: '#ef4444' }, // Red (Stern Port)
            { prefix: 'sa', color: '#22c55e' }  // Green (Stern Starboard)
        ];

        for (const ap of attachmentPoints) {
            const pt = attachLocalPoint(ap.prefix, boat);
            if (!pt) continue;
            const size = 3;
            ctx.save();
            ctx.translate(pt.lx, pt.ly);

            // Highlight if selected
            if (gameState.selectedPrefix === ap.prefix) {
                ctx.beginPath();
                ctx.arc(0, 0, 6, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(253, 224, 71, 0.6)'; // Yellow glow
                ctx.fill();
            }

            ctx.beginPath();
            ctx.strokeStyle = ap.color;
            ctx.lineWidth = 1.5;
            // X-shape
            ctx.moveTo(-size, -size); ctx.lineTo(size, size);
            ctx.moveTo(size, -size); ctx.lineTo(-size, size);
            ctx.stroke();
            ctx.restore();
        }

        // 8. Bow wave
        const speed = Math.hypot(boat.vx, boat.vy);
        if (speed > 0.02) {
            ctx.strokeStyle = `rgba(56,189,248,${Math.min(0.45, 0.15 + speed * 0.4)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(L / 2 + 4, 0, 8 + speed * 8, -0.6, 0.6);
            ctx.stroke();
        }

        ctx.restore();
    }

    drawPropwash(gameState: GameState) {
        const ctx = this.ctx;
        const DT = Constants.DT;
        ctx.save();
        // Update and draw particles (matches original drawPropwash)
        for (let i = gameState.propwashParticles.length - 1; i >= 0; i--) {
            const p = gameState.propwashParticles[i];
            // Euler integration for particles
            p.x += p.vx * DT;
            p.y += p.vy * DT;
            p.life -= (p.decay || 0.03);

            if (p.life <= 0) {
                gameState.propwashParticles.splice(i, 1);
                continue;
            }

            ctx.fillStyle = `rgba(255, 255, 255, ${p.life * 0.5})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2 + (1 - p.life) * 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawBrokenLines(gameState: GameState) {
        const ctx = this.ctx;
        const DT = Constants.DT;
        ctx.save();
        for (let i = gameState.brokenLineParticles.length - 1; i >= 0; i--) {
            const p = gameState.brokenLineParticles[i];
            // Update particle physics
            p.x += p.vx * DT;
            p.y += p.vy * DT;
            p.vy += 50 * DT; // Gravity
            p.vx *= 0.98; // Air resistance
            p.vy *= 0.98;
            p.life -= p.decay;

            if (p.life <= 0) {
                gameState.brokenLineParticles.splice(i, 1);
                continue;
            }

            // Draw line segment (not a dot)
            const alpha = p.life * 0.8;
            ctx.strokeStyle = `rgba(250, 204, 21, ${alpha})`; // Yellow fading
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';

            const angle = Math.atan2(p.vy, p.vx);
            const halfLen = p.length / 2;

            ctx.beginPath();
            ctx.moveTo(p.x - Math.cos(angle) * halfLen, p.y - Math.sin(angle) * halfLen);
            ctx.lineTo(p.x + Math.cos(angle) * halfLen, p.y + Math.sin(angle) * halfLen);
            ctx.stroke();
        }
        ctx.restore();
    }

    // Wind compass removed — wind info is in the dashboard menu

    drawLines(gameState: GameState) {
        const boat = gameState.boat;
        const ctx = this.ctx;
        const cosH = Math.cos(boat.heading);
        const sinH = Math.sin(boat.heading);

        for (const line of gameState.lines) {
            if (!line.local) continue;

            const lx = line.local.lx;
            const ly = line.local.ly;

            const attachX = boat.x + lx * cosH - ly * sinH;
            const attachY = boat.y + lx * sinH + ly * cosH;

            const pile = line.pile;
            const tension = line.tension || 0;

            ctx.beginPath();

            // Color based on tension
            if (tension > 0.9) {
                ctx.strokeStyle = '#ef4444'; // Red (Critical)
                ctx.lineWidth = 3;
            } else if (tension > 0.6) {
                ctx.strokeStyle = '#f59e0b'; // Orange (High)
                ctx.lineWidth = 2.5;
            } else if (tension > 0.3) {
                ctx.strokeStyle = '#facc15'; // Yellow (Medium)
                ctx.lineWidth = 2;
            } else {
                ctx.strokeStyle = '#fff'; // White (Normal)
                ctx.lineWidth = 2;
            }

            const dist = Math.hypot(pile.x - attachX, pile.y - attachY);

            // Slack logic: if dist is significantly less than restLength
            if (dist < line.restLength - 2) {
                // Slack - draw curved
                ctx.strokeStyle = '#cbd5e1'; // Light Grey
                ctx.lineWidth = 1.5;

                const midX = (attachX + pile.x) / 2;
                const midY = (attachY + pile.y) / 2;

                // Calculate sag (simple 20px drop relative to length or fixed)
                // A vertical drop looks better
                const sag = Math.min(20, (line.restLength - dist) * 0.8);

                ctx.moveTo(attachX, attachY);
                // Control point is midpoint + Y offset
                ctx.quadraticCurveTo(midX, midY + sag, pile.x, pile.y);
            } else {
                // Taut
                ctx.moveTo(attachX, attachY);
                ctx.lineTo(pile.x, pile.y);
            }

            ctx.stroke();

            // Draw attachment knot on boat (color matches line)
            ctx.fillStyle = ctx.strokeStyle;
            ctx.beginPath();
            ctx.arc(attachX, attachY, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawUI(gameState: GameState) {
        const boat = gameState.boat;

        // Speed (px/s ÷ PX_PER_KNOT = knots)
        const speedKnots = (Math.hypot(boat.vx, boat.vy) / Constants.PX_PER_KNOT).toFixed(1);
        const speedometerEl = document.getElementById('speedometer');
        if (speedometerEl) speedometerEl.textContent = speedKnots + ' kn';

        // Score
        const scoreDisplayEl = document.getElementById('scoreDisplay');
        if (scoreDisplayEl) {
            const displayScore = (gameState.gameMode === 'game') ? gameState.score : gameState.score; // simplify
            scoreDisplayEl.textContent = Math.floor(displayScore).toString();
        }

        // Wind
        const windSpeedLabelEl = document.getElementById('windSpeedLabel');
        if (windSpeedLabelEl) windSpeedLabelEl.textContent = gameState.activeWind.force.toFixed(0);

        // Propeller Status
        const propEl = document.getElementById('propellerStatus');
        const propBtn = document.getElementById('propDirToggle');
        const propInd = document.getElementById('propIndicator');

        if (boat.propDirection === 'rechts') {
            if (propEl) { propEl.textContent = '↻ Rechts'; propEl.style.color = '#facc15'; }
            if (propBtn) propBtn.textContent = 'Rechts ↻';
            if (propInd) propInd.textContent = 'Rechts ↻';
        } else {
            if (propEl) { propEl.textContent = '↺ Links'; propEl.style.color = '#facc15'; }
            if (propBtn) propBtn.textContent = 'Links ↺';
            if (propInd) propInd.textContent = 'Links ↺';
        }
    } // End of drawUI? No, drawUI is inside class.

    private drawCoins(gameState: GameState) {
        if (gameState.coins.length === 0) return;
        const ctx = this.ctx;
        const time = Date.now() * 0.003;

        for (const coin of gameState.coins) {
            if (coin.collected) continue;

            const bob = Math.sin(time + coin.x * 0.1) * 2;
            const cx = coin.x;
            const cy = coin.y + bob;

            ctx.save();
            // Glow
            ctx.beginPath();
            ctx.arc(cx, cy, 14, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(251, 191, 36, 0.2)';
            ctx.fill();

            // Outer ring
            const pulse = 1 + Math.sin(time * 2) * 0.1;
            ctx.beginPath();
            ctx.arc(cx, cy, coin.radius * pulse, 0, Math.PI * 2);
            ctx.fillStyle = '#fbbf24';
            ctx.fill();
            ctx.strokeStyle = '#b45309';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Inner circle
            ctx.beginPath();
            ctx.arc(cx, cy, coin.radius * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = '#fde68a';
            ctx.fill();

            // Star
            ctx.fillStyle = '#92400e';
            ctx.font = 'bold 10px system-ui';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('★', cx, cy);

            ctx.restore();
        }
    }
    private drawSEObjectHighlight(gameState: GameState) {
        if (gameState.gameMode !== 'scenario-edit') return;
        const ctx = this.ctx;

        const drawOutlineWithText = (x: number, y: number, w: number, h: number, angle: number, id: string) => {
            ctx.save();
            ctx.strokeStyle = '#ef4444'; // Red outline for harbor objects
            ctx.lineWidth = 3;
            ctx.setLineDash([4, 4]);

            ctx.translate(x + w / 2, y + h / 2);
            ctx.rotate((angle || 0) * Math.PI / 180);
            ctx.strokeRect(-w / 2 - 2, -h / 2 - 2, w + 4, h + 4);

            // Draw text
            ctx.rotate(-(angle || 0) * Math.PI / 180); // Un-rotate text
            const pen = gameState.scenario?.objectPenalties?.[id];
            if (pen) {
                ctx.fillStyle = '#facc15'; // Yellow text for readability
                ctx.font = 'bold 12px system-ui';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const tSoft = pen.speedThresholdSoft ?? 1;
                const tHard = pen.speedThresholdHard ?? pen.maxSpeedKnots ?? 2;
                const lines = [
                    `Zacht > ${tSoft} / Hard > ${tHard} kn`,
                    `Zacht (F/R): ${pen.fenderPenaltySoft || 0} / ${pen.hullPenaltySoft || 0}`,
                    `Hard (F/R): ${pen.fenderPenaltyHard || 0} / ${pen.hullPenaltyHard || 0}`
                ];
                let ty = -14;
                for (const txt of lines) {
                    // text shadow for readability
                    ctx.shadowColor = 'rgba(0,0,0,0.8)';
                    ctx.shadowBlur = 4;
                    ctx.fillText(txt, 0, ty);
                    ctx.shadowBlur = 0;
                    ty += 14;
                }
            }
            ctx.restore();
        };

        if (gameState.selectedHarborObjectId) {
            const sid = gameState.selectedHarborObjectId;
            const h = gameState.harbor;
            const target: any =
                h.jetties?.find(j => j.id === sid) ||
                h.shores?.find((s: any) => s.id === sid) ||
                h.npcs?.find((n: any) => n.id === sid);

            if (target) {
                const w = target.w ?? target.width ?? 0;
                const hh = target.h ?? target.length ?? 0;
                const angle = target.angle ?? (target.heading ? target.heading * 180 / Math.PI : 0);
                drawOutlineWithText(target.x, target.y, w, hh, angle, sid);
            } else {
                const pile = h.piles?.find(p => p.id?.toString() === sid);
                if (pile) {
                    drawOutlineWithText(pile.x - 10, pile.y - 10, 20, 20, 0, sid);
                }
            }
        }

        if (gameState.selectedSEObject) {
            const obj = gameState.selectedSEObject;

            ctx.save();
            ctx.strokeStyle = '#facc15'; // Yellow highlight
            ctx.lineWidth = 3;
            ctx.setLineDash([6, 4]);

            if (obj.width !== undefined) {
                // Het is een mooring spot
                const w = obj.width;
                const h = obj.height ?? 40;
                const cx = obj.x + w / 2;
                const cy = obj.y + h / 2;
                ctx.translate(cx, cy);
                ctx.rotate((obj.angle || 0) * Math.PI / 180);
                ctx.strokeRect(-w / 2 - 4, -h / 2 - 4, w + 8, h + 8);

                // Draw right resize handle (E)
                const hd = 6;
                ctx.fillStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.setLineDash([]);
                ctx.strokeRect(w / 2 + 4 - hd / 2, -hd / 2, hd, hd);
                ctx.fillRect(w / 2 + 4 - hd / 2, -hd / 2, hd, hd);

                // Draw bottom resize handle (S)
                ctx.strokeRect(-hd / 2, h / 2 + 4 - hd / 2, hd, hd);
                ctx.fillRect(-hd / 2, h / 2 + 4 - hd / 2, hd, hd);
            } else if (obj.value !== undefined) {
                // Het is een coin
                ctx.beginPath();
                ctx.arc(obj.x, obj.y, 22, 0, Math.PI * 2);
                ctx.stroke();
            }

            ctx.restore();
        }
    }

    private drawDebugForces(gameState: GameState) {
        if (!gameState.showForces) return;
        const ctx = this.ctx;

        gameState.debugVectors.forEach(v => {
            if (Math.hypot(v.vx, v.vy) < 0.1) return;

            let scale = 1.0;
            if (v.color === '#ef4444') scale = 50.0; // Collision (Red)
            else if (v.color === '#22c55e') scale = 2.0; // Thrust (Green)
            else if (v.color === '#3b82f6') scale = 3.0; // Wind (Blue)
            else if (v.color === '#f97316') scale = 4.0; // Rudder (Orange)
            else if (v.color === '#eab308') scale = 2.0; // Lines (Yellow)

            const endX = v.x + v.vx * scale;
            const endY = v.y + v.vy * scale;

            ctx.save();
            ctx.strokeStyle = v.color;
            ctx.fillStyle = v.color;
            ctx.lineWidth = 2;
            this.drawArrow(ctx, v.x, v.y, endX, endY);
            ctx.restore();
        });
    }

    private drawArrow(ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) {
        const headlen = 10;
        const angle = Math.atan2(toY - fromY, toX - fromX);
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
    }
}
