'use strict';
var pd = {
  dispositionButton: null,
};

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

  pd.dispositionButton = document.getElementById('setDisposition');
};

pd.setParticipantsInfo = ids => {
  var participants = gct.population.filter(p => ids.includes(p.ID));

  var household = [];
  household.push(
    gct.population.filter(p => p.ID === participants[0].HeadOfHousehold)[0],
  );

  gct.population
    .filter(
      p =>
        p.HeadOfHousehold === participants[0].HeadOfHousehold &&
        p.HeadOfHousehold !== p.ID,
    )
    .forEach(p => {
      household.push(p);
    });

  var participantsDisplay = document.getElementById('participants');
  participantsDisplay.style.visibility = 'visible';
  const participantsList = document.getElementById('participantsDetails');

  var participantsDisplay = [];
  participantsDisplay.push(
    ...participants.filter(p => p.ID === p.HeadOfHousehold),
  );
  participantsDisplay.push(
    ...participants
      .filter(p => p.ID !== p.HeadOfHousehold)
      .sort((a, b) => {
        return b.Age - a.Age;
      }),
  );

  participantsDisplay
    .map(p => {
      var detail = document.createElement('details');
      detail.className = 'participant';
      var summary = document.createElement('summary');
      detail.appendChild(summary);

      summary.innerText = `(${p.ID}) ${gct.nameDisplay(p)}${
        p.ID === p.HeadOfHousehold ? ' (Head)' : p.Spouse ? ' (Spouse)' : ''
      }`;

      var info = (key, value) => {
        var display = document.createElement('span');
        display.innerText = `${key}: ${value}`;
        detail.appendChild(display);
        detail.appendChild(document.createElement('br'));
      };

      info('ID', p.ID);
      info('SSN', p.SSN);
      info('Birth Date', `${p.BirthDate} (${p.Age})`);
      info('Gender', p.Gender);
      info('Marital Status', p.Spouse === null ? 'Single' : 'Married');
      info('Phone', p.PhoneNumber);
      info('Zip Code', p.ZipCode);

      detail.ontoggle = e => {
        if (detail.open) {
          document
            .querySelectorAll('details.participant')
            .forEach(otherDetail => {
              if (otherDetail !== detail) {
                otherDetail.removeAttribute('open');
              } else {
                otherDetail.classList.add('expanded');
              }
            });
        } else {
          detail.classList.remove('expanded');
        }
      };

      return detail;
    })
    .forEach(d => {
      participantsList.appendChild(d);
    });

  var firstChild = participantsList.children[0];
  if (firstChild) {
    firstChild.setAttribute('open', true);
  }

  var householdList = document.getElementById('householdMembers');
  householdList.replaceChildren([]);
  household.forEach(h => {
    var li = document.createElement('li');
    li.innerText = gct.nameDisplay(h);
    householdList.appendChild(li);
  });

  document.getElementById('household').style.visibility = 'visible';
};

pd.setCallReason = reason => {
  document.getElementById('callReason').innerText = reason;
  pd.dispositionButton.style.visibility = 'visible';
  pd.dispositionButton.disabled = false;
};

pd.enableParticipantInteractions = () => {
  var participant = document.getElementById('participantsDetails');
  [...participant.children].forEach(d => {
    var participantName = d.children[0].innerText;
    d.appendChild(pd.createInteractionControls(participantName));
  });
};

pd.createInteractionControls = participant => {
  var container = document.createElement('div');
  container.id = 'interactions';

  var title = document.createElement('h3');
  title.className = 'detailsInterations';
  title.innerText = 'Interactions';
  container.appendChild(title);

  var links = document.createElement('ul');
  container.className = 'detailsInteractions';
  container.appendChild(links);

  var addLink = (text, callback) => {
    var li = document.createElement('li');
    var a = document.createElement('a');
    a.href = '#';
    a.innerText = text;
    a.onclick = () => gct.openTool(text, participant);
    li.appendChild(a);
    links.appendChild(li);
  };

  addLink('Shopping');
  addLink('Profile');
  addLink('FIT');
  addLink('Accounts Administration Reimbursement Center');

  return container;
};

pd.enableCallDisposition = () => {
  gct.sendBroadcast({
    action: gct.MESSAGE_ACTIONS.ENABLE_CALL_DISPOSITION,
  });
};

pd.resetParticipantDisplay = () => {
  pd.dispositionButton.style.visibility = 'hidden';
  pd.dispositionButton.disabled = true;
  document.getElementById('callReason').innerText = '';
  document.getElementById('participants').style.visibility = 'hidden';
  document.getElementById('household').style.visibility = 'hidden';
  document.getElementById('participantsDetails').replaceChildren([]);
  gct.closeChildToolWindows();
};
