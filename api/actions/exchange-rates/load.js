import {getAllExchangeRatesWithCache} from '../../../services/fetchExchangeRates';

export default function load(req) {
  return getAllExchangeRatesWithCache();
}
