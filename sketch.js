// Transition sound
// 转场音效
let meowSound;

// pawInside interaction sounds
// pawInside 互动音效
let pawTouchSounds = [];

// Transition controller
// 转场控制器
let isTransitioning = false;
let nextMood = null;
let moodSwitchedDuringTransition = false;

// transition motion（many circles）
const TRANS_BASE_SIZE = 600;
const TRANS_CIRCLE_OVERLAP = 0.2; //cirlces gap 圆圈重叠度

let transCircles = [];//the amount of the circles 圆圈位置数组（用于转场动画）
let transRotAngles = [];
let transOffsetY = 0;
let transMoveSpeed = 10;
let transPatternHeight = 0;


// Global mood controller
// 全局情绪控制器
let currentMood = "LONELY";//the current mood is lonliness
const MOOD_LIST = ["ANXIOUS", "RESTLESS", "LONELY"];//mood name


// Shared image assets (loaded once)
// 公共图片资源（只加载一次）
let pawInside, pawOutside, circleMain, home;

//preload the image 加载图像
function preload() {
  pawInside = loadImage("pawInside.png");
  pawOutside = loadImage("pawOutside.png");
  circleMain = loadImage("circleMain.png");
  home = loadImage("home.png");
  meowSound = loadSound("meowLoud.mp3");

  // pawInside 互动音（随机）
  pawTouchSounds = [
    loadSound("gulugulu1.mp3"),
    loadSound("gulugulu2.mp3"),
  ];
}


//set up 
function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES);

  //mood set up
  ANX_setup();
  RES_setup();
  LON_setup();
}


// Main draw dispatcher
// 主绘制调度器
function draw() {
  if (currentMood === "ANXIOUS") ANX_draw();
  else if (currentMood === "RESTLESS") RES_draw();
  else if (currentMood === "LONELY") LON_draw();
  
  //if transitioning ,draw tran
  if (isTransitioning) {
    TRANS_draw();
  }
}


// Mouse click -> random mood
// 鼠标点击随机切换情绪
function mousePressed() {
  if (isTransitioning) return;

  do {
    nextMood = random(MOOD_LIST);
  } while (nextMood === currentMood);

  //start the tran 启动转场动画
  isTransitioning = true;
  moodSwitchedDuringTransition = false;
  
  //play meow sound
  if (meowSound && !meowSound.isPlaying()) {
     meowSound.setVolume(0.2); 
    meowSound.loop();
  }
  TRANS_setup();
}



// Window resize dispatcher
// 窗口尺寸变化调度
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (currentMood === "ANXIOUS") ANX_windowResized();
  if (currentMood === "RESTLESS") RES_windowResized();
  if (currentMood === "LONELY") LON_windowResized();
}

/* =====================================================
   ===================== ANXIOUS ========================
   ===================================================== */

let ANX_innerPaws = [],
  ANX_outerPaws = [];
let ANX_lastMin = -1,
  ANX_lastSec = -1,
  ANX_walkStep = 0;
let ANX_mainCirclePos;
let ANX_xPos = 0,
  ANX_direction = 1,
  ANX_speed = 2,
  ANX_wheelRotation = 0;

const ANX_CENTER_EXCLUSION = 0;// useless function中心避让半径（不放 paw）
const PAW_RADIUS_RATIO = 0.28; // pawInside 占 circleMain 半径的比例
const ANX_BASE_SIZE = 600;
const ANX_fadeStep = 0.02;
//paws data
const ANX_fadeLow = 50;
const ANX_fadeHigh = 200;
const ANX_minGap = 20;

//pawInside gap 四条“腿”的偏移量（paw 轨迹角度）
const ANX_legOffset = [
  { x: -15, y: -15 },
  { x: 15, y: 15 },
  { x: 15, y: -15 },
  { x: -15, y: 15 },
];

// mood anxious set up  ANXIOUS 情绪的参数设定
const ANXIOUS = {
  alpha: 120,
  color: [150, 160, 200],
  pawCount: 45,
  pawGap: 130,
  scaleRange: [3, 5],
};

// ANX_setup()
// 初始化 ANXIOUS 情绪的状态与元素
function ANX_setup() {
  ANX_mainCirclePos = createVector(width / 2, height / 2);
  ANX_makeOuterDots();
  ANX_fillHistoryPaws();
}

