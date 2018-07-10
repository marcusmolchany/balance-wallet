import React, { Component } from 'react';
import { ScrollView, Button, View, Text, Image } from 'react-native';
import Card from '../components/Card';
import CoinRow from '../components/CoinRow';
import Container from '../components/Container';
import Label from '../components/Label';
import Section from '../components/Section';
import WalletMenu from '../components/WalletMenu';
import { apiGetAccountBalances } from '../helpers/api';
import * as ethWallet from '../model/ethWallet';

class ModalScreen extends Component {
  render() {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: 20,
          backgroundColor: '#111111',
        }}
      >
        <Text style={{ fontSize: 20, color: 'white', paddingBottom: 10 }}>Welcome to Balance</Text>
        <Image style={{ width: 16, height: 16 }} source={require('../assets/exclamation-point-circle.png')} />
        <Text style={{ fontSize: 15, color: '#FFAF24', paddingBottom: 10 }}>This is alpha software.</Text>
        <Text style={{ fontSize: 15, color: 'white', width: '75%' }}>Please do not store more in your wallet than you are willing to lose.</Text>
        <Button onPress={() => this.props.navigation.goBack()} title="Create a Wallet" />
      </View>
    );
  }
}

class WalletScreen extends Component {
  state = {
    loading: false,
    wallet: null,
  };
  componentDidMount() {
    this.setState({ loading: true });
    this.loadWallet()
      .then(wallet => this.setState({ loading: false, wallet }))
      .catch(error => this.setState({ loading: false, wallet: null }));
  }
  loadWallet = async () => {
    try {
      const wallet = await ethWallet.loadWallet();
      console.log('wallet', wallet);
      if (wallet) {
        const { data } = await apiGetAccountBalances(wallet.address, 'mainnet');
        const assets = data.map(asset => {
          const exponent = 10 ** Number(asset.contract.decimals);
          const balance = Number(asset.balance) / exponent;
          return {
            address: asset.contract.address,
            name: asset.contract.name,
            symbol: asset.contract.symbol,
            decimals: asset.contract.decimals,
            balance,
          };
        });
        wallet.assets = assets;
        console.log('wallet', wallet);
        return wallet;
      }
      return null;
    } catch (error) {
      console.error(error);
      return error;
    }
  };

  static navigatorStyle = {
    navBarHidden: true,
  };

  render() {
    const address = this.state.wallet ? this.state.wallet.address : '';
    return !this.state.loading ? (
      <Container>
        <WalletMenu walletAddress={address} />
        <ScrollView style={{ width: '100%' }} directionalLockEnabled>
          {this.state.wallet &&
            this.state.wallet.assets.map(asset => {
              const coinLogo =
                asset.symbol === 'ETHA'
                  ? 'https://raw.githubusercontent.com/balance-io/tokens/master/images/ethereum_1.png'
                  : `https://raw.githubusercontent.com/balance-io/tokens/master/images/${asset.address}.png`;
              return <CoinRow key={asset.symbol} imgPath={coinLogo} coinSymbol={asset.symbol} coinName={asset.name} coinBalance={asset.balance} />;
            })}
        </ScrollView>
      </Container>
    ) : (
      <Container>
        <Card>
          <Section>
            <Label>Loading...</Label>
          </Section>
        </Card>
      </Container>
    );
  }
}

export default ModalScreen;
