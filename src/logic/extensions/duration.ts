import {parse} from 'tinyduration';

import {INVALID_ARGUMENTS, TYPE} from './constants';
import type {RelativeDelta} from './rdelta';
import type {JsonLogicEngineMethod} from './types';

/**
 * Converts an ISO-8601 duration string to a RelativeDelta.
 *
 * We use an object that can be introspected on it's `TYPE` symbol so that it's clear
 * how operations involving it must behave.
 */
export const jsonLogicDuration: JsonLogicEngineMethod = (args): RelativeDelta => {
  if (args.length !== 1 || typeof args[0] !== 'string') throw INVALID_ARGUMENTS;
  const {
    years = 0,
    months = 0,
    days = 0,
    weeks = 0,
    hours = 0,
    minutes = 0,
    seconds = 0,
  } = parse(args[0]);
  return {
    [TYPE]: 'relativedelta',
    years,
    months,
    days: days + weeks * 7,
    hours,
    minutes,
    seconds,
  };
};
