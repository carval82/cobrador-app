import * as SecureStore from 'expo-secure-store';
import { API_URL, endpoints } from '../config/api';

class ApiService {
    async getToken() {
        return await SecureStore.getItemAsync('token');
    }

    async setToken(token) {
        await SecureStore.setItemAsync('token', token);
    }

    async removeToken() {
        await SecureStore.deleteItemAsync('token');
    }

    async request(endpoint, options = {}) {
        const token = await this.getToken();
        
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers,
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                ...options,
                headers,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error en la solicitud');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    async login(documento, pin) {
        const response = await this.request(endpoints.login, {
            method: 'POST',
            body: JSON.stringify({ documento, pin }),
        });

        if (response.token) {
            await this.setToken(response.token);
        }

        return response;
    }

    async loginAdmin(email, password) {
        const response = await this.request(endpoints.loginAdmin, {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        if (response.token) {
            await this.setToken(response.token);
        }

        return response;
    }

    async loginCliente(documento, pin) {
        const response = await this.request(endpoints.loginCliente, {
            method: 'POST',
            body: JSON.stringify({ documento, pin }),
        });

        if (response.token) {
            await this.setToken(response.token);
        }

        return response;
    }

    async logout() {
        await this.removeToken();
    }

    async sync() {
        return await this.request(endpoints.sync);
    }

    async getProyectos() {
        return await this.request(endpoints.proyectos);
    }

    async syncProyecto(proyectoId) {
        return await this.request(`${endpoints.syncProyecto}/${proyectoId}`);
    }

    async registerPayment(paymentData) {
        return await this.request(endpoints.payment, {
            method: 'POST',
            body: JSON.stringify(paymentData),
        });
    }

    async registerClient(clientData) {
        return await this.request(endpoints.client, {
            method: 'POST',
            body: JSON.stringify(clientData),
        });
    }

    async closeCollection(data) {
        return await this.request(endpoints.closeCollection, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getDailySummary(fecha) {
        return await this.request(`${endpoints.dailySummary}?fecha=${fecha}`);
    }
}

export default new ApiService();
