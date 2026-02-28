import { ApiClient } from '../core/ApiClient';
// import type { User } from '../types';

export class AdminUI {
    private static instance: AdminUI;
    private modal: HTMLDivElement | null = null;

    private constructor() {
        this.checkAdminStatus();
    }

    static init() {
        if (!this.instance) {
            this.instance = new AdminUI();
        }
    }

    async checkAdminStatus() {
        if (!ApiClient.isLoggedIn) return;

        try {
            const user = await ApiClient.getUser();
            if (user.role === 'admin') {
                this.injectAdminButton();
            }
        } catch (e) {
            console.error('Failed to check admin status:', e);
        }
    }

    injectAdminButton() {
        const settingsPanel = document.getElementById('settingsPanel');
        if (!settingsPanel) return;

        // Check duplicates
        if (document.getElementById('adminDashboardBtn')) return;

        const btn = document.createElement('button');
        btn.id = 'adminDashboardBtn';
        btn.textContent = '🛠️ Admin Dashboard';
        btn.style.cssText = `
            background: #ef4444; 
            color: white; 
            border: none; 
            padding: 8px 16px; 
            border-radius: 6px; 
            font-weight: bold; 
            cursor: pointer; 
            margin-top: 10px;
            width: 100%;
        `;
        btn.onclick = () => this.openDashboard();

        // Add to settings panel (at the bottom or top)
        settingsPanel.appendChild(btn);
    }

    openDashboard() {
        if (!this.modal) {
            this.createModal();
        }
        if (this.modal) {
            this.modal.style.display = 'flex';
            this.loadUsers();
        }
    }

    createModal() {
        this.modal = document.createElement('div');
        this.modal.id = 'adminModal';
        this.modal.style.cssText = `
            position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 4000;
            display: none; align-items: center; justify-content: center;
        `;

        this.modal.innerHTML = `
            <div style="background: #1e293b; width: 600px; max-height: 80vh; border-radius: 12px; padding: 20px; color: white; display:flex; flex-direction:column;">
                <div style="display:flex; justify-content:space-between; margin-bottom:16px; border-bottom:1px solid #334155; padding-bottom:10px;">
                    <h2 style="margin:0; color:#ef4444;">Admin Dashboard</h2>
                    <button id="closeAdminBtn" style="background:none; border:none; color:#ddd; font-size:20px; cursor:pointer;">✕</button>
                </div>
                
                <div id="adminContent" style="overflow-y:auto; flex:1;">
                    <p>Laden...</p>
                </div>
            </div>
        `;

        document.body.appendChild(this.modal);

        this.modal.querySelector('#closeAdminBtn')?.addEventListener('click', () => {
            if (this.modal) this.modal.style.display = 'none';
        });
    }

    async loadUsers() {
        const content = document.getElementById('adminContent');
        if (!content) return;

        content.innerHTML = '<p>Gebruikers ophalen...</p>';

        try {
            const users = await ApiClient.getUsers();

            let html = '<table style="width:100%; border-collapse:collapse;">';
            html += '<tr style="background:#334155;"><th>ID</th><th>Naam</th><th>Email</th><th>Rol</th><th>Actie</th></tr>';

            users.forEach((u: any) => {
                html += `
                    <tr style="border-bottom:1px solid #334155;">
                        <td style="padding:8px;">${u.id}</td>
                        <td style="padding:8px;">${u.name}</td>
                        <td style="padding:8px; font-size:0.9em; color:#94a3b8;">${u.email}</td>
                        <td style="padding:8px;">
                            <span style="background:${this.getRoleColor(u.role)}; padding:2px 6px; border-radius:4px; font-size:0.8em;">${u.role}</span>
                        </td>
                        <td style="padding:8px;">
                            <select onchange="window.updateRole(${u.id}, this.value)" style="background:#0f172a; color:white; border:1px solid #475569; padding:4px;">
                                <option value="student" ${u.role === 'student' ? 'selected' : ''}>Student</option>
                                <option value="pro" ${u.role === 'pro' ? 'selected' : ''}>Pro</option>
                                <option value="gamemaster" ${u.role === 'gamemaster' ? 'selected' : ''}>GameMaster</option>
                                <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                            </select>
                        </td>
                    </tr>
                `;
            });
            html += '</table>';
            content.innerHTML = html;

            // Global handler for the select change (bit hacky but works for vanilla JS)
            (window as any).updateRole = async (id: number, role: string) => {
                try {
                    await ApiClient.updateUserRole(id, role as any);
                    // Refresh not needed, change is visual via select, but maybe confirm?
                    // alert('Rol aangepast!');
                } catch (e) {
                    alert('Fout bij aanpassen rol: ' + e);
                }
            };

        } catch (e) {
            content.innerHTML = `<div style="color:red">Fout: ${e}</div>`;
        }
    }

    getRoleColor(role: string): string {
        switch (role) {
            case 'admin': return '#ef4444';
            case 'gamemaster': return '#a855f7';
            case 'pro': return '#3b82f6';
            default: return '#64748b';
        }
    }
}
