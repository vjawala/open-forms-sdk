import {HttpResponse, http} from 'msw';

import {BASE_URL} from '@/api-mocks';

import type {LanguageInfo} from './LanguageSelection';

export const DEFAULT_LANGUAGES: LanguageInfo['languages'] = [
  {code: 'nl', name: 'Nederlands'},
  {code: 'en', name: 'English'},
  // @ts-expect-error we deliberately add a 'foreign' language to test fallback behaviour
  {code: 'fy', name: 'frysk'},
];

export const mockLanguageInfoGet = (
  languages: LanguageInfo['languages'] = DEFAULT_LANGUAGES,
  current: LanguageInfo['current'] = 'nl'
) =>
  http.get(`${BASE_URL}i18n/info`, () =>
    HttpResponse.json<LanguageInfo>({
      languages: languages,
      current: current,
    })
  );

export const mockLanguageChoicePut = http.put(
  `${BASE_URL}i18n/language`,
  () => new HttpResponse(null, {status: 204})
);

export const mockInvalidLanguageChoicePut = (lang = 'fy') =>
  http.put(`${BASE_URL}i18n/language`, () =>
    HttpResponse.json(
      {
        type: 'http://localhost:8000/fouten/ValidationError/',
        code: 'invalid',
        title: 'Invalid input.',
        status: 400,
        detail: '',
        instance: 'urn:uuid:41e0174a-efc2-4cc0-9bf2-8366242a4e75',
        invalidParams: [
          {
            name: 'code',
            code: 'invalid_choice',
            reason: `"${lang}" is not a valid choice.`,
          },
        ],
      },
      {status: 400}
    )
  );
