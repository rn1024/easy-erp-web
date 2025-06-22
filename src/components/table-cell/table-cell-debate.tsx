/**
 * Props
 */
type Props = {
  forText?: string;
  againstText?: string;
};

const ComponentTableCellDebate: React.FC<Props> = ({ forText, againstText }) => {
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
