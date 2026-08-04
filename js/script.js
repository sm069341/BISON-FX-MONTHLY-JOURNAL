let trades = JSON.parse(localStorage.getItem('bison_fx_trades')) || [];

const tradeForm = document.getElementById('trade-form');
const noTradeCheck = document.getElementById('no-trade-check');
const tradeRows = document.getElementById('trade-rows');

// Format Pair Names cleanly with a slash (e.g., USDCHF -> USD/CHF)
function formatPair(rawPair) {
  if (!rawPair || rawPair === '--') return '--';
  let cleaned = rawPair.replace(/[^a-zA-Z]/g, '').toUpperCase();
  if (cleaned.length === 6 && !rawPair.includes('/')) {
    return `${cleaned.slice(0, 3)}/${cleaned.slice(3)}`;
  }
  return rawPair.toUpperCase();
}

// Toggle Form Inputs for No-Trade Days
noTradeCheck.addEventListener('change', (e) => {
  const isNoTrade = e.target.checked;
  const inputs = ['pair', 'session', 'timeframe', 'strategy', 'target', 'stoploss', 'riskfree', 'rr', 'result'];
  
  inputs.forEach(id => {
    const el = document.getElementById(id);
    el.disabled = isNoTrade;
    el.style.opacity = isNoTrade ? '0.3' : '1';
  });
});

tradeForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const isNoTrade = noTradeCheck.checked;
  const dateStr = document.getElementById('date').value;
  const rawPair = document.getElementById('pair').value;
  const rawRR = document.getElementById('rr').value.trim();

  let formattedRR = '--';
  if (!isNoTrade && rawRR !== '' && rawRR !== '0' && rawRR !== '0:0' && rawRR !== '1:0') {
    formattedRR = rawRR;
  }

  const newTrade = {
    id: Date.now(),
    rawDate: dateStr,
    date: formatDate(dateStr),
    isNoTrade: isNoTrade,
    pair: isNoTrade ? '--' : formatPair(rawPair),
    session: isNoTrade ? '--' : document.getElementById('session').value,
    timeframe: isNoTrade ? '--' : document.getElementById('timeframe').value.toUpperCase(),
    strategy: isNoTrade ? '--' : document.getElementById('strategy').value.toUpperCase(),
    tp: isNoTrade ? 0 : parseFloat(document.getElementById('target').value || 0),
    sl: isNoTrade ? 0 : parseFloat(document.getElementById('stoploss').value || 0),
    riskfree: isNoTrade ? '--' : document.getElementById('riskfree').value,
    rr: formattedRR,
    result: isNoTrade ? '--' : document.getElementById('result').value
  };

  trades.push(newTrade);
  saveAndRender();
  tradeForm.reset();
  noTradeCheck.checked = false;
  noTradeCheck.dispatchEvent(new Event('change'));
});

function deleteEntry(id) {
  trades = trades.filter(t => t.id !== id);
  saveAndRender();
}

function formatDate(dateStr) {
  if (!dateStr) return '--';
  const [year, month, day] = dateStr.split('-');
  return `${day}-${month}-${year}`;
}

