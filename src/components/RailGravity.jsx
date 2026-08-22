import { useLayoutEffect } from 'react'
import { createRailField } from '../lib/railGravity'

/* Mounts the gravity field over the rail buttons.
 *
 * This is a behaviour, not a UI — it renders nothing and instead takes
 * over positioning of whatever `.rail-btn` elements are already on the
 * page. Doing it that way means every button keeps its own logic: F1 and
 * cricket still fetch their "what's on" files, music still reads the
 * ambient context, the WIP badges still sit where they sat. Only where
 * they are changes.
 *
 * It waits two frames before starting so the buttons have been laid out
 * by CSS at least once — the field seeds each ball from the position the
 * rail already gave it, so a zero-size measurement would drop everything
 * from the top-left corner.
 *
 * The hiding has to happen in a layout effect, not a normal one. A normal
 * effect runs *after* the browser paints, which was long enough for all
 * the balls to show up stacked in the rail for a single frame before
 * gravity claimed them — measured at t=318ms, one frame ahead of the
 * class landing at t=386ms. A layout effect runs before that paint. It's
 * still JavaScript, so if the module fails to load at all the class is
 * never added and the rail stays visible and clickable.
 */
export default function RailGravity() {
  useLayoutEffect(() => {
    let field = null
    let raf1 = 0
    let raf2 = 0

    // Hide the buttons for the couple of frames between CSS laying them
    // out in the rail and the field claiming them. Undone the moment
    // anything goes wrong, so a failure here leaves the rail visible and
    // working rather than an invisible navigation.
    const root = document.documentElement
    root.classList.add('rail-falling')
    const giveUp = () => root.classList.remove('rail-falling')

    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        try {
          field = createRailField('.rail-btn')
          if (!field) giveUp()
        } catch {
          giveUp()
        }
      })
    })

    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      giveUp()
      field?.destroy?.()
    }
  }, [])

  return null
}
