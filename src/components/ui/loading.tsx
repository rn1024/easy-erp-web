'use client';

import React from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import styles from './loading.module.css';

export interface LoadingProps {
  /** 加载样式类型 */
  type?: 'spin' | 'dots' | 'pulse' | 'bars' | 'bounce';
  /** 尺寸 */
  size?: 'small' | 'default' | 'large';
  /** 颜色主题 */
  theme?: 'primary' | 'secondary' | 'light' | 'dark';
  /** 显示文本 */
  text?: string;
  /** 是否居中显示 */
  centered?: boolean;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 自定义类名 */
  className?: string;
  /** 是否全屏覆盖 */
  overlay?: boolean;
}

const Loading: React.FC<LoadingProps> = ({
  type = 'spin',
  size = 'default',
  theme = 'primary',
  text,
  centered = false,
  style,
  className,
  overlay = false,
}) => {
  const renderSpinner = () => {
    switch (type) {
      case 'spin':
        return (
          <Spin
            indicator={<LoadingOutlined style={{ fontSize: getSizeValue() }} spin />}
            size={size}
          />
        );

      case 'dots':
        return (
          <div className={`${styles.dotsSpinner} ${styles[size]} ${styles[theme]}`}>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
            <div className={styles.dot}></div>
          </div>
        );

      case 'pulse':
        return (
          <div className={`${styles.pulseSpinner} ${styles[size]} ${styles[theme]}`}>
            <div className={styles.pulseRing}></div>
            <div className={styles.pulseRing}></div>
            <div className={styles.pulseRing}></div>
          </div>
        );

      case 'bars':
        return (
          <div className={`${styles.barsSpinner} ${styles[size]} ${styles[theme]}`}>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
            <div className={styles.bar}></div>
          </div>
        );

      case 'bounce':
        return (
          <div className={`${styles.bounceSpinner} ${styles[size]} ${styles[theme]}`}>
            <div className={styles.bounceBall}></div>
            <div className={styles.bounceBall}></div>
          </div>
        );

      default:
        return <Spin size={size} />;
    }
  };

  const getSizeValue = () => {
    switch (size) {
      case 'small':
        return 16;
      case 'large':
        return 32;
      default:
        return 24;
    }
  };

  const containerClasses = [
    styles.loadingContainer,
    centered && styles.centered,
    overlay && styles.overlay,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses} style={style}>
      <div className={styles.spinnerWrapper}>
        {renderSpinner()}
        {text && (
          <div className={`${styles.loadingText} ${styles[size]} ${styles[theme]}`}>{text}</div>
        )}
      </div>
    </div>
  );
};

// 全屏加载组件
export const FullScreenLoading: React.FC<Omit<LoadingProps, 'overlay' | 'centered'>> = (props) => {
  return <Loading {...props} overlay centered />;
};

// 页面加载组件
export const PageLoading: React.FC<Omit<LoadingProps, 'centered'>> = ({
  text = '加载中...',
  ...props
}) => {
  return (
    <div className={styles.pageLoading}>
      <Loading {...props} text={text} centered />
    </div>
  );
};

// 按钮加载组件
export const ButtonLoading: React.FC<{ size?: 'small' | 'default' }> = ({ size = 'small' }) => {
  return <Loading type="spin" size={size} />;
};

export default Loading;
