// Ball Build Supply POS System - Complete JavaScript
// ===============================================

// ระบบจัดการข้อมูล LocalStorage และ Google Sheets
class DataManager {
    static GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby5pcj5a89D5K02ngmHDlcISUovhFZCqYJfP2-mBduT9rBMN_IKnYI6mdwqcfBAa9w/exec'; // แก้ไข URL ของคุณ
    static syncEnabled = true;
    static lastSyncTime = null;

    static save(key, data) {
        try {
            document.cookie = `${key}=${JSON.stringify(data)}; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/`;
            
            // Auto-sync กับ Google Sheets
            if (this.syncEnabled && currentUser) {
                this.autoSync();
            }
        } catch (error) {
            console.warn('Cannot save to cookie, using memory storage');
        }
    }

    static load(key, defaultValue = null) {
        try {
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
                const [name, value] = cookie.trim().split('=');
                if (name === key) {
                    return JSON.parse(decodeURIComponent(value));
                }
            }
            return defaultValue;
        } catch (error) {
            console.warn('Cannot load from cookie, using default value');
            return defaultValue;
        }
    }

    // ซิงค์ข้อมูลกับ Google Sheets
    static async syncToGoogleSheets() {
        if (!this.syncEnabled) return { success: false, message: 'Sync disabled' };
        
        try {
            // แสดงสถานะการซิงค์
            this.showSyncStatus('กำลังซิงค์ข้อมูล...', 'loading');
            
            const promises = [
                this.syncProducts(),
                this.syncCustomers(),
                this.syncSales(),
                this.syncUsers()
            ];

            await Promise.all(promises);
            
            this.lastSyncTime = new Date();
            DataManager.save('lastSyncTime', this.lastSyncTime.toISOString());
            
            this.showSyncStatus('ซิงค์ข้อมูลสำเร็จ', 'success');
            return { success: true, message: 'Sync completed successfully' };
            
        } catch (error) {
            console.error('Sync error:', error);
            this.showSyncStatus('ซิงค์ข้อมูลล้มเหลว', 'error');
            return { success: false, message: error.message };
        }
    }

    static async syncProducts() {
        const response = await fetch(this.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'sync_products',
                products: products
            })
        });
        return await response.json();
    }

    static async syncCustomers() {
        const response = await fetch(this.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'sync_customers',
                customers: customers
            })
        });
        return await response.json();
    }

    static async syncSales() {
        const response = await fetch(this.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'sync_sales',
                sales: sales
            })
        });
        return await response.json();
    }

    static async syncUsers() {
        const response = await fetch(this.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'sync_users',
                users: users
            })
        });
        return await response.json();
    }

    // โหลดข้อมูลจาก Google Sheets
    static async loadFromGoogleSheets() {
        if (!this.syncEnabled) return { success: false, message: 'Sync disabled' };
        
        try {
            this.showSyncStatus('กำลังโหลดข้อมูลจาก Google Sheets...', 'loading');
            
            const response = await fetch(`${this.GOOGLE_SCRIPT_URL}?action=get_all_data`);
            const result = await response.json();
            
            if (result.success && result.data) {
                // อัปเดตข้อมูลท้องถิ่น
                if (result.data.products) {
                    products = result.data.products;
                    filteredProducts = [...products];
                    DataManager.save('products', products);
                }
                
                if (result.data.customers) {
                    customers = result.data.customers;
                    DataManager.save('customers', customers);
                }
                
                this.showSyncStatus('โหลดข้อมูลสำเร็จ', 'success');
                return { success: true, message: 'Data loaded successfully' };
            } else {
                throw new Error(result.message || 'Failed to load data');
            }
            
        } catch (error) {
            console.error('Load error:', error);
            this.showSyncStatus('โหลดข้อมูลล้มเหลว', 'error');
            return { success: false, message: error.message };
        }
    }

    // Auto-sync (จำกัดความถี่)
    static autoSync() {
        if (this.syncTimeout) clearTimeout(this.syncTimeout);
        
        this.syncTimeout = setTimeout(() => {
            this.syncToGoogleSheets();
        }, 5000); // รอ 5 วินาทีก่อนซิงค์
    }

    // แสดงสถานะการซิงค์
    static showSyncStatus(message, type = 'info') {
        // ลบข้อความเก่า
        const existingStatus = document.getElementById('syncStatus');
        if (existingStatus) existingStatus.remove();
        
        // สร้างข้อความใหม่
        const statusDiv = document.createElement('div');
        statusDiv.id = 'syncStatus';
        statusDiv.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            padding: 10px 15px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: bold;
            z-index: 1001;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

function showBackupSettings() {
    document.getElementById('settingsContent').innerHTML = `
        <div class="backup-settings">
            <h3>สำรองข้อมูล</h3>
            
            <div class="backup-actions">
                <button onclick="exportData()" class="export-btn">ส่งออกข้อมูล (JSON)</button>
                <button onclick="showImportData()" class="import-btn">นำเข้าข้อมูล</button>
                <button onclick="clearAllData()" class="danger-btn">ล้างข้อมูลทั้งหมด</button>
            </div>
            
            <div class="data-summary">
                <h4>สรุปข้อมูลในระบบ:</h4>
                <ul>
                    <li>สินค้า: ${products.length} รายการ</li>
                    <li>ลูกค้า: ${customers.length} คน</li>
                    <li>การขาย: ${sales.length} รายการ</li>
                    <li>ผู้ใช้: ${users.length} คน</li>
                </ul>
            </div>
            
            <div id="importSection" style="display: none;">
                <h4>นำเข้าข้อมูล:</h4>
                <input type="file" id="importFile" accept=".json">
                <button onclick="importData()" class="save-btn">นำเข้า</button>
                <button onclick="hideImportData()" class="cancel-btn">ยกเลิก</button>
            </div>
        </div>
    `;
}

// ฟังก์ชันการตั้งค่า
function toggleSync() {
    DataManager.syncEnabled = !DataManager.syncEnabled;
    showSyncSettings();
    showNotification(DataManager.syncEnabled ? 'เปิดการซิงค์อัตโนมัติแล้ว' : 'ปิดการซิงค์อัตโนมัติแล้ว', 'success');
}

function updateGoogleScriptUrl() {
    const url = document.getElementById('googleScriptUrl').value;
    if (url) {
        DataManager.GOOGLE_SCRIPT_URL = url;
        showNotification('อัปเดต URL สำเร็จ', 'success');
    }
}

async function manualSync() {
    await syncToGoogle();
}

function showAddUserModal() {
    showUserModal();
}

function editUser(userId) {
    const user = users.find(u => u.id === userId);
    showUserModal(user);
}

function showUserModal(user = null) {
    const isEdit = user !== null;
    const modalContent = `
        <div class="modal-overlay" onclick="closeModal()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>${isEdit ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}</h3>
                    <span class="close-btn" onclick="closeModal()">&times;</span>
                </div>
                <div class="modal-body">
                    <form onsubmit="saveUser(event, ${isEdit ? user.id : 'null'})">
                        <div class="form-group">
                            <label>ชื่อผู้ใช้:</label>
                            <input type="text" id="userUsername" value="${user ? user.username : ''}" required ${isEdit ? 'readonly' : ''}>
                        </div>
                        <div class="form-group">
                            <label>รหัสผ่าน:</label>
                            <input type="password" id="userPassword" ${isEdit ? 'placeholder="เว้นว่างหากไม่ต้องการเปลี่ยน"' : 'required'}>
                        </div>
                        <div class="form-group">
                            <label>ชื่อเต็ม:</label>
                            <input type="text" id="userFullName" value="${user ? user.fullName : ''}" required>
                        </div>
                        <div class="form-group">
                            <label>บทบาท:</label>
                            <select id="userRole" required>
                                <option value="user" ${user && user.role === 'user' ? 'selected' : ''}>พนักงาน</option>
                                <option value="admin" ${user && user.role === 'admin' ? 'selected' : ''}>ผู้ดูแลระบบ</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button type="button" onclick="closeModal()" class="cancel-btn">ยกเลิก</button>
                            <button type="submit" class="save-btn">${isEdit ? 'บันทึก' : 'เพิ่มผู้ใช้'}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalContent);
}

function saveUser(event, userId) {
    event.preventDefault();
    
    const userData = {
        username: document.getElementById('userUsername').value,
        fullName: document.getElementById('userFullName').value,
        role: document.getElementById('userRole').value,
        active: true
    };
    
    const password = document.getElementById('userPassword').value;
    if (password || !userId) {
        userData.password = password;
    }
    
    if (userId) {
        // แก้ไขผู้ใช้
        const index = users.findIndex(u => u.id === userId);
        users[index] = { ...users[index], ...userData };
    } else {
        // เพิ่มผู้ใช้ใหม่
        // ตรวจสอบชื่อผู้ใช้ซ้ำ
        if (users.find(u => u.username === userData.username)) {
            showNotification('ชื่อผู้ใช้นี้มีอยู่แล้ว', 'error');
            return;
        }
        userData.id = Math.max(...users.map(u => u.id || 0), 0) + 1;
        users.push(userData);
    }
    
    saveData();
    loadUsersTable();
    closeModal();
    showNotification(userId ? 'แก้ไขผู้ใช้สำเร็จ' : 'เพิ่มผู้ใช้สำเร็จ', 'success');
}

function toggleUserStatus(userId) {
    const user = users.find(u => u.id === userId);
    if (user) {
        user.active = !user.active;
        saveData();
        loadUsersTable();
        showNotification(`${user.active ? 'เปิด' : 'ปิด'}ใช้งานผู้ใช้ ${user.username} แล้ว`, 'success');
    }
}

function exportData() {
    const data = {
        products,
        customers,
        sales,
        users: users.map(u => ({...u, password: undefined})), // ไม่ส่งออกรหัสผ่าน
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ball-build-supply-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('ส่งออกข้อมูลสำเร็จ', 'success');
}

function showImportData() {
    document.getElementById('importSection').style.display = 'block';
}

function hideImportData() {
    document.getElementById('importSection').style.display = 'none';
}

function importData() {
    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];
    
    if (!file) {
        showNotification('กรุณาเลือกไฟล์', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (confirm('การนำเข้าจะแทนที่ข้อมูลทั้งหมด คุณต้องการดำเนินการต่อหรือไม่?')) {
                if (data.products) products = data.products;
                if (data.customers) customers = data.customers;
                if (data.sales) sales = data.sales;
                if (data.users) {
                    // รักษารหัสผ่านเดิมไว้
                    data.users.forEach(importedUser => {
                        const existingUser = users.find(u => u.username === importedUser.username);
                        if (existingUser && !importedUser.password) {
                            importedUser.password = existingUser.password;
                        }
                    });
                    users = data.users;
                }
                
                // อัปเดต ID
                nextProductId = Math.max(...products.map(p => p.id || 0), 0) + 1;
                nextCustomerId = Math.max(...customers.map(c => c.id || 0), 0) + 1;
                nextSaleId = Math.max(...sales.map(s => s.id || 0), 0) + 1;
                
                filteredProducts = [...products];
                saveData();
                hideImportData();
                showNotification('นำเข้าข้อมูลสำเร็จ', 'success');
                
                // รีเฟรชหน้าจอ
                updateUI();
            }
        } catch (error) {
            showNotification('ไฟล์ไม่ถูกต้อง', 'error');
        }
    };
    reader.readAsText(file);
}

function clearAllData() {
    if (confirm('คุณต้องการล้างข้อมูลทั้งหมดหรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้!')) {
        if (confirm('ยืนยันอีกครั้ง: ล้างข้อมูลทั้งหมด?')) {
            products = [];
            customers = [];
            sales = [];
            filteredProducts = [];
            currentSale = { items: [], total: 0, customer: null };
            
            nextProductId = 1;
            nextCustomerId = 1;
            nextSaleId = 1;
            
            saveData();
            showNotification('ล้างข้อมูลทั้งหมดแล้ว', 'success');
            updateUI();
        }
    }
}

// ฟังก์ชันช่วยเหลือ
function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        font-weight: bold;
        z-index: 10000;
        max-width: 300px;
        word-wrap: break-word;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideInRight 0.3s ease-out;
    `;
    
    switch(type) {
        case 'success':
            notification.style.backgroundColor = '#E8F5E8';
            notification.style.color = '#4CAF50';
            notification.style.border = '1px solid #4CAF50';
            break;
        case 'error':
            notification.style.backgroundColor = '#FFEBEE';
            notification.style.color = '#F44336';
            notification.style.border = '1px solid #F44336';
            break;
        case 'warning':
            notification.style.backgroundColor = '#FFF3E0';
            notification.style.color = '#FF9800';
            notification.style.border = '1px solid #FF9800';
            break;
        default:
            notification.style.backgroundColor = '#E3F2FD';
            notification.style.color = '#2196F3';
            notification.style.border = '1px solid #2196F3';
    }
    
    document.body.appendChild(notification);
    
    // ลบการแจ้งเตือนหลัง 3 วินาที
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 3000);
}

