import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://kpefeonxvgnfpgevkcwy.supabase.co';
// !!! ЗАМЕНИТЕ ЭТОТ КЛЮЧ !!!
// Скопируйте ваш актуальный anon (public) KEY из панели Supabase -> Project Settings -> API
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwZWZlb254dmduZnBnZXZrY3d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMzY4MDgsImV4cCI6MjA2MjgxMjgwOH0.aZJhwODNOS3FhyT8k-qAAfvo0NaYbv4QSm6SwuNaeys';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Получаем ссылки на элементы DOM
const productsContainer = document.getElementById('products');
const cartItemsContainer = document.getElementById('cartItems');
const totalDiv = document.getElementById('total');
const orderForm = document.getElementById('orderForm');
const messageDiv = document.getElementById('message');
const cartPanel = document.getElementById('cart');
const toggleButton = document.getElementById('cart-toggle');
const cartCountElement = document.getElementById('cart-count');

const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const categorySelect = document.getElementById('category-select');

// >>>>> НОВЫЕ ЭЛЕМЕНТЫ DOM для АУТЕНТИФИКАЦИИ <<<<<
const registerForm = document.getElementById('register-form');
const loginForm = document.getElementById('login-form');
const registerEmailInput = document.getElementById('register-email');
const registerPasswordInput = document.getElementById('register-password');
const registerButton = document.getElementById('register-button');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const loginButton = document.getElementById('login-button');
const logoutButton = document.getElementById('logout-button');
const userStatusSpan = document.getElementById('user-status');
const showLoginLink = document.getElementById('show-login');
const showRegisterLink = document.getElementById('show-register');
const myOrdersLink = document.getElementById('my-orders-link');
// >>>>> КОНЕЦ НОВЫХ ЭЛЕМЕНТОВ DOM <<<<<

let allProducts = [];
let cart = [];

// --- Инициализация и сохранение данных формы заказа ---
window.addEventListener("DOMContentLoaded", function () {
    const nameInput = document.getElementById("name");
    const phoneInput = document.getElementById("phone");
    const addressInput = document.getElementById("address");

    nameInput.value = localStorage.getItem("name") || "";
    phoneInput.value = localStorage.getItem("phone") || "";
    addressInput.value = localStorage.getItem("address") || "";

    nameInput.addEventListener("input", () => {
        localStorage.setItem("name", nameInput.value);
    });

    phoneInput.addEventListener("input", () => {
        localStorage.setItem("phone", phoneInput.value);
    });

    addressInput.addEventListener("input", () => {
        localStorage.setItem("address", addressInput.value);
    });
});

// >>>>> НОВЫЕ ФУНКЦИИ и ОБРАБОТЧИКИ АУТЕНТИФИКАЦИИ <<<<<

// Функция для обновления интерфейса в зависимости от статуса аутентификации
async function updateAuthUI() {
    const { data: { user } } = await supabase.auth.getUser(); // Получаем текущего пользователя
    if (user) {
        // Пользователь авторизован
        userStatusSpan.textContent = `Привет, ${user.email}!`;
        logoutButton.style.display = 'block';
        myOrdersLink.style.display = 'block';
        if (registerForm) registerForm.style.display = 'none';
        if (loginForm) loginForm.style.display = 'none';
    } else {
        // Пользователь не авторизован
        userStatusSpan.textContent = 'Вы не авторизованы';
        logoutButton.style.display = 'none';
        myOrdersLink.style.display = 'none';
        if (loginForm) loginForm.style.display = 'block'; // Показываем форму входа по умолчанию
        if (registerForm) registerForm.style.display = 'none';
    }
}

// Переключение между формами регистрации и входа
if (showLoginLink) {
    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (registerForm) registerForm.style.display = 'none';
        if (loginForm) loginForm.style.display = 'block';
    });
}
if (showRegisterLink) {
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (loginForm) loginForm.style.display = 'none';
        if (registerForm) registerForm.style.display = 'block';
    });
}

// Обработчик для кнопки регистрации
if (registerButton) {
    registerButton.addEventListener('click', async () => {
        const email = registerEmailInput.value;
        const password = registerPasswordInput.value;
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
        });
        if (error) {
            alert('Ошибка регистрации: ' + error.message);
            console.error("Ошибка регистрации:", error);
        } else {
            alert('Регистрация успешна! Проверьте вашу почту для подтверждения (если включено в настройках Supabase).');
            updateAuthUI();
        }
    });
}

