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

        const raw = this.activeGame.scenarios[this.currentIndex];

        // Vertaal ruwe API-data naar het ScenarioData-formaat dat startScenario() verwacht.
        // De API geeft 'harbor_id' en 'json_data', maar startScenario() verwacht 'harborId', 'wind', etc.
        const sc = {
            id: String(raw.id),
            name: raw.name,
            description: raw.description || '',
            instructions: raw.json_data?.instructions,
            harborId: raw.harbor
                ? (raw.harbor.is_official ? `official_${raw.harbor_id}` : `custom_${raw.harbor_id}`)
                : `official_${raw.harbor_id}`,
            is_official: raw.is_official || false,
            wind: raw.json_data?.wind || { direction: 0, force: 0 },
            mooringSpots: raw.json_data?.mooringSpots || [],
            coins: raw.json_data?.coins || [],
            boatStart: raw.json_data?.boatStart,
            physics: raw.json_data?.physics,
            coinSettings: raw.json_data?.coinSettings,
            objectPenalties: raw.json_data?.objectPenalties
        };

        const title = this.currentIndex === 0 ? `🚀 Game Start: ${this.activeGame.name}` : `✅ Level Voltooid!`;
        
        let desc = '';
        if (this.currentIndex === 0 && this.activeGame.description) {
            desc += `${this.activeGame.description}\n\n`;
        }
        
        const scDesc = this.getScenarioInstruction(sc);
        desc += `Opdracht (${sc.name}):\n${scDesc}`;

        this.updateUI();

        this.showTransitionScreen(title, desc, () => {
            this.gameManager!.startScenario(sc, true); // true = maintainScore
            
            // Override callbacks
            scenarioRunner.onComplete = () => this.onScenarioComplete();
            scenarioRunner.onFail = () => this.onScenarioFail();
        });
    }

    static getScenarioInstruction(sc: any): string {
        const isMobileInterface = window.matchMedia('(pointer: coarse), (max-width: 900px)').matches
            || navigator.maxTouchPoints > 0;
        const desktopText = sc.instructions?.desktop?.trim();
        const mobileText = sc.instructions?.mobile?.trim();
        const defaultText = sc.description?.trim();

        if (isMobileInterface) {
            return mobileText || desktopText || defaultText || 'Probeer alle opdrachten binnen de tijd te voltooien.';
        }
        return desktopText || defaultText || mobileText || 'Probeer alle opdrachten binnen de tijd te voltooien.';
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
