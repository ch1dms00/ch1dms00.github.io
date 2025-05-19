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
  
  // 관리자페이지가 열리면 신청서 데이터를 서버에서 가져와서 보여줌
window.addEventListener('DOMContentLoaded', () => {
  fetch('http://localhost:3000/api/rental')
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        console.log('신청서 목록:', data.submissions);
        // 여기서 받은 신청서 배열(data.submissions)을 화면에 뿌려주는 함수 호출
        renderSubmissions(data.submissions);
      } else {
        console.error('신청서 불러오기 실패');
      }
    })
    .catch(console.error);
});

// 신청서 목록을 화면에 그리는 함수 예시
function renderSubmissions(submissions) {
  const listContainer = document.getElementById('submissionList');
  if (!listContainer) return;

  listContainer.innerHTML = '';  // 기존 내용 초기화
  submissions.forEach(item => {
    const div = document.createElement('div');
    div.textContent = JSON.stringify(item);
    listContainer.appendChild(div);
  });
}
