let seaweeds = [];
let bubbles = [];
let stones = [];
let fishes = []; // 新增小魚陣列
let colors = ['#809bce', '#95b8d1', '#b8e0d2', '#d6eadf', '#eac4d5'];
let popSound;
let soundEnabled = true; // 記錄音效開關狀態，預設為開啟

function preload() {
  popSound = loadSound('pop.mp3'); // 預先載入泡泡破裂音效
}

function setup() {
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.position(0, 0);
  cnv.style('pointer-events', 'none'); // 讓滑鼠事件穿透畫布，才能操作後方的 iframe
  cnv.style('z-index', '1');           // 確保畫布在最上層
  
  // 在視窗中間產生一個跟視窗一樣大的 iframe
  let iframe = createElement('iframe');
  iframe.attribute('src', 'https://www.et.tku.edu.tw/');
  iframe.position(0, 0);
  iframe.size(windowWidth, windowHeight);
  iframe.style('z-index', '-1');       // 確保 iframe 顯示在畫布後方
  iframe.style('border', 'none');      // 移除 iframe 的邊框
  
  // 停用瀏覽器的右鍵預設選單，確保右鍵點擊能順利觸發我們的開關
  document.addEventListener('contextmenu', event => event.preventDefault());
  
  // 產生 80 條水草
  for (let i = 0; i < 150; i++) {
    let c = color(random(colors));
    c.setAlpha(200); // 加上透明度，讓顏色重疊時更漂亮

    seaweeds.push({
      x: map(i, 0, 150, 0, width) + random(-30, 30), // 位置：平均分佈在視窗並加上隨機偏移
      color: c,                                     // 顏色：帶有透明度的顏色
      thickness: random(25, 40),                    // 粗細：介於 25~40
      height: height * random(0.25, 0.45),          // 高度：介於視窗的 25%~45%
      frequency: random(0.001, 0.005),              // 搖晃頻率：讓每條水草搖晃速度不一樣
      noiseOffset: random(1000)                     // 雜訊偏移：讓搖晃軌跡不重複
    });
  }

  // 產生 60 顆泡泡
  for (let i = 0; i < 65; i++) {
    bubbles.push({
      x: random(width),
      y: random(height),             // 初始高度
      r: random(4, 12),              // 泡泡半徑
      speedY: random(1, 3),          // 往上飄的速度
      noiseOffsetX: random(1000),    // 用於左右飄動的雜訊偏移
      popTargetY: random(50, height * 0.8), // 泡泡破裂的目標高度
      isPopped: false,               // 紀錄是否已經破掉
      popTimer: 0                    // 破裂動畫的計時器
    });
  }

  // 產生 300 顆底部小石頭，營造扎根感
  for (let i = 0; i < 800; i++) {
    stones.push({
      x: random(width),
      y: height - random(0, 20),                 // 散佈在畫面最底部 20 像素內
      w: random(10, 35),                         // 石頭寬度
      h: random(5, 18),                          // 石頭高度
      color: color(random(100, 150), random(100, 140), random(100, 130)) // 隨機的灰褐色
    });
  }

  // 產生 12 隻小魚
  let fishColors = ['#ff9f1c', '#ffbf69', '#f07167', '#00afb9','#19180a']; // 比較亮眼的魚群顏色
  for (let i = 0; i < 20; i++) {
    let spd = random(0.5, 2.5);
    fishes.push({
      x: random(width),
      y: random(height * 0.2, height * 0.8), // 隨機分佈在畫面中段
      size: random(8, 18),                   // 小魚的大小
      speed: spd,                            // 當前游動的速度
      baseSpeed: spd,                        // 紀錄原本悠閒的游動速度
      dir: random() > 0.5 ? 1 : -1,          // 1 代表向右游，-1 代表向左游
      color: color(random(fishColors)),
      offset: random(1000)                   // 用於上下浮動的隨機偏移
    });
  }

  // 產生 4 群成群結隊的小魚 (保留原本的散佈小魚)
  let numSchools = 4; // 4 個魚群
  for (let s = 0; s < numSchools; s++) {
    let schoolColor = color(random(fishColors)); // 該群魚統一的顏色
    let schoolDir = random() > 0.5 ? 1 : -1;     // 該群魚統一的方向
    let schoolBaseSpeed = random(1.0, 2.5);      // 該群魚的基準速度
    let schoolX = random(width);                 // 該群魚的初始中心 X
    let schoolY = random(height * 0.2, height * 0.8); // 該群魚的初始中心 Y
    let numFishInSchool = floor(random(8, 15));  // 每群約 8~14 隻魚

    for (let i = 0; i < numFishInSchool; i++) {
      let spd = schoolBaseSpeed + random(-0.3, 0.3); // 速度相近，保留微小落差使隊形更自然
      fishes.push({
        x: schoolX + random(-60, 60), // 圍繞在群體中心附近
        y: schoolY + random(-40, 40),
        size: random(6, 14),          // 大小稍微不一
        speed: spd,
        baseSpeed: spd,
        dir: schoolDir,
        color: schoolColor,
        offset: random(1000)
      });
    }
  }
}