// ANX_draw()
// ANXIOUS 情绪下的主绘制逻辑
function ANX_draw() {
  background(ANXIOUS.color[0] - 50, ANXIOUS.color[1] - 30, ANXIOUS.color[2]);

  let m = minute();
  let s = second();
  let scaleNum = min(width, height) / ANX_BASE_SIZE;

  let circleW = 520;
  let margin = 20;
  let halfImg = circleW / 2;
  let xBound = width / 2 - halfImg - margin;

  //circle go left and right and loop 主圆左右往返运动
  ANX_xPos += ANX_speed * ANX_direction;
  if (ANX_xPos > xBound || ANX_xPos < -xBound) ANX_direction *= -1;
  ANX_wheelRotation += ANX_speed * ANX_direction;

  ANX_drawOuterDots();//draw pawOutside

  push();
  translate(ANX_mainCirclePos.x + ANX_xPos, ANX_mainCirclePos.y);
  scale(scaleNum);

  //clean pawInside each minute 每分钟清空 pawInner
  if (m !== ANX_lastMin) {
    ANX_innerPaws = [];
    ANX_lastMin = m;
    ANX_lastSec = -1;
    ANX_walkStep = 0;
    ANX_fillHistoryPaws();
  }

  //add pawInside each second 每秒添加一个新的 pawInside
  if (s !== ANX_lastSec) {
    ANX_lastSec = s;
    let leg = ANX_walkStep % 4;
    let p = ANX_makeInnerPaw(leg, s);
    if (p) ANX_innerPaws.push(p);
    ANX_walkStep++;
  }

  //draw main circle (roating) 绘制主圆（带旋转）
  push();
  rotate(ANX_wheelRotation);
  imageMode(CENTER);
  image(
    circleMain,
    0,
    0,
    circleW,
    (circleW * circleMain.height) / circleMain.width
  );
  image(home, 0, 0, 600, (600 * home.height) / home.width);
  pop();

  for (let p of ANX_innerPaws) ANX_updateAndDrawInnerPaw(p, scaleNum);
  pop();
}

// ANX_makeOuterDots()
// 随机生成外围 paw 的位置与参数
function ANX_makeOuterDots() {
  ANX_outerPaws = [];
  let tries = 0;

  while (ANX_outerPaws.length < ANXIOUS.pawCount && tries < 6000) {
    tries++;

    let x = random(-width / 2 - 100, width / 2 + 100);
    let y = random(-height / 2 - 100, height / 2 + 100);

    //useless 中心避让
    if (dist(x, y, 0, 0) < ANX_CENTER_EXCLUSION) continue;

    let newSc = random(...ANXIOUS.scaleRange);
    let ok = true;

    for (let p of ANX_outerPaws) {
      let thisR = (36 * p.sc) / 2;
      let newR = (36 * newSc) / 2;
      let minDist = thisR + newR + 20;

      if (dist(x, y, p.x, p.y) < minDist) {
        ok = false;
        break;
      }
    }

    if (!ok) continue;

    ANX_outerPaws.push({
      x,
      y,
      sc: newSc,
      baseRot: random(360),
      shakePhase: random(TWO_PI),
      rotateAmp: random(6, 12),
      rotateFreq: random(25, 45),
    });
  }
}


// ANX_drawOuterDots()
// 绘制外围 paw 动画（微摆动）
function ANX_drawOuterDots() {
  push();
  translate(width / 2, height / 2);
  for (let p of ANX_outerPaws) {
    push();
    translate(p.x, p.y);
    rotate(
      p.baseRot + sin(frameCount * p.rotateFreq + p.shakePhase) * p.rotateAmp
    );
    scale(p.sc);
    tint(...ANXIOUS.color, ANXIOUS.alpha);
    image(pawOutside, 0, 0, 36, (36 * pawOutside.height) / pawOutside.width);
    pop();
  }
  pop();
}


// ANX_fillHistoryPaws()
// 根据当前时间填入历史秒数 pawInside（用于进度感）
function ANX_fillHistoryPaws() {
  ANX_innerPaws = [];
  let nowSec = second();
  ANX_walkStep = 0;
  for (let i = 0; i <= nowSec; i++) {
    let p = ANX_makeInnerPaw(ANX_walkStep % 4, i);
    if (p) ANX_innerPaws.push(p);
    ANX_walkStep++;
  }
}


