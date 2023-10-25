import PropTypes from 'prop-types';
import React, {useContext, useEffect, useState} from 'react';
import {useLocation, useMatch} from 'react-router-dom';

import {ConfigContext} from 'Context';
import {SUBMISSION_ALLOWED} from 'components/constants';
import {IsFormDesigner} from 'headers';
import Types from 'types';

import ProgressIndicatorDisplay from './ProgressIndicatorDisplay';
import {STEP_LABELS} from './constants';

const ProgressIndicator = ({
  title,
  submission = null,
  steps,
  submissionAllowed,
  completed = false,
  hideNonApplicableSteps = false,
}) => {
  const {pathname} = useLocation();
  const config = useContext(ConfigContext);
  const summaryMatch = !!useMatch('/overzicht');
  const stepMatch = useMatch('/stap/:step');
  const confirmationMatch = !!useMatch('/bevestiging');
  const isStartPage = !summaryMatch && stepMatch == null && !confirmationMatch;
  const [expanded, setExpanded] = useState(false);

  // collapse the expanded progress indicator if nav occurred, see
  // open-formulieren/open-forms#2673. It's important that *only* the pathname triggers
  // the effect, which is why exhaustive deps is ignored.
  useEffect(() => {
    if (expanded) {
      setExpanded(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // figure out the slug from the currently active step IF we're looking at a step
  const stepSlug = stepMatch ? stepMatch.params.step : '';
  const hasSubmission = !!submission;

  const applicableSteps = hasSubmission ? submission.steps.filter(step => step.isApplicable) : [];
  const applicableAndCompletedSteps = applicableSteps.filter(step => step.completed);
  const applicableCompleted =
    hasSubmission && applicableSteps.length === applicableAndCompletedSteps.length;

  // If any step cannot be submitted, there should NOT be an active link to the overview page.
  const canSubmitSteps = hasSubmission
    ? submission.steps.filter(step => !step.canSubmit).length === 0
    : false;

  // figure out the title for the mobile menu based on the state
  let activeStepTitle;
  if (isStartPage) {
    activeStepTitle = STEP_LABELS.login;
  } else if (summaryMatch) {
    activeStepTitle = STEP_LABELS.overview;
  } else if (confirmationMatch) {
    activeStepTitle = STEP_LABELS.confirmation;
  } else {
    const step = steps.find(step => step.slug === stepSlug);
    activeStepTitle = step.formDefinition;
  }

  const canNavigateToStep = index => {
    // The user can navigate to a step when:
    // 1. All previous steps have been completed
    // 2. The user is a form designer
    if (IsFormDesigner.getValue()) return true;

    if (!submission) return false;

    const previousSteps = submission.steps.slice(0, index);
    const previousApplicableButNotCompletedSteps = previousSteps.filter(
      step => step.isApplicable && !step.completed
    );

    return !previousApplicableButNotCompletedSteps.length;
  };

  const getStepsInfo = steps => {
    return steps.map((step, index) => ({
      uuid: step.uuid,
      slug: step.slug,
      to: step.href || `/stap/${step.slug}`,
      formDefinition: step.formDefinition,
      isCompleted: submission ? submission.steps[index].completed : false,
      isApplicable: submission ? submission.steps[index].isApplicable : step.isApplicable ?? true,
      isCurrent: step.slug === stepSlug,
      canNavigateTo: canNavigateToStep(index),
    }));
  };

  // try to get the value from the submission if provided, otherwise
  const submissionAllowedSpec = submission?.submissionAllowed ?? submissionAllowed;
  const showOverview = submissionAllowedSpec !== SUBMISSION_ALLOWED.noWithoutOverview;
  const showConfirmation = submissionAllowedSpec === SUBMISSION_ALLOWED.yes;

  const ProgressIndicatorDisplayComponent =
    config?.displayComponents?.progressIndicator ?? ProgressIndicatorDisplay;

  return (
    <ProgressIndicatorDisplayComponent
      activeStepTitle={activeStepTitle}
      formTitle={title}
      steps={getStepsInfo(steps)}
      hideNonApplicableSteps={hideNonApplicableSteps}
      hasSubmission={hasSubmission}
      isStartPage={isStartPage}
      isSummary={summaryMatch}
      isConfirmation={confirmationMatch}
      isSubmissionComplete={completed}
      areApplicableStepsCompleted={applicableCompleted && canSubmitSteps}
      showOverview={showOverview}
      showConfirmation={showConfirmation}
      expanded={expanded}
      onExpandClick={() => setExpanded(!expanded)}
    />
  );
};

ProgressIndicator.propTypes = {
  title: PropTypes.string,
  submission: Types.Submission,
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      url: PropTypes.string.isRequired,
      uuid: PropTypes.string.isRequired,
      index: PropTypes.number.isRequired,
      slug: PropTypes.string.isRequired,
      href: PropTypes.string,
      formDefinition: PropTypes.string.isRequired,
      isApplicable: PropTypes.bool,
    })
  ).isRequired,
  submissionAllowed: PropTypes.oneOf(Object.values(SUBMISSION_ALLOWED)).isRequired,
  completed: PropTypes.bool,
  hideNonApplicableSteps: PropTypes.bool,
};

export default ProgressIndicator;
