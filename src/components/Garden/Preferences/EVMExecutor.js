import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  DropDown,
  Field,
  GU,
  Info,
  TextInput,
} from '@1hive/1hive-ui'
import { EVMcrispr } from '@1hive/evmcrispr'

import MultiModal from '@components/MultiModal/MultiModal'
import CreateDecisionScreens from '../ModalFlows/CreateDecisionScreens/CreateDecisionScreens'

import { useGardens } from '@/providers/Gardens'
import { useWallet } from '@/providers/Wallet'

import { SHORTENED_APPS_NAMES } from '@utils/app-utils'

import actions from '../../../actions/garden-action-types'
import radspec from '../../../radspec'

function EVMExecutor() {
  const { account, ethers } = useWallet()
  const { connectedGarden } = useGardens()
  const [createDecisionModalVisible, setCreateDecisionModalVisible] = useState(
    false
  )
  const [evmcrispr, setEvmcrispr] = useState(null)
  const [installedApps, setInstalledApps] = useState([])
  const [selectedApp, setSelectedApp] = useState(null)
  const [selectedFunction, setSelectedFunction] = useState(null)
  const [parameters, setParameters] = useState([])

  useEffect(() => {
    async function getEvmCrispr() {
      if (!connectedGarden) {
        return
      }
      const crispr = await EVMcrispr.create(
        connectedGarden.address,
        ethers.getSigner()
      )

      setEvmcrispr(crispr)
    }
    getEvmCrispr()
  }, [connectedGarden, ethers])

  useEffect(() => {
    if (!evmcrispr) {
      return
    }
    const apps = evmcrispr.apps()
    setInstalledApps(apps)
  }, [evmcrispr])

  const shortenedAppsNames = installedApps.map(appName => {
    const dotIndex = appName.indexOf('.')
    return (
      SHORTENED_APPS_NAMES.get(
        dotIndex > 0
          ? appName.substr(0, appName.indexOf('.'))
          : appName.slice(0, -2)
      ) || appName.slice(0, -2)
    )
  })

  const functionList = useMemo(() => {
    if (!evmcrispr || shortenedAppsNames?.length === 0 || !selectedApp) {
      return
    }

    const appName = installedApps[selectedApp]

    const appFunctions = Object.getOwnPropertyNames(evmcrispr.call(appName))
    return appFunctions
  }, [evmcrispr, selectedApp, installedApps, shortenedAppsNames])

  const requiredParameters = useMemo(() => {
    if (!evmcrispr || !selectedApp || !selectedFunction) {
      return
    }

    const { paramNames, paramTypes } = evmcrispr.call(
      installedApps[selectedApp]
    )[functionList[selectedFunction]]

    return paramNames.map((parameter, index) => {
      return [parameter, paramTypes[index]]
    })
  }, [evmcrispr, installedApps, functionList, selectedApp, selectedFunction])

  const handleOnChangeParameters = useCallback((index, event) => {
    const newValue = event.target.value
    setParameters(prevState => {
      const newArray = [...prevState]
      newArray[index] = newValue
      return newArray
    })
  }, [])

  const handleOnCreateIntent = useCallback(async () => {
    const description = radspec[actions.NEW_DECISION]()
    const type = actions.NEW_DECISION
    const intent = await evmcrispr.encode(
      [
        evmcrispr
          .call(installedApps[selectedApp])
          [functionList[selectedFunction]](...parameters),
      ],
      ['disputable-voting'],
      { context: 'hello' }
    )

    return [{ ...intent.action, description: description, type: type }]
  }, [
    evmcrispr,
    installedApps,
    selectedApp,
    functionList,
    selectedFunction,
    parameters,
  ])

  if (!connectedGarden || !ethers) {
    return null
  }

  return (
    <Box heading="App selector">
      <Field label="Select App">
        <DropDown
          items={shortenedAppsNames}
          onChange={setSelectedApp}
          selected={selectedApp}
          wide
        />
      </Field>
      {functionList?.length > 0 && (
        <Field label="Select Function">
          <DropDown
            items={functionList}
            onChange={setSelectedFunction}
            selected={selectedFunction}
            wide
          />
        </Field>
      )}
      {requiredParameters?.length > 0 && (
        <Field label="Arguments">
          {requiredParameters.map((parameter, index) => {
            return (
              <TextInput
                key={index}
                onChange={event => handleOnChangeParameters(index, event)}
                placeholder={`${parameter[0].toString()} : ${parameter[1].toString()}`}
                wide
                css={`
                  margin-bottom: ${2 * GU}px;
                `}
              />
            )
          })}
        </Field>
      )}
      {!account && (
        <Info
          mode="warning"
          css={`
            margin-top: ${2 * GU}px;
            margin-bottom: ${2 * GU}px;
          `}
        >
          You must connect your account in order to create a decision.
        </Info>
      )}
      {selectedFunction && (
        <Button
          disabled={!account}
          mode="strong"
          wide
          onClick={() => setCreateDecisionModalVisible(true)}
        >
          Execute
        </Button>
      )}
      <MultiModal
        visible={createDecisionModalVisible}
        onClose={() => setCreateDecisionModalVisible(false)}
      >
        <CreateDecisionScreens onCreateTransaction={handleOnCreateIntent} />
      </MultiModal>
    </Box>
  )
}

export default EVMExecutor
