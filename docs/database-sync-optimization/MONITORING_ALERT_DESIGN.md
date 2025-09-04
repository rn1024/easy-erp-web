# 数据库同步监控告警系统设计方案

## 📋 方案概述

基于 Easy ERP 项目的数据库同步优化需求，设计全面的监控告警系统，实现对数据库迁移、备份恢复、性能指标的实时监控和智能告警，确保系统稳定性和数据安全性。

## 🎯 设计目标

### 核心目标
- **全链路监控**: 覆盖数据库迁移、备份恢复、性能监控的完整链路
- **智能告警**: 基于规则引擎和机器学习的智能告警机制
- **实时响应**: 毫秒级指标收集，秒级告警响应
- **可视化**: 直观的监控仪表板和告警管理界面
- **集成性**: 与 CI/CD、Slack、邮件等系统无缝集成

### 性能指标
- **监控延迟**: 指标收集延迟 ≤ 100ms
- **告警响应**: 告警触发到通知 ≤ 30秒
- **可用性**: 监控系统可用性 ≥ 99.9%
- **准确性**: 误报率 ≤ 1%，漏报率 ≤ 0.1%

## 🏗️ 架构设计

### 整体架构图
```mermaid
graph TB
    subgraph "数据采集层"
        A1["数据库指标采集器"]
        A2["应用指标采集器"]
        A3["系统指标采集器"]
        A4["日志采集器"]
        A5["事件采集器"]
    end
    
    subgraph "数据处理层"
        B1["指标聚合器"]
        B2["数据清洗器"]
        B3["规则引擎"]
        B4["异常检测器"]
        B5["趋势分析器"]
    end
    
    subgraph "存储层"
        C1["时序数据库<br/>(InfluxDB)"]
        C2["元数据存储<br/>(MySQL)"]
        C3["日志存储<br/>(Elasticsearch)"]
        C4["配置存储<br/>(Redis)"]
    end
    
    subgraph "告警层"
        D1["告警管理器"]
        D2["通知路由器"]
        D3["告警抑制器"]
        D4["升级处理器"]
    end
    
    subgraph "可视化层"
        E1["监控仪表板"]
        E2["告警控制台"]
        E3["报表生成器"]
        E4["API网关"]
    end
    
    subgraph "通知渠道"
        F1["邮件通知"]
        F2["Slack通知"]
        F3["短信通知"]
        F4["Webhook通知"]
        F5["移动推送"]
    end
    
    A1 --> B1
    A2 --> B1
    A3 --> B1
    A4 --> B2
    A5 --> B2
    
    B1 --> C1
    B2 --> C3
    B3 --> D1
    B4 --> D1
    B5 --> C1
    
    C1 --> E1
    C2 --> E2
    C3 --> E3
    C4 --> B3
    
    D1 --> D2
    D2 --> F1
    D2 --> F2
    D2 --> F3
    D2 --> F4
    D2 --> F5
    
    E1 --> E4
    E2 --> E4
    E3 --> E4
```

### 监控维度设计

#### 1. 数据库同步监控
```mermaid
graph LR
    subgraph "迁移监控"
        A1["迁移状态"]
        A2["迁移进度"]
        A3["迁移耗时"]
        A4["数据一致性"]
        A5["错误统计"]
    end
    
    subgraph "备份监控"
        B1["备份状态"]
        B2["备份大小"]
        B3["备份耗时"]
        B4["存储使用率"]
        B5["完整性验证"]
    end
    
    subgraph "性能监控"
        C1["连接数"]
        C2["查询性能"]
        C3["锁等待"]
        C4["缓存命中率"]
        C5["磁盘I/O"]
    end
    
    subgraph "系统监控"
        D1["CPU使用率"]
        D2["内存使用率"]
        D3["磁盘空间"]
        D4["网络流量"]
        D5["进程状态"]
    end
```

## 🔧 技术实现方案

### 1. 核心接口设计

