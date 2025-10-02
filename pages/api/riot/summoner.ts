// frontend/pages/api/riot/search-riot-id.ts

import type { NextApiRequest, NextApiResponse } from 'next';

// Nota: La API de Account v1 (Riot ID) usa las rutas regionales 'AMERICAS', 'ASIA', 'EUROPE'.
const REGION_ROUTING = 'europe'; 
const RIOT_API_KEY = process.env.RIOT_API_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Aquí recibimos el NombreDeJuego (name) y el TAG (tag) de tu formulario
    const { name, tag } = req.query as { name?: string; tag?: string };

    // 1. VALIDACIÓN DE LA CLAVE API (CRÍTICO)
    if (!RIOT_API_KEY) {
        return res.status(500).json({ error: "Falta RIOT_API_KEY en el servidor. Revísala en Vercel." });
    }

    // 2. VALIDACIÓN DE LOS PARÁMETROS DE BÚSQUEDA
    if (!name || typeof name !== 'string' || !tag || typeof tag !== 'string') {
        return res.status(400).json({ error: "Riot ID (NombreDeJuego y TAG) son obligatorios." });
    }

    try {
        // 3. LLAMADA A LA API DE RIOT ACCOUNT V1
        // Esta API devuelve el PUUID, que luego se usa para obtener datos específicos de LoL.
        const url = `https://${REGION_ROUTING}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`;

        const response = await fetch(url, {
            headers: {
                "X-Riot-Token": RIOT_API_KEY,
            },
        });

        // 4. MANEJO DE LA RESPUESTA
        const data = await response.json();

        // Si la respuesta no fue exitosa (ej. 404 Not Found, 403 Forbidden, 429 Rate Limit)
        if (!response.ok) {
             // Devolvemos el error de Riot directamente, incluyendo el 403.
             return res.status(response.status).json(data);
        }

        // Si fue exitosa (200 OK), devolvemos los datos de la cuenta (que incluyen el PUUID)
        res.status(200).json(data);
    } catch (err) {
        // 5. MANEJO DE ERRORES INTERNOS
        res.status(500).json({ error: "Error interno al contactar a la API de Riot.", details: (err as Error).message });
    }
}