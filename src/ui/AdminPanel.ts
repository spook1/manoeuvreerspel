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
                <div style="background:rgba(15,23,42,0.95); border:1px solid rgba(239,68,68,0.4); border-radius:12px; width:900px; max-width:95vw; max-height:90vh; display:flex; flex-direction:column; box-shadow: 0 10px 40px rgba(0,0,0,0.5); padding:20px; box-sizing:border-box;">
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

                    <div id="adminPanelContent" style="flex:1; overflow-y:auto; background:rgba(30,41,59,0.5); border:1px solid #475569; border-radius:8px; padding:16px;">
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
                let html = `
                    <table style="width:100%; border-collapse:collapse; color:#e2e8f0; font-size:13px; text-align:left;">
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
                                <span style="background:${u.role === 'admin' ? '#ef4444' : u.role === 'pro' ? '#f59e0b' : u.role === 'gamemaster' ? '#8b5cf6' : '#334155'}; padding:2px 6px; border-radius:4px; font-size:11px;">${u.role}</span>
                            </td>
                            <td style="padding:8px; color:#94a3b8; font-size:11px;">
                                ⚓ ${u.harbors_count || 0} | 🎬 ${u.scenarios_count || 0}
                            </td>
                            <td style="padding:8px;">
                                <select class="role-select" data-id="${u.id}" style="background:#1e293b; color:white; border:1px solid #475569; border-radius:4px; padding:2px; font-size:11px;">
                                    <option value="student" ${u.role === 'student' ? 'selected' : ''}>Student</option>
                                    <option value="pro" ${u.role === 'pro' ? 'selected' : ''}>Pro</option>
                                    <option value="gamemaster" ${u.role === 'gamemaster' ? 'selected' : ''}>Gamemaster</option>
                                    <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                                </select>
                            </td>
                        </tr>
                    `;
                });
                html += '</tbody></table>';
                content.innerHTML = html;

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
}
