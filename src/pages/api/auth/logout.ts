import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Logout será feito no client via cookie/session
    // Esta API route apenas valida e retorna sucesso
    // O client limpará o token localmente
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in logout:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
