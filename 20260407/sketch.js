let topPoints = [];
let bottomPoints = [];
const NUM_POINTS = 10;
let gameState = 'START'; // 遊戲狀態：START, PLAYING, GAMEOVER, WIN
let currentLevel = 1; // 記錄目前的關卡數
let obstacles = []; // 儲存障礙物的陣列
let spotlightRadius = 150; // 探照燈的初始半徑
let totalTime = 0; // 記錄總遊玩時間

function setup() {
  // 改為全螢幕
  createCanvas(windowWidth, windowHeight);
  generatePath();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
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
    
    // 根據關卡調整難度，大幅縮小上下軌道間距 (軌道變細)
    let gap = random(45 - currentLevel * 5, 70 - currentLevel * 10);
    
    topPoints.push(createVector(currentX, currentY));
    bottomPoints.push(createVector(currentX, currentY + gap));
    
    currentX += stepX;
  }

  // 產生障礙物 (從第 2 關開始)
  if (currentLevel >= 2) {
    let numObstacles = currentLevel == 2 ? 3 : 5; // 增加障礙物的數量
    let step = (NUM_POINTS - 2) / numObstacles;
    for (let i = 0; i < numObstacles; i++) {
      let idx = floor(1 + i * step); // 將障礙物更均勻地分散配置在軌道的不同區段
      let midX = (topPoints[idx].x + topPoints[idx+1].x) / 2;
      let midTopY = (topPoints[idx].y + topPoints[idx+1].y) / 2;
      let midBottomY = (bottomPoints[idx].y + bottomPoints[idx+1].y) / 2;
      
      obstacles.push({
        x: midX,
        y: (midTopY + midBottomY) / 2, // 初始位置在上下通道的正中間
        minY: midTopY - 45, // 上界 (超出軌道上邊距 30)
        maxY: midBottomY + 45, // 下界 (超出軌道下邊距 30)
        size: 30, // 增大障礙物大小為 30
        speed: (1 + currentLevel * 0.5) * (random() > 0.5 ? 1 : -1) // 降低移動速度
      });
    }
  }
}

