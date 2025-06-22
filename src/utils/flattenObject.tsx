import { forOwn, isObject } from 'lodash';

export function flattenObject(
  obj: Record<string, any>,
  parentKey = '',
  result: Record<string, any> = {}
) {
  forOwn(obj, (value, key) => {
    const newKey = parentKey ? `${parentKey}.${key}` : key;

    if (isObject(value)) {
      flattenObject(value, newKey, result);
    } else {
      result[newKey] = value;
    }
  });

  return result;
}
