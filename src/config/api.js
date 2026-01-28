// Configuración de la API
export const API_URL = 'https://cobrosisp-production.up.railway.app/api';

export const endpoints = {
    // Cobrador
    login: '/cobrador/login',
    sync: '/cobrador/sync',
    syncProyecto: '/cobrador/sync',
    proyectos: '/cobrador/proyectos',
    payment: '/cobrador/pago',
    client: '/cobrador/cliente',
    closeCollection: '/cobrador/cerrar-cobro',
    dailySummary: '/cobrador/resumen-dia',
    // Admin - Dashboard
    loginAdmin: '/admin/login',
    adminDashboard: '/admin/dashboard',
    adminDatosFormularios: '/admin/datos-formularios',
    // Admin - Proyectos
    adminProyectos: '/admin/proyectos',
    // Admin - Clientes
    adminClientes: '/admin/clientes',
    // Admin - Cobradores
    adminCobradores: '/admin/cobradores',
    // Admin - Planes
    adminPlanes: '/admin/planes',
    // Admin - Pagos
    adminPagos: '/admin/pagos',
    // Cliente
    loginCliente: '/cliente/login',
    clienteCuenta: '/cliente/cuenta',
    clienteFacturas: '/cliente/facturas',
    clientePagos: '/cliente/pagos',
};
