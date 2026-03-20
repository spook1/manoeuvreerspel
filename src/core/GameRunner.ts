import { ApiClient } from './ApiClient';
import { gameState } from './GameState';
import { GameManager } from './GameManager';
import { scenarioRunner } from './ScenarioRunner';

export class GameRunner {
    static activeGame: any = null;
    static currentIndex: number = 0;
    static gameManager: GameManager | null = null;
    static isPlaying: boolean = false;

    static async start(gameId: number | string, manager: GameManager) {
        this.gameManager = manager;
        try {
            const gameData = await ApiClient.getGame(Number(gameId));
            this.activeGame = gameData;
            this.currentIndex = 0;
            
            if (!this.activeGame.scenarios || this.activeGame.scenarios.length === 0) {
                alert("Deze game bevat geen scenario's.");
                return;
            }

            gameState.score = this.activeGame.start_points !== undefined ? this.activeGame.start_points : 100;
            this.isPlaying = true;
            this.updateUI();
            this.playCurrentScenario();
        } catch(e) {
            console.error("Could not load game:", e);
            alert("Spel kon niet geladen worden.");
        }
    }

    static playCurrentScenario() {
        if (!this.activeGame || !this.isPlaying || !this.gameManager) return;

        if (this.currentIndex >= this.activeGame.scenarios.length) {
            this.endGame();
            return;
        }

        const sc = this.activeGame.scenarios[this.currentIndex];
        
        const title = this.currentIndex === 0 ? `🚀 Game Start: ${this.activeGame.name}` : `✅ Level Voltooid!`;
        const desc = this.currentIndex === 0 
           ? (this.activeGame.description || 'Bereid je voor op het eerste scenario...') 
           : `Op naar het volgende scenario: ${sc.name}`;

        this.updateUI();

        this.showTransitionScreen(title, desc, () => {
            this.gameManager!.startScenario(sc, true); // true = maintainScore
            
            // Override callbacks
            scenarioRunner.onComplete = () => this.onScenarioComplete();
            scenarioRunner.onFail = () => this.onScenarioFail();
        });
    }

    static showTransitionScreen(title: string, desc: string, onContinue: () => void) {
        const modal = document.getElementById('messageModal');
        const titleEl = document.getElementById('msgModalTitle');
        const descEl = document.getElementById('msgModalText');
        
        if(modal && titleEl && descEl) {
            titleEl.textContent = title;
            descEl.textContent = desc;
            modal.style.display = 'block';

            // Find the button (assuming there's only one button inside the modal for OK)
            const btn = modal.querySelector('button');
            if (btn) {
                const newBtn = btn.cloneNode(true) as HTMLButtonElement;
                btn.replaceWith(newBtn);
                newBtn.onclick = () => {
                    modal.style.display = 'none';
                    onContinue();
                };
            }
        } else {
            alert(`${title}\n\n${desc}`);
            onContinue();
        }
    }

    static onScenarioComplete() {
        if (!this.isPlaying) return;
        this.currentIndex++;
        this.playCurrentScenario();
    }

    static onScenarioFail() {
        if (!this.isPlaying) return;
        
        const penalty = 10;
        gameState.score -= penalty;

        if (gameState.score <= 0) {
            this.showTransitionScreen("💥 Game Over", "Je punten zijn op! Game Over.", () => {
                this.stop();
            });
        } else {
            const status = document.getElementById('status');
            const box = document.getElementById('status-message-box');
            if (status && box) {
                status.textContent = `Scenario mislukt! Je verliest ${penalty} punten. Resterend: ${Math.floor(gameState.score)}`;
                status.style.color = '#ef4444';
                box.style.display = 'block';
                setTimeout(() => {
                    box.style.display = 'none';
                    this.gameManager?.resetCurrentLevel();
                    
                    // Re-override callbacks just in case reset breaks them
                    scenarioRunner.onComplete = () => this.onScenarioComplete();
                    scenarioRunner.onFail = () => this.onScenarioFail();
                }, 3000);
            }
        }
    }

    static endGame() {
        const target = this.activeGame.target_points || 0;
        const msg = gameState.score >= target 
             ? `Gefeliciteerd! Je hebt het minimum doel van ${target} behaald met ${Math.floor(gameState.score)} punten!`
             : `Helaas! Je eindigde met ${Math.floor(gameState.score)} punten, maar je had er ${target} nodig.`;

        this.showTransitionScreen("🏁 Game Voltooid", msg, () => {
            this.stop();
        });
    }

    static stop() {
        this.isPlaying = false;
        this.activeGame = null;
        this.updateUI();
        if (this.gameManager) {
            this.gameManager.startPracticeMode();
        }
    }

    static updateUI() {
        const pill = document.getElementById('gameProgressPill');
        const display = document.getElementById('gameProgressDisplay');
        
        if (this.isPlaying && this.activeGame) {
            if (pill) pill.style.display = 'flex';
            if (display) display.textContent = `${this.currentIndex + 1}/${this.activeGame.scenarios.length}`;
        } else {
            if (pill) pill.style.display = 'none';
        }
    }
}
