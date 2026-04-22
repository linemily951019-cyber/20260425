let input;
let slider;
let btn;
let isJumping = false; // 用來記錄文字是否要跳動的狀態
// 宣告色票陣列
let colors = ['#fbf8cc', '#fde4cf', '#ffcfd2', '#f1c0e8', '#cfbaf0', '#a3c4f3', '#90dbf4', '#8eecf5', '#98f5e1', '#b9fbc0'];
let iframeDiv; // 宣告用來放置 iframe 的 DIV 變數
let selectMenu; // 宣告下拉式選單變數

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // 建立文字輸入框，並放置於畫面左上角
  input = createInput('💕淡江大學👍');
  input.position(10, 10);
  input.size(150, 25);
  input.style('font-size', '20px');
  input.style('background-color', '#ffdee6');
  input.style('color', '#fa78bf');
  input.style('border', '2px solid white');
  
  // 設定文字大小為 30px，並設定垂直對齊方式為置中
  textSize(30);
  // 建立滑桿，範圍 15 到 80，預設值為 30
  // input 的 x 為 10，寬度為 100，加上 50px 的間距，所以滑桿的 x 為 160
  slider = createSlider(15, 80, 30);
  slider.position(200, 16);
  
  // 建立按鈕，放置於滑桿右側 (滑桿預設寬度約 130px，200 + 130 + 50 = 380)
  btn = createButton('跳動開關');
  btn.position(380, 10); 
  btn.size(125, 35);
  btn.style('font-size', '20px');
  btn.mousePressed(() => {
    isJumping = !isJumping; // 每次點擊切換跳動狀態
  });
  
  // 建立下拉式選單，放置於按鈕右側 (按鈕X:380 + 寬度:125 + 距離:50 = 555)
  selectMenu = createSelect();
  selectMenu.position(555, 10);
  selectMenu.size(125, 35); // 設定選單寬高，與按鈕視覺保持一致
  selectMenu.style('font-size', '18px');
  selectMenu.option('淡江大學', 'https://www.tku.edu.tw');
  selectMenu.option('淡江教科系', 'https://www.et.tku.edu.tw');
  
  // 設定垂直對齊方式為置中
  textAlign(LEFT, CENTER);
  
  // 產生一個 DIV，位於視窗中間，距離四周 200px
  iframeDiv = createDiv();
  iframeDiv.style('position', 'fixed');
  iframeDiv.style('inset', '150px'); // 讓上下左右皆內縮 200px
  iframeDiv.style('z-index', '99'); // 確保網頁區塊顯示在畫布最上層
  
  // 在 DIV 內放入 iframe 來載入淡江大學網頁
  let iframe = createElement('iframe');
  iframe.attribute('src', 'https://www.tku.edu.tw');
  iframe.style('width', '100%');
  iframe.style('height', '100%');
  iframe.style('border', 'none'); // 隱藏 iframe 的預設邊框
  iframe.parent(iframeDiv); // 將 iframe 放入 iframeDiv 中
  
  // 綁定選單變更事件，當選擇不同選項時更新 iframe 的網址
  selectMenu.changed(() => {
    iframe.attribute('src', selectMenu.value());
  });
}

function draw() {
  background(0);
  
  let txt = input.value();
  // 取得滑桿的值並動態設定為文字大小
  let tSize = slider.value();
  textSize(tSize);
  
  // 當使用者有輸入內容時，動態計算文字寬度並利用迴圈排列
  if (txt.length > 0) {
    let tw = textWidth(txt);
    let yStep = tSize * 1.5; // 計算 1.5 倍的行距
    // 在每個字串之間加上 30px 的間隔，並以雙層迴圈產生多行文字填滿整個視窗
    for (let y = 70; y <= height + yStep; y += yStep) {
      let colorIndex = 0; // 每一行開始時，重置顏色索引
      for (let x = 0; x < width; x += tw + 30) {
        // 利用取餘數確保索引不會超過色票長度，套用文字顏色
        fill(colors[colorIndex % colors.length]);
        
        // 如果開啟跳動狀態，產生緩和的波浪上下移動
        let offsetX = 0;
        let offsetY = 0;
        if (isJumping) {
          // 利用 p5.js 的 frameCount 與座標計算 sin 函數，產生連續的波浪起伏
          offsetY = sin(frameCount * 0.05 + x * 0.01 + y * 0.01) * 15;
        }
        
        text(txt, x + offsetX, y + offsetY);
        colorIndex++; // 切換到下一個顏色
      }
    }
  }
}

// 當視窗大小改變時，重新調整畫布大小以維持全螢幕
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
