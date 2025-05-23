const german = {
  name: "German",
  native_name: "Deutsch",
  code: "de",
};

const de = {
  translation: {
    report_bug: "Einen Fehler melden",
    import_from: "Importieren",
    import: "Importieren",
    file: "Datei",
    new: "Neu",
    new_window: "Neues Fenster",
    open: "Öffnen",
    save: "Speichern",
    save_as: "Speichern unter",
    save_as_template: "Als Vorlage speichern",
    template_saved: "Vorlage gespeichert!",
    rename: "Umbenennen",
    change_language: "Sprache ändern",
    light_mode: "Heller Modus",
    dark_mode: "Dunkler Modus",
    delete_diagram: "Diagramm löschen",
    are_you_sure_delete_diagram:
      "Möchten Sie dieses Diagramm wirklich löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.",
    oops_smth_went_wrong: "Hoppla! Etwas ist schief gelaufen.",
    import_diagram: "Diagramm importieren",
    import_from_source: "Von SQL importieren",
    export_as: "Exportieren als",
    export_source: "SQL exportieren",
    models: "Modelle",
    exit: "Beenden",
    edit: "Bearbeiten",
    undo: "Rückgängig",
    redo: "Wiederherstellen",
    clear: "Leeren",
    are_you_sure_clear:
      "Möchten Sie das Diagramm wirklich leeren? Dieser Vorgang kann nicht rückgängig gemacht werden.",
    cut: "Ausschneiden",
    copy: "Kopieren",
    paste: "Einfügen",
    duplicate: "Duplizieren",
    delete: "Löschen",
    copy_as_image: "Als Bild kopieren",
    view: "Ansicht",
    header: "Menüleiste",
    sidebar: "Seitenleiste",
    issues: "Probleme",
    presentation_mode: "Präsentationsmodus",
    strict_mode: "Strikter Modus",
    field_details: "Angaben zum Feld",
    reset_view: "Ansicht zurücksetzen",
    show_grid: "Gitter anzeigen",
    show_datatype: "Datentyp anzeigen",
    show_cardinality: "Kardinalität anzeigen",
    theme: "Motiv",
    light: "Hell",
    dark: "Dunkel",
    zoom_in: "Heranzoomen",
    zoom_out: "Herauszoomen",
    fullscreen: "Vollbild",
    exit_fullscreen: "Vollbild verlassen",
    reset_view: "Ansicht zurücksetzen",
    settings: "Einstellungen",
    show_timeline: "Zeitleiste anzeigen",
    autosave: "Automatisch speichern",
    panning: "Verschieben",
    show_debug_coordinates: "Debug-Koordinaten anzeigen",
    transform: "Transformation",
    viewbox: "Ansichtsfenster",
    cursor_coordinates: "Cursor-Koordinaten",
    coordinate_space: "Koordinatenraum",
    coordinate_space_screen: "Bildschirm",
    coordinate_space_diagram: "Diagramm",
    table_width: "Tabellenbreite",
    language: "Sprache",
    flush_storage: "Speicher leeren",
    are_you_sure_flush_storage:
      "Sind Sie sicher, dass Sie den Speicher leeren wollen? Dadurch werden alle Ihre Diagramme und benutzerdefinierten Vorlagen unwiderruflich gelöscht.",
    storage_flushed: "Speicher geleert",
    help: "Hilfe",
    shortcuts: "Tastenkürzel",
    ask_on_discord: "Fragen Sie uns auf Discord",
    feedback: "Feedback",
    no_changes: "Keine Änderungen",
    loading: "Laden...",
    last_saved: "Zuletzt gespeichert",
    saving: "Speichern...",
    failed_to_save: "Speichern fehlgeschlagen",
    fit_window_reset: "Fenster anpassen / Zurücksetzen",
    zoom: "Zoom",
    add_table: "Tabelle hinzufügen",
    add_area: "Bereich hinzufügen",
    add_note: "Notiz hinzufügen",
    add_type: "Typ hinzufügen",
    to_do: "Zu erledigen",
    tables: "Tabellen",
    relationships: "Beziehungen",
    subject_areas: "Themengebiete",
    notes: "Notizen",
    types: "Typen",
    search: "Suchen...",
    no_tables: "Keine Tabellen",
    no_tables_text: "Beginnen Sie mit dem Aufbau Ihres Diagramms!",
    no_relationships: "Keine Beziehungen",
    no_relationships_text: "Ziehen Sie, um Felder zu verbinden und Beziehungen herzustellen!",
    no_subject_areas: "Keine Themenbereiche",
    no_subject_areas_text: "Fügen Sie Themenbereiche zu Gruppentabellen hinzu!",
    no_notes: "Keine Notizen",
    no_notes_text: "Fügen Sie Notizen hinzu, um Ihr Diagramm zu kommentieren!",
    no_types: "Keine Typen",
    no_types_text: "Fügen Sie benutzerdefinierte Typen hinzu!",
    no_issues: "Keine Probleme gefunden.",
    strict_mode_is_on_no_issues:
      "Der strenge Modus ist ausgeschaltet, es werden keine Probleme angezeigt.",
    name: "Name",
    type: "Typ",
    null: "Null",
    not_null: "Nicht Null",
    primary: "Primär",
    unique: "Einzigartig",
    autoincrement: "Autoinkrement",
    default_value: "Standardwert",
    check: "Ausdruck prüfen",
    this_will_appear_as_is: "*Dies wird im generierten Skript so erscheinen.",
    comment: "Kommentar",
    add_field: "Feld hinzufügen",
    values: "Werte",
    size: "Größe",
    precision: "Präzision",
    set_precision: "Präzision festlegen: (Größe, Ziffern)",
    use_for_batch_input: "Verwenden Sie , für Batch-Input",
    indices: "Indizes",
    add_index: "Index hinzufügen",
    select_fields: "Felder auswählen",
    title: "Titel",
    not_set: "Nicht festgelegt",
    foreign: "Fremd",
    cardinality: "Kardinalität",
    on_update: "Beim Aktualisieren",
    on_delete: "Beim Löschen",
    swap: "Tauschen",
    one_to_one: "Eins zu eins",
    one_to_many: "Eins zu viele",
    many_to_one: "Viele zu eins",
    content: "Inhalt",
    types_info:
      "Diese Funktion ist für objekt-relationale DBMS wie PostgreSQL gedacht.\n" +
      "Bei Verwendung für MySQL oder MariaDB wird ein JSON-Typ mit der entsprechenden JSON-Validierungsprüfung erzeugt.\n" +
      "Bei Verwendung für SQLite wird es in ein BLOB übersetzt.\n" +
      "Bei der Verwendung für MSSQL wird ein Typ-Alias für das erste Feld erzeugt.",
    table_deleted: "Tabelle gelöscht",
    area_deleted: "Bereich gelöscht",
    note_deleted: "Notiz gelöscht",
    relationship_deleted: "Beziehung gelöscht",
    type_deleted: "Typ gelöscht",
    cannot_connect: "Kann nicht verbinden, die Spalten haben unterschiedliche Typen",
    copied_to_clipboard: "In die Zwischenablage kopiert",
    create_new_diagram: "Neues Diagramm erstellen",
    cancel: "Abbrechen",
    open_diagram: "Diagramm öffnen",
    rename_diagram: "Diagramm umbenennen",
    export: "Exportieren",
    export_image: "Bild exportieren",
    create: "Erstellen",
    confirm: "Bestätigen",
    last_modified: "Zuletzt geändert",
    created: "Erstellt",
    create_time: "Erstellungszeitpunkt",
    no_create_time: "Kein Erstellungszeitpunkt",
    drag_and_drop_files: "Ziehen Sie die Datei hierher oder klicken Sie, um sie hochzuladen.",
    upload_sql_to_generate_diagrams:
      "Laden Sie eine SQL-Datei hoch, um Ihre Tabellen und Spalten automatisch zu generieren.",
    overwrite_existing_diagram: "Vorhandenes Diagramm überschreiben",
    only_mysql_supported:
      "*Vorläufig wird nur das Laden von MySQL-Skripten unterstützt.",
    blank: "Leer",
    filename: "Dateiname",
    table_w_no_name: "Eine Tabelle ohne Namen wurde deklariert",
    duplicate_table_by_name: "Doppelte Tabelle mit dem Namen '{{tableName}}'",
    empty_field_name: "Leeres Feld `name` in der Tabelle '{{tableName}}'",
    empty_field_type: "Leeres Feld `type` in der Tabelle '{{tableName}}'",
    no_values_for_field:
      "Das Feld '{{fieldName}}' der Tabelle '{{tableName}}' ist vom Typ `{{type}}`, aber es wurden keine Werte angegeben",
    default_doesnt_match_type:
      "Der Standardwert für das Feld '{{fieldName}}' in der Tabelle '{{tableName}}' entspricht nicht seinem Typ",
    not_null_is_null:
      "Das Feld '{{fieldName}}' der Tabelle '{{tableName}}' ist NOT NULL, hat aber standardmäßig NULL",
    duplicate_fields:
      "Doppelte Tabellenfelder mit dem Namen '{{fieldName}}' in der Tabelle '{{tableName}}'",
    duplicate_index:
      "Doppelter Index mit dem Namen '{{indexName}}' in der Tabelle '{{tableName}}'",
    empty_index: "Der Index in Tabelle '{{tableName}}' indiziert keine Spalten",
    no_primary_key: "Tabelle '{{tableName}}' hat keinen Primärschlüssel",
    type_with_no_name: "Ein Typ ohne Namen wurde deklariert",
    duplicate_types: "Doppelte Typen mit dem Namen '{{typeName}}'",
    type_w_no_fields: "Ein leerer Typ '{{typeName}}' ohne Felder wurde deklariert",
    empty_type_field_name: "Leeres Feld `name` im Typ '{{typeName}}'",
    empty_type_field_type: "Leeres Feld `type` im Typ '{{typeName}}'",
    no_values_for_type_field:
      "Das Feld '{{fieldName}}' des Typs '{{typeName}}' ist vom Typ `{{type}}`, aber es wurden keine Werte angegeben",
    duplicate_type_fields:
      "Doppelte Typfelder mit dem Namen '{{fieldName}}' im Typ '{{typeName}}'",
    duplicate_reference: "Doppelte Referenz {{tableA}}.{{fieldA}} -> {{tableB}}.{{fieldB}}",
    circular_dependency: "Zirkuläre Abhängigkeit erkannt über Referenz {{tableA}}.{{fieldA}} -> {{tableB}}.{{fieldB}}",
    timeline: "Zeitleiste",
    priority: "Priorität",
    none: "Keine",
    low: "Niedrig",
    medium: "Mittel",
    high: "Hoch",
    sort_by: "Sortieren nach",
    my_order: "Meine Reihenfolge",
    completed: "Abgeschlossen",
    alphabetically: "Alphabetisch",
    add_task: "Aufgabe hinzufügen",
    details: "Details",
    no_tasks: "Sie haben keine Aufgaben.",
    no_activity: "Sie haben keine Aktivitäten.",
    move_element: "Verschiebe {{name}} nach {{coords}}",
    edit_area: "{{extra}} Bereich {{areaName}} bearbeiten",
    delete_area: "Bereich {{areaName}} löschen",
    edit_note: "{{extra}} Notiz {{noteTitle}} bearbeiten",
    delete_note: "Notiz {{noteTitle}} löschen",
    edit_table: "{{extra}} Tabelle {{tableName}} bearbeiten",
    delete_table: "Tabelle {{tableName}} löschen",
    edit_type: "{{extra}} Typ {{typeName}} bearbeiten",
    delete_type: "Typ {{typeName}} löschen",
    add_relationship: "Beziehung hinzufügen {{from}} -> {{to}}",
    edit_relationship: "{{extra}} Beziehung {{name}} bearbeiten",
    delete_relationship: "Beziehung {{name}} löschen",
    not_found: "Nicht gefunden",
    pick_db: "Datenbank auswählen",
    generic: "Generisch",
    generic_description: "Generische Diagramme können in jedes SQL-Format exportiert werden, unterstützen aber nur wenige Datentypen.",
    enums: "Aufzählungen",
    add_enum: "Aufzählung hinzufügen",
    edit_enum: "{{extra}} Aufzählung {{enumName}} bearbeiten",
    delete_enum: "Aufzählung löschen",
    enum_w_no_name: "Eine Aufzählung ohne Namen wurde deklariert",
    enum_w_no_values: "Eine leere Aufzählung '{{enumName}}' ohne Werte wurde deklariert",
    duplicate_enums: "Doppelte Aufzählungen mit dem Namen '{{enumName}}'",
    no_enums: "Keine Aufzählungen",
    no_enums_text: "Definieren Sie hier Aufzählungen",
    declare_array: "Array deklarieren",
    empty_index_name: "Ein Index ohne Namen wurde in Tabelle '{{tableName}}' deklariert",
    didnt_find_diagram: "Hoppla! Diagramm nicht gefunden.",
    unsigned: "Vorzeichenlos",
    share: "Teilen",
    unshare: "Freigabe aufheben",
    copy_link: "Link kopieren",
    readme: "README",
    failed_to_load: "Laden fehlgeschlagen. Stellen Sie sicher, dass der Link korrekt ist.",
    share_info: "* Das Teilen dieses Links erstellt keine Echtzeit-Zusammenarbeitssitzung.",
    show_relationship_labels: "Beziehungsbeschriftungen anzeigen",
    docs: "Dokumentation",
    supported_types: "Unterstützte Dateitypen:",
    column: "Spalte",
    diagram_list: "Diagrammliste",
    diagram_list_welcome: "Willkommen bei drawDB. Verwalten Sie hier alle Ihre Datenbankdiagramme.",
    type_description: "Typbeschreibung",
    add_attr: "Attribut hinzufügen",
    add_method: "Methode hinzufügen",
    save_to_diagram_list: "In Diagrammliste speichern",
    view_diagram_list: "Diagrammliste anzeigen",
    diagram_saved: "Diagramm in Liste gespeichert",
    
    // Versionskonfliktsübersetzungen
    version_conflict_title: "Diagramm-Versionskonflikt",
    version_conflict_message: "Dieses Diagramm wurde von einem anderen Benutzer geändert. Sie können die neueste Version neu laden oder Ihre Änderungen erzwingen.",
    reload_current_version: "Neueste Version laden",
    force_save: "Meine Änderungen erzwingen",
    
    // Fußzeile & Funktionen Übersetzungen
    all_rights_reserved: "Alle Rechte vorbehalten",
    more_than_editor: "Mehr als nur ein Editor",
    what_drawdb_offers: "Was drawDB zu bieten hat",
    export_description: "Exportieren Sie das DDL-Skript zur Ausführung in Ihrer Datenbank oder exportieren Sie das Diagramm als JSON oder Bild.",
    reverse_engineer: "Reverse Engineering",
    reverse_engineer_description: "Sie haben bereits ein Schema? Importieren Sie ein DDL-Skript, um ein Diagramm zu generieren.",
    customizable_workspace: "Anpassbarer Arbeitsbereich",
    customizable_workspace_description: "Passen Sie die Benutzeroberfläche an Ihre Vorlieben an. Wählen Sie die Komponenten, die Sie in Ihrer Ansicht haben möchten.",
    keyboard_shortcuts: "Tastenkürzel",
    keyboard_shortcuts_description: "Beschleunigen Sie die Entwicklung mit Tastenkürzeln. Sehen Sie alle verfügbaren Kürzel.",
    
    // DiagrammListe-Seite
    diagram_name: "Diagrammname",
    database_type: "Datenbanktyp",
    last_modified_time: "Zuletzt geändert",
    actions: "Aktionen",
    edit: "Bearbeiten",
    copy: "Kopieren",
    delete: "Löschen",
    success: "Erfolg",
    error: "Fehler",
    diagram_deleted: "Diagramm gelöscht",
    delete_diagram_failed: "Diagramm konnte nicht gelöscht werden",
    diagram_copied: "Diagramm dupliziert",
    copy_diagram_failed: "Diagramm konnte nicht dupliziert werden",
    duplicate: "Kopieren",
    search_diagram: "Diagramme durchsuchen",
    new_diagram: "Neues Diagramm",
    try_editor: "Editor ausprobieren",
    no_diagram_data: "Noch keine Diagramme",
    no_matching_diagrams: "Keine passenden Diagramme",
    click_to_create: "Klicken Sie auf die Schaltfläche unten, um Ihr erstes Diagramm zu erstellen",
    share_diagram: "Diagramm teilen",
    share_title: "Freigabetitel",
    share_link: "Freigabelink",
    create_share_link: "Freigabelink erstellen",
    share_link_created: "Freigabelink erstellt",
    create_share_failed: "Freigabelink konnte nicht erstellt werden",
    share_link_copied: "Freigabelink in die Zwischenablage kopiert",
    copy_share_link_failed: "Freigabelink konnte nicht kopiert werden",
    confirm_delete: "Löschen bestätigen",
    confirm_delete_diagram: "Sind Sie sicher, dass Sie {{name}} löschen möchten?",
    operation_irreversible: "Diese Operation ist nicht umkehrbar",
    get_diagram_list_failed: "Diagrammliste konnte nicht abgerufen werden",
    generic: "Generisch",
    link_removed: "Link entfernt",
    link_updated: "Link aktualisiert",
    update_link: "Link aktualisieren",
    get_diagram_detail_failed: "Diagrammdetails konnten nicht abgerufen werden",
    diagram_has_no_tables: "Dieses Diagramm hat keine Tabellen",
    this_diagram: "dieses Diagramm",
    diagram_illustration: "Datenbankdiagramm-Illustration",
    
    // Anzeigemodi
    display_as_grid: "Rasteransicht",
    display_as_table: "Tabellenansicht",
    
    // Filter- und Paginierungsübersetzungen
    filters: "Filter",
    advanced_filters: "Erweiterte Filter",
    reset: "Zurücksetzen",
    reset_filters: "Filter zurücksetzen",
    clear_all_filters: "Alle Filter löschen",
    select_database_type: "Datenbanktyp auswählen",
    no_database_types: "Keine Datenbanktypen verfügbar",
    create_time_range: "Erstellungszeitraum",
    update_time_range: "Aktualisierungszeitraum",
    start_date: "Startdatum",
    end_date: "Enddatum",
    locale_code: "de-DE",
    pagination: "Seitennummerierung",
    items_per_page: "Einträge pro Seite",
    items_per_page_colon: "Einträge pro Seite: ",
    total_pages: "Gesamtseiten",
    total_items: "Gesamteinträge",
    page: "Seite",
    no_matching_diagrams: "Keine Diagramme entsprechen Ihren Suchkriterien",
    search_diagram: "Diagramm nach Namen suchen",
    display_as_grid: "Als Raster anzeigen",
    display_as_table: "Als Tabelle anzeigen",
    diagram_has_no_tables: "Dieses Diagramm hat keine Tabellen",
    pagination_showing: "Zeige {{start}} bis {{end}} von {{total}} Diagrammen",
    pagination_showing_with_total: "Zeige {{start}} bis {{end}} von {{total}} Diagrammen",
    database: "Datenbanktyp",
    prev_page: "Zurück",
    next_page: "Weiter",
    go_to_page: "Gehe zu",
    
    // Zusammenarbeitsübersetzungen
    collaboration_connected: "Mit Zusammenarbeit verbunden",
    collaboration_disconnected: "Von Zusammenarbeit getrennt",
    collaboration_user_joined: "Benutzer {username} ist beigetreten",
    collaboration_user_left: "Benutzer {username} hat verlassen",
    collaboration_unknown_user: "Unbekannter Benutzer",
    collaboration_error: "Zusammenarbeitsfehler: {message}",
    online_users: "Online-Benutzer",
    you: "Sie",
    collaborators: "Mitarbeiter",
    no_collaborators: "Keine anderen Mitarbeiter",
    collaboration_panel_title: "Echtzeit-Zusammenarbeit",
    show_cursors: "Cursor anderer Benutzer anzeigen",
    your_name: "Ihr Name",
    change_name: "Name ändern",
    collaborating_with: "Zusammenarbeit mit {count} anderen",
    
    // Zusammenarbeitsfunktionen Übersetzungen
    collaboration: {
      connected: "Verbunden",
      connecting: "Verbindung wird hergestellt...",
      disconnected: "Getrennt",
      online: "Benutzer online",
      start: "Zusammenarbeit starten",
      stop: "Zusammenarbeit beenden",
      collaborators: "Mitarbeiter",
      statusLabel: "Zusammenarbeit",
      yourCursor: "Ihr Cursor",
      syncing: "Synchronisierung...",
      saved: "Über WebSocket gespeichert",
      error: "Verbindungsfehler",
      reconnecting: "Wiederverbindung...",
      userJoined: "{{username}} ist beigetreten",
      userLeft: "{{username}} hat verlassen",
      connectionLost: "Verbindung verloren, versuche erneut zu verbinden...",
      connectionRestored: "Verbindung wiederhergestellt"
    },
    
    grid_view: "Rasteransicht",
    table_view: "Tabellenansicht",
    name_required: "Name ist erforderlich",
    
    // WebSocket- und zusammenarbeitsbezogene Übersetzungen
    connecting_to_collaboration: "Verbindung zum Zusammenarbeitsdienst wird hergestellt...",
    connection_failed: "Verbindung fehlgeschlagen",
    reconnecting: "Versuche erneut zu verbinden ({{count}})...",
    synchronizing_data: "Daten werden synchronisiert...",
    auth_failed: "Authentifizierung fehlgeschlagen, bitte aktualisieren Sie die Seite, um es erneut zu versuchen",
    reconnect: "Erneut verbinden",
    reset_auth_status: "Authentifizierungsstatus zurücksetzen",
    refresh_page: "Seite aktualisieren",
    collaborator: "Mitarbeiter",
    realtime_collaboration: "Echtzeit-Zusammenarbeit",
    more_collaborators: "{{count}} weitere Mitarbeiter",
    user_joined: "{{username}} ist der Zusammenarbeit beigetreten",
    user_left: "{{username}} hat die Zusammenarbeit verlassen",
    connection_error: "Verbindungsfehler: {{message}}",
    websocket_error: "WebSocket-Fehler",
    websocket_disconnected: "WebSocket getrennt",
    websocket_auth_error: "WebSocket-Authentifizierungsfehler",
    operation_failed: "Operation fehlgeschlagen: {{error}}",
    connection_timeout: "Verbindungszeitüberschreitung",
    
    // Benutzeraktivitätsstatus Übersetzungen
    active_users: "Aktive Benutzer",
    active: "Aktiv",
    inactive: "Inaktiv",
    unknown: "Unbekannt",
    just_now: "Gerade eben",
    minutes_ago: "Vor {{minutes}} Minuten",
    hours_ago: "Vor {{hours}} Stunden",
    last_active: "Zuletzt aktiv",
    status: "Status",
    json_editor: "JSON-Editor"
  },
};

export { de, german };