function updateUI() {
    // อัปเดต UI ตามหน้าที่กำลังแสดงอยู่
    const activeTab = document.querySelector('.nav-tab.active');
    if (activeTab) {
        const tabText = activeTab.textContent;
        if (tabText.includes('ขายสินค้า')) {
            loadPOSData();
        } else if (tabText.includes('จัดการสินค้า')) {
            loadProductsTable();
        } else if (tabText.includes('ลูกค้า')) {
            loadCustomersTable();
        } else if (tabText.includes('รายงาน')) {
            loadSalesReport();
        } else if (tabText.includes('ตั้งค่า')) {
            const activeSettingsTab = document.querySelector('.settings-tab.active');
            if (activeSettingsTab) {
                const settingsTabText = activeSettingsTab.textContent;
                if (settingsTabText.includes('ผู้ใช้')) {
                    loadUsersTable();
                } else if (settingsTabText.includes('สำรอง')) {
                    showBackupSettings();
                }
            }
        }
    }
}

// เพิ่ม CSS Animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
        
        switch(type) {
            case 'loading':
                statusDiv.style.backgroundColor = '#FFF3E0';
                statusDiv.style.color = '#FF9800';
                statusDiv.innerHTML = `⏳ ${message}`;
                break;
            case 'success':
                statusDiv.style.backgroundColor = '#E8F5E8';
                statusDiv.style.color = '#4CAF50';
                statusDiv.innerHTML = `✅ ${message}`;
                break;
            case 'error':
                statusDiv.style.backgroundColor = '#FFEBEE';
                statusDiv.style.color = '#F44336';
                statusDiv.innerHTML = `❌ ${message}`;
                break;
            default:
                statusDiv.style.backgroundColor = '#E3F2FD';
                statusDiv.style.color = '#2196F3';
                statusDiv.innerHTML = `ℹ️ ${message}`;
        }
        
        document.body.appendChild(statusDiv);
        
        // ลบข้อความหลัง 3 วินาที
        setTimeout(() => {
            if (statusDiv.parentNode) {
                statusDiv.remove();
            }
        }, 3000);
    }

    // ทดสอบการเชื่อมต่อ
    static async testConnection() {
        try {
            const response = await fetch(`${this.GOOGLE_SCRIPT_URL}?action=test`);
            const result = await response.json();
            return result;
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}

// ตัวแปรระบบ
let products = [];
let filteredProducts = [];
let customers = [];
let sales = [];
let users = [
    { id: 1, username: 'admin', password: 'admin123', fullName: 'ผู้ดูแลระบบ', role: 'admin', active: true },
    { id: 2, username: 'user', password: 'user123', fullName: 'พนักงานขาย', role: 'user', active: true }
];
let currentUser = null;
let currentSale = { items: [], total: 0, customer: null };
let nextProductId = 1;
let nextCustomerId = 1;
let nextSaleId = 1;

// เริ่มต้นระบบ
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    showLoginScreen();
});