// ANX_makeInnerPaw()
// 创建一个 pawInside 位置与初始状态
function ANX_makeInnerPaw(leg, sec) {
  let ang = map(sec, 0, 60, 0, 360);
  let r = 150;
  let x = cos(ang) * r + ANX_legOffset[leg].x;
  let y = sin(ang) * r + ANX_legOffset[leg].y;
  return {
    originX: x,
    originY: y,
    x,
    y,
    alpha: 255,
    target: random(ANX_fadeLow, ANX_fadeHigh),
    scale: 1.3,
    rot: random(360),

    // the sound playing now 当前 paw 正在播放的音频（hover 控制）
    activeSound: null,
  };
}



function ANX_updateAndDrawInnerPaw(p, scaleFactor) {
  let mX = (mouseX - width / 2 - ANX_xPos) / scaleFactor;
  let mY = (mouseY - height / 2) / scaleFactor;
  let d = dist(mX, mY, p.x, p.y);
  if (d < 50) {
    p.x = lerp(p.x, mX, 0.1);
    p.y = lerp(p.y, mY, 0.1);
    p.scale = lerp(p.scale, 1.6, 0.1);

    // ===============================
    //when hover, play gulugulu sound   hover 时播放 gulugulu
    // ===============================
    if (p.activeSound === null) {
      // 只从 gulugulu1 / 2 里选
      let gulugulus = [
        pawTouchSounds[0], // gulugulu1.mp3
        pawTouchSounds[1], // gulugulu2.mp3
      ];

      let s = random(gulugulus);
      if (s && !s.isPlaying()) {
        s.setVolume(0.3);
        s.loop(); // ⭐ 关键：hover 时持续播
      }
      p.activeSound = s;
    }
  } else {
    
    // 离开 pawInside → 停止 gulugulu
   
    if (p.activeSound) {
      p.activeSound.stop();
      p.activeSound = null;
    }

    p.x = lerp(p.x, p.originX, 0.05);
    p.y = lerp(p.y, p.originY, 0.05);
    p.scale = lerp(p.scale, 1.15, 0.05);

    p.alpha = lerp(p.alpha, p.target, 0.05);
    p.alpha = max(p.alpha, 90);
  }

  push();
  translate(p.x, p.y);
  rotate(p.rot);
  scale(p.scale);
  tint(255, p.alpha);
  image(pawInside, 0, 0, 25, (25 * pawInside.height) / pawInside.width);
  pop();
}

function ANX_windowResized() {
  ANX_mainCirclePos = createVector(width / 2, height / 2);
  ANX_makeOuterDots();
  ANX_fillHistoryPaws();
}


  // ===================== RESTLESS =======================
 
// data of paws  paw 记录数组
let RES_innerPaws = [],
  RES_outerPaws = [];
let RES_lastMin = -1,
  RES_lastSec = -1,
  RES_walkStep = 0;
//main circle data
let RES_mainCirclePos;
let RES_smallCircles = [],
  RES_circleData = [];


//normal data set up
const RES_BASE_SIZE = 600;
const RES_fadeStep = 0.02;
const RES_fadeLow = 50;
const RES_fadeHigh = 200;
const RES_minGap = 20;
const RES_MARGIN = 50;

//same as anxious 
const RES_legOffset = ANX_legOffset;

//visual of restlessness  RESTLESS 情绪的视觉设定
const RESTLESS = {
  alpha: 40,
  shake: 7,
  scaleSpeed: 0.5,
  color: [200, 150, 150],
  pawCount: 55,
  pawGap: 95,
  scaleRange: [1.8, 2.8],
};


// RES_setup()
// 初始化 RESTLESS 状态：主圆、paw、角落动画
function RES_setup() {
  RES_setupCircleMovement();
  RES_makeOuterDots();
  RES_fillHistoryPaws();
}


