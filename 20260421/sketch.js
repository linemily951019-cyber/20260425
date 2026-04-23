let capture;
let pg; // 宣告一個變數用來存放額外的透明圖層
let bubbles = []; // 宣告一個陣列來存放泡泡的資料

function setup() {
  createCanvas(windowWidth, windowHeight);
  capture = createCapture(VIDEO);
  capture.hide(); // 隱藏原生的 HTML 影片元素，讓我們可以自訂繪製
  
  // 產生一個與視訊畫面預計顯示大小一樣的圖層 (寬高的 75%)
  pg = createGraphics(width * 0.75, height * 0.75);
  
  // 初始化泡泡資料
  for (let i = 0; i < 30; i++) {
    bubbles.push({
      x: random(pg.width),
      y: random(pg.height),
      size: random(10, 40), // 隨機大小 10 到 40
      speed: random(1, 3)   // 隨機上升速度
    });
  }
  
  // 建立拍照按鈕
  let btn = createButton(' 📷 ');
  btn.position(20, 20); // 放在畫面左上角（視訊圖片外）
  btn.style('font-size', '18px');
  btn.style('padding', '10px 20px');
  btn.mousePressed(takeScreenshot); // 設定按下按鈕時執行的函數
}

function draw() {
  background(255, 240, 245); // 將背景設為粉白色
  
  let imgWidth = width * 0.75;
  let imgHeight = height * 0.75;
  
  // 在 pg 上面繪製你想要的內容
  pg.clear(); // 每一幀必須先清除上一幀的圖形，維持圖層透明
  
  // 繪製泡泡效果 (使用半透明的水藍色)
  pg.noStroke();
  pg.fill(100, 200, 255, 80); // 降低 Alpha 值讓泡泡透明度更高
  for (let i = 0; i < bubbles.length; i++) {
    let b = bubbles[i];
    pg.circle(b.x, b.y, b.size);
    
    b.y -= b.speed; // 讓泡泡往上飄
    b.x += sin(frameCount * 0.05 + i) * 1; // 利用 sin 函數產生左右搖擺的自然漂浮感
    
    // 如果泡泡飄出畫面上方，讓它從底部隨機水平位置重新出現
    if (b.y < -b.size) {
      b.y = pg.height + b.size;
      b.x = random(pg.width);
    }
  }
  
  // 設定影像繪製模式為以中心為基準，並畫在畫布正中央
  push();
  translate(width / 2, height / 2); // 將座標原點移至畫面中央
  scale(-1, 1); // 進行水平翻轉 (X軸乘上 -1)
  
  // 讀取視訊畫面的像素資料來製作黑白馬賽克
  capture.loadPixels();
  if (capture.pixels.length > 0) {
    let step = 20; // 設定馬賽克一個單位的寬高
    noStroke();
    rectMode(CORNER); // 方塊以左上角為起點繪製
    
    for (let y = 0; y < imgHeight; y += step) {
      for (let x = 0; x < imgWidth; x += step) {
        // 將畫布上迴圈的 x, y 對應回原始視訊的像素座標
        let cx = floor(map(x, 0, imgWidth, 0, capture.width));
        let cy = floor(map(y, 0, imgHeight, 0, capture.height));
        
        // 取得一維像素陣列的索引 (每個像素包含 R, G, B, A 四個數值)
        let index = (cy * capture.width + cx) * 4;
        let r = capture.pixels[index];
        let g = capture.pixels[index + 1];
        let b = capture.pixels[index + 2];
        
        // 計算 RGB 平均值作為灰階顏色值
        let gray = (r + g + b) / 3;
        
        fill(gray);
        // 畫出馬賽克單位方塊 (從左上角偏移畫出)
        rect(x - imgWidth / 2, y - imgHeight / 2, step, step);
      }
    }
  }
  
  // 將這張 pg 圖片重疊畫在視訊畫面的上方
  imageMode(CENTER);
  image(pg, 0, 0, imgWidth, imgHeight);
  pop(); // 恢復原本的座標系統，避免影響其他繪圖
  
  // 繪製緊貼視訊畫面邊緣的藤蔓線條
  push();
  // 將起點稍微往內縮，確保線條完全在截圖範圍內且緊貼畫面邊緣
  let inset = 6; 
  let startX = (width - imgWidth) / 2 + inset;
  let startY = (height - imgHeight) / 2 + inset;
  let frameW = imgWidth - inset * 2;
  let frameH = imgHeight - inset * 2;
  let perimeter = frameW * 2 + frameH * 2; // 計算縮排後的總周長
  
  // 繪製像藤蔓般順暢的白色線條
  noFill();
  stroke(255);
  strokeWeight(8); // 稍微調細一點點，讓藤蔓感更精緻
  beginShape();
  // 為了讓曲線完美閉合，我們多走幾個點來重疊 (所以迴圈跑到 perimeter + 50)
  for (let d = 0; d <= perimeter + 50; d += 15) { 
    let currentD = d % perimeter; // 確保基本座標會繞圈
    let px, py;
    if (currentD < frameW) { 
      px = startX + currentD; py = startY; 
    } else if (currentD < frameW + frameH) { 
      px = startX + frameW; py = startY + (currentD - frameW); 
    } else if (currentD < frameW * 2 + frameH) { 
      px = startX + frameW - (currentD - (frameW + frameH)); py = startY + frameH; 
    } else { 
      px = startX; py = startY + frameH - (currentD - (frameW * 2 + frameH)); 
    }
    
    // 利用圓形映射來產生「完美閉合且平滑」的雜訊
    let angle = map(d, 0, perimeter, 0, TWO_PI);
    // 降低雜訊偏移量 (從 60 降到 15)，讓線條穩穩地貼齊在邊緣
    let noiseX = (noise(cos(angle) * 1.5, sin(angle) * 1.5) - 0.5) * 15;
    let noiseY = (noise(cos(angle) * 1.5 + 100, sin(angle) * 1.5 + 100) - 0.5) * 15;
    
    curveVertex(px + noiseX, py + noiseY); // 改用 curveVertex 畫出平滑曲線
  }
  endShape();
  pop();
}

// 拍照並下載截圖的函數
function takeScreenshot() {
  let imgWidth = width * 0.75;
  let imgHeight = height * 0.75;
  
  // 使用 get(x, y, w, h) 只擷取畫面中「視訊圖片」的範圍
  let screenshot = get((width - imgWidth) / 2, (height - imgHeight) / 2, imgWidth, imgHeight);
  screenshot.save('my_photo', 'jpg'); // 將擷取的圖片儲存為 jpg 格式
}
