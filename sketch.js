// Hand Pose Detection with ml5.js
// https://thecodingtrain.com/tracks/ml5js-beginners-guide/ml5/hand-pose

let video;
let handPose;
let hands = [];
let bubbles = []; // 儲存水泡物件的陣列
let saltParticles = []; // 儲存鹽巴物件的陣列
let steamParticles = []; // 儲存熱氣/蒸氣物件的陣列
let gameState = "start"; // 場景狀態: "start" 或 "kitchen"
let sceneBtn; // 切換場景按鈕
let backBtn;  // 返回按鈕
let currentColor; // 用於平滑過渡的當前背景顏色
let startColor;   // 主畫面的粉紫色
let kitchenColor; // 廚房的青藍色
let statusMessage = "系統初始化中..."; // 用於顯示目前的狀態訊息

function preload() {
  // 初始化模型，並加入回呼函數 (Callback) 來確認載入成功或失敗
  handPose = ml5.handPose({ flipped: true }, () => {
    statusMessage = "✅ 手勢辨識模型載入成功！";
    console.log("Model Loaded!");
  });
}

function mousePressed() {
  console.log(hands);
}

function gotHands(results) {
  hands = results;
}

function setup() {
  // 1. 產生一個全螢幕的畫布
  createCanvas(windowWidth, windowHeight);

  // 初始化顏色變數
  startColor = color('#e7c6ff');
  kitchenColor = color('#a8dadc');
  currentColor = startColor;

  // 建立「進入廚房」按鈕
  sceneBtn = createButton('進入廚房');
  sceneBtn.position(20, 60);
  sceneBtn.style('padding', '10px');
  sceneBtn.mousePressed(() => {
    gameState = "kitchen";
    sceneBtn.hide();
    backBtn.show(); // 進入廚房後顯示返回按鈕
  });

  // 建立「返回」按鈕
  backBtn = createButton('返回主畫面');
  backBtn.position(20, 60);
  backBtn.style('padding', '10px');
  backBtn.hide(); // 初始狀態隱藏
  backBtn.mousePressed(() => {
    gameState = "start";
    backBtn.hide();
    sceneBtn.show(); // 回到主畫面後顯示進入按鈕
    saltParticles = []; // 返回時清空殘留的鹽巴
    steamParticles = []; // 返回時清空殘留的蒸氣
  });

  // 檢查瀏覽器是否支援 WebGL
  const gl = document.createElement('canvas').getContext('webgl') || 
             document.createElement('canvas').getContext('webgl2');
  if (!gl) {
    statusMessage = "❌ 錯誤：您的裝置不支援 WebGL，影像辨識可能無法運作。";
    console.error("WebGL not supported");
  } else {
    console.log("WebGL is supported");
  }

  video = createCapture(VIDEO, { flipped: true });
  
  // 修正手機端 (尤其是 iOS) 無法顯示影像的問題
  video.elt.setAttribute('playsinline', '');
  
  video.hide();

  // Start detecting hands
  handPose.detectStart(video, gotHands);
}

