import React, {useContext} from 'react';
import ReactDOM from 'react-dom';
import {Navigate, Outlet, useMatch} from 'react-router-dom';

import {ConfigContext} from 'Context';
import AppDebug from 'components/AppDebug';
import {Cosign} from 'components/CoSign';
import Form from 'components/Form';
import LanguageSelection from 'components/LanguageSelection';
import {LayoutRow} from 'components/Layout';
import {CreateAppointment, appointmentRoutes} from 'components/appointments';
import ManageAppointment from 'components/appointments/ManageAppointment';
import {I18NContext} from 'i18n';
import Types from 'types';
import {DEBUG} from 'utils';

import AppDisplay from './AppDisplay';

export const getRoutes = (form, noDebug = false) => {
  const routes = [
    {
      path: 'afspraak-annuleren',
      element: <ManageAppointment />,
    },
    {
      path: 'afspraak-maken/*',
      element: <CreateAppointment form={form} />,
      children: appointmentRoutes,
    },
    {
      path: 'cosign/*',
      element: <Cosign form={form} noDebug={noDebug} />,
    },
    // All the rest goes to the formio-based form flow
    {
      path: '*',
      element: <Form form={form} noDebug={noDebug} />,
    },
  ];
  return routes;
};

const LanguageSwitcher = () => {
  const {languageSelectorTarget: target} = useContext(I18NContext);
  return target ? (
    ReactDOM.createPortal(<LanguageSelection />, target)
  ) : (
    <LayoutRow>
      <LanguageSelection />
    </LayoutRow>
  );
};

/*
Top level router - routing between an actual form or supporting screens.
 */
const App = ({...props}) => {
  const config = useContext(ConfigContext);
  const appointmentMatch = useMatch('afspraak-maken/*');

  const {
    form: {translationEnabled, appointmentEnabled},
    noDebug = false,
  } = props;

  const AppDisplayComponent = config?.displayComponents?.app ?? AppDisplay;

  const languageSwitcher = translationEnabled ? <LanguageSwitcher /> : null;
  const appDebug = DEBUG && !noDebug ? <AppDebug /> : null;

  if (appointmentEnabled && !appointmentMatch) {
    return <Navigate replace to="../afspraak-maken" />;
  }

  return (
    <AppDisplayComponent
      router={<Outlet />}
      languageSwitcher={languageSwitcher}
      appDebug={appDebug}
    />
  );
};

App.propTypes = {
  form: Types.Form,
};

export default App;
