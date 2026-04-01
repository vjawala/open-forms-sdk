import type {LogicAction, StepNotApplicableAction} from '@/data/logic';

import type {LogicEvaluationState} from './types';

export const isStepNotApplicableAction = (
  action: LogicAction
): action is StepNotApplicableAction => {
  return action.action.type === 'step-not-applicable';
};

export const applyStepNotApplicableAction = (
  logicState: LogicEvaluationState,
  action: StepNotApplicableAction
): void => {
  const {ruleIsTriggered} = logicState;
  if (!ruleIsTriggered) return;
  const {formStepUuid} = action;
  logicState.stepsApplicableUpdates[formStepUuid] = false;
};
