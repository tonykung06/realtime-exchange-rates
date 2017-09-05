const LOAD = 'redux-example/exchangeRates/LOAD';
const LOAD_SUCCESS = 'redux-example/exchangeRates/LOAD_SUCCESS';
const LOAD_FAIL = 'redux-example/exchangeRates/LOAD_FAIL';
const GOT_UPDATE_SUCCESS = 'redux-example/exchangeRates/GOT_UPDATE_SUCCESS';
const GOT_UPDATE = 'redux-example/exchangeRates/GOT_UPDATE';
const GOT_UPDATE_FAIL = 'redux-example/exchangeRates/GOT_UPDATE_FAIL';

function isSameExchangeRate(v1, v2) {
  const ticker1 = v1.ticker;
  const ticker2 = v2.ticker;
  return ticker1.base === ticker2.base &&
          ticker1.target === ticker2.target;
}

function updateIndividualExchangeRate(state, updatedExchangeRate) {
  const existingExchangeRates = [...state.data];
  for (let index = 0; index < existingExchangeRates.length; index++) {
    const exchangeRate = existingExchangeRates[index];
    if (!isSameExchangeRate(exchangeRate, updatedExchangeRate)) {
      continue;
    }
    if (Number(exchangeRate.timestamp) < Number(updatedExchangeRate.timestamp)) {
      existingExchangeRates[index] = updatedExchangeRate;
      return {
        ...state,
        data: existingExchangeRates
      };
    }
  }
  return state;
}

function sortExchangeRates(exchangeRates) {
  return exchangeRates.sort((itemA, itemB) => {
    const baseExchangeA = itemA.ticker.base;
    const baseExchangeB = itemB.ticker.base;
    if (baseExchangeA === baseExchangeB) {
      return 0;
    } else if (baseExchangeA < baseExchangeB) {
      return -1;
    }
    return 1;
  });
}

const initialState = {
  loaded: false,
  data: []
};

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case LOAD:
      return {
        ...state,
        loading: true
      };
    case LOAD_SUCCESS:
      return {
        ...state,
        loading: false,
        loaded: true,
        data: sortExchangeRates(action.result || []),
        error: null
      };
    case LOAD_FAIL:
      return {
        ...state,
        loading: false,
        loaded: false,
        data: [],
        error: action.error
      };
    case GOT_UPDATE_SUCCESS:
      return updateIndividualExchangeRate(state, action.result);
    default:
      return state;
  }
}

export function isLoaded(globalState) {
  return globalState.exchangeRates && globalState.exchangeRates.loaded;
}

export function onDataUpdated(update) {
  return {
    types: [GOT_UPDATE, GOT_UPDATE_SUCCESS, GOT_UPDATE_FAIL],
    promise: async () => update
  };
}

export function load() {
  return {
    types: [LOAD, LOAD_SUCCESS, LOAD_FAIL],
    promise: (client) => client.get('/exchange-rates/load')
  };
}
