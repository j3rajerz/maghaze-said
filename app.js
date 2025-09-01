// توابع مدیریت رابط کاربری
function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (username === 'abbas' && password === '1335') {
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        showNotification('ورود با موفقیت انجام شد');
        
        // نمایش تاریخ امروز در بخش گزارش روزانه
        const today = new Date();
        const pDate = new PersianDate(today);
        document.getElementById('today-date').textContent = pDate.format('YYYY/MM/DD');
        renderChecks();
        document.querySelector("#dashboard-section .stat-card:nth-child(4) .value").innerText = countTodayChecks() + " چک";
        // شروع اسلایدر
        startSlider();
    } else {
        alert('نام کاربری یا رمز عبور اشتباه است');
    }
}

function logout() {
    document.getElementById('loginPage').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');
}

function showSection(sectionId) {
    // مخفی کردن تمام بخش‌ها
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // نمایش بخش انتخاب شده
    document.getElementById(sectionId).classList.add('active');
    
    // به‌روزرسانی منوی فعال
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.classList.remove('active');
    });

    // اجرای داشبورد وقتی وارد بخش داشبورد شد
    if (sectionId === 'dashboard-section') {
        renderDashboard();
    }

    // اجرای گزارش‌ها وقتی وارد بخش گزارشات شد
    if (sectionId === 'reports-section') {
        renderReports();
    }

    // اجرای لیست مشتریان وقتی وارد مدیریت مشتریان شد
    if (sectionId === 'customers-section') {
        renderCustomers();
    }

    // اجرای لیست خدمات وقتی وارد مدیریت خدمات شد
    if (sectionId === 'services-section') {
        renderServices();
    }

    // اجرای لیست قطعات وقتی وارد مدیریت قطعات شد
    if (sectionId === 'parts-section') {
        renderParts();
    }

    // اجرای لیست چک‌ها وقتی وارد مدیریت چک‌ها شد
    if (sectionId === 'checks-section') {
        renderChecks();
    }
    
    // مخفی کردن منو در حالت موبایل
    if (window.innerWidth < 768) {
        document.getElementById('sidebar').classList.remove('active');
    }
}

function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// تابع اسلایدر
function startSlider() {
    let currentSlide = 0;
    const slides = document.querySelectorAll('.slide');
    
    function nextSlide() {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }
    
    setInterval(nextSlide, 4000);
}

// شبیه‌سازی داده‌های اولیه
document.addEventListener('DOMContentLoaded', function() {
    // فعال کردن تاریخ شمسی در inputهای مربوطه
    $('.pdate').persianDatepicker({
        format: 'YYYY/MM/DD',
        initialValue: false
    });
    
    // مدیریت نمایش فیلد خدمت سفارشی
    const serviceSelect = document.querySelector('select');
    if (serviceSelect) {
        serviceSelect.addEventListener('change', function() {
            const customService = document.getElementById('custom-service');
            if (this.value === 'other') {
                customService.style.display = 'block';
            } else {
                customService.style.display = 'none';
            }
        });
    }
    
    // بستن مودال با کلیک خارج از آن
    window.onclick = function(event) {
        const modals = document.getElementsByClassName('modal');
        for (let i = 0; i < modals.length; i++) {
            if (event.target == modals[i]) {
                modals[i].style.display = 'none';
            }
        }
    }
});
document.getElementById("importDB").addEventListener("change", function(evt) {
    const file = evt.target.files[0];
    if (file) {
        importDB(file);
    }
});

function saveService(form) {
    const customer_id = form.querySelectorAll('select')[0].value; // انتخاب مشتری
    const date = form.querySelectorAll('.pdate')[0].value;
    const service_type = form.querySelectorAll('select')[1].value;
    const description = (service_type === 'other') ? document.getElementById('custom-service').querySelector('input').value : '';
    const cost = form.querySelectorAll('input[type=number]')[0].value;
    const parts_used = Array.from(form.querySelectorAll('select')[2].selectedOptions).map(opt => opt.value).join(", ");
    const payment_method = form.querySelectorAll('select')[3].value;

    addService(customer_id, date, service_type, description, cost, parts_used, payment_method);
    closeModal('new-service-modal');
    showNotification('✅ خدمت با موفقیت ذخیره شد');
    // کاهش موجودی برای هر قطعه انتخابی
    parts_used.split(", ").forEach(partName => {
        if (partName) reducePartStock(partName, 1);
    });
    renderParts(); // آپدیت جدول موجودی
    renderServices();
}

