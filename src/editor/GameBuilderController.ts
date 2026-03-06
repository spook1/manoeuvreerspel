import { ApiClient } from '../core/ApiClient';
import { DEFAULT_SCENARIOS } from '../data/harbors';

// Define Game Interface used for the builder
export interface GameData {
    id: string;
    name: string;
    description: string;
    scenarios: any[];
    is_public: boolean;
}

let activeGame: GameData = { id: 'new', name: '', description: '', scenarios: [], is_public: false };
let myScenarios: any[] = [];
let allScenarios: any[] = [];

export class GameBuilderController {

    static async mount() {
        // Fetch scenarios from API to show in available list
        try {
            if (ApiClient.isLoggedIn) {
                myScenarios = await ApiClient.getMyScenarios();
            }
        } catch (e) {
            console.error(e);
        }

        allScenarios = [...DEFAULT_SCENARIOS, ...myScenarios];
        this.renderAvailableScenarios();
        this.renderSelectedScenarios();

        // Bind Search
        const searchInput = document.getElementById('gbSearchInput') as HTMLInputElement;
        if (searchInput) {
            searchInput.addEventListener('input', () => this.renderAvailableScenarios(searchInput.value));
        }

        // Bind Save
        const bSave = document.getElementById('gbSaveBtn');
        if (bSave) {
            bSave.onclick = () => this.saveGame();
        }

        // Bind Exit
        const bExit = document.getElementById('gbExitBtn');
        if (bExit) {
            bExit.onclick = () => this.hide();
        }
    }

    static show() {
        const overlay = document.getElementById('gameBuilderOverlay');
        if (overlay) overlay.style.display = 'block';

        activeGame = { id: 'new', name: '', description: '', scenarios: [], is_public: false };
        (document.getElementById('gbGameNameInput') as HTMLInputElement).value = '';
        (document.getElementById('gbGameDescInput') as HTMLTextAreaElement).value = '';

        this.mount();
    }

    static hide() {
        const overlay = document.getElementById('gameBuilderOverlay');
        if (overlay) overlay.style.display = 'none';

        // Let GameManager refresh
        if ((window as any).refreshGames) (window as any).refreshGames();
    }

    static renderAvailableScenarios(filter: string = '') {
        const container = document.getElementById('gbAvailableScenariosList');
        if (!container) return;

        container.innerHTML = '';
        const f = filter.toLowerCase();

        allScenarios.filter(s => s.name.toLowerCase().includes(f)).forEach(scen => {
            const el = document.createElement('div');
            el.style.cssText = `background:rgba(15,23,42,0.8); border:1px solid #334155; padding:8px 12px; border-radius:6px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; transition:background 0.2s;`;
            el.innerHTML = `
                <div>
                    <div style="font-size:13px; color:#e2e8f0; font-weight:bold;">${scen.name}</div>
                    <div style="font-size:10px; color:#94a3b8;">${scen.id.startsWith('custom') ? 'Mijn Scenario' : 'Standaard Scenario'}</div>
                </div>
                <div style="font-size:16px;">➕</div>
            `;
            el.addEventListener('mouseover', () => el.style.background = 'rgba(30,41,59,0.9)');
            el.addEventListener('mouseout', () => el.style.background = 'rgba(15,23,42,0.8)');
            el.onclick = () => {
                activeGame.scenarios.push(scen);
                this.renderSelectedScenarios();
            };
            container.appendChild(el);
        });
    }

