'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, Image, Button, Card, Space, App, Popconfirm, Tooltip, Badge } from 'antd';
import {
  UploadOutlined,
  DeleteOutlined,
  StarOutlined,
  StarFilled,
  DragOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { uploadBatchFiles } from '@/services/common';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FormattedMessage, useIntl } from 'react-intl';
import type { IntlShape } from 'react-intl';
import type { ProductImage } from '@/services/products';

const { Dragger } = Upload;

interface ProductImageUploaderProps {
  productId?: string; // 可选，用于编辑模式
  value?: ProductImage[];
  onChange?: (images: ProductImage[]) => void;
  maxCount?: number;
  disabled?: boolean;
}

interface SortableImageCardProps {
  image: ProductImage;
  onDelete: (imageId: string) => void;
  onSetCover: (imageId: string) => void;
  onPreview: (imageUrl: string) => void;
  disabled?: boolean;
}

// 可排序的图片卡片组件
const SortableImageCard: React.FC<SortableImageCardProps> = ({
  image,
  onDelete,
  onSetCover,
  onPreview,
  disabled,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const intl: IntlShape = useIntl();

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card
        size="small"
        hoverable={!disabled}
        style={{
          width: 120,
          height: 140,
          position: 'relative',
        }}
        bodyStyle={{ padding: 4 }}
        cover={
          <div style={{ position: 'relative', height: 80, overflow: 'hidden' }}>
            <Image
              src={image.imageUrl}
              alt={image.fileName}
              width="100%"
              height={80}
              style={{ objectFit: 'cover' }}
              preview={false}
            />
            {image.isCover && (
              <Badge
                count={<StarFilled style={{ color: '#faad14' }} />}
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                }}
              />
            )}
          </div>
        }
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space size="small">
            <Tooltip
              title={intl.formatMessage({ id: 'button.preview' }, { defaultMessage: '预览' })}
            >
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => onPreview(image.imageUrl)}
                disabled={disabled}
              />
            </Tooltip>

            <Tooltip
              title={
                image.isCover
                  ? intl.formatMessage({ id: 'product.image.cover' }, { defaultMessage: '封面图' })
                  : intl.formatMessage(
                      { id: 'product.image.setCover' },
                      { defaultMessage: '设为封面' }
                    )
              }
            >
              <Button
                type="text"
                size="small"
                icon={image.isCover ? <StarFilled /> : <StarOutlined />}
                onClick={() => onSetCover(image.id)}
                disabled={disabled || image.isCover}
                style={{ color: image.isCover ? '#faad14' : undefined }}
              />
            </Tooltip>

            <Popconfirm
              title={intl.formatMessage(
                { id: 'product.image.deleteConfirm' },
                { defaultMessage: '确认删除这张图片吗？' }
              )}
              onConfirm={() => onDelete(image.id)}
              disabled={disabled}
            >
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                danger
                disabled={disabled}
              />
            </Popconfirm>
          </Space>

          <Button
            type="text"
            size="small"
            icon={<DragOutlined />}
            style={{ cursor: 'grab' }}
            disabled={disabled}
            {...listeners}
          />
        </div>

        <div style={{ fontSize: 11, color: '#666', marginTop: 2, textAlign: 'center' }}>
          {Math.round(image.fileSize / 1024)}KB
        </div>
      </Card>
    </div>
  );
};

