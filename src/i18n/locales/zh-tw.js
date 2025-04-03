const traditionalChinese = {
  name: "Traditional Chinese",
  native_name: "繁體中文",
  code: "zh-TW",
};

const zh_tw = {
  translation: {
    report_bug: "回報錯誤",
    import_from: "匯入",
    import: "匯入",
    file: "檔案",
    new: "新增",
    new_window: "新視窗",
    open: "開啟",
    save: "儲存",
    save_as: "另存新檔",
    save_as_template: "儲存為範本",
    template_saved: "範本已儲存！",
    rename: "重新命名",
    change_language: "變更語言",
    light_mode: "淺色模式",
    dark_mode: "深色模式",
    delete_diagram: "刪除圖表",
    are_you_sure_delete_diagram: "您確定要刪除此圖表嗎？此操作無法復原。",
    oops_smth_went_wrong: "糟糕！發生錯誤。",
    import_diagram: "匯入圖表",
    import_from_source: "從 SQL 匯入",
    export_as: "匯出為",
    export_source: "匯出 SQL",
    models: "模型",
    exit: "離開",
    edit: "編輯",
    undo: "復原",
    redo: "重做",
    clear: "清除",
    are_you_sure_clear: "您確定要清除圖表嗎？此操作無法復原。",
    cut: "剪下",
    copy: "複製",
    paste: "貼上",
    duplicate: "重複",
    delete: "刪除",
    copy_as_image: "複製為圖片",
    view: "檢視",
    header: "選單列",
    sidebar: "側邊欄",
    issues: "問題",
    presentation_mode: "簡報模式",
    strict_mode: "嚴謹模式",
    field_details: "欄位詳細資料",
    reset_view: "重設檢視",
    show_grid: "顯示格線",
    show_datatype: "顯示資料類型",
    show_cardinality: "顯示基數",
    theme: "佈景主題",
    light: "淺色",
    dark: "深色",
    zoom_in: "放大",
    zoom_out: "縮小",
    fullscreen: "全螢幕",
    exit_fullscreen: "退出全螢幕",
    settings: "設定",
    show_timeline: "顯示時間軸",
    autosave: "自動儲存",
    panning: "平移",
    show_debug_coordinates: "顯示除錯座標",
    transform: "變形",
    viewbox: "檢視框",
    cursor_coordinates: "游標座標",
    coordinate_space: "座標空間",
    coordinate_space_screen: "螢幕",
    coordinate_space_diagram: "圖表",
    table_width: "表格寬度",
    language: "語言",
    flush_storage: "清除儲存空間",
    are_you_sure_flush_storage:
      "您確定要清除儲存空間嗎？這將無法復原地刪除您所有的圖表和自訂範本。",
    storage_flushed: "儲存空間已清除",
    help: "說明",
    shortcuts: "快速鍵",
    ask_on_discord: "在 Discord 上詢問我們",
    feedback: "意見回饋",
    no_changes: "沒有變更",
    loading: "載入中...",
    last_saved: "上次儲存時間",
    saving: "儲存中...",
    failed_to_save: "儲存失敗",
    fit_window_reset: "合適視窗 / 重設",
    zoom: "縮放",
    add_table: "新增表格",
    add_area: "新增區域",
    add_note: "新增註解",
    add_type: "新增型別",
    to_do: "待辦事項",
    tables: "表格",
    relationships: "關聯",
    subject_areas: "主題區域",
    notes: "註解",
    types: "型別",
    search: "搜尋...",
    no_tables: "沒有表格",
    no_tables_text: "開始建立您的圖表！",
    no_relationships: "沒有關聯",
    no_relationships_text: "拖曳以連接欄位並建立關聯！",
    no_subject_areas: "沒有主題區域",
    no_subject_areas_text: "新增主題區域以將表格分組！",
    no_notes: "沒有註解",
    no_notes_text: "使用註解記錄額外資訊",
    no_types: "沒有型別",
    no_types_text: "建立您自己的自訂資料型別",
    no_issues: "未偵測到問題。",
    strict_mode_is_on_no_issues: "嚴謹模式已關閉，因此不會顯示任何問題。",
    name: "名稱",
    type: "型別",
    null: "允許空值",
    not_null: "不允許空值",
    primary: "主鍵",
    unique: "唯一",
    autoincrement: "自動遞增",
    default_value: "預設值",
    check: "檢查表達式",
    this_will_appear_as_is: "*這將按原樣顯示在產生的指令碼中。",
    comment: "註解",
    add_field: "新增欄位",
    values: "值",
    size: "大小",
    precision: "精確度",
    set_precision: "設定精確度：(大小，位數)",
    use_for_batch_input: "使用 , 進行批次輸入",
    indices: "索引",
    add_index: "新增索引",
    select_fields: "選擇欄位",
    title: "標題",
    not_set: "未設定",
    foreign: "外來鍵",
    cardinality: "基數",
    on_update: "更新時",
    on_delete: "刪除時",
    swap: "交換",
    one_to_one: "一對一",
    one_to_many: "一對多",
    many_to_one: "多對一",
    content: "內容",
    types_info:
      "此功能適用於像 PostgreSQL 這樣的物件關聯式資料庫管理系統。\n如果用於 MySQL 或 MariaDB，將產生具有相應 JSON 驗證檢查的 JSON 型別。\n如果用於 SQLite，它將被轉換為 BLOB。\n如果用於 MSSQL，將產生到第一個欄位的型別別名。",
    table_deleted: "表格已刪除",
    area_deleted: "區域已刪除",
    note_deleted: "註解已刪除",
    relationship_deleted: "關聯已刪除",
    type_deleted: "型別已刪除",
    cannot_connect: "無法連接，欄位型別不同",
    copied_to_clipboard: "已複製到剪貼簿",
    create_new_diagram: "建立新圖表",
    cancel: "取消",
    open_diagram: "開啟圖表",
    rename_diagram: "重新命名圖表",
    export: "匯出",
    export_image: "匯出圖片",
    create: "建立",
    confirm: "確認",
    last_modified: "上次修改時間",
    created: "已建立",
    create_time: "建立時間",
    no_create_time: "無建立時間",
    drag_and_drop_files: "拖曳檔案到此處或點選上傳。",
    upload_sql_to_generate_diagrams: "上傳 SQL 檔案以自動產生表格和欄位。",
    overwrite_existing_diagram: "覆寫現有圖表",
    only_mysql_supported: "*目前僅支援載入 MySQL 指令碼。",
    blank: "空白",
    filename: "檔案名稱",
    table_w_no_name: "宣告了一個沒有名稱的表格",
    duplicate_table_by_name: "表格名稱 '{{tableName}}' 重複",
    empty_field_name: "表格 '{{tableName}}' 中的欄位 `name` 為空",
    empty_field_type: "表格 '{{tableName}}' 中的欄位 `type` 為空",
    no_values_for_field:
      "表格 '{{tableName}}' 的 '{{fieldName}}' 欄位型別為 `{{type}}`，但未指定任何值",
    default_doesnt_match_type:
      "表格 '{{tableName}}' 中欄位 '{{fieldName}}' 的預設值與其型別不符",
    not_null_is_null:
      "表格 '{{tableName}}' 中的 '{{fieldName}}' 欄位為 NOT NULL，但預設值為 NULL",
    duplicate_fields: "表格 '{{tableName}}' 中的欄位名稱 '{{fieldName}}' 重複",
    duplicate_index: "表格 '{{tableName}}' 中的索引名稱 '{{indexName}}' 重複",
    empty_index: "表格 '{{tableName}}' 中的索引未指定任何欄位",
    no_primary_key: "表格 '{{tableName}}' 沒有主鍵",
    type_with_no_name: "宣告了一個沒有名稱的型別",
    duplicate_types: "型別名稱 '{{typeName}}' 重複",
    type_w_no_fields: "宣告了一個沒有欄位的空型別 '{{typeName}}'",
    empty_type_field_name: "型別 '{{typeName}}' 中的欄位 `name` 為空",
    empty_type_field_type: "型別 '{{typeName}}' 中的欄位 `type` 為空",
    no_values_for_type_field:
      "型別 '{{typeName}}' 的 '{{fieldName}}' 欄位型別為 `{{type}}`，但未指定任何值",
    duplicate_type_fields:
      "自訂型別 '{{typeName}}' 中的欄位名稱 '{{fieldName}}' 重複",
    duplicate_reference: "參考 {{tableA}}.{{fieldA}} -> {{tableB}}.{{fieldB}} 重複",
    circular_dependency: "通過參考 {{tableA}}.{{fieldA}} -> {{tableB}}.{{fieldB}} 檢測到循環依賴",
    timeline: "時間軸",
    priority: "優先順序",
    none: "無",
    low: "低",
    medium: "中",
    high: "高",
    sort_by: "排序方式",
    my_order: "我的排序",
    completed: "已完成",
    alphabetically: "按字母順序",
    add_task: "新增任務",
    details: "詳細資料",
    no_tasks: "您還沒有任務。",
    no_activity: "您還沒有活動。",
    move_element: "將 {{name}} 移動到 {{coords}}",
    edit_area: "{{extra}} 編輯區域 {{areaName}}",
    delete_area: "刪除區域 {{areaName}}",
    edit_note: "{{extra}} 編輯註解 {{noteTitle}}",
    delete_note: "刪除註解 {{noteTitle}}",
    edit_table: "{{extra}} 編輯表格 {{tableName}}",
    delete_table: "刪除表格 {{tableName}}",
    edit_type: "{{extra}} 編輯型別 {{typeName}}",
    delete_type: "刪除型別 {{typeName}}",
    add_relationship: "新增關聯 {{from}} -> {{to}}",
    edit_relationship: "{{extra}} 編輯關聯 {{name}}",
    delete_relationship: "刪除關聯 {{name}}",
    not_found: "沒有找到",
    pick_db: "選擇資料庫",
    generic: "通用",
    generic_description:
      "通用圖表可以匯出到任何 SQL 語法，但支援的資料型別較少。",
    enums: "列舉",
    add_enum: "新增列舉",
    edit_enum: "{{extra}} 編輯列舉 {{enumName}}",
    delete_enum: "刪除列舉",
    enum_w_no_name: "找到沒有名稱的列舉",
    enum_w_no_values: "找到沒有值的列舉 '{{enumName}}'",
    duplicate_enums: "列舉名稱 '{{enumName}}' 重複",
    no_enums: "沒有列舉",
    no_enums_text: "在此定義列舉",
    declare_array: "宣告陣列",
    empty_index_name: "在表格 '{{tableName}}' 中宣告了一個沒有名稱的索引",
    didnt_find_diagram: "糟糕！找不到圖表。",
    unsigned: "無符號",
    share: "分享",
    unshare: "取消分享",
    copy_link: "複製連結",
    readme: "README",
    failed_to_load: "載入失敗。請確保連結正確。",
    share_info:
      "* 分享此連結不會建立即時協作工作階段。",
    show_relationship_labels: "顯示關聯標籤",
    docs: "說明文件",
    supported_types: "支援的檔案類型：",
    column: "欄位",
    diagram_list: "圖表清單",
    diagram_list_welcome: "歡迎使用 drawDB。在這裡管理所有資料庫圖表。",
    type_description: "類型描述",
    add_attr: "新增屬性",
    add_method: "新增方法",
    save_to_diagram_list: "儲存到圖表清單",
    view_diagram_list: "檢視圖表清單",
    diagram_saved: "圖表已儲存到清單",
    
    // 版本衝突翻譯
    version_conflict_title: "圖表版本衝突",
    version_conflict_message: "此圖表已被其他使用者修改。您可以重新載入最新版本或強制儲存您的變更。",
    reload_current_version: "重新載入最新版本",
    force_save: "強制儲存我的變更",
    
    // 頁腳和功能翻譯
    all_rights_reserved: "版權所有",
    more_than_editor: "不只是編輯器",
    what_drawdb_offers: "drawDB 提供的功能",
    export_description: "匯出 DDL 指令碼以在資料庫中執行，或者將圖表匯出為 JSON 或圖片。",
    reverse_engineer: "反向工程",
    reverse_engineer_description: "已經有資料庫結構？匯入 DDL 指令碼生成圖表。",
    customizable_workspace: "可自訂工作區",
    customizable_workspace_description: "根據您的喜好自訂使用者介面。選擇您想要在視圖中顯示的組件。",
    keyboard_shortcuts: "鍵盤快速鍵",
    keyboard_shortcuts_description: "使用鍵盤快速鍵加速開發。查看所有可用的快速鍵。",
    
    // 圖表清單頁面
    diagram_name: "圖表名稱",
    database_type: "資料庫類型",
    last_modified_time: "最後修改時間",
    actions: "操作",
    edit: "編輯",
    copy: "複製",
    delete: "刪除",
    success: "成功",
    error: "錯誤",
    diagram_deleted: "圖表已刪除",
    delete_diagram_failed: "刪除圖表失敗",
    diagram_copied: "圖表已複製",
    copy_diagram_failed: "複製圖表失敗",
    duplicate: "複製",
    search_diagram: "搜尋圖表",
    new_diagram: "新增圖表",
    try_editor: "嘗試編輯器",
    no_diagram_data: "尚無圖表",
    no_matching_diagrams: "沒有符合的圖表",
    click_to_create: "點擊下方按鈕創建您的第一個圖表",
    share_diagram: "分享圖表",
    share_title: "分享標題",
    share_link: "分享連結",
    create_share_link: "建立分享連結",
    share_link_created: "分享連結已建立",
    create_share_failed: "建立分享連結失敗",
    share_link_copied: "分享連結已複製到剪貼簿",
    copy_share_link_failed: "複製分享連結失敗",
    confirm_delete: "確認刪除",
    confirm_delete_diagram: "您確定要刪除 {{name}} 嗎？",
    operation_irreversible: "此操作不可復原",
    get_diagram_list_failed: "獲取圖表清單失敗",
    generic: "通用",
    link_removed: "連結已移除",
    link_updated: "連結已更新",
    update_link: "更新連結",
    get_diagram_detail_failed: "獲取圖表詳細資料失敗",
    diagram_has_no_tables: "此圖表沒有表格",
    this_diagram: "此圖表",
    diagram_illustration: "資料庫圖表示意圖",
    
    // 顯示模式
    display_as_grid: "網格檢視",
    display_as_table: "表格檢視",
    
    // 篩選與分頁翻譯
    filters: "篩選條件",
    advanced_filters: "進階篩選",
    reset: "重設",
    reset_filters: "重設篩選條件",
    clear_all_filters: "清除所有篩選條件",
    select_database_type: "選擇資料庫類型",
    no_database_types: "沒有可用的資料庫類型",
    create_time_range: "建立時間範圍",
    update_time_range: "更新時間範圍",
    start_date: "開始日期",
    end_date: "結束日期",
    locale_code: "zh-TW",
    pagination: "分頁",
    items_per_page: "每頁項目數",
    items_per_page_colon: "每頁項目數：",
    total_pages: "總頁數",
    total_items: "總項目數",
    page: "頁",
    no_matching_diagrams: "沒有符合您搜尋條件的圖表",
    search_diagram: "按名稱搜尋圖表",
    display_as_grid: "以網格方式顯示",
    display_as_table: "以表格方式顯示",
    pagination_showing: "顯示 {{total}} 個圖表中的第 {{start}} 至 {{end}} 個",
    pagination_showing_with_total: "顯示總共 {{total}} 個圖表中的第 {{start}} 至 {{end}} 個",
    database: "資料庫類型",
    prev_page: "上一頁",
    next_page: "下一頁",
    go_to_page: "前往頁面",
    
    // 協作翻譯
    collaboration_connected: "已連接至協作",
    collaboration_disconnected: "已從協作中斷連接",
    collaboration_user_joined: "使用者 {username} 已加入",
    collaboration_user_left: "使用者 {username} 已離開",
    collaboration_unknown_user: "未知使用者",
    collaboration_error: "協作錯誤：{message}",
    online_users: "在線使用者",
    you: "您",
    collaborators: "協作者",
    no_collaborators: "沒有其他協作者",
    collaboration_panel_title: "即時協作",
    show_cursors: "顯示其他使用者的游標",
    your_name: "您的名稱",
    change_name: "變更名稱",
    collaborating_with: "與 {count} 位他人協作",
    
    // 協作功能翻譯
    collaboration: {
      connected: "已連接",
      connecting: "連接中...",
      disconnected: "已斷開",
      online: "位使用者在線",
      start: "開始協作",
      stop: "停止協作",
      collaborators: "協作者",
      statusLabel: "協作",
      yourCursor: "您的游標",
      syncing: "同步中...",
      saved: "已通過 WebSocket 儲存",
      error: "連接錯誤",
      reconnecting: "重新連接中...",
      userJoined: "{{username}} 已加入",
      userLeft: "{{username}} 已離開",
      connectionLost: "連接丟失，嘗試重新連接...",
      connectionRestored: "連接已恢復"
    },
    
    grid_view: "網格檢視",
    table_view: "表格檢視",
    name_required: "需要名稱",
    
    // WebSocket 和協作相關翻譯
    connecting_to_collaboration: "正在連接到協作服務...",
    connection_failed: "連接失敗",
    reconnecting: "嘗試重新連接 ({{count}})...",
    synchronizing_data: "正在同步數據...",
    auth_failed: "驗證失敗，請重新整理頁面重試",
    reconnect: "重新連接",
    reset_auth_status: "重設驗證狀態",
    refresh_page: "重新整理頁面",
    collaborator: "協作者",
    realtime_collaboration: "即時協作",
    more_collaborators: "還有 {{count}} 位協作者",
    user_joined: "{{username}} 已加入協作",
    user_left: "{{username}} 已離開協作",
    connection_error: "連接錯誤：{{message}}",
    websocket_error: "WebSocket 錯誤",
    websocket_disconnected: "WebSocket 已斷開",
    websocket_auth_error: "WebSocket 驗證錯誤",
    operation_failed: "操作失敗：{{error}}",
    connection_timeout: "連接超時",
    
    // 使用者活動狀態翻譯
    active_users: "活躍使用者",
    active: "活躍",
    inactive: "非活躍",
    unknown: "未知",
    just_now: "剛剛",
    minutes_ago: "{{minutes}} 分鐘前",
    hours_ago: "{{hours}} 小時前",
    last_active: "最後活躍時間",
    status: "狀態",
    json_editor: "JSON 編輯器"
  },
};

export { zh_tw, traditionalChinese };
