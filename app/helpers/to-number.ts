export default (text: string) => {
  const num = parseInt(text);
  return isNaN(num) ? undefined : num;
};