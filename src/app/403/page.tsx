'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Result, Button } from 'antd';

const Page403: React.FC = () => {
  const router = useRouter();

  return (
    <Result
      status="403"
      title="403"
      subTitle="Sorry, you are not authorized to access this page."
      extra={
        <Button type="primary" onClick={() => router.push('/')}>
          Back Home
        </Button>
      }
    />
  );
};

export default Page403;