```typescript
// 监控服务核心接口
interface MonitoringService {
  // 指标收集
  collectMetrics(source: MetricSource, metrics: Metric[]): Promise<void>
  
  // 查询指标
  queryMetrics(query: MetricQuery): Promise<MetricResult[]>
  
  // 注册告警规则
  registerAlertRule(rule: AlertRule): Promise<string>
  
  // 更新告警规则
  updateAlertRule(ruleId: string, rule: AlertRule): Promise<boolean>
  
  // 删除告警规则
  deleteAlertRule(ruleId: string): Promise<boolean>
  
  // 获取告警历史
  getAlertHistory(filter: AlertFilter): Promise<Alert[]>
}

// 告警服务接口
interface AlertService {
  // 触发告警
  triggerAlert(alert: Alert): Promise<void>
  
  // 确认告警
  acknowledgeAlert(alertId: string, userId: string): Promise<boolean>
  
  // 解决告警
  resolveAlert(alertId: string, resolution: AlertResolution): Promise<boolean>
  
  // 抑制告警
  suppressAlert(alertId: string, duration: number): Promise<boolean>
  
  // 升级告警
  escalateAlert(alertId: string, escalationLevel: number): Promise<boolean>
}

// 通知服务接口
interface NotificationService {
  // 发送通知
  sendNotification(notification: Notification): Promise<NotificationResult>
  
  // 批量发送通知
  sendBatchNotifications(notifications: Notification[]): Promise<NotificationResult[]>
  
  // 注册通知渠道
  registerChannel(channel: NotificationChannel): Promise<string>
  
  // 测试通知渠道
  testChannel(channelId: string): Promise<boolean>
}

// 数据类型定义
interface Metric {
  name: string
  value: number
  timestamp: Date
  tags: Record<string, string>
  labels: Record<string, string>
}

interface AlertRule {
  id?: string
  name: string
  description: string
  query: string
  condition: AlertCondition
  severity: 'critical' | 'warning' | 'info'
  enabled: boolean
  notifications: NotificationConfig[]
  suppressionRules?: SuppressionRule[]
  escalationRules?: EscalationRule[]
}

interface Alert {
  id: string
  ruleId: string
  ruleName: string
  severity: 'critical' | 'warning' | 'info'
  status: 'firing' | 'acknowledged' | 'resolved'
  message: string
  details: Record<string, any>
  triggeredAt: Date
  acknowledgedAt?: Date
  resolvedAt?: Date
  assignee?: string
}

interface NotificationChannel {
  id: string
  type: 'email' | 'slack' | 'webhook' | 'sms' | 'push'
  name: string
  config: Record<string, any>
  enabled: boolean
  testConfig?: Record<string, any>
}
```

### 2. 指标采集设计

