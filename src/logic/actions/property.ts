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

  // The previous hidden state is the state relative to the current action and
  // rule. It's possible another action/rule already modified the `hidden` state
  // compared to the initial state before any logic rule was evaluated.
  const wasPreviouslyHidden = 'hidden' in targetComponent && (targetComponent.hidden ?? false);

  const hasVisibilityChange = propertyPath === 'hidden' && wasPreviouslyHidden !== state;
  const becameOptional = propertyPath === 'validate.required' && ruleIsTriggered !== state;

  if (ruleIsTriggered) {
    set(targetComponent, propertyPath, state);
  }

  // processVisibility takes care of applying side effects of:
  // - `clearOnHide`
  // - restoring the value when a component becomes visible again
  //
  // both lead to updates in the submission data.
  if (hasVisibilityChange) {
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
        // for proper intuitive semantics, this would take into account the visibility
        // state of the parent(s) via hasHiddenParent(targetComponent, logicState),
        // but because of the `clearValueCallback` to match the backend behaviour, this
        // is currently not relevan/correct. See
        // https://github.com/open-formulieren/open-forms/issues/6121.
        parentHidden: false,
        initialValues: logicState.initialValues,
        getRegistryEntry,
        componentsMap,
        dataUpdatesAccumulator: logicState.dataUpdates,
        // Ensure we restore the original input data OR empty value when clearing the
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

          const initialValue: JSONValue | undefined = getIn(logicState.initialValues, key);
          const clearedValue: JSONValue =
            initialValue !== undefined ? initialValue : getComponentEmptyValue(component);
          // if an initialValues was grabbed, then by definition it's not a data diff
          // update. Otherwise it is and we need to add it to the dataUpdates.
          if (initialValue === undefined) {
            set(logicState.dataUpdates, key, clearedValue);
          }
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
