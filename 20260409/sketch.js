// 遊戲全域變數
let score = 0;
let gridCells = [];
let targetColor;
let particles = [];
let shakeTime = 0;
let colorDiffusion = { active: false, x: 0, y: 0, radius: 0, color: null };
let combo = 0; // 連擊數
let timeLeft = 40; // 倒數計時 40 秒
let gameState = 'START'; // 遊戲狀態：'START', 'RULES', 'RANKS', 'SETTINGS', 'PLAYING', 'GAMEOVER'
let currentDifficulty = 'EASY'; // 當前難度
let battery = 100; // 手電筒電量 (困難模式)

// 音效變數
let bgm;
let clickSound;
let errorSound;
let bgmEnabled = true; // 背景音樂開關
let sfxEnabled = true; // 音效開關

// 設定常數
const FLASHLIGHT_RADIUS = 120; // 手電筒照射半徑
const GRID_SIZE = 50; // 全螢幕方格大小
let fakeCount = 0; // 陷阱方格數量 (將隨難度變更)

function preload() {
  // 預先載入所有音效檔案
  soundFormats('mp3');
  bgm = loadSound('background.mp3');
  clickSound = loadSound('click.mp3');
  errorSound = loadSound('error.mp3');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  noCursor(); // 隱藏預設滑鼠游標
  noSmooth(); // 關閉抗鋸齒以增強像素感
  textFont('Courier New'); // 改回復古打字機字體，中文會自動使用系統預設字體
  textStyle(BOLD);
  bgm.setVolume(0.05); // 將背景音樂音量調得更小聲
  errorSound.setVolume(0.15); // 調低錯誤音效音量，避免太過刺耳
}

function draw() {
  background(15, 15, 20); // 幽暗的背景色

  // 標題畫面與規則畫面
  if (gameState === 'START') {
    drawStartScreen();
    drawStaticNoise();
    drawFlashlight(null, FLASHLIGHT_RADIUS); // 在選單也保留手電筒游標
    return;
  } else if (gameState === 'RULES') {
    drawRulesScreen();
    drawStaticNoise();
    drawFlashlight(null, FLASHLIGHT_RADIUS);
    return;
  } else if (gameState === 'RANKS') {
    drawRanksScreen();
    drawStaticNoise();
    drawFlashlight(null, FLASHLIGHT_RADIUS);
    return;
  } else if (gameState === 'SETTINGS') {
    drawSettingsScreen();
    drawStaticNoise();
    drawFlashlight(null, FLASHLIGHT_RADIUS);
    return;
  }

  // 遊戲進行時的邏輯 (時間與電量)
  if (gameState === 'PLAYING' && timeLeft > 0) {
    if (currentDifficulty === 'HARD') {
      battery -= 100 / (60 * 60); // 調回原本的消耗速度，60 秒自然扣光
      battery = max(battery, 0); // 確保不小於 0
    }

    // 倒數計時邏輯 (以預設 60 FPS 計算)
    if (frameCount % 60 === 0) {
      timeLeft--;
      if (timeLeft <= 0) {
        gameState = 'GAMEOVER';
        shakeTime = 40; // 觸發結束時的強烈畫面震動
        // 產生大量往外擴散的彩色煙火粒子
        for (let i = 0; i < 150; i++) {
          particles.push(new Particle(width / 2, height / 2, color(random(100, 255), random(100, 255), random(100, 255))));
        }
      }
    }
  }

  // 1. 畫面震動處理 (Screen Shake)
  push();
  if (shakeTime > 0) {
    let shakeMag = min(shakeTime, 15); // 限制最大震幅 (結算時震動更強烈)
    translate(random(-shakeMag, shakeMag), random(-shakeMag, shakeMag));
    shakeTime--;
  }

  // 動態計算手電筒半徑 (困難模式受電量影響)
  let currentRadius = FLASHLIGHT_RADIUS;
  if (gameState === 'PLAYING' && currentDifficulty === 'HARD') {
    currentRadius = max(FLASHLIGHT_RADIUS * (battery / 100), 30); // 隨電量縮小，最低保留 30
  }

  // 繪製全螢幕方格網格
  stroke(50, 50, 60);
  strokeWeight(1);
  for (let x = 0; x <= width; x += GRID_SIZE) {
    line(x, 0, x, height);
  }
  for (let y = 0; y <= height; y += GRID_SIZE) {
    line(0, y, width, y);
  }

  // 2. 顏色擴散特效 (Color Diffusion)
  if (colorDiffusion.active) {
    noStroke();
    // 使用帶有透明度的擴散顏色
    let c = color(colorDiffusion.color);
    c.setAlpha(map(colorDiffusion.radius, 0, width, 150, 0)); 
    fill(c);
    circle(colorDiffusion.x, colorDiffusion.y, colorDiffusion.radius * 2);
    colorDiffusion.radius += 25; // 擴散速度
    if (colorDiffusion.radius > width * 1.5) {
      colorDiffusion.active = false; // 擴散結束
    }
  }

  // 3. 繪製被手電筒照到的方格
  for (const cell of gridCells) {
    // 計算與手電筒(滑鼠)的距離
    let d = dist(mouseX, mouseY, cell.x, cell.y);
    
    // 只有在手電筒範圍內，或是顏色擴散特效正在進行時才顯示
    if (d < currentRadius || (colorDiffusion.active && dist(colorDiffusion.x, colorDiffusion.y, cell.x, cell.y) < colorDiffusion.radius)) {
      drawCell(cell);
    }
  }

  // 5. 繪製手電筒光圈與游標十字 (並根據與目標距離改變亮度)
  let target = gridCells.find(c => c.type === 'target');
  if (gameState === 'PLAYING') drawFlashlight(target, currentRadius); // 遊戲結束時隱藏探照燈

  // 6. 繪製全畫面復古雜訊干擾
  drawStaticNoise();

  // 如果遊戲結束，繪製結算畫面 (在背景之上，但在粒子之下)
  if (gameState === 'GAMEOVER') {
    drawGameOver();
  }

  // 4. 更新與繪製粒子特效 (Particle Explosion) - 移到結算畫面之上
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].draw();
    if (particles[i].isDead()) {
      particles.splice(i, 1);
    }
  }

  pop(); // 結束震動的座標系偏移

  // 7. 繪製 UI (確保不被震動影響)
  if (gameState === 'PLAYING') drawUI(); // 結束時不再繪製原本的 UI 條
}

