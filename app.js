const board = document.getElementById('board');
const addColumnBtn = document.getElementById('add-column-btn');
const cardModal = document.getElementById('card-modal');
const closeModalBtn = document.getElementById('close-modal');
const cardTitleInput = document.getElementById('card-title');
const cardQueryInput = document.getElementById('card-query');
const saveCardBtn = document.getElementById('save-card-btn');

let columns = JSON.parse(localStorage.getItem('columns')) || [];
let editingCard = null;
let editingColumnId = null;

function saveToStorage() {
  localStorage.setItem('columns', JSON.stringify(columns));
}

function renderBoard() {
  board.innerHTML = '';
  columns.forEach((col, colIdx) => {
    const columnEl = document.createElement('div');
    columnEl.className = 'column';
    columnEl.dataset.colId = col.id;

    const header = document.createElement('div');
    header.className = 'column-header';

    const title = document.createElement('input');
    title.value = col.title;
    title.className = 'column-title';
    title.onchange = (e) => {
      columns[colIdx].title = e.target.value;
      saveToStorage();
    };

    const delColBtn = document.createElement('button');
    delColBtn.textContent = '🗑';
    delColBtn.onclick = () => {
      columns.splice(colIdx, 1);
      saveToStorage();
      renderBoard();
    };

    header.appendChild(title);
    header.appendChild(delColBtn);

    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'cards-container';
    cardsContainer.id = `col-${col.id}`;

    col.cards.forEach((card, cardIdx) => {
      const cardEl = document.createElement('div');
      cardEl.className = 'card';

      const cardTitle = document.createElement('div');
      cardTitle.className = 'card-title';
      cardTitle.textContent = card.title;

      const cardQuery = document.createElement('pre');
      cardQuery.className = 'card-query language-sql';
      cardQuery.innerHTML = `<code class="language-sql">${Prism.highlight(card.query, Prism.languages.sql, 'sql')}</code>`;

      const actions = document.createElement('div');
      actions.className = 'card-actions';

      const editBtn = document.createElement('button');
      editBtn.textContent = '✏️';
      editBtn.onclick = () => openCardModal(col.id, cardIdx);

      const delBtn = document.createElement('button');
      delBtn.textContent = '🗑';
      delBtn.onclick = () => {
        columns[colIdx].cards.splice(cardIdx, 1);
        saveToStorage();
        renderBoard();
      };

      const copyBtn = document.createElement('button');
      copyBtn.textContent = '📋';
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(card.query);
      };

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);
      actions.appendChild(copyBtn);

      cardEl.appendChild(cardTitle);
      cardEl.appendChild(cardQuery);
      cardEl.appendChild(actions);

      cardsContainer.appendChild(cardEl);
    });

    const addCardBtn = document.createElement('button');
    addCardBtn.textContent = '+ Adicionar Query';
    addCardBtn.onclick = () => openCardModal(col.id);

    columnEl.appendChild(header);
    columnEl.appendChild(cardsContainer);
    columnEl.appendChild(addCardBtn);

    board.appendChild(columnEl);

    new Sortable(cardsContainer, {
      group: 'cards',
      animation: 150,
      onEnd: function (evt) {
        const [fromColIdx, toColIdx] = [
          columns.findIndex(c => `col-${c.id}` === evt.from.id),
          columns.findIndex(c => `col-${c.id}` === evt.to.id)
        ];
        const [movedCard] = columns[fromColIdx].cards.splice(evt.oldIndex, 1);
        columns[toColIdx].cards.splice(evt.newIndex, 0, movedCard);
        saveToStorage();
        renderBoard();
      }
    });
  });
}

function openCardModal(colId, cardIdx = null) {
  editingColumnId = colId;
  editingCard = cardIdx;
  if (cardIdx !== null) {
    const card = columns.find(c => c.id === colId).cards[cardIdx];
    cardTitleInput.value = card.title;
    cardQueryInput.value = card.query;
  } else {
    cardTitleInput.value = '';
    cardQueryInput.value = '';
  }
  cardModal.classList.remove('hidden');
}

function closeCardModal() {
  cardModal.classList.add('hidden');
  editingCard = null;
  editingColumnId = null;
}

saveCardBtn.onclick = () => {
  const title = cardTitleInput.value.trim();
  const query = cardQueryInput.value.trim();
  if (!title || !query) return;

  const colIdx = columns.findIndex(c => c.id === editingColumnId);
  if (editingCard !== null) {
    columns[colIdx].cards[editingCard] = { title, query };
  } else {
    columns[colIdx].cards.push({ title, query });
  }
  saveToStorage();
  renderBoard();
  closeCardModal();
};

closeModalBtn.onclick = closeCardModal;
window.onclick = (e) => {
  if (e.target === cardModal) closeCardModal();
};

addColumnBtn.onclick = () => {
  const id = Date.now().toString();
  columns.push({ id, title: '', cards: [] });
  saveToStorage();
  renderBoard();
};

renderBoard();