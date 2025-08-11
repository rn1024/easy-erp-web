import React from 'react';
import { Space, Image } from 'antd';

/**
 * Components
 */
// import VideoPlayer from '@/components/ui/video-player';

/**
 * Constants
 */
const WEB2_ASSETS_URL = process.env.NEXT_PUBLIC_WEB2_ASSETS || '';

/**
 * Props
 */
type Props = {
  list: string[];
};

const ComponentTableCellMedia = ({ list }: Props): React.ReactNode => {
  if (!list) {
    return '-';
  }
  const children: React.ReactNode[] = [];
  list.forEach((src: string, index: number) => {
    if (!src) {
      return;
    }
    if (src.startsWith('video')) {
      children.push(<div key={index}>视频播放器组件已移除</div>);
    } else if (src.startsWith('image')) {
      children.push(<Image src={`${WEB2_ASSETS_URL}/${src}`} width={80} key={index} />);
    }
  });
  if (!children.length) {
    return '-';
  }
  return <Space wrap={true}>{children}</Space>;
};

export default ComponentTableCellMedia;
