import { util } from './util';

jest.mock('../externals/objectmodel');
jest.mock('../model/GridElement');

test('util.escapeHtml - Test 1 - html tags', () => {
    expect(util.escapeHtml('<img src=x onerror="alert(1)">')).toEqual('&#60;img src=x onerror=&#34;alert(1)&#34;&#62;');
});

test('util.escapeHtml - Test 2 - normal text', () => {
    expect(util.escapeHtml("Tom & Jerry's")).toEqual('Tom &#38; Jerry&#39;s');
    expect(util.escapeHtml('hello')).toEqual('hello');
});
