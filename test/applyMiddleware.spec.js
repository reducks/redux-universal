import { expect } from 'chai';
import applyMiddleware from '../src/applyMiddleware';
import { createStore } from 'redux';

const instantiateStore = (middlewares) => {
  const storeEnhancers = applyMiddleware(...middlewares);
  const enhancedCreateStore = storeEnhancers(createStore);
  const initialState = {
    isLoading: false,
  };
  const reducer = (state) => state;
  return enhancedCreateStore(reducer, initialState);
};

describe('a store decorated with the custom applyMiddleware', () => {
  it('should contain the renderUniversal function', () => {
    const store = instantiateStore([]);
    expect(store.renderUniversal).to.be.a('function');
  });

  it('should apply the passed middlewares', (done) => {
    const middleware = () => () => () => {
      done();
    };

    const store = instantiateStore([middleware]);
    store.dispatch({ type: 'DO_SOMETHING' });
  });

  it('should wait for generated promises when calling renderUniversal', () => {
    let counter = 0;

    const middleware = () => () => (action) => {
      return new Promise((resolve) => {
        setTimeout(() => resolve(action), 25);
      });
    };

    const store = instantiateStore([middleware]);

    const render = () => {
      if (counter === 0) {
        store.dispatch({ type: 'DO_SOMETHING' });
        counter++;
      }

      return 'output';
    };

    return expect(store.renderUniversal(render)).to.eventually.have.property('output');
  });
});