// 2. 當視窗大小改變時，重新調整畫布大小以保持全螢幕
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  // 根據場景決定目標顏色，並利用 lerpColor 進行平滑過渡
  let targetColor = (gameState === "start") ? startColor : kitchenColor;
  currentColor = lerpColor(currentColor, targetColor, 0.05); // 0.05 控制漸變速度
  background(currentColor);

  // 在左上方加上文字內容
  push();
  fill(0);
  noStroke();
  textSize(24);
  textAlign(LEFT, TOP);
  text("414730530 陳宥縈", 20, 20);
  pop();

  // 計算顯示影像的寬高 (畫布的50%)
  let displayVideoWidth = width * 0.5;
  let displayVideoHeight = height * 0.5;

  // 計算影像置中的位置
  let displayVideoX = (width - displayVideoWidth) / 2;
  let displayVideoY = (height - displayVideoHeight) / 2;

  // 4. 顯示攝影機影像在畫布中間，寬高為畫布的50%
  image(video, displayVideoX, displayVideoY, displayVideoWidth, displayVideoHeight);

  // 如果是廚房場景，繪製一個鍋子
  if (gameState === "kitchen") {
    push();
    fill(100); // 深灰色鍋子
    stroke(50);
    strokeWeight(2);
    rect(width / 2 - 100, displayVideoY + displayVideoHeight - 50, 200, 60, 0, 0, 20, 20);
    pop();
  }

  // Ensure at least one hand is detected
  if (hands.length > 0) {
    for (let hand of hands) {
      if (hand.confidence > 0.1) {
        // 建立一個陣列來儲存縮放後的座標，方便繪製線段與圓圈
        let scaledPoints = [];
        for (let i = 0; i < hand.keypoints.length; i++) {
          let keypoint = hand.keypoints[i];
          scaledPoints.push({
            x: displayVideoX + (keypoint.x * (displayVideoWidth / video.width)),
            y: displayVideoY + (keypoint.y * (displayVideoHeight / video.height))
          });
        }

        // 設定線段與圓圈顏色 (根據左右手)
        if (hand.handedness == "Left") {
          fill(255, 0, 255);
          stroke(255, 0, 255);
        } else {
          fill(255, 255, 0);
          stroke(255, 255, 0);
        }

        // 根據指定編號串接線段: 0-4, 5-8, 9-12, 13-16, 17-20
        let segments = [
          [0, 1, 2, 3, 4],    // 大拇指
          [5, 6, 7, 8],       // 食指
          [9, 10, 11, 12],    // 中指
          [13, 14, 15, 16],   // 無名指
          [17, 18, 19, 20],   // 小指
          [0, 1, 5, 9, 13, 17, 0] // 改進的手掌輪廓 (手腕、大拇指根、各指根、連回手腕)
        ];

        strokeWeight(5); // 增加線條粗細，讓連線在背景和影像上更明顯
        for (let seg of segments) {
          for (let i = 0; i < seg.length - 1; i++) {
            let p1 = scaledPoints[seg[i]];
            let p2 = scaledPoints[seg[i + 1]];
            // 確保關鍵點存在後再畫線
            if (p1 && p2) {
              line(p1.x, p1.y, p2.x, p2.y);
            }
          }
        }

        // 廚房場景特有邏輯：偵測 4 與 8 接觸
        if (gameState === "kitchen") {
          let p4 = scaledPoints[4];
          let p8 = scaledPoints[8];
          let d = dist(p4.x, p4.y, p8.x, p8.y);
          if (d < 30) { // 當距離小於 30 像素視為接觸
            // 在兩指中間產生鹽巴
            saltParticles.push(new Salt((p4.x + p8.x) / 2, (p4.y + p8.y) / 2));
          }
        }

        // 在指尖 (4, 8, 12, 16, 20) 產生水泡
        if (gameState === "start") {
          let fingertips = [4, 8, 12, 16, 20];
          for (let idx of fingertips) {
            let pt = scaledPoints[idx];
            bubbles.push(new Bubble(pt.x, pt.y));
          }
        }

        // 繪製關鍵點圓圈
        noStroke();
        for (let pt of scaledPoints) {
          circle(pt.x, pt.y, 12);
        }
      }
    }
  }

  // 更新並顯示水泡 (僅在 start 場景)
  if (gameState === "start") {
    for (let i = bubbles.length - 1; i >= 0; i--) {
      bubbles[i].update();
      bubbles[i].show();
      if (bubbles[i].isDone()) bubbles.splice(i, 1);
    }
  }

  // 更新並顯示鹽巴 (僅在 kitchen 場景)
  if (gameState === "kitchen") {
    for (let i = saltParticles.length - 1; i >= 0; i--) {
      saltParticles[i].update();
      saltParticles[i].show();

      // 偵測鹽巴是否掉入鍋子
      let potTopY = displayVideoY + displayVideoHeight - 50;
      let potLeftX = width / 2 - 100;
      let potRightX = width / 2 + 100;

      if (saltParticles[i].y > potTopY && 
          saltParticles[i].x > potLeftX && 
          saltParticles[i].x < potRightX) {
        // 產生熱氣效果
        for (let j = 0; j < 3; j++) {
          steamParticles.push(new Steam(saltParticles[i].x, potTopY));
        }
        saltParticles.splice(i, 1); // 鹽巴消失
      } else if (saltParticles[i].y > height) {
        saltParticles.splice(i, 1);
      }
    }

    // 更新並顯示熱氣
    for (let i = steamParticles.length - 1; i >= 0; i--) {
      steamParticles[i].update();
      steamParticles[i].show();
      if (steamParticles[i].isDone()) {
        steamParticles.splice(i, 1);
      }
    }
  }

  // 5. 在畫面底部顯示狀態訊息，方便使用者排除問題
  push();
  fill(0); // 黑色文字
  noStroke();
  textSize(16);
  textAlign(CENTER, CENTER);
  text(statusMessage, width / 2, height - 30);
  pop();
}

// 定義水泡類別
class Bubble {
  constructor(x, y) {
    this.x = x + random(-5, 5); // 稍微隨機偏移，看起來更自然
    this.y = y;
    this.r = random(5, 15);     // 隨機大小
    this.speed = random(1, 4);  // 上升速度
    this.life = 255;            // 透明度，用來模擬生命週期
  }

  update() {
    this.y -= this.speed;       // 往上移動
    this.life -= 4;             // 逐漸變透明
  }

  show() {
    stroke(255, this.life);     // 白色外框隨生命值變淡
    strokeWeight(1);
    noFill();
    circle(this.x, this.y, this.r);
  }

  isDone() {
    return this.life <= 0 || this.y < 0;
  }
}

// 定義鹽巴類別
class Salt {
  constructor(x, y) {
    this.x = x + random(-3, 3);
    this.y = y;
    this.speedY = random(3, 7); // 向下掉落的速度
  }

  update() {
    this.y += this.speedY;
  }

  show() {
    fill(255); // 白色鹽巴
    noStroke();
    circle(this.x, this.y, 3);
  }
}

// 定義熱氣/蒸氣類別
class Steam {
  constructor(x, y) {
    this.x = x + random(-10, 10);
    this.y = y;
    this.vx = random(-0.5, 0.5); // 隨機左右飄散
    this.vy = random(-1, -3);    // 向上升
    this.alpha = 150;            // 初始透明度
    this.size = random(5, 15);   // 蒸氣大小
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= 3; // 逐漸消失
  }

  show() {
    noStroke();
    fill(255, this.alpha);
    ellipse(this.x, this.y, this.size, this.size * 1.5); // 橢圓形狀更像蒸氣
  }

  isDone() {
    return this.alpha <= 0;
  }
}