// Обработчик для кнопки входа
if (loginButton) {
    loginButton.addEventListener('click', async () => {
        const email = loginEmailInput.value;
        const password = loginPasswordInput.value;
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });
        if (error) {
            alert('Ошибка входа: ' + error.message);
            console.error("Ошибка входа:", error);
        } else {
            alert('Вход успешен!');
            updateAuthUI();
            // Опционально: можно перенаправить пользователя на страницу "Мои заказы"
            // window.location.href = 'my-orders.html';
        }
    });
}

// Обработчик для кнопки выхода
if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            alert('Ошибка выхода: ' + error.message);
            console.error("Ошибка выхода:", error);
        } else {
            alert('Вы успешно вышли.');
            updateAuthUI();
        }
    });
}

// >>>>> КОНЕЦ НОВЫХ ФУНКЦИЙ и ОБРАБОТЧИКОВ АУТЕНТИФИКАЦИИ <<<<<


// --- Функции управления корзиной и UI ---

// Переключение видимости панели корзины
toggleButton.addEventListener('click', () => {
    cartPanel.classList.toggle('open');
});

// Добавление товара в корзину
function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) {
        console.error("Попытка добавить несуществующий продукт:", productId);
        return false;
    }

    const item = cart.find(c => c.id === productId);

    if (!item) {
        cart.push({ ...product, qty: 1 });
        console.log(`[DEV LOG] Товар "${product.name}" добавлен в корзину.`);
        updateCartUI();
        saveCartToLocalStorage();
        return true;
    } else {
        console.log(`[DEV LOG] Товар "${product.name}" уже в корзине. Количество не изменено.`);
        return false;
    }
}

// Анимация "товар летит в корзину"
function flyToCart(imgElement) {
    const cartIcon = document.querySelector('#cart-icon');
    if (!cartIcon) {
        console.warn("Элемент #cart-icon не найден для анимации.");
        return;
    }

    const imgClone = imgElement.cloneNode(true);
    const imgRect = imgElement.getBoundingClientRect();
    const cartRect = cartIcon.getBoundingClientRect();

    imgClone.style.position = 'fixed';
    imgClone.style.zIndex = '99999';
    imgClone.style.left = `${imgRect.left}px`;
    imgClone.style.top = `${imgRect.top}px`;
    imgClone.style.width = `${imgRect.width}px`;
    imgClone.style.height = `${imgRect.height}px`;
    imgClone.style.transition = 'all 0.8s ease-in-out';
    imgClone.style.borderRadius = '50%';
    imgClone.style.objectFit = 'cover';

    document.body.appendChild(imgClone);

    requestAnimationFrame(() => {
        const targetLeft = cartRect.left + (cartRect.width / 2) - 10;
        const targetTop = cartRect.top + (cartRect.height / 2) - 10;

        imgClone.style.left = `${targetLeft}px`;
        imgClone.style.top = `${targetTop}px`;
        imgClone.style.width = '20px';
        imgClone.style.height = '20px';
        imgClone.style.opacity = '0.5';
    });

    imgClone.addEventListener('transitionend', () => {
        if (imgClone.parentNode) {
            imgClone.remove();
        }
    }, { once: true });

    setTimeout(() => {
        if (imgClone.parentNode) {
            imgClone.remove();
        }
    }, 850);
}

// Обновление пользовательского интерфейса корзины (отображение товаров, общей суммы и счетчика)
function updateCartUI() {
    const totalUniqueItemsInCart = cart.length;

    if (cartCountElement) {
        cartCountElement.textContent = totalUniqueItemsInCart;
    } else {
        console.warn("Элемент #cart-count не найден!");
    }

    if (cart.length === 0) {
        cartItemsContainer.textContent = 'Корзина пуста';
        totalDiv.textContent = 'Итого: 0 ₸';
        return;
    }

    cartItemsContainer.innerHTML = '';
    cart.forEach(item => {
        const div = document.createElement('div');
        div.className = 'cart-item';

        const totalItemPrice = item.price * item.qty;

        div.innerHTML = `
            <span class="cart-item-summary">
                ${item.name} ${item.price} ₸ х ${item.qty} ${item.unit ? `(${item.unit})` : ''} = ${totalItemPrice} ₸
            </span>
            <div class="cart-item-actions">
                <button class="dec" data-id="${item.id}">-</button>
                <span class="qty">${item.qty}</span>
                <button class="inc" data-id="${item.id}">+</button>

            </div>
        `;
        cartItemsContainer.appendChild(div);
    });

    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    totalDiv.textContent = `Итого: ${total} ₸`;
}

