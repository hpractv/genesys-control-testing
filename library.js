/*
langTag={{gcLangTag}}
gcTargetEnv={{gcTargetEnv}}
gcHostOrigin={{gcHostOrigin}}
conversationId={{gcConversationId}}
usePopupAuth={{gcUsePopupAuth}}
*/
'use strict';
var gct = {};

gct.getQueryParam = name => {
  return gct.urlParams.has(name) ? gct.urlParams.get(name) : null;
};

gct.DATALOAD = {
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
};

const joinBroadcast = async (sender, callback) => {
  gct.broadcastSender = sender;
  gct.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  gct.broadcastChannel.onmessage = event => {
    const { sender, message } = event.data;
    //ignore messages from myself
    if (sender !== gct.broadcastSender) {
      callback(sender, message);
    }
  };
};

gct.sendBroadcast = async message => {
  gct.broadcastChannel.postMessage({
    sender: gct.broadcastSender,
    message: message,
  });
};

gct.init = async (elements, sender, messageCallback) => {
  gct.urlParams = new URLSearchParams(window.location.search);
  gct.params = {};
  gct.params.langTag = gct.getQueryParam('langTag');
  gct.params.gcTargetEnv = gct.getQueryParam('gcTargetEnv');
  gct.params.gcHostOrigin = gct.getQueryParam('gcHostOrigin');
  gct.params.conversationId = gct.getQueryParam('conversationId');
  gct.params.usePopupAuth = gct.getQueryParam('usePopupAuth');

  await loadData(elements);
  await joinBroadcast(sender, messageCallback);
};

gct.MESSAGE_ACTIONS = {
  SET_PARTICIPANT_INFO: 1,
  SET_REASON_FOR_CALL: 2,
  ENABLE_PARTICIPANT_INTERACTION: 3,
  RESET_PARTICIPANT_DISPLAY: 4,
};
