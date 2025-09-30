import type { NextApiRequest, NextApiResponse } from "next";
import cookie from "cookie";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const code = req.query.code as string;

  if (!code) return res.status(400).send("No code provided");

  const clientId = process.env.RIOT_CLIENT_ID!;
  const clientSecret = process.env.RIOT_CLIENT_SECRET!;
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback`;

  try {
    // Intercambiar el código por un token
    const tokenRes = await fetch("https://auth.riotgames.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();

    // Guardar token en cookie segura
    res.setHeader(
      "Set-Cookie",
      cookie.serialize("riot_token", tokenData.access_token, {
        httpOnly: true,
        maxAge: 3600, // 1 hora
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      })
    );

    // Redirigir al home
    res.redirect("/");
  } catch (err: unknown) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Error desconocido" });
    }
  }
}