// โหลดข้อมูลจากหน่วยความจำ
function loadData() {
    products = DataManager.load('products', []);
    customers = DataManager.load('customers', []);
    sales = DataManager.load('sales', []);
    users = DataManager.load('users', users);
    
    filteredProducts = [...products];
    
    // อัปเดต ID ต่อไป
    nextProductId = Math.max(...products.map(p => p.id || 0), 0) + 1;
    nextCustomerId = Math.max(...customers.map(c => c.id || 0), 0) + 1;
    nextSaleId = Math.max(...sales.map(s => s.id || 0), 0) + 1;
}

// บันทึกข้อมูล
function saveData() {
    DataManager.save('products', products);
    DataManager.save('customers', customers);
    DataManager.save('sales', sales);
    DataManager.save('users', users);
}

// ฟังก์ชันสำหรับซิงค์กับ Google Sheets
async function syncToGoogle() {
    if (!currentUser) {
        alert('กรุณาเข้าสู่ระบบก่อน');
        return;
    }
    
    const result = await DataManager.syncToGoogleSheets();
    if (result.success) {
        showNotification('ซิงค์ข้อมูลสำเร็จ!', 'success');
    } else {
        showNotification('ซิงค์ข้อมูลล้มเหลว: ' + result.message, 'error');
    }
}

// ฟังก์ชันสำหรับโหลดข้อมูลจาก Google Sheets
async function loadFromGoogle() {
    if (!currentUser) {
        alert('กรุณาเข้าสู่ระบบก่อน');
        return;
    }
    
    const result = await DataManager.loadFromGoogleSheets();
    if (result.success) {
        loadData(); // โหลดข้อมูลใหม่
        updateUI(); // อัปเดต UI
        showNotification('โหลดข้อมูลสำเร็จ!', 'success');
    } else {
        showNotification('โหลดข้อมูลล้มเหลว: ' + result.message, 'error');
    }
}

// ทดสอบการเชื่อมต่อ Google Apps Script
async function testConnection() {
    const result = await DataManager.testConnection();
    showNotification(result.message, result.success ? 'success' : 'error');
}

// ระบบเข้าสู่ระบบ
function showLoginScreen() {
    document.body.innerHTML = `
        <div class="login-container">
            <div class="login-form">
                <div class="logo">
                    <h1>🏗️ Ball Build Supply</h1>
                    <p>ระบบขายหน้าร้าน (POS)</p>
                </div>
                <div class="form-group">
                    <input type="text" id="username" placeholder="ชื่อผู้ใช้" required>
                </div>
                <div class="form-group">
                    <input type="password" id="password" placeholder="รหัสผ่าน" required>
                </div>
                <button onclick="login()" class="login-btn">เข้าสู่ระบบ</button>
                <div class="test-accounts">
                    <p>บัญชีทดสอบ:</p>
                    <small>admin / admin123 (ผู้ดูแล)</small><br>
                    <small>user / user123 (พนักงาน)</small>
                </div>
            </div>
        </div>
    `;
    
    // กด Enter เพื่อเข้าสู่ระบบ
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            login();
        }
    });
}

function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    const user = users.find(u => u.username === username && u.password === password && u.active);
    
    if (user) {
        currentUser = user;
        showMainInterface();
    } else {
        showNotification('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', 'error');
    }
}

function logout() {
    currentUser = null;
    showLoginScreen();
}

// แสดงหน้าจอหลัก
function showMainInterface() {
    document.body.innerHTML = `
        <div class="app-container">
            <!-- Header -->
            <header class="header">
                <div class="header-left">
                    <h1>🏗️ Ball Build Supply</h1>
                    <span class="user-info">สวัสดี, ${currentUser.fullName}</span>
                </div>
                <div class="header-right">
                    <button onclick="testConnection()" class="test-btn">🔗 ทดสอบ</button>
                    <button onclick="syncToGoogle()" class="sync-btn">📤 ซิงค์</button>
                    <button onclick="loadFromGoogle()" class="sync-btn">📥 โหลด</button>
                    <button onclick="logout()" class="logout-btn">ออกจากระบบ</button>
                </div>
            </header>

            <!-- Navigation -->
            <nav class="nav-tabs">
                <button class="nav-tab active" onclick="showTab('pos')">📊 ขายสินค้า</button>
                <button class="nav-tab" onclick="showTab('products')">📦 จัดการสินค้า</button>
                <button class="nav-tab" onclick="showTab('customers')">👥 ลูกค้า</button>
                <button class="nav-tab" onclick="showTab('reports')">📈 รายงาน</button>
                ${currentUser.role === 'admin' ? '<button class="nav-tab" onclick="showTab(\'settings\')">⚙️ ตั้งค่า</button>' : ''}
            </nav>

            <!-- Main Content -->
            <main class="main-content" id="mainContent">
                <!-- เนื้อหาจะถูกโหลดที่นี่ -->
            </main>
        </div>
    `;
    
    showTab('pos');
}

