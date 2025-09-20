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

    // 最終版 API 基礎 URL
    const baseUrl = 'https://xn--pqq3gk62n33n.com';

    // API 路徑
    const rentRegionMapUrl = `${baseUrl}/Rent/RegionMap`;
    const restaurantRegionMapUrl = `${baseUrl}/Restaurant/RegionMap`;

    // 原始的靜態測試物件
    const sunshineApartmentData = {
        coverImage: "https://media.gq.com.tw/photos/61e134dac128c151658f7506/16:9/w_1920,c_limit/casas%20caras%20cover.jpeg",
        name: "陽光公寓 (測試)",
        cityName: "台北市",
        coordinates: { latitude: 23.7029651, longitude: 120.4287316 },
        mainContent: "這是一個預設標註在地圖上的地點，主要用途是作為系統功能測試與展示之用。",
        id: "test_id",
        rentStatus: 1, vacantRooms: 2, upcomingVacancies: 0,
        posts: [{ id: "test1", rentMoney: 10000, roomName: "測試房A", rentPostStatus: "可預約" }, { id: "test2", rentMoney: 15000, roomName: "測試房B", rentPostStatus: "已出租" }],
        urlPhone: "tel:+886123456789", urlLine: "https://line.me/ti/p/testline", urlMail: "mailto:test@test.com",
        rentPriceRange: "10000-15000", userID: "test_user"
    };

    // 新增的靜態測試物件 (測試2)，模擬從 API 抓取
    const sunshineApartmentData2 = {
        coverImage: "https://media.gq.com.tw/photos/61e134dac128c151658f7506/16:9/w_1920,c_limit/casas%20caras%20cover.jpeg",
        name: "陽光公寓(測試2)",
        cityName: "台北市",
        coordinates: { latitude: 23.7029651, longitude: 120.43364 },
        mainContent: "這是「測試2」的預設標註，模擬從 API 抓取。",
        id: "test_id_2",
        rentStatus: 1, vacantRooms: 2, upcomingVacancies: 0,
        posts: [{ id: "test1", rentMoney: 10000, roomName: "測試房A", rentPostStatus: "可預約" }, { id: "test2", rentMoney: 15000, roomName: "測試房B", rentPostStatus: "已出租" }],
        urlPhone: "tel:+886123456789", urlLine: "https://line.me/ti/p/testline", urlMail: "mailto:test@test.com",
        rentPriceRange: "10000-15000", userID: "test_user"
    };

    // 立即顯示原始的「陽光公寓(測試)」
    L.marker([sunshineApartmentData.coordinates.latitude, sunshineApartmentData.coordinates.longitude])
        .addTo(map)
        .on('click', () => openSidebar(sunshineApartmentData))
        .bindTooltip(sunshineApartmentData.name);

    // --- 全域變數定義 ---
    const loginButton = document.getElementById('login-button');
    const bookmarksListButton = document.getElementById('bookmarks-list-button');
    let currentUserData = null;

    // --- 函式定義 ---
    function updateUIToLoggedIn(userData) {
        currentUserData = userData;
        loginButton.innerText = '登出';
        bookmarksListButton.style.display = 'block';
    }

    function updateUIToLoggedOut() {
        currentUserData = null;
        localStorage.removeItem('userData');
        loginButton.innerText = '登入';
        bookmarksListButton.style.display = 'none';
    }

    function handleBookmarkClick(userId, rentId) {
        console.log(`使用者 ${userId} 想要加入書籤，房源 ID: ${rentId}`);
        const requestData = { userID: userId, ID: rentId };

        fetch(`${baseUrl}/Users/bookmarks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        })
            .then(response => {
                if (!response.ok) { throw new Error('加入收藏失敗'); }
                return response.json();
            })
            .then(data => {
                console.log('加入收藏成功:', data);
                alert('加入收藏成功！');
            })
            .catch(error => {
                console.error('加入收藏時發生錯誤:', error);
                alert('加入收藏失敗，可能已經收藏過了。');
            });
    }

    const bookmarksOverlay = document.getElementById('bookmarks-overlay');
    const bookmarksListContainer = document.getElementById('bookmarks-list-container');
    const closeBookmarksModalBtn = document.getElementById('close-bookmarks-modal-btn');

    function hideBookmarksModal() {
        bookmarksOverlay.classList.add('hidden');
    }

    function showBookmarksModal() {
        if (!currentUserData) {
            alert('請先登入！');
            return;
        }
        bookmarksOverlay.classList.remove('hidden');
        bookmarksListContainer.innerHTML = '<p>載入中...</p>';

        fetch(`${baseUrl}/Users/${currentUserData.userID}/bookmarks`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        })
            .then(response => response.ok ? response.json() : Promise.reject(response))
            .then(data => {
                const bookmarkedRentals = data.bookmarks.Rent;
                if (bookmarkedRentals.length === 0) {
                    bookmarksListContainer.innerHTML = '<p>您尚未收藏任何房源。</p>';
                    return;
                }
                let listHtml = '<ul>';
                bookmarkedRentals.forEach(item => {
                    listHtml += `<li>${item.name || item.id}</li>`;
                });
                listHtml += '</ul>';
                bookmarksListContainer.innerHTML = listHtml;
            })
            .catch(error => {
                console.error('獲取收藏清單時發生錯誤:', error);
                bookmarksListContainer.innerHTML = '<p>載入失敗，請稍後再試。</p>';
            });
    }

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

        fetch(url, { headers: { 'Accept': 'application/json' } })
            .then(response => response.ok ? response.json() : Promise.reject(response))
            .then(data => {
                const combinedData = [sunshineApartmentData2, ...data];
                rentMarkers.clearLayers();
                if (combinedData && combinedData.length > 0) {
                    combinedData.forEach(property => {
                        if (property.coordinates) {
                            const marker = L.marker([property.coordinates.latitude, property.coordinates.longitude])
                                .addTo(rentMarkers)
                                .bindTooltip(property.name);

                            if (property.id === 'test_id_2' || property.id === 'test_id') {
                                marker.on('click', () => openSidebar(property));
                            } else {
                                marker.on('click', () => fetchRentDataAndOpenSidebar(property.id));
                            }
                        }
                    });
                }
            })
            .catch(error => {
                console.error('載入房源資料時發生錯誤:', error);
                console.log('API 請求失敗，但仍顯示模擬的測試資料點...');
                rentMarkers.clearLayers();
                const property = sunshineApartmentData2;
                const marker = L.marker([property.coordinates.latitude, property.coordinates.longitude])
                    .addTo(rentMarkers)
                    .bindTooltip(property.name);
                marker.on('click', () => openSidebar(property));
            });
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

        fetch(url, { headers: { 'Accept': 'application/json' } })
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

        const bookmarkButton = document.getElementById('bookmark-button');
        if (currentUserData) {
            bookmarkButton.style.display = 'block';
            bookmarkButton.onclick = function () {
                handleBookmarkClick(currentUserData.userID, property.id);
            };
        } else {
            bookmarkButton.style.display = 'none';
        }
    }

    function closeSidebar() {
        sidebar.classList.add('closed');
    }

    function fetchRentDataAndOpenSidebar(rentId) {
        const rentUrl = `${baseUrl}/Rent/${rentId}`;
        fetch(rentUrl, {
            headers: { 'Accept': 'application/json' }
        })
            .then(response => response.ok ? response.json() : Promise.reject(response))
            .then(data => {
                if (data && data.length > 0) {
                    openSidebar(data[0]);
                }
            })
            .catch(error => console.error('獲取房產詳細資料時發生錯誤:', error));
    }

    // --- 事件監聽與初始設定 ---
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

    map.on('click', closeSidebar);

    const refreshButton = document.getElementById('refresh-button');
    if (refreshButton) {
        refreshButton.addEventListener('click', function () {
            console.log('手動更新按鈕被點擊，正在抓取目前範圍的資料...');
            loadRentalsInView();
            loadRestaurantsInView();
        });
    }

    if (bookmarksListButton) {
        bookmarksListButton.addEventListener('click', showBookmarksModal);
    }
    if (closeBookmarksModalBtn) {
        closeBookmarksModalBtn.addEventListener('click', hideBookmarksModal);
    }

    if (loginButton) {
        loginButton.addEventListener('click', () => {
            if (currentUserData) {
                if (confirm('您確定要登出嗎？')) {
                    updateUIToLoggedOut();
                    alert('您已成功登出。');
                }
            } else {
                showLoginModal();
            }
        });
    }

    sidebar.classList.add('closed');
    const overlay = document.getElementById('overlay');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterFormLink = document.getElementById('show-register-form');
    const showLoginFormLink = document.getElementById('show-login-form');

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

    const loginSubmit = document.getElementById('loginForm');
    if (loginSubmit) {
        loginSubmit.addEventListener('submit', e => {
            e.preventDefault();
            const userName = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const loginData = { userName: userName, password: password };

            fetch(`${baseUrl}/Users/Login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginData)
            })
                .then(response => response.ok ? response.json() : response.json().then(err => Promise.reject(err)))
                .then(data => {
                    console.log('登入成功:', data);
                    alert(`登入成功！歡迎 ${data.userName}`);
                    localStorage.setItem('userData', JSON.stringify(data));
                    updateUIToLoggedIn(data);
                    hideAuthModal();
                })
                .catch(error => {
                    console.error('登入時發生錯誤:', error);
                    alert(`登入失敗：${(error.detail && error.detail[0] && error.detail[0].msg) || error.detail || '請檢查您的帳號密碼'}`);
                });
        });
    }

    const registerSubmit = document.getElementById('registerForm');
    if (registerSubmit) {
        registerSubmit.addEventListener('submit', e => {
            e.preventDefault();
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (password !== confirmPassword) {
                alert('兩次輸入的密碼不一致！');
                return;
            }

            const registerData = {
                userName: document.getElementById('register-userName').value,
                password: password,
                sex: document.getElementById('register-sex').value,
                email: document.getElementById('register-email').value,
                phoneNumber: document.getElementById('register-phoneNumber').value
            };

            fetch(`${baseUrl}/Users/Register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registerData)
            })
                .then(response => response.ok ? response.json() : response.json().then(err => Promise.reject(err)))
                .then(data => {
                    console.log('註冊成功:', data);
                    alert('註冊成功！現在您可以直接登入。');
                    showLoginModal();
                })
                .catch(error => {
                    console.error('註冊時發生錯誤:', error);
                    alert(`註冊失敗：${(error.detail && error.detail[0] && error.detail[0].msg) || error.detail || '請檢查您輸入的資料'}`);
                });
        });
    }

    function checkInitialLoginState() {
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
            const userData = JSON.parse(storedUserData);
            updateUIToLoggedIn(userData);
        }
    }
    checkInitialLoginState();
});