#### 数据库指标采集器
```typescript
class DatabaseMetricsCollector {
  private readonly metricsConfig = {
    // 连接指标
    connections: {
      query: 'SHOW STATUS LIKE "Threads_connected"',
      interval: 30000, // 30秒
      tags: ['database', 'connections']
    },
    
    // 查询性能指标
    queryPerformance: {
      query: `
        SELECT 
          SCHEMA_NAME as database_name,
          SUM(COUNT_STAR) as total_queries,
          AVG(AVG_TIMER_WAIT/1000000000) as avg_query_time,
          MAX(MAX_TIMER_WAIT/1000000000) as max_query_time
        FROM performance_schema.events_statements_summary_by_digest 
        WHERE SCHEMA_NAME IS NOT NULL 
        GROUP BY SCHEMA_NAME
      `,
      interval: 60000, // 1分钟
      tags: ['database', 'performance']
    },
    
    // 锁等待指标
    lockWaits: {
      query: `
        SELECT 
          COUNT(*) as lock_waits,
          AVG(TIMER_WAIT/1000000000) as avg_wait_time
        FROM performance_schema.events_waits_current 
        WHERE EVENT_NAME LIKE '%lock%'
      `,
      interval: 30000,
      tags: ['database', 'locks']
    },
    
    // 缓存命中率
    cacheHitRate: {
      query: `
        SELECT 
          (Qcache_hits / (Qcache_hits + Qcache_inserts)) * 100 as hit_rate
        FROM (
          SELECT 
            VARIABLE_VALUE as Qcache_hits 
          FROM performance_schema.global_status 
          WHERE VARIABLE_NAME = 'Qcache_hits'
        ) hits,
        (
          SELECT 
            VARIABLE_VALUE as Qcache_inserts 
          FROM performance_schema.global_status 
          WHERE VARIABLE_NAME = 'Qcache_inserts'
        ) inserts
      `,
      interval: 60000,
      tags: ['database', 'cache']
    }
  }
  
  async collectMetrics(): Promise<Metric[]> {
    const metrics: Metric[] = []
    
    for (const [name, config] of Object.entries(this.metricsConfig)) {
      try {
        const result = await this.executeQuery(config.query)
        const metric = this.parseMetricResult(name, result, config.tags)
        metrics.push(metric)
      } catch (error) {
        console.error(`Failed to collect metric ${name}:`, error)
      }
    }
    
    return metrics
  }
}
```

#### 应用指标采集器
```typescript
class ApplicationMetricsCollector {
  private readonly metricsConfig = {
    // 迁移状态指标
    migrationStatus: {
      source: 'migration_service',
      metrics: ['migration_success_rate', 'migration_duration', 'migration_errors'],
      interval: 10000 // 10秒
    },
    
    // 备份状态指标
    backupStatus: {
      source: 'backup_service',
      metrics: ['backup_success_rate', 'backup_size', 'backup_duration'],
      interval: 30000 // 30秒
    },
    
    // API性能指标
    apiPerformance: {
      source: 'api_gateway',
      metrics: ['request_count', 'response_time', 'error_rate'],
      interval: 5000 // 5秒
    }
  }
  
  async collectMetrics(): Promise<Metric[]> {
    const metrics: Metric[] = []
    
    // 收集迁移指标
    const migrationMetrics = await this.collectMigrationMetrics()
    metrics.push(...migrationMetrics)
    
    // 收集备份指标
    const backupMetrics = await this.collectBackupMetrics()
    metrics.push(...backupMetrics)
    
    // 收集API指标
    const apiMetrics = await this.collectApiMetrics()
    metrics.push(...apiMetrics)
    
    return metrics
  }
  
  private async collectMigrationMetrics(): Promise<Metric[]> {
    // 从迁移服务获取指标
    const migrationService = await this.getMigrationService()
    const stats = await migrationService.getStatistics()
    
    return [
      {
        name: 'migration_success_rate',
        value: stats.successRate,
        timestamp: new Date(),
        tags: { service: 'migration', type: 'success_rate' },
        labels: { environment: process.env.NODE_ENV || 'development' }
      },
      {
        name: 'migration_duration',
        value: stats.averageDuration,
        timestamp: new Date(),
        tags: { service: 'migration', type: 'duration' },
        labels: { environment: process.env.NODE_ENV || 'development' }
      }
    ]
  }
}
```

### 3. 告警规则引擎