// Calculate Date Range (e.g., "20 July - 24 July")
function updateWeekRange() {
  const weekRangeEl = document.getElementById('week-range');
  if (!weekRangeEl) return;

  const validDates = trades
    .map(t => t.rawDate)
    .filter(d => d)
    .sort();

  if (validDates.length === 0) {
    weekRangeEl.innerText = '';
    return;
  }

  const months = ["July", "July", "Jul", "Apr", "May", "Jun", "July", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const fullMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const minDate = new Date(validDates[0]);
  const maxDate = new Date(validDates[validDates.length - 1]);

  const minFormatted = `${minDate.getDate()} ${fullMonths[minDate.getMonth()]}`;
  const maxFormatted = `${maxDate.getDate()} ${fullMonths[maxDate.getMonth()]}`;

  if (minFormatted === maxFormatted) {
    weekRangeEl.innerText = `(${minFormatted})`;
  } else {
    weekRangeEl.innerText = `(${minFormatted} - ${maxFormatted})`;
  }
}

function saveAndRender() {
  localStorage.setItem('bison_fx_trades', JSON.stringify(trades));
  renderTable();
  updateTelegramCard();
  updateWeekRange();
}

function renderTable() {
  tradeRows.innerHTML = '';
  let totalTpPips = 0;
  let totalSlPips = 0;

  trades.forEach(trade => {
    if (!trade.isNoTrade) {
      totalTpPips += trade.tp;
      totalSlPips += trade.sl;
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${trade.date}</td>
      <td><strong>${trade.pair}</strong></td>
      <td>${trade.session !== '--' ? `<span class="badge session">${trade.session}</span>` : '--'}</td>
      <td>${trade.timeframe}</td>
      <td>${trade.strategy}</td>
      <td class="${trade.tp > 0 ? 'text-green' : ''}">${trade.tp > 0 ? trade.tp + ' pips' : '--'}</td>
      <td class="${trade.sl > 0 ? 'text-red' : ''}">${trade.sl > 0 ? trade.sl + ' pips' : '--'}</td>
      <td>${trade.riskfree !== '--' ? `<span class="badge risk-free-${trade.riskfree.toLowerCase()}">${trade.riskfree}</span>` : '--'}</td>
      <td class="text-gold">${trade.rr}</td>
      <td>${trade.result !== '--' ? `<span class="badge ${trade.result.toLowerCase()}">${trade.result}</span>` : '--'}</td>
      <td class="action-cell"><button class="delete-btn" onclick="deleteEntry(${trade.id})">✕</button></td>
    `;
    tradeRows.appendChild(tr);
  });

  document.getElementById('total-tp').innerText = `${totalTpPips} pips`;
  document.getElementById('total-sl').innerText = `${totalSlPips} pips`;
}

function updateTelegramCard() {
  const activeTrades = trades.filter(t => !t.isNoTrade);
  const totalTrades = activeTrades.length;

  let wins = 0, losses = 0, be = 0, totalTp = 0, totalSl = 0;

  activeTrades.forEach(t => {
    totalTp += t.tp;
    totalSl += t.sl;
    if (t.result === 'WIN') wins++;
    if (t.result === 'LOSS') losses++;
    if (t.result === 'BE') be++;
  });

  // COUNTING BE TRADES AS WINS (Non-Losing Trades / Win & Preservation Rate)
  const totalWinningTrades = wins + be;
  const winRate = totalTrades > 0 ? ((totalWinningTrades / totalTrades) * 100).toFixed(1) : 0;

  document.getElementById('tg-net-pips').innerText = `${netPips >= 0 ? '+' : ''}${netPips} pips`;
  document.getElementById('tg-win-rate').innerText = `${winRate}%`;
  document.getElementById('tg-total-trades').innerText = totalTrades;
  document.getElementById('tg-wins').innerText = wins;
  document.getElementById('tg-losses').innerText = losses;
  document.getElementById('tg-be').innerText = be;
}

// Clear All Trades (With Confirmation)
document.getElementById('clear-btn').addEventListener('click', () => {
  if (trades.length === 0) {
    alert("Your journal is already empty!");
    return;
  }

  const confirmClear = confirm(
    "⚠️ Are you sure you want to clear all logged trades for this month?\n\nMake sure you have exported your report image before clearing!"
  );

  if (confirmClear) {
    trades = [];
    localStorage.removeItem('bison_fx_trades');
    saveAndRender();
    alert("Monthly journal has been reset successfully!");
  }
});

// Export Image
document.getElementById('download-btn').addEventListener('click', () => {
  const wrapper = document.getElementById('export-wrapper');

  if (typeof html2canvas === 'undefined') {
    alert("html2canvas library is not loaded. Check your internet connection.");
    return;
  }

  wrapper.classList.add('exporting');

  html2canvas(wrapper, { 
    backgroundColor: '#080A0F', 
    scale: 2,
    useCORS: true,
    allowTaint: true
  }).then(canvas => {
    const link = document.createElement('a');
    link.download = 'Bison_FX_Monthly_Report.png';
    link.href = canvas.toDataURL('image/png');
    link.click();

    wrapper.classList.remove('exporting');
  }).catch(err => {
    console.error("Export Error:", err);
    alert("Export failed: " + err.message);
    wrapper.classList.remove('exporting');
  });
});

// Initial Render
saveAndRender();
