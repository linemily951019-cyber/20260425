function setup() {
  //createCanvas(400, 400);
  createCanvas(windowWidth, windowHeight);//產生一個畫布，寬度為視窗高度，高度為視窗高度
  //background(220);//設定背景顏色為220(灰色)，數值範圍從0(黑色)到255(白色)
  //background(255,0,0);//RGB，設定背景顏色為紅色，RGB顏色模式中，紅色、綠色和藍色的數值範圍從0到255
  ///background(255,255,0,127);//RGBA，設定背景顏色為綠色，RGB顏色模式中，紅色、綠色和藍色的數值範圍從0到255，A(Alpha)表示透明度，數值範圍從0(完全透明)到255(完全不透明)，在這裡設定為127表示半透明

  var clr1 = color("#fce6ac");//創建一個顏色對象，表示紅色
  var clr2 = color("#fcbf49");//創建一個顏色對象，表示綠色
  var clr3 = color("#f77f00");


  colorMode(HSB);//設定顏色模式為HSB，HSB顏色模式中，色相(Hue)的數值範圍從0到360，飽和度(Saturation)和亮度(Brightness)的數值範圍從0到100
  var clr5 = color(120,50,50);//創建一個顏色對象，表示綠色，HSB顏色模式中，色相(Hue)的數值範圍從0到360，飽和度(Saturation)和亮度(Brightness)的數值範圍從0到100
  clr5.setAlpha(120);//設定clr6顏色對象的透明度為127，數值範圍從0(完全透明)到255(完全不透明)，在這裡設定為127表示半透明
  background(clr5);//設定背景顏色為clr變數所表示的顏色

}

function draw() {
  // background(220);
  var clr4 = color(30+mouseX%300,50,100);//創建一個顏色對象，表示黃色，HSB顏色模式中，色相(Hue)的數值範圍從0到360，飽和度(Saturation)和亮度(Brightness)的數值範圍從0到100
  var clr6 = color(240,50,50);//創建一個顏色對象，表示藍色
  fill(clr4);//設定填充顏色為clr變數所表示的顏色
  stroke(clr6);//設定筆觸顏色為clr變數所表示的顏色
  noStroke();//取消筆觸，使繪製的圖形沒有邊框
  strokeWeight(4);//設定筆觸寬度為4像素
  //在滑鼠位置繪製一個圓，圓心坐標為(mouseX, mouseY)，半徑為50像素
  ellipse(mouseX, mouseY,70,70);

}
