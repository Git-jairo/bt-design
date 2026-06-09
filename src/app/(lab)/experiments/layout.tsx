/**
 * Experiments ("The Lab") layout.
 *
 * Experiments are self-contained explorations that are NOT part of the main
 * BudgetThuis.Design site. They deliberately inherit none of the site chrome
 * (no shared Footer); each experiment renders its own navigation and styling.
 * Keep this layout minimal — per-experiment chrome belongs in the experiment.
 */
export default function LabLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
