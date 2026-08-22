



(function() {
    'use strict';

    
    try {
        
        Error.stackTraceLimit = 0;
        
        
        const originalError = Error;
        Error = function() {
            const error = new originalError();
            error.stack = '';
            return error;
        };
        Error.prototype = originalError.prototype;
    } catch(e) {}

    
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

    
    if (window.performance && window.performance.clearResourceTimings) {
        window.performance.clearResourceTimings();
    }

    console.log('🔒 Fontes ocultas com sucesso!');

})();
