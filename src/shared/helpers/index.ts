export const RemoveSpecialChar = (val: string): string => {
  return val.replace(/[^a-zA-Z0-9 ]/g, '');
};
