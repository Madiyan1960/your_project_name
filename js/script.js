import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://kpefeonxvgnfpgevkcwy.supabase.co';
// !!! ВНИМАНИЕ: ЭТОТ КЛЮЧ УСТАРЕЛ !!!
// ОЧЕНЬ РЕКОМЕНДУЕТСЯ ЗАМЕНИТЬ ЕГО НА ВАШ АКТУАЛЬНЫЙ anon (public) KEY ИЗ ПАНЕЛИ SUPABASE
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwZWZlb254dmduZnBnZXZrY3d5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzIzNjgwOCwiZXhwIjoyMDYyODEyODA4fQ.vmja_c7pb1FYViIslL0CACrXpqUJ9n2kgw6_oG5ZSUA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Получаем ссылки на элементы DOM
const productsContainer = document.getElementById('products');
const cartItemsContainer = document.getElementById('cartItems');
const totalDiv = document.getElementById('total');
const orderForm = document.getElementById('orderForm');
const messageDiv = document.getElementById('message');
const cartPanel = document.getElementById('cart');
const toggleButton = document.getElementById('cart-toggle');
// Получаем элемент для обновления счетчика уникальных товаров в корзине
const cartCountElement = document.getElementById('cart-count');

const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const categorySelect = document.getElementById('category-select');

let allProducts = []; // Все загруженные товары из Supabase
let cart = []; // Текущее состояние корзины, массив объектов { product_data, qty }

// --- Инициализация и сохранение данных формы ---
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

// --- Функции управления корзиной и UI ---

// Переключение видимости панели корзины
toggleButton.addEventListener('click', () => {
    cartPanel.classList.toggle('open');
});

// Добавление товара в корзину
// Этот товар добавляется только один раз, если его нет в корзине.
// Если он уже есть, его количество не изменяется этой функцией.
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
        // Количество можно будет изменить только из самой корзины (+/- кнопки).
        console.log(`Товар "${product.name}" уже в корзине. Количество не изменено.`);
    }

    updateCartUI();      // Обновляем пользовательский интерфейс корзины
    saveCartToLocalStorage(); // Сохраняем текущее состояние корзины в localStorage
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
    imgClone.style.height = imgRect.height + 'px'; // Добавим высоту
    imgClone.style.transition = 'all 0.8s ease-in-out';
    imgClone.style.borderRadius = '50%'; // Сделаем круглым
    imgClone.style.objectFit = 'cover'; // Обрезка изображения, чтобы заполнить круг

    document.body.appendChild(imgClone);

    requestAnimationFrame(() => {
        imgClone.style.left = cartRect.left + 'px';
        imgClone.style.top = cartRect.top + 'px';
        imgClone.style.width = '20px';
        imgClone.style.height = '20px'; // И высоту
        imgClone.style.opacity = '0.5';
    });

    setTimeout(() => {
        imgClone.remove(); // Удаляем клон после завершения анимации
    }, 800);
}

// Обновление пользовательского интерфейса корзины (отображение товаров, общей суммы и счетчика)
function updateCartUI() {
    // Рассчитываем количество УНИКАЛЬНЫХ товаров в корзине (просто длина массива cart)
    const totalUniqueItemsInCart = cart.length;

    // Обновляем счетчик на кнопке корзины
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

    cartItemsContainer.innerHTML = ''; // Очищаем текущее содержимое корзины
    cart.forEach(item => {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="cart-item-name">${item.name} (${item.price} ₸)</div>
            <div class="cart-item-qty">
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
// Этот обработчик назначается ОДИН РАЗ при загрузке скрипта.
// Он перехватывает все клики по кнопкам +/- внутри cartItemsContainer.
cartItemsContainer.addEventListener('click', (event) => {
    const target = event.target;

    if (target.classList.contains('inc') || target.classList.contains('dec')) {
        // ID является строкой (UUID), нет необходимости парсить его в число
        const id = target.dataset.id;
        const item = cart.find(c => c.id === id);

        if (item) {
            if (target.classList.contains('inc')) {
                item.qty++;
            } else if (target.classList.contains('dec')) {
                item.qty--;
                if (item.qty <= 0) {
                    cart = cart.filter(c => c.id !== id); // Удаляем товар, если количество <= 0
                }
            }
            updateCartUI(); // Обновляем UI корзины
            saveCartToLocalStorage(); // Сохраняем изменения в localStorage
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
    populateCategories(); // Заполняем выпадающий список категорий
    applyFiltersAndSort(); // Применяем фильтры и сортировку по умолчанию
    loadCartFromLocalStorage(); // Загружаем состояние корзины из localStorage
    updateCartUI(); // Обновляем UI корзины (включая счетчик)
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
            addToCart(p.id);
            const img = card.querySelector('img');
            if (img) flyToCart(img); // Анимация "товар летит в корзину"
        });
        productsContainer.appendChild(card);
    });
}

// Применение фильтров (поиск, категория) и сортировки к списку товаров
function applyFiltersAndSort() {
    let currentProducts = [...allProducts]; // Создаем копию для фильтрации/сортировки

    // 1. Фильтрация по поисковому запросу
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (searchTerm) {
        currentProducts = currentProducts.filter(product =>
            product.name.toLowerCase().includes(searchTerm)
        );
    }

    // 2. Фильтрация по категории
    const selectedCategory = categorySelect.value;
    if (selectedCategory !== 'all') {
        currentProducts = currentProducts.filter(product =>
            product.category === selectedCategory
        );
    }

    // 3. Сортировка
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

    renderProducts(currentProducts); // Отображаем отфильтрованные и отсортированные товары
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

    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    // Формируем текстовое описание товаров в заказе
    const productsText = cart.map(item => {
        const totalItemPrice = (item.price * item.qty);
        return `${item.name} ${item.price} ₸ х ${item.qty} ${item.unit || ''} = ${totalItemPrice} ₸`;
    }).join('\n');


    messageDiv.textContent = 'Отправка заказа...';
    // Отправляем данные заказа в таблицу 'orders' Supabase
    const { error } = await supabase.from('orders').insert([{ name, phone, address, products: productsText, total }]);

    if (error) {
        messageDiv.style.color = 'red';
        messageDiv.textContent = 'Ошибка при отправке заказа: ' + error.message;
        console.error("Ошибка при отправке заказа в Supabase:", error);
    } else {
        messageDiv.style.color = 'green';
        messageDiv.textContent = 'Заказ успешно отправлен! Спасибо.';
        cart = []; // Очищаем корзину после успешного заказа
        updateCartUI(); // Обновляем UI корзины (она станет пустой)
        saveCartToLocalStorage(); // Очищаем корзину в localStorage
        orderForm.reset(); // Очищаем поля формы
        // Закрываем панель корзины и убираем сообщение через 3 секунды
        setTimeout(() => {
            messageDiv.textContent = '';
            cartPanel.classList.remove('open');
        }, 3000);
    }
};

// --- Инициализация приложения ---

// Запускаем загрузку товаров при старте скрипта
loadProducts();

// --- Регистрация Service Worker ---
// Это важно для работы PWA (Progressive Web App) и оффлайн-функциональности
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
        .then(() => console.log('✅ Service Worker зарегистрирован'))
        .catch(e => console.error('❌ Ошибка регистрации Service Worker:', e));
}