// RES_draw()
// RESTLESS 情绪主绘制逻辑
function RES_draw() {
  background(RESTLESS.color[0] - 50, RESTLESS.color[1] - 30, RESTLESS.color[2]);

  let m = minute(),
    s = second();
  let scaleNum = min(width, height) / RES_BASE_SIZE;

  RES_drawOuterDots();// draw pawOutside 画外圈 paw
  RES_drawMovingCircles(m, scaleNum);

  push();
  translate(RES_mainCirclePos.x, RES_mainCirclePos.y);
  scale(scaleNum);

  if (m !== RES_lastMin) {
    RES_innerPaws = [];
    RES_lastMin = m;
    RES_lastSec = -1;
    RES_walkStep = 0;
    RES_fillHistoryPaws();
  }

  RES_drawMainCircle(m);

  if (s !== RES_lastSec) {
    RES_lastSec = s;
    let p = RES_makeInnerPaw(RES_walkStep % 4, s);
    if (p) RES_innerPaws.push(p);
    RES_walkStep++;
  }

  for (let p of RES_innerPaws) RES_updateAndDrawInnerPaw(p, scaleNum);
  pop();
}


// RES_setupCircleMovement()
// 设定主圆圈位置与角落小圆圈初始点与速度
function RES_setupCircleMovement() {
  RES_mainCirclePos = createVector(width / 2, height / 2);
  let scaleNum = min(width, height) / RES_BASE_SIZE;
  let r = (520 * scaleNum * 0.3) / 2;
  RES_smallCircles = [
    createVector(RES_MARGIN + r, RES_MARGIN + r),
    createVector(width - RES_MARGIN - r, RES_MARGIN + r),
    createVector(RES_MARGIN + r, height - RES_MARGIN - r),
    createVector(width - RES_MARGIN - r, height - RES_MARGIN - r),
  ];
  RES_circleData = [
    { vx: 6, rot: 0 },
    { vx: -6, rot: 0 },
    { vx: 6, rot: 0 },
    { vx: -6, rot: 0 },
  ];
}


// RES_drawMovingCircles()
// 四个角落的圆圈缓慢左右移动 + 旋转动画
function RES_drawMovingCircles(m, scaleNum) {
  let r = (520 * scaleNum * 0.3) / 2;
  for (let i = 0; i < 4; i++) {
    let pos = RES_smallCircles[i],
      d = RES_circleData[i];
    pos.x += d.vx;
    if (pos.x < RES_MARGIN + r || pos.x > width - RES_MARGIN - r) d.vx *= -1;
    d.rot += 2;
    push();
    translate(pos.x, pos.y);
    scale(scaleNum * 0.3);
    rotate(d.rot);
    RES_drawMainCircle(m);
    pop();
  }
}


// RES_drawMainCircle()
// 绘制主圆形图（带旋转）
function RES_drawMainCircle(m) {
  let rot = -map(m + frameCount * 0.05, 0, 60, 0, 360);//run like alive
  push();
  rotate(rot);
  imageMode(CENTER);
  image(circleMain, 0, 0, 520, (520 * circleMain.height) / circleMain.width);
  image(home, 0, 0, 400, (400 * home.height) / home.width);
  pop();
}


// RES_makeOuterDots()
// 随机分布 pawOutside 点位，避免重叠太密
function RES_makeOuterDots() {
  RES_outerPaws = [];
  let tries = 0;
  while (RES_outerPaws.length < RESTLESS.pawCount && tries < 3000) {
    tries++;
    let x = random(-width / 2, width / 2);
    let y = random(-height / 2, height / 2);
    let ok = true;
    //gap between paws 保持一定 paw 之间的间隔
    for (let p of RES_outerPaws)
      if (dist(x, y, p.x, p.y) < RESTLESS.pawGap) ok = false;
    if (!ok) continue;
    RES_outerPaws.push({
      x,
      y,
      rot: random(360),
      sc: random(...RESTLESS.scaleRange),
      seed: random(1000),// use noise to control the scene 用于噪声控制动画
    });
  }
}


// RES_drawOuterDots()
// 绘制所有 pawOutside，加入晃动 & 缩放动画
function RES_drawOuterDots() {
  push();
  translate(width / 2, height / 2);
  for (let p of RES_outerPaws) {
    push();
    let ox = noise(p.seed + frameCount * 0.01) * RESTLESS.shake;
    let oy = noise(p.seed + 100 + frameCount * 0.01) * RESTLESS.shake;
    let sc = p.sc + sin(frameCount * 2 + p.seed) * RESTLESS.scaleSpeed;
    translate(p.x + ox, p.y + oy);
    rotate(p.rot);
    scale(sc);
    tint(...RESTLESS.color, RESTLESS.alpha);
    image(pawOutside, 0, 0, 36, (36 * pawOutside.height) / pawOutside.width);
    pop();
  }
  pop();
}


