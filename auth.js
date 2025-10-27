// SHA-256 için fonksiyon
async function sha256(str) {
    const msgBuffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Sabit kullanıcı listesi (şifreler hash'lenmiş)
const users = [
    {
        username: 'clawy',
        passwordHash: 'c9d5729c18737636e48f9e5466ed20e295ab49d2dd9744fb4828a9c8741b30be', // clawy123
        isAdmin: true
    },
    {
        username: 'user1',
        passwordHash: '9b8769a4a742959a2d0298c36fb70623f2dfacda8436237df08d8dfd5b37374c', // pass123
        isAdmin: false
    }
];

// GitHub token (senin token'ın)
const GITHUB_TOKEN = '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';
const REPO_OWNER = 'clawy1337';
const REPO_NAME = 'clawy1337.github.io';
const BRANCH = 'main';
const FILE_PATH = 'status.json';

// Giriş kontrolü (form için)
async function checkLogin(username, password) {
    const savedUsername = localStorage.getItem('username');
    const savedHash = localStorage.getItem('passwordHash');
    if (savedUsername && savedHash) {
        const user = users.find(u => u.username === savedUsername && u.passwordHash === savedHash);
        if (user) {
            localStorage.setItem('isAdmin', user.isAdmin);
            localStorage.setItem('lastLogin', new Date().toLocaleString('tr-TR'));
            return user;
        }
    }

    if (!username || !password) return null;

    const hashedPassword = await sha256(password);
    const user = users.find(u => u.username === username && u.passwordHash === hashedPassword);

    if (user) {
        localStorage.setItem('username', username);
        localStorage.setItem('passwordHash', hashedPassword);
        localStorage.setItem('isAdmin', user.isAdmin);
        localStorage.setItem('lastLogin', new Date().toLocaleString('tr-TR'));
        return user;
    } else {
        alert('Yanlış kullanıcı adı veya şifre!');
        return null;
    }
}

// Admin kontrolü
function isAdmin() {
    return localStorage.getItem('isAdmin') === 'true';
}

// JSON'dan durumu çek
async function fetchStatus() {
    const statusTextEl = document.getElementById('statusText');
    const lastUpdateEl = document.getElementById('lastUpdate');
    if (!statusTextEl || !lastUpdateEl) return;

    try {
        const response = await fetch('status.json');
        const data = await response.json();
        statusTextEl.innerText = data.status_text || 'Aktif • Emek Mahallesi';
        lastUpdateEl.innerText = data.last_updated || '27 Ekim 2025';
    } catch (error) {
        statusTextEl.innerText = 'Aktif • Emek Mahallesi';
        lastUpdateEl.innerText = '27 Ekim 2025';
        console.error('Durum çekme hatası:', error);
    }
}

// Durumu otomatik güncelle (GitHub API ile, UTF-8 için encode düzeltildi)
async function updateStatusJson(newStatus, now) {
    try {
        // Önce mevcut dosyanın SHA'sını al
        const getResponse = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        const fileData = await getResponse.json();
        const sha = fileData.sha;

        // Yeni JSON içeriği
        const jsonContent = JSON.stringify({
            status_text: newStatus,
            last_updated: now,
            last_updated_by: localStorage.getItem('username')
        }, null, 2);

        // UTF-8 için encode
        const newContent = btoa(unescape(encodeURIComponent(jsonContent)));

        // Dosyayı güncelle
        const updateResponse = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Durum güncellendi: ${newStatus} by ${localStorage.getItem('username')}`,
                content: newContent,
                sha: sha,
                branch: BRANCH
            })
        });

        if (updateResponse.ok) {
            console.log('status.json otomatik güncellendi!');
            alert('Durum başarıyla kaydedildi ve GitHub\'a yüklendi!');
        } else {
            const errorData = await updateResponse.json();
            console.error('Güncelleme hatası:', errorData);
            alert('Güncelleme hatası: ' + errorData.message + '. Manuel güncelle!');
        }
    } catch (error) {
        console.error('API hatası:', error);
        alert('API hatası: ' + error.message + '. Token\'ı kontrol et veya manuel güncelle!');
    }
}

// Durumu güncelle
async function editStatus() {
    if (!isAdmin()) {
        alert('Sadece adminler durumu değiştirebilir!');
        return;
    }

    const newStatus = prompt('Yeni durumunu gir (örneğin: Aktif • Beşiktaş):', document.getElementById('statusText').innerText);
    if (newStatus && newStatus.trim() !== '') {
        const statusTextEl = document.getElementById('statusText');
        const lastUpdateEl = document.getElementById('lastUpdate');
        const now = new Date().toLocaleString('tr-TR');

        statusTextEl.innerText = newStatus.trim();
        lastUpdateEl.innerText = now;

        // Otomatik güncelle
        await updateStatusJson(newStatus.trim(), now);
    }
}
