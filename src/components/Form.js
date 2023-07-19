import React, {useContext, useEffect} from 'react';
import {useIntl} from 'react-intl';
import {Navigate, Route, Routes, useMatch, useNavigate} from 'react-router-dom';
import {usePrevious} from 'react-use';
import {useImmerReducer} from 'use-immer';

import {ConfigContext} from 'Context';
import {destroy} from 'api';
import ErrorBoundary from 'components/ErrorBoundary';
import FormDisplay from 'components/FormDisplay';
import FormStart from 'components/FormStart';
import FormStep from 'components/FormStep';
import {LayoutColumn} from 'components/Layout';
import Loader from 'components/Loader';
import PaymentOverview from 'components/PaymentOverview';
import ProgressIndicator from 'components/ProgressIndicator';
import RequireSubmission from 'components/RequireSubmission';
import {RequireSession} from 'components/Sessions';
import SubmissionConfirmation from 'components/SubmissionConfirmation';
import SubmissionSummary from 'components/Summary';
import {START_FORM_QUERY_PARAM} from 'components/constants';
import {findNextApplicableStep} from 'components/utils';
import {createSubmission, flagActiveSubmission, flagNoActiveSubmission} from 'data/submissions';
import useAutomaticRedirect from 'hooks/useAutomaticRedirect';
import usePageViews from 'hooks/usePageViews';
import useQuery from 'hooks/useQuery';
import useRecycleSubmission from 'hooks/useRecycleSubmission';
import useSessionTimeout from 'hooks/useSessionTimeout';
import Types from 'types';

const initialState = {
  submission: null,
  submittedSubmission: null,
  processingStatusUrl: '',
  processingError: '',
  completed: false,
};

const reducer = (draft, action) => {
  switch (action.type) {
    case 'SUBMISSION_LOADED': {
      // keep the submission instance in the state and set the current step to the
      // first step of the form.
      draft.submission = action.payload;
      break;
    }
    case 'SUBMITTED': {
      return {
        ...initialState,
        submittedSubmission: action.payload.submission,
        processingStatusUrl: action.payload.processingStatusUrl,
      };
    }
    case 'PROCESSING_FAILED': {
      // set the error message in the state
      draft.processingError = action.payload;
      // put the submission back in the state as well, so we can re-submit
      draft.submission = draft.submittedSubmission;
      break;
    }
    case 'PROCESSING_SUCCEEDED': {
      draft.processingError = null;
      draft.completed = true;
      break;
    }
    case 'CLEAR_PROCESSING_ERROR': {
      draft.processingError = '';
      break;
    }
    case 'DESTROY_SUBMISSION': {
      return {
        ...initialState,
      };
    }
    case 'RESET': {
      const initialState = action.payload;
      return initialState;
    }
    default: {
      throw new Error(`Unknown action ${action.type}`);
    }
  }
};

/**
 * An OpenForms form.
 *
 *
 * OpenForms forms consist of some metadata and individual steps.
 * @param  {Object} options.form The form definition from the Open Forms API
 * @return {JSX}
 */
