// gerar-token.js
// Este script vai gerar um token usando o Turso via API

const TURSO_URL = 'gda-db-devsolido.aws-us-east-1.turso.io';

// Seu token antigo (pode estar expirado)
const TOKEN_ANTIGO = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJfMjhIODVCUUVmR3Z1S0lFSHY1cV9nIiwib3JnX2lkIjoxMDAwMjE1MDQxfQ.KhxOixgxKWAsuFmH6ebnaHcW-lKcSulyFxIO2Id2I07g2NhXEu7TzA6QSFBU73_CIKUc6howu-0nbpw9F0D2Dw';

async function testarConexao() {
    try {
        const url = `https://${TURSO_URL}`;
        console.log(`📡 Testando conexão com: ${url}`);
        
        const response = await fetch(`${url}/v2/pipeline`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TOKEN_ANTIGO}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                requests: [{
                    type: 'execute',
                    stmt: { sql: 'SELECT 1' }
                }]
            })
        });
        
        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Resposta:', JSON.stringify(data, null, 2));
        
        if (response.status === 401) {
            console.log('\n❌ Token inválido ou expirado!');
            console.log('🔑 Você precisa gerar um novo token no site do Turso.');
            console.log('No console.turso.tech:');
            console.log('1. Clique em "Settings" do seu banco');
            console.log('2. Clique em "Generate Token"');
            console.log('3. Copie o token gerado');
        }
    } catch (err) {
        console.error('❌ Erro:', err.message);
    }
}

testarConexao();