import {getAllExchangeRates} from '../../services/fetchExchangeRates';

export default function load(req) {
  return getAllExchangeRates();
}
