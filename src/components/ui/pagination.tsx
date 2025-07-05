import { Button, Flex, Select, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

type PaginationChangeProps = {
  page: number;
  searchAfter: string;
  size: number;
};

/**
 * Types
 */

export type PaginationProps = {
  current: number;
  hasMore: boolean;
  total: number;
  size: number;
  searchAfter: string;
  onChange?: (props: PaginationChangeProps) => void;
  isLoading?: boolean;
};

export const Pagination: React.FC<PaginationProps> = (props) => {
  /**
   * Hooks
   */
  const { formatMessage } = useIntl();

  /**
   * State
   */
  const [searchAfter, setSearchAfter] = useState<string[]>(['']);
  const [size, setSize] = useState<number>(props.size);

  /**
   * Props
   */
  const onSizeChange = (value: number) => {
    setSize(value);
    const lastSearchAfter = searchAfter.at(-2);
    setSearchAfter(searchAfter.slice(0, -1));
    props.onChange?.({
      page: props.current,
      searchAfter: lastSearchAfter || '',
      size: value,
    });
  };

  const onPrev = () => {
    const lastSearchAfter = searchAfter.at(-3);
    setSearchAfter(searchAfter.slice(0, -2));
    props.onChange?.({
      page: props.current - 1,
      searchAfter: lastSearchAfter || '',
      size,
    });
  };

  const onNext = () => {
    const lastSearchAfter = searchAfter.at(-1);
    if (lastSearchAfter) {
      props.onChange?.({
        page: props.current + 1,
        searchAfter: lastSearchAfter,
        size,
      });
    }
  };

  useEffect(() => {
    if (props.searchAfter && !searchAfter.includes(props.searchAfter)) {
      setSearchAfter((prev) => [...prev, props.searchAfter]);
    } else if (props.searchAfter === '' && searchAfter.length > 1) {
      setSearchAfter(['']);
    }
  }, [props.searchAfter]);

  return (
    <Flex style={{ marginTop: '16px' }} align="center" justify="end" gap={8}>
      <Typography.Text>
        {formatMessage({ id: 'p.total' })}: {props.total}
      </Typography.Text>
      <Typography.Text>
        {formatMessage({ id: 'p.page' })}: {props.current || 1}
      </Typography.Text>
      <Button loading={props.isLoading} disabled={searchAfter.length <= 2} onClick={onPrev}>
        {formatMessage({ id: 'b.prev' })}
      </Button>
      <Button
        type="primary"
        ghost
        loading={props.isLoading}
        disabled={!props.hasMore}
        onClick={onNext}
      >
        {formatMessage({ id: 'b.next' })}
      </Button>
      <Select
        style={{ width: 110 }}
        options={[
          { label: '10', value: 10 },
          { label: '20', value: 20 },
          { label: '50', value: 50 },
          { label: '100', value: 100 },
        ]}
        labelRender={(option) => {
          return (
            <div style={{ textAlign: 'center' }}>
              {option.label} / {formatMessage({ id: 'p.perPage' })}
            </div>
          );
        }}
        value={size}
        onChange={onSizeChange}
      />
    </Flex>
  );
};