// แสดงแท็บต่างๆ
function showTab(tabName) {
    // อัปเดตแท็บที่ active
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    const mainContent = document.getElementById('mainContent');
    
    switch(tabName) {
        case 'pos':
            showPOSInterface();
            break;
        case 'products':
            showProductsInterface();
            break;
        case 'customers':
            showCustomersInterface();
            break;
        case 'reports':
            showReportsInterface();
            break;
        case 'settings':
            if (currentUser.role === 'admin') {
                showSettingsInterface();
            }
            break;
    }
}

// หน้าจอขายสินค้า (POS)
function showPOSInterface() {
    document.getElementById('mainContent').innerHTML = `
        <div class="pos-container">
            <div class="pos-left">
                <div class="search-section">
                    <input type="text" id="productSearch" placeholder="ค้นหาสินค้า..." onkeyup="searchProducts()">
                    <select id="categoryFilter" onchange="filterProducts()">
                        <option value="">ทุกหมวดหมู่</option>
                    </select>
                </div>
                <div class="products-grid" id="productsGrid">
                    <!-- สินค้าจะแสดงที่นี่ -->
                </div>
            </div>
            
            <div class="pos-right">
                <div class="customer-section">
                    <select id="customerSelect" onchange="selectCustomer()">
                        <option value="">เลือกลูกค้า (ไม่บังคับ)</option>
                    </select>
                    <button onclick="showAddCustomerModal()" class="add-btn">เพิ่มลูกค้า</button>
                </div>
                
                <div class="cart-section">
                    <h3>รายการสินค้า</h3>
                    <div class="cart-items" id="cartItems">
                        <!-- รายการสินค้าในตะกร้า -->
                    </div>
                    <div class="cart-total">
                        <strong>รวมทั้งสิ้น: <span id="totalAmount">0</span> บาท</strong>
                    </div>
                    <div class="cart-actions">
                        <button onclick="clearCart()" class="clear-btn">ล้างตะกร้า</button>
                        <button onclick="processPayment()" class="checkout-btn">ชำระเงิน</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    loadPOSData();
}

// โหลดข้อมูลสำหรับ POS
function loadPOSData() {
    loadProductsGrid();
    loadCustomerSelect();
    updateCart();
}

function loadProductsGrid() {
    const grid = document.getElementById('productsGrid');
    const categoryFilter = document.getElementById('categoryFilter');
    
    // โหลดหมวดหมู่
    const categories = [...new Set(products.map(p => p.category))];
    categoryFilter.innerHTML = '<option value="">ทุกหมวดหมู่</option>';
    categories.forEach(cat => {
        categoryFilter.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
    
    // แสดงสินค้า
    grid.innerHTML = '';
    filteredProducts.forEach(product => {
        grid.innerHTML += `
            <div class="product-card" onclick="addToCart(${product.id})">
                <div class="product-info">
                    <h4>${product.name}</h4>
                    <p class="product-code">${product.code}</p>
                    <p class="product-category">${product.category}</p>
                    <div class="product-prices">
                        <span class="retail-price">ขายปลีก: ${product.retailPrice}฿</span>
                        <span class="wholesale-price">ขายส่g: ${product.wholesalePrice}฿</span>
                        ${product.promoPrice > 0 ? `<span class="promo-price">โปรโมชั่น: ${product.promoPrice}฿</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    });
}

function searchProducts() {
    const searchTerm = document.getElementById('productSearch').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;
    
    filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm) || 
                            product.code.toLowerCase().includes(searchTerm);
        const matchesCategory = !category || product.category === category;
        return matchesSearch && matchesCategory;
    });
    
    loadProductsGrid();
}

function filterProducts() {
    searchProducts(); // ใช้ฟังก์ชันเดียวกัน
}

function loadCustomerSelect() {
    const select = document.getElementById('customerSelect');
    select.innerHTML = '<option value="">เลือกลูกค้า (ไม่บังคับ)</option>';
    customers.forEach(customer => {
        select.innerHTML += `<option value="${customer.id}">${customer.name}</option>`;
    });
}

function selectCustomer() {
    const customerId = document.getElementById('customerSelect').value;
    if (customerId) {
        currentSale.customer = customers.find(c => c.id == customerId);
    } else {
        currentSale.customer = null;
    }
}

// จัดการตะกร้าสินค้า
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // เช็คว่ามีสินค้านี้ในตะกร้าแล้วหรือไม่
    const existingItem = currentSale.items.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        currentSale.items.push({
            ...product,
            quantity: 1,
            unit: 'piece',
            priceType: 'retail',
            discount: 0
        });
    }
    
    updateCart();
}

function updateCart() {
    const cartItems = document.getElementById('cartItems');
    const totalAmount = document.getElementById('totalAmount');
    
    if (!cartItems || !totalAmount) return;
    
    cartItems.innerHTML = '';
    let total = 0;
    
    currentSale.items.forEach((item, index) => {
        const unitPrice = getItemPrice(item);
        const unitMultiplier = item.unit === 'box' ? item.boxQty : 1;
        const lineTotal = unitPrice * unitMultiplier * item.quantity;
        const discountAmount = lineTotal * (item.discount / 100);
        const finalPrice = lineTotal - discountAmount;
        
        total += finalPrice;
        
        cartItems.innerHTML += `
            <div class="cart-item">
                <div class="item-info">
                    <h5>${item.name}</h5>
                    <p>${item.code}</p>
                </div>
                <div class="item-controls">
                    <select onchange="updateItemUnit(${index}, this.value)">
                        <option value="piece" ${item.unit === 'piece' ? 'selected' : ''}>ชิ้น</option>
                        <option value="box" ${item.unit === 'box' ? 'selected' : ''}>กล่อง (${item.boxQty} ชิ้น)</option>
                    </select>
                    <select onchange="updateItemPriceType(${index}, this.value)">
                        <option value="retail" ${item.priceType === 'retail' ? 'selected' : ''}>ราคาปลีก</option>
                        <option value="wholesale" ${item.priceType === 'wholesale' ? 'selected' : ''}>ราคาส่ง</option>
                        ${item.promoPrice > 0 ? `<option value="promo" ${item.priceType === 'promo' ? 'selected' : ''}>ราคาโปรโมชั่น</option>` : ''}
                    </select>
                    <input type="number" value="${item.quantity}" min="1" onchange="updateItemQuantity(${index}, this.value)">
                    <input type="number" value="${item.discount}" min="0" max="100" placeholder="ส่วนลด%" onchange="updateItemDiscount(${index}, this.value)">
                    <button onclick="removeFromCart(${index})" class="remove-btn">ลบ</button>
                </div>
                <div class="item-price">
                    <span class="unit-price">${unitPrice}฿/${item.unit === 'box' ? 'กล่อง' : 'ชิ้น'}</span>
                    <span class="line-total">${finalPrice.toFixed(2)}฿</span>
                </div>
            </div>
        `;
    });
    
    currentSale.total = total;
    totalAmount.textContent = total.toFixed(2);
}

function getItemPrice(item) {
    switch(item.priceType) {
        case 'wholesale': return item.wholesalePrice;
        case 'promo': return item.promoPrice;
        default: return item.retailPrice;
    }
}

function updateItemQuantity(index, quantity) {
    currentSale.items[index].quantity = parseInt(quantity) || 1;
    updateCart();
}

function updateItemUnit(index, unit) {
    currentSale.items[index].unit = unit;
    updateCart();
}

function updateItemPriceType(index, priceType) {
    currentSale.items[index].priceType = priceType;
    updateCart();
}

function updateItemDiscount(index, discount) {
    currentSale.items[index].discount = parseFloat(discount) || 0;
    updateCart();
}

function removeFromCart(index) {
    currentSale.items.splice(index, 1);
    updateCart();
}

function clearCart() {
    currentSale = { items: [], total: 0, customer: null };
    document.getElementById('customerSelect').value = '';
    updateCart();
}

function processPayment() {
    if (currentSale.items.length === 0) {
        showNotification('ไม่มีสินค้าในตะกร้า', 'error');
        return;
    }
    
    // บันทึกการขาย
    const sale = {
        id: nextSaleId++,
        date: new Date().toISOString(),
        items: [...currentSale.items],
        total: currentSale.total,
        customer: currentSale.customer,
        seller: currentUser
    };
    
    sales.push(sale);
    saveData();
    
    // แสดงใบเสร็จ
    showReceipt(sale);
    
    // ล้างตะกร้า
    clearCart();
    
    showNotification('บันทึกการขายสำเร็จ', 'success');
}

function showReceipt(sale) {
    const receiptWindow = window.open('', '_blank', 'width=400,height=600');
    const receiptContent = `
        <html>
        <head>
            <title>ใบเสร็จ</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .header { text-align: center; margin-bottom: 20px; }
                .item { margin: 5px 0; }
                .total { border-top: 1px solid #ccc; margin-top: 10px; padding-top: 10px; font-weight: bold; }
                @media print { button { display: none; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>Ball Build Supply</h2>
                <p>ใบเสร็จรับเงิน</p>
                <p>วันที่: ${new Date(sale.date).toLocaleString('th-TH')}</p>
                <p>เลขที่: ${sale.id}</p>
                ${sale.customer ? `<p>ลูกค้า: ${sale.customer.name}</p>` : ''}
                <p>พนักงานขาย: ${sale.seller.fullName}</p>
            </div>
            
            <div class="items">
                ${sale.items.map(item => {
                    const unitPrice = getItemPrice(item);
                    const unitMultiplier = item.unit === 'box' ? item.boxQty : 1;
                    const lineTotal = unitPrice * unitMultiplier * item.quantity;
                    const discountAmount = lineTotal * (item.discount / 100);
                    const finalPrice = lineTotal - discountAmount;
                    
                    return `
                        <div class="item">
                            ${item.name} (${item.code})<br>
                            ${item.quantity} ${item.unit === 'box' ? 'กล่อง' : 'ชิ้น'} × ${unitPrice}฿
                            ${item.discount > 0 ? ` - ส่วนลด ${item.discount}%` : ''}
                            = ${finalPrice.toFixed(2)}฿
                        </div>
                    `;
                }).join('')}
            </div>
            
            <div class="total">
                รวมทั้งสิ้น: ${sale.total.toFixed(2)} บาท
            </div>
            
            <button onclick="window.print()">พิมพ์ใบเสร็จ</button>
            <button onclick="window.close()">ปิด</button>
        </body>
        </html>
    `;
    
    receiptWindow.document.write(receiptContent);
    receiptWindow.document.close();
}

// จัดการสินค้า
function showProductsInterface() {
    document.getElementById('mainContent').innerHTML = `
        <div class="products-management">
            <div class="section-header">
                <h2>จัดการสินค้า</h2>
                <button onclick="showAddProductModal()" class="add-btn">เพิ่มสินค้าใหม่</button>
            </div>
            
            <div class="search-bar">
                <input type="text" id="productSearchManage" placeholder="ค้นหาสินค้า..." onkeyup="searchProductsManage()">
                <select id="categoryFilterManage" onchange="filterProductsManage()">
                    <option value="">ทุกหมวดหมู่</option>
                </select>
            </div>
            
            <div class="products-table">
                <table>
                    <thead>
                        <tr>
                            <th>รหัสสินค้า</th>
                            <th>ชื่อสินค้า</th>
                            <th>หมวดหมู่</th>
                            <th>จำนวนต่อหน่วย</th>
                            <th>จำนวนต่อกล่อง</th>
                            <th>ราคาปลีก</th>
                            <th>ราคาส่ง</th>
                            <th>ราคาโปรโมชั่น</th>
                            <th>จัดการ</th>
                        </tr>
                    </thead>
                    <tbody id="productsTableBody">
                        <!-- ข้อมูลสินค้า -->
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    loadProductsTable();
}

function loadProductsTable() {
    const tbody = document.getElementById('productsTableBody');
    const categoryFilter = document.getElementById('categoryFilterManage');
    
    // โหลดหมวดหมู่
    const categories = [...new Set(products.map(p => p.category))];
    categoryFilter.innerHTML = '<option value="">ทุกหมวดหมู่</option>';
    categories.forEach(cat => {
        categoryFilter.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
    
    // แสดงสินค้า
    tbody.innerHTML = '';
    filteredProducts.forEach(product => {
        tbody.innerHTML += `
            <tr>
                <td>${product.code}</td>
                <td>${product.name}</td>
                <td>${product.category}</td>
                <td>${product.unitQty}</td>
                <td>${product.boxQty}</td>
                <td>${product.retailPrice}</td>
                <td>${product.wholesalePrice}</td>
                <td>${product.promoPrice}</td>
                <td>
                    <button onclick="editProduct(${product.id})" class="edit-btn">แก้ไข</button>
                    <button onclick="deleteProduct(${product.id})" class="delete-btn">ลบ</button>
                </td>
            </tr>
        `;
    });
}

function searchProductsManage() {
    const searchTerm = document.getElementById('productSearchManage').value.toLowerCase();
    const category = document.getElementById('categoryFilterManage').value;
    
    filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm) || 
                            product.code.toLowerCase().includes(searchTerm);
        const matchesCategory = !category || product.category === category;
        return matchesSearch && matchesCategory;
    });
    
    loadProductsTable();
}

function filterProductsManage() {
    searchProductsManage();
}

function showAddProductModal() {
    showProductModal();
}

function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    showProductModal(product);
}

function showProductModal(product = null) {
    const isEdit = product !== null;
    const modalContent = `
        <div class="modal-overlay" onclick="closeModal()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>${isEdit ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}</h3>
                    <span class="close-btn" onclick="closeModal()">&times;</span>
                </div>
                <div class="modal-body">
                    <form onsubmit="saveProduct(event, ${isEdit ? product.id : 'null'})">
                        <div class="form-group">
                            <label>รหัสสินค้า:</label>
                            <input type="text" id="productCode" value="${product ? product.code : ''}" required>
                        </div>
                        <div class="form-group">
                            <label>ชื่อสินค้า:</label>
                            <input type="text" id="productName" value="${product ? product.name : ''}" required>
                        </div>
                        <div class="form-group">
                            <label>หมวดหมู่:</label>
                            <input type="text" id="productCategory" value="${product ? product.category : ''}" required>
                        </div>
                        <div class="form-group">
                            <label>จำนวนต่อหน่วย:</label>
                            <input type="number" id="productUnitQty" value="${product ? product.unitQty : 1}" min="1" required>
                        </div>
                        <div class="form-group">
                            <label>จำนวนต่อกล่อง:</label>
                            <input type="number" id="productBoxQty" value="${product ? product.boxQty : 1}" min="1" required>
                        </div>
                        <div class="form-group">
                            <label>ราคาปลีก:</label>
                            <input type="number" id="productRetailPrice" value="${product ? product.retailPrice : ''}" step="0.01" min="0" required>
                        </div>
                        <div class="form-group">
                            <label>ราคาส่ง:</label>
                            <input type="number" id="productWholesalePrice" value="${product ? product.wholesalePrice : ''}" step="0.01" min="0" required>
                        </div>
                        <div class="form-group">
                            <label>ราคาโปรโมชั่น:</label>
                            <input type="number" id="productPromoPrice" value="${product ? product.promoPrice : 0}" step="0.01" min="0">
                        </div>
                        <div class="form-actions">
                            <button type="button" onclick="closeModal()" class="cancel-btn">ยกเลิก</button>
                            <button type="submit" class="save-btn">${isEdit ? 'บันทึก' : 'เพิ่มสินค้า'}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalContent);
}

function saveProduct(event, productId) {
    event.preventDefault();
    
    const productData = {
        code: document.getElementById('productCode').value,
        name: document.getElementById('productName').value,
        category: document.getElementById('productCategory').value,
        unitQty: parseInt(document.getElementById('productUnitQty').value),
        boxQty: parseInt(document.getElementById('productBoxQty').value),
        retailPrice: parseFloat(document.getElementById('productRetailPrice').value),
        wholesalePrice: parseFloat(document.getElementById('productWholesalePrice').value),
        promoPrice: parseFloat(document.getElementById('productPromoPrice').value) || 0
    };
    
    if (productId) {
        // แก้ไขสินค้า
        const index = products.findIndex(p => p.id === productId);
        products[index] = { ...products[index], ...productData };
    } else {
        // เพิ่มสินค้าใหม่
        productData.id = nextProductId++;
        products.push(productData);
    }
    
    saveData();
    filteredProducts = [...products];
    loadProductsTable();
    closeModal();
    showNotification(productId ? 'แก้ไขสินค้าสำเร็จ' : 'เพิ่มสินค้าสำเร็จ', 'success');
}

function deleteProduct(productId) {
    if (confirm('คุณต้องการลบสินค้านี้หรือไม่?')) {
        products = products.filter(p => p.id !== productId);
        saveData();
        filteredProducts = [...products];
        loadProductsTable();
        showNotification('ลบสินค้าสำเร็จ', 'success');
    }
}

// จัดการลูกค้า
function showCustomersInterface() {
    document.getElementById('mainContent').innerHTML = `
        <div class="customers-management">
            <div class="section-header">
                <h2>จัดการลูกค้า</h2>
                <button onclick="showAddCustomerModal()" class="add-btn">เพิ่มลูกค้าใหม่</button>
            </div>
            
            <div class="search-bar">
                <input type="text" id="customerSearch" placeholder="ค้นหาลูกค้า..." onkeyup="searchCustomers()">
            </div>
            
            <div class="customers-table">
                <table>
                    <thead>
                        <tr>
                            <th>ชื่อลูกค้า</th>
                            <th>ที่อยู่</th>
                            <th>เบอร์โทร</th>
                            <th>เลขประจำตัวผู้เสียภาษี</th>
                            <th>จัดการ</th>
                        </tr>
                    </thead>
                    <tbody id="customersTableBody">
                        <!-- ข้อมูลลูกค้า -->
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    loadCustomersTable();
}

function loadCustomersTable() {
    const tbody = document.getElementById('customersTableBody');
    tbody.innerHTML = '';
    
    customers.forEach(customer => {
        tbody.innerHTML += `
            <tr>
                <td>${customer.name}</td>
                <td>${customer.address || '-'}</td>
                <td>${customer.phone || '-'}</td>
                <td>${customer.taxId || '-'}</td>
                <td>
                    <button onclick="editCustomer(${customer.id})" class="edit-btn">แก้ไข</button>
                    <button onclick="deleteCustomer(${customer.id})" class="delete-btn">ลบ</button>
                </td>
            </tr>
        `;
    });
}

function searchCustomers() {
    const searchTerm = document.getElementById('customerSearch').value.toLowerCase();
    const filteredCustomers = customers.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm) ||
        (customer.phone && customer.phone.includes(searchTerm)) ||
        (customer.taxId && customer.taxId.includes(searchTerm))
    );
    
    const tbody = document.getElementById('customersTableBody');
    tbody.innerHTML = '';
    
    filteredCustomers.forEach(customer => {
        tbody.innerHTML += `
            <tr>
                <td>${customer.name}</td>
                <td>${customer.address || '-'}</td>
                <td>${customer.phone || '-'}</td>
                <td>${customer.taxId || '-'}</td>
                <td>
                    <button onclick="editCustomer(${customer.id})" class="edit-btn">แก้ไข</button>
                    <button onclick="deleteCustomer(${customer.id})" class="delete-btn">ลบ</button>
                </td>
            </tr>
        `;
    });
}

