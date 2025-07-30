'use client';

import { useRequest, useSetState } from 'ahooks';
import { App, Button, Col, Form, Input, Row, Space, Spin, Typography } from 'antd';
import dayjs from 'dayjs';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import store from 'store2';

/**
 * APIs
 */
import { captcha, login } from '@/services/auth';

/**
 * Styles
 */
import styles from './styles.module.css';

const LoginForm: React.FC = () => {
  /**
   * Params
   */
  const params = useSearchParams();

  /**
   * Hooks
   */
  const { message } = App.useApp();
  const intl = useIntl();

  const [form] = Form.useForm();

  /**
   * States
   */
  const [state, setState] = useSetState({
    captcha: '',
    key: '',
  });

  /**
   * Requests
   */
  const { loading: loadingCaptcha, run: runCaptcha } = useRequest(captcha, {
    manual: true,
    onSuccess({ data: { code, data, msg } }) {
      if (code !== 0) {
        return message.error(msg);
      }

      setState(data);
    },
  });

  const { loading: loadingLogin, run: runLogin } = useRequest(login, {
    manual: true,
    async onSuccess({ data: { code, data, msg } }) {
      if (code !== 0) {
        return message.error(msg);
      }

      // 使用tokenManager保存token数据
      const { tokenManager } = await import('@/services/token');
      tokenManager.storeTokens({
        token: data.token,
        refreshToken: data.refreshToken,
        user: data.user,
        roles: data.roles,
        permissions: data.permissions,
      });

      // 等待一小段时间确保token保存完成
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 跳转到目标页面
      const redirectParam = params.get('redirect');
      const redirectUrl = redirectParam ? decodeURIComponent(redirectParam) : '/dashboard';

      console.log('登录成功，准备跳转到:', redirectUrl);

      // 使用 window.location.href 进行跳转
      window.location.href = redirectUrl;
    },
  });

  /**
   * Effects
   */
  useEffect(() => {
    // 组件加载时自动获取验证码
    runCaptcha();
  }, []);

  /**
   * Events
   */
  const onSubmit = () => {
    form
      .validateFields()
      .then((value) => {
        runLogin({
          ...value,
          captcha: value.captcha.toLowerCase(),
          key: state.key,
        });
      })
      .catch(() => {});
  };

  return (
    <Row className={styles['auth-login']}>
      <Col span={12}>
        <Row className={styles['auth-login-form']} justify="space-between">
          <Col className="p-24">
            <Space>
              <img alt="" className={styles['auth-login-logo']} src="/favicon.svg" />

              <strong>ERP Admin</strong>
            </Space>
          </Col>

          <Col className={styles['auth-login-form-wrap']}>
            <Typography.Title className="mb-24" level={2}>
              <FormattedMessage id="b.login" />
            </Typography.Title>

            <Form form={form} layout="vertical">
              <Form.Item
                name="username"
                label={<FormattedMessage id="t.c.account" />}
                rules={[
                  {
                    message: intl.formatMessage(
                      { id: 'c.pleaseInput' },
                      { key: intl.formatMessage({ id: 't.c.account' }) }
                    ),
                    required: true,
                  },
                ]}
              >
                <Input size="large" onPressEnter={onSubmit} />
              </Form.Item>

              <Form.Item
                name="password"
                label={<FormattedMessage id="c.password" />}
                rules={[
                  {
                    message: intl.formatMessage(
                      { id: 'c.pleaseInput' },
                      { key: intl.formatMessage({ id: 'c.password' }) }
                    ),
                    required: true,
                  },
                ]}
              >
                <Input.Password size="large" onPressEnter={onSubmit} />
              </Form.Item>

              <Form.Item
                name="captcha"
                label="验证码"
                rules={[{ message: '请输入验证码', required: true }]}
              >
                <Row gutter={8}>
                  <Col flex="auto">
                    <Input size="large" onPressEnter={onSubmit} />
                  </Col>

                  <Col flex="none">
                    <Spin spinning={loadingCaptcha}>
                      {state.captcha ? (
                        <img
                          alt=""
                          height={40}
                          src={state.captcha}
                          style={{ cursor: 'pointer' }}
                          width={100}
                          onClick={runCaptcha}
                        />
                      ) : (
                        <div
                          style={{
                            width: 100,
                            height: 40,
                            background: '#f5f5f5',
                            border: '1px solid #d9d9d9',
                            borderRadius: 6,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: 12,
                            color: '#999',
                          }}
                          onClick={runCaptcha}
                        >
                          点击刷新
                        </div>
                      )}
                    </Spin>
                  </Col>
                </Row>
              </Form.Item>
            </Form>

            <Button block loading={loadingLogin} size="large" type="primary" onClick={onSubmit}>
              <FormattedMessage id="b.login" />
            </Button>
          </Col>

          <Col className="p-24">
            Copyright &copy; {dayjs().format('YYYY')} CMS Enterprise Limited. v1.17.0+20250226
          </Col>
        </Row>
      </Col>

      <Col span={12}>
        <img alt="" className={styles['auth-login-image']} src="/auth/background.jpg" />
      </Col>
    </Row>
  );
};

const PageLogin: React.FC = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
};

export default PageLogin;
