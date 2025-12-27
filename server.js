const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Database = require('./database');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Inicializar banco de dados
const db = new Database();

// Rotas para serviços
app.get('/api/servicos', (req, res) => {
    db.getAllServicos((err, servicos) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(servicos);
    });
});

app.get('/api/servicos/:id', (req, res) => {
    db.getServicoById(req.params.id, (err, servico) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(servico);
    });
});

app.post('/api/servicos', (req, res) => {
    const servico = req.body;
    db.createServico(servico, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID, ...servico });
    });
});

app.put('/api/servicos/:id', (req, res) => {
    const servico = req.body;
    db.updateServico(req.params.id, servico, (err) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: req.params.id, ...servico });
    });
});

app.delete('/api/servicos/:id', (req, res) => {
    db.deleteServico(req.params.id, (err) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Serviço deletado com sucesso' });
    });
});

// Rotas para fornecedores
app.get('/api/fornecedores', (req, res) => {
    db.getAllFornecedores((err, fornecedores) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(fornecedores);
    });
});

app.post('/api/fornecedores', (req, res) => {
    const fornecedor = req.body;
    db.createFornecedor(fornecedor, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID, ...fornecedor });
    });
});

app.put('/api/fornecedores/:id', (req, res) => {
    const fornecedor = req.body;
    db.updateFornecedor(req.params.id, fornecedor, (err) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: req.params.id, ...fornecedor });
    });
});

app.delete('/api/fornecedores/:id', (req, res) => {
    db.deleteFornecedor(req.params.id, (err) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Fornecedor deletado com sucesso' });
    });
});

// Rotas para clientes
app.get('/api/clientes', (req, res) => {
    db.getAllClientes((err, clientes) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(clientes);
    });
});

app.get('/api/clientes/:id', (req, res) => {
    db.getClienteById(req.params.id, (err, cliente) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!cliente) {
            res.status(404).json({ error: 'Cliente não encontrado' });
            return;
        }
        
        // Buscar assinaturas do cliente
        db.getAssinaturasByCliente(req.params.id, (err, assinaturas) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ ...cliente, assinaturas });
        });
    });
});

app.post('/api/clientes', (req, res) => {
    const cliente = req.body;
    db.createCliente(cliente, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID, ...cliente });
    });
});

app.put('/api/clientes/:id', (req, res) => {
    const cliente = req.body;
    db.updateCliente(req.params.id, cliente, (err) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: req.params.id, ...cliente });
    });
});

app.delete('/api/clientes/:id', (req, res) => {
    db.deleteCliente(req.params.id, (err) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Cliente deletado com sucesso' });
    });
});

// Rotas para vendas
app.get('/api/vendas', (req, res) => {
    db.getAllVendas((err, vendas) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        // Para cada venda, buscar itens
        const vendasComItens = vendas.map(venda => {
            return new Promise((resolve, reject) => {
                db.getVendaItens(venda.id, (err, itens) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve({ ...venda, itens });
                });
            });
        });
        
        Promise.all(vendasComItens)
            .then(vendasCompletas => res.json(vendasCompletas))
            .catch(err => res.status(500).json({ error: err.message }));
    });
});

app.get('/api/vendas/:id', (req, res) => {
    db.getVendaById(req.params.id, (err, venda) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!venda) {
            res.status(404).json({ error: 'Venda não encontrada' });
            return;
        }
        
        db.getVendaItens(req.params.id, (err, itens) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ ...venda, itens });
        });
    });
});

app.post('/api/vendas', (req, res) => {
    const { venda, itens } = req.body;
    
    // Validar dados
    if (!venda || !itens || itens.length === 0) {
        res.status(400).json({ error: 'Dados da venda incompletos' });
        return;
    }
    
    db.createVenda(venda, itens, (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: result.id, message: 'Venda criada com sucesso' });
    });
});

app.put('/api/vendas/:id', (req, res) => {
    const venda = req.body;
    db.updateVenda(req.params.id, venda, (err) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: req.params.id, ...venda, message: 'Venda atualizada com sucesso' });
    });
});

app.delete('/api/vendas/:id', (req, res) => {
    db.deleteVenda(req.params.id, (err) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Venda deletada com sucesso' });
    });
});

// Rotas para relatórios
app.get('/api/relatorios/dashboard', (req, res) => {
    db.getDashboardData((err, dados) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        // Buscar estatísticas gerais
        db.getEstatisticasGerais((err, estatisticas) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            // Buscar top serviços
            db.getTopServicos(5, (err, topServicos) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                
                res.json({
                    ...dados,
                    ...estatisticas,
                    topServicos
                });
            });
        });
    });
});

app.get('/api/relatorios/mensal/:mes/:ano', (req, res) => {
    const { mes, ano } = req.params;
    db.getRelatorioMensal(mes, ano, (err, dados) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(dados);
    });
});

app.get('/api/relatorios/top-servicos/:limit?', (req, res) => {
    const limit = req.params.limit || 5;
    db.getTopServicos(limit, (err, servicos) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(servicos);
    });
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor EasyStream rodando na porta ${port}`);
    console.log(`Acesse: http://localhost:${port}`);
});