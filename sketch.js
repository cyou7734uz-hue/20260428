// Hand Pose Detection with ml5.js
// https://thecodingtrain.com/tracks/ml5js-beginners-guide/ml5/hand-pose

let video;
let handPose;
let hands = [];

function preload() {
  // Initialize HandPose model with flipped video input
  handPose = ml5.handPose({ flipped: true });
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
  video = createCapture(VIDEO, { flipped: true });
  video.hide();

  // Start detecting hands
  handPose.detectStart(video, gotHands);
}

// 2. 當視窗大小改變時，重新調整畫布大小以保持全螢幕
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  // 3. 設定畫布的背景顏色為e7c6ff
  background('#e7c6ff');

  // 計算顯示影像的寬高 (畫布的50%)
  let displayVideoWidth = width * 0.5;
  let displayVideoHeight = height * 0.5;

  // 計算影像置中的位置
  let displayVideoX = (width - displayVideoWidth) / 2;
  let displayVideoY = (height - displayVideoHeight) / 2;

  // 4. 顯示攝影機影像在畫布中間，寬高為畫布的50%
  image(video, displayVideoX, displayVideoY, displayVideoWidth, displayVideoHeight);

  // Ensure at least one hand is detected
  if (hands.length > 0) {
    for (let hand of hands) {
      if (hand.confidence > 0.1) {
        // Loop through keypoints and draw circles
        for (let i = 0; i < hand.keypoints.length; i++) {
          let keypoint = hand.keypoints[i];
          
          // 5. 由於影像被縮放和移動，關鍵點的座標也需要相應地調整
          // 原始關鍵點座標是相對於攝影機原始解析度 (例如 640x480)
          // 我們需要將它們縮放到顯示影像的尺寸，並平移到顯示影像的位置
          let scaledX = displayVideoX + (keypoint.x * (displayVideoWidth / video.width));
          let scaledY = displayVideoY + (keypoint.y * (displayVideoHeight / video.height));

          // Color-code based on left or right hand
          if (hand.handedness == "Left") {
            fill(255, 0, 255);
          } else {
            fill(255, 255, 0);
          }

          noStroke();
          circle(scaledX, scaledY, 16); // 使用調整後的座標繪製圓圈
        }
      }
    }
  }
}
