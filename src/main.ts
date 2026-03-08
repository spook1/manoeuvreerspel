import './style.css';
import { gameState } from './core/GameState';
import { input } from './core/Input';
import { Boat } from './sim/Boat';
import { Render } from './ui/Render';
import { GameManager } from './core/GameManager';
import { tutorial } from './core/Tutorial';
import { UserBar } from './ui/UserBar';
import { scenarioRunner } from './core/ScenarioRunner';

new UserBar(); // instantiated for DOM side-effects
const render = new Render('simCanvas');
render.setGameState(gameState);
const gameManager = new GameManager();
gameManager.setupGlobalbindings();

// Expose tutorial to GameManager
(window as any)._tutorial = tutorial;

function loop() {
    const isEdit = gameState.gameMode === 'edit'
        || gameState.gameMode === 'harbor-edit'
        || gameState.gameMode === 'scenario-edit';

    // Always consume to keep buffer clear
    const keyDowns = input.consumeKeyDowns();

    if (!isEdit) {
        for (const key of keyDowns) {
            input.processKeyDown(key, gameState.boat);
        }

        // Continuous input handling (rudder, space)
        input.handleInput(gameState.boat);

        // Physics
        Boat.updatePhysics(gameState);

        // Tutorial update (coin collection, step progression)
        tutorial.update(gameState);

        if (gameState.gameMode === 'game') {
            scenarioRunner.update(gameState, 16.666);
        }
    }

    // Render
    render.draw(gameState);

    requestAnimationFrame(loop);
}


// Start loop
requestAnimationFrame(loop);
