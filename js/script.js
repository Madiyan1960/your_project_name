import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://kpefeonxvgnfpgevkcwy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwZWZlb254dmduZnBnZXZrY3d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMzY4MDgsImV4cCI6MjA2MjgxMjgwOH0.aZJhwODNOS3FhyT8k-qAAfvo0NaYbv4QSm6SwuNaeys'; // ОБНОВИТЕ ЭТОТ КЛЮЧ!

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const productsContainer = document.getElementById('products');
const cartItemsContainer = document.getElementById('cartItems');
const totalDiv = document.getElementById('total');
const orderForm = document.getElementById('orderForm');
const messageDiv = document.getElementById('message');
const cartPanel = document.getElementById('cart');
const toggleButton = document.getElementById('cart-toggle');

const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const categorySelect = document.getElementById('category-select'); // НОВЫЙ ЭЛЕМЕНТ

let allProducts = [];
let cart = [];

// Обработчики для полей формы (имя, телефон, адрес)
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

toggleButton.addEventListener('click', () => {
    cartPanel.classList.toggle('open');
});

// Загрузка товаров из Supabase
async function loadProducts() {
    productsContainer.textContent = 'Загрузка товаров...';
    // Добавили 'category' в select-запрос, убедитесь, что столбец 'category' существует в Supabase
    const { data, error } = await supabase.from('products').select('id,name,price,image_url,unit,category'); 
    if (error) {
        productsContainer.textContent = 'Ошибка загрузки товаров';
        console.error(error);
        return;
    }
    allProducts = data;
    populateCategories(); // Заполняем выпадающий список категорий после загрузки товаров
    applyFiltersAndSort(); // Применяем фильтры и сортировку после загрузки
}

// НОВАЯ ФУНКЦИЯ: Заполнение выпадающего списка категорий
function populateCategories() {
    const categories = new Set(); // Используем Set для хранения уникальных категорий
    allProducts.forEach(product => {
        if (product.category) {
            categories.add(product.category);
        }
    });

    categorySelect.innerHTML = '<option value="all">Все категории</option>'; // Оставляем опцию "Все категории"
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
}


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

function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    const item = cart.find(c => c.id === productId);
    if (item) {
        item.qty++;
    } else {
        cart.push({ ...product, qty: 1 });
    }
    updateCartUI();
}

function flyToCart(imgElement) {
    const cartIcon = document.querySelector('#cart-icon');
    const imgClone = imgElement.cloneNode(true);
    const imgRect = imgElement.getBoundingClientRect();
    const cartRect = cartIcon.getBoundingClientRect();

    imgClone.style.position = 'fixed';
    imgClone.style.zIndex = '9999';
    imgClone.style.left = imgRect.left + 'px';
    imgClone.style.top = imgRect.top + 'px';
    imgClone.style.width = imgRect.width + 'px';
    imgClone.style.transition = 'all 0.8s ease-in-out';
    document.body.appendChild(imgClone);

    requestAnimationFrame(() => {
        imgClone.style.left = cartRect.left + 'px';
        imgClone.style.top = cartRect.top + 'px';
        imgClone.style.width = '20px';
        imgClone.style.opacity = '0.5';
    });

    setTimeout(() => {
        imgClone.remove();
    }, 800);
}

function updateCartUI() {
    if (cart.length === 0) {
        cartItemsContainer.textContent = 'Корзина пуста';
        totalDiv.textContent = 'Итого: 0';
        return;
    }
    cartItemsContainer.innerHTML = '';
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

    cartItemsContainer.querySelectorAll('button.inc').forEach(btn => {
        btn.onclick = () => {
            const id = parseInt(btn.getAttribute('data-id'));
            const item = cart.find(c => c.id === id);
            if (item) {
                item.qty++;
                updateCartUI();
            }
        };
    });

    cartItemsContainer.querySelectorAll('button.dec').forEach(btn => {
        btn.onclick = () => {
            const id = parseInt(btn.getAttribute('data-id'));
            const item = cart.find(c => c.id === id);
            if (item) {
                item.qty--;
                if (item.qty <= 0) {
                    cart = cart.filter(c => c.id !== id);
                }
                updateCartUI();
            }
        };
    });
}

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
        return `${item.name} ${item.price} ₸ х ${item.qty} ${item.unit || ''} = ${totalItemPrice} ₸`;
    }).join('\n');


    messageDiv.textContent = 'Отправка заказа...';
    const { error } = await supabase.from('orders').insert([{ name, phone, address, products: productsText, total }]);

    if (error) {
        messageDiv.style.color = 'red';
        messageDiv.textContent = 'Ошибка при отправке заказа: ' + error.message;
    } else {
        messageDiv.style.color = 'green';
        messageDiv.textContent = 'Заказ успешно отправлен! Спасибо.';
        cart = [];
        updateCartUI();
        orderForm.reset();
        setTimeout(() => {
            messageDiv.textContent = '';
            cartPanel.classList.remove('open');
        }, 3000);
    }
};

// --- ОБНОВЛЕННАЯ ЛОГИКА ПОИСКА, СОРТИРОВКИ И ФИЛЬТРАЦИИ ПО КАТЕГОРИЯМ ---

function applyFiltersAndSort() {
    let currentProducts = [...allProducts]; // Всегда начинаем с полного списка товаров

    // 1. Фильтрация по поисковому запросу
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (searchTerm) {
        currentProducts = currentProducts.filter(product =>
            product.name.toLowerCase().includes(searchTerm)
        );
    }

    // 2. Фильтрация по категории (НОВАЯ ЧАСТЬ)
    const selectedCategory = categorySelect.value;
    if (selectedCategory !== 'all') { // Если выбрана не "Все категории"
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
        // 'default' не требует сортировки
    }

    renderProducts(currentProducts); // Отображаем отфильтрованные и отсортированные товары
}

// Обработчики событий для поля поиска, сортировки и категории
searchInput.addEventListener('input', applyFiltersAndSort);
sortSelect.addEventListener('change', applyFiltersAndSort);
categorySelect.addEventListener('change', applyFiltersAndSort); // НОВЫЙ ОБРАБОТЧИК ДЛЯ КАТЕГОРИЙ


// Инициализация: загружаем товары и обновляем UI
loadProducts();
updateCartUI(); // Обновляем UI корзины при загрузке страницы

// Регистрация Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
        .then(() => console.log('✅ Service Worker зарегистрирован'))
        .catch(e => console.error('❌ Ошибка регистрации Service Worker:', e));
}
