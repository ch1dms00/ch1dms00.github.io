// 공지 추가
document.getElementById('noticeForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const content = document.getElementById('content').value;
  
    // 서버에 공지사항 POST 요청
    fetch('/api/notices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content })
    }).then(() => location.reload());
  });
  
  // 대여 신청서 불러오기
  window.onload = function() {
    if (location.pathname.includes('rental_requests.html')) {
      fetch('/api/rental-requests')
        .then(res => res.json())
        .then(data => {
          const container = document.getElementById('requestList');
          data.forEach(req => {
            const div = document.createElement('div');
            div.innerHTML = `
              <p>${req.name} - ${req.item} (${req.date})</p>
              <button onclick="confirmRequest('${req.id}')">확정</button>
              <button onclick="cancelRequest('${req.id}')">취소</button>
            `;
            container.appendChild(div);
          });
        });
    }
  };
  
  // 예약 확정/취소 처리
  function confirmRequest(id) {
    fetch(`/api/rental-requests/${id}/confirm`, { method: 'POST' }).then(() => location.reload());
  }
  function cancelRequest(id) {
    fetch(`/api/rental-requests/${id}/cancel`, { method: 'POST' }).then(() => location.reload());
  }
  
