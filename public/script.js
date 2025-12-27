// Sistema EasyStream Manager - Versão Completa com CRUD
class EasyStreamManager {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.currentFilter = '';
        this.currentStatus = '';
        this.selectedClientId = null;
        this.selectedSupplierId = null;
        this.selectedServiceId = null;
        this.currentStep = 1;
        this.vendaData = {
            cliente: null,
            servicos: [],
            fornecedor: null,
            totalCusto: 0,
            totalVenda: 0,
            linksGGMAX: []
        };
        this.pendingDelete = null;
        this.apiBaseUrl = '';
        this.charts = {};
        this.editingVendaId = null;
    }

    async init() {
        try {
            console.log('=== INICIANDO SISTEMA EASYSTREAM ===');
            await this.loadInitialData();
            this.setupEventListeners();
            this.updateCurrentDate();
            this.loadDashboard();
            
            console.log('=== SISTEMA INICIADO COM SUCESSO ===');
        } catch (error) {
            console.error('Erro na inicialização:', error);
            this.showToast('Erro ao carregar dados. Verifique a conexão com o servidor.', 'error');
        }
    }

    async loadInitialData() {
        try {
            console.log('Carregando dados iniciais...');
            const [servicos, fornecedores, clientes] = await Promise.all([
                this.fetchData('/api/servicos'),
                this.fetchData('/api/fornecedores'),
                this.fetchData('/api/clientes')
            ]);

            console.log(`Dados carregados: ${servicos.length} serviços, ${fornecedores.length} fornecedores, ${clientes.length} clientes`);
            
            // Preencher selects nos modais
            this.populateSelects(clientes, fornecedores, servicos);
            
        } catch (error) {
            console.error('Erro ao carregar dados iniciais:', error);
        }
    }

    populateSelects(clientes, fornecedores, servicos) {
        // Preencher select de clientes na venda
        const selectCliente = document.getElementById('venda-cliente');
        if (selectCliente) {
            selectCliente.innerHTML = '<option value="">Selecione um cliente</option>' +
                clientes.map(c => `<option value="${c.id}">${c.nome} - ${c.telefone}</option>`).join('');
        }
        
        // Preencher select de fornecedores na venda
        const selectFornecedor = document.getElementById('venda-fornecedor');
        if (selectFornecedor) {
            selectFornecedor.innerHTML = '<option value="">Selecione um fornecedor (opcional)</option>' +
                fornecedores.map(f => `<option value="${f.id}">${f.nome} - ${f.contato}</option>`).join('');
        }
        
        // Preencher select de fornecedores no serviço
        const selectFornecedorServico = document.getElementById('servico-fornecedor');
        if (selectFornecedorServico) {
            selectFornecedorServico.innerHTML = '<option value="">Sem fornecedor específico</option>' +
                fornecedores.map(f => `<option value="${f.id}">${f.nome}</option>`).join('');
        }
        
        // Carregar lista de serviços na venda
        this.loadServicosVenda(servicos);
    }

    loadServicosVenda(servicos) {
        const servicosList = document.getElementById('servicos-list-venda');
        if (servicosList) {
            servicosList.innerHTML = servicos.map(servico => {
                const lucro = servico.preco - servico.custo;
                const margem = servico.custo > 0 ? ((lucro / servico.custo) * 100).toFixed(0) : 0;
                
                return `
                    <div class="servico-item-venda" data-id="${servico.id}" 
                         data-nome="${servico.nome}"
                         data-custo="${servico.custo}"
                         data-preco="${servico.preco}"
                         data-duracao="${servico.duracao}"
                         data-categoria="${servico.categoria}">
                        <h5>${servico.nome}</h5>
                        <p>${servico.categoria} • ${servico.duracao} mês(es)</p>
                        <div class="servico-prices">
                            <span class="price-cost">Custo: R$ ${servico.custo.toFixed(2)}</span>
                            <span class="price-sale">Venda: R$ ${servico.preco.toFixed(2)}</span>
                        </div>
                        <small>Lucro: R$ ${lucro.toFixed(2)} (${margem}%)</small>
                    </div>
                `;
            }).join('');
            
            // Adicionar event listeners aos itens de serviço
            document.querySelectorAll('.servico-item-venda').forEach(item => {
                item.addEventListener('click', (e) => {
                    if (!e.target.closest('.servico-quantity') && !e.target.closest('.remove-servico')) {
                        this.addServicoToVenda(item);
                    }
                });
            });
        }
    }

    addServicoToVenda(item) {
        const id = parseInt(item.dataset.id);
        const nome = item.dataset.nome;
        const custo = parseFloat(item.dataset.custo);
        const preco = parseFloat(item.dataset.preco);
        const duracao = parseInt(item.dataset.duracao);
        const categoria = item.dataset.categoria;
        
        // Verificar se já está na lista
        const existingIndex = this.vendaData.servicos.findIndex(s => s.id === id);
        
        if (existingIndex >= 0) {
            // Aumentar quantidade
            this.vendaData.servicos[existingIndex].quantidade++;
        } else {
            // Adicionar novo serviço
            this.vendaData.servicos.push({
                id,
                nome,
                custo,
                preco,
                duracao,
                categoria,
                quantidade: 1,
                link_acesso: '',
                codigo_compra: ''
            });
        }
        
        // Atualizar interface
        this.updateSelectedServicos();
        this.updateVendaTotals();
        
        // Adicionar efeito visual
        item.classList.add('selected');
        setTimeout(() => item.classList.remove('selected'), 300);
    }

    updateSelectedServicos() {
        const container = document.getElementById('selected-servicos-list');
        if (!container) return;
        
        if (this.vendaData.servicos.length === 0) {
            container.innerHTML = '<p class="empty-message">Nenhum serviço selecionado</p>';
            return;
        }
        
        container.innerHTML = this.vendaData.servicos.map((servico, index) => `
            <div class="selected-servico-item">
                <div class="servico-info">
                    <h5>${servico.nome}</h5>
                    <small>${servico.categoria} • ${servico.duracao} mês(es)</small>
                </div>
                <div class="servico-actions">
                    <div class="servico-quantity">
                        <button onclick="system.updateServicoQuantity(${index}, -1)">-</button>
                        <span>${servico.quantidade}</span>
                        <button onclick="system.updateServicoQuantity(${index}, 1)">+</button>
                    </div>
                    <div class="servico-total">
                        <strong>R$ ${(servico.preco * servico.quantidade).toFixed(2)}</strong>
                    </div>
                    <button class="remove-servico" onclick="system.removeServicoFromVenda(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        // Adicionar campos de link GGMAX para cada serviço
        this.addGGMAXLinkFields();
    }

    updateServicoQuantity(index, change) {
        const servico = this.vendaData.servicos[index];
        const newQuantity = servico.quantidade + change;
        
        if (newQuantity < 1) {
            this.removeServicoFromVenda(index);
            return;
        }
        
        servico.quantidade = newQuantity;
        this.updateSelectedServicos();
        this.updateVendaTotals();
    }

    removeServicoFromVenda(index) {
        this.vendaData.servicos.splice(index, 1);
        this.updateSelectedServicos();
        this.updateVendaTotals();
    }

    updateVendaTotals() {
        this.vendaData.totalCusto = this.vendaData.servicos.reduce((sum, s) => sum + (s.custo * s.quantidade), 0);
        this.vendaData.totalVenda = this.vendaData.servicos.reduce((sum, s) => sum + (s.preco * s.quantidade), 0);
        const lucro = this.vendaData.totalVenda - this.vendaData.totalCusto;
        const margem = this.vendaData.totalCusto > 0 ? (lucro / this.vendaData.totalCusto * 100).toFixed(1) : 0;
        
        document.getElementById('venda-custo-total').textContent = `R$ ${this.vendaData.totalCusto.toFixed(2)}`;
        document.getElementById('venda-valor-total').textContent = `R$ ${this.vendaData.totalVenda.toFixed(2)}`;
        document.getElementById('venda-lucro-total').textContent = `R$ ${lucro.toFixed(2)}`;
        document.getElementById('venda-margem-total').textContent = `${margem}%`;
    }

    addGGMAXLinkFields() {
        const ggmaxContainer = document.querySelector('.ggmax-links');
        if (ggmaxContainer) ggmaxContainer.remove();
        
        if (this.vendaData.servicos.some(s => s.categoria.includes('Streaming'))) {
            const container = document.getElementById('selected-servicos-list');
            const ggmaxDiv = document.createElement('div');
            ggmaxDiv.className = 'ggmax-links';
            ggmaxDiv.innerHTML = `
                <h4><i class="fas fa-link"></i> Links da Compra GGMAX</h4>
                ${this.vendaData.servicos.filter(s => s.categoria.includes('Streaming')).map((servico, index) => `
                    <div class="link-input-group">
                        <input type="text" 
                               id="link-ggmax-${servico.id}" 
                               placeholder="Cole aqui o link do ${servico.nome} (GGMAX)"
                               value="${servico.link_acesso || ''}">
                        <button type="button" class="copy-link-btn" onclick="system.copyLink('link-ggmax-${servico.id}')">
                            <i class="fas fa-copy"></i> Copiar
                        </button>
                    </div>
                `).join('')}
            `;
            container.appendChild(ggmaxDiv);
        }
    }

    async fetchData(endpoint, options = {}) {
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                },
                ...options
            };
            
            if (options.body) {
                config.body = JSON.stringify(options.body);
            }
            
            const response = await fetch(endpoint, config);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Erro na requisição ${endpoint}:`, error);
            throw error;
        }
    }

    setupEventListeners() {
        console.log('=== CONFIGURANDO EVENT LISTENERS ===');
        
        // 1. BOTÕES DE NAVEGAÇÃO
        const btnDashboard = document.getElementById('btn-tab-dashboard');
        if (btnDashboard) btnDashboard.addEventListener('click', () => this.showTab('dashboard'));
        
        const btnClientes = document.getElementById('btn-tab-clientes');
        if (btnClientes) btnClientes.addEventListener('click', () => this.showTab('clientes'));
        
        const btnServicos = document.getElementById('btn-tab-servicos');
        if (btnServicos) btnServicos.addEventListener('click', () => this.showTab('servicos'));
        
        const btnFornecedores = document.getElementById('btn-tab-fornecedores');
        if (btnFornecedores) btnFornecedores.addEventListener('click', () => this.showTab('fornecedores'));
        
        const btnVendas = document.getElementById('btn-tab-vendas');
        if (btnVendas) btnVendas.addEventListener('click', () => this.showTab('vendas'));
        
        const btnRelatorios = document.getElementById('btn-tab-relatorios');
        if (btnRelatorios) btnRelatorios.addEventListener('click', () => this.showTab('relatorios'));
        
        // 2. BOTÕES DE AÇÃO
        const btnNovoCliente = document.getElementById('btn-novo-cliente');
        if (btnNovoCliente) btnNovoCliente.addEventListener('click', () => this.openClientModal());
        
        const btnNovoFornecedor = document.getElementById('btn-novo-fornecedor');
        if (btnNovoFornecedor) btnNovoFornecedor.addEventListener('click', () => this.openSupplierModal());
        
        const btnNovoServico = document.getElementById('btn-novo-servico');
        if (btnNovoServico) btnNovoServico.addEventListener('click', () => this.openServicoModal());
        
        const btnNovaVenda = document.getElementById('btn-nova-venda');
        if (btnNovaVenda) btnNovaVenda.addEventListener('click', () => this.openVendaModal());
        
        // 3. BOTÕES DE FECHAR MODAIS
        const closeButtons = [
            { id: 'close-modal-cliente', modal: 'modal-cliente' },
            { id: 'cancel-modal-cliente', modal: 'modal-cliente' },
            { id: 'close-modal-servico', modal: 'modal-servico' },
            { id: 'cancel-modal-servico', modal: 'modal-servico' },
            { id: 'close-modal-fornecedor', modal: 'modal-fornecedor' },
            { id: 'cancel-modal-fornecedor', modal: 'modal-fornecedor' },
            { id: 'close-modal-venda', modal: 'modal-venda' },
            { id: 'cancel-modal-venda', modal: 'modal-venda' },
            { id: 'close-modal-detalhes-venda', modal: 'modal-detalhes-venda' },
            { id: 'close-btn-modal-detalhes-venda', modal: 'modal-detalhes-venda' },
            { id: 'close-modal-confirmacao', modal: 'modal-confirmacao' },
            { id: 'cancel-modal-confirmacao', modal: 'modal-confirmacao' }
        ];
        
        closeButtons.forEach(({ id, modal }) => {
            const button = document.getElementById(id);
            if (button) {
                button.addEventListener('click', () => this.closeModal(modal));
            }
        });
        
        // 4. BOTÕES DE SALVAR
        const btnSalvarCliente = document.getElementById('save-modal-cliente');
        if (btnSalvarCliente) {
            btnSalvarCliente.addEventListener('click', (e) => {
                e.preventDefault();
                this.saveClient();
            });
        }
        
        const btnSalvarFornecedor = document.getElementById('save-modal-fornecedor');
        if (btnSalvarFornecedor) {
            btnSalvarFornecedor.addEventListener('click', (e) => {
                e.preventDefault();
                this.saveSupplier();
            });
        }
        
        const btnSalvarServico = document.getElementById('save-modal-servico');
        if (btnSalvarServico) {
            btnSalvarServico.addEventListener('click', (e) => {
                e.preventDefault();
                this.saveServico();
            });
        }
        
        const btnSalvarVenda = document.getElementById('save-modal-venda');
        if (btnSalvarVenda) {
            btnSalvarVenda.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.editingVendaId) {
                    this.updateVenda();
                } else {
                    this.saveVenda();
                }
            });
        }
        
        // 5. FORMULÁRIOS
        const clienteForm = document.getElementById('cliente-form');
        if (clienteForm) {
            clienteForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveClient();
            });
        }
        
        const fornecedorForm = document.getElementById('fornecedor-form');
        if (fornecedorForm) {
            fornecedorForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveSupplier();
            });
        }
        
        const servicoForm = document.getElementById('servico-form');
        if (servicoForm) {
            servicoForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveServico();
            });
        }
        
        const vendaForm = document.getElementById('venda-form');
        if (vendaForm) {
            vendaForm.addEventListener('submit', (e) => {
                e.preventDefault();
                if (this.editingVendaId) {
                    this.updateVenda();
                } else {
                    this.saveVenda();
                }
            });
        }
        
        // 6. CONFIRMAÇÃO DE EXCLUSÃO
        const confirmBtn = document.getElementById('confirm-action-btn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                this.confirmAction();
                this.closeModal('modal-confirmacao');
            });
        }
        
        // 7. RATING STARS
        const stars = document.querySelectorAll('.stars i');
        stars.forEach(star => {
            star.addEventListener('click', () => {
                const rating = star.dataset.rating;
                document.getElementById('fornecedor-avaliacao').value = rating;
                
                // Atualizar visualização das estrelas
                stars.forEach(s => {
                    if (s.dataset.rating <= rating) {
                        s.classList.add('active');
                    } else {
                        s.classList.remove('active');
                    }
                });
            });
        });
        
        // 8. SEARCH FUNCTIONS
        const searchClient = document.getElementById('search-client');
        if (searchClient) {
            searchClient.addEventListener('input', (e) => this.filterClients(e.target.value));
        }
        
        const searchService = document.getElementById('search-service');
        if (searchService) {
            searchService.addEventListener('input', (e) => this.filterServices(e.target.value));
        }
        
        const searchSupplier = document.getElementById('search-supplier');
        if (searchSupplier) {
            searchSupplier.addEventListener('input', (e) => this.filterSuppliers(e.target.value));
        }
        
        const searchServicoVenda = document.getElementById('search-servico-venda');
        if (searchServicoVenda) {
            searchServicoVenda.addEventListener('input', (e) => this.filterServicosVenda(e.target.value));
        }
        
        console.log('=== EVENT LISTENERS CONFIGURADOS ===');
    }

    // ========== FUNÇÕES DE SALVAR ==========
    
    async saveClient() {
        try {
            console.log('Salvando cliente...');
            
            const clienteData = {
                nome: document.getElementById('cliente-nome').value.trim(),
                telefone: document.getElementById('cliente-telefone').value.trim(),
                email: document.getElementById('cliente-email').value.trim(),
                status: document.getElementById('cliente-status').value,
                observacoes: document.getElementById('cliente-observacoes').value.trim()
            };

            // Validação básica
            if (!clienteData.nome || !clienteData.telefone) {
                this.showToast('Nome e telefone são obrigatórios!', 'error');
                return;
            }
            
            const clienteId = document.getElementById('cliente-id').value;
            
            let response;
            if (clienteId) {
                // Atualizar cliente existente
                response = await this.fetchData(`/api/clientes/${clienteId}`, {
                    method: 'PUT',
                    body: clienteData
                });
                this.showToast('Cliente atualizado com sucesso!', 'success');
            } else {
                // Criar novo cliente
                response = await this.fetchData('/api/clientes', {
                    method: 'POST',
                    body: clienteData
                });
                this.showToast('Cliente criado com sucesso!', 'success');
            }

            // Limpar e fechar modal
            this.clearForm('cliente-form');
            this.closeModal('modal-cliente');
            
            // Recarregar dados
            await this.loadClients();
            await this.loadDashboard();
            
        } catch (error) {
            console.error('Erro ao salvar cliente:', error);
            this.showToast('Erro ao salvar cliente. Verifique os dados.', 'error');
        }
    }

    async saveSupplier() {
        try {
            console.log('Salvando fornecedor...');
            
            const fornecedorData = {
                nome: document.getElementById('fornecedor-nome').value.trim(),
                contato: document.getElementById('fornecedor-contato').value.trim(),
                tipo_contato: document.getElementById('fornecedor-tipo-contato').value,
                avaliacao: parseFloat(document.getElementById('fornecedor-avaliacao').value) || 3.0,
                status: document.getElementById('fornecedor-status').value,
                observacoes: document.getElementById('fornecedor-observacoes').value.trim()
            };

            if (!fornecedorData.nome || !fornecedorData.contato) {
                this.showToast('Nome e contato são obrigatórios!', 'error');
                return;
            }
            
            const fornecedorId = document.getElementById('fornecedor-id').value;
            
            let response;
            if (fornecedorId) {
                response = await this.fetchData(`/api/fornecedores/${fornecedorId}`, {
                    method: 'PUT',
                    body: fornecedorData
                });
                this.showToast('Fornecedor atualizado com sucesso!', 'success');
            } else {
                response = await this.fetchData('/api/fornecedores', {
                    method: 'POST',
                    body: fornecedorData
                });
                this.showToast('Fornecedor criado com sucesso!', 'success');
            }

            this.clearForm('fornecedor-form');
            this.closeModal('modal-fornecedor');
            await this.loadSuppliers();
            
        } catch (error) {
            console.error('Erro ao salvar fornecedor:', error);
            this.showToast('Erro ao salvar fornecedor', 'error');
        }
    }

    async saveServico() {
        try {
            console.log('Salvando serviço...');
            
            const servicoData = {
                nome: document.getElementById('servico-nome').value.trim(),
                categoria: document.getElementById('servico-categoria').value,
                descricao: document.getElementById('servico-descricao').value.trim(),
                custo: parseFloat(document.getElementById('servico-custo').value) || 0,
                preco: parseFloat(document.getElementById('servico-preco').value) || 0,
                duracao: parseInt(document.getElementById('servico-duracao').value) || 1,
                fornecedor_id: document.getElementById('servico-fornecedor').value || null,
                status: document.getElementById('servico-status').value
            };

            if (!servicoData.nome || !servicoData.categoria || servicoData.custo <= 0 || servicoData.preco <= 0) {
                this.showToast('Preencha todos os campos obrigatórios com valores válidos!', 'error');
                return;
            }
            
            const servicoId = document.getElementById('servico-id').value;
            
            let response;
            if (servicoId) {
                response = await this.fetchData(`/api/servicos/${servicoId}`, {
                    method: 'PUT',
                    body: servicoData
                });
                this.showToast('Serviço atualizado com sucesso!', 'success');
            } else {
                response = await this.fetchData('/api/servicos', {
                    method: 'POST',
                    body: servicoData
                });
                this.showToast('Serviço criado com sucesso!', 'success');
            }

            this.clearForm('servico-form');
            this.closeModal('modal-servico');
            await this.loadServices();
            
        } catch (error) {
            console.error('Erro ao salvar serviço:', error);
            this.showToast('Erro ao salvar serviço', 'error');
        }
    }

    async saveVenda() {
        try {
            console.log('Salvando venda...');
            
            if (this.vendaData.servicos.length === 0) {
                this.showToast('Adicione pelo menos um serviço à venda!', 'error');
                return;
            }
            
            const clienteId = document.getElementById('venda-cliente').value;
            if (!clienteId) {
                this.showToast('Selecione um cliente!', 'error');
                return;
            }
            
            // Coletar links GGMAX
            this.vendaData.servicos.forEach(servico => {
                const linkInput = document.getElementById(`link-ggmax-${servico.id}`);
                if (linkInput) {
                    servico.link_acesso = linkInput.value.trim();
                }
                // Gerar código único se não existir
                if (!servico.codigo_compra) {
                    servico.codigo_compra = 'GGMAX-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                }
            });
            
            const vendaData = {
                venda: {
                    cliente_id: parseInt(clienteId),
                    fornecedor_id: document.getElementById('venda-fornecedor').value || null,
                    total_custo: this.vendaData.totalCusto,
                    total_venda: this.vendaData.totalVenda,
                    total_lucro: this.vendaData.totalVenda - this.vendaData.totalCusto,
                    status: document.getElementById('venda-status').value,
                    metodo_pagamento: document.getElementById('venda-metodo-pagamento').value,
                    observacoes: document.getElementById('venda-observacoes').value.trim()
                },
                itens: this.vendaData.servicos.map(servico => ({
                    servico_id: servico.id,
                    quantidade: servico.quantidade,
                    custo_unitario: servico.custo,
                    preco_unitario: servico.preco,
                    duracao: servico.duracao,
                    link_acesso: servico.link_acesso,
                    codigo_compra: servico.codigo_compra
                }))
            };
            
            const response = await this.fetchData('/api/vendas', {
                method: 'POST',
                body: vendaData
            });
            
            this.showToast('Venda registrada com sucesso!', 'success');
            
            // Limpar dados da venda
            this.resetVendaData();
            
            this.clearForm('venda-form');
            this.closeModal('modal-venda');
            
            // Atualizar dados
            await this.loadInitialData();
            await this.loadVendas();
            await this.loadDashboard();
            
        } catch (error) {
            console.error('Erro ao salvar venda:', error);
            this.showToast('Erro ao salvar venda', 'error');
        }
    }

    async updateVenda() {
        try {
            console.log('Atualizando venda...');
            
            if (this.vendaData.servicos.length === 0) {
                this.showToast('Adicione pelo menos um serviço à venda!', 'error');
                return;
            }
            
            const clienteId = document.getElementById('venda-cliente').value;
            if (!clienteId) {
                this.showToast('Selecione um cliente!', 'error');
                return;
            }
            
            // Coletar links GGMAX
            this.vendaData.servicos.forEach(servico => {
                const linkInput = document.getElementById(`link-ggmax-${servico.id}`);
                if (linkInput) {
                    servico.link_acesso = linkInput.value.trim();
                }
            });
            
            const vendaData = {
                venda: {
                    cliente_id: parseInt(clienteId),
                    fornecedor_id: document.getElementById('venda-fornecedor').value || null,
                    total_custo: this.vendaData.totalCusto,
                    total_venda: this.vendaData.totalVenda,
                    total_lucro: this.vendaData.totalVenda - this.vendaData.totalCusto,
                    status: document.getElementById('venda-status').value,
                    metodo_pagamento: document.getElementById('venda-metodo-pagamento').value,
                    observacoes: document.getElementById('venda-observacoes').value.trim()
                },
                itens: this.vendaData.servicos.map(servico => ({
                    servico_id: servico.id,
                    quantidade: servico.quantidade,
                    custo_unitario: servico.custo,
                    preco_unitario: servico.preco,
                    duracao: servico.duracao,
                    link_acesso: servico.link_acesso,
                    codigo_compra: servico.codigo_compra || 'COD-' + Date.now() + '-' + servico.id
                }))
            };
            
            const response = await this.fetchData(`/api/vendas/${this.editingVendaId}`, {
                method: 'PUT',
                body: vendaData
            });
            
            this.showToast('Venda atualizada com sucesso!', 'success');
            
            // Resetar dados
            this.resetVendaData();
            this.editingVendaId = null;
            
            this.clearForm('venda-form');
            this.closeModal('modal-venda');
            
            // Atualizar dados
            await this.loadInitialData();
            await this.loadVendas();
            await this.loadDashboard();
            
        } catch (error) {
            console.error('Erro ao atualizar venda:', error);
            this.showToast('Erro ao atualizar venda', 'error');
        }
    }

    async loadVendaForEdit(vendaId) {
        try {
            console.log(`Carregando venda ${vendaId} para edição`);
            
            // Carregar dados da venda
            const venda = await this.fetchData(`/api/vendas/${vendaId}`);
            
            if (!venda) {
                this.showToast('Venda não encontrada', 'error');
                return;
            }
            
            this.editingVendaId = vendaId;
            
            // Preencher formulário
            document.getElementById('venda-id').value = venda.id;
            document.getElementById('venda-cliente').value = venda.cliente_id;
            document.getElementById('venda-fornecedor').value = venda.fornecedor_id || '';
            document.getElementById('venda-status').value = venda.status;
            document.getElementById('venda-metodo-pagamento').value = venda.metodo_pagamento || 'pix';
            document.getElementById('venda-observacoes').value = venda.observacoes || '';
            document.getElementById('modal-venda-title').innerHTML = '<i class="fas fa-edit"></i> Editar Venda';
            
            // Resetar dados da venda
            this.resetVendaData();
            
            // Carregar itens da venda
            if (venda.itens && venda.itens.length > 0) {
                // Carregar todos os serviços
                const servicos = await this.fetchData('/api/servicos');
                
                venda.itens.forEach(item => {
                    const servico = servicos.find(s => s.id === item.servico_id);
                    if (servico) {
                        this.vendaData.servicos.push({
                            id: item.servico_id,
                            nome: servico.nome,
                            custo: item.custo_unitario,
                            preco: item.preco_unitario,
                            duracao: servico.duracao,
                            categoria: servico.categoria,
                            quantidade: item.quantidade,
                            link_acesso: item.link_acesso || '',
                            codigo_compra: item.codigo_compra || ''
                        });
                    }
                });
                
                // Atualizar interface
                this.updateSelectedServicos();
                this.updateVendaTotals();
            }
            
            // Abrir modal
            this.openVendaModal();
            
        } catch (error) {
            console.error('Erro ao carregar venda para edição:', error);
            this.showToast('Erro ao carregar venda', 'error');
        }
    }

    async deleteVenda(vendaId) {
        try {
            this.pendingDelete = { type: 'venda', id: vendaId };
            
            const confirmTitle = document.getElementById('confirm-title');
            const confirmMessage = document.getElementById('confirm-message');
            
            if (confirmTitle) confirmTitle.textContent = `Confirmar Exclusão`;
            if (confirmMessage) confirmMessage.textContent = 
                `Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.`;
            
            const modal = document.getElementById('modal-confirmacao');
            if (modal) modal.style.display = 'flex';
            
            // Configurar botão de confirmação
            const confirmBtn = document.getElementById('confirm-action-btn');
            if (confirmBtn) {
                const newConfirmBtn = confirmBtn.cloneNode(true);
                confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
                
                newConfirmBtn.addEventListener('click', async () => {
                    try {
                        await this.fetchData(`/api/vendas/${vendaId}`, { method: 'DELETE' });
                        this.showToast('Venda excluída com sucesso!', 'success');
                        this.closeModal('modal-confirmacao');
                        await this.loadVendas();
                        await this.loadDashboard();
                    } catch (error) {
                        console.error('Erro ao excluir venda:', error);
                        this.showToast('Erro ao excluir venda', 'error');
                    }
                });
            }
            
        } catch (error) {
            console.error('Erro ao preparar exclusão da venda:', error);
            this.showToast('Erro ao excluir venda', 'error');
        }
    }

    async viewVendaDetails(vendaId) {
        try {
            console.log(`Visualizando detalhes da venda ${vendaId}`);
            
            // Carregar dados da venda
            const venda = await this.fetchData(`/api/vendas/${vendaId}`);
            
            if (!venda) {
                this.showToast('Venda não encontrada', 'error');
                return;
            }
            
            // Criar conteúdo detalhado
            const data = new Date(venda.created_at);
            let detalhesHTML = `
                <div class="venda-detalhes">
                    <div class="detalhes-header">
                        <h3><i class="fas fa-receipt"></i> Detalhes da Venda #${venda.id}</h3>
                        <p class="detalhes-data">Data: ${data.toLocaleDateString('pt-BR')} ${data.toLocaleTimeString('pt-BR')}</p>
                    </div>
                    
                    <div class="detalhes-grid">
                        <div class="detalhes-card">
                            <h4><i class="fas fa-user"></i> Cliente</h4>
                            <p><strong>${venda.cliente_nome || 'Cliente'}</strong></p>
                        </div>
                        
                        <div class="detalhes-card">
                            <h4><i class="fas fa-store"></i> Fornecedor</h4>
                            <p>${venda.fornecedor_nome || 'Não especificado'}</p>
                        </div>
                        
                        <div class="detalhes-card">
                            <h4><i class="fas fa-tag"></i> Status</h4>
                            <span class="badge ${venda.status}">${venda.status}</span>
                        </div>
                        
                        <div class="detalhes-card">
                            <h4><i class="fas fa-credit-card"></i> Pagamento</h4>
                            <p>${venda.metodo_pagamento || 'Não informado'}</p>
                        </div>
                    </div>
                    
                    <div class="detalhes-totais">
                        <div class="total-item">
                            <span>Custo Total:</span>
                            <strong class="text-danger">R$ ${(venda.total_custo || 0).toFixed(2)}</strong>
                        </div>
                        <div class="total-item">
                            <span>Valor da Venda:</span>
                            <strong class="text-success">R$ ${(venda.total_venda || 0).toFixed(2)}</strong>
                        </div>
                        <div class="total-item">
                            <span>Lucro:</span>
                            <strong class="text-blue">R$ ${(venda.total_lucro || 0).toFixed(2)}</strong>
                        </div>
                    </div>
            `;
            
            // Adicionar itens da venda
            if (venda.itens && venda.itens.length > 0) {
                detalhesHTML += `
                    <div class="detalhes-servicos">
                        <h4><i class="fas fa-list-alt"></i> Serviços Vendidos</h4>
                        <div class="servicos-list">
                `;
                
                venda.itens.forEach(item => {
                    const totalItem = item.preco_unitario * item.quantidade;
                    detalhesHTML += `
                        <div class="servico-detalhe">
                            <div class="servico-info">
                                <h5>${item.servico_nome || 'Serviço'}</h5>
                                <small>${item.categoria || 'Categoria'} • Quantidade: ${item.quantidade} • Duração: ${item.duracao || 1} mês(es)</small>
                            </div>
                            <div class="servico-valores">
                                <div class="valor-item">
                                    <span>Custo:</span>
                                    <span class="text-danger">R$ ${item.custo_unitario.toFixed(2)}</span>
                                </div>
                                <div class="valor-item">
                                    <span>Preço:</span>
                                    <span class="text-success">R$ ${item.preco_unitario.toFixed(2)}</span>
                                </div>
                                <div class="valor-item">
                                    <span>Total:</span>
                                    <strong>R$ ${totalItem.toFixed(2)}</strong>
                                </div>
                            </div>
                        </div>
                    `;
                });
                
                detalhesHTML += `
                        </div>
                    </div>
                `;
            }
            
            // Adicionar observações se existirem
            if (venda.observacoes) {
                detalhesHTML += `
                    <div class="detalhes-observacoes">
                        <h4><i class="fas fa-sticky-note"></i> Observações</h4>
                        <p>${venda.observacoes}</p>
                    </div>
                `;
            }
            
            detalhesHTML += `</div>`;
            
            // Inserir no modal
            const detalhesContent = document.getElementById('detalhes-venda-content');
            if (detalhesContent) {
                detalhesContent.innerHTML = detalhesHTML;
            }
            
            // Configurar botões de ação
            const btnEditar = document.getElementById('btn-editar-venda');
            const btnExcluir = document.getElementById('btn-excluir-venda');
            
            if (btnEditar) {
                btnEditar.onclick = () => {
                    this.closeModal('modal-detalhes-venda');
                    this.loadVendaForEdit(vendaId);
                };
            }
            
            if (btnExcluir) {
                btnExcluir.onclick = () => {
                    this.closeModal('modal-detalhes-venda');
                    this.deleteVenda(vendaId);
                };
            }
            
            // Abrir modal de detalhes
            this.closeModal('modal-detalhes-venda');
            const modal = document.getElementById('modal-detalhes-venda');
            if (modal) {
                modal.style.display = 'flex';
            }
            
        } catch (error) {
            console.error('Erro ao carregar detalhes da venda:', error);
            this.showToast('Erro ao carregar detalhes da venda', 'error');
        }
    }

    resetVendaData() {
        this.vendaData = {
            cliente: null,
            servicos: [],
            fornecedor: null,
            totalCusto: 0,
            totalVenda: 0,
            linksGGMAX: []
        };
        this.updateSelectedServicos();
        this.updateVendaTotals();
    }

    clearForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
            const hiddenInputs = form.querySelectorAll('input[type="hidden"]');
            hiddenInputs.forEach(input => input.value = '');
        }
        
        // Limpar dados específicos da venda
        if (formId === 'venda-form') {
            this.resetVendaData();
            this.editingVendaId = null;
            document.getElementById('modal-venda-title').innerHTML = '<i class="fas fa-cart-plus"></i> Nova Venda';
        }
    }

    copyLink(inputId) {
        const input = document.getElementById(inputId);
        if (input && input.value) {
            input.select();
            document.execCommand('copy');
            this.showToast('Link copiado para a área de transferência!', 'success');
        } else {
            this.showToast('Nenhum link para copiar!', 'warning');
        }
    }

    filterServicosVenda(searchTerm) {
        const items = document.querySelectorAll('.servico-item-venda');
        items.forEach(item => {
            const nome = item.dataset.nome.toLowerCase();
            const categoria = item.dataset.categoria.toLowerCase();
            if (nome.includes(searchTerm.toLowerCase()) || categoria.includes(searchTerm.toLowerCase())) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    filterClients(searchTerm) {
        const rows = document.querySelectorAll('#client-table-body tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            if (text.includes(searchTerm.toLowerCase())) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    filterServices(searchTerm) {
        const cards = document.querySelectorAll('.service-card');
        cards.forEach(card => {
            const text = card.textContent.toLowerCase();
            if (text.includes(searchTerm.toLowerCase())) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    filterSuppliers(searchTerm) {
        const cards = document.querySelectorAll('.supplier-card');
        cards.forEach(card => {
            const text = card.textContent.toLowerCase();
            if (text.includes(searchTerm.toLowerCase())) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // ========== FUNÇÕES PRINCIPAIS ==========

    showTab(tab) {
        console.log(`Mostrando aba: ${tab}`);
        
        // Esconder todas as abas
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        
        // Mostrar aba selecionada
        const tabContent = document.getElementById(`tab-${tab}`);
        const tabButton = document.getElementById(`btn-tab-${tab}`);
        
        if (tabContent) tabContent.classList.add('active');
        if (tabButton) tabButton.classList.add('active');
        
        // Carregar conteúdo específico
        switch(tab) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'clientes':
                this.loadClients();
                break;
            case 'fornecedores':
                this.loadSuppliers();
                break;
            case 'servicos':
                this.loadServices();
                break;
            case 'vendas':
                this.loadVendas();
                break;
            case 'relatorios':
                this.loadRelatorios();
                break;
        }
    }

    updateCurrentDate() {
        const now = new Date();
        const options = { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        };
        const dateElement = document.getElementById('current-date');
        if (dateElement) {
            dateElement.textContent = now.toLocaleDateString('pt-BR', options).replace(',', ' -');
        }
    }

    async loadDashboard() {
        try {
            console.log('Carregando dashboard...');
            const data = await this.fetchData('/api/relatorios/dashboard');
            
            // Atualizar estatísticas
            const elements = {
                'faturamento-total': `R$ ${(data.faturamento_total || 0).toFixed(2)}`,
                'lucro-total': `R$ ${(data.lucro_total || 0).toFixed(2)}`,
                'ativos-count': data.clientes_ativos || 0,
                'total-clientes': data.total_clientes || 0,
                'vencer-count': data.renovações_proximas || 0
            };
            
            Object.entries(elements).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) element.textContent = value;
            });
            
            // Carregar vendas recentes
            await this.loadRecentSales();
            
        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
        }
    }

    async loadRecentSales() {
        try {
            const vendas = await this.fetchData('/api/vendas');
            const recentSales = vendas.slice(0, 5); // Últimas 5 vendas
            
            const tbody = document.getElementById('recent-sales');
            if (tbody) {
                tbody.innerHTML = recentSales.map(venda => {
                    const data = new Date(venda.created_at);
                    return `
                        <tr>
                            <td>${venda.cliente_nome || 'Cliente'}</td>
                            <td>${venda.itens?.length || 0} serviço(s)</td>
                            <td class="text-success">R$ ${(venda.total_venda || 0).toFixed(2)}</td>
                            <td>${venda.fornecedor_nome || 'N/A'}</td>
                            <td>${data.toLocaleDateString('pt-BR')}</td>
                        </tr>
                    `;
                }).join('') || '<tr><td colspan="5">Nenhuma venda registrada</td></tr>';
            }
        } catch (error) {
            console.error('Erro ao carregar vendas recentes:', error);
        }
    }

    async loadClients() {
        try {
            console.log('Carregando clientes...');
            const clients = await this.fetchData('/api/clientes');
            
            const tbody = document.getElementById('client-table-body');
            if (tbody) {
                tbody.innerHTML = clients.map(cliente => `
                    <tr>
                        <td>
                            <strong>${cliente.nome}</strong>
                            ${cliente.email ? `<br><small>${cliente.email}</small>` : ''}
                        </td>
                        <td>${cliente.telefone || '-'}</td>
                        <td>${cliente.total_assinaturas || 0} serviço(s)</td>
                        <td class="text-success">R$ ${(cliente.total_gasto || 0).toFixed(2)}</td>
                        <td>-</td>
                        <td><span class="badge ${cliente.status}">${cliente.status}</span></td>
                        <td>
                            <div class="action-buttons">
                                <button class="action-btn view" onclick="system.viewClient(${cliente.id})" title="Visualizar">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="action-btn edit" onclick="system.editClient(${cliente.id})" title="Editar">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="action-btn delete" onclick="system.confirmDelete('client', ${cliente.id}, '${cliente.nome}')" title="Excluir">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('') || '<tr><td colspan="7">Nenhum cliente encontrado</td></tr>';
            }
            
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
            this.showToast('Erro ao carregar clientes', 'error');
        }
    }

    async loadSuppliers() {
        try {
            console.log('Carregando fornecedores...');
            const suppliers = await this.fetchData('/api/fornecedores');
            
            const container = document.getElementById('suppliers-grid');
            if (container) {
                container.innerHTML = suppliers.map(supplier => `
                    <div class="supplier-card">
                        <div class="supplier-header">
                            <div class="supplier-avatar">
                                ${supplier.nome.charAt(0).toUpperCase()}
                            </div>
                            <div class="supplier-info">
                                <h4>${supplier.nome}</h4>
                                <p class="supplier-contato">
                                    <i class="fas fa-${supplier.tipo_contato === 'whatsapp' ? 'whatsapp' : 
                                                      supplier.tipo_contato === 'telegram' ? 'telegram' : 
                                                      'envelope'}"></i>
                                    ${supplier.contato}
                                </p>
                            </div>
                            <span class="badge ${supplier.status}">${supplier.status}</span>
                        </div>
                        
                        <div class="supplier-stats">
                            <div class="stat-item">
                                <span class="stat-value">${(supplier.avaliacao || 3.0).toFixed(1)}</span>
                                <span class="stat-label">Avaliação</span>
                            </div>
                        </div>
                        
                        <div class="supplier-actions">
                            <button class="btn-primary small" onclick="system.editSupplier(${supplier.id})">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button class="btn-danger small" onclick="system.confirmDelete('supplier', ${supplier.id}, '${supplier.nome}')">
                                <i class="fas fa-trash"></i> Excluir
                            </button>
                        </div>
                    </div>
                `).join('') || '<p>Nenhum fornecedor cadastrado</p>';
            }
            
        } catch (error) {
            console.error('Erro ao carregar fornecedores:', error);
            this.showToast('Erro ao carregar fornecedores', 'error');
        }
    }

    async loadServices() {
        try {
            console.log('Carregando serviços...');
            const servicos = await this.fetchData('/api/servicos');
            
            const container = document.getElementById('services-grid');
            if (container) {
                container.innerHTML = servicos.map(servico => {
                    const lucro = servico.preco - servico.custo;
                    const margem = servico.custo > 0 ? (lucro / servico.custo * 100).toFixed(0) : 0;
                    
                    return `
                        <div class="service-card">
                            <div class="service-header">
                                <h4>${servico.nome}</h4>
                                <span class="badge ${servico.status}">${servico.status}</span>
                            </div>
                            <p class="service-category">${servico.categoria}</p>
                            ${servico.descricao ? `<p class="service-description">${servico.descricao}</p>` : ''}
                            <div class="service-prices">
                                <div class="price-item">
                                    <span>Custo:</span>
                                    <strong class="text-danger">R$ ${servico.custo.toFixed(2)}</strong>
                                </div>
                                <div class="price-item">
                                    <span>Venda:</span>
                                    <strong class="text-success">R$ ${servico.preco.toFixed(2)}</strong>
                                </div>
                                <div class="price-item">
                                    <span>Lucro:</span>
                                    <strong class="text-blue">R$ ${lucro.toFixed(2)} (${margem}%)</strong>
                                </div>
                            </div>
                            <div class="service-footer">
                                <small>Duração: ${servico.duracao} mês(es)</small>
                                <div class="service-actions">
                                    <button class="action-btn edit" onclick="system.editServico(${servico.id})">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="action-btn delete" onclick="system.confirmDelete('servico', ${servico.id}, '${servico.nome}')">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('') || '<p>Nenhum serviço encontrado</p>';
            }
            
        } catch (error) {
            console.error('Erro ao carregar serviços:', error);
            this.showToast('Erro ao carregar serviços', 'error');
        }
    }

    async loadVendas() {
        try {
            console.log('Carregando vendas...');
            const vendas = await this.fetchData('/api/vendas');
            
            const tbody = document.getElementById('sales-table-body');
            if (tbody) {
                tbody.innerHTML = vendas.map(venda => {
                    const data = new Date(venda.created_at);
                    const lucro = venda.total_lucro || venda.total_venda - venda.total_custo;
                    
                    return `
                        <tr>
                            <td>${data.toLocaleDateString('pt-BR')}</td>
                            <td>${venda.cliente_nome || 'Cliente'}</td>
                            <td>${venda.itens?.length || 0} serviço(s)</td>
                            <td>${venda.fornecedor_nome || 'N/A'}</td>
                            <td class="text-danger">R$ ${(venda.total_custo || 0).toFixed(2)}</td>
                            <td class="text-success">R$ ${(venda.total_venda || 0).toFixed(2)}</td>
                            <td class="text-blue">R$ ${lucro.toFixed(2)}</td>
                            <td><span class="badge ${venda.status}">${venda.status}</span></td>
                            <td>
                                <div class="action-buttons">
                                    <button class="action-btn view" onclick="system.viewVendaDetails(${venda.id})" title="Visualizar">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="action-btn edit" onclick="system.loadVendaForEdit(${venda.id})" title="Editar">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="action-btn delete" onclick="system.deleteVenda(${venda.id})" title="Excluir">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('') || '<tr><td colspan="9">Nenhuma venda registrada</td></tr>';
            }
            
            // Atualizar totais
            this.updateSalesTotals(vendas);
            
        } catch (error) {
            console.error('Erro ao carregar vendas:', error);
            this.showToast('Erro ao carregar vendas', 'error');
        }
    }

    updateSalesTotals(vendas) {
        const totalVendas = vendas.reduce((sum, v) => sum + (v.total_venda || 0), 0);
        const totalLucro = vendas.reduce((sum, v) => sum + (v.total_lucro || 0), 0);
        const margemMedia = totalVendas > 0 ? (totalLucro / totalVendas * 100).toFixed(1) : 0;
        
        document.getElementById('total-vendas').textContent = `R$ ${totalVendas.toFixed(2)}`;
        document.getElementById('total-lucro-vendas').textContent = `R$ ${totalLucro.toFixed(2)}`;
        document.getElementById('margem-media-vendas').textContent = `${margemMedia}%`;
    }

    async loadRelatorios() {
        try {
            console.log('Carregando relatórios...');
            
            // Carregar dados do dashboard para relatórios
            const data = await this.fetchData('/api/relatorios/dashboard');
            
            // Atualizar top fornecedores
            await this.updateTopFornecedores();
            
            // Gerar gráficos
            await this.generateCharts();
            
        } catch (error) {
            console.error('Erro ao carregar relatórios:', error);
            this.showToast('Erro ao carregar relatórios', 'error');
        }
    }

    async updateTopFornecedores() {
        try {
            const fornecedores = await this.fetchData('/api/fornecedores');
            const vendas = await this.fetchData('/api/vendas');
            
            // Calcular vendas por fornecedor
            const vendasPorFornecedor = {};
            vendas.forEach(venda => {
                if (venda.fornecedor_id) {
                    if (!vendasPorFornecedor[venda.fornecedor_id]) {
                        vendasPorFornecedor[venda.fornecedor_id] = 0;
                    }
                    vendasPorFornecedor[venda.fornecedor_id] += venda.total_venda || 0;
                }
            });
            
            // Criar lista ordenada
            const topList = Object.entries(vendasPorFornecedor)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([id, total], index) => {
                    const fornecedor = fornecedores.find(f => f.id == id);
                    return `
                        <div class="top-item">
                            <span>${index + 1}.</span>
                            <span>${fornecedor?.nome || 'Fornecedor Desconhecido'}</span>
                            <span>R$ ${total.toFixed(2)}</span>
                        </div>
                    `;
                }).join('');
            
            const container = document.getElementById('top-fornecedores-list');
            if (container) {
                container.innerHTML = topList || '<div class="top-item"><span>Nenhum dado disponível</span></div>';
            }
            
        } catch (error) {
            console.error('Erro ao carregar top fornecedores:', error);
        }
    }

    async generateCharts() {
        try {
            // Gráfico de faturamento mensal
            const vendas = await this.fetchData('/api/vendas');
            
            // Agrupar vendas por mês
            const vendasPorMes = {};
            vendas.forEach(venda => {
                const date = new Date(venda.created_at);
                const mesAno = `${date.getMonth() + 1}/${date.getFullYear()}`;
                
                if (!vendasPorMes[mesAno]) {
                    vendasPorMes[mesAno] = 0;
                }
                vendasPorMes[mesAno] += venda.total_venda || 0;
            });
            
            // Ordenar por data
            const meses = Object.keys(vendasPorMes).sort((a, b) => {
                const [mesA, anoA] = a.split('/').map(Number);
                const [mesB, anoB] = b.split('/').map(Number);
                return new Date(anoA, mesA - 1) - new Date(anoB, mesB - 1);
            });
            
            const valores = meses.map(mes => vendasPorMes[mes]);
            
            // Criar gráfico
            const ctx = document.getElementById('revenue-chart');
            if (ctx) {
                // Destruir gráfico anterior se existir
                if (this.charts.revenue) {
                    this.charts.revenue.destroy();
                }
                
                this.charts.revenue = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: meses,
                        datasets: [{
                            label: 'Faturamento Mensal',
                            data: valores,
                            borderColor: '#6C63FF',
                            backgroundColor: 'rgba(108, 99, 255, 0.1)',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: {
                                    color: 'rgba(255, 255, 255, 0.1)'
                                },
                                ticks: {
                                    callback: function(value) {
                                        return 'R$ ' + value.toFixed(0);
                                    },
                                    color: '#B3B3B3'
                                }
                            },
                            x: {
                                grid: {
                                    color: 'rgba(255, 255, 255, 0.1)'
                                },
                                ticks: {
                                    color: '#B3B3B3'
                                }
                            }
                        }
                    }
                });
            }
            
        } catch (error) {
            console.error('Erro ao gerar gráficos:', error);
        }
    }

    // ========== MODAIS ==========

    openClientModal(clientId = null) {
        console.log('Abrindo modal de cliente');
        const modal = document.getElementById('modal-cliente');
        
        // Limpar formulário
        this.clearForm('cliente-form');
        
        if (clientId) {
            // Modo edição
            document.getElementById('cliente-id').value = clientId;
            document.getElementById('modal-cliente-title').innerHTML = '<i class="fas fa-user-edit"></i> Editar Cliente';
            
            // Carregar dados do cliente
            this.fetchData(`/api/clientes/${clientId}`)
                .then(cliente => {
                    document.getElementById('cliente-nome').value = cliente.nome || '';
                    document.getElementById('cliente-telefone').value = cliente.telefone || '';
                    document.getElementById('cliente-email').value = cliente.email || '';
                    document.getElementById('cliente-status').value = cliente.status || 'ativo';
                    document.getElementById('cliente-observacoes').value = cliente.observacoes || '';
                })
                .catch(error => {
                    console.error('Erro ao carregar cliente:', error);
                    this.showToast('Erro ao carregar dados do cliente', 'error');
                });
        } else {
            // Modo novo
            document.getElementById('modal-cliente-title').innerHTML = '<i class="fas fa-user-plus"></i> Novo Cliente';
        }
        
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    openSupplierModal(supplierId = null) {
        console.log('Abrindo modal de fornecedor');
        const modal = document.getElementById('modal-fornecedor');
        
        this.clearForm('fornecedor-form');
        
        if (supplierId) {
            document.getElementById('fornecedor-id').value = supplierId;
            document.getElementById('modal-fornecedor-title').innerHTML = '<i class="fas fa-user-edit"></i> Editar Fornecedor';
            
            this.fetchData(`/api/fornecedores/${supplierId}`)
                .then(fornecedor => {
                    document.getElementById('fornecedor-nome').value = fornecedor.nome || '';
                    document.getElementById('fornecedor-contato').value = fornecedor.contato || '';
                    document.getElementById('fornecedor-tipo-contato').value = fornecedor.tipo_contato || 'telegram';
                    document.getElementById('fornecedor-avaliacao').value = fornecedor.avaliacao || '3';
                    document.getElementById('fornecedor-status').value = fornecedor.status || 'ativo';
                    document.getElementById('fornecedor-observacoes').value = fornecedor.observacoes || '';
                })
                .catch(error => {
                    console.error('Erro ao carregar fornecedor:', error);
                    this.showToast('Erro ao carregar dados do fornecedor', 'error');
                });
        } else {
            document.getElementById('modal-fornecedor-title').innerHTML = '<i class="fas fa-store"></i> Novo Fornecedor';
        }
        
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    openServicoModal(servicoId = null) {
        console.log('Abrindo modal de serviço');
        const modal = document.getElementById('modal-servico');
        
        this.clearForm('servico-form');
        
        if (servicoId) {
            document.getElementById('servico-id').value = servicoId;
            document.getElementById('modal-servico-title').innerHTML = '<i class="fas fa-edit"></i> Editar Serviço';
            
            this.fetchData(`/api/servicos/${servicoId}`)
                .then(servico => {
                    document.getElementById('servico-nome').value = servico.nome || '';
                    document.getElementById('servico-categoria').value = servico.categoria || '';
                    document.getElementById('servico-descricao').value = servico.descricao || '';
                    document.getElementById('servico-custo').value = servico.custo || '0';
                    document.getElementById('servico-preco').value = servico.preco || '0';
                    document.getElementById('servico-duracao').value = servico.duracao || '1';
                    document.getElementById('servico-fornecedor').value = servico.fornecedor_id || '';
                    document.getElementById('servico-status').value = servico.status || 'ativo';
                })
                .catch(error => {
                    console.error('Erro ao carregar serviço:', error);
                    this.showToast('Erro ao carregar dados do serviço', 'error');
                });
        } else {
            document.getElementById('modal-servico-title').innerHTML = '<i class="fas fa-plus-circle"></i> Novo Serviço';
        }
        
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    openVendaModal() {
        console.log('Abrindo modal de venda');
        const modal = document.getElementById('modal-venda');
        
        // Resetar dados da venda se não estiver editando
        if (!this.editingVendaId) {
            this.resetVendaData();
        }
        
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    closeModal(modalId) {
        console.log(`Fechando modal: ${modalId}`);
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // ========== FUNÇÕES GLOBAIS ==========

    viewClient(id) {
        console.log(`Visualizando cliente ${id}`);
        this.showToast(`Visualizando cliente ${id}`, 'info');
    }

    editClient(id) {
        console.log(`Editando cliente ${id}`);
        this.openClientModal(id);
    }

    editSupplier(id) {
        console.log(`Editando fornecedor ${id}`);
        this.openSupplierModal(id);
    }

    editServico(id) {
        console.log(`Editando serviço ${id}`);
        this.openServicoModal(id);
    }

    viewVenda(id) {
        console.log(`Visualizando venda ${id}`);
        this.viewVendaDetails(id);
    }

    confirmDelete(type, id, name) {
        console.log(`Confirmando exclusão: ${type} ${id} - ${name}`);
        this.pendingDelete = { type, id, name };
        
        const confirmTitle = document.getElementById('confirm-title');
        const confirmMessage = document.getElementById('confirm-message');
        
        if (confirmTitle) confirmTitle.textContent = `Confirmar Exclusão`;
        if (confirmMessage) confirmMessage.textContent = 
            `Tem certeza que deseja excluir ${type === 'client' ? 'o cliente' : 
             type === 'supplier' ? 'o fornecedor' : 
             type === 'servico' ? 'o serviço' : 
             'a venda'} "${name}"?`;
        
        const modal = document.getElementById('modal-confirmacao');
        if (modal) modal.style.display = 'flex';
    }

    async confirmAction() {
        if (!this.pendingDelete) return;
        
        const { type, id } = this.pendingDelete;
        
        try {
            switch (type) {
                case 'client':
                    await this.fetchData(`/api/clientes/${id}`, { method: 'DELETE' });
                    this.loadClients();
                    this.showToast('Cliente excluído com sucesso!', 'success');
                    break;
                case 'supplier':
                    await this.fetchData(`/api/fornecedores/${id}`, { method: 'DELETE' });
                    this.loadSuppliers();
                    this.showToast('Fornecedor excluído com sucesso!', 'success');
                    break;
                case 'servico':
                    await this.fetchData(`/api/servicos/${id}`, { method: 'DELETE' });
                    this.loadServices();
                    this.showToast('Serviço excluído com sucesso!', 'success');
                    break;
            }
            
        } catch (error) {
            console.error('Erro ao excluir item:', error);
            this.showToast('Erro ao excluir item', 'error');
        } finally {
            this.pendingDelete = null;
        }
    }

    showToast(message, type = 'info') {
        console.log(`Toast: ${message}`);
        try {
            Toastify({
                text: message,
                duration: 3000,
                gravity: "top",
                position: "right",
                backgroundColor: type === 'success' ? '#4CD964' : 
                              type === 'error' ? '#FF3B30' : 
                              type === 'warning' ? '#FF9500' : '#5AC8FA',
                stopOnFocus: true,
                className: "toast-message",
                style: {
                    background: type === 'success' ? 'linear-gradient(135deg, #4CD964, #36D1DC)' : 
                              type === 'error' ? 'linear-gradient(135deg, #FF3B30, #FF6584)' : 
                              type === 'warning' ? 'linear-gradient(135deg, #FF9500, #FF6B35)' : 
                              'linear-gradient(135deg, #5AC8FA, #6C63FF)',
                    borderRadius: 'var(--radius)',
                    boxShadow: 'var(--shadow-lg)',
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: '500'
                }
            }).showToast();
        } catch (error) {
            console.error('Erro ao mostrar toast:', error);
        }
    }
}

// ========== INICIALIZAÇÃO GLOBAL ==========
console.log('=== CARREGANDO SISTEMA EASYSTREAM ===');

// Inicializar sistema quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM carregado - inicializando sistema...');
        window.system = new EasyStreamManager();
        window.system.init();
        
        // Expor funções globais
        window.showTab = (tab) => window.system.showTab(tab);
        window.closeModal = (modalId) => window.system.closeModal(modalId);
        window.copyLink = (inputId) => window.system.copyLink(inputId);
        window.viewClient = (id) => window.system.viewClient(id);
        window.editClient = (id) => window.system.editClient(id);
        window.editSupplier = (id) => window.system.editSupplier(id);
        window.editServico = (id) => window.system.editServico(id);
        window.viewVenda = (id) => window.system.viewVenda(id);
        window.viewVendaDetails = (id) => window.system.viewVendaDetails(id);
        window.loadVendaForEdit = (id) => window.system.loadVendaForEdit(id);
        window.deleteVenda = (id) => window.system.deleteVenda(id);
        window.confirmDelete = (type, id, name) => window.system.confirmDelete(type, id, name);
        window.updateServicoQuantity = (index, change) => window.system.updateServicoQuantity(index, change);
        window.removeServicoFromVenda = (index) => window.system.removeServicoFromVenda(index);
    });
} else {
    console.log('DOM já carregado - inicializando sistema...');
    window.system = new EasyStreamManager();
    window.system.init();
    
    window.showTab = (tab) => window.system.showTab(tab);
    window.closeModal = (modalId) => window.system.closeModal(modalId);
    window.copyLink = (inputId) => window.system.copyLink(inputId);
    window.viewClient = (id) => window.system.viewClient(id);
    window.editClient = (id) => window.system.editClient(id);
    window.editSupplier = (id) => window.system.editSupplier(id);
    window.editServico = (id) => window.system.editServico(id);
    window.viewVenda = (id) => window.system.viewVenda(id);
    window.viewVendaDetails = (id) => window.system.viewVendaDetails(id);
    window.loadVendaForEdit = (id) => window.system.loadVendaForEdit(id);
    window.deleteVenda = (id) => window.system.deleteVenda(id);
    window.confirmDelete = (type, id, name) => window.system.confirmDelete(type, id, name);
    window.updateServicoQuantity = (index, change) => window.system.updateServicoQuantity(index, change);
    window.removeServicoFromVenda = (index) => window.system.removeServicoFromVenda(index);
}

console.log('=== SISTEMA CARREGADO ===');