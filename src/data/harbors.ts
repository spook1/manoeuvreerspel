export interface PenaltySettings {
    maxSpeedKnots?: number;
    hullPenalty?: number;
    fenderPenalty?: number;
}

export interface HarborJetty {
    x: number;
    y: number;
    w: number;
    h: number;
    angle: number;
    id?: string;
}

export interface HarborPile {
    x: number;
    y: number;
    type: 'cleat' | 'pile';
    angle?: number;
    id?: string | number;
}

export interface HarborMooringSpot {
    x: number;
    y: number;
    width: number;
    height?: number; // Optional, default 40
    points: number;
    angle: number;
    id?: string;
    order?: number;      // Volgorde (1-gebaseerd). Zelfde nr = tegelijk actief
    timeLimit?: number;  // Seconden dat dit object actief/zichtbaar is nadat het unlocked is (default 60)
}

export interface HarborCoin {
    x: number;
    y: number;
    value: number; // Points
    sequenceIndex?: number; // Order
    timeout?: number; // Seconds to persist after previous coin
    id?: number;
    order?: number;      // Volgorde (1-gebaseerd). Zelfde nr = tegelijk actief
    timeLimit?: number;  // Seconden dat dit object actief/zichtbaar is nadat het unlocked is (default 30)
}

/** Een scenario-stap binnen een game */
export interface GameScenarioEntry {
    scenarioId: string;
    introText: string;       // Instructietekst getoond vóór start scenario
    unlockAfterPrevious: boolean;  // false = altijd beschikbaar
}

/** Een volledige game: geordende reeks van scenario's */
export interface GameData {
    id: string;
    name: string;
    description: string;
    createdBy?: string;      // user id
    isPublished: boolean;
    scenarios: GameScenarioEntry[];
}

/** Een oeverstrook: rotsoever of rietoever — werkt als obstakel */
export interface HarborShore {
    x: number;
    y: number;
    w: number;
    h: number;
    angle: number;
    type: 'rock' | 'reed' | 'concrete';
    id?: string;
}

/** Een decoratief/stationair NPC-bootje — werkt als obstakel */
export interface HarborNPC {
    x: number;
    y: number;
    heading: number;    // graden
    type: 'small' | 'motorboat' | 'sailboat' | 'large';
    scale?: number;     // 0.5 – 2.0, default 1
    name?: string;
    id?: string;
}

/** Physics properties that a scenario can override */
export interface ScenarioPhysics {
    mass?: number;
    dragCoeff?: number;
    lateralDragCoeff?: number;
    thrustGain?: number;
    rudderWashGain?: number;
    rudderHydroGain?: number;
    lineStrength?: number;
    propDirection?: 'rechts' | 'links';
}

/** Boot startpositie */
export interface BoatStart {
    x: number;
    y: number;
    heading: number; // degrees
}

/**
 * HAVEN: De fysieke haven — steigers, palen, kikkers en standaard bootpositie.
 * Dit is de basis die de scenario-editor gebruikt als achtergrond.
 */
export interface HarborData {
    id: string;           // uniek ID, bv. 'h1' of een UUID
    name: string;
    version: string;
    jetties: HarborJetty[];
    piles: HarborPile[];
    boatStart: BoatStart;  // Standaard startpositie voor oefenmodus

    // Nieuwe objecten
    shores?: HarborShore[];   // Oeverstroken (rots, riet, beton)
    npcs?: HarborNPC[];       // Stationaire decoratieve boten (obstakel)

    // Legacy velden — aanwezig in bestaande havens, worden genegeerd in gamemodus
    wind?: { direction: number; force: number; };
    mooringSpots?: HarborMooringSpot[];
    coins?: HarborCoin[];
}

/**
 * SCENARIO: Een spelinstelling bovenop een haven.
 * Bevat wind, aanlegplaatsen, munten, optionele bootpositie en bootfysica.
 * Meerdere scenario's kunnen verwijzen naar dezelfde haven.
 */
export interface ScenarioData {
    id: string;
    name: string;
    description?: string;
    harborId: string;      // verwijst naar HarborData.id
    wind: { direction: number; force: number; };
    mooringSpots: HarborMooringSpot[];
    coins: HarborCoin[];
    boatStart?: BoatStart; // Overschrijft haven-default als aanwezig
    physics?: ScenarioPhysics;  // Optionele bootsettings
    coinSettings?: {
        value: number;
        count: number;
        timeLimit: number;
    };
    objectPenalties?: Record<string, PenaltySettings>; // Penalties mapped by harbor object ID
}

