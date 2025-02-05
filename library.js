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

gct.init = () => {
  gct.urlParams = new URLSearchParams(window.location.search);
  gct.params = {};
  gct.params.langTag = gct.getQueryParam('langTag');
  gct.params.gcTargetEnv = gct.getQueryParam('gcTargetEnv');
  gct.params.gcHostOrigin = gct.getQueryParam('gcHostOrigin');
  gct.params.conversationId = gct.getQueryParam('conversationId');
  gct.params.usePopupAuth = gct.getQueryParam('usePopupAuth');
};
