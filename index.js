document.addEventListener("DOMContentLoaded", function () {
    // 初始化 Leaflet 地圖
    var map = L.map('map').setView([23.704454, 120.428517], 16);

    L.tileLayer('https://tile.openstreetmap.bzh/br/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors & CartoDB',
        maxZoom: 19
    }).addTo(map);

    let rentMarkers = L.featureGroup().addTo(map);
    let restaurantMarkers = L.featureGroup().addTo(map);

    var sidebar = document.getElementById('sidebar');
    const baseUrl = 'https://api.xn--pqq3gk62n33n.com';
    const rentRegionMapUrl = `${baseUrl}/Rent/RegionMap`;
    const restaurantRegionMapUrl = `${baseUrl}/Restaurant/RegionMap`;

    // --- Lightbox 全域變數 ---
    let allPropertyPosts = [];
    let currentRoomIndex = 0;
    let currentImageIndex = 0;
    let currentPropertyData = null;

    // 原始的靜態測試物件
    const sunshineApartmentData = {
        coverImage: "https://media.gq.com.tw/photos/61e134dac128c151658f7506/16:9/w_1920,c_limit/casas%20caras%20cover.jpeg",
        name: "陽光公寓 (測試)",
        cityName: "台北市",
        coordinates: { latitude: 23.7029651, longitude: 120.4287316 },
        mainContent: "這是一個預設標註在地圖上的地點，主要用途是作為系統功能測試與展示之用。",
        id: "test_id",
        type: 'rent',
        posts: [
            { id: "test1", rentMoney: 10000, roomName: "測試房A", rentPostStatus: "可預約", rentStatus: 1, imageResources: [] },
            { id: "test2", rentMoney: 15000, roomName: "測試房B", rentPostStatus: "已出租", rentStatus: 3, imageResources: [] }
        ],
        urlPhone: "tel:+886123456789", urlLine: "https://line.me/ti/p/testline", urlMail: "mailto:test@test.com",
        rentPriceRange: "10000~15000"
    };

    // 新增的靜態測試物件 (測試2)
    const sunshineApartmentData2 = {
        coverImage: "images/DefaultHotel.jpg",
        name: "陽光公寓(測試2)",
        cityName: "台北市",
        coordinates: { latitude: 23.7029651, longitude: 120.43364 },
        mainContent: "這是「測試2」的預設標註，使用本地圖片。",
        id: "test_id_2",
        type: 'rent',
        posts: [
            { id: "test1", rentMoney: 10000, roomName: "測試房A", rentPostStatus: "可預約", rentStatus: 1, imageResources: ["images/Room1.jpg", "images/Room2.jpg"],lightboxDescription: "這是一段測試房A的說明文字，大約三十個字，用來展示燈箱中的浮動資訊卡片效果。" },
            { id: "test2", rentMoney: 15002, roomName: "測試房B", rentPostStatus: "已出租", rentStatus: 3, imageResources: [],lightboxDescription: "這是測試房B的說明，風格簡約，採光良好，交通便利，是您居住的最佳選擇，歡迎隨時預約看房。" },
            { id: "test3", rentMoney: 17352, roomName: "測試房CCC", rentPostStatus: "即將釋出", rentStatus: 2, imageResources: ["images/Room3.jpg"] }
        ],
        urlPhone: "tel:+886123456789", urlLine: "https://line.me/ti/p/testline", urlMail: "mailto:test@test.com",
        rentPriceRange: "10000~17532"
    };

    function formatNumberWithCommas(num) {
        if (num === undefined || num === null || isNaN(num)) return '';
        return num.toLocaleString();
    }

    function formatPriceRange(rangeString) {
        if (!rangeString) return '未提供';

        // 移除字串中所有的逗號
        const cleanedString = String(rangeString).replace(/,/g, '');
        
        // 使用波浪號 ~ 來分割字串
        const parts = cleanedString.split('~');

        if (parts.length === 2) {
            const start = parseInt(parts[0], 10);
            const end = parseInt(parts[1], 10);
            if (!isNaN(start) && !isNaN(end)) {
                // 格式化後用 ~ 組合回傳
                return `${start.toLocaleString()}~${end.toLocaleString()}`;
            }
        }

        // 處理單一價格的情況
        const singleNum = parseInt(cleanedString, 10);
        if (!isNaN(singleNum)) {
            return singleNum.toLocaleString();
        }

        // 如果格式不符預期，直接回傳原始字串
        return rangeString;
    }

    const loginButton = document.getElementById('login-button');
    const bookmarksListButton = document.getElementById('bookmarks-list-button');
    let currentUserData = null;

    const lightboxOverlay = document.getElementById('lightbox-overlay');
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxCloseBtn = document.getElementById('lightbox-close');
    const lightboxImagePrevBtn = document.getElementById('lightbox-image-prev');
    const lightboxImageNextBtn = document.getElementById('lightbox-image-next');
    const lightboxRoomPrevBtn = document.getElementById('lightbox-room-prev');
    const lightboxRoomNextBtn = document.getElementById('lightbox-room-next');
    const lightboxImageCounter = document.getElementById('lightbox-image-counter');
    const lightboxRoomCounter = document.getElementById('lightbox-room-counter');
    const lightboxRoomName = document.getElementById('lightbox-room-name');
    const postsListContainer = document.getElementById('sidebar-posts');
    const lightboxRoomNav = document.getElementById('lightbox-room-nav');

    function updateLightbox() {
        if (allPropertyPosts.length === 0 || !allPropertyPosts[currentRoomIndex]) return;
        const currentRoom = allPropertyPosts[currentRoomIndex];
        const currentImages = currentRoom.imageResources || [];
        /*房間描述文字*/
        const roomDescriptionCard = document.getElementById('lightbox-room-description');
        const placeholder = document.getElementById('lightbox-description-placeholder');

        if (roomDescriptionCard && placeholder) {
            if (currentRoom.lightboxDescription) {
                roomDescriptionCard.textContent = currentRoom.lightboxDescription;
                // 當有文字時，讓卡片和佔位元素都「可見」
                roomDescriptionCard.style.visibility = 'visible';
                placeholder.style.visibility = 'visible';
            } else {
                // 當沒有文字時，讓它們都「隱藏」
                roomDescriptionCard.style.visibility = 'hidden';
                placeholder.style.visibility = 'hidden';
            }
        }

        if (currentImages.length > 0 && currentImages[currentImageIndex]) {
            const imagePath = currentImages[currentImageIndex];
            let finalImageUrl;
            if (imagePath.startsWith('/')) {
                finalImageUrl = baseUrl + imagePath;
            } else {
                finalImageUrl = imagePath;
            }
            lightboxImage.src = finalImageUrl;
        } else {
            lightboxImage.src = 'images/DefaultHotel.jpg';
        }
        lightboxRoomName.textContent = currentRoom.roomName || '房間詳情';
        lightboxImageCounter.textContent = currentImages.length > 0 ? `${currentImageIndex + 1} / ${currentImages.length}` : '0 / 0';
        lightboxRoomCounter.textContent = `房間 ${currentRoomIndex + 1} / ${allPropertyPosts.length}`;
        lightboxImagePrevBtn.style.display = currentImages.length > 1 ? 'block' : 'none';
        lightboxImageNextBtn.style.display = currentImages.length > 1 ? 'block' : 'none';
        lightboxRoomNav.style.display = allPropertyPosts.length > 1 ? 'flex' : 'none';
    }

    function openLightbox(roomIndex) {
        currentRoomIndex = roomIndex;
        currentImageIndex = 0;
        updateLightbox();
        lightboxOverlay.classList.remove('hidden');
    }

    function closeLightbox() {
        lightboxOverlay.classList.add('hidden');
    }

    function nextImage() {
        if (!allPropertyPosts[currentRoomIndex]) return;
        const currentImages = allPropertyPosts[currentRoomIndex].imageResources || [];
        if (currentImages.length > 1) {
            currentImageIndex = (currentImageIndex + 1) % currentImages.length;
            updateLightbox();
        }
    }

    function prevImage() {
        if (!allPropertyPosts[currentRoomIndex]) return;
        const currentImages = allPropertyPosts[currentRoomIndex].imageResources || [];
        if (currentImages.length > 1) {
            currentImageIndex = (currentImageIndex - 1 + currentImages.length) % currentImages.length;
            updateLightbox();
        }
    }

    function nextRoom() {
        if (!allPropertyPosts[currentRoomIndex]) return;
        if (allPropertyPosts.length > 1) {
            currentRoomIndex = (currentRoomIndex + 1) % allPropertyPosts.length;
            currentImageIndex = 0;
            updateLightbox();
        }
    }

    function prevRoom() {
        if (!allPropertyPosts[currentRoomIndex]) return;
        if (allPropertyPosts.length > 1) {
            currentRoomIndex = (currentRoomIndex - 1 + allPropertyPosts.length) % allPropertyPosts.length;
            currentImageIndex = 0;
            updateLightbox();
        }
    }
    
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
        const requestData = { userID: userId, ID: rentId };
        fetch(`${baseUrl}/Users/bookmarks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        }).then(response => {
            if (response.ok) return response.json();
            if (response.status === 409) throw new Error('此項目已在您的收藏清單中。');
            throw new Error('加入收藏失敗，請稍後再試。');
        }).then(data => {
            alert('加入收藏成功！');
        }).catch(error => {
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
        }).then(response => response.ok ? response.json() : Promise.reject(response))
          .then(data => {
            const bookmarkedRentals = data.bookmarks.Rent;
            if (!bookmarkedRentals || bookmarkedRentals.length === 0) {
                bookmarksListContainer.innerHTML = '<p>您尚未收藏任何房源。</p>';
                return;
            }
            let listHtml = '<ul>';
            bookmarkedRentals.forEach(item => {
                listHtml += `<li>${item.name || item.id}</li>`;
            });
            listHtml += '</ul>';
            bookmarksListContainer.innerHTML = listHtml;
        }).catch(error => {
            console.error('獲取收藏清單時發生錯誤:', error);
            bookmarksListContainer.innerHTML = '<p>載入失敗，請稍後再試。</p>';
        });
    }
    
    function displayMarkers(markerData) {
    rentMarkers.clearLayers();
    if (markerData && markerData.length > 0) {
        markerData.forEach(property => {
            if (property.coordinates) {
                // 如果 API 沒有提供 ringColor，就使用預設的藍色
                const iconColor = property.ringColor || '#3498db';

                // 為每個 marker 動態創建一個帶有顏色的 icon
                const dynamicIcon = L.divIcon({
                    className: 'css-icon',
                    html: `<div style="background-color: ${iconColor};"></div>`,
                    iconSize: [26, 26],
                    iconAnchor: [13, 26]
                });

                const tooltipContent = `<b>${property.name}</b><br>租金範圍: ${formatPriceRange(property.rentPriceRange)}`;
                
                // 在創建 marker 時傳入動態生成的 icon
                const marker = L.marker([property.coordinates.latitude, property.coordinates.longitude], { icon: dynamicIcon })
                    .addTo(rentMarkers)
                    .bindTooltip(tooltipContent);

                marker.on('click', () => openSidebar(property));
            }
        });
    }
}
    
    function loadRentalsInView() {
        const bounds = map.getBounds();
        const center = bounds.getCenter();
        const latitudeDelta = bounds.getNorth() - bounds.getSouth();
        const longitudeDelta = bounds.getEast() - bounds.getWest();
        const url = new URL(rentRegionMapUrl);
        url.search = new URLSearchParams({ latitude: center.lat, longitude: center.lng, latitudeDelta, longitudeDelta }).toString();
        
        fetch(url, { headers: { 'Accept': 'application/json' } })
            .then(response => response.ok ? response.json() : Promise.reject(response))
            .then(data => {
                const apiData = data.map(item => ({ ...item, type: 'rent' }));
                displayMarkers(apiData);
            })
            .catch(error => {
                console.error('載入房源資料時發生錯誤:', error);
                console.log('API 請求失敗，顯示預設測試資料點...');
                displayMarkers([sunshineApartmentData, sunshineApartmentData2]);
            });
    }

    function loadRestaurantsInView() {
        const bounds = map.getBounds();
        const center = bounds.getCenter();
        const latitudeDelta = bounds.getNorth() - bounds.getSouth();
        const longitudeDelta = bounds.getEast() - bounds.getWest();
        const url = new URL(restaurantRegionMapUrl);
        url.search = new URLSearchParams({ latitude: center.lat, longitude: center.lng, latitudeDelta, longitudeDelta, includeAll: true }).toString();
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
                            const restaurantDataForSidebar = { ...restaurant, type: 'restaurant', mainContent: restaurant.mainContent || '暫無餐廳介紹' };
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
        currentPropertyData = property;
        closeLightbox();
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
            let imageUrl = 'images/DefaultRestaurant.jpg';
            if (property.coverImage) {
                imageUrl = baseUrl + property.coverImage;
            }
            sidebarImg.src = imageUrl;
            sidebarImg.onerror = () => { sidebarImg.src = 'images/DefaultRestaurant.jpg'; };
            if (priceElement) priceElement.style.display = 'none';
            if (postsList) postsList.style.display = 'none';
            if (bookmarkButtonWrapper) bookmarkButtonWrapper.style.display = 'none';
        } else {
            let imageUrl = 'images/DefaultHotel.jpg';
            if (property.coverImage) {
                if (property.coverImage.startsWith('/')) {
                    imageUrl = baseUrl + property.coverImage;
                } else {
                    imageUrl = property.coverImage;
                }
            }
            sidebarImg.src = imageUrl;
            sidebarImg.onerror = () => { sidebarImg.src = 'images/DefaultHotel.jpg'; };
            
            allPropertyPosts = property.posts || [];
            
            if (priceElement) {
                priceElement.innerHTML = '';
                priceElement.style.display = 'none';
            }
            if (postsList) postsList.style.display = 'block';

            postsList.innerHTML = '';
            if (property.posts && property.posts.length > 0) {
                const defaultRoomImages = ['images/Room1.jpg', 'images/Room2.jpg', 'images/Room3.jpg'];
                property.posts.forEach((post, index) => {
                    const li = document.createElement('li');
                    const statusStringFromServer = post.rentPostStatus || '狀態不明';

                    if (statusStringFromServer.includes('空房') || statusStringFromServer.includes('可預約')) {
                        li.classList.add('status-available');
                    } else if (statusStringFromServer.includes('即將釋出')) {
                        li.classList.add('status-upcoming');
                    } else {
                        li.classList.add('status-rented');
                    }
                    
                    let roomImageHtml;
                    if (post.imageResources && post.imageResources.length > 0) {
                        const firstImageUrl = post.imageResources[0].startsWith('/') ? baseUrl + post.imageResources[0] : post.imageResources[0];
                        roomImageHtml = `<img src="${firstImageUrl}" class="room-image" data-room-index="${index}">`;
                    } else {
                        const defaultImageSrc = defaultRoomImages[index % defaultRoomImages.length];
                        if (!post.imageResources) {
                            post.imageResources = [];
                        }
                        post.imageResources[0] = defaultImageSrc;
                        roomImageHtml = `<img src="${defaultImageSrc}" class="room-image" data-room-index="${index}">`;
                    }
                    
                    const roomNameSpan = `<span class="room-name">${post.roomName || '未提供房名'}</span>`;
                    const rentMoneySpan = `<span class="room-money">${formatNumberWithCommas(post.rentMoney)}</span>`;
                    const rentStatusSpan = `<span class="room-status">${statusStringFromServer}</span>`;
                    const metaInfo = `<div class="room-meta">${rentMoneySpan}${rentStatusSpan}</div>`;
                    const textInfo = `<div class="room-text-info">${roomNameSpan}${metaInfo}</div>`;
                    li.innerHTML = `${roomImageHtml}${textInfo}`;
                    postsList.appendChild(li);
                });
            } else {
                allPropertyPosts = [];
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
        } else { phoneEl.style.display = 'none'; }
        if (property.urlLine) {
            const displayLine = property.urlLine.split('/').pop();
            lineEl.innerHTML = `Line ID：<span>${displayLine}</span>`;
            lineEl.style.display = 'flex';
        } else { lineEl.style.display = 'none'; }
        if (property.urlMail) {
            const displayMail = property.urlMail.replace('mailto:', '');
            mailEl.innerHTML = `電子郵件：<span>${displayMail}</span>`;
            mailEl.style.display = 'flex';
        } else { mailEl.style.display = 'none'; }
    }

    function closeSidebar() {
        sidebar.classList.add('closed');
        closeLightbox();
    }

    // --- 事件監聽與初始設定 ---
    displayMarkers([sunshineApartmentData, sunshineApartmentData2]); // 初始顯示測試資料
    loadRestaurantsInView(); // 也載入餐廳

    map.on('moveend', function() {
        // 當地圖移動停止時，可以選擇是否要自動載入新資料
        // loadRentalsInView(); 
        // loadRestaurantsInView();
    });

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                map.setView([position.coords.latitude, position.coords.longitude], 16);
                loadRentalsInView(); // 取得位置後再載入真實資料
            },
            error => {
                console.error('獲取使用者位置失敗:', error.message);
                // 失敗時，測試資料已經顯示了
            }
        );
    } else {
        console.error('瀏覽器不支援地理位置 API。');
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

    lightboxCloseBtn.addEventListener('click', closeLightbox);
    lightboxImageNextBtn.addEventListener('click', nextImage);
    lightboxImagePrevBtn.addEventListener('click', prevImage);
    lightboxRoomNextBtn.addEventListener('click', nextRoom);
    lightboxRoomPrevBtn.addEventListener('click', prevRoom);

    // 房間圖片放大-點擊燈箱背景時關閉燈箱
    lightboxOverlay.addEventListener('click', function(event) {
    // 確保點擊的是背景本身，而不是圖片、按鈕等子元素
        if (event.target === lightboxOverlay) {
            // 取得滑鼠點擊處的 X 座標
            const clickX = event.clientX;
            
            // 取得整個視窗的寬度
            const windowWidth = window.innerWidth;

            // 判斷點擊位置是在左半邊還是右半邊
            if (clickX < windowWidth / 2) {
                // 點擊了左半邊，切換到上一張圖
                prevImage();
            } else {
                // 點擊了右半邊，切換到下一張圖
                nextImage();
            }
        }
    });

    postsListContainer.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('room-image')) {
            const roomIndex = parseInt(e.target.dataset.roomIndex, 10);
            if (!isNaN(roomIndex)) {
                openLightbox(roomIndex);
            }
        }
    });

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
    if (showRegisterFormLink) showRegisterFormLink.addEventListener('click', e => { e.preventDefault(); showRegisterModal(); });
    if (showLoginFormLink) showLoginFormLink.addEventListener('click', e => { e.preventDefault(); showLoginModal(); });

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
            }).then(response => response.ok ? response.json() : response.json().then(err => Promise.reject(err)))
              .then(data => {
                console.log('登入成功:', data);
                alert(`登入成功！歡迎 ${data.userName}`);
                localStorage.setItem('userData', JSON.stringify(data));
                updateUIToLoggedIn(data);
                hideAuthModal();
            }).catch(error => {
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
            }).then(response => response.ok ? response.json() : response.json().then(err => Promise.reject(err)))
              .then(data => {
                console.log('註冊成功:', data);
                alert('註冊成功！現在您可以直接登入。');
                showLoginModal();
            }).catch(error => {
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