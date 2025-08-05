'use client';

import React, { useState } from 'react';
import { Upload, Button, List, message, Popconfirm } from 'antd';
import { UploadOutlined, DeleteOutlined, DownloadOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import { uploadFile } from '@/services/common';
import type { ShipmentFileInfo } from '@/services/delivery';

interface ShipmentFileUploaderProps {
  value?: ShipmentFileInfo[];
  onChange?: (files: ShipmentFileInfo[]) => void;
  disabled?: boolean;
  maxCount?: number;
}

const ShipmentFileUploader: React.FC<ShipmentFileUploaderProps> = ({
  value = [],
  onChange,
  disabled = false,
  maxCount = 10,
}) => {
  const [uploading, setUploading] = useState(false);

  // 支持的文件类型
  const acceptedTypes = '.pdf,.rar,.zip';
  const acceptedMimeTypes = ['application/pdf', 'application/x-rar-compressed', 'application/zip'];

  // 文件大小限制 (50MB)
  const maxFileSize = 50 * 1024 * 1024;

  // 上传前验证
  const beforeUpload = (file: File) => {
    // 检查文件类型
    const isValidType = acceptedMimeTypes.includes(file.type) || 
      file.name.toLowerCase().endsWith('.pdf') ||
      file.name.toLowerCase().endsWith('.rar') ||
      file.name.toLowerCase().endsWith('.zip');
    
    if (!isValidType) {
      message.error('只支持上传 PDF、RAR、ZIP 格式的文件！');
      return false;
    }

    // 检查文件大小
    if (file.size > maxFileSize) {
      message.error('文件大小不能超过 50MB！');
      return false;
    }

    // 检查文件数量
    if (value.length >= maxCount) {
      message.error(`最多只能上传 ${maxCount} 个文件！`);
      return false;
    }

    return true;
  };

  // 自定义上传
  const customUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options;
    
    try {
      setUploading(true);
      const response = await uploadFile(file as File, 'shipment');
      
      if (response.data?.code === 0) {
        const newFile: ShipmentFileInfo = {
          id: Date.now().toString(), // 临时ID，后端会生成真实ID
          fileName: (file as File).name,
          fileUrl: response.data.data.fileUrl,
          fileSize: (file as File).size,
          fileType: (file as File).type || 'application/octet-stream',
        };
        
        const newFiles = [...value, newFile];
        onChange?.(newFiles);
        onSuccess?.(response.data.data);
        message.success('文件上传成功！');
      } else {
        throw new Error(response.data?.msg || '上传失败');
      }
    } catch (error: any) {
      onError?.(error);
      message.error(error.message || '文件上传失败！');
    } finally {
      setUploading(false);
    }
  };

  // 删除文件
  const handleDelete = (fileId: string) => {
    const newFiles = value.filter(file => file.id !== fileId);
    onChange?.(newFiles);
    message.success('文件删除成功！');
  };

  // 下载文件
  const handleDownload = (file: ShipmentFileInfo) => {
    const link = document.createElement('a');
    link.href = file.fileUrl;
    link.download = file.fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div>
      <Upload
        accept={acceptedTypes}
        beforeUpload={beforeUpload}
        customRequest={customUpload}
        showUploadList={false}
        disabled={disabled || uploading}
        multiple={false}
      >
        <Button 
          icon={<UploadOutlined />} 
          loading={uploading}
          disabled={disabled || value.length >= maxCount}
        >
          {uploading ? '上传中...' : '上传发货文件'}
        </Button>
      </Upload>
      
      <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
        支持 PDF、RAR、ZIP 格式，单个文件不超过 50MB，最多上传 {maxCount} 个文件
      </div>

      {value.length > 0 && (
        <List
          style={{ marginTop: 16 }}
          size="small"
          bordered
          dataSource={value}
          renderItem={(file) => (
            <List.Item
              actions={[
                <Button
                  key="download"
                  type="link"
                  size="small"
                  icon={<DownloadOutlined />}
                  onClick={() => handleDownload(file)}
                >
                  下载
                </Button>,
                !disabled && (
                  <Popconfirm
                    key="delete"
                    title="确定要删除这个文件吗？"
                    onConfirm={() => handleDelete(file.id)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button
                      type="link"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                    >
                      删除
                    </Button>
                  </Popconfirm>
                ),
              ].filter(Boolean)}
            >
              <List.Item.Meta
                title={file.fileName}
                description={`${formatFileSize(file.fileSize)} • ${file.fileType}`}
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );
};

export default ShipmentFileUploader;