export const DEFAULT_HARBORS: HarborData[] = [
    // Harbor 1
    {
        "id": "h1",
        "name": "Harbour 1",
        "version": "1.0",
        "boatStart": { "x": 200, "y": 500, "heading": 0 },
        "wind": {
            "direction": 0,
            "force": 0
        },
        "jetties": [
            {
                "x": 300,
                "y": 150,
                "w": 12,
                "h": 150,
                "angle": 0
            },
            {
                "x": 0,
                "y": 0,
                "w": 980,
                "h": 150,
                "angle": 0
            },
            {
                "x": 380,
                "y": 150,
                "w": 12,
                "h": 150,
                "angle": 0
            },
            {
                "x": 560,
                "y": 150,
                "w": 12,
                "h": 150,
                "angle": 0
            },
            {
                "x": 890,
                "y": 150,
                "w": 12,
                "h": 150,
                "angle": 0
            },
            {
                "x": 640,
                "y": 150,
                "w": 12,
                "h": 150,
                "angle": 0
            }
        ],
        "piles": [
            {
                "x": 270,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 170,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 80,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 300,
                "y": 180,
                "type": "cleat"
            },
            {
                "x": 300,
                "y": 210,
                "type": "cleat"
            },
            {
                "x": 300,
                "y": 240,
                "type": "cleat"
            },
            {
                "x": 300,
                "y": 270,
                "type": "cleat"
            },
            {
                "x": 300,
                "y": 300,
                "type": "cleat"
            },
            {
                "x": 310,
                "y": 300,
                "type": "cleat"
            },
            {
                "x": 310,
                "y": 270,
                "type": "cleat"
            },
            {
                "x": 310,
                "y": 240,
                "type": "cleat"
            },
            {
                "x": 310,
                "y": 210,
                "type": "cleat"
            },
            {
                "x": 310,
                "y": 180,
                "type": "cleat"
            },
            {
                "x": 310,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 330,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 360,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 300,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 380,
                "y": 180,
                "type": "cleat"
            },
            {
                "x": 380,
                "y": 210,
                "type": "cleat"
            },
            {
                "x": 380,
                "y": 240,
                "type": "cleat"
            },
            {
                "x": 380,
                "y": 270,
                "type": "cleat"
            },
            {
                "x": 380,
                "y": 300,
                "type": "cleat"
            },
            {
                "x": 390,
                "y": 300,
                "type": "cleat"
            },
            {
                "x": 390,
                "y": 270,
                "type": "cleat"
            },
            {
                "x": 390,
                "y": 240,
                "type": "cleat"
            },
            {
                "x": 390,
                "y": 210,
                "type": "cleat"
            },
            {
                "x": 390,
                "y": 180,
                "type": "cleat"
            },
            {
                "x": 390,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 410,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 440,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 380,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 560,
                "y": 180,
                "type": "cleat"
            },
            {
                "x": 560,
                "y": 210,
                "type": "cleat"
            },
            {
                "x": 560,
                "y": 240,
                "type": "cleat"
            },
            {
                "x": 560,
                "y": 270,
                "type": "cleat"
            },
            {
                "x": 560,
                "y": 300,
                "type": "cleat"
            },
            {
                "x": 570,
                "y": 300,
                "type": "cleat"
            },
            {
                "x": 570,
                "y": 270,
                "type": "cleat"
            },
            {
                "x": 570,
                "y": 240,
                "type": "cleat"
            },
            {
                "x": 570,
                "y": 210,
                "type": "cleat"
            },
            {
                "x": 570,
                "y": 180,
                "type": "cleat"
            },
            {
                "x": 570,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 590,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 620,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 560,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 890,
                "y": 180,
                "type": "cleat"
            },
            {
                "x": 890,
                "y": 210,
                "type": "cleat"
            },
            {
                "x": 890,
                "y": 240,
                "type": "cleat"
            },
            {
                "x": 890,
                "y": 270,
                "type": "cleat"
            },
            {
                "x": 890,
                "y": 300,
                "type": "cleat"
            },
            {
                "x": 900,
                "y": 300,
                "type": "cleat"
            },
            {
                "x": 900,
                "y": 270,
                "type": "cleat"
            },
            {
                "x": 900,
                "y": 240,
                "type": "cleat"
            },
            {
                "x": 900,
                "y": 210,
                "type": "cleat"
            },
            {
                "x": 900,
                "y": 180,
                "type": "cleat"
            },
            {
                "x": 900,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 920,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 950,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 890,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 470,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 490,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 520,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 540,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 810,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 870,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 220,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 50,
                "y": 290,
                "type": "pile"
            },
            {
                "x": 150,
                "y": 300,
                "type": "pile"
            },
            {
                "x": 250,
                "y": 300,
                "type": "pile"
            },
            {
                "x": 480,
                "y": 250,
                "type": "pile"
            },
            {
                "x": 480,
                "y": 300,
                "type": "pile"
            },
            {
                "x": 640,
                "y": 180,
                "type": "cleat"
            },
            {
                "x": 640,
                "y": 210,
                "type": "cleat"
            },
            {
                "x": 640,
                "y": 240,
                "type": "cleat"
            },
            {
                "x": 640,
                "y": 270,
                "type": "cleat"
            },
            {
                "x": 640,
                "y": 300,
                "type": "cleat"
            },
            {
                "x": 650,
                "y": 300,
                "type": "cleat"
            },
            {
                "x": 650,
                "y": 270,
                "type": "cleat"
            },
            {
                "x": 650,
                "y": 240,
                "type": "cleat"
            },
            {
                "x": 650,
                "y": 210,
                "type": "cleat"
            },
            {
                "x": 650,
                "y": 180,
                "type": "cleat"
            },
            {
                "x": 640,
                "y": 150,
                "type": "cleat"
            }
        ]
    },
    // Harbor 2
    {
        "id": "h2",
        "name": "Harbour 2",
        "version": "1.0",
        "boatStart": { "x": 200, "y": 500, "heading": 0 },
        "wind": {
            "direction": 0,
            "force": 15
        },
        "jetties": [
            {
                "x": 300,
                "y": 150,
                "w": 12,
                "h": 150,
                "angle": 0
            },
            {
                "x": 0,
                "y": 0,
                "w": 980,
                "h": 150,
                "angle": 0
            },
            {
                "x": 380,
                "y": 150,
                "w": 12,
                "h": 150,
                "angle": 0
            },
            {
                "x": 560,
                "y": 150,
                "w": 12,
                "h": 150,
                "angle": 0
            },
            {
                "x": 890,
                "y": 150,
                "w": 12,
                "h": 150,
                "angle": 0
            },
            {
                "x": 640,
                "y": 150,
                "w": 12,
                "h": 150,
                "angle": 0
            }
        ],
        "piles": [
            {
                "x": 270,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 170,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 80,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 300,
                "y": 180,
                "type": "cleat"
            },
            {
                "x": 300,
                "y": 210,
                "type": "cleat"
            },
            {
                "x": 300,
                "y": 240,
                "type": "cleat"
            },
            {
                "x": 300,
                "y": 270,
                "type": "cleat"
            },
            {
                "x": 300,
                "y": 300,
                "type": "cleat"
            },
            {
                "x": 310,
                "y": 300,
                "type": "cleat"
            },
            {
                "x": 310,
                "y": 270,
                "type": "cleat"
            },
            {
                "x": 310,
                "y": 240,
                "type": "cleat"
            },
            {
                "x": 310,
                "y": 210,
                "type": "cleat"
            },
            {
                "x": 310,
                "y": 180,
                "type": "cleat"
            },
            {
                "x": 310,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 330,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 360,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 300,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 380,
                "y": 180,
                "type": "cleat"
            },
            {
                "x": 380,
                "y": 210,
                "type": "cleat"
            },
            {
                "x": 380,
                "y": 240,
                "type": "cleat"
            },
            {
                "x": 380,
                "y": 270,
                "type": "cleat"
            },
            {
                "x": 380,
                "y": 300,
                "type": "cleat"
            },
            {
                "x": 390,
                "y": 300,
                "type": "cleat"
            },
            {
                "x": 390,
                "y": 270,
                "type": "cleat"
            },
            {
                "x": 390,
                "y": 240,
                "type": "cleat"
            },
            {
                "x": 390,
                "y": 210,
                "type": "cleat"
            },
            {
                "x": 390,
                "y": 180,
                "type": "cleat"
            },
            {
                "x": 390,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 410,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 440,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 380,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 560,
                "y": 180,
                "type": "cleat"
            },
            {
                "x": 560,
                "y": 210,
                "type": "cleat"
            },
            {
                "x": 560,
                "y": 240,
                "type": "cleat"
            },
            {
                "x": 560,
                "y": 270,
                "type": "cleat"
            },
            {
                "x": 560,
                "y": 300,
                "type": "cleat"
            },
            {
                "x": 570,
                "y": 300,
                "type": "cleat"
            },
            {
                "x": 570,
                "y": 270,
                "type": "cleat"
            },
            {
                "x": 570,
                "y": 240,
                "type": "cleat"
            },
            {
                "x": 570,
                "y": 210,
                "type": "cleat"
            },
            {
                "x": 570,
                "y": 180,
                "type": "cleat"
            },
            {
                "x": 570,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 590,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 620,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 560,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 890,
                "y": 180,
                "type": "cleat"
            },
            {
                "x": 890,
                "y": 210,
                "type": "cleat"
            },
            {
                "x": 890,
                "y": 240,
                "type": "cleat"
            },
            {
                "x": 890,
                "y": 270,
                "type": "cleat"
            },
            {
                "x": 890,
                "y": 300,
                "type": "cleat"
            },
            {
                "x": 900,
                "y": 300,
                "type": "cleat"
            },
            {
                "x": 900,
                "y": 270,
                "type": "cleat"
            },
            {
                "x": 900,
                "y": 240,
                "type": "cleat"
            },
            {
                "x": 900,
                "y": 210,
                "type": "cleat"
            },
            {
                "x": 900,
                "y": 180,
                "type": "cleat"
            },
            {
                "x": 900,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 920,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 950,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 890,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 470,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 490,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 520,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 540,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 810,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 870,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 220,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 50,
                "y": 290,
                "type": "pile"
            },
            {
                "x": 150,
                "y": 300,
                "type": "pile"
            },
            {
                "x": 250,
                "y": 300,
                "type": "pile"
            },
            {
                "x": 480,
                "y": 250,
                "type": "pile"
            },
            {
                "x": 480,
                "y": 300,
                "type": "pile"
            },
            {
                "x": 640,
                "y": 180,
                "type": "cleat"
            },
            {
                "x": 640,
                "y": 210,
                "type": "cleat"
            },
            {
                "x": 640,
                "y": 240,
                "type": "cleat"
            },
            {
                "x": 640,
                "y": 270,
                "type": "cleat"
            },
            {
                "x": 640,
                "y": 300,
                "type": "cleat"
            },
            {
                "x": 650,
                "y": 300,
                "type": "cleat"
            },
            {
                "x": 650,
                "y": 270,
                "type": "cleat"
            },
            {
                "x": 650,
                "y": 240,
                "type": "cleat"
            },
            {
                "x": 650,
                "y": 210,
                "type": "cleat"
            },
            {
                "x": 650,
                "y": 180,
                "type": "cleat"
            },
            {
                "x": 640,
                "y": 150,
                "type": "cleat"
            }
        ]
    },
    // Harbor 3
    {
        "id": "h3",
        "name": "Harbour 3",
        "version": "1.0",
        "boatStart": { "x": 200, "y": 500, "heading": 0 },
        "wind": {
            "direction": 90,
            "force": 20
        },
        "jetties": [
            {
                "x": 300,
                "y": 150,
                "w": 12,
                "h": 150,
                "angle": 0
            },
            {
                "x": 0,
                "y": 0,
                "w": 980,
                "h": 150,
                "angle": 0
            },
            {
                "x": 380,
                "y": 150,
                "w": 12,
                "h": 150,
                "angle": 0
            },
            {
                "x": 560,
                "y": 150,
                "w": 12,
                "h": 150,
                "angle": 0
            },
            {
                "x": 890,
                "y": 150,
                "w": 12,
                "h": 150,
                "angle": 0
            },
            {
                "x": 700,
                "y": 150,
                "w": 12,
                "h": 150,
                "angle": 0
            },
            {
                "x": 300,
                "y": 430,
                "w": 10,
                "h": 80,
                "angle": 0
            },
            {
                "x": 380,
                "y": 440,
                "w": 10,
                "h": 70,
                "angle": 0
            },
            {
                "x": 560,
                "y": 450,
                "w": 10,
                "h": 60,
                "angle": 0
            },
            {
                "x": 890,
                "y": 450,
                "w": 10,
                "h": 60,
                "angle": 0
            },
            {
                "x": 700,
                "y": 490,
                "w": 10,
                "h": 20,
                "angle": 0
            },
            {
                "x": 50,
                "y": 510,
                "w": 12,
                "h": 150,
                "angle": 0
            },
            {
                "x": 290,
                "y": 510,
                "w": 680,
                "h": 10,
                "angle": 0
            }
        ],
        "piles": [
            {
                "x": 270,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 170,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 80,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 300,
                "y": 180,
                "type": "cleat"
            },
            {
                "x": 300,
                "y": 210,
                "type": "cleat"
            },
            {
                "x": 300,
                "y": 240,
                "type": "cleat"
            },
            {
                "x": 300,
                "y": 270,
                "type": "cleat"
            },
            {
                "x": 300,
                "y": 300,
                "type": "cleat"
            },
            {
                "x": 310,
                "y": 300,
                "type": "cleat"
            },
            {
                "x": 310,
                "y": 270,
                "type": "cleat"
            },
            {
                "x": 310,
                "y": 240,
                "type": "cleat"
            },
            {
                "x": 310,
                "y": 210,
                "type": "cleat"
            },
            {
                "x": 310,
                "y": 180,
                "type": "cleat"
            },
            {
                "x": 310,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 330,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 360,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 300,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 380,
                "y": 180,
                "type": "cleat"
            },
            {
                "x": 380,
                "y": 210,
                "type": "cleat"
            },
            {
                "x": 380,
                "y": 240,
                "type": "cleat"
            },
            {
                "x": 380,
                "y": 270,
                "type": "cleat"
            },
            {
                "x": 380,
                "y": 300,
                "type": "cleat"
            },
            {
                "x": 390,
                "y": 300,
                "type": "cleat"
            },
            {
                "x": 390,
                "y": 270,
                "type": "cleat"
            },
            {
                "x": 390,
                "y": 240,
                "type": "cleat"
            },
            {
                "x": 390,
                "y": 210,
                "type": "cleat"
            },
            {
                "x": 390,
                "y": 180,
                "type": "cleat"
            },
            {
                "x": 390,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 410,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 440,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 380,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 560,
                "y": 180,
                "type": "cleat"
            },
            {
                "x": 560,
                "y": 210,
                "type": "cleat"
            },
            {
                "x": 560,
                "y": 240,
                "type": "cleat"
            },
            {
                "x": 560,
                "y": 270,
                "type": "cleat"
            },
            {
                "x": 560,
                "y": 300,
                "type": "cleat"
            },
            {
                "x": 570,
                "y": 300,
                "type": "cleat"
            },
            {
                "x": 570,
                "y": 270,
                "type": "cleat"
            },
            {
                "x": 570,
                "y": 240,
                "type": "cleat"
            },
            {
                "x": 570,
                "y": 210,
                "type": "cleat"
            },
            {
                "x": 570,
                "y": 180,
                "type": "cleat"
            },
            {
                "x": 570,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 590,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 620,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 560,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 700,
                "y": 180,
                "type": "cleat"
            },
            {
                "x": 700,
                "y": 210,
                "type": "cleat"
            },
            {
                "x": 700,
                "y": 300,
                "type": "cleat"
            },
            {
                "x": 710,
                "y": 300,
                "type": "cleat"
            },
            {
                "x": 710,
                "y": 210,
                "type": "cleat"
            },
            {
                "x": 710,
                "y": 180,
                "type": "cleat"
            },
            {
                "x": 710,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 730,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 760,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 700,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 890,
                "y": 180,
                "type": "cleat"
            },
            {
                "x": 890,
                "y": 210,
                "type": "cleat"
            },
            {
                "x": 890,
                "y": 240,
                "type": "cleat"
            },
            {
                "x": 890,
                "y": 270,
                "type": "cleat"
            },
            {
                "x": 890,
                "y": 300,
                "type": "cleat"
            },
            {
                "x": 900,
                "y": 300,
                "type": "cleat"
            },
            {
                "x": 900,
                "y": 270,
                "type": "cleat"
            },
            {
                "x": 900,
                "y": 240,
                "type": "cleat"
            },
            {
                "x": 900,
                "y": 210,
                "type": "cleat"
            },
            {
                "x": 900,
                "y": 180,
                "type": "cleat"
            },
            {
                "x": 900,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 920,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 950,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 890,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 470,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 490,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 520,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 540,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 660,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 690,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 810,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 870,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 220,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 50,
                "y": 290,
                "type": "pile"
            },
            {
                "x": 150,
                "y": 300,
                "type": "pile"
            },
            {
                "x": 250,
                "y": 300,
                "type": "pile"
            },
            {
                "x": 480,
                "y": 250,
                "type": "pile"
            },
            {
                "x": 480,
                "y": 300,
                "type": "pile"
            },
            {
                "x": 300,
                "y": 450,
                "type": "cleat"
            },
            {
                "x": 300,
                "y": 480,
                "type": "cleat"
            },
            {
                "x": 300,
                "y": 510,
                "type": "cleat"
            },
            {
                "x": 310,
                "y": 510,
                "type": "cleat"
            },
            {
                "x": 310,
                "y": 480,
                "type": "cleat"
            },
            {
                "x": 310,
                "y": 450,
                "type": "cleat"
            },
            {
                "x": 380,
                "y": 450,
                "type": "cleat"
            },
            {
                "x": 380,
                "y": 480,
                "type": "cleat"
            },
            {
                "x": 380,
                "y": 510,
                "type": "cleat"
            },
            {
                "x": 390,
                "y": 510,
                "type": "cleat"
            },
            {
                "x": 390,
                "y": 480,
                "type": "cleat"
            },
            {
                "x": 390,
                "y": 460,
                "type": "cleat"
            },
            {
                "x": 560,
                "y": 450,
                "type": "cleat"
            },
            {
                "x": 560,
                "y": 480,
                "type": "cleat"
            },
            {
                "x": 560,
                "y": 510,
                "type": "cleat"
            },
            {
                "x": 570,
                "y": 510,
                "type": "cleat"
            },
            {
                "x": 570,
                "y": 480,
                "type": "cleat"
            },
            {
                "x": 570,
                "y": 450,
                "type": "cleat"
            },
            {
                "x": 700,
                "y": 510,
                "type": "cleat"
            },
            {
                "x": 710,
                "y": 510,
                "type": "cleat"
            },
            {
                "x": 890,
                "y": 450,
                "type": "cleat"
            },
            {
                "x": 890,
                "y": 480,
                "type": "cleat"
            },
            {
                "x": 890,
                "y": 510,
                "type": "cleat"
            },
            {
                "x": 900,
                "y": 510,
                "type": "cleat"
            },
            {
                "x": 900,
                "y": 480,
                "type": "cleat"
            },
            {
                "x": 900,
                "y": 450,
                "type": "cleat"
            },
            {
                "x": 500,
                "y": 450,
                "type": "pile"
            },
            {
                "x": 620,
                "y": 450,
                "type": "pile"
            },
            {
                "x": 770,
                "y": 450,
                "type": "pile"
            },
            {
                "x": 850,
                "y": 450,
                "type": "pile"
            }
        ]
    },
    // Harbor 4
    {
        "id": "h4",
        "name": "Harbour 4",
        "version": "1.0",
        "boatStart": { "x": 200, "y": 500, "heading": 0 },
        "wind": {
            "direction": 180,
            "force": 35
        },
        "jetties": [
            {
                "x": 300,
                "y": 150,
                "w": 12,
                "h": 150,
                "angle": 0
            },
            {
                "x": 0,
                "y": 0,
                "w": 980,
                "h": 150,
                "angle": 0
            },
            {
                "x": 380,
                "y": 150,
                "w": 12,
                "h": 150,
                "angle": 0
            },
            {
                "x": 560,
                "y": 150,
                "w": 12,
                "h": 150,
                "angle": 0
            },
            {
                "x": 890,
                "y": 150,
                "w": 12,
                "h": 150,
                "angle": 0
            },
            {
                "x": 700,
                "y": 150,
                "w": 12,
                "h": 150,
                "angle": 0
            },
            {
                "x": 300,
                "y": 370,
                "w": 10,
                "h": 80,
                "angle": 0
            },
            {
                "x": 380,
                "y": 380,
                "w": 10,
                "h": 70,
                "angle": 0
            },
            {
                "x": 560,
                "y": 390,
                "w": 10,
                "h": 60,
                "angle": 0
            },
            {
                "x": 890,
                "y": 390,
                "w": 10,
                "h": 60,
                "angle": 0
            },
            {
                "x": 700,
                "y": 430,
                "w": 10,
                "h": 20,
                "angle": 0
            },
            {
                "x": 50,
                "y": 510,
                "w": 12,
                "h": 150,
                "angle": 0
            },
            {
                "x": 290,
                "y": 450,
                "w": 680,
                "h": 10,
                "angle": 0
            },
            {
                "x": 450,
                "y": 370,
                "w": 10,
                "h": 80,
                "angle": 0
            },
            {
                "x": 650,
                "y": 380,
                "w": 10,
                "h": 70,
                "angle": 0
            },
            {
                "x": 800,
                "y": 380,
                "w": 10,
                "h": 70,
                "angle": 0
            },
            {
                "x": 950,
                "y": 380,
                "w": 10,
                "h": 70,
                "angle": 0
            },
            {
                "x": 760,
                "y": 150,
                "w": 12,
                "h": 150,
                "angle": 0
            },
            {
                "x": 820,
                "y": 150,
                "w": 12,
                "h": 150,
                "angle": 0
            },
            {
                "x": 760,
                "y": 160,
                "w": 12,
                "h": 150,
                "angle": 0
            },
            {
                "x": 820,
                "y": 150,
                "w": 12,
                "h": 150,
                "angle": 0
            },
            {
                "x": 640,
                "y": 150,
                "w": 12,
                "h": 150,
                "angle": 0
            }
        ],
        "piles": [
            {
                "x": 270,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 170,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 80,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 300,
                "y": 180,
                "type": "cleat"
            },
            {
                "x": 300,
                "y": 210,
                "type": "cleat"
            },
            {
                "x": 300,
                "y": 240,
                "type": "cleat"
            },
            {
                "x": 300,
                "y": 270,
                "type": "cleat"
            },
            {
                "x": 300,
                "y": 300,
                "type": "cleat"
            },
            {
                "x": 310,
                "y": 300,
                "type": "cleat"
            },
            {
                "x": 310,
                "y": 270,
                "type": "cleat"
            },
            {
                "x": 310,
                "y": 240,
                "type": "cleat"
            },
            {
                "x": 310,
                "y": 210,
                "type": "cleat"
            },
            {
                "x": 310,
                "y": 180,
                "type": "cleat"
            },
            {
                "x": 310,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 330,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 360,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 300,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 380,
                "y": 180,
                "type": "cleat"
            },
            {
                "x": 380,
                "y": 210,
                "type": "cleat"
            },
            {
                "x": 380,
                "y": 240,
                "type": "cleat"
            },
            {
                "x": 380,
                "y": 270,
                "type": "cleat"
            },
            {
                "x": 380,
                "y": 300,
                "type": "cleat"
            },
            {
                "x": 390,
                "y": 300,
                "type": "cleat"
            },
            {
                "x": 390,
                "y": 270,
                "type": "cleat"
            },
            {
                "x": 390,
                "y": 240,
                "type": "cleat"
            },
            {
                "x": 390,
                "y": 210,
                "type": "cleat"
            },
            {
                "x": 390,
                "y": 180,
                "type": "cleat"
            },
            {
                "x": 390,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 410,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 440,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 380,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 560,
                "y": 180,
                "type": "cleat"
            },
            {
                "x": 560,
                "y": 210,
                "type": "cleat"
            },
            {
                "x": 560,
                "y": 240,
                "type": "cleat"
            },
            {
                "x": 560,
                "y": 270,
                "type": "cleat"
            },
            {
                "x": 560,
                "y": 300,
                "type": "cleat"
            },
            {
                "x": 570,
                "y": 300,
                "type": "cleat"
            },
            {
                "x": 570,
                "y": 270,
                "type": "cleat"
            },
            {
                "x": 570,
                "y": 240,
                "type": "cleat"
            },
            {
                "x": 570,
                "y": 210,
                "type": "cleat"
            },
            {
                "x": 570,
                "y": 180,
                "type": "cleat"
            },
            {
                "x": 570,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 590,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 620,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 560,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 700,
                "y": 180,
                "type": "cleat"
            },
            {
                "x": 700,
                "y": 210,
                "type": "cleat"
            },
            {
                "x": 700,
                "y": 300,
                "type": "cleat"
            },
            {
                "x": 710,
                "y": 300,
                "type": "cleat"
            },
            {
                "x": 710,
                "y": 210,
                "type": "cleat"
            },
            {
                "x": 710,
                "y": 180,
                "type": "cleat"
            },
            {
                "x": 710,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 730,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 760,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 700,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 890,
                "y": 180,
                "type": "cleat"
            },
            {
                "x": 890,
                "y": 210,
                "type": "cleat"
            },
            {
                "x": 890,
                "y": 240,
                "type": "cleat"
            },
            {
                "x": 890,
                "y": 270,
                "type": "cleat"
            },
            {
                "x": 890,
                "y": 300,
                "type": "cleat"
            },
            {
                "x": 900,
                "y": 300,
                "type": "cleat"
            },
            {
                "x": 900,
                "y": 270,
                "type": "cleat"
            },
            {
                "x": 900,
                "y": 240,
                "type": "cleat"
            },
            {
                "x": 900,
                "y": 210,
                "type": "cleat"
            },
            {
                "x": 900,
                "y": 180,
                "type": "cleat"
            },
            {
                "x": 900,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 920,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 950,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 890,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 470,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 490,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 520,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 540,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 660,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 690,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 810,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 870,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 220,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 50,
                "y": 290,
                "type": "pile"
            },
            {
                "x": 150,
                "y": 300,
                "type": "pile"
            },
            {
                "x": 250,
                "y": 300,
                "type": "pile"
            },
            {
                "x": 480,
                "y": 250,
                "type": "pile"
            },
            {
                "x": 480,
                "y": 300,
                "type": "pile"
            },
            {
                "x": 300,
                "y": 390,
                "type": "cleat"
            },
            {
                "x": 300,
                "y": 420,
                "type": "cleat"
            },
            {
                "x": 300,
                "y": 450,
                "type": "cleat"
            },
            {
                "x": 310,
                "y": 450,
                "type": "cleat"
            },
            {
                "x": 310,
                "y": 420,
                "type": "cleat"
            },
            {
                "x": 310,
                "y": 390,
                "type": "cleat"
            },
            {
                "x": 380,
                "y": 390,
                "type": "cleat"
            },
            {
                "x": 380,
                "y": 420,
                "type": "cleat"
            },
            {
                "x": 380,
                "y": 450,
                "type": "cleat"
            },
            {
                "x": 390,
                "y": 450,
                "type": "cleat"
            },
            {
                "x": 390,
                "y": 420,
                "type": "cleat"
            },
            {
                "x": 390,
                "y": 400,
                "type": "cleat"
            },
            {
                "x": 560,
                "y": 390,
                "type": "cleat"
            },
            {
                "x": 560,
                "y": 420,
                "type": "cleat"
            },
            {
                "x": 560,
                "y": 450,
                "type": "cleat"
            },
            {
                "x": 570,
                "y": 450,
                "type": "cleat"
            },
            {
                "x": 570,
                "y": 420,
                "type": "cleat"
            },
            {
                "x": 570,
                "y": 390,
                "type": "cleat"
            },
            {
                "x": 700,
                "y": 450,
                "type": "cleat"
            },
            {
                "x": 710,
                "y": 450,
                "type": "cleat"
            },
            {
                "x": 890,
                "y": 390,
                "type": "cleat"
            },
            {
                "x": 890,
                "y": 420,
                "type": "cleat"
            },
            {
                "x": 890,
                "y": 450,
                "type": "cleat"
            },
            {
                "x": 900,
                "y": 450,
                "type": "cleat"
            },
            {
                "x": 900,
                "y": 420,
                "type": "cleat"
            },
            {
                "x": 900,
                "y": 390,
                "type": "cleat"
            },
            {
                "x": 500,
                "y": 390,
                "type": "pile"
            },
            {
                "x": 620,
                "y": 390,
                "type": "pile"
            },
            {
                "x": 760,
                "y": 390,
                "type": "pile"
            },
            {
                "x": 850,
                "y": 390,
                "type": "pile"
            },
            {
                "x": 760,
                "y": 190,
                "type": "cleat"
            },
            {
                "x": 760,
                "y": 220,
                "type": "cleat"
            },
            {
                "x": 760,
                "y": 250,
                "type": "cleat"
            },
            {
                "x": 760,
                "y": 280,
                "type": "cleat"
            },
            {
                "x": 760,
                "y": 310,
                "type": "cleat"
            },
            {
                "x": 770,
                "y": 310,
                "type": "cleat"
            },
            {
                "x": 770,
                "y": 280,
                "type": "cleat"
            },
            {
                "x": 770,
                "y": 250,
                "type": "cleat"
            },
            {
                "x": 770,
                "y": 220,
                "type": "cleat"
            },
            {
                "x": 770,
                "y": 190,
                "type": "cleat"
            },
            {
                "x": 770,
                "y": 160,
                "type": "cleat"
            },
            {
                "x": 790,
                "y": 160,
                "type": "cleat"
            },
            {
                "x": 760,
                "y": 160,
                "type": "cleat"
            },
            {
                "x": 820,
                "y": 180,
                "type": "cleat"
            },
            {
                "x": 820,
                "y": 210,
                "type": "cleat"
            },
            {
                "x": 820,
                "y": 240,
                "type": "cleat"
            },
            {
                "x": 820,
                "y": 270,
                "type": "cleat"
            },
            {
                "x": 820,
                "y": 300,
                "type": "cleat"
            },
            {
                "x": 830,
                "y": 300,
                "type": "cleat"
            },
            {
                "x": 830,
                "y": 270,
                "type": "cleat"
            },
            {
                "x": 830,
                "y": 240,
                "type": "cleat"
            },
            {
                "x": 830,
                "y": 210,
                "type": "cleat"
            },
            {
                "x": 830,
                "y": 180,
                "type": "cleat"
            },
            {
                "x": 830,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 850,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 820,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 640,
                "y": 180,
                "type": "cleat"
            },
            {
                "x": 640,
                "y": 210,
                "type": "cleat"
            },
            {
                "x": 640,
                "y": 240,
                "type": "cleat"
            },
            {
                "x": 640,
                "y": 270,
                "type": "cleat"
            },
            {
                "x": 640,
                "y": 300,
                "type": "cleat"
            },
            {
                "x": 650,
                "y": 300,
                "type": "cleat"
            },
            {
                "x": 650,
                "y": 270,
                "type": "cleat"
            },
            {
                "x": 650,
                "y": 240,
                "type": "cleat"
            },
            {
                "x": 650,
                "y": 210,
                "type": "cleat"
            },
            {
                "x": 650,
                "y": 907,
                "type": "cleat"
            },
            {
                "x": 650,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 670,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 640,
                "y": 150,
                "type": "cleat"
            },
            {
                "x": 800,
                "y": 380,
                "type": "cleat"
            },
            {
                "x": 800,
                "y": 450,
                "type": "cleat"
            },
            {
                "x": 760,
                "y": 450,
                "type": "cleat"
            },
            {
                "x": 650,
                "y": 380,
                "type": "cleat"
            },
            {
                "x": 660,
                "y": 380,
                "type": "cleat"
            },
            {
                "x": 660,
                "y": 410,
                "type": "cleat"
            },
            {
                "x": 660,
                "y": 450,
                "type": "cleat"
            }
        ]
    }
];

