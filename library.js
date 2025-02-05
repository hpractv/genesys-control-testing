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

const loadData = async () => {
  await fetch('data.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      gct.population = data.population;
    })
    .catch(error => {
      console.error('There was a problem with the fetch operation:', error);
    });
};

gct.init = async () => {
  gct.urlParams = new URLSearchParams(window.location.search);
  gct.params = {};
  gct.params.langTag = gct.getQueryParam('langTag');
  gct.params.gcTargetEnv = gct.getQueryParam('gcTargetEnv');
  gct.params.gcHostOrigin = gct.getQueryParam('gcHostOrigin');
  gct.params.conversationId = gct.getQueryParam('conversationId');
  gct.params.usePopupAuth = gct.getQueryParam('usePopupAuth');

  await loadData();
};
