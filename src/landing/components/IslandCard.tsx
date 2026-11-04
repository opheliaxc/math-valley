import { IslandArt } from '../art/IslandArt'
import { LockIcon } from '../art/Icons'
import type { LandingIsland } from '../data/useLandingIslands'
import { landingCopy } from '../data/landingCopy'

type IslandCardProps = {
  island: LandingIsland
}

export function IslandCard({ island }: IslandCardProps) {
  const copy = landingCopy.explore
  const status = island.open ? copy.openLabel : copy.lockedLabel

  return (
    <li
      className={`mv-island-card${island.open ? ' mv-island-card--open' : ' mv-island-card--locked'}`}
    >
      <div className="mv-island-card__art">
        <IslandArt domainKey={island.domainKey} open={island.open} />
      </div>
      <div className="mv-island-card__body">
        <h3 className="mv-island-card__name">{island.name}</h3>
        <p className="mv-island-card__caption">{island.caption}</p>
        <p className="mv-island-card__status">
          {!island.open ? (
            <LockIcon className="mv-island-card__lock" />
          ) : null}
          <span>{status}</span>
        </p>
      </div>
    </li>
  )
}
