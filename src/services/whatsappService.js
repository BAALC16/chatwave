const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const QRCode = require("qrcode");
const fs = require("fs").promises;
const path = require("path");

// Import constants with validation
let DEFAULT_COUNTRY_CODE, WHATSAPP_SUFFIX;
try {
	const constants = require("../config/constants");
	DEFAULT_COUNTRY_CODE = constants.DEFAULT_COUNTRY_CODE;
	WHATSAPP_SUFFIX = constants.WHATSAPP_SUFFIX;

	if (!DEFAULT_COUNTRY_CODE || !WHATSAPP_SUFFIX) {
		throw new Error("Required constants are not defined");
	}
} catch (error) {
	console.error("Error loading constants:", error);
	DEFAULT_COUNTRY_CODE = "225"; // Fallback value
	WHATSAPP_SUFFIX = "@c.us"; // Fallback value
}

class WhatsAppService {
	constructor() {
		this.clients = new Map();
		this.qrCodes = new Map();
		this.sessionPath = path.join(process.cwd(), "sessions");
	}

	async clearSession(clientId) {
		const sessionDir = path.join(this.sessionPath, clientId);
		try {
			await fs.rm(sessionDir, { recursive: true, force: true });
			console.log(`Session cleared for client ${clientId}`);
		} catch (error) {
			if (error.code !== "ENOENT") {
				console.error(`Error clearing session for ${clientId}:`, error);
			}
		}
	}

	async createClient(clientId) {
		// Si le client existe déjà, on le nettoie d'abord
		if (this.clients.has(clientId)) {
			const existingClient = this.clients.get(clientId);
			try {
				await existingClient.destroy();
			} catch (error) {
				console.warn(
					`Error destroying existing client: ${error.message}`
				);
			}
			this.clients.delete(clientId);
		}

		// On nettoie la session précédente
		await this.clearSession(clientId);

		const client = new Client({
			authStrategy: new LocalAuth({
				clientId: clientId,
				dataPath: this.sessionPath,
			}),
			puppeteer: {
				headless: true,
				args: [
					"--no-sandbox",
					"--disable-setuid-sandbox",
					"--disable-dev-shm-usage",
					"--disable-accelerated-2d-canvas",
					"--disable-gpu",
				],
			},
		});

		client.on("qr", (qr) => {
			console.log(`QR Code généré pour ${clientId}`);
			this.qrCodes.set(clientId, qr);
		});

		client.on("ready", () => {
			console.log(`Client ${clientId} est prêt`);
			this.qrCodes.delete(clientId);
		});

		client.on("disconnected", async () => {
			console.log(`Client ${clientId} déconnecté`);
			await this.clearSession(clientId);
			this.clients.delete(clientId);
		});

		try {
			await client.initialize();
			this.clients.set(clientId, client);
			return client;
		} catch (error) {
			console.error(
				`Erreur d'initialisation du client ${clientId}:`,
				error
			);
			throw error;
		}
	}

	formatPhoneNumber(phoneNumber) {
		if (!phoneNumber) {
			throw new Error("Phone number is required");
		}

		// Remove all non-numeric characters (spaces, dashes, etc)
		const cleanNumber = phoneNumber.replace(/\D/g, "");

		// Basic validation for empty or too short numbers
		if (cleanNumber.length < 8) {
			throw new Error("Phone number must be at least 8 digits");
		}

		// Return number as-is with WhatsApp suffix
		return `${cleanNumber}${WHATSAPP_SUFFIX}`;
	}

	async sendMessage(clientId, phoneNumber, message) {
		try {
			const client = this.getClient(clientId);
			if (!client) {
				throw new Error(`Client ${clientId} non trouvé`);
			}

			if (!message) {
				throw new Error("Message cannot be empty");
			}

			const formattedNumber = this.formatPhoneNumber(phoneNumber);
			return await client.sendMessage(formattedNumber, message);
		} catch (error) {
			console.error(
				`Error sending message for client ${clientId}:`,
				error
			);
			throw error;
		}
	}

	async sendMedia(clientId, phoneNumber, mediaUrl, caption) {
		try {
			const client = this.clients.get(clientId);
			if (!client) {
				throw new Error("Client non trouvé");
			}

			if (!mediaUrl) {
				throw new Error("Media URL is required");
			}

			const formattedNumber = this.formatPhoneNumber(phoneNumber);
			const media = await MessageMedia.fromUrl(mediaUrl);

			// Envoyer le média avec la légende
			return await client.sendMessage(formattedNumber, media, {
				caption: caption || undefined, // Ajoute la légende si elle existe
			});
		} catch (error) {
			console.error(`Error sending media for client ${clientId}:`, error);
			throw error;
		}
	}

	getQRCode(clientId) {
		return this.qrCodes.get(clientId);
	}

	async getQRCodeAsImage(clientId) {
		try {
			const qrCode = this.qrCodes.get(clientId);
			if (!qrCode) {
				console.log(`No QR code found for client ${clientId}`);
				return null;
			}

			const qrImageData = await QRCode.toDataURL(qrCode);
			return qrImageData;
		} catch (error) {
			console.error("Error generating QR code:", error);
			throw error;
		}
	}

	getClient(clientId) {
		return this.clients.get(clientId);
	}
}

module.exports = new WhatsAppService();
