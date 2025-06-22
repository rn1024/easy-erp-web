import { Form, Input, Select, Space } from 'antd';
import { useState } from 'react';
import { useIntl } from 'react-intl';

/**
 * Types
 */
import type { FormInstance } from 'antd';

type Props = {
  form?: FormInstance;
};

const SearchUser: React.FC<Props> = ({ form }) => {
  /**
   * Hooks
   */
  const { formatMessage } = useIntl();

  /**
   * States
   */
  const [type, setType] = useState('user_id');

  return (
    <Form.Item style={{ marginRight: 0 }}>
      <Space.Compact>
        <Select
          options={[
            {
              label: 'UID',
              value: 'user_id',
            },
            {
              label: formatMessage({ id: 't.c.nickname' }),
              value: 'nickname',
            },
            {
              label: formatMessage({ id: 't.c.username' }),
              value: 'username',
            },
          ]}
          style={{ width: 120 }}
          value={type}
          onChange={(value) => {
            form?.setFieldsValue({
              user_id: undefined,
              nickname: undefined,
              username: undefined,
            });

            setType(value);
          }}
        />

        {type === 'user_id' && (
          <Form.Item name="user_id" noStyle>
            <Input allowClear placeholder="UID" style={{ width: 200 }} />
          </Form.Item>
        )}

        {type === 'nickname' && (
          <Form.Item name="nickname" noStyle>
            <Input
              allowClear
              placeholder={formatMessage({ id: 't.c.nickname' })}
              style={{ width: 200 }}
            />
          </Form.Item>
        )}

        {type === 'username' && (
          <Form.Item name="username" noStyle>
            <Input
              allowClear
              placeholder={formatMessage({ id: 't.c.username' })}
              style={{ width: 200 }}
            />
          </Form.Item>
        )}
      </Space.Compact>
    </Form.Item>
  );
};

export default SearchUser;
