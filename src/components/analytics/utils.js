import {GOVMETRIC_URL} from './constants';

const buildGovMetricUrl = (govmetricSourceId, formSlug, govmetricSecureGuid) => {
  let govmetricStopknop = new URL(`/theme/kf/${govmetricSourceId}`, GOVMETRIC_URL);
  govmetricStopknop.searchParams.append('Q_Formid', formSlug);
  if (govmetricSecureGuid) {
    govmetricStopknop.searchParams.append('GUID', govmetricSecureGuid);
  }

  return govmetricStopknop.href;
};

export {buildGovMetricUrl};
