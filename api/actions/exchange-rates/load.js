import {getAllExchangeRatesWithCache} from '../../../services/fetchExchangeRates';

export default function load() {
  return getAllExchangeRatesWithCache();
}
