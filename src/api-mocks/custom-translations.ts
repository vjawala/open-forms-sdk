import {HttpResponse, http} from 'msw';

import type {ReactIntlLocaleData} from '@/i18n';

import {BASE_URL} from './base';

type AvailableLocale = 'en' | 'nl';
type LocaleMessagesMap = Record<AvailableLocale, ReactIntlLocaleData>;

const DEFAULT_CUSTOMIZED_LOCALE_MESSAGES_MAP: LocaleMessagesMap = {
  en: {
    kH9Cpi: [
      {
        type: 0,
        value: 'Custom translation (en) for Start page',
      },
    ],
  },
  nl: {
    kH9Cpi: [
      {
        type: 0,
        value: 'Aangepaste vertaling (nl) voor startpagina',
      },
    ],
  },
};

export const mockCustomStaticTranslationsGet = (language: AvailableLocale) =>
  http.get(`${BASE_URL}i18n/compiled-messages/${language}.json`, () => {
    return HttpResponse.json(DEFAULT_CUSTOMIZED_LOCALE_MESSAGES_MAP[language]);
  });

export const mockCustomStaticTranslationsNullGet = (language: AvailableLocale) =>
  http.get(`${BASE_URL}i18n/compiled-messages/${language}.json`, () => {
    return HttpResponse.json(null);
  });

export const mockCustomStaticTranslationsGetServiceUnavailable = http.get(
  `${BASE_URL}i18n/compiled-messages/:language.json`,
  () => {
    const errBody = {
      type: `${BASE_URL}fouten/ServiceUnavailable/`,
      code: 'service_unavailable',
      title: 'Service is not available.',
      status: 503,
      detail: 'Service is not available.',
      instance: 'urn:uuid:60b443e3-b847-424b-aed0-23820fc2a48d',
    };
    return HttpResponse.json(errBody, {status: 503});
  }
);
