import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import db from './src/services/database';

// Pantallas comunes
import LoginScreen from './src/screens/LoginScreen';

// Pantallas Cobrador
import ProyectosScreen from './src/screens/ProyectosScreen';
import HomeScreen from './src/screens/HomeScreen';
import ClientsScreen from './src/screens/ClientsScreen';
import ClientDetailScreen from './src/screens/ClientDetailScreen';
import InvoicesScreen from './src/screens/InvoicesScreen';
import NewPaymentScreen from './src/screens/NewPaymentScreen';
import NewClientScreen from './src/screens/NewClientScreen';

// Pantallas Admin
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import AdminProyectosScreen from './src/screens/AdminProyectosScreen';
import AdminClientesScreen from './src/screens/AdminClientesScreen';
import AdminCobradoresScreen from './src/screens/AdminCobradoresScreen';
import AdminClienteFormScreen from './src/screens/AdminClienteFormScreen';
import AdminCobradorFormScreen from './src/screens/AdminCobradorFormScreen';
import AdminPlanesScreen from './src/screens/AdminPlanesScreen';
import AdminPlanFormScreen from './src/screens/AdminPlanFormScreen';
import AdminClienteServiciosScreen from './src/screens/AdminClienteServiciosScreen';
import AdminServicioFormScreen from './src/screens/AdminServicioFormScreen';
import AdminProyectoGastosScreen from './src/screens/AdminProyectoGastosScreen';
import AdminGastoFormScreen from './src/screens/AdminGastoFormScreen';
import AdminPagosScreen from './src/screens/AdminPagosScreen';
import AdminFacturasScreen from './src/screens/AdminFacturasScreen';
import AdminLiquidacionScreen from './src/screens/AdminLiquidacionScreen';
import AdminParticipacionesScreen from './src/screens/AdminParticipacionesScreen';

// Pantallas Cliente
import ClienteHomeScreen from './src/screens/ClienteHomeScreen';

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: '#1e293b' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '600' },
  contentStyle: { backgroundColor: '#0f172a' },
};

function AppNavigator() {
  const { user, userType, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {!user ? (
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }}
        />
      ) : userType === 'admin' ? (
        <>
          <Stack.Screen 
            name="AdminDashboard" 
            component={AdminDashboardScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="AdminProyectos" 
            component={AdminProyectosScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="AdminClientes" 
            component={AdminClientesScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="AdminClienteForm" 
            component={AdminClienteFormScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="AdminCobradores" 
            component={AdminCobradoresScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="AdminCobradorForm" 
            component={AdminCobradorFormScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="AdminPlanes" 
            component={AdminPlanesScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="AdminPlanForm" 
            component={AdminPlanFormScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="AdminClienteServicios" 
            component={AdminClienteServiciosScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="AdminServicioForm" 
            component={AdminServicioFormScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="AdminProyectoGastos" 
            component={AdminProyectoGastosScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="AdminGastoForm" 
            component={AdminGastoFormScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="AdminPagos" 
            component={AdminPagosScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="AdminFacturas" 
            component={AdminFacturasScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="AdminLiquidacion" 
            component={AdminLiquidacionScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="AdminParticipaciones" 
            component={AdminParticipacionesScreen} 
            options={{ headerShown: false }}
          />
        </>
      ) : userType === 'cliente' ? (
        <Stack.Screen 
          name="ClienteHome" 
          component={ClienteHomeScreen} 
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen 
            name="Proyectos" 
            component={ProyectosScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Clients" 
            component={ClientsScreen} 
            options={{ title: 'Clientes' }}
          />
          <Stack.Screen 
            name="ClientDetail" 
            component={ClientDetailScreen} 
            options={{ title: 'Detalle Cliente' }}
          />
          <Stack.Screen 
            name="Invoices" 
            component={InvoicesScreen} 
            options={{ title: 'Facturas' }}
          />
          <Stack.Screen 
            name="NewPayment" 
            component={NewPaymentScreen} 
            options={{ title: 'Registrar Pago' }}
          />
          <Stack.Screen 
            name="NewClient" 
            component={NewClientScreen} 
            options={{ title: 'Nuevo Cliente' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initDatabase();
  }, []);

  const initDatabase = async () => {
    try {
      await db.init();
      setDbReady(true);
    } catch (error) {
      console.error('Error initializing database:', error);
      setDbReady(true);
    }
  };

  if (!dbReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
