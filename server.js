import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

app.get("/", (req, res) => {
  res.send("Inventario RTM Backend Activo");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const { data: user } = await supabase
    .from("usuarios")
    .select("*")
    .eq("email", email)
    .single();

  if (!user) return res.status(401).json({ error: "Usuario no existe" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: "Contraseña incorrecta" });

  res.json({ message: "Acceso correcto", user });
});

app.get("/inventario", async (req, res) => {
  const { data } = await supabase.from("inventario").select("*");
  res.json(data);
});

app.post("/movimiento", async (req, res) => {
  const { numero_parte, tipo, cantidad, vendedor, turno } = req.body;

  const { data: item } = await supabase
    .from("inventario")
    .select("*")
    .eq("numero_parte", numero_parte)
    .single();

  if (!item) return res.status(404).json({ error: "Parte no encontrada" });

  let nuevoTotal =
    tipo === "ENTRADA"
      ? item.total + cantidad
      : item.total - cantidad;

  await supabase
    .from("inventario")
    .update({ total: nuevoTotal })
    .eq("numero_parte", numero_parte);

  await supabase.from("movimientos").insert({
    numero_parte,
    tipo,
    cantidad,
    vendedor,
    turno
  });

  res.json({ message: "Movimiento registrado" });
});

app.listen(process.env.PORT, () =>
  console.log("Servidor Inventario RTM activo")
);