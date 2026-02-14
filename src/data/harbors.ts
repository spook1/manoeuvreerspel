export interface HarborJetty {
    x: number;
    y: number;
    w: number;
    h: number;
    angle: number;
}

export interface HarborPile {
    x: number;
    y: number;
    type: 'cleat' | 'pile';
    id?: number;
}

export interface HarborMooringSpot {
    x: number;
    y: number;
    width: number;
    points: number;
    angle: number;
    id?: string;
}

export interface HarborData {
    name: string;
    version: string;
    wind: {
        direction: number;
        force: number;
    };
    jetties: HarborJetty[];
    piles: HarborPile[];
    mooringSpots: HarborMooringSpot[];
}

export const DEFAULT_HARBORS: HarborData[] = [
    // Harbor 1
    {
        "name": "Harbour 1",
        "version": "1.0",
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
        ],
        "mooringSpots": [
            {
                "x": 120,
                "y": 170,
                "width": 50,
                "points": 10,
                "angle": 0
            },
            {
                "x": 220,
                "y": 170,
                "width": 50,
                "points": 10,
                "angle": 0
            },
            {
                "x": 330,
                "y": 220,
                "width": 50,
                "points": 25,
                "angle": 90
            },
            {
                "x": 870,
                "y": 210,
                "width": 50,
                "points": 25,
                "angle": 90
            },
            {
                "x": 670,
                "y": 200,
                "width": 50,
                "points": 25,
                "angle": 90
            },
            {
                "x": 460,
                "y": 170,
                "width": 50,
                "points": 10,
                "angle": 0
            },
            {
                "x": 840,
                "y": 170,
                "width": 50,
                "points": 10,
                "angle": 0
            },
            {
                "x": 590,
                "y": 190,
                "width": 50,
                "points": 25,
                "angle": 90
            }
        ]
    },
    // Harbor 2
    {
        "name": "Harbour 2",
        "version": "1.0",
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
        ],
        "mooringSpots": [
            {
                "x": 120,
                "y": 170,
                "width": 50,
                "points": 10,
                "angle": 0
            },
            {
                "x": 220,
                "y": 170,
                "width": 50,
                "points": 10,
                "angle": 0
            },
            {
                "x": 330,
                "y": 220,
                "width": 50,
                "points": 25,
                "angle": 90
            },
            {
                "x": 870,
                "y": 210,
                "width": 50,
                "points": 25,
                "angle": 90
            },
            {
                "x": 670,
                "y": 200,
                "width": 50,
                "points": 25,
                "angle": 90
            },
            {
                "x": 460,
                "y": 170,
                "width": 50,
                "points": 10,
                "angle": 0
            },
            {
                "x": 840,
                "y": 170,
                "width": 50,
                "points": 10,
                "angle": 0
            },
            {
                "x": 590,
                "y": 230,
                "width": 50,
                "points": 25,
                "angle": 90
            }
        ]
    },
    // Harbor 3
    {
        "name": "Harbour 3",
        "version": "1.0",
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
        ],
        "mooringSpots": [
            {
                "x": 120,
                "y": 170,
                "width": 50,
                "points": 10,
                "angle": 0
            },
            {
                "x": 220,
                "y": 170,
                "width": 50,
                "points": 10,
                "angle": 0
            },
            {
                "x": 330,
                "y": 220,
                "width": 50,
                "points": 25,
                "angle": 90
            },
            {
                "x": 680,
                "y": 260,
                "width": 50,
                "points": 15,
                "angle": 90
            },
            {
                "x": 870,
                "y": 230,
                "width": 50,
                "points": 10,
                "angle": 90
            },
            {
                "x": 330,
                "y": 470,
                "width": 50,
                "points": 25,
                "angle": 90
            },
            {
                "x": 590,
                "y": 480,
                "width": 50,
                "points": 15,
                "angle": 90
            },
            {
                "x": 870,
                "y": 470,
                "width": 50,
                "points": 10,
                "angle": 90
            }
        ]
    },
    // Harbor 4
    {
        "name": "Harbour 4",
        "version": "1.0",
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
        ],
        "mooringSpots": [
            {
                "x": 120,
                "y": 170,
                "width": 50,
                "points": 10,
                "angle": 0
            },
            {
                "x": 220,
                "y": 170,
                "width": 50,
                "points": 10,
                "angle": 0
            },
            {
                "x": 330,
                "y": 220,
                "width": 50,
                "points": 25,
                "angle": 90
            },
            {
                "x": 870,
                "y": 210,
                "width": 50,
                "points": 25,
                "angle": 90
            },
            {
                "x": 330,
                "y": 410,
                "width": 50,
                "points": 25,
                "angle": 90
            },
            {
                "x": 680,
                "y": 410,
                "width": 50,
                "points": 15,
                "angle": 90
            },
            {
                "x": 780,
                "y": 420,
                "width": 50,
                "points": 10,
                "angle": 90
            },
            {
                "x": 670,
                "y": 200,
                "width": 50,
                "points": 25,
                "angle": 90
            },
            {
                "x": 460,
                "y": 170,
                "width": 50,
                "points": 10,
                "angle": 0
            }
        ]
    }
];
