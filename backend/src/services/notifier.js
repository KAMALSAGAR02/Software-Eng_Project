const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

if (token && chatId) {
  console.log('Telegram Notifier (REST API) initialized.');
} else {
  console.log('Telegram credentials missing. Notifications disabled.');
}

const alertCooldowns = {};
const COOLDOWN_MINUTES = 5;

const sendTelegramAlert = async (alertData) => {
  if (!token || !chatId) return;

  if (alertData.severity !== 'High' && alertData.severity !== 'Critical') {
    return;
  }

  const ipKey = alertData.source_ip;
  const now = Date.now();

  if (alertCooldowns[ipKey] && (now - alertCooldowns[ipKey]) < COOLDOWN_MINUTES * 60 * 1000) {
    console.log(`[Notifier] Suppressed alert for ${ipKey} (Cooldown active)`);
    return;
  }

  alertCooldowns[ipKey] = now;

  const emoji = alertData.severity === 'Critical' ? '🚨🚨🚨' : '⚠️';
  const message = `
${emoji} *SIEM THREAT ALERT* ${emoji}

*Type:* ${alertData.type}
*Severity:* ${alertData.severity}
*Source IP:* \`${alertData.source_ip}\`
*Destination:* \`${alertData.destination_ip}\`
*Time:* ${new Date(alertData.timestamp * 1000).toUTCString()}

*Details:*
Packet Length: ${alertData.details.packet_length || 'N/A'} bytes
Protocol: ${alertData.details.protocol || 'N/A'}

_Action Required: Review dashboard immediately._
`;

  try {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown'
    });
    console.log(`[Notifier] Telegram alert sent for ${ipKey}`);
  } catch (error) {
    console.error(`[Notifier] Failed to send Telegram alert:`, error.response ? error.response.data : error.message);
  }
};

const sendEmailAlert = (alertData) => {
  if (alertData.severity !== 'High' && alertData.severity !== 'Critical') {
    return;
  }
  console.log(`\n================= EMAIL ALERT =================`);
  console.log(`To: admin@cybershield.local`);
  console.log(`Subject: ${alertData.severity.toUpperCase()} Threat Detected: ${alertData.type}`);
  console.log(`\nDear Admin,\n`);
  console.log(`A new threat has been detected on the network.`);
  console.log(`Severity: ${alertData.severity}`);
  console.log(`Source IP: ${alertData.source_ip}`);
  console.log(`Destination IP: ${alertData.destination_ip}`);
  console.log(`Timestamp: ${new Date(alertData.timestamp * 1000).toUTCString()}`);
  console.log(`Details: Packet Length: ${alertData.details.packet_length || 'N/A'}, Protocol: ${alertData.details.protocol || 'N/A'}`);
  console.log(`\nPlease review the dashboard immediately.`);
  console.log(`===============================================\n`);
};

module.exports = { sendTelegramAlert, sendEmailAlert };
