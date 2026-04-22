function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100,1);
}

function draw() {
  background(58, 50, 90);
  for (let i = 0; i < width; i+= 50) {
    for (let j = 0; j < height; j += 50) {
      var clr = color((frameCount + i / width * 60 + j / height * 60) % 360, 100, 100);
      //clr.setAlpha(i/width);
      fill(clr);
      ellipse(i, j, 80, 80);
    }
  }
}
