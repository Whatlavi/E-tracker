// testRiotKey.js
import dotenv from 'dotenv';
import fetch from 'node-fetch'; // Necesitas esta dependencia, que ya tienes instalada

// 1. Carga las variables del entorno desde .env.local
// El argumento `{ path: '.env.local' }` asegura que se carguen desde ese archivo específico.
dotenv.config({ path: '.env.local' });

// 2. Accede a la clave de entorno
const API_KEY = process.env.RIOT_API_KEY;

console.log('--- Verificación de Riot API Key ---');
console.log('Usando API Key:', API_KEY ? 'Cargada correctamente (no undefined)' : 'ERROR: undefined');

// Verificación rápida para detener la ejecución si la clave no se carga
if (!API_KEY) {
    console.error("\nERROR FATAL: La variable RIOT_API_KEY no se encontró.");
    console.error("Revisa tu archivo .env.local. Debe ser: RIOT_API_KEY=RGAPI-xxxxxx");
    process.exit(1);
}

// URL de prueba: Obtenemos el estado de la plataforma EUW
const testUrl = 'https://euw1.api.riotgames.com/lol/status/v4/platform-data';

async function testRiotKey() {
    try {
        const response = await fetch(testUrl, {
            headers: {
                'X-Riot-Token': API_KEY, // Aquí se envía la clave cargada
            },
        });

        const data = await response.json();

        console.log(`\nStatus de la Petición: ${response.status} (${response.statusText})`);
        
        if (response.status === 200) {
            console.log('\n✅ Éxito: La clave de API de Riot funciona correctamente.');
            console.log('Datos de la respuesta (Respuesta OK de Riot):', Object.keys(data));
        } else if (response.status === 401 || response.status === 403) {
            console.error('\n❌ ERROR 401/403: La clave de API es inválida o ha expirado.');
            console.log('Mensaje del error:', data.status?.message || 'N/A');
        } else {
             console.error(`\n⚠️ ERROR ${response.status}: Error inesperado.`);
             console.log('Respuesta completa:', data);
        }
    } catch (error) {
        console.error('\nError al realizar la petición (Error de red o CORS):', error.message);
    }
}

testRiotKey();