import type { Metadata } from 'next'
import {
  DocPage,
  DocH2,
  DocP,
  DocUL,
  DocSteps,
  DocCallout,
  DocKbd,
} from '@/components/docs/doc-content'

export const metadata: Metadata = {
  title: 'Designing windows · SoftWindow Docs',
}

export default function DesigningWindowsPage() {
  return (
    <DocPage
      title="Designing windows"
      lead="The editor is section-based: a frame is divided into sections, and each section holds a window type."
      href="/docs/designing-windows"
    >
      <DocH2>Frame, sections and dividers</DocH2>
      <DocP>
        Every design starts as a single <strong>frame</strong> — the opening,
        sized in millimetres. You split that frame into <strong>sections</strong>{' '}
        using two kinds of dividers:
      </DocP>
      <DocUL>
        <li>
          <strong>Coupler</strong> — a structural divider that splits a section
          into two.
        </li>
        <li>
          <strong>Mullion</strong> — a lighter divider placed inside a coupler
          section.
        </li>
      </DocUL>
      <DocCallout type="note">
        Couplers can&apos;t be placed inside a mullion section, and only
        casement, fixed and louvered windows fit inside a mullion-divided
        section.
      </DocCallout>

      <DocH2>Placing windows</DocH2>
      <DocSteps
        steps={[
          {
            title: 'Pick a type from the left rail',
            body: 'Window and door types are grouped by category (Windows, Doors, Ventilation, Special, Screens).',
          },
          {
            title: 'Drag it onto a section',
            body: 'Drop a type onto any section in the canvas. Dropping a different type into an occupied section replaces it.',
          },
          {
            title: 'Split when you need more',
            body: (
              <>
                Drag the <DocKbd>Coupler</DocKbd> or <DocKbd>Mullion</DocKbd>{' '}
                tool onto a section to divide it. Orientation is chosen from
                where you drop.
              </>
            ),
          },
        ]}
      />

      <DocH2>Window types</DocH2>
      <DocP>
        Over 20 types are available, including sliding, casement (single,
        double, fixed), top-hung, awning, louvered, fixed, single/double doors,
        brick ventilators, exhaust fans, AC sleeves, glass block, grilles,
        roller shutters, skylights, mesh/fly screens and frosted film.
      </DocP>

      <DocH2>Section properties</DocH2>
      <DocP>
        Select a section to edit its options in the right panel. The controls
        change by type — for example:
      </DocP>
      <DocUL>
        <li><strong>Sliding</strong>: number of panels, mesh, slim profile.</li>
        <li><strong>Casement</strong>: hinge side, opening direction, glazing bar.</li>
        <li><strong>Doors</strong>: open direction and panel style (panel / glass / flush).</li>
        <li><strong>Louvered / shutters</strong>: blade or slat count.</li>
      </DocUL>

      <DocH2>Design details &amp; GI hardware</DocH2>
      <DocP>
        The right panel also holds design-level details: <strong>Design Ref</strong>{' '}
        and <strong>Glass Type</strong> are required to save. You can set a
        colour, quantity, and an optional manual <strong>Rate / Sqft</strong>{' '}
        that overrides the automatic rate. When a sliding window is present, you
        can choose GI hardware — track, sash, interlock and lock — from your
        configurable lists.
      </DocP>

      <DocH2>Saving</DocH2>
      <DocP>
        Click <DocKbd>Save</DocKbd> to store the design. When you opened the
        editor from a quotation, saving links the design to it and returns you
        to the quotation with totals updated. The area and amount are persisted
        so lists and proposals stay fast.
      </DocP>
    </DocPage>
  )
}
