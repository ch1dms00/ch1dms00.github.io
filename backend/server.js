// 📁 backend/server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

app.use(express.static(__dirname));




const submissionsPath = path.join(__dirname, 'submissions.json');
const inventoryPath = path.join(__dirname, 'inventory.json');

function calculateRemainingInventory(date, inventory, submissions) {
  const remaining = { ...inventory };

  for (const entry of submissions) {
    if (entry.rentalDate === date) {
      const lines = entry.items.split('\n');
      for (const line of lines) {
        if (!line.includes(':')) continue;
        const [name, qty] = line.split(':');
        const item = name.trim();
        const count = parseInt(qty.trim(), 10);
        if (remaining[item] !== undefined) {
          remaining[item] -= count;
        }
      }
    }
  }
  return remaining;
}

// 대여 신청 저장
app.post('/api/rental', (req, res) => {
  const newData = req.body;
  let submissions = [];
  let inventory = {};

  try {
    if (fs.existsSync(submissionsPath)) {
      submissions = JSON.parse(fs.readFileSync(submissionsPath, 'utf8'));
    }
    inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
  } catch {
    return res.status(500).json({ success: false, message: '파일 읽기 오류' });
  }

  const remaining = calculateRemainingInventory(newData.rentalDate, inventory, submissions);
  submissions.push(newData);

  try {
    fs.writeFileSync(submissionsPath, JSON.stringify(submissions, null, 2));
    res.json({ success: true, remainingStock: remaining });
  } catch {
    res.status(500).json({ success: false, message: '파일 저장 실패' });
  }
});

// 재고 조회 API
app.get('/api/stock', (req, res) => {
  const targetDate = req.query.date;
  let inventory = {};
  let submissions = [];

  try {
    inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
    submissions = JSON.parse(fs.readFileSync(submissionsPath, 'utf8'));
  } catch {
    return res.status(500).json({ error: '파일 읽기 실패' });
  }

  const remaining = calculateRemainingInventory(targetDate, inventory, submissions);
  res.json({ success: true, remainingStock: remaining });
});

app.listen(PORT, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
});

