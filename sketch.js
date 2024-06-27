function setup() {
  createCanvas(windowWidth, windowHeight);  
}

function draw() {
  if (mouseIsPressed){
    fill(0);
  }else{
    fill(255);
  }
  ellipse(mouseX,mouseY,150,80);
}


//ウィンドウサイズが変更されたときに実行される関数
function windowResized() {
  // print("ウィンドウサイズの変更");
  resizeCanvas(windowWidth, windowHeight);
}