// RES_fillHistoryPaws()
// 补足当前秒数前的 pawInside（保证刷新也有轨迹）
function RES_fillHistoryPaws() {
  RES_innerPaws = [];
  let nowSec = second();
  RES_walkStep = 0;
  for (let i = 0; i <= nowSec; i++) {
    let p = RES_makeInnerPaw(RES_walkStep % 4, i);
    if (p) RES_innerPaws.push(p);
    RES_walkStep++;
  }
}


// RES_makeInnerPaw()
// 创建一个 pawInside 点对象
//leg->position,sec->angel leg 决定偏移位置，sec 决定角度
function RES_makeInnerPaw(leg, sec) {
  let ang = map(sec, 0, 60, 0, 360);
  let r = 150;
  let x = cos(ang) * r + RES_legOffset[leg].x;
  let y = sin(ang) * r + RES_legOffset[leg].y;
  return {
    originX: x,
    originY: y,
    x,
    y,
    alpha: 255,
    target: random(RES_fadeLow, RES_fadeHigh),
    scale: 1.3,
    rot: random(360),

    // 当前 paw 正在播放的音频（hover 控制）
    activeSound: null,
  };
}


// RES_updateAndDrawInnerPaw()
// 更新 pawInside 状态 & 判断是否播放音效
function RES_updateAndDrawInnerPaw(p, scaleFactor) {
  let mX = (mouseX - width / 2) / scaleFactor;
  let mY = (mouseY - height / 2) / scaleFactor;
  let d = dist(mX, mY, p.x, p.y);
  if (d < 50) {
    p.x = lerp(p.x, mX, 0.1);
    p.y = lerp(p.y, mY, 0.1);
    p.scale = lerp(p.scale, 1.6, 0.1);

    // ===============================
    // hover 时播放 gulugulu
    // ===============================
    if (p.activeSound === null) {
      // 只从 gulugulu1 / 2 里选
      let gulugulus = [
        pawTouchSounds[0], // gulugulu1.mp3
        pawTouchSounds[1], // gulugulu2.mp3
      ];

      let s = random(gulugulus);
      if (s && !s.isPlaying()) {
        s.setVolume(0.3);
        s.loop(); // mouse close play the sound 关键：hover 时持续播
      }
      p.activeSound = s;

    
    }
  } else {
    //same as anxiety's setting
    // 离开 pawInside → 停止 gulugulu
    if (p.activeSound) {
      p.activeSound.stop();
      p.activeSound = null;
    }

    p.x = lerp(p.x, p.originX, 0.05);
    p.y = lerp(p.y, p.originY, 0.05);
    p.scale = lerp(p.scale, 1.15, 0.05);

    p.alpha = lerp(p.alpha, p.target, 0.05);
    p.alpha = max(p.alpha, 90);
  }

  push();
  translate(p.x, p.y);
  rotate(p.rot);
  scale(p.scale);
  tint(255, p.alpha);
  image(pawInside, 0, 0, 25, (25 * pawInside.height) / pawInside.width);
  pop();
}

//RES_windowResized()
function RES_windowResized() {
  RES_setupCircleMovement();
  RES_makeOuterDots();
  RES_fillHistoryPaws();
}


// ====================== LONELY ========================
  
// LONELY 情绪相关变量定义
let LON_innerPaws = [],
  LON_outerPaws = [];
let LON_lastMin = -1,
  LON_lastSec = -1,
  LON_walkStep = 0;

const LON_BASE_SIZE = 600;
const LON_fadeStep = 0.02;
const LON_fadeLow = 50;
const LON_fadeHigh = 200;
const LON_minGap = 20;

//visual data LONELY 视觉参数
const LONELY = {
  alpha: 60,
  shake: 2,
  scaleSpeed: 0.2,
  color: [180, 200, 200],
  pawCount: 35,
  pawGap: 130,
  scaleRange: [1.3, 1.8],
};

//same as anx and res
const LON_legOffset = ANX_legOffset;


// LON_setup()
// 初始化 pawOutside 和 pawInside 的历史轨迹
function LON_setup() {
  LON_makeOuterDots();
  LON_fillHistoryPaws();
}


