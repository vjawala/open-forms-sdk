import type {AnyComponentSchema} from '@open-formulieren/types';

export interface FormioConfiguration {
  type?: 'form';
  components: AnyComponentSchema[];
}
