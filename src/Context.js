import React from 'react';

const FormContext = React.createContext({
  uuid: '',
  name: '',
  slug: '',
  url: '',
  loginRequired: false,
  loginOptions: [],
  maintenanceMode: false,
  showProgressIndicator: true,
  submissionAllowed: 'yes',
  literals: {
    beginText: {value: '', resolved: 'Begin'},
    changeText: {value: '', resolved: 'Change'},
    confirmText: {value: '', resolved: 'Confirm'},
    previousText: {value: '', resolved: 'Previous'},
  },
  steps: [],
});
FormContext.displayName = 'FormContext';

const ConfigContext = React.createContext({
  baseUrl: '',
  basePath: '',
  baseTitle: '',
  requiredFieldsWithAsterisk: true,
  displayComponents: {
    app: null,
    form: null,
    progressIndicator: null,
    loginOptions: null,
  },
});
ConfigContext.displayName = 'ConfigContext';

const FormioTranslations = React.createContext({i18n: {}, language: ''});
FormioTranslations.displayName = 'FormioTranslations';

const SubmissionContext = React.createContext({submission: null});
SubmissionContext.displayName = 'SubmissionContext';

export {FormContext, ConfigContext, FormioTranslations, SubmissionContext};
