/**
 * DrawNPC.ts — gedeelde NPC-bootrendering
 * Gebruikt door HarborEditor.ts en Render.ts
 */

/** NPC dimensies per type in game-units (half-length, half-width, sternWidthFactor) */
export const NPC_SPECS: Record<string, { L: number; W: number; sw: number }> = {
    small: { L: 20, W: 8, sw: 0.75 },
    motorboat: { L: 36, W: 14, sw: 0.55 },
    sailboat: { L: 48, W: 14, sw: 0.45 },
    large: { L: 65, W: 22, sw: 0.65 },
};

/**
 * Teken een gedetailleerd NPC-bootje (bovenaanzicht).
 * ctx moet al getranslateerd/geroteerd zijn naar de bootpositie.
 */
export function drawNPCDetail(ctx: CanvasRenderingContext2D, type: string, sc: number) {
    const { L, W, sw } = NPC_SPECS[type] ?? NPC_SPECS.motorboat;
    const sW = W * sw;

    // Hull path helper (herbruikbaar voor clip + stroke)
    const hullPath = () => {
        ctx.beginPath();
        ctx.moveTo(L * sc + 5 * sc, 0);
        ctx.bezierCurveTo(L * sc * 0.35, W * sc * 0.95, 0, W * sc, -L * sc, sW * sc);
        ctx.lineTo(-L * sc, -sW * sc);
        ctx.bezierCurveTo(0, -W * sc, L * sc * 0.35, -W * sc * 0.95, L * sc + 5 * sc, 0);
        ctx.closePath();
    };

    // ── 1. DROP SHADOW ────────────────────────────────────────────────────────
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 8 * sc;
    ctx.shadowOffsetX = 3 * sc;
    ctx.shadowOffsetY = 3 * sc;
    hullPath();
    ctx.fillStyle = '#111';
    ctx.fill();
    ctx.restore();

    // ── 2. HULL GRADIENT ─────────────────────────────────────────────────────
    const hullGradients: Record<string, [string, string, string]> = {
        small: ['#d8d8d8', '#b0b0b0', '#888'],
        motorboat: ['#f5e6b0', '#c8a84a', '#8a6820'],
        sailboat: ['#f8f8f8', '#e4e4e4', '#b8b8b8'],
        large: ['#6a7aa0', '#4a5a7a', '#2a3a5a'],
    };
    const [hc0, hc1, hc2] = hullGradients[type] ?? hullGradients.motorboat;
    const hg = ctx.createLinearGradient(0, -W * sc, 0, W * sc);
    hg.addColorStop(0, hc0);
    hg.addColorStop(0.5, hc1);
    hg.addColorStop(1, hc2);

    hullPath();
    ctx.fillStyle = hg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1.5 * sc;
    ctx.stroke();

    // ── 3. DECK PLANKS (motor & large) ───────────────────────────────────────
    if (type === 'motorboat' || type === 'large') {
        ctx.save();
        hullPath();
        ctx.clip();
        ctx.strokeStyle = 'rgba(90,50,10,0.22)';
        ctx.lineWidth = sc * 1.5;
        const spacing = 3 * sc;
        for (let y = -W * sc; y < W * sc; y += spacing) {
            ctx.beginPath();
            ctx.moveTo(-L * sc, y);
            ctx.lineTo(L * sc + 5 * sc, y);
            ctx.stroke();
        }
        ctx.restore();
    }

    // ── 4. CABIN ─────────────────────────────────────────────────────────────
    if (type !== 'small') {
        const cabinCx = (type === 'large') ? -L * sc * 0.08 : -L * sc * 0.02;
        const cabinLen = (type === 'large') ? L * sc * 0.62 : L * sc * 0.58;
        const cabinW = W * sc * 0.72;

        // Cabin body
        const cg = ctx.createLinearGradient(0, -cabinW, 0, cabinW);
        if (type === 'sailboat') {
            cg.addColorStop(0, '#ddeeff');
            cg.addColorStop(1, '#aaccee');
        } else {
            cg.addColorStop(0, '#3a5888');
            cg.addColorStop(1, '#1a2f58');
        }
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.roundRect(cabinCx - cabinLen * 0.5, -cabinW, cabinLen, cabinW * 2, 5 * sc);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.45)';
        ctx.lineWidth = sc * 0.9;
        ctx.stroke();

        // Windshield (forward glass strip)
        ctx.fillStyle = `rgba(180, 235, 255, 0.6)`;
        const wsX = cabinCx + cabinLen * 0.28;
        const wsW = cabinLen * 0.16;
        ctx.fillRect(wsX, -cabinW * 0.82, wsW, cabinW * 1.64);

        // Side windows
        if (type === 'motorboat' || type === 'large') {
            ctx.fillStyle = 'rgba(160, 220, 255, 0.4)';
            const winW = cabinLen * 0.5;
            const winH = cabinW * 0.32;
            for (const side of [-1, 1]) {
                ctx.fillRect(cabinCx - cabinLen * 0.35, side * cabinW * 0.42, winW, side * winH);
            }
        }
    }

    // ── 5. MAST + BOOM (sailboat only) ───────────────────────────────────────
    if (type === 'sailboat') {
        const mastX = L * sc * 0.07;
        ctx.beginPath();
        ctx.arc(mastX, 0, 3 * sc, 0, Math.PI * 2);
        ctx.fillStyle = '#ddd';
        ctx.fill();
        ctx.strokeStyle = '#999';
        ctx.lineWidth = sc * 1.2;
        ctx.stroke();
        // Boom
        ctx.strokeStyle = '#bbb';
        ctx.lineWidth = sc * 1.5;
        ctx.beginPath();
        ctx.moveTo(mastX, 0);
        ctx.lineTo(-L * sc * 0.55, W * sc * 0.38);
        ctx.stroke();
    }

    // ── 6. FENDERS ───────────────────────────────────────────────────────────
    if (type !== 'small') {
        ctx.fillStyle = '#223';
        const fxPositions = [-L * sc * 0.52, 0, L * sc * 0.38];
        for (const fx of fxPositions) {
            for (const side of [-1, 1]) {
                ctx.beginPath();
                ctx.ellipse(fx, side * W * sc * 0.96, sc * 1.8, sc * 3.5, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // ── 7. RUNNING LIGHTS (small coloured dots at bow) ────────────────────────
    {
        const bx = L * sc - 2 * sc;
        ctx.beginPath(); ctx.arc(bx, -3 * sc, 2 * sc, 0, Math.PI * 2);
        ctx.fillStyle = '#22cc44'; ctx.fill(); // Port: green
        ctx.beginPath(); ctx.arc(bx, 3 * sc, 2 * sc, 0, Math.PI * 2);
        ctx.fillStyle = '#cc2222'; ctx.fill(); // Starboard: red
    }

    // ── 8. BOW SHEEN ─────────────────────────────────────────────────────────
    ctx.save();
    const hl = ctx.createRadialGradient(L * sc * 0.45, 0, 0, L * sc * 0.45, 0, W * sc * 0.7);
    hl.addColorStop(0, 'rgba(255,255,255,0.28)');
    hl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hl;
    ctx.beginPath();
    ctx.ellipse(L * sc * 0.38, 0, L * sc * 0.58, W * sc * 0.58, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}