function mousePressed() {
  // 處理音訊播放：瀏覽器需要使用者互動後才能播放聲音
  if (getAudioContext().state !== 'running') {
    getAudioContext().resume();
  }
  if (bgmEnabled && !bgm.isPlaying()) {
    bgm.loop(); // 在第一次點擊時循環播放背景音樂
  }

  // 標題畫面點擊判斷
  if (gameState === 'START') {
    if (isClicked(width / 2 - 150, height / 2 + 40, 100, 50)) { if(sfxEnabled) clickSound.play(); startGame('EASY'); }
    else if (isClicked(width / 2, height / 2 + 40, 100, 50)) { if(sfxEnabled) clickSound.play(); startGame('MEDIUM'); }
    else if (isClicked(width / 2 + 150, height / 2 + 40, 100, 50)) { if(sfxEnabled) clickSound.play(); startGame('HARD'); }
    else if (isClicked(width / 2, height / 2 + 120, 200, 50)) { if(sfxEnabled) clickSound.play(); gameState = 'RULES'; }
    else if (isClicked(width / 2, height / 2 + 180, 200, 50)) { if(sfxEnabled) clickSound.play(); gameState = 'SETTINGS'; }
    return;
  }

  // 規則畫面點擊判斷
  if (gameState === 'RULES') {
    if (isClicked(width / 2 - 120, height / 2 + 160, 200, 50)) { if(sfxEnabled) clickSound.play(); gameState = 'START'; }
    else if (isClicked(width / 2 + 120, height / 2 + 160, 200, 50)) { if(sfxEnabled) clickSound.play(); gameState = 'RANKS'; }
    return;
  }

  // 評級標準畫面點擊判斷
  if (gameState === 'RANKS') {
    if (isClicked(width / 2, height / 2 + 220, 200, 50)) { if(sfxEnabled) clickSound.play(); gameState = 'RULES'; }
    return;
  }

  // 設置畫面點擊判斷
  if (gameState === 'SETTINGS') {
    if (isClicked(width / 2, height / 2 - 50, 200, 50)) {
      if(sfxEnabled) clickSound.play();
      bgmEnabled = !bgmEnabled;
      if (bgmEnabled && !bgm.isPlaying()) bgm.loop();
      else if (!bgmEnabled && bgm.isPlaying()) bgm.stop();
    } else if (isClicked(width / 2, height / 2 + 30, 200, 50)) {
      sfxEnabled = !sfxEnabled;
      if(sfxEnabled) clickSound.play();
    } else if (isClicked(width / 2, height / 2 + 160, 200, 50)) {
      if(sfxEnabled) clickSound.play();
      gameState = 'START';
    }
    return;
  }

  // 如果遊戲已結束，點擊畫面可重新開始
  if (gameState === 'GAMEOVER') {
    if(sfxEnabled) clickSound.play();
    gameState = 'START'; // 回到標題畫面重新選擇難度
    return;
  }

  // 遊戲進行中點擊判定
  if (gameState === 'PLAYING') {
    let currentRadius = (currentDifficulty === 'HARD') ? max(FLASHLIGHT_RADIUS * (battery / 100), 30) : FLASHLIGHT_RADIUS;
    let hit = false;
    for (const cell of gridCells) {
      let d = dist(mouseX, mouseY, cell.x, cell.y);
      let hitX = abs(mouseX - cell.x) <= GRID_SIZE / 2;
      let hitY = abs(mouseY - cell.y) <= GRID_SIZE / 2;
      
      if (hitX && hitY) {
        if (d < currentRadius) {
          if (cell.type === 'target') {
            if (sfxEnabled) clickSound.play();
            combo++;
            score += 10 * combo;
            shakeTime = 20;
            triggerExplosion(cell.x, cell.y, cell.color);
            triggerColorDiffusion(cell.x, cell.y, cell.color);
            setupLevel();
            hit = true;
          } else {
            if (sfxEnabled) {
              if (errorSound.isPlaying()) errorSound.stop(); // 截斷殘音防延遲
              errorSound.play();
            }
            combo = 0;
            score -= 2;
            shakeTime = 10;
            if (currentDifficulty === 'HARD') battery = max(battery - 15, 0); // 調回原本點錯扣除 15% 電量
            
            if (cell.type === 'fake') {
              triggerExplosion(cell.x, cell.y, color(255, 200, 0));
              cell.type = 'normal';
              cell.color = color(30, 30, 35);
            } else {
              triggerExplosion(cell.x, cell.y, color(150));
            }
            hit = true;
          }
        } else {
          if (sfxEnabled) {
            if (errorSound.isPlaying()) errorSound.stop(); // 截斷殘音防延遲
            errorSound.play();
          }
          combo = 0;
          score -= 2;
          shakeTime = 5;
          if (currentDifficulty === 'HARD') battery = max(battery - 15, 0); // 調回原本盲點扣除 15% 電量
          triggerExplosion(mouseX, mouseY, color(150));
          hit = true;
        }
        if (hit) break;
      }
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (gameState === 'PLAYING') setupLevel(); // 視窗變動時重新生成網格
}

class Particle {
  constructor(x, y, c) {
    this.x = x;
    this.y = y;
    let angle = random(TWO_PI);
    let speed = random(2, 8);
    this.vx = cos(angle) * speed;
    this.vy = sin(angle) * speed;
    this.life = 255;
    this.color = c;
    this.size = random(4, 12);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= 8; // 衰減速度
  }

  draw() {
    let c = color(this.color);
    c.setAlpha(this.life);
    fill(c);
    noStroke();
    // 粒子也對齊像素網格
    let px = floor(this.x / 8) * 8;
    let py = floor(this.y / 8) * 8;
    rectMode(CENTER);
    rect(px, py, this.size, this.size);
  }

  isDead() {
    return this.life <= 0;
  }
}

// ---------------- 遊戲功能函數 ---------------- //

// 開始新遊戲
function startGame(difficulty) {
  currentDifficulty = difficulty;
  if (difficulty === 'EASY') { fakeCount = 0; timeLeft = 40; }
  else if (difficulty === 'MEDIUM') { fakeCount = 5; timeLeft = 50; }
  else if (difficulty === 'HARD') { fakeCount = 15; timeLeft = 60; }

  score = 0;
  combo = 0;
  battery = 100;
  particles = [];
  colorDiffusion.active = false;
  gameState = 'PLAYING';
  setupLevel();
}

// 繪製初始標題畫面
function drawStartScreen() {
  textAlign(CENTER, CENTER);
  
  stroke(0);
  strokeWeight(5);
  fill(255);
  textSize(60);
  text("顏色獵人🔫", width / 2, height / 2 - 120);
  
  strokeWeight(3);
  fill(200);
  textSize(20);
  text("在期限內找出盡可能多的顏色！", width / 2, height / 2 - 50);

  drawButton("簡單", width / 2 - 150, height / 2 + 40, 100, 50, color(50, 200, 50));
  drawButton("中等", width / 2, height / 2 + 40, 100, 50, color(200, 200, 50));
  drawButton("困難", width / 2 + 150, height / 2 + 40, 100, 50, color(200, 50, 50));

  drawButton("遊戲規則", width / 2, height / 2 + 120, 200, 50, color(100, 100, 255));
  drawButton("設置", width / 2, height / 2 + 180, 200, 50, color(150, 100, 200));
}

// 繪製遊戲規則畫面
function drawRulesScreen() {
  textAlign(CENTER, CENTER);
  stroke(0);
  strokeWeight(4);
  fill(255);
  textSize(40);
  text("遊戲規則", width / 2, height / 2 - 150);

  textSize(20);
  strokeWeight(2);
  fill(200);
  let rulesText = 
    "1. 使用滑鼠(探照燈)在黑暗中尋找目標顏色。\n\n" +
    "2. 點擊正確顏色 +10 分，連續點對可獲得 Combo 倍數加成！\n\n" +
    "3. 點擊錯誤或陷阱方塊 -2 分，並中斷 Combo (困難模式還會扣除電量)。\n\n" +
    "4. 探照燈越靠近正確目標，光圈邊緣會越亮。\n\n" +
    "5. 避開閃爍著黃色警示的陷阱方格！";
  text(rulesText, width / 2, height / 2 - 10);

  drawButton("返回標題", width / 2 - 120, height / 2 + 160, 200, 50, color(150));
  drawButton("評級標準", width / 2 + 120, height / 2 + 160, 200, 50, color(100, 150, 255));
}

// 繪製評級標準畫面
function drawRanksScreen() {
  textAlign(CENTER, CENTER);
  stroke(0);
  strokeWeight(4);
  fill(255);
  textSize(40);
  text("評級標準", width / 2, height / 2 - 180);

  strokeWeight(2);
  textSize(22);
  let colW = 220;
  
  fill(255);
  text("簡單 (40秒)", width / 2 - colW, height / 2 - 100);
  text("中等 (50秒)", width / 2, height / 2 - 100);
  text("困難 (60秒)", width / 2 + colW, height / 2 - 100);

  let ranks = ['S', 'A', 'B', 'C'];
  let colors = [color(255, 215, 0), color(50, 255, 50), color(50, 150, 255), color(255, 150, 50)];
  let easyT = [150, 100, 50, 20]; // 簡單模式門檻 (標準最高)
  let medT = [120, 80, 40, 20];  // 中等模式門檻
  let hardT = [100, 60, 30, 20]; // 困難模式門檻 (標準最低)

  for (let i = 0; i < 4; i++) {
    let y = height / 2 - 40 + i * 45;
    fill(colors[i]);
    text(`${ranks[i]} : ${easyT[i]}分`, width / 2 - colW, y);
    text(`${ranks[i]} : ${medT[i]}分`, width / 2, y);
    text(`${ranks[i]} : ${hardT[i]}分`, width / 2 + colW, y);
  }
  
  fill(255, 50, 50);
  text("D : 未達 C 級標準", width / 2, height / 2 + 140);

  drawButton("返回規則", width / 2, height / 2 + 220, 200, 50, color(150));
}

// 繪製設置畫面
function drawSettingsScreen() {
  textAlign(CENTER, CENTER);
  stroke(0);
  strokeWeight(4);
  fill(255);
  textSize(40);
  text("設置", width / 2, height / 2 - 150);

  let bgmText = bgmEnabled ? "背景音樂: 開" : "背景音樂: 關";
  let bgmColor = bgmEnabled ? color(50, 200, 50) : color(200, 50, 50);
  drawButton(bgmText, width / 2, height / 2 - 50, 200, 50, bgmColor);

  let sfxText = sfxEnabled ? "音效: 開" : "音效: 關";
  let sfxColor = sfxEnabled ? color(50, 200, 50) : color(200, 50, 50);
  drawButton(sfxText, width / 2, height / 2 + 30, 200, 50, sfxColor);

  drawButton("返回標題", width / 2, height / 2 + 160, 200, 50, color(150));
}

// 按鈕點擊判定輔助函數
function isClicked(x, y, w, h) {
  return abs(mouseX - x) < w / 2 && abs(mouseY - y) < h / 2;
}

// 建立新關卡
function setupLevel() {
  gridCells = [];
  let cols = ceil(width / GRID_SIZE);
  let rows = ceil(height / GRID_SIZE);

  // 1. 填滿所有方格
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      gridCells.push({
        x: c * GRID_SIZE + GRID_SIZE / 2,
        y: r * GRID_SIZE + GRID_SIZE / 2,
        // 產生不飽和的柔和顏色
        color: color(random(50, 150), random(50, 150), random(50, 150)),
        type: 'normal'
      });
    }
  }

  // 2. 從中挑選一個作為目標
  let targetIndex = floor(random(gridCells.length));
  gridCells[targetIndex].type = 'target';
  targetColor = gridCells[targetIndex].color;

  // 3. 挑選數個作為陷阱 (確保不與目標重疊)
  let attempts = 0;
  for (let i = 0; i < fakeCount && attempts < gridCells.length; i++) {
    let fakeIndex = floor(random(gridCells.length));
    if (gridCells[fakeIndex].type === 'normal') {
      gridCells[fakeIndex].type = 'fake';
    } else {
      i--; // 這次不算，重試一次
    }
    attempts++;
  }
}

