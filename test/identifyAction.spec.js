import { expect } from 'chai';
import identifyAction from '../src/identifyAction';

describe('identifyAction', () => {
  it('should returns the action\'s type in case the action is an object', () => {
    const action = {
      type: 'DO_SOMETHING',
    };
    expect(identifyAction(action)).to.equal('DO_SOMETHING');
  });

  it('should return the hash of the function\'s body in case the action is a function', () => {
    const actionA = () => 42;
    const actionB = () => 41;
    expect(identifyAction(actionA)).to.equal(1475036588);
    expect(identifyAction(actionB)).to.equal(789807045);
  });
});
