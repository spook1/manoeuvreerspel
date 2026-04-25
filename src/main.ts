import './style.css';
import { gameState } from './core/GameState';
import { input } from './core/Input';
import { Boat } from './sim/Boat';
import { Render } from './ui/Render';
import { GameManager } from './core/GameManager';
import { tutorial } from './core/Tutorial';
import { UserBar } from './ui/UserBar';
import { scenarioRunner } from './core/ScenarioRunner';
import { touchUI } from './ui/TouchUI';
import { camera } from './core/Camera';
import { GameRunner } from './core/GameRunner';
import { AdminPanel } from './ui/AdminPanel';

new UserBar(); // instantiated for DOM side-effects
AdminPanel.mount();
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

(window as any).practiceMenuClosed = false;

function syncControlHint() {
    const hintEl = document.getElementById('controlHintLine');
    if (!hintEl) return;

    const isTouchProfile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    hintEl.textContent = isTouchProfile
        ? 'Mobiel: gebruik de roerslider en de gashendel (Vooruit / Neutraal / Achteruit).'
        : 'Desktop: stuur met pijltjes of WASD, gas met omhoog/omlaag, en Spatie voor neutraal.';
}

function showIntroModal() {
    const introModal = document.getElementById('introModal');
    if (introModal) introModal.style.display = 'flex';
}

const abortGameSession = () => {
    const wasGameMode = gameState.gameMode === 'game';

    tutorial.stop();
    scenarioRunner.reset();

    const messageModal = document.getElementById('messageModal');
    if (messageModal) messageModal.style.display = 'none';

    if (GameRunner.isPlaying) {
        GameRunner.stop();
    }

    gameState.scenario = null;
    (window as any).practiceMenuClosed = false;

    if (wasGameMode) {
        gameManager.startGameMode();
    } else {
        gameManager.startPracticeMode();
    }

    showIntroModal();
};
(window as any).abortGameSession = abortGameSession;

function bindPlayHudMenuButton() {
    const menuBtn = document.getElementById('playHudMenu') as HTMLButtonElement | null;
    if (!menuBtn) return;
    let guardUntil = 0;

    const handleMenuTap = (e: Event) => {
        const now = Date.now();
        if (now < guardUntil) return;
        guardUntil = now + 250;
        e.preventDefault();
        e.stopPropagation();
        abortGameSession();
    };

    menuBtn.onclick = handleMenuTap as any;
    menuBtn.onpointerup = handleMenuTap as any;
    menuBtn.ontouchend = handleMenuTap as any;
}

function syncGameplayChrome() {
    const isPlayingSession = tutorial.active
        || (gameState.gameMode === 'game' && (scenarioRunner.state !== 'idle' || GameRunner.isPlaying))
        || (gameState.gameMode === 'practice' && (window as any).practiceMenuClosed);

    document.body.classList.toggle('playing-session', isPlayingSession);
}

function loop() {
    const isEdit = gameState.gameMode === 'edit'
        || gameState.gameMode === 'harbor-edit'
        || gameState.gameMode === 'scenario-edit';

    if (!isEdit) {
        camera.active = true;
        input.applyToBoat(gameState.boat);
        camera.update(gameState);

        // Physics
        Boat.updatePhysics(gameState);

        // Tutorial update (coin collection, step progression)
        tutorial.update(gameState);

        if (gameState.gameMode === 'game') {
            scenarioRunner.update(gameState, 16.666);
        }
    } else {
        camera.active = false;
    }

    syncGameplayChrome();

    // Touch controls visibility
    touchUI.syncVisibility(gameState.gameMode);

    // Render
    render.draw(gameState);

    requestAnimationFrame(loop);
}


// Start loop
syncControlHint();
bindPlayHudMenuButton();
requestAnimationFrame(loop);
