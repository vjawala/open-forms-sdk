import type {DisableNextAction, LogicAction} from '@/data/logic';

import type {LogicEvaluationState} from './types';

export const isDisableNextAction = (action: LogicAction): action is DisableNextAction => {
  return action.action.type === 'disable-next';
};

export const applyDisableNextAction = (
  logicState: LogicEvaluationState,
  action: DisableNextAction
): void => {
  const {ruleIsTriggered, currentStepUuid} = logicState;
  const {formStepUuid: targetStepUuid} = action;
  if (!ruleIsTriggered || targetStepUuid !== currentStepUuid) return;
  logicState.disableNext = true;
};
