import * as SQLite from 'expo-sqlite';

class DatabaseService {
    db = null;

    async init() {
        this.db = await SQLite.openDatabaseAsync('cobrador.db');
        
        await this.db.execAsync(`
            CREATE TABLE IF NOT EXISTS clientes (
                id INTEGER PRIMARY KEY,
                nombre TEXT,
                documento TEXT,
                direccion TEXT,
                telefono TEXT,
                celular TEXT,
                email TEXT,
                barrio TEXT,
                estado TEXT,
                proyecto_id INTEGER,
                data TEXT
            );

            CREATE TABLE IF NOT EXISTS facturas (
                id INTEGER PRIMARY KEY,
                cliente_id INTEGER,
                numero TEXT,
                mes INTEGER,
                anio INTEGER,
                subtotal REAL,
                total REAL,
                estado TEXT,
                fecha_vencimiento TEXT,
                data TEXT
            );

            CREATE TABLE IF NOT EXISTS planes (
                id INTEGER PRIMARY KEY,
                nombre TEXT,
                precio REAL,
                data TEXT
            );

            CREATE TABLE IF NOT EXISTS pending_ops (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type TEXT,
                data TEXT,
                created_at TEXT
            );

            CREATE TABLE IF NOT EXISTS config (
                key TEXT PRIMARY KEY,
                value TEXT
            );
        `);
    }

    // Clientes
    async saveClientes(clientes) {
        await this.db.execAsync('DELETE FROM clientes');
        for (const cliente of clientes) {
            await this.db.runAsync(
                'INSERT INTO clientes (id, nombre, documento, direccion, telefono, celular, email, barrio, estado, proyecto_id, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [cliente.id, cliente.nombre, cliente.documento, cliente.direccion, cliente.telefono, cliente.celular, cliente.email, cliente.barrio, cliente.estado, cliente.proyecto_id, JSON.stringify(cliente)]
            );
        }
    }

    async getClientes(proyectoId = null) {
        let rows;
        if (proyectoId) {
            rows = await this.db.getAllAsync(
                'SELECT * FROM clientes WHERE proyecto_id = ? ORDER BY nombre',
                [proyectoId]
            );
        } else {
            rows = await this.db.getAllAsync('SELECT * FROM clientes ORDER BY nombre');
        }
        return rows.map(row => JSON.parse(row.data));
    }

    async getCliente(id) {
        const row = await this.db.getFirstAsync('SELECT * FROM clientes WHERE id = ?', [id]);
        return row ? JSON.parse(row.data) : null;
    }

    // Facturas
    async saveFacturas(facturas) {
        await this.db.execAsync('DELETE FROM facturas');
        for (const factura of facturas) {
            await this.db.runAsync(
                'INSERT INTO facturas (id, cliente_id, numero, mes, anio, subtotal, total, estado, fecha_vencimiento, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [factura.id, factura.cliente_id, factura.numero, factura.mes, factura.anio, factura.subtotal, factura.total, factura.estado, factura.fecha_vencimiento, JSON.stringify(factura)]
            );
        }
    }

    async getFacturas(proyectoId = null) {
        let rows;
        if (proyectoId) {
            rows = await this.db.getAllAsync(
                `SELECT f.* FROM facturas f 
                 INNER JOIN clientes c ON f.cliente_id = c.id 
                 WHERE f.estado IN ('pendiente', 'parcial', 'vencida') AND c.proyecto_id = ?
                 ORDER BY f.fecha_vencimiento`,
                [proyectoId]
            );
        } else {
            rows = await this.db.getAllAsync(
                "SELECT * FROM facturas WHERE estado IN ('pendiente', 'parcial', 'vencida') ORDER BY fecha_vencimiento"
            );
        }
        return rows.map(row => JSON.parse(row.data));
    }

    async getFacturasCliente(clienteId) {
        const rows = await this.db.getAllAsync('SELECT * FROM facturas WHERE cliente_id = ? AND estado = ?', [clienteId, 'pendiente']);
        return rows.map(row => JSON.parse(row.data));
    }

    // Planes
    async savePlanes(planes) {
        await this.db.execAsync('DELETE FROM planes');
        for (const plan of planes) {
            await this.db.runAsync(
                'INSERT INTO planes (id, nombre, precio, data) VALUES (?, ?, ?, ?)',
                [plan.id, plan.nombre, plan.precio, JSON.stringify(plan)]
            );
        }
    }

    async getPlanes() {
        const rows = await this.db.getAllAsync('SELECT * FROM planes ORDER BY nombre');
        return rows.map(row => JSON.parse(row.data));
    }

    // Pending Operations
    async addPendingOp(type, data) {
        await this.db.runAsync(
            'INSERT INTO pending_ops (type, data, created_at) VALUES (?, ?, ?)',
            [type, JSON.stringify(data), new Date().toISOString()]
        );
    }

    async getPendingOps() {
        return await this.db.getAllAsync('SELECT * FROM pending_ops ORDER BY id');
    }

    async removePendingOp(id) {
        await this.db.runAsync('DELETE FROM pending_ops WHERE id = ?', [id]);
    }

    async getPendingCount() {
        const result = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM pending_ops');
        return result?.count || 0;
    }

    // Config
    async setConfig(key, value) {
        await this.db.runAsync(
            'INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)',
            [key, JSON.stringify(value)]
        );
    }

    async getConfig(key) {
        const row = await this.db.getFirstAsync('SELECT * FROM config WHERE key = ?', [key]);
        return row ? JSON.parse(row.value) : null;
    }
}

export default new DatabaseService();
