'use strict';
const ps = {
  selectedParticipantId: null,
  interactionParticipants: [],
};

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

  ps.setDocumentLinks();

  // Get a random partipant caller
  ps.selectedParticipantId = ps.getRandomParticipant();
  ps.secureTheCall();
};

ps.receiveBroadcastMessage = (sender, message) => {
  if (sender === gct.BROADCAST_SENDER.INTERACTION) {
    switch (message.action) {
      case gct.MESSAGE_ACTIONS.ENABLE_CALL_DISPOSITION:
        ps.displayDisposition();
        break;
    }
  }
};

ps.setDocumentLinks = () => {
  var links = [
    'Call Procedures',
    'Funding Guide',
    'Client Guide',
    'Carrier Guide',
    'KB Articles',
  ];
  var documentsList = document.getElementById('documents');
  documentsList.replaceChildren([]);
  links
    .map(l => {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#';
      a.onclick = () => gct.openKB(l);
      a.innerText = l;
      li.appendChild(a);
      return li;
    })
    .forEach(li => documentsList.appendChild(li));
};

ps.getRandomParticipant = () =>
  gct.population[Math.floor(Math.random() * gct.population.length)].ID;

ps.secureTheCall = () => {
  var secureParticipants = document.getElementById('secureTheCallParticipants');
  secureParticipants.replaceChildren([]);

  var participantItems = getHouseholdListControls(
    ps.selectedParticipantId,
    'secure',
    (item, include, participant) => {
      include.onchange = () => {
        if (include.checked) {
          item.classList.add('checked');
        } else {
          item.classList.remove('checked');
        }
        ps.setSecureSubmit();
      };
      var info = document.createElement('ul');

      var addToInfo = (label, value) => {
        var add = document.createElement('span');
        add.innerText = `${label}: ${value}`;
        info.appendChild(add);
        info.appendChild(document.createElement('br'));
      };

      addToInfo(
        'Relationship to Primary',
        participant.Spouse == participant.HeadOfHousehold
          ? 'Spouse'
          : participant.ID == participant.HeadOfHousehold
          ? 'Head of Household'
          : 'Dependant',
      );
      addToInfo('Phone', participant.PhoneNumber);

      addToInfo('Zip Code', participant.ZipCode);
      addToInfo('Birth Date', `${participant.BirthDate} (${participant.Age})`);

      item.appendChild(info);
    },
  );

  participantItems.forEach(pi => {
    secureParticipants.appendChild(pi);
  });
};

ps.setSecureSubmit = () => {
  var includes = document.getElementsByName('secure[]');
  var submit = document.getElementById('secureTheCallButton');
  var disabled = true;
  for (var i = 0; i < includes.length; i++) {
    if (includes[i].checked) {
      disabled = false;
      break;
    }
  }
  submit.disabled = disabled;
};

ps.secureTheCallConfirmation = async () => {
  ps.interactionParticipants = [];

  document.getElementsByName('secure[]').forEach(s => {
    if (s.checked) {
      ps.interactionParticipants.push(Number(s.value));
    }
  });
  document.getElementById('secureCall').style.visibility = 'hidden';
  document.getElementById('secureTheCallButton').disabled = true;
  document.getElementById('reasonForCall').style.visibility = 'visible';
  await gct.sendBroadcast({
    action: gct.MESSAGE_ACTIONS.SET_PARTICIPANTS_INFO,
    ids: ps.interactionParticipants,
  });
};

ps.setReason = async () => {
  var reason = document.querySelector('#reasonForCall select').value;
  await gct.sendBroadcast({
    action: gct.MESSAGE_ACTIONS.SET_REASON_FOR_CALL,
    reason: reason,
  });
  await gct.sendBroadcast({
    action: gct.MESSAGE_ACTIONS.ENABLE_PARTICIPANT_INTERACTIONS,
    message: null,
  });
  document.getElementById('reasonForCall').style.visibility = 'hidden';

  document.getElementById('kb').style.visibility = 'visible';
};

