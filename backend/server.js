const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, '..')));
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));

const submissionsPath = path.join(__dirname, 'submissions.json');
const inventoryPath = path.join(__dirname, 'inventory.json');

// --- 서브미션 데이터 로드 및 id 자동 부여 ---
function loadSubmissions() {
  if (!fs.existsSync(submissionsPath)) return [];
  let submissions = JSON.parse(fs.readFileSync(submissionsPath, 'utf8'));
  let updated = false;

  submissions = submissions.map(sub => {
    if (!sub.id) {
      sub.id = uuidv4();
      updated = true;
    }
    if (!sub.status) {
      sub.status = '대기'; // 기본 상태
    }
    return sub;
  });

  if (updated) {
    fs.writeFileSync(submissionsPath, JSON.stringify(submissions, null, 2));
    console.log('기존 신청서에 id 및 기본 상태를 추가했습니다.');
  }
  return submissions;
}

// 재고 잔여 계산 함수
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
    submissions = loadSubmissions();
    inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
  } catch {
    return res.status(500).json({ success: false, message: '파일 읽기 오류' });
  }

  // 새로운 신청서에 id와 초기 상태 넣기
  newData.id = uuidv4();
  if (!newData.status) newData.status = '대기';

  submissions.push(newData);

  const remaining = calculateRemainingInventory(newData.rentalDate, inventory, submissions);

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
    submissions = loadSubmissions();
  } catch {
    return res.status(500).json({ error: '파일 읽기 실패' });
  }

  const remaining = calculateRemainingInventory(targetDate, inventory, submissions);
  res.json({ success: true, remainingStock: remaining });
});

// 대여 신청 목록 조회 (GET)
app.get('/api/rental', (req, res) => {
  try {
    const submissions = loadSubmissions();
    res.json({ success: true, submissions });
  } catch {
    res.status(500).json({ success: false, message: '파일 읽기 실패' });
  }
});

// 신청 상태 변경 API (승인/거절 등)
app.post('/api/rental/status', (req, res) => {
  const { id, status } = req.body;
  console.log('status 변경 요청:', id, status);

  try {
    let submissions = loadSubmissions();

    const idx = submissions.findIndex(sub => sub.id === id);
    if (idx === -1) {
      console.log('존재하지 않는 신청서 id:', id);
      return res.status(400).json({ success: false, message: '존재하지 않는 신청서입니다.' });
    }

    console.log('기존 상태:', submissions[idx].status);
    submissions[idx].status = status;
    console.log('변경 후 상태:', submissions[idx].status);

    fs.writeFileSync(submissionsPath, JSON.stringify(submissions, null, 2));
    console.log('파일 저장 성공');
    res.json({ success: true, message: '상태가 변경되었습니다.' });
  } catch (error) {
    console.error('에러 발생:', error);
    res.status(500).json({ success: false, message: '서버 파일 처리 중 오류 발생' });
  }
});

// 대여 신청 삭제 API
app.post('/api/rental/delete', (req, res) => {
  const { id } = req.body;

  try {
    let submissions = loadSubmissions();

    const idx = submissions.findIndex(sub => sub.id === id);
    if (idx === -1) {
      return res.status(400).json({ success: false, message: '존재하지 않는 신청서입니다.' });
    }

    submissions.splice(idx, 1);
    fs.writeFileSync(submissionsPath, JSON.stringify(submissions, null, 2));
    res.json({ success: true, message: '신청서가 삭제되었습니다.' });
  } catch (error) {
    console.error('에러 발생:', error);
    res.status(500).json({ success: false, message: '서버 파일 처리 중 오류 발생' });
  }
});

// 내 정보 페이지용 API (예: 로그인된 사용자 ID로 내 신청서 조회)
app.get('/api/myinfo', (req, res) => {
  const userId = req.query.userId; // 클라이언트에서 userId 쿼리로 넘긴다고 가정

  if (!userId) {
    return res.status(400).json({ success: false, message: 'userId가 필요합니다.' });
  }

  try {
    const submissions = loadSubmissions();
    // userId 필드가 신청서에 있어야 합니다.
    const mySubmissions = submissions.filter(sub => sub.userId === userId);
    res.json({ success: true, submissions: mySubmissions });
  } catch {
    res.status(500).json({ success: false, message: '파일 읽기 실패' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
});