function showAddCustomerModal() {
    showCustomerModal();
}

function editCustomer(customerId) {
    const customer = customers.find(c => c.id === customerId);
    showCustomerModal(customer);
}

function showCustomerModal(customer = null) {
    const isEdit = customer !== null;
    const modalContent = `
        <div class="modal-overlay" onclick="closeModal()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>${isEdit ? 'แก้ไขลูกค้า' : 'เพิ่มลูกค้าใหม่'}</h3>
                    <span class="close-btn" onclick="closeModal()">&times;</span>
                </div>
                <div class="modal-body">
                    <form onsubmit="saveCustomer(event, ${isEdit ? customer.id : 'null'})">
                        <div class="form-group">
                            <label>ชื่อลูกค้า:</label>
                            <input type="text" id="customerName" value="${customer ? customer.name : ''}" required>
                        </div>
                        <div class="form-group">
                            <label>ที่อยู่:</label>
                            <textarea id="customerAddress" rows="3">${customer ? customer.address || '' : ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label>เบอร์โทร:</label>
                            <input type="tel" id="customerPhone" value="${customer ? customer.phone || '' : ''}">
                        </div>
                        <div class="form-group">
                            <label>เลขประจำตัวผู้เสียภาษี:</label>
                            <input type="text" id="customerTaxId" value="${customer ? customer.taxId || '' : ''}">
                        </div>
                        <div class="form-actions">
                            <button type="button" onclick="closeModal()" class="cancel-btn">ยกเลิก</button>
                            <button type="submit" class="save-btn">${isEdit ? 'บันทึก' : 'เพิ่มลูกค้า'}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalContent);
}

function saveCustomer(event, customerId) {
    event.preventDefault();
    
    const customerData = {
        name: document.getElementById('customerName').value,
        address: document.getElementById('customerAddress').value,
        phone: document.getElementById('customerPhone').value,
        taxId: document.getElementById('customerTaxId').value
    };
    
    if (customerId) {
        // แก้ไขลูกค้า
        const index = customers.findIndex(c => c.id === customerId);
        customers[index] = { ...customers[index], ...customerData };
    } else {
        // เพิ่มลูกค้าใหม่
        customerData.id = nextCustomerId++;
        customers.push(customerData);
    }
    
    saveData();
    loadCustomersTable();
    closeModal();
    showNotification(customerId ? 'แก้ไขลูกค้าสำเร็จ' : 'เพิ่มลูกค้าสำเร็จ', 'success');
}

function deleteCustomer(customerId) {
    if (confirm('คุณต้องการลบลูกค้านี้หรือไม่?')) {
        customers = customers.filter(c => c.id !== customerId);
        saveData();
        loadCustomersTable();
        showNotification('ลบลูกค้าสำเร็จ', 'success');
    }
}

// รายงาน
function showReportsInterface() {
    document.getElementById('mainContent').innerHTML = `
        <div class="reports-section">
            <div class="section-header">
                <h2>รายงานการขาย</h2>
                <div class="date-filter">
                    <input type="date" id="startDate" onchange="filterSalesReport()">
                    <span>ถึง</span>
                    <input type="date" id="endDate" onchange="filterSalesReport()">
                    <button onclick="resetDateFilter()" class="reset-btn">รีเซ็ต</button>
                </div>
            </div>
            
            <div class="summary-cards">
                <div class="summary-card">
                    <h3>ยอดขายรวม</h3>
                    <div class="summary-value" id="totalSalesAmount">0 บาท</div>
                </div>
                <div class="summary-card">
                    <h3>จำนวนการขาย</h3>
                    <div class="summary-value" id="totalSalesCount">0 รายการ</div>
                </div>
                <div class="summary-card">
                    <h3>ยอดขายเฉลี่ย</h3>
                    <div class="summary-value" id="averageSaleAmount">0 บาท</div>
                </div>
                <div class="summary-card">
                    <h3>สินค้าที่ขายได้มากที่สุด</h3>
                    <div class="summary-value" id="topProduct">-</div>
                </div>
            </div>
            
            <div class="sales-table">
                <table>
                    <thead>
                        <tr>
                            <th>เลขที่</th>
                            <th>วันที่</th>
                            <th>ลูกค้า</th>
                            <th>พนักงานขาย</th>
                            <th>จำนวนรายการ</th>
                            <th>ยอดรวม</th>
                            <th>รายละเอียด</th>
                        </tr>
                    </thead>
                    <tbody id="salesTableBody">
                        <!-- ข้อมูลการขาย -->
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    loadSalesReport();
}