function draw() {
  // 需求：背景為深色
  background(30);

  if (gameState === 'START') {
    drawPath();
    drawStartZone();
    drawEndZone();
    updateAndDrawObstacles();
    drawTimer(); // 顯示計時器
    
    fill(255);
    noStroke();
    textSize(24);
    textAlign(CENTER, CENTER);
    if (currentLevel === 3) {
      text("第 3 關 (黑暗探照燈模式) - 請點擊左側綠色按鈕開始遊戲", width / 2, 50);
    } else {
      text("第 " + currentLevel + " 關 - 請點擊左側綠色按鈕開始遊戲", width / 2, 50);
    }
    
    cursor(ARROW);
  } 
  else if (gameState === 'PLAYING') {
    totalTime += deltaTime; // 只有在遊玩狀態下才累加時間
    drawPath();
    drawStartZone();
    drawEndZone();
    updateAndDrawObstacles();
    
    // 新增第三關變化：探照燈/視野限制模式
    if (currentLevel === 3) {
      spotlightRadius -= 0.05; // 隨時間慢慢縮小探照燈範圍 (調慢縮小速度)
      spotlightRadius = max(spotlightRadius, 30); // 限制最小視野半徑為 30
      
      fill(15, 15, 20, 250); // 幾乎全黑的遮罩
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

    // 隱藏原始鼠標，繪製一個發光的電流點作為玩家判斷點
    noCursor();
    fill(255, 255, 0);
    noStroke();
    circle(mouseX, mouseY, 8);
    
    checkCollision();
    drawTimer(); // 顯示計時器
  } 
  else if (gameState === 'GAMEOVER') {
    cursor(ARROW);
    background(220, 100, 100); 
    fill(255);
    textSize(48);
    textAlign(CENTER, CENTER);
    text("遊戲失敗！", width / 2, height / 2 - 30);
    
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
    background(120, 180, 120); 
    fill(255);
    textSize(48);
    textAlign(CENTER, CENTER);
    
    if (currentLevel < 3) {
      text("恭喜過關！", width / 2, height / 2 - 30);
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

function drawPath() {
  // 1. 繪製半透明的軌道底色（安全區）
  fill(255, 150); 
  noStroke(); // 取消原本的死板白框
  
  beginShape();
  for (let i = 0; i < NUM_POINTS; i++) {
    vertex(topPoints[i].x, topPoints[i].y);
  }
  for (let i = NUM_POINTS - 1; i >= 0; i--) {
    vertex(bottomPoints[i].x, bottomPoints[i].y);
  }
  endShape(CLOSE);

  // 2. 繪製上下邊緣的電流裝飾
  for (let i = 0; i < NUM_POINTS - 1; i++) {
    drawLightning(topPoints[i], topPoints[i+1], i);
    drawLightning(bottomPoints[i], bottomPoints[i+1], i + NUM_POINTS);
  }
}

// 繪製電流效果的輔助函式
function drawLightning(p1, p2, pathIndex) {
  let segments = floor(dist(p1.x, p1.y, p2.x, p2.y) / 15); // 根據距離決定閃電折點數
  if (segments < 1) segments = 1;
  
  // 降低閃爍頻率：每 4 幀才更新一次形狀 (相當於 15 fps 的電流動畫，可自行調整 4 這個數字)
  let timeStep = floor(frameCount / 4);
  
  // 預先計算這段電流的隨機偏移點
  let pts = [];
  for (let i = 1; i < segments; i++) {
    let t = i / segments;
    // 計算垂直於線段的法向量，讓電流自然地向兩側抖動
    let nx = -(p2.y - p1.y);
    let ny = (p2.x - p1.x);
    let len = dist(0, 0, nx, ny);
    if (len > 0) { nx /= len; ny /= len; }
    
    // 使用 noise 來產生隨機偏移，透過 timeStep 控制動畫頻率
    let offset = map(noise(pathIndex * 10 + i * 0.5, timeStep * 100), 0, 1, -10, 10);
    pts.push({
      x: lerp(p1.x, p2.x, t) + nx * offset,
      y: lerp(p1.y, p2.y, t) + ny * offset
    });
  }

  // 畫兩層製造發光效果
  for (let j = 0; j < 2; j++) {
    if (j === 0) {
      stroke(0, 200, 255, 150); // 外層淡藍色光暈
      strokeWeight(4);
    } else {
      stroke(255, 255, 255); // 內層亮白色中心
      strokeWeight(1.5);
    }
    noFill();
    beginShape();
    vertex(p1.x, p1.y);
    for (let i = 0; i < pts.length; i++) {
      vertex(pts[i].x, pts[i].y);
    }
    vertex(p2.x, p2.y);
    endShape();
  }
}

function updateAndDrawObstacles() {
  rectMode(CENTER);
  fill(255, 100, 100); // 障礙物為紅色方塊
  stroke(255);
  strokeWeight(2);
  
  for (let obs of obstacles) {
    if (gameState === 'PLAYING') {
      obs.y += obs.speed;
      // 如果碰到上下邊界，就反轉移動方向
      if (obs.y - obs.size / 2 < obs.minY || obs.y + obs.size / 2 > obs.maxY) {
        obs.speed *= -1;
      }
    }
    rect(obs.x, obs.y, obs.size, obs.size);
  }
  rectMode(CORNER);
}

function drawStartZone() {
  let startCenterY = (topPoints[0].y + bottomPoints[0].y) / 2;
  fill(0, 255, 0); // 綠色
  stroke(255);
  strokeWeight(2);
  circle(topPoints[0].x, startCenterY, 80); // 直徑 80 的綠色圓形
  
  fill(0);
  noStroke();
  textSize(16);
  textAlign(CENTER, CENTER);
  text("點擊\nSTART", topPoints[0].x, startCenterY);
}

function drawEndZone() {
  let endCenterY = (topPoints[NUM_POINTS - 1].y + bottomPoints[NUM_POINTS - 1].y) / 2;
  fill(255, 0, 0); // 紅色
  stroke(255);
  strokeWeight(2);
  circle(topPoints[NUM_POINTS - 1].x, endCenterY, 80); // 直徑 80 的紅色圓形
  
  fill(255);
  noStroke();
  textSize(18);
  textAlign(CENTER, CENTER);
  text("FINISH", topPoints[NUM_POINTS - 1].x, endCenterY);
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

  // 3. 軌道出界檢查 (線性插值計算邊界)
  for (let i = 0; i < NUM_POINTS - 1; i++) {
    if (mouseX >= topPoints[i].x && mouseX <= topPoints[i + 1].x) {
      onPath = true;
      
      let t = (mouseX - topPoints[i].x) / (topPoints[i + 1].x - topPoints[i].x);
      let currentTopLimit = lerp(topPoints[i].y, topPoints[i + 1].y, t);
      let currentBottomLimit = lerp(bottomPoints[i].y, bottomPoints[i + 1].y, t);
      
      if (mouseY <= currentTopLimit || mouseY >= currentBottomLimit) {
        gameState = 'GAMEOVER';
      }
      break; 
    }
  }
  
  // 4. 障礙物碰撞檢查
  for (let obs of obstacles) {
    if (mouseX >= obs.x - obs.size / 2 && mouseX <= obs.x + obs.size / 2 &&
        mouseY >= obs.y - obs.size / 2 && mouseY <= obs.y + obs.size / 2) {
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
