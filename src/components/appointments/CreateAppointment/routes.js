import {defineMessage} from 'react-intl';
import {Navigate, matchPath, resolvePath} from 'react-router-dom';

import ChooseProductStep from '../ChooseProductStep';
import ContactDetailsStep from '../ContactDetailsStep';
import LocationAndTimeStep from '../LocationAndTimeStep';

export const APPOINTMENT_STEPS = [
  {
    path: 'producten',
    element: <ChooseProductStep />,
    name: defineMessage({
      description: "Appointments navbar title for 'products' step",
      defaultMessage: 'Product',
    }),
  },
  {
    path: 'kalender',
    element: <LocationAndTimeStep />,
    name: defineMessage({
      description: "Appointments navbar title for 'location and time' step",
      defaultMessage: 'Location and time',
    }),
  },
  {
    path: 'contactgegevens',
    element: <ContactDetailsStep />,
    name: defineMessage({
      description: "Appointments navbar title for 'contact details' step",
      defaultMessage: 'Contact details',
    }),
  },
];

export const APPOINTMENT_STEP_PATHS = APPOINTMENT_STEPS.map(s => s.path);

/**
 * Route subtree for appointment forms.
 */
export const routes = [
  {
    path: '',
    element: <Navigate replace to={APPOINTMENT_STEP_PATHS[0]} />,
  },
  ...APPOINTMENT_STEPS.map(({path, element}) => ({path, element})),
];

/**
 * Check if a given relative path from the routes matches the current location.
 * @param currentPathname The current router location.pathname, from useLocation.
 * @param path            The relative path to check for matches
 */
export const checkMatchesPath = (currentPathname, path) => {
  // we need to transform the path into a parent-route lookup, instead of using the
  // default relative ./<foo> behaviour. The idea is that this component is mounted
  // somewhere in a larger route definition but the exact parent route is not relevant.
  const resolvedPath = resolvePath(`../${path}`, currentPathname);
  // if the relative path is not the current URL, matchPath returns null, otherwise
  // a match object.
  const match = matchPath(resolvedPath.pathname, currentPathname);
  return match !== null;
};