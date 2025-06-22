'use client';

import { SmileOutlined } from '@ant-design/icons';
import { Result } from 'antd';
import { FormattedMessage } from 'react-intl';

const PageDashboard: React.FC = () => {
  return <Result icon={<SmileOutlined />} title={<FormattedMessage id="c.welcome" />} />;
};

export default PageDashboard;
