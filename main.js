const express = require("express");
const cors = require("cors");
const apiRoutes = require("./src/routes/api");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", apiRoutes);

const PORT = process.env.PORT || 3000;
const server = app
	.listen(PORT, "0.0.0.0", () => {
		console.log(`Serveur démarré sur http://localhost:${PORT}`);
	})
	.on("error", (err) => {
		console.error("Erreur de démarrage du serveur:", err);
	});

process.on("SIGTERM", () => {
	server.close(() => {
		console.log("Serveur arrêté proprement");
	});
});