// 觸發粒子爆炸特效
function triggerExplosion(x, y, c) {
  for (let i = 0; i < 30; i++) {
    particles.push(new Particle(x, y, c));
  }
}

// 觸發顏色擴散特效
function triggerColorDiffusion(x, y, c) {
  colorDiffusion = {
    active: true,
    x: x,
    y: y,
    radius: 10,
    color: c
  };
}

// 繪製互動按鈕
function drawButton(txt, x, y, w, h, baseColor) {
  let isHover = isClicked(x, y, w, h);
  rectMode(CENTER);
  if (isHover) {
    fill(red(baseColor) + 50, green(baseColor) + 50, blue(baseColor) + 50);
  } else {
    fill(baseColor);
  }
  stroke(255);
  strokeWeight(2);
  rect(x, y, w, h, 10);

  stroke(0);
  strokeWeight(3);
  fill(255);
  textSize(20);
  text(txt, x, y);
}

// 繪製手電筒效果與十字準星
function drawFlashlight(target, radius) {
  let flashlightAlpha = 40; // 預設亮度
  if (target) {
    let d = dist(mouseX, mouseY, target.x, target.y);
    // 越靠近目標，光圈越亮
    flashlightAlpha = constrain(
      map(d, radius * 1.5, radius * 0.5, 40, 255),
      40,
      255
    );
  }

  // 手電筒邊界光暈 (多層次增強效果)
  noFill();
  // 繪製多層光暈來營造"輝光" (Bloom) 效果
  for (let i = 4; i >= 0; i--) {
    let alpha = flashlightAlpha / (i * 1.5 + 1); // 外層光暈較透明
    let weight = 2 + i * 4; // 外層光暈較粗
    stroke(255, 255, 200, alpha);
    strokeWeight(weight);
    circle(mouseX, mouseY, radius * 2);
  }
  // 十字準星
  stroke(255, 200);
  strokeWeight(2);
  line(mouseX - 10, mouseY, mouseX + 10, mouseY);
  line(mouseX, mouseY - 10, mouseX, mouseY + 10);
}

