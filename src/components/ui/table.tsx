import React from 'react';

/**
 * Types
 */
type Props = {
  children?: React.ReactNode;
};

export const Table: React.FC<Props> = (props) => {
  /**
   * Props
   */
  console.log('props :>> ', props);

  return <div>Table</div>;
};
