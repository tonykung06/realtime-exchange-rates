import React, {Component, PropTypes} from 'react';
import Helmet from 'react-helmet';
import {connect} from 'react-redux';
import * as exchangeRateActions from 'redux/modules/exchangeRates';
import {isLoaded, load as loadExchangeRates} from 'redux/modules/exchangeRates';
import { asyncConnect } from 'redux-async-connect';
import ExchangeRateCard from '../../components/ExchangeRateCard';

@asyncConnect([{
  deferred: true,
  promise: ({store: {dispatch, getState}}) => {
    if (!isLoaded(getState())) {
      return dispatch(loadExchangeRates());
    }
  }
}])
@connect(
  state => ({
    exchangeRates: state.exchangeRates.data
  }),
  {...exchangeRateActions })
export default class Widgets extends Component {
  static propTypes = {
    exchangeRates: PropTypes.array,
    onDataUpdated: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.onExchaneRateUpdated = this.onExchaneRateUpdated.bind(this);
  }

  componentDidMount() {
    if (socket) {
      socket.on('exchange-rate-updated', this.onExchaneRateUpdated);
    }
  }

  componentWillUnmount() {
    if (socket) {
      socket.removeListener('exchange-rate-updated', this.onExchaneRateUpdated);
    }
  }

  onExchaneRateUpdated(update) {
    this.props.onDataUpdated(update);
  }

  render() {
    require('semantic-ui-card/card.css');
    const {exchangeRates} = this.props;
    const styles = require('./ExchangeRates.scss');
    return (
      <div className={styles['exchange-rates-page'] + ' container'}>
        <h1>
          Cryptocurrency Realtime Price
        </h1>
        <Helmet title="Cryptocurrency Realtime Price"/>
        {
          exchangeRates && exchangeRates.length && (
            <div className="ui link cards">
              {exchangeRates.map(item => <ExchangeRateCard key={item.ticker.base} exchangeRate={item} />)}
            </div>
          )
        }
      </div>
    );
  }
}

