import { FormattedMessage, useIntl } from 'react-intl';
import { Upload, Form, Drawer, App } from 'antd';
import { DownloadOutlined, InboxOutlined } from '@ant-design/icons';
import { get } from 'lodash';

const { Dragger } = Upload;

/**
 * Types
 */
import type { IntlShape } from 'react-intl';

type Props = {
  visible: boolean;
  templateHref: string;
  closeCallback: (reload?: boolean) => void;
  uploadApi: (options: any) => void;
};

let hideLoading: (() => void) | null = null;

const ComponentUploadDrawer: React.FC<Props> = ({
  visible,
  templateHref,
  closeCallback,
  uploadApi,
}) => {
  /**
   * Hooks
   */
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const intl: IntlShape = useIntl();

  const handleUploadChange = (info: any) => {
    closeCallback();
    if (!hideLoading && info.file.status === 'uploading') {
      hideLoading = message.loading(intl.formatMessage({ id: 'p.us.msg.uploading' }), 0);
      setTimeout(hideLoading, 5000);
    }
    if (info.file.status === 'done') {
      hideLoading?.();
      const response = info.file.response;
      const { success, total } = get(response, 'data.data', { success: 0, total: 0 });
      if (response.data.code === 0) {
        closeCallback(true);
        if (success === total) {
          message.success(intl.formatMessage({ id: 'c.importSuccess' }, { total: success }));
        } else {
          message.success(
            intl.formatMessage(
              { id: 'c.importPartSuccess' },
              { total: success, failCount: total - success }
            )
          );
        }
      } else {
        message.error(intl.formatMessage({ id: 'c.importError' }));
      }
    }
  };

  /**
   * ChildrenProps
   */
  const drawerProps = {
    title: <FormattedMessage id="b.import" />,
    width: 400,
    destroyOnHidden: true,
    maskClosable: false,
    onClose: () => {
      form.resetFields();
      closeCallback();
    },
    open: visible,
    footer: null,
  };

  return (
    <Drawer {...drawerProps}>
      <Form form={form}>
        <Form.Item name="file" style={{ marginBottom: 8 }}>
          <Dragger
            name="file"
            multiple={false}
            accept=".xlsx,.xls,.csv"
            maxCount={1}
            showUploadList={false}
            onChange={handleUploadChange}
            customRequest={uploadApi}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              <FormattedMessage id="p.us.ph.upload" />
            </p>
            <p className="ant-upload-hint">
              <FormattedMessage id="p.us.ph.uploadType" />
            </p>
          </Dragger>
        </Form.Item>
        <a href={templateHref}>
          <DownloadOutlined /> <FormattedMessage id="p.us.b.downloadTemplate" />
        </a>
      </Form>
    </Drawer>
  );
};

export default ComponentUploadDrawer;
