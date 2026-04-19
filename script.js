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

function parseLocalizedNumber(value) {
  return Number(String(value).replace(',', '.'));
}

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

function calculateResults(players, tariffInCents, passedGames, passedGameAmountInEuro) {
  const tariffInEuro = tariffInCents / 100;
  const passedGamesPenalty = passedGames * passedGameAmountInEuro;

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
      payout: differenceSum * tariffInEuro - passedGamesPenalty,
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

function renderResults(results, tariffInCents, passedGames, passedGameAmountInEuro) {
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

  const passedGamesInfo = passedGames > 0
    ? ` Gepasste Spiele: ${passedGames} x ${euroFormatter.format(passedGameAmountInEuro)} Abzug pro Spieler.`
    : '';

  summaryText.textContent = `Tarif: ${tariffInCents.toLocaleString('de-DE')} ct pro Punktedifferenz.${passedGamesInfo} Gesamtsumme: ${euroFormatter.format(
    results.reduce((sum, entry) => sum + entry.payout, 0),
  )}.`;
}

function handleSubmit(event) {
  event.preventDefault();

  const tariffInput = document.querySelector('#tariff');
  const passedGamesInput = document.querySelector('#passed-games');
  const passedGameAmountInput = document.querySelector('#passed-game-amount');
  const tariffInCents = parseLocalizedNumber(tariffInput.value);
  const passedGames = Number(passedGamesInput.value);
  const passedGameAmountInEuro = parseLocalizedNumber(passedGameAmountInput.value);

  if (!Number.isFinite(tariffInCents) || tariffInCents < 0) {
    tariffInput.focus();
    summaryText.textContent = 'Bitte einen gueltigen Tarif in Cent eingeben.';
    return;
  }

  if (!Number.isInteger(passedGames) || passedGames < 0) {
    passedGamesInput.focus();
    summaryText.textContent = 'Bitte eine gueltige Anzahl gepasster Spiele eingeben.';
    return;
  }

  if (!Number.isFinite(passedGameAmountInEuro) || passedGameAmountInEuro < 0) {
    passedGameAmountInput.focus();
    summaryText.textContent = 'Bitte einen gueltigen Tarif fuer gepasste Spiele in Euro eingeben.';
    return;
  }

  const players = readPlayers();
  const results = calculateResults(players, tariffInCents, passedGames, passedGameAmountInEuro);
  renderResults(results, tariffInCents, passedGames, passedGameAmountInEuro);
}

form.addEventListener('submit', handleSubmit);
form.addEventListener('focusin', clearInitialFieldValue);

const initialTariffInCents = parseLocalizedNumber(document.querySelector('#tariff').value);
const initialPassedGames = Number(document.querySelector('#passed-games').value);
const initialPassedGameAmountInEuro = parseLocalizedNumber(document.querySelector('#passed-game-amount').value);

renderResults(
  calculateResults(readPlayers(), initialTariffInCents, initialPassedGames, initialPassedGameAmountInEuro),
  initialTariffInCents,
  initialPassedGames,
  initialPassedGameAmountInEuro,
);
