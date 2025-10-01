"use client";
import { useState } from "react";
import PlayerStats from "../components/PlayerStats";

// Lista oficial de códigos de regiones para la API de invocador
const REGION_LIST = [
  { code: 'euw1', name: 'EUW (Europa Oeste)' },
  { code: 'na1', name: 'NA (Norteamérica)' },
  { code: 'kr', name: 'KR (Corea)' },
  { code: 'eun1', name: 'EUNE (Europa Nórdica y Este)' },
  { code: 'br1', name: 'BR (Brasil)' },
  { code: 'la1', name: 'LA1 (Latinoamérica Norte)' },
  { code: 'la2', name: 'LA2 (Latinoamérica Sur)' },
  { code: 'oc1', name: 'OC (Oceanía)' },
];

export default function Search() {
  const [summonerName, setSummonerName] = useState("");
  const [region, setRegion] = useState('euw1');
  const [submittedName, setSubmittedName] = useState("");
  const [submittedRegion, setSubmittedRegion] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!summonerName.trim()) return;
    
    setSubmittedName(summonerName.trim());
    setSubmittedRegion(region);
  };

  return (
    <div
      style={{
        padding: 20,
        maxWidth: 450,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <h1 style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
        EliteGG Tracker 🎮
      </h1>

      <form onSubmit={handleSearch} style={{ width: '100%' }}>
        
        {/* Selector de Región */}
        <select 
          value={region} 
          onChange={(e) => setRegion(e.target.value)}
          style={{ 
            width: "100%", 
            padding: 10, 
            borderRadius: 6, 
            border: "1px solid #ccc", 
            marginBottom: 10, 
            fontSize: 16 
          }}
        >
          {REGION_LIST.map((r) => (
            <option key={r.code} value={r.code}>{r.name}</option>
          ))}
        </select>

        {/* Campo de Invocador */}
        <input
          type="text"
          placeholder="Nombre del invocador"
          value={summonerName}
          onChange={(e) => setSummonerName(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 6,
            border: "1px solid #ccc",
            marginBottom: 15,
            fontSize: 16,
          }}
        />

        {/* Botón de Búsqueda */}
        <button 
            type="submit" 
            style={{ 
                width: "100%", 
                padding: 10, 
                borderRadius: 6, 
                backgroundColor: '#0070f3',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontSize: 16
            }}
        >
          Buscar 🔎
        </button>
      </form>

      {/* Área de Resultados */}
      <div style={{ marginTop: 20, width: '100%' }}>
        {submittedName && submittedRegion ? (
          <PlayerStats username={submittedName} region={submittedRegion} />
        ) : (
           <p style={{ color: "#555", marginTop: 10, textAlign: 'center' }}>
            Escribe un nombre de invocador y haz clic en &quot;Buscar&quot;. {/* 🛑 CORRECCIÓN: Usamos &quot; */}
           </p>
        )}
      </div>
    </div>
  );
}