// ============================================================
// DEFAULT SCENARIOS — één per haven, gemigreerd vanuit originele havendata
// ============================================================
export const DEFAULT_SCENARIOS: ScenarioData[] = [
    {
        id: 's1', name: 'Harbour 1 – Standaard', harborId: 'h1',
        wind: { direction: 0, force: 0 },
        mooringSpots: [
            { x: 120, y: 170, width: 50, points: 10, angle: 0, order: 1, timeLimit: 90 },
            { x: 220, y: 170, width: 50, points: 10, angle: 0, order: 1, timeLimit: 90 },
            { x: 330, y: 220, width: 50, points: 25, angle: 90, order: 2, timeLimit: 90 },
            { x: 870, y: 210, width: 50, points: 25, angle: 90, order: 2, timeLimit: 90 },
            { x: 670, y: 200, width: 50, points: 25, angle: 90, order: 3, timeLimit: 60 },
            { x: 460, y: 170, width: 50, points: 10, angle: 0, order: 3, timeLimit: 60 },
            { x: 840, y: 170, width: 50, points: 10, angle: 0, order: 4, timeLimit: 60 },
            { x: 590, y: 190, width: 50, points: 25, angle: 90, order: 4, timeLimit: 60 }
        ],
        coins: []
    },
    {
        id: 's2', name: 'Harbour 2 – Wind 15kn', harborId: 'h2',
        wind: { direction: 0, force: 15 },
        mooringSpots: [
            { x: 120, y: 170, width: 50, points: 10, angle: 0, order: 1, timeLimit: 90 },
            { x: 220, y: 170, width: 50, points: 10, angle: 0, order: 2, timeLimit: 90 },
            { x: 330, y: 220, width: 50, points: 25, angle: 90, order: 2, timeLimit: 90 },
            { x: 870, y: 210, width: 50, points: 25, angle: 90, order: 3, timeLimit: 75 },
            { x: 670, y: 200, width: 50, points: 25, angle: 90, order: 3, timeLimit: 75 },
            { x: 460, y: 170, width: 50, points: 10, angle: 0, order: 4, timeLimit: 60 },
            { x: 840, y: 170, width: 50, points: 10, angle: 0, order: 4, timeLimit: 60 },
            { x: 590, y: 230, width: 50, points: 25, angle: 90, order: 5, timeLimit: 60 }
        ],
        coins: []
    },
    {
        id: 's3', name: 'Harbour 3 – Wind 20kn zij', harborId: 'h3',
        wind: { direction: 90, force: 20 },
        mooringSpots: [
            { x: 120, y: 170, width: 50, points: 10, angle: 0 },
            { x: 220, y: 170, width: 50, points: 10, angle: 0 },
            { x: 330, y: 220, width: 50, points: 25, angle: 90 },
            { x: 680, y: 260, width: 50, points: 15, angle: 90 },
            { x: 870, y: 230, width: 50, points: 10, angle: 90 },
            { x: 330, y: 470, width: 50, points: 25, angle: 90 },
            { x: 590, y: 480, width: 50, points: 15, angle: 90 },
            { x: 870, y: 470, width: 50, points: 10, angle: 90 }
        ],
        coins: []
    },
    {
        id: 's4', name: 'Harbour 4 – Storm 35kn', harborId: 'h4',
        wind: { direction: 180, force: 35 },
        mooringSpots: [
            { x: 120, y: 170, width: 50, points: 10, angle: 0 },
            { x: 220, y: 170, width: 50, points: 10, angle: 0 },
            { x: 330, y: 220, width: 50, points: 25, angle: 90 },
            { x: 870, y: 210, width: 50, points: 25, angle: 90 },
            { x: 330, y: 410, width: 50, points: 25, angle: 90 },
            { x: 680, y: 410, width: 50, points: 15, angle: 90 },
            { x: 780, y: 420, width: 50, points: 10, angle: 90 },
            { x: 670, y: 200, width: 50, points: 25, angle: 90 },
            { x: 460, y: 170, width: 50, points: 10, angle: 0 }
        ],
        coins: []
    }
];

