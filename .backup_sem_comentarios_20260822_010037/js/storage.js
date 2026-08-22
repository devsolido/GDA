// ===== GERENCIAMENTO DE STORAGE =====
export function loadData(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error(Erro ao carregar :, error);
        return defaultValue;
    }
}

export function saveData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error(Erro ao salvar :, error);
        return false;
    }
}

export function clearData(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error(Erro ao limpar :, error);
        return false;
    }
}
