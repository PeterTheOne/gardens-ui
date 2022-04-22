import { useEffect, useMemo, useState } from 'react'
import { useGardenState } from '@providers/GardenState'
import usePromise from '@hooks/usePromise'
import { getAppPresentationByAddress } from '@utils/app-utils'

interface ManagerProps {
  address: string,
  shortenedName: string,
}

interface PermissionProps {
  allowed: boolean,
  appAddress: string,
  granteeAddress: string,
  granteeName: string | undefined,
  params: Array<any>,
  roleHash: string
}

interface RoleProps {
  appAddress: string,
  appName: string,
  appIcon: string,
  description: string | undefined, // TODO- check why this is happening proabably old ABI
  hash: string,
  manager: Array<ManagerProps>,
  name: string,
  params: Array<any>,
  permissions: Array<PermissionProps>
}

export function useRoles() {
  const [loading, setLoading] = useState<boolean>(true)
  const gardenState = useGardenState()

  console.log('gardenState ', gardenState)
  const appsWithPermissions = useMemo(() => {
    if (!gardenState?.installedApps) {
      return async () => { null }
    }
    return () => Promise.all(gardenState?.installedApps.map(async (app: any) => {
      return {
        ...app,
        roles: await app.roles()
      }
    }))
  }, [gardenState])

  const appsWithRolesResolved = usePromise(appsWithPermissions, [], [])

  console.log('appsWithRolesResolved ', appsWithRolesResolved)

  const rolesWithEntitiesResolved: Array<RoleProps> = appsWithRolesResolved ? appsWithRolesResolved.map((app: any) => {
    return app.roles.map((role: any) => {
      return {
        ...role,
        appName: getAppPresentationByAddress(gardenState?.installedApps, app.address)?.shortenedName,
        appIcon: getAppPresentationByAddress(gardenState?.installedApps, app.address)?.iconSrc,
        manager: {
          address: role.manager,
          shortenedName: getAppPresentationByAddress(gardenState?.installedApps, role.manager)?.shortenedName
        },
        permissions: role.permissions.map((permission: any) => {
          return {
            ...permission,
            granteeName: getAppPresentationByAddress(gardenState?.installedApps, permission.granteeAddress)?.shortenedName
          }
        })
      }
    })
  }) : null

  useEffect(() => {
    if (rolesWithEntitiesResolved) {
      setLoading(false)
    }
  }, [rolesWithEntitiesResolved])



  return [rolesWithEntitiesResolved ? rolesWithEntitiesResolved.flat() : [], loading]

}
