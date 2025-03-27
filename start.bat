@echo off
setlocal enabledelayedexpansion

REM 设置颜色
set GREEN=[32m
set YELLOW=[33m
set RED=[31m
set NC=[0m

REM 创建必要的目录
if not exist server\database mkdir server\database
if not exist backups mkdir backups

REM 命令行参数处理
set MODE=%1
if "%MODE%"=="" set MODE=prod

REM 显示帮助信息
if "%MODE%"=="help" (
  echo %GREEN%DrawDB 一键部署脚本%NC%
  echo 用法: start.bat [选项]
  echo.
  echo 选项:
  echo   dev       - 启动开发环境
  echo   prod      - 启动生产环境（默认）
  echo   local     - 在本地直接运行前后端（无Docker）
  echo   backup    - 立即执行数据库备份
  echo   local-backup - 手动备份本地数据库（不使用Docker）
  echo   stop      - 停止所有服务
  echo   restart   - 重启服务
  echo   logs      - 查看日志
  echo   help      - 显示帮助信息
  goto :EOF
)

REM 启动开发环境
if "%MODE%"=="dev" (
  echo %YELLOW%启动开发环境...%NC%
  docker-compose up -d drawdb-dev
  echo %GREEN%开发服务已启动!%NC%
  echo 访问地址: %GREEN%http://localhost:5173%NC%
  echo API地址: %GREEN%http://localhost:3002/api%NC%
  goto :EOF
)

REM 启动生产环境
if "%MODE%"=="prod" (
  echo %YELLOW%启动生产环境...%NC%
  docker-compose up -d drawdb-prod db-backup
  echo %GREEN%生产服务已启动!%NC%
  echo 访问地址: %GREEN%http://localhost:3000%NC%
  echo 数据库路径: %GREEN%%cd%\server\database\drawdb.sqlite%NC%
  echo 备份路径: %GREEN%%cd%\backups%NC%
  echo 备份时间: 每天凌晨2点自动备份，保留最近7天的备份
  goto :EOF
)

REM 本地直接运行（无Docker）
if "%MODE%"=="local" (
  echo %YELLOW%在本地直接运行前后端...%NC%
  
  REM 检查是否安装了依赖
  if not exist node_modules (
    echo %YELLOW%安装前端依赖...%NC%
    call npm install
  )
  
  if not exist server\node_modules (
    echo %YELLOW%安装后端依赖...%NC%
    cd server && call npm install && cd ..
  )
  
  echo %YELLOW%启动前后端服务...%NC%
  call npm start
  
  echo %GREEN%本地服务已启动!%NC%
  echo 前端地址: %GREEN%http://localhost:5173%NC%
  echo API地址: %GREEN%http://localhost:3001/api%NC%
  goto :EOF
)

REM 执行手动备份
if "%MODE%"=="backup" (
  echo %YELLOW%执行数据库备份...%NC%
  docker-compose --profile backup up db-backup-manual
  echo %GREEN%备份完成!%NC%
  echo 备份路径: %GREEN%%cd%\backups%NC%
  FOR /F "delims=" %%i IN ('dir /b /o-d backups\drawdb_*.sqlite 2^>nul') DO (
    echo 最新备份: %GREEN%backups\%%i%NC%
    goto :break_backup
  )
  :break_backup
  goto :EOF
)

REM 手动备份本地数据库（不使用Docker）
if "%MODE%"=="local-backup" (
  echo %YELLOW%执行本地数据库备份...%NC%
  
  REM 确保备份目录存在
  if not exist backups mkdir backups
  
  REM 获取当前日期时间作为文件名
  for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
  set "YYYY=%dt:~0,4%"
  set "MM=%dt:~4,2%"
  set "DD=%dt:~6,2%"
  set "HH=%dt:~8,2%"
  set "Min=%dt:~10,2%"
  set "Sec=%dt:~12,2%"
  set "datestamp=%YYYY%%MM%%DD%_%HH%%Min%%Sec%"
  
  copy "server\database\drawdb.sqlite" "backups\drawdb_%datestamp%.sqlite"
  echo %GREEN%备份完成!%NC%
REM 停止服务
if "%MODE%"=="stop" (
  echo %YELLOW%停止所有服务...%NC%
  docker-compose down
  echo %GREEN%所有服务已停止%NC%
  goto :EOF
)

REM 重启服务
if "%MODE%"=="restart" (
  echo %YELLOW%重启服务...%NC%
  docker-compose down
  echo %YELLOW%启动生产环境...%NC%
  docker-compose up -d drawdb-prod db-backup
  echo %GREEN%生产服务已启动!%NC%
  echo 访问地址: %GREEN%http://localhost:3000%NC%
  goto :EOF
)

REM 查看日志
if "%MODE%"=="logs" (
  echo %YELLOW%查看容器日志...%NC%
  docker-compose logs -f
  goto :EOF
)

REM 未知选项
echo %RED%未知选项: %MODE%%NC%
echo 用法: start.bat [dev^|prod^|backup^|stop^|restart^|logs^|help]
echo 使用 start.bat help 查看帮助信息

endlocal 