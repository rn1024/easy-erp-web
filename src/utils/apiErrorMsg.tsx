import { get } from 'lodash';

/**
 * Types
 */
import type { IntlShape } from 'react-intl';
import type { ResType } from '@/types/api';
import type { MessageInstance } from 'antd/es/message/interface';

type ErrorCodeMapValueType = {
  key: string;
  params?: Record<string, string>;
};

export type ErrorCodeMapType = Record<number, string | ErrorCodeMapValueType>;

/**
 * 接口响应自定义错误码信息显示。
 *
 * @param message antd message 实例
 * @param intl react-intl 国际化实例
 * @param errorMsgMap 定义得错误码与错误提示的映射
 * @param res 接口响应数据
 * @param defaultErrorMsg 默认错误信息， 默认为 Error
 */
export const apiErrorMsg = (
  message: MessageInstance,
  intl: IntlShape,
  errorMsgMap: ErrorCodeMapType,
  res: ResType<any>,
  defaultErrorMsg = 'Error'
) => {
  const msgValue = errorMsgMap[get(res, 'code')];
  if (msgValue) {
    if (typeof msgValue === 'string') {
      message.error(intl.formatMessage({ id: msgValue }));
    } else {
      message.error(intl.formatMessage({ id: msgValue.key }, msgValue.params));
    }
  } else {
    message.error(get(res, 'msg', defaultErrorMsg));
  }
};
