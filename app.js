// ─── Google Apps Script 웹앱 URL (배포 후 여기에 붙여넣기) ───
const SHEET_URL = "https://script.google.com/macros/s/AKfycbwCAx7UbN2oRpfKojkP_rFeebZuI2aEK4OH3pW_M3m6-CAbsuO05n5yrNmY0lUBqKRl/exec";

// ─── 게임 상태 ───
let round = 1;
let currentScore = 0;
let totalScore = 0;       // 누적 총점
let gameOver = false;
let isAIMode = false;
let nextDiceCount = 1;
let playerWins = 0;
let aiWins = 0;
let nickname = "";

// ─── 행동 데이터 로그 ───
let actionLog = [];
//--chatgpt에 의한 수정
function logDecision(action) {
  const entry = {
    nickname: nickname,
    mode: isAIMode ? "AI배틀" : "연습",

    // 🔥 핵심 (선택 순간 상태)
    decisionScore: currentScore,
    decisionDiceCount: nextDiceCount,

    action: action,
    round: round,
    totalScore: totalScore,

    timestamp: new Date().toISOString()
  };

  sendToSheet(entry);
}
// ─── 시작 ───
function startGame() {
  const nick = document.getElementById("nicknameInput").value.trim();
  if (!nick) { alert("닉네임을 입력해주세요!"); return; }
  nickname = nick;
  reset();
  isAIMode = false;
  showGame();
  prepareDice();
}

function startAIGame() {
  const nick = document.getElementById("nicknameInput").value.trim();
  if (!nick) { alert("닉네임을 입력해주세요!"); return; }
  nickname = nick;
  reset();
  isAIMode = true;
  showGame();
  prepareDice();
}

function showGame() {
  document.getElementById("titleScreen").style.display = "none";
  document.getElementById("ruleScreen").style.display = "none";
  document.getElementById("rankScreen").style.display = "none";
  document.getElementById("gameScreen").style.display = "block";
}

function goToTitle() {
  document.getElementById("gameScreen").style.display = "none";
  document.getElementById("ruleScreen").style.display = "none";
  document.getElementById("rankScreen").style.display = "none";
  document.getElementById("titleScreen").style.display = "block";
}

function showRules() {
  document.getElementById("titleScreen").style.display = "none";
  document.getElementById("ruleScreen").style.display = "block";
}

function backToTitle() {
  document.getElementById("ruleScreen").style.display = "none";
  document.getElementById("rankScreen").style.display = "none";
  document.getElementById("titleScreen").style.display = "block";
}

function showRanking() {
  document.getElementById("titleScreen").style.display = "none";
  document.getElementById("rankScreen").style.display = "block";
  loadRanking();
}

function reset() {
  round = 1;
  currentScore = 0;
  totalScore = 0;
  gameOver = false;
  playerWins = 0;
  aiWins = 0;
  actionLog = [];
  document.getElementById("total").innerText = 0;
}

// ─── 주사위 개수 준비 ───
function prepareDice() {
  nextDiceCount = Math.floor(Math.random() * 3) + 1;
  document.getElementById("diceNow").innerText = `이번 주사위: 🎲 ${nextDiceCount}개`;
}

