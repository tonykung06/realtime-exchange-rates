import React from 'react';
import {FormattedNumber} from 'react-intl';
import moment from 'moment';

export default ({exchangeRate}) => {
  const {ticker} = exchangeRate;
  let priceChangeCssClass = '';
  const styles = require('./styles.scss');

  if (Number(ticker.change) > 0) {
    priceChangeCssClass = styles['price-increase'];
  } else if (Number(ticker.change) < 0) {
    priceChangeCssClass = styles['price-decrease'];
  }

  return (
    <div title={`${ticker.base}-${ticker.target}`} className={styles.card + ' card'}>
      <div className="content">
        <div className={styles['base-currency']}>
          {ticker.baseEnglishName}
        </div>
        <div className={styles.price}>
          <FormattedNumber
            value={ticker.price}
            maximumFractionDigits={20}
            style="currency"
            currency="USD" />
        </div>
        <div className={styles.metadata}>
          <div>
            <div className={styles.label}>volume:</div>
            <div>{ticker.volume}</div>
          </div>
          <div>
            <div className={styles.label}>change:</div>
            <div className={priceChangeCssClass}>{ticker.change}</div>
          </div>
        </div>
      </div>
      <div className="extra content">
        <span className="right floated">
          {moment.unix(exchangeRate.timestamp).format('LTS')}
        </span>
      </div>
    </div>
  );
};
