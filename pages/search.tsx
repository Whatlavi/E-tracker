"use client";
import { useState } from "react";
import PlayerStats from "../components/PlayerStats";

export default function Search() {
  const [name, setName] = useState("");

  return (
    <div
      style={{
        padding: 20,
        maxWidth: 400,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <h1 style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
        Busca tu jugador 🎮
      </h1>

      <input
        type="text"
        placeholder="Nombre del summoner"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{
          width: "100%",
          padding: 10,
          borderRadius: 6,
          border: "1px solid #ccc",
          marginBottom: 15,
          fontSize: 16,
        }}
      />

      {name ? (
        <PlayerStats username={name} />
      ) : (
        <p style={{ color: "#555", marginTop: 10 }}>
          Escribe un nombre de invocador para buscar.
        </p>
      )}
    </div>
  );
}
