import { expect } from 'chai';
import createRenderer from '../src/createRenderer';

const createPromise = (milliseconds) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), milliseconds);
  });
};

describe('createRenderer', () => {
  let renderCalledCounter;

  const render = () => {
    renderCalledCounter++;
    return 'output';
  };

  beforeEach(() => {
    renderCalledCounter = 0;
  });

  it('should resolve right away in case no pormises are provided', () => {
    const renderUniversal = createRenderer(() => []);

    return renderUniversal(render).then((result) => {
      expect(renderCalledCounter).to.equal(1);
      expect(result.output).to.equal('output');
    });
  });

  it('should resolve after all provided promises are resolved', () => {
    const promiseA = createPromise(20);
    const promiseB = createPromise(10);
    const promiseC = createPromise(30);

    const renderUniversal = createRenderer(() => {
      if (renderCalledCounter === 1) {
        return [
          [promiseA, { type: 'DO_THIS' }],
          [promiseB, { type: 'DO_THAT' }],
          [promiseC, { type: 'DO_SOMETHING' }],
        ];
      }

      return [];
    });

    return renderUniversal(render).then((result) => {
      expect(promiseA).to.be.fulfilled; // eslint-disable-line no-unused-expressions
      expect(promiseB).to.be.fulfilled; // eslint-disable-line no-unused-expressions
      expect(promiseC).to.be.fulfilled; // eslint-disable-line no-unused-expressions
      expect(renderCalledCounter).to.equal(2);
      expect(result.output).to.equal('output');
    });
  });

  it('should resolve after all promises from a first and second render call', () => {
    const promiseA = createPromise(20);
    const promiseB = createPromise(10);

    const renderUniversal = createRenderer(() => {
      if (renderCalledCounter === 1) {
        return [[promiseA, { type: 'DO_THIS' }]];
      } else if (renderCalledCounter === 2) {
        return [[promiseB, { type: 'DO_THAT' }]];
      }

      return [];
    });

    return renderUniversal(render).then((result) => {
      expect(promiseA).to.be.fulfilled; // eslint-disable-line no-unused-expressions
      expect(promiseB).to.be.fulfilled; // eslint-disable-line no-unused-expressions
      expect(renderCalledCounter).to.equal(3);
      expect(result.output).to.equal('output');
    });
  });

  it('should bail out after seeing the same action type a second time to prevent an infinite loop', () => {
    const promiseA = createPromise(20);
    const promiseB = createPromise(10);

    const renderUniversal = createRenderer(() => {
      if (renderCalledCounter === 1) {
        return [[promiseA, { type: 'DO_THIS' }]];
      } else if (renderCalledCounter === 2) {
        return [[promiseB, { type: 'DO_THIS' }]];
      }

      return [];
    });

    return renderUniversal(render).catch((result) => {
      expect(promiseA).to.be.fulfilled; // eslint-disable-line no-unused-expressions
      expect(promiseB).to.be.fulfilled; // eslint-disable-line no-unused-expressions
      expect(renderCalledCounter).to.equal(2);
      expect(result.output).to.equal('output');
    });
  });

  it('should bail out after seeing the same function body a second time to prevent an infinite loop', () => {
    const promiseA = createPromise(20);
    const promiseB = createPromise(10);

    const renderUniversal = createRenderer(() => {
      if (renderCalledCounter === 1) {
        return [[promiseA, () => 42]];
      } else if (renderCalledCounter === 2) {
        return [[promiseB, () => 42]];
      }

      return [];
    });

    return renderUniversal(render).catch((result) => {
      expect(promiseA).to.be.fulfilled; // eslint-disable-line no-unused-expressions
      expect(promiseB).to.be.fulfilled; // eslint-disable-line no-unused-expressions
      expect(renderCalledCounter).to.equal(2);
      expect(result.output).to.equal('output');
    });
  });

  it('should be rejected in case no render functions is provided', () => {
    const renderUniversal = createRenderer(() => []);
    return expect(renderUniversal()).to.be.rejected;
  });
});
