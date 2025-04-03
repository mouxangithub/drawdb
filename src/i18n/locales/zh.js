const chinese = {
  name: "Simplified Chinese",
  native_name: "简体中文",
  code: "zh",
};

const zh = {
  translation: {
    report_bug: "报告问题",
    import_from: "导入",
    import: "导入",
    file: "文件",
    new: "新建",
    new_window: "在新标签中打开",
    open: "打开",
    save: "保存",
    save_as: "另存为",
    save_as_template: "保存为模板",
    template_saved: "模板已保存！",
    rename: "重命名",
    change_language: "切换语言",
    light_mode: "浅色模式",
    dark_mode: "深色模式",
    delete_diagram: "删除图表",
    are_you_sure_delete_diagram: "确定要删除此图表吗？此操作不可逆转。",
    oops_smth_went_wrong: "糟糕！出了些问题。",
    import_diagram: "导入图表",
    import_from_source: "导入 SQL 源代码",
    export_as: "导出为",
    export_source: "导出为 SQL 源代码",
    models: "模型",
    exit: "退出",
    edit: "编辑",
    undo: "撤销",
    redo: "恢复",
    clear: "清除",
    are_you_sure_clear: "确定要清除图表吗？此操作不可逆转。",
    cut: "剪切",
    copy: "复制",
    paste: "粘贴",
    duplicate: "克隆",
    delete: "删除",
    copy_as_image: "复制画布为图片",
    view: "视图",
    header: "菜单栏",
    sidebar: "侧边栏",
    issues: "问题",
    presentation_mode: "演示模式",
    strict_mode: "严格模式",
    field_details: "字段详情",
    reset_view: "重置视图",
    show_grid: "显示网格",
    show_cardinality: "显示关系",
    theme: "主题",
    light: "浅色",
    dark: "深色",
    zoom_in: "放大",
    zoom_out: "缩小",
    fullscreen: "全屏",
    exit_fullscreen: "退出全屏",
    settings: "设置",
    show_timeline: "修改记录",
    autosave: "自动保存",
    panning: "画布可拖动",
    table_width: "表格宽度",
    language: "语言",
    flush_storage: "清除存储",
    are_you_sure_flush_storage:
      "您确定要清除存储吗？此操作将无法恢复地删除您所有的图表和自定义模板。",
    storage_flushed: "存储已清空",
    help: "帮助",
    shortcuts: "快捷键",
    ask_on_discord: "在 Discord 联系我们",
    feedback: "反馈",
    no_changes: "没有更改",
    loading: "加载中...",
    last_saved: "上次保存",
    saving: "保存中...",
    failed_to_save: "保存失败",
    fit_window_reset: "适应窗口/重置",
    zoom: "缩放",
    add_table: "添加表",
    add_area: "添加区域",
    add_note: "添加注释",
    add_type: "添加类型",
    to_do: "待办事项",
    tables: "表",
    relationships: "关系",
    subject_areas: "主题区域",
    notes: "注释",
    types: "类型",
    search: "搜索...",
    no_tables: "空空如也",
    no_tables_text: "开始构建您的图表！",
    no_relationships: "空空如也",
    no_relationships_text: "拖动以连接字段并形成关系！",
    no_subject_areas: "空空如也",
    no_subject_areas_text: "添加主题区域以分组表！",
    no_notes: "空空如也",
    no_notes_text: "使用注释记录额外信息",
    no_types: "空空如也",
    no_types_text: "制作您自己的自定义数据类型",
    no_issues: "未检测到问题。",
    strict_mode_is_on_no_issues: "严格模式已关闭，因此不会显示任何问题。",
    name: "名称",
    type: "类型",
    null: "空",
    not_null: "非空",
    primary: "主键",
    unique: "唯一",
    autoincrement: "自增",
    default_value: "默认值",
    check: "检查表达式",
    this_will_appear_as_is: "*此内容将按原样显示在生成的脚本中。",
    comment: "注释",
    add_field: "添加字段",
    values: "值",
    size: "大小",
    precision: "精度",
    set_precision: "设置精度：(大小，位数)",
    use_for_batch_input: "用于批量输入，使用逗号",
    indices: "索引",
    add_index: "添加索引",
    select_fields: "选择字段",
    title: "标题",
    not_set: "未设置",
    foreign: "外键",
    cardinality: "关系映射",
    on_update: "更新时",
    on_delete: "删除时",
    swap: "交换",
    one_to_one: "一对一",
    one_to_many: "一对多",
    many_to_one: "多对一",
    content: "内容",
    types_info:
      "此功能适用于像 PostgreSQL 这样的对象关系型数据库管理系统。\n如果用于 MySQL 或 MariaDB，将生成具有相应 JSON 验证检查的 JSON 类型。\n如果用于 SQLite，它将被转换为 BLOB。\n如果用于 MSSQL，将生成到第一个字段的类型别名。",
    table_deleted: "表已删除",
    area_deleted: "区域已删除",
    note_deleted: "注释已删除",
    relationship_deleted: "关系已删除",
    type_deleted: "类型已删除",
    cannot_connect: "无法连接，列具有不同的类型",
    copied_to_clipboard: "已复制到剪贴板",
    create_new_diagram: "创建新图表",
    cancel: "取消",
    open_diagram: "打开图表",
    rename_diagram: "重命名图表",
    export: "导出",
    export_image: "导出图像",
    create: "创建",
    confirm: "确认",
    last_modified: "最后修改",
    created: "创建于",
    create_time: "创建时间",
    no_create_time: "未知创建时间",
    drag_and_drop_files: "拖放文件到此处或点击上传。",
    upload_sql_to_generate_diagrams: "上传 SQL 文件以自动生成表和列。",
    overwrite_existing_diagram: "覆盖现有图表",
    only_mysql_supported: "目前仅支持加载 MySQL 脚本。",
    blank: "空",
    filename: "文件名",
    table_w_no_name: "声明了一个没有名称的表",
    duplicate_table_by_name: "重复声明了名为 '{{tableName}}' 的表",
    empty_field_name: "表 '{{tableName}}' 中的字段 `name` 为空",
    empty_field_type: "表 '{{tableName}}' 中的字段 `type` 为空",
    no_values_for_field:
      "表 '{{tableName}}' 的 '{{fieldName}}' 字段类型为 `{{type}}`，但未指定任何值",
    default_doesnt_match_type:
      "表 '{{tableName}}' 中字段 '{{fieldName}}' 的默认值与其类型不匹配",
    not_null_is_null:
      "表 '{{tableName}}' 中的 '{{fieldName}}' 字段为 NOT NULL，但默认值为 NULL",
    duplicate_fields:
      "在表 '{{tableName}}' 中重复声明了名为 '{{fieldName}}' 的字段",
    duplicate_index:
      "在表 '{{tableName}}' 中重复声明了名为 '{{indexName}}' 的索引",
    empty_index: "在表 '{{tableName}}' 中的索引未指定任何列",
    no_primary_key: "表 '{{tableName}}' 没有主键",
    type_with_no_name: "声明了一个没有名称的类型",
    duplicate_types: "重复声明了名为 '{{typeName}}' 的类型",
    type_w_no_fields: "声明了一个没有字段的空类型 '{{typeName}}'",
    empty_type_field_name: "类型 '{{typeName}}' 中的字段 `name` 为空",
    empty_type_field_type: "类型 '{{typeName}}' 中的字段 `type` 为空",
    no_values_for_type_field:
      "类型 '{{typeName}}' 的 '{{fieldName}}' 字段类型为 `{{type}}`，但未指定任何值",
    duplicate_type_fields:
      "在自定义类 '{{typeName}}' 中重复声明了名为 '{{fieldName}}' 的字段",
    duplicate_reference: "重复声明了名为 '{{refName}}' 的引用",
    circular_dependency: "涉及到表 '{{refName}}' 的循环依赖",
    timeline: "时间轴",
    priority: "优先级",
    none: "无",
    low: "低",
    medium: "中",
    high: "高",
    sort_by: "排序方式",
    my_order: "我的排序",
    completed: "已完成",
    alphabetically: "按字母顺序",
    add_task: "添加任务",
    details: "详情",
    no_tasks: "您还没有任务。",
    no_activity: "您还没有活动。",
    move_element: "将 {{name}} 移动到 {{coords}}",
    edit_area: "{{extra}} 编辑区域 {{areaName}}",
    delete_area: "删除区域 {{areaName}}",
    edit_note: "{{extra}} 编辑注释 {{noteTitle}}",
    delete_note: "删除注释 {{noteTitle}}",
    edit_table: "{{extra}} 编辑表格 {{tableName}}",
    delete_table: "删除表格 {{tableName}}",
    edit_type: "{{extra}} 编辑类型 {{typeName}}",
    delete_type: "删除类型 {{typeName}}",
    add_relationship: "添加关系 {{from}} -> {{to}}",
    edit_relationship: "{{extra}} 编辑关系 {{name}}",
    delete_relationship: "删除关系 {{name}}",
    not_found: "未找到",
    column: "列",
    diagram_list: "图形列表",
    share: "分享",
    share_diagram: "分享图表",
    share_title: "分享标题",
    share_link: "分享链接",
    create_share_link: "创建分享链接",
    link_created: "链接已创建",
    create_share_failed: "创建分享失败",
    share_link_copied: "分享链接已复制到剪贴板",
    copy_share_link_failed: "复制分享链接失败",
    link_updated: "链接已更新",
    link_removed: "链接已移除",
    copied_to_clipboard: "已复制到剪贴板",
    unshare: "取消分享",
    share_info: "* 通过此链接可以直接访问图表查看和编辑",
    no_diagram_to_share: "没有可分享的图表",
    close: "关闭",
    diagram_list_welcome: "欢迎使用 drawDB 数据库设计工具，在这里可以管理您的所有数据库图表设计",
    type_description: "类型描述",
    add_attr: "添加属性",
    add_method: "添加方法",
    save_to_diagram_list: "保存到图形列表",
    view_diagram_list: "查看图形列表",
    diagram_saved: "图表已保存到图形列表",
    
    // 版本冲突相关翻译
    version_conflict_title: "图表版本冲突",
    version_conflict_message: "当前图表已被其他用户修改。您可以重新加载最新版本，或强制保存您的更改。",
    reload_current_version: "重新加载最新版本",
    force_save: "强制保存我的更改",
    
    // WebSocket和协作功能翻译
    connecting_to_collaboration: "正在连接到协作服务...",
    connection_failed: "连接失败",
    reconnecting: "尝试重新连接 ({{count}})...",
    synchronizing_data: "正在同步数据...",
    auth_failed: "认证失败，请刷新页面重试",
    reconnect: "重新连接",
    reset_auth_status: "重置认证状态",
    refresh_page: "刷新页面",
    collaborator: "协作用户",
    realtime_collaboration: "实时协作中",
    more_collaborators: "还有{{count}}位协作者",
    user_joined: "{{username}}已加入协作",
    user_left: "{{username}}已离开协作",
    connection_error: "连接错误：{{message}}",
    websocket_error: "WebSocket错误",
    websocket_disconnected: "WebSocket连接已断开",
    websocket_auth_error: "WebSocket认证错误",
    operation_failed: "操作失败: {{error}}",
    connection_timeout: "连接超时",
    
    // Footer & Features 组件翻译
    all_rights_reserved: "版权所有",
    more_than_editor: "不止是编辑器",
    what_drawdb_offers: "drawDB提供的功能",
    export_description: "将图表导出为SQL脚本，JSON或图像",
    reverse_engineer: "反向工程",
    reverse_engineer_description: "从现有SQL脚本导入并生成图表",
    customizable_workspace: "自定义工作区",
    customizable_workspace_description: "根据个人喜好自定义界面和组件",
    keyboard_shortcuts: "键盘快捷键",
    keyboard_shortcuts_description: "使用快捷键加速开发和设计流程",
    
    // DiagramList页面
    diagram_name: "图表名称",
    database_type: "数据库类型",
    last_modified_time: "最后修改时间",
    actions: "操作",
    edit: "编辑",
    copy: "复制",
    delete: "删除",
    success: "成功",
    error: "错误",
    diagram_deleted: "图表已删除",
    delete_diagram_failed: "删除图表失败",
    diagram_copied: "图表已复制",
    copy_diagram_failed: "复制图表失败",
    create_diagram_failed: "创建图表失败",
    duplicate: "副本",
    search_diagram: "按名称搜索图表",
    new_diagram: "新建图表",
    try_editor: "试用编辑器",
    no_diagram_data: "暂无图表数据",
    no_matching_diagrams: "没有符合筛选条件的图表",
    click_to_create: "点击下方按钮创建您的第一个图表",
    confirm_delete: "确认删除",
    confirm_delete_diagram: "确定要删除 {{name}} 吗？",
    operation_irreversible: "此操作不可撤销",
    get_diagram_list_failed: "获取图表列表失败",
    get_diagram_detail_failed: "获取图表详情失败",
    generic: "通用",
    generic_description: "通用图表可以导出为任何SQL格式，但支持的数据类型较少。",
    enums: "枚举",
    add_enum: "添加枚举",
    edit_enum: "{{extra}} 编辑枚举 {{enumName}}",
    delete_enum: "删除枚举",
    enum_w_no_name: "声明了一个没有名称的枚举",
    enum_w_no_values: "声明了一个没有值的空枚举 '{{enumName}}'",
    duplicate_enums: "重复声明了名为 '{{enumName}}' 的枚举",
    no_enums: "没有枚举",
    no_enums_text: "在此定义枚举",
    update_link: "更新链接",
    copy_link: "复制链接",
    unsigned: "无符号",
    diagram_has_no_tables: "此图表没有表格",
    this_diagram: "此图表",
    diagram_illustration: "数据库图表示意图",
    
    // 显示模式
    display_as_grid: "网格视图",
    display_as_table: "表格视图",
    
    // 筛选和分页相关翻译
    filters: "筛选",
    advanced_filters: "高级筛选",
    reset: "重置",
    reset_filters: "重置筛选",
    clear_all_filters: "清除所有筛选",
    database_type: "数据库类型",
    select_database_type: "选择数据库类型",
    no_database_types: "暂无可用数据库类型",
    create_time_range: "创建时间范围",
    update_time_range: "修改时间范围",
    start_date: "开始日期",
    end_date: "结束日期",
    locale_code: "zh-CN",
    pagination: "分页",
    items_per_page: "每页项目数",
    items_per_page_colon: "每页项目数：",
    total_pages: "总页数",
    total_items: "总项目数",
    page: "页",
    pagination_showing: "显示 {{start}} 到 {{end}}，共 {{total}} 个图表",
    pagination_showing_with_total: "显示 {{start}} 到 {{end}}，共 {{total}} 个图表",
    database: "数据库类型",
    prev_page: "上一页",
    next_page: "下一页",
    go_to_page: "跳转到",
    
    // 协同编辑相关翻译
    collaboration_connected: "已连接到协同编辑",
    collaboration_disconnected: "已断开协同编辑连接",
    collaboration_user_joined: "用户 {{username}} 已加入",
    collaboration_user_left: "用户 {{username}} 已离开",
    collaboration_unknown_user: "未知用户",
    collaboration_error: "协同编辑错误: {{message}}",
    collaboration_error_title: "协同编辑错误",
    online_users: "在线用户",
    you: "你",
    collaborators: "协作者",
    no_collaborators: "暂无其他协作者",
    collaboration_panel_title: "实时协作",
    show_cursors: "显示其他用户光标",
    your_name: "你的名称",
    change_name: "修改名称",
    collaborating_with: "正在与 {{count}} 人协作",
    
    // 协作功能相关翻译
    collaboration: {
      connected: "已连接",
      connecting: "连接中...",
      disconnected: "已断开",
      online: "用户在线",
      start: "开始协作",
      stop: "停止协作",
      collaborators: "协作者",
      statusLabel: "协作",
      yourCursor: "你的光标",
      syncing: "同步中...",
      saved: "已通过WebSocket保存",
      error: "连接错误",
      reconnecting: "重新连接中...",
      userJoined: "{{username}} 已加入",
      userLeft: "{{username}} 已离开",
      connectionLost: "连接丢失，尝试重新连接...",
      connectionRestored: "连接已恢复"
    },
    
    grid_view: "网格视图",
    table_view: "表格视图",
    name_required: "名称为必填项",
    
    // 新增协作功能翻译
    collaboration_connect: "连接协作",
    collaboration_disconnect: "断开协作",
    collaboration_users: "用户",
    collaboration_status_connected: "协作已连接",
    collaboration_status_disconnected: "协作已断开",
    collaboration_online_users: "在线用户 ({{count}})",
    collaboration_no_users: "暂无在线用户",
    collaboration_show_cursors: "显示用户光标",
    collaboration_merge_operation: "需要合并操作",
    collaboration_merge_operation_content: "用户 {{username}} 的操作需要合并",
    
    // 编辑指示器翻译
    editing_indicator_tooltip: "{{username}} 正在编辑",
    editing_indicator_time: "{{time}}",
    collaborators_list_title: "在线用户 ({{count}})",
    collaborators_list_empty: "暂无在线用户",
    collaborators_list_you: "你",
    collaborators_list_editing: "正在编辑",
    collaborators_list_editing_component: "正在编辑 {{component}}",
    
    // 用户活跃状态相关
    active_users: "活跃用户",
    active: "活跃",
    inactive: "不活跃",
    unknown: "未知",
    just_now: "刚刚",
    minutes_ago: "{{minutes}}分钟前",
    hours_ago: "{{hours}}小时前",
    last_active: "最后活跃",
    status: "状态",
    declare_array: "声明数组",
    empty_index_name: "在表'{{tableName}}'中声明了一个没有名称的索引",
    didnt_find_diagram: "哎呀！没有找到图表。",
    json_editor: "JSON编辑器",
    
    // 添加JSON校验相关翻译
    json_format_error: "JSON格式错误",
    json_invalid_structure: "JSON结构无效",
    check_json_format: "请检查JSON格式和对象结构",
    line: "行",
    error_line_content: "错误行内容",
    position: "位置",
    json_schema_validation_error: "JSON模式验证错误",
    please_check_json_schema: "请检查JSON格式是否符合要求的结构",
    field_missing: "缺少必填字段",
    invalid_type: "字段类型无效",
    unexpected_field: "意外的字段",
    invalid_format: "格式无效",
    tables_format_error: "表格格式错误",
    relationships_format_error: "关系格式错误",
    notes_format_error: "注释格式错误",
    subject_areas_format_error: "主题区域格式错误",
    types_format_error: "类型格式错误",
    enums_format_error: "枚举格式错误",
    
    // 数据库选择对话框相关
    pick_db: "选择数据库类型",
    diagram_name: "图表名称",
    enter_diagram_name: "请输入图表名称",
    confirm: "确认",
    create_diagram_failed: "创建图表失败",
    diagram_id_empty: "图表ID不能为空",
    diagram_not_found: "图表不存在",
    get_diagram_failed: "获取图表失败",
    no_permission_to_access: "没有权限访问该图表",
    server_error: "服务器错误，请稍后重试",
    network_error: "网络连接错误，请检查网络设置",
    no_saved_diagrams: "没有保存的图表",
  },
};

export { chinese, zh };
export default zh;
