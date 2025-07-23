import { FormattedMessage, useIntl } from 'react-intl';
import { Upload, Form, Modal, App } from 'antd';
import { DownloadOutlined, InboxOutlined } from '@ant-design/icons';
import { get } from 'lodash';

/**
 * Types
 */
import type { IntlShape } from 'react-intl';

const { Dragger } = Upload;

type Props = {
  open: boolean;
  templateHref: string;
  closeModal: (reload?: boolean) => void;
  uploadApi: (options: any) => void;
};

let hideLoading: (() => void) | null = null;

const ComponentUploadModal: React.FC<Props> = ({ open, templateHref, closeModal, uploadApi }) => {
  /**
   * Hooks
   */
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const intl: IntlShape = useIntl();

  const handleUploadChange = (info: any) => {
    if (!hideLoading && info.file.status === 'uploading') {
      hideLoading = message.loading(intl.formatMessage({ id: 'p.us.msg.uploading' }), 0);
      setTimeout(hideLoading, 5000);
    }
    if (info.file.status === 'done') {
      hideLoading?.();
      const response = info.file.response;
      const { success, total } = get(response, 'data.data', { success: 0, total: 0 });
      if (response.data.code === 0 || response.data.code === 200) {
        closeModal(true);
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

  const handleCancel = () => {
    form.resetFields();
    closeModal();
  };

  /**
   * ModalProps
   */
  const modalProps = {
    title: <FormattedMessage id="b.import" />,
    open: open,
    onCancel: handleCancel,
    footer: null,
    width: 520,
    centered: true,
    destroyOnClose: true,
    maskClosable: false,
  };

  return (
    <Modal {...modalProps}>
      <Form form={form}>
        <Form.Item name="file" style={{ marginBottom: 16 }}>
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
        <div style={{ textAlign: 'center' }}>
          <a href={templateHref}>
            <DownloadOutlined /> <FormattedMessage id="p.us.b.downloadTemplate" />
          </a>
        </div>
      </Form>
    </Modal>
  );
};

export default ComponentUploadModal;
