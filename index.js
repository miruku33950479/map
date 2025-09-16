document.addEventListener("DOMContentLoaded", function () {
    // 初始化 Leaflet 地圖
    var map = L.map('map').setView([23.704454, 120.428517], 16);

    // 創建並設定預設圖釘圖示
    var PinIcon = L.icon({
        iconUrl: 'images/pin_icon.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
    L.Marker.prototype.options.icon = PinIcon;

    // 添加 OpenStreetMap 圖層
    L.tileLayer('https://tile.openstreetmap.bzh/br/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors & CartoDB',
        maxZoom: 19
    }).addTo(map);

    // 創建 Feature Group 來管理不同類型的標記
    let rentMarkers = L.featureGroup().addTo(map);
    let restaurantMarkers = L.featureGroup().addTo(map);

    var sidebar = document.getElementById('sidebar');

    // 定義後端 API 的基礎 URL
    const baseUrl = 'https://0191d4c6b56a.ngrok-free.app';
    
    // API 路徑
    const rentRegionMapUrl = `${baseUrl}/Rent/RegionMap`;
    const restaurantRegionMapUrl = `${baseUrl}/Restaurant/RegionMap`;

    // **修正開始：使用完整的測試物件**
    const sunshineApartmentData = {
        coverImage: "https://media.gq.com.tw/photos/61e134dac128c151658f7506/16:9/w_1920,c_limit/casas%20caras%20cover.jpeg",
        name: "陽光公寓 (測試)",
        cityName: "台北市",
        coordinates: {
            latitude: 23.7029651,
            longitude: 120.4287316
        },
        mainContent: "這是一個預設標註在地圖上的地點，主要用途是作為系統功能測試與展示之用。",
        rentStatus: 1,
        vacantRooms: 2,
        upcomingVacancies: 0,
        posts: [
            { id: "test1", rentMoney: 10000, roomName: "測試房A", rentPostStatus: "可預約" },
            { id: "test2", rentMoney: 15000, roomName: "測試房B", rentPostStatus: "已出租" }
        ],
        id: "test_id",
        urlPhone: "tel:+886123456789",
        urlLine: "https://line.me/ti/p/testline",
        urlMail: "mailto:test@test.com",
        rentPriceRange: "10000-15000",
        userID: "test_user"
    };
    // **修正結束**

    L.marker([sunshineApartmentData.coordinates.latitude, sunshineApartmentData.coordinates.longitude])
        .addTo(map)
        .on('click', () => openSidebar(sunshineApartmentData))
        .bindTooltip(sunshineApartmentData.name);

    function loadRentalsInView() {
        const bounds = map.getBounds();
        const center = bounds.getCenter();
        const latitudeDelta = bounds.getNorth() - bounds.getSouth();
        const longitudeDelta = bounds.getEast() - bounds.getWest();

        const url = new URL(rentRegionMapUrl); 
        url.search = new URLSearchParams({
            latitude: center.lat,
            longitude: center.lng,
            latitudeDelta: latitudeDelta,
            longitudeDelta: longitudeDelta
        }).toString();
        
        fetch(url, {
            headers: {
                'Accept': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            }
        })
        .then(response => response.ok ? response.json() : Promise.reject(response))
        .then(data => {
            rentMarkers.clearLayers();
            if (data && data.length > 0) {
                data.forEach(property => {
                    if (property.coordinates) {
                        L.marker([property.coordinates.latitude, property.coordinates.longitude])
                            .addTo(rentMarkers)
                            .on('click', () => fetchRentDataAndOpenSidebar(property.id))
                            .bindTooltip(property.name);
                    }
                });
            }
        })
        .catch(error => console.error('載入房源資料時發生錯誤:', error));
    }

    function loadRestaurantsInView() {
        const bounds = map.getBounds();
        const center = bounds.getCenter();
        const latitudeDelta = bounds.getNorth() - bounds.getSouth();
        const longitudeDelta = bounds.getEast() - bounds.getWest();

        const url = new URL(restaurantRegionMapUrl);
        url.search = new URLSearchParams({
            latitude: center.lat,
            longitude: center.lng,
            latitudeDelta: latitudeDelta,
            longitudeDelta: longitudeDelta,
            includeAll: true
        }).toString();
        
        fetch(url, {
            headers: {
                'Accept': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            }
        })
        .then(response => response.ok ? response.json() : Promise.reject(response))
        .then(data => {
            restaurantMarkers.clearLayers();
            if (data && data.length > 0) {
                data.forEach(restaurant => {
                    const { name, latitude, longitude } = restaurant;
                    if (latitude && longitude) {
                        L.marker([latitude, longitude])
                            .addTo(restaurantMarkers)
                            .bindPopup(`<b>${name || '無餐廳名稱'}</b>`);
                    }
                });
            }
        })
        .catch(error => {
            console.error('載入餐廳資料時發生錯誤:', error);
        });
    }

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                map.setView([position.coords.latitude, position.coords.longitude], 16);
                loadRentalsInView();
                loadRestaurantsInView();
            },
            error => {
                console.error('獲取使用者位置失敗:', error.message);
                loadRentalsInView();
                loadRestaurantsInView();
            }
        );
    } else {
        console.error('瀏覽器不支援地理位置 API。');
        loadRentalsInView();
        loadRestaurantsInView();
    }

    map.on('moveend', function() {
        loadRentalsInView();
        loadRestaurantsInView();
    });

    map.on('click', closeSidebar);

    // --- 後續所有函式 (openSidebar, closeSidebar, 登入邏輯等) 皆保持不變 ---
    function openSidebar(property) {
        sidebar.classList.remove('closed');
        document.getElementById('sidebar-title').innerText = property.name || '未提供名稱';
        const sidebarImg = document.getElementById('sidebar-img');
        const sidebarImgPlaceholder = document.getElementById('sidebar-img-placeholder');
        sidebarImg.style.display = 'none';
        sidebarImgPlaceholder.style.display = 'flex';
        sidebarImg.onload = () => {
            sidebarImg.style.display = 'block';
            sidebarImgPlaceholder.style.display = 'none';
        };
        sidebarImg.onerror = () => {
            sidebarImg.src = 'https://via.placeholder.com/300x200?text=No+Image';
            sidebarImg.style.display = 'block';
            sidebarImgPlaceholder.style.display = 'none';
        };
        sidebarImg.src = property.coverImage || '';
        document.getElementById('sidebar-content').innerText = property.mainContent || '';
        document.getElementById('sidebar-price').innerText = '租金範圍: ' + (property.rentPriceRange || '未提供');
        document.getElementById('sidebar-city').innerText = '城市: ' + (property.cityName || '未提供');
        const postsList = document.getElementById('sidebar-posts');
        postsList.innerHTML = '';
        if (property.posts && property.posts.length > 0) {
            property.posts.forEach(post => {
                const li = document.createElement('li');
                li.textContent = `${post.roomName || '未提供房名'} - ${post.rentMoney !== undefined ? post.rentMoney : '未提供租金'} - ${post.rentPostStatus || '未提供狀態'}`;
                postsList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = '暫無房源資訊';
            postsList.appendChild(li);
        }
        document.getElementById('sidebar-phone').href = property.urlPhone ? `tel:${property.urlPhone}` : '#';
        document.getElementById('sidebar-line').href = property.urlLine || '#';
        document.getElementById('sidebar-mail').href = property.urlMail ? `mailto:${property.urlMail}` : '#';
    }
    function closeSidebar() {
        sidebar.classList.add('closed');
    }
    function fetchRentDataAndOpenSidebar(rentId) {
        const rentUrl = `${baseUrl}/Rent/${rentId}`;
        fetch(rentUrl, {
                headers: {
                    'Accept': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                }
            })
            .then(response => response.ok ? response.json() : Promise.reject(response))
            .then(data => {
                if (data && data.length > 0) {
                    openSidebar(data[0]);
                }
            })
            .catch(error => console.error('獲取房產詳細資料時發生錯誤:', error));
    }
    sidebar.classList.add('closed');
    const overlay = document.getElementById('overlay');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterFormLink = document.getElementById('show-register-form');
    const showLoginFormLink = document.getElementById('show-login-form');
    const loginButton = document.getElementById('login-button');
    function showLoginModal() {
        overlay.classList.remove('hidden');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    }
    function showRegisterModal() {
        overlay.classList.remove('hidden');
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    }
    function hideAuthModal() {
        overlay.classList.add('hidden');
    }
    if (closeModalBtn) closeModalBtn.addEventListener('click', hideAuthModal);
    if (showRegisterFormLink) showRegisterFormLink.addEventListener('click', e => {
        e.preventDefault();
        showRegisterModal();
    });
    if (showLoginFormLink) showLoginFormLink.addEventListener('click', e => {
        e.preventDefault();
        showLoginModal();
    });
    if (loginButton) loginButton.addEventListener('click', showLoginModal);
    const loginSubmit = document.getElementById('loginForm');
    if (loginSubmit) {
        loginSubmit.addEventListener('submit', e => {
            e.preventDefault();
            console.log('登入資訊：', document.getElementById('login-email').value, document.getElementById('login-password').value);
        });
    }
    const registerSubmit = document.getElementById('registerForm');
    if (registerSubmit) {
        registerSubmit.addEventListener('submit', e => {
            e.preventDefault();
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            if (password === confirmPassword) {
                console.log('註冊資訊：', document.getElementById('register-email').value, password);
            } else {
                alert('密碼不一致！');
            }
        });
    }
});