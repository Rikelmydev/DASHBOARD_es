// Sistema GGMAX Manager - Versão com API
class GGMAXManager {
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
            totalVenda: 0
        };

        this.apiBaseUrl = ''; // Caminho relativo
    }

    async init() {
        try {
            await this.loadInitialData();
            this.setupEventListeners();
            this.updateCurrentDate();
            this.loadDashboard();
            this.updateUI();
            
            // Atualizar data periodicamente
            setInterval(() => this.updateCurrentDate(), 60000);
        } catch (error) {
            console.error('Erro na inicialização:', error);
            this.showToast('Erro ao carregar dados. Verifique a conexão com o servidor.', 'error');
        }
    }

    async loadInitialData() {
        try {
            // Verificar se já existem dados
            const [servicos, fornecedores, clientes] = await Promise.all([
                this.fetchData('/api/servicos'),
                this.fetchData('/api/fornecedores'),
                this.fetchData('/api/clientes')
            ]);

            console.log('Dados carregados:', { servicos, fornecedores, clientes });

            if (servicos.length === 0) {
                // Carregar dados iniciais da tabela fornecida
                await this.loadDefaultServices();
            }
        } catch (error) {
            console.error('Erro ao carregar dados iniciais:', error);
        }
    }

    async fetchData(endpoint, options = {}) {
        try {
            console.log('Fazendo requisição para:', endpoint);
            
            const response = await fetch(endpoint, {
                headers: {
                    'Content-Type': 'application/json',
                },
                ...options
            });

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
        console.log('Configurando event listeners...');
        
        // Botões de navegação
        const dashboardBtn = document.getElementById('btn-tab-dashboard');
        const clientesBtn = document.getElementById('btn-tab-clientes');
        const fornecedoresBtn = document.getElementById('btn-tab-fornecedores');
        const servicosBtn = document.getElementById('btn-tab-servicos');
        const vendasBtn = document.getElementById('btn-tab-vendas');
        const relatoriosBtn = document.getElementById('btn-tab-relatorios');
        
        if (dashboardBtn) dashboardBtn.addEventListener('click', () => this.showTab('dashboard'));
        if (clientesBtn) clientesBtn.addEventListener('click', () => this.showTab('clientes'));
        if (fornecedoresBtn) fornecedoresBtn.addEventListener('click', () => this.showTab('fornecedores'));
        if (servicosBtn) servicosBtn.addEventListener('click', () => this.showTab('servicos'));
        if (vendasBtn) vendasBtn.addEventListener('click', () => this.showTab('vendas'));
        if (relatoriosBtn) relatoriosBtn.addEventListener('click', () => this.showTab('relatorios'));
        
        // Botões de ação
        const novoClienteBtn = document.getElementById('btn-novo-cliente');
        const novoFornecedorBtn = document.getElementById('btn-novo-fornecedor');
        const novaVendaBtn = document.getElementById('btn-nova-venda');
        const novoServicoBtn = document.getElementById('btn-novo-servico');
        
        if (novoClienteBtn) novoClienteBtn.addEventListener('click', () => this.openClientModal());
        if (novoFornecedorBtn) novoFornecedorBtn.addEventListener('click', () => this.openSupplierModal());
        if (novaVendaBtn) novaVendaBtn.addEventListener('click', () => this.openVendaModal());
        if (novoServicoBtn) novoServicoBtn.addEventListener('click', () => this.openServicoModal());

        // Filtros
        const searchClient = document.getElementById('search-client');
        const filterStatus = document.getElementById('filter-status');
        
        if (searchClient) searchClient.addEventListener('input', (e) => this.filterClients(e.target.value));
        if (filterStatus) filterStatus.addEventListener('change', (e) => this.filterByStatus(e.target.value));
        
        // Formulários
        const clienteForm = document.getElementById('cliente-form');
        const fornecedorForm = document.getElementById('fornecedor-form');
        const servicoForm = document.getElementById('servico-form');
        
        if (clienteForm) clienteForm.addEventListener('submit', (e) => this.saveClient(e));
        if (fornecedorForm) fornecedorForm.addEventListener('submit', (e) => this.saveSupplier(e));
        if (servicoForm) servicoForm.addEventListener('submit', (e) => this.saveServico(e));

        // Modal de confirmação
        const confirmBtn = document.getElementById('confirm-action-btn');
        if (confirmBtn) confirmBtn.addEventListener('click', () => this.confirmAction());

        // Botões de fechar modais
        const closeButtons = [
            { id: 'close-modal-cliente', modal: 'modal-cliente' },
            { id: 'close-modal-servico', modal: 'modal-servico' },
            { id: 'close-modal-fornecedor', modal: 'modal-fornecedor' },
            { id: 'close-modal-venda', modal: 'modal-venda' },
            { id: 'close-modal-detalhes-venda', modal: 'modal-detalhes-venda' },
            { id: 'close-modal-confirmacao', modal: 'modal-confirmacao' },
            { id: 'cancel-modal-cliente', modal: 'modal-cliente' },
            { id: 'cancel-modal-servico', modal: 'modal-servico' },
            { id: 'cancel-modal-fornecedor', modal: 'modal-fornecedor' },
            { id: 'cancel-modal-venda', modal: 'modal-venda' },
            { id: 'cancel-modal-confirmacao', modal: 'modal-confirmacao' },
            { id: 'close-btn-modal-detalhes-venda', modal: 'modal-detalhes-venda' }
        ];
        
        closeButtons.forEach(btn => {
            const element = document.getElementById(btn.id);
            if (element) {
                element.addEventListener('click', () => this.closeModal(btn.modal));
            }
        });

        // Rating stars
        const ratingStars = document.getElementById('rating-stars');
        if (ratingStars) {
            ratingStars.addEventListener('click', (e) => {
                if (e.target.tagName === 'I' && e.target.dataset.rating) {
                    this.setRating(parseInt(e.target.dataset.rating));
                }
            });
        }
        
        console.log('Event listeners configurados');
    }

    updateCurrentDate() {
        const now = new Date();
        const options = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
        const dateElement = document.getElementById('current-date');
        if (dateElement) {
            dateElement.textContent = now.toLocaleDateString('pt-BR', options).replace(',', ' -');
        }
    }

    // Navegação entre abas
    showTab(tab) {
        console.log('Mostrando aba:', tab);
        
        // Esconder todas as abas
        document.querySelectorAll('.tab-content').forEach(t => {
            t.classList.remove('active');
        });
        
        // Remover active de todos os botões
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Mostrar aba selecionada
        const tabContent = document.getElementById(`tab-${tab}`);
        const tabButton = document.getElementById(`btn-tab-${tab}`);
        
        if (tabContent) tabContent.classList.add('active');
        if (tabButton) tabButton.classList.add('active');
        
        // Atualizar conteúdo específico da aba
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
                this.generateReports();
                break;
        }
    }

    async loadDashboard() {
        try {
            const data = await this.fetchData('/api/relatorios/dashboard');
            
            // Atualizar estatísticas
            const faturamentoTotal = document.getElementById('faturamento-total');
            const lucroTotal = document.getElementById('lucro-total');
            const ativosCount = document.getElementById('ativos-count');
            const totalClientes = document.getElementById('total-clientes');
            const vencerCount = document.getElementById('vencer-count');
            
            if (faturamentoTotal) {
                faturamentoTotal.textContent = `R$ ${data.faturamento_total?.toFixed(2) || '0,00'}`;
            }
            if (lucroTotal) {
                lucroTotal.textContent = `R$ ${data.lucro_total?.toFixed(2) || '0,00'}`;
            }
            if (ativosCount) {
                ativosCount.textContent = data.clientes_ativos || 0;
            }
            if (totalClientes) {
                totalClientes.textContent = data.total_clientes || 0;
            }
            if (vencerCount) {
                vencerCount.textContent = data.renovações_proximas || 0;
            }

            // Carregar top serviços
            await this.loadTopServices();

        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
        }
    }

    async loadClients() {
        try {
            let clients = await this.fetchData('/api/clientes');
            
            // Aplicar filtros locais
            if (this.currentFilter) {
                const filter = this.currentFilter.toLowerCase();
                clients = clients.filter(client => 
                    client.nome.toLowerCase().includes(filter) ||
                    client.email?.toLowerCase().includes(filter) ||
                    client.telefone?.toLowerCase().includes(filter)
                );
            }

            if (this.currentStatus) {
                clients = clients.filter(client => client.status === this.currentStatus);
            }

            // Renderizar tabela
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
                        <td class="text-success">R$ ${cliente.total_gasto?.toFixed(2) || '0,00'}</td>
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
                `).join('') || '<tr><td colspan="7" class="text-center">Nenhum cliente encontrado</td></tr>';
            }

        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
            this.showToast('Erro ao carregar clientes', 'error');
        }
    }

    filterClients(filter) {
        this.currentFilter = filter;
        this.currentPage = 1;
        this.loadClients();
    }

    filterByStatus(status) {
        this.currentStatus = status;
        this.currentPage = 1;
        this.loadClients();
    }

    // Modal Cliente
    async openClientModal(clientId = null) {
        this.selectedClientId = clientId;
        const modal = document.getElementById('modal-cliente');
        
        if (clientId) {
            document.getElementById('modal-cliente-title').innerHTML = '<i class="fas fa-edit"></i> Editar Cliente';
            try {
                const client = await this.fetchData(`/api/clientes/${clientId}`);
                this.populateClientForm(client);
            } catch (error) {
                console.error('Erro ao carregar cliente:', error);
                this.showToast('Erro ao carregar cliente', 'error');
                return;
            }
        } else {
            document.getElementById('modal-cliente-title').innerHTML = '<i class="fas fa-user-plus"></i> Novo Cliente';
            document.getElementById('cliente-form').reset();
        }
        
        modal.style.display = 'flex';
    }

    populateClientForm(client) {
        document.getElementById('cliente-id').value = client.id || '';
        document.getElementById('cliente-nome').value = client.nome || '';
        document.getElementById('cliente-email').value = client.email || '';
        document.getElementById('cliente-telefone').value = client.telefone || '';
        document.getElementById('cliente-status').value = client.status || 'ativo';
        document.getElementById('cliente-observacoes').value = client.observacoes || '';
    }

    async saveClient(event) {
        event.preventDefault();
        
        const clienteId = document.getElementById('cliente-id').value;
        const cliente = {
            nome: document.getElementById('cliente-nome').value,
            email: document.getElementById('cliente-email').value,
            telefone: document.getElementById('cliente-telefone').value,
            status: document.getElementById('cliente-status').value,
            observacoes: document.getElementById('cliente-observacoes').value
        };
        
        try {
            if (clienteId) {
                await this.fetchData(`/api/clientes/${clienteId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(cliente)
                });
                this.showToast('Cliente atualizado com sucesso!', 'success');
            } else {
                await this.fetchData('/api/clientes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(cliente)
                });
                this.showToast('Cliente criado com sucesso!', 'success');
            }
            
            this.closeModal('modal-cliente');
            this.loadClients();
            this.loadDashboard();
        } catch (error) {
            console.error('Erro ao salvar cliente:', error);
            this.showToast('Erro ao salvar cliente', 'error');
        }
    }

    // Fornecedores
    async loadSuppliers() {
        try {
            const suppliers = await this.fetchData('/api/fornecedores');
            const container = document.getElementById('suppliers-grid');
            
            if (!container) return;
            
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
                            <span class="stat-value">${supplier.avaliacao?.toFixed(1) || '3.0'}</span>
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
            `).join('') || '<p class="text-center">Nenhum fornecedor cadastrado</p>';

        } catch (error) {
            console.error('Erro ao carregar fornecedores:', error);
            this.showToast('Erro ao carregar fornecedores', 'error');
        }
    }

    async openSupplierModal(supplierId = null) {
        this.selectedSupplierId = supplierId;
        const modal = document.getElementById('modal-fornecedor');
        
        if (supplierId) {
            document.getElementById('modal-fornecedor-title').innerHTML = '<i class="fas fa-edit"></i> Editar Fornecedor';
            try {
                const supplier = await this.fetchData(`/api/fornecedores/${supplierId}`);
                this.populateSupplierForm(supplier);
            } catch (error) {
                console.error('Erro ao carregar fornecedor:', error);
                this.showToast('Erro ao carregar fornecedor', 'error');
                return;
            }
        } else {
            document.getElementById('modal-fornecedor-title').innerHTML = '<i class="fas fa-store"></i> Novo Fornecedor';
            document.getElementById('fornecedor-form').reset();
            document.getElementById('fornecedor-avaliacao').value = '3';
            this.updateStars(3);
        }
        
        modal.style.display = 'flex';
    }

    populateSupplierForm(supplier) {
        document.getElementById('fornecedor-id').value = supplier.id || '';
        document.getElementById('fornecedor-nome').value = supplier.nome || '';
        document.getElementById('fornecedor-status').value = supplier.status || 'ativo';
        document.getElementById('fornecedor-contato').value = supplier.contato || '';
        document.getElementById('fornecedor-tipo-contato').value = supplier.tipo_contato || 'telegram';
        document.getElementById('fornecedor-avaliacao').value = supplier.avaliacao || '3';
        document.getElementById('fornecedor-observacoes').value = supplier.observacoes || '';
        
        this.updateStars(supplier.avaliacao || 3);
    }

    setRating(rating) {
        document.getElementById('fornecedor-avaliacao').value = rating;
        this.updateStars(rating);
    }

    updateStars(rating) {
        const stars = document.querySelectorAll('#rating-stars i');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
                star.classList.remove('far');
                star.classList.add('fas');
            } else {
                star.classList.remove('active');
                star.classList.add('far');
                star.classList.remove('fas');
            }
        });
    }

    async saveSupplier(event) {
        event.preventDefault();
        
        const supplier = {
            nome: document.getElementById('fornecedor-nome').value,
            contato: document.getElementById('fornecedor-contato').value,
            tipo_contato: document.getElementById('fornecedor-tipo-contato').value,
            avaliacao: parseFloat(document.getElementById('fornecedor-avaliacao').value),
            status: document.getElementById('fornecedor-status').value,
            observacoes: document.getElementById('fornecedor-observacoes').value
        };
        
        const supplierId = document.getElementById('fornecedor-id').value;
        
        try {
            if (supplierId) {
                await this.fetchData(`/api/fornecedores/${supplierId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(supplier)
                });
                this.showToast('Fornecedor atualizado com sucesso!', 'success');
            } else {
                await this.fetchData('/api/fornecedores', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(supplier)
                });
                this.showToast('Fornecedor criado com sucesso!', 'success');
            }
            
            this.closeModal('modal-fornecedor');
            this.loadSuppliers();
        } catch (error) {
            console.error('Erro ao salvar fornecedor:', error);
            this.showToast('Erro ao salvar fornecedor', 'error');
        }
    }

    // Serviços
    async loadServices() {
        try {
            const servicos = await this.fetchData('/api/servicos');
            const container = document.getElementById('services-grid');
            
            if (!container) return;
            
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
            }).join('') || '<p class="text-center">Nenhum serviço encontrado</p>';

        } catch (error) {
            console.error('Erro ao carregar serviços:', error);
            this.showToast('Erro ao carregar serviços', 'error');
        }
    }

    async openServicoModal(servicoId = null) {
        this.selectedServiceId = servicoId;
        const modal = document.getElementById('modal-servico');
        
        if (servicoId) {
            document.getElementById('modal-servico-title').innerHTML = '<i class="fas fa-edit"></i> Editar Serviço';
            try {
                const servico = await this.fetchData(`/api/servicos/${servicoId}`);
                this.populateServicoForm(servico);
            } catch (error) {
                console.error('Erro ao carregar serviço:', error);
                this.showToast('Erro ao carregar serviço', 'error');
                return;
            }
        } else {
            document.getElementById('modal-servico-title').innerHTML = '<i class="fas fa-plus-circle"></i> Novo Serviço';
            document.getElementById('servico-form').reset();
        }
        
        modal.style.display = 'flex';
    }

    populateServicoForm(servico) {
        document.getElementById('servico-id').value = servico.id || '';
        document.getElementById('servico-nome').value = servico.nome || '';
        document.getElementById('servico-categoria').value = servico.categoria || '';
        document.getElementById('servico-descricao').value = servico.descricao || '';
        document.getElementById('servico-custo').value = servico.custo || '';
        document.getElementById('servico-preco').value = servico.preco || '';
        document.getElementById('servico-duracao').value = servico.duracao || '1';
        document.getElementById('servico-status').value = servico.status || 'ativo';
    }

    async saveServico(event) {
        event.preventDefault();
        
        const servico = {
            nome: document.getElementById('servico-nome').value,
            categoria: document.getElementById('servico-categoria').value,
            descricao: document.getElementById('servico-descricao').value,
            custo: parseFloat(document.getElementById('servico-custo').value),
            preco: parseFloat(document.getElementById('servico-preco').value),
            duracao: parseInt(document.getElementById('servico-duracao').value),
            status: document.getElementById('servico-status').value
        };
        
        const servicoId = document.getElementById('servico-id').value;
        
        try {
            if (servicoId) {
                await this.fetchData(`/api/servicos/${servicoId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(servico)
                });
                this.showToast('Serviço atualizado com sucesso!', 'success');
            } else {
                await this.fetchData('/api/servicos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(servico)
                });
                this.showToast('Serviço criado com sucesso!', 'success');
            }
            
            this.closeModal('modal-servico');
            this.loadServices();
            this.loadDashboard();
        } catch (error) {
            console.error('Erro ao salvar serviço:', error);
            this.showToast('Erro ao salvar serviço', 'error');
        }
    }

    async loadVendas() {
        try {
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
                            <td class="text-danger">R$ ${venda.total_custo?.toFixed(2) || '0,00'}</td>
                            <td class="text-success">R$ ${venda.total_venda?.toFixed(2) || '0,00'}</td>
                            <td class="text-blue">R$ ${lucro.toFixed(2)}</td>
                            <td><span class="badge ${venda.status}">${venda.status}</span></td>
                            <td>
                                <button class="action-btn view" onclick="system.viewVenda(${venda.id})" title="Visualizar">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('') || '<tr><td colspan="9" class="text-center">Nenhuma venda registrada</td></tr>';
            }
            
        } catch (error) {
            console.error('Erro ao carregar vendas:', error);
            this.showToast('Erro ao carregar vendas', 'error');
        }
    }

    async openVendaModal() {
        console.log('Abrindo modal de venda');
        document.getElementById('modal-venda').style.display = 'flex';
    }

    async loadTopServices() {
        try {
            const topServicos = await this.fetchData('/api/relatorios/top-servicos/5');
            const tbody = document.getElementById('top-services-dashboard');
            
            if (tbody) {
                tbody.innerHTML = topServicos.map(servico => `
                    <tr>
                        <td>${servico.nome}</td>
                        <td>${servico.categoria}</td>
                        <td>${servico.total_vendas}</td>
                        <td class="text-success">R$ ${servico.faturamento?.toFixed(2) || '0,00'}</td>
                        <td class="text-blue">R$ ${servico.lucro?.toFixed(2) || '0,00'}</td>
                    </tr>
                `).join('') || '<tr><td colspan="5">Nenhum serviço vendido</td></tr>';
            }
        } catch (error) {
            console.error('Erro ao carregar top serviços:', error);
        }
    }

    async generateReports() {
        try {
            this.showToast('Relatório gerado com sucesso!', 'info');
        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
            this.showToast('Erro ao gerar relatório', 'error');
        }
    }

    // Confirmação de exclusão
    confirmDelete(type, id, name) {
        this.pendingDelete = { type, id, name };
        
        const confirmTitle = document.getElementById('confirm-title');
        const confirmMessage = document.getElementById('confirm-message');
        
        if (confirmTitle) {
            confirmTitle.textContent = `Confirmar Exclusão`;
        }
        
        if (confirmMessage) {
            confirmMessage.textContent = 
                `Tem certeza que deseja excluir ${type === 'client' ? 'o cliente' : 
                 type === 'supplier' ? 'o fornecedor' : 
                 type === 'servico' ? 'o serviço' : 
                 'a venda'} "${name}"? Esta ação não pode ser desfeita.`;
        }
        
        document.getElementById('modal-confirmacao').style.display = 'flex';
    }

    async confirmAction() {
        if (!this.pendingDelete) return;
        
        const { type, id } = this.pendingDelete;
        
        try {
            switch (type) {
                case 'client':
                    await this.fetchData(`/api/clientes/${id}`, { method: 'DELETE' });
                    this.loadClients();
                    break;
                case 'supplier':
                    await this.fetchData(`/api/fornecedores/${id}`, { method: 'DELETE' });
                    this.loadSuppliers();
                    break;
                case 'servico':
                    await this.fetchData(`/api/servicos/${id}`, { method: 'DELETE' });
                    this.loadServices();
                    break;
            }
            
            this.loadDashboard();
            this.showToast('Item excluído com sucesso!', 'warning');
        } catch (error) {
            console.error('Erro ao excluir item:', error);
            this.showToast('Erro ao excluir item', 'error');
        } finally {
            this.closeModal('modal-confirmacao');
            this.pendingDelete = null;
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    updateUI() {
        this.loadClients();
        this.loadSuppliers();
        this.loadServices();
        this.loadVendas();
        this.loadDashboard();
    }

    showToast(message, type = 'info') {
        try {
            Toastify({
                text: message,
                duration: 3000,
                gravity: "top",
                position: "right",
                style: {
                    background: type === 'success' ? '#10b981' : 
                              type === 'error' ? '#ef4444' : 
                              type === 'warning' ? '#f59e0b' : '#3b82f6',
                },
                stopOnFocus: true
            }).showToast();
        } catch (error) {
            console.error('Erro ao mostrar toast:', error);
        }
    }

    // Funções para uso global
    viewClient(id) {
        console.log('Visualizando cliente:', id);
        this.showToast(`Visualizando cliente ${id}`, 'info');
    }

    editClient(id) {
        this.openClientModal(id);
    }

    editSupplier(id) {
        this.openSupplierModal(id);
    }

    editServico(id) {
        this.openServicoModal(id);
    }

    viewVenda(id) {
        console.log('Visualizando venda:', id);
        this.showToast(`Visualizando venda ${id}`, 'info');
    }
}

// Inicializar sistema quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado, inicializando sistema...');
    window.system = new GGMAXManager();
    window.system.init();
    
    // Expor funções globais
    window.showTab = (tab) => window.system.showTab(tab);
    window.closeModal = (modalId) => window.system.closeModal(modalId);
});