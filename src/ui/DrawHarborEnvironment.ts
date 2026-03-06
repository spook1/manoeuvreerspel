/**
 * DrawHarborEnvironment.ts — gedeelde rendering voor haven-elementen
 *
 * Bevat tekenlogica die zowel in de Render (spelmodus) als in de
 * HarborEditor (bewerkingsmodus) identiek wordt gebruikt:
 *   - drawShores   → oeverstroken (rots, riet, beton)
 *   - drawNPCBoats → stationaire NPC-boten met naam-labels
 *
 * Gebruikt door: src/ui/Render.ts en src/editor/HarborEditor.ts
 */

import { HarborShore, HarborNPC } from '../data/harbors';
import { drawNPCDetail, NPC_SPECS } from './DrawNPC';

/**
 * Teken alle oeverstroken (shores) van een haven.
 * ctx mag in world-space zijn; de functie regelt translate/rotate zelf.
 */
export function drawShores(ctx: CanvasRenderingContext2D, shores: HarborShore[] | undefined): void {
    if (!shores || shores.length === 0) return;

    for (const s of shores) {
        ctx.save();
        const cx = s.x + s.w / 2;
        const cy = s.y + s.h / 2;
        ctx.translate(cx, cy);
        ctx.rotate((s.angle ?? 0) * Math.PI / 180);

        if (s.type === 'rock') {
            // Grijze achtergrond
            ctx.fillStyle = '#6b6b6b';
            ctx.fillRect(-s.w / 2, -s.h / 2, s.w, s.h);
            // Steen-textuur: paar onregelmatige ovalen
            ctx.fillStyle = '#888';
            const rng = (seed: number) => ((seed * 9301 + 49297) % 233280) / 233280;
            for (let i = 0; i < Math.floor(s.w * s.h / 600); i++) {
                const rx = (rng(i * 3 + 1) - 0.5) * s.w * 0.7;
                const ry = (rng(i * 3 + 2) - 0.5) * s.h * 0.7;
                const rr = 4 + rng(i * 3 + 3) * 8;
                ctx.beginPath();
                ctx.ellipse(rx, ry, rr * 1.3, rr * 0.8, rng(i) * Math.PI, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.strokeStyle = '#4a4a4a';
            ctx.lineWidth = 1;
            ctx.strokeRect(-s.w / 2, -s.h / 2, s.w, s.h);

        } else if (s.type === 'reed') {
            // Groen basis
            ctx.fillStyle = '#2d6a1e';
            ctx.fillRect(-s.w / 2, -s.h / 2, s.w, s.h);
            // Rietjes als kleine vertikale lijntjes
            ctx.strokeStyle = '#4caf50';
            ctx.lineWidth = 1.5;
            const cols = Math.max(3, Math.floor(s.w / 6));
            const rows = Math.max(2, Math.floor(s.h / 8));
            for (let ci = 0; ci < cols; ci++) {
                for (let ri = 0; ri < rows; ri++) {
                    const px = -s.w / 2 + (ci + 0.5) * (s.w / cols) + (ri % 2 === 0 ? 2 : -2);
                    const py = -s.h / 2 + (ri + 0.3) * (s.h / rows);
                    const ph = s.h / rows * 0.6;
                    ctx.beginPath(); ctx.moveTo(px, py + ph); ctx.lineTo(px, py);
                    ctx.moveTo(px, py); ctx.lineTo(px - 3, py - 3);
                    ctx.moveTo(px, py); ctx.lineTo(px + 3, py - 3);
                    ctx.stroke();
                }
            }
            ctx.strokeStyle = '#1b4d12';
            ctx.lineWidth = 1;
            ctx.strokeRect(-s.w / 2, -s.h / 2, s.w, s.h);

        } else {
            // Concrete: lichtgrijs met voeglijnen
            ctx.fillStyle = '#a0a0a0';
            ctx.fillRect(-s.w / 2, -s.h / 2, s.w, s.h);
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 0.8;
            const brickH = 12;
            for (let by = -s.h / 2; by < s.h / 2; by += brickH) {
                const offset = Math.floor((by / brickH) % 2) * 18;
                ctx.beginPath(); ctx.moveTo(-s.w / 2, by); ctx.lineTo(s.w / 2, by); ctx.stroke();
                for (let bx = -s.w / 2 + offset; bx < s.w / 2; bx += 36) {
                    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, Math.min(by + brickH, s.h / 2)); ctx.stroke();
                }
            }
            ctx.strokeStyle = '#777';
            ctx.lineWidth = 1;
            ctx.strokeRect(-s.w / 2, -s.h / 2, s.w, s.h);
        }

        ctx.restore();
    }
}

/**
 * Teken alle stationaire NPC-boten van een haven, inclusief naam-labels.
 * ctx mag in world-space zijn; de functie regelt translate/rotate zelf.
 */
export function drawNPCBoats(ctx: CanvasRenderingContext2D, npcs: HarborNPC[] | undefined): void {
    if (!npcs || npcs.length === 0) return;

    for (const n of npcs) {
        ctx.save();
        ctx.translate(n.x, n.y);
        ctx.rotate((n.heading ?? 0) * Math.PI / 180);

        const sc = n.scale ?? 1;
        drawNPCDetail(ctx, n.type, sc);

        if (n.name) {
            ctx.save();
            ctx.rotate(-(n.heading ?? 0) * Math.PI / 180);
            ctx.font = `bold ${Math.round(10 * sc)}px system-ui`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.shadowColor = 'rgba(0,0,0,0.7)';
            ctx.shadowBlur = 3;
            ctx.fillStyle = '#fff';
            const labelOffset = (NPC_SPECS[n.type]?.W ?? 14) * sc + 8;
            ctx.fillText(n.name, 0, labelOffset);
            ctx.restore();
        }

        ctx.restore();
    }
}