// Сохранение корзины в localStorage
function saveCartToLocalStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Загрузка корзины из localStorage
function loadCartFromLocalStorage() {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
        cart = JSON.parse(storedCart);
    }
}

// ЕДИНЫЙ ОБРАБОТЧИК СОБЫТИЙ ДЛЯ КНОПОК +/- В КОРЗИНЕ (Делегирование событий)
cartItemsContainer.addEventListener('click', (event) => {
    const target = event.target;

    if (target.classList.contains('inc') || target.classList.contains('dec')) {
        const id = target.dataset.id;
        const item = cart.find(c => c.id === id);

        if (item) {
            if (target.classList.contains('inc')) {
                item.qty++;
            } else if (target.classList.contains('dec')) {
                item.qty--;
                if (item.qty <= 0) {
                    cart = cart.filter(c => c.id !== id);
                }
            }
            updateCartUI();
            saveCartToLocalStorage();
        }
    }
});

// --- Функции загрузки, рендеринга и фильтрации товаров ---

// Загрузка товаров из Supabase
async function loadProducts() {
    productsContainer.textContent = 'Загрузка товаров...';
    const { data, error } = await supabase.from('products').select('id,name,price,image_url,unit,category');

    if (error) {
        productsContainer.textContent = 'Ошибка загрузки товаров: ' + error.message;
        console.error("Ошибка Supabase при загрузке товаров:", error);
        return;
    }
    allProducts = data;
    populateCategories();
    applyFiltersAndSort();
    loadCartFromLocalStorage();
    updateCartUI();
}

// Заполнение выпадающего списка категорий на основе загруженных товаров
function populateCategories() {
    const categories = new Set();
    allProducts.forEach(product => {
        if (product.category) {
            categories.add(product.category);
        }
    });

    categorySelect.innerHTML = '<option value="all">Все категории</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
}