function loadSalesReport() {
    const tbody = document.getElementById('salesTableBody');
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    let filteredSales = [...sales];
    
    if (startDate || endDate) {
        filteredSales = sales.filter(sale => {
            const saleDate = new Date(sale.date).toISOString().split('T')[0];
            if (startDate && endDate) {
                return saleDate >= startDate && saleDate <= endDate;
            } else if (startDate) {
                return saleDate >= startDate;
            } else if (endDate) {
                return saleDate <= endDate;
            }
            return true;
        });
    }
    
    // อัปเดตสรุป
    updateSalesSummary(filteredSales);
    
    // แสดงรายการขาย
    tbody.innerHTML = '';
    filteredSales.reverse().forEach(sale => {
        tbody.innerHTML += `
            <tr>
                <td>${sale.id}</td>
                <td>${new Date(sale.date).toLocaleDateString('th-TH')}</td>
                <td>${sale.customer ? sale.customer.name : 'ไม่ระบุ'}</td>
                <td>${sale.seller ? sale.seller.fullName : '-'}</td>
                <td>${sale.items.length}</td>
                <td>${sale.total.toFixed(2)} บาท</td>
                <td><button onclick="showSaleDetails(${sale.id})" class="view-btn">ดูรายละเอียด</button></td>
            </tr>
        `;
    });
}

