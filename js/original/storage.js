// Configuração da API
const API_BASE = window.location.origin || 'http://localhost:3000';

// Função para sincronizar com a API
async function syncToAPI(key, data) {
    try {
        const response = await fetch(`${API_BASE}/api/sync/${key}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ value: data })
        });
        if (!response.ok) {
            console.warn(`⚠️ Falha ao sincronizar ${key}: ${response.status}`);
            return false;
        }
        const result = await response.json();
        console.log(`✅ ${key} sincronizado com a nuvem`);
        return true;
    } catch (error) {
        console.warn(`⚠️ Erro ao sincronizar ${key}:`, error.message);
        return false;
    }
}

// Função para buscar dados da API
async function fetchFromAPI(key) {
    try {
        const response = await fetch(`${API_BASE}/api/sync/${key}`);
        if (!response.ok) {
            console.warn(`⚠️ Falha ao buscar ${key}: ${response.status}`);
            return null;
        }
        const data = await response.json();
        return data.data || null;
    } catch (error) {
        console.warn(`⚠️ Erro ao buscar ${key}:`, error.message);
        return null;
    }
}

// Função para carregar dados (localStorage + API)
export async function loadData(key, defaultValue = null) {
    try {
        // Primeiro tenta carregar do localStorage
        const localData = localStorage.getItem(key);
        if (localData) {
            const parsed = JSON.parse(localData);
            // Tenta sincronizar com a API em background
            fetchFromAPI(key).then(apiData => {
                if (apiData !== null && apiData !== undefined) {
                    localStorage.setItem(key, JSON.stringify(apiData));
                }
            });
            return parsed;
        }
        
        // Se não tem localStorage, tenta da API
        const apiData = await fetchFromAPI(key);
        if (apiData !== null && apiData !== undefined) {
            localStorage.setItem(key, JSON.stringify(apiData));
            return apiData;
        }
        
        return defaultValue;
    } catch (error) {
        console.error(`Erro ao carregar ${key}:`, error);
        return defaultValue;
    }
}

// Função para salvar dados (localStorage + API)
export async function saveData(key, data) {
    try {
        // Salva no localStorage
        localStorage.setItem(key, JSON.stringify(data));
        
        // Sincroniza com a API em background
        syncToAPI(key, data);
        
        return true;
    } catch (error) {
        console.error(`Erro ao salvar ${key}:`, error);
        return false;
    }
}

// Função para limpar dados
export function clearData(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error(`Erro ao limpar ${key}:`, error);
        return false;
    }
}

// Função para sincronizar todos os dados
export async function syncAllData() {
    const keys = [
        'gda_atividades',
        'gda_notas',
        'gda_relatorios',
        'gda_checklist',
        'gda_presencas',
        'gda_presencas_atrasadas',
        'gda_ocorrencias',
        'gda_historico_panico',
        'gda_atendimentos',
        'gda_assuntos'
    ];
    
    for (const key of keys) {
        const data = localStorage.getItem(key);
        if (data) {
            await syncToAPI(key, JSON.parse(data));
        }
    }
    console.log('✅ Todos os dados sincronizados!');
}
