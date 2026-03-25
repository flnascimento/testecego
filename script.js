let TOTAL = 10;
let V1 = ""; // ID do Jogo
let V2 = "Jogador"; // Nome do Jogador
let V3 = ""; // Data
let V4 = ""; // Hora
let V5 = ""; // Nome da Rodada
let V6 = ""; // Acerto da Rodada
let V7 = ""; // Percentagem
let V8 = ""; // Nomes das músicas
let V9 = ""; // Gabarito
let V10 = ""; // Respostas do usuário

let lista = [];
let selecionadas = [];
let index = 0;
let respostas = [];
let rodada = 1;
let historico = [];

const SECRET = "g3p4_ultra_hidden_2026";

const homeDiv = document.getElementById("home");
const gameDiv = document.getElementById("game");
const resultDiv = document.getElementById("result");
const userInfoDisplay = document.getElementById("user-info-display");

const progress = document.getElementById("progress");
const barFill = document.getElementById("bar-fill");
const player = document.getElementById("player");

const btnIA = document.getElementById("btnIA");
const btnREAL = document.getElementById("btnREAL");

init();

async function init() {
  await loadLista();

  const saved = localStorage.getItem("testeIA_ultra");
  if (saved) {
    document.getElementById("btnContinueGame").classList.remove("hidden");
  }

  document.getElementById("playerName").addEventListener("keypress", function(e) {
    if (e.key === "Enter") { e.preventDefault(); startNew(); }
  });

  document.getElementById("numSongs").addEventListener("keypress", function(e) {
    if (e.key === "Enter") { e.preventDefault(); startNew(); }
  });
}

async function loadLista() {
  const res = await fetch("lista.json");
  lista = await res.json();
  
  const label = document.getElementById("labelNumSongs");
  const input = document.getElementById("numSongs");
  if (label) { label.innerText = `Músicas por Rodada (Máx. ${lista.length})`; }
  if (input) { input.max = lista.length; }
}

function updateHeaderInfo() {
  document.getElementById("display-v1").innerText = V1;
  document.getElementById("display-v2").innerText = V2;
  userInfoDisplay.classList.remove("hidden");
}

function startNew() {
  const nomeInput = document.getElementById("playerName").value.trim();
  let qtdInput = parseInt(document.getElementById("numSongs").value);

  if (!nomeInput) { alert("Por favor, digite seu nome para começar!"); return; }

  V2 = nomeInput;
  // Geração do ID único (V1)
  V1 = 'GAME-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  
  TOTAL = Math.min(qtdInput || 10, lista.length);

  homeDiv.classList.add("hidden");
  gameDiv.classList.remove("hidden");
  
  updateHeaderInfo();
  novoJogo();
}

function continueGame() {
  const saved = localStorage.getItem("testeIA_ultra");
  if (saved) {
    const data = JSON.parse(saved);
    V1 = data.V1 || 'GAME-OLD';
    V2 = data.playerName || "Jogador";
    selecionadas = data.selecionadas;
    historico = data.historico || [];
    rodada = data.rodada || 1;
    TOTAL = selecionadas.length;

    homeDiv.classList.add("hidden");
    gameDiv.classList.remove("hidden");
    
    updateHeaderInfo();
    
    respostas = [];
    index = 0;
    render();
  }
}

function novoJogo() {
  // Sorteio acontece apenas no início ou reinício total
  let tempLista = [...lista];
  tempLista.sort(() => Math.random() - 0.5);
  selecionadas = tempLista.slice(0, TOTAL);

  historico = [];
  rodada = 1;
  respostas = [];
  index = 0;

  save();
  render();
}

function save() {
  localStorage.setItem("testeIA_ultra", JSON.stringify({
    V1,
    playerName: V2,
    selecionadas,
    historico,
    rodada
  }));
}

function render() {
  if (index === 0) {
    // Captura V3 e V4 no início de cada rodada
    const agora = new Date();
    V3 = agora.toLocaleDateString('pt-BR');
    V4 = agora.toLocaleTimeString('pt-BR');
  }

  if (index >= TOTAL) {
    finalizarRodada();
    return;
  }

  progress.innerText = `Teste ${index + 1}/${TOTAL}`;
  barFill.style.width = ((index) / TOTAL) * 100 + "%";

  player.src = "music/" + selecionadas[index].file + "?t=" + Date.now();
  player.load();
  player.oncanplay = () => { player.play().catch(() => {}); };
}