// Рендеринг списка товаров на странице
function renderProducts(productsToDisplay) {
    if (!productsToDisplay.length) {
        productsContainer.textContent = 'Нет товаров, соответствующих вашему запросу.';
        return;
    }
    productsContainer.innerHTML = '';
    productsToDisplay.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${p.image_url || ''}" alt="${p.name}" />
            <div class="product-name">${p.name}</div>
            <div class="product-price">${p.price} ₸</div>
            <button class="add-to-cart" data-id="${p.id}">+</button>
        `;

        card.querySelector('button').addEventListener('click', () => {
            const productId = p.id;
            const productImg = card.querySelector('img');

            const wasAddedAsNew = addToCart(productId);

            if (wasAddedAsNew) {
                if (productImg) {
                    flyToCart(productImg);
                }
                showTemporaryMessage('Товар добавлен в корзину!', 'green');
            } else {
                showTemporaryMessage('Этот товар уже есть в корзине.', 'orange');
            }
        });

        productsContainer.appendChild(card);
    });
}

// Применение фильтров (поиск, категория) и сортировки к списку товаров
function applyFiltersAndSort() {
    let currentProducts = [...allProducts];

    const searchTerm = searchInput.value.toLowerCase().trim();
    if (searchTerm) {
        currentProducts = currentProducts.filter(product =>
            product.name.toLowerCase().includes(searchTerm)
        );
    }

    const selectedCategory = categorySelect.value;
    if (selectedCategory !== 'all') {
        currentProducts = currentProducts.filter(product =>
            product.category === selectedCategory
        );
    }

    const sortOption = sortSelect.value;
    switch (sortOption) {
        case 'price-asc':
            currentProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            currentProducts.sort((a, b) => b.price - a.price);
            break;
        case 'name-asc':
            currentProducts.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name-desc':
            currentProducts.sort((a, b) => b.name.localeCompare(a.name));
            break;
    }

    renderProducts(currentProducts);
}

// Обработчики событий для поля поиска, сортировки и категории
searchInput.addEventListener('input', applyFiltersAndSort);
sortSelect.addEventListener('change', applyFiltersAndSort);
categorySelect.addEventListener('change', applyFiltersAndSort);

// --- Отправка заказа ---

orderForm.onsubmit = async e => {
    e.preventDefault();
    if (cart.length === 0) {
        alert('Корзина пуста!');
        return;
    }

    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const address = document.getElementById('address').value.trim();

    if (!name || !phone || !address) {
        alert('Пожалуйста, заполните все поля.');
        return;
    }

    // >>>>> ИЗМЕНЕНИЕ: Получаем ID текущего авторизованного пользователя <<<<<
    const { data: { user } } = await supabase.auth.getUser();
    let userId = null;

    if (user) {
        userId = user.id;
    } else {
        const confirmGuest = confirm('Вы не вошли в систему. Хотите продолжить оформление заказа как гость? Если вы войдете, ваши заказы будут сохраняться в личном кабинете.');
        if (!confirmGuest) {
            alert('Пожалуйста, войдите или зарегистрируйтесь, чтобы оформить заказ.');
            return;
        }
    }
    // >>>>> КОНЕЦ ИЗМЕНЕНИЯ <<<<<

    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const productsText = cart.map(item => {
        const totalItemPrice = (item.price * item.qty);
        return `${item.name} ${item.price} ₸ х ${item.qty} ${item.unit || ''} = ${totalItemPrice} ₸`;
    }).join('\n');


    messageDiv.textContent = 'Отправка заказа...';
    // >>>>> ИЗМЕНЕНИЕ: Отправляем данные заказа в таблицу 'orders' Supabase, включая user_id <<<<<
    const { error } = await supabase.from('orders').insert([
        {
            name,
            phone,
            address,
            products: productsText,
            total,
            user_id: userId // <-- ПЕРЕДАЕМ ID ПОЛЬЗОВАТЕЛЯ
        }
    ]);
    // >>>>> КОНЕЦ ИЗМЕНЕНИЯ <<<<<

    if (error) {
        messageDiv.style.color = 'red';
        messageDiv.textContent = 'Ошибка при отправке заказа: ' + error.message;
        console.error("Ошибка при отправке заказа в Supabase:", error);
    } else {
        messageDiv.style.color = 'green';
        messageDiv.textContent = 'Заказ успешно отправлен! Спасибо.';
        cart = [];
        updateCartUI();
        saveCartToLocalStorage();
        orderForm.reset();
        setTimeout(() => {
            messageDiv.textContent = '';
            cartPanel.classList.remove('open');
        }, 3000);
    }
};

// --- Инициализация приложения ---

loadProducts();

// Функция для отображения временных сообщений в нижней части экрана
function showTemporaryMessage(text, color = 'green', duration = 2000) {
    let tempMessageDiv = document.getElementById('temp-notification');
    if (!tempMessageDiv) {
        tempMessageDiv = document.createElement('div');
        tempMessageDiv.id = 'temp-notification';
        tempMessageDiv.style.position = 'fixed';
        tempMessageDiv.style.bottom = '20px';
        tempMessageDiv.style.left = '50%';
        tempMessageDiv.style.transform = 'translateX(-50%)';
        tempMessageDiv.style.background = '#333';
        tempMessageDiv.style.color = 'white';
        tempMessageDiv.style.padding = '10px 20px';
        tempMessageDiv.style.borderRadius = '5px';
        tempMessageDiv.style.zIndex = '10000';
        tempMessageDiv.style.opacity = '0';
        tempMessageDiv.style.transition = 'opacity 0.3s ease-in-out';
        document.body.appendChild(tempMessageDiv);
    }

    tempMessageDiv.textContent = text;
    tempMessageDiv.style.background = color === 'green' ? '#28a745' : '#ffc107';
    tempMessageDiv.style.color = color === 'green' ? 'white' : '#333';

    tempMessageDiv.style.opacity = '1';

    setTimeout(() => {
        tempMessageDiv.style.opacity = '0';
        setTimeout(() => {
            tempMessageDiv.textContent = '';
        }, 300);
    }, duration);
}

// --- ИНИЦИАЛИЗАЦИЯ И СЛУШАТЕЛИ ИЗМЕНЕНИЙ СТАТУСА АУТЕНТИФИКАЦИИ ---

// Вызываем функцию обновления UI при загрузке страницы
window.addEventListener('load', updateAuthUI);

// Добавляем слушатель для изменения состояния аутентификации Supabase
supabase.auth.onAuthStateChange((event, session) => {
    updateAuthUI();
});

// --- Регистрация Service Worker ---
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
        .then(() => console.log('✅ Service Worker зарегистрирован'))
        .catch(e => console.error('❌ Ошибка регистрации Service Worker:', e));
}
