import { useState } from "react";

export default function SearchSummoner() {
  const [name, setName] = useState("");
  const [data, setData] = useState<any>(null);

  const search = async () => {
    if (!name) return;
    const res = await fetch(`/api/summoner/${name}`);
    const json = await res.json();
    setData(json);
  };

  return (
    <main style={{ padding: "2rem" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>Buscar invocador 🎮</h1>

      <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del invocador"
          style={{ border: "1px solid #ccc", padding: "0.5rem", width: "250px" }}
        />
        <button
          onClick={search}
          style={{ padding: "0.5rem 1rem", background: "#2563eb", color: "white", border: "none", borderRadius: "4px" }}
        >
          Buscar
        </button>
      </div>

      {data && (
        <pre
          style={{
            marginTop: "1.5rem",
            padding: "1rem",
            background: "#f3f4f6",
            borderRadius: "6px",
          }}
        >
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </main>
  );
}
