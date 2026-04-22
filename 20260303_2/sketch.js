/**
 * p5_audio_visualizer
 * 這是一個結合 p5.js 與 p5.sound 的程式，載入音樂並循環播放，
 * 畫面上會有多個隨機生成的多邊形在視窗內移動反彈，且其大小會跟隨音樂的振幅（音量）即時縮放。
 */

// 全域變數
let shapes = [];
let song;
let amplitude;
let bubbles = [];

// 外部定義的二維陣列，做為多邊形頂點的基礎座標
let points = [[-3, 5], [3, 7], [1, 5],[2,4],[4,3],[5,2],[6,2],[8,4],[8,-1],[6,0],[0,-3],[2,-6],[-2,-3],[-4,-2],[-5,-1],[-6,1],[-6,2]];

function preload() {
  // 在程式開始前預載入外部音樂資源
  song = loadSound('midnight-quirk-255361.mp3');
}

function setup() {
  // 初始化畫布
  createCanvas(windowWidth, windowHeight);

  // 初始化 Amplitude 物件
  amplitude = new p5.Amplitude();

  // 循環播放音樂 (瀏覽器通常需要使用者互動才能開始播放音訊，可配合 mousePressed)
  song.loop();

  // 產生 10 個形狀物件
  for (let i = 0; i < 10; i++) {
    // 產生隨機大小倍率
    let rScale = random(10, 30);
    // 透過 map() 讀取全域陣列 points，產生變形後的頂點
    let shapePoints = points.map(p => {
      // 將每個頂點的 x 與 y 分別乘上相同的隨機倍率
      return {
        x: p[0] * rScale,
        y: p[1] * rScale
      };
    });

    // 建立形狀物件並推入陣列
    shapes.push({
      x: random(windowWidth),
      y: random(windowHeight),
      dx: random(-3, 3),
      dy: random(-3, 3),
      scale: random(1, 10), // 初始隨機縮放比例 (雖然 draw 中主要使用音量縮放)
      color: color(random(255), random(255), random(255)),
      points: shapePoints
    });
  }
}

function draw() {
  // 設定背景顏色
  background('#add8e6');
  
  // 產生與繪製泡泡
  if (frameCount % 10 === 0) {
    bubbles.push(new Bubble(random(width), height + 20));
  }
  for (let i = bubbles.length - 1; i >= 0; i--) {
    let b = bubbles[i];
    b.update();
    b.display();
    if (b.isDead()) {
      bubbles.splice(i, 1);
    }
  }

  // 設定邊框粗細
  strokeWeight(2);

  // 取得當前音量大小 (0 ~ 1)
  let level = amplitude.getLevel();

  // 將音量映射到縮放倍率 (0.5 ~ 2)
  let sizeFactor = map(level, 0, 1, 0.5, 2);

  // 走訪每個 shape 進行更新與繪製
  for (let shape of shapes) {
    // 位置更新
    shape.x += shape.dx;
    shape.y += shape.dy;

    // 邊緣反彈檢查
    if (shape.x < 0 || shape.x > windowWidth) {
      shape.dx *= -1;
    }
    if (shape.y < 0 || shape.y > windowHeight) {
      shape.dy *= -1;
    }

    // 設定外觀
    fill(shape.color);
    stroke(shape.color);

    // 座標轉換與縮放
    push();
    translate(shape.x, shape.y);
    // 往右移時左右翻轉，往左移時維持原向 (皆保持上下翻轉)
    if (shape.dx > 0) {
      scale(-sizeFactor, -sizeFactor);
    } else {
      scale(sizeFactor, -sizeFactor);
    }

    // 繪製多邊形
    beginShape();
    for (let p of shape.points) {
      vertex(p.x, p.y);
    }
    endShape(CLOSE);

    // 狀態還原
    pop();
  }
}

// 點擊滑鼠可暫停或繼續播放 (處理瀏覽器自動播放限制)
function mousePressed() {
  if (song.isPlaying()) {
    song.pause();
  } else {
    song.loop();
  }
}

// 視窗大小改變時調整畫布
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// 泡泡類別
class Bubble {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = random(10, 30);
    this.speed = random(1, 3);
    this.popY = random(height * 0.1, height * 0.8); // 破掉的高度
    this.popped = false;
    this.particles = [];
  }

  update() {
    if (!this.popped) {
      this.y -= this.speed;
      this.x += random(-1, 1); // 輕微左右晃動
      if (this.y < this.popY) {
        this.pop();
      }
    } else {
      for (let p of this.particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 10;
      }
    }
  }

  pop() {
    this.popped = true;
    for (let i = 0; i < 6; i++) {
      let angle = random(TWO_PI);
      let speed = random(1, 3);
      this.particles.push({
        x: this.x,
        y: this.y,
        vx: cos(angle) * speed,
        vy: sin(angle) * speed,
        life: 255
      });
    }
  }

  display() {
    if (!this.popped) {
      noStroke();
      fill(255, 150); // 白色偏透明
      circle(this.x, this.y, this.size);
      // 光澤
      fill(255, 200);
      circle(this.x + this.size * 0.2, this.y - this.size * 0.2, this.size * 0.3);
    } else {
      // 破掉的效果 (粒子)
      for (let p of this.particles) {
        stroke(255, p.life);
        strokeWeight(2);
        point(p.x, p.y);
      }
    }
  }

  isDead() {
    return this.popped && this.particles.every(p => p.life <= 0);
  }
}
