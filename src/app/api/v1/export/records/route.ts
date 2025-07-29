// 标记为动态路由
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/v1/export/records - 获取导出记录列表
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ code: 401, msg: '未授权访问', data: null }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const operator = searchParams.get('operator');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const exportType = searchParams.get('exportType');

    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (operator) {
      where.operator = {
        contains: operator,
      };
    }
    
    if (exportType) {
      where.exportType = exportType;
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // 模拟导出记录数据（实际项目中应该从数据库查询）
    // 这里先返回模拟数据，后续可以根据实际需求调整
    const mockRecords = [
      {
        id: '1',
        fileName: '产品数据导出_20240101.xlsx',
        exportType: 'products',
        status: 'completed',
        fileSize: 1024000,
        downloadUrl: '/api/v1/export/download/1',
        operator: user.name,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      },
      {
        id: '2',
        fileName: '采购订单导出_20240101.xlsx',
        exportType: 'purchase-orders',
        status: 'processing',
        fileSize: null,
        downloadUrl: null,
        operator: user.name,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        completedAt: null,
      },
    ];

    // 应用筛选条件
    let filteredRecords = mockRecords;
    
    if (status) {
      filteredRecords = filteredRecords.filter(record => record.status === status);
    }
    
    if (exportType) {
      filteredRecords = filteredRecords.filter(record => record.exportType === exportType);
    }
    
    if (operator) {
      filteredRecords = filteredRecords.filter(record => 
        record.operator.includes(operator)
      );
    }

    const total = filteredRecords.length;
    const paginatedRecords = filteredRecords.slice(skip, skip + limit);

    return NextResponse.json({
      code: 200,
      msg: '获取成功',
      data: {
        list: paginatedRecords,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('获取导出记录列表失败:', error);
    return NextResponse.json(
      {
        code: 500,
        msg: '服务器内部错误',
        data: null,
      },
      { status: 500 }
    );
  }
}

// POST /api/v1/export/records - 创建导出任务
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ code: 401, msg: '未授权访问', data: null }, { status: 401 });
    }

    const body = await request.json();
    const { exportType, filters, fileName } = body;

    if (!exportType) {
      return NextResponse.json({ code: 400, msg: '导出类型不能为空' }, { status: 400 });
    }

    // 创建导出任务记录
    const exportRecord = {
      id: Date.now().toString(),
      fileName: fileName || `${exportType}_导出_${new Date().toISOString().split('T')[0]}.xlsx`,
      exportType,
      status: 'processing',
      fileSize: null,
      downloadUrl: null,
      operator: user.name,
      filters: filters || {},
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    // 这里应该启动后台导出任务
    // 实际实现中可以使用队列系统处理导出任务
    
    return NextResponse.json({
      code: 200,
      msg: '导出任务已创建',
      data: exportRecord,
    });
  } catch (error) {
    console.error('创建导出任务失败:', error);
    return NextResponse.json(
      {
        code: 500,
        msg: '服务器内部错误',
        data: null,
      },
      { status: 500 }
    );
  }
}