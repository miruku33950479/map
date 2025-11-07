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
    let currentPropertyData = null; // 儲存當前側邊欄顯示的物件資料
    let allMapProperties = []; // 儲存所有地圖上的房源資料
    let userBookmarkedRentIds = new Set(); // 儲存已收藏的 Rent ID

    // 原始的靜態測試物件
    const sunshineApartmentData = {
        coverImage: "https://media.gq.com.tw/photos/61e134dac128c151658f7506/16:9/w_1920,c_limit/casas%20caras%20cover.jpeg",
        name: "陽光公寓 (測試)",
        cityName: "台北市",
        coordinates: { latitude: 23.7029651, longitude: 120.4287316 },
        mainContent: "這是一個預設標註在地圖上的地點，主要用途是作為系統功能測試與展示之用。",
        id: "test_id",
        type: 'rent',
        vacantRooms: 0,
        upcomingVacancies: 1,
        posts: [
            // --- 修改：名稱不重要了，邏輯會覆蓋為「公共區域」 ---
            { id: "test_public", rentMoney: 0, roomName: "公共區域", publicArea: true, imageResources: ["images/Room3.jpg"] },
            { id: "test1", rentMoney: 10000, roomName: "測試房A", rentPostStatus: "可預約", rentStatus: 1, imageResources: [], publicArea: false },
            { id: "test2", rentMoney: 15000, roomName: "測試房B", rentPostStatus: "已出租", rentStatus: 3, imageResources: [], publicArea: false }
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
        vacantRooms: 2,
        upcomingVacancies: 0,
        posts: [
            // --- 新增：為測試2也加入一筆公共區域資料 ---
             { id: "test_public_2", rentMoney: 0, roomName: "健身房", publicArea: true, imageResources: ["images/Room2.jpg"] },
            { id: "test1", rentMoney: 10000, roomName: "測試房A", rentPostStatus: "可預約", rentStatus: 1, imageResources: ["images/Room1.jpg", "images/Room2.jpg"],lightboxDescription: "這是一段測試房A的說明文字，大約三十個字，用來展示燈箱中的浮動資訊卡片效果。", publicArea: false },
            { id: "test2", rentMoney: 15002, roomName: "測試房B", rentPostStatus: "已出租", rentStatus: 3, imageResources: [],lightboxDescription: "這是測試房B的說明，風格簡約，採光良好，交通便利，是您居住的最佳選擇，歡迎隨時預約看房。", publicArea: false },
            { id: "test3", rentMoney: 17352, roomName: "測試房CCC", rentPostStatus: "即將釋出", rentStatus: 2, imageResources: ["images/Room3.jpg"], publicArea: false }
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
        const cleanedString = String(rangeString).replace(/,/g, '');
        const parts = cleanedString.split('~');
        if (parts.length === 2) {
            const start = parseInt(parts[0], 10);
            const end = parseInt(parts[1], 10);
            if (!isNaN(start) && !isNaN(end)) {
                return `${start.toLocaleString()}~${end.toLocaleString()}`;
            }
        }
        const singleNum = parseInt(cleanedString, 10);
        if (!isNaN(singleNum)) {
            return singleNum.toLocaleString();
        }
        return rangeString;
    }

    const loginButton = document.getElementById('login-button');
    const bookmarksListButton = document.getElementById('bookmarks-list-button');
    let currentUserData = null;

    const bookmarkButton = document.getElementById('bookmark-button');
    if (bookmarkButton) {
        bookmarkButton.addEventListener('click', function() {
            if (!currentUserData) {
                alert('請先登入才能收藏！');
                showLoginModal();
                return;
            }
            if (!currentPropertyData || currentPropertyData.type !== 'rent') {
                alert('請先選取一個租屋物件！');
                return;
            }
            if (bookmarkButton.disabled) return;
            handleBookmarkClick(currentUserData.userID, currentPropertyData.id);
        });
    }

    const lightboxRoomNav = document.getElementById('lightbox-room-nav');
    const lightboxRoomPrevBtn = document.getElementById('lightbox-room-prev');
    const lightboxRoomNextBtn = document.getElementById('lightbox-room-next');
    const lightboxOverlay = document.getElementById('lightbox-overlay');
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxCloseBtn = document.getElementById('lightbox-close');
    const lightboxImagePrevBtn = document.getElementById('lightbox-image-prev');
    const lightboxImageNextBtn = document.getElementById('lightbox-image-next');
    const lightboxImageCounter = document.getElementById('lightbox-image-counter');
    const lightboxRoomCounter = document.getElementById('lightbox-room-counter');
    const lightboxRoomName = document.getElementById('lightbox-room-name');
    const postsListContainer = document.getElementById('sidebar-posts');

    lightboxRoomNav.style.pointerEvents = 'auto';
    lightboxRoomPrevBtn.style.pointerEvents = 'auto';
    lightboxRoomNextBtn.style.pointerEvents = 'auto';

    function updateLightbox() {
        if (allPropertyPosts.length === 0 || !allPropertyPosts[currentRoomIndex]) return;
        const currentRoom = allPropertyPosts[currentRoomIndex];
        const currentImages = currentRoom.imageResources || [];
        const roomDescriptionCard = document.getElementById('lightbox-room-description');
        const placeholder = document.getElementById('lightbox-description-placeholder');

        if (roomDescriptionCard && placeholder) {
            if (currentRoom.lightboxDescription) {
                roomDescriptionCard.textContent = currentRoom.lightboxDescription;
                roomDescriptionCard.style.visibility = 'visible';
                placeholder.style.visibility = 'visible';
            } else {
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
        
        // --- 修改：燈箱標題也檢查 publicArea ---
        if (currentRoom.publicArea === true) {
             lightboxRoomName.textContent = '公共區域'; // <-- 修改：強制命名
        } else {
             lightboxRoomName.textContent = currentRoom.roomName || '房間詳情';
        }
        
        lightboxImageCounter.textContent = currentImages.length > 0 ? `${currentImageIndex + 1} / ${currentImages.length}` : '0 / 0';
        // --- 修改：調整燈箱計數器文字 ---
        let roomCounterText = "項目"; 
        if(currentRoom.publicArea === true) {
            roomCounterText = "公共空間";
        } else {
            roomCounterText = "房間";
        }
        lightboxRoomCounter.textContent = `${roomCounterText} ${currentRoomIndex + 1} / ${allPropertyPosts.length}`;
        // --- 修改結束 ---
        
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
        loginButton.classList.add('logged-in'); 
        bookmarksListButton.style.display = 'block';
        userBookmarkedRentIds.clear();

        if (!sidebar.classList.contains('closed') && currentPropertyData && currentPropertyData.type === 'rent') {
             const btn = document.getElementById('bookmark-button');
             if(btn) btn.style.display = 'block';
        }
    }

    function updateUIToLoggedOut() {
        currentUserData = null;
        localStorage.removeItem('userData');
        loginButton.innerText = '登入';
        loginButton.classList.remove('logged-in'); 
        bookmarksListButton.style.display = 'none';
        userBookmarkedRentIds.clear();

        if (!sidebar.classList.contains('closed')) {
             const btn = document.getElementById('bookmark-button');
             if(btn) btn.style.display = 'none';
        }
    }

    function handleBookmarkClick(userId, rentId) {
        console.log('--- 收藏按鈕被點擊 ---');
        const propertyType = 'rent';
        console.log(`嘗試新增收藏: UserID: ${userId}, Type: ${propertyType}, ID: ${rentId}`);

        if (!userId || !propertyType || !rentId) {
            alert('請先登入，或房源資料不完整。');
            return;
        }

        const requestData = { userID: userId, ID: rentId };
        fetch(`${baseUrl}/Users/bookmarks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        }).then(response => {
            if (response.ok) return response.json();
            if (response.status === 409) {
                const bookmarkButton = document.getElementById('bookmark-button');
                if (bookmarkButton && !bookmarkButton.disabled) {
                    bookmarkButton.innerText = '已加入收藏';
                    bookmarkButton.disabled = true;
                    bookmarkButton.style.backgroundColor = '#6c757d';
                }
                userBookmarkedRentIds.add(rentId);
                throw new Error('此項目已在您的收藏清單中。');
            }
            throw new Error('加入收藏失敗，請稍後再試。');
        }).then(data => {
            alert('加入收藏成功！');
            console.log('API 回傳成功：已加入收藏');

            const bookmarkButton = document.getElementById('bookmark-button');
            if (bookmarkButton) {
                bookmarkButton.innerText = '已加入收藏';
                bookmarkButton.disabled = true;
                bookmarkButton.style.backgroundColor = '#6c757d';
            }

            userBookmarkedRentIds.add(rentId);

            const bookmarksPanel = document.getElementById('bookmarks-panel');
            if (bookmarksPanel && bookmarksPanel.classList.contains('open')) {
                console.log('收藏清單已開啟，正在自動刷新...');
                showBookmarksPanel();
            }

        }).catch(error => {
            if (error.message !== '此項目已在您的收藏清單中。') {
                 console.error('加入收藏時發生錯誤:', error);
                 alert(error.message);
            } else {
                 console.log('項目已在收藏中，不顯示 alert。');
            }
        });
    }

    const bookmarksPanel = document.getElementById('bookmarks-panel');
    const bookmarksListContainer = document.getElementById('bookmarks-list-container');
    const closeBookmarksPanelBtn = document.getElementById('close-bookmarks-panel-btn');

    const propertiesListButton = document.getElementById('properties-list-button');
    const propertiesPanel = document.getElementById('properties-panel');
    const propertiesListContainer = document.getElementById('properties-list-container');
    const closePropertiesPanelBtn = document.getElementById('close-properties-panel-btn');


    function hideBookmarksPanel() {
        bookmarksPanel.classList.remove('open');
    }

    function hidePropertiesPanel() {
        propertiesPanel.classList.remove('open');
    }

    function showPropertiesPanel() {
        hideBookmarksPanel(); 
        propertiesPanel.classList.add('open');
        propertiesListContainer.innerHTML = '<p>載入中...</p>'; 

        const defaultCoverImage = 'images/DefaultHotel.jpg';

        loadRentalsInView().then(updatedProperties => {
            const currentMapProperties = allMapProperties; 

            if (!currentMapProperties || currentMapProperties.length === 0) {
                propertiesListContainer.innerHTML = '<p>目前地圖範圍內沒有房源。<br>請試著移動地圖並點擊右下角的「重新整理」按鈕。</p>';
                return;
            }
            
            propertiesListContainer.innerHTML = ''; 

            const ul = document.createElement('ul');
            ul.classList.add('bookmarks-card-list'); 

            currentMapProperties.forEach((property, index) => {
                if (property.type !== 'rent') return;
                    
                const li = document.createElement('li');
                li.classList.add('bookmark-card-item'); 

                let coverImageUrl = property.coverImage;
                if (coverImageUrl) {
                    if (coverImageUrl.startsWith('/')) {
                        coverImageUrl = baseUrl + coverImageUrl;
                    }
                } else {
                    coverImageUrl = defaultCoverImage;
                }

                let statusText = '狀態不明';
                let statusClass = 'status-rented';
                const vacantRooms = property.vacantRooms ?? 0;
                const upcomingVacancies = property.upcomingVacancies ?? 0;

                if (vacantRooms > 0) {
                    statusText = `尚有 ${vacantRooms} 間空房`;
                    statusClass = 'status-available';
                } else if (upcomingVacancies > 0) {
                    statusText = `即將釋出 ${upcomingVacancies} 間房`;
                    statusClass = 'status-upcoming';
                } else {
                    statusText = '完租';
                }
                
                const priceText = property.rentPriceRange ? formatPriceRange(property.rentPriceRange) : '範圍未提供';

                const cardHtml = `
                    <img src="${coverImageUrl}" class="bookmark-cover-image" onerror="this.src='${defaultCoverImage}';" alt="${property.name}">
                    <div class="bookmark-text-info">
                        <span class="bookmark-name">${property.name || '未提供房名'}</span>
                        <div class="bookmark-meta">
                            <span class="bookmark-city">${property.cityName || '城市未定'}</span>
                            <span class="bookmark-price-range">租金:<span class="bookmark-price-amount">${priceText}</span></span>
                        </div>
                    </div>
                    <div class="bookmark-action-area">
                         <span class="bookmark-status ${statusClass}">${statusText}</span>
                    </div>
                `;

                li.innerHTML = cardHtml;

                li.addEventListener('click', () => {
                    if (property.coordinates && property.coordinates.latitude) {
                        map.flyTo([property.coordinates.latitude, property.coordinates.longitude], 17, { animate: true, duration: 1.0 });
                        openSidebar(property);
                    } else {
                        alert('在地圖上找不到此房源的座標或詳細資料。');
                    }
                });

                ul.appendChild(li);
            });
            propertiesListContainer.appendChild(ul);
            
        }).catch(error => {
            console.error('在 showPropertiesPanel 中載入房源失敗:', error);
            propertiesListContainer.innerHTML = '<p>載入房源失敗，請稍後再試。</p>';
        });
    }


    function showBookmarksPanel() {
        if (!currentUserData) {
            alert('請先登入！');
            return;
        }
        hidePropertiesPanel(); 
        bookmarksPanel.classList.add('open');
        bookmarksListContainer.innerHTML = '<p>載入中...</p>';

        const defaultCoverImage = 'images/DefaultHotel.jpg';

        fetch(`${baseUrl}/Users/${currentUserData.userID}/bookmarks`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        }).then(response => response.ok ? response.json() : Promise.reject(response))
          .then(data => {
            const bookmarkedRentals = data.bookmarks.Rent;
            bookmarksListContainer.innerHTML = '';

            userBookmarkedRentIds.clear();
            if (bookmarkedRentals && bookmarkedRentals.length > 0) {
                 bookmarkedRentals.forEach(item => userBookmarkedRentIds.add(item.id));
                 console.log('已更新收藏 ID Set:', userBookmarkedRentIds);
            } else {
                 console.log('收藏清單為空，清空 Set。');
            }

            if (!bookmarkedRentals || bookmarkedRentals.length === 0) {
                bookmarksListContainer.innerHTML = '<p>您尚未收藏任何房源。</p>';
                return;
            }

            const ul = document.createElement('ul');
            ul.classList.add('bookmarks-card-list');

            bookmarkedRentals.forEach((property, index) => {
                const li = document.createElement('li');
                li.classList.add('bookmark-card-item');

                let coverImageUrl = property.coverImage;
                if (coverImageUrl) {
                    if (coverImageUrl.startsWith('/')) {
                        coverImageUrl = baseUrl + coverImageUrl;
                    }
                } else {
                    coverImageUrl = defaultCoverImage;
                }

                let statusText = '狀態不明';
                let statusClass = 'status-rented';
                const vacantRooms = property.vacantRooms ?? 0;
                const upcomingVacancies = property.upcomingVacancies ?? 0;

                if (vacantRooms > 0) {
                    statusText = `尚有 ${vacantRooms} 間空房`;
                    statusClass = 'status-available';
                } else if (upcomingVacancies > 0) {
                    statusText = `即將釋出 ${upcomingVacancies} 間房`;
                    statusClass = 'status-upcoming';
                } else {
                    statusText = '完租';
                }
                
                const priceText = property.rentPriceRange ? formatPriceRange(property.rentPriceRange) : '範圍未提供';

                const cardHtml = `
                    <img src="${coverImageUrl}" class="bookmark-cover-image" onerror="this.src='${defaultCoverImage}';" alt="${property.name}">
                    <div class="bookmark-text-info">
                        <span class="bookmark-name">${property.name || '未提供房名'}</span>
                        <div class="bookmark-meta">
                            <span class="bookmark-city">${property.cityName || '城市未定'}</span>
                            <span class="bookmark-price-range">租金:<span class="bookmark-price-amount">${priceText}</span></span>
                        </div>
                    </div>
                    <div class="bookmark-action-area">
                         <button class="bookmark-action-btn" data-rent-id="${property.id}">⋮</button>
                         <span class="bookmark-status ${statusClass}">${statusText}</span>
                    </div>
                `;

                li.innerHTML = cardHtml;

                li.addEventListener('click', () => {
                    const propertyId = property.id;
                    const fullPropertyData = allMapProperties.find(p => p.id === propertyId);

                    const actionBtn = li.querySelector('.bookmark-action-btn');
                    if (actionBtn && actionBtn.classList.contains('is-remove-mode')) {
                        actionBtn.classList.remove('is-remove-mode');
                        actionBtn.innerHTML = '⋮';
                    }

                    if (fullPropertyData && fullPropertyData.coordinates) {
                        map.flyTo([fullPropertyData.coordinates.latitude, fullPropertyData.coordinates.longitude], 17, { animate: true, duration: 1.0 });
                        openSidebar(fullPropertyData);
                    } else if (property.coordinates && property.coordinates.latitude) {
                        console.log(`找不到 ${propertyId} 的本地資料，開始自動刷新...`);
                        map.flyTo([property.coordinates.latitude, property.coordinates.longitude], 17, { animate: true, duration: 1.0 });
                        map.once('moveend', function() {
                            console.log('地圖移動完畢，開始自動刷新...');
                            loadRentalsInView().then(updatedProperties => {
                                const newFullPropertyData = allMapProperties.find(p => p.id === propertyId);
                                if (newFullPropertyData) {
                                    console.log('刷新後找到了資料，開啟側邊欄...');
                                    openSidebar(newFullPropertyData);
                                } else {
                                    console.log('刷新後還是找不到資料...');
                                    alert('已刷新資料，但在地圖上仍找不到此房源的詳細資訊。');
                                }
                            });
                        });
                    } else {
                        alert('在地圖上找不到此房源的座標或詳細資料。\n請嘗試移動地圖到房源所在區域並點擊「重新整理」按鈕後，再試一次。');
                    }
                });

                ul.appendChild(li);

                const actionBtn = li.querySelector('.bookmark-action-btn');
                if (actionBtn) {
                    actionBtn.addEventListener('click', function(e) {
                        e.stopPropagation();

                        const rentId = this.dataset.rentId;
                        const isRemoveMode = this.classList.contains('is-remove-mode');

                        if (isRemoveMode) {
                            if (confirm('您確定要從收藏中移除此項目嗎？')) {
                                handleRemoveBookmark(currentUserData.userID, rentId);
                            } else {
                                this.classList.remove('is-remove-mode');
                                this.innerHTML = '⋮';
                            }
                        } else {
                            ul.querySelectorAll('.bookmark-action-btn.is-remove-mode').forEach(otherBtn => {
                                if (otherBtn !== this) {
                                     otherBtn.classList.remove('is-remove-mode');
                                     otherBtn.innerHTML = '⋮';
                                }
                            });
                            this.classList.add('is-remove-mode');
                            this.innerHTML = '&times; 移除';
                        }
                    });

                    actionBtn.addEventListener('mouseleave', function() {
                        if (this.classList.contains('is-remove-mode')) {
                             this.classList.remove('is-remove-mode');
                             this.innerHTML = '⋮';
                        }
                    });
                }
            });
            bookmarksListContainer.appendChild(ul);

        }).catch(error => {
            console.error('獲取收藏清單時發生錯誤:', error);
            bookmarksListContainer.innerHTML = '<p>載入失敗，請稍後再試。</p>';
             userBookmarkedRentIds.clear();
        });
    }

    function handleRemoveBookmark(userId, rentId) {
        console.log(`嘗試移除收藏: UserID: ${userId}, RentID: ${rentId}`);
        const deleteUrl = `${baseUrl}/Users/${userId}/bookmarks/${rentId}`;

        fetch(deleteUrl, {
            method: 'DELETE'
        }).then(response => {
            if (response.ok) return response.json();
            console.error('移除收藏 API 回應錯誤:', response.status, response.statusText);
            throw new Error('移除收藏失敗，請稍後再試。');
        }).then(data => {
            alert('移除收藏成功！');

            userBookmarkedRentIds.delete(rentId);

            showBookmarksPanel();

             if (currentPropertyData && currentPropertyData.id === rentId) {
                  const bookmarkButton = document.getElementById('bookmark-button');
                  if (bookmarkButton) {
                       bookmarkButton.innerText = '加入收藏';
                       bookmarkButton.disabled = false;
                       bookmarkButton.style.backgroundColor = '#007bff';
                  }
             }

        }).catch(error => {
            console.error('移除收藏時發生錯誤:', error);
            alert(error.message);
        });
    }

    function displayMarkers(markerData) {
    rentMarkers.clearLayers();
    if (markerData && markerData.length > 0) {
        markerData.forEach(property => {
            if (property.coordinates) {
                const iconColor = property.ringColor || '#3498db';
                const dynamicIcon = L.divIcon({
                    className: 'css-icon',
                    html: `<div style="background-color: ${iconColor};"></div>`,
                    iconSize: [26, 26],
                    iconAnchor: [13, 26]
                });
                const tooltipContent = `<b>${property.name}</b><br>租金範圍: ${formatPriceRange(property.rentPriceRange)}`;
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

        return fetch(url, { headers: { 'Accept': 'application/json' } })
            .then(response => response.ok ? response.json() : Promise.reject(response))
            .then(data => {
                const apiData = data.map(item => ({ ...item, type: 'rent' }));
                if (sunshineApartmentData.vacantRooms === undefined) sunshineApartmentData.vacantRooms = 0;
                if (sunshineApartmentData.upcomingVacancies === undefined) sunshineApartmentData.upcomingVacancies = 0;
                if (sunshineApartmentData2.vacantRooms === undefined) sunshineApartmentData2.vacantRooms = 0;
                if (sunshineApartmentData2.upcomingVacancies === undefined) sunshineApartmentData2.upcomingVacancies = 0;

                const combinedData = [...apiData, sunshineApartmentData, sunshineApartmentData2];
                allMapProperties = combinedData; 
                displayMarkers(combinedData);
                
                return combinedData;
            })
            .catch(error => {
                console.error('載入房源資料時發生錯誤:', error);
                console.log('API 請求失敗，顯示預設測試資料點...');
                if (sunshineApartmentData.vacantRooms === undefined) sunshineApartmentData.vacantRooms = 0;
                if (sunshineApartmentData.upcomingVacancies === undefined) sunshineApartmentData.upcomingVacancies = 0;
                if (sunshineApartmentData2.vacantRooms === undefined) sunshineApartmentData2.vacantRooms = 0;
                if (sunshineApartmentData2.upcomingVacancies === undefined) sunshineApartmentData2.upcomingVacancies = 0;

                const staticData = [sunshineApartmentData, sunshineApartmentData2];
                allMapProperties = staticData; 
                displayMarkers(staticData);
                
                return staticData;
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

    // --- 修改：openSidebar 函式 (主要修改處) ---
    function openSidebar(property) {
        currentPropertyData = property; 
        closeLightbox();
        sidebar.classList.remove('closed');
        const sidebarImg = document.getElementById('sidebar-img');
        const sidebarImgPlaceholder = document.getElementById('sidebar-img-placeholder');
        const priceElement = document.getElementById('sidebar-price');
        const postsList = document.getElementById('sidebar-posts');
        const bookmarkButton = document.getElementById('bookmark-button');
        const titleElement = document.getElementById('sidebar-title');
        const contentElement = document.getElementById('sidebar-content');
        const cityElement = document.getElementById('sidebar-city');
        const contactSection = document.querySelector('.contact-section');
        const contactCard = document.getElementById('sidebar-contact-card');

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
            if (bookmarkButton) bookmarkButton.style.display = 'none';
            if(contactSection) contactSection.style.display = 'none';

        } else { // 這裡是 rent 的情況
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

            // 我們不過濾，讓燈箱可以點擊全部項目
            allPropertyPosts = property.posts || [];

            if (priceElement) {
                priceElement.innerHTML = '';
                priceElement.style.display = 'none';
            }
            if (postsList) postsList.style.display = 'block';

            postsList.innerHTML = '';
            if (property.posts && property.posts.length > 0) {
                const defaultRoomImages = ['images/Room1.jpg', 'images/Room2.jpg', 'images/Room3.jpg'];
                
                // --- 修改：在這裡開始迴圈和判斷 ---
                property.posts.forEach((post, index) => {
                    
                    const li = document.createElement('li');
                    
                    // --- 決定圖片 ---
                    let roomImageHtml;
                    if (post.imageResources && post.imageResources.length > 0) {
                        const firstImageUrl = post.imageResources[0].startsWith('/') ? baseUrl + post.imageResources[0] : post.imageResources[0];
                        roomImageHtml = `<img src="${firstImageUrl}" class="room-image" data-room-index="${index}">`;
                    } else {
                        // 如果是公共空間但沒有圖，也給一張預設圖
                        const defaultImageSrc = defaultRoomImages[index % defaultRoomImages.length];
                        if (!post.imageResources) {
                            post.imageResources = [];
                        }
                        // 確保 post 物件被更新，這樣燈箱才能抓到
                        if (post.imageResources.length === 0) {
                             post.imageResources.push(defaultImageSrc);
                        }
                        roomImageHtml = `<img src="${defaultImageSrc}" class="room-image" data-room-index="${index}">`;
                    }

                    // --- 判斷 publicArea ---
                    if (post.publicArea === true) {
                        // --- 這是公共空間卡片 ---
                        li.classList.add('status-public');
                        
                        // --- 修改：強制命名為「公共區域」 ---
                        const roomNameSpan = `<span class="room-name">公共區域</span>`;
                        // metaInfo 留空，但用 div 佔位以保持對齊
                        const metaInfo = `<div class="room-meta"></div>`; 
                        const textInfo = `<div class="room-text-info">${roomNameSpan}${metaInfo}</div>`;
                        li.innerHTML = `${roomImageHtml}${textInfo}`;
                        
                    } else if (post.publicArea === false) { // <-- 修改：明確判斷 false 才顯示
                        // --- 這是標準房間卡片 ---
                        const statusStringFromServer = post.rentPostStatus || '狀態不明';

                        if (statusStringFromServer.includes('空房') || statusStringFromServer.includes('可預約')) {
                            li.classList.add('status-available');
                        } else if (statusStringFromServer.includes('即將釋出')) {
                            li.classList.add('status-upcoming');
                        } else {
                            li.classList.add('status-rented');
                        }

                        const roomNameSpan = `<span class="room-name">${post.roomName || '未提供房名'}</span>`;
                        const rentMoneySpan = `<span class="room-money">${formatNumberWithCommas(post.rentMoney)}</span>`;
                        const rentStatusSpan = `<span class="room-status">${statusStringFromServer}</span>`;
                        const metaInfo = `<div class="room-meta">${rentMoneySpan}${rentStatusSpan}</div>`;
                        const textInfo = `<div class="room-text-info">${roomNameSpan}${metaInfo}</div>`;
                        li.innerHTML = `${roomImageHtml}${textInfo}`;
                    }
                    // --- 修改：如果 publicArea 不是 true 也不是 false (例如 undefined)，則不顯示 ---
                    
                    // 只有 publicArea 是 true 或 false 時才加入 DOM
                    if (post.publicArea === true || post.publicArea === false) {
                         postsList.appendChild(li);
                    }
                });
                // --- 迴圈結束 ---
                
            } else {
                allPropertyPosts = [];
                const li = document.createElement('li');
                li.textContent = '暫無房源資訊';
                postsList.appendChild(li);
            }

            if (bookmarkButton) {
                if (currentUserData) {
                    if (userBookmarkedRentIds.has(property.id)) {
                         bookmarkButton.innerText = '已加入收藏';
                         bookmarkButton.disabled = true;
                         bookmarkButton.style.backgroundColor = '#6c757d';
                    } else {
                         bookmarkButton.innerText = '加入收藏';
                         bookmarkButton.disabled = false;
                         bookmarkButton.style.backgroundColor = '#007bff';
                    }
                    bookmarkButton.style.display = 'block';
                } else {
                    bookmarkButton.style.display = 'none';
                }
            }

            let contactHtml = '';
            if (property.urlPhone) {
                const displayPhone = property.urlPhone.replace('tel:', '').replace('+886', '0');
                contactHtml += `<div class="contact-item">電話：<span>${displayPhone}</span></div>`;
            }
            if (property.urlLine) {
                const displayLine = property.urlLine.split('/').pop();
                contactHtml += `<div class="contact-item">Line ID：<span>${displayLine}</span></div>`;
            }
            if (property.urlMail) {
                const displayMail = property.urlMail.replace('mailto:', '');
                contactHtml += `<div class="contact-item">電子郵件：<span>${displayMail}</span></div>`;
            }

            if (contactCard && contactSection) {
                if (contactHtml) {
                    contactCard.innerHTML = contactHtml;
                    contactSection.style.display = 'block';
                } else {
                    contactCard.innerHTML = '';
                    contactSection.style.display = 'none';
                }
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
    }
    // --- openSidebar 修改結束 ---

    function closeSidebar() {
        sidebar.classList.add('closed');
        closeLightbox();
    }

    // --- 事件監聽與初始設定 ---
    displayMarkers([sunshineApartmentData, sunshineApartmentData2]);
    allMapProperties = [sunshineApartmentData, sunshineApartmentData2];
    loadRestaurantsInView();

    map.on('moveend', function() {
        // loadRentalsInView();
        // loadRestaurantsInView();
    });

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                map.setView([position.coords.latitude, position.coords.longitude], 16);
                loadRentalsInView();
            },
            error => {
                console.error('獲取使用者位置失敗:', error.message);
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

    if (propertiesListButton) {
        propertiesListButton.addEventListener('click', showPropertiesPanel);
    }
    if (closePropertiesPanelBtn) {
        closePropertiesPanelBtn.addEventListener('click', hidePropertiesPanel);
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

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeLightbox();
        }
    });

    lightboxOverlay.addEventListener('click', function(event) {
        if (event.target === lightboxOverlay) {
            const clickX = event.clientX;
            const windowWidth = window.innerWidth;
            if (clickX < windowWidth / 2) {
                prevImage();
            } else {
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
             if (userData) {
                 fetch(`${baseUrl}/Users/${userData.userID}/bookmarks`, {
                      method: 'GET',
                      headers: { 'Accept': 'application/json' }
                 }).then(response => response.ok ? response.json() : Promise.reject(response))
                 .then(data => {
                      const bookmarkedRentals = data.bookmarks.Rent;
                      userBookmarkedRentIds.clear();
                      if (bookmarkedRentals && bookmarkedRentals.length > 0) {
                           bookmarkedRentals.forEach(item => userBookmarkedRentIds.add(item.id));
                           console.log('初始載入，已更新收藏 ID Set:', userBookmarkedRentIds);
                      }
                 }).catch(error => {
                       console.error('初始獲取收藏清單失敗:', error);
                 });
             }
        }
    }
    checkInitialLoginState();
});