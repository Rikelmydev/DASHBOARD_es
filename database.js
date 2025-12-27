const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        this.db = new sqlite3.Database(path.join(__dirname, 'easystream.db'), (err) => {
            if (err) {
                console.error('Erro ao conectar ao banco:', err);
            } else {
                console.log('Conectado ao SQLite');
                this.initDatabase();
            }
        });
    }

    initDatabase() {
        // Tabela de serviços
        this.db.run(`
            CREATE TABLE IF NOT EXISTS servicos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                categoria TEXT NOT NULL,
                descricao TEXT,
                custo REAL NOT NULL,
                preco REAL NOT NULL,
                duracao INTEGER DEFAULT 1,
                fornecedor_id INTEGER,
                status TEXT DEFAULT 'ativo',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id)
            )
        `);

        // Tabela de fornecedores
        this.db.run(`
            CREATE TABLE IF NOT EXISTS fornecedores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                contato TEXT,
                tipo_contato TEXT DEFAULT 'telegram', -- telegram, whatsapp, email
                avaliacao REAL DEFAULT 3.0,
                status TEXT DEFAULT 'ativo',
                observacoes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabela de clientes
        this.db.run(`
            CREATE TABLE IF NOT EXISTS clientes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                email TEXT,
                telefone TEXT,
                status TEXT DEFAULT 'ativo',
                observacoes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabela de assinaturas
        this.db.run(`
            CREATE TABLE IF NOT EXISTS assinaturas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cliente_id INTEGER NOT NULL,
                servico_id INTEGER NOT NULL,
                fornecedor_id INTEGER,
                data_compra DATE NOT NULL,
                data_vencimento DATE NOT NULL,
                custo REAL NOT NULL,
                preco REAL NOT NULL,
                status TEXT DEFAULT 'ativo',
                link_acesso TEXT,
                codigo_compra TEXT,
                observacoes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (cliente_id) REFERENCES clientes(id),
                FOREIGN KEY (servico_id) REFERENCES servicos(id),
                FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id)
            )
        `);

        // Tabela de vendas
        this.db.run(`
            CREATE TABLE IF NOT EXISTS vendas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cliente_id INTEGER NOT NULL,
                fornecedor_id INTEGER,
                total_custo REAL NOT NULL,
                total_venda REAL NOT NULL,
                total_lucro REAL NOT NULL,
                status TEXT DEFAULT 'concluida',
                metodo_pagamento TEXT,
                observacoes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (cliente_id) REFERENCES clientes(id),
                FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id)
            )
        `);

        // Tabela de itens da venda
        this.db.run(`
            CREATE TABLE IF NOT EXISTS venda_itens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                venda_id INTEGER NOT NULL,
                servico_id INTEGER NOT NULL,
                quantidade INTEGER DEFAULT 1,
                custo_unitario REAL NOT NULL,
                preco_unitario REAL NOT NULL,
                FOREIGN KEY (venda_id) REFERENCES vendas(id),
                FOREIGN KEY (servico_id) REFERENCES servicos(id)
            )
        `);

        // Inserir dados iniciais
        this.insertInitialData();
    }

    insertInitialData() {
        // Verificar se já existem serviços
        this.db.get("SELECT COUNT(*) as count FROM servicos", (err, row) => {
            if (err) return;
            
            if (row.count === 0) {
                // Serviços de streaming
                const servicos = [
                    // Streaming Geral
                    ['Netflix Premium 1 mês', '📺 Streaming Vídeo', 'Plano Premium 4K sem anúncios', 15.90, 29.90, 1, null, 'ativo'],
                    ['Disney+ Premium 1 mês', '📺 Streaming Vídeo', 'Acesso completo à plataforma', 12.90, 24.90, 1, null, 'ativo'],
                    ['HBO Max 1 mês', '📺 Streaming Vídeo', 'Catálogo completo HBO', 10.00, 19.90, 1, null, 'ativo'],
                    ['Prime Video 1 mês', '📺 Streaming Vídeo', 'Amazon Prime Video', 10.00, 14.90, 1, null, 'ativo'],
                    
                    // Novos serviços adicionados
                    ['Star+ 1 mês', '📺 Streaming Vídeo', 'Filmes e séries, conteúdo exclusivo, Full HD, Multiplataforma', 16.36, 29.90, 1, null, 'ativo'],
                    ['PlayPlus 1 mês', '📺 Streaming Vídeo', 'Catálogo variado de streaming', 7.56, 14.90, 1, null, 'ativo'],
                    ['Hulu 1 mês', '📺 Streaming Vídeo', 'Catálogo completo, séries exclusivas, suporte 24/7, entrega automática', 26.76, 39.90, 1, null, 'ativo'],
                    ['ESPN 1 mês', '⚽ Esportes', 'Eventos esportivos ao vivo, transmissões exclusivas, multiplataforma, replays completos', 26.76, 39.90, 1, null, 'ativo'],
                    ['TNT Sports 1 mês', '⚽ Esportes', 'Eventos esportivos, transmissões exclusivas, multiplataforma, suporte 24/7', 17.96, 29.90, 1, null, 'ativo'],
                    ['Apple TV+ 1 mês', '📺 Streaming Vídeo', 'Conteúdo Apple Original, 4K Dolby Vision, 6 telas simultâneas, família compartilhada', 11.96, 19.90, 1, null, 'ativo'],
                    ['Viki 1 mês', '📺 Streaming Vídeo', 'Dramas asiáticos, legendas em português, sem anúncios, catálogo completo', 10.40, 17.90, 1, null, 'ativo'],
                    ['ChatGPT Plus', '🤖 IA', 'Acesso ao ChatGPT 4, prioridade de acesso, recursos avançados', 8.00, 19.90, 1, null, 'ativo'],
                    
                    // Música
                    ['Spotify Premium 1 mês', '🎵 Streaming Música', 'Música sem anúncios e download', 10.90, 19.90, 1, null, 'ativo'],
                    ['YouTube Music 1 mês', '🎵 Streaming Música', 'Música e vídeos sem anúncios', 10.00, 14.90, 1, null, 'ativo'],
                    
                    // Games
                    ['Game Pass Ultimate 1 mês', '🎮 Games', 'Xbox Game Pass Ultimate', 45.90, 69.90, 1, null, 'ativo'],
                    ['PS Plus Deluxe 1 mês', '🎮 Games', 'PlayStation Plus Deluxe', 37.90, 49.90, 1, null, 'ativo'],
                    
                    // Ferramentas
                    ['Canva Pro 1 mês', '🛠️ Ferramentas', 'Canva Pro completo', 14.50, 24.90, 1, null, 'ativo']
                ];

                const stmt = this.db.prepare(`
                    INSERT INTO servicos (nome, categoria, descricao, custo, preco, duracao, fornecedor_id, status) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `);

                servicos.forEach(servico => {
                    stmt.run(servico);
                });

                stmt.finalize();
                console.log('Serviços iniciais inseridos');
            }
        });

        // Fornecedores iniciais
        this.db.get("SELECT COUNT(*) as count FROM fornecedores", (err, row) => {
            if (err) return;
            
            if (row.count === 0) {
                const fornecedores = [
                    ['StreamKing', '@streamking_telegram', 'telegram', 4.5, 'ativo', 'Fornecedor confiável, entrega rápida'],
                    ['ContasPremium', '+5511999999999', 'whatsapp', 4.2, 'ativo', 'Bom suporte, preços competitivos'],
                    ['EasyStream Supplier', 'suporte@easystream.com', 'email', 4.7, 'ativo', 'Fornecedor oficial']
                ];

                const stmt = this.db.prepare(`
                    INSERT INTO fornecedores (nome, contato, tipo_contato, avaliacao, status, observacoes)
                    VALUES (?, ?, ?, ?, ?, ?)
                `);

                fornecedores.forEach(fornecedor => {
                    stmt.run(fornecedor);
                });

                stmt.finalize();
                console.log('Fornecedores iniciais inseridos');
            }
        });
    }

    // Métodos CRUD para serviços
    getAllServicos(callback) {
        this.db.all(`
            SELECT s.*, f.nome as fornecedor_nome 
            FROM servicos s 
            LEFT JOIN fornecedores f ON s.fornecedor_id = f.id 
            ORDER BY s.categoria, s.nome
        `, callback);
    }

    getServicoById(id, callback) {
        this.db.get('SELECT * FROM servicos WHERE id = ?', [id], callback);
    }

    createServico(servico, callback) {
        const { nome, categoria, descricao, custo, preco, duracao, fornecedor_id, status } = servico;
        this.db.run(`
            INSERT INTO servicos (nome, categoria, descricao, custo, preco, duracao, fornecedor_id, status, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [nome, categoria, descricao, custo, preco, duracao, fornecedor_id, status], callback);
    }

    updateServico(id, servico, callback) {
        const { nome, categoria, descricao, custo, preco, duracao, fornecedor_id, status } = servico;
        this.db.run(`
            UPDATE servicos 
            SET nome = ?, categoria = ?, descricao = ?, custo = ?, preco = ?, 
                duracao = ?, fornecedor_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [nome, categoria, descricao, custo, preco, duracao, fornecedor_id, status, id], callback);
    }

    deleteServico(id, callback) {
        this.db.run('DELETE FROM servicos WHERE id = ?', [id], callback);
    }

    // Métodos CRUD para fornecedores
    getAllFornecedores(callback) {
        this.db.all('SELECT * FROM fornecedores ORDER BY nome', callback);
    }

    getFornecedorById(id, callback) {
        this.db.get('SELECT * FROM fornecedores WHERE id = ?', [id], callback);
    }

    createFornecedor(fornecedor, callback) {
        const { nome, contato, tipo_contato, avaliacao, status, observacoes } = fornecedor;
        this.db.run(`
            INSERT INTO fornecedores (nome, contato, tipo_contato, avaliacao, status, observacoes, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [nome, contato, tipo_contato, avaliacao, status, observacoes], callback);
    }

    updateFornecedor(id, fornecedor, callback) {
        const { nome, contato, tipo_contato, avaliacao, status, observacoes } = fornecedor;
        this.db.run(`
            UPDATE fornecedores 
            SET nome = ?, contato = ?, tipo_contato = ?, avaliacao = ?, 
                status = ?, observacoes = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [nome, contato, tipo_contato, avaliacao, status, observacoes, id], callback);
    }

    deleteFornecedor(id, callback) {
        this.db.run('DELETE FROM fornecedores WHERE id = ?', [id], callback);
    }

    // Métodos CRUD para clientes
    getAllClientes(callback) {
        this.db.all(`
            SELECT c.*, 
                   COUNT(a.id) as total_assinaturas,
                   SUM(a.preco) as total_gasto
            FROM clientes c
            LEFT JOIN assinaturas a ON c.id = a.cliente_id AND a.status = 'ativo'
            GROUP BY c.id
            ORDER BY c.nome
        `, callback);
    }

    getClienteById(id, callback) {
        this.db.get('SELECT * FROM clientes WHERE id = ?', [id], callback);
    }

    createCliente(cliente, callback) {
        const { nome, email, telefone, status, observacoes } = cliente;
        this.db.run(`
            INSERT INTO clientes (nome, email, telefone, status, observacoes, updated_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [nome, email, telefone, status, observacoes], callback);
    }

    updateCliente(id, cliente, callback) {
        const { nome, email, telefone, status, observacoes } = cliente;
        this.db.run(`
            UPDATE clientes 
            SET nome = ?, email = ?, telefone = ?, status = ?, 
                observacoes = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [nome, email, telefone, status, observacoes, id], callback);
    }

    deleteCliente(id, callback) {
        this.db.run('DELETE FROM clientes WHERE id = ?', [id], callback);
    }

    // Métodos CRUD para vendas
    getAllVendas(callback) {
        this.db.all(`
            SELECT v.*, c.nome as cliente_nome, f.nome as fornecedor_nome
            FROM vendas v
            LEFT JOIN clientes c ON v.cliente_id = c.id
            LEFT JOIN fornecedores f ON v.fornecedor_id = f.id
            ORDER BY v.created_at DESC
        `, callback);
    }

    getVendaById(id, callback) {
        this.db.get(`
            SELECT v.*, c.nome as cliente_nome, f.nome as fornecedor_nome
            FROM vendas v
            LEFT JOIN clientes c ON v.cliente_id = c.id
            LEFT JOIN fornecedores f ON v.fornecedor_id = f.id
            WHERE v.id = ?
        `, [id], callback);
    }

    getVendaItens(vendaId, callback) {
        this.db.all(`
            SELECT vi.*, s.nome as servico_nome, s.categoria
            FROM venda_itens vi
            JOIN servicos s ON vi.servico_id = s.id
            WHERE vi.venda_id = ?
        `, [vendaId], callback);
    }

    createVenda(venda, itens, callback) {
        const { cliente_id, fornecedor_id, total_custo, total_venda, total_lucro, status, metodo_pagamento, observacoes } = venda;
        
        this.db.run(`
            INSERT INTO vendas (cliente_id, fornecedor_id, total_custo, total_venda, total_lucro, status, metodo_pagamento, observacoes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [cliente_id, fornecedor_id, total_custo, total_venda, total_lucro, status, metodo_pagamento, observacoes], function(err) {
            if (err) {
                callback(err);
                return;
            }
            
            const vendaId = this.lastID;
            
            // Inserir itens da venda
            const stmt = this.db.prepare(`
                INSERT INTO venda_itens (venda_id, servico_id, quantidade, custo_unitario, preco_unitario)
                VALUES (?, ?, ?, ?, ?)
            `);
            
            itens.forEach(item => {
                stmt.run([vendaId, item.servico_id, item.quantidade, item.custo_unitario, item.preco_unitario]);
            });
            
            stmt.finalize((err) => {
                if (err) {
                    callback(err);
                    return;
                }
                
                // Criar assinaturas para o cliente
                const assinaturaStmt = this.db.prepare(`
                    INSERT INTO assinaturas (cliente_id, servico_id, fornecedor_id, data_compra, data_vencimento, custo, preco, status, link_acesso, codigo_compra)
                    VALUES (?, ?, ?, date('now'), date('now', '+' || ? || ' month'), ?, ?, 'ativo', ?, ?)
                `);
                
                itens.forEach(item => {
                    assinaturaStmt.run([
                        cliente_id, 
                        item.servico_id, 
                        fornecedor_id, 
                        item.duracao || 1,
                        item.custo_unitario,
                        item.preco_unitario,
                        item.link_acesso,
                        item.codigo_compra
                    ]);
                });
                
                assinaturaStmt.finalize((err) => {
                    callback(err, { id: vendaId });
                });
            });
        });
    }

    updateVenda(id, venda, callback) {
        const { cliente_id, fornecedor_id, total_custo, total_venda, total_lucro, status, metodo_pagamento, observacoes } = venda;
        this.db.run(`
            UPDATE vendas 
            SET cliente_id = ?, fornecedor_id = ?, total_custo = ?, total_venda = ?, 
                total_lucro = ?, status = ?, metodo_pagamento = ?, observacoes = ?
            WHERE id = ?
        `, [cliente_id, fornecedor_id, total_custo, total_venda, total_lucro, status, metodo_pagamento, observacoes, id], callback);
    }

    deleteVenda(id, callback) {
        // Primeiro, deletar itens da venda
        this.db.run('DELETE FROM venda_itens WHERE venda_id = ?', [id], (err) => {
            if (err) {
                callback(err);
                return;
            }
            
            // Depois, deletar a venda
            this.db.run('DELETE FROM vendas WHERE id = ?', [id], callback);
        });
    }

    // Métodos para assinaturas
    getAssinaturasByCliente(clienteId, callback) {
        this.db.all(`
            SELECT a.*, s.nome as servico_nome, s.categoria, f.nome as fornecedor_nome
            FROM assinaturas a
            JOIN servicos s ON a.servico_id = s.id
            LEFT JOIN fornecedores f ON a.fornecedor_id = f.id
            WHERE a.cliente_id = ?
            ORDER BY a.data_vencimento
        `, [clienteId], callback);
    }

    // Métodos para relatórios
    getRelatorioMensal(mes, ano, callback) {
        this.db.all(`
            SELECT 
                strftime('%Y-%m', created_at) as mes,
                COUNT(*) as total_vendas,
                SUM(total_venda) as faturamento,
                SUM(total_custo) as custo,
                SUM(total_lucro) as lucro,
                COUNT(DISTINCT cliente_id) as novos_clientes
            FROM vendas
            WHERE strftime('%Y-%m', created_at) = ?
            GROUP BY strftime('%Y-%m', created_at)
        `, [`${ano}-${mes.toString().padStart(2, '0')}`], callback);
    }

    getTopServicos(limit = 5, callback) {
        this.db.all(`
            SELECT 
                s.nome,
                s.categoria,
                COUNT(vi.id) as total_vendas,
                SUM(vi.preco_unitario * vi.quantidade) as faturamento,
                SUM((vi.preco_unitario - vi.custo_unitario) * vi.quantidade) as lucro
            FROM venda_itens vi
            JOIN servicos s ON vi.servico_id = s.id
            GROUP BY s.id
            ORDER BY total_vendas DESC
            LIMIT ?
        `, [limit], callback);
    }

    getEstatisticasGerais(callback) {
        this.db.get(`
            SELECT 
                COUNT(DISTINCT c.id) as total_clientes,
                COUNT(DISTINCT CASE WHEN c.status = 'ativo' THEN c.id END) as clientes_ativos,
                COUNT(DISTINCT a.id) as total_assinaturas,
                COUNT(DISTINCT CASE WHEN date(a.data_vencimento) >= date('now') THEN a.id END) as assinaturas_ativas,
                SUM(CASE WHEN date(a.data_vencimento) BETWEEN date('now') AND date('now', '+7 days') THEN 1 ELSE 0 END) as renovações_proximas
            FROM clientes c
            LEFT JOIN assinaturas a ON c.id = a.cliente_id
        `, callback);
    }

    getDashboardData(callback) {
        this.db.get(`
            SELECT 
                COUNT(DISTINCT v.id) as total_vendas,
                SUM(v.total_venda) as faturamento_total,
                SUM(v.total_lucro) as lucro_total,
                SUM(v.total_custo) as custo_total,
                COUNT(DISTINCT CASE WHEN date('now', '-30 days') <= date(v.created_at) THEN v.id END) as vendas_30dias,
                SUM(CASE WHEN date('now', '-30 days') <= date(v.created_at) THEN v.total_venda ELSE 0 END) as faturamento_30dias,
                SUM(CASE WHEN date('now', '-30 days') <= date(v.created_at) THEN v.total_lucro ELSE 0 END) as lucro_30dias
            FROM vendas v
        `, callback);
    }

    close() {
        this.db.close();
    }
}

module.exports = Database;