    static renderSelectedScenarios() {
        const container = document.getElementById('gbSelectedScenariosList');
        if (!container) return;

        if (activeGame.scenarios.length === 0) {
            container.innerHTML = `
                <div id="gbEmptyState" style="text-align:center; padding:40px 20px; border:2px dashed #334155; border-radius:8px; color:#64748b;">
                    Voeg scenario's toe uit de linker menubalk om je game-reeks te bouwen.
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        activeGame.scenarios.forEach((scen, index) => {
            const el = document.createElement('div');
            el.style.cssText = `background:rgba(30,41,59,0.9); border:1px solid #475569; padding:12px; border-radius:6px; display:flex; align-items:center; justify-content:space-between;`;

            el.innerHTML = `
                <div style="display:flex; align-items:center; gap:12px;">
                    <div style="background:#3b82f6; width:24px; height:24px; border-radius:50%; color:white; font-size:12px; font-weight:bold; display:flex; align-items:center; justify-content:center;">${index + 1}</div>
                    <div>
                        <div style="font-size:14px; color:#e2e8f0; font-weight:bold;">${scen.name}</div>
                        <div style="font-size:11px; color:#94a3b8;">Scenario ID: ${scen.id}</div>
                    </div>
                </div>
                <div style="display:flex; gap:6px;">
                    <button class="up-btn" style="background:transparent; border:none; cursor:pointer; color:#94a3b8; font-size:16px;">⬆️</button>
                    <button class="down-btn" style="background:transparent; border:none; cursor:pointer; color:#94a3b8; font-size:16px;">⬇️</button>
                    <button class="del-btn" style="background:transparent; border:none; cursor:pointer; color:#ef4444; font-size:16px; margin-left:8px;">🗑️</button>
                </div>
            `;

            const btnUp = el.querySelector('.up-btn') as HTMLButtonElement;
            const btnDown = el.querySelector('.down-btn') as HTMLButtonElement;
            const btnDel = el.querySelector('.del-btn') as HTMLButtonElement;

            if (index === 0) btnUp.style.opacity = '0.2';
            else btnUp.onclick = () => this.moveScenario(index, -1);

            if (index === activeGame.scenarios.length - 1) btnDown.style.opacity = '0.2';
            else btnDown.onclick = () => this.moveScenario(index, 1);

            btnDel.onclick = () => {
                activeGame.scenarios.splice(index, 1);
                this.renderSelectedScenarios();
            };

            container.appendChild(el);
        });
    }

    static moveScenario(index: number, diff: number) {
        const item = activeGame.scenarios.splice(index, 1)[0];
        activeGame.scenarios.splice(index + diff, 0, item);
        this.renderSelectedScenarios();
    }

    static async saveGame() {
        const nameInput = document.getElementById('gbGameNameInput') as HTMLInputElement;
        const descInput = document.getElementById('gbGameDescInput') as HTMLTextAreaElement;

        if (!nameInput.value.trim()) {
            alert('Geef je game een naam!');
            return;
        }

        if (activeGame.scenarios.length === 0) {
            alert('Voeg ten minste één scenario toe!');
            return;
        }

        const name = nameInput.value;
        const description = descInput.value;
        // The API expects numeric scenario IDs. For 'custom' ones, they are just integers. 's1' standard ones... wait. The database scenarios table only stores custom scenarios! 
        // We have to extract numeric DB IDs for custom scenarios, but how do we reference static built-in scenarios (e.g. 's1') in the database pivot table? 
        // This is tricky. Let's see how `ApiClient` works later or assume we only use cloud scenarios. For now we will pass integer IDs if possible. 
        // The Laravel validation `exists:scenarios,id` means ONLY database scenarios are allowed.

        let validIds: number[] = [];
        for (const s of activeGame.scenarios) {
            const maybeId = parseInt(s.id);
            if (!isNaN(maybeId) && maybeId > 0) {
                validIds.push(maybeId);
            }
        }

        if (validIds.length === 0) {
            alert('Je hebt momenteel alleen standaard-scenario\'s geselecteerd. Omdat Games via de cloud gaan, moet je minimaal één Cloud Scenario toevoegen om deze game op te slaan.');
            return;
        }

        const payload = {
            name: name,
            description: description,
            is_public: false,
            scenario_ids: validIds
        };

        const btn = document.getElementById('gbSaveBtn');
        if (btn) btn.textContent = '⏳ ...';

        try {
            if (activeGame.id === 'new') {
                await ApiClient.saveGame(payload);
            } else {
                await ApiClient.updateGame(Number(activeGame.id), payload);
            }
            if (btn) btn.textContent = '✅ Opgeslagen';
            setTimeout(() => {
                if (btn) btn.textContent = '💾 Game Opslaan';
                this.hide();
            }, 1000);
        } catch (e: any) {
            alert('Mislukt: ' + e.message);
            if (btn) btn.textContent = '💾 Game Opslaan';
        }
    }
}