// LON_draw()
// 主绘制函数：背景 + 外圈 paw + 主圆 + pawInside 动画
function LON_draw() {
  background(LONELY.color[0] - 50, LONELY.color[1] - 30, LONELY.color[2]);

  let m = minute(),
    s = second();
  let scaleNum = min(width, height) / LON_BASE_SIZE;

  LON_drawOuterDots();//pawOutside

  push();
  translate(width / 2, height / 2);
  scale(scaleNum);

  //each min reload pawInside 每分钟刷新 pawInside
  if (m !== LON_lastMin) {
    LON_innerPaws = [];
    LON_lastMin = m;
    LON_lastSec = -1;
    LON_walkStep = 0;
    LON_fillHistoryPaws();
  }

  LON_drawMainCircle(m);
  
  //each sec reload pawInside 每秒刷新 pawInside
  if (s !== LON_lastSec) {
    LON_lastSec = s;
    let p = LON_makeInnerPaw(LON_walkStep % 4, s);
    if (p) LON_innerPaws.push(p);
    LON_walkStep++;
  }

  for (let p of LON_innerPaws) LON_updateAndDrawInnerPaw(p, scaleNum);
  pop();
}


// LON_drawMainCircle()
// 绘制中间大圆 + home 图标，慢慢顺时针旋转
function LON_drawMainCircle(m) {
  let rot = map(m, 0, 60, 0, 360);
  push();
  rotate(rot);
  imageMode(CENTER);
  image(circleMain, 0, 0, 520, (520 * circleMain.height) / circleMain.width);
  image(home, 0, 0, 400, (400 * home.height) / home.width);
  pop();
}


// LON_drawOuterDots()
// 绘制 pawOutside，并加入轻微晃动 + 呼吸动画
function LON_makeOuterDots() {
  LON_outerPaws = [];
  let tries = 0;
  while (LON_outerPaws.length < LONELY.pawCount && tries < 3000) {
    tries++;
    let x = random(-width / 2, width / 2);
    let y = random(-height / 2, height / 2);
    let ok = true;
    for (let p of LON_outerPaws)
      if (dist(x, y, p.x, p.y) < LONELY.pawGap) ok = false;
    if (!ok) continue;
    LON_outerPaws.push({
      x,
      y,
      rot: random(360),
      sc: random(...LONELY.scaleRange),
      seed: random(1000),
    });
  }
}


// LON_fillHistoryPaws()
// 用当前秒数回填 pawInside，补足轨迹
function LON_drawOuterDots() {
  push();
  translate(width / 2, height / 2);
  for (let p of LON_outerPaws) {
    let ox = noise(p.seed + frameCount * 0.01) * LONELY.shake;
    let oy = noise(p.seed + 100 + frameCount * 0.01) * LONELY.shake;
    let sc = p.sc + sin(frameCount * 2 + p.seed) * LONELY.scaleSpeed;
    push();
    translate(p.x + ox, p.y + oy);
    rotate(p.rot);
    scale(sc);
    tint(...LONELY.color, LONELY.alpha);
    image(pawOutside, 0, 0, 36, (36 * pawOutside.height) / pawOutside.width);
    pop();
  }
  pop();
}


// LON_makeInnerPaw()
// 生成一个 pawInside 点对象
function LON_fillHistoryPaws() {
  LON_innerPaws = [];
  let nowSec = second();
  LON_walkStep = 0;
  for (let i = 0; i <= nowSec; i++) {
    let p = LON_makeInnerPaw(LON_walkStep % 4, i);
    if (p) LON_innerPaws.push(p);
    LON_walkStep++;
  }
}


// LON_updateAndDrawInnerPaw()
// 更新 hover 状态 & 播放/停止音效 & 绘制 pawInside
function LON_makeInnerPaw(leg, sec) {
  let ang = map(sec, 0, 60, 0, 360);
  let r = 150;
  let x = cos(ang) * r + LON_legOffset[leg].x;
  let y = sin(ang) * r + LON_legOffset[leg].y;
  return {
    originX: x,
    originY: y,
    x,
    y,
    alpha: 255,
    target: random(LON_fadeLow, LON_fadeHigh),
    scale: 1.3,
    rot: random(360),

    // same as anx and res  当前 paw 正在播放的音频（hover 控制）
    activeSound: null,
  };
}


