export const PACKAGE_TYPE_ENUM = {
  box: '盒装',
  bag: '袋装',
  bottle: '瓶装',
  tube: '管装',
  other: '其他',
} as const;

export type PackageTypeKey = keyof typeof PACKAGE_TYPE_ENUM;

export const PACKAGE_TYPE_OPTIONS = Object.entries(PACKAGE_TYPE_ENUM).map(([value, label]) => ({
  value,
  label,
}));

export const getPackageTypeLabel = (type: string | undefined | null): string => {
  if (!type) return '-';
  return PACKAGE_TYPE_ENUM[type as PackageTypeKey] || type;
};