/**
 * 运行时配置文件
 * 这个文件允许在Docker容器部署后动态修改前端配置
 * 通过环境变量注入或者在运行时手动修改此文件
 */
window.RUNTIME_CONFIG = {
  // 运行时可配置参数
  DEBUG: false,
  VERSION: '1.0.0'
}; 