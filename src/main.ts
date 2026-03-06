import './style.css';
import { gameState } from './core/GameState';
import { input } from './core/Input';
import { Boat } from './sim/Boat';
import { Render } from './ui/Render';
import { GameManager } from './core/GameManager';
import { tutorial } from './core/Tutorial';
import { UserBar } from './ui/UserBar';

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

        // Game Coin Collection
        if (gameState.gameMode === 'game') {
            for (const coin of gameState.coins) {
                if (coin.collected) continue;
                const dx = gameState.boat.x - coin.x;
                const dy = gameState.boat.y - coin.y;
                if (dx * dx + dy * dy < (coin.radius + 20) ** 2) {
                    coin.collected = true;
                    // console.log("Coin collected!");
                }
            }
            // Check level completion
            if (gameState.coins.length > 0 && gameState.coins.every(c => c.collected)) {
                // Level Complete Logic?
                // For now just stay here.
            }
        }
    }

    // Render
    render.draw(gameState);

    requestAnimationFrame(loop);
}


// Start loop
requestAnimationFrame(loop);
