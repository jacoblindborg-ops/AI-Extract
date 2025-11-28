/**
 * Styled Components Theme Type Declarations
 */

import 'styled-components';
import type { Theme } from 'akeneo-design-system';

declare module 'styled-components' {
  export interface DefaultTheme extends Theme {}
}