function updateSalesSummary(filteredSales) {
    const totalAmount = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalCount = filteredSales.length;
    const averageAmount = totalCount > 0 ? totalAmount / totalCount : 0;
    
    // หาสินค้าที่ขายได้มากที่สุด
    const productSales = {};
    filteredSales.forEach(sale => {
        sale.items.forEach(item => {
            if (productSales[item.name]) {
                productSales[item.name] += item.quantity;
            } else {
                productSales[item.name] = item.quantity;
            }
        });
    });
    
    const topProduct = Object.keys(productSales).length > 0 
        ? Object.keys(productSales).reduce((a, b) => productSales[a] > productSales[b] ? a : b)
        : '-';
    
    document.getElementById('totalSalesAmount').textContent = totalAmount.toFixed(2) + ' บาท';
    document.getElementById('totalSalesCount').textContent = totalCount + ' รายการ';
    document.getElementById('averageSaleAmount').textContent = averageAmount.toFixed(2) + ' บาท';
    document.getElementById('topProduct').textContent = topProduct;
}

function filterSalesReport() {
    loadSalesReport();
}

function resetDateFilter() {
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    loadSalesReport();
}

function showSaleDetails(saleId) {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;
    
    const modalContent = `
        <div class="modal-overlay" onclick="closeModal()">
            <div class="modal-content large-modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>รายละเอียดการขาย #${sale.id}</h3>
                    <span class="close-btn" onclick="closeModal()">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="sale-info">
                        <p><strong>วันที่:</strong> ${new Date(sale.date).toLocaleString('th-TH')}</p>
                        <p><strong>ลูกค้า:</strong> ${sale.customer ? sale.customer.name : 'ไม่ระบุ'}</p>
                        <p><strong>พนักงานขาย:</strong> ${sale.seller ? sale.seller.fullName : '-'}</p>
                    </div>
                    
                    <div class="sale-items">
                        <h4>รายการสินค้า</h4>
                        <table>
                            <thead>
                                <tr>
                                    <th>สินค้า</th>
                                    <th>จำนวน</th>
                                    <th>หน่วย</th>
                                    <th>ราคา</th>
                                    <th>ส่วนลด</th>
                                    <th>รวม</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${sale.items.map(item => {
                                    const unitPrice = getItemPrice(item);
                                    const unitMultiplier = item.unit === 'box' ? item.boxQty : 1;
                                    const lineTotal = unitPrice * unitMultiplier * item.quantity;
                                    const discountAmount = lineTotal * (item.discount / 100);
                                    const finalPrice = lineTotal - discountAmount;
                                    
                                    return `
                                        <tr>
                                            <td>${item.name} (${item.code})</td>
                                            <td>${item.quantity}</td>
                                            <td>${item.unit === 'box' ? 'กล่อง' : 'ชิ้น'}</td>
                                            <td>${unitPrice} บาท</td>
                                            <td>${item.discount}%</td>
                                            <td>${finalPrice.toFixed(2)} บาท</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="sale-total">
                        <h4>รวมทั้งสิ้น: ${sale.total.toFixed(2)} บาท</h4>
                    </div>
                    
                    <div class="modal-actions">
                        <button onclick="printSaleReceipt(${sale.id})" class="print-btn">พิมพ์ใบเสร็จ</button>
                        <button onclick="closeModal()" class="close-btn">ปิด</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalContent);
}

