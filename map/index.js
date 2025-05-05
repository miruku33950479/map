document.addEventListener("DOMContentLoaded", function () {
    // 初始化地圖，設定預設中心在雲林虎尾
    var map = L.map("map").setView([23.7029651, 120.4287316], 13); // 設定為陽光公寓的經緯度
  
    // 添加 OpenStreetMap 的 tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
    }).addTo(map);
  
    // 陽光公寓資料
    var property = {
      coverImage: "images/house_icon.png",
      name: "陽光公寓",
      cityName: "台北市",
      coordinates: {
        latitude: 23.7029651,
        longitude: 120.4287316
      },
      mainContent: "這是一間位於台北市中心的優質出租公寓，鄰近捷運與便利商店，交通便利。",
      rentPriceRange: "NT$ 10000",
      urlPhone: "tel:+886900000000",
      urlLine: "https://line.me/ti/p/example",
      urlMail: "mailto:contact@example.com",
      posts: [
        {
          roomName: "單人房A",
          rentMoney: 10000,
          rentPostStatus: "完租"
        },
        {
          roomName: "雙人房B",
          rentMoney: 15000,
          rentPostStatus: "完租"
        }
      ]
    };
    var customIcon = L.icon({
      iconUrl: 'images/pin_icon.png',  // 圖釘圖片路徑 (請確認檔案有放對位置)
      iconSize: [40, 40], // 圖釘尺寸，可依需要調整
      iconAnchor: [20, 40], // 圖釘的「腳」位於圖片哪個點 (20,40) 為中心底部
      popupAnchor: [0, -40] // popup 往上偏移，避免被圖釘擋到
    });
  
    
  
    // 使用自訂圖釘
    var marker = L.marker(
      [property.coordinates.latitude, property.coordinates.longitude],
      { icon: customIcon }
    ).addTo(map);
    marker.bindPopup(`
      <div style="max-width: 300px; max-height: 400px; overflow-y: auto;">
        <h3>${property.name}</h3>
        <img src="${property.coverImage}" alt="${property.name}" style="width: 50%; height: auto;"/>
        <p>${property.mainContent}</p>
        <p><strong>租金範圍:</strong> ${property.rentPriceRange}</p>
        <p><strong>城市:</strong> ${property.cityName}</p>
        <p><strong>房間列表:</strong></p>
        <ul>
          ${property.posts.map(post => `<li>${post.roomName} - ${post.rentMoney} - ${post.rentPostStatus}</li>`).join('')}
        </ul>
        <p><a href="${property.urlPhone}">撥打電話</a></p>
        <p><a href="${property.urlLine}">聯繫 Line</a></p>
        <p><a href="${property.urlMail}">發送電子郵件</a></p>
      </div>
    `);
  
    // 監聽 popup 開啟事件
    marker.on('popupopen', function() {
      // 獲取 popup 元素
      var popupContent = marker.getPopup().getElement();
  
      // 獲取 popup 內容的高度與寬度
      var popupHeight = popupContent.offsetHeight;
      var popupWidth = popupContent.offsetWidth;
  
      // 計算滾動位置，根據 popup 高度來調整
      var scrollToPositionY = window.scrollY + window.innerHeight / 2 - popupHeight / 2;
      var scrollToPositionX = window.scrollX + window.innerWidth / 2 - popupWidth / 2;
  
      // 確保滾動位置不會超過頁面範圍
      scrollToPositionY = Math.max(0, Math.min(scrollToPositionY, document.documentElement.scrollHeight - window.innerHeight));
      scrollToPositionX = Math.max(0, Math.min(scrollToPositionX, document.documentElement.scrollWidth - window.innerWidth));
  
      // 執行滾動
      window.scrollTo({
        top: scrollToPositionY,
        left: scrollToPositionX,
        behavior: "smooth"
      });
    });
  });
  