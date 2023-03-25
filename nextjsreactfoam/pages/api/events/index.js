import { getToken } from "next-auth/jwt";
import api from "@/utils/api";
import getTenant from "@/utils/getTenant";

  export default async function handler(req, res) {
  const testreq = req;
  const testres = res;
  const secret = process.env.JWT_SECRET;
  const token = await getToken({
    req,
    secret,
  });
  const tenant = getTenant(req);

  const response = await api.get("/events", {
    headers: {
      "X-Tenant": getTenant(req),
      Authorization: `Bearer ${token.accessToken}`,
    },
  });

  const data = response.data.data;

  if (response) {
    return res.status(200).json({
      data,
    });
  }
  

  return res.status(400).json({ message: "Failed to fetch events." });
}
