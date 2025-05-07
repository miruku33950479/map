document.addEventListener("DOMContentLoaded", function () {
  // 初始化地圖，預設顯示在一個大致的中心位置
  var map = L.map('map').setView([23.5, 120.5], 10);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  var markers = L.featureGroup().addTo(map); // 用於存放從 API 載入的標記
  var sidebar = document.getElementById('sidebar');

  // API endpoint
  const baseUrl = 'https://7590-203-69-229-71.ngrok-free.app';
  const itemsUrl = `${baseUrl}/items/`;
  const rent10Url = `${baseUrl}/Rent/Rent10`;

  // 陽光公寓的測試資料
  const sunshineApartmentData = {
      coverImage: "https://www.adaymag.com/wp-content/uploads/2021/11/taipei-rent-house-diary-10.jpg",
      name: "陽光公寓 (測試)",
      cityName: "台北市",
      coordinates: {
          latitude: 23.7029651,
          longitude: 120.4287316
      },
      mainContent: "這是一個預設標註在地圖上的地點，主要用途是作為系統功能測試與展示之用。透過這個地點，使用者可以驗證地圖定位、圖釘標記、資料讀取與互動功能是否正常運作，同時也方便開發者在開發過程中進行除錯與優化。這個測試點不代表真實場域，只作為示範與測試用途，請使用者依實際需求新增或修改地圖上的地點資料。",
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

  let rent10Marker; // 用於儲存 Rent10 的標記

  // 預先設置陽光公寓的圖釘
  L.marker([sunshineApartmentData.coordinates.latitude, sunshineApartmentData.coordinates.longitude])
      .addTo(map)
      .on('click', function () {
          openSidebar(sunshineApartmentData);
      })
      .bindTooltip(sunshineApartmentData.name);

  // 獲取 Rent10 的資料並放置圖釘
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
          if (rent10DataArray && rent10DataArray.length > 0) {
              const rent10Data = rent10DataArray[0];
              const { coordinates, name } = rent10Data;
              rent10Marker = L.marker([coordinates.latitude, coordinates.longitude])
                  .addTo(map)
                  .on('click', function () {
                      openSidebar(rent10Data);
                  })
                  .bindTooltip(name || 'Rent10 物件');

              const bounds = L.latLngBounds([
                  [sunshineApartmentData.coordinates.latitude, sunshineApartmentData.coordinates.longitude],
                  [coordinates.latitude, coordinates.longitude]
              ]);
              map.fitBounds(bounds);

          } else {
              console.error('API /Rent/Rent10 回傳的資料為空陣列。');
          }
      })
      .catch(error => {
          console.error('獲取 Rent10 資料時發生錯誤:', error);
      });

  // 載入地圖可視範圍內的資料 (這個部分保持不變，載入其他房產)
  function loadMarkersInView() {
      const bounds = map.getBounds();
      const northEast = bounds.getNorthEast();
      const southWest = bounds.getSouthWest();

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
              markers.clearLayers();
              data.forEach(property => {
                  const { coordinates, name, id } = property;
                  L.marker([coordinates.latitude, coordinates.longitude])
                      .addTo(markers)
                      .on('click', function () {
                          fetchRentDataAndOpenSidebar(id); // 使用新的函數
                      })
                      .bindTooltip(name);
              });
          })
          .catch(error => {
              console.error('載入地圖標記資料時發生錯誤:', error);
          });
  }

  loadMarkersInView();
  map.on('moveend', loadMarkersInView);

  map.on('click', closeSidebar); // 點擊地圖空白處也關閉側邊欄

  function openSidebar(property) {
      sidebar.classList.remove('closed'); // 移除 closed class，滑出側邊欄
      document.getElementById('sidebar-title').innerText = property.name || '未提供名稱';
      document.getElementById('sidebar-img').src = property.coverImage || '';
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

  function closeSidebar() {
      sidebar.classList.add('closed'); // 添加 closed class，滑入隱藏側邊欄
  }

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

  // 初始時將側邊欄隱藏
  sidebar.classList.add('closed');
});