import { PrismaClient } from "@prisma/client";
import express from "express";

const prisma = new PrismaClient();
const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).send({ status: 'API is running!' });
});

app.get('/teachers', async (req, res) => {
  const users = await prisma.teacher.findMany();
  res.json(users);
});

app.get('/teachers/:phone_number', async (req, res) => {

});

app.post('/teacher/create', async (req, res) => {
  const { name, phone_number } = req.body;
  const result = await prisma.teacher.create({
    data: {
      name,
      phone_number
    }
  });
  res.json(result);
});

export const startAPI = () => {
  const PORT = process.env.API_PORT || 3000;
  app.listen(PORT, () => {
    console.log(`API is running on http://localhost:${PORT}`);
  });
};
