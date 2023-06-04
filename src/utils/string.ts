export const queryStringToObject = function queryStringToObject<T>(query: string): T {
  const obj: Record<string, string> = {};
  const params = query.split("&");
  const decode = (s: string) => decodeURIComponent(s.replace(/\+/gu, " "));
  params.forEach((pair) => {
    if (pair.trim()) {
      // Split on the first occurence of the '=' character
      const [key, value] = pair.split(/[=](?<temp1>.+)/gu, 2);
      if (key && value) obj[decode(key)] = decode(value);
    }
  });
  return obj as T;
};