function printSaleReceipt(saleId) {
    const sale = sales.find(s => s.id === saleId);
    if (sale) {
        showReceipt(sale);
    }
}

// ตั้งค่า (เฉพาะ Admin)
function showSettingsInterface() {
    if (currentUser.role !== 'admin') return;
    
    document.getElementById('mainContent').innerHTML = `
        <div class="settings-section">
            <div class="section-header">
                <h2>ตั้งค่าระบบ</h2>
            </div>
            
            <div class="settings-tabs">
                <button class="settings-tab active" onclick="showSettingsTab('users')">จัดการผู้ใช้</button>
                <button class="settings-tab" onclick="showSettingsTab('sync')">การซิงค์ข้อมูล</button>
                <button class="settings-tab" onclick="showSettingsTab('backup')">สำรองข้อมูล</button>
            </div>
            
            <div class="settings-content" id="settingsContent">
                <!-- เนื้อหาการตั้งค่า -->
            </div>
        </div>
    `;
    
    showSettingsTab('users');
}

function showSettingsTab(tabName) {
    // อัปเดตแท็บที่ active
    document.querySelectorAll('.settings-tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    const content = document.getElementById('settingsContent');
    
    switch(tabName) {
        case 'users':
            showUsersSettings();
            break;
        case 'sync':
            showSyncSettings();
            break;
        case 'backup':
            showBackupSettings();
            break;
    }
}

function showUsersSettings() {
    document.getElementById('settingsContent').innerHTML = `
        <div class="users-settings">
            <div class="section-header">
                <h3>จัดการผู้ใช้งาน</h3>
                <button onclick="showAddUserModal()" class="add-btn">เพิ่มผู้ใช้ใหม่</button>
            </div>
            
            <div class="users-table">
                <table>
                    <thead>
                        <tr>
                            <th>ชื่อผู้ใช้</th>
                            <th>ชื่อเต็ม</th>
                            <th>บทบาท</th>
                            <th>สถานะ</th>
                            <th>จัดการ</th>
                        </tr>
                    </thead>
                    <tbody id="usersTableBody">
                        <!-- ข้อมูลผู้ใช้ -->
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    loadUsersTable();
}

function loadUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';
    
    users.forEach(user => {
        tbody.innerHTML += `
            <tr>
                <td>${user.username}</td>
                <td>${user.fullName}</td>
                <td>${user.role === 'admin' ? 'ผู้ดูแลระบบ' : 'พนักงาน'}</td>
                <td>
                    <span class="status ${user.active ? 'active' : 'inactive'}">
                        ${user.active ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                    </span>
                </td>
                <td>
                    <button onclick="editUser(${user.id})" class="edit-btn">แก้ไข</button>
                    ${currentUser.id !== user.id ? `<button onclick="toggleUserStatus(${user.id})" class="toggle-btn">${user.active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}</button>` : ''}
                </td>
            </tr>
        `;
    });
}

function showSyncSettings() {
    const lastSyncTime = DataManager.load('lastSyncTime');
    const lastSyncDisplay = lastSyncTime ? new Date(lastSyncTime).toLocaleString('th-TH') : 'ยังไม่เคยซิงค์';
    
    document.getElementById('settingsContent').innerHTML = `
        <div class="sync-settings">
            <h3>การซิงค์ข้อมูลกับ Google Sheets</h3>
            
            <div class="sync-status">
                <p><strong>สถานะการซิงค์:</strong> ${DataManager.syncEnabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}</p>
                <p><strong>ซิงค์ล่าสุด:</strong> ${lastSyncDisplay}</p>
                <p><strong>Google Script URL:</strong></p>
                <input type="text" id="googleScriptUrl" value="${DataManager.GOOGLE_SCRIPT_URL}" style="width: 100%; margin: 10px 0;">
            </div>
            
            <div class="sync-actions">
                <button onclick="toggleSync()" class="toggle-btn">
                    ${DataManager.syncEnabled ? 'ปิดการซิงค์อัตโนมัติ' : 'เปิดการซิงค์อัตโนมัติ'}
                </button>
                <button onclick="updateGoogleScriptUrl()" class="save-btn">อัปเดต URL</button>
                <button onclick="testConnection()" class="test-btn">ทดสอบการเชื่อมต่อ</button>
                <button onclick="manualSync()" class="sync-btn">ซิงค์ข้อมูลทันที</button>
                <button onclick="loadFromGoogle()" class="load-btn">โหลดข้อมูลจาก Google Sheets</button>
            </div>
            
            <div class="sync-instructions">
                <h4>วิธีการตั้งค่า Google Apps Script:</h4>
                <ol>
                    <li>ไปที่ <a href="https://script.google.com" target="_blank">script.google.com</a></li>
                    <li>สร้าง New project</li>
                    <li>วางโค้ด Google Apps Script ที่ได้รับ</li>
                    <li>แก้ไข SHEET_ID ให้ตรงกับ Google Sheets ของคุณ</li>
                    <li>Deploy เป็น Web app</li>
                    <li>คัดลอก URL มาใส่ในช่องด้านบน</li>
                </ol>
            </div>
        </div>
    `;
