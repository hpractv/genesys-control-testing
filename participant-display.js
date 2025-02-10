'use strict';
var pd = {};

pd.init = async (gct, broadcaster) => {
  await gct.init(
    gct.DATALOAD.POPULATION,
    broadcaster,
    pd.receiveBroadcastMessage,
  );

  pd.idx = lunr(function () {
    this.ref('ID');
    this.field('ID');
    this.field('HeadOfHousehold');
    Array.prototype.forEach.call(gct.population, person => {
      this.add(person);
    });
  });
};

pd.receiveBroadcastMessage = (sender, message) => {
  if (
    sender === gct.BROADCAST_SENDER.SIDEBAR ||
    sender === gct.BROADCAST_SENDER.AGENT_SCRIPT
  ) {
    document.getElementById('setFrom').innerText =
      sender === gct.BROADCAST_SENDER.SIDEBAR ? 'Sidebar' : 'Agent Script';
    if (message.action == gct.MESSAGE_ACTIONS.SELECT_PARTICIPANT) {
      pd.setParticipant(message.id);
    }
  }
};

const nameDisplay = (first, middle, last) => {
  var middleDisplay = ' ';
  if (middle !== null) {
    middleDisplay = ` ${middle} `;
  }
  return `${first}${middleDisplay}${last}`;
};

pd.setParticipant = id => {
  var participant = gct.population.filter(p => p.ID === id)[0];
  var household = gct.population.filter(
    p => p.HeadOfHousehold === participant.HeadOfHousehold,
  );
  var isHead = participant.ID === participant.HeadOfHousehold;

  document.getElementById('name').innerText =
    nameDisplay(
      participant.FirstName,
      participant.MiddleName,
      participant.LastName,
    ) + (isHead ? ' (Head)' : '');

  ['household', 'interactions'].forEach(id => {
    document.getElementById(id).style.visibility = 'visible';
  });
  document.getElementById('age').innerText = participant.Age;
  document.getElementById('headOfHousehold').style.visibility = isHead
    ? 'hidden'
    : 'visible';
  document.getElementById('dependants').style.visibility = isHead
    ? 'visible'
    : 'hidden';

  //only display full household if head of household
  if (!isHead) {
    var head = household.filter(p => p.ID === p.HeadOfHousehold)[0];
    document.getElementById('headName').innerText = nameDisplay(
      head.FirstName,
      head.MiddleName,
      head.LastName,
    );
  } else {
    var dependants = household.filter(p => p.ID !== p.HeadOfHousehold);
    var dependantsList = document.getElementById('dependantsList');
    dependantsList.replaceChildren([]);
    var lis = dependants.map(d => {
      var li = document.createElement('li');
      li.innerText =
        nameDisplay(d.FirstName, d.MiddleName, d.LastName) + ` (${d.Age})`;
      return li;
    });
    lis.forEach(li => {
      dependantsList.appendChild(li);
    });
  }

  document.getElementById('interactions').style.visibility = 'visible';
};