// 繪製單一網格
function drawCell(cell) {
  noStroke();
  rectMode(CENTER);
  if (cell.type === 'fake') {
    // 使用顯眼的閃爍黃橘色加內部深色方塊作為警示陷阱
    let flashColor = sin(frameCount * 0.15) > 0 ? color(255, 200, 0) : color(255, 100, 0);
    fill(flashColor);
    rect(cell.x, cell.y, GRID_SIZE, GRID_SIZE);
    fill(40); // 中間深色核心
    rect(cell.x, cell.y, GRID_SIZE * 0.5, GRID_SIZE * 0.5);
  } else {
    fill(cell.color);
    rect(cell.x, cell.y, GRID_SIZE, GRID_SIZE);
  }
}

// 繪製全畫面復古靜電雜訊
function drawStaticNoise() {
  noStroke();
  // 為了效能，每幀只隨機畫少量雜訊點，但視覺上已足夠產生干擾感
  for (let i = 0; i < 150; i++) {
    fill(random(255), random(50, 150)); // 帶有透明度的黑白/灰點
    let nx = floor(random(width) / 8) * 8;
    let ny = floor(random(height) / 8) * 8;
    rectMode(CORNER);
    rect(nx, ny, 8, 8);
  }
}

// 當游標碰到障礙物時產生強烈的雜訊波
function generateNoiseBurst() {
  for (let i = 0; i < 300; i++) {
    particles.push(new Particle(mouseX, mouseY, color(200, 200, 200)));
  }
}

