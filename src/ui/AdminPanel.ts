import { ApiClient } from '../core/ApiClient';

export class AdminPanel {
    static async mount() {
        const btnAdmin = document.getElementById('btnAdminPanel');
        if (btnAdmin) {
            btnAdmin.onclick = () => this.show();
        }

        // Add the modal HTML to body if it doesn't exist
        if (!document.getElementById('adminPanelOverlay')) {
            const html = `
            <div id="adminPanelOverlay" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); backdrop-filter:blur(4px); z-index:4000; align-items:center; justify-content:center; pointer-events:auto;">
                <div style="background:rgba(15,23,42,0.95); border:1px solid rgba(239,68,68,0.4); border-radius:12px; width:900px; max-width:95vw; max-height:90vh; display:flex; flex-direction:column; min-height:0; box-shadow: 0 10px 40px rgba(0,0,0,0.5); padding:20px; box-sizing:border-box;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid rgba(239,68,68,0.2); padding-bottom:10px;">
                        <h2 style="margin:0; color:#ef4444; font-size:20px;">⚙️ Admin Beheerportaal</h2>
                        <button onclick="document.getElementById('adminPanelOverlay').style.display='none'" style="background:#64748b; color:white; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; font-weight:bold;">✕ Sluiten</button>
                    </div>

                    <div style="display:flex; gap:10px; margin-bottom:16px;">
                        <button class="admin-tab-btn active" data-tab="users" style="padding:8px 16px; background:#334155; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:bold;">👥 Gebruikers</button>
                        <button class="admin-tab-btn" data-tab="harbors" style="padding:8px 16px; background:#1e293b; color:#94a3b8; border:none; border-radius:6px; cursor:pointer; font-weight:bold;">⚓ Havens</button>
                        <button class="admin-tab-btn" data-tab="scenarios" style="padding:8px 16px; background:#1e293b; color:#94a3b8; border:none; border-radius:6px; cursor:pointer; font-weight:bold;">🎬 Scenario's</button>
                        <button class="admin-tab-btn" data-tab="games" style="padding:8px 16px; background:#1e293b; color:#94a3b8; border:none; border-radius:6px; cursor:pointer; font-weight:bold;">📦 Games</button>
                    </div>

                    <div id="adminPanelContent" style="flex:1; min-height:0; overflow:auto; -webkit-overflow-scrolling:touch; overscroll-behavior:contain; background:rgba(30,41,59,0.5); border:1px solid #475569; border-radius:8px; padding:16px;">
                        <!-- Content loaded dynamically -->
                        Laden...
                    </div>
                </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', html);

            document.querySelectorAll('.admin-tab-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    document.querySelectorAll('.admin-tab-btn').forEach(b => {
                        (b as HTMLElement).style.background = '#1e293b';
                        (b as HTMLElement).style.color = '#94a3b8';
                        b.classList.remove('active');
                    });
                    const target = e.currentTarget as HTMLElement;
                    target.style.background = '#334155';
                    target.style.color = 'white';
                    target.classList.add('active');
                    this.loadTab(target.dataset.tab || 'users');
                });
            });
        }
    }

    static async show() {
        const overlay = document.getElementById('adminPanelOverlay');
        if (overlay) overlay.style.display = 'flex';
        this.loadTab('users');
    }

    static async loadTab(tab: string) {
        const content = document.getElementById('adminPanelContent');
        if (!content) return;
        content.innerHTML = '<div style="text-align:center; padding:40px; color:#94a3b8;">Laden...</div>';

        try {
            if (tab === 'users') {
                const users = await ApiClient.getUsers();
                const userById = new Map<number, any>();
                users.forEach((u: any) => userById.set(Number(u.id), u));
                let html = `
                    <div style="margin-bottom:16px; background:rgba(15,23,42,0.6); padding:12px; border-radius:8px; border:1px solid #475569;">
                        <h3 style="margin-top:0; color:#e2e8f0; font-size:14px;">➕ Nieuwe Gebruiker Aanmaken</h3>
                        <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
                            <input type="text" id="newUserName" placeholder="Naam" autocomplete="off" style="background:#1e293b; color:white; border:1px solid #475569; border-radius:4px; padding:6px; flex:1; min-width:120px;">
                            <input type="email" id="newUserEmail" placeholder="Email" autocomplete="off" style="background:#1e293b; color:white; border:1px solid #475569; border-radius:4px; padding:6px; flex:1; min-width:150px;">
                            <input type="password" id="newUserPassword" placeholder="Wachtwoord (min 8 char)" autocomplete="new-password" style="background:#1e293b; color:white; border:1px solid #475569; border-radius:4px; padding:6px; flex:1; min-width:150px;">
                            <select id="newUserRole" style="background:#1e293b; color:white; border:1px solid #475569; border-radius:4px; padding:6px; min-width:100px;">
                                <option value="speler">Speler</option>
                                <option value="pro">Pro</option>
                                <option value="gamemaster">Gamemaster</option>
                                <option value="super_admin">Super admin</option>
                            </select>
                            <button id="btnCreateUser" style="background:#10b981; color:white; border:none; padding:6px 16px; border-radius:4px; cursor:pointer; font-weight:bold;">Aanmaken</button>
                        </div>
                    </div>
                    <div style="max-height:50vh; overflow:auto; -webkit-overflow-scrolling:touch;">
                    <table style="width:100%; min-width:720px; border-collapse:collapse; color:#e2e8f0; font-size:13px; text-align:left;">
                        <thead>
                            <tr style="border-bottom:1px solid #475569; color:#94a3b8;">
                                <th style="padding:8px;">ID</th>
                                <th style="padding:8px;">Naam</th>
                                <th style="padding:8px;">Email</th>
                                <th style="padding:8px;">Rol</th>
                                <th style="padding:8px;">Stats</th>
                                <th style="padding:8px;">Actie</th>
                            </tr>
                        </thead>
                        <tbody>
                `;
                users.forEach((u: any) => {
                    html += `
                        <tr style="border-bottom:1px solid rgba(71,85,105,0.5);">
                            <td style="padding:8px;">${u.id}</td>
                            <td style="padding:8px; font-weight:bold;">${u.name}</td>
                            <td style="padding:8px;">${u.email}</td>
                            <td style="padding:8px;">
                                <span style="background:${(u.role === 'admin' || u.role === 'super_admin') ? '#ef4444' : u.role === 'pro' ? '#f59e0b' : u.role === 'gamemaster' ? '#8b5cf6' : '#334155'}; padding:2px 6px; border-radius:4px; font-size:11px;">${u.role === 'admin' ? 'super_admin' : (u.role === 'user' ? 'speler' : u.role)}</span>
                            </td>
                            <td style="padding:8px; color:#94a3b8; font-size:11px;">
                                ⚓ ${u.harbors_count || 0} | 🎬 ${u.scenarios_count || 0}
                            </td>
                            <td style="padding:8px;">
                                <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
                                    <select class="role-select" data-id="${u.id}" style="background:#1e293b; color:white; border:1px solid #475569; border-radius:4px; padding:2px; font-size:11px;">
                                        <option value="speler" ${(u.role === 'speler' || u.role === 'user') ? 'selected' : ''}>Speler</option>
                                        <option value="pro" ${u.role === 'pro' ? 'selected' : ''}>Pro</option>
                                        <option value="gamemaster" ${u.role === 'gamemaster' ? 'selected' : ''}>Gamemaster</option>
                                        <option value="super_admin" ${(u.role === 'admin' || u.role === 'super_admin') ? 'selected' : ''}>Super admin</option>
                                    </select>
                                    <button class="edit-user-btn" data-id="${u.id}" style="background:#2563eb; color:#fff; border:none; border-radius:4px; padding:3px 8px; cursor:pointer; font-size:11px;">Bewerk</button>
                                    <button class="delete-user-btn" data-id="${u.id}" style="background:#b91c1c; color:#fff; border:none; border-radius:4px; padding:3px 8px; cursor:pointer; font-size:11px;">Verwijder</button>
                                </div>
                            </td>
                        </tr>
                    `;
                });
                html += '</tbody></table></div>';
                content.innerHTML = html;

                const bindReplaceOnFocus = (id: string) => {
                    const input = document.getElementById(id) as HTMLInputElement | null;
                    if (!input) return;
                    input.addEventListener('focus', () => input.select());
                };
                bindReplaceOnFocus('newUserName');
                bindReplaceOnFocus('newUserEmail');
                bindReplaceOnFocus('newUserPassword');

                // Create user event listener
                const btnCreate = document.getElementById('btnCreateUser');
                if (btnCreate) {
                    btnCreate.addEventListener('click', async () => {
                        const name = (document.getElementById('newUserName') as HTMLInputElement).value;
                        const email = (document.getElementById('newUserEmail') as HTMLInputElement).value;
                        const password = (document.getElementById('newUserPassword') as HTMLInputElement).value;
                        const role = (document.getElementById('newUserRole') as HTMLSelectElement).value;

                        if (!name || !email || !password) {
                            alert("Vul alle velden in.");
                            return;
                        }

                        if (password.length < 8) {
                            alert("Wachtwoord moet minimaal 8 tekens zijn.");
                            return;
                        }

                        try {
                            btnCreate.textContent = "Even geduld...";
                            btnCreate.setAttribute('disabled', 'true');
                            await ApiClient.createUserAdmin({ name, email, password, role });
                            alert("Gebruiker succesvol aangemaakt!");
                            await this.loadTab('users'); // Reload table
                        } catch (e: any) {
                            alert(e.message);
                            btnCreate.textContent = "Aanmaken";
                            btnCreate.removeAttribute('disabled');
                        }
                    });
                }

                content.querySelectorAll('.role-select').forEach(sel => {
                    sel.addEventListener('change', async (e) => {
                        const target = e.target as HTMLSelectElement;
                        const id = target.dataset.id;
                        const role = target.value;
                        if (confirm(`Weet je zeker dat je rol wilt veranderen naar ${role}?`)) {
                            target.disabled = true;
                            try {
                                await ApiClient.updateUserRole(Number(id), role);
                                this.loadTab('users');
                            } catch (error: any) {
                                alert(error.message);
                                target.disabled = false;
                            }
                        } else {
                            this.loadTab('users'); // Reset
                        }
                    });
                });

                content.querySelectorAll('.edit-user-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const target = e.currentTarget as HTMLButtonElement;
                        const id = Number(target.dataset.id);
                        const user = userById.get(id);
                        if (!user) return;

                        const payload = await this.openEditUserDialog(user);
                        if (!payload) return;

                        target.disabled = true;
                        try {
                            await ApiClient.updateUserAdmin(id, payload);
                            alert('Gebruiker bijgewerkt.');
                            await this.loadTab('users');
                        } catch (error: any) {
                            alert(error?.message || 'Fout bij bewerken gebruiker.');
                            target.disabled = false;
                        }
                    });
                });

                content.querySelectorAll('.delete-user-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const target = e.currentTarget as HTMLButtonElement;
                        const id = Number(target.dataset.id);
                        const user = userById.get(id);
                        if (!user) return;

                        if (!confirm(`Weet je zeker dat je gebruiker "${user.name}" wilt verwijderen?`)) return;

                        target.disabled = true;
                        try {
                            await ApiClient.deleteUserAdmin(id);
                            alert('Gebruiker verwijderd.');
                            await this.loadTab('users');
                        } catch (error: any) {
                            alert(error?.message || 'Fout bij verwijderen gebruiker.');
                            target.disabled = false;
                        }
                    });
                });
            } else if (tab === 'harbors') {
                const officialRecs = await ApiClient.getOfficialHarbors();
                // For a full admin view, we could build an endpoint that returns all harbors.
                // But for now, we only have getOfficialHarbors and getMyHarbors.
                content.innerHTML = `<div style="color:#94a3b8;">Let op: Deze server route (all harbors voor admin) bestaat nog niet helemaal in API. Voor nu toont het overzicht alleen officiële havens.</div>
                <ul style="margin-top:10px; color:#e2e8f0;">
                ${officialRecs.map(h => `<li>⭐ ${h.name} (ID: ${h.id})</li>`).join('')}
                </ul>`;
            } else if (tab === 'scenarios') {
                content.innerHTML = `<div style="color:#94a3b8;">Voor scenarios geldt hetzelfde. Implementeer een admin-endpoint om ALLE records te laden voor de toggle functionaliteit. Momenteel toggle je deze per stuk in de betreffende editor.</div>`;
            } else if (tab === 'games') {
                content.innerHTML = `<div style="color:#94a3b8;">Game overzicht. Combineer met een admin api route voor later. Ga naar de Game Builder om individuele games standaard te maken.</div>`;
            }
        } catch (e: any) {
            content.innerHTML = `<div style="color:#ef4444; padding:20px;">Fout bij laden van data: ${e.message}</div>`;
        }
    }

    private static openEditUserDialog(user: any): Promise<any | null> {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:5000; display:flex; align-items:center; justify-content:center; padding:16px;';
            overlay.innerHTML = `
                <div style="width:520px; max-width:95vw; background:rgba(15,23,42,0.98); border:1px solid #475569; border-radius:10px; padding:16px; box-sizing:border-box;">
                    <h3 style="margin:0 0 12px 0; color:#e2e8f0;">Gebruiker bewerken</h3>
                    <div style="display:grid; gap:10px;">
                        <input id="editUserName" type="text" placeholder="Naam" style="background:#1e293b; color:#fff; border:1px solid #475569; border-radius:6px; padding:8px;">
                        <input id="editUserEmail" type="email" placeholder="Email" style="background:#1e293b; color:#fff; border:1px solid #475569; border-radius:6px; padding:8px;">
                        <select id="editUserRole" style="background:#1e293b; color:#fff; border:1px solid #475569; border-radius:6px; padding:8px;">
                            <option value="speler">Speler</option>
                            <option value="pro">Pro</option>
                            <option value="gamemaster">Gamemaster</option>
                            <option value="super_admin">Super admin</option>
                        </select>
                        <input id="editUserPassword" type="password" placeholder="Nieuw wachtwoord (optioneel)" autocomplete="new-password" style="background:#1e293b; color:#fff; border:1px solid #475569; border-radius:6px; padding:8px;">
                    </div>
                    <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:14px;">
                        <button id="cancelEditUserBtn" style="background:#64748b; color:#fff; border:none; border-radius:6px; padding:7px 12px; cursor:pointer;">Annuleren</button>
                        <button id="saveEditUserBtn" style="background:#10b981; color:#fff; border:none; border-radius:6px; padding:7px 12px; cursor:pointer;">Opslaan</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            const nameInput = overlay.querySelector('#editUserName') as HTMLInputElement;
            const emailInput = overlay.querySelector('#editUserEmail') as HTMLInputElement;
            const roleInput = overlay.querySelector('#editUserRole') as HTMLSelectElement;
            const passwordInput = overlay.querySelector('#editUserPassword') as HTMLInputElement;
            const cancelBtn = overlay.querySelector('#cancelEditUserBtn') as HTMLButtonElement;
            const saveBtn = overlay.querySelector('#saveEditUserBtn') as HTMLButtonElement;

            nameInput.value = user?.name || '';
            emailInput.value = user?.email || '';
            roleInput.value = (user?.role === 'admin') ? 'super_admin' : (user?.role || 'speler');
            nameInput.focus();
            nameInput.select();

            const cleanup = () => {
                if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            };

            const cancel = () => {
                cleanup();
                resolve(null);
            };

            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) cancel();
            });

            cancelBtn.addEventListener('click', cancel);

            saveBtn.addEventListener('click', () => {
                const name = nameInput.value.trim();
                const email = emailInput.value.trim();
                const role = roleInput.value;
                const password = passwordInput.value;

                if (!name || !email) {
                    alert('Naam en email zijn verplicht.');
                    return;
                }

                if (password && password.length < 8) {
                    alert('Wachtwoord moet minimaal 8 tekens zijn.');
                    return;
                }

                const payload: any = { name, email, role };
                if (password) payload.password = password;

                cleanup();
                resolve(payload);
            });
        });
    }
}
