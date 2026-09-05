import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { API_URL } from '../config/api';
import * as SecureStore from 'expo-secure-store';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('tickets', {
            name: 'Tickets',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
            sound: 'default',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
            console.log('No se otorgaron permisos de notificación');
            return null;
        }

        try {
            const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
            if (!projectId) {
                console.log('Project ID no encontrado');
            }
            token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
            console.log('Push token:', token);
        } catch (error) {
            console.error('Error obteniendo push token:', error);
            return null;
        }
    } else {
        console.log('Las notificaciones push requieren un dispositivo físico');
    }

    return token;
}

export async function savePushTokenToServer(pushToken, userType = 'admin') {
    try {
        const authToken = await SecureStore.getItemAsync('token');
        if (!authToken) {
            console.log('No hay token de autenticación');
            return false;
        }

        const response = await fetch(`${API_URL}/push-token`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                push_token: pushToken,
                device_type: Platform.OS,
                user_type: userType,
            }),
        });

        const data = await response.json();
        if (data.success) {
            console.log('Push token guardado en servidor');
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error guardando push token:', error);
        return false;
    }
}

export function addNotificationReceivedListener(callback) {
    return Notifications.addNotificationReceivedListener(callback);
}

export function addNotificationResponseReceivedListener(callback) {
    return Notifications.addNotificationResponseReceivedListener(callback);
}
