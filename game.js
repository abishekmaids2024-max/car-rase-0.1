(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const W = canvas.width, H = canvas.height;

  const laneCount = 3;
  const laneWidth = W / laneCount;
  const roadPadding = 18;

  const keys = { left:false, right:false, pause:false };
  const uiScore = document.getElementById("score");
  const uiCoffee = document.getElementById("coffee");
  const uiLives = document.getElementById("lives");
  const leftBtn = document.getElementById("btn-left");
  const rightBtn = document.getElementById("btn-right");
  const pauseBtn = document.getElementById("btn-pause");

  const imgPlayer = new Image(); imgPlayer.src = "assets/player.png";
  const imgCouch = new Image(); imgCouch.src = "assets/couch.png";
  const imgCoffee = new Image(); imgCoffee.src = "assets/coffee.png";

  let gameState = "menu"; // "menu" | "play" | "over" | "pause"
  let score = 0, coffee = 0, lives = 3;
  let speed = 4;
  let distance = 0;

  const player = {
    lane: 1,
    x: 0,
    y: H - 160,
    w: 60, h: 90
  };

  function laneX(lane) {
    return lane * laneWidth + laneWidth/2;
  }

  function reset() {
    score = 0; coffee = 0; lives = 3; speed = 4; distance = 0;
    obstacles.length = 0;
    collectibles.length = 0;
    player.lane = 1;
    gameState = "play";
  }

  const obstacles = []; // couches
  const collectibles = []; // coffee cups

  function spawn() {
    if (Math.random() < 0.04) {
      const lane = Math.floor(Math.random()*laneCount);
      obstacles.push({ lane, y: -120, w: 68, h: 46, type:"couch" });
    }
    if (Math.random() < 0.03) {
      const lane = Math.floor(Math.random()*laneCount);
      collectibles.push({ lane, y: -80, w: 32, h: 32, type:"coffee" });
    }
  }

  function move() {
    distance += speed;
    obstacles.forEach(o => o.y += speed);
    collectibles.forEach(c => c.y += speed);
    // cleanup
    while (obstacles.length && obstacles[0].y > H+80) obstacles.shift();
    while (collectibles.length && collectibles[0].y > H+80) collectibles.shift();
    // dynamic difficulty
    speed = Math.min(14, 4 + Math.floor(score/300) + Math.floor(distance/2000));
  }

  function overlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return Math.abs(ax - bx) < (aw+bw)/2 && Math.abs(ay - by) < (ah+bh)/2;
  }

  function update() {
    if (gameState !== "play") return;
    spawn();
    move();

    // player x follows lane
    player.x = laneX(player.lane);

    // collisions
    for (let i=obstacles.length-1; i>=0; i--) {
      const o = obstacles[i];
      if (overlap(player.x, player.y, player.w, player.h, laneX(o.lane), o.y, o.w, o.h)) {
        obstacles.splice(i,1);
        lives -= 1;
        if (lives <= 0) gameState = "over";
      }
    }
    for (let i=collectibles.length-1; i>=0; i--) {
      const c = collectibles[i];
      if (overlap(player.x, player.y, player.w, player.h, laneX(c.lane), c.y, c.w, c.h)) {
        collectibles.splice(i,1);
        coffee += 1;
        score += 150;
      }
    }
    // passive score
    score += 1;

    uiScore.textContent = score;
    uiCoffee.textContent = coffee;
    uiLives.textContent = lives;
  }

  function drawRoad() {
    ctx.fillStyle = "#202020";
    ctx.fillRect(roadPadding, 0, W - roadPadding*2, H);
    // lane markers
    ctx.strokeStyle = "#555";
    ctx.lineWidth = 2;
    for (let i=1; i<laneCount; i++) {
      const x = i * laneWidth;
      ctx.setLineDash([16,16]);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  function drawSprites() {
    // draw obstacles
    obstacles.forEach(o => {
      const x = laneX(o.lane);
      ctx.drawImage(imgCouch, x - o.w/2, o.y - o.h/2, o.w, o.h);
    });
    // draw collectibles
    collectibles.forEach(c => {
      const x = laneX(c.lane);
      ctx.drawImage(imgCoffee, x - c.w/2, c.y - c.h/2, c.w, c.h);
    });
    // draw player
    ctx.drawImage(imgPlayer, player.x - player.w/2, player.y - player.h/2, player.w, player.h);
  }

  function drawTextCentered(txt, y, size=28) {
    ctx.fillStyle = "#f5f5f5";
    ctx.font = `700 ${size}px system-ui, -apple-system, Segoe UI, Roboto`;
    const w = ctx.measureText(txt).width;
    ctx.fillText(txt, W/2 - w/2, y);
  }

  function render() {
    ctx.clearRect(0,0,W,H);
    drawRoad();
    drawSprites();

    if (gameState === "menu") {
      ctx.globalAlpha = 0.9;
      drawTextCentered("CENTRAL • PERK • DASH", H*0.38, 26);
      ctx.globalAlpha = 0.75;
      drawTextCentered("Tap to start • ← / → to steer", H*0.47, 18);
      ctx.globalAlpha = 1;
    } else if (gameState === "pause") {
      ctx.globalAlpha = 0.75;
      drawTextCentered("Paused", H*0.45, 26);
      ctx.globalAlpha = 1;
    } else if (gameState === "over") {
      ctx.globalAlpha = 0.9;
      drawTextCentered("Game Over", H*0.40, 28);
      ctx.globalAlpha = 0.75;
      drawTextCentered(`Score ${score} • Coffee ${coffee}`, H*0.50, 20);
      drawTextCentered("Tap / Press Enter to restart", H*0.58, 16);
      ctx.globalAlpha = 1;
    }
    requestAnimationFrame(render);
  }

  // input
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { player.lane = Math.max(0, player.lane-1); }
    if (e.key === "ArrowRight") { player.lane = Math.min(laneCount-1, player.lane+1); }
    if (e.key.toLowerCase() === "p") { gameState = (gameState==="play") ? "pause" : "play"; }
    if (e.key === "Enter" && gameState === "over") reset();
    if (e.key === "Enter" && gameState === "menu") reset();
  });

  canvas.addEventListener("pointerdown", () => {
    if (gameState === "menu") reset();
    else if (gameState === "over") reset();
    else if (gameState === "pause") gameState = "play";
    else { // during play: steer toward tap x
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const lane = Math.floor(x / laneWidth);
      player.lane = Math.max(0, Math.min(laneCount-1, lane));
    }
  });

  leftBtn.addEventListener("click", () => { player.lane = Math.max(0, player.lane-1); });
  rightBtn.addEventListener("click", () => { player.lane = Math.min(laneCount-1, player.lane+1); });
  pauseBtn.addEventListener("click", () => { gameState = (gameState==="play") ? "pause" : "play"; });

  // start
  render();
  gameState = "menu";
})();