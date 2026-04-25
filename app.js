let round = 1;
let currentScore = 0;
let gameOver = false;
let isAIMode = false;
let nextDiceCount = 1;

let playerWins = 0;
let aiWins = 0;

// 시작
function startGame() {
  reset();
  isAIMode = false;
  showGame();
  prepareDice();
}

function startAIGame() {
  reset();
  isAIMode = true;
  showGame();
  prepareDice();
}

function showGame() {
  document.getElementById("titleScreen").style.display = "none";
  document.getElementById("ruleScreen").style.display = "none";
  document.getElementById("gameScreen").style.display = "block";
}

function goToTitle() {
  document.getElementById("gameScreen").style.display = "none";
  document.getElementById("ruleScreen").style.display = "none";
  document.getElementById("titleScreen").style.display = "block";
}

function showRules() {
  document.getElementById("titleScreen").style.display = "none";
  document.getElementById("ruleScreen").style.display = "block";
}

function backToTitle() {
  document.getElementById("ruleScreen").style.display = "none";
  document.getElementById("titleScreen").style.display = "block";
}

function reset() {
  round = 1;
  currentScore = 0;
  gameOver = false;
  playerWins = 0;
  aiWins = 0;
}

// 🎯 주사위 개수 미리 보여주기
function prepareDice() {
  nextDiceCount = Math.floor(Math.random() * 3) + 1;

  document.getElementById("diceNow").innerText =
    `이번 주사위: 🎲 ${nextDiceCount}개`;
}

// 🎲 애니메이션
function animateDice(callback) {
  let area = document.getElementById("diceArea");
  area.innerHTML = "";

  let spans = [];

  for (let i = 0; i < nextDiceCount; i++) {
    let span = document.createElement("span");
    span.className = "dice";
    span.innerText = "🎲";
    area.appendChild(span);
    spans.push(span);
  }

  let t = 0;
  let anim = setInterval(() => {
    spans.forEach(s => {
      s.innerText = Math.floor(Math.random() * 6) + 1;
    });

    t++;
    if (t > 10) {
      clearInterval(anim);

      let dice = spans.map(s => {
        let v = Math.floor(Math.random() * 6) + 1;
        s.innerText = v;
        return v;
      });

      callback(dice);
    }
  }, 80);
}

// 🤖 AI
function aiTurn() {
  let score = 0;

  while (true) {
    let count = Math.floor(Math.random() * 3) + 1;
    let dice = [];

    for (let i = 0; i < count; i++) {
      dice.push(Math.floor(Math.random() * 6) + 1);
    }

    let sum = dice.reduce((a, b) => a + b, 0);

    let counts = {};
    dice.forEach(d => counts[d] = (counts[d] || 0) + 1);
    let multiplier = Math.max(...Object.values(counts));

    let final = sum * multiplier;

    if (score + final > 31) return 0;

    score += final;

    let threshold = 18 + Math.random() * 8;
    if (score >= threshold) break;
  }

  return score;
}

function hit() {
  if (gameOver) return;

  animateDice((dice) => {
    let sum = dice.reduce((a, b) => a + b, 0);

    let counts = {};
    dice.forEach(d => counts[d] = (counts[d] || 0) + 1);
    let multiplier = Math.max(...Object.values(counts));

    let finalScore = sum * multiplier;
    currentScore += finalScore;

    // ❗ 버스트 처리 수정
    if (currentScore > 31) {

      if (isAIMode) {
        let aiScore = aiTurn();

        aiWins++; // 무조건 패배

        let msg = `🎲 ${dice} → 버스트!\nAI:${aiScore} → 💀 라운드 패배`;

        // 마지막 라운드 체크
        if (round === 3) {
          gameOver = true;

          let final = playerWins > aiWins ? "🏆 승리!" :
                      playerWins < aiWins ? "❌ 패배" : "🤝 무승부";

          updateUI(`${msg} (총 ${playerWins}:${aiWins}) → ${final}`);
          return;
        }

        round++;
        currentScore = 0;
        prepareDice();

        updateUI(`${msg} (현재 ${playerWins}:${aiWins}) → Round ${round}`);
        return;

      } else {
        gameOver = true;
        updateUI(`🎲 ${dice} → 버스트!`);
        return;
      }
    }

    updateUI(`🎲 ${dice} → ${sum}×${multiplier} = ${finalScore}`);

    prepareDice();
  });
}

// Stop
function stop() {
  if (gameOver) return;

  if (isAIMode) {
    let aiScore = aiTurn();

    let roundResult = "";

    if (currentScore > aiScore) {
      playerWins++;
      roundResult = "🔥 라운드 승리!";
    } else if (currentScore < aiScore) {
      aiWins++;
      roundResult = "💀 라운드 패배!";
    } else {
      roundResult = "🤝 무승부";
    }

    if (round === 3) {
      gameOver = true;

      let final = "";
      if (playerWins > aiWins) final = "🏆 최종 승리!";
      else if (playerWins < aiWins) final = "❌ 최종 패배";
      else final = "🤝 최종 무승부";

      updateUI(
        `AI:${aiScore} → ${roundResult} (총 ${playerWins}:${aiWins}) → ${final}`
      );
      return;
    }

    round++;
    currentScore = 0;
    prepareDice();

    updateUI(
      `AI:${aiScore} → ${roundResult} (현재 ${playerWins}:${aiWins}) → Round ${round}`
    );

    return;
  }

  if (round === 3) {
    gameOver = true;
    updateUI(`게임 종료! 점수: ${currentScore}`);
    return;
  }

  round++;
  currentScore = 0;
  prepareDice();
  updateUI(`Round ${round}`);
}

// UI
function updateUI(msg) {
  document.getElementById("round").innerText = round;
  document.getElementById("current").innerText = currentScore;
  document.getElementById("result").innerText = msg;
}