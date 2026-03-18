import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/auth-card", (req, res) => {
    // Simulate card authorization
    const { cardNumber, expiry, cvc, amount } = req.body;
    console.log(`Authorizing card ending in ${cardNumber.slice(-4)} for ${amount}`);
    
    // In a real app, you'd call a payment gateway here
    res.json({ 
      success: true, 
      authId: `auth_${Math.random().toString(36).substr(2, 9)}`,
      message: "Card authorized successfully. Please complete the wire transfer to confirm your reservation."
    });
  });

  app.post("/api/send-wire-instructions", async (req, res) => {
    const { email, orderId, packageName, totalAmount, bankDetails } = req.body;
    
    if (!resend) {
      console.log("Resend API key missing. Skipping email.");
      return res.json({ success: true, message: "Email simulation: Wire instructions sent." });
    }

    try {
      await resend.emails.send({
        from: "FIFA 2026 VIP <hospitality@fifa2026.com>",
        to: email,
        subject: `Wire Instructions for Order #${orderId}`,
        html: `
          <h1>FIFA 2026 VIP Hospitality</h1>
          <p>Thank you for your reservation for <strong>${packageName}</strong>.</p>
          <p>Total Amount: <strong>$${totalAmount}</strong></p>
          <hr />
          <h3>Wire Transfer Instructions</h3>
          <p>Bank Name: ${bankDetails.bankName}</p>
          <p>Account Holder: ${bankDetails.accountHolder}</p>
          <p>IBAN: ${bankDetails.iban}</p>
          <p>SWIFT: ${bankDetails.swift}</p>
          <p>Please include your Order ID <strong>${orderId}</strong> in the transfer reference.</p>
        `,
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
