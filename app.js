require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DB 연결
const dbURI = process.env.MONGO_URI || 'mongodb://localhost:27017/steel_company';
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// 라우트 설정
app.use('/api/auth', require('./routes/auth'));

// 홈 페이지: HOME 버튼 옆에 LOGIN 버튼 표시
app.get('/', (req, res) => {
  res.send(`<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Home</title>
  <style>
    .nav { padding: 16px; }
    .nav button { margin-right: 8px; padding: 8px 12px; cursor: pointer; }
  </style>
</head>
<body>
  <div class="nav">
    <button onclick="location.href='/'">HOME</button>
    <button onclick="location.href='/login'">LOGIN</button>
  </div>
  <h1>메인 페이지</h1>
</body>
</html>`);
});

// 로그인 페이지: 간단한 폼 (서버의 /api/auth/login 사용)
app.get('/login', (req, res) => {
  res.send(`<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Login</title>
  <style>
    .nav { padding: 16px; }
    .nav button { margin-right: 8px; padding: 8px 12px; cursor: pointer; }
    form { max-width: 320px; margin: 24px; }
    input { display:block; width:100%; margin-bottom:8px; padding:8px; box-sizing:border-box; }
    .error { color: red; }
  </style>
</head>
<body>
  <div class="nav">
    <button onclick="location.href='/'">HOME</button>
    <button onclick="location.href='/login'">LOGIN</button>
  </div>

  <h2>로그인</h2>
  <form id="loginForm">
    <input type="text" id="username" name="username" placeholder="아이디" required />
    <input type="password" id="password" name="password" placeholder="비밀번호" required />
    <button type="submit">로그인</button>
    <div id="msg" class="error"></div>
  </form>

  <script>
    const form = document.getElementById('loginForm');
    const msg = document.getElementById('msg');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      msg.textContent = '';
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        if (!res.ok) {
          const data = await res.json().catch(()=>null);
          msg.textContent = (data && data.msg) ? data.msg : '로그인 실패';
          return;
        }
        const data = await res.json();
        if (data.token) localStorage.setItem('token', data.token);
        window.location.href = '/';
      } catch (err) {
        console.error(err);
        msg.textContent = '서버 오류';
      }
    });
  </script>
</body>
</html>`);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
