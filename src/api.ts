import express from "express";

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).send({ status: 'API is running!' });
});

export const startAPI = () => {
  const PORT = process.env.API_PORT || 3000;
  app.listen(PORT, () => {
    console.log(`API is running on http://localhost:${PORT}`);
  });
};
