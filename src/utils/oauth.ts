import { encode } from "./base64";
import { generateGuid } from "./uuid";

interface LibraryStateObject {
  id: string;
  meta?: Record<string, string>;
}

export const setRequestState = function setRequestState(userState?: string, meta?: Record<string, string>): string {
  const stateObj: LibraryStateObject = {
    id: generateGuid(),
  };

  if (meta) stateObj.meta = meta;

  const stateString: string = JSON.stringify(stateObj);
  const libraryState: string = encode(stateString);

  return userState ? `${libraryState}|${userState}` : libraryState;
};
