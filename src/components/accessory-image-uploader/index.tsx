import React, { useState, useEffect } from 'react';
import { Upload, Button, Image, message, Popconfirm, Space } from 'antd';
import { UploadOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { uploadBatchFiles } from '@/services/common';

interface AccessoryImage {
  id: string;
  resourceUrl: string;
  fileName: string;
  fileSize: number;
  sortOrder: number;
}

interface AccessoryImageUploaderProps {
  productId: string;
  value?: AccessoryImage[];
  disabled?: boolean;
  maxCount?: number;
  onChange?: (images: AccessoryImage[]) => void;
}

const AccessoryImageUploader: React.FC<AccessoryImageUploaderProps> = ({
  productId,
  value = [],
  disabled = false,
  maxCount = 20,
  onChange,
}) => {
  const [images, setImages] = useState<AccessoryImage[]>(value);
  const [uploading, setUploading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  // 模拟获取配件图片列表
  const fetchImages = async () => {
    if (!productId) return;

    try {
      // 这里应该调用实际的API获取配件图片
      // const response = await getAccessoryImagesApi(productId);
      // setImages(response.data.data || []);

      // 临时模拟数据
      setImages([]);
    } catch (error) {
      console.error('获取配件图片失败:', error);
    }
  };

  // 同步外部value
  useEffect(() => {
    if (JSON.stringify(value) !== JSON.stringify(images)) {
      setImages(value);
    }
  }, [value]);

  // 只在新增模式下（没有外部value）才自动加载
  useEffect(() => {
    if (productId && (!value || value.length === 0)) {
      fetchImages();
    }
  }, [productId, value]);

  // 上传前的处理
  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件!');
      return false;
    }

    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('图片大小不能超过 10MB!');
      return false;
    }

    return true;
  };

  // 自定义上传处理
  const customUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options;

    try {
      setUploading(true);

      // 调用批量上传API
      const uploadResponse = await uploadBatchFiles([file as File], 'accessory');

      if (
        (uploadResponse.data.code === 0 || uploadResponse.data.code === 200) &&
        uploadResponse.data.data.length > 0
      ) {
        const uploadedFile = uploadResponse.data.data[0];

        const imageData: AccessoryImage = {
          id: `temp-${Date.now()}`,
          resourceUrl: uploadedFile.fileUrl,
          fileName: uploadedFile.fileName,
          fileSize: (file as File).size,
          sortOrder: images.length + 1,
        };

        const newImages = [...images, imageData];
        setImages(newImages);
        onChange?.(newImages);

        onSuccess?.(imageData);
        message.success('配件图片上传成功');
      } else {
        throw new Error(uploadResponse.data.msg || '上传失败');
      }
    } catch (error: any) {
      console.error('上传失败:', error);
      onError?.(error as Error);
      message.error(error.message || '配件图片上传失败');
    } finally {
      setUploading(false);
    }
  };

  // 删除图片
  const handleDelete = async (imageId: string) => {
    try {
      // 这里应该调用实际的删除API
      // await deleteAccessoryImageApi(productId, imageId);

      const newImages = images.filter((img) => img.id !== imageId);
      setImages(newImages);
      onChange?.(newImages);
      message.success('删除成功');
    } catch (error) {
      console.error('删除失败:', error);
      message.error('删除失败');
    }
  };

  // 预览图片
  const handlePreview = (imageUrl: string) => {
    setPreviewImage(imageUrl);
    setPreviewVisible(true);
  };

  return (
    <div>
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* 上传按钮 */}
        <Upload
          customRequest={customUpload}
          beforeUpload={beforeUpload}
          showUploadList={false}
          disabled={disabled || images.length >= maxCount}
        >
          <Button
            icon={<UploadOutlined />}
            loading={uploading}
            disabled={disabled || images.length >= maxCount}
          >
            上传配件图片
          </Button>
        </Upload>

        {/* 图片列表 */}
        {images.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: '12px',
              marginTop: '12px',
            }}
          >
            {images.map((image) => (
              <div
                key={image.id}
                style={{
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                  padding: '8px',
                  position: 'relative',
                }}
              >
                <Image
                  src={image.resourceUrl}
                  alt={image.fileName}
                  width={100}
                  height={100}
                  style={{ objectFit: 'cover', borderRadius: '4px' }}
                  preview={false}
                />
                <div
                  style={{
                    marginTop: '4px',
                    fontSize: '12px',
                    color: '#666',
                    textAlign: 'center',
                    wordBreak: 'break-all',
                  }}
                >
                  {image.fileName}
                </div>
                <div
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    display: 'flex',
                    gap: '4px',
                  }}
                >
                  <Button
                    type="primary"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => handlePreview(image.resourceUrl)}
                    style={{ padding: '0 4px' }}
                  />
                  <Popconfirm
                    title="确定要删除这张配件图片吗？"
                    onConfirm={() => handleDelete(image.id)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button
                      type="primary"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      style={{ padding: '0 4px' }}
                    />
                  </Popconfirm>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 提示信息 */}
        <div style={{ fontSize: '12px', color: '#999' }}>
          已上传 {images.length}/{maxCount} 张配件图片
        </div>
      </Space>

      {/* 图片预览 */}
      <Image
        style={{ display: 'none' }}
        src={previewImage}
        preview={{
          visible: previewVisible,
          onVisibleChange: setPreviewVisible,
        }}
      />
    </div>
  );
};

export default AccessoryImageUploader;