ps.displayDisposition = async () => {
  document.getElementById('kb').style.visibility = 'hidden';
  document.getElementById('callDisposition').style.visibility = 'visible';

  var dispositionParticipants = document.getElementById(
    'dispositionParticipants',
  );
  dispositionParticipants.replaceChildren([]);

  var dispositionControls = getHouseholdListControls(
    ps.selectedParticipantId,
    'disposition',
    (item, include, participant) => {
      var disposition = ps.createDispositionsControl();

      include.onchange = () => {
        if (include.checked) {
          item.classList.add('checked');
          disposition.style.visibility = 'visible';
        } else {
          item.classList.remove('checked');
          disposition.style.visibility = 'hidden';
        }
        ps.setDispositionSubmit();
      };

      item.appendChild(disposition);
    },
  );
  dispositionControls.forEach(dc => {
    dispositionParticipants.appendChild(dc);
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
          ps.sendToInteraction(person.ID);
          selectedRow = resultRow;
          document.getElementById('secureCallButton').disabled = false;
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

const getHouseholdListControls = (
  particpantId,
  controlName,
  addItemControls,
) => {
  var householdControls = [];
  var participantHousehold = gct.population.filter(
    p => p.ID === particpantId,
  )[0].HeadOfHousehold;

  var household = [];
  household.push(gct.population.filter(p => p.ID === participantHousehold)[0]);

  gct.population
    .filter(
      p =>
        p.HeadOfHousehold === participantHousehold &&
        p.ID !== participantHousehold,
    )
    .forEach(p => household.push(p));

  household.forEach(p => {
    var participant = document.createElement('li');
    var include = document.createElement('input');
    include.value = p.ID;
    include.id = `${controlName}-${p.ID}`;
    include.name = `${controlName}[]`;
    include.type = 'checkbox';

    participant.appendChild(include);

    var name = document.createElement('label');
    name.innerText = gct.nameDisplay(p);
    name.setAttribute('for', include.id);

    participant.appendChild(name);
    addItemControls(participant, include, p);

    householdControls.push(participant);
  });
  return householdControls;
};

ps.CALL_DISPOSITIONS = {
  Application: [
    'Application Completed by Agent',
    'Online Application Completed',
    'Canceled Application',
    'Appointment Scheduled',
    'Checking Application Status',
    'Denied Application - Failed UW',
    'Was Not Able to Complete Application - Technical Issues',
  ],
  'Enrollment/Coverage': [
    'Interested and Eligible But Not Yet Ready to Purchase',
    'Medicaid/CHIP Eligible',
    'Participant Did Not Qualify Due To No Election Period',
    'IFP Opted-In to Employer Funding Only, No Enrollment',
    'IFP Funding Election Change Only, No Enrollment',
    'Participant is Waiting for Medicare Part A or B',
    'Opted Into HRA, Enrolled Into Off-Exchange Plan',
    'Opted Into HRA, Enrolled Into Protection Plan',
    'Opted Out of HRA, Not Enrolling with Via Benefits',
  ],
  Telephony: [
    'Left Message',
    'No Answer',
    'Phone Number Busy',
    'Wrong/Bad Phone Number',
    'Call Interrupted - Wait for Customer to Call Back',
    'Wait for Customer to Call Back to Complete Application',
    'No Lines Available',
  ],
  Other: [
    'General Information',
    'Not Buying From Via Benefits',
    'Participant Intends to Contact Client or Take Legal Action',
    'Participant Refuses to Speak to Via Benefits - Immediately Hangs Up',
  ],
};

ps.createDispositionsControl = () => {
  var div = document.createElement('div');
  div.style.visibility = 'hidden';
  var label = document.createElement('span');
  label.innerText = 'Choose a call disposition:';
  div.appendChild(label);

  var select = document.createElement('select');
  Object.keys(ps.CALL_DISPOSITIONS).forEach(og => {
    var optgroup = document.createElement('optgroup');
    optgroup.label = og;
    var options = ps.CALL_DISPOSITIONS[og];
    options.map(o => {
      var option = document.createElement('option');
      option.value = o;
      option.text = o;
      optgroup.appendChild(option);
    });
    select.appendChild(optgroup);
  });
  div.appendChild(select);
  return div;
};

ps.setDispositionSubmit = () => {
  var includes = document.getElementsByName('disposition[]');
  var submit = document.getElementById('submitDispostion');
  var disabled = true;
  for (var i = 0; i < includes.length; i++) {
    if (includes[i].checked) {
      disabled = false;
      break;
    }
  }
  submit.disabled = disabled;
};

ps.kbSearchKeyDown = e => {
  if (e.key === 'Enter') {
    ps.getBaconIpsum();
  }
};

ps.getBaconIpsum = async () => {
  var searchBox = document.getElementById('kbSearch');
  var search = searchBox.value;
  searchBox.value = '';

  var chat = document.getElementById('chat');
  chat.value += `Agent: ${search}\n\n...\n\n`;
  fetch(
    'https://baconipsum.com/api/?type=all-meat&sentences=2&start-with-lorem=1&format=text',
  )
    .then(response => response.text())
    .then(text => {
      chat.value = chat.value.replace('...', `Copilot: ${text}`);
    });
};

ps.resetAgentScript = () => {
  document.getElementById('submitDispostion').disabled = true;
  document.getElementById('dispositionParticipants').replaceChildren([]);
  document.getElementById('callDisposition').style.visibility = 'hidden';
  document.getElementById('reasonForCallSelect').selectedIndex = 0;
  document.getElementById('reasonForCall').style.visibility = 'hidden';
  document.getElementById('secureCall').style.visibility = 'visible';

  document.getElementById('chat').value = '';
  document.getElementById('kbSearch').value = '';
  document.getElementById('kb').style.visibility = 'hidden';

  ps.selectedParticipantId = ps.getRandomParticipant();
  ps.secureTheCall();

  gct.sendBroadcast({
    action: gct.MESSAGE_ACTIONS.RESET_PARTICIPANT_DISPLAY,
  });
};
