const form = document.querySelector('#skat-form');
const resultsBody = document.querySelector('#results-table tbody');
const summaryText = document.querySelector('#summary-text');

const euroFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const PLAYER_COUNT = 4;

function clearInitialFieldValue(event) {
  const input = event.target;

  if (!(input instanceof HTMLInputElement) || input.dataset.defaultCleared === 'true') {
    return;
  }

  if (input.defaultValue !== '' && input.value === input.defaultValue) {
    input.value = '';
    input.dataset.defaultCleared = 'true';
  }
}

function isOptionalPlayerEmpty(index, nameValue, pointsValue) {
  return index === PLAYER_COUNT && nameValue.trim() === '' && pointsValue.trim() === '';
}

function normalizeName(value, fallback) {
  const trimmed = value.trim();
  return trimmed || fallback;
}

function readPlayers() {
  return Array.from({ length: PLAYER_COUNT }, (_, position) => position + 1)
    .map((index) => {
      const nameInput = document.querySelector(`#name-${index}`);
      const pointsInput = document.querySelector(`#points-${index}`);
      const nameValue = nameInput.value;
      const pointsValue = pointsInput.value;

      if (isOptionalPlayerEmpty(index, nameValue, pointsValue)) {
        return null;
      }

      const points = Number(pointsValue);

      return {
        name: normalizeName(nameValue, String.fromCharCode(96 + index)),
        points: Number.isFinite(points) ? points : 0,
      };
    })
    .filter(Boolean);
}

function calculateResults(players, tariffInCents) {
  const tariffInEuro = tariffInCents / 100;

  return players.map((player, playerIndex) => {
    const differenceSum = players.reduce((sum, opponent, opponentIndex) => {
      if (playerIndex === opponentIndex) {
        return sum;
      }

      return sum + (player.points - opponent.points);
    }, 0);

    return {
      ...player,
      differenceSum,
      payout: differenceSum * tariffInEuro,
    };
  });
}

function getBadgeClass(value) {
  if (value > 0) {
    return 'win';
  }

  if (value < 0) {
    return 'loss';
  }

  return 'neutral';
}

function renderResults(results, tariffInCents) {
  resultsBody.innerHTML = results
    .map((entry) => {
      const badgeClass = getBadgeClass(entry.payout);

      return `
        <tr>
          <td class="fw-semibold">${entry.name}</td>
          <td class="text-end">${entry.points}</td>
          <td class="text-end">${entry.differenceSum}</td>
          <td class="text-end">
            <span class="result-badge ${badgeClass}">${euroFormatter.format(entry.payout)}</span>
          </td>
        </tr>
      `;
    })
    .join('');

  summaryText.textContent = `Tarif: ${tariffInCents.toLocaleString('de-DE')} ct pro Punktedifferenz. Gesamtsumme: ${euroFormatter.format(
    results.reduce((sum, entry) => sum + entry.payout, 0),
  )}.`;
}

function handleSubmit(event) {
  event.preventDefault();

  const tariffInput = document.querySelector('#tariff');
  const tariffInCents = Number(tariffInput.value.toString().replace(',', '.'));

  if (!Number.isFinite(tariffInCents) || tariffInCents < 0) {
    tariffInput.focus();
    summaryText.textContent = 'Bitte einen gueltigen Tarif in Cent eingeben.';
    return;
  }

  const players = readPlayers();
  const results = calculateResults(players, tariffInCents);
  renderResults(results, tariffInCents);
}

form.addEventListener('submit', handleSubmit);
form.addEventListener('focusin', clearInitialFieldValue);
renderResults(calculateResults(readPlayers(), Number(document.querySelector('#tariff').value)), Number(document.querySelector('#tariff').value));
