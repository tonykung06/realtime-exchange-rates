import fetchExchangeRates from './fetchExchangeRates'

export default function start(io) {
    fetchExchangeRates(io);
}