function renderServices() {
    const services = getServices();
    const tbody = document.querySelector("#servicesTable tbody");
    tbody.innerHTML = "";

    services.forEach(s => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${s.customer_id}</td>
            <td>${s.date}</td>
            <td>${s.service_type} ${s.description ? "(" + s.description + ")" : ""}</td>
            <td>${s.cost} تومان</td>
            <td>${s.parts_used}</td>
            <td>${s.payment_method}</td>
        `;
        tbody.appendChild(row);
    });
}

function savePart(form) {
    const name = form.querySelectorAll('input')[0].value;
    const stock = form.querySelectorAll('input')[1].value;
    const price = form.querySelectorAll('input')[2].value;

    addPart(name, stock, price);
    closeModal('new-part-modal');
    showNotification('✅ قطعه با موفقیت ذخیره شد');
    renderParts();
}

function renderParts() {
    const parts = getParts();
    const tbody = document.querySelector("#partsTable tbody");
    tbody.innerHTML = "";

    parts.forEach(p => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${p.name}</td>
            <td>${p.stock}</td>
            <td>${p.price} تومان</td>
        `;
        tbody.appendChild(row);
    });
}

function saveCheck(form) {
    const customer_id = 1; // فعلاً تست، بعداً میشه لیست مشتریان واقعی
    const amount = form.querySelectorAll('input[type=number]')[0].value;
    const bank = form.querySelectorAll('input[type=text]')[0].value;
    const issue_date = form.querySelectorAll('input')[1].value;
    const due_date = form.querySelectorAll('input')[2].value;
    const status = "received";

    addCheck(customer_id, amount, bank, issue_date, due_date, status);
    closeModal('new-check-modal');
    showNotification('✅ چک با موفقیت ذخیره شد');
    renderChecks();
}

function renderChecks() {
    const checks = getChecks();
    const tbody = document.querySelector("#checksTable tbody");
    tbody.innerHTML = "";

    checks.forEach(c => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${c.customer_id}</td>
            <td>${c.amount} تومان</td>
            <td>${c.bank}</td>
            <td>${c.issue_date}</td>
            <td>${c.due_date}</td>
            <td>${c.status}</td>
            <td>
                <button onclick="updateCheckStatus(${c.id}, 'cleared'); renderChecks();">✔ پاس شد</button>
                <button onclick="updateCheckStatus(${c.id}, 'bounced'); renderChecks();">❌ برگشتی</button>
            </td>
        `;
        tbody.appendChild(row);
    });
    renderChecks();
    document.querySelector("#dashboard-section .stat-card:nth-child(4) .value").innerText = countTodayChecks() + " چک";
}
// شمارش چک‌های سررسید امروز
function countTodayChecks() {
    const today = new Date().toISOString().split('T')[0];
    const checks = getChecks();
    return checks.filter(c => c.due_date === today).length;
}

function renderDashboard() {
    const today = new PersianDate().format('YYYY/MM/DD');
    const thisMonth = new PersianDate().format('YYYY/MM');

    // Stats
    document.getElementById('today-income').textContent = getDailyIncome(today);
    document.getElementById('month-income').textContent = getMonthlyIncome(thisMonth);
    document.getElementById('today-services').textContent = getServices(today).length;
    document.getElementById('today-checks').textContent = getChecks(today).length;

    // Charts
    renderRevenueChart();
    renderTopPartsChart();

    // Tables
    renderRecentServices();
    renderUpcomingChecks();
}

function renderRevenueChart() {
    const labels = [];
    const data = [];
    for (let i = 29; i >= 0; i--) {
        const date = new PersianDate().subtract('days', i);
        labels.push(date.format('YYYY/MM/DD'));
        data.push(getDailyIncome(date.format('YYYY/MM/DD')));
    }

    const ctx = document.getElementById('revenue-chart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'درآمد',
                data: data,
                borderColor: 'var(--primary-color)',
                tension: 0.1
            }]
        }
    });
}

function renderTopPartsChart() {
    const topParts = getTopParts();
    const labels = topParts.map(p => p.parts_used);
    const data = topParts.map(p => p.usage);

    const ctx = document.getElementById('top-parts-chart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'تعداد استفاده',
                data: data,
                backgroundColor: 'var(--accent-color)'
            }]
        }
    });
}

function renderRecentServices() {
    const services = getServices().slice(0, 10);
    const tbody = document.querySelector("#recent-services-table tbody");
    tbody.innerHTML = "";

    services.forEach(s => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${s.customer_id}</td>
            <td>${s.date}</td>
            <td>${s.service_type}</td>
            <td>${s.cost}</td>
        `;
        tbody.appendChild(row);
    });
}

function renderUpcomingChecks() {
    const checks = getChecks().filter(c => {
        const dueDate = new PersianDate(c.due_date.split('/').map(Number));
        const today = new PersianDate();
        const diff = dueDate.diff(today, 'days');
        return diff >= 0 && diff <= 7;
    });

    const tbody = document.querySelector("#upcoming-checks-table tbody");
    tbody.innerHTML = "";

    checks.forEach(c => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${c.customer_id}</td>
            <td>${c.due_date}</td>
            <td>${c.amount}</td>
        `;
        tbody.appendChild(row);
    });
}

document.getElementById("importDB").addEventListener("change", function(evt) {
    const file = evt.target.files[0];
    if (file) {
        importDB(file);
    }
});
