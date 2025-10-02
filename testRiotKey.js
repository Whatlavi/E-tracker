require('dotenv').config({ path: '.env.local' });

console.log("Usando API Key:", process.env.RIOT_API_KEY);

async function testRiotAPI() {
  if (!process.env.RIOT_API_KEY) {
    console.error("❌ No se encontró RIOT_API_KEY en el .env.local");
    return;
  }

  try {
    const response = await fetch("https://euw1.api.riotgames.com/lol/status/v4/platform-data", {
      headers: {
        "X-Riot-Token": process.env.RIOT_API_KEY
      }
    });

    console.log("Status:", response.status);
    const data = await response.json();
    console.log("Response:", data);
  } catch (err) {
    console.error("Error al llamar a la API:", err);
  }
}

testRiotAPI();
