export const Constants = {
    GAME_SCALE: 1.3,
    harborPadding: 40,
    BOX_LENGTH: 140,
    BOAT_WIDTH: 24,
    JETTY_WIDTH: 10,
    QUAY_Y: 150,
    boxesConfigX: 200,

    // Physics — matched to manoeuvreerspel/index.html
    MAX_THROTTLE: 0.8,
    THROTTLE_STEP: 0.08,
    RUDDER_STEP: 3,
    PX_PER_KNOT: 3.43,
    CRASH_SPEED: 50,
    SPEED_LIMIT_PERFECT: 1.0 * 3.43,
    SPEED_LIMIT_OK: 2.0 * 3.43,
    FENDER_RADIUS: 3,
    PILE_RADIUS: 5,
    FENDER_POSITIONS: [-30, -14, 7, 32],
    FENDER_FRICTION: 0.2,
    DT: 1 / 60,
    INERTIA: 2000,
    MAX_LINE_FORCE: 10000,
    LINE_STRENGTH: 5,
    MASS: 5,
    RUDDER_WASH_GAIN: 500,
    RUDDER_HYDRO_GAIN: 3,
    PROP_WALK_STRENGTH: 2.25,
    LATERAL_DRAG_COEFF: 100,
    DRAG_COEFF: 0.05,
    THRUST_GAIN: 50,
    TURN_SPEED: 0.3,

    /** Reset alle mutable physics-velden terug naar hun standaardwaarden */
    reset() {
        this.LINE_STRENGTH = 5;
        this.MASS = 5;
        this.RUDDER_WASH_GAIN = 500;
        this.RUDDER_HYDRO_GAIN = 3;
        this.LATERAL_DRAG_COEFF = 100;
        this.DRAG_COEFF = 0.05;
        this.THRUST_GAIN = 50;
    }
};
