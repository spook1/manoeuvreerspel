export interface PenaltySettings {
    maxSpeedKnots?: number; // legacy
    speedThresholdSoft?: number;
    speedThresholdHard?: number;
    hullPenaltySoft?: number;
    hullPenaltyHard?: number;
    fenderPenaltySoft?: number;
    fenderPenaltyHard?: number;
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
    linesRequired?: number;       // Aantal lijnen nodig voor succes (default 3)
    mooringTimeRequired?: number; // Tijd in sec dat de boot goed in de spot moet liggen (default 30)
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

// ============================================================
// LEGE TEMPLATE — startpunt voor nieuwe haven
// ============================================================
export const EMPTY_HARBOR_TEMPLATE: HarborData = {
    id: 'new_template',
    name: 'Nieuwe Haven',
    version: '1.0',
    boatStart: { x: 200, y: 500, heading: 0 },
    wind: { direction: 0, force: 0 },
    jetties: [],
    piles: []
};

/** Officiële (standaard) havens — dynamisch geladen via API */
export let officialHarbors: HarborData[] = [];
export let officialScenarios: ScenarioData[] = [];
export let officialGames: GameData[] = [];
export function setOfficialHarbors(harbors: HarborData[]) { officialHarbors = harbors; }
export function setOfficialScenarios(scenarios: ScenarioData[]) { officialScenarios = scenarios; }
export function setOfficialGames(games: GameData[]) { officialGames = games; }

// Backwards compat: lege array (niet meer hardcoded, wordt dynamisch gevuld)
export const DEFAULT_HARBORS: HarborData[] = [];
export const DEFAULT_SCENARIOS: ScenarioData[] = [];
export const DEFAULT_GAMES: GameData[] = [];

// ============================================================
// HELPER FUNCTIES — zoeken in officialHarbors (gevuld via API)
// ============================================================
export function getHarborById(id: string): HarborData | undefined {
    return officialHarbors.find(h => h.id === id);
}
export function getScenariosForHarbor(harborId: string): ScenarioData[] {
    return officialScenarios.filter(s => s.harborId === harborId);
}
export function getScenarioById(id: string): ScenarioData | undefined {
    return officialScenarios.find(s => s.id === id);
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

