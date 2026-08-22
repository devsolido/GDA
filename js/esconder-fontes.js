// ============================================================
// ESCONDER ARQUIVOS DA SEÇÃO FONTES (SEM BLOQUEAR)
// ============================================================

(function() {
    'use strict';

    // 1. REMOVER REFERÊNCIAS A ARQUIVOS
    try {
        // Limpar stack traces
        Error.stackTraceLimit = 0;
        
        // Remover referências a arquivos
        const originalError = Error;
        Error = function() {
            const error = new originalError();
            error.stack = '';
            return error;
        };
        Error.prototype = originalError.prototype;
    } catch(e) {}

    // 2. SOBRESCREVER CONSOLE PARA NÃO MOSTRAR ARQUIVOS
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalInfo = console.info;

    console.log = function() {
        const args = Array.from(arguments);
        if (args.some(arg => typeof arg === 'string' && 
            (arg.includes('.js') || arg.includes('.css') || 
             arg.includes('source') || arg.includes('arquivo')))) {
            return;
        }
        originalLog.apply(console, args);
    };

    console.warn = function() {
        const args = Array.from(arguments);
        if (args.some(arg => typeof arg === 'string' && 
            (arg.includes('.js') || arg.includes('.css') || 
             arg.includes('source') || arg.includes('arquivo')))) {
            return;
        }
        originalWarn.apply(console, args);
    };

    console.error = function() {
        const args = Array.from(arguments);
        if (args.some(arg => typeof arg === 'string' && 
            (arg.includes('.js') || arg.includes('.css') || 
             arg.includes('source') || arg.includes('arquivo')))) {
            return;
        }
        originalError.apply(console, args);
    };

    console.info = function() {
        const args = Array.from(arguments);
        if (args.some(arg => typeof arg === 'string' && 
            (arg.includes('.js') || arg.includes('.css') || 
             arg.includes('source') || arg.includes('arquivo')))) {
            return;
        }
        originalInfo.apply(console, args);
    };

    // 3. OFUSCAR NOMES DE FUNÇÕES
    const originalFunction = Function;
    Function = function() {
        const args = Array.from(arguments);
        if (args.length > 0) {
            const body = args[args.length - 1] || '';
            if (typeof body === 'string' && body.includes('source')) {
                args[args.length - 1] = body.replace(/source/g, '_');
            }
        }
        return new originalFunction(...args);
    };
    Function.prototype = originalFunction.prototype;

    // 4. REMOVER ARQUIVOS DO CACHE
    if (window.performance && window.performance.clearResourceTimings) {
        window.performance.clearResourceTimings();
    }

    console.log('🔒 Fontes ocultas com sucesso!');

})();
