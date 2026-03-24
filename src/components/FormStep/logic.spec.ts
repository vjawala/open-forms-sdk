import type {AnyComponentSchema, JSONObject} from '@open-formulieren/types';

import {buildSubmission, buildSubmissionStep} from '@/api-mocks';
import type {LogicRule} from '@/data/logic';
import type {SubmissionStep} from '@/data/submission-steps';

import {evaluateBackendRules} from './logic';

// if a second rule depens on the mutated value of a field, this must be reflected
// immediately
test('rule evaluation immediately applies value changes', () => {
  const rules: LogicRule[] = [
    {
      jsonLogicTrigger: {'==': [{var: 'textfield'}, 'foo']},
      actions: [
        {
          action: {
            type: 'property',
            property: {value: 'validate.required', type: 'bool'},
            state: true,
          },
          component: 'number',
        },
        {
          action: {
            type: 'variable',
            value: 67,
          },
          variable: 'number',
        },
      ],
    },
    {
      jsonLogicTrigger: {'==': [{var: 'number'}, 67]},
      actions: [
        {
          action: {
            type: 'variable',
            value: 'b',
          },
          variable: 'radio',
        },
      ],
    },
  ];
  const submission = buildSubmission();
  const components: AnyComponentSchema[] = [
    {
      type: 'textfield',
      id: 'textfield',
      key: 'textfield',
      label: 'Textfield',
    },
    {
      type: 'number',
      id: 'number',
      key: 'number',
      label: 'Number',
      validate: {required: false},
    },
    {
      id: 'radio',
      type: 'radio',
      key: 'radio',
      label: 'Radio',
      values: [
        {value: 'a', label: 'A'},
        {value: 'b', label: 'B'},
      ],
      defaultValue: null,
      openForms: {dataSrc: 'manual'},
    },
  ];
  const step: SubmissionStep = {
    ...buildSubmissionStep({components}),
    defaultConfiguration: {components},
  };
  let updatedComponents: AnyComponentSchema[] = [];
  let dataUpdates: JSONObject | null = {};

  evaluateBackendRules({
    submission,
    step,
    rules,
    inputData: {textfield: 'foo', number: null, radio: null},
    components: step.defaultConfiguration!.components ?? [],
    onLogicCheckResult: (_, step) => {
      updatedComponents = step.configuration.components;
      dataUpdates = step.data;
    },
  });

  expect(dataUpdates).toEqual({
    number: 67,
    radio: 'b',
  });
  expect(updatedComponents).toEqual([
    {
      type: 'textfield',
      id: 'textfield',
      key: 'textfield',
      label: 'Textfield',
    },
    {
      type: 'number',
      id: 'number',
      key: 'number',
      label: 'Number',
      validate: {required: true},
    },
    {
      id: 'radio',
      type: 'radio',
      key: 'radio',
      label: 'Radio',
      values: [
        {value: 'a', label: 'A'},
        {value: 'b', label: 'B'},
      ],
      defaultValue: null,
      openForms: {dataSrc: 'manual'},
    },
  ]);
});

