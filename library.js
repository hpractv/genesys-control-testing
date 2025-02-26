/*
langTag={{gcLangTag}}
gcTargetEnv={{gcTargetEnv}}
gcHostOrigin={{gcHostOrigin}}
conversationId={{gcConversationId}}
usePopupAuth={{gcUsePopupAuth}}
*/
'use strict';
var gct = {};

gct.QUERY_PARAMS = {
  LANG_TAG: 'langTag',
  GC_TARGET_ENV: 'gcTargetEnv',
  GC_HOST_ORIGIN: 'gcHostOrigin',
  CONVERSATION_ID: 'conversationId',
  USE_POPUP_AUTH: 'usePopupAuth',
  POPUP_CALLER: 'popupCaller',
};

gct.getQueryParam = name => {
  return gct.urlParams.has(name) ? gct.urlParams.get(name) : null;
};

gct.init = async (elements, sender, messageCallback) => {
  gct.urlParams = new URLSearchParams(window.location.search);
  gct.params = {};
  gct.params.langTag = gct.getQueryParam(gct.QUERY_PARAMS.LANG_TAG);
  gct.params.gcTargetEnv = gct.getQueryParam(gct.QUERY_PARAMS.GC_TARGET_ENV);
  gct.params.gcHostOrigin = gct.getQueryParam(gct.QUERY_PARAMS.GC_HOST_ORIGIN);
  gct.params.conversationId = gct.getQueryParam(
    gct.QUERY_PARAMS.CONVERSATION_ID,
  );
  gct.params.usePopupAuth = gct.getQueryParam(gct.QUERY_PARAMS.USE_POPUP_AUTH);

  await loadData(elements);
  gct.broadcastSender = sender;
  if (messageCallback) {
    await joinBroadcast(sender, messageCallback);
  }
};

gct.DATALOAD = {
  NONE: 0,
  POPULATION: 1,
  HEADSOFHOUSEHOLD: 2,
};

const loadData = async elements => {
  await fetch('data.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      if (elements & (gct.DATALOAD.POPULATION !== 0)) {
        gct.population = data.population;
      }
      if (elements & (gct.DATALOAD.HEADSOFHOUSEHOLD !== 0)) {
        gct.headsOfHousehold = data.headsOfHousehold;
      }
    })
    .catch(error => {
      console.error('There was a problem with the fetch operation:', error);
    });
};

const BROADCAST_CHANNEL_NAME = 'gct';
gct.BROADCAST_SENDER = {
  AGENT_SCRIPT: 1,
  INTERACTION: 2,
  SIDEBAR: 4,
  STANDALONE: 8,
  POPUP: 16,
};

const joinBroadcast = async (sender, callback) => {
  gct.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  gct.broadcastChannel.onmessage = async event => {
    const { sender, message } = event.data;
    //ignore messages from myself
    if (sender !== gct.broadcastSender) {
      callback(sender, message);
    }
  };

  window.addEventListener('message', gct.windowEventResponder);
};

gct.sendBroadcast = async message => {
  gct.broadcastChannel.postMessage({
    sender: gct.broadcastSender,
    message: message,
  });
};

gct.windowEventResponder = event => {
  var message = event.data;
  console.log('Received message:', message);
  //not from us
  if (message.sender !== gct.broadcastSender) {
    if (
      message.popupCaller === gct.broadcastSender &&
      message.action === gct.MESSAGE_ACTIONS.REQUEST_POPUP_CONTROL_DATA
    ) {
      console.log("Answering popup's request for data");

      console.log('popup control', gct.popup_tool);

      var title = localStorage.getItem(gct.TOOL_VARS.TITLE);
      var participant = localStorage.getItem(gct.TOOL_VARS.PARTICIPANT);
      var content = localStorage.getItem(gct.TOOL_VARS.CONTENT);

      var popupData = {
        sender: gct.broadcastSender,
        action: gct.MESSAGE_ACTIONS.SET_POPUP_CONTROL_DATA,
        title: title,
        participant: participant,
        content: content,
      };

      console.log('set pupup data', popupData);
      gct.popup_tool.postMessage(popupData);
    }
  }
};

gct.MESSAGE_ACTIONS = {
  SET_PARTICIPANTS_INFO: 1,
  SET_REASON_FOR_CALL: 2,
  ENABLE_PARTICIPANT_INTERACTION: 3,
  ENABLE_CALL_DISPOSITION: 4,
  RESET_PARTICIPANT_DISPLAY: 5,
  REQUEST_POPUP_CONTROL_DATA: 6,
  SET_POPUP_CONTROL_DATA: 7,
};

gct.nameDisplay = participant => {
  var middleDisplay = ' ';
  if (participant.MiddleName !== null) {
    middleDisplay = ` ${participant.MiddleName} `;
  }
  return `${participant.FirstName}${middleDisplay}${participant.LastName}`;
};

gct.TOOL_VARS = {
  TITLE: 'tool-title',
  PARTICIPANT: 'tool-participant',
  CONTENT: 'tool-content',
};

gct.popup_tool = null;
gct.openTool = (title, participantName) => {
  localStorage.setItem(gct.TOOL_VARS.TITLE, title);
  localStorage.setItem(gct.TOOL_VARS.PARTICIPANT, participantName);
  localStorage.setItem(gct.TOOL_VARS.CONTENT, `This is the ${title} tool.`);

  gct.popup_tool = window.open(
    `popup-tool.html?${gct.QUERY_PARAMS.POPUP_CALLER}=${gct.broadcastSender}`,
    'Tool',
    'height=600,width=800,location=0,resizable=0,scrollbars=0',
  );

  // var popupData = {
  //   sender: gct.broadcastSender,
  //   action: gct.MESSAGE_ACTIONS.SET_POPUP_CONTROL_DATA,
  //   title: title,
  //   participant: participant,
  //   content: content,
  // };

  // gct.popup_tool.postMessage(popupData);
  gct.popup_tool.focus();

  return false;
};
