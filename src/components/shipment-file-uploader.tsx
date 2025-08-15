'use client';

import React, { useState } from 'react';
import { Upload, Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { uploadFile } from '@/services/common';

interface ShipmentFileUploaderProps {
  value?: string;
  onChange?: (fileUrl: string | undefined) => void;
  disabled?: boolean;
}

const ShipmentFileUploader: React.FC<ShipmentFileUploaderProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);

  // 支持的文件类型
  const acceptedTypes = '.pdf,.rar,.zip';

  // 上传前验证
  const beforeUpload = (file: File) => {
    const isPDF = file.type === 'application/pdf';
    const isRAR = file.type === 'application/x-rar-compressed' || file.name.toLowerCase().endsWith('.rar');
    const isZIP = file.type === 'application/zip' || file.name.toLowerCase().endsWith('.zip');
    
    if (!isPDF && !isRAR && !isZIP) {
      message.error('只能上传 PDF、RAR、ZIP 文件!');
      return false;
    }
    
    const isLt50M = file.size / 1024 / 1024 < 50;
    if (!isLt50M) {
      message.error('文件大小必须小于 50MB!');
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
      
      if (response.data.code === 0 || response.data.code === 200) {
        onChange?.(response.data.data.fileUrl);
        onSuccess?.(response.data.data);
        message.success('发货文件上传成功');
      } else {
        throw new Error(response.data.msg || '上传失败');
      }
    } catch (error: any) {
      onError?.(error);
      message.error(error.message || '发货文件上传失败');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <Upload
        accept={acceptedTypes}
        beforeUpload={beforeUpload}
        customRequest={customUpload}
        fileList={fileList}
        onChange={(info) => {
          setFileList(info.fileList);
          // 如果文件被删除，清空表单字段
          if (info.fileList.length === 0) {
            onChange?.(undefined);
          }
        }}
        disabled={disabled || uploading}
        maxCount={1}
      >
        <Button 
          icon={<UploadOutlined />} 
          loading={uploading}
          disabled={disabled}
        >
          {uploading ? '上传中...' : '上传发货文件'}
        </Button>
      </Upload>
      
      <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
        支持 PDF、RAR、ZIP 格式，单个文件不超过 50MB
      </div>
      
      {value && (
        <div style={{ marginTop: 8, color: '#1890ff' }}>
          已上传文件: <a href={value} target="_blank" rel="noopener noreferrer">查看文件</a>
        </div>
      )}
    </div>
  );
};

export default ShipmentFileUploader;