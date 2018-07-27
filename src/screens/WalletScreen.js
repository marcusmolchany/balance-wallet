import { accountUpdateAccountAddress as accountUpdateAccountAddressActionCreactor } from 'balance-common';
import { get } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { StatusBar } from 'react-native';
import { connect } from 'react-redux';
import { compose, withHandlers, withState } from 'recompact';
import { AssetList, BalanceCoinRow, UniqueTokenGridList } from '../components/asset-list';
import Avatar from '../components/Avatar';
import { Header, HeaderButton } from '../components/header';
import { Page } from '../components/layout';
import { withHideSplashScreenOnMount } from '../hoc';

const filterEmptyAssetSections = sections => sections.filter(({ totalItems }) => totalItems);

const sortAssetsByNativeAmount = (assets, showShitcoins) => {
  const assetsWithMarketValue = assets.filter(asset => asset.native !== null);
  const sortedAssetsWithMarketValue = assetsWithMarketValue.sort((a, b) => {
    const amountA = get(a, 'native.balance.amount', 0);
    const amountB = get(b, 'native.balance.amount', 0);
    return parseFloat(amountB) - parseFloat(amountA);
  });

  if (showShitcoins) {
    const assetsWithNoMarketValue = assets.filter(asset => asset.native === null);
    const sortedAssetsWithNoMarketValue = assetsWithNoMarketValue.sort((a, b) => (
      (a.name < b.name) ? -1 : 1
    ));

    return sortedAssetsWithMarketValue.concat(sortedAssetsWithNoMarketValue);
  }

  return sortedAssetsWithMarketValue;
};

const WalletScreen = ({
  accountInfo,
  accountUpdateAccountAddress,
  onPressProfile,
  onToggleShowShitcoins,
  showShitcoins,
  uniqueTokens,
}) => {
  const sections = {
    balances: {
      contextMenuOptions: {
        cancelButtonIndex: 1,
        destructiveButtonIndex: showShitcoins ? 0 : 99, // 99 is an arbitrarily high number used to disable the 'destructiveButton' option
        onPress: (index) => { if (index === 0) onToggleShowShitcoins(); },
        options: [`${showShitcoins ? 'Hide' : 'Show'} assets w/ no price data`, 'Cancel'],
      },
      data: sortAssetsByNativeAmount(accountInfo.assets, showShitcoins),
      renderItem: BalanceCoinRow,
      title: 'Balances',
      totalItems: (!!Number(accountInfo.total.amount)) ? accountInfo.assets.length : 0,
      totalValue: accountInfo.total.display || '',
    },
    collectibles: {
      data: [uniqueTokens],
      renderItem: UniqueTokenGridList,
      title: 'Collectibles',
      totalItems: uniqueTokens.length,
      totalValue: '',
    },
  };

  return (
    <Page>
      <StatusBar barStyle="dark-content" />
      <Header>
        <HeaderButton onPress={onPressProfile}>
          <Avatar />
        </HeaderButton>
      </Header>
      <AssetList
        fetchData={() => {
          // note: every time this is called it sets a new interval. this is a memory leak.
          accountUpdateAccountAddress(accountInfo.address, 'BALANCEWALLET');
          return new Promise((resolve) => {
            // hack: use timeout so that it looks like loading is happening
            // accountUpdateAccountAddress does not return a promise
            setTimeout(resolve, 2000);
          });
        }}
        sections={filterEmptyAssetSections([sections.balances, sections.collectibles])}
        showShitcoins={showShitcoins}
      />
    </Page>
  );
};

WalletScreen.propTypes = {
  accountInfo: PropTypes.object.isRequired,
  accountUpdateAccountAddress: PropTypes.func.isRequired,
  fetching: PropTypes.bool.isRequired,
  fetchingUniqueTokens: PropTypes.bool.isRequired,
  onPressProfile: PropTypes.func.isRequired,
  onToggleShowShitcoins: PropTypes.func,
  showShitcoins: PropTypes.bool,
  uniqueTokens: PropTypes.array.isRequired,
};

const reduxProps = ({ account }) => ({
  accountInfo: account.accountInfo,
  fetching: account.fetching,
  fetchingUniqueTokens: account.fetchingUniqueTokens,
  uniqueTokens: account.uniqueTokens,
});

export default compose(
  withHideSplashScreenOnMount,
  withState('showShitcoins', 'toggleShowShitcoins', true),
  connect(reduxProps, { accountUpdateAccountAddress: accountUpdateAccountAddressActionCreactor }),
  withHandlers({
    onPressProfile: ({ navigation }) => () => navigation.navigate('SettingsScreen'),
    onToggleShowShitcoins: ({ showShitcoins, toggleShowShitcoins }) => () => toggleShowShitcoins(!showShitcoins),
  }),
)(WalletScreen);
