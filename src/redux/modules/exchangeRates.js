const LOAD = 'redux-example/exchangeRates/LOAD';
const LOAD_SUCCESS = 'redux-example/exchangeRates/LOAD_SUCCESS';
const LOAD_FAIL = 'redux-example/exchangeRates/LOAD_FAIL';
const GOT_UPDATE_SUCCESS = 'redux-example/exchangeRates/GOT_UPDATE_SUCCESS';
const GOT_UPDATE = 'redux-example/exchangeRates/GOT_UPDATE';
const GOT_UPDATE_FAIL = 'redux-example/exchangeRates/GOT_UPDATE_FAIL';
const EDIT_START = 'redux-example/exchangeRates/EDIT_START';
const EDIT_STOP = 'redux-example/exchangeRates/EDIT_STOP';
const SAVE = 'redux-example/exchangeRates/SAVE';
const SAVE_SUCCESS = 'redux-example/exchangeRates/SAVE_SUCCESS';
const SAVE_FAIL = 'redux-example/exchangeRates/SAVE_FAIL';

function isSameExchangeRate(v1, v2) {
  const ticker1 = v1.ticker;
  const ticker2 = v2.ticker;
  return ticker1.base === ticker2.base &&
          ticker1.target === ticker2.target;
}

function updateIndividualExchangeRate(state, updatedExchangeRate) {
  if (state.data && state.data.length > 0) {
    let updated = false;
    state.data = state.data.map(exchangeRate => {
      if (isSameExchangeRate(exchangeRate, updatedExchangeRate) && exchangeRate.timestamp < updatedExchangeRate.timestamp) {
        updated = true;
        return updatedExchangeRate;
      }
      return exchangeRate;
    });
    if (updated) {
      return {
        ...state
      };
    }
  }
  return state;
}

const initialState = {
  loaded: false,
  editing: {},
  saveError: {}
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
        data: action.result,
        error: null
      };
    case LOAD_FAIL:
      return {
        ...state,
        loading: false,
        loaded: false,
        data: null,
        error: action.error
      };
    case EDIT_START:
      return {
        ...state,
        editing: {
          ...state.editing,
          [action.id]: true
        }
      };
    case EDIT_STOP:
      return {
        ...state,
        editing: {
          ...state.editing,
          [action.id]: false
        }
      };
    case SAVE:
      return state; // 'saving' flag handled by redux-form
    case SAVE_SUCCESS:
      const data = [...state.data];
      data[action.result.id - 1] = action.result;
      return {
        ...state,
        data: data,
        editing: {
          ...state.editing,
          [action.id]: false
        },
        saveError: {
          ...state.saveError,
          [action.id]: null
        }
      };
    case SAVE_FAIL:
      return typeof action.error === 'string' ? {
        ...state,
        saveError: {
          ...state.saveError,
          [action.id]: action.error
        }
      } : state;
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

export function save(widget) {
  return {
    types: [SAVE, SAVE_SUCCESS, SAVE_FAIL],
    id: widget.id,
    promise: (client) => client.post('/widget/update', {
      data: widget
    })
  };
}

export function editStart(id) {
  return { type: EDIT_START, id };
}

export function editStop(id) {
  return { type: EDIT_STOP, id };
}
