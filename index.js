document.addEventListener("DOMContentLoaded", function () {
    // 初始化 Leaflet 地圖
    var map = L.map('map').setView([23.704454, 120.428517], 16);

    // 創建並設定預設圖釘圖示(CSS)
    var cssIcon = L.divIcon({
        className: 'css-icon',
        html: '<div></div>',
        iconSize: [26, 26],
        iconAnchor: [13, 26]
    });
    L.Marker.prototype.options.icon = cssIcon;

    // 添加 OpenStreetMap 圖層
    L.tileLayer('https://tile.openstreetmap.bzh/br/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors & CartoDB',
        maxZoom: 19
    }).addTo(map);

    // 創建 Feature Group 來管理不同類型的標記
    let rentMarkers = L.featureGroup().addTo(map);
    let restaurantMarkers = L.featureGroup().addTo(map);

    var sidebar = document.getElementById('sidebar');

    // API 基礎 URL
    const baseUrl = 'https://api.xn--pqq3gk62n33n.com';

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
        posts: [
            { id: "test1", rentMoney: 10000, roomName: "測試房A", rentPostStatus: "可預約", rentStatus: 1 },
            { id: "test2", rentMoney: 15000, roomName: "測試房B", rentPostStatus: "已出租", rentStatus: 3 }
        ],
        urlPhone: "tel:+886123456789", urlLine: "https://line.me/ti/p/testline", urlMail: "mailto:test@test.com",
        rentPriceRange: "10000-15000", userID: "test_user",
        type: 'rent'
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
        posts: [
            { id: "test1", rentMoney: 10000, roomName: "測試房A", rentPostStatus: "可預約", rentStatus: 1 },
            { id: "test2", rentMoney: 15002, roomName: "測試房B", rentPostStatus: "已出租", rentStatus: 3 },
            { id: "test3", rentMoney: 17352, roomName: "測試房CCC", rentPostStatus: "即將釋出", rentStatus: 2 }
        ],
        urlPhone: "tel:+886123456789", urlLine: "https://line.me/ti/p/testline", urlMail: "mailto:test@test.com",
        rentPriceRange: "10000-17532", userID: "test_user",
        type: 'rent'
    };

    // 立即顯示原始的「陽光公寓(測試)」
    const testTooltipContent = `<b>${sunshineApartmentData.name}</b><br>租金範圍: ${sunshineApartmentData.rentPriceRange}`;
    L.marker([sunshineApartmentData.coordinates.latitude, sunshineApartmentData.coordinates.longitude])
        .addTo(map)
        .on('click', () => openSidebar(sunshineApartmentData))
        .bindTooltip(testTooltipContent);

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
                if (response.ok) {
                    return response.json();
                }
                if (response.status === 409) {
                    throw new Error('此項目已在您的收藏清單中。');
                }
                throw new Error('加入收藏失敗，請稍後再試。');
            })
            .then(data => {
                console.log('加入收藏成功:', data);
                alert('加入收藏成功！');
            })
            .catch(error => {
                console.error('加入收藏時發生錯誤:', error.message);
                alert(error.message);
            });
    }

    const bookmarksPanel = document.getElementById('bookmarks-panel');
    const bookmarksListContainer = document.getElementById('bookmarks-list-container');
    const closeBookmarksPanelBtn = document.getElementById('close-bookmarks-panel-btn');

    function hideBookmarksPanel() {
        bookmarksPanel.classList.remove('open');
    }

    function showBookmarksPanel() {
        if (!currentUserData) {
            alert('請先登入！');
            return;
        }
        bookmarksPanel.classList.add('open');
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
                const apiData = data.map(item => ({ ...item, type: 'rent' }));
                const combinedData = [sunshineApartmentData2, ...apiData];
                rentMarkers.clearLayers();
                if (combinedData && combinedData.length > 0) {
                    combinedData.forEach(property => {
                        if (property.coordinates) {
                            const tooltipContent = `<b>${property.name}</b><br>租金範圍: ${property.rentPriceRange || '未提供'}`;
                            const marker = L.marker([property.coordinates.latitude, property.coordinates.longitude])
                                .addTo(rentMarkers)
                                .bindTooltip(tooltipContent);
                            marker.on('click', () => openSidebar(property));
                        }
                    });
                }
            })
            .catch(error => {
                console.error('載入房源資料時發生錯誤:', error);
                console.log('API 請求失敗，但仍顯示模擬的測試資料點...');
                rentMarkers.clearLayers();
                const property = sunshineApartmentData2;
                const tooltipContent = `<b>${property.name}</b><br>租金範圍: ${property.rentPriceRange || '未提供'}`;
                const marker = L.marker([property.coordinates.latitude, property.coordinates.longitude])
                    .addTo(rentMarkers)
                    .bindTooltip(tooltipContent);
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
                        if (restaurant.latitude && restaurant.longitude) {
                            const marker = L.marker([restaurant.latitude, restaurant.longitude])
                                .addTo(restaurantMarkers)
                                .bindTooltip(restaurant.name || '無餐廳名稱');

                            const restaurantDataForSidebar = {
                                ...restaurant,
                                type: 'restaurant',
                                mainContent: restaurant.mainContent || '暫無餐廳介紹'
                            };
                            marker.on('click', () => openSidebar(restaurantDataForSidebar));
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

        const sidebarImg = document.getElementById('sidebar-img');
        const sidebarImgPlaceholder = document.getElementById('sidebar-img-placeholder');
        const priceElement = document.getElementById('sidebar-price');
        const postsList = document.getElementById('sidebar-posts');
        const bookmarkButtonWrapper = document.getElementById('bookmark-button-wrapper');
        const titleElement = document.getElementById('sidebar-title');
        const contentElement = document.getElementById('sidebar-content');
        const cityElement = document.getElementById('sidebar-city');

        sidebarImg.style.display = 'none';
        sidebarImgPlaceholder.style.display = 'flex';

        if (property.type === 'restaurant') {
            sidebarImg.src = property.coverImage || 'images/DefaultRestaurant.jpg';
            sidebarImg.onerror = () => { sidebarImg.src = 'images/DefaultRestaurant.jpg'; };

            priceElement.style.display = 'none';
            postsList.style.display = 'none';
            if (bookmarkButtonWrapper) bookmarkButtonWrapper.style.display = 'none';

        } else { // 房源的設定
            // 設定一個變數來存放最終的圖片 URL，預設為本地的圖片
            let imageUrl = 'images/DefaultHotel.jpg'; 

            // 如果 API 回應中有 coverImage，則組合出完整的 URL
            if (property.coverImage) {
                imageUrl = baseUrl + property.coverImage;
            }

            // 將組合好的 URL 或預設圖片路徑設定給圖片
            sidebarImg.src = imageUrl;

            // 如果圖片載入失敗（例如 API 給了錯誤的路徑），則顯示本地的預設圖片作為最終的備案
            sidebarImg.onerror = () => { sidebarImg.src = 'images/DefaultHotel.jpg'; };

            if (priceElement) {
                priceElement.innerHTML = '';
                priceElement.style.display = 'none';
            }

            postsList.style.display = 'block';

            postsList.innerHTML = '';
            if (property.posts && property.posts.length > 0) {
                property.posts.forEach(post => {
                    const li = document.createElement('li');
                    let statusText = '';

                    switch (post.rentStatus) {
                        case 1:
                            li.classList.add('status-available');
                            statusText = '尚有空房';
                            break;
                        case 2:
                            li.classList.add('status-upcoming');
                            statusText = '即將釋出';
                            break;
                        case 3:
                            li.classList.add('status-rented');
                            statusText = '完租';
                            break;
                        default:
                            li.classList.add('status-rented');
                            statusText = '狀態不明';
                            break;
                    }

                    const roomNameSpan = `<span class="room-name">${post.roomName || '未提供房名'}</span>`;
                    const rentMoneySpan = `<span class="room-money">${post.rentMoney !== undefined ? post.rentMoney : ''}</span>`;
                    const rentStatusSpan = `<span class="room-status">${statusText}</span>`;

                    li.innerHTML = `${roomNameSpan}${rentMoneySpan}${rentStatusSpan}`;
                    postsList.appendChild(li);
                });
            } else {
                const li = document.createElement('li');
                li.textContent = '暫無房源資訊';
                postsList.appendChild(li);
            }

            if (currentUserData) {
                if (bookmarkButtonWrapper) bookmarkButtonWrapper.style.display = 'flex';
            } else {
                if (bookmarkButtonWrapper) bookmarkButtonWrapper.style.display = 'none';
            }
        }

        sidebarImg.onload = () => {
            sidebarImg.style.display = 'block';
            sidebarImgPlaceholder.style.display = 'none';
        };

        titleElement.innerText = property.name || '未提供名稱';
        contentElement.innerText = property.mainContent || '';
        if (cityElement) {
            // cityElement.innerHTML = '<strong>城市:</strong> ' + (property.cityName || '未提供');
        }

        const phoneEl = document.getElementById('sidebar-phone');
        const lineEl = document.getElementById('sidebar-line');
        const mailEl = document.getElementById('sidebar-mail');

        if (property.urlPhone) {
            const displayPhone = property.urlPhone.replace('tel:', '').replace('+886', '0');
            phoneEl.innerHTML = `電話：<span>${displayPhone}</span>`;
            phoneEl.style.display = 'flex';
        } else {
            phoneEl.style.display = 'none';
        }

        if (property.urlLine) {
            const displayLine = property.urlLine.split('/').pop();
            lineEl.innerHTML = `Line ID：<span>${displayLine}</span>`;
            lineEl.style.display = 'flex';
        } else {
            lineEl.style.display = 'none';
        }

        if (property.urlMail) {
            const displayMail = property.urlMail.replace('mailto:', '');
            mailEl.innerHTML = `電子郵件：<span>${displayMail}</span>`;
            mailEl.style.display = 'flex';
        } else {
            mailEl.style.display = 'none';
        }
    }

    function closeSidebar() {
        sidebar.classList.add('closed');
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
        bookmarksListButton.addEventListener('click', showBookmarksPanel);
    }
    if (closeBookmarksPanelBtn) {
        closeBookmarksPanelBtn.addEventListener('click', hideBookmarksPanel);
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