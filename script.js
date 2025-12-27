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

        // Remova esta linha:
        // this.apiBaseUrl = window.location.origin + '/api';
        
        // Use caminhos relativos para a API
        this.apiBaseUrl = ''; // Caminho relativo

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

    async loadDefaultServices() {
        const servicesData = [
            // Streaming Geral
            { nome: "UFC Fight Pass 1 mês", categoria: "📺 Streaming Geral", descricao: "", duracao: 1, custo: 12.00, preco: 19.90, status: "ativo" },
            { nome: "Globoplay 1 mês", categoria: "📺 Streaming Geral", descricao: "", duracao: 1, custo: 10.00, preco: 17.90, status: "ativo" },
            { nome: "Globoplay 4K Anual", categoria: "📺 Streaming Geral", descricao: "", duracao: 12, custo: 45.00, preco: 79.90, status: "ativo" },
            { nome: "Netflix Premium 1 mês", categoria: "📺 Streaming Geral", descricao: "Plano Premium 4K sem anúncios", duracao: 1, custo: 15.90, preco: 29.90, status: "ativo" },
            { nome: "Disney+ Premium 1 mês", categoria: "📺 Streaming Geral", descricao: "Acesso completo à plataforma", duracao: 1, custo: 12.90, preco: 24.90, status: "ativo" },
            { nome: "HBO Max 1 mês", categoria: "📺 Streaming Geral", descricao: "Catálogo completo HBO", duracao: 1, custo: 10.00, preco: 19.90, status: "ativo" },
            { nome: "Prime Video 1 mês", categoria: "📺 Streaming Geral", descricao: "Amazon Prime Video", duracao: 1, custo: 10.00, preco: 14.90, status: "ativo" },
            { nome: "Star+ 1 mês", categoria: "📺 Streaming Geral", descricao: "Filmes e séries, conteúdo exclusivo", duracao: 1, custo: 16.36, preco: 29.90, status: "ativo" },
            { nome: "PlayPlus 1 mês", categoria: "📺 Streaming Geral", descricao: "Catálogo variado de streaming", duracao: 1, custo: 7.56, preco: 14.90, status: "ativo" },
            { nome: "Hulu 1 mês", categoria: "📺 Streaming Geral", descricao: "Catálogo completo, séries exclusivas", duracao: 1, custo: 26.76, preco: 39.90, status: "ativo" },
            { nome: "ESPN 1 mês", categoria: "⚽ Esportes", descricao: "Eventos esportivos ao vivo", duracao: 1, custo: 26.76, preco: 39.90, status: "ativo" },
            { nome: "TNT Sports 1 mês", categoria: "⚽ Esportes", descricao: "Eventos esportivos, transmissões exclusivas", duracao: 1, custo: 17.96, preco: 29.90, status: "ativo" },
            { nome: "Apple TV+ 1 mês", categoria: "📺 Streaming Geral", descricao: "Conteúdo Apple Original", duracao: 1, custo: 11.96, preco: 19.90, status: "ativo" },
            { nome: "Viki 1 mês", categoria: "📺 Streaming Geral", descricao: "Dramas asiáticos, legendas em português", duracao: 1, custo: 10.40, preco: 17.90, status: "ativo" },
            { nome: "ChatGPT Plus", categoria: "🤖 IA", descricao: "Acesso ao ChatGPT 4", duracao: 1, custo: 8.00, preco: 19.90, status: "ativo" },
            { nome: "Spotify Premium 1 mês", categoria: "🎵 Streaming Música", descricao: "Música sem anúncios e download", duracao: 1, custo: 10.90, preco: 19.90, status: "ativo" },
            { nome: "YouTube Music 1 mês", categoria: "🎵 Streaming Música", descricao: "Música e vídeos sem anúncios", duracao: 1, custo: 10.00, preco: 14.90, status: "ativo" },
            { nome: "Game Pass Ultimate 1 mês", categoria: "🎮 Games", descricao: "Xbox Game Pass Ultimate", duracao: 1, custo: 45.90, preco: 69.90, status: "ativo" },
            { nome: "PS Plus Deluxe 1 mês", categoria: "🎮 Games", descricao: "PlayStation Plus Deluxe", duracao: 1, custo: 37.90, preco: 49.90, status: "ativo" },
            { nome: "Canva Pro 1 mês", categoria: "🛠️ Ferramentas", descricao: "Canva Pro completo", duracao: 1, custo: 14.50, preco: 24.90, status: "ativo" }
        ];

        for (const service of servicesData) {
            await this.fetchData('/api/servicos', {
                method: 'POST',
                body: JSON.stringify(service)
            });
        }
    }

    setupEventListeners() {
        // Navegação - Adicionar listeners após o DOM estar carregado
        document.addEventListener('DOMContentLoaded', () => {
            // Botões de navegação
            document.getElementById('btn-tab-dashboard').addEventListener('click', () => this.showTab('dashboard'));
            document.getElementById('btn-tab-clientes').addEventListener('click', () => this.showTab('clientes'));
            document.getElementById('btn-tab-fornecedores').addEventListener('click', () => this.showTab('fornecedores'));
            document.getElementById('btn-tab-servicos').addEventListener('click', () => this.showTab('servicos'));
            document.getElementById('btn-tab-vendas').addEventListener('click', () => this.showTab('vendas'));
            document.getElementById('btn-tab-relatorios').addEventListener('click', () => this.showTab('relatorios'));
            
            // Botões de ação
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
            const searchServicoVenda = document.getElementById('search-servico-venda');
            if (searchServicoVenda) {
                searchServicoVenda.addEventListener('input', (e) => this.filtrarServicosModal(e.target.value));
            }

            // Botões de ação venda
            const btnEditarVenda = document.getElementById('btn-editar-venda');
            const btnExcluirVenda = document.getElementById('btn-excluir-venda');
            
            if (btnEditarVenda) {
                btnEditarVenda.addEventListener('click', () => this.editarVenda());
            }
            
            if (btnExcluirVenda) {
                btnExcluirVenda.addEventListener('click', () => this.excluirVenda());
            }

            // Botões de paginação
            document.getElementById('btn-prev')?.addEventListener('click', () => this.changePage(-1));
            document.getElementById('btn-next')?.addEventListener('click', () => this.changePage(1));
        });
    }

    updateCurrentDate() {
        const now = new Date();
        const options = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
        const dateElement = document.getElementById('current-date');
        if (dateElement) {
            dateElement.textContent = now.toLocaleDateString('pt-BR', options).replace(',', ' -');
        }
    }

    // Dashboard
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

            // Calcular crescimento
            const crescimentoReceita = data.faturamento_30dias > 0 ? 
                ((data.faturamento_30dias / (data.faturamento_total - data.faturamento_30dias)) * 100).toFixed(0) : 0;
            const crescimentoLucro = data.lucro_30dias > 0 ? 
                ((data.lucro_30dias / (data.lucro_total - data.lucro_30dias)) * 100).toFixed(0) : 0;

            const revenueGrowth = document.getElementById('revenue-growth');
            const profitGrowth = document.getElementById('profit-growth');
            
            if (revenueGrowth) revenueGrowth.textContent = `${crescimentoReceita}%`;
            if (profitGrowth) profitGrowth.textContent = `${crescimentoLucro}%`;

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
            const vendas = await this.fetchData('/api/vendas');
            const recentVendas = vendas
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 5);

            const tbody = document.getElementById('recent-sales');
            if (tbody) {
                tbody.innerHTML = recentVendas.map(venda => `
                    <tr>
                        <td>${venda.cliente_nome || 'Cliente'}</td>
                        <td>${venda.itens?.length || 0} serviço(s)</td>
                        <td class="text-success">R$ ${venda.total_venda?.toFixed(2) || '0,00'}</td>
                        <td>${venda.fornecedor_nome || 'N/A'}</td>
                        <td>${new Date(venda.created_at).toLocaleDateString('pt-BR')}</td>
                    </tr>
                `).join('') || '<tr><td colspan="5">Nenhuma venda recente</td></tr>';
            }
        } catch (error) {
            console.error('Erro ao carregar vendas recentes:', error);
        }
    }

    async loadUpcomingRenewals() {
        try {
            const clientes = await this.fetchData('/api/clientes');
            
            const hoje = new Date();
            const duasSemanas = new Date(hoje.getTime() + 14 * 24 * 60 * 60 * 1000);
            let renovacoes = [];

            // Para cada cliente, buscar assinaturas
            for (const cliente of clientes) {
                try {
                    const clienteComAssinaturas = await this.fetchData(`/api/clientes/${cliente.id}`);
                    if (clienteComAssinaturas.assinaturas) {
                        clienteComAssinaturas.assinaturas.forEach(assinatura => {
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
                } catch (error) {
                    console.error(`Erro ao buscar assinaturas do cliente ${cliente.id}:`, error);
                }
            }

            renovacoes.sort((a, b) => a.dias - b.dias);
            const tbody = document.getElementById('upcoming-renewals');
            if (tbody) {
                tbody.innerHTML = renovacoes.slice(0, 5).map(renovacao => `
                    <tr>
                        <td>${renovacao.cliente}</td>
                        <td>${renovacao.servico}</td>
                        <td>${renovacao.vencimento}</td>
                        <td>${renovacao.fornecedor}</td>
                        <td><span class="${renovacao.dias <= 3 ? 'text-danger' : 'text-warning'}">${renovacao.dias} dias</span></td>
                    </tr>
                `).join('') || '<tr><td colspan="5">Nenhuma renovação próxima</td></tr>';
            }

        } catch (error) {
            console.error('Erro ao carregar renovações:', error);
        }
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

    // Clientes
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

            // Paginação
            const startIndex = (this.currentPage - 1) * this.itemsPerPage;
            const endIndex = startIndex + this.itemsPerPage;
            const paginatedClients = clients.slice(startIndex, endIndex);

            // Renderizar tabela
            const tbody = document.getElementById('client-table-body');
            if (tbody) {
                tbody.innerHTML = await Promise.all(paginatedClients.map(async cliente => {
                    try {
                        const clienteComAssinaturas = await this.fetchData(`/api/clientes/${cliente.id}`);
                        const totalAssinaturas = clienteComAssinaturas.assinaturas?.length || 0;
                        const proximoVencimento = this.getProximoVencimento(clienteComAssinaturas.assinaturas);
                        
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
                                    ${clienteComAssinaturas.assinaturas?.[0]?.servico_nome ? `<br><small>${clienteComAssinaturas.assinaturas[0].servico_nome}</small>` : ''}
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
                    } catch (error) {
                        console.error(`Erro ao carregar cliente ${cliente.id}:`, error);
                        return `
                            <tr>
                                <td colspan="7">Erro ao carregar dados do cliente</td>
                            </tr>
                        `;
                    }
                })).then(html => html.join('')) || '<tr><td colspan="7" class="text-center">Nenhum cliente encontrado</td></tr>';
            }

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
        
        const showingCount = document.getElementById('showing-count');
        const totalCount = document.getElementById('total-count');
        const currentPage = document.getElementById('current-page');
        
        if (showingCount) showingCount.textContent = Math.min(totalItems, this.currentPage * this.itemsPerPage);
        if (totalCount) totalCount.textContent = totalItems;
        if (currentPage) currentPage.textContent = this.currentPage;
        
        const btnPrev = document.getElementById('btn-prev');
        const btnNext = document.getElementById('btn-next');
        
        if (btnPrev) btnPrev.disabled = this.currentPage === 1;
        if (btnNext) btnNext.disabled = this.currentPage === totalPages || totalPages === 0;
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
                    body: JSON.stringify(cliente)
                });
                this.showToast('Cliente atualizado com sucesso!', 'success');
            } else {
                await this.fetchData('/api/clientes', {
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
            const suppliers = await this.fetchData('/api/fornecedores');
            const container = document.getElementById('suppliers-grid');
            
            if (!container) return;
            
            // Aplicar filtro de status
            const statusFilter = document.getElementById('filter-supplier-status');
            const filteredSuppliers = statusFilter && statusFilter.value ? 
                suppliers.filter(s => s.status === statusFilter.value) : suppliers;
            
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
                    body: JSON.stringify(supplier)
                });
                this.showToast('Fornecedor atualizado com sucesso!', 'success');
            } else {
                await this.fetchData('/api/fornecedores', {
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
            const servicos = await this.fetchData('/api/servicos');
            const container = document.getElementById('services-grid');
            
            if (!container) return;
            
            // Aplicar filtros
            const categoriaFilter = document.getElementById('filter-category')?.value || '';
            const statusFilter = document.getElementById('filter-status-service')?.value || '';
            const searchFilter = document.getElementById('search-service')?.value.toLowerCase() || '';
            
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
            const fornecedores = await this.fetchData('/api/fornecedores');
            const select = document.getElementById(selectId);
            
            if (select) {
                select.innerHTML = '<option value="">Sem fornecedor específico</option>' +
                    fornecedores.map(f => `<option value="${f.id}">${f.nome}</option>`).join('');
            }
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
                await this.fetchData(`/api/servicos/${servicoId}`, {
                    method: 'PUT',
                    body: JSON.stringify(servico)
                });
                this.showToast('Serviço atualizado com sucesso!', 'success');
            } else {
                await this.fetchData('/api/servicos', {
                    method: 'POST',
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

    // Vendas
    async loadVendas() {
        try {
            const vendas = await this.fetchData('/api/vendas');
            
            // Aplicar filtros
            const periodoElement = document.getElementById('vendas-period');
            const statusFilterElement = document.getElementById('vendas-status');
            const fornecedorFilterElement = document.getElementById('vendas-fornecedor');
            
            const periodo = periodoElement ? periodoElement.value : 'all';
            const statusFilter = statusFilterElement ? statusFilterElement.value : '';
            const fornecedorFilter = fornecedorFilterElement ? fornecedorFilterElement.value : '';
            
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
            if (tbody) {
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
            }
            
            // Calcular totais
            const totalVendas = filteredVendas.reduce((sum, v) => sum + (v.total_venda || 0), 0);
            const totalLucro = filteredVendas.reduce((sum, v) => sum + (v.total_lucro || 0), 0);
            const margemMedia = totalVendas > 0 ? (totalLucro / totalVendas * 100).toFixed(1) : 0;
            
            const totalVendasElement = document.getElementById('total-vendas');
            const totalLucroVendasElement = document.getElementById('total-lucro-vendas');
            const margemMediaVendasElement = document.getElementById('margem-media-vendas');
            
            if (totalVendasElement) totalVendasElement.textContent = `R$ ${totalVendas.toFixed(2)}`;
            if (totalLucroVendasElement) totalLucroVendasElement.textContent = `R$ ${totalLucro.toFixed(2)}`;
            if (margemMediaVendasElement) margemMediaVendasElement.textContent = `${margemMedia}%`;

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
        
        // Se for edição, carregar os dados da venda
        if (vendaId) {
            try {
                const venda = await this.fetchData(`/api/vendas/${vendaId}`);
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
            const clientes = await this.fetchData('/api/clientes');
            const select = document.getElementById(selectId);
            
            if (select) {
                select.innerHTML = '<option value="">Selecione um cliente</option>' +
                    clientes.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
            }
        } catch (error) {
            console.error('Erro ao carregar clientes para select:', error);
        }
    }

    async loadServicosForVenda() {
        try {
            const servicos = await this.fetchData('/api/servicos');
            const container = document.getElementById('servicos-list-venda');
            
            if (container) {
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
            }

        } catch (error) {
            console.error('Erro ao carregar serviços para venda:', error);
        }
    }

    selectServiceForVenda(serviceId) {
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
    }

    async saveVenda(event) {
        event.preventDefault();
        
        const clienteId = document.getElementById('venda-cliente').value;
        if (!clienteId) {
            this.showToast('Selecione um cliente!', 'error');
            return;
        }
        
        const venda = {
            cliente_id: clienteId,
            fornecedor_id: document.getElementById('venda-fornecedor').value || null,
            total_custo: this.vendaData.totalCusto,
            total_venda: this.vendaData.totalVenda,
            total_lucro: this.vendaData.totalVenda - this.vendaData.totalCusto,
            status: document.getElementById('venda-status').value,
            metodo_pagamento: document.getElementById('venda-metodo-pagamento').value,
            observacoes: document.getElementById('venda-observacoes').value
        };
        
        const vendaId = document.getElementById('venda-id').value;
        
        try {
            if (vendaId) {
                // Atualizar venda existente
                await this.fetchData(`/api/vendas/${vendaId}`, {
                    method: 'PUT',
                    body: JSON.stringify(venda)
                });
                this.showToast('Venda atualizada com sucesso!', 'success');
            } else {
                // Criar nova venda
                await this.fetchData('/api/vendas', {
                    method: 'POST',
                    body: JSON.stringify({ venda, itens: this.vendaData.servicos })
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
            const venda = await this.fetchData(`/api/vendas/${vendaId}`);
            const modal = document.getElementById('modal-detalhes-venda');
            const container = document.getElementById('detalhes-venda-content');
            
            if (!modal || !container) return;
            
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
            const btnEditarVenda = document.getElementById('btn-editar-venda');
            const btnExcluirVenda = document.getElementById('btn-excluir-venda');
            
            if (btnEditarVenda) {
                btnEditarVenda.onclick = () => {
                    this.closeModal('modal-detalhes-venda');
                    this.openVendaModal(vendaId);
                };
            }
            
            if (btnExcluirVenda) {
                btnExcluirVenda.onclick = () => {
                    this.confirmDelete('venda', vendaId, `Venda #${vendaId}`);
                    this.closeModal('modal-detalhes-venda');
                };
            }
            
            modal.style.display = 'flex';
        } catch (error) {
            console.error('Erro ao carregar detalhes da venda:', error);
            this.showToast('Erro ao carregar detalhes da venda', 'error');
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
        
        this.openModal('modal-confirmacao');
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
                case 'venda':
                    await this.fetchData(`/api/vendas/${id}`, { method: 'DELETE' });
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
            const cliente = await this.fetchData(`/api/clientes/${id}`);
            const modal = document.getElementById('modal-detalhes-venda');
            const container = document.getElementById('detalhes-venda-content');
            
            if (!modal || !container) return;
            
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
            const btnEditarVenda = document.getElementById('btn-editar-venda');
            const btnExcluirVenda = document.getElementById('btn-excluir-venda');
            
            if (btnEditarVenda) btnEditarVenda.style.display = 'none';
            if (btnExcluirVenda) btnExcluirVenda.style.display = 'none';
            
            modal.style.display = 'flex';
        } catch (error) {
            console.error('Erro ao carregar detalhes do cliente:', error);
            this.showToast('Erro ao carregar detalhes do cliente', 'error');
        }
    }

    // Funções auxiliares
    toggleCustomDateRange(value) {
        const container = document.getElementById('custom-date-range');
        if (container) {
            container.style.display = value === 'custom' ? 'block' : 'none';
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

    exportClients() {
        this.showToast('Exportação em desenvolvimento', 'info');
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
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
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
            
            this.fetchData('/api/clientes', {
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
}

// Inicializar sistema quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.system = new GGMAXManager();
    
    // Funções globais para uso no HTML
    window.showTab = (tab) => {
        if (window.system) {
            window.system.showTab(tab);
        }
    };
    
    window.closeModal = (modalId) => {
        if (window.system) {
            window.system.closeModal(modalId);
        }
    };
    
    window.filtrarServicosModal = (filtro) => {
        if (window.system) {
            window.system.filtrarServicosModal(filtro);
        }
    };
    
    window.gerarTabelaPrecos = () => {
        if (window.system) {
            window.system.gerarTabelaPrecos();
        }
    };
    
    window.cadastrarClienteRapido = () => {
        if (window.system) {
            window.system.cadastrarClienteRapido();
        }
    };
    
    window.atualizarLinkFornecedor = () => {
        if (window.system) {
            window.system.atualizarLinkFornecedor();
        }
    };
});