import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import {env} from 'process';
import {HardhatUserConfig, NetworkUserConfig} from 'hardhat/types';
import {customConfig as AppCustomConfig} from './src/config';
import {config as AppConfig, log} from '@jovijovi/pedrojs-common';

// Default app config file
const defaultAppConfig = './conf/app.config.yaml'

function getDeveloperPK(): string {
  return env.DEVELOPER_PK ? env.DEVELOPER_PK : `1234567890123456789012345678901234567890123456789012345678901234`;
}

function getNetworkConfig(): NetworkUserConfig {
  AppConfig.LoadConfig(defaultAppConfig);
  AppCustomConfig.LoadCustomConfig();

  log.RequestId().info("ChainId=", AppCustomConfig.GetChainId());
  log.RequestId().info("Provider URL=", AppCustomConfig.GetProvider())

  return {
    chainId: AppCustomConfig.GetChainId(),
    url: AppCustomConfig.GetProvider(),
    accounts: [`0x${getDeveloperPK()}`]
  }
}

const config: HardhatUserConfig = {
  // defaultNetwork: 'custom',
  networks: {
    custom: getNetworkConfig()
  },
  solidity: {
    compilers: [
      {
        version: '0.8.4',
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
