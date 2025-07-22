const express = require("express");
const bodyParser = require("body-parser");
const { exec } = require("child_process");

const app = express();
app.use(bodyParser.json());

app.post("/webhook-backend-logiciel", (req, res) => {
  console.log("[GitHub] Webhook received.");

  exec("bash /var/www/backend-logiciel/deploy.sh", (err, stdout, stderr) => {
    if (err) {
      console.error(`❌ Deployment error: ${err.message}`);
      return res.status(500).send("Deployment failed");
    }
    console.log(`✅ Deployment output:\n${stdout}`);
    res.status(200).send("Deployed!");
  });
});

const PORT = 3010;
app.listen(PORT, () => {
  console.log(`🚀 Webhook server listening on port ${PORT}`);
});