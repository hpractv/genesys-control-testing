'use strict';
const ps = {};

ps.init = async (gct, broadcaster) => {
  await gct.init(
    gct.DATALOAD.POPULATION,
    broadcaster,
    ps.receiveBroadcastMessage,
  );

  ps.idx = lunr(function () {
    this.ref('ID');
    this.field('FirstName');
    this.field('LastName');
    Array.prototype.forEach.call(gct.population, person => {
      this.add(person);
    });
  });
};

ps.receiveBroadcastMessage = (sender, message) => {
  console.log(`Received message from ${sender}: ${message}`);
};

ps.sendToStandAlone = id => {
  gct.sendBroadcast({
    action: gct.MESSAGE_ACTIONS.SELECT_PARTICIPANT,
    id: id,
  });
};

let selectedRow;

ps.search = () => {
  const text = document.getElementById('search').value;
  const searchResults = document.getElementById('searchResults');
  searchResults.replaceChildren([]);

  const search = ps.idx.search(`${text}*`);
  if (search.length > 0) {
    Array.prototype.forEach.call(search, r => {
      const person = gct.population.find(p => p.ID === Number(r.ref));
      if (person) {
        var isHead = person.ID === person.HeadOfHousehold;
        var resultRow = document.createElement('tr');
        resultRow.classList.add('selectable');
        resultRow.onclick = () => {
          if (selectedRow) {
            selectedRow.classList.remove('selected');
          }
          resultRow.classList.add('selected');
          ps.sendToStandAlone(person.ID);
          selectedRow = resultRow;
        };
        var buildColumn = value => {
          var column = document.createElement('td');
          column.innerText = value;
          resultRow.appendChild(column);
        };
        buildColumn(r.ref + (isHead ? '*' : ''));
        buildColumn(person.FirstName);
        buildColumn(person.LastName);
        buildColumn(person.BirthDate);
        buildColumn(person.Age);
        searchResults.appendChild(resultRow);
      }
    });
  }
};

ps.searchKeyDown = e => {
  if (e.key === 'Enter') {
    ps.search();
  }
};
