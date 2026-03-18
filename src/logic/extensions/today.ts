import {TZDate, tz} from '@date-fns/tz';
import {startOfToday} from 'date-fns';

import {DateWithoutTime} from './date';
import type {JsonLogicEngineMethod} from './types';

const TIMEZONE_AMS = tz('Europe/Amsterdam');

/**
 * Takes the current moment in time and strips the time portion.
 *
 * @note The backend uses server-side naive dates without timezone information, which
 * depends on the server being configured correctly. Usually, that will be the
 * Europe/Amsterdam timezone.
 *
 * Therefore, the client-side code here assumes the Europe/Amsterdam timezone as well,
 * to ensure frontend/backend arive at the same result, despite the user possibly being
 * in a completely different timezone.
 *
 * @deprecated It's better to use the `today` static variable in backend logic rules.
 */
export const jsonLogicToday: JsonLogicEngineMethod = (): DateWithoutTime => {
  const today = startOfToday({in: TIMEZONE_AMS});
  // create a new date from it that's "in UTC" with the same year, month and day, but
  // time set to zero. Remember, JS months start at 0, so we need to +1 it.
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();
  const result = new TZDate(year, month, day, 0, 0, 0, 0, 'UTC');
  return DateWithoutTime.createFrom(result);
};