function draw() {
  clear(); // 清除上一幀的畫面，避免透明度疊加產生殘影
  background(212, 234, 250, 0.5); // 將原本的背景色換算成 RGB，並加上透明度 1

  // 先繪製水草，這樣水草就會在最底層，不會擋住石頭與水泡
  
  for (let i = 0; i < seaweeds.length; i++) {
    let sw = seaweeds[i];
    
    fill(sw.color);
    noStroke(); // 移除單一線條，改為填滿多邊形
    
    let startY = height;
    let endY = height - sw.height;
    let pts = []; // 暫存水草的中心軌跡點與寬度
    
    // 1. 先計算水草的中心點與每一段的寬度
    for (let y = startY; y >= endY - 20; y -= 20) {
      let noiseVal = noise(sw.noiseOffset, y * 0.005, frameCount * sw.frequency);
      let xOffset = map(noiseVal, 0, 1, -100, 100); // 增加搖晃幅度 (-400~400)
      
      let swayFactor = map(y, startY, endY, 0, 1);
      swayFactor = constrain(swayFactor, 0, 1);
      
      let x = sw.x + (xOffset * swayFactor);
      
      // 利用 sin() 產生「上窄、中間寬、下稍微窄」的葉片形狀
      // map 將 Y 軸高度映射為 0.2 到 PI 的角度。底部保留些微寬度，中間最大，頂部平滑收斂至 0
      let angle = constrain(map(y, startY, endY, 0.2, PI), 0.2, PI);
      let w = sw.thickness * sin(angle);
      
      // 疊加雜訊產生邊緣的波浪起伏 (海帶邊緣的皺褶感)
      let ruffle = map(noise(sw.noiseOffset + 100, y * 0.05, frameCount * 0.05), 0, 1, 0.7, 1.3);
      w *= ruffle;
      
      pts.push({ x: x, y: y, w: w });
    }
    
    // 2. 利用計算好的點，畫出具有肉感的海帶/緞帶形狀
    beginShape();
    // 繪製右半邊緣 (由下往上)
    for (let j = 0; j < pts.length; j++) {
      let p = pts[j];
      if (j === 0) curveVertex(p.x + p.w / 2, p.y); // 起點控制點
      curveVertex(p.x + p.w / 2, p.y);
    }
    
    // 繪製左半邊緣 (由上往下)
    for (let j = pts.length - 1; j >= 0; j--) {
      let p = pts[j];
      curveVertex(p.x - p.w / 2, p.y);
      if (j === 0) curveVertex(p.x - p.w / 2, p.y); // 終點控制點
    }
    endShape(CLOSE);
  }

  // 繪製游動的小魚
  for (let i = 0; i < fishes.length; i++) {
    let f = fishes[i];
    
    // 偵測與滑鼠的距離，製造「嚇一跳」的互動效果
    let d = dist(mouseX, mouseY, f.x, f.y);
    if (d < 150) { // 當滑鼠靠近至 150 像素內
      // 滑鼠在小魚右側則往左游（-1），在左側則往右游（1）
      f.dir = mouseX > f.x ? -1 : 1;
      // 距離滑鼠越近，受驚嚇而加速的幅度越大
      let escapeSpeed = map(d, 0, 150, 10, 0);
      f.speed = f.baseSpeed + escapeSpeed;
    } else {
      // 滑鼠離開後，平滑地恢復至原本的速度
      f.speed = lerp(f.speed, f.baseSpeed, 0.05);
    }

    // 更新小魚位置：水平游動加上微微的上下浮動
    f.x += f.speed * f.dir;
    f.y += sin(frameCount * 0.05 + f.offset) * 0.5;

    // 如果游出視窗邊界，就從另一側重新出現
    if (f.dir === 1 && f.x > width + f.size * 2) f.x = -f.size * 2;
    if (f.dir === -1 && f.x < -f.size * 2) f.x = width + f.size * 2;

    push();
    translate(f.x, f.y);
    scale(f.dir, 1); // 根據方向水平翻轉畫布，讓魚頭永遠朝著前進方向
    
    noStroke();
    fill(f.color);
    // 畫魚尾巴 (三角形)
    triangle(-f.size * 0.6, 0, -f.size * 1.6, -f.size * 0.6, -f.size * 1.6, f.size * 0.6);
    // 畫魚身體 (橢圓形)
    ellipse(0, 0, f.size * 2, f.size * 1.2);
    // 畫魚眼睛 (白底黑眼珠)
    fill(255);
    ellipse(f.size * 0.4, -f.size * 0.15, f.size * 0.4, f.size * 0.4);
    fill(0);
    ellipse(f.size * 0.5, -f.size * 0.15, f.size * 0.2, f.size * 0.2);
    pop();
  }

  for (let i = 0; i < bubbles.length; i++) {
    let b = bubbles[i];
    
    // 利用 noise 讓泡泡左右微微飄動
    let xOffset = map(noise(b.noiseOffsetX, frameCount * 0.01), 0, 1, -15, 15);
    let currentX = b.x + xOffset;
    
    if (!b.isPopped) {
      // 繪製水泡本體 (白色，透明度 0.5 -> 255 * 0.5 = 127)
      noStroke();
      fill(255, 255, 255, 127);
      circle(currentX, b.y, b.r * 2);
      
      // 繪製左上角反光圓圈 (白色，透明度 0.8 -> 255 * 0.8 = 204)
      fill(255, 255, 255, 204);
      circle(currentX - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.6);
      
      b.y -= b.speedY; // 泡泡往上升
      
      // 如果泡泡到達目標高度，觸發破裂狀態
      if (b.y < b.popTargetY) {
        b.isPopped = true;
        b.popTimer = 15; // 動畫持續 15 個影格
        if (soundEnabled) {
          popSound.play(); // 如果音效狀態為開啟，才播放破裂音效
        }
      }
    } else {
      // 繪製破裂特效 (放大並淡出的外圈)
      noFill();
      let alpha = map(b.popTimer, 0, 15, 0, 150);
      stroke(255, 255, 255, alpha);
      strokeWeight(1.5);
      let popSize = b.r * 2 + (15 - b.popTimer) * 1.5;
      circle(currentX, b.y, popSize);
      
      b.popTimer--;
      
      // 動畫結束後，讓泡泡從畫面底部重生
      if (b.popTimer <= 0) {
        b.isPopped = false;
        b.y = height + b.r * 2;
        b.x = random(width);
        b.popTargetY = random(50, height * 0.8);
      }
    }
  }
  
  // 繪製底部小石頭
  noStroke();
  for (let i = 0; i < stones.length; i++) {
    let s = stones[i];
    fill(s.color);
    ellipse(s.x, s.y, s.w, s.h);
  }
}

// 當滑鼠點擊時觸發此函數
function mousePressed() {
  if (mouseButton === RIGHT) {
    soundEnabled = !soundEnabled; // 如果按下的是右鍵，切換音效開關狀態
  }
}
