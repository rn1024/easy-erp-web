'use client';

import { useRequest } from 'ahooks';
import {
  App,
  Button,
  Col,
  Row,
  Upload,
  List,
  Image,
  Space,
  Typography,
  Tag,
  Divider,
  Flex,
} from 'antd';
import { ProCard } from '@ant-design/pro-components';
import {
  UploadOutlined,
  FileImageOutlined,
  VideoCameraOutlined,
  DeleteOutlined,
  CopyOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import type { UploadFile, UploadProps } from 'antd';

/**
 * APIs
 */
import axios from '@/services/index';

const { Text } = Typography;

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video';
  size: number;
  uploadTime: string;
}

const FilesPage: React.FC = () => {
  const { message } = App.useApp();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // 文件上传API
  const { loading: uploadLoading, run: uploadFile } = useRequest(
    async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      return axios.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    {
      manual: true,
      onSuccess: ({ data: { code, data, msg } }) => {
        if (code === 0) {
          message.success('文件上传成功');

          // 添加到已上传文件列表
          const newFile: UploadedFile = {
            id: Date.now().toString(),
            name: fileList[0]?.name || 'Unknown',
            url: data[0],
            type: fileList[0]?.type?.startsWith('image/') ? 'image' : 'video',
            size: fileList[0]?.size || 0,
            uploadTime: new Date().toLocaleString(),
          };

          setUploadedFiles((prev) => [newFile, ...prev]);
          setFileList([]);
        } else {
          message.error(msg || '上传失败');
        }
      },
      onError: (error) => {
        message.error('网络错误，请重试');
        console.error('Upload error:', error);
      },
    }
  );

  const uploadProps: UploadProps = {
    name: 'file',
    fileList,
    beforeUpload: (file) => {
      // 文件类型检查
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        message.error('只支持上传图片和视频文件');
        return Upload.LIST_IGNORE;
      }

      // 文件大小检查
      const isLt5M = file.size / 1024 / 1024 < 5;
      const isLt100M = file.size / 1024 / 1024 < 100;

      if (isImage && !isLt5M) {
        message.error('图片大小不能超过 5MB');
        return Upload.LIST_IGNORE;
      }

      if (isVideo && !isLt100M) {
        message.error('视频大小不能超过 100MB');
        return Upload.LIST_IGNORE;
      }

      return false; // 阻止自动上传
    },
    onChange: ({ fileList: newFileList }) => {
      setFileList(newFileList);
    },
    onRemove: () => {
      setFileList([]);
    },
  };

  const handleUpload = () => {
    if (fileList.length === 0) {
      message.warning('请先选择文件');
      return;
    }

    const file = fileList[0].originFileObj;
    if (file) {
      uploadFile(file);
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      message.success('URL 已复制到剪贴板');
    });
  };

  const handleDeleteFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== id));
    message.success('文件已删除');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const refresh = () => {
    // 刷新文件列表
    setUploadedFiles([]);
    setFileList([]);
    message.success('页面已刷新');
  };

  return (
    <>
      {/* 文件上传区域 */}
      <ProCard
        title="文件上传"
        extra={
          <Flex gap={8}>
            <Button icon={<ReloadOutlined />} onClick={refresh}>
              刷新
            </Button>
          </Flex>
        }
        className="mb-16"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Upload.Dragger {...uploadProps} style={{ marginBottom: 16 }} disabled={uploadLoading}>
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">
              支持单个文件上传。图片支持 JPG、PNG、GIF 格式，大小不超过 5MB； 视频支持 MP4、MOV
              格式，大小不超过 100MB。
            </p>
          </Upload.Dragger>

          {fileList.length > 0 && (
            <Button
              type="primary"
              onClick={handleUpload}
              loading={uploadLoading}
              style={{ width: '100%' }}
              icon={<UploadOutlined />}
            >
              开始上传
            </Button>
          )}
        </Space>
      </ProCard>

      {/* 已上传文件列表 */}
      <ProCard
        title={`已上传文件 (${uploadedFiles.length})`}
        extra={<Text type="secondary">最近上传的文件</Text>}
      >
        {uploadedFiles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Text type="secondary">暂无上传文件</Text>
          </div>
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={uploadedFiles}
            renderItem={(file) => (
              <List.Item
                actions={[
                  <Button
                    key="copy"
                    type="text"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopyUrl(file.url)}
                  >
                    复制链接
                  </Button>,
                  <Button
                    key="delete"
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteFile(file.id)}
                  >
                    删除
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    file.type === 'image' ? (
                      <Image
                        width={48}
                        height={48}
                        src={file.url}
                        style={{ objectFit: 'cover', borderRadius: 4 }}
                        fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
                      />
                    ) : (
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          backgroundColor: '#f0f0f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 4,
                        }}
                      >
                        <VideoCameraOutlined style={{ fontSize: 20, color: '#999' }} />
                      </div>
                    )
                  }
                  title={
                    <Space>
                      <Text strong>{file.name}</Text>
                      <Tag color={file.type === 'image' ? 'blue' : 'green'}>
                        {file.type === 'image' ? '图片' : '视频'}
                      </Tag>
                    </Space>
                  }
                  description={
                    <Space split={<Divider type="vertical" />}>
                      <Text type="secondary">大小: {formatFileSize(file.size)}</Text>
                      <Text type="secondary">上传时间: {file.uploadTime}</Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </ProCard>
    </>
  );
};

export default FilesPage;
