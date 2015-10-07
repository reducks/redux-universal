import identifyAction from './identifyAction';

/**
 * Creates a universal render function.
 *
 * By interacting with the passed promise watcher and the store it ensures that
 * the rendering reiteratively continues until no further actions are dispatched
 * and all current promises are resolved.
 *
 * The inner workings of the repetitive rendering require that each watched
 * promise also dispatches an action when it is resolved or rejected. Using it
 * together with a middleware that handles promises from synchronous action
 * creators is encouraged.
 */
export default (getPromises) => {
  return (renderFn, element) => {
    return new Promise((resolve, reject) => {
      let seenPromises = [];
      let seenActions = {};
      let output = '';

      const render = () => {
        try {
          // Invoke the actual render function (e.g. ReactDOM.renderToString).
          output = renderFn(element);
          const activePromises = getPromises();

          const [ newPromises, newActions ] = activePromises
            .filter(([ promise ]) => seenPromises.indexOf(promise) === -1)
            .reduce(([ promiseA, actionA ], [ promiseB, actionB ]) => ([
              promiseA.concat(promiseB),
              actionA.concat(actionB),
            ]), [[], []]);

          const actionsWithoutDuplicates = newActions.reduce((map, action) => ({
            ...map, [identifyAction(action)]: action,
          }), {});

          const repeatedActionBodies = Object.keys(actionsWithoutDuplicates)
            .filter((key) => seenActions.hasOwnProperty(key))
            .map((key) => actionsWithoutDuplicates[key]);

          if (repeatedActionBodies.length) {
            const error = [
              `\n\x1b[33mRendering has been aborted to prevent an infinite loop. `,
              `The following asynchronous actions were called repeatedly in `,
              `successive rendering cycles:\x1b[0m\n\n`,
              ...repeatedActionBodies.map((action) => {
                if (typeof action === 'function') {
                  return action.toString();
                }

                return require('util').inspect(action, {
                  colors: true,
                  depth: 2,
                });
              }),
            ].join('');

            throw new Error(error);
          } else {
            seenPromises = seenPromises.concat(newPromises);
            seenActions = {...seenActions, ...actionsWithoutDuplicates};

            if (!activePromises.length) {
              resolve({ output });
            } else {
              // If any promises are left, re-render once the first promise has
              // been either resolved or rejected.
              Promise.race(activePromises.map(([ promise ]) => promise)).then(render, render);
            }
          }
        } catch (error) {
          reject({ output, error });
        }
      };

      render();
    });
  };
};
