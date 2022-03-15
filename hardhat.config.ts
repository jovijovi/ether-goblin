import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import {HardhatUserConfig, NetworkUserConfig} from 'hardhat/types';
import {customConfig as AppCustomConfig} from './src/config';
import {config as AppConfig, log} from '@jovijovi/pedrojs-common';

// Default app config file
const defaultAppConfig = './conf/app.config.yaml'

function getNetworkConfig(): NetworkUserConfig {
  AppConfig.LoadConfig(defaultAppConfig);
  AppCustomConfig.LoadCustomConfig();

  log.RequestId().info("ChainId=", AppCustomConfig.GetChainId());
  log.RequestId().info("Provider URL=", AppCustomConfig.GetProvider())

  return {
    chainId: AppCustomConfig.GetChainId(),
    url: AppCustomConfig.GetProvider(),
    accounts: [`0x1234567890123456789012345678901234567890123456789012345678901234`]
  }
}

const config: HardhatUserConfig = {
  defaultNetwork: 'custom',
  networks: {
    custom: getNetworkConfig()
  },
  solidity: {
    compilers: [
      {
        version: '0.6.8',
        settings: {
          // You should disable the optimizer when debugging
          // https://hardhat.org/hardhat-network/#solidity-optimizer-support
          optimizer: {
            enabled: true,
            runs: 200
          },
        }
      }
    ],
  },
};

export default config;
