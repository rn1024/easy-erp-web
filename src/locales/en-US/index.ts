import { flattenObject } from '@/utils';

/**
 * Resources
 */
// Common
import common from './common';

// Menu
import menu from './menu';

// Permission
import permission from './permission';

const enUSIndex = {
  // Common
  ...flattenObject(common),

  // Menu
  ...flattenObject(menu),

  // Permission
  ...flattenObject(permission),
};

export default enUSIndex;