function responder(tipo) {
  respostas[index] = tipo;
  index++;
  render();
}

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return h.toString();
}

function descobrirTipo(item) {
  const tentativaA = hash(item.file + SECRET + "A");
  return tentativaA === item.k ? "REAL" : "IA";
}

function finalizarRodada() {
  let acertos = 0;
  respostas.forEach((r, i) => {
    const tentativa = hash(selecionadas[i].file + SECRET + r);
    if (tentativa === selecionadas[i].k) acertos++;
  });

  const perc = Math.round((acertos / TOTAL) * 100);
  
  // Atribuição de variáveis V5 a V10
  V5 = "Rodada " + rodada;
  V6 = acertos + "/" + TOTAL;
  V7 = perc + "%";
  
  // Mapeia os dados e junta tudo com ";"
  V8 = selecionadas.map(item => item.file).join(";");
  V9 = selecionadas.map(item => descobrirTipo(item) === "REAL" ? "R" : "A").join(";");
  V10 = respostas.map(r => r === "A" ? "R" : "A").join(";");

  historico.push({ rodada, acertos, perc });
  save();
  
  enviarDadosPlanilha(); // <-- ENVIO AUTOMÁTICO AQUI
  
  mostrarParcial(acertos, perc);
}

function mostrarParcial(acertos, perc) {
  gameDiv.classList.add("hidden");
  resultDiv.classList.remove("hidden");

  let html = `<div class="score-main">${acertos}/${TOTAL} (${perc}%)</div>`;
  html += `<div class="history-container"><h3>Histórico</h3>`;
  historico.forEach(h => {
    html += `<div class="history-item"><span>Rodada ${h.rodada}</span><span>${h.acertos}/${TOTAL} (${h.perc}%)</span></div>`;
  });
  html += `</div>`;
  if (acertos === TOTAL) {
    html += `
      <div class="result-buttons">
        <button onclick="mostrarFinal()">Ver Respostas</button>
      </div>
    `;
  } else {
    html += `
      <div class="result-buttons">
        <button onclick="continuar()">Tentar Novamente</button>
        <button onclick="mostrarFinal()">Ver Respostas</button>
        <button onclick="novo()">Reiniciar Tudo</button>
      </div>
    `;
  }
  resultDiv.innerHTML = html;
}

function mostrarFinal() {
  gameDiv.classList.add("hidden");
  resultDiv.classList.remove("hidden");

  // Deleta o save imediatamente para impedir que o jogador trapaceie
  localStorage.removeItem("testeIA_ultra");

  let html = `<div class="player-name-result">${V2}, essas são as</div>`;
  html += `<div class="score-main">🎯 Respostas</div>`;

  html += `<div class="history-container">`;
  
  selecionadas.forEach((item, i) => {
    const tipo = descobrirTipo(item);
    const cor = tipo === "REAL" ? "#2ecc71" : "#ff4d4d"; 
    
    html += `<div class="history-item">
               <span class="round">Música ${i + 1}</span>
               <span class="score" style="color: ${cor}">${tipo}</span>
             </div>`;
  });

  html += `</div>`;

  html += `
    <div class="result-buttons">
      <button onclick="novo()">Novo Jogo</button>
    </div>
  `;

  resultDiv.innerHTML = html;
}

function continuar() {
  rodada++;
  respostas = [];
  index = 0;

  gameDiv.classList.remove("hidden");
  resultDiv.classList.add("hidden");
  render();
}

function novo() {
  localStorage.removeItem("testeIA_ultra");
  location.reload();
}

btnIA.onclick = () => responder("B");
btnREAL.onclick = () => responder("A");


function enviarDadosPlanilha() {
  const url = "https://script.google.com/macros/s/AKfycbx4sZ3GtPbrT7WON9l5lxL7k5rnGDpt0YCFrqBheKSuYhOXp15gMErDgIeEeANTPi4o/exec";
  
  fetch(url, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify({ V1, V2, V3, V4, V5, V6, V7, V8, V9, V10 })
  }).catch(err => console.error("Erro ao enviar: ", err));
}