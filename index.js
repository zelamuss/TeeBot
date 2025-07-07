const express = require("express");
const cors = require("cors");
const teeworlds = require("teeworlds");

const app = express();
const port = 3000;
app.use(cors());

const DDNET_SERVER_HOST = "91.218.67.176";
const DDNET_SERVER_PORT = 8305;
const CLIENT_NAME = "porno";
const MESSAGE_TO_SEND = "PORNOOOO";
const RECONNECT_DELAY_MS = 0;

let reconnectCount = 0;
let totalReconnections = 0;
let client = null;

app.get("/", (req, res) => {
  res.send("bot çalışıyo knk");
});

app.get("/runbot", async (req, res) => {
  const count = parseInt(req.query.reconnect);
  if (isNaN(count) || count < 1) {
    return res.status(400).send("geçerli reconnect sayısı yaz.");
  }
  totalReconnections = count;
  reconnectCount = 0;
  res.send(`bot ${count} defa reconnect yapıcak`);
  runSingleCycle();
});

async function runSingleCycle() {
  reconnectCount++;
  if (reconnectCount > totalReconnections) {
    console.log(`✅ tamamlandı: ${totalReconnections} reconnect yapıldı.`);
    return;
  }

  console.log(`\n🚀 Reconnect #${reconnectCount}/${totalReconnections}`);
  console.log("📦 Client instance oluşturuluyo...");
  client = new teeworlds.Client(DDNET_SERVER_HOST, DDNET_SERVER_PORT, CLIENT_NAME);
  console.log("🔌 Bağlantı denenecek...");

  client.on("connected", async () => {
    console.log("🟢 Bağlandı!");
    try {
      await client.game.Say(MESSAGE_TO_SEND);
      console.log(`💬 Mesaj yollandı: ${MESSAGE_TO_SEND}`);
      await new Promise((r) => setTimeout(r, 100));
      await client.Disconnect();
      console.log("❌ Bağlantı kesildi.");
      setTimeout(runSingleCycle, RECONNECT_DELAY_MS);
    } catch (err) {
      console.error("💥 Hata:", err);
      client.Disconnect().finally(() => {
        setTimeout(runSingleCycle, RECONNECT_DELAY_MS);
      });
    }
  });

  client.on("disconnect", (reason) => {
    console.log(`🔌 disconnect: ${reason}`);
    if (reconnectCount <= totalReconnections && client.isConnecting) {
      setTimeout(runSingleCycle, RECONNECT_DELAY_MS);
    }
  });

  client.on("error", (err) => {
    console.error("🚨 client error:", err);
  });

  client.on("message", (msg) => {
    const sender = msg.author?.ClientInfo?.name || "Bilinmeyen";
    console.log(`[CHAT] ${sender}: ${msg.message}`);
  });

  console.log("⚡ client.connect() çağırılıyo...");
  client.connect();
}

app.listen(port, () => {
  console.log(`🧠 localhost:${port} çalışıyo baba`);
});
