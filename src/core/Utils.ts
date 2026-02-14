import { BoatState } from '../types';

/**
 * Get local coordinates of attachment point (cleat/kikker) on the boat.
 * Matches index.html attachLocalPoint layout:
 * - bv/sv: Single cleat at bow center
 * - bm: Midship port (bakboord)
 * - sm: Midship starboard (stuurboord)
 * - ba: Stern port
 * - sa: Stern starboard
 */
export function attachLocalPoint(prefix: string, boat: BoatState): { lx: number, ly: number } | null {
    const L = boat.length;
    const W = boat.width;
    const insetL = 4;
    const insetW = 3;

    switch (prefix) {
        // VOOR: Single cleat at bow center
        case 'bv': return { lx: L / 2 - insetL, ly: 0 };
        case 'sv': return { lx: L / 2 - insetL, ly: 0 }; // Same as bv (1 cleat)
        // MIDDEN: Two cleats at midships
        case 'bm': return { lx: 0, ly: -W / 2 + insetW }; // Midship Port
        case 'sm': return { lx: 0, ly: W / 2 - insetW };  // Midship Starboard
        // ACHTER: Two cleats at stern
        case 'ba': return { lx: -L / 2 + insetL, ly: -W / 2 + insetW }; // Stern Port
        case 'sa': return { lx: -L / 2 + insetL, ly: W / 2 - insetW };  // Stern Starboard
        default: return null;
    }
}

/**
 * Get world coordinates of an attachment point.
 */
export function getAttachmentWorld(prefix: string, boat: BoatState): { x: number, y: number } | null {
    const local = attachLocalPoint(prefix, boat);
    if (!local) return null;
    const cosH = Math.cos(boat.heading);
    const sinH = Math.sin(boat.heading);
    const x = boat.x + local.lx * cosH - local.ly * sinH;
    const y = boat.y + local.lx * sinH + local.ly * cosH;
    return { x, y };
}
