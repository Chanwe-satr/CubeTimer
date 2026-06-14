const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 托管前端静态文件
app.use(express.static(path.join(__dirname, 'cubetimer')));

// 兜底页面托管，解决单页应用刷新路由问题，确保 index.html 载入
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'cubetimer', 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`  魔方计时器本地服务已启动！`);
    console.log(`  本地服务地址: http://localhost:${PORT}`);
    console.log(`=================================================`);
});