// 繪製 UI 分數面板
function drawUI() {
  fill(0, 150);
  noStroke();
  rectMode(CORNER);
  let uiWidth = currentDifficulty === 'HARD' ? 680 : 540; // 困難模式更寬以容納電量
  rect(10, 10, uiWidth, 50); 

  stroke(0);
  strokeWeight(3);
  fill(255);
  textSize(20);
  textAlign(LEFT, CENTER);
  text(`SCORE: ${score}`, 20, 35);

  // 連擊 (Combo) 顯示
  if (combo > 1) {
    fill(255, 215, 0); // 有連擊時顯示金色
    text(`COMBO x${combo}!`, 160, 35);
  } else {
    fill(200); // 無連擊時顯示暗色
    text(`COMBO x${combo}`, 160, 35);
  }

  // 倒數計時顯示 (倒數 5 秒內變紅色警告)
  let timeColor = timeLeft <= 5 ? color(255, 50, 50) : color(255);
  fill(timeColor);
  text(`TIME: ${timeLeft}s`, 300, 35);

  fill(255);
  text(`FIND:`, 420, 35);
  if (targetColor) {
    fill(targetColor);
    stroke(255, 100);
    strokeWeight(2);
    rectMode(CENTER);
    rect(495, 35, 30, 30);
  }

  if (currentDifficulty === 'HARD') {
    let batColor = battery < 30 ? color(255, 50, 50) : color(50, 255, 50);
    fill(batColor);
    text(`BAT: ${ceil(battery)}%`, 550, 35);
  }
}

