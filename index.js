document.addEventListener("DOMContentLoaded", function () {
    // 初始化 Leaflet 地圖，設定預設中心點和縮放層級
    var map = L.map('map').setView([23.704454, 120.428517], 16); // 先用預設位置初始化地圖

    // 創建自訂的圖釘圖示
    var PinIcon = L.icon({
        iconUrl: 'images/pin_icon.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
    // 將自訂圖示設定為所有標記的預設圖示
    L.Marker.prototype.options.icon = PinIcon;

    // 添加 OpenStreetMap 圖層作為地圖的底圖
    L.tileLayer('https://tile.openstreetmap.bzh/br/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors & CartoDB',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    // 創建一個 Feature Group 用於管理地圖上的標記
    var markers = L.featureGroup().addTo(map);
    // 獲取側邊欄元素
    var sidebar = document.getElementById('sidebar');

    // 定義後端 API 的基礎 URL
    const baseUrl = 'https://7590-203-69-229-71.ngrok-free.app';
    // 組合獲取所有房產項目的 API URL
    const itemsUrl = `${baseUrl}/items/`;
    // 組合獲取 Rent10 房產資料的 API URL
    const rent10Url = `${baseUrl}/Rent/Rent10`;

    // 測試用的陽光公寓資料
    const sunshineApartmentData = {
        coverImage: "https://media.gq.com.tw/photos/61e134dac128c151658f7506/16:9/w_1920,c_limit/casas%20caras%20cover.jpeg",
        name: "陽光公寓 (測試)",
        cityName: "台北市",
        coordinates: {
            latitude: 23.7029651,
            longitude: 120.4287316
        },
        mainContent: "這是一個預設標註在地圖上的地點，主要用途是作為系統功能測試與展示之用。透過這個地點，使用者可以驗證地圖定位、圖釘標記、資料讀取與互動功能是否正常運作，同時也方便開發者在開發過程中進行除錯與優化。這個測試點不代表真實場域，只作為示範與測試用途，請使用者依實際需求新增或修改地圖上的地點資料。這是一個預設標註在地圖上的地點，主要用途是作為系統功能測試與展示之用。透過這個地點，使用者可以驗證地圖定位、圖釘標記、資料讀取與互動功能是否正常運作，同時也方便開發者在開發過程中進行除錯與優化。這個測試點不代表真實場域，只作為示範與測試用途，請使用者依實際需求新增或修改地圖上的地點資料。這是一個預設標註在地圖上的地點，主要用途是作為系統功能測試與展示之用。透過這個地點，使用者可以驗證地圖定位、圖釘標記、資料讀取與互動功能是否正常運作，同時也方便開發者在開發過程中進行除錯與優化。這個測試點不代表真實場域，只作為示範與測試用途，請使用者依實際需求新增或修改地圖上的地點資料。",
        rentStatus: 1,
        vacantRooms: 2,
        upcomingVacancies: 0,
        posts: [
            {
                id: "test1",
                postContent: "測試房源 1",
                imageResources: [],
                rentMoney: 10000,
                leaseEndDates: [],
                publicArea: false,
                roomName: "測試房A",
                totalQuantity: 1,
                rentPostStatus: "可預約"
            },
            {
                id: "test2",
                postContent: "測試房源 2",
                imageResources: [],
                rentMoney: 15000,
                leaseEndDates: [],
                publicArea: false,
                roomName: "測試房B",
                totalQuantity: 1,
                rentPostStatus: "已出租"
            }
        ],
        id: "test_id",
        ringColor: "#CCCCCC",
        urlPhone: "tel:+886123456789",
        urlLine: "https://line.me/ti/p/testline",
        urlMail: "mailto:test@test.com",
        rentPriceRange: "10000-15000",
        userID: "test_user"
    };

    let rent10Marker;
    let userLocationMarker; // 用於儲存使用者位置的標記
    // 在地圖上添加陽光公寓的標記，並綁定點擊事件以打開側邊欄，以及綁定 Tooltip
    L.marker([sunshineApartmentData.coordinates.latitude, sunshineApartmentData.coordinates.longitude])
        .addTo(map)
        .on('click', function () {
            openSidebar(sunshineApartmentData);
        })
        .bindTooltip(sunshineApartmentData.name);

    // 從 API 獲取 Rent10 的資料
    fetch(rent10Url, {
        headers: {
            'Accept': 'application/json'
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} at ${response.url}`);
            }
            return response.json();
        })
        .then(rent10DataArray => {
            // 檢查 API 回傳的資料是否為非空陣列
            if (rent10DataArray && rent10DataArray.length > 0) {
                const rent10Data = rent10DataArray[0];
                const { coordinates, name } = rent10Data;
                // 在地圖上添加 Rent10 的標記，並綁定點擊事件以打開側邊欄，以及綁定 Tooltip
                rent10Marker = L.marker([coordinates.latitude, coordinates.longitude])
                    .addTo(map)
                    .on('click', function () {
                        openSidebar(rent10Data);
                    })
                    .bindTooltip(name || 'Rent10 物件');

                // 調整地圖視野以包含陽光公寓和 Rent10 的標記
                const bounds = L.latLngBounds([
                    [sunshineApartmentData.coordinates.latitude, sunshineApartmentData.coordinates.longitude],
                    [coordinates.latitude, coordinates.longitude]
                ]);
                map.fitBounds(bounds);

            } else {
                console.error('API /Rent/RegionMap 回傳的資料為空陣列。');
            }
        })
        .catch(error => {
            console.error('獲取 Rent10 資料時發生錯誤:', error);
        });

    // 根據目前地圖的可視範圍載入標記
    function loadMarkersInView() {
        const bounds = map.getBounds();
        const northEast = bounds.getNorthEast();
        const southWest = bounds.getSouthWest();

        // 呼叫 API 獲取可視範圍內的房產資料
        fetch(`${itemsUrl}?min_lat=${southWest.lat}&min_lon=${southWest.lng}&max_lat=${northEast.lat}&max_lon=${northEast.lng}`, {
            headers: {
                'Accept': 'application/json'
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status} at ${response.url}`);
                }
                return response.json();
            })
            .then(data => {
                // 清除現有的標記
                markers.clearLayers();
                // 遍歷 API 回傳的每個房產資料
                data.forEach(property => {
                    const { coordinates, name, id } = property;
                    // 為每個房產創建一個標記並添加到地圖和標記群組
                    L.marker([coordinates.latitude, coordinates.longitude])
                        .addTo(markers)
                        .on('click', function () {
                            // 點擊標記時，獲取房產詳細資料並打開側邊欄
                            fetchRentDataAndOpenSidebar(id);
                        })
                        .bindTooltip(name); // 綁定 Tooltip 顯示房產名稱
                });
            })
            .catch(error => {
                console.error('載入地圖標記資料時發生錯誤:', error);
            });
    }

    // 嘗試獲取使用者位置
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function (position) {
                // 成功獲取使用者位置，將地圖中心設定為使用者位置
                map.setView([position.coords.latitude, position.coords.longitude], 16); // 稍微放大顯示
                loadMarkersInView(); // 重新載入可視範圍內的標記
            },
            function (error) {
                // 使用者拒絕提供位置或發生錯誤，使用預設位置
                console.error('獲取使用者位置失敗:', error.message);
                loadMarkersInView(); // 使用預設位置載入標記
            },
            {
                enableHighAccuracy: false, // 不要求高精確度
                timeout: 5000, // 超時時間 5 秒
                maximumAge: 0 // 不使用快取的位置
            }
        );
    } else {
        // 瀏覽器不支援地理位置 API，使用預設位置
        console.error('瀏覽器不支援地理位置 API。');
        loadMarkersInView(); // 使用預設位置載入標記
    }
    //=================================在使用者位置放圖釘-頭=================================
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function (position) {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;

                // 設定地圖中心為使用者位置
                map.setView([userLat, userLng], 16);

                // 放置使用者位置的標記
                userLocationMarker = L.marker([userLat, userLng])
                    .addTo(map)
                    .bindTooltip('您的位置')
                    .openTooltip(); // 預設顯示 tooltip

                loadMarkersInView();
            },
            function (error) {
                console.error('獲取使用者位置失敗:', error.message);
                loadMarkersInView();
            },
            {
                enableHighAccuracy: false,
                timeout: 5000,
                maximumAge: 0
            }
        );
    }
    //=================================在使用者位置放圖釘-尾=================================
    // 當地圖移動結束時，重新載入可視範圍內的標記
    map.on('moveend', loadMarkersInView);
    // 點擊地圖時關閉側邊欄
    map.on('click', closeSidebar);

    // 打開側邊欄並顯示房產資訊
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
                const listItem = document.createElement('li');
                listItem.textContent = `${post.roomName || '未提供房名'} - ${post.rentMoney !== undefined ? post.rentMoney : '未提供租金'} - ${post.rentPostStatus || '未提供狀態'}`;
                postsList.appendChild(listItem);
            });
        } else {
            const listItem = document.createElement('li');
            listItem.textContent = '暫無房源資訊';
            postsList.appendChild(listItem);
        }

        document.getElementById('sidebar-phone').href = property.urlPhone ? `tel:${property.urlPhone}` : '#';
        document.getElementById('sidebar-phone').innerText = property.urlPhone ? '撥打電話' : '未提供電話';
        document.getElementById('sidebar-line').href = property.urlLine || '#';
        document.getElementById('sidebar-line').innerText = property.urlLine ? '聯繫 Line' : '未提供 Line';
        document.getElementById('sidebar-mail').href = property.urlMail ? `mailto:${property.urlMail}` : '#';
        document.getElementById('sidebar-mail').innerText = property.urlMail ? '發送電子郵件' : '未提供電子郵件';
    }

    // 關閉側邊欄
    function closeSidebar() {
        sidebar.classList.add('closed');
    }

    // 根據房產 ID 從 API 獲取詳細資料並打開側邊欄
    function fetchRentDataAndOpenSidebar(rentId) {
        const rentUrl = `${baseUrl}/Rent/${rentId}`;
        fetch(rentUrl, {
            headers: {
                'Accept': 'application/json'
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status} at ${response.url}`);
                }
                return response.json();
            })
            .then(data => {
                if (data && data.length > 0) {
                    openSidebar(data[0]);
                } else {
                    console.error('API 回傳的房產資料為空陣列。');
                }
            })
            .catch(error => {
                console.error('獲取房產詳細資料時發生錯誤:', error);
            });
    }

    // 頁面載入時先關閉側邊欄
    sidebar.classList.add('closed');

    // 獲取遮罩層、模態框和按鈕元素
    const overlay = document.getElementById('overlay');
    const authModal = document.getElementById('auth-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterFormLink = document.getElementById('show-register-form');
    const showLoginFormLink = document.getElementById('show-login-form');
    const loginButton = document.getElementById('login-button'); // 您的登入按鈕 ID
    const registerButton = document.getElementById('register-button'); // 您的註冊按鈕 ID

    // 顯示遮罩層和登入表單的函數
    function showLoginModal() {
        overlay.classList.remove('hidden');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    }

    // 顯示遮罩層和註冊表單的函數
    function showRegisterModal() {
        overlay.classList.remove('hidden');
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    }

    // 隱藏遮罩層的函數
    function hideAuthModal() {
        overlay.classList.add('hidden');
    }

    // 為關閉按鈕添加點擊事件監聽器
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', hideAuthModal);
    }

    // 為顯示註冊表單的鏈接添加點擊事件監聽器
    if (showRegisterFormLink) {
        showRegisterFormLink.addEventListener('click', function(e) {
            e.preventDefault();
            showRegisterModal();
        });
    }

    // 為顯示登入表單的鏈接添加點擊事件監聽器
    if (showLoginFormLink) {
        showLoginFormLink.addEventListener('click', function(e) {
            e.preventDefault();
            showLoginModal();
        });
    }

    // 為登入按鈕添加點擊事件監聽器，以顯示登入模態框
    if (loginButton) {
        loginButton.addEventListener('click', showLoginModal);
    }

    // 在這裡添加處理登入和註冊表單提交的 JavaScript 邏輯
    const loginSubmit = document.getElementById('loginForm');
    if (loginSubmit) {
        loginSubmit.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            console.log('登入資訊：', email, password);
            // 在這裡發送登入請求到後端
            // hideAuthModal();
        });
    }

    const registerSubmit = document.getElementById('registerForm');
    if (registerSubmit) {
        registerSubmit.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            if (password === confirmPassword) {
                console.log('註冊資訊：', email, password);
                // 在這裡發送註冊請求到後端
                // showLoginModal();
                // hideAuthModal();
            } else {
                alert('密碼不一致！');
            }
        });
    }
});