// ─── 주사위 애니메이션 ───
function animateDice(callback) {
  let area = document.getElementById("diceArea");
  area.innerHTML = "";
  let spans = [];

  for (let i = 0; i < nextDiceCount; i++) {
    let span = document.createElement("div");
    span.className = "dice-face";
    span.innerText = "?";
    area.appendChild(span);
    spans.push(span);
  }

  let t = 0;
  let anim = setInterval(() => {
    spans.forEach(s => { s.innerText = Math.floor(Math.random() * 6) + 1; });
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

// ─── AI 턴 ───
function aiTurn() {
  let score = 0;
  while (true) {
    let count = Math.floor(Math.random() * 3) + 1;
    let dice = [];
    for (let i = 0; i < count; i++) dice.push(Math.floor(Math.random() * 6) + 1);
    let sum = dice.reduce((a, b) => a + b, 0);
    let counts = {};
    dice.forEach(d => counts[d] = (counts[d] || 0) + 1);
    let multiplier = Math.max(...Object.values(counts));
    let final = sum * multiplier;
    if (score + final > 31) return 0;
    score += final;
    if (score >= 18 + Math.random() * 8) break;
  }
  return score;
}

// ─── 행동 데이터 기록 & 전송 ───
function logAction(action, dice, scoreAtAction) {
  const entry = {
    nickname: nickname,
    mode: isAIMode ? "AI배틀" : "연습",
    totalScore: totalScore,
    round: round,
    action: action,
    scoreAtAction: scoreAtAction,
    diceCount: dice.length,
    diceValues: dice.join(",")
  };
  actionLog.push(entry);
  sendToSheet(entry);
}

function sendToSheet(data) {
  if (!SHEET_URL || SHEET_URL.includes("여기에")) return;
  fetch(SHEET_URL, {
    method: "POST",
    body: JSON.stringify(data)
  }).catch(err => console.log("시트 전송 실패:", err));
}

// ─── HIT ───
function hit() {
  if (gameOver) return;
  // 🔥 이 줄 추가
  logDecision("HIT");
//

  animateDice((dice) => {
    let sum = dice.reduce((a, b) => a + b, 0);
    let counts = {};
    dice.forEach(d => counts[d] = (counts[d] || 0) + 1);
    let multiplier = Math.max(...Object.values(counts));
    let finalScore = sum * multiplier;
    currentScore += finalScore;

    if (currentScore > 31) {
      // 버스트 — 이 라운드 점수는 누적 안 됨
      logAction("HIT(버스트)", dice, currentScore);

      if (isAIMode) {
        let aiScore = aiTurn();
        aiWins++;
        let msg = `🎲 [${dice}] → 버스트!\nAI: ${aiScore} → 💀 라운드 패배`;

        if (round === 3) {
          gameOver = true;
          let final = playerWins > aiWins ? "🏆 최종 승리!" : playerWins < aiWins ? "❌ 최종 패배" : "🤝 무승부";
          updateUI(`${msg}\n총점: ${totalScore} | (${playerWins}:${aiWins}) → ${final}`);
          sendFinalScore();
          return;
        }
        round++; currentScore = 0; prepareDice();
        updateUI(`${msg}\n(현재 ${playerWins}:${aiWins}) → Round ${round} | 총점: ${totalScore}`);
        return;

      } else {
        gameOver = true;
        updateUI(`🎲 [${dice}] → 버스트! 게임 오버\n총점: ${totalScore}`);
        sendFinalScore();
        return;
      }
    }

    logAction("HIT", dice, currentScore);
    updateUI(`🎲 [${dice}] → ${sum} × ${multiplier} = ${finalScore}`);
    prepareDice();
  });
}

// ─── STOP ───
function stop() {
  if (gameOver) return;
  //chat gpt에 의한 수정
  logDecision("STOP");
  //

  // 이 라운드 점수 누적
  totalScore += currentScore;
  document.getElementById("total").innerText = totalScore;

  logAction("STOP", [], currentScore);

  if (isAIMode) {
    let aiScore = aiTurn();
    let roundResult;
    if (currentScore > aiScore) { playerWins++; roundResult = "🔥 라운드 승리!"; }
    else if (currentScore < aiScore) { aiWins++; roundResult = "💀 라운드 패배!"; }
    else { roundResult = "🤝 무승부"; }

    if (round === 3) {
      gameOver = true;
      let final = playerWins > aiWins ? "🏆 최종 승리!" : playerWins < aiWins ? "❌ 최종 패배" : "🤝 최종 무승부";
      updateUI(`AI: ${aiScore} → ${roundResult}\n총점: ${totalScore} | (${playerWins}:${aiWins}) → ${final}`);
      sendFinalScore();
      return;
    }
    round++; currentScore = 0; prepareDice();
    updateUI(`AI: ${aiScore} → ${roundResult}\n(현재 ${playerWins}:${aiWins}) | 총점: ${totalScore} → Round ${round}`);
    return;
  }

  if (round === 3) {
    gameOver = true;
    updateUI(`게임 종료! 최종 총점: ${totalScore}`);
    sendFinalScore();
    return;
  }
  round++; currentScore = 0; prepareDice();
  updateUI(`Round ${round} 시작! | 누적 총점: ${totalScore}`);
}

// ─── 최종 점수 시트 전송 ───
function sendFinalScore() {
  sendToSheet({
    nickname: nickname,
    mode: isAIMode ? "AI배틀" : "연습",
    totalScore: totalScore,
    round: "최종",
    action: "FINAL",
    scoreAtAction: totalScore,
    diceCount: "",
    diceValues: ""
  });
}

// ─── UI 업데이트 ───
function updateUI(msg) {
  document.getElementById("round").innerText = round;
  document.getElementById("current").innerText = currentScore;
  document.getElementById("total").innerText = totalScore;
  document.getElementById("result").innerText = msg;
}

// ─── 랭킹 불러오기 ───
async function loadRanking() {
  const list = document.getElementById("rankList");
  list.innerHTML = "<li style='color:#ffff00;'>불러오는 중...</li>";

  if (!SHEET_URL || SHEET_URL.includes("여기에")) {
    list.innerHTML = "<li style='color:#ff6600;'>⚠ SHEET_URL을 설정해주세요</li>";
    return;
  }

  try {
    const res = await fetch(SHEET_URL);
    const data = await res.json();

    if (!data.length) {
      list.innerHTML = "<li style='color:#999;'>아직 기록이 없습니다</li>";
      return;
    }

    const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
    list.innerHTML = data.map((entry, i) =>
      `<li class="rank-item">
        <span class="rank-medal">${medals[i]}</span>
        <span class="rank-name">${entry[0]}</span>
        <span class="rank-score">${entry[1]}점</span>
      </li>`
    ).join("");
  } catch (e) {
    list.innerHTML = "<li style='color:#ff0000;'>불러오기 실패</li>";
  }
}