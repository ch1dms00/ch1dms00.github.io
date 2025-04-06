document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const studentID = document.getElementById('studentID').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    const message = document.getElementById('message');

    // 요청하신 학번과 비밀번호로 수정
    if (studentID === "20226735" && password === "1234") {
        
        if(rememberMe){
            localStorage.setItem('studentID', studentID);
        } else {
            localStorage.removeItem('studentID');
        }

        setTimeout(function() {
            window.location.href = "main.html";
        }, 1000); // 1초 후 메인 페이지로 이동

    } else {
        message.style.color = "red";
        message.textContent = "학번 또는 비밀번호가 잘못되었습니다.";
    }
});

// 페이지 로드 시 저장된 정보 자동 입력
window.onload = function() {
    const storedID = localStorage.getItem('studentID');
    if(storedID){
        document.getElementById('studentID').value = storedID;
        document.getElementById('rememberMe').checked = true;
    }
};