const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({
  productId,
  value = [],
  onChange,
  maxCount = 10,
  disabled = false,
}) => {
  const [images, setImages] = useState<ProductImage[]>(value);
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  const { message } = App.useApp();
  const intl: IntlShape = useIntl();

  const sensors = useSensors(useSensor(PointerSensor));

  // 同步外部value
  useEffect(() => {
    if (JSON.stringify(value) !== JSON.stringify(images)) {
      setImages(value);
    }
  }, [value]);

  // 触发onChange回调
  const triggerChange = useCallback((newImages: ProductImage[]) => {
    setImages(newImages);
    onChange?.(newImages);
  }, [onChange]);

  // 自定义上传处理
  const customUpload = useCallback(async (options: any) => {
    const { file, onSuccess, onError } = options;

    try {
      setUploading(true);

      // 调用批量上传API
      const uploadResponse = await uploadBatchFiles([file], 'image');

      if (
        (uploadResponse.data.code === 0 || uploadResponse.data.code === 200) &&
        uploadResponse.data.data.length > 0
      ) {
        const uploadedFile = uploadResponse.data.data[0];

        // 创建临时图片数据
        const tempImage: ProductImage = {
          id: `temp-${Date.now()}`,
          productId: productId || '',
          imageUrl: uploadedFile.fileUrl,
          fileName: uploadedFile.fileName || file.name,
          fileSize: file.size,
          sortOrder: images.length + 1,
          isCover: images.length === 0, // 第一张自动设为封面
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        const newImages = [...images, tempImage];
        triggerChange(newImages);
        onSuccess(tempImage);
        message.success(
          intl.formatMessage({ id: 'upload.success' }, { defaultMessage: '上传成功' })
        );
      } else {
        throw new Error(uploadResponse.data.msg || '上传失败');
      }
    } catch (error: any) {
      console.error('上传失败:', error);
      message.error(
        error.message || intl.formatMessage({ id: 'upload.failed' }, { defaultMessage: '上传失败' })
      );
      onError(error);
    } finally {
      setUploading(false);
    }
  }, [productId, images, triggerChange, message, intl]);

  // 删除图片
  const handleDelete = useCallback(async (imageId: string) => {
    try {
      const newImages = images.filter((img) => img.id !== imageId);
      // 重新排序
      const reorderedImages = newImages.map((img, index) => ({
        ...img,
        sortOrder: index + 1,
      }));
      triggerChange(reorderedImages);
      message.success(intl.formatMessage({ id: 'delete.success' }, { defaultMessage: '删除成功' }));
    } catch (error: any) {
      console.error('删除图片失败:', error);
      message.error(intl.formatMessage({ id: 'delete.failed' }, { defaultMessage: '删除失败' }));
    }
  }, [images, triggerChange, message, intl]);

  // 设置封面图
  const handleSetCover = useCallback(async (imageId: string) => {
    try {
      const newImages = images.map((img) => ({
        ...img,
        isCover: img.id === imageId,
      }));
      triggerChange(newImages);
      message.success(
        intl.formatMessage(
          { id: 'product.image.setCoverSuccess' },
          { defaultMessage: '封面设置成功' }
        )
      );
    } catch (error: any) {
      console.error('设置封面失败:', error);
      message.error(
        intl.formatMessage(
          { id: 'product.image.setCoverFailed' },
          { defaultMessage: '设置封面失败' }
        )
      );
    }
  }, [images, triggerChange, message, intl]);

  // 预览图片
  const handlePreview = useCallback((imageUrl: string) => {
    setPreviewImage(imageUrl);
    setPreviewOpen(true);
  }, []);

  // 拖拽排序
  const handleDragEnd = useCallback(async (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id);
      const newIndex = images.findIndex((img) => img.id === over.id);

      const newImages = arrayMove(images, oldIndex, newIndex);

      // 更新排序
      const updatedImages = newImages.map((img: ProductImage, index: number) => ({
        ...img,
        sortOrder: index + 1,
      }));
      triggerChange(updatedImages);
      message.success(
        intl.formatMessage(
          { id: 'product.image.sortSuccess' },
          { defaultMessage: '排序更新成功' }
        )
      );
    }
  }, [images, triggerChange, message, intl]);

  // 上传属性
  const uploadProps = {
    name: 'files',
    multiple: true,
    accept: 'image/*',
    customRequest: customUpload,
    showUploadList: false,
    disabled: disabled || images.length >= maxCount,
  };

  return (
    <div>
      {/* 上传区域 */}
      {images.length < maxCount && (
        <div style={{ marginBottom: 16 }}>
          <Dragger {...uploadProps} style={{ height: 100 }}>
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">
              <FormattedMessage
                id="product.image.uploadHint"
                defaultMessage="点击或拖拽图片到此区域上传"
              />
            </p>
            <p className="ant-upload-hint">
              <FormattedMessage
                id="product.image.uploadLimit"
                defaultMessage={`支持 JPG、PNG、GIF 格式，单张图片不超过 10MB，最多 ${maxCount} 张`}
                values={{ maxCount }}
              />
            </p>
          </Dragger>
        </div>
      )}

      {/* 图片网格 */}
      {images.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={images.map((img) => img.id)}
            strategy={verticalListSortingStrategy}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: 8,
                marginTop: 16,
              }}
            >
              {images.map((image) => (
                <SortableImageCard
                  key={image.id}
                  image={image}
                  onDelete={handleDelete}
                  onSetCover={handleSetCover}
                  onPreview={handlePreview}
                  disabled={disabled}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* 图片预览 */}
      <Image
        wrapperStyle={{ display: 'none' }}
        preview={{
          visible: previewOpen,
          src: previewImage,
          onVisibleChange: (visible) => setPreviewOpen(visible),
        }}
      />

      {/* 图片数量提示 */}
      {images.length > 0 && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#666', textAlign: 'right' }}>
          <FormattedMessage
            id="product.image.count"
            defaultMessage="{count} / {maxCount} 张图片"
            values={{ count: images.length, maxCount }}
          />
        </div>
      )}
    </div>
  );
};

export default ProductImageUploader;
