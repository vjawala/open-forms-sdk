import type {JSONObject, JSONValue} from '@open-formulieren/types';

/**
 * Action that assigns a variable value.
 */
export interface VariableAction {
  action: {
    /**
     * Action type discriminator.
     */
    type: 'variable';
    /**
     * Literal value or JsonLogic expression to calculate the resulting value to assign.
     */
    value: JSONValue;
  };
  /**
   * Variable key to assign the value to.
   */
  variable: string;
}

/**
 * Action that modifies a property of the component, like hidden/required/disabled
 * (readOnly).
 */
export interface PropertyAction {
  action: {
    /**
     * Action type discriminator.
     */
    type: 'property';
    /**
     * Definition of the property to set.
     */
    property: {
      /**
       * Dotted path to the property on the component to set.
       */
      value: 'hidden' | 'validate.required' | 'disabled';
      /**
       * Type of the `value` field to assign.
       *
       * @deprecated - not used to interpret the `state` key at this point.
       */
      type: 'bool';
    };
    /**
     * Desired state of the `action.property.value` property.
     */
    state: boolean;
  };
  /**
   * Key of the component for which to set the specified property.
   */
  component: string;
}

/**
 * Action that marks the "current" step submission (specified by UUID) as disabled,
 * typically preventing progression to the next one.
 */
export interface DisableNextAction {
  action: {
    /**
     * Action type discriminator.
     */
    type: 'disable-next';
  };
  /**
   * UUID of the step to disable.
   */
  formStepUuid: string;
}

/**
 * Action to mark a step as not applicable, i.e. it will be skipped entirely.
 */
export interface StepNotApplicableAction {
  action: {
    /**
     * Action type discriminator.
     */
    type: 'step-not-applicable';
  };
  /**
   * UUID of the step to mark as not applicable.
   */
  formStepUuid: string;
}

/**
 * Action to mark a step as applicable, i.e. it will no longer be skipped.
 */
export interface StepApplicableAction {
  action: {
    /**
     * Action type discriminator.
     */
    type: 'step-applicable';
  };
  /**
   * UUID of the step to mark as not applicable.
   */
  formStepUuid: string;
}

/**
 * The available logic action types understood by the frontend.
 *
 * Note that more action types exist in the backend, but those require access to
 * internal state that is not exposed to the frontend for security and privacy reasons.
 *
 * @see `#/components/schemas/LogicComponentAction` in the API spec.
 */
export type LogicAction =
  | VariableAction
  | PropertyAction
  | DisableNextAction
  | StepNotApplicableAction
  | StepApplicableAction;

/**
 * A logic rule defined in the backend, with a trigger and actions to execute when
 * the trigger evaluates to truthy.
 *
 * The rule is likely partially evaluated in the backend already so that it only
 * contains references to variables/form fields present in the step currently being
 * filled out (or future steps, in which case they won't resolve). The variables of
 * future steps are also filled with their (empty) values to match backend logic
 * evaluation behaviour.
 *
 * @see `#/components/schemas/FormLogicFrontend` in the API spec.
 */
export interface LogicRule {
  /**
   * The trigger expression for the rule. It's a JsonLogic expression that will be
   * evaluated with the current variables context.
   *
   * @see {@Link https://jsonlogic.com/} for the JsonLogic reference.
   * @note Open Forms extends JsonLogic with its own set of operators, see `src/logic`
   * for details.
   */
  jsonLogicTrigger: JSONObject;
  /**
   * Collection of logic actions to execute when the trigger evaluates to truthy.
   *
   * Actions will be executed in the order defined.
   */
  actions: LogicAction[];
}
