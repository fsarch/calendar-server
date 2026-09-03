/**
 * Definiert alle verfügbaren Berechtigungen für den Calendar-Service.
 * Konvention:
 * - read_<resource>    : Lesen von <resource>
 * - write_<resource>   : Schreiben von <resource>
 * - create_<resource>  : Erstellen von <resource>
 * - delete_<resource>  : Löschen von <resource>
 * - manage_<resource>  : Volle Kontrolle über <resource>
 */
export enum Role {
  // Calendar Ressourcen
  read_calendar = 'read_calendar',
  write_calendar = 'write_calendar',
  create_calendar = 'create_calendar',
  delete_calendar = 'delete_calendar',
  manage_calendar = 'manage_calendar',

  // Event Ressourcen
  read_event = 'read_event',
  write_event = 'write_event',
  create_event = 'create_event',
  delete_event = 'delete_event',
  manage_event = 'manage_event',

  // Event Series Ressourcen
  read_event_series = 'read_event_series',
  write_event_series = 'write_event_series',
  create_event_series = 'create_event_series',
  delete_event_series = 'delete_event_series',
  manage_event_series = 'manage_event_series',

  // Event Exception Ressourcen
  read_event_exception = 'read_event_exception',
  write_event_exception = 'write_event_exception',
  create_event_exception = 'create_event_exception',
  delete_event_exception = 'delete_event_exception',
  manage_event_exception = 'manage_event_exception',

  // Wildcard für Admins
  all = '*',
}
