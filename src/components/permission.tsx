import { useLocalStorageState } from 'ahooks';

/**
 * Types
 */
type Props = {
  children: React.ReactNode;
  permission: string;
};

const Permission: React.FC<Props> = ({ children, permission }) => {
  const [permissions] = useLocalStorageState<string[]>('permissions', {
    defaultValue: [],
    listenStorageChange: true,
  });

  if (permissions?.includes('super_admin') || permissions?.includes(permission)) {
    return children;
  }

  return null;
};

export const useAccess: () => (permission: string) => boolean | undefined = () => {
  const [permissions] = useLocalStorageState<string[]>('permissions', {
    defaultValue: [],
    listenStorageChange: true,
  });

  return (permission: string) => {
    return permissions?.includes('super_admin') || permissions?.includes(permission);
  };
};

export default Permission;
