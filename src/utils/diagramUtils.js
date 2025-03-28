/**
 * 图表相关工具函数
 * 提供处理和转换图表数据的通用方法
 */

/**
 * 创建一个示例表用于预览图表
 * 当图表没有实际表时使用此函数创建示例表
 * 
 * @param {string} database 数据库类型
 * @param {string} name 图表名称
 * @returns {Object} 包含示例表的图表数据 
 */
export function createSampleDiagram(database, name) {
  return {
    tables: [
      {
        id: 0,
        name: name.length > 10 ? name.substring(0, 10) + '...' : name,
        x: 10,
        y: 10,
        width: 180,
        height: 100,
        fields: [
          {
            name: 'id',
            type: 'INTEGER',
            default: '',
            check: '',
            primary: true,
            unique: true,
            notNull: true,
            increment: true,
            comment: '',
            id: 0
          },
          {
            name: 'name',
            type: 'VARCHAR(255)',
            default: '',
            check: '',
            primary: false,
            unique: false,
            notNull: true,
            increment: false,
            comment: '',
            id: 1
          }
        ],
        comment: '',
        indices: [],
        color: '#2f68ad',
        key: Date.now()
      }
    ],
    relationships: []
  };
}

/**
 * 标准化图表数据，确保所有字段都是标准格式
 * 
 * @param {Object} diagram 原始图表数据
 * @returns {Object} 标准化后的图表数据
 */
export function normalizeDiagramData(diagram) {
  if (!diagram) return null;
  
  try {
    // 确保tables和relationships都是数组
    let tables = Array.isArray(diagram.tables) ? diagram.tables : [];
    
    // 兼容旧版数据结构，references字段和relationships字段都可能存在
    let relationships = Array.isArray(diagram.references) 
      ? diagram.references 
      : (Array.isArray(diagram.relationships) ? diagram.relationships : []);
    
    // 确保至少有一个表格才显示预览，否则创建示例表格
    if (tables.length > 0) {
      // 创建新对象，但不包含原始的zoom和pan属性
      const { zoom, pan, ...diagramWithoutTransform } = diagram;
      return { 
        ...diagramWithoutTransform,
        tables, 
        references: relationships
      };
    } else {
      console.log('图表没有表格数据，创建示例表:', diagram.id);
      // 使用createSampleDiagram创建示例表格
      const sampleDiagram = createSampleDiagram(diagram.database, diagram.name || '');
      return {
        ...diagram,
        tables: sampleDiagram.tables,
        references: sampleDiagram.relationships
      };
    }
  } catch (error) {
    console.error('解析图表数据失败', error);
    // 出错时也创建示例表格
    const sampleDiagram = createSampleDiagram('GENERIC', diagram.name || 'Unnamed');
    return {
      ...diagram,
      tables: sampleDiagram.tables,
      references: sampleDiagram.relationships
    };
  }
}

/**
 * 获取表格的完整信息，包含计算字段
 * 
 * @param {Object} table 表格数据
 * @returns {Object} 包含计算字段的表格数据
 */
export function getTableWithDimensions(table) {
  if (!table) return null;
  
  return {
    ...table,
    width: table.width || 180,
    height: table.height || (table.fields?.length * 30 + 40) || 100
  };
}

/**
 * 计算图表可见区域
 * 
 * @param {Array} tables 表格数组
 * @param {number} padding 边界填充像素
 * @returns {Object} 包含边界信息的对象
 */
export function calculateDiagramBounds(tables, padding = 100) {
  if (!tables || tables.length === 0) {
    return {
      minX: -padding,
      minY: -padding,
      maxX: padding,
      maxY: padding,
      width: 2 * padding,
      height: 2 * padding,
      centerX: 0,
      centerY: 0
    };
  }
  
  // 确保所有表格都有宽度和高度
  const tablesWithDimensions = tables.map(table => getTableWithDimensions(table));
  
  // 计算所有表格的边界点
  const allPoints = tablesWithDimensions.flatMap(table => [
    { x: table.x, y: table.y },
    { x: table.x + table.width, y: table.y + table.height }
  ]);
  
  // 计算边界框
  const minX = Math.min(...allPoints.map(p => p.x)) - padding;
  const minY = Math.min(...allPoints.map(p => p.y)) - padding;
  const maxX = Math.max(...allPoints.map(p => p.x)) + padding;
  const maxY = Math.max(...allPoints.map(p => p.y)) + padding;
  
  // 计算尺寸和中心点
  const width = maxX - minX;
  const height = maxY - minY;
  const centerX = minX + width / 2;
  const centerY = minY + height / 2;
  
  return {
    minX,
    minY,
    maxX,
    maxY,
    width,
    height,
    centerX,
    centerY
  };
} 