#### 规则定义
```typescript
class AlertRuleEngine {
  private rules: Map<string, AlertRule> = new Map()
  
  // 预定义告警规则
  private readonly defaultRules: AlertRule[] = [
    {
      id: 'migration_failure',
      name: '数据库迁移失败',
      description: '数据库迁移过程中出现失败',
      query: 'migration_success_rate < 0.95',
      condition: {
        operator: 'lt',
        threshold: 0.95,
        duration: '5m'
      },
      severity: 'critical',
      enabled: true,
      notifications: [
        { channelId: 'email_admin', immediate: true },
        { channelId: 'slack_dev', immediate: true },
        { channelId: 'webhook_oncall', immediate: false, delay: 300 }
      ]
    },
    
    {
      id: 'backup_failure',
      name: '数据库备份失败',
      description: '数据库备份过程失败或超时',
      query: 'backup_success_rate < 0.99 OR backup_duration > 600',
      condition: {
        operator: 'or',
        conditions: [
          { operator: 'lt', threshold: 0.99, field: 'backup_success_rate' },
          { operator: 'gt', threshold: 600, field: 'backup_duration' }
        ],
        duration: '2m'
      },
      severity: 'warning',
      enabled: true,
      notifications: [
        { channelId: 'email_admin', immediate: false, delay: 120 },
        { channelId: 'slack_ops', immediate: true }
      ]
    },
    
    {
      id: 'database_connections_high',
      name: '数据库连接数过高',
      description: '数据库连接数超过安全阈值',
      query: 'database_connections > 80',
      condition: {
        operator: 'gt',
        threshold: 80,
        duration: '3m'
      },
      severity: 'warning',
      enabled: true,
      notifications: [
        { channelId: 'slack_dev', immediate: true }
      ]
    },
    
    {
      id: 'disk_space_low',
      name: '磁盘空间不足',
      description: '备份存储磁盘空间不足',
      query: 'disk_usage_percent > 85',
      condition: {
        operator: 'gt',
        threshold: 85,
        duration: '1m'
      },
      severity: 'critical',
      enabled: true,
      notifications: [
        { channelId: 'email_admin', immediate: true },
        { channelId: 'slack_ops', immediate: true }
      ],
      escalationRules: [
        {
          level: 1,
          delay: 900, // 15分钟后升级
          notifications: [{ channelId: 'sms_oncall', immediate: true }]
        }
      ]
    },
    
    {
      id: 'query_performance_degraded',
      name: '查询性能下降',
      description: '数据库查询平均响应时间超过阈值',
      query: 'avg_query_time > 2.0',
      condition: {
        operator: 'gt',
        threshold: 2.0,
        duration: '5m'
      },
      severity: 'warning',
      enabled: true,
      notifications: [
        { channelId: 'slack_dev', immediate: true }
      ]
    }
  ]
  
  async evaluateRules(metrics: Metric[]): Promise<Alert[]> {
    const alerts: Alert[] = []
    
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue
      
      const isTriggered = await this.evaluateRule(rule, metrics)
      if (isTriggered) {
        const alert = this.createAlert(rule, metrics)
        alerts.push(alert)
      }
    }
    
    return alerts
  }
  
  private async evaluateRule(rule: AlertRule, metrics: Metric[]): Promise<boolean> {
    // 根据规则条件评估指标
    const relevantMetrics = metrics.filter(m => 
      rule.query.includes(m.name)
    )
    
    if (relevantMetrics.length === 0) return false
    
    // 简化的规则评估逻辑
    return this.evaluateCondition(rule.condition, relevantMetrics)
  }
  
  private evaluateCondition(condition: AlertCondition, metrics: Metric[]): boolean {
    // 实现条件评估逻辑
    // 这里简化处理，实际应该支持复杂的查询语法
    switch (condition.operator) {
      case 'gt':
        return metrics.some(m => m.value > condition.threshold)
      case 'lt':
        return metrics.some(m => m.value < condition.threshold)
      case 'eq':
        return metrics.some(m => m.value === condition.threshold)
      default:
        return false
    }
  }
}
```

### 4. 通知系统设计

