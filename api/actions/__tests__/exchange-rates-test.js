import {expect} from 'chai';
import sinon from 'sinon';
import axios from 'axios';
import redis from 'redis';
import exchangeRatesJson from './fixtures/exchangeRates';

describe('exchange rates load', () => {
  describe('successful', () => {
    let exchangeRateRequest = null;
    let redisStub = null;

    afterEach(function() {
      redisStub.restore();
      exchangeRateRequest.restore();
    });

    beforeEach(function () {
      redisStub = sinon.stub(redis, 'createClient').returns({
        hgetallAsync: sinon.stub().returns(null),
        HMSETAsync: sinon.stub().returns(null)
      });
      exchangeRateRequest = sinon.stub(axios, 'get').callsFake((requestUrl) => {
        const urlSplit = requestUrl.split('/');
        const currencyPair = urlSplit[urlSplit.length - 1];
        const found = exchangeRatesJson.find(item => {
          return `${item.ticker.base}-${item.ticker.target}`.toLowerCase() === currencyPair.toLowerCase();
        });
        return Promise.resolve({
          data: found
        });
      });
    });

    it('gets 10 exchange rates', async function() {
      const result = await require('../exchange-rates').load();
      expect(result).to.has.length(10);
    });

    it('has englishName added to every exchange rate', async function() {
      const result = await require('../exchange-rates').load();
      result.forEach(v => {
        expect(v.ticker.baseEnglishName).to.not.be.empty;
      });
    });
  });
});
