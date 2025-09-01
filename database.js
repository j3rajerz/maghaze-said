let db;
let dbFileSha; // To store the SHA of the database file for updates

// آماده‌سازی دیتابیس
initDatabase();

async function initDatabase() {
    const SQL = await initSqlJs({
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
    });

    try {
        const response = await fetch('http://localhost:3001/api/db');

        if (response.ok) {
            const data = await response.json();
            dbFileSha = data.sha;
            const dbContent = atob(data.content);
            const dbArray = new Uint8Array(dbContent.length);
            for (let i = 0; i < dbContent.length; i++) {
                dbArray[i] = dbContent.charCodeAt(i);
            }
            db = new SQL.Database(dbArray);
            console.log("✅ Database loaded from server");
        } else {
            // If the file doesn't exist, create it
            db = new SQL.Database();
            createTables();
            await saveDBToGitHub(true); // Initial commit
            console.log("✅ New database created and saved to server");
        }
    } catch (error) {
        console.error("❌ Error initializing database from server:", error);
        // Fallback to a local database if the server fails
        db = new SQL.Database();
        createTables();
    }
}

function createTables() {
    db.run(`
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            phone TEXT,
            address TEXT,
            notes TEXT
        );
        
        CREATE TABLE IF NOT EXISTS services (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER,
            date TEXT,
            service_type TEXT,
            description TEXT,
            cost REAL,
            parts_used TEXT,
            payment_method TEXT
        );

        CREATE TABLE IF NOT EXISTS parts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            stock INTEGER,
            price REAL
        );

        CREATE TABLE IF NOT EXISTS checks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER,
            amount REAL,
            bank TEXT,
            issue_date TEXT,
            due_date TEXT,
            status TEXT
        );

        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT,
            amount REAL,
            description TEXT,
            date TEXT
        );
    `);
    console.log("✅ Tables created");
}

// افزودن مشتری
async function addCustomer(name, phone, address, notes) {
    db.run("INSERT INTO customers (name, phone, address, notes) VALUES (?, ?, ?, ?)", [name, phone, address, notes]);
    await saveDBToGitHub();
    console.log("✅ Customer added");
}

// گرفتن لیست مشتریان
function getCustomers() {
    const stmt = db.prepare("SELECT * FROM customers");
    const rows = [];
    while (stmt.step()) {
        rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
}

// ذخیره دیتابیس در فایل (Export)
// خروجی گرفتن از دیتابیس
function exportDB() {
    try {
        const data = db.export();
        const blob = new Blob([data], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "repair_shop.db";
        a.click();
        console.log("💾 Database exported");
    } catch (e) {
        console.error("❌ Export failed:", e);
    }
}

// بارگذاری دیتابیس
async function importDB(file) {
    try {
        const buffer = await file.arrayBuffer();
        const SQL = await initSqlJs({
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        });
        db = new SQL.Database(new Uint8Array(buffer));
        console.log("📂 Database imported");

        // بعد از بارگذاری دیتابیس همه بخش‌ها رو رفرش کن
        renderCustomers();
        renderServices();
        renderParts();
        renderChecks();
        renderReports();

        showNotification("✅ دیتابیس با موفقیت بارگذاری شد");
    } catch (e) {
        console.error("❌ Import failed:", e);
    }
}
// افزودن خدمت جدید
async function addService(customer_id, date, service_type, description, cost, parts_used, payment_method) {
    db.run(`
        INSERT INTO services (customer_id, date, service_type, description, cost, parts_used, payment_method)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [customer_id, date, service_type, description, cost, parts_used, payment_method]);
    await saveDBToGitHub();
    console.log("✅ Service added");
}

// گرفتن لیست خدمات
function getServices() {
    const stmt = db.prepare("SELECT * FROM services");
    const rows = [];
    while (stmt.step()) {
        rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
}
// افزودن قطعه جدید
async function addPart(name, stock, price) {
    db.run("INSERT INTO parts (name, stock, price) VALUES (?, ?, ?)", [name, stock, price]);
    await saveDBToGitHub();
    console.log("✅ Part added");
}

// گرفتن لیست قطعات
function getParts() {
    const stmt = db.prepare("SELECT * FROM parts");
    const rows = [];
    while (stmt.step()) {
        rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
}

// کاهش موجودی هنگام استفاده
async function reducePartStock(partName, qty) {
    db.run("UPDATE parts SET stock = stock - ? WHERE name = ?", [qty, partName]);
    await saveDBToGitHub();
    console.log("📉 Stock reduced for:", partName);
}
// افزودن چک جدید
async function addCheck(customer_id, amount, bank, issue_date, due_date, status) {
    db.run(`
        INSERT INTO checks (customer_id, amount, bank, issue_date, due_date, status)
        VALUES (?, ?, ?, ?, ?, ?)
    `, [customer_id, amount, bank, issue_date, due_date, status]);
    await saveDBToGitHub();
    console.log("✅ Check added");
}

// گرفتن لیست چک‌ها
function getChecks() {
    const stmt = db.prepare("SELECT * FROM checks");
    const rows = [];
    while (stmt.step()) {
        rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
}

// تغییر وضعیت چک
async function updateCheckStatus(id, newStatus) {
    db.run("UPDATE checks SET status = ? WHERE id = ?", [newStatus, id]);
    await saveDBToGitHub();
    console.log("🔄 Check status updated:", id, newStatus);
}
// مجموع درآمد در یک روز مشخص
function getDailyIncome(date) {
    const stmt = db.prepare("SELECT SUM(cost) as total FROM services WHERE date = ?");
    stmt.bind([date]);
    let total = 0;
    if (stmt.step()) {
        total = stmt.getAsObject().total || 0;
    }
    stmt.free();
    return total;
}

// مجموع درآمد در ماه مشخص (YYYY-MM)
function getMonthlyIncome(month) {
    const stmt = db.prepare("SELECT SUM(cost) as total FROM services WHERE substr(date, 1, 7) = ?");
    stmt.bind([month]);
    let total = 0;
    if (stmt.step()) {
        total = stmt.getAsObject().total || 0;
    }
    stmt.free();
    return total;
}

// مشتریان بدهکار (پرداخت = اعتبار یا چک پاس‌نشده)
function getDebtors() {
    const stmt = db.prepare("SELECT customer_id, SUM(cost) as debt FROM services WHERE payment_method IN ('credit', 'check') GROUP BY customer_id HAVING debt > 0");
    const rows = [];
    while (stmt.step()) {
        rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
}

// پرمصرف‌ترین قطعات
function getTopParts(limit = 5) {
    const stmt = db.prepare("SELECT parts_used, COUNT(*) as usage FROM services GROUP BY parts_used ORDER BY usage DESC LIMIT ?");
    stmt.bind([limit]);
    const rows = [];
    while (stmt.step()) {
        rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
}

async function saveDBToGitHub(isInitial = false) {
    try {
        const data = db.export();
        const content = btoa(String.fromCharCode.apply(null, data));
        const message = isInitial ? "Initial commit" : "Update database";

        const body = {
            message,
            content,
            sha: dbFileSha
        };

        const response = await fetch('http://localhost:3001/api/db', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (response.ok) {
            const responseData = await response.json();
            dbFileSha = responseData.content.sha;
            console.log("✅ Database saved to server");
        } else {
            console.error("❌ Error saving database to server:", response.statusText);
        }
    } catch (error) {
        console.error("❌ Error saving database to server:", error);
    }
}