#### 通知路由器
```typescript
class NotificationRouter {
  private channels: Map<string, NotificationChannel> = new Map()
  
  constructor() {
    this.initializeChannels()
  }
  
  private initializeChannels() {
    // 邮件通知渠道
    this.channels.set('email_admin', {
      id: 'email_admin',
      type: 'email',
      name: '管理员邮件',
      config: {
        recipients: ['admin@company.com', 'dba@company.com'],
        smtp: {
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        }
      },
      enabled: true
    })
    
    // Slack通知渠道
    this.channels.set('slack_dev', {
      id: 'slack_dev',
      type: 'slack',
      name: '开发团队Slack',
      config: {
        webhookUrl: process.env.SLACK_WEBHOOK_DEV,
        channel: '#database-alerts',
        username: 'ERP Monitor',
        iconEmoji: ':warning:'
      },
      enabled: true
    })
    
    // Webhook通知渠道
    this.channels.set('webhook_oncall', {
      id: 'webhook_oncall',
      type: 'webhook',
      name: '值班系统Webhook',
      config: {
        url: process.env.ONCALL_WEBHOOK_URL,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ONCALL_API_TOKEN}`
        }
      },
      enabled: true
    })
  }
  
  async sendNotification(alert: Alert, channelId: string): Promise<NotificationResult> {
    const channel = this.channels.get(channelId)
    if (!channel || !channel.enabled) {
      return {
        success: false,
        error: `Channel ${channelId} not found or disabled`
      }
    }
    
    try {
      switch (channel.type) {
        case 'email':
          return await this.sendEmailNotification(alert, channel)
        case 'slack':
          return await this.sendSlackNotification(alert, channel)
        case 'webhook':
          return await this.sendWebhookNotification(alert, channel)
        default:
          return {
            success: false,
            error: `Unsupported channel type: ${channel.type}`
          }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }
  
  private async sendEmailNotification(alert: Alert, channel: NotificationChannel): Promise<NotificationResult> {
    const nodemailer = require('nodemailer')
    const transporter = nodemailer.createTransporter(channel.config.smtp)
    
    const emailContent = this.formatEmailContent(alert)
    
    await transporter.sendMail({
      from: channel.config.smtp.auth.user,
      to: channel.config.recipients.join(','),
      subject: `[${alert.severity.toUpperCase()}] ${alert.ruleName}`,
      html: emailContent
    })
    
    return { success: true }
  }
  
  private async sendSlackNotification(alert: Alert, channel: NotificationChannel): Promise<NotificationResult> {
    const axios = require('axios')
    
    const slackMessage = this.formatSlackMessage(alert)
    
    await axios.post(channel.config.webhookUrl, {
      channel: channel.config.channel,
      username: channel.config.username,
      icon_emoji: channel.config.iconEmoji,
      attachments: [slackMessage]
    })
    
    return { success: true }
  }
  
  private formatSlackMessage(alert: Alert) {
    const color = {
      critical: 'danger',
      warning: 'warning',
      info: 'good'
    }[alert.severity] || 'warning'
    
    return {
      color,
      title: alert.ruleName,
      text: alert.message,
      fields: [
        {
          title: '严重程度',
          value: alert.severity.toUpperCase(),
          short: true
        },
        {
          title: '触发时间',
          value: alert.triggeredAt.toISOString(),
          short: true
        },
        {
          title: '告警ID',
          value: alert.id,
          short: true
        }
      ],
      footer: 'Easy ERP 监控系统',
      ts: Math.floor(alert.triggeredAt.getTime() / 1000)
    }
  }
}
```

## 📊 监控仪表板设计

### 1. 仪表板布局

```mermaid
graph TB
    subgraph "主仪表板"
        A1["系统状态概览"]
        A2["关键指标卡片"]
        A3["实时告警面板"]
        A4["性能趋势图表"]
    end
    
    subgraph "数据库监控仪表板"
        B1["连接状态"]
        B2["查询性能"]
        B3["锁等待情况"]
        B4["缓存命中率"]
        B5["存储使用情况"]
    end
    
    subgraph "迁移监控仪表板"
        C1["迁移任务状态"]
        C2["迁移进度跟踪"]
        C3["错误统计"]
        C4["性能指标"]
    end
    
    subgraph "备份监控仪表板"
        D1["备份任务状态"]
        D2["存储使用情况"]
        D3["备份性能"]
        D4["恢复测试结果"]
    end
    
    A1 --> B1
    A1 --> C1
    A1 --> D1
```

### 2. 关键指标卡片

```typescript
interface DashboardMetrics {
  // 系统健康度
  systemHealth: {
    overall: 'healthy' | 'warning' | 'critical'
    database: 'healthy' | 'warning' | 'critical'
    backup: 'healthy' | 'warning' | 'critical'
    migration: 'healthy' | 'warning' | 'critical'
  }
  
  // 关键性能指标
  kpi: {
    databaseUptime: number        // 数据库正常运行时间
    backupSuccessRate: number     // 备份成功率
    migrationSuccessRate: number  // 迁移成功率
    averageQueryTime: number      // 平均查询时间
    activeConnections: number     // 活跃连接数
    diskUsagePercent: number      // 磁盘使用率
  }
  
  // 告警统计
  alerts: {
    critical: number    // 严重告警数量
    warning: number     // 警告告警数量
    resolved24h: number // 24小时内解决的告警数量
  }
}
```

### 3. 图表组件设计

```typescript
// 性能趋势图表配置
const performanceChartConfig = {
  // 数据库连接数趋势
  connectionsTrend: {
    type: 'line',
    title: '数据库连接数趋势',
    metrics: ['database_connections'],
    timeRange: '24h',
    refreshInterval: 30000,
    yAxis: {
      min: 0,
      max: 100,
      unit: '个'
    },
    thresholds: [
      { value: 80, color: 'orange', label: '警告线' },
      { value: 95, color: 'red', label: '危险线' }
    ]
  },
  
  // 查询性能趋势
  queryPerformanceTrend: {
    type: 'area',
    title: '查询性能趋势',
    metrics: ['avg_query_time', 'max_query_time'],
    timeRange: '6h',
    refreshInterval: 60000,
    yAxis: {
      min: 0,
      unit: '秒'
    }
  },
  
  // 备份状态分布
  backupStatusDistribution: {
    type: 'pie',
    title: '备份状态分布',
    metrics: ['backup_success', 'backup_failure', 'backup_timeout'],
    timeRange: '7d',
    refreshInterval: 300000
  }
}
```

## 🔧 部署配置

### 1. 环境变量配置

```bash
# 监控系统配置
MONITORING_ENABLED=true
MONITORING_PORT=3001
MONITORING_HOST=0.0.0.0

# 时序数据库配置
INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=your_influxdb_token
INFLUXDB_ORG=easy-erp
INFLUXDB_BUCKET=monitoring

# 告警配置
ALERT_ENABLED=true
ALERT_EVALUATION_INTERVAL=30s
ALERT_NOTIFICATION_TIMEOUT=30s

# 邮件通知配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alerts@company.com
SMTP_PASS=your_smtp_password

# Slack通知配置
SLACK_WEBHOOK_DEV=https://hooks.slack.com/services/...
SLACK_WEBHOOK_OPS=https://hooks.slack.com/services/...

# Webhook通知配置
ONCALL_WEBHOOK_URL=https://oncall.company.com/api/alerts
ONCALL_API_TOKEN=your_oncall_token

# 数据保留配置
METRICS_RETENTION_DAYS=30
ALERT_HISTORY_RETENTION_DAYS=90
LOG_RETENTION_DAYS=7
```

### 2. Docker Compose 配置

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  # InfluxDB 时序数据库
  influxdb:
    image: influxdb:2.7
    container_name: easy-erp-influxdb
    ports:
      - "8086:8086"
    environment:
      - DOCKER_INFLUXDB_INIT_MODE=setup
      - DOCKER_INFLUXDB_INIT_USERNAME=admin
      - DOCKER_INFLUXDB_INIT_PASSWORD=admin123456
      - DOCKER_INFLUXDB_INIT_ORG=easy-erp
      - DOCKER_INFLUXDB_INIT_BUCKET=monitoring
    volumes:
      - influxdb_data:/var/lib/influxdb2
      - ./config/influxdb:/etc/influxdb2
    networks:
      - monitoring
  
  # Grafana 可视化
  grafana:
    image: grafana/grafana:10.2.0
    container_name: easy-erp-grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123456
      - GF_INSTALL_PLUGINS=grafana-clock-panel,grafana-simple-json-datasource
    volumes:
      - grafana_data:/var/lib/grafana
      - ./config/grafana/provisioning:/etc/grafana/provisioning
      - ./config/grafana/dashboards:/var/lib/grafana/dashboards
    networks:
      - monitoring
    depends_on:
      - influxdb
  
  # 监控服务
  monitoring-service:
    build:
      context: .
      dockerfile: Dockerfile.monitoring
    container_name: easy-erp-monitoring
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - INFLUXDB_URL=http://influxdb:8086
      - DATABASE_URL=mysql://user:password@mysql:3306/easy_erp
    volumes:
      - ./config/monitoring:/app/config
      - ./logs:/app/logs
    networks:
      - monitoring
      - app
    depends_on:
      - influxdb
      - mysql
  
  # Elasticsearch (日志存储)
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: easy-erp-elasticsearch
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    networks:
      - monitoring
  
  # Kibana (日志可视化)
  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    container_name: easy-erp-kibana
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    networks:
      - monitoring
    depends_on:
      - elasticsearch

volumes:
  influxdb_data:
  grafana_data:
  elasticsearch_data:

networks:
  monitoring:
    driver: bridge
  app:
    external: true
```

### 3. 监控服务启动脚本

```typescript
// src/monitoring/server.ts
import express from 'express'
import cors from 'cors'
import { MonitoringService } from './services/MonitoringService'
import { AlertService } from './services/AlertService'
import { NotificationService } from './services/NotificationService'
import { MetricsCollector } from './collectors/MetricsCollector'
import { DashboardController } from './controllers/DashboardController'
import { AlertController } from './controllers/AlertController'

class MonitoringServer {
  private app: express.Application
  private monitoringService: MonitoringService
  private alertService: AlertService
  private notificationService: NotificationService
  private metricsCollector: MetricsCollector
  
  constructor() {
    this.app = express()
    this.initializeServices()
    this.setupMiddleware()
    this.setupRoutes()
    this.startMetricsCollection()
  }
  
  private initializeServices() {
    this.monitoringService = new MonitoringService()
    this.alertService = new AlertService()
    this.notificationService = new NotificationService()
    this.metricsCollector = new MetricsCollector()
  }
  
  private setupMiddleware() {
    this.app.use(cors())
    this.app.use(express.json())
    this.app.use(express.static('public'))
  }
  
  private setupRoutes() {
    const dashboardController = new DashboardController(
      this.monitoringService
    )
    const alertController = new AlertController(
      this.alertService,
      this.notificationService
    )
    
    // 仪表板路由
    this.app.use('/api/dashboard', dashboardController.router)
    
    // 告警路由
    this.app.use('/api/alerts', alertController.router)
    
    // 健康检查
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() })
    })
  }
  
  private startMetricsCollection() {
    // 启动指标收集
    setInterval(async () => {
      try {
        const metrics = await this.metricsCollector.collectAll()
        await this.monitoringService.storeMetrics(metrics)
        
        // 评估告警规则
        const alerts = await this.alertService.evaluateAlerts(metrics)
        for (const alert of alerts) {
          await this.notificationService.sendAlert(alert)
        }
      } catch (error) {
        console.error('Metrics collection failed:', error)
      }
    }, 30000) // 每30秒收集一次
  }
  
  public start(port: number = 3001) {
    this.app.listen(port, () => {
      console.log(`Monitoring server started on port ${port}`)
    })
  }
}

// 启动监控服务
const server = new MonitoringServer()
server.start()
```

## 📋 运维手册

### 1. 日常运维检查

```bash
#!/bin/bash
# 监控系统健康检查脚本

echo "=== Easy ERP 监控系统健康检查 ==="
echo "检查时间: $(date)"
echo

# 检查监控服务状态
echo "1. 检查监控服务状态"
curl -s http://localhost:3001/health | jq .
echo

# 检查 InfluxDB 状态
echo "2. 检查 InfluxDB 状态"
curl -s http://localhost:8086/health | jq .
echo

# 检查 Grafana 状态
echo "3. 检查 Grafana 状态"
curl -s http://localhost:3000/api/health | jq .
echo

# 检查最近的告警
echo "4. 检查最近24小时告警"
curl -s "http://localhost:3001/api/alerts?since=24h" | jq '.[] | {id, severity, ruleName, status}'
echo

# 检查关键指标
echo "5. 检查关键指标"
curl -s "http://localhost:3001/api/dashboard/kpi" | jq .
echo

echo "=== 健康检查完成 ==="
```

### 2. 告警处理流程

#### 告警响应标准操作程序 (SOP)

1. **告警接收**
   - 通过邮件/Slack/短信接收告警通知
   - 记录告警接收时间
   - 确认告警严重程度

2. **初步评估**
   - 登录监控仪表板查看详细信息
   - 分析告警触发原因
   - 评估业务影响范围

3. **问题处理**
   - 根据告警类型执行相应处理步骤
   - 记录处理过程和结果
   - 必要时升级到高级工程师

4. **告警确认**
   - 问题解决后确认告警
   - 验证系统恢复正常
   - 更新告警状态

#### 常见告警处理指南

| 告警类型 | 处理步骤 | 预期恢复时间 |
|----------|----------|-------------|
| 数据库迁移失败 | 1. 检查迁移日志<br/>2. 验证数据库连接<br/>3. 重新执行迁移<br/>4. 验证数据一致性 | 15-30分钟 |
| 备份失败 | 1. 检查存储空间<br/>2. 验证备份权限<br/>3. 手动执行备份<br/>4. 更新备份配置 | 10-20分钟 |
| 磁盘空间不足 | 1. 清理过期备份<br/>2. 清理临时文件<br/>3. 扩展存储空间<br/>4. 调整清理策略 | 5-15分钟 |
| 查询性能下降 | 1. 检查慢查询日志<br/>2. 分析查询执行计划<br/>3. 优化索引<br/>4. 重启数据库连接池 | 20-60分钟 |

## ✅ 验收标准

### 功能验收
- [ ] 支持数据库、应用、系统三层指标监控
- [ ] 实现基于规则引擎的智能告警
- [ ] 支持邮件、Slack、Webhook等多种通知渠道
- [ ] 提供实时监控仪表板和告警管理界面
- [ ] 集成数据库迁移和备份监控

### 性能验收
- [ ] 指标收集延迟 ≤ 100ms
- [ ] 告警响应时间 ≤ 30秒
- [ ] 监控系统可用性 ≥ 99.9%
- [ ] 支持并发1000+指标收集
- [ ] 仪表板加载时间 ≤ 3秒

### 可靠性验收
- [ ] 告警误报率 ≤ 1%
- [ ] 告警漏报率 ≤ 0.1%
- [ ] 监控数据完整性 ≥ 99.9%
- [ ] 系统故障自动恢复
- [ ] 支持监控系统自监控

### 可用性验收
- [ ] 提供完整的部署文档和脚本
- [ ] 支持一键部署和配置
- [ ] 提供运维手册和故障处理指南
- [ ] 支持监控配置的热更新
- [ ] 提供API文档和SDK

---

**文档版本**: v1.0  
**创建时间**: 2025-01-22  
**依赖文档**: DESIGN_database_sync_optimization.md, BACKUP_RECOVERY_DESIGN.md  
**状态**: ✅ 监控告警系统设计完成，等待实施确认