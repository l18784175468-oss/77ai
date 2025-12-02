// MongoDB初始化脚本
// 创建应用数据库和用户

// 切换到应用数据库
db = db.getSiblingDB('77ai');

// 创建应用用户
db.createUser({
  user: '77ai_user',
  pwd: '77ai_password',
  roles: [
    {
      role: 'readWrite',
      db: '77ai'
    }
  ]
});

// 创建集合和索引
// 用户集合
db.createCollection('users');
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ createdAt: 1 });

// 聊天会话集合
db.createCollection('chatsessions');
db.chatsessions.createIndex({ userId: 1 });
db.chatsessions.createIndex({ createdAt: 1 });

// 聊天消息集合
db.createCollection('chatmessages');
db.chatmessages.createIndex({ sessionId: 1 });
db.chatmessages.createIndex({ userId: 1 });
db.chatmessages.createIndex({ createdAt: 1 });

// 图像生成集合
db.createCollection('imagegenerations');
db.imagegenerations.createIndex({ userId: 1 });
db.imagegenerations.createIndex({ createdAt: 1 });

// 订阅集合
db.createCollection('subscriptions');
db.subscriptions.createIndex({ userId: 1 }, { unique: true });
db.subscriptions.createIndex({ status: 1 });
db.subscriptions.createIndex({ currentPeriodEnd: 1 });

// 使用量统计集合
db.createCollection('usagestats');
db.usagestats.createIndex({ userId: 1 });
db.usagestats.createIndex({ date: 1 });

// API使用记录集合
db.createCollection('apiusages');
db.apiusages.createIndex({ userId: 1 });
db.apiusages.createIndex({ service: 1 });
db.apiusages.createIndex({ timestamp: 1 });

// 自定义AI服务集合
db.createCollection('customaiservices');
db.customaiservices.createIndex({ userId: 1 });
db.customaiservices.createIndex({ name: 1 });

// 系统配置集合
db.createCollection('systemconfigs');
db.systemconfigs.createIndex({ key: 1 }, { unique: true });

// 插入默认系统配置
db.systemconfigs.insertMany([
  {
    key: 'maintenance_mode',
    value: false,
    description: '系统维护模式',
    updatedAt: new Date()
  },
  {
    key: 'max_free_requests_per_day',
    value: 50,
    description: '免费用户每日最大请求数',
    updatedAt: new Date()
  },
  {
    key: 'max_free_images_per_day',
    value: 5,
    description: '免费用户每日最大图像生成数',
    updatedAt: new Date()
  }
]);

print('MongoDB初始化完成！');