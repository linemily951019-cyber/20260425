let topPoints = [];
let bottomPoints = [];
const NUM_POINTS = 10;
let gameState = 'START'; // 遊戲狀態：START, PLAYING, GAMEOVER, WIN
let currentLevel = 1; // 記錄目前的關卡數
let obstacles = []; // 儲存障礙物的陣列
let spotlightRadius = 150; // 探照燈的初始半徑
let totalTime = 0; // 記錄總遊玩時間
let bubbles = []; // 儲存背景泡泡特效
let seaweeds = []; // 儲存底部海草裝飾

function setup() {
  // 改為全螢幕
  createCanvas(windowWidth, windowHeight);
  
  // 初始化背景的泡泡
  for(let i = 0; i < 50; i++) {
    bubbles.push({x: random(width), y: random(height), size: random(3, 12), speed: random(0.5, 2)});
  }
  initSeaweeds();
  generatePath();
}

// 獨立產生海草的函式，方便重新計算
function initSeaweeds() {
  seaweeds = [];
  for (let i = 0; i < 40; i++) {
    seaweeds.push({
      x: random(width),
      h: random(80, 220), // 隨機海草高度
      c: color(random(10, 40), random(80, 150), random(40, 80), 200), // 深淺不一的海草綠色
      phase: random(TWO_PI) // 隨機搖擺初始相位
    });
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initSeaweeds(); // 視窗縮放時重新分佈海草
  if (gameState === 'START') {
    generatePath();
  }
}

// 產生軌道點的函式
function generatePath() {
  topPoints = [];
  bottomPoints = [];
  obstacles = [];
  
  let currentX = 100; // 起始 X 座標
  let currentY = height / 2; // 起始 Y 座標
  
  // 為了適應全螢幕，動態計算 X 軸的間距，讓 10 個點均勻散佈在畫面上
  let stepX = (width - 200) / (NUM_POINTS - 1); 

  for (let i = 0; i < NUM_POINTS; i++) {
    if (i > 0) {
      currentY += random(-80, 80); // 加大 Y 軸起伏增加挑戰性
      currentY = constrain(currentY, 100, height - 100); 
    }
    
    // 根據關卡調整難度，給予潛水員通過的空間
    let gap = random(80 - currentLevel * 5, 130 - currentLevel * 10);
    
    topPoints.push(createVector(currentX, currentY));
    bottomPoints.push(createVector(currentX, currentY + gap));
    
    currentX += stepX;
  }

  // 產生障礙物 (從第 2 關開始)
  if (currentLevel >= 2) {
    let numObstacles = currentLevel == 2 ? 2 : 3; // 減少魚的數量，降低最後一關的密集度
    let step = (NUM_POINTS - 2) / numObstacles;
    for (let i = 0; i < numObstacles; i++) {
      let idx = floor(1 + i * step); // 將障礙物更均勻地分散配置在軌道的不同區段
      let midX = (topPoints[idx].x + topPoints[idx+1].x) / 2;
      let midTopY = (topPoints[idx].y + topPoints[idx+1].y) / 2;
      let midBottomY = (bottomPoints[idx].y + bottomPoints[idx+1].y) / 2;
      
      obstacles.push({
        x: midX,
        y: (midTopY + midBottomY) / 2, // 初始位置在上下通道的正中間
        minY: midTopY - 15, // 上界 
        maxY: midBottomY + 15, // 下界
        size: 40, // 魚的大小
        speed: (1 + currentLevel * 0.5) * (random() > 0.5 ? 1 : -1) // 降低移動速度
      });
    }
  }
}

function draw() {
  // 繪製海底漸層背景
  for (let y = 0; y < height; y++) {
    let inter = map(y, 0, height, 0, 1);
    let c = lerpColor(color(0, 105, 148), color(0, 15, 30), inter);
    stroke(c);
    line(0, y, width, y);
  }
  drawBubbles(); // 繪製背景漂浮的泡泡

  if (gameState === 'START') {
    drawCave();
    drawSeaweeds();
    drawStartZone();
    drawEndZone();
    updateAndDrawObstacles();
    drawTimer(); // 顯示計時器
    
    fill(255);
    noStroke();
    textSize(24);
    textAlign(CENTER, CENTER);
    if (currentLevel === 3) {
      text("第 3 關 (深海探照燈模式) - 請點擊左側發光處開始下潛", width / 2, 50);
    } else {
      text("第 " + currentLevel + " 關 - 請點擊左側發光處開始下潛", width / 2, 50);
    }
    
    cursor(ARROW);
  } 
  else if (gameState === 'PLAYING') {
    totalTime += deltaTime; // 只有在遊玩狀態下才累加時間
    drawCave();
    drawSeaweeds();
    drawStartZone();
    drawEndZone();
    updateAndDrawObstacles();
    
    // 新增第三關變化：探照燈/視野限制模式
    if (currentLevel === 3) {
      spotlightRadius -= 0.02; // 再次調慢縮小速度，降低難度
      spotlightRadius = max(spotlightRadius, 70); // 增大最小視野半徑，確保玩家還能看見周圍
      
      fill(0, 10, 25, 252); // 深海暗藍色遮罩
      noStroke();
      beginShape();
      vertex(0, 0); // 外圍畫滿全螢幕 (順時針)
      vertex(width, 0);
      vertex(width, height);
      vertex(0, height);
      
      // 在滑鼠位置挖空一個圓圈 (必須逆時針繪製)
      beginContour();
      for (let a = TWO_PI; a > 0; a -= 0.1) {
        vertex(mouseX + cos(a) * spotlightRadius, mouseY + sin(a) * spotlightRadius);
      }
      endContour();
      endShape(CLOSE);
    }

    // 隱藏原始鼠標，繪製潛水員作為玩家
    noCursor();
    drawDiver(mouseX, mouseY);
    
    checkCollision();
    drawTimer(); // 顯示計時器
  } 
  else if (gameState === 'GAMEOVER') {
    cursor(ARROW);
    background(20, 50, 80, 200); // 失敗呈現沉沒暗藍色
    fill(255);
    textSize(48);
    textAlign(CENTER, CENTER);
    text("撞到礁石了！", width / 2, height / 2 - 30);
    
    // 重玩此關與從頭再來按鈕
    rectMode(CENTER);
    fill(255);
    rect(width / 2 - 80, height / 2 + 40, 120, 40, 10);
    rect(width / 2 + 80, height / 2 + 40, 120, 40, 10);
    fill(0);
    textSize(20);
    text("重玩此關", width / 2 - 80, height / 2 + 40);
    text("從頭再來", width / 2 + 80, height / 2 + 40);
    rectMode(CORNER);
  } 
  else if (gameState === 'WIN') {
    cursor(ARROW);
    background(0, 150, 200, 200); // 勝利呈現海洋明亮色
    fill(255);
    textSize(48);
    textAlign(CENTER, CENTER);
    
    if (currentLevel < 3) {
      text("順利通過海溝！", width / 2, height / 2 - 30);
      textSize(24);
      text("點擊任意處進到下一關", width / 2, height / 2 + 30);
    } else {
      text("太神了！恭喜全破 3 個關卡！", width / 2, height / 2 - 45);
      textSize(24);
      let seconds = totalTime / 1000;
      let grade = 'C';
      if (seconds < 10) grade = 'S';
      else if (seconds <= 30) grade = 'A';
      else if (seconds <= 60) grade = 'B';
      text("總破關時間：" + seconds.toFixed(2) + " 秒", width / 2, height / 2);
      fill(255, 215, 0); // 金黃色
      textSize(32);
      text("過關評價：" + grade + " 級", width / 2, height / 2 + 40);
      fill(255);
      textSize(20);
      text("點擊畫面任意處重新開始遊戲", width / 2, height / 2 + 85);
    }
  }
}

// 繪製背景漂浮的泡泡
function drawBubbles() {
  noStroke();
  fill(255, 120);
  for (let b of bubbles) {
    circle(b.x, b.y, b.size);
    if (gameState === 'PLAYING' || gameState === 'START') {
      b.y -= b.speed;
      b.x += sin(frameCount * 0.05 + b.y * 0.05) * 0.5; // 泡泡左右輕微搖擺
      if (b.y < -20) b.y = height + 20; // 超出上方後從底部重生
    }
  }
}

// 繪製海底岩壁
function drawCave() {
  fill(25, 45, 65); // 沉穩的岩石顏色
  stroke(15, 30, 50);
  strokeWeight(4);
  
  // 上方岩壁
  beginShape();
  vertex(0, 0);
  for (let i = 0; i < NUM_POINTS; i++) {
    vertex(topPoints[i].x, topPoints[i].y);
  }
  vertex(width, 0);
  endShape(CLOSE);

  // 下方岩壁
  beginShape();
  vertex(0, height);
  for (let i = 0; i < NUM_POINTS; i++) {
    vertex(bottomPoints[i].x, bottomPoints[i].y);
  }
  vertex(width, height);
  endShape(CLOSE);
}

// 繪製底部海草
function drawSeaweeds() {
  noFill();
  strokeWeight(10);
  strokeCap(ROUND);
  for (let s of seaweeds) {
    stroke(s.c);
    beginShape();
    // 分段繪製讓海草有柔軟彎曲的質感
    for (let i = 0; i <= s.h; i += 15) {
      let sway = sin(frameCount * 0.02 + s.phase - i * 0.05) * 20 * (i / s.h); // 越往上方搖擺幅度越大
      vertex(s.x + sway, height - i);
    }
    endShape();
  }
}

// 繪製魚 (取代原本的方塊障礙物)
function drawFish(x, y, size, isFacingRight) {
  push();
  translate(x, y);
  if (!isFacingRight) scale(-1, 1); // 根據游動方向水平翻轉
  fill(255, 120, 50); 
  noStroke();
  ellipse(0, 0, size, size * 0.6); // 魚身
  
  // 擺動的魚尾巴
  let tailSway = sin(frameCount * 0.2) * 5;
  triangle(-size/2, 0, -size*0.8, -size*0.4 + tailSway, -size*0.8, size*0.4 + tailSway); 
  
  // 魚眼
  fill(255);
  circle(size*0.25, -size*0.1, size*0.2); 
  fill(0);
  circle(size*0.25, -size*0.1, size*0.1); 
  pop();
}

// 繪製寶藏 (取代終點標示)
function drawTreasure(x, y, size) {
  push();
  translate(x, y);
  fill(139, 69, 19); 
  stroke(218, 165, 32); 
  strokeWeight(2);
  rectMode(CENTER);
  rect(0, 0, size, size*0.6, 5); // 箱體
  arc(0, -size*0.3, size, size*0.6, PI, TWO_PI, CHORD); // 箱蓋
  
  // 閃閃發光的金幣
  fill(255, 215, 0); 
  noStroke();
  circle(0, -size*0.1, size*0.2);
  circle(-size*0.2, -size*0.15, size*0.15);
  circle(size*0.2, -size*0.15, size*0.15);
  pop();
}

// 繪製玩家潛水員 (取代發光圓點)
function drawDiver(x, y) {
  push();
  translate(x, y);
  fill(255, 200, 100);
  noStroke();
  rectMode(CENTER);
  rect(0, 0, 30, 14, 6); // 身體
  fill(200, 240, 255);
  stroke(50);
  strokeWeight(2);
  rect(8, 0, 12, 10, 4); // 潛水鏡
  fill(200, 50, 50);
  noStroke();
  rect(-16, 0, 8, 16, 4); // 氧氣筒
  
  // 呼吸氣泡特效
  if (frameCount % 20 < 10) {
    fill(255, 180);
    noStroke();
    circle(18, -8, 5);
  }
  pop();
}

function updateAndDrawObstacles() {
  for (let obs of obstacles) {
    if (gameState === 'PLAYING') {
      obs.y += obs.speed;
      // 如果碰到上下邊界，就反轉移動方向
      if (obs.y - obs.size / 2 < obs.minY || obs.y + obs.size / 2 > obs.maxY) {
        obs.speed *= -1;
      }
    }
    // 繪製游動的魚
    let isFacingRight = obs.speed > 0;
    drawFish(obs.x, obs.y, obs.size, isFacingRight);
  }
}

function drawStartZone() {
  let startCenterY = (topPoints[0].y + bottomPoints[0].y) / 2;
  fill(0, 200, 255, 100); // 半透明水藍色發光區
  stroke(0, 255, 255);
  strokeWeight(2);
  circle(topPoints[0].x, startCenterY, 80); 
  
  fill(255);
  noStroke();
  textSize(16);
  textAlign(CENTER, CENTER);
  text("點擊\nSTART", topPoints[0].x, startCenterY);
}

function drawEndZone() {
  let endCenterY = (topPoints[NUM_POINTS - 1].y + bottomPoints[NUM_POINTS - 1].y) / 2;
  fill(255, 215, 0, 100); // 半透明金色發光區
  stroke(255, 215, 0);
  strokeWeight(2);
  circle(topPoints[NUM_POINTS - 1].x, endCenterY, 80);
  
  // 在終點畫上寶藏
  drawTreasure(topPoints[NUM_POINTS - 1].x, endCenterY, 40);
  
  fill(255);
  noStroke();
  textSize(14);
  textAlign(CENTER, CENTER);
  text("TREASURE", topPoints[NUM_POINTS - 1].x, endCenterY + 30);
}

function mousePressed() {
  if (gameState === 'START') {
    let startCenterY = (topPoints[0].y + bottomPoints[0].y) / 2;
    // 檢查是否精準點擊在綠色圓形按鈕內 (半徑40)
    if (dist(mouseX, mouseY, topPoints[0].x, startCenterY) <= 40) {
      gameState = 'PLAYING';
      spotlightRadius = 150; // 每次開始遊戲時，重置探照燈半徑
    }
  } else if (gameState === 'GAMEOVER') {
    // 判斷是否點擊「重玩此關」 (左邊按鈕)
    if (mouseX > width / 2 - 140 && mouseX < width / 2 - 20 && mouseY > height / 2 + 20 && mouseY < height / 2 + 60) {
      generatePath();
      gameState = 'START';
    } 
    // 判斷是否點擊「從頭再來」 (右邊按鈕)
    else if (mouseX > width / 2 + 20 && mouseX < width / 2 + 140 && mouseY > height / 2 + 20 && mouseY < height / 2 + 60) {
      currentLevel = 1;
      totalTime = 0;
      generatePath();
      gameState = 'START';
    }
  } else if (gameState === 'WIN') {
    if (currentLevel < 3) {
      currentLevel++; // 進入下一關
    } else {
      currentLevel = 1; // 全部通關後重頭開始
      totalTime = 0; // 重新挑戰時，時間歸零
    }
    generatePath();
    gameState = 'START';
  }
}

function checkCollision() {
  let startCenterY = (topPoints[0].y + bottomPoints[0].y) / 2;
  let endCenterY = (topPoints[NUM_POINTS - 1].y + bottomPoints[NUM_POINTS - 1].y) / 2;

  // 1. 安全區檢查：只要滑鼠還在綠色起點圓形內，就不會失敗
  if (dist(mouseX, mouseY, topPoints[0].x, startCenterY) <= 40) {
    return;
  }
  
  // 2. 破關檢查：滑鼠進入紅色終點圓形範圍，代表成功！
  if (dist(mouseX, mouseY, topPoints[NUM_POINTS - 1].x, endCenterY) <= 40) {
    gameState = 'WIN';
    return;
  }

  let onPath = false;

  // 3. 軌道出界檢查 (插值計算岩壁邊界)
  for (let i = 0; i < NUM_POINTS - 1; i++) {
    if (mouseX >= topPoints[i].x && mouseX <= topPoints[i + 1].x) {
      onPath = true;
      
      let t = (mouseX - topPoints[i].x) / (topPoints[i + 1].x - topPoints[i].x);
      let currentTopLimit = lerp(topPoints[i].y, topPoints[i + 1].y, t);
      let currentBottomLimit = lerp(bottomPoints[i].y, bottomPoints[i + 1].y, t);
      
      // 考慮到潛水員的高度，給予上下各約 7 pixel 的緩衝空間
      if (mouseY - 7 <= currentTopLimit || mouseY + 7 >= currentBottomLimit) {
        gameState = 'GAMEOVER';
      }
      break; 
    }
  }
  
  // 4. 障礙物(魚)碰撞檢查
  for (let obs of obstacles) {
    // 簡單的圓形碰撞判定，給予魚和潛水員一些寬限值
    if (dist(mouseX, mouseY, obs.x, obs.y) < obs.size / 2 + 10) {
      gameState = 'GAMEOVER';
    }
  }

  // 如果滑鼠已經離開起點圓圈，又不在軌道 X 區間內，直接判定失敗
  if (!onPath) {
    gameState = 'GAMEOVER';
  }
}

function drawTimer() {
  fill(255);
  noStroke();
  textSize(20);
  textAlign(RIGHT, BOTTOM);
  text("時間: " + (totalTime / 1000).toFixed(2) + " 秒", width - 20, height - 20);
}
