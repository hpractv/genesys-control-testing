'use strict';
var pd = {};

pd.init = async (gct, broadcaster, receiveBroadcastMessage) => {
  await gct.init(gct.DATALOAD.POPULATION, broadcaster, receiveBroadcastMessage);

  pd.idx = lunr(function () {
    this.ref('ID');
    this.field('ID');
    this.field('HeadOfHousehold');
    Array.prototype.forEach.call(gct.population, person => {
      this.add(person);
    });
  });
};

const nameDisplay = (first, middle, last) => {
  var middleDisplay = ' ';
  if (middle !== null) {
    middleDisplay = ` ${middle} `;
  }
  return `${first}${middleDisplay}${last}`;
};

pd.setParticipantInfo = id => {
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

  document.getElementById('household').style.visibility = 'visible';
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
};

pd.setCallReason = reason => {
  document.getElementById('callReason').innerText = reason;
};

pd.enableParticipantInteractions = () => {
  document.getElementById('interactions').style.visibility = 'visible';
};

pd.resetParticipantDisplay = () => {
  document.getElementById('name').innerText = '';
  document.getElementById('age').innerText = '';
  document.getElementById('callReason').innerText = '';
  document.getElementById('household').style.visibility = 'hidden';
  document.getElementById('headOfHousehold').style.visibility = 'hidden';
  document.getElementById('dependants').style.visibility = 'hidden';
  document.getElementById('interactions').style.visibility = 'hidden';
};
