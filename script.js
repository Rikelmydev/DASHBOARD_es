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

        this.apiBaseUrl = window.location.origin + '/api';

        // Inicializar dados
        this.init();
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
                this.fetchData('/servicos'),
                this.fetchData('/fornecedores'),
                this.fetchData('/clientes')
            ]);

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
            const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
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

    async loadDefaultServices() {
        const servicesData = [
            // Streaming Geral
            { nome: "UFC Fight Pass 1 mês", categoria: "📺 Streaming Geral", descricao: "", duracao: 1, custo: 12.00, preco: 19.90, status: "ativo" },
            { nome: "Globoplay 1 mês", categoria: "📺 Streaming Geral", descricao: "", duracao: 1, custo: 10.00, preco: 17.90, status: "ativo" },
            { nome: "Globoplay 4K Anual", categoria: "📺 Streaming Geral", descricao: "", duracao: 12, custo: 45.00, preco: 79.90, status: "ativo" },
            // ... (todos os outros serviços da tabela)
        ];

        for (const service of servicesData) {
            await this.fetchData('/servicos', {
                method: 'POST',
                body: JSON.stringify(service)
            });
        }
    }

    setupEventListeners() {
        // Navegação
        document.getElementById('btn-novo-cliente').addEventListener('click', () => this.openClientModal());
        document.getElementById('btn-novo-fornecedor').addEventListener('click', () => this.openSupplierModal());
        document.getElementById('btn-nova-venda').addEventListener('click', () => this.openVendaModal());
        document.getElementById('btn-novo-servico').addEventListener('click', () => this.openServicoModal());

        // Filtros
        document.getElementById('search-client').addEventListener('input', (e) => this.filterClients(e.target.value));
        document.getElementById('filter-status').addEventListener('change', (e) => this.filterByStatus(e.target.value));
        document.getElementById('search-supplier').addEventListener('input', (e) => this.filterSuppliers(e.target.value));
        document.getElementById('search-service').addEventListener('input', (e) => this.filterServices(e.target.value));
        
        // Formulários
        document.getElementById('cliente-form').addEventListener('submit', (e) => this.saveClient(e));
        document.getElementById('fornecedor-form').addEventListener('submit', (e) => this.saveSupplier(e));
        document.getElementById('servico-form').addEventListener('submit', (e) => this.saveServico(e));
        document.getElementById('venda-form').addEventListener('submit', (e) => this.saveVenda(e));

        // Modal de confirmação
        document.getElementById('confirm-action-btn').addEventListener('click', () => this.confirmAction());

        // Relatórios
        document.getElementById('report-period').addEventListener('change', (e) => this.toggleCustomDateRange(e.target.value));
        document.getElementById('btn-generate-report').addEventListener('click', () => this.generateReports());

        // Exportar
        document.getElementById('btn-export-clients').addEventListener('click', () => this.exportClients());

        // Filtros de vendas
        document.getElementById('vendas-period').addEventListener('change', (e) => this.loadVendas());
        document.getElementById('vendas-status').addEventListener('change', (e) => this.loadVendas());
        document.getElementById('vendas-fornecedor').addEventListener('change', (e) => this.loadVendas());

        // Filtros de serviços
        document.getElementById('filter-category').addEventListener('change', (e) => this.loadServices());
        document.getElementById('filter-status-service').addEventListener('change', (e) => this.loadServices());

        // Filtro fornecedores
        document.getElementById('filter-supplier-status').addEventListener('change', (e) => this.loadSuppliers());

        // Venda Wizard
        document.getElementById('btn-prev-step')?.addEventListener('click', () => this.prevStep());
        document.getElementById('btn-next-step')?.addEventListener('click', () => this.nextStep());
        document.getElementById('btn-finalizar-venda')?.addEventListener('click', () => this.finalizarVenda());

        // Rating stars
        const ratingStars = document.getElementById('rating-stars');
        if (ratingStars) {
            ratingStars.addEventListener('click', (e) => {
                if (e.target.tagName === 'I' && e.target.dataset.rating) {
                    this.setRating(parseInt(e.target.dataset.rating));
                }
            });
        }

        // Busca serviços na venda
        document.getElementById('search-servico-venda')?.addEventListener('input', (e) => this.filtrarServicosModal(e.target.value));

        // Atualizar link do fornecedor
        document.getElementById('fornecedor')?.addEventListener('change', () => this.atualizarLinkFornecedor());
        document.getElementById('venda-fornecedor')?.addEventListener('change', () => this.atualizarLinkFornecedorVenda());

        // Botões de ação venda
        document.getElementById('btn-editar-venda')?.addEventListener('click', () => this.editarVenda());
        document.getElementById('btn-excluir-venda')?.addEventListener('click', () => this.excluirVenda());
    }

    updateCurrentDate() {
        const now = new Date();
        const options = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
        document.getElementById('current-date').textContent = now.toLocaleDateString('pt-BR', options).replace(',', ' -');
    }

    // Dashboard
    async loadDashboard() {
        try {
            const data = await this.fetchData('/relatorios/dashboard');
            
            // Atualizar estatísticas
            document.getElementById('faturamento-total').textContent = `R$ ${data.faturamento_total?.toFixed(2) || '0,00'}`;
            document.getElementById('lucro-total').textContent = `R$ ${data.lucro_total?.toFixed(2) || '0,00'}`;
            document.getElementById('ativos-count').textContent = data.clientes_ativos || 0;
            document.getElementById('total-clientes').textContent = data.total_clientes || 0;
            document.getElementById('vencer-count').textContent = data.renovações_proximas || 0;

            // Calcular crescimento
            const crescimentoReceita = data.faturamento_30dias > 0 ? 
                ((data.faturamento_30dias / (data.faturamento_total - data.faturamento_30dias)) * 100).toFixed(0) : 0;
            const crescimentoLucro = data.lucro_30dias > 0 ? 
                ((data.lucro_30dias / (data.lucro_total - data.lucro_30dias)) * 100).toFixed(0) : 0;

            document.getElementById('revenue-growth').textContent = `${crescimentoReceita}%`;
            document.getElementById('profit-growth').textContent = `${crescimentoLucro}%`;

            // Atualizar gráficos
            this.updateCharts(data);
            
            // Carregar últimas vendas
            await this.loadRecentSales();
            
            // Carregar renovações
            await this.loadUpcomingRenewals();
            
            // Carregar top serviços
            await this.loadTopServices();

        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
        }
    }

    async loadRecentSales() {
        try {
            const vendas = await this.fetchData('/vendas');
            const recentVendas = vendas
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 5);

            const tbody = document.getElementById('recent-sales');
            tbody.innerHTML = recentVendas.map(venda => `
                <tr>
                    <td>${venda.cliente_nome || 'Cliente'}</td>
                    <td>${venda.itens?.length || 0} serviço(s)</td>
                    <td class="text-success">R$ ${venda.total_venda?.toFixed(2) || '0,00'}</td>
                    <td>${venda.fornecedor_nome || 'N/A'}</td>
                    <td>${new Date(venda.created_at).toLocaleDateString('pt-BR')}</td>
                </tr>
            `).join('') || '<tr><td colspan="5">Nenhuma venda recente</td></tr>';
        } catch (error) {
            console.error('Erro ao carregar vendas recentes:', error);
        }
    }

    async loadUpcomingRenewals() {
        try {
            // Aqui você precisaria de uma rota específica para renovações
            const clientes = await this.fetchData('/clientes');
            
            const hoje = new Date();
            const duasSemanas = new Date(hoje.getTime() + 14 * 24 * 60 * 60 * 1000);
            let renovacoes = [];

            // Para cada cliente, buscar assinaturas
            for (const cliente of clientes) {
                const assinaturas = await this.fetchData(`/clientes/${cliente.id}`);
                if (assinaturas.assinaturas) {
                    assinaturas.assinaturas.forEach(assinatura => {
                        const vencimento = new Date(assinatura.data_vencimento);
                        if (vencimento >= hoje && vencimento <= duasSemanas) {
                            const diasRestantes = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24));
                            renovacoes.push({
                                cliente: cliente.nome,
                                servico: assinatura.servico_nome,
                                vencimento: vencimento.toLocaleDateString('pt-BR'),
                                fornecedor: assinatura.fornecedor_nome || 'N/A',
                                dias: diasRestantes
                            });
                        }
                    });
                }
            }

            renovacoes.sort((a, b) => a.dias - b.dias);
            const tbody = document.getElementById('upcoming-renewals');
            tbody.innerHTML = renovacoes.slice(0, 5).map(renovacao => `
                <tr>
                    <td>${renovacao.cliente}</td>
                    <td>${renovacao.servico}</td>
                    <td>${renovacao.vencimento}</td>
                    <td>${renovacao.fornecedor}</td>
                    <td><span class="${renovacao.dias <= 3 ? 'text-danger' : 'text-warning'}">${renovacao.dias} dias</span></td>
                </tr>
            `).join('') || '<tr><td colspan="5">Nenhuma renovação próxima</td></tr>';

        } catch (error) {
            console.error('Erro ao carregar renovações:', error);
        }
    }

    async loadTopServices() {
        try {
            const topServicos = await this.fetchData('/relatorios/top-servicos/5');
            const tbody = document.getElementById('top-services-dashboard');
            
            tbody.innerHTML = topServicos.map(servico => `
                <tr>
                    <td>${servico.nome}</td>
                    <td>${servico.categoria}</td>
                    <td>${servico.total_vendas}</td>
                    <td class="text-success">R$ ${servico.faturamento?.toFixed(2) || '0,00'}</td>
                    <td class="text-blue">R$ ${servico.lucro?.toFixed(2) || '0,00'}</td>
                </tr>
            `).join('') || '<tr><td colspan="5">Nenhum serviço vendido</td></tr>';
        } catch (error) {
            console.error('Erro ao carregar top serviços:', error);
        }
    }

    updateCharts(data) {
        // Implementação dos gráficos aqui
        console.log('Dados para gráficos:', data);
    }

    // Clientes
    async loadClients() {
        try {
            let clients = await this.fetchData('/clientes');
            
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

            // Paginação
            const startIndex = (this.currentPage - 1) * this.itemsPerPage;
            const endIndex = startIndex + this.itemsPerPage;
            const paginatedClients = clients.slice(startIndex, endIndex);

            // Renderizar tabela
            const tbody = document.getElementById('client-table-body');
            tbody.innerHTML = await Promise.all(paginatedClients.map(async cliente => {
                const assinaturas = await this.fetchData(`/clientes/${cliente.id}`);
                const totalAssinaturas = assinaturas.assinaturas?.length || 0;
                const proximoVencimento = this.getProximoVencimento(assinaturas.assinaturas);
                
                return `
                    <tr>
                        <td>
                            <strong>${cliente.nome}</strong>
                            ${cliente.email ? `<br><small>${cliente.email}</small>` : ''}
                        </td>
                        <td>
                            ${cliente.telefone || '-'}
                        </td>
                        <td>
                            ${totalAssinaturas} serviço(s)
                            ${assinaturas.assinaturas?.[0]?.servico_nome ? `<br><small>${assinaturas.assinaturas[0].servico_nome}</small>` : ''}
                        </td>
                        <td class="text-success">R$ ${cliente.total_gasto?.toFixed(2) || '0,00'}</td>
                        <td>
                            ${proximoVencimento ? proximoVencimento.data : '-'}
                            ${proximoVencimento?.dias ? `<br><small class="${proximoVencimento.dias <= 3 ? 'text-danger' : 'text-warning'}">${proximoVencimento.dias} dias</small>` : ''}
                        </td>
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
                `;
            })).then(html => html.join('')) || '<tr><td colspan="7" class="text-center">Nenhum cliente encontrado</td></tr>';

            // Atualizar paginação
            this.updatePagination(clients.length);

        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
            this.showToast('Erro ao carregar clientes', 'error');
        }
    }

    getProximoVencimento(assinaturas) {
        if (!assinaturas || assinaturas.length === 0) return null;

        const hoje = new Date();
        const vencimentos = assinaturas
            .map(a => ({
                data: new Date(a.data_vencimento),
                nome: a.servico_nome
            }))
            .filter(v => v.data >= hoje)
            .sort((a, b) => a.data - b.data);

        if (vencimentos.length === 0) return null;

        const dias = Math.ceil((vencimentos[0].data - hoje) / (1000 * 60 * 60 * 24));
        return {
            data: vencimentos[0].data.toLocaleDateString('pt-BR'),
            dias: dias
        };
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

    updatePagination(totalItems) {
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        
        document.getElementById('showing-count').textContent = 
            Math.min(totalItems, this.currentPage * this.itemsPerPage) - ((this.currentPage - 1) * this.itemsPerPage);
        document.getElementById('total-count').textContent = totalItems;
        document.getElementById('current-page').textContent = this.currentPage;
        
        const btnPrev = document.getElementById('btn-prev');
        const btnNext = document.getElementById('btn-next');
        
        if (btnPrev) btnPrev.disabled = this.currentPage === 1;
        if (btnNext) btnNext.disabled = this.currentPage === totalPages || totalPages === 0;
        
        // Adicionar event listeners para paginação
        if (btnPrev && !btnPrev.onclick) {
            btnPrev.onclick = () => this.changePage(-1);
        }
        if (btnNext && !btnNext.onclick) {
            btnNext.onclick = () => this.changePage(1);
        }
    }

    changePage(direction) {
        this.currentPage += direction;
        this.loadClients();
    }

    // Modal Cliente
    async openClientModal(clientId = null) {
        this.selectedClientId = clientId;
        const modal = document.getElementById('modal-cliente');
        
        if (clientId) {
            document.getElementById('modal-cliente-title').innerHTML = '<i class="fas fa-edit"></i> Editar Cliente';
            try {
                const client = await this.fetchData(`/clientes/${clientId}`);
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
                await this.fetchData(`/clientes/${clienteId}`, {
                    method: 'PUT',
                    body: JSON.stringify(cliente)
                });
                this.showToast('Cliente atualizado com sucesso!', 'success');
            } else {
                await this.fetchData('/clientes', {
                    method: 'POST',
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
            const suppliers = await this.fetchData('/fornecedores');
            const container = document.getElementById('suppliers-grid');
            
            // Aplicar filtro de status
            const statusFilter = document.getElementById('filter-supplier-status').value;
            const filteredSuppliers = statusFilter ? 
                suppliers.filter(s => s.status === statusFilter) : suppliers;
            
            container.innerHTML = filteredSuppliers.map(supplier => `
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

    filterSuppliers(filter) {
        // Implementação de filtro para fornecedores
        console.log('Filtrar fornecedores:', filter);
        this.loadSuppliers();
    }

    async openSupplierModal(supplierId = null) {
        this.selectedSupplierId = supplierId;
        const modal = document.getElementById('modal-fornecedor');
        
        if (supplierId) {
            document.getElementById('modal-fornecedor-title').innerHTML = '<i class="fas fa-edit"></i> Editar Fornecedor';
            try {
                const supplier = await this.fetchData(`/fornecedores/${supplierId}`);
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
                await this.fetchData(`/fornecedores/${supplierId}`, {
                    method: 'PUT',
                    body: JSON.stringify(supplier)
                });
                this.showToast('Fornecedor atualizado com sucesso!', 'success');
            } else {
                await this.fetchData('/fornecedores', {
                    method: 'POST',
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
            const servicos = await this.fetchData('/servicos');
            const container = document.getElementById('services-grid');
            
            // Aplicar filtros
            const categoriaFilter = document.getElementById('filter-category').value;
            const statusFilter = document.getElementById('filter-status-service').value;
            const searchFilter = document.getElementById('search-service').value.toLowerCase();
            
            let filteredServicos = servicos.filter(servico => {
                let pass = true;
                
                if (categoriaFilter && servico.categoria !== categoriaFilter) pass = false;
                if (statusFilter && servico.status !== statusFilter) pass = false;
                if (searchFilter && !servico.nome.toLowerCase().includes(searchFilter) && 
                    !servico.descricao?.toLowerCase().includes(searchFilter)) pass = false;
                
                return pass;
            });
            
            container.innerHTML = filteredServicos.map(servico => {
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

    filterServices(filter) {
        // O filtro já é aplicado no loadServices
        this.loadServices();
    }

    async openServicoModal(servicoId = null) {
        this.selectedServiceId = servicoId;
        const modal = document.getElementById('modal-servico');
        
        if (servicoId) {
            document.getElementById('modal-servico-title').innerHTML = '<i class="fas fa-edit"></i> Editar Serviço';
            try {
                const servico = await this.fetchData(`/servicos/${servicoId}`);
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
        
        // Carregar fornecedores para o select
        await this.loadFornecedoresForSelect('servico-fornecedor');
        
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
        document.getElementById('servico-fornecedor').value = servico.fornecedor_id || '';
    }

    async loadFornecedoresForSelect(selectId) {
        try {
            const fornecedores = await this.fetchData('/fornecedores');
            const select = document.getElementById(selectId);
            
            select.innerHTML = '<option value="">Sem fornecedor específico</option>' +
                fornecedores.map(f => `<option value="${f.id}">${f.nome}</option>`).join('');
        } catch (error) {
            console.error('Erro ao carregar fornecedores para select:', error);
        }
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
            status: document.getElementById('servico-status').value,
            fornecedor_id: document.getElementById('servico-fornecedor').value || null
        };
        
        const servicoId = document.getElementById('servico-id').value;
        
        try {
            if (servicoId) {
                await this.fetchData(`/servicos/${servicoId}`, {
                    method: 'PUT',
                    body: JSON.stringify(servico)
                });
                this.showToast('Serviço atualizado com sucesso!', 'success');
            } else {
                await this.fetchData('/servicos', {
                    method: 'POST',
                    body: JSON.stringify(servico)
                });
                this.showToast('Serviço criado com sucesso!', 'success');
            }
            
            this.closeModal('modal-servico');
            this.loadServices();
            this.loadDashboard(); // Atualizar estatísticas
        } catch (error) {
            console.error('Erro ao salvar serviço:', error);
            this.showToast('Erro ao salvar serviço', 'error');
        }
    }

    // Vendas
    async loadVendas() {
        try {
            const vendas = await this.fetchData('/vendas');
            
            // Aplicar filtros
            const periodo = document.getElementById('vendas-period').value;
            const statusFilter = document.getElementById('vendas-status').value;
            const fornecedorFilter = document.getElementById('vendas-fornecedor').value;
            
            let filteredVendas = vendas.filter(venda => {
                let pass = true;
                
                // Filtro de período
                if (periodo && periodo !== 'all') {
                    const dataVenda = new Date(venda.created_at);
                    const dataLimite = new Date();
                    dataLimite.setDate(dataLimite.getDate() - parseInt(periodo));
                    if (dataVenda < dataLimite) pass = false;
                }
                
                // Filtro de status
                if (statusFilter && venda.status !== statusFilter) pass = false;
                
                // Filtro de fornecedor
                if (fornecedorFilter && venda.fornecedor_id != fornecedorFilter) pass = false;
                
                return pass;
            });
            
            // Carregar fornecedores no select
            await this.loadFornecedoresForSelect('vendas-fornecedor');
            
            // Renderizar tabela
            const tbody = document.getElementById('sales-table-body');
            tbody.innerHTML = filteredVendas.map(venda => {
                const data = new Date(venda.created_at);
                const lucro = venda.total_lucro || venda.total_venda - venda.total_custo;
                const margem = venda.total_venda > 0 ? (lucro / venda.total_venda * 100).toFixed(1) : 0;
                
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
            
            // Calcular totais
            const totalVendas = filteredVendas.reduce((sum, v) => sum + (v.total_venda || 0), 0);
            const totalLucro = filteredVendas.reduce((sum, v) => sum + (v.total_lucro || 0), 0);
            const margemMedia = totalVendas > 0 ? (totalLucro / totalVendas * 100).toFixed(1) : 0;
            
            document.getElementById('total-vendas').textContent = `R$ ${totalVendas.toFixed(2)}`;
            document.getElementById('total-lucro-vendas').textContent = `R$ ${totalLucro.toFixed(2)}`;
            document.getElementById('margem-media-vendas').textContent = `${margemMedia}%`;

        } catch (error) {
            console.error('Erro ao carregar vendas:', error);
            this.showToast('Erro ao carregar vendas', 'error');
        }
    }

    async openVendaModal(vendaId = null) {
        this.currentStep = 1;
        this.vendaData = {
            cliente: null,
            servicos: [],
            fornecedor: null,
            totalCusto: 0,
            totalVenda: 0
        };
        
        // Resetar o formulário
        document.getElementById('venda-form').reset();
        
        // Carregar dados para os selects
        await this.loadClientesForSelect('venda-cliente');
        await this.loadFornecedoresForSelect('venda-fornecedor');
        await this.loadServicosForVenda();
        
        // Se for edição, carregar os dados da venda
        if (vendaId) {
            try {
                const venda = await this.fetchData(`/vendas/${vendaId}`);
                this.populateVendaForm(venda);
                document.getElementById('modal-venda-title').innerHTML = '<i class="fas fa-edit"></i> Editar Venda';
            } catch (error) {
                console.error('Erro ao carregar venda:', error);
                this.showToast('Erro ao carregar venda', 'error');
                return;
            }
        } else {
            document.getElementById('modal-venda-title').innerHTML = '<i class="fas fa-cart-plus"></i> Nova Venda';
        }
        
        document.getElementById('modal-venda').style.display = 'flex';
    }

    async loadClientesForSelect(selectId) {
        try {
            const clientes = await this.fetchData('/clientes');
            const select = document.getElementById(selectId);
            
            select.innerHTML = '<option value="">Selecione um cliente</option>' +
                clientes.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
        } catch (error) {
            console.error('Erro ao carregar clientes para select:', error);
        }
    }

    async loadServicosForVenda() {
        try {
            const servicos = await this.fetchData('/servicos');
            const container = document.getElementById('servicos-list-venda');
            
            container.innerHTML = servicos.map(servico => {
                const lucro = servico.preco - servico.custo;
                const margem = servico.custo > 0 ? (lucro / servico.custo * 100).toFixed(0) : 0;
                
                return `
                    <div class="service-item-modal" onclick="system.selectServiceForVenda(${servico.id})">
                        <h4>${servico.nome}</h4>
                        <div class="service-prices">
                            <span class="price-cost">Custo: R$ ${servico.custo.toFixed(2)}</span>
                            <span class="price-sale">Venda: R$ ${servico.preco.toFixed(2)}</span>
                        </div>
                        <small>${servico.categoria} • ${servico.duracao} mês(es) • Lucro: ${margem}%</small>
                    </div>
                `;
            }).join('') || '<p class="text-center">Nenhum serviço disponível</p>';

        } catch (error) {
            console.error('Erro ao carregar serviços para venda:', error);
        }
    }

    selectServiceForVenda(serviceId) {
        // Implementar seleção de serviço
        console.log('Serviço selecionado:', serviceId);
    }

    filtrarServicosModal(filtro) {
        const services = document.querySelectorAll('.service-item-modal');
        const termo = filtro.toLowerCase();
        
        services.forEach(service => {
            const nome = service.querySelector('h4').textContent.toLowerCase();
            if (nome.includes(termo) || termo === '') {
                service.style.display = 'block';
            } else {
                service.style.display = 'none';
            }
        });
    }

    populateVendaForm(venda) {
        document.getElementById('venda-id').value = venda.id;
        document.getElementById('venda-cliente').value = venda.cliente_id;
        document.getElementById('venda-fornecedor').value = venda.fornecedor_id || '';
        document.getElementById('venda-status').value = venda.status;
        document.getElementById('venda-metodo-pagamento').value = venda.metodo_pagamento || 'pix';
        document.getElementById('venda-observacoes').value = venda.observacoes || '';
        
        // Preencher serviços selecionados
        // Esta parte precisa ser implementada com mais detalhes
    }

    async saveVenda(event) {
        event.preventDefault();
        
        const venda = {
            cliente_id: document.getElementById('venda-cliente').value,
            fornecedor_id: document.getElementById('venda-fornecedor').value || null,
            total_custo: this.vendaData.totalCusto,
            total_venda: this.vendaData.totalVenda,
            total_lucro: this.vendaData.totalVenda - this.vendaData.totalCusto,
            status: document.getElementById('venda-status').value,
            metodo_pagamento: document.getElementById('venda-metodo-pagamento').value,
            observacoes: document.getElementById('venda-observacoes').value
        };
        
        const vendaId = document.getElementById('venda-id').value;
        const itens = this.vendaData.servicos.map(servico => ({
            servico_id: servico.id,
            quantidade: 1,
            custo_unitario: servico.custo,
            preco_unitario: servico.preco,
            duracao: servico.duracao
        }));
        
        try {
            if (vendaId) {
                // Atualizar venda existente
                await this.fetchData(`/vendas/${vendaId}`, {
                    method: 'PUT',
                    body: JSON.stringify(venda)
                });
                this.showToast('Venda atualizada com sucesso!', 'success');
            } else {
                // Criar nova venda
                await this.fetchData('/vendas', {
                    method: 'POST',
                    body: JSON.stringify({ venda, itens })
                });
                this.showToast('Venda criada com sucesso!', 'success');
            }
            
            this.closeModal('modal-venda');
            this.loadVendas();
            this.loadDashboard();
        } catch (error) {
            console.error('Erro ao salvar venda:', error);
            this.showToast('Erro ao salvar venda', 'error');
        }
    }

    async viewVenda(vendaId) {
        try {
            const venda = await this.fetchData(`/vendas/${vendaId}`);
            const modal = document.getElementById('modal-detalhes-venda');
            const container = document.getElementById('detalhes-venda-content');
            
            container.innerHTML = `
                <div class="venda-details">
                    <div class="detail-section">
                        <h3>Detalhes da Venda #${venda.id}</h3>
                        <div class="detail-row">
                            <span>Data:</span>
                            <strong>${new Date(venda.created_at).toLocaleDateString('pt-BR')} ${new Date(venda.created_at).toLocaleTimeString('pt-BR')}</strong>
                        </div>
                        <div class="detail-row">
                            <span>Cliente:</span>
                            <strong>${venda.cliente_nome}</strong>
                        </div>
                        <div class="detail-row">
                            <span>Fornecedor:</span>
                            <strong>${venda.fornecedor_nome || 'N/A'}</strong>
                        </div>
                        <div class="detail-row">
                            <span>Status:</span>
                            <span class="badge ${venda.status}">${venda.status}</span>
                        </div>
                        <div class="detail-row">
                            <span>Método de Pagamento:</span>
                            <strong>${venda.metodo_pagamento || 'Não informado'}</strong>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h3>Serviços</h3>
                        <div class="servicos-list">
                            ${venda.itens?.map(item => {
                                const lucro = item.preco_unitario - item.custo_unitario;
                                const margem = item.custo_unitario > 0 ? (lucro / item.custo_unitario * 100).toFixed(0) : 0;
                                return `
                                    <div class="servico-item">
                                        <strong>${item.servico_nome}</strong>
                                        <div class="servico-valores">
                                            <span>Custo: R$ ${item.custo_unitario.toFixed(2)}</span>
                                            <span>Venda: R$ ${item.preco_unitario.toFixed(2)}</span>
                                            <span class="text-success">Lucro: R$ ${lucro.toFixed(2)} (${margem}%)</span>
                                        </div>
                                    </div>
                                `;
                            }).join('') || '<p>Nenhum serviço encontrado</p>'}
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h3>Resumo Financeiro</h3>
                        <div class="resumo-financeiro">
                            <div class="total-item">
                                <span>Custo Total:</span>
                                <strong class="text-danger">R$ ${venda.total_custo?.toFixed(2) || '0,00'}</strong>
                            </div>
                            <div class="total-item">
                                <span>Valor da Venda:</span>
                                <strong class="text-success">R$ ${venda.total_venda?.toFixed(2) || '0,00'}</strong>
                            </div>
                            <div class="total-item">
                                <span>Lucro Total:</span>
                                <strong class="text-blue">R$ ${venda.total_lucro?.toFixed(2) || '0,00'}</strong>
                            </div>
                            <div class="total-item">
                                <span>Margem:</span>
                                <strong class="text-info">${venda.total_venda > 0 ? ((venda.total_lucro / venda.total_venda) * 100).toFixed(1) : 0}%</strong>
                            </div>
                        </div>
                    </div>
                    
                    ${venda.observacoes ? `
                    <div class="detail-section">
                        <h3>Observações</h3>
                        <p>${venda.observacoes}</p>
                    </div>
                    ` : ''}
                </div>
            `;
            
            // Configurar botões de ação
            document.getElementById('btn-editar-venda').onclick = () => {
                this.closeModal('modal-detalhes-venda');
                this.openVendaModal(vendaId);
            };
            
            document.getElementById('btn-excluir-venda').onclick = () => {
                this.confirmDelete('venda', vendaId, `Venda #${vendaId}`);
                this.closeModal('modal-detalhes-venda');
            };
            
            modal.style.display = 'flex';
        } catch (error) {
            console.error('Erro ao carregar detalhes da venda:', error);
            this.showToast('Erro ao carregar detalhes da venda', 'error');
        }
    }

    // Confirmação de exclusão
    confirmDelete(type, id, name) {
        this.pendingDelete = { type, id, name };
        
        document.getElementById('confirm-title').textContent = `Confirmar Exclusão`;
        document.getElementById('confirm-message').textContent = 
            `Tem certeza que deseja excluir ${type === 'client' ? 'o cliente' : 
             type === 'supplier' ? 'o fornecedor' : 
             type === 'servico' ? 'o serviço' : 
             'a venda'} "${name}"? Esta ação não pode ser desfeita.`;
        
        this.openModal('modal-confirmacao');
    }

    async confirmAction() {
        if (!this.pendingDelete) return;
        
        const { type, id } = this.pendingDelete;
        
        try {
            switch (type) {
                case 'client':
                    await this.fetchData(`/clientes/${id}`, { method: 'DELETE' });
                    this.loadClients();
                    break;
                case 'supplier':
                    await this.fetchData(`/fornecedores/${id}`, { method: 'DELETE' });
                    this.loadSuppliers();
                    break;
                case 'servico':
                    await this.fetchData(`/servicos/${id}`, { method: 'DELETE' });
                    this.loadServices();
                    break;
                case 'venda':
                    await this.fetchData(`/vendas/${id}`, { method: 'DELETE' });
                    this.loadVendas();
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

    // Visualizar cliente
    async viewClient(id) {
        try {
            const cliente = await this.fetchData(`/clientes/${id}`);
            const modal = document.getElementById('modal-detalhes-venda'); // Reutilizando modal
            const container = document.getElementById('detalhes-venda-content');
            
            let assinaturasHtml = '';
            if (cliente.assinaturas && cliente.assinaturas.length > 0) {
                assinaturasHtml = `
                    <div class="detail-section">
                        <h3>Assinaturas (${cliente.assinaturas.length})</h3>
                        <div class="assinaturas-list">
                            ${cliente.assinaturas.map((a, index) => {
                                const dataCompra = new Date(a.data_compra);
                                const dataVencimento = new Date(a.data_vencimento);
                                const hoje = new Date();
                                const diasRestantes = Math.ceil((dataVencimento - hoje) / (1000 * 60 * 60 * 24));
                                const statusClass = diasRestantes <= 0 ? 'text-danger' : diasRestantes <= 7 ? 'text-warning' : 'text-success';
                                
                                return `
                                    <div class="assinatura-item">
                                        <strong>${a.servico_nome}</strong>
                                        <div class="assinatura-info">
                                            <span>Compra: ${dataCompra.toLocaleDateString('pt-BR')}</span>
                                            <span>Vencimento: ${dataVencimento.toLocaleDateString('pt-BR')}</span>
                                            <span class="${statusClass}">${diasRestantes <= 0 ? 'Vencido' : `${diasRestantes} dias restantes`}</span>
                                        </div>
                                        <div class="assinatura-valores">
                                            <span>Custo: R$ ${a.custo.toFixed(2)}</span>
                                            <span>Venda: R$ ${a.preco.toFixed(2)}</span>
                                            <span class="text-success">Lucro: R$ ${(a.preco - a.custo).toFixed(2)}</span>
                                        </div>
                                        <small>Fornecedor: ${a.fornecedor_nome || 'N/A'}</small>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }
            
            container.innerHTML = `
                <div class="client-details">
                    <div class="detail-section">
                        <h3>Informações do Cliente</h3>
                        <div class="detail-row">
                            <span>Nome:</span>
                            <strong>${cliente.nome}</strong>
                        </div>
                        <div class="detail-row">
                            <span>Telefone:</span>
                            <strong>${cliente.telefone || 'Não informado'}</strong>
                        </div>
                        <div class="detail-row">
                            <span>E-mail:</span>
                            <strong>${cliente.email || 'Não informado'}</strong>
                        </div>
                        <div class="detail-row">
                            <span>Status:</span>
                            <span class="badge ${cliente.status}">${cliente.status}</span>
                        </div>
                        <div class="detail-row">
                            <span>Total Gasto:</span>
                            <strong class="text-success">R$ ${cliente.total_gasto?.toFixed(2) || '0,00'}</strong>
                        </div>
                    </div>
                    
                    ${assinaturasHtml}
                    
                    ${cliente.observacoes ? `
                    <div class="detail-section">
                        <h3>Observações</h3>
                        <p>${cliente.observacoes}</p>
                    </div>
                    ` : ''}
                </div>
            `;
            
            // Configurar botões do modal
            document.getElementById('btn-editar-venda').style.display = 'none';
            document.getElementById('btn-excluir-venda').style.display = 'none';
            
            modal.style.display = 'flex';
        } catch (error) {
            console.error('Erro ao carregar detalhes do cliente:', error);
            this.showToast('Erro ao carregar detalhes do cliente', 'error');
        }
    }

    // Funções auxiliares
    toggleCustomDateRange(value) {
        const container = document.getElementById('custom-date-range');
        container.style.display = value === 'custom' ? 'block' : 'none';
    }

    async generateReports() {
        try {
            // Implementar geração de relatórios
            this.showToast('Relatório gerado com sucesso!', 'info');
        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
            this.showToast('Erro ao gerar relatório', 'error');
        }
    }

    exportClients() {
        // Implementar exportação de clientes
        this.showToast('Exportação em desenvolvimento', 'info');
    }

    atualizarLinkFornecedor() {
        // Implementar atualização de link do fornecedor
        console.log('Atualizar link do fornecedor');
    }

    atualizarLinkFornecedorVenda() {
        // Implementar atualização de link do fornecedor na venda
        console.log('Atualizar link do fornecedor na venda');
    }

    showToast(message, type = 'info') {
        Toastify({
            text: message,
            duration: 3000,
            gravity: "top",
            position: "right",
            backgroundColor: type === 'success' ? '#10b981' : 
                           type === 'error' ? '#ef4444' : 
                           type === 'warning' ? '#f59e0b' : '#3b82f6',
            stopOnFocus: true
        }).showToast();
    }

    openModal(modalId) {
        document.getElementById(modalId).style.display = 'flex';
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    updateUI() {
        this.loadClients();
        this.loadSuppliers();
        this.loadServices();
        this.loadVendas();
        this.loadDashboard();
    }

    // Navegação entre abas
    showTab(tab) {
        // Esconder todas as abas
        document.querySelectorAll('.tab-content').forEach(t => {
            t.classList.remove('active');
        });
        
        // Remover active de todos os botões
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Mostrar aba selecionada
        document.getElementById(`tab-${tab}`).classList.add('active');
        document.getElementById(`btn-tab-${tab}`).classList.add('active');
        
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

    // Funções para uso global
    editClient(id) {
        this.openClientModal(id);
    }

    editSupplier(id) {
        this.openSupplierModal(id);
    }

    editServico(id) {
        this.openServicoModal(id);
    }

    cadastrarClienteRapido() {
        const nome = prompt('Nome do cliente:');
        const telefone = prompt('Telefone/WhatsApp:');
        
        if (nome && telefone) {
            const cliente = {
                nome: nome,
                telefone: telefone,
                status: 'ativo'
            };
            
            this.fetchData('/clientes', {
                method: 'POST',
                body: JSON.stringify(cliente)
            }).then(() => {
                this.showToast('Cliente cadastrado com sucesso!', 'success');
                this.loadClients();
                this.loadClientesForSelect('venda-cliente');
            }).catch(error => {
                console.error('Erro ao cadastrar cliente:', error);
                this.showToast('Erro ao cadastrar cliente', 'error');
            });
        }
    }

    gerarTabelaPrecos() {
        window.print();
    }
}

// Inicializar sistema
const system = new GGMAXManager();

// Funções globais para uso no HTML
function showTab(tab) {
    system.showTab(tab);
}

function closeModal(modalId) {
    system.closeModal(modalId);
}

function filtrarServicosModal(filtro) {
    system.filtrarServicosModal(filtro);
}

function gerarTabelaPrecos() {
    system.gerarTabelaPrecos();
}

function cadastrarClienteRapido() {
    system.cadastrarClienteRapido();
}

function atualizarLinkFornecedor() {
    system.atualizarLinkFornecedor();
}

// Expor sistema globalmente para acesso via HTML
window.system = system;