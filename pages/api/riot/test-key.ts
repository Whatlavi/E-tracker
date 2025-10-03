// pages/api/riot/test-key.ts

import { NextApiRequest, NextApiResponse } from 'next';

// Esta variable lee automáticamente la clave de Vercel/process.env.
const RIOT_API_KEY = process.env.RIOT_API_KEY; 

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    
    // 1. Verificación de la Clave
    if (!RIOT_API_KEY) {
        return res.status(500).json({ 
            error: '❌ Error de Configuración: RIOT_API_KEY no está definida en el entorno de Vercel.' 
        });
    }

    // 2. Llamada de Prueba al Endpoint de Estado (Región EUW1, la que usaste antes)
    const testUrl = "https://euw1.api.riotgames.com/lol/status/v4/platform-data";

    try {
        const response = await fetch(testUrl, {
            headers: {
                // El header correcto es X-Riot-Token
                "X-Riot-Token": RIOT_API_KEY
            }
        });

        // 3. Manejo de la Respuesta
        const data = await response.json();
        
        // Si el estado es 403 (Forbidden)
        if (response.status === 403) {
            return res.status(403).json({
                message: "🔴 403 Forbidden - La clave API es INVÁLIDA o no se cargó correctamente.",
                details: data
            });
        }
        
        // Si el estado es 200 (OK)
        if (response.ok) {
            return res.status(200).json({
                message: "🟢 ¡ÉXITO! La clave API funciona perfectamente en Vercel.",
                riotStatus: data
            });
        }
        
        // Si hay otro error (ej: 404, 429)
        return res.status(response.status).json({
            message: `🟡 Error inesperado (${response.status}) al contactar a Riot.`,
            details: data
        });

    } catch (err) {
        // 4. Manejo de Errores de Red
        console.error("Error de conexión:", err);
        res.status(500).json({ error: 'Error de conexión del servidor.', details: (err as Error).message });
    }
}