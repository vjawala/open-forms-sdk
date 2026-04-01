import {getRegistryEntry} from '@open-formulieren/formio-renderer';
import {processVisibility} from '@open-formulieren/formio-renderer/visibility.js';
import type {JSONObject, JSONValue} from '@open-formulieren/types';
import {getIn, setIn} from 'formik';
import {set} from 'lodash';

import {getComponentEmptyValue} from '@/components/FormStep/logic';
import type {LogicAction, PropertyAction} from '@/data/logic';

import type {LogicEvaluationState} from './types';

export const isPropertyAction = (action: LogicAction): action is PropertyAction => {
  return action.action.type === 'property';
};

/**
 * Resolve the referenced component and set the specified property to the desired state.
 *
 * This runs even if the component already has the desired state, effectively resulting
 * in a no-op action. Side-effects like updating values and errors to clear only run
 * when a relevant change is detected.
 */
export const applyPropertyAction = (
  logicState: LogicEvaluationState,
  action: PropertyAction
): void => {
  const {componentsMap, ruleIsTriggered} = logicState;
  const {
    component: componentKey,
    action: {
      property: {value: propertyPath},
      state,
    },
  } = action;

  // this *could* point to a component in another step
  const targetComponent = componentsMap[componentKey];
  if (!targetComponent) return;

  const becameOptional = propertyPath === 'validate.required' && ruleIsTriggered !== state;

  if (ruleIsTriggered) {
    set(targetComponent, propertyPath, state);
  }

  // processVisibility takes care of applying side effects of:
  // - `clearOnHide`
  // - restoring the value when a component becomes visible again
  //
  // both lead to updates in the submission data.
  if (propertyPath === 'hidden') {
    // XXX: backend logic rules targeting editgrids are currently not supported - this
    // codepath will need to be updated when we add support for that.
    const {updatedValues} = processVisibility(
      // we must scope the visibility processing to this component and its potential
      // children, otherwise we risk adding back values to the state for visible
      // components that only get hidden (and cleared) by a future action/rule, and that
      // results in infinite render cycles because the Formik values bounce between two
      // or more different states. This means that we need a different mechanism to
      // determine if the parent of the target component is hidden...
      [targetComponent],
      logicState.data,
      // we can't and don't need to pass errors - processVisibility runs (again)
      // internally in the Formio renderer and manages the Formik validation errors
      // there for hidden components. At the logic evaluation layer, we don't have
      // access to the Formik state and can't even pass the errors.
      {},
      {
        emulateBackend: true,
        // for proper intuitive semantics, this would take into account the visibility
        // state of the parent(s) via hasHiddenParent(targetComponent, logicState),
        // but because of the `clearValueCallback` to match the backend behaviour, this
        // is currently not relevan/correct. See
        // https://github.com/open-formulieren/open-forms/issues/6121.
        parentHidden: false,
        initialValues: logicState.initialValues,
        getRegistryEntry,
        componentsMap,
        // Ensure we restore the default value OR empty value when clearing the
        // value so that we match the backend behaviour. The formio-renderer will take
        // care of properly removing the key from the submission data.
        // See https://github.com/open-formulieren/open-forms/issues/6121
        clearValueCallback: (values: JSONObject, key: string): JSONObject => {
          const component = componentsMap[key];
          if (
            ['fieldset', 'columns', 'content', 'softRequiredErrors', 'coSign'].includes(
              component.type
            )
          ) {
            return values;
          }

          const initialValue: JSONValue | undefined = getIn(
            logicState.initialValuesForClearOnHide,
            key
          );
          const clearedValue: JSONValue =
            initialValue !== undefined ? initialValue : getComponentEmptyValue(component);
          return setIn(values, key, clearedValue);
        },
      }
    );
    logicState.data = updatedValues;
  }

  // validate.required flipping from true -> false should reset possible 'this field
  // is required' validation errors
  if (becameOptional) {
    logicState.errorsToClear.push(componentKey);
  }
};
