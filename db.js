const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

// 确保数据文件夹存在
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getFilePath(filename) {
    return path.join(DATA_DIR, filename);
}

function readJSON(filename, defaultVal = []) {
    const filePath = getFilePath(filename);
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(defaultVal, null, 2), 'utf8');
        return defaultVal;
    }
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    } catch (e) {
        console.error(`读取数据文件 ${filename} 失败:`, e);
        return defaultVal;
    }
}

function writeJSON(filename, data) {
    const filePath = getFilePath(filename);
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (e) {
        console.error(`写入数据文件 ${filename} 失败:`, e);
        return false;
    }
}

// 用户列表相关接口
function getUsers() {
    return readJSON('users.json', []);
}

function saveUsers(users) {
    return writeJSON('users.json', users);
}

// 计时成绩相关接口（以用户名作为 key 存储）
function getSolves(username) {
    const allSolves = readJSON('solves.json', {});
    return allSolves[username] || [];
}

function saveSolves(username, userSolves) {
    const allSolves = readJSON('solves.json', {});
    allSolves[username] = userSolves;
    return writeJSON('solves.json', allSolves);
}

// 社区心得帖子相关接口
function getPosts() {
    return readJSON('posts.json', []);
}

function savePosts(posts) {
    return writeJSON('posts.json', posts);
}

module.exports = {
    getUsers,
    saveUsers,
    getSolves,
    saveSolves,
    getPosts,
    savePosts
};
