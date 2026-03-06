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
    {
        id: 'h1',
        name: 'Standaard Haven 1',
        version: '1.0',
        boatStart: { x: 200, y: 500, heading: 0 },
        wind: { direction: 0, force: 0 },
        jetties: [],
        piles: []
    },
    {
        id: 'h2',
        name: 'Standaard Haven 2',
        version: '1.0',
        boatStart: { x: 200, y: 500, heading: 0 },
        wind: { direction: 0, force: 0 },
        jetties: [],
        piles: []
    },
    {
        id: 'h3',
        name: 'Standaard Haven 3',
        version: '1.0',
        boatStart: { x: 200, y: 500, heading: 0 },
        wind: { direction: 0, force: 0 },
        jetties: [],
        piles: []
    },
    {
        id: 'h4',
        name: 'Standaard Haven 4',
        version: '1.0',
        boatStart: { x: 200, y: 500, heading: 0 },
        wind: { direction: 0, force: 0 },
        jetties: [],
        piles: []
    }
];

// ============================================================
// DEFAULT SCENARIOS
// ============================================================
export const DEFAULT_SCENARIOS: ScenarioData[] = [
    {
        id: 's1', name: 'Standaard Scenario 1', harborId: 'h1',
        wind: { direction: 0, force: 0 },
        mooringSpots: [], coins: []
    },
    {
        id: 's2', name: 'Standaard Scenario 2', harborId: 'h2',
        wind: { direction: 0, force: 0 },
        mooringSpots: [], coins: []
    },
    {
        id: 's3', name: 'Standaard Scenario 3', harborId: 'h3',
        wind: { direction: 0, force: 0 },
        mooringSpots: [], coins: []
    },
    {
        id: 's4', name: 'Standaard Scenario 4', harborId: 'h4',
        wind: { direction: 0, force: 0 },
        mooringSpots: [], coins: []
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
