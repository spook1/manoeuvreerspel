import { ApiClient } from '../core/ApiClient';

export class UserBar {
    private container: HTMLElement;
    private user: any = null;

    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'user-bar';
        this.container.style.cssText = `
            position: absolute;
            bottom: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.4);
            padding: 4px 8px;
            border-radius: 4px;
            color: rgba(255, 255, 255, 0.7);
            font-family: sans-serif;
            font-size: 11px;
            display: flex;
            align-items: center;
            gap: 8px;
            z-index: 1000;
            pointer-events: auto;
        `;
        document.body.appendChild(this.container);

        this.init();
    }

    async init() {
        if (ApiClient.isLoggedIn) {
            try {
                this.user = await ApiClient.getUser();
                (window as any)._currentUser = this.user;
                this.renderLoggedIn();
            } catch (e) {
                console.error("Session expired", e);
                ApiClient.clearToken();
                this.renderLoggedOut();
            }
        } else {
            this.renderLoggedOut();
        }
    }

    renderLoggedOut() {
        this.container.innerHTML = `
            <a href="login.html" style="color: white; text-decoration: none; font-weight: bold;">
                Inloggen / Registreren
            </a>
        `;
    }

    renderLoggedIn() {
        const roleLabel = this.user.role !== 'user' ? `(${this.user.role})` : '';
        this.container.innerHTML = `
            <span>Welkom, <b>${this.user.name}</b> ${roleLabel}</span>
            <button id="logout-btn" style="
                background: rgba(220, 53, 69, 0.5); 
                border: none; 
                color: rgba(255, 255, 255, 0.8); 
                padding: 2px 4px; 
                border-radius: 2px; 
                font-size: 10px;
                cursor: pointer;
            ">Uitloggen</button>
        `;

        // Show admin button if user is admin
        if (this.user.role === 'admin') {
            const btnAdmin = document.getElementById('btnAdminPanel');
            if (btnAdmin) btnAdmin.style.display = 'inline-block';
        }

        document.getElementById('logout-btn')?.addEventListener('click', async () => {
            await ApiClient.logout();
            window.location.reload();
        });
    }
}