// 繪製遊戲結束畫面與評級
function drawGameOver() {
  // 使用 rect 繪製半透明背景，這樣它才能配合 push/pop 跟著畫面一起震動
  fill(15, 15, 20, 200);
  noStroke();
  rectMode(CORNER);
  rect(-100, -100, width + 200, height + 200); // 範圍加大確保震動時邊緣不穿幫
  
  textAlign(CENTER, CENTER);
  stroke(0);
  strokeWeight(5);
  fill(255);
  
  textSize(60);
  text("GAME OVER", width / 2, height / 2 - 80);
  
  strokeWeight(3);
  textSize(30);
  text(`FINAL SCORE: ${score}`, width / 2, height / 2);
  
  // 根據難度決定評級門檻
  let s_req = 150, a_req = 100, b_req = 50, c_req = 20; // 預設(簡單)
  if (currentDifficulty === 'MEDIUM') { s_req = 120; a_req = 80; b_req = 40; c_req = 20; }
  else if (currentDifficulty === 'HARD') { s_req = 100; a_req = 60; b_req = 30; c_req = 20; }

  // 決定評級與顏色
  let grade = 'D';
  let gradeColor = color(150);
  if (score >= s_req) { grade = 'S'; gradeColor = color(255, 215, 0); /* 金色 */ }
  else if (score >= a_req) { grade = 'A'; gradeColor = color(50, 255, 50); /* 綠色 */ }
  else if (score >= b_req) { grade = 'B'; gradeColor = color(50, 150, 255); /* 藍色 */ }
  else if (score >= c_req) { grade = 'C'; gradeColor = color(255, 150, 50); /* 橘色 */ }
  else { grade = 'D'; gradeColor = color(255, 50, 50); /* 紅色 */ }

  textSize(40);
  fill(255);
  text("RANK: ", width / 2 - 30, height / 2 + 60);
  fill(gradeColor);
  textSize(50);
  text(grade, width / 2 + 60, height / 2 + 60);

  textSize(20);
  fill(200);
  text("- CLICK TO RESTART -", width / 2, height / 2 + 140);
}
