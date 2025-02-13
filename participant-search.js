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

let selectedParticipantId;
ps.sendToStandAlone = id => {
  selectedParticipantId = id;
  gct.sendBroadcast({
    action: gct.MESSAGE_ACTIONS.SET_PARTICIPANT_INFO,
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
          document.getElementById(
            'enableParticipantInteractionsButton',
          ).disabled = false;
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

ps.setReason = async () => {
  var reason = document.querySelector('#reasonForCall select').value;
  await ps.setReasonForCall(gct, reason);
  document.getElementById('reasonForCall').style.visibility = 'hidden';
  document.getElementById('participantSearch').style.visibility = 'visible';
};

ps.enableParticipantInteractionsAndDispositionSetup = async () => {
  await gct.sendBroadcast({
    action: gct.MESSAGE_ACTIONS.ENABLE_PARTICIPANT_INTERACTIONS,
    message: null,
  });
  document.getElementById('participantSearch').style.visibility = 'hidden';
  document.getElementById(
    'enableParticipantInteractionsButton',
  ).disabled = true;
  document.getElementById('callDisposition').style.visibility = 'visible';

  const household = gct.population.filter(
    p =>
      p.ID === selectedParticipantId ||
      p.HeadOfHousehold === selectedParticipantId,
  );
  var dispositionParticipants = document.getElementById(
    'dispositionParticipants',
  );
  dispositionParticipants.replaceChildren([]);
  household.forEach(p => {
    var dp = document.createElement('li');
    var includeParticipant = document.createElement('input');
    includeParticipant.value = p.ID;
    includeParticipant.id = `includeParticipant-${p.ID}`;
    includeParticipant.name = 'includeParticipant[]';

    var dispositions = ps.createDispositionsControl();

    includeParticipant.type = 'checkbox';
    includeParticipant.onchange = () => {
      dispositions.style.visibility = includeParticipant.checked
        ? 'visible'
        : 'hidden';
      if (includeParticipant.checked) {
        dp.classList.add('checked');
      } else {
        dp.classList.remove('checked');
      }
      ps.setDispositionSubmit();
    };
    dp.appendChild(includeParticipant);

    var name = document.createElement('span');
    name.innerText = `${p.FirstName} ${p.LastName}`;
    dp.appendChild(name);
    dp.appendChild(dispositions);

    dispositionParticipants.appendChild(dp);
  });
};

ps.setReasonForCall = async (gct, reason) => {
  gct.sendBroadcast({
    action: gct.MESSAGE_ACTIONS.SET_REASON_FOR_CALL,
    reason: reason,
  });
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
  var includes = document.getElementsByName('includeParticipant[]');
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
