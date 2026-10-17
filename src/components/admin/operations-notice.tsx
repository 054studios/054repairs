import { Notice } from "./notice";
export function OperationsNotice() {
  return (
    <Notice tone="info" title="Beheeruitbreidingen nog activeren">
      De database-uitbreiding ontbreekt. Pas eerst migratie
      20261017120000_operations.sql toe in Supabase. Daarna verschijnen hier je
      gegevens en instellingen.
    </Notice>
  );
}
