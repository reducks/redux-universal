/**
 * Identify a given action.
 *
 * If the passed action is actually a function (e.g. when using the `thunk`
 * middleware) this creates a hased representation of the function body. If it
 * is a standard flux action with a type property, the type is returned.
 */
export default (action) => {
  if (typeof action !== 'function') {
    return action.type;
  }

  let hash = 0;
  const string = action.toString();
  for (const index of string) {
    const value = ((hash << 5) - hash) + string.charCodeAt(index);
    hash = value & value;
  }

  return Math.abs(hash);
};
