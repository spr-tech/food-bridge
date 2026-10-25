// The demonstration notice the spec requires on every page (section 4), as a small line
// under the page content, where the design places it. While the data is simulated it
// says so (brief p.3).
import { DATA_IS_SIMULATED } from '@/services/api'

export function DemoBanner() {
  return (
    <p className="fb-demo">
      {DATA_IS_SIMULATED
        ? 'Demonstration data (simulated) · organisations and people are fictional'
        : 'Demonstration data · organisations and people are fictional'}
    </p>
  )
}
