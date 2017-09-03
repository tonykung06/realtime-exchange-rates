import React, {Component, PropTypes} from 'react';
import Helmet from 'react-helmet';
import {connect} from 'react-redux';
import * as widgetActions from 'redux/modules/exchangeRates';
import {isLoaded, load as loadWidgets} from 'redux/modules/exchangeRates';
import {initializeWithKey} from 'redux-form';
import { asyncConnect } from 'redux-async-connect';
import moment from 'moment';
import {FormattedNumber} from 'react-intl';

@asyncConnect([{
  deferred: true,
  promise: ({store: {dispatch, getState}}) => {
    if (!isLoaded(getState())) {
      return dispatch(loadWidgets());
    }
  }
}])
@connect(
  state => ({
    widgets: state.exchangeRates.data,
    editing: state.exchangeRates.editing,
    error: state.exchangeRates.error,
    loading: state.exchangeRates.loading
  }),
  {...widgetActions, initializeWithKey })
export default class Widgets extends Component {
  static propTypes = {
    widgets: PropTypes.array,
    error: PropTypes.string,
    loading: PropTypes.bool,
    initializeWithKey: PropTypes.func.isRequired,
    editing: PropTypes.object.isRequired,
    load: PropTypes.func.isRequired,
    editStart: PropTypes.func.isRequired,
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
    const {loading, widgets} = this.props;
    let refreshClassName = 'fa fa-refresh';
    if (loading) {
      refreshClassName += ' fa-spin';
    }
    const styles = require('./ExchangeRates.scss');
    return (
      <div className={styles['exchange-rates-page'] + ' container'}>
        <h1>
          Cryptocurrency Realtime Price
        </h1>
        <Helmet title="Cryptocurrency Realtime Price"/>
        {
          widgets && widgets.length && (
            <div className="ui link cards">
              {
                widgets.map(item => {
                  let priceChangeCssClass = '';
                  if (Number(item.ticker.change) > 0) {
                    priceChangeCssClass = styles['price-increase'];
                  } else if (Number(item.ticker.change) < 0) {
                    priceChangeCssClass = styles['price-decrease'];
                  }
                  return (
                    <div title={`${item.ticker.base}-${item.ticker.target}`} key={item.ticker.base} className={styles.card + ' card'}>
                      <div className="content">
                        <div className={styles['base-currency']}>
                          {item.ticker.baseEnglishName}
                        </div>
                        <div className={styles.price}>
                          <FormattedNumber
                            value={item.ticker.price}
                            maximumFractionDigits={20}
                            style="currency"
                            currency="USD" />
                        </div>
                        <div className={styles.metadata}>
                          <div>
                            <div className={styles.label}>volume:</div>
                            <div>{item.ticker.volume}</div>
                          </div>
                          <div>
                            <div className={styles.label}>change:</div>
                            <div className={priceChangeCssClass}>{item.ticker.change}</div>
                          </div>
                        </div>
                      </div>
                      <div className="extra content">
                        <span className="right floated">
                          changed {moment.unix(item.timestamp).fromNow()}
                        </span>
                      </div>
                    </div>
                  );
                })
              }
            </div>
          )
        }
      </div>
    );
  }
}