// LON_windowResized()
// 重新生成 paw 分布，保持适配新窗口
function LON_updateAndDrawInnerPaw(p, scaleFactor) {
  let mX = (mouseX - width / 2) / scaleFactor;
  let mY = (mouseY - height / 2) / scaleFactor;
  let d = dist(mX, mY, p.x, p.y);
  if (d < 50) {
    p.x = lerp(p.x, mX, 0.1);
    p.y = lerp(p.y, mY, 0.1);
    p.scale = lerp(p.scale, 1.6, 0.1);

    
    // hover 时播放 gulugulu
    if (p.activeSound === null) {
      // 只从 gulugulu1 / 2 里选
      let gulugulus = [
        pawTouchSounds[0], // gulugulu1.mp3
        pawTouchSounds[1], // gulugulu2.mp3
      ];

      let s = random(gulugulus);
      if (s && !s.isPlaying()) {
        s.setVolume(0.3);
        s.loop(); // loop when mouse touch paw or far from paws 关键：hover 时持续播
      }
      p.activeSound = s;

      
    }
  } else {
    // stop when mouse touch paw or far from paws
    // 离开 pawInside → 停止 gulugulu
    
    if (p.activeSound) {
      p.activeSound.stop();
      p.activeSound = null;
    }

    p.x = lerp(p.x, p.originX, 0.05);
    p.y = lerp(p.y, p.originY, 0.05);
    p.scale = lerp(p.scale, 1.15, 0.05);

    p.alpha = lerp(p.alpha, p.target, 0.05);
    p.alpha = max(p.alpha, 90);
  }

  push();
  translate(p.x, p.y);
  rotate(p.rot);
  scale(p.scale);
  tint(255, p.alpha);
  image(pawInside, 0, 0, 25, (25 * pawInside.height) / pawInside.width);
  pop();
}

function LON_windowResized() {
  LON_makeOuterDots();
  LON_fillHistoryPaws();
  if (isTransitioning) {
    TRANS_setup();
  }
}

//==================== TRANSITION =====================

// TRANS_setup()
// 初始化转场动画：生成铺满画布的小圆阵列
function TRANS_setup() {
  transCircles = [];
  transRotAngles = [];

  let scaleNum = min(width, height) / TRANS_BASE_SIZE;
  let circleW = 520 * scaleNum * 0.3;

  let stepX = circleW * (1 - TRANS_CIRCLE_OVERLAP);//x side circle
  let stepY = circleW / 2;//y side circle

  let countX = ceil(width / stepX) + 2;
  let countY = ceil(height / stepY) + 2;

  let startX = -circleW / 2;
  let startY = circleW / 30;

  for (let j = 0; j < countY; j++) {
    let y = startY + j * stepY;
    for (let i = 0; i < countX; i++) {
      let x = startX + i * stepX;
      transCircles.push(createVector(x, y));//the position of the centre of the circle
      transRotAngles.push(random(360));
    }
  }

  transPatternHeight = countY * stepY;//the height of the scene
  transOffsetY = -transPatternHeight;//move form up to down
}


// TRANS_draw()
// 绘制并推进转场动画效果
function TRANS_draw() {
  let scaleNum = min(width, height) / TRANS_BASE_SIZE;

  for (let i = 0; i < transCircles.length; i++) {
    let pos = transCircles[i];

    push();
    translate(pos.x, pos.y + transOffsetY);//move  加上整体动画偏移
    scale(scaleNum * 0.3);
    rotate(transRotAngles[i]);
    imageMode(CENTER);
    image(circleMain, 0, 0, 520, (520 * circleMain.height) / circleMain.width);
    image(home, 0, 0, 400, (400 * home.height) / home.width);
    pop();

    transRotAngles[i] += 1;//angle changing 
  }

  transOffsetY += transMoveSpeed;

  // change mood when is ocupied by circles 关键：覆盖画布瞬间切 mood
  if (
    !moodSwitchedDuringTransition &&
    transOffsetY + transPatternHeight >= height
  ) {
    currentMood = nextMood;
    moodSwitchedDuringTransition = true;
  }

  // end of tran 转场彻底结束
  if (transOffsetY > height + 100) {
    isTransitioning = false;
    nextMood = null;
    moodSwitchedDuringTransition = false;

    // when the circles end stop the meow 转场结束 → 停止猫叫
    if (meowSound && meowSound.isPlaying()) {
      meowSound.stop();
    }
  }
}
