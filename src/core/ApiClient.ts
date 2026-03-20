import { HarborData } from "../data/harbors";
import type { User } from "../types";

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_Base_URL = import.meta.env.VITE_API_URL || (isLocal ? 'http://localhost:8080/api' : 'https://manoeuvreerspel.netwerkspel.nl/api');

/**
 * Handle API communication for Authentication and Harbor Management.
 */
export class ApiClient {
    private static tokenKey = 'auth_token';

    static getToken(): string | null {
        return localStorage.getItem(this.tokenKey);
    }

    static setToken(token: string) {
        localStorage.setItem(this.tokenKey, token);
    }

    static clearToken() {
        localStorage.removeItem(this.tokenKey);
    }

    static get isLoggedIn(): boolean {
        return !!this.getToken();
    }

    // --- Helper for Authorized Requests ---
    private static async request(endpoint: string, method: string = 'GET', body?: any) {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${API_Base_URL}${endpoint}`, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined,
            });

            if (!response.ok) {
                if (response.status === 401) {
                    this.clearToken();
                }
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`);
            }

            if (response.status === 204) return null;
            return await response.json();
        } catch (error) {
            console.error('API Request Failed:', error);
            throw error;
        }
    }

    // --- Authentication ---

    static async login(email: string, password: string): Promise<any> {
        const res = await this.request('/login', 'POST', { email, password });
        if (res?.access_token) this.setToken(res.access_token);
        return res;
    }

    static async register(name: string, email: string, password: string): Promise<any> {
        const res = await this.request('/register', 'POST', { name, email, password, password_confirmation: password });
        if (res?.access_token) this.setToken(res.access_token);
        return res;
    }

    static async logout(): Promise<void> {
        await this.request('/logout', 'POST');
        this.clearToken();
    }

    static async getUser(): Promise<User> {
        return this.request('/user');
    }

    // --- Harbor Management ---

    /** Ophalen van officiële (standaard) havens — geen login vereist */
    static async getOfficialHarbors(): Promise<any[]> {
        return this.request('/harbors/official');
    }

    static async getMyHarbors(): Promise<any[]> {
        return this.request('/harbors');
    }

    static async saveHarbor(harborData: HarborData, isPublic: boolean = false): Promise<any> {
        return this.request('/harbors', 'POST', {
            json_data: harborData,
            is_public: isPublic
        });
    }

    static async updateHarbor(id: number, harborData: HarborData, isOfficial?: boolean): Promise<any> {
        const body: any = {
            json_data: harborData,
            is_public: isOfficial ?? false,
        };
        if (isOfficial !== undefined) body.is_official = isOfficial;
        return this.request(`/harbors/${id}`, 'PUT', body);
    }

    static async deleteHarbor(id: number): Promise<void> {
        return this.request(`/harbors/${id}`, 'DELETE');
    }

    // --- Scenario Management ---

    static async getOfficialScenarios(): Promise<any[]> {
        return this.request('/scenarios/official');
    }

    static async getMyScenarios(): Promise<any[]> {
        return this.request('/scenarios');
    }

    static async getScenario(id: number): Promise<any> {
        return this.request(`/scenarios/${id}`);
    }

    static async saveScenario(scenarioData: any): Promise<any> {
        return this.request('/scenarios', 'POST', scenarioData);
    }

    static async updateScenario(id: number, scenarioData: any): Promise<any> {
        return this.request(`/scenarios/${id}`, 'PUT', scenarioData);
    }

    static async deleteScenario(id: number): Promise<void> {
        return this.request(`/scenarios/${id}`, 'DELETE');
    }

    // --- Game Management ---

    static async getOfficialGames(): Promise<any[]> {
        return this.request('/games/official');
    }

    static async getMyGames(): Promise<any[]> {
        return this.request('/games');
    }

    static async getGame(id: number): Promise<any> {
        return this.request(`/games/${id}`);
    }

    static async saveGame(gameData: any): Promise<any> {
        return this.request('/games', 'POST', gameData);
    }

    static async updateGame(id: number, gameData: any): Promise<any> {
        return this.request(`/games/${id}`, 'PUT', gameData);
    }

    static async deleteGame(id: number): Promise<void> {
        return this.request(`/games/${id}`, 'DELETE');
    }

    // --- Admin Features ---

    static async getUsers(): Promise<User[]> {
        return this.request('/admin/users');
    }

    static async updateUserRole(userId: number, role: string): Promise<any> {
        return this.request(`/admin/users/${userId}/role`, 'PUT', { role });
    }

    static async toggleOfficial(harborId: number): Promise<any> {
        return this.request(`/admin/harbors/${harborId}/toggle-official`, 'POST');
    }

    static async toggleOfficialScenario(scenarioId: number): Promise<any> {
        return this.request(`/admin/scenarios/${scenarioId}/toggle-official`, 'POST');
    }

    static async toggleOfficialGame(gameId: number): Promise<any> {
        return this.request(`/admin/games/${gameId}/toggle-official`, 'POST');
    }
}
