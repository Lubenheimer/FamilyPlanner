import { FamilySettingsClient } from "@/components/settings/family-settings-client";

export default function FamilySettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Familieneinstellungen</h1>
        <p className="text-muted-foreground text-sm">
          Verwalte Familienmitglieder, Namen und Farben.
        </p>
      </div>
      <FamilySettingsClient />
    </div>
  );
}
