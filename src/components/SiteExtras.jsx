import React from 'react'

import MatrixEasterEgg from './KonamiEasterEgg'
import MathBackdrop from './MathBackdrop'
import QuoteFlip from './QuoteFlip'
import PromptDemo from './PromptDemo'
import Terminal from './Terminal'
import WorkspaceSection from './WorkspaceSection'
import AstroDitherSection from './AstroDitherSection'
import TravelMap from './TravelMap'
import DopamineTeaser from './DopamineTeaser'
import SaladsTeaser from './SaladsTeaser'
import Guestbook from './Guestbook'

import Sidecar from './Sidecar'
import F1Banner from './F1Banner'
import CricketButton from './CricketButton'
import MusicButton from './MusicButton'
import CookingButton from './CookingButton'
import {
  MoviesRailButton,
  PhotographyRailButton,
  BrandsRailButton,
  OmscsRailButton,
  StocksRailButton,
  CryptoRailButton,
  SpaceRailButton,
  JobsRailButton,
  EbcRailButton,
} from './RailButtons'
import RailGravity from './RailGravity'
import BallGame from './BallGame'

import VisitorTracker from './VisitorTracker'
import VisitorCount from './VisitorCount'
import GhostCursors from './GhostCursors'
import AdminDashboard from './AdminDashboard'
import Changelog from './Changelog'
import QRvCard from './QRvCard'
import SpeedTest from './SpeedTest'
import ShareCard from './ShareCard'
import MemeGenerator from './MemeGenerator'
import DevCalc from './DevCalc'
import CarbonCalc from './CarbonCalc'
import SalaryCalc from './SalaryCalc'
import CodeBrowser from './CodeBrowser'
import LiveChat from './LiveChat'
import CryptoDashboard from './CryptoDashboard'
import DevNet from './DevNet'
import ServiceStatus from './ServiceStatus'
import SystemStatus from './SystemStatus'
import CronSchedule from './ActionsTools'

/* ------------------------------------------------------------------ *
 * Everything the full site has that the lite one doesn't.
 *
 * This exists as one file for a single reason: it is imported lazily, so
 * everything named above lands in its own chunk. A narrow screen never
 * asks for that chunk, which is what turns "we don't render the 3D
 * scene" into "we never download the 3D scene" — 4.4 MB of model and
 * environment maps that used to load whether or not anyone scrolled to
 * them.
 *
 * Hiding these with CSS would have kept every byte, every timer and
 * every socket. Not importing them is the whole point.
 *
 * Two halves, and the order matters in the second one: RailGravity
 * claims whatever .rail-btn elements exist when it mounts, so the
 * buttons have to be above it.
 * ------------------------------------------------------------------ */

/* The extra sections are exported as the three slots they occupy rather
 * than one block, because the full site interleaves them between the
 * sections lite keeps — QuoteFlip sits above Experience, PromptDemo
 * between TechStack and Projects. Collapsing them into a single group
 * would have quietly reordered the desktop page, which is meant to be
 * untouched by any of this. */

export function ExtraAfterHero() {
  return <div className="section-animate"><QuoteFlip /></div>
}

export function ExtraAfterTech() {
  return <div className="section-animate"><PromptDemo /></div>
}

export function ExtraAfterAbout() {
  return (
    <>
      <div className="section-animate"><Terminal /></div>
      <div className="section-animate"><WorkspaceSection /></div>
      <div className="section-animate"><AstroDitherSection /></div>
      <div className="section-animate"><TravelMap /></div>
      <div className="section-animate"><DopamineTeaser /></div>
      <div className="section-animate"><SaladsTeaser /></div>
    </>
  )
}

export function ExtraGuestbook() {
  return <div className="section-animate"><Guestbook /></div>
}

export function ExtraBackdrop() {
  return (
    <>
      <MathBackdrop />
      {/* Purely decorative; invisible unless html.disco is set. */}
      <div className="disco-lights" aria-hidden="true">
        <span className="disco-beams" />
        <span className="disco-speckles" />
        <span className="disco-beat" />
        <span className="disco-blinders" />
      </div>
    </>
  )
}

export default function SiteExtras({ matrixActive, onMatrixComplete }) {
  return (
    <>
      <MatrixEasterEgg active={matrixActive} onComplete={onMatrixComplete} />

      <Sidecar />
      <F1Banner />
      <CricketButton />
      <MusicButton />
      <CookingButton />
      <MoviesRailButton />
      <PhotographyRailButton />
      <BrandsRailButton />
      <OmscsRailButton />
      <StocksRailButton />
      <CryptoRailButton />
      <SpaceRailButton />
      <JobsRailButton />
      <EbcRailButton />
      <RailGravity />
      <BallGame />

      <VisitorTracker />
      <VisitorCount />
      <GhostCursors />
      <AdminDashboard />
      <Changelog />
      <QRvCard />
      <SpeedTest />
      <ShareCard />
      <MemeGenerator />
      <DevCalc />
      <CarbonCalc />
      <SalaryCalc />
      <CodeBrowser />
      <LiveChat />
      <CryptoDashboard />
      <DevNet />
      <ServiceStatus />
      <SystemStatus />
      <CronSchedule />
    </>
  )
}
