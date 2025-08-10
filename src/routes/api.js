const express = require("express");
const router = express.Router();
const whatsappController = require("../controllers/whatsappController");

router.post("/clients", whatsappController.createClient);
router.get("/clients/:clientId/qr", whatsappController.getQRCode);
router.post("/clients/:clientId/messages", whatsappController.sendMessage);
router.post("/clients/:clientId/media", whatsappController.sendMedia);

module.exports = router;
