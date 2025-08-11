/**
 * Props
 */
type Props = {
  forText?: string;
  againstText?: string;
};

const ComponentTableCellDebate = ({ forText, againstText }: Props): React.ReactNode => {
  if (!forText && !againstText) {
    return '-';
  }
  return (
    <div>
      <div>正方：{forText || '-'}</div>
      <div>反方：{againstText || '-'}</div>
    </div>
  );
};

export default ComponentTableCellDebate;