test('clearOnHide behaviour is applied', () => {
  const rules: LogicRule[] = [
    // mark textfield as hidden when checkbox is checked, which should clear its
    // value
    {
      jsonLogicTrigger: {var: 'trigger'},
      actions: [
        {
          action: {
            type: 'property',
            property: {value: 'hidden', type: 'bool'},
            state: true,
          },
          component: 'textfield',
        },
      ],
    },
    // show number input when textfield has empty-ish value, which will be the case
    // because the previous rule hides it and clearOnHide is enabled.
    {
      jsonLogicTrigger: {'!': [{var: 'textfield'}]},
      actions: [
        {
          action: {
            type: 'property',
            property: {value: 'hidden', type: 'bool'},
            state: false,
          },
          component: 'number',
        },
      ],
    },
  ];
  const submission = buildSubmission();
  const components: AnyComponentSchema[] = [
    {
      type: 'checkbox',
      id: 'trigger',
      key: 'trigger',
      label: 'Trigger',
    },
    {
      type: 'textfield',
      id: 'textfield',
      key: 'textfield',
      label: 'Textfield',
      hidden: false,
      clearOnHide: true,
    },
    {
      type: 'number',
      id: 'number',
      key: 'number',
      label: 'Number',
      hidden: true,
      defaultValue: 67,
    },
  ];
  const step: SubmissionStep = {
    ...buildSubmissionStep({components}),
    defaultConfiguration: {components},
  };
  let updatedComponents: AnyComponentSchema[] = [];
  let dataUpdates: JSONObject | null = {};

  evaluateBackendRules({
    submission,
    step,
    rules,
    inputData: {trigger: true, textfield: 'clear-me'},
    components: step.defaultConfiguration!.components ?? [],
    onLogicCheckResult: (_, step) => {
      updatedComponents = step.configuration.components;
      dataUpdates = step.data;
    },
  });

  expect(dataUpdates).toEqual({
    /**
     * The backend returns the component-type specific empty value because there the
     * the 'undefined' concept doesn't exist. The renderer actually takes care of
     * unsetting that data entirely for the hidden components. Here we use the same
     * client-side logic and we can already omit the key and save one update cycle +
     * keep code simpler.
     */
    // textfield: '',
    number: 67,
  });
  expect(updatedComponents).toEqual([
    {
      type: 'checkbox',
      id: 'trigger',
      key: 'trigger',
      label: 'Trigger',
    },
    {
      type: 'textfield',
      id: 'textfield',
      key: 'textfield',
      label: 'Textfield',
      hidden: true,
      clearOnHide: true,
    },
    {
      type: 'number',
      id: 'number',
      key: 'number',
      label: 'Number',
      hidden: false,
      defaultValue: 67,
    },
  ]);
});

test('clearOnHide behaviour with hidden parent', () => {
  const components: AnyComponentSchema[] = [
    {
      type: 'checkbox',
      id: 'trigger',
      key: 'trigger',
      label: 'Trigger',
    },
    {
      type: 'fieldset',
      id: 'fieldsetHidden',
      key: 'fieldsetHidden',
      label: 'Hidden fieldset',
      hidden: true,
      hideHeader: false,
      components: [
        {
          type: 'textfield',
          id: 'textfield',
          key: 'textfield',
          label: 'Textfield',
          hidden: true,
          clearOnHide: true,
          defaultValue: 'default',
        },
      ],
    },
  ];
  const submission = buildSubmission();
  const step: SubmissionStep = {
    ...buildSubmissionStep({components}),
    defaultConfiguration: {components},
  };
  const rules: LogicRule[] = [
    // Rule triggers despite the component already being hidden through the hidden
    // parent fieldset.
    {
      jsonLogicTrigger: {var: 'trigger'},
      actions: [
        {
          action: {
            type: 'property',
            property: {value: 'hidden', type: 'bool'},
            state: false,
          },
          component: 'textfield',
        },
      ],
    },
  ];
  let updatedComponents: AnyComponentSchema[] = [];
  let dataUpdates: JSONObject | null = {};

  evaluateBackendRules({
    submission,
    step,
    rules,
    // because the parent is hidden, the renderer has remove the `textfield` from the
    // input data due to its clearOnHide, leaving only the checkbox as input data
    inputData: {trigger: true},
    components: step.defaultConfiguration!.components ?? [],
    onLogicCheckResult: (_, step) => {
      updatedComponents = step.configuration.components;
      dataUpdates = step.data;
    },
  });

  expect(updatedComponents).toEqual([
    {
      type: 'checkbox',
      id: 'trigger',
      key: 'trigger',
      label: 'Trigger',
    },
    {
      type: 'fieldset',
      id: 'fieldsetHidden',
      key: 'fieldsetHidden',
      label: 'Hidden fieldset',
      hidden: true,
      hideHeader: false,
      components: [
        {
          type: 'textfield',
          id: 'textfield',
          key: 'textfield',
          label: 'Textfield',
          hidden: false, // flipped, but effectively still hidden because of the parent
          clearOnHide: true,
          defaultValue: 'default',
        },
      ],
    },
  ]);
  // because the parent is still hidden, we don't expect any data updates as the
  // component does not effectively become visible
  expect(dataUpdates).toEqual({});
});
