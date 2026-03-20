import type {LogicAction, StepApplicableAction} from '@/data/logic';

import type {LogicEvaluationState} from './types';

export const isStepApplicableAction = (action: LogicAction): action is StepApplicableAction => {
  return action.action.type === 'step-applicable';
};

export const applyStepApplicableAction = (
  logicState: LogicEvaluationState,
  action: StepApplicableAction
): void => {
  const {ruleIsTriggered} = logicState;
  if (!ruleIsTriggered) return;
  const {formStepUuid} = action;
  logicState.stepsApplicableUpdates[formStepUuid] = true;
};
