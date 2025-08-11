import { useBoolean } from 'ahooks';
import { get } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import { App, Button, Modal, Space, Descriptions, Tag, Image, Divider, Row, Col } from 'antd';
import { ShopOutlined, TagOutlined, PictureOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

/**
 * Utils
 */
import { apiErrorMsg } from '@/utils/apiErrorMsg';

/**
 * Components
 */
import ProductCostManager from '@/components/ProductCostManager';

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
          <Descriptions.Item label="包装类型">{entity.packageType || '-'}</Descriptions.Item>
          <Descriptions.Item label="包装外尺寸">{entity.packageOuterSize || '-'}</Descriptions.Item>
          <Descriptions.Item label="包装内尺寸">{entity.packageInnerSize || '-'}</Descriptions.Item>
          <Descriptions.Item label="包装重量">
            {entity.packageWeight ? `${entity.packageWeight}g` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="外箱尺寸">{entity.outerBoxSize || '-'}</Descriptions.Item>
          <Descriptions.Item label="标签文件">
            {entity.labelFileUrl ? (
              <a href={entity.labelFileUrl} target="_blank" rel="noopener noreferrer">
                查看文件
              </a>
            ) : (
              '-'
            )}
          </Descriptions.Item>
        </Descriptions>

        {entity.images && entity.images.length > 0 && (
          <div className="mt-4">
            <Divider orientation="left">产品图片 ({entity.images.length}张)</Divider>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {entity.images.map((image) => (
                <div key={image.id} style={{ position: 'relative' }}>
                  <Image
                    width={100}
                    height={100}
                    src={image.imageUrl}
                    style={{ objectFit: 'cover', borderRadius: '4px' }}
                  />
                  {image.isCover && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        background: '#faad14',
                        color: 'white',
                        fontSize: 10,
                        padding: '2px 4px',
                        borderRadius: 2,
                      }}
                    >
                      封面
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {entity.accessoryImages && entity.accessoryImages.length > 0 && (
          <div className="mt-4">
            <Divider orientation="left">配件图片 ({entity.accessoryImages.length}张)</Divider>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {entity.accessoryImages.map((image) => (
                <Image
                  key={image.id}
                  src={image.resourceUrl}
                  alt={image.fileName}
                  width={100}
                  height={100}
                  style={{ objectFit: 'cover', borderRadius: 4 }}
                />
              ))}
            </div>
          </div>
        )}

        <div className="mt-4">
          <Divider orientation="left">成本信息</Divider>
          <ProductCostManager 
            productId={entity.id} 
            costs={entity.costs || []} 
            readonly={true} 
          />
        </div>
      </div>
    </Modal>
  );
};

export default ProductDetailModal;
