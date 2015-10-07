import { applyMiddleware as reduxApplyMiddleware } from 'redux';
import createRenderer from './createRenderer';
import isPromise from 'is-promise';

/**
 * Decorates all middlewares before passing them to the original implementation.
 *
 * This allows us to catch promises returned at any point during a dispatch. We
 * can then add those to the promise store for delaying the rendering of the
 * output in the universal renderer.
 */
export default (...middlewares) => {
  // List of promises.
  const activePromises = [];

  // Adds a promise to the list of promises to watch.
  const addPromise = (promise, action) => {
    const item = [promise, action];
    activePromises.push(item);

    const removePromise = () => {
      const index = activePromises.indexOf(item);

      if (index !== -1) {
        activePromises.splice(index, 1);
      }
    };

    // Remove the promise from the list when it's fulfilled or rejected.
    promise.then(removePromise, removePromise);

    return removePromise;
  };

  // Returns the list of currently watched promises.
  const getPromises = () => activePromises.slice();

  // Decorate all passed middlewares.
  const decoratedMiddlewares = middlewares.map((original) => (api) => (next) => ((decorated) => (action) => {
    const result = decorated(action);
    if (isPromise(result)) {
      addPromise(result, action);
    }

    return result;
  })(original(api)(next)));

  return (next) => (reducer, initialState) => ({
    ...reduxApplyMiddleware(...decoratedMiddlewares)(next)(reducer, initialState),
    renderUniversal: createRenderer(getPromises),
  });
};
