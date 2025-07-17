import { useBoolean } from 'ahooks';
import { get } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import { App, Button, Modal, Space, Descriptions, Tag, Image } from 'antd';
import { ShopOutlined, TagOutlined, PictureOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

/**
 * Utils
 */
import { apiErrorMsg } from '@/utils/apiErrorMsg';

/**
 * Types
 */
import type { ModalProps } from 'antd';
import type { IntlShape } from 'react-intl';
import type { ProductInfo } from '@/services/products';

type Props = {
  open: boolean;
  entity: ProductInfo | null;
  closeModal: () => void;
};

const ProductDetailModal: React.FC<Props> = ({ open, entity, closeModal }) => {
  /**
   * Hooks
   */
  const { message } = App.useApp();
  const intl: IntlShape = useIntl();

  /**
   * Handlers
   */
  const handleCancel = () => {
    closeModal();
  };

  /**
   * ModalProps
   */
  const modalProps: ModalProps = {
    title: `产品详情 - ${entity?.code || ''}`,
    open: open,
    onCancel: handleCancel,
    footer: (
      <Button type="primary" onClick={handleCancel}>
        关闭
      </Button>
    ),
    width: 1200,
    centered: true,
    bodyStyle: { maxHeight: '70vh', overflowY: 'auto' },
  };

  if (!entity) {
    return null;
  }

  return (
    <Modal {...modalProps}>
      <div className="mt-4">
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="产品编码">{entity.code}</Descriptions.Item>
          <Descriptions.Item label="SKU">{entity.sku}</Descriptions.Item>
          <Descriptions.Item label="ASIN">{entity.asin || '-'}</Descriptions.Item>
          <Descriptions.Item label="所属店铺">
            <Tag icon={<ShopOutlined />} color="blue">
              {entity.shop?.nickname || '未知店铺'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="产品分类">
            <Tag icon={<TagOutlined />} color="green">
              {entity.category?.name || '未分类'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="规格">{entity.specification || '-'}</Descriptions.Item>
          <Descriptions.Item label="颜色">{entity.color || '-'}</Descriptions.Item>
          <Descriptions.Item label="重量">
            {entity.weight ? `${entity.weight}g` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="套装数量">{entity.setQuantity || '-'}</Descriptions.Item>
          <Descriptions.Item label="内部尺寸">{entity.internalSize || '-'}</Descriptions.Item>
          <Descriptions.Item label="外部尺寸">{entity.externalSize || '-'}</Descriptions.Item>
          <Descriptions.Item label="标签">{entity.label || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {dayjs(entity.createdAt).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
          <Descriptions.Item label="款式信息" span={2}>
            {entity.styleInfo || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="配件信息" span={2}>
            {entity.accessoryInfo || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="备注" span={2}>
            {entity.remark || '-'}
          </Descriptions.Item>
        </Descriptions>

        {entity.imageUrl && (
          <div className="mt-4">
            <h4 className="mb-2">产品图片</h4>
            <Image
              width={200}
              src={entity.imageUrl}
              style={{ objectFit: 'cover', borderRadius: '4px' }}
              fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYnN"
            />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ProductDetailModal;
