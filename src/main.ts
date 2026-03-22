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

function makeDraggable(headerId: string, panelId: string) {
    const header = document.getElementById(headerId);
    const panel = document.getElementById(panelId);
    if (!header || !panel) return;

    let isDragging = false;
    let startX = 0, startY = 0, initialLeft = 0, initialTop = 0;

    header.addEventListener('mousedown', (e) => {
        if ((e.target as HTMLElement).tagName.toLowerCase() === 'button') return; // Ignore exit button clicks
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        
        // Convert to absolute so we can move it freely, removing layout constraints
        const rect = panel.getBoundingClientRect();
        panel.style.position = 'absolute';
        panel.style.margin = '0';
        panel.style.left = rect.left + 'px';
        panel.style.top = rect.top + 'px';
        panel.style.transform = 'none';

        initialLeft = rect.left;
        initialTop = rect.top;
        header.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        panel.style.left = `${initialLeft + dx}px`;
        panel.style.top = `${initialTop + dy}px`;
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
        header.style.cursor = 'grab';
    });
}

// Make panels draggable
makeDraggable('heHeader', 'hePanel');
makeDraggable('seHeader', 'seRightPanel');
makeDraggable('gbHeader', 'gbPanel');

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
