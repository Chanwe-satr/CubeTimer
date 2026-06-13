const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'cubetimer-local-jwt-secret-key-987654321';

// 启用 CORS 和 JSON 请求解析
app.use(cors());
app.use(express.json());

// 托管前端静态文件
app.use(express.static(path.join(__dirname, 'cubetimer')));

// JWT 身份验证中间件
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ success: false, message: '未提供身份认证凭证' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: '身份认证已过期，请重新登录' });
        }
        req.user = user;
        next();
    });
}

// ================= 用户注册与登录 API =================

// 1. 用户注册
app.post('/api/register', (req, res) => {
    const { username, password, nickname } = req.body;

    if (!username || !password || !nickname) {
        return res.status(400).json({ success: false, message: '用户名、密码和昵称不能为空' });
    }

    const trimmedUsername = username.trim().toLowerCase();
    const users = db.getUsers();

    // 检查用户名是否已存在
    const userExists = users.some(u => u.username === trimmedUsername);
    if (userExists) {
        return res.status(400).json({ success: false, message: '该用户名已被占用' });
    }

    // 哈希密码并保存
    const passwordHash = bcrypt.hashSync(password, 10);
    const newUser = {
        username: trimmedUsername,
        passwordHash,
        nickname: nickname.trim(),
        createdAt: Date.now()
    };

    users.push(newUser);
    db.saveUsers(users);

    res.json({ success: true, message: '注册成功' });
});

// 2. 用户登录
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
    }

    const trimmedUsername = username.trim().toLowerCase();
    const users = db.getUsers();
    const user = users.find(u => u.username === trimmedUsername);

    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
        return res.status(400).json({ success: false, message: '用户名或密码错误' });
    }

    // 生成 JWT Token，包含用户名和昵称
    const token = jwt.sign(
        { username: user.username, nickname: user.nickname },
        JWT_SECRET,
        { expiresIn: '30d' } // 30天免登录
    );

    res.json({
        success: true,
        message: '登录成功',
        token,
        user: {
            username: user.username,
            nickname: user.nickname
        }
    });
});

// ================= 计时数据 API =================

// 3. 获取用户所有成绩
app.get('/api/solves', authenticateToken, (req, res) => {
    const solves = db.getSolves(req.user.username);
    res.json({ success: true, solves });
});

// 4. 新增单条计时成绩
app.post('/api/solves', authenticateToken, (req, res) => {
    const { id, time, type, scramble, penalty } = req.body;
    
    if (!id || time === undefined || !type) {
        return res.status(400).json({ success: false, message: '成绩数据格式不完整' });
    }

    const solves = db.getSolves(req.user.username);
    const newSolve = {
        id,
        time,
        type,
        scramble: scramble || '',
        penalty: penalty || 'OK',
        createdAt: Date.now()
    };

    solves.unshift(newSolve); // 插入到最前面
    db.saveSolves(req.user.username, solves);

    res.json({ success: true, solve: newSolve });
});

// 5. 批量同步与合并成绩（主要用于离线模式到在线模式的合并）
app.post('/api/solves/sync', authenticateToken, (req, res) => {
    const clientSolves = req.body.solves || [];
    const serverSolves = db.getSolves(req.user.username);

    // 建立 ID 索引，避免重复
    const serverSolveIds = new Set(serverSolves.map(s => s.id));
    const merged = [...serverSolves];

    clientSolves.forEach(cs => {
        if (!serverSolveIds.has(cs.id)) {
            merged.push(cs);
        }
    });

    // 按照成绩时间戳递减排序 (最新的在前)
    merged.sort((a, b) => b.id - a.id);
    db.saveSolves(req.user.username, merged);

    res.json({ success: true, solves: merged });
});

// 6. 删除单条计时成绩
app.delete('/api/solves/:id', authenticateToken, (req, res) => {
    const solveId = parseInt(req.params.id);
    let solves = db.getSolves(req.user.username);
    
    const originalLength = solves.length;
    solves = solves.filter(s => s.id !== solveId);

    if (solves.length === originalLength) {
        return res.status(404).json({ success: false, message: '未找到指定成绩' });
    }

    db.saveSolves(req.user.username, solves);
    res.json({ success: true, message: '成绩已成功删除' });
});

// 7. 清空所有成绩
app.delete('/api/solves', authenticateToken, (req, res) => {
    db.saveSolves(req.user.username, []);
    res.json({ success: true, message: '历史成绩已全部清空' });
});

// ================= 社区互动 API =================

// 8. 获取社区帖子列表
app.get('/api/posts', (req, res) => {
    const posts = db.getPosts();
    res.json({ success: true, posts });
});

// 9. 发布社区心得帖子（需登录）
app.post('/api/posts', authenticateToken, (req, res) => {
    const { content, imageUrl, videoUrl } = req.body;

    if (!content && !imageUrl && !videoUrl) {
        return res.status(400).json({ success: false, message: '帖子内容不能为空' });
    }

    const posts = db.getPosts();
    const newPost = {
        id: Date.now(),
        author: req.user.username,
        authorNickname: req.user.nickname,
        content: content || '',
        imageUrl: imageUrl || '',
        videoUrl: videoUrl || '',
        timestamp: Date.now()
    };

    posts.unshift(newPost);
    db.savePosts(posts);

    res.json({ success: true, post: newPost });
});

// 兜底页面托管，解决单页应用刷新路由问题，确保 index.html 载入
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'cubetimer', 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`  魔方计时器本地后端服务已启动！`);
    console.log(`  本地测试地址: http://localhost:${PORT}`);
    console.log(`=================================================`);
});
