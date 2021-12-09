import React from 'react'
import { HashRouter } from 'react-router-dom'
import { Main } from '@1hive/1hive-ui'

import GlobalErrorHandler from './GlobalErrorHandler'
import Routes from './routes/Routes'
import MainView from '@components/MainView'
import WelcomeLoader from '@components/Welcome/WelcomeLoader'

import { GardensProvider } from './providers/Gardens'
import { ProfileProvider } from './providers/Profile'
import { UserProvider } from './providers/User'
import { WalletProvider } from './providers/Wallet'

function App() {
  return (
    <HashRouter>
      <Main assetsUrl="/aragon-ui/" layout={false} scrollView={false}>
        <WalletProvider>
          <GlobalErrorHandler>
            <ProfileProvider>
              <UserProvider>
                <GardensProvider>
                  <WelcomeLoader />
                  <MainView>
                    <Routes />
                  </MainView>
                </GardensProvider>
              </UserProvider>
            </ProfileProvider>
          </GlobalErrorHandler>
        </WalletProvider>
      </Main>
    </HashRouter>
  )
}

export default App