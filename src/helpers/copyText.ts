export const copyText = (text: string) => {
  return navigator.clipboard.writeText(text);
};
