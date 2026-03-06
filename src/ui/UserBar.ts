import { ApiClient } from '../core/ApiClient';

export class UserBar {
    private container: HTMLElement;
    private user: any = null;

    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'user-bar';
        this.container.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.6);
            padding: 8px 12px;
            border-radius: 4px;
            color: white;
            font-family: sans-serif;
            font-size: 14px;
            display: flex;
            gap: 10px;
            z-index: 1000;
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
                background: #dc3545; 
                border: none; 
                color: white; 
                padding: 2px 6px; 
                border-radius: 2px; 
                cursor: pointer;
            ">Uitloggen</button>
        `;

        document.getElementById('logout-btn')?.addEventListener('click', async () => {
            await ApiClient.logout();
            window.location.reload();
        });
    }
}
