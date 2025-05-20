import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://kpefeonxvgnfpgevkcwy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwZWZlb254dmduZnBnZXZrY3d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMzY4MDgsImV4cCI6MjA2MjgxMjgwOH0.aZJhwODNOS3FhyT8k-qAAfvo0NaYbv4QSm6SwuNaeys'; // Проверьте, что это ваш реальный ключ!

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ВСЕ ЭТИ ПЕРЕМЕННЫЕ ДОЛЖНЫ БЫТЬ ОБЪЯВЛЕНЫ ТОЛЬКО ОДИН РАЗ, ЗДЕСЬ:
const productsContainer = document.getElementById('products');
const cartItemsContainer = document.getElementById('cartItems');
console.log("cartItemsContainer при инициализации:", cartItemsContainer); // Диагностическая строка
const totalDiv = document.getElementById('total');
const orderForm = document.getElementById('orderForm');
const messageDiv = document.getElementById('message');
const cartPanel = document.getElementById('cart');
const toggleButton = document.getElementById('cart-toggle');

const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const categorySelect = document.getElementById('category-select');

let allProducts = [];
let cart = [];

// ... (весь остальной код, включая обработчики событий и функции) ...

// ВАЖНО: БЛОК С addEventListener должен быть после объявления cartItemsContainer,
// но ДОЛЖЕН БЫТЬ ТОЛЬКО ОДИН РАЗ В КОДЕ, НЕ ПОВТОРЯЙТЕСЬ:
// --- ЕДИНЫЙ ОБРАБОТЧИК СОБЫТИЙ ДЛЯ КОРЗИНЫ (Делегирование событий) ---
console.log("Попытка назначить обработчик клика на cartItemsContainer (перед addEventListener):", cartItemsContainer); 
cartItemsContainer.addEventListener('click', (event) => {
    console.log("Клик обнаружен в cartItemsContainer. Цель клика (event.target):", event.target); 

    const target = event.target; 

    if (target.classList.contains('inc') || target.classList.contains('dec')) {
        console.log("Клик по кнопке +/-. ID:", target.dataset.id);
        const id = parseInt(target.dataset.id); 
        const item = cart.find(c => c.id === id); 

        if (item) {
            console.log("Товар найден в корзине:", item);
            if (target.classList.contains('inc')) {
                item.qty++;
                console.log("Количество увеличено:", item.qty);
            } else if (target.classList.contains('dec')) {
                item.qty--;
                console.log("Количество уменьшено:", item.qty);
                if (item.qty <= 0) {
                    cart = cart.filter(c => c.id !== id); 
                    console.log("Товар удален из корзины.");
                }
            }
            updateCartUI(); 
            console.log("updateCartUI() вызван.");
        } else {
            console.log("Ошибка: Товар с ID", id, "не найден в корзине.");
        }
    } else {
        console.log("Клик не по кнопке +/-. Классы цели:", target.classList);
    }
});

// ... (конец файла, включая loadProducts() и Service Worker) ...
