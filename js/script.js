import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://kpefeonxvgnfpgevkcwy.supabase.co';
// !!! ВНИМАНИЕ: ЭТОТ КЛЮЧ УСТАРЕЛ !!!
// ОЧЕНЬ РЕКОМЕНДУЕТСЯ ЗАМЕНИТЬ ЕГО НА ВАШ АКТУАЛЬНЫЙ anon (public) KEY ИЗ ПАНЕЛИ SUPABASE
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
const cartCountElement = document.getElementById('cart-count'); // Элемент для обновления счетчика уникальных товаров
const closeCartButton = document.getElementById('close-cart'); // Кнопка закрытия корзины

// Переменные для категорий (возвращаем их)
const categorySelect = document.getElementById('category-select');

let allProducts = []; // Все загруженные товары из Supabase
let cart = []; // Текущее состояние корзины, массив объектов { product_data, qty }

---

### Инициализация и сохранение данных формы

// Сохраняем введенные данные в localStorage для удобства пользователя
window.addEventListener("DOMContentLoaded", function () {
    const nameInput = document.getElementById("name");
    const phoneInput = document.getElementById("phone");
    const addressInput = document.getElementById("address");

    // Загружаем данные из localStorage при загрузке страницы
    nameInput.value = localStorage.getItem("name") || "";
    phoneInput.value = localStorage.getItem("phone") || "";
    addressInput.value = localStorage.getItem("address") || "";

    // Сохраняем данные в localStorage при изменении полей
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

---

### Функции управления корзиной и UI

// Переключение видимости панели корзины
toggleButton.addEventListener('click', () => {
    cartPanel.classList.toggle('open');
});

// Закрытие панели корзины по кнопке (если кнопка существует)
if (closeCartButton) {
    closeCartButton.addEventListener('click', () => {
        cartPanel.classList.remove('open');
    });
}

// Добавление товара в корзину
function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) {
        console.error("Попытка добавить несуществующий продукт:", productId);
        return;
    }

    const item = cart.find(c => c.id === productId);

    if (!item) { // Если товара НЕТ в корзине
        cart.push({ ...product, qty: 1 }); // Добавляем его с начальным количеством 1
        console.log(`Товар "${product.name}" добавлен в корзину.`);
    } else {
        // Если товар УЖЕ есть в корзине, ничего не делаем с его количеством.
        console.log(`Товар "${product.name}" уже в корзине. Количество не изменено.`);
    }

    updateCartUI();
    saveCartToLocalStorage();
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
    imgClone.style.zIndex = '9999';
    imgClone.style.left = imgRect.left + 'px';
    imgClone.style.top = imgRect.top + 'px';
    imgClone.style.width = imgRect.width + 'px';
    imgClone.style.height = imgRect.height + 'px';
    imgClone.style.transition = 'all 0.8s ease-in-out';
    imgClone.style.borderRadius = '50%';
    imgClone.style.objectFit = 'cover';

    document.body.appendChild(imgClone);

    requestAnimationFrame(() => {
        imgClone.style.left = cartRect.left + 'px';
        imgClone.style.top = cartRect.top + 'px';
        imgClone.style.width = '20px';
        imgClone.style.height = '20px';
        imgClone.style.opacity = '0.5';
    });

    setTimeout(() => {
        imgClone.remove();
    }, 800);
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
        const itemTotalPrice = item.price * item.qty;

        div.innerHTML = `
            <div class="cart-item-info">
                <span class="cart-item-name">${item.name}</span>
                <span class="cart-item-details">
                    (${item.price} ₸ x ${item.qty}${item.unit ? ' ' + item.unit : ''}) = ${itemTotalPrice} ₸
                </span>
            </div>
            <div class="cart-item-qty-controls">
                <button class="dec" data-id="${item.id}">-</button>
                <div>${item.qty}</div>
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

---

### Функции загрузки, рендеринга и фильтрации товаров

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

    // Восстанавливаем заполнение категорий и применение фильтра
    populateCategories();
    filterProductsByCategory();

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

    // Очищаем и добавляем опцию "Все категории"
    if (categorySelect) { // Проверка, что элемент categorySelect существует
        categorySelect.innerHTML = '<option value="all">Все категории</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    } else {
        console.warn("Элемент #category-select не найден. Фильтрация по категориям недоступна.");
    }
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
            addToCart(p.id);
            const img = card.querySelector('img');
            if (img) flyToCart(img);
        });
        productsContainer.appendChild(card);
    });
}

// Новая функция для фильтрации по категориям
function filterProductsByCategory() {
    let productsToDisplay = [...allProducts]; // Начинаем со всех товаров

    if (categorySelect && categorySelect.value !== 'all') { // Проверяем, что элемент существует и выбрана конкретная категория
        const selectedCategory = categorySelect.value;
        productsToDisplay = productsToDisplay.filter(product =>
            product.category === selectedCategory
        );
    }
    renderProducts(productsToDisplay); // Отображаем отфильтрованные товары
}

// Обработчик события для фильтрации по категории (если элемент существует)
if (categorySelect) {
    categorySelect.addEventListener('change', filterProductsByCategory);
}

---

### Отправка заказа

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

    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const productsText = cart.map(item => {
        const totalItemPrice = (item.price * item.qty);
        return `${item.name} ${item.price} ₸ х ${item.qty}${item.unit ? ' ' + item.unit : ''} = ${totalItemPrice} ₸`;
    }).join('\n');


    messageDiv.textContent = 'Отправка заказа...';
    const { error } = await supabase.from('orders').insert([{ name, phone, address, products: productsText, total }]);

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

---

### Инициализация приложения

loadProducts();

---

### Регистрация Service Worker

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
        .then(() => console.log('✅ Service Worker зарегистрирован'))
        .catch(e => console.error('❌ Ошибка регистрации Service Worker:', e));
}
