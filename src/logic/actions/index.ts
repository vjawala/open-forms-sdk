/**
 * Handlers/implementations of the logic action types defined in backend logic rules.
 *
 * The actions in this package are a subset of all the available actions possible - some
 * action types cannot be executed in the frontend and are excluded here for that
 * reason.
 *
 * The action implementations are organized by their type: `{action.action.type}.ts`.
 *
 * @todo The type guards for the logic action type are necessary because the logic
 * action definitions used nested discriminators, which Typescript can't handle for
 * type narrowing. First, the backend needs to be updated to emit a flatter data
 * structure.
 */
export {isDisableNextAction, applyDisableNextAction} from './disable-next';
export {isPropertyAction, applyPropertyAction} from './property';
export {isStepApplicableAction, applyStepApplicableAction} from './step-applicable';
export {isStepNotApplicableAction, applyStepNotApplicableAction} from './step-not-applicable';
export {isVariableAction, applyVariableAction} from './variable';