const Form = ({form}) => {
  const navigate = useNavigate();
  const shouldAutomaticallyRedirect = useAutomaticRedirect(form);
  const queryParams = useQuery();
  usePageViews();
  const intl = useIntl();
  const prevLocale = usePrevious(intl.locale);

  // extract the declared properties and configuration
  const {steps} = form;
  const config = useContext(ConfigContext);

  // load the state management/reducer
  const initialStateFromProps = {...initialState, step: steps[0]};
  const [state, dispatch] = useImmerReducer(reducer, initialStateFromProps);

  const onSubmissionLoaded = (submission, next = '') => {
    if (sessionExpired) return;
    dispatch({
      type: 'SUBMISSION_LOADED',
      payload: submission,
    });
    flagActiveSubmission();
    // navigate to the first step
    const firstStepRoute = `/stap/${form.steps[0].slug}`;
    navigate(next ? next : firstStepRoute);
  };

  // if there is an active submission still, re-load that (relevant for hard-refreshes)
  const [loading, setSubmissionId, removeSubmissionId] = useRecycleSubmission(
    form,
    state.submission,
    onSubmissionLoaded
  );

  const [sessionExpired, expiryDate, resetSession] = useSessionTimeout(() => {
    removeSubmissionId();
    dispatch({type: 'DESTROY_SUBMISSION'});
    flagNoActiveSubmission();
  });

  useEffect(
    () => {
      if (prevLocale === undefined) return;
      if (intl.locale !== prevLocale && state.submission) {
        removeSubmissionId();
        dispatch({type: 'DESTROY_SUBMISSION'});
        flagNoActiveSubmission();
        navigate(`/?${START_FORM_QUERY_PARAM}=1`);
      }
    },
    [intl.locale, prevLocale, removeSubmissionId, state.submission] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const paymentOverviewMatch = useMatch('/betaaloverzicht');

  /**
   * When the form is started, create a submission and add it to the state.
   *
   * @param  {Event} event The DOM event, could be a button click or a custom event.
   * @return {Void}
   */
  const onFormStart = async event => {
    event && event.preventDefault();

    // required to get rid of the error message saying the session is expired - once
    // you start a new submission, any previous call history should be discarded.
    resetSession();

    if (state.submission != null) {
      onSubmissionLoaded(state.submission);
      return;
    }

    const submission = await createSubmission(config.baseUrl, form);
    dispatch({
      type: 'SUBMISSION_LOADED',
      payload: submission,
    });
    flagActiveSubmission();
    setSubmissionId(submission.id);
    // navigate to the first step
    const firstStepRoute = `/stap/${form.steps[0].slug}`;
    navigate(firstStepRoute);
  };

  const onStepSubmitted = async formStep => {
    const currentStepIndex = form.steps.indexOf(formStep);

    const nextStepIndex = findNextApplicableStep(currentStepIndex, state.submission);
    const nextStep = form.steps[nextStepIndex]; // will be undefined if it's the last step

    const nextUrl = nextStep ? `/stap/${nextStep.slug}` : '/overzicht';
    navigate(nextUrl);
  };

  const onSubmitForm = processingStatusUrl => {
    removeSubmissionId();
    dispatch({
      type: 'SUBMITTED',
      payload: {
        submission: state.submission,
        processingStatusUrl,
      },
    });
    navigate('/bevestiging');
  };

  const destroySession = async confirmationMessage => {
    if (!window.confirm(confirmationMessage)) {
      return;
    }

    await destroy(`${config.baseUrl}authentication/${state.submission.id}/session`);

    removeSubmissionId();
    navigate('/');
    // TODO: replace with a proper reset of the state instead of a page reload.
    window.location.reload();
  };

  const onFormAbort = async event => {
    event.preventDefault();

    const confirmationQuestion = intl.formatMessage({
      description: 'Abort confirmation prompt',
      defaultMessage:
        'Are you sure that you want to abort this submission? You will lose your progress if you continue.',
    });

    await destroySession(confirmationQuestion);
  };

  const onLogout = async event => {
    event.preventDefault();

    const confirmationQuestion = intl.formatMessage({
      description: 'log out confirmation prompt',
      defaultMessage: 'Are you sure that you want to logout?',
    });

    await destroySession(confirmationQuestion);
  };

  const onProcessingFailure = errorMessage => {
    // TODO: provide generic fallback message in case no explicit
    // message is shown
    dispatch({type: 'PROCESSING_FAILED', payload: errorMessage});
    navigate('/overzicht');
  };

  // handle redirect from payment provider to render appropriate page and include the
  // params as state for the next component.
  if (queryParams.get('of_payment_status')) {
    return (
      <Navigate
        replace
        to="/betaaloverzicht"
        state={{
          status: queryParams.get('of_payment_status'),
          userAction: queryParams.get('of_payment_action'),
        }}
      />
    );
  }

  if (loading || shouldAutomaticallyRedirect) {
    return (
      <LayoutColumn>
        <Loader modifiers={['centered']} />
      </LayoutColumn>
    );
  }

  const progressIndicator = form.showProgressIndicator ? (
    <ProgressIndicator
      title={form.name}
      steps={form.steps}
      hideNonApplicableSteps={form.hideNonApplicableSteps}
      submission={state.submission || state.submittedSubmission}
      submissionAllowed={form.submissionAllowed}
      completed={state.completed}
    />
  ) : null;

  // Route the correct page based on URL
  const router = (
    <Routes>
      <Route path="" element={<Navigate replace to="startpagina" />} />

      <Route
        path="startpagina"
        element={
          <ErrorBoundary useCard>
            <FormStart
              form={form}
              hasActiveSubmission={!!state.submission}
              onFormStart={onFormStart}
              onFormAbort={onFormAbort}
            />
          </ErrorBoundary>
        }
      />

      <Route
        path="overzicht"
        element={
          <ErrorBoundary useCard>
            <RequireSession expired={sessionExpired} expiryDate={expiryDate}>
              <RequireSubmission
                submission={state.submission}
                form={form}
                processingError={state.processingError}
                onConfirm={onSubmitForm}
                onLogout={onLogout}
                component={SubmissionSummary}
                onClearProcessingErrors={() => dispatch({type: 'CLEAR_PROCESSING_ERROR'})}
              />
            </RequireSession>
          </ErrorBoundary>
        }
      />

      <Route
        path="bevestiging"
        element={
          <ErrorBoundary useCard>
            <RequireSubmission
              submission={state.submittedSubmission}
              statusUrl={state.processingStatusUrl}
              onFailure={onProcessingFailure}
              onConfirmed={() => dispatch({type: 'PROCESSING_SUCCEEDED'})}
              component={SubmissionConfirmation}
              donwloadPDFText={form.submissionReportDownloadLinkTitle}
            />
          </ErrorBoundary>
        }
      />

      <Route
        path="betaaloverzicht"
        element={
          <ErrorBoundary useCard>
            <PaymentOverview />
          </ErrorBoundary>
        }
      />

      <Route
        path="stap/:step"
        element={
          <ErrorBoundary useCard>
            <RequireSession expired={sessionExpired} expiryDate={expiryDate}>
              <RequireSubmission
                form={form}
                submission={state.submission}
                onLogicChecked={submission =>
                  dispatch({type: 'SUBMISSION_LOADED', payload: submission})
                }
                onStepSubmitted={onStepSubmitted}
                onLogout={onLogout}
                onSessionDestroyed={() => {
                  resetSession();
                  navigate('/');
                  dispatch({type: 'RESET', payload: initialStateFromProps});
                }}
                component={FormStep}
              />
            </RequireSession>
          </ErrorBoundary>
        }
      />
    </Routes>
  );

  // render the form step if there's an active submission (and no summary)
  const FormDisplayComponent = config?.displayComponents?.form ?? FormDisplay;
  return (
    <FormDisplayComponent
      router={router}
      progressIndicator={progressIndicator}
      showProgressIndicator={form.showProgressIndicator}
      isPaymentOverview={!!paymentOverviewMatch}
    />
  );
};

Form.propTypes = {
  form: Types.Form.isRequired,
};

export default Form;
