"use client";
import React, { useMemo } from 'react';

// =====================================================================
// 🚨 CRÍTICO: CONFIGURACIÓN DE RIOT GAMES RSO (OAuth)
// 
// DEBES REEMPLAZAR ESTOS VALORES CON TUS CREDENCIALES REALES
// =====================================================================
const RIOT_CLIENT_ID = 'REEMPLAZAR_CON_TU_CLIENT_ID_DE_RIOTT'; 
const RIOT_REDIRECT_URI = 'https://TU_DOMINIO.com/api/auth/riot-callback'; 

// URL de autorización base de Riot Games
const RIOT_AUTH_URL = 'https://auth.riotgames.com/authorize';

const RiotLoginButton: React.FC = () => {
    
    const loginUrl = useMemo(() => {
        
        const state = Math.random().toString(36).substring(2, 15); 
        // NOTA PKCE: Este es un placeholder. En producción, el code_challenge debe 
        // generarse dinámicamente y su code_verifier debe guardarse.
        const code_challenge_placeholder = 'PLACEHOLDER_CODE_CHALLENGE_PKCE_S256';

        const params = new URLSearchParams({
            client_id: RIOT_CLIENT_ID,
            redirect_uri: RIOT_REDIRECT_URI,
            response_type: 'code',
            scope: 'openid profile account', 
            state: state,
            code_challenge: code_challenge_placeholder, 
            code_challenge_method: 'S256',
        });

        return `${RIOT_AUTH_URL}?${params.toString()}`;
    }, []);

    // ----------------------------------------------------
    // Lógica para mostrar el botón o la advertencia
    // ----------------------------------------------------
    const isPlaceholder = RIOT_CLIENT_ID.includes('REEMPLAZAR') || RIOT_REDIRECT_URI.includes('TU_DOMINIO');

    if (isPlaceholder) {
        // Muestra la advertencia si las credenciales no se han cambiado
        return (
            <div className="p-4 bg-yellow-900 border-l-4 border-yellow-500 text-yellow-300 rounded-lg max-w-xs mx-auto text-sm font-semibold">
                <p>⚠️ Configuración Pendiente</p>
                <p className="mt-1">El botón de Riot no funcionará hasta que edites <span className="font-mono">components/RiotLoginButton.tsx</span> y reemplaces el **Client ID** y la **Redirect URI** con tus valores reales.</p>
            </div>
        );
    }
    
    // Muestra el botón funcional si las credenciales son válidas
    return (
        <a 
            href={loginUrl}
            target="_self" 
            className="flex items-center justify-center space-x-3 p-4 bg-red-600 text-white font-bold rounded-lg shadow-lg 
                       hover:bg-red-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50
                       w-full max-w-xs mx-auto"
        >
            <span className="text-2xl">🔥</span> 
            <span>Iniciar Sesión con Riot Games</span>
        </a>
    );
};

export default RiotLoginButton;