// ============================================================
// HELPER FUNCTIES
// ============================================================
export function getHarborById(id: string): HarborData | undefined {
    return DEFAULT_HARBORS.find(h => h.id === id);
}
export function getScenariosForHarbor(harborId: string): ScenarioData[] {
    return DEFAULT_SCENARIOS.filter(s => s.harborId === harborId);
}
export function getScenarioById(id: string): ScenarioData | undefined {
    return DEFAULT_SCENARIOS.find(s => s.id === id);
}
/** Oefenmodus: gebruik haven-eigen wind/spots als "scenario" */
export function harborToLegacyScenario(harbor: HarborData): ScenarioData {
    return {
        id: `practice_${harbor.id}`,
        name: harbor.name,
        harborId: harbor.id,
        wind: harbor.wind ?? { direction: 0, force: 0 },
        mooringSpots: harbor.mooringSpots ?? [],
        coins: harbor.coins ?? []
    };
}

// ============================================================
// DEFAULT GAMES — klaar om te spelen, ook voor anonieme spelers
// ============================================================
export const DEFAULT_GAMES: GameData[] = [
    {
        id: 'game1',
        name: 'Leer Aanleggen',
        description: 'De basis van veilig aanleggen. Drie havens, oplopende wind.',
        isPublished: true,
        scenarios: [
            {
                scenarioId: 's1',
                introText: 'Welkom! Dit is haven 1.\n\nLeg de boot aan op de groene vlakken in de juiste volgorde. Een spot gloeit als hij aan de beurt is.\n\nSnel en netjes aanleggen geeft meer punten!',
                unlockAfterPrevious: false
            },
            {
                scenarioId: 's2',
                introText: 'Nu waait het harder — 15 knopen wind van voren.\n\nLetop winddruk bij het aanleggen. Compenseer met motor en roer.',
                unlockAfterPrevious: true
            },
            {
                scenarioId: 's3',
                introText: 'Zijwind! 20 knopen dwars.\n\nAnder haven, andere opstelling. Gebruik boeglijn als ankerpunt.',
                unlockAfterPrevious: true
            }
        ]
    }
];
