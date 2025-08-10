const whatsappService = require("../services/whatsappService");

exports.createClient = async (req, res) => {
	try {
		const { clientId } = req.body;
		await whatsappService.createClient(clientId);
		res.json({ success: true, message: "Client créé avec succès" });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

exports.getQRCode = async (req, res) => {
    try {
        const { clientId } = req.params;
        const qrImage = await whatsappService.getQRCodeAsImage(clientId);
        
        if (!qrImage) {
            return res.status(404).json({
                success: false,
                message: "QR code non trouvé ou client déjà authentifié"
            });
        }

        res.send(`
        <html>
            <head>
                <title>Scanner le QR Code WhatsApp</title>
                <meta http-equiv="refresh" content="20">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { 
                        display: flex; 
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        margin: 0;
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                        background: #f0f2f5;
                    }
                    .container {
                        background: white;
                        padding: 2rem;
                        border-radius: 1rem;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        max-width: 500px;
                        width: 90%;
                    }
                    h1 {
                        color: #128C7E;
                        text-align: center;
                        margin-bottom: 1.5rem;
                        font-size: 1.5rem;
                    }
                    .qr-container {
                        background: white;
                        padding: 1rem;
                        border-radius: 0.5rem;
                        text-align: center;
                        border: 2px solid #e9edef;
                    }
                    img { 
                        max-width: 250px;
                        width: 100%;
                        height: auto;
                    }
                    .status {
                        margin-top: 1rem;
                        padding: 0.5rem;
                        text-align: center;
                        background: #dcf8c6;
                        border-radius: 0.5rem;
                        font-size: 0.9rem;
                    }
                    .instructions {
                        margin-top: 2rem;
                    }
                    .instructions h2 {
                        color: #075E54;
                        font-size: 1.2rem;
                        margin-bottom: 1rem;
                    }
                    ol {
                        padding-left: 1.5rem;
                        line-height: 1.6;
                    }
                    li {
                        margin-bottom: 0.5rem;
                        color: #4a4a4a;
                    }
                    #connection-status {
                        margin-top: 1rem;
                        text-align: center;
                        color: #128C7E;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Scanner le QR Code WhatsApp</h1>
                    <div class="qr-container">
                        <img src="${qrImage}" alt="WhatsApp QR Code"/>
                    </div>
                    <div class="status">
                        La page se rafraîchit automatiquement toutes les 20 secondes
                    </div>
                    <div class="instructions">
                        <h2>Comment scanner :</h2>
                        <ol>
                            <li>Ouvrez WhatsApp sur votre téléphone</li>
                            <li>Appuyez sur <strong>Menu ⋮</strong> (Android) ou <strong>Réglages</strong> (iPhone)</li>
                            <li>Sélectionnez <strong>WhatsApp Web/Desktop</strong></li>
                            <li>Appuyez sur <strong>Lier un appareil</strong></li>
                            <li>Pointez votre téléphone vers ce QR code</li>
                        </ol>
                    </div>
                    <div id="connection-status"></div>
                </div>
                <script>
                    const checkConnection = async () => {
                        try {
                            const response = await fetch('/api/clients/${clientId}/status');
                            const data = await response.json();
                            if (data.connected) {
                                window.location.href = '/api/clients/${clientId}/dashboard';
                            }
                        } catch (error) {
                            console.error('Erreur de vérification:', error);
                        }
                    };

                    setInterval(checkConnection, 5000);
                </script>
            </body>
        </html>
    `);
    } catch (error) {
        console.error('Error in QR code generation:', error);
        return res.status(500).json({
            success: false,
            message: "Erreur lors de la génération du QR code",
            error: error.message
        });
    }
};

exports.getClientStatus = async (req, res) => {
	const { clientId } = req.params;
	const status = await whatsappService.getClientStatus(clientId);
	res.json(status);
};

exports.getDashboard = async (req, res) => {
	const { clientId } = req.params;
	const clientInfo = await whatsappService.getClientInfo(clientId);

	if (!clientInfo) {
		return res.status(404).json({
			success: false,
			message: "Client non trouvé",
		});
	}

	res.json(clientInfo);
};

exports.sendMessage = async (req, res) => {
    try {
        const { clientId } = req.params;
        const { phoneNumber, message } = req.body;

        if (!phoneNumber || !message) {
            return res.status(400).json({
                success: false,
                message: "Le numéro de téléphone et le message sont requis"
            });
        }

        const client = await whatsappService.getClient(clientId);
        if (!client) {
            return res.status(404).json({
                success: false,
                message: "Client non trouvé"
            });
        }

        await whatsappService.sendMessage(clientId, phoneNumber, message);
        res.json({
            success: true,
            message: "Message envoyé avec succès"
        });
    } catch (error) {
        console.error('Erreur envoi message:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

exports.sendMedia = async (req, res) => {
    try {
        const { clientId } = req.params;
        const { phoneNumber, mediaUrl, caption } = req.body;

        if (!phoneNumber || !mediaUrl) {
            return res.status(400).json({
                success: false,
                message: "Le numéro de téléphone et l'URL du média sont requis"
            });
        }

        const client = await whatsappService.getClient(clientId);
        if (!client) {
            return res.status(404).json({
                success: false,
                message: "Client non trouvé"
            });
        }

        await whatsappService.sendMedia(clientId, phoneNumber, mediaUrl, caption);
        res.json({
            success: true,
            message: "Média envoyé avec succès"
        });
    } catch (error) {
        console.error('Erreur envoi média:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
